import { describe, expect, it } from 'vitest';
import { HoldableSecretType } from './holdable-secret-type';
import {
  requiredFieldsForType,
  validateHoldableSecretFields,
  vaultValidationPerformsVendorIo,
} from './secret-validation';
import { VaultValidationError } from './vault-errors';

const WELL_FORMED: Readonly<Record<HoldableSecretType, Record<string, string>>> = {
  [HoldableSecretType.Binance]: { apiKey: 'key-a', apiSecret: 'secret-a' },
  [HoldableSecretType.Bybit]: { apiKey: 'key-b', apiSecret: 'secret-b' },
  [HoldableSecretType.Okx]: { apiKey: 'key-o', apiSecret: 'secret-o', passphrase: 'phrase-o' },
  [HoldableSecretType.Telegram]: { botToken: 'token-1' },
  [HoldableSecretType.Smtp]: {
    host: 'smtp.example.com',
    port: '587',
    username: 'alerts',
    password: 'pass-1',
    sender: 'alerts@example.com',
  },
  [HoldableSecretType.OpenRouter]: { apiKey: 'or-key-1' },
};

describe('holdable secret validation (V3-S03-c)', () => {
  it('does not perform vendor I/O', () => {
    expect(vaultValidationPerformsVendorIo()).toBe(false);
  });

  it('accepts well-formed material for every holdable type', () => {
    for (const type of Object.values(HoldableSecretType)) {
      expect(validateHoldableSecretFields(type, WELL_FORMED[type])).toEqual(WELL_FORMED[type]);
    }
  });

  it('requires Binance apiKey and apiSecret', () => {
    expect(requiredFieldsForType(HoldableSecretType.Binance)).toEqual(['apiKey', 'apiSecret']);
    expect(() =>
      validateHoldableSecretFields(HoldableSecretType.Binance, { apiKey: 'key-a' }),
    ).toThrow(VaultValidationError);
    expect(() =>
      validateHoldableSecretFields(HoldableSecretType.Binance, {
        apiKey: 'key-a',
        apiSecret: '   ',
      }),
    ).toThrow(VaultValidationError);
  });

  it('requires OKX passphrase in addition to apiKey and apiSecret', () => {
    expect(() =>
      validateHoldableSecretFields(HoldableSecretType.Okx, {
        apiKey: 'key-o',
        apiSecret: 'secret-o',
      }),
    ).toThrow(VaultValidationError);
  });

  it('requires SMTP host, port, username, password, and sender', () => {
    expect(() =>
      validateHoldableSecretFields(HoldableSecretType.Smtp, { password: 'only-password' }),
    ).toThrow(VaultValidationError);
    expect(() =>
      validateHoldableSecretFields(HoldableSecretType.Smtp, {
        ...WELL_FORMED[HoldableSecretType.Smtp],
        port: '99999',
      }),
    ).toThrow(VaultValidationError);
    expect(() =>
      validateHoldableSecretFields(HoldableSecretType.Smtp, {
        ...WELL_FORMED[HoldableSecretType.Smtp],
        port: 'smtp',
      }),
    ).toThrow(VaultValidationError);
  });

  it('rejects extra fields so the typed contract stays closed', () => {
    expect(() =>
      validateHoldableSecretFields(HoldableSecretType.OpenRouter, {
        apiKey: 'or-key-1',
        extra: 'no',
      }),
    ).toThrow(VaultValidationError);
    expect(() =>
      validateHoldableSecretFields(HoldableSecretType.Telegram, {
        botToken: 'token-1',
        chatId: '123',
      }),
    ).toThrow(VaultValidationError);
  });

  it('does not treat incomplete material as stored-valid', () => {
    expect(() => validateHoldableSecretFields(HoldableSecretType.Binance, {})).toThrow(
      VaultValidationError,
    );
  });
});
