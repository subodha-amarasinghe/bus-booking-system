import { NextResponse } from 'next/server';
import { getPassengerSession } from '../../../../lib/auth';

export async function GET() {
  const session = await getPassengerSession();
  return session
    ? NextResponse.json(session)
    : NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}
