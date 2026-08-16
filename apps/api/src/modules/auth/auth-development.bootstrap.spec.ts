import { describe, expect, it } from 'vitest';
import { NoOpLogger } from '../../logging/noop.logger';
import { InMemoryUserRepository } from '../identity/repositories/in-memory-user.repository';
import { UserDomainService } from '../identity/user-domain.service';
import { AuthDevelopmentBootstrap } from './auth-development.bootstrap';
import { AuthenticationService } from './authentication.service';
import { InMemoryPasswordCredentialRepository } from './in-memory-password-credential.repository';
import { PasswordCredentialStore } from './password-credential.store';
import { InMemoryAuthSessionRepository } from './in-memory-auth-session.repository';
import { InMemoryLoginLockoutRepository } from './in-memory-login-lockout.repository';
import { InMemoryPasswordResetRepository } from './in-memory-password-reset.repository';
import { AuthSessionStore } from './auth-session.store';
import { LoginLockoutStore } from './login-lockout.store';
import { PasswordResetStore } from './password-reset.store';
import { CapturingHostMail } from './host-mail';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DEVELOPMENT_IDENTITY_EMAIL } from '../identity/development-identity';

describe('AuthDevelopmentBootstrap (PC-18)', () => {
  it('does not assign a development password', async () => {
    const users = new UserDomainService(new InMemoryUserRepository());
    const credentials = new PasswordCredentialStore(new InMemoryPasswordCredentialRepository());
    const lockouts = new LoginLockoutStore(new InMemoryLoginLockoutRepository());
    const sessions = new AuthSessionStore(new InMemoryAuthSessionRepository());
    const resets = new PasswordResetStore(new InMemoryPasswordResetRepository());
    const mail = new CapturingHostMail(false);
    const jwt = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '1h' } });
    const config = { get: () => '1h' } as unknown as ConfigService;
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
    const bootstrap = new AuthDevelopmentBootstrap(users, authentication, new NoOpLogger());

    await bootstrap.ensureDevelopmentPassword({ NODE_ENV: 'development' });

    expect(users.getByEmail(DEVELOPMENT_IDENTITY_EMAIL)).toBeNull();
  });
});
