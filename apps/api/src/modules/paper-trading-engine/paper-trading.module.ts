import { Module } from '@nestjs/common';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { OrderEngineModule } from '../order-engine';
import { PortfolioEngineModule } from '../portfolio-engine';
import { PositionEngineModule } from '../position-engine';
import { RiskEngineModule } from '../risk-engine';
import { WorkspaceModule } from '../workspace';
import { PaperEventPublisher } from './paper-event-publisher';
import { PaperExecutionCoordinator } from './paper-execution-coordinator';
import { PaperSessionManager } from './paper-session-manager';
import { PaperTradingController } from './paper-trading.controller';
import { PAPER_TRADING_REPOSITORY } from './paper-trading.repository';
import { PaperTradingService } from './paper-trading.service';
import { PrismaPaperTradingRepository } from './prisma-paper-trading.repository';

/**
 * US208 Paper Trading Engine — Nest module.
 * Orchestrates Order / Risk / Position / Portfolio for simulated sessions.
 * No live exchange connectivity.
 */
@Module({
  imports: [
    PrismaModule,
    WorkspaceModule,
    PortfolioEngineModule,
    PositionEngineModule,
    OrderEngineModule,
    RiskEngineModule,
  ],
  controllers: [PaperTradingController],
  providers: [
    {
      provide: PAPER_TRADING_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaPaperTradingRepository(prisma),
      inject: [PrismaService],
    },
    PaperEventPublisher,
    PaperSessionManager,
    PaperExecutionCoordinator,
    PaperTradingService,
  ],
  exports: [
    PaperTradingService,
    PaperSessionManager,
    PaperExecutionCoordinator,
    PAPER_TRADING_REPOSITORY,
  ],
})
export class PaperTradingEngineModule {}
