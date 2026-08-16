import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Role } from '../identity/role';
import { ACCESS_COOKIE_NAME, INVALID_SESSION_MESSAGE } from './auth-session';
import { parseCookieHeader } from './auth-cookies';
import { AuthenticationService } from './authentication.service';
import { resolveJwtSecret } from './jwt-secret';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
  sid: string;
};

export type AuthUser = {
  userId: string;
  email: string;
  displayName: string;
  role: Role;
  sessionId?: string;
};

function extractAccessToken(request: {
  headers?: Record<string, string | string[] | undefined>;
}): string | null {
  const bearer = ExtractJwt.fromAuthHeaderAsBearerToken()(request as never);
  if (bearer) return bearer;
  const cookies = parseCookieHeader(request.headers?.cookie);
  return cookies[ACCESS_COOKIE_NAME] ?? null;
}

/**
 * Passport JWT strategy (US106, US107, US158, V3-S01-c).
 * Validates signature/expiry, then Auth session + Identity.
 * Production rejects insecure JWT secret fallbacks at module construction.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authentication: AuthenticationService,
  ) {
    super({
      jwtFromRequest: extractAccessToken,
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(config),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (!payload?.sub || !payload?.sid) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }
    return this.authentication.resolveSessionAuthUser(payload.sub, payload.sid);
  }
}
