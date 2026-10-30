/**
 * FIV-CONN-04-D — Vault Metadata Port adapter (VMP-1).
 * Compound (id, workspaceId) lookup via repository; fail-closed outcomes only.
 */

import { Inject, Injectable } from '@nestjs/common';
import { isSecretPurpose } from './secret-purpose';
import { SecretState, type PersistedSecretState } from './secret-state';
import type {
  FivConn04DVaultMetadataLookupInput,
  FivConn04DVaultMetadataLookupResult,
  FivConn04DVaultMetadataPort,
  FivConn04DVaultMetadataView,
} from './fiv-conn-04-d-vault-metadata.port';
import type { SecretVaultRepository } from './secret-vault.repository';
import { SECRET_VAULT_REPOSITORY } from './secret-vault.repository.token';

function isPersistedSecretState(value: unknown): value is PersistedSecretState {
  return value === SecretState.Connected || value === SecretState.Revoked;
}

function isBlankId(value: string | undefined | null): boolean {
  return typeof value !== 'string' || value.trim().length === 0;
}

@Injectable()
export class FivConn04DVaultMetadataService implements FivConn04DVaultMetadataPort {
  constructor(
    @Inject(SECRET_VAULT_REPOSITORY)
    private readonly repository: SecretVaultRepository,
  ) {}

  async lookupExact(
    input: FivConn04DVaultMetadataLookupInput,
  ): Promise<FivConn04DVaultMetadataLookupResult> {
    if (isBlankId(input.workspaceId) || isBlankId(input.vaultSecretId)) {
      return Object.freeze({ ok: false, reason: 'INVALID' });
    }

    const workspaceId = input.workspaceId.trim();
    const vaultSecretId = input.vaultSecretId.trim();

    let row;
    try {
      row = await this.repository.findMetadataByIdAndWorkspaceId(vaultSecretId, workspaceId);
    } catch {
      return Object.freeze({ ok: false, reason: 'UNAVAILABLE' });
    }

    if (row === null) {
      return Object.freeze({ ok: false, reason: 'NOT_FOUND' });
    }

    if (
      typeof row.id !== 'string' ||
      row.id.trim().length === 0 ||
      typeof row.workspaceId !== 'string' ||
      row.workspaceId.trim().length === 0 ||
      !isSecretPurpose(row.purpose) ||
      !isPersistedSecretState(row.state)
    ) {
      return Object.freeze({ ok: false, reason: 'INVALID' });
    }

    const metadata: FivConn04DVaultMetadataView = Object.freeze({
      id: row.id,
      workspaceId: row.workspaceId,
      purpose: row.purpose,
      state: row.state,
    });
    return Object.freeze({ ok: true, metadata });
  }
}
