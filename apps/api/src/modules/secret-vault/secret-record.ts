/**
 * Vault metadata and stored records (V3-S03-c).
 * List/read models have no secret fields. Persisted records hold ciphertext only.
 * Lifecycle updates metadata without exposing secret material.
 */

import type { HoldableSecretType } from './holdable-secret-type';
import {
  cloneSecretCiphertext,
  isSecretCiphertext,
  type SecretCiphertext,
} from './secret-ciphertext';
import type { SecretPurpose } from './secret-purpose';
import {
  OperatorSecretLabel,
  SecretState,
  toOperatorLabel,
  type PersistedSecretState,
} from './secret-state';
import { VaultUnavailableError } from './vault-errors';

export type SecretVaultMetadata = Readonly<{
  id: string;
  workspaceId: string;
  type: HoldableSecretType;
  purpose: SecretPurpose;
  state: PersistedSecretState;
  operatorLabel: OperatorSecretLabel;
  createdAt: string;
  updatedAt: string;
}>;

export type SecretVaultRecord = Readonly<{
  id: string;
  workspaceId: string;
  type: HoldableSecretType;
  purpose: SecretPurpose;
  state: PersistedSecretState;
  revision: number;
  ciphertext: SecretCiphertext | null;
  createdAt: string;
  updatedAt: string;
}>;

const SECRET_FIELD_KEYS = [
  'material',
  'fields',
  'apiKey',
  'apiSecret',
  'secret',
  'token',
  'password',
  'ciphertext',
  'wrappingKey',
  'payload',
  'wrappedDataKey',
] as const;

export function toSecretVaultMetadata(record: SecretVaultRecord): SecretVaultMetadata {
  return Object.freeze({
    id: record.id,
    workspaceId: record.workspaceId,
    type: record.type,
    purpose: record.purpose,
    state: record.state,
    operatorLabel: toOperatorLabel(record.state),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function metadataContainsSecretFields(metadata: SecretVaultMetadata): boolean {
  const keys = Object.keys(metadata);
  return SECRET_FIELD_KEYS.some((key) => keys.includes(key));
}

export function isVaultConnected(metadata: SecretVaultMetadata): boolean {
  return metadata.state === SecretState.Connected;
}

/**
 * Metadata integrity: list/read models stay secret-free and labels match state.
 * Ciphertext usability is a retrieve concern, not a metadata concern.
 */
export function assertMetadataIntegrity(metadata: SecretVaultMetadata): void {
  if (metadataContainsSecretFields(metadata)) {
    throw new VaultUnavailableError();
  }
  if (isVaultConnected(metadata) && metadata.operatorLabel === OperatorSecretLabel.Invalid) {
    throw new VaultUnavailableError();
  }
  if (
    metadata.state === SecretState.Connected &&
    metadata.operatorLabel !== OperatorSecretLabel.Stored
  ) {
    throw new VaultUnavailableError();
  }
  if (
    metadata.state === SecretState.Revoked &&
    metadata.operatorLabel !== OperatorSecretLabel.Revoked
  ) {
    throw new VaultUnavailableError();
  }
}

export function assertConnectedCiphertextPresent(record: SecretVaultRecord): void {
  if (record.state !== SecretState.Connected) {
    return;
  }
  if (record.ciphertext === null || !isSecretCiphertext(record.ciphertext)) {
    throw new VaultUnavailableError('The credential cannot be used.');
  }
}

export function cloneSecretVaultRecord(record: SecretVaultRecord): SecretVaultRecord {
  return Object.freeze({
    ...record,
    ciphertext: record.ciphertext ? cloneSecretCiphertext(record.ciphertext) : null,
  });
}
