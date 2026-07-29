import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE = 'passenger_access_token';

export function middleware(request: NextRequest) {
  if (!request.cookies.has(ACCESS_COOKIE)) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/trips/:path*', '/payment/:path*', '/bookings/:path*', '/profile'],
};
