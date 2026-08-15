import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuthenticationService } from '../../modules/auth/authentication.service';
import { PasswordCredentialStore } from '../../modules/auth/password-credential.store';
import { PrismaPasswordCredentialRepository } from '../../modules/auth/prisma-password-credential.repository';
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
    await prisma.user.deleteMany({ where: { email: EMAIL } });
  }

  function createStack() {
    const users = new UserDomainService(new PrismaUserRepository(prisma));
    const credentials = new PasswordCredentialStore(new PrismaPasswordCredentialRepository(prisma));
    const jwt = new JwtService({
      secret: 'pc18-test-secret',
      signOptions: { expiresIn: '1h' },
    });
    const config = {
      get: (key: string) => (key === 'JWT_EXPIRES_IN' ? '1h' : undefined),
    } as ConfigService;
    const authentication = new AuthenticationService(
      users,
      jwt,
      config,
      credentials,
      new NoOpLogger(),
    );
    return { users, credentials, authentication };
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
  });
});
