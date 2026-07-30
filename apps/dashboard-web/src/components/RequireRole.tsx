'use client';

import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ROLE_LABELS, type StaffRole } from '../lib/roles';
import { useOptionalStaffSession } from '../providers/staff-session-provider';

type RequireRoleProps = {
  allowed: StaffRole[];
  /** Defaults to the signed-in staff member's role. */
  role?: StaffRole | null;
  children: ReactNode;
  fallback?: ReactNode;
};

export function RequireRole({
  allowed,
  role,
  children,
  fallback,
}: RequireRoleProps) {
  const session = useOptionalStaffSession();
  const effectiveRole = role ?? session?.role;

  if (!effectiveRole || !allowed.includes(effectiveRole)) {
    return (
      <>
        {fallback ?? (
          <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Read-only for your role. Ask an admin if you need to change this —
              this area is limited to{' '}
              {allowed.map((item) => ROLE_LABELS[item]).join(' and ')}.
            </span>
          </p>
        )}
      </>
    );
  }

  return <>{children}</>;
}
