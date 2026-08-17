import { describe, expect, it } from 'vitest';
import { HoldableSecretType } from '../secret-vault';
import { vaultSecretTypeForProvider } from './connection-vault';

describe('Connection Vault reference mapping (W2-S01-b)', () => {
  it('maps each offered provider to its existing Vault secret type', () => {
    expect(vaultSecretTypeForProvider('BINANCE')).toBe(HoldableSecretType.Binance);
    expect(vaultSecretTypeForProvider('TELEGRAM')).toBe(HoldableSecretType.Telegram);
    expect(vaultSecretTypeForProvider('SMTP')).toBe(HoldableSecretType.Smtp);
    expect(vaultSecretTypeForProvider('OPENROUTER')).toBe(HoldableSecretType.OpenRouter);
  });
});
