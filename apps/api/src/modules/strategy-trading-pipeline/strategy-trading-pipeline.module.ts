import { Module } from '@nestjs/common';
import { CanonicalOrderPathModule } from '../canonical-order-path';
import { EventProcessingModule } from '../event-processing';
import { LedgerModule } from '../ledger';
import { LiveMarketDataModule } from '../live-market-data';
import { OrdersModule } from '../orders';
import { PaperAccountModule } from '../paper-account';
import { PositionsModule } from '../positions';
import { ProductFlowModule } from '../product-flow';
import { StrategyDeploymentModule } from '../strategy-deployment';
import { StrategyRuntimeModule } from '../strategy-runtime';
import { TradingSessionModule } from '../trading-session';
import { PipelineCommandAssembler } from './pipeline-command.assembler';
import {
  STRATEGY_TRADING_PIPELINE_PORT,
  StrategyTradingPipelineService,
} from './strategy-trading-pipeline.service';
import { TradingSessionRuntimeWorker } from './trading-session-runtime.worker';

/**
 * US223 — end-to-end closed-candle → Fill → accounting orchestration.
 * Production Runtime Worker consumes MarketClosedCandle and calls run().
 * Reuses Runtime, Orders intake, canonical Risk/Execution path, Position
 * accounting, and existing Reporting / Notification / AI consumers.
 * Forbidden: strategy-specific accounting or execution forks.
 */
@Module({
  imports: [
    EventProcessingModule,
    StrategyRuntimeModule,
    OrdersModule,
    CanonicalOrderPathModule,
    PositionsModule,
    LedgerModule,
    PaperAccountModule,
    TradingSessionModule,
    StrategyDeploymentModule,
    LiveMarketDataModule,
    ProductFlowModule,
  ],
  providers: [
    StrategyTradingPipelineService,
    {
      provide: STRATEGY_TRADING_PIPELINE_PORT,
      useExisting: StrategyTradingPipelineService,
    },
    PipelineCommandAssembler,
    TradingSessionRuntimeWorker,
  ],
  exports: [
    StrategyTradingPipelineService,
    STRATEGY_TRADING_PIPELINE_PORT,
    PipelineCommandAssembler,
    TradingSessionRuntimeWorker,
  ],
})
export class StrategyTradingPipelineModule {}
