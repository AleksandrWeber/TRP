/**
 * FIV-CONN-04-D — Vault Metadata-Only Port (VMP-1 / D-CONN04-FULL-D-IA-VMP).
 *
 * Exact metadata view: { id, workspaceId, purpose, state }.
 * No plaintext, ciphertext, decryption, retrieve/mutate/admin, or broader DTOs.
 * Nest DI is an educational composition boundary only — not production Vault AuthZ.
 */

import type { SecretPurpose } from './secret-purpose';
import type { PersistedSecretState } from './secret-state';

export const FIV_CONN_04_D_VAULT_METADATA_PORT = Symbol('FIV_CONN_04_D_VAULT_METADATA_PORT');

export type FivConn04DVaultMetadataView = Readonly<{
  id: string;
  workspaceId: string;
  purpose: SecretPurpose;
  state: PersistedSecretState;
}>;

export type FivConn04DVaultMetadataLookupInput = Readonly<{
  workspaceId: string;
  vaultSecretId: string;
}>;

export type FivConn04DVaultMetadataLookupReason = 'NOT_FOUND' | 'UNAVAILABLE' | 'INVALID';

export type FivConn04DVaultMetadataLookupResult =
  | Readonly<{ ok: true; metadata: FivConn04DVaultMetadataView }>
  | Readonly<{ ok: false; reason: FivConn04DVaultMetadataLookupReason }>;

export interface FivConn04DVaultMetadataPort {
  lookupExact(
    input: FivConn04DVaultMetadataLookupInput,
  ): Promise<FivConn04DVaultMetadataLookupResult>;
}
