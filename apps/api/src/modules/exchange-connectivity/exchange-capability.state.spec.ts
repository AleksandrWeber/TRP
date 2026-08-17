import { describe, expect, it } from 'vitest';
import {
  EXCHANGE_CAPABILITY_EVENTS,
  EXCHANGE_CAPABILITY_STATES,
  IllegalExchangeCapabilityTransitionError,
  applyExchangeCapabilityEvent,
  canApplyExchangeCapabilityEvent,
  capabilityStateFromEvidence,
  isExchangeCapabilityState,
} from './exchange-capability.state';
import { canUseVerifiedCapability } from './exchange-capability';

describe('Exchange capability state machine (W2-S02-d)', () => {
  it('starts unknown and applies only observed verification events', () => {
    expect(EXCHANGE_CAPABILITY_STATES).toEqual([
      'SUPPORTED',
      'UNSUPPORTED',
      'UNAVAILABLE',
      'UNKNOWN',
      'VERIFICATION_FAILED',
    ]);
    expect(applyExchangeCapabilityEvent('UNKNOWN', 'observe_supported')).toBe('SUPPORTED');
    expect(applyExchangeCapabilityEvent('UNKNOWN', 'observe_unsupported')).toBe('UNSUPPORTED');
    expect(applyExchangeCapabilityEvent('UNKNOWN', 'observe_unavailable')).toBe('UNAVAILABLE');
    expect(applyExchangeCapabilityEvent('UNKNOWN', 'observe_unknown')).toBe('UNKNOWN');
    expect(applyExchangeCapabilityEvent('UNKNOWN', 'observe_failed')).toBe('VERIFICATION_FAILED');
    expect(applyExchangeCapabilityEvent('SUPPORTED', 'reset')).toBe('UNKNOWN');
    expect(canApplyExchangeCapabilityEvent('UNKNOWN', 'observe_supported')).toBe(true);
    expect(isExchangeCapabilityState('UNKNOWN')).toBe(true);
    expect(isExchangeCapabilityState('TRADING_ENABLED')).toBe(false);
  });

  it('prefers unknown over guessing and never enables capability use', () => {
    expect(capabilityStateFromEvidence(undefined, 'observe_unknown')).toBe('UNKNOWN');
    expect(capabilityStateFromEvidence(true, 'observe_unknown')).toBe('SUPPORTED');
    expect(capabilityStateFromEvidence(false, 'observe_unknown')).toBe('UNAVAILABLE');
    expect(canUseVerifiedCapability()).toBe(false);
    expect(EXCHANGE_CAPABILITY_EVENTS).not.toContain('use');
    expect(EXCHANGE_CAPABILITY_EVENTS).not.toContain('trade');
    expect(EXCHANGE_CAPABILITY_EVENTS).not.toContain('place_order');
    expect(() => applyExchangeCapabilityEvent('UNKNOWN', 'use' as never)).toThrow(
      IllegalExchangeCapabilityTransitionError,
    );
  });
});
