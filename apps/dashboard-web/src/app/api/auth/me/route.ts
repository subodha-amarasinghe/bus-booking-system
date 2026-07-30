import { NextResponse } from 'next/server';
import { getStaffProfile, getStaffSession } from '../../../../lib/auth';

export async function GET() {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json(
      { message: 'Not signed in as staff.' },
      { status: 401 },
    );
  }

  const profile = await getStaffProfile();
  return NextResponse.json({
    ...session,
    name: profile?.name,
    email: profile?.email ?? undefined,
  });
}
