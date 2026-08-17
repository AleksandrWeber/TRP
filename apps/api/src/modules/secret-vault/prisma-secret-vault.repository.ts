import type { PrismaClient } from '@prisma/client';
import {
  cloneSecretCiphertext,
  isSecretCiphertext,
  type SecretCiphertext,
} from './secret-ciphertext';
import { cloneSecretVaultRecord, type SecretVaultRecord } from './secret-record';
import { assertCiphertextOnlyPersist } from './secret-persist';
import type { SecretSlot, SecretVaultRepository } from './secret-vault.repository';
import type { HoldableSecretType } from './holdable-secret-type';
import type { SecretPurpose } from './secret-purpose';
import type { PersistedSecretState } from './secret-state';

type VaultSecretRow = {
  id: string;
  workspaceId: string;
  type: string;
  purpose: string;
  state: string;
  revision: number;
  wrappingSalt: string | null;
  wrappedDataKey: string | null;
  dataKeyNonce: string | null;
  dataKeyTag: string | null;
  payload: string | null;
  payloadNonce: string | null;
  payloadTag: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toCiphertext(row: VaultSecretRow): SecretCiphertext | null {
  if (
    row.wrappingSalt === null ||
    row.wrappedDataKey === null ||
    row.dataKeyNonce === null ||
    row.dataKeyTag === null ||
    row.payload === null ||
    row.payloadNonce === null ||
    row.payloadTag === null
  ) {
    return null;
  }
  const ciphertext = {
    version: 1 as const,
    wrappingSalt: row.wrappingSalt,
    wrappedDataKey: row.wrappedDataKey,
    dataKeyNonce: row.dataKeyNonce,
    dataKeyTag: row.dataKeyTag,
    payload: row.payload,
    payloadNonce: row.payloadNonce,
    payloadTag: row.payloadTag,
  };
  return isSecretCiphertext(ciphertext) ? cloneSecretCiphertext(ciphertext) : null;
}

function toRecord(row: VaultSecretRow): SecretVaultRecord {
  const record: SecretVaultRecord = Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    type: row.type as HoldableSecretType,
    purpose: row.purpose as SecretPurpose,
    state: row.state as PersistedSecretState,
    revision: row.revision,
    ciphertext: toCiphertext(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
  assertCiphertextOnlyPersist(record);
  return cloneSecretVaultRecord(record);
}

function ciphertextColumns(ciphertext: SecretCiphertext | null) {
  return {
    wrappingSalt: ciphertext?.wrappingSalt ?? null,
    wrappedDataKey: ciphertext?.wrappedDataKey ?? null,
    dataKeyNonce: ciphertext?.dataKeyNonce ?? null,
    dataKeyTag: ciphertext?.dataKeyTag ?? null,
    payload: ciphertext?.payload ?? null,
    payloadNonce: ciphertext?.payloadNonce ?? null,
    payloadTag: ciphertext?.payloadTag ?? null,
  };
}

/**
 * Persists Vault ciphertext on vault_secrets (V3-S03-b).
 * Does not store wrapping keys or plaintext. Not ExchangeConnection.
 */
export class PrismaSecretVaultRepository implements SecretVaultRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async compareAndSet(
    record: SecretVaultRecord,
    expectedRevision: number | null,
  ): Promise<boolean> {
    assertCiphertextOnlyPersist(record);
    const columns = ciphertextColumns(record.ciphertext);
    if (expectedRevision === null) {
      try {
        await this.prisma.vaultSecret.create({
          data: {
            id: record.id,
            workspaceId: record.workspaceId,
            type: record.type,
            purpose: record.purpose,
            state: record.state,
            revision: record.revision,
            ...columns,
            createdAt: new Date(record.createdAt),
            updatedAt: new Date(record.updatedAt),
          },
        });
        return true;
      } catch (error) {
        if (isPrismaUniqueConstraint(error)) return false;
        throw error;
      }
    }
    const updated = await this.prisma.vaultSecret.updateMany({
      where: {
        id: record.id,
        workspaceId: record.workspaceId,
        type: record.type,
        purpose: record.purpose,
        revision: expectedRevision,
      },
      data: {
        state: record.state,
        revision: record.revision,
        ...columns,
        updatedAt: new Date(record.updatedAt),
      },
    });
    return updated.count === 1;
  }

  async findBySlot(slot: SecretSlot): Promise<SecretVaultRecord | null> {
    const row = await this.prisma.vaultSecret.findUnique({
      where: {
        workspaceId_type_purpose: {
          workspaceId: slot.workspaceId,
          type: slot.type,
          purpose: slot.purpose,
        },
      },
    });
    return row ? toRecord(row) : null;
  }

  async listByWorkspaceId(workspaceId: string): Promise<SecretVaultRecord[]> {
    const rows = await this.prisma.vaultSecret.findMany({
      where: { workspaceId },
    });
    return rows.map((row) => toRecord(row));
  }

  async deleteIfRevision(slot: SecretSlot, expectedRevision: number): Promise<boolean> {
    const deleted = await this.prisma.vaultSecret.deleteMany({
      where: {
        workspaceId: slot.workspaceId,
        type: slot.type,
        purpose: slot.purpose,
        revision: expectedRevision,
      },
    });
    return deleted.count === 1;
  }
}

function isPrismaUniqueConstraint(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}
