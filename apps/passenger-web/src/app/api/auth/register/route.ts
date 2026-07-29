import { RegisterRequestSchema } from '@bus-booking/shared-types';
import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../../../../lib/auth';
import { API_GATEWAY_URL } from '../../../../lib/route-proxy';

export async function POST(request: NextRequest) {
  const parsed = RegisterRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed', errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${API_GATEWAY_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok || !data.accessToken || !data.refreshToken) {
    return NextResponse.json(
      { message: data.message ?? 'Registration failed' },
      { status: upstream.ok ? 502 : upstream.status },
    );
  }

  const response = NextResponse.json({ ok: true, userId: data.userId });
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  response.cookies.set(ACCESS_COOKIE, data.accessToken, {
    ...options,
    maxAge: data.expiresIn ?? 28_800,
  });
  response.cookies.set(REFRESH_COOKIE, data.refreshToken, {
    ...options,
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
