/**
 * PROPOSED-V3-L01-S04 — In-memory human-start proof store.
 * Process-local single-use / TTL substrate. Not password-reset. Not L05.
 */

import type { HumanStartProofRecord, HumanStartProofStore } from './domain/human-start-proof';

export class InMemoryHumanStartProofStore implements HumanStartProofStore {
  private readonly byHash = new Map<string, HumanStartProofRecord>();
  private readonly byId = new Map<string, HumanStartProofRecord>();

  async save(record: HumanStartProofRecord): Promise<void> {
    this.byHash.set(record.tokenHash, record);
    this.byId.set(record.id, record);
  }

  async findByTokenHash(tokenHash: string): Promise<HumanStartProofRecord | null> {
    return this.byHash.get(tokenHash) ?? null;
  }

  async consumeIfActive(id: string, consumedAtIso: string): Promise<boolean> {
    const current = this.byId.get(id);
    if (!current || current.consumedAt !== null) {
      return false;
    }
    if (Date.parse(current.expiresAt) <= Date.parse(consumedAtIso)) {
      return false;
    }
    const next = Object.freeze({ ...current, consumedAt: consumedAtIso });
    this.byId.set(id, next);
    this.byHash.set(next.tokenHash, next);
    return true;
  }

  /** Test helper — clear all proofs. */
  clear(): void {
    this.byHash.clear();
    this.byId.clear();
  }
}
