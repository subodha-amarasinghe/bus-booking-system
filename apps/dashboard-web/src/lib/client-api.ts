export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError('Network error — is the API gateway running?', 0);
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (body as { message?: string } | null)?.message ??
      (response.status === 401
        ? 'Your session has expired. Please sign in again.'
        : 'Something went wrong. Please try again.');
    throw new ApiError(message, response.status);
  }

  return body as T;
}

export function getJson<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export const queryKeys = {
  buses: ['buses'] as const,
  locations: ['locations'] as const,
  routes: ['routes'] as const,
  trips: (filters: unknown) => ['trips', filters] as const,
  cancellationPolicy: ['cancellation-policy'] as const,
};
