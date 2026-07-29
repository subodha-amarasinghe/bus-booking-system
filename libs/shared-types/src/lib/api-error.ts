import { z } from 'zod';

export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  message: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
