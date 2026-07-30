import { ListRoutesRequestSchema } from '@bus-booking/shared-types';
import { NextRequest, NextResponse } from 'next/server';
import { API_GATEWAY_URL } from '../../../../lib/route-proxy';

export async function POST(request: NextRequest) {
  const parsed = ListRoutesRequestSchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json({ message: 'Validation failed' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${API_GATEWAY_URL}/routes/list`, {
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
