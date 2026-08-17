/**
 * Secure storage model (V3-S03-b).
 * Persisted form is ciphertext. Plaintext and wrapping key never persist.
 */

import type { SecretFieldMap } from './secret-material';
import type { SecretVaultRecord } from './secret-record';
import { VaultUnavailableError } from './vault-errors';

const FORBIDDEN_PERSIST_KEYS = [
  'material',
  'fields',
  'apiKey',
  'apiSecret',
  'secret',
  'token',
  'password',
  'wrappingKey',
  'VAULT_WRAPPING_KEY',
] as const;

export function serializePersistedRecords(records: readonly SecretVaultRecord[]): string {
  return JSON.stringify(records);
}

export function persistedFormContainsPlaintext(
  serialized: string,
  fields: SecretFieldMap,
): boolean {
  return Object.values(fields).some((value) => value.length > 0 && serialized.includes(value));
}

export function persistedFormContainsWrappingKey(
  serialized: string,
  wrappingKeyRaw: string,
): boolean {
  return wrappingKeyRaw.length > 0 && serialized.includes(wrappingKeyRaw);
}

export function assertCiphertextOnlyPersist(record: SecretVaultRecord): void {
  const keys = Object.keys(record);
  for (const forbidden of FORBIDDEN_PERSIST_KEYS) {
    if (keys.includes(forbidden)) {
      throw new VaultUnavailableError('Vault cannot persist plaintext secrets.');
    }
  }
  if (record.state === 'Connected' && record.ciphertext === null) {
    throw new VaultUnavailableError('Vault cannot persist plaintext secrets.');
  }
}
