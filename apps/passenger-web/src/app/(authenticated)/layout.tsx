import { redirect } from 'next/navigation';
import { getPassengerSession } from '../../lib/auth';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPassengerSession();
  if (!session) redirect('/login');
  return children;
}
