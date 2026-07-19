import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { EvaluationSchedulerModule } from '../evaluation-scheduler';
import { MarketDataCacheModule } from '../market-data-cache';
import { MarketDataDomainModule } from '../market-data-domain';
import { StrategiesModule } from '../strategies';
import { WorkspaceModule } from '../workspace';
import { ExecutorPortfolioStore } from './executor-portfolio-store';
import { PaperTradingExecutorController } from './paper-trading-executor.controller';
import { PaperTradingExecutorErrorFilter } from './paper-trading-executor-error.filter';
import { PaperTradingExecutorService } from './paper-trading-executor.service';

/**
 * Paper Trading Executor Nest module (US016).
 * Subscribes to Evaluation Scheduler results and executes virtual trades
 * in-memory. No real exchange orders, risk management, or persistence.
 */
@Module({
  imports: [
    EvaluationSchedulerModule,
    StrategiesModule,
    WorkspaceModule,
    MarketDataCacheModule,
    MarketDataDomainModule,
  ],
  controllers: [PaperTradingExecutorController],
  providers: [
    ExecutorPortfolioStore,
    PaperTradingExecutorService,
    {
      provide: APP_FILTER,
      useClass: PaperTradingExecutorErrorFilter,
    },
  ],
  exports: [ExecutorPortfolioStore, PaperTradingExecutorService],
})
export class PaperTradingExecutorModule {}
