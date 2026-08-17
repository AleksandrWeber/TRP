import { describe, expect, it } from 'vitest';
import {
  ProductCapability,
  capabilitiesWhenVaultUnavailable,
  wrappingKeyUnsetMustFailApiBoot,
} from './vault-failure';
import {
  PersistMode,
  isProductionLikePersist,
  refusePlaintextDurablePersist,
} from './plaintext-persist';
import { VaultUnavailableError } from './vault-errors';

describe('Vault failure philosophy (V3-S03-b)', () => {
  it('keeps paper, authentication, and research up when Vault is unavailable', () => {
    const byCapability = Object.fromEntries(
      capabilitiesWhenVaultUnavailable().map((row) => [row.capability, row.continues]),
    );
    expect(byCapability[ProductCapability.PaperTrading]).toBe(true);
    expect(byCapability[ProductCapability.Authentication]).toBe(true);
    expect(byCapability[ProductCapability.Research]).toBe(true);
    expect(byCapability[ProductCapability.Integrations]).toBe(false);
  });

  it('does not fail API boot because the wrapping key is unset', () => {
    expect(wrappingKeyUnsetMustFailApiBoot()).toBe(false);
  });

  it('refuses plaintext persist in production-like and process-memory stores', () => {
    expect(isProductionLikePersist('production')).toBe(true);
    expect(isProductionLikePersist('test')).toBe(false);
    expect(() => refusePlaintextDurablePersist(PersistMode.ProcessMemory)).toThrow(
      VaultUnavailableError,
    );
    expect(() => refusePlaintextDurablePersist(PersistMode.ProductionLike)).toThrow(
      VaultUnavailableError,
    );
  });
});
