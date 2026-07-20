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
import { PasswordCredentialStore } from './password-credential.store';

const TEST_PASSWORD = 'password-123';

describe('AuthenticationService (US106, US107)', () => {
  let users: UserDomainService;
  let authentication: AuthenticationService;
  let jwt: JwtService;
  let credentials: PasswordCredentialStore;

  beforeEach(() => {
    users = new UserDomainService(new InMemoryUserRepository());
    credentials = new PasswordCredentialStore();
    jwt = new JwtService({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    });
    const config = {
      get: (key: string) => (key === 'JWT_EXPIRES_IN' ? '1h' : undefined),
    } as ConfigService;

    authentication = new AuthenticationService(users, jwt, config, credentials, new NoOpLogger());
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

  it('login issues JWT for existing active user with correct password', async () => {
    await authentication.register('b@example.com', 'B', TEST_PASSWORD);

    const result = await authentication.login('B@Example.com', TEST_PASSWORD);

    expect(result.user.email).toBe('b@example.com');
    expect(result.user.role).toBe(Role.Researcher);
    expect(result.accessToken.length).toBeGreaterThan(0);
  });

  it('login rejects wrong password', async () => {
    await authentication.register('b@example.com', 'B', TEST_PASSWORD);

    await expect(authentication.login('b@example.com', 'wrong-password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('login rejects unknown or disabled users', async () => {
    await expect(authentication.login('missing@example.com', TEST_PASSWORD)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    const created = await authentication.register('c@example.com', 'C', TEST_PASSWORD);
    users.disable(created.user.id);

    await expect(authentication.login('c@example.com', TEST_PASSWORD)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('validateToken accepts signed JWT and resolves AuthUser with role', async () => {
    const issued = await authentication.register('d@example.com', 'D', TEST_PASSWORD);

    const authUser = await authentication.validateToken(issued.accessToken);

    expect(authUser).toEqual({
      userId: issued.user.id,
      email: 'd@example.com',
      displayName: 'D',
      role: Role.Researcher,
    });
  });

  it('validateToken rejects invalid or disabled-user tokens', async () => {
    await expect(authentication.validateToken('not-a-jwt')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    const issued = await authentication.register('e@example.com', 'E', TEST_PASSWORD);
    users.disable(issued.user.id);

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

  it('issued JWT role follows Identity role changes', async () => {
    const admin = users.create({
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
});
