/**
 * PROPOSED-V3-L01-S04 — Human-start proof (PO-S04-06).
 *
 * Distinct from JWT authn, Admin policy enablement, and Gate stamps.
 * Pattern: password-reset issue/consume/TTL/hash (node:crypto).
 * Not L05 financial API replay protection.
 */

import { createHash, randomBytes, randomUUID } from 'node:crypto';

export const HUMAN_START_PROOF_TTL_MS = 15 * 60 * 1000;

export type HumanStartProofRecord = Readonly<{
  id: string;
  tokenHash: string;
  actorId: string;
  workspaceId: string;
  sessionId: string;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
}>;

export type IssuedHumanStartProof = Readonly<{
  proofId: string;
  token: string;
  actorId: string;
  workspaceId: string;
  sessionId: string;
  expiresAt: string;
}>;

export type HumanStartVerifyResult =
  | Readonly<{ status: 'valid'; record: HumanStartProofRecord }>
  | Readonly<{
      status:
        | 'missing'
        | 'invalid'
        | 'expired'
        | 'replayed'
        | 'actor_mismatch'
        | 'workspace_mismatch'
        | 'session_mismatch';
    }>;

export type HumanStartProofStore = {
  save(record: HumanStartProofRecord): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<HumanStartProofRecord | null>;
  consumeIfActive(id: string, consumedAtIso: string): Promise<boolean>;
};

export function hashHumanStartToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function issueHumanStartProof(input: {
  actorId: string;
  workspaceId: string;
  sessionId: string;
  nowIso: string;
  ttlMs?: number;
}): { record: HumanStartProofRecord; issued: IssuedHumanStartProof } {
  assertNonEmpty(input.actorId, 'actorId');
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.sessionId, 'sessionId');
  const nowMs = Date.parse(input.nowIso);
  if (Number.isNaN(nowMs)) {
    throw new Error(`Invalid ISO timestamp for nowIso: ${input.nowIso}`);
  }
  const ttl = input.ttlMs ?? HUMAN_START_PROOF_TTL_MS;
  const token = randomBytes(32).toString('base64url');
  const proofId = randomUUID();
  const expiresAt = new Date(nowMs + ttl).toISOString();
  const record: HumanStartProofRecord = Object.freeze({
    id: proofId,
    tokenHash: hashHumanStartToken(token),
    actorId: input.actorId.trim(),
    workspaceId: input.workspaceId.trim(),
    sessionId: input.sessionId.trim(),
    expiresAt,
    consumedAt: null,
    createdAt: input.nowIso,
  });
  const issued: IssuedHumanStartProof = Object.freeze({
    proofId,
    token,
    actorId: record.actorId,
    workspaceId: record.workspaceId,
    sessionId: record.sessionId,
    expiresAt,
  });
  return { record, issued };
}

/**
 * Verify and consume a human-start proof (single-use).
 * JWT alone is never accepted — a presented token is required.
 */
export async function verifyAndConsumeHumanStartProof(input: {
  store: HumanStartProofStore;
  presentedToken: string | null | undefined;
  expectedActorId: string;
  expectedWorkspaceId: string;
  expectedSessionId: string;
  nowIso: string;
}): Promise<HumanStartVerifyResult> {
  if (input.presentedToken === null || input.presentedToken === undefined) {
    return Object.freeze({ status: 'missing' });
  }
  if (input.presentedToken.trim().length === 0) {
    return Object.freeze({ status: 'missing' });
  }

  const nowMs = Date.parse(input.nowIso);
  if (Number.isNaN(nowMs)) {
    return Object.freeze({ status: 'invalid' });
  }

  const current = await input.store.findByTokenHash(hashHumanStartToken(input.presentedToken));
  if (!current) {
    return Object.freeze({ status: 'invalid' });
  }
  if (current.consumedAt !== null) {
    return Object.freeze({ status: 'replayed' });
  }
  if (Date.parse(current.expiresAt) <= nowMs) {
    return Object.freeze({ status: 'expired' });
  }
  if (current.actorId !== input.expectedActorId.trim()) {
    return Object.freeze({ status: 'actor_mismatch' });
  }
  if (current.workspaceId !== input.expectedWorkspaceId.trim()) {
    return Object.freeze({ status: 'workspace_mismatch' });
  }
  if (current.sessionId !== input.expectedSessionId.trim()) {
    return Object.freeze({ status: 'session_mismatch' });
  }

  const consumed = await input.store.consumeIfActive(current.id, input.nowIso);
  if (!consumed) {
    return Object.freeze({ status: 'replayed' });
  }

  return Object.freeze({
    status: 'valid',
    record: Object.freeze({ ...current, consumedAt: input.nowIso }),
  });
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be non-empty`);
  }
}
