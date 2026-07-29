import { Module } from '@nestjs/common';
import { CanonicalOrderPathModule } from '../canonical-order-path';
import { OrdersModule } from '../orders';
import { PositionsModule } from '../positions';
import { StrategyRuntimeModule } from '../strategy-runtime';
import {
  STRATEGY_TRADING_PIPELINE_PORT,
  StrategyTradingPipelineService,
} from './strategy-trading-pipeline.service';

/**
 * US223 — end-to-end closed-candle → Fill → accounting orchestration.
 * Reuses Runtime, Orders intake, canonical Risk/Execution path, and Position
 * accounting. Forbidden: strategy-specific accounting or execution forks.
 */
@Module({
  imports: [StrategyRuntimeModule, OrdersModule, CanonicalOrderPathModule, PositionsModule],
  providers: [
    StrategyTradingPipelineService,
    {
      provide: STRATEGY_TRADING_PIPELINE_PORT,
      useExisting: StrategyTradingPipelineService,
    },
  ],
  exports: [StrategyTradingPipelineService, STRATEGY_TRADING_PIPELINE_PORT],
})
export class StrategyTradingPipelineModule {}
