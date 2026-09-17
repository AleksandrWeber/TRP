/**
 * FIV-CONN-01 — Connection environment subset of ENV1 taxonomy.
 */

import { describe, expect, it } from 'vitest';
import {
  CONNECTION_TRADING_ENVIRONMENTS,
  TRADING_CREDENTIAL_ENVIRONMENTS,
  isConnectionTradingEnvironment,
  isTradingCredentialEnvironment,
  type TradingCredentialEnvironment,
} from '../execution-adapter/live-venue-egress/trading-credential-environment';
import {
  resolveConnectionEnvironmentForCreate,
  type ConnectionTradingEnvironment,
} from './connection-environment';

describe('connection-environment (FIV-CONN-01)', () => {
  it('reuses ENV1 TradingCredentialEnvironment vocabulary without a duplicate taxonomy', () => {
    expect(TRADING_CREDENTIAL_ENVIRONMENTS).toEqual(['live', 'testnet', 'demo']);
    expect(CONNECTION_TRADING_ENVIRONMENTS).toEqual(['live', 'testnet']);
    for (const env of CONNECTION_TRADING_ENVIRONMENTS) {
      expect(isTradingCredentialEnvironment(env)).toBe(true);
      const asEnv1: TradingCredentialEnvironment = env;
      expect(asEnv1).toBe(env);
    }
    expect(isConnectionTradingEnvironment('demo')).toBe(false);
    expect(isTradingCredentialEnvironment('demo')).toBe(true);
  });

  it('accepts live and testnet for EXCHANGE and rejects omit/demo', () => {
    expect(
      resolveConnectionEnvironmentForCreate({ connectionType: 'EXCHANGE', environment: 'live' }),
    ).toEqual({ ok: true, environment: 'live' satisfies ConnectionTradingEnvironment });
    expect(
      resolveConnectionEnvironmentForCreate({
        connectionType: 'EXCHANGE',
        environment: 'testnet',
      }),
    ).toEqual({ ok: true, environment: 'testnet' });
    expect(
      resolveConnectionEnvironmentForCreate({ connectionType: 'EXCHANGE', environment: undefined }),
    ).toEqual({ ok: false, reason: 'environment_required' });
    expect(
      resolveConnectionEnvironmentForCreate({ connectionType: 'EXCHANGE', environment: 'demo' }),
    ).toEqual({ ok: false, reason: 'environment_invalid' });
  });

  it('allows null environment for non-exchange creates without implicit LIVE', () => {
    expect(
      resolveConnectionEnvironmentForCreate({
        connectionType: 'NOTIFICATION',
        environment: undefined,
      }),
    ).toEqual({ ok: true, environment: null });
    expect(
      resolveConnectionEnvironmentForCreate({
        connectionType: 'AI',
        environment: null,
      }),
    ).toEqual({ ok: true, environment: null });
  });
});
