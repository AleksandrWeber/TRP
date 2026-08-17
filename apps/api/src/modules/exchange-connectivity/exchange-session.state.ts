/**
 * Authenticated exchange session lifecycle (W2-S02-c).
 *
 * This machine is explicit. Illegal transitions are rejected.
 * It does not place orders, read balances, or open WebSockets.
 */

export const EXCHANGE_SESSION_STATES = [
  'DISCONNECTED',
  'PENDING_VALIDATION',
  'CONNECTED',
  'SESSION_EXPIRED',
  'CONNECTION_LOST',
  'PROVIDER_UNAVAILABLE',
  'VALIDATION_FAILED',
  'AUTHENTICATION_FAILED',
] as const;

export type ExchangeSessionState = (typeof EXCHANGE_SESSION_STATES)[number];

export const EXCHANGE_SESSION_EVENTS = [
  'start_validation',
  'established',
  'validation_failed',
  'authentication_failed',
  'provider_unavailable',
  'session_expired',
  'connection_lost',
  'disconnected',
] as const;

export type ExchangeSessionEvent = (typeof EXCHANGE_SESSION_EVENTS)[number];

export class IllegalExchangeSessionTransitionError extends Error {
  constructor() {
    super('Exchange session cannot transition to the requested state.');
    this.name = 'IllegalExchangeSessionTransitionError';
  }
}

const TRANSITIONS: Readonly<
  Record<
    ExchangeSessionState,
    Readonly<Partial<Record<ExchangeSessionEvent, ExchangeSessionState>>>
  >
> = {
  DISCONNECTED: {
    start_validation: 'PENDING_VALIDATION',
  },
  PENDING_VALIDATION: {
    established: 'CONNECTED',
    validation_failed: 'VALIDATION_FAILED',
    authentication_failed: 'AUTHENTICATION_FAILED',
    provider_unavailable: 'PROVIDER_UNAVAILABLE',
  },
  CONNECTED: {
    disconnected: 'DISCONNECTED',
    session_expired: 'SESSION_EXPIRED',
    connection_lost: 'CONNECTION_LOST',
    provider_unavailable: 'PROVIDER_UNAVAILABLE',
    authentication_failed: 'AUTHENTICATION_FAILED',
  },
  SESSION_EXPIRED: {
    start_validation: 'PENDING_VALIDATION',
    disconnected: 'DISCONNECTED',
  },
  CONNECTION_LOST: {
    start_validation: 'PENDING_VALIDATION',
    disconnected: 'DISCONNECTED',
  },
  PROVIDER_UNAVAILABLE: {
    start_validation: 'PENDING_VALIDATION',
    disconnected: 'DISCONNECTED',
  },
  VALIDATION_FAILED: {
    start_validation: 'PENDING_VALIDATION',
    disconnected: 'DISCONNECTED',
  },
  AUTHENTICATION_FAILED: {
    start_validation: 'PENDING_VALIDATION',
    disconnected: 'DISCONNECTED',
  },
};

export function isExchangeSessionState(value: string): value is ExchangeSessionState {
  return (EXCHANGE_SESSION_STATES as readonly string[]).includes(value);
}

export function canApplyExchangeSessionEvent(
  from: ExchangeSessionState,
  event: ExchangeSessionEvent,
): boolean {
  return TRANSITIONS[from][event] !== undefined;
}

export function applyExchangeSessionEvent(
  from: ExchangeSessionState,
  event: ExchangeSessionEvent,
): ExchangeSessionState {
  const next = TRANSITIONS[from][event];
  if (next === undefined) {
    throw new IllegalExchangeSessionTransitionError();
  }
  return next;
}

export function sessionStateFromConnectionStatus(status: string): ExchangeSessionState | null {
  if (isExchangeSessionState(status)) {
    return status;
  }
  if (status === 'HANDSHAKE_TIMEOUT') {
    return 'VALIDATION_FAILED';
  }
  if (status === 'DISABLED' || status === 'REVOKED') {
    return 'DISCONNECTED';
  }
  return null;
}
