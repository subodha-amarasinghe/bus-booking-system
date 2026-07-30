import type { SeatLock, SeatNo } from '@bus-booking/shared-types';
import { create } from 'zustand';

export interface BookingDraftState {
  tripId: string | null;
  selectedSeats: SeatNo[];
  lockTokens: Record<string, string>;
  expiresAt: Date | null;
  idempotencyKey: string;
  startTrip(tripId: string): void;
  selectSeat(seatNo: SeatNo): void;
  deselectSeat(seatNo: SeatNo): void;
  toggleSeat(seatNo: SeatNo): void;
  setLocks(locks: SeatLock[]): void;
  removeLocks(seatNos: SeatNo[]): void;
  reset(): void;
}

function createIdempotencyKey(): string {
  return `passenger-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

const initialDraft = () => ({
  tripId: null,
  selectedSeats: [] as SeatNo[],
  lockTokens: {} as Record<string, string>,
  expiresAt: null,
  idempotencyKey: createIdempotencyKey(),
});

export const useBookingDraftStore = create<BookingDraftState>((set) => ({
  ...initialDraft(),

  startTrip: (tripId) =>
    set((state) =>
      state.tripId === tripId ? state : { ...initialDraft(), tripId },
    ),

  selectSeat: (seatNo) =>
    set((state) =>
      state.selectedSeats.includes(seatNo)
        ? state
        : { selectedSeats: [...state.selectedSeats, seatNo] },
    ),

  deselectSeat: (seatNo) =>
    set((state) => ({
      selectedSeats: state.selectedSeats.filter((value) => value !== seatNo),
    })),

  toggleSeat: (seatNo) =>
    set((state) => ({
      selectedSeats: state.selectedSeats.includes(seatNo)
        ? state.selectedSeats.filter((value) => value !== seatNo)
        : [...state.selectedSeats, seatNo],
    })),

  setLocks: (locks) =>
    set((state) => {
      const lockTokens = { ...state.lockTokens };
      for (const lock of locks) {
        lockTokens[String(lock.seatNo)] = lock.lockToken;
      }
      const earliestExpiry = locks.reduce<number | null>(
        (earliest, lock) =>
          earliest === null
            ? lock.expiresAt.getTime()
            : Math.min(earliest, lock.expiresAt.getTime()),
        null,
      );
      return {
        lockTokens,
        expiresAt:
          earliestExpiry === null ? state.expiresAt : new Date(earliestExpiry),
      };
    }),

  removeLocks: (seatNos) =>
    set((state) => {
      const lockTokens = { ...state.lockTokens };
      for (const seatNo of seatNos) {
        delete lockTokens[String(seatNo)];
      }
      return {
        lockTokens,
        expiresAt:
          Object.keys(lockTokens).length === 0 ? null : state.expiresAt,
      };
    }),

  reset: () => initialDraft(),
}));
