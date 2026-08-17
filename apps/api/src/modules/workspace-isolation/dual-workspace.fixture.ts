import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import type { Workspace } from '../workspace/workspace';

export type DualWorkspaceIsolationFixture = Readonly<{
  workspaces: WorkspaceDomainService;
  access: WorkspaceAccessService;
  workspaceA: Workspace;
  workspaceB: Workspace;
  operatorAId: string;
  operatorBId: string;
}>;

/**
 * Distinct workspaces A and B with distinct owner operators (V3-S06-a harness).
 * Operator A is a member of A only; operator B is a member of B only.
 */
export async function createDualWorkspaceIsolationFixture(input?: {
  operatorAId?: string;
  operatorBId?: string;
  workspaceAName?: string;
  workspaceBName?: string;
}): Promise<DualWorkspaceIsolationFixture> {
  const operatorAId = input?.operatorAId ?? 'operator-a';
  const operatorBId = input?.operatorBId ?? 'operator-b';
  const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
  const access = new WorkspaceAccessService(workspaces);
  const workspaceA = await workspaces.create({
    name: input?.workspaceAName ?? 'Isolation Workspace A',
    ownerUserId: operatorAId,
  });
  const workspaceB = await workspaces.create({
    name: input?.workspaceBName ?? 'Isolation Workspace B',
    ownerUserId: operatorBId,
  });

  return Object.freeze({
    workspaces,
    access,
    workspaceA,
    workspaceB,
    operatorAId,
    operatorBId,
  });
}
