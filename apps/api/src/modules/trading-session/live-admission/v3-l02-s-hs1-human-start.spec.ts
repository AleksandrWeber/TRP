/**
 * V3-L02-S-HS1 — Durable human-start authorization tests (PO-L02-05A…D).
 * Cases A–I: concurrency, multi-instance, retry, restart, binding, expiry.
 * No venue I/O. No production credentials. Claim ≠ SUBMITTED/ACCEPTED/FILLED.
 */

import { describe, expect, it } from 'vitest';
import { Role } from '../../identity/role';
import { WorkspaceLivePolicy } from '../../workspace/live-policy/durable-workspace-live-policy-state';
import {
  claimHumanStartProof,
  issueHumanStartProof,
  verifyHumanStartProof,
  type HumanStartProofRecord,
} from './domain/human-start-proof';
import { InMemoryHumanStartProofStore } from './in-memory-human-start-proof.store';
import { LiveAdmissionService } from './live-admission.service';
import { PrismaHumanStartProofStore } from './prisma-human-start-proof.store';
import { vi } from 'vitest';

const ACTION = 'LIVE_SUBMIT_ORDER';
const OTHER_ACTION = 'LIVE_CANCEL_ORDER';
const NOW = '2026-09-17T12:00:00.000Z';

const sessionFacts = Object.freeze({
  sessionId: 'sess-1',
  workspaceId: 'ws-1',
  actorId: 'actor-1',
  lifecycleEligible: true,
  executionModeCompatible: true,
});

function createAdmissionService(store: InMemoryHumanStartProofStore) {
  const livePolicy = {
    loadState: vi.fn(async (workspaceId: string) => ({
      workspaceId,
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
      schemaVersion: 1,
      updatedAt: NOW,
    })),
    resolveEffectivePolicy: vi.fn(async () => WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN),
  };
  const killSwitch = {
    loadState: vi.fn(async (workspaceId: string) => ({
      workspaceId,
      armed: false,
      reason: null,
      armedAt: null,
      armedByActorId: null,
      clearedAt: null,
      clearedByActorId: null,
      correlationId: null,
      schemaVersion: 1,
      updatedAt: NOW,
    })),
  };
  const gate = {
    validateForLiveAdmission: vi.fn(() => ({
      outcome: 'pass' as const,
      validation: 'VALID' as const,
    })),
  };
  return new LiveAdmissionService(livePolicy as never, killSwitch as never, gate as never, store);
}

/** Shared-map fake Prisma client — simulates durable shared store across “instances”. */
function createSharedPrismaFake(shared: {
  rows: Map<string, HumanStartProofRecord>;
  byHash: Map<string, HumanStartProofRecord>;
  claimChain: Promise<void>;
}) {
  return {
    humanStartProof: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const record: HumanStartProofRecord = Object.freeze({
          id: data.id as string,
          tokenHash: data.tokenHash as string,
          workspaceId: data.workspaceId as string,
          actorId: data.actorId as string,
          sessionId: data.sessionId as string,
          actionCommand: data.actionCommand as string,
          createdAt: (data.createdAt as Date).toISOString(),
          expiresAt: (data.expiresAt as Date).toISOString(),
          claimedAt: data.claimedAt ? (data.claimedAt as Date).toISOString() : null,
          claimedLogicalActionId: (data.claimedLogicalActionId as string | null) ?? null,
          schemaVersion: 1 as const,
        });
        shared.rows.set(record.id, record);
        shared.byHash.set(record.tokenHash, record);
        return {};
      },
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        const r = shared.byHash.get(where.tokenHash);
        if (!r) return null;
        return {
          id: r.id,
          tokenHash: r.tokenHash,
          workspaceId: r.workspaceId,
          actorId: r.actorId,
          sessionId: r.sessionId,
          actionCommand: r.actionCommand,
          createdAt: new Date(r.createdAt),
          expiresAt: new Date(r.expiresAt),
          claimedAt: r.claimedAt ? new Date(r.claimedAt) : null,
          claimedLogicalActionId: r.claimedLogicalActionId,
          schemaVersion: r.schemaVersion,
          updatedAt: new Date(r.createdAt),
        };
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: {
          id: string;
          claimedAt: null;
          expiresAt: { gt: Date };
          workspaceId: string;
          actorId: string;
          sessionId: string;
          actionCommand: string;
        };
        data: {
          claimedAt: Date;
          claimedLogicalActionId: string | null;
          updatedAt: Date;
        };
      }) => {
        let release!: () => void;
        const gate = new Promise<void>((resolve) => {
          release = resolve;
        });
        const previous = shared.claimChain;
        shared.claimChain = previous.then(() => gate);
        await previous;
        try {
          const current = shared.rows.get(where.id);
          if (!current || current.claimedAt !== null) {
            return { count: 0 };
          }
          if (Date.parse(current.expiresAt) <= where.expiresAt.gt.getTime()) {
            return { count: 0 };
          }
          if (
            current.workspaceId !== where.workspaceId ||
            current.actorId !== where.actorId ||
            current.sessionId !== where.sessionId ||
            current.actionCommand !== where.actionCommand
          ) {
            return { count: 0 };
          }
          const next = Object.freeze({
            ...current,
            claimedAt: data.claimedAt.toISOString(),
            claimedLogicalActionId: data.claimedLogicalActionId,
          });
          shared.rows.set(where.id, next);
          shared.byHash.set(next.tokenHash, next);
          return { count: 1 };
        } finally {
          release();
        }
      },
    },
  };
}

function newSharedDurableState() {
  return {
    rows: new Map<string, HumanStartProofRecord>(),
    byHash: new Map<string, HumanStartProofRecord>(),
    claimChain: Promise.resolve(),
  };
}

describe('V3-L02-S-HS1 durable human-start authorization', () => {
  it('HS1-01/02 persists via Prisma store against shared durable map', async () => {
    const shared = newSharedDurableState();
    const storeA = new PrismaHumanStartProofStore(createSharedPrismaFake(shared) as never);
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: ACTION,
      nowIso: NOW,
    });
    await storeA.save(record);
    const storeB = new PrismaHumanStartProofStore(createSharedPrismaFake(shared) as never);
    const found = await storeB.findByTokenHash(record.tokenHash);
    expect(found?.id).toBe(record.id);
    expect(found?.actionCommand).toBe(ACTION);
    expect(issued.token).not.toContain(record.tokenHash);
  });

  it('Case A — concurrent claims: exactly one wins', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: ACTION,
      nowIso: NOW,
    });
    await store.save(record);
    const results = await Promise.all([
      claimHumanStartProof({
        store,
        presentedToken: issued.token,
        expectedActorId: 'actor-1',
        expectedWorkspaceId: 'ws-1',
        expectedSessionId: 'sess-1',
        expectedActionCommand: ACTION,
        nowIso: NOW,
      }),
      claimHumanStartProof({
        store,
        presentedToken: issued.token,
        expectedActorId: 'actor-1',
        expectedWorkspaceId: 'ws-1',
        expectedSessionId: 'sess-1',
        expectedActionCommand: ACTION,
        nowIso: NOW,
      }),
    ]);
    const claimed = results.filter((r) => r.status === 'claimed');
    const denied = results.filter((r) => r.status === 'replayed');
    expect(claimed).toHaveLength(1);
    expect(denied).toHaveLength(1);
  });

  it('Case B — two API instances against shared durable store: one claim only', async () => {
    const shared = newSharedDurableState();
    const instance1 = new PrismaHumanStartProofStore(createSharedPrismaFake(shared) as never);
    const instance2 = new PrismaHumanStartProofStore(createSharedPrismaFake(shared) as never);
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: ACTION,
      nowIso: NOW,
    });
    await instance1.save(record);
    const [a, b] = await Promise.all([
      claimHumanStartProof({
        store: instance1,
        presentedToken: issued.token,
        expectedActorId: 'actor-1',
        expectedWorkspaceId: 'ws-1',
        expectedSessionId: 'sess-1',
        expectedActionCommand: ACTION,
        nowIso: NOW,
      }),
      claimHumanStartProof({
        store: instance2,
        presentedToken: issued.token,
        expectedActorId: 'actor-1',
        expectedWorkspaceId: 'ws-1',
        expectedSessionId: 'sess-1',
        expectedActionCommand: ACTION,
        nowIso: NOW,
      }),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual(['claimed', 'replayed']);
  });

  it('Case C — worker retry after claim fails closed', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: ACTION,
      nowIso: NOW,
    });
    await store.save(record);
    const first = await claimHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: NOW,
    });
    expect(first.status).toBe('claimed');
    const retry = await claimHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: NOW,
    });
    expect(retry.status).toBe('replayed');
  });

  it('Case D — process restart: claimed state survives', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: ACTION,
      nowIso: NOW,
    });
    await store.save(record);
    await claimHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: NOW,
    });
    const snapshot = store.snapshot();
    const afterRestart = new InMemoryHumanStartProofStore();
    afterRestart.restore(snapshot);
    const replay = await claimHumanStartProof({
      store: afterRestart,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: NOW,
    });
    expect(replay.status).toBe('replayed');
  });

  it('Case E — wrong ACTION denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: ACTION,
      nowIso: NOW,
    });
    await store.save(record);
    const result = await claimHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: OTHER_ACTION,
      nowIso: NOW,
    });
    expect(result.status).toBe('action_mismatch');
  });

  it('Case F — wrong actor denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: ACTION,
      nowIso: NOW,
    });
    await store.save(record);
    expect(
      (
        await claimHumanStartProof({
          store,
          presentedToken: issued.token,
          expectedActorId: 'actor-other',
          expectedWorkspaceId: 'ws-1',
          expectedSessionId: 'sess-1',
          expectedActionCommand: ACTION,
          nowIso: NOW,
        })
      ).status,
    ).toBe('actor_mismatch');
  });

  it('Case G — wrong workspace denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: ACTION,
      nowIso: NOW,
    });
    await store.save(record);
    expect(
      (
        await claimHumanStartProof({
          store,
          presentedToken: issued.token,
          expectedActorId: 'actor-1',
          expectedWorkspaceId: 'ws-other',
          expectedSessionId: 'sess-1',
          expectedActionCommand: ACTION,
          nowIso: NOW,
        })
      ).status,
    ).toBe('workspace_mismatch');
  });

  it('Case H — wrong session denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: ACTION,
      nowIso: NOW,
    });
    await store.save(record);
    expect(
      (
        await claimHumanStartProof({
          store,
          presentedToken: issued.token,
          expectedActorId: 'actor-1',
          expectedWorkspaceId: 'ws-1',
          expectedSessionId: 'sess-other',
          expectedActionCommand: ACTION,
          nowIso: NOW,
        })
      ).status,
    ).toBe('session_mismatch');
  });

  it('Case I — expired proof denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: ACTION,
      nowIso: NOW,
      ttlMs: 1_000,
    });
    await store.save(record);
    const later = '2026-09-17T12:30:00.000Z';
    expect(
      (
        await claimHumanStartProof({
          store,
          presentedToken: issued.token,
          expectedActorId: 'actor-1',
          expectedWorkspaceId: 'ws-1',
          expectedSessionId: 'sess-1',
          expectedActionCommand: ACTION,
          nowIso: later,
        })
      ).status,
    ).toBe('expired');
  });

  it('HS1-12 S04 revalidation precedes atomic claim; claim ≠ venue submit', async () => {
    const store = new InMemoryHumanStartProofStore();
    const service = createAdmissionService(store);
    const issued = await service.issueHumanStart({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: ACTION,
      nowIso: NOW,
    });
    const evaluateOnly = await service.evaluate({
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actorId: 'actor-1',
      actorRole: Role.Trader,
      session: sessionFacts,
      humanStartToken: issued.token,
      actionCommand: ACTION,
      gateRequest: { libraryEntryId: 'lib-1' },
      v2Overrides: { liveCapitalAuthorized: true, paperFreezeBlocksLive: false },
      authorizationOverride: 'allowed',
      evaluatedAt: NOW,
    });
    expect(evaluateOnly.allowed).toBe(true);
    const stillOpen = await verifyHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: NOW,
    });
    expect(stillOpen.status).toBe('valid');

    const claim = await service.claimHumanStartAfterS04Revalidation({
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actorId: 'actor-1',
      actorRole: Role.Trader,
      session: sessionFacts,
      humanStartToken: issued.token,
      actionCommand: ACTION,
      gateRequest: { libraryEntryId: 'lib-1' },
      v2Overrides: { liveCapitalAuthorized: true, paperFreezeBlocksLive: false },
      authorizationOverride: 'allowed',
      evaluatedAt: NOW,
      claimedLogicalActionId: 'logical-action-1',
    });
    expect(claim.status).toBe('claimed');
    if (claim.status === 'claimed') {
      expect(claim.admission.allowed).toBe(true);
      expect(claim.proofId).toBeTruthy();
      // Claim is authorization only — no SUBMITTED/ACCEPTED/FILLED semantics.
      expect(Object.keys(claim)).not.toContain('orderStatus');
      expect(Object.keys(claim)).not.toContain('venueSubmission');
    }

    const second = await service.claimHumanStartAfterS04Revalidation({
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actorId: 'actor-1',
      actorRole: Role.Trader,
      session: sessionFacts,
      humanStartToken: issued.token,
      actionCommand: ACTION,
      gateRequest: { libraryEntryId: 'lib-1' },
      v2Overrides: { liveCapitalAuthorized: true, paperFreezeBlocksLive: false },
      authorizationOverride: 'allowed',
      evaluatedAt: NOW,
    });
    expect(second.status).toBe('admission_denied');
  });

  it('crash before claim: proof remains claimable', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: ACTION,
      nowIso: NOW,
    });
    await store.save(record);
    await verifyHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: NOW,
    });
    // Simulated crash before claim — proof still claimable.
    const claim = await claimHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: NOW,
    });
    expect(claim.status).toBe('claimed');
  });
});
