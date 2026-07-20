import { Module } from '@nestjs/common';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { PortfolioEngineModule } from '../portfolio-engine';
import { PositionEngineModule } from '../position-engine';
import { WorkspaceModule } from '../workspace';
import { PrismaRiskRepository } from './prisma-risk.repository';
import { RiskController } from './risk.controller';
import { RiskEventPublisher } from './risk-event-publisher';
import { RISK_REPOSITORY } from './risk.repository';
import { RiskService } from './risk.service';

/**
 * US207 Risk Engine — Nest module.
 * Centralized policy validation before order execution.
 * No exchange / live trading / order execution / portfolio mutation.
 */
@Module({
  imports: [PrismaModule, WorkspaceModule, PortfolioEngineModule, PositionEngineModule],
  controllers: [RiskController],
  providers: [
    {
      provide: RISK_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaRiskRepository(prisma),
      inject: [PrismaService],
    },
    RiskEventPublisher,
    RiskService,
  ],
  exports: [RiskService, RiskEventPublisher, RISK_REPOSITORY],
})
export class RiskEngineModule {}
