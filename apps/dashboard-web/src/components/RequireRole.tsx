'use client';

import type { ReactNode } from 'react';
import { UserRole } from '@bus-booking/shared-types';

type StaffRole = typeof UserRole.ADMIN_STAFF | typeof UserRole.CUSTOMER_STAFF;

type RequireRoleProps = {
  role: string | null | undefined;
  allowed: StaffRole[];
  children: ReactNode;
  fallback?: ReactNode;
};

export function RequireRole({
  role,
  allowed,
  children,
  fallback = <p className="error">You do not have access to this area.</p>,
}: RequireRoleProps) {
  if (!role || !allowed.includes(role as StaffRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
