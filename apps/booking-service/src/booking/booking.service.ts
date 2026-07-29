import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { BOOKING_CONFIRMED } from '@bus-booking/shared-events';
import { BookingStatus } from '@bus-booking/shared-types';
import type {
  ConfirmBookingRequest,
  ConfirmBookingResponse,
  LockSeatRequest,
  LockSeatResponse,
} from '@bus-booking/shared-types';
import { DomainException } from '../common/exceptions/domain.exception';
import { RedisService } from '../redis/redis.service';
import { RedisLockExpiryService } from '../redis/redis-lock-expiry.service';
import { SeatGateway } from '../seats/seat.gateway';
import { BookingRepository } from './booking.repository';

const LOCK_TTL_SECONDS = 240;
const IDEMPOTENCY_TTL_SECONDS = 86400;

@Injectable()
export class BookingService {
  constructor(
    private readonly repo: BookingRepository,
    private readonly redis: RedisService,
    private readonly lockExpiry: RedisLockExpiryService,
    private readonly seatGateway: SeatGateway,
    @Inject('NOTIFICATION_SERVICE') private readonly notifications: ClientProxy,
  ) {}

  async lockSeat(dto: LockSeatRequest): Promise<LockSeatResponse> {
    const redisKey = `lock:trip:${dto.tripId}:seat:${dto.seatNo}`;
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

    const redisKey = `lock:trip:${dto.tripId}:seat:${dto.seatNo}`;
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

  private toConfirmResponse(booking: {
    id: string;
    status: string;
    tripId: string;
    seatNo: string;
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
