import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SignalEngineModule } from '../signal-engine';
import { StrategiesModule } from '../strategies';
import { WorkspaceModule } from '../workspace';
import { EvaluationSchedulerController } from './evaluation-scheduler.controller';
import { EvaluationSchedulerErrorFilter } from './evaluation-scheduler-error.filter';
import { EvaluationSchedulerService } from './evaluation-scheduler.service';

/**
 * Evaluation Scheduler Nest module (US015).
 * Periodic, per-strategy Signal Engine evaluation. No paper trading, orders,
 * risk, or notifications — the scheduler only triggers evaluations.
 */
@Module({
  imports: [SignalEngineModule, StrategiesModule, WorkspaceModule],
  controllers: [EvaluationSchedulerController],
  providers: [
    EvaluationSchedulerService,
    {
      provide: APP_FILTER,
      useClass: EvaluationSchedulerErrorFilter,
    },
  ],
  exports: [EvaluationSchedulerService],
})
export class EvaluationSchedulerModule {}
