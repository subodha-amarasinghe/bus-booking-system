import { ListLocationsRequestSchema } from '@bus-booking/shared-types';
import { NextRequest, NextResponse } from 'next/server';
import { API_GATEWAY_URL } from '../../../../../lib/route-proxy';

/**
 * Public passthrough: the gateway leaves `routes/locations/list` unguarded so
 * the landing page can populate its selects before anyone signs in.
 */
export async function POST(request: NextRequest) {
  const parsed = ListLocationsRequestSchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed', errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${API_GATEWAY_URL}/routes/locations/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    });
    return NextResponse.json(await upstream.json().catch(() => []), {
      status: upstream.status,
    });
  } catch {
    return NextResponse.json(
      { message: 'API gateway is unavailable' },
      { status: 502 },
    );
  }
}
