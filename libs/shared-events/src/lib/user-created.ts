import { z } from 'zod';

export const USER_CREATED = 'user.created' as const;

export const UserCreatedSchema = z.object({
  event: z.literal(USER_CREATED),
  userId: z.string().uuid(),
  phone: z.string(),
  name: z.string(),
  role: z.string(),
  occurredAt: z.coerce.date(),
});
export type UserCreated = z.infer<typeof UserCreatedSchema>;
