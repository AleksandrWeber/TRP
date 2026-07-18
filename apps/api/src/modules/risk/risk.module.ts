import { Module } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { EventProcessingModule } from '../event-processing';
import { M2_BASELINE_RISK_POLICY } from './domain/risk-policy';
import { PrismaRiskDecisionRepository } from './persistence/prisma-risk-decision.repository';
import { RISK_DECISION_REPOSITORY } from './persistence/risk-decision.repository';
import { BASELINE_RISK_POLICY, RiskDecisionService } from './risk-decision.service';

@Module({
  imports: [EventProcessingModule],
  providers: [
    {
      provide: BASELINE_RISK_POLICY,
      useValue: M2_BASELINE_RISK_POLICY,
    },
    {
      provide: RISK_DECISION_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaRiskDecisionRepository(prisma),
      inject: [PrismaService],
    },
    RiskDecisionService,
  ],
  exports: [RiskDecisionService, BASELINE_RISK_POLICY],
})
export class RiskModule {}
