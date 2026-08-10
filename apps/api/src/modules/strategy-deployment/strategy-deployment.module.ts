import { Module } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EventProcessingModule } from '../event-processing';
import { RuntimeEnforcementModule } from '../runtime-enforcement';
import { StrategiesModule } from '../strategies';
import { WorkspaceModule } from '../workspace';
import { PrismaStrategyDeploymentRepository } from './persistence/prisma-strategy-deployment.repository';
import { STRATEGY_DEPLOYMENT_REPOSITORY } from './persistence/strategy-deployment.repository';
import { StrategyDeploymentController } from './strategy-deployment.controller';
import { StrategyDeploymentService } from './strategy-deployment.service';

/**
 * Strategy Deployment bounded context (US211 / ADR-014 / ADR-017 / RC-23 Epic 4).
 * Immutable approved configuration owner.
 *
 * RC-23: consumes Runtime Enforcement Gate on create/approve (read-only validation).
 * No Session lifecycle ownership. No Library SoT ownership.
 * No Orders / Risk evaluation / Execution Engine dependencies.
 */
@Module({
  imports: [
    EventProcessingModule,
    StrategiesModule,
    AuthModule,
    WorkspaceModule,
    RuntimeEnforcementModule,
  ],
  controllers: [StrategyDeploymentController],
  providers: [
    {
      provide: STRATEGY_DEPLOYMENT_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaStrategyDeploymentRepository(prisma),
      inject: [PrismaService],
    },
    StrategyDeploymentService,
  ],
  exports: [STRATEGY_DEPLOYMENT_REPOSITORY, StrategyDeploymentService],
})
export class StrategyDeploymentModule {}
