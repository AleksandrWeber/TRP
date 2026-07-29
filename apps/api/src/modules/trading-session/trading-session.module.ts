import { Module } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { EventProcessingModule } from '../event-processing';
import { PaperAccountModule } from '../paper-account';
import { StrategyDeploymentModule } from '../strategy-deployment';
import { StrategyRuntimeModule } from '../strategy-runtime';
import { TRADING_SESSION_REPOSITORY } from './persistence/trading-session.repository';
import { PrismaTradingSessionRepository } from './persistence/prisma-trading-session.repository';
import { TradingSessionService } from './trading-session.service';

/**
 * Trading Session bounded context (US156 / US157 / US217).
 * Owns lifecycle + Deployment identity binding. Depends on Strategy Deployment
 * and StrategyRuntimePort only among Runtime modules — never Orders/Risk/Execution.
 */
@Module({
  imports: [
    EventProcessingModule,
    PaperAccountModule,
    StrategyDeploymentModule,
    StrategyRuntimeModule,
  ],
  providers: [
    {
      provide: TRADING_SESSION_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaTradingSessionRepository(prisma),
      inject: [PrismaService],
    },
    TradingSessionService,
  ],
  exports: [TRADING_SESSION_REPOSITORY, TradingSessionService],
})
export class TradingSessionModule {}
