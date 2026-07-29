import { NextResponse } from 'next/server';
import { getAccessToken } from './auth';

export const API_GATEWAY_URL =
  process.env.API_GATEWAY_URL ?? 'http://localhost:3000/api';

export async function proxyJson(
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const token = getAccessToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const upstream = await fetch(`${API_GATEWAY_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
      cache: 'no-store',
    });
    const body = await upstream.json().catch(() => ({}));
    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { message: 'API gateway is unavailable' },
      { status: 502 },
    );
  }
}
