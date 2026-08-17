/**
 * Secret Ownership Rules freeze (V3-S03-a).
 * Canonical: v3-s03-implementation-package.md §8.
 * Vault owns secrets only. Consuming a secret later is not owning that product.
 */

export const VaultOwnedConcern = {
  CustomerVendorCredentials: 'customer_vendor_credentials',
  SecretLifecycle: 'secret_lifecycle',
  FieldValidation: 'field_validation',
  EncryptionAtRest: 'encryption_at_rest',
  RevocationAndDeletion: 'revocation_and_deletion',
  RuntimeRetrievePort: 'runtime_retrieve_port',
} as const;

export type VaultOwnedConcern = (typeof VaultOwnedConcern)[keyof typeof VaultOwnedConcern];

export const VaultNeverOwns = {
  Connections: 'connections',
  Notifications: 'notifications',
  Ai: 'ai',
  Trading: 'trading',
  Exchanges: 'exchanges',
  Authentication: 'authentication',
  Authorization: 'authorization',
  Money: 'money',
  HostInfrastructure: 'host_infrastructure',
} as const;

export type VaultNeverOwns = (typeof VaultNeverOwns)[keyof typeof VaultNeverOwns];

export function vaultOwns(concern: VaultOwnedConcern): true {
  void concern;
  return true;
}

export function vaultOwnsProduct(product: VaultNeverOwns): false {
  void product;
  return false;
}
