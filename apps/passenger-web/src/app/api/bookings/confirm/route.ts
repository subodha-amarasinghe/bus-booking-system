import { ConfirmBookingRequestSchema } from '@bus-booking/shared-types';
import { NextRequest, NextResponse } from 'next/server';
import { proxyJson } from '../../../../lib/route-proxy';

export async function POST(request: NextRequest) {
  const parsed = ConfirmBookingRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Validation failed', errors: parsed.error.flatten() },
      { status: 400 },
    );
  }
  return proxyJson('/bookings/confirm', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });
}
