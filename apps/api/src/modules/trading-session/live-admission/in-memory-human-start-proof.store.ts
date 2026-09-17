/**
 * V3-L02-S-HS1 — In-memory human-start proof store (tests / local harness).
 * Production Nest composition binds PrismaHumanStartProofStore (shared durable DB).
 * Process-local mutex serializes claimIfActive for concurrent-claim unit tests.
 * Claim ≠ venue submit. Not password-reset. Not L05.
 */

import type { HumanStartProofRecord, HumanStartProofStore } from './domain/human-start-proof';

export class InMemoryHumanStartProofStore implements HumanStartProofStore {
  private readonly byHash = new Map<string, HumanStartProofRecord>();
  private readonly byId = new Map<string, HumanStartProofRecord>();
  private claimChain: Promise<void> = Promise.resolve();

  async save(record: HumanStartProofRecord): Promise<void> {
    this.byHash.set(record.tokenHash, record);
    this.byId.set(record.id, record);
  }

  async findByTokenHash(tokenHash: string): Promise<HumanStartProofRecord | null> {
    return this.byHash.get(tokenHash) ?? null;
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
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previous = this.claimChain;
    this.claimChain = previous.then(() => gate);
    await previous;
    try {
      const current = this.byId.get(input.id);
      if (!current || current.claimedAt !== null) {
        return false;
      }
      if (Date.parse(current.expiresAt) <= Date.parse(input.claimedAtIso)) {
        return false;
      }
      if (
        current.workspaceId !== input.bindings.workspaceId ||
        current.actorId !== input.bindings.actorId ||
        current.sessionId !== input.bindings.sessionId ||
        current.actionCommand !== input.bindings.actionCommand
      ) {
        return false;
      }
      const next = Object.freeze({
        ...current,
        claimedAt: input.claimedAtIso,
        claimedLogicalActionId: input.claimedLogicalActionId ?? null,
      });
      this.byId.set(input.id, next);
      this.byHash.set(next.tokenHash, next);
      return true;
    } finally {
      release();
    }
  }

  /** Test helper — clear all proofs. */
  clear(): void {
    this.byHash.clear();
    this.byId.clear();
  }

  /** Test helper — export durable snapshot (restart simulation). */
  snapshot(): HumanStartProofRecord[] {
    return [...this.byId.values()].map((r) => Object.freeze({ ...r }));
  }

  /** Test helper — restore from snapshot into a fresh store instance. */
  restore(records: readonly HumanStartProofRecord[]): void {
    this.clear();
    for (const record of records) {
      this.byHash.set(record.tokenHash, record);
      this.byId.set(record.id, record);
    }
  }
}
