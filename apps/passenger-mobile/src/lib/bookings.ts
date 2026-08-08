import type { Payment } from '@bus-booking/shared-types';
import { passengerQueryKeys } from '@bus-booking/passenger-core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gatewayRequest } from './gateway';

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      bookingId: string;
      userId: string;
      reason?: string;
    }) =>
      gatewayRequest<unknown>('/cancellations/request', {
        body: {
          bookingId: input.bookingId,
          userId: input.userId,
          reason: input.reason ?? 'Cancelled by passenger',
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: passengerQueryKeys.myBookings(),
      });
    },
  });
}

export function usePayOnline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      bookingId: string;
      userId: string;
      amount: number;
      currency: string;
      returnUrl?: string;
      cancelUrl?: string;
    }) =>
      gatewayRequest<Payment & { checkoutUrl?: string }>('/payments/online', {
        body: input,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: passengerQueryKeys.myBookings(),
      });
    },
  });
}
