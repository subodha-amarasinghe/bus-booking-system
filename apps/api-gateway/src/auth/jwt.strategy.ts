import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '@bus-booking/shared-types';

export interface JwtUser {
  userId: string;
  phone: string;
  role: UserRole;
}

interface JwtPayload {
  sub?: string;
  userId?: string;
  phone?: string;
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    });
  }

  validate(payload: JwtPayload): JwtUser {
    const userId = payload.sub ?? payload.userId;
    if (!userId || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      userId,
      phone: payload.phone ?? '',
      role: payload.role as UserRole,
    };
  }
}
