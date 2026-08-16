import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import type { Logger } from '../../logging/logger';
import { LOGGER } from '../../logging/logger.token';
import type { Role } from '../identity/role';
import type { User } from '../identity/user';
import { UserDomainService } from '../identity/user-domain.service';
import { UserStatus } from '../identity/user-status';
import {
  INVALID_SESSION_MESSAGE,
  SESSION_NOT_FOUND_MESSAGE,
  resolveAccessJwtExpiresIn,
  type SessionRequestContext,
} from './auth-session';
import { AuthSessionStore } from './auth-session.store';
import { toAuthSessionView, type AuthSessionView } from './auth-session-view';
import type { AuthUser, JwtPayload } from './jwt.strategy';
import { PasswordCredentialStore } from './password-credential.store';
import { INVALID_LOGIN_MESSAGE, type LoginRequestContext } from './login-lockout';
import { LoginLockoutStore } from './login-lockout.store';
import { HOST_MAIL, type HostMailPort } from './host-mail';
import { publicAppOrigin } from './host-mail.factory';
import {
  CURRENT_PASSWORD_INCORRECT_MESSAGE,
  INVALID_RECOVERY_MESSAGE,
  RECOVERY_ACCEPTED_MESSAGE,
  RECOVERY_UNAVAILABLE_MESSAGE,
} from './password-reset';
import { PasswordResetStore } from './password-reset.store';
import { evaluateProductPasswordPolicy, MIN_PASSWORD_LENGTH } from './password-policy';

export type AuthTokenResponse = {
  accessToken: string;
  expiresIn: string;
  csrfToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    status: UserStatus;
    role: Role;
  };
};

export type IssuedAuthSession = AuthTokenResponse & {
  refreshToken: string;
  sessionId: string;
};

/**
 * JWT authentication on top of Identity (US106, US107, PC-18, V3-S01-e).
 * Identity remains password-free; passwordHash lives in PasswordCredentialStore
 * and is persisted on the existing User.passwordHash column.
 * Sessions are Auth-owned, revocable, and bound to a short access JWT.
 */
@Injectable()
export class AuthenticationService {
  private readonly logger: Logger;

  constructor(
    @Inject(UserDomainService) private readonly users: UserDomainService,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(PasswordCredentialStore) private readonly credentials: PasswordCredentialStore,
    @Inject(LoginLockoutStore) private readonly lockouts: LoginLockoutStore,
    @Inject(AuthSessionStore) private readonly sessions: AuthSessionStore,
    @Inject(PasswordResetStore) private readonly resets: PasswordResetStore,
    @Inject(HOST_MAIL) private readonly mail: HostMailPort,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(AuthenticationService.name);
  }

  async register(
    email: string,
    displayName: string,
    password: string,
    request?: SessionRequestContext,
  ): Promise<IssuedAuthSession> {
    this.assertProductPassword(password);

    let user: User;
    try {
      user = await this.users.create({ email, displayName });
    } catch (error) {
      throw this.mapIdentityError(error);
    }

    await this.credentials.setPassword(user.id, password);
    this.logger.info(`Registered user ${user.email}`, { userId: user.id });
    return this.issueSession(user, request);
  }

  async login(
    email: string,
    password: string,
    request?: LoginRequestContext,
  ): Promise<IssuedAuthSession> {
    this.assertPassword(password);

    const user = this.users.getByEmail(email);
    const locked = user ? await this.lockouts.isLocked(user.id) : false;
    const passwordOk = await this.credentials.verifyAgainstStoredOrDummy(user?.id, password);

    if (!user || user.status === UserStatus.Disabled) {
      this.rejectInvalidLogin({ outcome: 'failure', userId: user?.id, request });
    }

    if (locked) {
      this.rejectInvalidLogin({ outcome: 'locked', userId: user.id, request });
    }

    if (!passwordOk) {
      const failure = await this.lockouts.recordFailure(user.id);
      this.rejectInvalidLogin({
        outcome: failure.locked ? 'lockout' : 'failure',
        userId: user.id,
        request,
      });
    }

    await this.lockouts.clear(user.id);
    this.logLogin('success', { userId: user.id, request });
    return this.issueSession(user, request);
  }

  async refresh(refreshToken: string, request?: SessionRequestContext): Promise<IssuedAuthSession> {
    if (!refreshToken) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }

    const rotated = await this.sessions.rotate(refreshToken, request);
    const user = this.requireActiveUser(rotated.userId);
    this.logSession('refresh', { userId: user.id, sessionId: rotated.sessionId, request });
    return this.signIssued(user, rotated);
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

    if (!payload?.sub || !payload?.sid) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }
    return this.resolveSessionAuthUser(payload.sub, payload.sid);
  }

  async logout(
    userId: string,
    sessionId: string | undefined,
    request?: SessionRequestContext,
  ): Promise<void> {
    if (sessionId) {
      await this.sessions.revoke(sessionId);
    }
    this.logSession('logout', { userId, sessionId, request });
  }

  async logoutByRefresh(refreshToken: string, request?: SessionRequestContext): Promise<void> {
    if (!refreshToken) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }
    const revoked = await this.sessions.revokeByRefresh(refreshToken);
    if (!revoked) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }
    this.logSession('logout', { userId: revoked.userId, sessionId: revoked.sessionId, request });
  }

  issueCsrfToken(): string {
    return randomBytes(32).toString('base64url');
  }

  toPublicTokenResponse(issued: IssuedAuthSession): AuthTokenResponse {
    return {
      accessToken: issued.accessToken,
      expiresIn: issued.expiresIn,
      csrfToken: issued.csrfToken,
      user: issued.user,
    };
  }

  async listSessions(
    userId: string,
    currentSessionId: string | undefined,
  ): Promise<AuthSessionView[]> {
    const currentId = await this.requireCurrentSession(userId, currentSessionId);
    const active = await this.sessions.listActive(userId);
    const started = await this.sessions.familyStartedAt(active.map((session) => session.familyId));
    return active
      .map((session) =>
        toAuthSessionView(session, currentId, started.get(session.familyId) ?? session.createdAt),
      )
      .sort((left, right) => {
        if (left.current !== right.current) return left.current ? -1 : 1;
        return Date.parse(right.lastActiveAt) - Date.parse(left.lastActiveAt);
      });
  }

  async revokeSession(
    userId: string,
    sessionId: string,
    currentSessionId: string | undefined,
    request?: SessionRequestContext,
  ): Promise<{ endedCurrent: boolean }> {
    const currentId = await this.requireCurrentSession(userId, currentSessionId);
    const target = await this.sessions.findOwnActive(userId, sessionId);
    if (!target) {
      throw new NotFoundException(SESSION_NOT_FOUND_MESSAGE);
    }

    await this.sessions.revokeFamilyOf(target.id);
    this.logSession('revoke', { userId, sessionId, request });
    return { endedCurrent: sessionId === currentId };
  }

  async revokeOtherSessions(
    userId: string,
    currentSessionId: string | undefined,
    request?: SessionRequestContext,
  ): Promise<{ revokedCount: number }> {
    const currentId = await this.requireCurrentSession(userId, currentSessionId);
    const revokedCount = await this.sessions.revokeOthers(userId, currentId);
    this.logSession('revoke-others', { userId, sessionId: currentId, request });
    return { revokedCount };
  }

  async revokeAllSessions(
    userId: string,
    currentSessionId: string | undefined,
    request?: SessionRequestContext,
  ): Promise<{ endedCurrent: true }> {
    const currentId = await this.requireCurrentSession(userId, currentSessionId);
    await this.sessions.revokeAllForUser(userId);
    this.logSession('revoke-all', { userId, sessionId: currentId, request });
    return { endedCurrent: true };
  }

  recoveryStatus(): { available: boolean; message: string } {
    if (!this.mail.isConfigured()) {
      return { available: false, message: RECOVERY_UNAVAILABLE_MESSAGE };
    }
    return { available: true, message: RECOVERY_ACCEPTED_MESSAGE };
  }

  async requestPasswordReset(
    email: string,
    request?: SessionRequestContext,
  ): Promise<{ outcome: 'accepted' | 'unavailable'; message: string }> {
    if (!this.mail.isConfigured()) {
      this.logRecover('unavailable', { request });
      return { outcome: 'unavailable', message: RECOVERY_UNAVAILABLE_MESSAGE };
    }

    const user = this.users.getByEmail(email);
    if (user && user.status !== UserStatus.Disabled) {
      const issued = await this.resets.issue(user.id);
      const resetUrl = `${publicAppOrigin(this.config)}/reset-password?token=${issued.token}`;
      try {
        await this.mail.sendPasswordReset({ to: user.email, resetUrl });
      } catch {
        this.logger.error('auth.recover mail failed', {
          event: 'auth.recover',
          outcome: 'mail-failed',
          userId: user.id,
        });
      }
      this.logRecover('requested', { userId: user.id, request });
    } else {
      await this.resets.dummyWork();
      this.logRecover('requested', { request });
    }

    return { outcome: 'accepted', message: RECOVERY_ACCEPTED_MESSAGE };
  }

  async resetPassword(
    token: string,
    password: string,
    request?: SessionRequestContext,
  ): Promise<{ ok: true }> {
    this.assertProductPassword(password);
    const consumed = await this.resets.consume(token);
    if (!consumed) {
      this.logRecover('invalid', { request });
      throw new BadRequestException(INVALID_RECOVERY_MESSAGE);
    }

    const user = this.users.getById(consumed.userId);
    if (!user || user.status === UserStatus.Disabled) {
      this.logRecover('invalid', { userId: consumed.userId, request });
      throw new BadRequestException(INVALID_RECOVERY_MESSAGE);
    }

    await this.credentials.setPassword(user.id, password);
    await this.sessions.revokeAllForUser(user.id);
    await this.lockouts.clear(user.id);
    await this.resets.consumeAllForUser(user.id);
    this.logRecover('completed', { userId: user.id, request });
    return { ok: true };
  }

  async changePassword(
    userId: string,
    currentSessionId: string | undefined,
    currentPassword: string,
    newPassword: string,
    request?: SessionRequestContext,
  ): Promise<{ ok: true }> {
    const currentId = await this.requireCurrentSession(userId, currentSessionId);
    this.assertPassword(currentPassword);
    this.assertProductPassword(newPassword);
    const matches = await this.credentials.verify(userId, currentPassword);
    if (!matches) {
      throw new BadRequestException(CURRENT_PASSWORD_INCORRECT_MESSAGE);
    }

    await this.credentials.setPassword(userId, newPassword);
    await this.sessions.revokeOthers(userId, currentId);
    await this.resets.consumeAllForUser(userId);
    this.logSession('password-change', { userId, sessionId: currentId, request });
    return { ok: true };
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

  async resolveSessionAuthUser(userId: string, sessionId: string): Promise<AuthUser> {
    const session = await this.sessions.requireActive(sessionId, userId);
    const user = this.requireActiveUser(session.userId);
    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      sessionId: session.id,
    };
  }

  private async requireCurrentSession(
    userId: string,
    currentSessionId: string | undefined,
  ): Promise<string> {
    if (!currentSessionId) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }
    await this.sessions.requireActive(currentSessionId, userId);
    this.requireActiveUser(userId);
    return currentSessionId;
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

  private assertProductPassword(password: string): void {
    const result = evaluateProductPasswordPolicy(password);
    if (!result.ok) {
      throw new BadRequestException(result.message);
    }
  }

  private async issueSession(
    user: User,
    request?: SessionRequestContext,
  ): Promise<IssuedAuthSession> {
    const issued = await this.sessions.issue(user.id, request);
    this.logSession('create', { userId: user.id, sessionId: issued.sessionId, request });
    return this.signIssued(user, issued);
  }

  private async signIssued(
    user: User,
    issued: { sessionId: string; refreshToken: string; csrfToken: string },
  ): Promise<IssuedAuthSession> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: issued.sessionId,
    };

    const expiresIn = resolveAccessJwtExpiresIn(this.config.get<string>('JWT_EXPIRES_IN'));
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: expiresIn as never });

    return {
      accessToken,
      refreshToken: issued.refreshToken,
      csrfToken: issued.csrfToken,
      expiresIn,
      sessionId: issued.sessionId,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        role: user.role,
      },
    };
  }

  private rejectInvalidLogin(params: {
    outcome: 'failure' | 'lockout' | 'locked';
    userId?: string;
    request?: LoginRequestContext;
  }): never {
    this.logLogin(params.outcome, { userId: params.userId, request: params.request });
    throw new UnauthorizedException(INVALID_LOGIN_MESSAGE);
  }

  private logLogin(
    outcome: 'success' | 'failure' | 'lockout' | 'locked',
    params: { userId?: string; request?: LoginRequestContext },
  ): void {
    const context = {
      event: 'auth.login',
      outcome,
      userId: params.userId,
      ip: params.request?.ip,
      userAgent: params.request?.userAgent,
    };
    if (outcome === 'success') {
      this.logger.info('auth.login', context);
      return;
    }
    this.logger.warn('auth.login', context);
  }

  private logSession(
    outcome:
      | 'create'
      | 'refresh'
      | 'logout'
      | 'revoke'
      | 'revoke-others'
      | 'revoke-all'
      | 'password-change',
    params: { userId?: string; sessionId?: string; request?: SessionRequestContext },
  ): void {
    this.logger.info('auth.session', {
      event: 'auth.session',
      outcome,
      userId: params.userId,
      sessionId: params.sessionId,
      ip: params.request?.ip,
      userAgent: params.request?.userAgent,
    });
  }

  private logRecover(
    outcome: 'unavailable' | 'requested' | 'completed' | 'invalid',
    params: { userId?: string; request?: SessionRequestContext },
  ): void {
    this.logger.info('auth.recover', {
      event: 'auth.recover',
      outcome,
      userId: params.userId,
      ip: params.request?.ip,
      userAgent: params.request?.userAgent,
    });
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
