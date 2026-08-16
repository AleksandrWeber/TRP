import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it } from 'vitest';
import { Role } from '../identity/role';
import { InMemoryUserRepository } from '../identity/repositories/in-memory-user.repository';
import { UserDomainService } from '../identity/user-domain.service';
import { UserStatus } from '../identity/user-status';
import { NoOpLogger } from '../../logging/noop.logger';
import { AuthenticationService } from './authentication.service';
import type { JwtPayload } from './jwt.strategy';
import { InMemoryPasswordCredentialRepository } from './in-memory-password-credential.repository';
import { PasswordCredentialStore } from './password-credential.store';
import { InMemoryAuthSessionRepository } from './in-memory-auth-session.repository';
import { InMemoryLoginLockoutRepository } from './in-memory-login-lockout.repository';
import { InMemoryPasswordResetRepository } from './in-memory-password-reset.repository';
import { AuthSessionStore } from './auth-session.store';
import {
  ACCESS_JWT_EXPIRES_IN,
  INVALID_SESSION_MESSAGE,
  SESSION_NOT_FOUND_MESSAGE,
  resolveAccessJwtExpiresIn,
} from './auth-session';
import {
  INVALID_LOGIN_MESSAGE,
  LOGIN_LOCKOUT_COOLDOWN_MS,
  LOGIN_LOCKOUT_MAX_FAILURES,
  type Clock,
  type LoginRequestContext,
} from './login-lockout';
import { LoginLockoutStore } from './login-lockout.store';
import { CapturingHostMail } from './host-mail';
import {
  CURRENT_PASSWORD_INCORRECT_MESSAGE,
  INVALID_RECOVERY_MESSAGE,
  RECOVERY_ACCEPTED_MESSAGE,
  RECOVERY_UNAVAILABLE_MESSAGE,
  RESET_TOKEN_TTL_MS,
} from './password-reset';
import { PasswordResetStore } from './password-reset.store';
import type { LogContext, Logger } from '../../logging/logger';

const TEST_PASSWORD = 'password-123';
const WRONG_PASSWORD = 'wrong-pass-1';
const NEXT_PASSWORD = 'newpass-456';

class ManualClock implements Clock {
  current = new Date('2026-08-16T12:00:00.000Z');

  now(): Date {
    return this.current;
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

class RecordingLogger implements Logger {
  readonly entries: Array<{ level: string; message: string; context?: LogContext }> = [];

  child(_component: string): Logger {
    return this;
  }

  debug(message: string, context?: LogContext): void {
    this.entries.push({ level: 'debug', message, context });
  }

  info(message: string, context?: LogContext): void {
    this.entries.push({ level: 'info', message, context });
  }

  warn(message: string, context?: LogContext): void {
    this.entries.push({ level: 'warn', message, context });
  }

  error(message: string, context?: LogContext): void {
    this.entries.push({ level: 'error', message, context });
  }
}

function createAuthentication(options?: {
  clock?: Clock;
  logger?: Logger;
  mail?: CapturingHostMail;
}) {
  const users = new UserDomainService(new InMemoryUserRepository());
  const credentialRepository = new InMemoryPasswordCredentialRepository();
  const credentials = new PasswordCredentialStore(credentialRepository);
  const lockouts = new LoginLockoutStore(new InMemoryLoginLockoutRepository(), options?.clock);
  const sessions = new AuthSessionStore(new InMemoryAuthSessionRepository(), options?.clock);
  const resets = new PasswordResetStore(new InMemoryPasswordResetRepository(), options?.clock);
  const mail = options?.mail ?? new CapturingHostMail(true);
  const jwt = new JwtService({
    secret: 'test-secret',
    signOptions: { expiresIn: '1h' },
  });
  const config = {
    get: (key: string) => {
      if (key === 'JWT_EXPIRES_IN') return '1h';
      if (key === 'PUBLIC_APP_URL') return 'http://localhost:5173';
      return undefined;
    },
  } as ConfigService;
  const logger = options?.logger ?? new NoOpLogger();
  const authentication = new AuthenticationService(
    users,
    jwt,
    config,
    credentials,
    lockouts,
    sessions,
    resets,
    mail,
    logger,
  );
  return {
    users,
    authentication,
    jwt,
    credentials,
    credentialRepository,
    lockouts,
    sessions,
    mail,
  };
}

describe('AuthenticationService (US106, US107, V3-S01-c)', () => {
  let users: UserDomainService;
  let authentication: AuthenticationService;
  let jwt: JwtService;
  let credentials: PasswordCredentialStore;
  let credentialRepository: InMemoryPasswordCredentialRepository;

  beforeEach(() => {
    ({ users, authentication, jwt, credentials, credentialRepository } = createAuthentication());
  });

  it('register creates Identity user, stores passwordHash, and issues JWT with role', async () => {
    const result = await authentication.register('Ada@Example.com', 'Ada', TEST_PASSWORD);

    expect(result.user).toEqual({
      id: expect.any(String),
      email: 'ada@example.com',
      displayName: 'Ada',
      status: UserStatus.Active,
      role: Role.Researcher,
    });
    expect(result.accessToken.length).toBeGreaterThan(0);
    expect(result.expiresIn).toBe('1h');

    const payload = jwt.decode(result.accessToken) as JwtPayload;
    expect(payload.role).toBe(Role.Researcher);
    expect(payload.sub).toBe(result.user.id);
    expect(payload.email).toBe('ada@example.com');
    expect(payload.sid).toEqual(expect.any(String));
    expect(result.refreshToken.length).toBeGreaterThan(0);
    expect(JSON.stringify(authentication.toPublicTokenResponse(result))).not.toContain(
      result.refreshToken,
    );

    const stored = users.getByEmail('ada@example.com');
    expect(stored?.displayName).toBe('Ada');
    expect(stored?.role).toBe(Role.Researcher);
    expect(credentials.has(result.user.id)).toBe(true);
  });

  it('register rejects duplicate email', async () => {
    await authentication.register('a@example.com', 'A', TEST_PASSWORD);

    await expect(
      authentication.register('A@Example.com', 'B', TEST_PASSWORD),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('register rejects short passwords', async () => {
    await expect(authentication.register('a@example.com', 'A', 'short')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('register rejects passwords without a letter and a number', async () => {
    await expect(authentication.register('a@example.com', 'A', 'password')).rejects.toMatchObject({
      message: 'Password must include a letter and a number.',
    });
    await expect(authentication.register('a@example.com', 'A', '12345678')).rejects.toMatchObject({
      message: 'Password must include a letter and a number.',
    });
  });

  it('register rejects the engineer seed password', async () => {
    await expect(
      authentication.register('a@example.com', 'A', 'trp-admin-change-me'),
    ).rejects.toMatchObject({
      message: 'Choose a stronger password.',
    });
  });

  it('register stores a bcrypt hash, not the plaintext password', async () => {
    const result = await authentication.register('hash@example.com', 'Hash', TEST_PASSWORD);
    const stored = await credentialRepository.findByUserId(result.user.id);

    expect(stored).toBeDefined();
    expect(stored).not.toBe(TEST_PASSWORD);
    expect(stored?.startsWith('$2')).toBe(true);
    expect(await credentials.verify(result.user.id, TEST_PASSWORD)).toBe(true);
    expect(JSON.stringify(result)).not.toContain(TEST_PASSWORD);
    expect(JSON.stringify(result)).not.toContain(stored);
  });

  it('setPassword still allows the engineer seed password', async () => {
    const admin = await users.create({
      email: 'seed@example.com',
      displayName: 'Seed',
      role: Role.Admin,
    });

    await expect(
      authentication.setPassword(admin.id, 'trp-admin-change-me'),
    ).resolves.toBeUndefined();
    expect(await credentials.verify(admin.id, 'trp-admin-change-me')).toBe(true);
  });

  it('login issues JWT for existing active user with correct password', async () => {
    await authentication.register('b@example.com', 'B', TEST_PASSWORD);

    const result = await authentication.login('B@Example.com', TEST_PASSWORD);

    expect(result.user.email).toBe('b@example.com');
    expect(result.user.role).toBe(Role.Researcher);
    expect(result.accessToken.length).toBeGreaterThan(0);
  });

  it('login does not apply registration complexity to existing passwords', async () => {
    const admin = await users.create({
      email: 'legacy@example.com',
      displayName: 'Legacy',
    });
    await authentication.setPassword(admin.id, 'password');

    const result = await authentication.login('legacy@example.com', 'password');
    expect(result.user.email).toBe('legacy@example.com');
  });

  it('login rejects wrong password', async () => {
    await authentication.register('b@example.com', 'B', TEST_PASSWORD);

    await expect(authentication.login('b@example.com', 'wrong-password')).rejects.toMatchObject({
      message: INVALID_LOGIN_MESSAGE,
    });
  });

  it('login rejects unknown or disabled users', async () => {
    await expect(authentication.login('missing@example.com', TEST_PASSWORD)).rejects.toMatchObject({
      message: INVALID_LOGIN_MESSAGE,
    });

    const created = await authentication.register('c@example.com', 'C', TEST_PASSWORD);
    await users.disable(created.user.id);

    await expect(authentication.login('c@example.com', TEST_PASSWORD)).rejects.toMatchObject({
      message: INVALID_LOGIN_MESSAGE,
    });
  });

  it('validateToken accepts signed JWT and resolves AuthUser with role', async () => {
    const issued = await authentication.register('d@example.com', 'D', TEST_PASSWORD);

    const authUser = await authentication.validateToken(issued.accessToken);

    expect(authUser).toEqual({
      userId: issued.user.id,
      email: 'd@example.com',
      displayName: 'D',
      role: Role.Researcher,
      sessionId: issued.sessionId,
    });
  });

  it('validateToken rejects invalid or disabled-user tokens', async () => {
    await expect(authentication.validateToken('not-a-jwt')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    const issued = await authentication.register('e@example.com', 'E', TEST_PASSWORD);
    await users.disable(issued.user.id);

    await expect(authentication.validateToken(issued.accessToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('me returns Identity profile including role', async () => {
    const issued = await authentication.register('f@example.com', 'F', TEST_PASSWORD);

    expect(authentication.me(issued.user.id)).toEqual({
      id: issued.user.id,
      email: 'f@example.com',
      displayName: 'F',
      status: UserStatus.Active,
      role: Role.Researcher,
    });
  });

  it('me reflects an Identity role assignment on the next call', async () => {
    const issued = await authentication.register('g@example.com', 'G', TEST_PASSWORD);

    await users.assignRole(issued.user.id, Role.Trader);

    expect(authentication.me(issued.user.id).role).toBe(Role.Trader);
  });

  it('issued JWT role follows Identity role changes', async () => {
    const admin = await users.create({
      email: 'admin@example.com',
      displayName: 'Admin',
      role: Role.Admin,
    });
    await authentication.setPassword(admin.id, TEST_PASSWORD);

    const result = await authentication.login('admin@example.com', TEST_PASSWORD);
    const payload = jwt.decode(result.accessToken) as JwtPayload;

    expect(payload.role).toBe(Role.Admin);
    expect(result.user.role).toBe(Role.Admin);
    expect(admin.role).toBe(Role.Admin);
  });

  it('locks after the bounded number of failed logins and keeps the generic error', async () => {
    const logger = new RecordingLogger();
    const { authentication: auth } = createAuthentication({ logger });
    await auth.register('spray@example.com', 'Spray', TEST_PASSWORD);
    const request: LoginRequestContext = { ip: '203.0.113.10', userAgent: 'test-agent' };

    for (let i = 0; i < LOGIN_LOCKOUT_MAX_FAILURES; i += 1) {
      await expect(auth.login('spray@example.com', WRONG_PASSWORD, request)).rejects.toMatchObject({
        message: INVALID_LOGIN_MESSAGE,
      });
    }

    await expect(auth.login('spray@example.com', TEST_PASSWORD, request)).rejects.toMatchObject({
      message: INVALID_LOGIN_MESSAGE,
    });

    const serialized = JSON.stringify(logger.entries);
    expect(serialized).not.toContain(TEST_PASSWORD);
    expect(serialized).not.toContain(WRONG_PASSWORD);
    expect(logger.entries.some((entry) => entry.context?.outcome === 'lockout')).toBe(true);
    expect(logger.entries.some((entry) => entry.context?.outcome === 'locked')).toBe(true);
    expect(logger.entries.some((entry) => entry.context?.ip === '203.0.113.10')).toBe(true);
    expect(logger.entries.some((entry) => entry.context?.userAgent === 'test-agent')).toBe(true);
  });

  it('allows a correct password after the lockout cooldown', async () => {
    const clock = new ManualClock();
    const { authentication: auth } = createAuthentication({ clock });
    await auth.register('cool@example.com', 'Cool', TEST_PASSWORD);

    for (let i = 0; i < LOGIN_LOCKOUT_MAX_FAILURES; i += 1) {
      await expect(auth.login('cool@example.com', WRONG_PASSWORD)).rejects.toMatchObject({
        message: INVALID_LOGIN_MESSAGE,
      });
    }

    await expect(auth.login('cool@example.com', TEST_PASSWORD)).rejects.toMatchObject({
      message: INVALID_LOGIN_MESSAGE,
    });

    clock.advance(LOGIN_LOCKOUT_COOLDOWN_MS);

    const result = await auth.login('cool@example.com', TEST_PASSWORD);
    expect(result.user.email).toBe('cool@example.com');
    expect(JSON.stringify(result)).not.toContain(TEST_PASSWORD);
  });

  it('clears failed attempts after a successful login', async () => {
    const { authentication: auth } = createAuthentication();
    await auth.register('reset@example.com', 'Reset', TEST_PASSWORD);

    for (let i = 0; i < LOGIN_LOCKOUT_MAX_FAILURES - 1; i += 1) {
      await expect(auth.login('reset@example.com', WRONG_PASSWORD)).rejects.toMatchObject({
        message: INVALID_LOGIN_MESSAGE,
      });
    }

    await auth.login('reset@example.com', TEST_PASSWORD);

    for (let i = 0; i < LOGIN_LOCKOUT_MAX_FAILURES - 1; i += 1) {
      await expect(auth.login('reset@example.com', WRONG_PASSWORD)).rejects.toMatchObject({
        message: INVALID_LOGIN_MESSAGE,
      });
    }

    const result = await auth.login('reset@example.com', TEST_PASSWORD);
    expect(result.user.email).toBe('reset@example.com');
  });

  it('binds a short-lived access JWT to a server session and stores a hashed refresh', async () => {
    const { authentication, jwt, sessions } = createAuthentication();
    const issued = await authentication.register('sess@example.com', 'Sess', TEST_PASSWORD);
    const payload = jwt.decode(issued.accessToken) as JwtPayload;

    expect(ACCESS_JWT_EXPIRES_IN).toBe('15m');
    expect(resolveAccessJwtExpiresIn('8h')).toBe('15m');
    expect(resolveAccessJwtExpiresIn('1h')).toBe('1h');
    expect(payload.sid).toBe(issued.sessionId);
    await expect(sessions.requireActive(issued.sessionId, issued.user.id)).resolves.toMatchObject({
      id: issued.sessionId,
      userId: issued.user.id,
    });
    expect(JSON.stringify(issued)).not.toContain(TEST_PASSWORD);
  });

  it('rotates refresh tokens and revokes the family on reuse', async () => {
    const { authentication } = createAuthentication();
    const issued = await authentication.register('rot@example.com', 'Rot', TEST_PASSWORD);

    const rotated = await authentication.refresh(issued.refreshToken);
    expect(rotated.accessToken).not.toBe(issued.accessToken);
    expect(rotated.refreshToken).not.toBe(issued.refreshToken);
    expect(rotated.sessionId).not.toBe(issued.sessionId);

    await expect(authentication.validateToken(issued.accessToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });
    await expect(authentication.refresh(issued.refreshToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });
    await expect(authentication.refresh(rotated.refreshToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });
  });

  it('rejects a revoked session immediately', async () => {
    const { authentication } = createAuthentication();
    const issued = await authentication.register('rev@example.com', 'Rev', TEST_PASSWORD);

    await authentication.logout(issued.user.id, issued.sessionId);

    await expect(authentication.validateToken(issued.accessToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });
    await expect(authentication.refresh(issued.refreshToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });
  });

  it('does not log access or refresh tokens', async () => {
    const logger = new RecordingLogger();
    const { authentication } = createAuthentication({ logger });
    const issued = await authentication.login(
      (await authentication.register('log@example.com', 'Log', TEST_PASSWORD)).user.email,
      TEST_PASSWORD,
    );
    await authentication.refresh(issued.refreshToken);

    const serialized = JSON.stringify(logger.entries);
    expect(serialized).not.toContain(issued.accessToken);
    expect(serialized).not.toContain(issued.refreshToken);
    expect(serialized).not.toContain(TEST_PASSWORD);
    expect(logger.entries.some((entry) => entry.context?.event === 'auth.session')).toBe(true);
  });

  it('lists the caller’s live sessions and marks the current one', async () => {
    const { authentication } = createAuthentication();
    const current = await authentication.register('list@example.com', 'List', TEST_PASSWORD, {
      ip: '203.0.113.8',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    });
    const other = await authentication.login('list@example.com', TEST_PASSWORD, {
      ip: '198.51.100.10',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const stranger = await authentication.register('other@example.com', 'Other', TEST_PASSWORD);

    const sessions = await authentication.listSessions(current.user.id, current.sessionId);
    expect(sessions).toHaveLength(2);
    expect(sessions[0]).toMatchObject({
      id: current.sessionId,
      current: true,
      device: 'Computer',
      browser: 'Chrome',
      network: '203.0.113.8',
    });
    expect(sessions.find((session) => session.id === other.sessionId)).toMatchObject({
      current: false,
      device: 'Phone or tablet',
      browser: 'Safari',
      network: '198.51.100.10',
    });
    expect(JSON.stringify(sessions)).not.toContain(current.refreshToken);
    expect(JSON.stringify(sessions)).not.toContain(other.refreshToken);
    expect(sessions.some((session) => session.id === stranger.sessionId)).toBe(false);
  });

  it('revokes another session immediately and keeps the current one', async () => {
    const { authentication } = createAuthentication();
    const current = await authentication.register('keep@example.com', 'Keep', TEST_PASSWORD);
    const other = await authentication.login('keep@example.com', TEST_PASSWORD);

    const result = await authentication.revokeSession(
      current.user.id,
      other.sessionId,
      current.sessionId,
    );
    expect(result.endedCurrent).toBe(false);

    await expect(authentication.validateToken(other.accessToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });
    await expect(authentication.refresh(other.refreshToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });
    await expect(authentication.validateToken(current.accessToken)).resolves.toMatchObject({
      sessionId: current.sessionId,
    });
  });

  it('does not reveal whether a missing session belongs to another user', async () => {
    const { authentication } = createAuthentication();
    const owner = await authentication.register('owner@example.com', 'Owner', TEST_PASSWORD);
    const stranger = await authentication.register(
      'stranger@example.com',
      'Stranger',
      TEST_PASSWORD,
    );

    await expect(
      authentication.revokeSession(owner.user.id, stranger.sessionId, owner.sessionId),
    ).rejects.toMatchObject({ message: SESSION_NOT_FOUND_MESSAGE });
    await expect(
      authentication.revokeSession(
        owner.user.id,
        '00000000-0000-4000-8000-000000000000',
        owner.sessionId,
      ),
    ).rejects.toMatchObject({ message: SESSION_NOT_FOUND_MESSAGE });
    await expect(authentication.validateToken(stranger.accessToken)).resolves.toMatchObject({
      sessionId: stranger.sessionId,
    });
  });

  it('revokes every other session and leaves the current session active', async () => {
    const { authentication } = createAuthentication();
    const current = await authentication.register('others@example.com', 'Others', TEST_PASSWORD);
    const other = await authentication.login('others@example.com', TEST_PASSWORD);

    const result = await authentication.revokeOtherSessions(current.user.id, current.sessionId);
    expect(result.revokedCount).toBe(1);

    await expect(authentication.validateToken(other.accessToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });
    await expect(authentication.refresh(other.refreshToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });
    await expect(authentication.validateToken(current.accessToken)).resolves.toMatchObject({
      sessionId: current.sessionId,
    });
    await expect(authentication.refresh(current.refreshToken)).resolves.toMatchObject({
      user: { id: current.user.id },
    });
  });

  it('signs out everywhere, including the current session', async () => {
    const logger = new RecordingLogger();
    const { authentication } = createAuthentication({ logger });
    const current = await authentication.register('all@example.com', 'All', TEST_PASSWORD);
    const other = await authentication.login('all@example.com', TEST_PASSWORD);

    await expect(
      authentication.revokeAllSessions(current.user.id, current.sessionId),
    ).resolves.toEqual({ endedCurrent: true });

    await expect(authentication.validateToken(current.accessToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });
    await expect(authentication.refresh(current.refreshToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });
    await expect(authentication.refresh(other.refreshToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });

    const serialized = JSON.stringify(logger.entries);
    expect(serialized).not.toContain(current.accessToken);
    expect(serialized).not.toContain(current.refreshToken);
    expect(logger.entries.some((entry) => entry.context?.outcome === 'revoke-all')).toBe(true);
  });

  it('does not claim recovery was sent when host mail is off', async () => {
    const mail = new CapturingHostMail(false);
    const { authentication } = createAuthentication({ mail });
    await authentication.register('off@example.com', 'Off', TEST_PASSWORD);

    const result = await authentication.requestPasswordReset('off@example.com');
    expect(result).toEqual({
      outcome: 'unavailable',
      message: RECOVERY_UNAVAILABLE_MESSAGE,
    });
    expect(authentication.recoveryStatus().available).toBe(false);
    expect(mail.messages).toEqual([]);
    expect(JSON.stringify(result)).not.toContain('token=');
  });

  it('accepts recovery for known and unknown emails with the same public message', async () => {
    const mail = new CapturingHostMail(true);
    const logger = new RecordingLogger();
    const { authentication } = createAuthentication({ mail, logger });
    await authentication.register('known@example.com', 'Known', TEST_PASSWORD);

    const known = await authentication.requestPasswordReset('known@example.com');
    const unknown = await authentication.requestPasswordReset('missing@example.com');
    expect(known).toEqual({ outcome: 'accepted', message: RECOVERY_ACCEPTED_MESSAGE });
    expect(unknown).toEqual(known);
    expect(mail.messages).toHaveLength(1);
    expect(mail.messages[0]?.to).toBe('known@example.com');
    expect(mail.messages[0]?.resetUrl).toContain('/reset-password?token=');
    expect(JSON.stringify(known)).not.toContain(mail.messages[0]?.resetUrl);
    const serialized = JSON.stringify(logger.entries);
    expect(serialized).not.toContain(mail.messages[0]?.resetUrl.split('token=')[1]);
    expect(serialized).not.toContain(TEST_PASSWORD);
  });

  it('resets the password once, revokes sessions, and rejects the old password', async () => {
    const mail = new CapturingHostMail(true);
    const { authentication } = createAuthentication({ mail });
    const issued = await authentication.register('reset@example.com', 'Reset', TEST_PASSWORD);
    const other = await authentication.login('reset@example.com', TEST_PASSWORD);
    await authentication.requestPasswordReset('reset@example.com');
    const token = new URL(mail.messages[0]!.resetUrl).searchParams.get('token')!;

    await expect(authentication.resetPassword(token, NEXT_PASSWORD)).resolves.toEqual({ ok: true });
    await expect(authentication.resetPassword(token, NEXT_PASSWORD)).rejects.toMatchObject({
      message: INVALID_RECOVERY_MESSAGE,
    });
    await expect(authentication.validateToken(issued.accessToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });
    await expect(authentication.refresh(other.refreshToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });
    await expect(authentication.login('reset@example.com', TEST_PASSWORD)).rejects.toMatchObject({
      message: INVALID_LOGIN_MESSAGE,
    });
    const signedIn = await authentication.login('reset@example.com', NEXT_PASSWORD);
    expect(signedIn.user.email).toBe('reset@example.com');
  });

  it('rejects an expired recovery token', async () => {
    const clock = new ManualClock();
    const mail = new CapturingHostMail(true);
    const { authentication } = createAuthentication({ clock, mail });
    await authentication.register('exp@example.com', 'Exp', TEST_PASSWORD);
    await authentication.requestPasswordReset('exp@example.com');
    const token = new URL(mail.messages[0]!.resetUrl).searchParams.get('token')!;
    clock.advance(RESET_TOKEN_TTL_MS + 1);
    await expect(authentication.resetPassword(token, NEXT_PASSWORD)).rejects.toMatchObject({
      message: INVALID_RECOVERY_MESSAGE,
    });
  });

  it('changes password while signed in and ends other sessions', async () => {
    const { authentication } = createAuthentication();
    const current = await authentication.register('chg@example.com', 'Chg', TEST_PASSWORD);
    const other = await authentication.login('chg@example.com', TEST_PASSWORD);

    await expect(
      authentication.changePassword(
        current.user.id,
        current.sessionId,
        WRONG_PASSWORD,
        NEXT_PASSWORD,
      ),
    ).rejects.toMatchObject({ message: CURRENT_PASSWORD_INCORRECT_MESSAGE });

    await authentication.changePassword(
      current.user.id,
      current.sessionId,
      TEST_PASSWORD,
      NEXT_PASSWORD,
    );

    await expect(authentication.validateToken(other.accessToken)).rejects.toMatchObject({
      message: INVALID_SESSION_MESSAGE,
    });
    await expect(authentication.validateToken(current.accessToken)).resolves.toMatchObject({
      sessionId: current.sessionId,
    });
    await expect(authentication.login('chg@example.com', TEST_PASSWORD)).rejects.toMatchObject({
      message: INVALID_LOGIN_MESSAGE,
    });
    await expect(authentication.login('chg@example.com', NEXT_PASSWORD)).resolves.toMatchObject({
      user: { email: 'chg@example.com' },
    });
  });
});
