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
import { PrismaUserRepository } from '../../modules/identity/repositories/prisma-user.repository';
import { UserDomainService } from '../../modules/identity/user-domain.service';
import { Role } from '../../modules/identity/role';
import { NoOpLogger } from '../../logging/noop.logger';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

const ADMIN_EMAIL = 's02c-admin@example.com';
const OPERATOR_EMAIL = 's02c-operator@example.com';

/**
 * V3-S02-c: assigned Identity role survives process restart and appears on /me.
 */
describe('V3-S02-c — role assignment survives restart', () => {
  const prisma = new PrismaClient();

  beforeAll(() => prisma.$connect());
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    const emails = [ADMIN_EMAIL, OPERATOR_EMAIL];
    const rows = await prisma.user.findMany({ where: { email: { in: emails } } });
    const ids = rows.map((row) => row.id);
    if (ids.length > 0) {
      await prisma.authSession.deleteMany({ where: { userId: { in: ids } } });
      await prisma.authLoginLockout.deleteMany({ where: { userId: { in: ids } } });
      await prisma.authPasswordReset.deleteMany({ where: { userId: { in: ids } } });
    }
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
  }

  function createStack() {
    const users = new UserDomainService(new PrismaUserRepository(prisma));
    const credentials = new PasswordCredentialStore(new PrismaPasswordCredentialRepository(prisma));
    const lockouts = new LoginLockoutStore(new PrismaLoginLockoutRepository(prisma));
    const sessions = new AuthSessionStore(new PrismaAuthSessionRepository(prisma));
    const resets = new PasswordResetStore(new PrismaPasswordResetRepository(prisma));
    const mail = new CapturingHostMail(true);
    const jwt = new JwtService({
      secret: 's02c-test-secret',
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
    return { users, authentication };
  }

  it('assigns Trader and hydrates the new process with that Identity role', async () => {
    const original = createStack();
    await original.users.create({
      email: ADMIN_EMAIL,
      displayName: 'S02c Admin',
      role: Role.Admin,
    });
    const operator = await original.users.create({
      email: OPERATOR_EMAIL,
      displayName: 'S02c Operator',
    });

    await original.users.assignRole(operator.id, Role.Trader);
    expect(original.authentication.me(operator.id).role).toBe(Role.Trader);

    const restarted = createStack();
    await restarted.users.onModuleInit();

    expect(restarted.users.getById(operator.id)?.role).toBe(Role.Trader);
    expect(restarted.authentication.me(operator.id).role).toBe(Role.Trader);
  });
});
