import { describe, expect, it } from 'vitest';
import { assertConnectionTransition, canTransitionConnection } from './connection-lifecycle';

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
