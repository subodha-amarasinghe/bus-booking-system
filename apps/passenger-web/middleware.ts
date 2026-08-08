import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE = 'passenger_access_token';

/** Forwarded to authenticated layouts so expired sessions can preserve return URLs. */
const RETURN_TO_HEADER = 'x-return-to';

export function middleware(request: NextRequest) {
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (!request.cookies.has(ACCESS_COOKIE)) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', returnTo);
    return NextResponse.redirect(login);
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
