import { describe, expect, it } from 'vitest';
import {
  applyExchangeSessionEvent,
  canApplyExchangeSessionEvent,
  EXCHANGE_SESSION_EVENTS,
  EXCHANGE_SESSION_STATES,
  IllegalExchangeSessionTransitionError,
  sessionStateFromConnectionStatus,
  type ExchangeSessionEvent,
  type ExchangeSessionState,
} from './exchange-session.state';

describe('Exchange session state machine (W2-S02-c)', () => {
  it('allows the authenticated session lifecycle and rejects illegal transitions', () => {
    expect(applyExchangeSessionEvent('DISCONNECTED', 'start_validation')).toBe(
      'PENDING_VALIDATION',
    );
    expect(applyExchangeSessionEvent('PENDING_VALIDATION', 'established')).toBe('CONNECTED');
    expect(applyExchangeSessionEvent('CONNECTED', 'disconnected')).toBe('DISCONNECTED');
    expect(applyExchangeSessionEvent('CONNECTED', 'session_expired')).toBe('SESSION_EXPIRED');
    expect(applyExchangeSessionEvent('CONNECTED', 'connection_lost')).toBe('CONNECTION_LOST');
    expect(applyExchangeSessionEvent('CONNECTED', 'provider_unavailable')).toBe(
      'PROVIDER_UNAVAILABLE',
    );
    expect(applyExchangeSessionEvent('SESSION_EXPIRED', 'start_validation')).toBe(
      'PENDING_VALIDATION',
    );
    expect(applyExchangeSessionEvent('CONNECTION_LOST', 'disconnected')).toBe('DISCONNECTED');
    expect(canApplyExchangeSessionEvent('CONNECTED', 'established')).toBe(false);
    expect(canApplyExchangeSessionEvent('DISCONNECTED', 'session_expired')).toBe(false);
    expect(() => applyExchangeSessionEvent('DISCONNECTED', 'established')).toThrow(
      IllegalExchangeSessionTransitionError,
    );
    expect(() => applyExchangeSessionEvent('CONNECTED', 'start_validation')).toThrow(
      'Exchange session cannot transition',
    );
  });

  it('rejects every unpublished transition from each session state', () => {
    const legal: ReadonlyArray<readonly [ExchangeSessionState, ExchangeSessionEvent]> = [
      ['DISCONNECTED', 'start_validation'],
      ['PENDING_VALIDATION', 'established'],
      ['PENDING_VALIDATION', 'validation_failed'],
      ['PENDING_VALIDATION', 'authentication_failed'],
      ['PENDING_VALIDATION', 'provider_unavailable'],
      ['CONNECTED', 'disconnected'],
      ['CONNECTED', 'session_expired'],
      ['CONNECTED', 'connection_lost'],
      ['CONNECTED', 'provider_unavailable'],
      ['CONNECTED', 'authentication_failed'],
      ['SESSION_EXPIRED', 'start_validation'],
      ['SESSION_EXPIRED', 'disconnected'],
      ['CONNECTION_LOST', 'start_validation'],
      ['CONNECTION_LOST', 'disconnected'],
      ['PROVIDER_UNAVAILABLE', 'start_validation'],
      ['PROVIDER_UNAVAILABLE', 'disconnected'],
      ['VALIDATION_FAILED', 'start_validation'],
      ['VALIDATION_FAILED', 'disconnected'],
      ['AUTHENTICATION_FAILED', 'start_validation'],
      ['AUTHENTICATION_FAILED', 'disconnected'],
    ];
    const legalSet = new Set(legal.map(([from, event]) => `${from}:${event}`));

    for (const from of EXCHANGE_SESSION_STATES) {
      for (const event of EXCHANGE_SESSION_EVENTS) {
        const allowed = legalSet.has(`${from}:${event}`);
        expect(canApplyExchangeSessionEvent(from, event)).toBe(allowed);
        if (!allowed) {
          expect(() => applyExchangeSessionEvent(from, event)).toThrow(
            IllegalExchangeSessionTransitionError,
          );
        }
      }
    }
  });

  it('maps handshake timeout and connection-management terminal states without inventing a session', () => {
    expect(sessionStateFromConnectionStatus('HANDSHAKE_TIMEOUT')).toBe('VALIDATION_FAILED');
    expect(sessionStateFromConnectionStatus('DISABLED')).toBe('DISCONNECTED');
    expect(sessionStateFromConnectionStatus('REVOKED')).toBe('DISCONNECTED');
    expect(sessionStateFromConnectionStatus('CONNECTED')).toBe('CONNECTED');
    expect(sessionStateFromConnectionStatus('SESSION_EXPIRED')).toBe('SESSION_EXPIRED');
    expect(sessionStateFromConnectionStatus('unknown')).toBeNull();
  });
});
