import { Module } from '@nestjs/common';
import { MarketDataProviderModule } from '../market-data-provider/market-data-provider.module';
import { PerformanceModule } from '../performance/performance.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { TradeModule } from '../trade/trade.module';
import { BacktestEngine } from './backtest-engine';

/**
 * Backtesting Nest module (US118–US122).
 * Historical replay through Strategy; owns Portfolio + Trade engines; attaches PerformanceReport.
 * No paper / live trading / REST / Prisma / Pipeline.
 */
@Module({
  imports: [MarketDataProviderModule, PortfolioModule, TradeModule, PerformanceModule],
  providers: [BacktestEngine],
  exports: [BacktestEngine],
})
export class BacktestingModule {}
