import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE } from './lib/cookies';

/**
 * Cheap cookie presence check only — the token itself is validated against the
 * gateway in the dashboard layout, which the middleware runtime cannot do.
 */
export function middleware(request: NextRequest) {
  if (request.cookies.get(ACCESS_COOKIE)?.value) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set(
    'next',
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
