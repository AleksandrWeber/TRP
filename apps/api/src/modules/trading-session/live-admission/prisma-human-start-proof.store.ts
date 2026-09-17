/**
 * V3-L02-S-HS1 — Prisma-backed durable human-start proof store (PO-L02-05A…D).
 * Shared across API instances. Atomic claim via conditional updateMany.
 * Token plaintext is never persisted or logged. Claim ≠ venue submit/accept/fill.
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import {
  HUMAN_START_PROOF_SCHEMA_VERSION,
  type HumanStartProofRecord,
  type HumanStartProofStore,
} from './domain/human-start-proof';

type HumanStartProofRow = Prisma.HumanStartProofGetPayload<Record<string, never>>;

export class PrismaHumanStartProofStore implements HumanStartProofStore {
  constructor(private readonly prisma: PrismaClient) {}

  async save(record: HumanStartProofRecord): Promise<void> {
    await this.prisma.humanStartProof.create({
      data: {
        id: record.id,
        tokenHash: record.tokenHash,
        workspaceId: record.workspaceId,
        actorId: record.actorId,
        sessionId: record.sessionId,
        actionCommand: record.actionCommand,
        createdAt: new Date(record.createdAt),
        expiresAt: new Date(record.expiresAt),
        claimedAt: record.claimedAt !== null ? new Date(record.claimedAt) : null,
        claimedLogicalActionId: record.claimedLogicalActionId,
        schemaVersion: record.schemaVersion,
        updatedAt: new Date(record.createdAt),
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<HumanStartProofRecord | null> {
    const row = await this.prisma.humanStartProof.findUnique({ where: { tokenHash } });
    return row ? toDomain(row) : null;
  }

  async claimIfActive(input: {
    id: string;
    claimedAtIso: string;
    bindings: {
      workspaceId: string;
      actorId: string;
      sessionId: string;
      actionCommand: string;
    };
    claimedLogicalActionId?: string | null;
  }): Promise<boolean> {
    const claimedAt = new Date(input.claimedAtIso);
    const updated = await this.prisma.humanStartProof.updateMany({
      where: {
        id: input.id,
        claimedAt: null,
        expiresAt: { gt: claimedAt },
        workspaceId: input.bindings.workspaceId,
        actorId: input.bindings.actorId,
        sessionId: input.bindings.sessionId,
        actionCommand: input.bindings.actionCommand,
      },
      data: {
        claimedAt,
        claimedLogicalActionId: input.claimedLogicalActionId ?? null,
        updatedAt: claimedAt,
      },
    });
    return updated.count === 1;
  }
}

function toDomain(row: HumanStartProofRow): HumanStartProofRecord {
  if (row.schemaVersion !== HUMAN_START_PROOF_SCHEMA_VERSION) {
    throw new Error(`Unsupported human-start proof schema version: ${row.schemaVersion}`);
  }
  return Object.freeze({
    id: row.id,
    tokenHash: row.tokenHash,
    workspaceId: row.workspaceId,
    actorId: row.actorId,
    sessionId: row.sessionId,
    actionCommand: row.actionCommand,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    claimedAt: row.claimedAt?.toISOString() ?? null,
    claimedLogicalActionId: row.claimedLogicalActionId,
    schemaVersion: HUMAN_START_PROOF_SCHEMA_VERSION,
  });
}
