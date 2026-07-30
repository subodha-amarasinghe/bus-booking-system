import {
  ConfirmBookingRequestSchema,
  ConfirmBookingResponseSchema,
  LockSeatRequestSchema,
  LockSeatResponseSchema,
  LockSeatsRequestSchema,
  LockSeatsResponseSchema,
  ListRoutesRequestSchema,
  MyBookingsResponseSchema,
  ReleaseSeatsRequestSchema,
  ReleaseSeatsResponseSchema,
  SearchTripsRequestSchema,
  SeatMapResponseSchema,
  RouteSchema,
  TripSchema,
  type Booking,
  type ConfirmBookingRequest,
  type ConfirmBookingResponse,
  type LockSeatsRequest,
  type LockSeatsResponse,
  type Route,
  type MyBookingsResponse,
  type ReleaseSeatsRequest,
  type ReleaseSeatsResponse,
  type SearchTripsRequest,
  type SeatMapResponse,
  type Trip,
} from '@bus-booking/shared-types';
import { z } from 'zod';

export interface PassengerFetchResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

export interface PassengerFetchInit {
  readonly method: 'GET' | 'POST';
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
}

export type PassengerFetch = (
  url: string,
  init: PassengerFetchInit,
) => Promise<PassengerFetchResponse>;

export interface PassengerApiPaths {
  readonly tripSearch: string;
  readonly seatMap: (tripId: string) => string;
  readonly myBookings: string;
  readonly lockSeat: string;
  readonly releaseSeats: string;
  readonly confirmBooking: string;
  readonly routeList: string;
}

export interface CreatePassengerApiOptions {
  readonly baseUrl: string;
  readonly fetch: PassengerFetch;
  readonly getAccessToken?: () => Promise<string | null>;
  readonly paths?: Partial<PassengerApiPaths>;
}

export interface PassengerApi {
  searchTrips(input: SearchTripsRequest): Promise<Trip[]>;
  getSeatMap(tripId: string): Promise<SeatMapResponse>;
  getMyBookings(): Promise<MyBookingsResponse>;
  lockSeats(input: LockSeatsRequest): Promise<LockSeatsResponse>;
  releaseSeats(input: ReleaseSeatsRequest): Promise<ReleaseSeatsResponse>;
  confirmBooking(input: ConfirmBookingRequest): Promise<ConfirmBookingResponse>;
  getRoute(routeId: string): Promise<Route | null>;
}

export class PassengerApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'PassengerApiError';
  }
}

const DEFAULT_PATHS: PassengerApiPaths = {
  tripSearch: '/trips/search',
  seatMap: (tripId) => `/trips/${encodeURIComponent(tripId)}/seats`,
  myBookings: '/bookings/me',
  lockSeat: '/bookings/lock-seat',
  releaseSeats: '/bookings/release-seat',
  confirmBooking: '/bookings/confirm',
  routeList: '/routes/list',
};

const TripsResponseSchema = z.array(TripSchema);
const RoutesResponseSchema = z.array(RouteSchema);

export function createPassengerApi(
  options: CreatePassengerApiOptions,
): PassengerApi {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const paths = { ...DEFAULT_PATHS, ...options.paths };

  async function request<TSchema extends z.ZodTypeAny>(
    path: string,
    schema: TSchema,
    method: 'GET' | 'POST',
    body?: unknown,
  ): Promise<z.infer<TSchema>> {
    const token = await options.getAccessToken?.();
    const response = await options.fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const responseBody = await response.json();
    if (!response.ok) {
      const message =
        typeof responseBody === 'object' &&
        responseBody !== null &&
        'message' in responseBody &&
        typeof responseBody.message === 'string'
          ? responseBody.message
          : `Passenger API request failed (${response.status})`;
      throw new PassengerApiError(message, response.status, responseBody);
    }
    return schema.parse(responseBody);
  }

  return {
    async searchTrips(input) {
      const payload = SearchTripsRequestSchema.parse(input);
      return request(paths.tripSearch, TripsResponseSchema, 'POST', payload);
    },

    async getSeatMap(tripId) {
      const parsedTripId = z.string().uuid().parse(tripId);
      return request(paths.seatMap(parsedTripId), SeatMapResponseSchema, 'GET');
    },

    async getMyBookings() {
      return request(paths.myBookings, MyBookingsResponseSchema, 'GET');
    },

    async getRoute(routeId) {
      const payload = ListRoutesRequestSchema.parse({ limit: 100 });
      const routes = await request(
        paths.routeList,
        RoutesResponseSchema,
        'POST',
        payload,
      );
      return routes.find((route) => route.id === routeId) ?? null;
    },

    async lockSeats(input) {
      const payload = LockSeatsRequestSchema.parse(input);
      const locks = await Promise.all(
        payload.seatNos.map(async (seatNo) => {
          const single = LockSeatRequestSchema.parse({
            tripId: payload.tripId,
            seatNo,
            userId: payload.userId,
          });
          const response = await request(
            paths.lockSeat,
            LockSeatResponseSchema,
            'POST',
            single,
          );
          return { seatNo, ...response };
        }),
      );
      return LockSeatsResponseSchema.parse({ tripId: payload.tripId, locks });
    },

    async releaseSeats(input) {
      const payload = ReleaseSeatsRequestSchema.parse(input);
      return request(
        paths.releaseSeats,
        ReleaseSeatsResponseSchema,
        'POST',
        payload,
      );
    },

    async confirmBooking(input) {
      const payload = ConfirmBookingRequestSchema.parse(input);
      return request(
        paths.confirmBooking,
        ConfirmBookingResponseSchema,
        'POST',
        payload,
      );
    },
  };
}

// Preserve these shared contract types on the public API surface.
export type {
  Booking,
  ConfirmBookingRequest,
  ConfirmBookingResponse,
  LockSeatsRequest,
  LockSeatsResponse,
  MyBookingsResponse,
  ReleaseSeatsRequest,
  ReleaseSeatsResponse,
  Route,
  SearchTripsRequest,
  SeatMapResponse,
  Trip,
};
