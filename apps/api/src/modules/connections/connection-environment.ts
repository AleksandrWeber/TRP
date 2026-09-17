/**
 * FIV-CONN-01 — Connection-persisted environment contract.
 * Reuses ENV1 vocabulary (`live` | `testnet`); DEMO deferred for Connections.
 */

import {
  CONNECTION_TRADING_ENVIRONMENTS,
  isConnectionTradingEnvironment,
  type ConnectionTradingEnvironment,
} from '../execution-adapter/live-venue-egress/trading-credential-environment';

export {
  CONNECTION_TRADING_ENVIRONMENTS,
  isConnectionTradingEnvironment,
  type ConnectionTradingEnvironment,
};

/**
 * Resolve environment for create.
 * EXCHANGE: required live|testnet — omit/invalid/demo → fail closed (null return + caller rejects).
 * Non-EXCHANGE: omit → null; if provided must still be live|testnet.
 */
export function resolveConnectionEnvironmentForCreate(input: {
  connectionType: string;
  environment: unknown;
}): { ok: true; environment: ConnectionTradingEnvironment | null } | { ok: false; reason: string } {
  const raw = input.environment;
  const omitted = raw === undefined || raw === null || raw === '';

  if (input.connectionType === 'EXCHANGE') {
    if (omitted) {
      return { ok: false, reason: 'environment_required' };
    }
    if (!isConnectionTradingEnvironment(raw)) {
      return { ok: false, reason: 'environment_invalid' };
    }
    return { ok: true, environment: raw };
  }

  if (omitted) {
    return { ok: true, environment: null };
  }
  if (!isConnectionTradingEnvironment(raw)) {
    return { ok: false, reason: 'environment_invalid' };
  }
  return { ok: true, environment: raw };
}
