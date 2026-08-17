import { describe, expect, it } from 'vitest';
import { VaultNeverOwns, VaultOwnedConcern, vaultOwns, vaultOwnsProduct } from './secret-ownership';

describe('Secret Ownership Rules (V3-S03-a)', () => {
  it('owns credentials and lifecycle only', () => {
    expect(vaultOwns(VaultOwnedConcern.CustomerVendorCredentials)).toBe(true);
    expect(vaultOwns(VaultOwnedConcern.SecretLifecycle)).toBe(true);
    expect(vaultOwns(VaultOwnedConcern.FieldValidation)).toBe(true);
    expect(vaultOwns(VaultOwnedConcern.EncryptionAtRest)).toBe(true);
    expect(vaultOwns(VaultOwnedConcern.RevocationAndDeletion)).toBe(true);
    expect(vaultOwns(VaultOwnedConcern.RuntimeRetrievePort)).toBe(true);
  });

  it('never owns connections, trading, AI, notifications, or exchanges', () => {
    expect(vaultOwnsProduct(VaultNeverOwns.Connections)).toBe(false);
    expect(vaultOwnsProduct(VaultNeverOwns.Notifications)).toBe(false);
    expect(vaultOwnsProduct(VaultNeverOwns.Ai)).toBe(false);
    expect(vaultOwnsProduct(VaultNeverOwns.Trading)).toBe(false);
    expect(vaultOwnsProduct(VaultNeverOwns.Exchanges)).toBe(false);
    expect(vaultOwnsProduct(VaultNeverOwns.Authentication)).toBe(false);
    expect(vaultOwnsProduct(VaultNeverOwns.Authorization)).toBe(false);
    expect(vaultOwnsProduct(VaultNeverOwns.Money)).toBe(false);
    expect(vaultOwnsProduct(VaultNeverOwns.HostInfrastructure)).toBe(false);
  });
});
