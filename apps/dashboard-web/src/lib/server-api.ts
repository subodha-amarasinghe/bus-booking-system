import { API_GATEWAY_URL, getAccessToken } from './auth';

/**
 * Server-component fetch for read-only summaries. Returns `null` instead of
 * throwing so a single unavailable service cannot blank the whole dashboard.
 */
export async function serverPost<T>(
  path: string,
  body: unknown = {},
): Promise<T | null> {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_GATEWAY_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
