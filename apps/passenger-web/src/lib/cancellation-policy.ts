import type { CancellationPolicy } from '@bus-booking/shared-types';
import { API_GATEWAY_URL } from './route-proxy';

export async function getCancellationPolicy(): Promise<CancellationPolicy | null> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}/cancellations/policy/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as CancellationPolicy | null;
    return body;
  } catch {
    return null;
  }
}
