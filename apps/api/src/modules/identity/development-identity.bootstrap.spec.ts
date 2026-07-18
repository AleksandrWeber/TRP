import { beforeEach, describe, expect, it } from 'vitest';
import { NoOpLogger } from '../../logging/noop.logger';
import { DevelopmentIdentityBootstrap } from './development-identity.bootstrap';
import {
  DEVELOPMENT_IDENTITY_EMAIL,
  shouldBootstrapDevelopmentIdentity,
} from './development-identity';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';
import { Role } from './role';
import { UserDomainService } from './user-domain.service';

describe('DevelopmentIdentityBootstrap (US002A)', () => {
  let users: UserDomainService;
  let bootstrap: DevelopmentIdentityBootstrap;

  beforeEach(() => {
    users = new UserDomainService(new InMemoryUserRepository());
    bootstrap = new DevelopmentIdentityBootstrap(users, new NoOpLogger());
  });

  it('shouldBootstrapDevelopmentIdentity is true only for development', () => {
    expect(shouldBootstrapDevelopmentIdentity({ NODE_ENV: 'development' })).toBe(true);
    expect(shouldBootstrapDevelopmentIdentity({})).toBe(true);
    expect(shouldBootstrapDevelopmentIdentity({ NODE_ENV: 'production' })).toBe(false);
    expect(shouldBootstrapDevelopmentIdentity({ NODE_ENV: 'test' })).toBe(false);
    expect(shouldBootstrapDevelopmentIdentity({ NODE_ENV: 'development', VITEST: 'true' })).toBe(
      false,
    );
  });

  it('creates the canonical development identity when missing', () => {
    bootstrap.ensureDevelopmentIdentity({ NODE_ENV: 'development' });

    const user = users.getByEmail(DEVELOPMENT_IDENTITY_EMAIL);
    expect(user).toMatchObject({
      email: DEVELOPMENT_IDENTITY_EMAIL,
      displayName: 'Admin',
      role: Role.Admin,
    });
  });

  it('is idempotent across repeated calls', () => {
    bootstrap.ensureDevelopmentIdentity({ NODE_ENV: 'development' });
    const first = users.getByEmail(DEVELOPMENT_IDENTITY_EMAIL);
    bootstrap.ensureDevelopmentIdentity({ NODE_ENV: 'development' });
    bootstrap.ensureDevelopmentIdentity({ NODE_ENV: 'development' });

    expect(users.getByEmail(DEVELOPMENT_IDENTITY_EMAIL)?.id).toBe(first?.id);
  });

  it('does nothing outside development', () => {
    bootstrap.ensureDevelopmentIdentity({ NODE_ENV: 'production' });
    expect(users.getByEmail(DEVELOPMENT_IDENTITY_EMAIL)).toBeNull();

    bootstrap.ensureDevelopmentIdentity({ NODE_ENV: 'test' });
    expect(users.getByEmail(DEVELOPMENT_IDENTITY_EMAIL)).toBeNull();
  });
});
