/**
 * Secret material owned by Vault (V3-S03-a).
 * Never placed on metadata views. Never logged.
 * Typed field contracts for holdable types live in secret-validation.ts (S03-c).
 */

import { VaultValidationError } from './vault-errors';

export const MAX_SECRET_FIELDS = 16;
export const MAX_SECRET_FIELD_NAME_LENGTH = 64;
export const MAX_SECRET_FIELD_VALUE_LENGTH = 4096;

export type SecretFieldMap = Readonly<Record<string, string>>;

const FIELD_NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

export function createSecretMaterial(fields: Record<string, string>): SecretFieldMap {
  const names = Object.keys(fields);
  if (names.length === 0) {
    throw new VaultValidationError('Required credential fields are missing.');
  }
  if (names.length > MAX_SECRET_FIELDS) {
    throw new VaultValidationError('The credential could not be stored.');
  }

  const next: Record<string, string> = {};
  for (const name of names) {
    if (!FIELD_NAME.test(name) || name.length > MAX_SECRET_FIELD_NAME_LENGTH) {
      throw new VaultValidationError('The credential could not be stored.');
    }
    const value = fields[name];
    if (typeof value !== 'string' || value.trim() === '') {
      throw new VaultValidationError('Required credential fields are missing.');
    }
    if (value.length > MAX_SECRET_FIELD_VALUE_LENGTH) {
      throw new VaultValidationError('The credential could not be stored.');
    }
    next[name] = value;
  }

  return Object.freeze({ ...next });
}

export function cloneSecretMaterial(fields: SecretFieldMap): SecretFieldMap {
  return Object.freeze({ ...fields });
}

export function secretMaterialFieldNames(fields: SecretFieldMap): readonly string[] {
  return Object.keys(fields);
}
