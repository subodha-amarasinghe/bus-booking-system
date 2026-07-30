import { UserRole } from '@bus-booking/shared-types';

/**
 * Client-safe role helpers. `lib/auth.ts` pulls in `next/headers`, so anything
 * a browser bundle needs lives here instead.
 */
export const STAFF_ROLES = [
  UserRole.ADMIN_STAFF,
  UserRole.CUSTOMER_STAFF,
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export interface StaffSession {
  userId: string;
  role: StaffRole;
  phone?: string;
  name?: string;
}

export function isStaffRole(role: unknown): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  [UserRole.ADMIN_STAFF]: 'Admin staff',
  [UserRole.CUSTOMER_STAFF]: 'Customer staff',
};

export function isAdmin(role: StaffRole | null | undefined): boolean {
  return role === UserRole.ADMIN_STAFF;
}
