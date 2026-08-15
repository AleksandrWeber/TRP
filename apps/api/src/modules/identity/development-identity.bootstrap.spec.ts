import { beforeEach, describe, expect, it } from 'vitest';
import { NoOpLogger } from '../../logging/noop.logger';
import { DevelopmentIdentityBootstrap } from './development-identity.bootstrap';
import {
  DEVELOPMENT_IDENTITY_EMAIL,
  shouldBootstrapDevelopmentIdentity,
} from './development-identity';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';
import { UserDomainService } from './user-domain.service';

describe('DevelopmentIdentityBootstrap (PC-18)', () => {
  let users: UserDomainService;
  let bootstrap: DevelopmentIdentityBootstrap;

  beforeEach(() => {
    users = new UserDomainService(new InMemoryUserRepository());
    bootstrap = new DevelopmentIdentityBootstrap(users, new NoOpLogger());
  });

  it('shouldBootstrapDevelopmentIdentity is always false', () => {
    expect(shouldBootstrapDevelopmentIdentity({ NODE_ENV: 'development' })).toBe(false);
    expect(shouldBootstrapDevelopmentIdentity({})).toBe(false);
    expect(shouldBootstrapDevelopmentIdentity({ NODE_ENV: 'production' })).toBe(false);
    expect(shouldBootstrapDevelopmentIdentity({ NODE_ENV: 'test' })).toBe(false);
    expect(shouldBootstrapDevelopmentIdentity({ NODE_ENV: 'development', VITEST: 'true' })).toBe(
      false,
    );
  });

  it('does not create a development identity in any environment', async () => {
    await bootstrap.ensureDevelopmentIdentity({ NODE_ENV: 'development' });
    await bootstrap.ensureDevelopmentIdentity({ NODE_ENV: 'production' });
    await bootstrap.ensureDevelopmentIdentity({ NODE_ENV: 'test' });

    expect(users.getByEmail(DEVELOPMENT_IDENTITY_EMAIL)).toBeNull();
  });
});
