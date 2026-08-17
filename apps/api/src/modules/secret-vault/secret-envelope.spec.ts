import { describe, expect, it } from 'vitest';
import { HoldableSecretType } from './holdable-secret-type';
import { wrapSecretFields, unwrapSecretFields } from './secret-envelope';
import { withTamperedPayload, withTamperedPayloadTag } from './secret-ciphertext';
import { SecretPurpose } from './secret-purpose';
import { VaultUnavailableError } from './vault-errors';
import { parseVaultWrappingKey } from './wrapping-key';

const BINDING = {
  workspaceId: 'ws-a',
  type: HoldableSecretType.Binance,
  purpose: SecretPurpose.Trading,
} as const;

const FIELDS = { apiKey: 'key-a', apiSecret: 'secret-a' };
const KEY_A = parseVaultWrappingKey('trp-host-vault-wrapping-key-v3-s03b')!;
const KEY_B = parseVaultWrappingKey('trp-host-vault-wrapping-key-WRONG!!')!;

describe('secret envelope (V3-S03-b)', () => {
  it('round-trips fields with the wrapping key', () => {
    const ciphertext = wrapSecretFields(FIELDS, KEY_A, BINDING);
    expect(JSON.stringify(ciphertext)).not.toContain('key-a');
    expect(JSON.stringify(ciphertext)).not.toContain('secret-a');
    expect(JSON.stringify(ciphertext)).not.toContain('trp-host-vault-wrapping-key-v3-s03b');
    expect(unwrapSecretFields(ciphertext, KEY_A, BINDING)).toEqual(FIELDS);
  });

  it('fails closed on the wrong wrapping key', () => {
    const ciphertext = wrapSecretFields(FIELDS, KEY_A, BINDING);
    expect(() => unwrapSecretFields(ciphertext, KEY_B, BINDING)).toThrow(VaultUnavailableError);
  });

  it('fails closed when ciphertext is tampered', () => {
    const ciphertext = wrapSecretFields(FIELDS, KEY_A, BINDING);
    expect(() => unwrapSecretFields(withTamperedPayload(ciphertext), KEY_A, BINDING)).toThrow(
      VaultUnavailableError,
    );
  });

  it('fails closed when the authentication tag is tampered', () => {
    const ciphertext = wrapSecretFields(FIELDS, KEY_A, BINDING);
    expect(() => unwrapSecretFields(withTamperedPayloadTag(ciphertext), KEY_A, BINDING)).toThrow(
      VaultUnavailableError,
    );
  });

  it('fails closed when the workspace binding does not match', () => {
    const ciphertext = wrapSecretFields(FIELDS, KEY_A, BINDING);
    expect(() =>
      unwrapSecretFields(ciphertext, KEY_A, {
        ...BINDING,
        workspaceId: 'ws-b',
      }),
    ).toThrow(VaultUnavailableError);
  });
});
