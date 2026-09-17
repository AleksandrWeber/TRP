import { describe, expect, it } from 'vitest';
import {
  buildPaperLivePolicyState,
  buildWorkspaceLivePolicyState,
  isLivePolicyOptedIn,
  isWorkspaceLivePolicy,
  livePolicyAuthorizesAdmission,
  livePolicyAuthorizesExecution,
  livePolicyAuthorizesLiveTrading,
  parseWorkspaceLivePolicy,
  resolveEffectiveWorkspaceLivePolicy,
  WorkspaceLivePolicy,
  WORKSPACE_LIVE_POLICY_STATE_SCHEMA_VERSION,
} from './durable-workspace-live-policy-state';

describe('durable workspace live policy (PROPOSED-V3-L01-S02)', () => {
  it('T-01 Paper is the canonical default semantic state', () => {
    expect(WorkspaceLivePolicy.PAPER).toBe('PAPER');
    expect(Object.values(WorkspaceLivePolicy)).toEqual([
      WorkspaceLivePolicy.PAPER,
      WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
    ]);
  });

  it('T-04 missing/null state resolves to Paper and cannot activate live', () => {
    expect(resolveEffectiveWorkspaceLivePolicy(null)).toBe(WorkspaceLivePolicy.PAPER);
    expect(isLivePolicyOptedIn(null)).toBe(false);
  });

  it('T-05 invalid/unsupported policy is rejected', () => {
    expect(() => parseWorkspaceLivePolicy('LIVE')).toThrow(/unsupported Workspace live policy/i);
    expect(() => parseWorkspaceLivePolicy('true')).toThrow(/unsupported Workspace live policy/i);
    expect(() => parseWorkspaceLivePolicy('')).toThrow(/unsupported Workspace live policy/i);
    expect(() => parseWorkspaceLivePolicy(null)).toThrow(/unsupported Workspace live policy/i);
    expect(isWorkspaceLivePolicy('LIVE')).toBe(false);
  });

  it('T-06 LIVE_POLICY_OPTED_IN is represented only as policy state', () => {
    const outcome = buildWorkspaceLivePolicyState({
      workspaceId: 'ws-1',
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
      recordedAt: '2026-09-17T00:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.state.policy).toBe(WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN);
    expect(isLivePolicyOptedIn(outcome.state)).toBe(true);
  });

  it('T-07 LIVE_POLICY_OPTED_IN does not grant authorization/admission/execution', () => {
    const outcome = buildWorkspaceLivePolicyState({
      workspaceId: 'ws-1',
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
      recordedAt: '2026-09-17T00:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(livePolicyAuthorizesLiveTrading(outcome.state)).toBe(false);
    expect(livePolicyAuthorizesAdmission(outcome.state)).toBe(false);
    expect(livePolicyAuthorizesExecution(outcome.state)).toBe(false);
    expect(livePolicyAuthorizesLiveTrading(null)).toBe(false);
  });

  it('builds Paper state with schema version 1', () => {
    const outcome = buildPaperLivePolicyState({
      workspaceId: ' ws-1 ',
      recordedAt: '2026-09-17T00:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.state).toEqual({
      workspaceId: 'ws-1',
      policy: WorkspaceLivePolicy.PAPER,
      schemaVersion: WORKSPACE_LIVE_POLICY_STATE_SCHEMA_VERSION,
      updatedAt: '2026-09-17T00:00:00.000Z',
    });
  });

  it('rejects workspace_mismatch on persist build', () => {
    const prior = buildPaperLivePolicyState({
      workspaceId: 'ws-a',
      recordedAt: '2026-09-17T00:00:00.000Z',
    });
    expect(prior.ok).toBe(true);
    if (!prior.ok) return;

    const outcome = buildWorkspaceLivePolicyState({
      workspaceId: 'ws-b',
      policy: WorkspaceLivePolicy.PAPER,
      recordedAt: '2026-09-17T00:01:00.000Z',
      prior: prior.state,
    });
    expect(outcome).toEqual({ ok: false, reason: 'workspace_mismatch' });
  });
});
