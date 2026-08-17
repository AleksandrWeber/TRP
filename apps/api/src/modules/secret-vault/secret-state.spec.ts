import { describe, expect, it } from 'vitest';
import {
  OperatorSecretLabel,
  SecretState,
  canTransitionSecretState,
  deletePath,
  impossibleSecretTransitions,
  operatorLabelsForState,
  replacePath,
  revokePath,
  storeSuccessPath,
  toOperatorLabel,
  transitionSecretState,
  vaultConnectedMeansProviderWorks,
} from './secret-state';

describe('Secret State Machine (V3-S03-a)', () => {
  it('follows Created → Validated → Connected → Revoked → Deleted', () => {
    expect(storeSuccessPath()).toEqual([
      SecretState.Created,
      SecretState.Validated,
      SecretState.Connected,
    ]);
    expect(revokePath()).toEqual([SecretState.Connected, SecretState.Revoked]);
    expect(deletePath()).toEqual([SecretState.Revoked, SecretState.Deleted]);

    let state: SecretState = SecretState.Created;
    state = transitionSecretState(state, SecretState.Validated);
    state = transitionSecretState(state, SecretState.Connected);
    state = transitionSecretState(state, SecretState.Revoked);
    state = transitionSecretState(state, SecretState.Deleted);
    expect(state).toBe(SecretState.Deleted);
  });

  it('rejects validation without becoming Connected', () => {
    expect(canTransitionSecretState(SecretState.Created, SecretState.Connected)).toBe(false);
    expect(canTransitionSecretState(SecretState.Created, SecretState.Deleted)).toBe(false);
    expect(() => transitionSecretState(SecretState.Created, SecretState.Connected)).toThrow(
      /Illegal vault state transition/,
    );
  });

  it('allows replace as Connected → Created → Validated → Connected', () => {
    expect(replacePath()).toEqual([
      SecretState.Connected,
      SecretState.Created,
      SecretState.Validated,
      SecretState.Connected,
    ]);
    expect(canTransitionSecretState(SecretState.Connected, SecretState.Created)).toBe(true);
  });

  it('maps Connected to Stored / Vault Connected and never to provider working', () => {
    expect(operatorLabelsForState(SecretState.Connected)).toEqual([
      OperatorSecretLabel.Stored,
      OperatorSecretLabel.VaultConnected,
    ]);
    expect(toOperatorLabel(SecretState.Connected)).toBe(OperatorSecretLabel.Stored);
    expect(toOperatorLabel(SecretState.Revoked)).toBe(OperatorSecretLabel.Revoked);
    expect(operatorLabelsForState(SecretState.Deleted)).toContain(OperatorSecretLabel.NotStored);
    expect(vaultConnectedMeansProviderWorks()).toBe(false);
  });

  it('does not use encrypted as an operator label', () => {
    for (const label of Object.values(OperatorSecretLabel)) {
      expect(label.toLowerCase()).not.toContain('encrypt');
    }
  });

  it('rejects impossible transitions including Deleted → anything and Connected → Deleted', () => {
    for (const [from, to] of impossibleSecretTransitions()) {
      expect(canTransitionSecretState(from, to)).toBe(false);
      expect(() => transitionSecretState(from, to)).toThrow(/Illegal vault state transition/);
    }
  });
});
