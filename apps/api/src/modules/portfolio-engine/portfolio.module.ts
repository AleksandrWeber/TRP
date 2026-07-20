import { Module } from '@nestjs/common';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { WorkspaceModule } from '../workspace';
import { PortfolioController } from './portfolio.controller';
import { PortfolioEventPublisher } from './portfolio-event-publisher';
import { PORTFOLIO_REPOSITORY } from './portfolio.repository';
import { PortfolioService } from './portfolio.service';
import { PortfolioSnapshotService } from './portfolio-snapshot.service';
import { PrismaPortfolioRepository } from './prisma-portfolio.repository';

/**
 * US204 Portfolio Engine — Nest module.
 * Financial core for trading accounts. No exchange / execution / positions.
 */
@Module({
  imports: [PrismaModule, WorkspaceModule],
  controllers: [PortfolioController],
  providers: [
    {
      provide: PORTFOLIO_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaPortfolioRepository(prisma),
      inject: [PrismaService],
    },
    PortfolioEventPublisher,
    PortfolioSnapshotService,
    PortfolioService,
  ],
  exports: [PortfolioService, PortfolioSnapshotService, PORTFOLIO_REPOSITORY],
})
export class PortfolioEngineModule {}
