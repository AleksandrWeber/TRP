export { SecretVaultModule } from './secret-vault.module';
export { SecretVaultService } from './secret-vault.service';
export type {
  StoreSecretInput,
  StoreSecretResult,
  ValidateSecretResult,
  WorkspaceScopedQuery,
} from './secret-vault.service';
export {
  HoldableSecretType,
  isHoldableSecretType,
  listHoldableSecretTypes,
} from './holdable-secret-type';
export { SecretPurpose, defaultPurposeForType } from './secret-purpose';
export {
  SecretState,
  OperatorSecretLabel,
  storeSuccessPath,
  vaultConnectedMeansProviderWorks,
} from './secret-state';
export {
  classifyHoldableType,
  classifyHostSecret,
  HostSecretName,
  customerSecretsForbidReadBackAndExport,
} from './secret-classification';
export { VaultNeverOwns, VaultOwnedConcern, vaultOwns, vaultOwnsProduct } from './secret-ownership';
export { capabilitiesWhenVaultUnavailable, wrappingKeyUnsetMustFailApiBoot } from './vault-failure';
export {
  VaultIsolationError,
  VaultLifecycleError,
  VaultNotStoredError,
  VaultRevokedError,
  VaultUnavailableError,
  VaultValidationError,
} from './vault-errors';
export type { SecretVaultMetadata } from './secret-record';
export { InMemorySecretVaultRepository } from './in-memory-secret-vault.repository';
export { SECRET_VAULT_REPOSITORY } from './secret-vault.repository.token';
export { VaultAccessControl } from './vault-access-control';
export type { VaultActor } from './vault-access-control';
export {
  requiredFieldsForType,
  validateHoldableSecretFields,
  vaultValidationPerformsVendorIo,
} from './secret-validation';
