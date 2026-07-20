import { Module } from '@nestjs/common';
import { ApiHealthCheck } from './api-health-check';
import { DatabaseHealthCheck } from './database-health-check';
import { PrismaMigrationCheck } from './prisma-migration-check';
import { RuntimeHealthController } from './runtime-health.controller';
import { RuntimeHealthService } from './runtime-health.service';
import { StartupVerification } from './startup-verification';
import { VersionCheck } from './version-check';

@Module({
  controllers: [RuntimeHealthController],
  providers: [
    ApiHealthCheck,
    DatabaseHealthCheck,
    PrismaMigrationCheck,
    VersionCheck,
    RuntimeHealthService,
    StartupVerification,
  ],
  exports: [RuntimeHealthService, StartupVerification],
})
export class HealthModule {}
