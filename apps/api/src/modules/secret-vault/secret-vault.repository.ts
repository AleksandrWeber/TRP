import type { HoldableSecretType } from './holdable-secret-type';
import type { SecretPurpose } from './secret-purpose';
import type { SecretVaultRecord } from './secret-record';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';

export type SecretSlot = Readonly<{
  workspaceId: string;
  type: HoldableSecretType;
  purpose: SecretPurpose;
}>;

/**
 * Narrow metadata projection for FIV-CONN-04-D compound lookup (VMP-1).
 * Query-level minimization only — never a full ciphertext row.
 */
export type SecretVaultMetadataProjection = Readonly<{
  id: string;
  workspaceId: string;
  purpose: string;
  state: string;
}>;

export interface SecretVaultRepository {
  /**
   * Atomically creates (expectedRevision null) or updates (expectedRevision number)
   * a slot only when the stored revision still matches.
   */
  compareAndSet(
    record: SecretVaultRecord,
    expectedRevision: number | null,
    transaction?: TransactionContext,
  ): Promise<boolean>;
  findBySlot(slot: SecretSlot): Promise<SecretVaultRecord | null>;
  listByWorkspaceId(workspaceId: string): Promise<SecretVaultRecord[]>;
  /**
   * Exact compound metadata lookup: WHERE id AND workspaceId; narrow select only.
   * Returns null when no matching row (incl. foreign workspace).
   */
  findMetadataByIdAndWorkspaceId(
    vaultSecretId: string,
    workspaceId: string,
  ): Promise<SecretVaultMetadataProjection | null>;
  deleteIfRevision(
    slot: SecretSlot,
    expectedRevision: number,
    transaction?: TransactionContext,
  ): Promise<boolean>;
}
