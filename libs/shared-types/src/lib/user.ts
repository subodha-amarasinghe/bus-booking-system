import { z } from 'zod';

export enum UserRole {
  PASSENGER = 'PASSENGER',
  ADMIN_STAFF = 'ADMIN_STAFF',
  CUSTOMER_STAFF = 'CUSTOMER_STAFF',
}

export const UserRoleSchema = z.nativeEnum(UserRole);
export type UserRoleType = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  name: z.string(),
  email: z.string().email().nullable().optional(),
  role: UserRoleSchema,
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof UserSchema>;

export const CreateProfileRequestSchema = z.object({
  phone: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  role: UserRoleSchema.optional(),
});
export type CreateProfileRequest = z.infer<typeof CreateProfileRequestSchema>;

export const GetProfileRequestSchema = z.object({
  userId: z.string().uuid(),
});
export type GetProfileRequest = z.infer<typeof GetProfileRequestSchema>;

export const ManageInternalRequestSchema = z.object({
  userId: z.string().uuid(),
  role: UserRoleSchema,
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});
export type ManageInternalRequest = z.infer<typeof ManageInternalRequestSchema>;

export const ManageCustomersRequestSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});
export type ManageCustomersRequest = z.infer<typeof ManageCustomersRequestSchema>;
