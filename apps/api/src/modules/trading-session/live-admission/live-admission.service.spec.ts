/**
 * PROPOSED-V3-L01-S04 — LiveAdmissionService orchestration tests.
 */

import { describe, expect, it, vi } from 'vitest';
import { Role } from '../../identity/role';
import { WorkspaceLivePolicy } from '../../workspace/live-policy/durable-workspace-live-policy-state';
import { InMemoryHumanStartProofStore } from './in-memory-human-start-proof.store';
import { LiveAdmissionService } from './live-admission.service';
import {
  livePolicyAuthorizesAdmission,
  livePolicyAuthorizesExecution,
  livePolicyAuthorizesLiveTrading,
} from '../../workspace/live-policy/durable-workspace-live-policy-state';
import { V2_READINESS } from '../../../platform-conformance/v2-certification-checklist';
import { V2_COMPATIBILITY_MATRIX } from '../../../platform-conformance/v2-compatibility-matrix';
import { roleAllowsPermission } from '../../auth/permission-matrix';
import { PermissionClass } from '../../auth/permission-catalog';

function createService(options?: {
  policy?: WorkspaceLivePolicy | null;
  killArmed?: boolean;
  gatePass?: boolean;
}) {
  const store = new InMemoryHumanStartProofStore();
  const livePolicy = {
    loadState: vi.fn(async (workspaceId: string) =>
      options?.policy
        ? {
            workspaceId,
            policy: options.policy,
            schemaVersion: 1,
            updatedAt: '2026-09-17T12:00:00.000Z',
          }
        : null,
    ),
    resolveEffectivePolicy: vi.fn(async () => options?.policy ?? WorkspaceLivePolicy.PAPER),
  };
  const killSwitch = {
    loadState: vi.fn(async (workspaceId: string) =>
      options?.killArmed
        ? {
            workspaceId,
            armed: true,
            reason: 'stop',
            armedAt: '2026-09-17T12:00:00.000Z',
            armedByActorId: 'ops',
            clearedAt: null,
            clearedByActorId: null,
            correlationId: null,
            schemaVersion: 1,
            updatedAt: '2026-09-17T12:00:00.000Z',
          }
        : {
            workspaceId,
            armed: false,
            reason: null,
            armedAt: null,
            armedByActorId: null,
            clearedAt: null,
            clearedByActorId: null,
            correlationId: null,
            schemaVersion: 1,
            updatedAt: '2026-09-17T12:00:00.000Z',
          },
    ),
  };
  const gate = {
    validateForLiveAdmission: vi.fn(() =>
      options?.gatePass === false
        ? {
            outcome: 'fail' as const,
            validation: 'INVALID' as const,
          }
        : {
            outcome: 'pass' as const,
            validation: 'VALID' as const,
          },
    ),
  };

  const service = new LiveAdmissionService(
    livePolicy as never,
    killSwitch as never,
    gate as never,
    store,
  );
  return { service, store, livePolicy, killSwitch, gate };
}

const sessionFacts = Object.freeze({
  sessionId: 'sess-1',
  workspaceId: 'ws-1',
  actorId: 'actor-1',
  lifecycleEligible: true,
  executionModeCompatible: true,
});

describe('LiveAdmissionService (PROPOSED-V3-L01-S04)', () => {
  it('T-28 Admin policy enable alone denies without human-start', async () => {
    const { service } = createService({
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
      gatePass: true,
    });
    const decision = await service.evaluate({
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actorId: 'actor-1',
      actorRole: Role.Admin,
      session: sessionFacts,
      humanStartToken: null,
      gateRequest: { libraryEntryId: 'lib-1' },
      v2Overrides: { liveCapitalAuthorized: true, paperFreezeBlocksLive: false },
      authorizationOverride: 'allowed',
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('HUMAN_START_MISSING');
  });

  it('T-33 all prerequisites valid produces ALLOW (harness overrides)', async () => {
    const { service } = createService({
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
      gatePass: true,
    });
    const issued = await service.issueHumanStart({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: 'LIVE_SUBMIT_ORDER',
      nowIso: '2026-09-17T12:00:00.000Z',
    });
    const decision = await service.evaluate({
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actorId: 'actor-1',
      actorRole: Role.Trader,
      session: sessionFacts,
      humanStartToken: issued.token,
      actionCommand: 'LIVE_SUBMIT_ORDER',
      gateRequest: { libraryEntryId: 'lib-1' },
      v2Overrides: { liveCapitalAuthorized: true, paperFreezeBlocksLive: false },
      authorizationOverride: 'allowed',
      evaluatedAt: '2026-09-17T12:00:00.000Z',
    });
    expect(decision.outcome).toBe('ALLOW');
    expect(decision.allowed).toBe(true);
  });

  it('T-11 active Kill Switch denies even when other inputs valid', async () => {
    const { service } = createService({
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
      killArmed: true,
      gatePass: true,
    });
    const issued = await service.issueHumanStart({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: 'LIVE_SUBMIT_ORDER',
    });
    const decision = await service.evaluate({
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actorId: 'actor-1',
      actorRole: Role.Trader,
      session: sessionFacts,
      humanStartToken: issued.token,
      actionCommand: 'LIVE_SUBMIT_ORDER',
      gateRequest: { libraryEntryId: 'lib-1' },
      v2Overrides: { liveCapitalAuthorized: true, paperFreezeBlocksLive: false },
      authorizationOverride: 'allowed',
    });
    expect(decision.reason).toBe('KILL_SWITCH_ACTIVE');
  });

  it('T-36 LiveCommand remains deny-all; production authz path denies', () => {
    const { service } = createService();
    expect(service.evaluateLiveCommandAuthorization(Role.Admin)).toBe('denied');
    expect(service.evaluateLiveCommandAuthorization(Role.Trader)).toBe('denied');
    expect(roleAllowsPermission(Role.Admin, PermissionClass.LiveCommand)).toBe(false);
  });

  it('T-37 Gate is consulted (no bypass) when identity present', async () => {
    const { service, gate } = createService({
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
      gatePass: false,
    });
    const issued = await service.issueHumanStart({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: 'LIVE_SUBMIT_ORDER',
    });
    const decision = await service.evaluate({
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actorId: 'actor-1',
      actorRole: Role.Trader,
      session: sessionFacts,
      humanStartToken: issued.token,
      actionCommand: 'LIVE_SUBMIT_ORDER',
      gateRequest: { libraryEntryId: 'lib-1' },
      v2Overrides: { liveCapitalAuthorized: true, paperFreezeBlocksLive: false },
      authorizationOverride: 'allowed',
    });
    expect(gate.validateForLiveAdmission).toHaveBeenCalled();
    expect(decision.reason).toBe('GATE_DENIED');
  });

  it('T-41 cross-workspace Session denies', async () => {
    const { service } = createService({
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
      gatePass: true,
    });
    const issued = await service.issueHumanStart({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: 'LIVE_SUBMIT_ORDER',
    });
    const decision = await service.evaluate({
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actorId: 'actor-1',
      actorRole: Role.Trader,
      session: { ...sessionFacts, workspaceId: 'ws-other' },
      humanStartToken: issued.token,
      actionCommand: 'LIVE_SUBMIT_ORDER',
      gateRequest: { libraryEntryId: 'lib-1' },
      v2Overrides: { liveCapitalAuthorized: true, paperFreezeBlocksLive: false },
      authorizationOverride: 'allowed',
    });
    expect(decision.reason).toBe('SESSION_WORKSPACE_MISMATCH');
  });

  it('T-43/T-44 ALLOW does not mutate V2 anchors', async () => {
    const beforeAuth = V2_READINESS.liveCapitalAuthorized;
    const beforeFreeze = V2_COMPATIBILITY_MATRIX.map((r) => r.paperFreeze);
    const { service } = createService({
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
      gatePass: true,
    });
    const issued = await service.issueHumanStart({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: 'LIVE_SUBMIT_ORDER',
    });
    await service.evaluate({
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actorId: 'actor-1',
      actorRole: Role.Trader,
      session: sessionFacts,
      humanStartToken: issued.token,
      actionCommand: 'LIVE_SUBMIT_ORDER',
      gateRequest: { libraryEntryId: 'lib-1' },
      v2Overrides: { liveCapitalAuthorized: true, paperFreezeBlocksLive: false },
      authorizationOverride: 'allowed',
    });
    expect(V2_READINESS.liveCapitalAuthorized).toBe(beforeAuth);
    expect(V2_COMPATIBILITY_MATRIX.map((r) => r.paperFreeze)).toEqual(beforeFreeze);
  });

  it('T-45 honesty helpers remain false', () => {
    const state = {
      workspaceId: 'ws-1',
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
      schemaVersion: 1,
      updatedAt: '2026-09-17T12:00:00.000Z',
    };
    expect(livePolicyAuthorizesLiveTrading(state)).toBe(false);
    expect(livePolicyAuthorizesAdmission(state)).toBe(false);
    expect(livePolicyAuthorizesExecution(state)).toBe(false);
  });

  it('T-42 does not duplicate policy store (consumes livePolicy.loadState)', async () => {
    const { service, livePolicy } = createService({
      policy: WorkspaceLivePolicy.PAPER,
    });
    await service.evaluate({
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actorId: 'actor-1',
      actorRole: Role.Trader,
      session: sessionFacts,
      humanStartToken: null,
    });
    expect(livePolicy.loadState).toHaveBeenCalledWith('ws-1');
  });

  it('exposes S04→L02 contract with revalidation flag', async () => {
    const { service } = createService({
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
      gatePass: true,
    });
    const issued = await service.issueHumanStart({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: 'LIVE_SUBMIT_ORDER',
    });
    const contract = await service.evaluateForL02Contract({
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actorId: 'actor-1',
      actorRole: Role.Trader,
      session: sessionFacts,
      humanStartToken: issued.token,
      actionCommand: 'LIVE_SUBMIT_ORDER',
      gateRequest: { libraryEntryId: 'lib-1' },
      v2Overrides: { liveCapitalAuthorized: true, paperFreezeBlocksLive: false },
      authorizationOverride: 'allowed',
    });
    expect(contract.l02MustRevalidateBeforeVenueIo).toBe(true);
    expect(contract.admission.allowed).toBe(true);
  });
});
