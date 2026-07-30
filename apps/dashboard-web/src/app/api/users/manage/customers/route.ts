import type { NextRequest } from 'next/server';
import { ManageCustomersRequestSchema } from '@bus-booking/shared-types';
import { proxyValidatedPost } from '../../../../../lib/api';

export async function POST(request: NextRequest) {
  return proxyValidatedPost(
    request,
    ManageCustomersRequestSchema,
    '/users/manage/customers',
  );
}
