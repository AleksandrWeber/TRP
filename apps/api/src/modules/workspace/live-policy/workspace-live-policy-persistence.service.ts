import { Inject, Injectable } from '@nestjs/common';
import {
  buildPaperLivePolicyState,
  buildWorkspaceLivePolicyState,
  isLivePolicyOptedIn,
  resolveEffectiveWorkspaceLivePolicy,
  type DurableWorkspaceLivePolicyState,
  type WorkspaceLivePolicy,
  type WorkspaceLivePolicyPersistenceOutcome,
} from './durable-workspace-live-policy-state';
import {
  LIVE_POLICY_STATE_REPOSITORY,
  type WorkspaceLivePolicyStateRepository,
} from './workspace-live-policy-state.repository';

/**
 * PROPOSED-V3-L01-S02 — Workspace live-policy persistence service.
 * Domain / repository ports only. No Admin API, Gate, KS, Session, or credentials.
 */
@Injectable()
export class WorkspaceLivePolicyPersistenceService {
  constructor(
    @Inject(LIVE_POLICY_STATE_REPOSITORY)
    private readonly repository: WorkspaceLivePolicyStateRepository,
  ) {}

  async loadState(workspaceId: string): Promise<DurableWorkspaceLivePolicyState | null> {
    return this.repository.loadLivePolicyState(workspaceId);
  }

  /**
   * Effective policy for a workspace.
   * Missing row → PAPER. Loaded invalid rows throw at repository boundary.
   */
  async resolveEffectivePolicy(workspaceId: string): Promise<WorkspaceLivePolicy> {
    const state = await this.loadState(workspaceId);
    return resolveEffectiveWorkspaceLivePolicy(state);
  }

  async isOptedIn(workspaceId: string): Promise<boolean> {
    const state = await this.loadState(workspaceId);
    return isLivePolicyOptedIn(state);
  }

  /** Ensure durable Paper state exists (new workspace create / idempotent seed). */
  async ensurePaperDefault(workspaceId: string): Promise<DurableWorkspaceLivePolicyState> {
    const prior = await this.loadState(workspaceId);
    if (prior !== null) {
      return prior;
    }

    const outcome = buildPaperLivePolicyState({
      workspaceId,
      recordedAt: new Date().toISOString(),
    });
    if (!outcome.ok) {
      throw new Error(`failed to build Paper live policy: ${outcome.reason}`);
    }
    await this.repository.saveLivePolicyState(outcome.state);
    return outcome.state;
  }

  /**
   * Persist an explicit policy value via domain port (S03 may consume later).
   * S02 does not expose HTTP/Admin enablement for this method.
   */
  async persistPolicy(input: {
    workspaceId: string;
    policy: WorkspaceLivePolicy;
    recordedAt?: string;
  }): Promise<WorkspaceLivePolicyPersistenceOutcome> {
    const prior = await this.loadState(input.workspaceId);
    const outcome = buildWorkspaceLivePolicyState({
      workspaceId: input.workspaceId,
      policy: input.policy,
      recordedAt: input.recordedAt ?? new Date().toISOString(),
      prior,
    });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveLivePolicyState(outcome.state);
    return outcome;
  }
}
