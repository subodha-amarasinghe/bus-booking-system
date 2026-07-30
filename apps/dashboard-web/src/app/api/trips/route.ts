import type { NextRequest } from 'next/server';
import { CreateTripRequestSchema } from '@bus-booking/shared-types';
import { proxyValidatedPost } from '../../../lib/api';

export async function POST(request: NextRequest) {
  return proxyValidatedPost(request, CreateTripRequestSchema, '/trips');
}
