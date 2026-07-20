import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Logger } from '../../logging/logger';
import { LOGGER } from '../../logging/logger.token';
import type { Role } from '../identity/role';
import type { User } from '../identity/user';
import { UserDomainService } from '../identity/user-domain.service';
import { UserStatus } from '../identity/user-status';
import type { AuthUser, JwtPayload } from './jwt.strategy';
import { PasswordCredentialStore } from './password-credential.store';

export type AuthTokenResponse = {
  accessToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    status: UserStatus;
    role: Role;
  };
};

const MIN_PASSWORD_LENGTH = 8;

/**
 * JWT authentication on top of Identity (US106, US107).
 * Identity remains password-free; passwordHash lives in PasswordCredentialStore.
 * register / login / validateToken — Role embedded in issued JWT.
 */
@Injectable()
export class AuthenticationService {
  private readonly logger: Logger;

  constructor(
    @Inject(UserDomainService) private readonly users: UserDomainService,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(PasswordCredentialStore) private readonly credentials: PasswordCredentialStore,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(AuthenticationService.name);
  }

  async register(email: string, displayName: string, password: string): Promise<AuthTokenResponse> {
    this.assertPassword(password);

    let user: User;
    try {
      user = this.users.create({ email, displayName });
    } catch (error) {
      throw this.mapIdentityError(error);
    }

    await this.credentials.setPassword(user.id, password);
    this.logger.info(`Registered user ${user.email}`, { userId: user.id });
    return this.issueToken(user);
  }

  async login(email: string, password: string): Promise<AuthTokenResponse> {
    this.assertPassword(password);

    const user = this.users.getByEmail(email);
    if (!user || user.status === UserStatus.Disabled) {
      this.logger.warn(`Failed login for ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordOk = await this.credentials.verify(user.id, password);
    if (!passwordOk) {
      this.logger.warn(`Failed login for ${email} (password mismatch)`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.info(`Successful login for ${user.email}`, { userId: user.id });
    return this.issueToken(user);
  }

  /**
   * Sets or replaces the password for an existing Identity user (bootstrap / admin).
   */
  async setPassword(userId: string, password: string): Promise<void> {
    this.assertPassword(password);
    const user = this.requireActiveUser(userId);
    await this.credentials.setPassword(user.id, password);
  }

  async validateToken(token: string): Promise<AuthUser> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    return this.resolveAuthUser(payload.sub);
  }

  me(userId: string): {
    id: string;
    email: string;
    displayName: string;
    status: UserStatus;
    role: Role;
  } {
    const user = this.requireActiveUser(userId);
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      role: user.role,
    };
  }

  resolveAuthUser(userId: string): AuthUser {
    const user = this.requireActiveUser(userId);
    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  private requireActiveUser(userId: string): User {
    const user = this.users.getById(userId);
    if (!user || user.status === UserStatus.Disabled) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private assertPassword(password: string): void {
    if (typeof password !== 'string' || password.trim().length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(`password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
  }

  private async issueToken(user: User): Promise<AuthTokenResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwt.signAsync(payload);
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN') ?? '8h';

    return {
      accessToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        role: user.role,
      },
    };
  }

  private mapIdentityError(error: unknown): Error {
    const message = error instanceof Error ? error.message : 'Registration failed';
    if (/already exists/i.test(message)) {
      return new ConflictException(message);
    }
    if (/must not be empty/i.test(message)) {
      return new BadRequestException(message);
    }
    return new BadRequestException(message);
  }
}
