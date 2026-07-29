import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SeatGateway } from '../seats/seat.gateway';

export interface ActiveLock {
  tripId: string;
  seatNo: string;
  lockToken: string;
  expiresAt: number;
}

@Injectable()
export class RedisLockExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisLockExpiryService.name);
  private readonly activeLocks = new Map<string, ActiveLock>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly seatGateway: SeatGateway) {}

  onModuleInit(): void {
    this.timer = setInterval(() => this.checkExpired(), 10_000);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  track(lock: ActiveLock): void {
    const key = this.lockKey(lock.tripId, lock.seatNo);
    this.activeLocks.set(key, lock);
  }

  untrack(tripId: string, seatNo: string): void {
    this.activeLocks.delete(this.lockKey(tripId, seatNo));
  }

  private lockKey(tripId: string, seatNo: string): string {
    return `lock:trip:${tripId}:seat:${seatNo}`;
  }

  private checkExpired(): void {
    const now = Date.now();
    for (const [key, lock] of this.activeLocks.entries()) {
      if (lock.expiresAt <= now) {
        this.activeLocks.delete(key);
        this.logger.debug(`Lock expired: ${key}`);
        this.seatGateway.emitSeatReleased(lock.tripId, lock.seatNo);
      }
    }
  }
}
