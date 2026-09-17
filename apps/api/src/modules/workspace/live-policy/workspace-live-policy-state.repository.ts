import type { DurableWorkspaceLivePolicyState } from './durable-workspace-live-policy-state';

export interface WorkspaceLivePolicyStateRepository {
  saveLivePolicyState(state: DurableWorkspaceLivePolicyState): Promise<void>;

  loadLivePolicyState(workspaceId: string): Promise<DurableWorkspaceLivePolicyState | null>;

  listAllLivePolicyStates(): Promise<readonly DurableWorkspaceLivePolicyState[]>;
}

export const LIVE_POLICY_STATE_REPOSITORY = Symbol('LIVE_POLICY_STATE_REPOSITORY');
