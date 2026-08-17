import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NoOpLogger } from '../../logging/noop.logger';
import { InMemoryUserRepository } from '../identity/repositories/in-memory-user.repository';
import { UserDomainService } from '../identity/user-domain.service';
import { AuthenticationService } from '../auth/authentication.service';
import { InMemoryAuthSessionRepository } from '../auth/in-memory-auth-session.repository';
import { InMemoryLoginLockoutRepository } from '../auth/in-memory-login-lockout.repository';
import { InMemoryPasswordCredentialRepository } from '../auth/in-memory-password-credential.repository';
import { InMemoryPasswordResetRepository } from '../auth/in-memory-password-reset.repository';
import { AuthSessionStore } from '../auth/auth-session.store';
import { CapturingHostMail } from '../auth/host-mail';
import { LoginLockoutStore } from '../auth/login-lockout.store';
import { PasswordCredentialStore } from '../auth/password-credential.store';
import { PasswordResetStore } from '../auth/password-reset.store';

export const ISOLATION_TEST_CREDENTIAL = 'isolation-fixture-credential-1';

/** Minimal Authentication stack for S06 isolation regressions. */
export function createIsolationAuthentication() {
  const users = new UserDomainService(new InMemoryUserRepository());
  const credentials = new PasswordCredentialStore(new InMemoryPasswordCredentialRepository());
  const lockouts = new LoginLockoutStore(new InMemoryLoginLockoutRepository());
  const sessions = new AuthSessionStore(new InMemoryAuthSessionRepository());
  const resets = new PasswordResetStore(new InMemoryPasswordResetRepository());
  const mail = new CapturingHostMail(true);
  const jwt = new JwtService({ secret: 'isolation-test-secret', signOptions: { expiresIn: '1h' } });
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
  return { authentication, sessions };
}
