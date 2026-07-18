import { Module } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { EventProcessingModule } from '../event-processing';
import { M2_PAPER_FILL_CONFIGURATION } from '../execution-adapter';
import { ExecutionEngineModule } from '../execution-engine';
import { LedgerModule } from '../ledger';
import { PaperAccountModule } from '../paper-account';
import { WorkspaceModule } from '../workspace';
import { AccountingQueryController } from './accounting-query.controller';
import { AccountingQueryService } from './accounting-query.service';
import { AccountingRebuildService } from './accounting-rebuild.service';
import { PortfolioProjectionOutboxConsumer } from './portfolio-projection-outbox.consumer';
import { PortfolioProjectionService } from './portfolio-projection.service';
import { PositionAccountingConsumer } from './position-accounting.consumer';
import { PositionAccountingOutboxConsumer } from './position-accounting-outbox.consumer';
import { PositionValuationOutboxConsumer } from './position-valuation-outbox.consumer';
import { PositionValuationService } from './position-valuation.service';
import { PORTFOLIO_REPOSITORY } from './persistence/portfolio.repository';
import { PrismaPortfolioRepository } from './persistence/prisma-portfolio.repository';
import { POSITION_REPOSITORY } from './persistence/position.repository';
import { PrismaPositionRepository } from './persistence/prisma-position.repository';
import { PrismaPositionValuationRepository } from './persistence/prisma-position-valuation.repository';
import { POSITION_VALUATION_REPOSITORY } from './persistence/position-valuation.repository';
import { POSITION_FILL_CONFIGURATION } from './positions.tokens';
import { AccountingReconciliationModule } from './reconciliation/accounting-reconciliation.module';

@Module({
  imports: [
    EventProcessingModule,
    ExecutionEngineModule,
    LedgerModule,
    PaperAccountModule,
    WorkspaceModule,
    AccountingReconciliationModule,
  ],
  controllers: [AccountingQueryController],
  providers: [
    {
      provide: POSITION_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaPositionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: POSITION_VALUATION_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaPositionValuationRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: PORTFOLIO_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaPortfolioRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: POSITION_FILL_CONFIGURATION,
      useValue: M2_PAPER_FILL_CONFIGURATION,
    },
    PositionAccountingConsumer,
    PositionAccountingOutboxConsumer,
    PositionValuationService,
    PositionValuationOutboxConsumer,
    PortfolioProjectionService,
    PortfolioProjectionOutboxConsumer,
    AccountingRebuildService,
    AccountingQueryService,
  ],
  exports: [
    PositionAccountingConsumer,
    PositionValuationService,
    PortfolioProjectionService,
    AccountingRebuildService,
    AccountingQueryService,
  ],
})
export class PositionsModule {}
