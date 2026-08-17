/**
 * Health, reconnect eligibility, and provider availability projection (W2-S02-c).
 *
 * Health reflects observed session state only. There is no polling loop,
 * heartbeat daemon, or automatic reconnect.
 */

import type { ExchangeSessionState } from './exchange-session.state';

export const EXCHANGE_HEALTH_PROJECTIONS = [
  'HEALTHY',
  'UNAVAILABLE',
  'EXPIRED',
  'AUTHENTICATION_FAILED',
  'CONNECTION_LOST',
] as const;

export type ExchangeHealthProjection = (typeof EXCHANGE_HEALTH_PROJECTIONS)[number];

export const EXCHANGE_PROVIDER_AVAILABILITY_OBSERVATIONS = [
  'AVAILABLE',
  'UNAVAILABLE',
  'UNKNOWN',
] as const;

export type ExchangeProviderAvailabilityObservation =
  (typeof EXCHANGE_PROVIDER_AVAILABILITY_OBSERVATIONS)[number];

export type ExchangeReconnectEligibility = Readonly<{
  required: boolean;
  allowed: boolean;
}>;

/** Automatic reconnect is out of this slice. Eligibility never schedules a retry. */
export const AUTOMATIC_RECONNECT_ENABLED = false;

export function canAutomaticallyReconnect(): false {
  return AUTOMATIC_RECONNECT_ENABLED;
}

export function projectExchangeHealth(
  state: ExchangeSessionState,
): ExchangeHealthProjection | null {
  switch (state) {
    case 'CONNECTED':
      return 'HEALTHY';
    case 'PROVIDER_UNAVAILABLE':
      return 'UNAVAILABLE';
    case 'SESSION_EXPIRED':
      return 'EXPIRED';
    case 'AUTHENTICATION_FAILED':
      return 'AUTHENTICATION_FAILED';
    case 'CONNECTION_LOST':
      return 'CONNECTION_LOST';
    default:
      return null;
  }
}

export function projectReconnectEligibility(
  state: ExchangeSessionState,
): ExchangeReconnectEligibility {
  switch (state) {
    case 'SESSION_EXPIRED':
    case 'CONNECTION_LOST':
      return { required: true, allowed: true };
    case 'PROVIDER_UNAVAILABLE':
      return { required: true, allowed: true };
    case 'VALIDATION_FAILED':
      return { required: false, allowed: true };
    case 'AUTHENTICATION_FAILED':
    case 'CONNECTED':
    case 'DISCONNECTED':
    case 'PENDING_VALIDATION':
      return { required: false, allowed: false };
  }
}

export function observeProviderAvailability(
  state: ExchangeSessionState,
): ExchangeProviderAvailabilityObservation {
  if (state === 'CONNECTED') {
    return 'AVAILABLE';
  }
  if (state === 'PROVIDER_UNAVAILABLE') {
    return 'UNAVAILABLE';
  }
  return 'UNKNOWN';
}
