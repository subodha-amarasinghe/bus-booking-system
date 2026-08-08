import { NextResponse } from 'next/server';
import { API_GATEWAY_URL } from '../../../../lib/route-proxy';

/** Public — no passenger session required. */
export async function GET() {
  try {
    const upstream = await fetch(`${API_GATEWAY_URL}/cancellations/policy/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
    });
    return NextResponse.json(await upstream.json().catch(() => null), {
      status: upstream.status,
    });
  } catch {
    return NextResponse.json(
      { message: 'API gateway is unavailable' },
      { status: 502 },
    );
  }
}
