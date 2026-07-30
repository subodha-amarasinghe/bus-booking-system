import { z } from 'zod';

export const LoginRequestSchema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  phone: z.string().min(1),
  password: z.string().min(6),
  name: z.string().min(1),
  email: z.string().email().optional(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const ValidateTokenRequestSchema = z.object({
  token: z.string().min(1),
});
export type ValidateTokenRequest = z.infer<typeof ValidateTokenRequestSchema>;

export const WsTokenRequestSchema = z.object({
  userId: z.string().uuid(),
});
export type WsTokenRequest = z.infer<typeof WsTokenRequestSchema>;

export const WsTokenResponseSchema = z.object({
  token: z.string(),
  expiresIn: z.number().int(),
});
export type WsTokenResponse = z.infer<typeof WsTokenResponseSchema>;

export const AuthTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int(),
  tokenType: z.string().default('Bearer'),
  userId: z.string().uuid(),
});
export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;
