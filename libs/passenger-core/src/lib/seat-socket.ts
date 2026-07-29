import {
  SEAT_SOCKET_BOOKED,
  SEAT_SOCKET_JOIN_TRIP,
  SEAT_SOCKET_LOCKED,
  SEAT_SOCKET_RELEASED,
  SeatSocketBookedSchema,
  SeatSocketLockedSchema,
  SeatSocketReleasedSchema,
  type SeatSocketBooked,
  type SeatSocketLocked,
  type SeatSocketReleased,
} from '@bus-booking/shared-events';

export interface SeatSocket {
  connected?: boolean;
  connect(): SeatSocket;
  disconnect(): SeatSocket;
  emit(event: string, payload: unknown): SeatSocket;
  on(event: string, handler: (...args: unknown[]) => void): SeatSocket;
  off(event: string, handler: (...args: unknown[]) => void): SeatSocket;
}

export interface SeatSocketFactoryOptions {
  readonly transports: readonly string[];
  readonly autoConnect: boolean;
  readonly reconnection: boolean;
  readonly auth?: Readonly<Record<string, string>>;
}

export type SeatSocketFactory = (
  url: string,
  options: SeatSocketFactoryOptions,
) => SeatSocket;

export interface SeatSocketHandlers {
  onConnected?: () => void;
  onDisconnected?: (reason?: string) => void;
  onError?: (error: unknown) => void;
  onSeatLocked?: (event: SeatSocketLocked) => void;
  onSeatReleased?: (event: SeatSocketReleased) => void;
  onSeatBooked?: (event: SeatSocketBooked) => void;
}

export interface ConnectSeatSocketOptions extends SeatSocketHandlers {
  readonly url: string;
  readonly tripId: string;
  readonly createSocket: SeatSocketFactory;
  readonly accessToken?: string | null;
  readonly initialReconnectDelayMs?: number;
  readonly maxReconnectDelayMs?: number;
}

export interface SeatSocketConnection {
  readonly socket: SeatSocket;
  disconnect(): void;
}

export function connectSeatSocket(
  options: ConnectSeatSocketOptions,
): SeatSocketConnection {
  const socket = options.createSocket(options.url, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: false,
    ...(options.accessToken
      ? { auth: { token: options.accessToken } }
      : {}),
  });
  const initialDelay = options.initialReconnectDelayMs ?? 500;
  const maxDelay = options.maxReconnectDelayMs ?? 10_000;
  let reconnectDelay = initialDelay;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const scheduleReconnect = () => {
    if (stopped || reconnectTimer) {
      return;
    }
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined;
      if (!stopped) {
        socket.connect();
      }
    }, reconnectDelay);
    reconnectDelay = Math.min(maxDelay, reconnectDelay * 2);
  };

  const onConnect = () => {
    reconnectDelay = initialDelay;
    socket.emit(SEAT_SOCKET_JOIN_TRIP, { tripId: options.tripId });
    options.onConnected?.();
  };
  const onDisconnect = (reason?: unknown) => {
    options.onDisconnected?.(
      typeof reason === 'string' ? reason : undefined,
    );
    scheduleReconnect();
  };
  const onConnectError = (error?: unknown) => {
    options.onError?.(error);
    scheduleReconnect();
  };
  const onLocked = (payload?: unknown) => {
    const event = SeatSocketLockedSchema.safeParse(payload);
    if (event.success && event.data.tripId === options.tripId) {
      options.onSeatLocked?.(event.data);
    }
  };
  const onReleased = (payload?: unknown) => {
    const event = SeatSocketReleasedSchema.safeParse(payload);
    if (event.success && event.data.tripId === options.tripId) {
      options.onSeatReleased?.(event.data);
    }
  };
  const onBooked = (payload?: unknown) => {
    const event = SeatSocketBookedSchema.safeParse(payload);
    if (event.success && event.data.tripId === options.tripId) {
      options.onSeatBooked?.(event.data);
    }
  };

  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);
  socket.on('connect_error', onConnectError);
  socket.on(SEAT_SOCKET_LOCKED, onLocked);
  socket.on(SEAT_SOCKET_RELEASED, onReleased);
  socket.on(SEAT_SOCKET_BOOKED, onBooked);
  socket.connect();

  return {
    socket,
    disconnect() {
      stopped = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off(SEAT_SOCKET_LOCKED, onLocked);
      socket.off(SEAT_SOCKET_RELEASED, onReleased);
      socket.off(SEAT_SOCKET_BOOKED, onBooked);
      socket.disconnect();
    },
  };
}
