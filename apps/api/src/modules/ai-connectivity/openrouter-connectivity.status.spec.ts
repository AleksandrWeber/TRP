import { describe, expect, it } from 'vitest';
import {
  assertOpenRouterConnectivityStatus,
  isOpenRouterConnectivityStatus,
  projectOpenRouterConnectivityStatus,
} from './openrouter-connectivity.status';
import { projectOpenRouterConnectivity } from './openrouter-connectivity.projection';

describe('OpenRouter connectivity status (W2-S05-a)', () => {
  it('supports only the approved connectivity states', () => {
    expect(isOpenRouterConnectivityStatus('NOT_CONFIGURED')).toBe(true);
    expect(isOpenRouterConnectivityStatus('CONFIGURED')).toBe(true);
    expect(isOpenRouterConnectivityStatus('CONNECTED')).toBe(true);
    expect(isOpenRouterConnectivityStatus('CONNECTION_FAILED')).toBe(true);
    expect(isOpenRouterConnectivityStatus('DISABLED')).toBe(true);
    expect(isOpenRouterConnectivityStatus('PENDING_VALIDATION')).toBe(false);
    expect(isOpenRouterConnectivityStatus('HEALTHY')).toBe(false);
    expect(() => assertOpenRouterConnectivityStatus('ONLINE')).toThrow(
      /Rejected OpenRouter connectivity state/,
    );
  });

  it('projects connection status onto approved connectivity states', () => {
    expect(
      projectOpenRouterConnectivityStatus({
        connectionType: 'AI',
        provider: 'OPENROUTER',
        status: 'DISCONNECTED',
        credentialsStored: false,
      }),
    ).toBe('NOT_CONFIGURED');
    expect(
      projectOpenRouterConnectivityStatus({
        connectionType: 'AI',
        provider: 'OPENROUTER',
        status: 'DISCONNECTED',
        credentialsStored: true,
      }),
    ).toBe('CONFIGURED');
    expect(
      projectOpenRouterConnectivityStatus({
        connectionType: 'AI',
        provider: 'OPENROUTER',
        status: 'CONNECTED',
        credentialsStored: true,
      }),
    ).toBe('CONNECTED');
    expect(
      projectOpenRouterConnectivityStatus({
        connectionType: 'AI',
        provider: 'OPENROUTER',
        status: 'AUTHENTICATION_FAILED',
        credentialsStored: true,
      }),
    ).toBe('CONNECTION_FAILED');
    expect(
      projectOpenRouterConnectivityStatus({
        connectionType: 'AI',
        provider: 'OPENROUTER',
        status: 'DISABLED',
        credentialsStored: true,
      }),
    ).toBe('DISABLED');
  });

  it('does not project non-OpenRouter connections', () => {
    expect(
      projectOpenRouterConnectivityStatus({
        connectionType: 'EXCHANGE',
        provider: 'BINANCE',
        status: 'CONNECTED',
        credentialsStored: true,
      }),
    ).toBeNull();
    expect(
      projectOpenRouterConnectivity('EXCHANGE', 'BINANCE', 'CONNECTED', true, null),
    ).toBeNull();
  });
});
