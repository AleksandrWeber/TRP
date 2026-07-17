import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Role } from '../identity/role';
import { AuthenticationService } from './authentication.service';

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
 * Passport JWT strategy (US106, US107).
 * Validates signature/expiry, then resolves Identity user (including role) via AuthenticationService.
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
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-only-change-me',
    });
  }

  validate(payload: JwtPayload): AuthUser {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    return this.authentication.resolveAuthUser(payload.sub);
  }
}
