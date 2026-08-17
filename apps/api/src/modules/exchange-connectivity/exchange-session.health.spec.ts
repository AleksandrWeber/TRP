import { describe, expect, it } from 'vitest';
import {
  AUTOMATIC_RECONNECT_ENABLED,
  canAutomaticallyReconnect,
  observeProviderAvailability,
  projectExchangeHealth,
  projectReconnectEligibility,
} from './exchange-session.health';
import type { ExchangeSessionState } from './exchange-session.state';

describe('Exchange session health projection (W2-S02-c)', () => {
  it('projects health only from observed authenticated-session states', () => {
    expect(projectExchangeHealth('CONNECTED')).toBe('HEALTHY');
    expect(projectExchangeHealth('PROVIDER_UNAVAILABLE')).toBe('UNAVAILABLE');
    expect(projectExchangeHealth('SESSION_EXPIRED')).toBe('EXPIRED');
    expect(projectExchangeHealth('AUTHENTICATION_FAILED')).toBe('AUTHENTICATION_FAILED');
    expect(projectExchangeHealth('CONNECTION_LOST')).toBe('CONNECTION_LOST');
    expect(projectExchangeHealth('DISCONNECTED')).toBeNull();
    expect(projectExchangeHealth('PENDING_VALIDATION')).toBeNull();
    expect(projectExchangeHealth('VALIDATION_FAILED')).toBeNull();
  });

  it('does not invent healthy, trading, or market-data claims', () => {
    const states: ExchangeSessionState[] = [
      'DISCONNECTED',
      'PENDING_VALIDATION',
      'VALIDATION_FAILED',
    ];
    for (const state of states) {
      expect(projectExchangeHealth(state)).toBeNull();
    }
    expect(JSON.stringify(projectExchangeHealth('CONNECTED'))).not.toContain('TRADING');
  });
});

describe('Exchange reconnect eligibility (W2-S02-c)', () => {
  it('marks reconnect required only after an established session is lost, expired, or unavailable', () => {
    expect(projectReconnectEligibility('SESSION_EXPIRED')).toEqual({
      required: true,
      allowed: true,
    });
    expect(projectReconnectEligibility('CONNECTION_LOST')).toEqual({
      required: true,
      allowed: true,
    });
    expect(projectReconnectEligibility('PROVIDER_UNAVAILABLE')).toEqual({
      required: true,
      allowed: true,
    });
    expect(projectReconnectEligibility('VALIDATION_FAILED')).toEqual({
      required: false,
      allowed: true,
    });
    expect(projectReconnectEligibility('CONNECTED')).toEqual({ required: false, allowed: false });
    expect(projectReconnectEligibility('DISCONNECTED')).toEqual({
      required: false,
      allowed: false,
    });
    expect(projectReconnectEligibility('AUTHENTICATION_FAILED')).toEqual({
      required: false,
      allowed: false,
    });
    expect(projectReconnectEligibility('PENDING_VALIDATION')).toEqual({
      required: false,
      allowed: false,
    });
  });

  it('never enables automatic reconnect', () => {
    expect(AUTOMATIC_RECONNECT_ENABLED).toBe(false);
    expect(canAutomaticallyReconnect()).toBe(false);
  });
});

describe('Provider availability observation (W2-S02-c)', () => {
  it('observes availability only from the current session state', () => {
    expect(observeProviderAvailability('CONNECTED')).toBe('AVAILABLE');
    expect(observeProviderAvailability('PROVIDER_UNAVAILABLE')).toBe('UNAVAILABLE');
    expect(observeProviderAvailability('SESSION_EXPIRED')).toBe('UNKNOWN');
    expect(observeProviderAvailability('CONNECTION_LOST')).toBe('UNKNOWN');
    expect(observeProviderAvailability('DISCONNECTED')).toBe('UNKNOWN');
    expect(observeProviderAvailability('AUTHENTICATION_FAILED')).toBe('UNKNOWN');
  });
});
