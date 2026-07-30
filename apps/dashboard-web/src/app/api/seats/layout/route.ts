import type { NextRequest } from 'next/server';
import { SaveSeatLayoutRequestSchema } from '@bus-booking/shared-types';
import { NextResponse } from 'next/server';
import { proxyJson, proxyValidatedPost } from '../../../../lib/api';

export async function GET(request: NextRequest) {
  const busId = request.nextUrl.searchParams.get('busId');
  const parsed = SaveSeatLayoutRequestSchema.shape.busId.safeParse(busId);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'A valid bus id is required.' },
      { status: 400 },
    );
  }
  return proxyJson(`/seats/layout/${encodeURIComponent(parsed.data)}`, {
    method: 'GET',
  });
}

export async function POST(request: NextRequest) {
  return proxyValidatedPost(
    request,
    SaveSeatLayoutRequestSchema,
    '/seats/layout',
  );
}
