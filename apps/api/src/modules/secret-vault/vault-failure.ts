/**
 * Failure Philosophy freeze (V3-S03-a).
 * Canonical: v3-s03-implementation-package.md §7.
 * Vault unavailable must not take down the paper-first product.
 */

export const ProductCapability = {
  PaperTrading: 'paper_trading',
  Authentication: 'authentication',
  Research: 'research',
  Integrations: 'integrations',
} as const;

export type ProductCapability = (typeof ProductCapability)[keyof typeof ProductCapability];

export type CapabilityWhenVaultUnavailable = Readonly<{
  capability: ProductCapability;
  continues: boolean;
}>;

export function capabilitiesWhenVaultUnavailable(): readonly CapabilityWhenVaultUnavailable[] {
  return [
    { capability: ProductCapability.PaperTrading, continues: true },
    { capability: ProductCapability.Authentication, continues: true },
    { capability: ProductCapability.Research, continues: true },
    { capability: ProductCapability.Integrations, continues: false },
  ];
}

export function wrappingKeyUnsetMustFailApiBoot(): false {
  return false;
}
