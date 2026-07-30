import { NextResponse, type NextRequest } from 'next/server';
import type { ZodTypeAny, z } from 'zod';
import { API_GATEWAY_URL, getAccessToken } from './auth';

export { API_GATEWAY_URL };

/**
 * Forwards a request to the API gateway with the staff bearer token taken from
 * the httpOnly cookie, so the browser never sees the JWT.
 */
export async function proxyJson(
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const token = getAccessToken();
  if (!token) {
    return NextResponse.json(
      { message: 'Your session has expired. Please sign in again.' },
      { status: 401 },
    );
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
      signal: init.signal ?? AbortSignal.timeout(15_000),
    });
    const body = await upstream.json().catch(() => ({}));
    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { message: 'The API gateway is unavailable. Try again shortly.' },
      { status: 502 },
    );
  }
}

/**
 * Validates the incoming JSON body against a shared Zod schema before
 * proxying it upstream as a POST.
 */
export async function proxyValidatedPost<Schema extends ZodTypeAny>(
  request: NextRequest,
  schema: Schema,
  path: string,
): Promise<NextResponse> {
  const raw: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw ?? {});

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed', errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data as z.infer<Schema>;
  return proxyJson(path, { method: 'POST', body: JSON.stringify(data) });
}
