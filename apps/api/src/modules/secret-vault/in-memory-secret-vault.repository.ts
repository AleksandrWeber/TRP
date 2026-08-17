import type { SecretSlot, SecretVaultRepository } from './secret-vault.repository';
import { cloneSecretVaultRecord, type SecretVaultRecord } from './secret-record';
import { assertCiphertextOnlyPersist } from './secret-persist';

function slotKey(slot: SecretSlot): string {
  return `${slot.workspaceId}:${slot.type}:${slot.purpose}`;
}

/**
 * Process-local Vault store (V3-S03-b).
 * Holds ciphertext only. Not .env. Wrapping key is not stored here.
 */
export class InMemorySecretVaultRepository implements SecretVaultRepository {
  private readonly bySlot = new Map<string, SecretVaultRecord>();

  async compareAndSet(
    record: SecretVaultRecord,
    expectedRevision: number | null,
  ): Promise<boolean> {
    assertCiphertextOnlyPersist(record);
    const key = slotKey(record);
    const existing = this.bySlot.get(key);
    if (expectedRevision === null) {
      if (existing) return false;
    } else if (!existing || existing.revision !== expectedRevision) {
      return false;
    }
    this.bySlot.set(key, cloneSecretVaultRecord(record));
    return true;
  }

  async findBySlot(slot: SecretSlot): Promise<SecretVaultRecord | null> {
    const record = this.bySlot.get(slotKey(slot));
    return record ? cloneSecretVaultRecord(record) : null;
  }

  async listByWorkspaceId(workspaceId: string): Promise<SecretVaultRecord[]> {
    return [...this.bySlot.values()]
      .filter((record) => record.workspaceId === workspaceId)
      .map((record) => cloneSecretVaultRecord(record));
  }

  async deleteIfRevision(slot: SecretSlot, expectedRevision: number): Promise<boolean> {
    const key = slotKey(slot);
    const existing = this.bySlot.get(key);
    if (!existing || existing.revision !== expectedRevision) {
      return false;
    }
    this.bySlot.delete(key);
    return true;
  }

  snapshot(): string {
    return JSON.stringify([...this.bySlot.values()]);
  }

  static fromSnapshot(serialized: string): InMemorySecretVaultRepository {
    const repo = new InMemorySecretVaultRepository();
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      return repo;
    }
    for (const item of parsed) {
      const record = item as SecretVaultRecord;
      assertCiphertextOnlyPersist(record);
      repo.bySlot.set(slotKey(record), cloneSecretVaultRecord(record));
    }
    return repo;
  }
}
