import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { Logger } from '../../logging/logger';
import { LOGGER } from '../../logging/logger.token';
import {
  DEVELOPMENT_IDENTITY_DISPLAY_NAME,
  DEVELOPMENT_IDENTITY_EMAIL,
  shouldBootstrapDevelopmentIdentity,
} from './development-identity';
import { Role } from './role';
import { UserDomainService } from './user-domain.service';

/**
 * Ensures the canonical development identity exists in the in-memory Identity store (US002A).
 * Runs once on module init in development only — never during login, never via Prisma.
 */
@Injectable()
export class DevelopmentIdentityBootstrap implements OnModuleInit {
  private readonly logger: Logger;

  constructor(
    @Inject(UserDomainService) private readonly users: UserDomainService,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(DevelopmentIdentityBootstrap.name);
  }

  onModuleInit(): void {
    this.ensureDevelopmentIdentity();
  }

  /**
   * Idempotent: create the canonical development user when missing; no-op when present.
   * Exposed for unit tests without Nest lifecycle.
   */
  ensureDevelopmentIdentity(env: NodeJS.ProcessEnv = process.env): void {
    if (!shouldBootstrapDevelopmentIdentity(env)) return;

    if (this.users.getByEmail(DEVELOPMENT_IDENTITY_EMAIL)) {
      return;
    }

    const user = this.users.create({
      email: DEVELOPMENT_IDENTITY_EMAIL,
      displayName: DEVELOPMENT_IDENTITY_DISPLAY_NAME,
      role: Role.Admin,
    });

    this.logger.info(`Bootstrapped development identity ${user.email}`, {
      userId: user.id,
    });
  }
}
