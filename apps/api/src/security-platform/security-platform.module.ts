import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SecurityAuditModule } from '../modules/security-audit';
import { LoggingModule } from '../logging/logging.module';
import { PrismaService } from '../storage/prisma/prisma.module';
import { MONITORING_HEALTH_STATE_REPOSITORY } from './monitoring-health/domain/monitoring-health-state.repository';
import { MonitoringHealthPersistenceService } from './monitoring-health/monitoring-health-persistence.service';
import { MonitoringHealthRecoveryStore } from './monitoring-health/monitoring-health-recovery-store';
import { MonitoringHealthRestartRecoveryService } from './monitoring-health/monitoring-health-restart-recovery.service';
import { PrismaMonitoringHealthStateRepository } from './monitoring-health/persistence/prisma-monitoring-health-state.repository';
import { PlatformSecurityExceptionFilter } from './platform-security-exception.filter';
import { SecurityPlatformBootstrap } from './security-platform.bootstrap';

/**
 * Platform security foundation (V3-S04-a).
 * Extends Identity/Auth HTTP posture without inventing a new bounded context.
 */
@Global()
@Module({
  imports: [LoggingModule, SecurityAuditModule],
  providers: [
    SecurityPlatformBootstrap,
    {
      provide: MONITORING_HEALTH_STATE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaMonitoringHealthStateRepository(prisma),
      inject: [PrismaService],
    },
    MonitoringHealthPersistenceService,
    MonitoringHealthRecoveryStore,
    MonitoringHealthRestartRecoveryService,
    {
      provide: APP_FILTER,
      useClass: PlatformSecurityExceptionFilter,
    },
  ],
  exports: [
    MONITORING_HEALTH_STATE_REPOSITORY,
    MonitoringHealthPersistenceService,
    MonitoringHealthRecoveryStore,
    MonitoringHealthRestartRecoveryService,
  ],
})
export class SecurityPlatformModule {}
