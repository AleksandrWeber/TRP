import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuthenticationService } from '../../modules/auth/authentication.service';
import { PasswordCredentialStore } from '../../modules/auth/password-credential.store';
import { PrismaPasswordCredentialRepository } from '../../modules/auth/prisma-password-credential.repository';
import { PrismaAuthSessionRepository } from '../../modules/auth/prisma-auth-session.repository';
import { PrismaLoginLockoutRepository } from '../../modules/auth/prisma-login-lockout.repository';
import { PrismaPasswordResetRepository } from '../../modules/auth/prisma-password-reset.repository';
import { PasswordResetStore } from '../../modules/auth/password-reset.store';
import { CapturingHostMail } from '../../modules/auth/host-mail';
import { AuthSessionStore } from '../../modules/auth/auth-session.store';
import { LoginLockoutStore } from '../../modules/auth/login-lockout.store';
import {
  INVALID_LOGIN_MESSAGE,
  LOGIN_LOCKOUT_MAX_FAILURES,
} from '../../modules/auth/login-lockout';
import { PrismaUserRepository } from '../../modules/identity/repositories/prisma-user.repository';
import { UserDomainService } from '../../modules/identity/user-domain.service';
import { NoOpLogger } from '../../logging/noop.logger';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

const EMAIL = 'pc18-identity@example.com';

/**
 * PC-18: durable Identity + credentials on the existing User table.
 * A second service pair simulates process restart.
 */
describe('PC-18 — Identity credentials survive restart', () => {
  const prisma = new PrismaClient();

  beforeAll(() => prisma.$connect());
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    const user = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (user) {
      await prisma.authSession.deleteMany({ where: { userId: user.id } });
      await prisma.authLoginLockout.deleteMany({ where: { userId: user.id } });
      await prisma.authPasswordReset.deleteMany({ where: { userId: user.id } });
    }
    await prisma.user.deleteMany({ where: { email: EMAIL } });
  }

  function createStack() {
    const users = new UserDomainService(new PrismaUserRepository(prisma));
    const credentials = new PasswordCredentialStore(new PrismaPasswordCredentialRepository(prisma));
    const lockouts = new LoginLockoutStore(new PrismaLoginLockoutRepository(prisma));
    const sessions = new AuthSessionStore(new PrismaAuthSessionRepository(prisma));
    const resets = new PasswordResetStore(new PrismaPasswordResetRepository(prisma));
    const mail = new CapturingHostMail(true);
    const jwt = new JwtService({
      secret: 'pc18-test-secret',
      signOptions: { expiresIn: '1h' },
    });
    const config = {
      get: (key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '1h';
        if (key === 'PUBLIC_APP_URL') return 'http://localhost:5173';
        return undefined;
      },
    } as ConfigService;
    const authentication = new AuthenticationService(
      users,
      jwt,
      config,
      credentials,
      lockouts,
      sessions,
      resets,
      mail,
      new NoOpLogger(),
    );
    return { users, credentials, authentication, mail };
  }

  it('register then hydrate a new process and login with the same password', async () => {
    const original = createStack();
    const registered = await original.authentication.register(EMAIL, 'PC-18 User', 'password-123');

    const restarted = createStack();
    await restarted.users.onModuleInit();
    await restarted.credentials.onModuleInit();

    const restored = restarted.users.getByEmail(EMAIL);
    expect(restored).toMatchObject({
      id: registered.user.id,
      email: EMAIL,
      displayName: 'PC-18 User',
    });

    const login = await restarted.authentication.login(EMAIL, 'password-123');
    expect(login.user.id).toBe(registered.user.id);
    expect(login.accessToken.length).toBeGreaterThan(0);
    expect(login.sessionId.length).toBeGreaterThan(0);

    const restartedAgain = createStack();
    await restartedAgain.users.onModuleInit();
    await restartedAgain.credentials.onModuleInit();
    await expect(
      restartedAgain.authentication.validateToken(login.accessToken),
    ).resolves.toMatchObject({ userId: registered.user.id, sessionId: login.sessionId });
  });

  it('login lockout survives a simulated process restart', async () => {
    const original = createStack();
    await original.authentication.register(EMAIL, 'PC-18 User', 'password-123');

    for (let i = 0; i < LOGIN_LOCKOUT_MAX_FAILURES; i += 1) {
      await expect(original.authentication.login(EMAIL, 'wrong-pass-1')).rejects.toMatchObject({
        message: INVALID_LOGIN_MESSAGE,
      });
    }

    const restarted = createStack();
    await restarted.users.onModuleInit();
    await restarted.credentials.onModuleInit();

    await expect(restarted.authentication.login(EMAIL, 'password-123')).rejects.toMatchObject({
      message: INVALID_LOGIN_MESSAGE,
    });
  });

  it('session list and revoke-others survive a simulated process restart', async () => {
    const original = createStack();
    const current = await original.authentication.register(EMAIL, 'PC-18 User', 'password-123');
    const other = await original.authentication.login(EMAIL, 'password-123');

    const restarted = createStack();
    await restarted.users.onModuleInit();
    await restarted.credentials.onModuleInit();

    const listed = await restarted.authentication.listSessions(current.user.id, current.sessionId);
    expect(listed.map((session) => session.id).sort()).toEqual(
      [current.sessionId, other.sessionId].sort(),
    );

    await restarted.authentication.revokeOtherSessions(current.user.id, current.sessionId);
    await expect(restarted.authentication.validateToken(other.accessToken)).rejects.toBeTruthy();
    await expect(
      restarted.authentication.validateToken(current.accessToken),
    ).resolves.toMatchObject({ sessionId: current.sessionId });
  });

  it('password reset token survives a simulated process restart', async () => {
    const original = createStack();
    await original.authentication.register(EMAIL, 'PC-18 User', 'password-123');
    await original.authentication.requestPasswordReset(EMAIL);
    const token = new URL(original.mail.messages[0]!.resetUrl).searchParams.get('token')!;

    const restarted = createStack();
    await restarted.users.onModuleInit();
    await restarted.credentials.onModuleInit();
    await restarted.authentication.resetPassword(token, 'newpass-456');

    await expect(restarted.authentication.login(EMAIL, 'password-123')).rejects.toMatchObject({
      message: INVALID_LOGIN_MESSAGE,
    });
    await expect(restarted.authentication.login(EMAIL, 'newpass-456')).resolves.toMatchObject({
      user: { email: EMAIL },
    });
  });
});
