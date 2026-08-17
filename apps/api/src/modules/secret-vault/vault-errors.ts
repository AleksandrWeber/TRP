/**
 * Vault domain errors (V3-S03-a). Honest, no secret echo.
 */

export class VaultValidationError extends Error {
  readonly code = 'vault_invalid' as const;

  constructor(message = 'The credential could not be stored.') {
    super(message);
    this.name = 'VaultValidationError';
  }
}

export class VaultIsolationError extends Error {
  readonly code = 'vault_workspace_denied' as const;

  constructor(message = 'That workspace vault is not available.') {
    super(message);
    this.name = 'VaultIsolationError';
  }
}

export class VaultUnavailableError extends Error {
  readonly code = 'vault_unavailable' as const;

  constructor(message = 'Vault is unavailable.') {
    super(message);
    this.name = 'VaultUnavailableError';
  }
}

export class VaultNotStoredError extends Error {
  readonly code = 'vault_not_stored' as const;

  constructor(message = 'No credential is stored for this type.') {
    super(message);
    this.name = 'VaultNotStoredError';
  }
}

export class VaultRevokedError extends Error {
  readonly code = 'vault_revoked' as const;

  constructor(message = 'The credential cannot be used.') {
    super(message);
    this.name = 'VaultRevokedError';
  }
}

export class VaultLifecycleError extends Error {
  readonly code = 'vault_lifecycle' as const;

  constructor(message = 'That action is not available for this credential.') {
    super(message);
    this.name = 'VaultLifecycleError';
  }
}
