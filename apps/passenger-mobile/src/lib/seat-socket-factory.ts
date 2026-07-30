import type { SeatSocketFactory } from '@bus-booking/passenger-core';
import { useQuery } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { gatewayRequest, WS_URL } from './gateway';

export const SEAT_SOCKET_URL = `${WS_URL}/seats`;

/**
 * `passenger-core` stays transport-agnostic, so each client supplies its own
 * socket. React Native has no long-polling fallback worth using, but keeping
 * the transports the core passes through avoids diverging from the web client.
 */
export const createSeatSocket: SeatSocketFactory = (url, options) =>
  io(url, {
    ...options,
    transports: [...options.transports] as ('websocket' | 'polling')[],
  });

/**
 * The gateway issues a short-lived JWT purely for the socket handshake, so the
 * long-lived access token never travels in a query string.
 */
export function useWsToken(enabled: boolean) {
  return useQuery({
    queryKey: ['ws-token'],
    queryFn: () =>
      gatewayRequest<{ token: string; expiresIn: number }>('/auth/ws-token'),
    enabled,
    // Tokens live ~5 minutes; refresh a little before that.
    staleTime: 4 * 60_000,
    retry: false,
  });
}
