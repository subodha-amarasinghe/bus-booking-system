import { cookies } from 'next/headers';

export const ACCESS_COOKIE = 'passenger_access_token';
export const REFRESH_COOKIE = 'passenger_refresh_token';

const API_GATEWAY_URL =
  process.env.API_GATEWAY_URL ?? 'http://localhost:3000/api';

export interface PassengerSession {
  userId: string;
  phone?: string;
}

export async function getPassengerSession(): Promise<PassengerSession | null> {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${API_GATEWAY_URL}/auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      userId?: string;
      sub?: string;
      phone?: string;
    };
    const userId = data.userId ?? data.sub;
    return userId ? { userId, phone: data.phone } : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | undefined {
  return cookies().get(ACCESS_COOKIE)?.value;
}
