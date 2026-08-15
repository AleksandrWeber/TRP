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
 * Historical US002A helper. PC-18 unwired this from IdentityModule.
 * The gate is always closed — it must not create a shared admin account.
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

  async onModuleInit(): Promise<void> {
    await this.ensureDevelopmentIdentity();
  }

  /**
   * No-op: development identity is not bootstrapped on the product path (PC-18).
   */
  async ensureDevelopmentIdentity(env: NodeJS.ProcessEnv = process.env): Promise<void> {
    if (!shouldBootstrapDevelopmentIdentity(env)) return;

    if (this.users.getByEmail(DEVELOPMENT_IDENTITY_EMAIL)) {
      return;
    }

    const user = await this.users.create({
      email: DEVELOPMENT_IDENTITY_EMAIL,
      displayName: DEVELOPMENT_IDENTITY_DISPLAY_NAME,
      role: Role.Admin,
    });

    this.logger.info(`Bootstrapped development identity ${user.email}`, {
      userId: user.id,
    });
  }
}
