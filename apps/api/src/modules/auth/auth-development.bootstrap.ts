import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { Logger } from '../../logging/logger';
import { LOGGER } from '../../logging/logger.token';
import {
  DEVELOPMENT_IDENTITY_EMAIL,
  shouldBootstrapDevelopmentIdentity,
} from '../identity/development-identity';
import { UserDomainService } from '../identity/user-domain.service';
import { AuthenticationService } from './authentication.service';

/**
 * Historical development password bootstrap. PC-18 unwired this from AuthModule.
 * Shared admin passwords are not assigned at runtime.
 */
@Injectable()
export class AuthDevelopmentBootstrap implements OnModuleInit {
  private readonly logger: Logger;

  constructor(
    @Inject(UserDomainService) private readonly users: UserDomainService,
    @Inject(AuthenticationService) private readonly authentication: AuthenticationService,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(AuthDevelopmentBootstrap.name);
  }

  async onModuleInit(): Promise<void> {
    await this.ensureDevelopmentPassword();
  }

  async ensureDevelopmentPassword(env: NodeJS.ProcessEnv = process.env): Promise<void> {
    if (!shouldBootstrapDevelopmentIdentity(env)) return;

    const user = this.users.getByEmail(DEVELOPMENT_IDENTITY_EMAIL);
    if (!user) return;

    const password = env.SEED_USER_PASSWORD?.trim() || 'trp-admin-change-me';
    await this.authentication.setPassword(user.id, password);
    this.logger.info(`Bootstrapped development credentials for ${user.email}`, {
      userId: user.id,
    });
  }
}
