import { describe, expect, it } from 'vitest';
import {
  isHoldableSecretType,
  listHoldableSecretTypes,
  HoldableSecretType,
} from './holdable-secret-type';
import {
  classifyHoldableType,
  classifyHostSecret,
  customerSecretsForbidReadBackAndExport,
  HostSecretName,
  isVaultStoreableType,
  ReadBackPolicy,
  ExportPolicy,
  RotationPolicy,
  SecretOwner,
} from './secret-classification';

describe('Secret Classification (V3-S03-a)', () => {
  it('classifies holdable customer secrets as no read-back and no export', () => {
    for (const type of listHoldableSecretTypes()) {
      const row = classifyHoldableType(type);
      expect(row.owner).toBe(SecretOwner.Customer);
      expect(row.rotation).toBe(RotationPolicy.Yes);
      expect(row.readBack).toBe(ReadBackPolicy.No);
      expect(row.export).toBe(ExportPolicy.No);
      expect(customerSecretsForbidReadBackAndExport(type)).toBe(true);
      expect(isVaultStoreableType(type)).toBe(true);
    }
  });

  it('classifies host secrets as never Vault records', () => {
    for (const name of Object.values(HostSecretName)) {
      const row = classifyHostSecret(name);
      expect(row.owner).toBe(SecretOwner.Host);
      expect(row.rotation).toBe(RotationPolicy.Manual);
      expect(row.readBack).toBe(ReadBackPolicy.NotApplicable);
      expect(row.export).toBe(ExportPolicy.NotApplicable);
      expect(isHoldableSecretType(name)).toBe(false);
      expect(isVaultStoreableType(name)).toBe(false);
    }
  });

  it('does not treat login passwords as a holdable Vault type', () => {
    expect(isHoldableSecretType('password')).toBe(false);
    expect(isHoldableSecretType('login_password')).toBe(false);
    expect(isVaultStoreableType(HoldableSecretType.Binance)).toBe(true);
  });
});
