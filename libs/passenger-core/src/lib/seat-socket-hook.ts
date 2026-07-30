import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  SeatAvailability,
  SeatMapResponse,
} from '@bus-booking/shared-types';
import { passengerQueryKeys } from './query-hooks';
import {
  connectSeatSocket,
  type SeatSocketFactory,
  type SeatSocketHandlers,
} from './seat-socket';

export type SeatSocketStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface UseSeatMapSocketOptions extends SeatSocketHandlers {
  readonly url: string;
  readonly tripId: string | null | undefined;
  readonly createSocket: SeatSocketFactory;
  readonly accessToken?: string | null;
}

export function useSeatMapSocket(
  options: UseSeatMapSocketOptions,
): SeatSocketStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SeatSocketStatus>('connecting');

  useEffect(() => {
    if (!options.tripId) {
      setStatus('disconnected');
      return;
    }
    const tripId = options.tripId;

    const updateSeat = (
      seatNo: number,
      seatStatus: SeatAvailability,
    ) => {
      queryClient.setQueryData<SeatMapResponse>(
        passengerQueryKeys.seatMap(tripId),
        (current) =>
          current
            ? {
                ...current,
                updatedAt: new Date(),
                seats: current.seats.map((seat) =>
                  seat.seatNo === seatNo
                    ? { ...seat, status: seatStatus }
                    : seat,
                ),
              }
            : current,
      );
    };

    setStatus('connecting');
    const connection = connectSeatSocket({
      url: options.url,
      tripId,
      createSocket: options.createSocket,
      accessToken: options.accessToken,
      onConnected: () => {
        setStatus('connected');
        options.onConnected?.();
      },
      onDisconnected: (reason) => {
        setStatus('disconnected');
        options.onDisconnected?.(reason);
      },
      onError: (error) => {
        setStatus('error');
        options.onError?.(error);
      },
      onSeatLocked: (event) => {
        updateSeat(event.seatNo, 'LOCKED');
        options.onSeatLocked?.(event);
      },
      onSeatReleased: (event) => {
        updateSeat(event.seatNo, 'AVAILABLE');
        options.onSeatReleased?.(event);
      },
      onSeatBooked: (event) => {
        updateSeat(event.seatNo, 'BOOKED');
        options.onSeatBooked?.(event);
      },
    });

    return () => connection.disconnect();
  }, [
    options.accessToken,
    options.createSocket,
    options.onConnected,
    options.onDisconnected,
    options.onError,
    options.onSeatBooked,
    options.onSeatLocked,
    options.onSeatReleased,
    options.tripId,
    options.url,
    queryClient,
  ]);

  return status;
}
