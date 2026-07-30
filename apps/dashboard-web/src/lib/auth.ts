import { cache } from 'react';
import { cookies } from 'next/headers';
import type { User } from '@bus-booking/shared-types';
import { isStaffRole, type StaffSession } from './roles';
import { ACCESS_COOKIE } from './cookies';

export { ACCESS_COOKIE };

export const API_GATEWAY_URL =
  process.env.API_GATEWAY_URL ?? 'http://localhost:3000/api';

export type { StaffRole, StaffSession } from './roles';

/** Keeps a wedged gateway from holding a page render open indefinitely. */
const UPSTREAM_TIMEOUT_MS = 8_000;

export function getAccessToken(): string | undefined {
  return cookies().get(ACCESS_COOKIE)?.value;
}

/**
 * Exchanges a raw access token for a staff session. Used both by
 * `getStaffSession` and by the login route, which holds a token before any
 * cookie has been written. Passengers are rejected — this app is staff-only.
 */
export async function validateStaffToken(
  token: string,
): Promise<StaffSession | null> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}/auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      valid?: boolean;
      userId?: string;
      sub?: string;
      role?: string;
      phone?: string;
    };

    const userId = data.userId ?? data.sub;
    if (data.valid === false || !userId || !isStaffRole(data.role)) {
      return null;
    }
    return { userId, role: data.role, phone: data.phone };
  } catch {
    return null;
  }
}

export const getStaffSession = cache(async (): Promise<StaffSession | null> => {
  const token = getAccessToken();
  return token ? validateStaffToken(token) : null;
});

/** Best-effort display details; the dashboard still works without them. */
export const getStaffProfile = cache(async (): Promise<User | null> => {
  const token = getAccessToken();
  const session = await getStaffSession();
  if (!token || !session) return null;

  try {
    const response = await fetch(`${API_GATEWAY_URL}/users/profile/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: session.userId }),
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return (await response.json()) as User;
  } catch {
    return null;
  }
});
