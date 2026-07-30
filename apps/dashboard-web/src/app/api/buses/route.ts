import type { NextRequest } from 'next/server';
import { CreateBusRequestSchema } from '@bus-booking/shared-types';
import { proxyJson, proxyValidatedPost } from '../../../lib/api';

/** Lists the fleet — the gateway exposes it as a POST with an empty filter. */
export async function GET() {
  return proxyJson('/buses/list', { method: 'POST', body: '{}' });
}

export async function POST(request: NextRequest) {
  return proxyValidatedPost(request, CreateBusRequestSchema, '/buses');
}
