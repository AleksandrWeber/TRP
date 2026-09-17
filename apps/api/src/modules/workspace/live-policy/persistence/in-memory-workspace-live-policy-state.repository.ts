import type { TransactionContext } from '../../../../storage/prisma/prisma-transaction.service';
import type { DurableWorkspaceLivePolicyState } from '../durable-workspace-live-policy-state';
import type { WorkspaceLivePolicyStateRepository } from '../workspace-live-policy-state.repository';

/** Test-only in-memory live-policy store (workspace-keyed). */
export class InMemoryWorkspaceLivePolicyStateRepository implements WorkspaceLivePolicyStateRepository {
  private readonly byWorkspaceId = new Map<string, DurableWorkspaceLivePolicyState>();

  async saveLivePolicyState(
    state: DurableWorkspaceLivePolicyState,
    _transaction?: TransactionContext,
  ): Promise<void> {
    this.byWorkspaceId.set(state.workspaceId, state);
  }

  async loadLivePolicyState(workspaceId: string): Promise<DurableWorkspaceLivePolicyState | null> {
    return this.byWorkspaceId.get(workspaceId) ?? null;
  }

  async listAllLivePolicyStates(): Promise<readonly DurableWorkspaceLivePolicyState[]> {
    return Object.freeze(
      [...this.byWorkspaceId.values()].sort((a, b) => a.workspaceId.localeCompare(b.workspaceId)),
    );
  }
}
