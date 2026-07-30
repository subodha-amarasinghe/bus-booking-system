import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { DashboardShell } from '../../components/DashboardShell';
import { getStaffProfile, getStaffSession } from '../../lib/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getStaffSession();
  if (!session) {
    redirect('/login');
  }

  const profile = await getStaffProfile();

  return (
    <DashboardShell session={{ ...session, name: profile?.name }}>
      {children}
    </DashboardShell>
  );
}
