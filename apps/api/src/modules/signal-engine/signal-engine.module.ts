import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { MarketDataCacheModule } from '../market-data-cache/market-data-cache.module';
import { MarketDataDomainModule } from '../market-data-domain';
import { StrategiesModule } from '../strategies';
import { WorkspaceModule } from '../workspace';
import { DummyStrategyEvaluator } from './evaluators/dummy-strategy-evaluator';
import { SignalEngineController } from './signal-engine.controller';
import { SignalEngineErrorFilter } from './signal-engine-error.filter';
import { SignalEngineService } from './signal-engine.service';
import { SignalEvaluatorRegistry } from './signal-evaluator-registry';
import { StrategyRunner } from './strategy-runner';

/**
 * Signal Engine Nest module (US009).
 * On-request strategy evaluation: strategy → engine → cached candles →
 * evaluator → SignalResult. Consumes StrategyDomainService (US004) and
 * MarketDataCacheService (US008); providers are reached only through the
 * cache-miss loader, never directly. The evaluator registry ships with the
 * deterministic DummyStrategyEvaluator — indicator/AI evaluators register
 * here in later milestones. Scheduling is an external consumer (US015);
 * this module has no timers, persistence, or execution.
 */
@Module({
  imports: [StrategiesModule, WorkspaceModule, MarketDataCacheModule, MarketDataDomainModule],
  controllers: [SignalEngineController],
  providers: [
    {
      provide: SignalEvaluatorRegistry,
      useFactory: () => {
        const registry = new SignalEvaluatorRegistry();
        registry.register(new DummyStrategyEvaluator());
        return registry;
      },
    },
    StrategyRunner,
    SignalEngineService,
    {
      // Catches SignalEngineError only — all other exceptions keep their
      // existing handling.
      provide: APP_FILTER,
      useClass: SignalEngineErrorFilter,
    },
  ],
  exports: [SignalEngineService, SignalEvaluatorRegistry, StrategyRunner],
})
export class SignalEngineModule {}
