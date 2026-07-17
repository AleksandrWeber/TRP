import { Module } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { WorkspaceModule } from '../workspace';
import { InMemoryResearchReportRepository } from './repositories/in-memory-research-report.repository';
import { PrismaResearchReportRepository } from './repositories/prisma-research-report.repository';
import { RESEARCH_REPORT_REPOSITORY } from './repositories/research-report.repository.token';
import { ResearchReportController } from './research-report.controller';
import { ResearchReportDomainService } from './research-report-domain.service';

/**
 * Research Report Nest module (US099, US100, US102, US104).
 * Storage via ResearchReportRepository — InMemory or Prisma by PERSISTENCE_DRIVER.
 */
@Module({
  imports: [WorkspaceModule],
  controllers: [ResearchReportController],
  providers: [
    {
      provide: RESEARCH_REPORT_REPOSITORY,
      useFactory: async (metrics: Metrics) => {
        const repo = await createRepositoryByDriver({
          createMemory: () => new InMemoryResearchReportRepository(),
          createPrisma: (client) => new PrismaResearchReportRepository(client),
        });
        return instrumentRepository(repo, metrics, 'research-report');
      },
      inject: [METRICS],
    },
    ResearchReportDomainService,
  ],
  exports: [ResearchReportDomainService],
})
export class ResearchReportModule {}
