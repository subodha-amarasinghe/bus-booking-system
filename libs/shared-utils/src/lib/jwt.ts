import { createHmac, timingSafeEqual } from 'crypto';

export type JwtPayload = Record<string, unknown>;

function base64UrlEncode(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLength), 'base64');
}

function parseExpiresIn(expiresIn: string | number): number {
  if (typeof expiresIn === 'number') {
    return expiresIn;
  }
  const match = /^(\d+)([smhd])?$/.exec(expiresIn.trim());
  if (!match) {
    throw new Error(`Invalid expiresIn format: ${expiresIn}`);
  }
  const value = Number(match[1]);
  const unit = match[2] ?? 's';
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return value * multipliers[unit];
}

/**
 * Signs a JWT-like HS256 token using Node crypto (no jsonwebtoken dependency).
 */
export function signJwt(
  payload: JwtPayload,
  secret: string,
  expiresIn: string | number = '1h',
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + parseExpiresIn(expiresIn);
  const body = { ...payload, iat: now, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret).update(data).digest();

  return `${data}.${base64UrlEncode(signature)}`;
}

/**
 * Verifies an HS256 JWT-like token and returns the typed payload.
 */
export function verifyJwt<T extends JwtPayload = JwtPayload>(
  token: string,
  secret: string,
): T {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expected = createHmac('sha256', secret).update(data).digest();
  const actual = base64UrlDecode(encodedSignature);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('Invalid token signature');
  }

  const header = JSON.parse(base64UrlDecode(encodedHeader).toString('utf8')) as {
    alg?: string;
  };
  if (header.alg !== 'HS256') {
    throw new Error('Unsupported token algorithm');
  }

  const payload = JSON.parse(
    base64UrlDecode(encodedPayload).toString('utf8'),
  ) as T & { exp?: number };

  if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}
