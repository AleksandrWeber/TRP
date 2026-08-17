/**
 * Secret State Machine freeze (V3-S03-a).
 * Canonical: v3-s03-implementation-package.md §6.
 *
 * Connected means Vault stores the credential.
 * Connected does not mean the external provider works.
 */

export const SecretState = {
  Created: 'Created',
  Validated: 'Validated',
  Revoked: 'Revoked',
  Deleted: 'Deleted',
  Connected: 'Connected',
} as const;

export type SecretState = (typeof SecretState)[keyof typeof SecretState];

/** Persisted success / revoked only. Created and Validated are transient. */
export type PersistedSecretState = typeof SecretState.Connected | typeof SecretState.Revoked;

export const OperatorSecretLabel = {
  NotStored: 'not_stored',
  Stored: 'stored',
  VaultConnected: 'vault_connected',
  Invalid: 'invalid',
  Revoked: 'revoked',
  Deleted: 'deleted',
} as const;

export type OperatorSecretLabel = (typeof OperatorSecretLabel)[keyof typeof OperatorSecretLabel];

const TRANSITIONS: Readonly<Record<SecretState, readonly SecretState[]>> = {
  [SecretState.Created]: [SecretState.Validated],
  [SecretState.Validated]: [SecretState.Connected],
  [SecretState.Connected]: [SecretState.Revoked, SecretState.Created],
  [SecretState.Revoked]: [SecretState.Deleted, SecretState.Created],
  [SecretState.Deleted]: [],
};

export function canTransitionSecretState(from: SecretState, to: SecretState): boolean {
  return TRANSITIONS[from].includes(to);
}

export function transitionSecretState(from: SecretState, to: SecretState): SecretState {
  if (!canTransitionSecretState(from, to)) {
    throw new Error(`Illegal vault state transition: ${from} → ${to}`);
  }
  return to;
}

export function impossibleSecretTransitions(): readonly (readonly [SecretState, SecretState])[] {
  return [
    [SecretState.Created, SecretState.Connected],
    [SecretState.Created, SecretState.Revoked],
    [SecretState.Created, SecretState.Deleted],
    [SecretState.Validated, SecretState.Created],
    [SecretState.Validated, SecretState.Revoked],
    [SecretState.Validated, SecretState.Deleted],
    [SecretState.Connected, SecretState.Deleted],
    [SecretState.Connected, SecretState.Validated],
    [SecretState.Revoked, SecretState.Connected],
    [SecretState.Revoked, SecretState.Validated],
    [SecretState.Deleted, SecretState.Created],
    [SecretState.Deleted, SecretState.Validated],
    [SecretState.Deleted, SecretState.Connected],
    [SecretState.Deleted, SecretState.Revoked],
  ];
}

/**
 * Store success path. Reject is not a success state: Created that fails validation
 * never becomes Connected and is not stored.
 */
export function storeSuccessPath(): readonly SecretState[] {
  return [SecretState.Created, SecretState.Validated, SecretState.Connected];
}

export function revokePath(): readonly SecretState[] {
  return [SecretState.Connected, SecretState.Revoked];
}

export function deletePath(): readonly SecretState[] {
  return [SecretState.Revoked, SecretState.Deleted];
}

export function replacePath(): readonly SecretState[] {
  return [SecretState.Connected, SecretState.Created, SecretState.Validated, SecretState.Connected];
}

export function operatorLabelsForState(state: SecretState): readonly OperatorSecretLabel[] {
  switch (state) {
    case SecretState.Created:
      return [];
    case SecretState.Validated:
      return [];
    case SecretState.Connected:
      return [OperatorSecretLabel.Stored, OperatorSecretLabel.VaultConnected];
    case SecretState.Revoked:
      return [OperatorSecretLabel.Revoked];
    case SecretState.Deleted:
      return [OperatorSecretLabel.NotStored, OperatorSecretLabel.Deleted];
  }
}

export function toOperatorLabel(state: PersistedSecretState): OperatorSecretLabel {
  return state === SecretState.Connected ? OperatorSecretLabel.Stored : OperatorSecretLabel.Revoked;
}

/** Vault Connected is never venue / provider working. */
export function vaultConnectedMeansProviderWorks(): false {
  return false;
}
