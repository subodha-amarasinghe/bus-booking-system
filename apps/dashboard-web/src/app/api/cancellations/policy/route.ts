import type { NextRequest } from 'next/server';
import { UpsertCancellationPolicyRequestSchema } from '@bus-booking/shared-types';
import { proxyJson, proxyValidatedPost } from '../../../../lib/api';

/** Active policy — gateway exposes it as POST /cancellations/policy/get. */
export async function GET() {
  return proxyJson('/cancellations/policy/get', {
    method: 'POST',
    body: '{}',
  });
}

export async function POST(request: NextRequest) {
  return proxyValidatedPost(
    request,
    UpsertCancellationPolicyRequestSchema,
    '/cancellations/policy',
  );
}
