import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Role } from '../identity/role';
import { AuthenticationService } from './authentication.service';
import { resolveJwtSecret } from './jwt-secret';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

export type AuthUser = {
  userId: string;
  email: string;
  displayName: string;
  role: Role;
};

/**
 * Passport JWT strategy (US106, US107, US158).
 * Validates signature/expiry, then resolves Identity user (including role) via AuthenticationService.
 * Production rejects insecure JWT secret fallbacks at module construction.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authentication: AuthenticationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(config),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    return this.authentication.resolveAuthUser(payload.sub);
  }
}
