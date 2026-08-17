import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Logger } from '../logging/logger';
import { LOGGER } from '../logging/logger.token';
import { Inject } from '@nestjs/common';
import {
  assertSecurityPlatformBoot,
  loadSecurityPlatformConfig,
  verifySecurityPlatformConfig,
} from './security-config';

/**
 * Nest lifecycle hook that records platform security bootstrap completion.
 * Production fail-closed checks also run in main.ts before the server listens.
 */
@Injectable()
export class SecurityPlatformBootstrap implements OnApplicationBootstrap {
  private readonly logger: Logger;

  constructor(@Inject(LOGGER) logger: Logger) {
    this.logger = logger.child(SecurityPlatformBootstrap.name);
  }

  onApplicationBootstrap(): void {
    const config = loadSecurityPlatformConfig();
    const verification = verifySecurityPlatformConfig();

    if (!verification.valid && !config.isProduction) {
      this.logger.warn('Security platform started with configuration issues (non-production)', {
        issues: verification.issues,
      });
      return;
    }

    this.logger.info('Security platform foundation ready', {
      nodeEnv: config.nodeEnv,
      exposeErrorDetail: config.exposeErrorDetail,
    });
  }
}

export { assertSecurityPlatformBoot };
