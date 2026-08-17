import { describe, expect, it } from 'vitest';
import {
  assertConnectionTransition,
  canDisableConnection,
  canStartConnectionValidation,
  canTransitionConnection,
} from './connection-lifecycle';

describe('Connection lifecycle transitions (W2-S01-d)', () => {
  it('allows only lifecycle and validation transitions owned by Connections', () => {
    expect(canTransitionConnection('CONNECTED', 'DISCONNECTED')).toBe(true);
    expect(canTransitionConnection('CONNECTED', 'DISABLED')).toBe(true);
    expect(canTransitionConnection('DISABLED', 'REVOKED')).toBe(true);
    expect(canTransitionConnection('REVOKED', 'DISCONNECTED')).toBe(true);
    expect(canTransitionConnection('DISABLED', 'CONNECTED')).toBe(false);
    expect(canTransitionConnection('REVOKED', 'CONNECTED')).toBe(false);
    expect(() => assertConnectionTransition('DISCONNECTED', 'CONNECTED')).toThrow(
      'Connection cannot transition',
    );
  });
});

describe('Connection lifecycle handshake outcomes (W2-S02-b)', () => {
  it('allows handshake results from Pending Validation and retries from honest failures', () => {
    expect(canTransitionConnection('PENDING_VALIDATION', 'CONNECTED')).toBe(true);
    expect(canTransitionConnection('PENDING_VALIDATION', 'AUTHENTICATION_FAILED')).toBe(true);
    expect(canTransitionConnection('PENDING_VALIDATION', 'HANDSHAKE_TIMEOUT')).toBe(true);
    expect(canTransitionConnection('PENDING_VALIDATION', 'PROVIDER_UNAVAILABLE')).toBe(true);
    expect(canStartConnectionValidation('DISCONNECTED')).toBe(true);
    expect(canStartConnectionValidation('AUTHENTICATION_FAILED')).toBe(true);
    expect(canStartConnectionValidation('HANDSHAKE_TIMEOUT')).toBe(true);
    expect(canStartConnectionValidation('PROVIDER_UNAVAILABLE')).toBe(true);
    expect(canStartConnectionValidation('CONNECTED')).toBe(false);
    expect(canDisableConnection('AUTHENTICATION_FAILED')).toBe(true);
    expect(() => assertConnectionTransition('DISCONNECTED', 'CONNECTED')).toThrow(
      'Connection cannot transition',
    );
  });
});
