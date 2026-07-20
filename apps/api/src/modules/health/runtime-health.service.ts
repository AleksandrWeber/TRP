import { Injectable } from '@nestjs/common';
import { ApiHealthCheck } from './api-health-check';
import { DatabaseHealthCheck } from './database-health-check';
import { PrismaMigrationCheck } from './prisma-migration-check';
import { createRuntimeHealthReport, type RuntimeHealthReport } from './runtime-health-report';
import { VersionCheck } from './version-check';

/**
 * Aggregates runtime health checks for GET /health (RC-01).
 */
@Injectable()
export class RuntimeHealthService {
  constructor(
    private readonly apiHealthCheck: ApiHealthCheck,
    private readonly databaseHealthCheck: DatabaseHealthCheck,
    private readonly prismaMigrationCheck: PrismaMigrationCheck,
    private readonly versionCheck: VersionCheck,
  ) {}

  async check(env: NodeJS.ProcessEnv = process.env): Promise<RuntimeHealthReport> {
    const [api, database, migrations, version] = await Promise.all([
      Promise.resolve(this.apiHealthCheck.check()),
      this.databaseHealthCheck.check(),
      this.prismaMigrationCheck.check(),
      Promise.resolve(this.versionCheck.check(env)),
    ]);

    return createRuntimeHealthReport({
      version: version.version,
      uptime: version.uptimeSeconds,
      database: database.status,
      migrations: migrations.status,
      api: api.status,
      timestamp: new Date().toISOString(),
      environment: version.environment,
      details: {
        api: api.detail,
        database: database.detail,
        migrations: migrations.detail,
        version: version.detail,
        controllersRegistered: api.controllersRegistered,
        pendingMigrations: migrations.pending,
      },
    });
  }
}

/** @deprecated Prefer RuntimeHealthService — retained for module wiring clarity. */
export { RuntimeHealthService as HealthService };
