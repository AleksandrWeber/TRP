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

/**
 * Workspace Nest module (US108 / US158 / US002).
 * Top-level multi-tenant aggregate with membership access checks for trading commands.
 * Exposes authenticated bootstrap for active-workspace discovery/creation.
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
    WorkspaceDomainService,
    WorkspaceAccessService,
  ],
  exports: [WorkspaceDomainService, WorkspaceAccessService],
})
export class WorkspaceModule {}
