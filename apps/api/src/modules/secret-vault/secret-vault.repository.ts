import type { HoldableSecretType } from './holdable-secret-type';
import type { SecretPurpose } from './secret-purpose';
import type { SecretVaultRecord } from './secret-record';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';

export type SecretSlot = Readonly<{
  workspaceId: string;
  type: HoldableSecretType;
  purpose: SecretPurpose;
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
  deleteIfRevision(
    slot: SecretSlot,
    expectedRevision: number,
    transaction?: TransactionContext,
  ): Promise<boolean>;
}
