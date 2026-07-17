import { Module } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { InMemoryWorkspaceRepository } from './repositories/in-memory-workspace.repository';
import { WORKSPACE_REPOSITORY } from './repositories/workspace.repository.token';
import { WorkspaceDomainService } from './workspace-domain.service';

/**
 * Workspace Nest module (US108).
 * Top-level multi-tenant aggregate — no tenant isolation / REST / Prisma yet.
 * WorkspaceRepository bound to InMemory only.
 */
@Module({
  providers: [
    {
      provide: WORKSPACE_REPOSITORY,
      useFactory: (metrics: Metrics) =>
        instrumentRepository(new InMemoryWorkspaceRepository(), metrics, 'workspace'),
      inject: [METRICS],
    },
    WorkspaceDomainService,
  ],
  exports: [WorkspaceDomainService],
})
export class WorkspaceModule {}
