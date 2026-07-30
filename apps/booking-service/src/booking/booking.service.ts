import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import {
  BOOKING_CONFIRMED,
  SEAT_GET_LAYOUT_BY_BUS,
  TRIP_GET,
} from '@bus-booking/shared-events';
import { BookingStatus } from '@bus-booking/shared-types';
import type {
  Booking,
  ConfirmBookingRequest,
  ConfirmBookingResponse,
  LockSeatRequest,
  LockSeatResponse,
  MyBookingsResponse,
  ReleaseSeatsRequest,
  ReleaseSeatsResponse,
  SeatMapResponse,
  SeatMapSeat,
} from '@bus-booking/shared-types';
import type { Booking as BookingRow } from '../generated/prisma/client';
import { DomainException } from '../common/exceptions/domain.exception';
import { RedisService } from '../redis/redis.service';
import { RedisLockExpiryService } from '../redis/redis-lock-expiry.service';
import { SeatGateway } from '../seats/seat.gateway';
import { BookingRepository } from './booking.repository';

const LOCK_TTL_SECONDS = 240;
const IDEMPOTENCY_TTL_SECONDS = 86400;

/** Shape of the `trip.get` reply, narrowed to what the seat map needs. */
interface TripView {
  busId: string;
}

/** Shape of the `seat.getLayoutByBus` reply after JSON transport. */
interface SeatLayoutView {
  rows: number;
  columns: number;
  seats: Array<{
    seatNo: number;
    row: number;
    column: number;
    type?: SeatMapSeat['type'];
    isAvailable?: boolean;
  }>;
}

@Injectable()
export class BookingService {
  constructor(
    private readonly repo: BookingRepository,
    private readonly redis: RedisService,
    private readonly lockExpiry: RedisLockExpiryService,
    private readonly seatGateway: SeatGateway,
    @Inject('NOTIFICATION_SERVICE') private readonly notifications: ClientProxy,
    @Inject('BUS_SEAT_SERVICE') private readonly busSeat: ClientProxy,
  ) {}

  async lockSeat(dto: LockSeatRequest): Promise<LockSeatResponse> {
    const redisKey = this.lockKey(dto.tripId, dto.seatNo);
    const lockToken = randomUUID();
    const acquired = await this.redis.setNxEx(
      redisKey,
      lockToken,
      LOCK_TTL_SECONDS,
    );
    if (!acquired) {
      throw new DomainException('Seat already locked', 409, 'SEAT_LOCKED');
    }

    const expiresAt = new Date(Date.now() + LOCK_TTL_SECONDS * 1000);
    this.lockExpiry.track({
      tripId: dto.tripId,
      seatNo: dto.seatNo,
      lockToken,
      expiresAt: expiresAt.getTime(),
    });
    this.seatGateway.emitSeatLocked(dto.tripId, dto.seatNo, lockToken);

    return { lockToken, expiresAt };
  }

  async releaseSeats(dto: ReleaseSeatsRequest): Promise<ReleaseSeatsResponse> {
    const releasedSeatNos: number[] = [];

    for (const lock of dto.locks) {
      const redisKey = this.lockKey(dto.tripId, lock.seatNo);
      const currentToken = await this.redis.get(redisKey);
      // Only the holder of the lock may release it.
      if (currentToken !== lock.lockToken) {
        continue;
      }
      await this.redis.del(redisKey);
      this.lockExpiry.untrack(dto.tripId, lock.seatNo);
      this.seatGateway.emitSeatReleased(dto.tripId, lock.seatNo);
      releasedSeatNos.push(lock.seatNo);
    }

    return { tripId: dto.tripId, releasedSeatNos };
  }

  async myBookings(userId: string): Promise<MyBookingsResponse> {
    const bookings = await this.repo.findByUserId(userId);
    return bookings.map((booking) => this.toBooking(booking));
  }

  async getSeatMap(tripId: string): Promise<SeatMapResponse> {
    const trip = await firstValueFrom(
      this.busSeat.send<TripView | null>(TRIP_GET, { tripId }),
    );
    if (!trip) {
      throw new DomainException('Trip not found', 404, 'TRIP_NOT_FOUND');
    }

    const layout = await firstValueFrom(
      this.busSeat.send<SeatLayoutView | null>(SEAT_GET_LAYOUT_BY_BUS, {
        busId: trip.busId,
      }),
    );
    if (!layout) {
      throw new DomainException(
        'Seat layout not configured for this bus',
        404,
        'SEAT_LAYOUT_NOT_FOUND',
      );
    }

    const bookings = await this.repo.findConfirmedOrLockedByTrip(tripId);
    const bookedSeatNos = new Set(
      bookings
        .filter((booking) => booking.status === BookingStatus.CONFIRMED)
        .map((booking) => booking.seatNo),
    );
    // Redis is the authoritative lock store, so a persisted LOCKED row only
    // counts while its own expiry is still in the future.
    const dbLockExpiries = new Map(
      bookings
        .filter(
          (booking) =>
            booking.status === BookingStatus.LOCKED &&
            booking.lockExpiresAt !== null &&
            booking.lockExpiresAt.getTime() > Date.now(),
        )
        .map((booking) => [booking.seatNo, booking.lockExpiresAt as Date]),
    );

    const lockKeys = layout.seats.map((seat) =>
      this.lockKey(tripId, seat.seatNo),
    );
    const activeLocks = await this.redis.getManyWithTtl(lockKeys);

    const seats: SeatMapSeat[] = layout.seats.map((seat) => {
      const type = seat.type ?? 'STANDARD';
      const base = {
        seatNo: seat.seatNo,
        row: seat.row,
        column: seat.column,
        type,
      };

      if (type === 'DISABLED' || seat.isAvailable === false) {
        return { ...base, status: 'UNAVAILABLE' };
      }
      if (bookedSeatNos.has(seat.seatNo)) {
        return { ...base, status: 'BOOKED' };
      }

      const lock = activeLocks.get(this.lockKey(tripId, seat.seatNo));
      if (lock) {
        return {
          ...base,
          status: 'LOCKED',
          lockExpiresAt: new Date(Date.now() + lock.ttlMs),
        };
      }

      const dbLockExpiresAt = dbLockExpiries.get(seat.seatNo);
      if (dbLockExpiresAt) {
        return { ...base, status: 'LOCKED', lockExpiresAt: dbLockExpiresAt };
      }
      return { ...base, status: 'AVAILABLE' };
    });

    return {
      tripId,
      rows: layout.rows,
      columns: layout.columns,
      seats,
      updatedAt: new Date(),
    };
  }

  async confirm(dto: ConfirmBookingRequest): Promise<ConfirmBookingResponse> {
    const idemKey = `idempotency:booking:${dto.idempotencyKey}`;
    const existingBooking = await this.repo.findByIdempotencyKey(
      dto.idempotencyKey,
    );
    if (existingBooking) {
      return this.toConfirmResponse(existingBooking);
    }

    const claimed = await this.redis.setNxEx(
      idemKey,
      dto.idempotencyKey,
      IDEMPOTENCY_TTL_SECONDS,
    );
    if (!claimed) {
      const again = await this.repo.findByIdempotencyKey(dto.idempotencyKey);
      if (again) {
        return this.toConfirmResponse(again);
      }
      throw new DomainException(
        'Idempotent request in progress',
        409,
        'IDEMPOTENCY_CONFLICT',
      );
    }

    const redisKey = this.lockKey(dto.tripId, dto.seatNo);
    const currentToken = await this.redis.get(redisKey);
    if (!currentToken || currentToken !== dto.lockToken) {
      throw new DomainException('Invalid or expired lock', 409, 'LOCK_INVALID');
    }

    const fareAmount = 0;
    const confirmedAt = new Date();
    const booking = await this.repo.create({
      tripId: dto.tripId,
      userId: dto.userId,
      seatNo: dto.seatNo,
      status: BookingStatus.CONFIRMED,
      passengerName: dto.passengerName,
      passengerPhone: dto.passengerPhone,
      fareAmount,
      currency: 'LKR',
      lockToken: dto.lockToken,
      idempotencyKey: dto.idempotencyKey,
      confirmedAt,
    });

    await this.redis.del(redisKey);
    this.lockExpiry.untrack(dto.tripId, dto.seatNo);
    this.seatGateway.emitSeatBooked(dto.tripId, dto.seatNo, booking.id);

    this.notifications.emit(BOOKING_CONFIRMED, {
      event: BOOKING_CONFIRMED,
      bookingId: booking.id,
      tripId: booking.tripId,
      userId: booking.userId,
      seatNo: booking.seatNo,
      fareAmount: booking.fareAmount,
      currency: booking.currency,
      passengerName: booking.passengerName,
      passengerPhone: booking.passengerPhone,
      occurredAt: confirmedAt,
    });

    return this.toConfirmResponse(booking);
  }

  private lockKey(tripId: string, seatNo: number): string {
    return `lock:trip:${tripId}:seat:${seatNo}`;
  }

  private toBooking(booking: BookingRow): Booking {
    return {
      id: booking.id,
      tripId: booking.tripId,
      userId: booking.userId,
      seatNo: booking.seatNo,
      status: booking.status as Booking['status'],
      passengerName: booking.passengerName,
      passengerPhone: booking.passengerPhone,
      fareAmount: booking.fareAmount,
      currency: booking.currency,
      lockToken: booking.lockToken ?? undefined,
      lockExpiresAt: booking.lockExpiresAt ?? undefined,
      idempotencyKey: booking.idempotencyKey ?? undefined,
      confirmedAt: booking.confirmedAt ?? undefined,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  private toConfirmResponse(booking: {
    id: string;
    status: string;
    tripId: string;
    seatNo: number;
    passengerName: string;
    passengerPhone: string;
    fareAmount: number;
    currency: string;
    confirmedAt: Date | null;
  }): ConfirmBookingResponse {
    return {
      bookingId: booking.id,
      status: booking.status as ConfirmBookingResponse['status'],
      tripId: booking.tripId,
      seatNo: booking.seatNo,
      passengerName: booking.passengerName,
      passengerPhone: booking.passengerPhone,
      fareAmount: booking.fareAmount,
      currency: booking.currency,
      confirmedAt: booking.confirmedAt ?? new Date(),
    };
  }
}
