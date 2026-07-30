import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConfirmBookingResponse } from '@bus-booking/shared-types';
import type { PassengerApi, SearchTripsRequest } from './api';
import { useBookingDraftStore } from './booking-draft-store';

export const passengerQueryKeys = {
  trips: (input: SearchTripsRequest) => ['passenger', 'trips', input] as const,
  seatMap: (tripId: string) => ['passenger', 'seat-map', tripId] as const,
  myBookings: () => ['passenger', 'my-bookings'] as const,
};

export function useTripSearch(api: PassengerApi, input: SearchTripsRequest) {
  return useQuery({
    queryKey: passengerQueryKeys.trips(input),
    queryFn: () => api.searchTrips(input),
  });
}

export function useSeatMap(
  api: PassengerApi,
  tripId: string | null | undefined,
) {
  return useQuery({
    queryKey: passengerQueryKeys.seatMap(tripId ?? ''),
    queryFn: () => api.getSeatMap(tripId as string),
    enabled: Boolean(tripId),
  });
}

export function useMyBookings(api: PassengerApi) {
  return useQuery({
    queryKey: passengerQueryKeys.myBookings(),
    queryFn: () => api.getMyBookings(),
  });
}

export interface LockDraftSeatsInput {
  userId: string;
}

export interface ConfirmDraftInput {
  userId: string;
  passengerName: string;
  passengerPhone: string;
}

export function useBookingDraft(api: PassengerApi) {
  const queryClient = useQueryClient();
  const draft = useBookingDraftStore();

  const lockMutation = useMutation({
    mutationFn: ({ userId }: LockDraftSeatsInput) => {
      if (!draft.tripId || draft.selectedSeats.length === 0) {
        throw new Error('Select at least one seat before locking');
      }
      return api.lockSeats({
        tripId: draft.tripId,
        seatNos: draft.selectedSeats,
        userId,
      });
    },
    onSuccess: (response) => {
      draft.setLocks(response.locks);
      void queryClient.invalidateQueries({
        queryKey: passengerQueryKeys.seatMap(response.tripId),
      });
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async () => {
      if (!draft.tripId) {
        throw new Error('No trip selected');
      }
      const locks = Object.entries(draft.lockTokens).map(
        ([seatNo, lockToken]) => ({ seatNo: Number(seatNo), lockToken }),
      );
      if (locks.length === 0) {
        return { tripId: draft.tripId, releasedSeatNos: [] };
      }
      return api.releaseSeats({ tripId: draft.tripId, locks });
    },
    onSuccess: (response) => {
      draft.removeLocks(response.releasedSeatNos);
      void queryClient.invalidateQueries({
        queryKey: passengerQueryKeys.seatMap(response.tripId),
      });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async ({
      userId,
      passengerName,
      passengerPhone,
    }: ConfirmDraftInput): Promise<ConfirmBookingResponse[]> => {
      if (!draft.tripId || draft.selectedSeats.length === 0) {
        throw new Error('No seats selected');
      }
      return Promise.all(
        draft.selectedSeats.map((seatNo, index) => {
          const lockToken = draft.lockTokens[String(seatNo)];
          if (!lockToken) {
            throw new Error(`Seat ${seatNo} is not locked`);
          }
          return api.confirmBooking({
            tripId: draft.tripId as string,
            seatNo,
            userId,
            lockToken,
            idempotencyKey: `${draft.idempotencyKey}:${index}`,
            passengerName,
            passengerPhone,
          });
        }),
      );
    },
    onSuccess: (_, input) => {
      const tripId = draft.tripId;
      draft.reset();
      if (tripId) {
        void queryClient.invalidateQueries({
          queryKey: passengerQueryKeys.seatMap(tripId),
        });
      }
      void queryClient.invalidateQueries({
        queryKey: passengerQueryKeys.myBookings(),
      });
      void input;
    },
  });

  return {
    ...draft,
    lockSeats: lockMutation.mutateAsync,
    releaseSeats: releaseMutation.mutateAsync,
    confirm: confirmMutation.mutateAsync,
    lockMutation,
    releaseMutation,
    confirmMutation,
  };
}
