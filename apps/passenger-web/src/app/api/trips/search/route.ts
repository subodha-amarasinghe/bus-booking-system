import { SearchTripsRequestSchema } from '@bus-booking/shared-types';
import { NextRequest, NextResponse } from 'next/server';
import { API_GATEWAY_URL } from '../../../../lib/route-proxy';

export async function POST(request: NextRequest) {
  const parsed = SearchTripsRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed', errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${API_GATEWAY_URL}/trips/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    });
    return NextResponse.json(await upstream.json().catch(() => ([])), {
      status: upstream.status,
    });
  } catch {
    return NextResponse.json(
      { message: 'API gateway is unavailable' },
      { status: 502 },
    );
  }
}
