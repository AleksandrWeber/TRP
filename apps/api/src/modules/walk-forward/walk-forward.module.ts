import { Module } from '@nestjs/common';
import { BacktestingModule } from '../backtesting/backtesting.module';
import { MarketDataProviderModule } from '../market-data-provider/market-data-provider.module';
import { WalkForwardEngine } from './walk-forward-engine';

/**
 * Walk-Forward analysis Nest module (US119).
 * Reuses BacktestEngine — no optimization / paper trading / REST / Prisma.
 */
@Module({
  imports: [MarketDataProviderModule, BacktestingModule],
  providers: [WalkForwardEngine],
  exports: [WalkForwardEngine],
})
export class WalkForwardModule {}
