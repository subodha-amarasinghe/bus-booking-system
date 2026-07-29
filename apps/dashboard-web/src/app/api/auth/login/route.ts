import { NextRequest, NextResponse } from 'next/server';
import { LoginRequestSchema } from '@bus-booking/shared-types';

const GATEWAY_URL =
  process.env.API_GATEWAY_URL ?? 'http://localhost:3000/api';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = LoginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed', errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const upstream = await fetch(`${GATEWAY_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Login failed' },
      { status: upstream.status }
    );
  }

  const accessToken: string | undefined =
    data?.accessToken ?? data?.access_token;

  if (!accessToken) {
    return NextResponse.json(
      { message: 'Upstream response missing access token' },
      { status: 502 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    userId: data?.userId,
  });

  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: data?.expiresIn ?? 60 * 60 * 8,
  });

  return response;
}
