/**
 * Operator-visible session projection (W2-S02-c).
 *
 * Connected / Healthy means only that an authenticated session was observed.
 * It does not mean trading, balances, market data, or execution.
 */

import {
  observeProviderAvailability,
  projectExchangeHealth,
  projectReconnectEligibility,
  type ExchangeHealthProjection,
  type ExchangeProviderAvailabilityObservation,
} from './exchange-session.health';
import {
  sessionStateFromConnectionStatus,
  type ExchangeSessionState,
} from './exchange-session.state';

export type ExchangeSessionView = Readonly<{
  state: ExchangeSessionState;
  health: ExchangeHealthProjection | null;
  reconnectRequired: boolean;
  reconnectAllowed: boolean;
  providerAvailability: ExchangeProviderAvailabilityObservation;
}>;

export function projectExchangeSession(
  connectionType: string,
  status: string,
): ExchangeSessionView | null {
  if (connectionType !== 'EXCHANGE') {
    return null;
  }
  const state = sessionStateFromConnectionStatus(status);
  if (state === null) {
    return null;
  }
  const reconnect = projectReconnectEligibility(state);
  return {
    state,
    health: projectExchangeHealth(state),
    reconnectRequired: reconnect.required,
    reconnectAllowed: reconnect.allowed,
    providerAvailability: observeProviderAvailability(state),
  };
}
