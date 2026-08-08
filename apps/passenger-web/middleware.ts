import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE = 'passenger_access_token';
const RETURN_TO_COOKIE = 'passenger_return_to';

/** Forwarded to authenticated layouts so expired sessions can preserve return URLs. */
const RETURN_TO_HEADER = 'x-return-to';

const RETURN_TO_MAX_AGE_SECONDS = 60 * 15;

export function middleware(request: NextRequest) {
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (!request.cookies.has(ACCESS_COOKIE)) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', returnTo);
    const response = NextResponse.redirect(login);
    // Cookie backup: client-side redirects sometimes drop `?next=` with nested queries.
    response.cookies.set(RETURN_TO_COOKIE, returnTo, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: RETURN_TO_MAX_AGE_SECONDS,
    });
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(RETURN_TO_HEADER, returnTo);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/trips/:path*', '/payment/:path*', '/bookings/:path*', '/profile'],
};
