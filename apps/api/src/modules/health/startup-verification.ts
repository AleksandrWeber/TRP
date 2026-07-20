import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Logger } from '../../logging/logger';
import { LOGGER } from '../../logging/logger.token';
import { ApiHealthCheck } from './api-health-check';
import { verifyConfigurationValidity } from './configuration-validity';
import { DatabaseHealthCheck } from './database-health-check';
import { PrismaMigrationCheck } from './prisma-migration-check';
import { shouldFailStartupOnVerificationError } from './runtime-environment';
import { VersionCheck } from './version-check';

export class StartupVerificationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Startup verification failed: ${issues.join('; ')}`);
    this.name = 'StartupVerificationError';
    this.issues = issues;
  }
}

export type StartupVerificationResult = Readonly<{
  ok: boolean;
  issues: readonly string[];
  warnings: readonly string[];
  version: string;
  environment: string;
  database: string;
  migrations: string;
  controllersRegistered: number;
  modulesRegistered: number;
}>;

/**
 * Verifies Prisma connectivity, migration consistency, and configuration
 * during application bootstrap (RC-01).
 *
 * Production terminates startup on failure.
 * Development may emit warnings instead.
 */
@Injectable()
export class StartupVerification implements OnApplicationBootstrap {
  private readonly logger: Logger;

  constructor(
    private readonly apiHealthCheck: ApiHealthCheck,
    private readonly databaseHealthCheck: DatabaseHealthCheck,
    private readonly prismaMigrationCheck: PrismaMigrationCheck,
    private readonly versionCheck: VersionCheck,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(StartupVerification.name);
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.verify();
  }

  /**
   * Exposed for unit tests without Nest lifecycle.
   */
  async verify(env: NodeJS.ProcessEnv = process.env): Promise<StartupVerificationResult> {
    const version = this.versionCheck.check(env);
    const api = this.apiHealthCheck.check();
    const database = await this.databaseHealthCheck.check();
    const migrations = await this.prismaMigrationCheck.check();
    const configuration = verifyConfigurationValidity(env);

    const issues: string[] = [];
    const warnings: string[] = [];

    if (database.status === 'down') {
      issues.push(database.detail);
    }

    if (database.status === 'up') {
      if (
        migrations.status === 'pending' ||
        migrations.status === 'drift' ||
        migrations.status === 'unavailable'
      ) {
        issues.push(migrations.detail);
      }
    }

    if (!configuration.valid) {
      issues.push(...configuration.issues);
    }

    if (api.status === 'down') {
      issues.push(api.detail);
    }

    const result: StartupVerificationResult = {
      ok: issues.length === 0,
      issues,
      warnings,
      version: version.version,
      environment: version.environment,
      database: database.status,
      migrations: migrations.status,
      controllersRegistered: api.controllersRegistered,
      modulesRegistered: api.modulesRegistered,
    };

    this.logStartupSummary(result, api.registeredModules);

    if (!result.ok) {
      const failHard = shouldFailStartupOnVerificationError(env);
      if (failHard) {
        this.logger.error('Startup verification failed', {
          issues: result.issues,
        });
        throw new StartupVerificationError(result.issues);
      }

      this.logger.warn('Startup verification issues (non-fatal in development)', {
        issues: result.issues,
        warnings: result.warnings,
      });
      return result;
    }

    if (result.warnings.length > 0) {
      this.logger.warn('Startup verification completed with warnings', {
        warnings: result.warnings,
      });
    } else {
      this.logger.info('Startup verification passed', {
        version: result.version,
        database: result.database,
        migrations: result.migrations,
      });
    }

    return result;
  }

  private logStartupSummary(
    result: StartupVerificationResult,
    registeredModules: readonly string[],
  ): void {
    this.logger.info('Application startup status', {
      version: result.version,
      environment: result.environment,
      database: result.database,
      migrations: result.migrations,
      controllersRegistered: result.controllersRegistered,
      modulesRegistered: result.modulesRegistered,
      registeredModules,
      healthStatus: result.ok ? 'ok' : 'failed',
      issues: result.issues,
      warnings: result.warnings,
    });
  }
}
