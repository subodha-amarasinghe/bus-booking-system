import { NextResponse, type NextRequest } from 'next/server';
import { LoginRequestSchema } from '@bus-booking/shared-types';
import {
  ACCESS_COOKIE,
  API_GATEWAY_URL,
  validateStaffToken,
} from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  const raw: unknown = await request.json().catch(() => null);
  const parsed = LoginRequestSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Enter your phone number and password.' },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_GATEWAY_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { message: 'The API gateway is unavailable. Try again shortly.' },
      { status: 502 },
    );
  }

  const data = (await upstream.json().catch(() => ({}))) as {
    accessToken?: string;
    expiresIn?: number;
    userId?: string;
    message?: string;
  };

  if (!upstream.ok) {
    return NextResponse.json(
      { message: data.message ?? 'Phone number or password is incorrect.' },
      { status: upstream.status },
    );
  }
  if (!data.accessToken) {
    return NextResponse.json(
      { message: 'The sign-in response was missing an access token.' },
      { status: 502 },
    );
  }

  // Passengers have valid credentials but no business in the staff dashboard.
  const session = await validateStaffToken(data.accessToken);
  if (!session) {
    return NextResponse.json(
      {
        message:
          'This dashboard is for staff accounts only. Passengers should use the booking site.',
      },
      { status: 403 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    userId: session.userId,
    role: session.role,
  });
  response.cookies.set(ACCESS_COOKIE, data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: data.expiresIn ?? 60 * 60 * 8,
  });
  return response;
}
