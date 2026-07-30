import type { JwtUser } from './jwt.strategy';

/**
 * Shape of the request once `JwtAuthGuard` has run — Passport attaches the
 * value returned by `JwtStrategy.validate`.
 */
export interface AuthenticatedRequest {
  user: JwtUser;
}
