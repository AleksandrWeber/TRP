/**
 * Host wrapping key (V3-S03-b).
 * Same class as JWT_SECRET: host-operated, never a Vault record.
 * Missing or too short → Vault store/retrieve fail closed. API boot must not fail.
 */

import { VaultUnavailableError } from './vault-errors';

export const VAULT_WRAPPING_KEY_ENV = 'VAULT_WRAPPING_KEY';
export const MIN_WRAPPING_KEY_LENGTH = 32;

export type WrappingKeySource = Readonly<{
  resolve(): Buffer | null;
}>;

export function parseVaultWrappingKey(raw: string | undefined | null): Buffer | null {
  const trimmed = raw?.trim() ?? '';
  if (trimmed.length === 0) {
    return null;
  }
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }
  if (trimmed.length < MIN_WRAPPING_KEY_LENGTH) {
    return null;
  }
  return Buffer.from(trimmed, 'utf8');
}

export function wrappingKeyFromEnv(env: NodeJS.ProcessEnv = process.env): Buffer | null {
  return parseVaultWrappingKey(env[VAULT_WRAPPING_KEY_ENV]);
}

export function requireWrappingKey(source: WrappingKeySource): Buffer {
  const key = source.resolve();
  if (!key) {
    throw new VaultUnavailableError();
  }
  return key;
}

export function staticWrappingKeySource(raw: string | null): WrappingKeySource {
  const key = raw === null ? null : parseVaultWrappingKey(raw);
  return {
    resolve: () => (key ? Buffer.from(key) : null),
  };
}

export function envWrappingKeySource(read: () => string | undefined): WrappingKeySource {
  return {
    resolve: () => parseVaultWrappingKey(read()),
  };
}
