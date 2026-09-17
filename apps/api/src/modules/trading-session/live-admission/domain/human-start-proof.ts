/**
 * V3-L02-S-HS1 / PROPOSED-V3-L01-S04 — Human-start proof (PO-S04-06, PO-L02-05A…D).
 *
 * Distinct from JWT authn, Admin policy enablement, and Gate stamps.
 * Pattern: password-reset issue/consume/TTL/hash (node:crypto).
 * Not L05 financial API replay protection.
 *
 * Claim ≠ submit ≠ accept ≠ fill.
 * Verify (admission) MUST NOT claim. Atomic claim happens only after S04 revalidation,
 * immediately before irreversible venue I/O (venue I/O is out of HS1 scope).
 */

import { createHash, randomBytes, randomUUID } from 'node:crypto';

export const HUMAN_START_PROOF_TTL_MS = 15 * 60 * 1000;
export const HUMAN_START_PROOF_SCHEMA_VERSION = 1 as const;

export type HumanStartProofRecord = Readonly<{
  id: string;
  tokenHash: string;
  actorId: string;
  workspaceId: string;
  sessionId: string;
  actionCommand: string;
  expiresAt: string;
  /** Null until atomic claim. Claim ≠ venue submission. */
  claimedAt: string | null;
  claimedLogicalActionId: string | null;
  createdAt: string;
  schemaVersion: typeof HUMAN_START_PROOF_SCHEMA_VERSION;
}>;

export type IssuedHumanStartProof = Readonly<{
  proofId: string;
  token: string;
  actorId: string;
  workspaceId: string;
  sessionId: string;
  actionCommand: string;
  expiresAt: string;
}>;

export type HumanStartDenialStatus =
  | 'missing'
  | 'invalid'
  | 'expired'
  | 'replayed'
  | 'actor_mismatch'
  | 'workspace_mismatch'
  | 'session_mismatch'
  | 'action_mismatch';

export type HumanStartVerifyResult =
  | Readonly<{ status: 'valid'; record: HumanStartProofRecord }>
  | Readonly<{ status: HumanStartDenialStatus }>;

export type HumanStartClaimResult =
  | Readonly<{ status: 'claimed'; record: HumanStartProofRecord }>
  | Readonly<{ status: HumanStartDenialStatus }>;

export type HumanStartClaimBindings = Readonly<{
  workspaceId: string;
  actorId: string;
  sessionId: string;
  actionCommand: string;
}>;

export type HumanStartProofStore = {
  save(record: HumanStartProofRecord): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<HumanStartProofRecord | null>;
  /**
   * Race-safe conditional claim. Returns true only when this caller won the claim.
   * Implementations MUST enforce claimed_at IS NULL + expires_at > now + binding match
   * in a single atomic operation (e.g. UPDATE … WHERE …).
   */
  claimIfActive(input: {
    id: string;
    claimedAtIso: string;
    bindings: HumanStartClaimBindings;
    claimedLogicalActionId?: string | null;
  }): Promise<boolean>;
};

export function hashHumanStartToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function issueHumanStartProof(input: {
  actorId: string;
  workspaceId: string;
  sessionId: string;
  actionCommand: string;
  nowIso: string;
  ttlMs?: number;
}): { record: HumanStartProofRecord; issued: IssuedHumanStartProof } {
  assertNonEmpty(input.actorId, 'actorId');
  assertNonEmpty(input.workspaceId, 'workspaceId');
  assertNonEmpty(input.sessionId, 'sessionId');
  assertNonEmpty(input.actionCommand, 'actionCommand');
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
    actionCommand: input.actionCommand.trim(),
    expiresAt,
    claimedAt: null,
    claimedLogicalActionId: null,
    createdAt: input.nowIso,
    schemaVersion: HUMAN_START_PROOF_SCHEMA_VERSION,
  });
  const issued: IssuedHumanStartProof = Object.freeze({
    proofId,
    token,
    actorId: record.actorId,
    workspaceId: record.workspaceId,
    sessionId: record.sessionId,
    actionCommand: record.actionCommand,
    expiresAt,
  });
  return { record, issued };
}

/**
 * Verify a human-start proof WITHOUT claiming it (admission / S04 path).
 * JWT alone is never accepted — a presented token is required.
 */
export async function verifyHumanStartProof(input: {
  store: HumanStartProofStore;
  presentedToken: string | null | undefined;
  expectedActorId: string;
  expectedWorkspaceId: string;
  expectedSessionId: string;
  expectedActionCommand: string;
  nowIso: string;
}): Promise<HumanStartVerifyResult> {
  return inspectHumanStartProof(input);
}

/**
 * Atomic claim after successful verify + S04 revalidation.
 * Does not perform venue I/O. Claim ≠ submit/accept/fill.
 */
export async function claimHumanStartProof(input: {
  store: HumanStartProofStore;
  presentedToken: string | null | undefined;
  expectedActorId: string;
  expectedWorkspaceId: string;
  expectedSessionId: string;
  expectedActionCommand: string;
  nowIso: string;
  claimedLogicalActionId?: string | null;
}): Promise<HumanStartClaimResult> {
  const verified = await inspectHumanStartProof(input);
  if (verified.status !== 'valid') {
    return Object.freeze({ status: verified.status });
  }

  const claimed = await input.store.claimIfActive({
    id: verified.record.id,
    claimedAtIso: input.nowIso,
    bindings: {
      workspaceId: input.expectedWorkspaceId.trim(),
      actorId: input.expectedActorId.trim(),
      sessionId: input.expectedSessionId.trim(),
      actionCommand: input.expectedActionCommand.trim(),
    },
    claimedLogicalActionId: input.claimedLogicalActionId ?? null,
  });
  if (!claimed) {
    return Object.freeze({ status: 'replayed' });
  }

  return Object.freeze({
    status: 'claimed',
    record: Object.freeze({
      ...verified.record,
      claimedAt: input.nowIso,
      claimedLogicalActionId: input.claimedLogicalActionId ?? null,
    }),
  });
}

/**
 * @deprecated Prefer verifyHumanStartProof (admission) + claimHumanStartProof (post-S04).
 * Retained for S04-era unit tests that assert single-use via verify+claim in one call.
 */
export async function verifyAndConsumeHumanStartProof(input: {
  store: HumanStartProofStore;
  presentedToken: string | null | undefined;
  expectedActorId: string;
  expectedWorkspaceId: string;
  expectedSessionId: string;
  expectedActionCommand: string;
  nowIso: string;
}): Promise<HumanStartVerifyResult> {
  const claimed = await claimHumanStartProof(input);
  if (claimed.status === 'claimed') {
    return Object.freeze({ status: 'valid', record: claimed.record });
  }
  return Object.freeze({ status: claimed.status });
}

async function inspectHumanStartProof(input: {
  store: HumanStartProofStore;
  presentedToken: string | null | undefined;
  expectedActorId: string;
  expectedWorkspaceId: string;
  expectedSessionId: string;
  expectedActionCommand: string;
  nowIso: string;
}): Promise<HumanStartVerifyResult> {
  if (input.presentedToken === null || input.presentedToken === undefined) {
    return Object.freeze({ status: 'missing' });
  }
  if (input.presentedToken.trim().length === 0) {
    return Object.freeze({ status: 'missing' });
  }
  if (input.expectedActionCommand.trim().length === 0) {
    return Object.freeze({ status: 'action_mismatch' });
  }

  const nowMs = Date.parse(input.nowIso);
  if (Number.isNaN(nowMs)) {
    return Object.freeze({ status: 'invalid' });
  }

  const current = await input.store.findByTokenHash(hashHumanStartToken(input.presentedToken));
  if (!current) {
    return Object.freeze({ status: 'invalid' });
  }
  if (current.claimedAt !== null) {
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
  if (current.actionCommand !== input.expectedActionCommand.trim()) {
    return Object.freeze({ status: 'action_mismatch' });
  }

  return Object.freeze({ status: 'valid', record: current });
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be non-empty`);
  }
}
