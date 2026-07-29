import { Module } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EventProcessingModule } from '../event-processing';
import { StrategyDeploymentModule } from '../strategy-deployment';
import { WorkspaceModule } from '../workspace';
import { PrismaSignalIntentRepository } from './persistence/prisma-signal-intent.repository';
import { PrismaStrategyCheckpointRepository } from './persistence/prisma-strategy-checkpoint.repository';
import { SIGNAL_INTENT_REPOSITORY } from './persistence/signal-intent.repository';
import { STRATEGY_CHECKPOINT_REPOSITORY } from './persistence/strategy-checkpoint.repository';
import { STRATEGY_RUNTIME_PORT } from './ports/strategy-runtime.port';
import { RuntimeEvaluationService } from './runtime-evaluation.service';
import { RuntimeLifecycleCoordinator } from './runtime-lifecycle.coordinator';
import { SignalIntentController } from './signal-intent.controller';
import { SignalIntentService } from './signal-intent.service';
import { StrategyCheckpointService } from './strategy-checkpoint.service';
import { StrategyRuntimeService } from './strategy-runtime.service';

/**
 * Strategy Runtime bounded context (US214–US220 / ADR-017).
 * Owns evaluation pipeline, lifecycle drain, Signal Intent, Strategy Checkpoint,
 * and semantic closed-candle tick admission. Depends on Strategy Deployment +
 * Event Processing only among domain modules.
 * Forbidden: Orders, Risk, Execution, Fill, Ledger, Portfolio, Trading Session.
 */
@Module({
  imports: [EventProcessingModule, StrategyDeploymentModule, AuthModule, WorkspaceModule],
  controllers: [SignalIntentController],
  providers: [
    {
      provide: SIGNAL_INTENT_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaSignalIntentRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: STRATEGY_CHECKPOINT_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaStrategyCheckpointRepository(prisma),
      inject: [PrismaService],
    },
    SignalIntentService,
    StrategyCheckpointService,
    RuntimeLifecycleCoordinator,
    RuntimeEvaluationService,
    StrategyRuntimeService,
    {
      provide: STRATEGY_RUNTIME_PORT,
      useExisting: StrategyRuntimeService,
    },
  ],
  exports: [
    SIGNAL_INTENT_REPOSITORY,
    STRATEGY_CHECKPOINT_REPOSITORY,
    SignalIntentService,
    StrategyCheckpointService,
    RuntimeLifecycleCoordinator,
    RuntimeEvaluationService,
    StrategyRuntimeService,
    STRATEGY_RUNTIME_PORT,
  ],
})
export class StrategyRuntimeModule {}
