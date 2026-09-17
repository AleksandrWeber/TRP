/**
 * PROPOSED-V3-L01-S04 — Human-start proof security tests (PO-S04-06).
 */

import { describe, expect, it } from 'vitest';
import { InMemoryHumanStartProofStore } from '../in-memory-human-start-proof.store';
import {
  HUMAN_START_PROOF_TTL_MS,
  issueHumanStartProof,
  verifyAndConsumeHumanStartProof,
} from './human-start-proof';

describe('human-start proof (PROPOSED-V3-L01-S04)', () => {
  const now = '2026-09-17T12:00:00.000Z';

  it('T-19 issues and verifies a valid proof', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      nowIso: now,
    });
    await store.save(record);
    const result = await verifyAndConsumeHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      nowIso: now,
    });
    expect(result.status).toBe('valid');
  });

  it('T-20 missing token denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const result = await verifyAndConsumeHumanStartProof({
      store,
      presentedToken: null,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      nowIso: now,
    });
    expect(result.status).toBe('missing');
  });

  it('T-21 invalid token denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const result = await verifyAndConsumeHumanStartProof({
      store,
      presentedToken: 'not-a-real-token',
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      nowIso: now,
    });
    expect(result.status).toBe('invalid');
  });

  it('T-22 wrong actor denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      nowIso: now,
    });
    await store.save(record);
    const result = await verifyAndConsumeHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'other-actor',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      nowIso: now,
    });
    expect(result.status).toBe('actor_mismatch');
  });

  it('T-23 wrong workspace denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      nowIso: now,
    });
    await store.save(record);
    const result = await verifyAndConsumeHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-other',
      expectedSessionId: 'sess-1',
      nowIso: now,
    });
    expect(result.status).toBe('workspace_mismatch');
  });

  it('T-24 wrong Session denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      nowIso: now,
    });
    await store.save(record);
    const result = await verifyAndConsumeHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-other',
      nowIso: now,
    });
    expect(result.status).toBe('session_mismatch');
  });

  it('T-25 expired proof denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      nowIso: now,
      ttlMs: 1000,
    });
    await store.save(record);
    const later = new Date(Date.parse(now) + HUMAN_START_PROOF_TTL_MS + 60_000).toISOString();
    const result = await verifyAndConsumeHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      nowIso: later,
    });
    expect(result.status).toBe('expired');
  });

  it('T-26 replayed proof denies', async () => {
    const store = new InMemoryHumanStartProofStore();
    const { record, issued } = issueHumanStartProof({
      actorId: 'actor-1',
      workspaceId: 'ws-1',
      sessionId: 'sess-1',
      nowIso: now,
    });
    await store.save(record);
    const first = await verifyAndConsumeHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      nowIso: now,
    });
    expect(first.status).toBe('valid');
    const second = await verifyAndConsumeHumanStartProof({
      store,
      presentedToken: issued.token,
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      nowIso: now,
    });
    expect(second.status).toBe('replayed');
  });

  it('T-27 empty token treated as missing (JWT alone insufficient)', async () => {
    const store = new InMemoryHumanStartProofStore();
    const result = await verifyAndConsumeHumanStartProof({
      store,
      presentedToken: '   ',
      expectedActorId: 'actor-1',
      expectedWorkspaceId: 'ws-1',
      expectedSessionId: 'sess-1',
      nowIso: now,
    });
    expect(result.status).toBe('missing');
  });
});
