/**
 * Envelope wrap/unwrap for Vault material (V3-S03-b).
 * Wrapping key stays host-held. Decrypt is server memory only.
 * Integrity failure (including a wrong wrapping key) fails closed.
 */

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { SECRET_CIPHER_VERSION, type SecretCiphertext } from './secret-ciphertext';
import type { SecretFieldMap } from './secret-material';
import type { SecretSlot } from './secret-vault.repository';
import { VaultUnavailableError } from './vault-errors';

const WRAP_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const NONCE_LENGTH = 12;
const SALT_LENGTH = 32;
const WRAP_INFO = 'trp-vault-wrap-v1';

function bindingBytes(binding: SecretSlot): Buffer {
  return Buffer.from(`${binding.workspaceId}:${binding.type}:${binding.purpose}`, 'utf8');
}

function deriveWrapKey(wrappingKey: Buffer, salt: Buffer): Buffer {
  return Buffer.from(hkdfSync('sha256', wrappingKey, salt, WRAP_INFO, KEY_LENGTH));
}

function encodeFields(fields: SecretFieldMap): Buffer {
  return Buffer.from(JSON.stringify(fields), 'utf8');
}

function decodeFields(plaintext: Buffer): SecretFieldMap {
  const parsed: unknown = JSON.parse(plaintext.toString('utf8'));
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new VaultUnavailableError('The credential cannot be used.');
  }
  const next: Record<string, string> = {};
  for (const [name, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== 'string') {
      throw new VaultUnavailableError('The credential cannot be used.');
    }
    next[name] = value;
  }
  return Object.freeze(next);
}

function wipe(buffer: Buffer): void {
  buffer.fill(0);
}

export function wrapSecretFields(
  fields: SecretFieldMap,
  wrappingKey: Buffer,
  binding: SecretSlot,
): SecretCiphertext {
  const plaintext = encodeFields(fields);
  const dataKey = randomBytes(KEY_LENGTH);
  const payloadNonce = randomBytes(NONCE_LENGTH);
  const payloadCipher = createCipheriv(WRAP_ALGORITHM, dataKey, payloadNonce);
  payloadCipher.setAAD(bindingBytes(binding));
  const payload = Buffer.concat([payloadCipher.update(plaintext), payloadCipher.final()]);
  const payloadTag = payloadCipher.getAuthTag();

  const wrappingSalt = randomBytes(SALT_LENGTH);
  const wrapKey = deriveWrapKey(wrappingKey, wrappingSalt);
  const dataKeyNonce = randomBytes(NONCE_LENGTH);
  const wrapCipher = createCipheriv(WRAP_ALGORITHM, wrapKey, dataKeyNonce);
  const wrappedDataKey = Buffer.concat([wrapCipher.update(dataKey), wrapCipher.final()]);
  const dataKeyTag = wrapCipher.getAuthTag();

  wipe(plaintext);
  wipe(dataKey);
  wipe(wrapKey);

  return Object.freeze({
    version: SECRET_CIPHER_VERSION,
    wrappingSalt: wrappingSalt.toString('base64'),
    wrappedDataKey: wrappedDataKey.toString('base64'),
    dataKeyNonce: dataKeyNonce.toString('base64'),
    dataKeyTag: dataKeyTag.toString('base64'),
    payload: payload.toString('base64'),
    payloadNonce: payloadNonce.toString('base64'),
    payloadTag: payloadTag.toString('base64'),
  });
}

export function unwrapSecretFields(
  ciphertext: SecretCiphertext,
  wrappingKey: Buffer,
  binding: SecretSlot,
): SecretFieldMap {
  if (ciphertext.version !== SECRET_CIPHER_VERSION) {
    throw new VaultUnavailableError('The credential cannot be used.');
  }

  let wrapKey: Buffer | undefined;
  let dataKey: Buffer | undefined;
  let plaintext: Buffer | undefined;
  try {
    wrapKey = deriveWrapKey(wrappingKey, Buffer.from(ciphertext.wrappingSalt, 'base64'));
    const wrapDecipher = createDecipheriv(
      WRAP_ALGORITHM,
      wrapKey,
      Buffer.from(ciphertext.dataKeyNonce, 'base64'),
    );
    wrapDecipher.setAuthTag(Buffer.from(ciphertext.dataKeyTag, 'base64'));
    dataKey = Buffer.concat([
      wrapDecipher.update(Buffer.from(ciphertext.wrappedDataKey, 'base64')),
      wrapDecipher.final(),
    ]);

    const payloadDecipher = createDecipheriv(
      WRAP_ALGORITHM,
      dataKey,
      Buffer.from(ciphertext.payloadNonce, 'base64'),
    );
    payloadDecipher.setAAD(bindingBytes(binding));
    payloadDecipher.setAuthTag(Buffer.from(ciphertext.payloadTag, 'base64'));
    plaintext = Buffer.concat([
      payloadDecipher.update(Buffer.from(ciphertext.payload, 'base64')),
      payloadDecipher.final(),
    ]);
    return decodeFields(plaintext);
  } catch (error) {
    if (error instanceof VaultUnavailableError) {
      throw error;
    }
    throw new VaultUnavailableError('The credential cannot be used.');
  } finally {
    if (wrapKey) wipe(wrapKey);
    if (dataKey) wipe(dataKey);
    if (plaintext) wipe(plaintext);
  }
}
