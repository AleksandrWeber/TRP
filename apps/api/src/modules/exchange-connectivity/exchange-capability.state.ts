/**
 * Capability verification states (W2-S02-d).
 *
 * Unknown is preferred over guessing. Supported is assigned only from observed
 * evidence. Capabilities cannot be used for business actions.
 */

export const EXCHANGE_CAPABILITY_STATES = [
  'SUPPORTED',
  'UNSUPPORTED',
  'UNAVAILABLE',
  'UNKNOWN',
  'VERIFICATION_FAILED',
] as const;

export type ExchangeCapabilityState = (typeof EXCHANGE_CAPABILITY_STATES)[number];

export const EXCHANGE_CAPABILITY_EVENTS = [
  'observe_supported',
  'observe_unsupported',
  'observe_unavailable',
  'observe_unknown',
  'observe_failed',
  'reset',
] as const;

export type ExchangeCapabilityEvent = (typeof EXCHANGE_CAPABILITY_EVENTS)[number];

export class IllegalExchangeCapabilityTransitionError extends Error {
  constructor() {
    super('Exchange capability cannot transition to the requested state.');
    this.name = 'IllegalExchangeCapabilityTransitionError';
  }
}

const TRANSITIONS: Readonly<
  Record<
    ExchangeCapabilityState,
    Readonly<Partial<Record<ExchangeCapabilityEvent, ExchangeCapabilityState>>>
  >
> = {
  UNKNOWN: {
    observe_supported: 'SUPPORTED',
    observe_unsupported: 'UNSUPPORTED',
    observe_unavailable: 'UNAVAILABLE',
    observe_unknown: 'UNKNOWN',
    observe_failed: 'VERIFICATION_FAILED',
    reset: 'UNKNOWN',
  },
  SUPPORTED: {
    observe_supported: 'SUPPORTED',
    observe_unsupported: 'UNSUPPORTED',
    observe_unavailable: 'UNAVAILABLE',
    observe_unknown: 'UNKNOWN',
    observe_failed: 'VERIFICATION_FAILED',
    reset: 'UNKNOWN',
  },
  UNSUPPORTED: {
    observe_supported: 'SUPPORTED',
    observe_unsupported: 'UNSUPPORTED',
    observe_unavailable: 'UNAVAILABLE',
    observe_unknown: 'UNKNOWN',
    observe_failed: 'VERIFICATION_FAILED',
    reset: 'UNKNOWN',
  },
  UNAVAILABLE: {
    observe_supported: 'SUPPORTED',
    observe_unsupported: 'UNSUPPORTED',
    observe_unavailable: 'UNAVAILABLE',
    observe_unknown: 'UNKNOWN',
    observe_failed: 'VERIFICATION_FAILED',
    reset: 'UNKNOWN',
  },
  VERIFICATION_FAILED: {
    observe_supported: 'SUPPORTED',
    observe_unsupported: 'UNSUPPORTED',
    observe_unavailable: 'UNAVAILABLE',
    observe_unknown: 'UNKNOWN',
    observe_failed: 'VERIFICATION_FAILED',
    reset: 'UNKNOWN',
  },
};

export function isExchangeCapabilityState(value: string): value is ExchangeCapabilityState {
  return (EXCHANGE_CAPABILITY_STATES as readonly string[]).includes(value);
}

export function canApplyExchangeCapabilityEvent(
  from: ExchangeCapabilityState,
  event: ExchangeCapabilityEvent,
): boolean {
  return TRANSITIONS[from][event] !== undefined;
}

export function applyExchangeCapabilityEvent(
  from: ExchangeCapabilityState,
  event: ExchangeCapabilityEvent,
): ExchangeCapabilityState {
  const next = TRANSITIONS[from][event];
  if (next === undefined) {
    throw new IllegalExchangeCapabilityTransitionError();
  }
  return next;
}

export function capabilityStateFromEvidence(
  evidence: boolean | undefined,
  fallback: ExchangeCapabilityEvent,
): ExchangeCapabilityState {
  if (evidence === true) {
    return applyExchangeCapabilityEvent('UNKNOWN', 'observe_supported');
  }
  if (evidence === false) {
    return applyExchangeCapabilityEvent('UNKNOWN', 'observe_unavailable');
  }
  return applyExchangeCapabilityEvent('UNKNOWN', fallback);
}
