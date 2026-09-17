import { Module } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { PrismaWorkspaceRepository } from './repositories/prisma-workspace.repository';
import { WORKSPACE_REPOSITORY } from './repositories/workspace.repository.token';
import { WorkspaceAccessService } from './workspace-access.service';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceDomainService } from './workspace-domain.service';
import { LIVE_POLICY_STATE_REPOSITORY } from './live-policy/workspace-live-policy-state.repository';
import { PrismaWorkspaceLivePolicyStateRepository } from './live-policy/persistence/prisma-workspace-live-policy-state.repository';
import { WorkspaceLivePolicyPersistenceService } from './live-policy/workspace-live-policy-persistence.service';

/**
 * Workspace Nest module (US108 / US158 / US002).
 * Top-level multi-tenant aggregate with membership access checks for trading commands.
 * Exposes authenticated bootstrap plus list / create / get / rename / archive transports (PC-14).
 *
 * PROPOSED-V3-L01-S02: Workspace-owned live-policy satellite persistence ports
 * (no Admin/enablement HTTP API in S02).
 */
@Module({
  imports: [PrismaModule],
  controllers: [WorkspaceController],
  providers: [
    {
      provide: WORKSPACE_REPOSITORY,
      useFactory: (prisma: PrismaService, metrics: Metrics) =>
        instrumentRepository(new PrismaWorkspaceRepository(prisma), metrics, 'workspace'),
      inject: [PrismaService, METRICS],
    },
    {
      provide: LIVE_POLICY_STATE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaWorkspaceLivePolicyStateRepository(prisma),
      inject: [PrismaService],
    },
    WorkspaceLivePolicyPersistenceService,
    WorkspaceDomainService,
    WorkspaceAccessService,
  ],
  exports: [
    WorkspaceDomainService,
    WorkspaceAccessService,
    WorkspaceLivePolicyPersistenceService,
    LIVE_POLICY_STATE_REPOSITORY,
  ],
})
export class WorkspaceModule {}
