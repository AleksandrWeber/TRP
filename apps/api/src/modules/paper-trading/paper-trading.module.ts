import { Module } from '@nestjs/common';
import { MarketDataCacheModule } from '../market-data-cache';
import { MarketDataDomainModule } from '../market-data-domain';
import { SignalEngineModule } from '../signal-engine';
import { StrategiesModule } from '../strategies';
import { WorkspaceModule } from '../workspace';
import { PaperTradingController } from './paper-trading.controller';
import { PaperTradingEngine } from './paper-trading.engine';
import { PaperTradingService } from './paper-trading.service';
import { PnLCalculator } from './pnl-calculator';
import { PositionManager } from './position-manager';
import { PositionRegistry } from './position-registry';
import { TradeHistory } from './trade-history';

/**
 * Isolated, in-memory Paper Trading module (US010).
 * No real exchange orders, API keys, futures, margin, external persistence,
 * scheduling, polling, or automatic execution.
 */
@Module({
  imports: [
    WorkspaceModule,
    StrategiesModule,
    SignalEngineModule,
    MarketDataCacheModule,
    MarketDataDomainModule,
  ],
  controllers: [PaperTradingController],
  providers: [
    PositionRegistry,
    TradeHistory,
    PnLCalculator,
    PositionManager,
    PaperTradingEngine,
    PaperTradingService,
  ],
  exports: [
    PositionRegistry,
    TradeHistory,
    PnLCalculator,
    PositionManager,
    PaperTradingEngine,
    PaperTradingService,
  ],
})
export class PaperTradingModule {}
