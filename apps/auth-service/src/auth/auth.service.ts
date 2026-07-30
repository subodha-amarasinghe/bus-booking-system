import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { USER_CREATED } from '@bus-booking/shared-events';
import { signJwt, verifyJwt } from '@bus-booking/shared-utils';
import type {
  AuthTokenResponse,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  ValidateTokenRequest,
  WsTokenResponse,
} from '@bus-booking/shared-types';
import { DomainException } from '../common/exceptions/domain.exception';
import { AuthRepository } from './auth.repository';

const WS_TOKEN_TTL_SECONDS = 300;

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    @Inject('NOTIFICATION_SERVICE') private readonly notifications: ClientProxy,
  ) {}

  async login(dto: LoginRequest): Promise<AuthTokenResponse> {
    const user = await this.repo.findByPhone(dto.phone);
    if (!user || !this.verifyPassword(dto.password, user.passwordHash)) {
      throw new DomainException('Invalid credentials', 401, 'AUTH_INVALID');
    }
    return this.issueTokens(user.id, user.phone, user.role);
  }

  async register(dto: RegisterRequest): Promise<AuthTokenResponse> {
    const existing = await this.repo.findByPhone(dto.phone);
    if (existing) {
      throw new DomainException('Phone already registered', 409, 'AUTH_EXISTS');
    }
    const user = await this.repo.create({
      phone: dto.phone,
      passwordHash: this.hashPassword(dto.password),
      role: 'PASSENGER',
    });
    this.notifications.emit(USER_CREATED, {
      event: USER_CREATED,
      userId: user.id,
      phone: user.phone,
      name: dto.name,
      role: user.role,
      occurredAt: new Date(),
    });
    return this.issueTokens(user.id, user.phone, user.role);
  }

  async refresh(dto: RefreshRequest): Promise<AuthTokenResponse> {
    const user = await this.repo.findByRefreshToken(dto.refreshToken);
    if (!user) {
      throw new DomainException('Invalid refresh token', 401, 'AUTH_REFRESH');
    }
    return this.issueTokens(user.id, user.phone, user.role);
  }

  validateToken(dto: ValidateTokenRequest): {
    valid: boolean;
    userId?: string;
    role?: string;
  } {
    try {
      const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
      const payload = verifyJwt<{ sub: string; role: string }>(dto.token, secret);
      return { valid: true, userId: payload.sub, role: payload.role };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Scoped to `purpose: 'ws'` so a leaked socket token cannot be replayed
   * against the REST API.
   */
  wsToken(userId: string): WsTokenResponse {
    const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
    const expiresIn = WS_TOKEN_TTL_SECONDS;
    const token = signJwt({ sub: userId, purpose: 'ws' }, secret, expiresIn);
    return { token, expiresIn };
  }

  private async issueTokens(
    userId: string,
    phone: string,
    role: string,
  ): Promise<AuthTokenResponse> {
    const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
    const expiresIn = 3600;
    const accessToken = signJwt({ sub: userId, phone, role }, secret, expiresIn);
    const refreshToken = randomBytes(32).toString('hex');
    await this.repo.updateRefreshToken(userId, refreshToken);
    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
      userId,
    };
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}
