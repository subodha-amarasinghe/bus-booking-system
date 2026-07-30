/**
 * Kept separate from `lib/auth.ts` so the edge middleware can read the cookie
 * name without bundling `next/headers` and the server-only session helpers.
 */
export const ACCESS_COOKIE = 'access_token';
