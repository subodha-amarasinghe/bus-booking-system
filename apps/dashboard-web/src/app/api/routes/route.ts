import type { NextRequest } from 'next/server';
import { CreateRouteRequestSchema } from '@bus-booking/shared-types';
import { proxyValidatedPost } from '../../../lib/api';

export async function POST(request: NextRequest) {
  return proxyValidatedPost(request, CreateRouteRequestSchema, '/routes');
}
