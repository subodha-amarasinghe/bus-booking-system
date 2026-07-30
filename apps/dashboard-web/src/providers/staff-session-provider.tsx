'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { UserRole } from '@bus-booking/shared-types';
import type { StaffSession } from '../lib/roles';

const StaffSessionContext = createContext<StaffSession | null>(null);

export function StaffSessionProvider({
  session,
  children,
}: {
  session: StaffSession;
  children: ReactNode;
}) {
  return (
    <StaffSessionContext.Provider value={session}>
      {children}
    </StaffSessionContext.Provider>
  );
}

/**
 * The dashboard layout guarantees a session, so feature components can rely on
 * this being present rather than threading props through every page.
 */
export function useStaffSession(): StaffSession {
  const session = useContext(StaffSessionContext);
  if (!session) {
    throw new Error('useStaffSession must be used inside the dashboard layout');
  }
  return session;
}

export function useOptionalStaffSession(): StaffSession | null {
  return useContext(StaffSessionContext);
}

export function useIsAdmin(): boolean {
  return useStaffSession().role === UserRole.ADMIN_STAFF;
}
