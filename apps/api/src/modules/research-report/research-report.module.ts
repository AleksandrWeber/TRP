import { Module } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { RepositoryPrismaLifecycle } from '../../persistence/repository-prisma-lifecycle';
import { RepositoryPrismaLifecycleModule } from '../../persistence/repository-prisma-lifecycle.module';
import { WorkspaceModule } from '../workspace';
import { InMemoryResearchReportRepository } from './repositories/in-memory-research-report.repository';
import { PrismaResearchReportRepository } from './repositories/prisma-research-report.repository';
import { RESEARCH_REPORT_REPOSITORY } from './repositories/research-report.repository.token';
import { ResearchReportController } from './research-report.controller';
import { ResearchReportDomainService } from './research-report-domain.service';

/**
 * Research Report Nest module (US099, US100, US102, US104).
 * Storage via ResearchReportRepository — InMemory or Prisma by RESEARCH_PERSISTENCE_DRIVER
 * (PERSISTENCE_DRIVER fallback, then memory).
 */
@Module({
  imports: [RepositoryPrismaLifecycleModule, WorkspaceModule],
  controllers: [ResearchReportController],
  providers: [
    {
      provide: RESEARCH_REPORT_REPOSITORY,
      useFactory: async (metrics: Metrics, clients: RepositoryPrismaLifecycle) => {
        const repo = await createRepositoryByDriver({
          group: 'research',
          createMemory: () => new InMemoryResearchReportRepository(),
          createPrisma: (client) => new PrismaResearchReportRepository(client),
          onHydrationFailure: 'fail',
          repositoryName: 'research-report',
          clients,
        });
        return instrumentRepository(repo, metrics, 'research-report');
      },
      inject: [METRICS, RepositoryPrismaLifecycle],
    },
    ResearchReportDomainService,
  ],
  exports: [ResearchReportDomainService],
})
export class ResearchReportModule {}
