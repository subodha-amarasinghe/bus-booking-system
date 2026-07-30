import { redirect } from 'next/navigation';
import { getStaffSession } from '../lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getStaffSession();
  redirect(session ? '/dashboard' : '/login');
}
