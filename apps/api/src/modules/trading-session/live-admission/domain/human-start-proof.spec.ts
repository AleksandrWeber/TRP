/**
 * PROPOSED-V3-L01-S04 / V3-L02-S-HS1 — Human-start proof security tests.
 */

import { describe, expect, it } from 'vitest';
import { InMemoryHumanStartProofStore } from '../in-memory-human-start-proof.store';
import {
  HUMAN_START_PROOF_TTL_MS,
  claimHumanStartProof,
  issueHumanStartProof,
  verifyAndConsumeHumanStartProof,
  verifyHumanStartProof,
} from './human-start-proof';

const ACTION = 'LIVE_SUBMIT_ORDER';
const OTHER_ACTION = 'LIVE_CANCEL_ORDER';

describe('human-start proof (PROPOSED-V3-L01-S04 / V3-L02-S-HS1)', () => {
  const now = '2026-09-17T12:00:00.000Z';

  function issue(store: InMemoryHumanStartProofStore, overrides?: { actionCommand?: string }) {
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: overrides?.actionCommand ?? ACTION,
      nowIso: now,
    });
    return { record, issued, save: () => store.save(record) };
  }

  it('T-19 issues and verifies a valid proof (verify without claim)', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issue(store);
    await store.save(record);
    const result = await verifyHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: now,
    });
    expect(result.status).toBe('valid');
    const stillUnclaimed = await store.findByTokenHash(record.tokenHash);
    expect(stillUnclaimed?.claimedAt).toBeNull();
  });

  it('T-20 missing token denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const result = await verifyHumanStartProof({
      store,
      presentedToken: null,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: now,
    });
    expect(result.status).toBe('missing');
  });

  it('T-21 invalid token denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const result = await verifyHumanStartProof({
      store,
      presentedToken: 'not-a-real-token',
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: now,
    });
    expect(result.status).toBe('invalid');
  });

  it('T-22 wrong actor denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issue(store);
    await store.save(record);
    const result = await verifyHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'other-actor',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: now,
    });
    expect(result.status).toBe('actor_mismatch');
  });

  it('T-23 wrong workspace denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issue(store);
    await store.save(record);
    const result = await verifyHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-other',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: now,
    });
    expect(result.status).toBe('workspace_mismatch');
  });

  it('T-24 wrong Session denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issue(store);
    await store.save(record);
    const result = await verifyHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-other',
      expectedActionCommand: ACTION,
      nowIso: now,
    });
    expect(result.status).toBe('session_mismatch');
  });

  it('HS1-E wrong ACTION/COMMAND denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issue(store);
    await store.save(record);
    const result = await verifyHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: OTHER_ACTION,
      nowIso: now,
    });
    expect(result.status).toBe('action_mismatch');
  });

  it('T-25 expired proof denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      actionCommand: ACTION,
      nowIso: now,
      ttlMs: 1000,
    });
    await store.save(record);
    const later = new Date(Date.parse(now) + HUMAN_START_PROOF_TTL_MS + 60_000).toISOString();
    const result = await verifyHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: later,
    });
    expect(result.status).toBe('expired');
  });

  it('T-26 replayed proof denies after claim', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issue(store);
    await store.save(record);
    const first = await verifyAndConsumeHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: now,
    });
    expect(first.status).toBe('valid');
    const second = await verifyAndConsumeHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: now,
    });
    expect(second.status).toBe('replayed');
  });

  it('T-27 empty token treated as missing (JWT alone insufficient)', async () => {
    const store = new InMemoryHumanStartProofStore();
    const result = await verifyHumanStartProof({
      store,
      presentedToken: '   ',
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: now,
    });
    expect(result.status).toBe('missing');
  });

  it('HS1 claim is distinct from verify (verify leaves proof claimable)', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issue(store);
    await store.save(record);
    await verifyHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: now,
    });
    const claim = await claimHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      expectedActionCommand: ACTION,
      nowIso: now,
    });
    expect(claim.status).toBe('claimed');
    if (claim.status === 'claimed') {
      expect(claim.record.claimedAt).toBe(now);
    }
  });
});
