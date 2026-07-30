import { getAccessToken } from './secure-token';

export const GATEWAY_URL = (
  process.env.EXPO_PUBLIC_API_GATEWAY_URL ?? 'http://localhost:3000/api'
).replace(/\/+$/, '');

export const WS_URL = (
  process.env.EXPO_PUBLIC_BOOKING_WS_URL ?? 'http://localhost:3020'
).replace(/\/+$/, '');

export class GatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

interface GatewayRequestOptions {
  readonly method?: 'GET' | 'POST';
  readonly body?: unknown;
  /** Attach the stored bearer token. Public endpoints pass `false`. */
  readonly auth?: boolean;
}

/**
 * Thin gateway client for the endpoints `passenger-core` does not cover
 * (locations, profile, payments, cancellations, auth). Everything in the
 * booking flow itself goes through `passengerApi` instead.
 */
export async function gatewayRequest<T>(
  path: string,
  options: GatewayRequestOptions = {},
): Promise<T> {
  const { method = 'POST', body, auth = true } = options;
  const token = auth ? await getAccessToken() : null;

  let response: Response;
  try {
    response = await fetch(`${GATEWAY_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new GatewayError(
      'Cannot reach the booking service. Check your connection.',
      0,
    );
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : `Request failed (${response.status})`;
    throw new GatewayError(message, response.status);
  }

  return payload as T;
}
