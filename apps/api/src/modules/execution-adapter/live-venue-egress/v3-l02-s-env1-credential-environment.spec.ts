/**
 * V3-L02-S-ENV1 — Credential environment ↔ venue ↔ EG1 binding tests (SB-06).
 * ZERO real venue / Vault network calls. Synthetic metadata + policy only.
 */

import { describe, expect, it } from 'vitest';
import { SecretPurpose } from '../../secret-vault/secret-purpose';
import {
  assertLiveCredentialEnvironmentBinding,
  assertMayRetrieveTradingCredential,
  liveCredentialBindingErrorMessage,
  liveVenueOrigin,
  redactCredentialMaterial,
  type TrustedCredentialBindingInput,
} from './index';

const WS = 'ws-env1-a';
const WS_B = 'ws-env1-b';

function trusted(
  overrides: Partial<TrustedCredentialBindingInput> &
    Pick<TrustedCredentialBindingInput, 'vaultType' | 'purpose'>,
): TrustedCredentialBindingInput {
  return {
    workspaceId: WS,
    ...overrides,
  };
}

describe('V3-L02-S-ENV1 credential environment separation', () => {
  it('Test A — Live Binance credential + Binance live endpoint → allowed', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'binance', purpose: SecretPurpose.TradingLive }),
      {
        workspaceId: WS,
        venue: 'BINANCE',
        endpointEnvironment: 'live',
        executionMode: 'live',
        targetUrl: `${liveVenueOrigin('BINANCE', 'live')}/api/v3/ping`,
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.credentialEnvironment).toBe('live');
      expect(result.egressEnvironment).toBe('live');
      expect(result.okxDemoHeaders).toBeNull();
    }
  });

  it('Test B — Testnet Binance credential + Binance live endpoint → denied', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'binance', purpose: SecretPurpose.TradingTestnet }),
      {
        workspaceId: WS,
        venue: 'BINANCE',
        endpointEnvironment: 'live',
        executionMode: 'live',
        targetUrl: `${liveVenueOrigin('BINANCE', 'live')}/api/v3/ping`,
      },
    );
    expect(result).toEqual({ ok: false, reason: 'environment_mismatch' });
  });

  it('Test C — Live Binance credential + Binance testnet endpoint → denied', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'binance', purpose: SecretPurpose.TradingLive }),
      {
        workspaceId: WS,
        venue: 'BINANCE',
        endpointEnvironment: 'testnet',
        executionMode: 'live',
        targetUrl: `${liveVenueOrigin('BINANCE', 'testnet')}/api/v3/ping`,
      },
    );
    expect(result).toEqual({ ok: false, reason: 'environment_mismatch' });
  });

  it('Test D — Testnet Binance credential + Binance testnet endpoint → allowed', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'binance', purpose: SecretPurpose.TradingTestnet }),
      {
        workspaceId: WS,
        venue: 'BINANCE',
        endpointEnvironment: 'testnet',
        executionMode: 'live',
        targetUrl: `${liveVenueOrigin('BINANCE', 'testnet')}/api/v3/ping`,
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.credentialEnvironment).toBe('testnet');
      expect(result.egressEnvironment).toBe('testnet');
    }
  });

  it('Test E — Live Bybit + Bybit live → allowed', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'bybit', purpose: SecretPurpose.Trading }),
      {
        workspaceId: WS,
        venue: 'BYBIT',
        endpointEnvironment: 'live',
        executionMode: 'live',
        targetUrl: `${liveVenueOrigin('BYBIT', 'live')}/v5/market/time`,
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.credentialEnvironment).toBe('live');
  });

  it('Test F — Testnet Bybit + Bybit live → denied', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'bybit', purpose: SecretPurpose.TradingTestnet }),
      {
        workspaceId: WS,
        venue: 'BYBIT',
        endpointEnvironment: 'live',
        executionMode: 'live',
      },
    );
    expect(result).toEqual({ ok: false, reason: 'environment_mismatch' });
  });

  it('Test G — Testnet Bybit + Bybit testnet → allowed', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'bybit', purpose: SecretPurpose.TradingTestnet }),
      {
        workspaceId: WS,
        venue: 'BYBIT',
        endpointEnvironment: 'testnet',
        executionMode: 'live',
        targetUrl: `${liveVenueOrigin('BYBIT', 'testnet')}/v5/market/time`,
      },
    );
    expect(result.ok).toBe(true);
  });

  it('Test H — Live OKX + OKX live → allowed', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'okx', purpose: SecretPurpose.TradingLive }),
      {
        workspaceId: WS,
        venue: 'OKX',
        endpointEnvironment: 'live',
        executionMode: 'live',
        targetUrl: `${liveVenueOrigin('OKX', 'live')}/api/v5/public/time`,
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.okxDemoHeaders).toBeNull();
      expect(result.egressEnvironment).toBe('live');
    }
  });

  it('Test I — OKX demo + OKX live → denied', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'okx', purpose: SecretPurpose.TradingDemo }),
      {
        workspaceId: WS,
        venue: 'OKX',
        endpointEnvironment: 'live',
        executionMode: 'live',
      },
    );
    expect(result).toEqual({ ok: false, reason: 'environment_mismatch' });
  });

  it('Test J — Live OKX + OKX demo → denied', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'okx', purpose: SecretPurpose.TradingLive }),
      {
        workspaceId: WS,
        venue: 'OKX',
        endpointEnvironment: 'demo',
        executionMode: 'live',
      },
    );
    expect(result).toEqual({ ok: false, reason: 'environment_mismatch' });
  });

  it('Test Jb — OKX demo + OKX demo (with required header) → allowed', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'okx', purpose: SecretPurpose.TradingDemo }),
      {
        workspaceId: WS,
        venue: 'OKX',
        endpointEnvironment: 'demo',
        executionMode: 'live',
        targetUrl: `${liveVenueOrigin('OKX', 'testnet')}/api/v5/trade/order`,
        requestHeaders: { 'x-simulated-trading': '1' },
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.credentialEnvironment).toBe('demo');
      expect(result.egressEnvironment).toBe('testnet');
      expect(result.okxDemoHeaders).toEqual({ 'x-simulated-trading': '1' });
    }
  });

  it('Test K — Unknown environment → denied', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'binance', purpose: SecretPurpose.TradingLive }),
      {
        workspaceId: WS,
        venue: 'BINANCE',
        endpointEnvironment: 'staging',
        executionMode: 'live',
      },
    );
    expect(result).toEqual({ ok: false, reason: 'unknown_environment' });
  });

  it('Test L — Unknown venue → denied', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'binance', purpose: SecretPurpose.TradingLive }),
      {
        workspaceId: WS,
        venue: 'KRAKEN',
        endpointEnvironment: 'live',
        executionMode: 'live',
      },
    );
    expect(result).toEqual({ ok: false, reason: 'unknown_venue' });
  });

  it('Test M — Venue mismatch (Bybit cred + Binance host class) → denied', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'bybit', purpose: SecretPurpose.TradingLive }),
      {
        workspaceId: WS,
        venue: 'BINANCE',
        endpointEnvironment: 'live',
        executionMode: 'live',
        targetUrl: `${liveVenueOrigin('BINANCE', 'live')}/api/v3/ping`,
      },
    );
    expect(result).toEqual({ ok: false, reason: 'venue_mismatch' });
  });

  it('Test N — Paper path cannot retrieve live credential', () => {
    const retrieve = assertMayRetrieveTradingCredential({
      executionMode: 'paper',
      purpose: SecretPurpose.TradingLive,
    });
    expect(retrieve).toEqual({ ok: false, reason: 'paper_mock_forbidden' });

    const use = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'binance', purpose: SecretPurpose.TradingLive }),
      {
        workspaceId: WS,
        venue: 'BINANCE',
        endpointEnvironment: 'live',
        executionMode: 'paper',
      },
    );
    expect(use).toEqual({ ok: false, reason: 'paper_mock_forbidden' });
  });

  it('Test O — Mock path cannot retrieve live credential', () => {
    const retrieve = assertMayRetrieveTradingCredential({
      executionMode: 'mock',
      purpose: SecretPurpose.Trading,
    });
    expect(retrieve).toEqual({ ok: false, reason: 'paper_mock_forbidden' });

    const use = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'okx', purpose: SecretPurpose.TradingDemo }),
      {
        workspaceId: WS,
        venue: 'OKX',
        endpointEnvironment: 'demo',
        executionMode: 'mock',
      },
    );
    expect(use).toEqual({ ok: false, reason: 'paper_mock_forbidden' });
  });

  it('Test P — Cross-workspace credential access → denied', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({
        workspaceId: WS_B,
        vaultType: 'binance',
        purpose: SecretPurpose.TradingLive,
      }),
      {
        workspaceId: WS,
        venue: 'BINANCE',
        endpointEnvironment: 'live',
        executionMode: 'live',
      },
    );
    expect(result).toEqual({ ok: false, reason: 'workspace_mismatch' });
  });

  it('Test Q — Client-provided environment attempting TEST → LIVE escalation → denied', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'binance', purpose: SecretPurpose.TradingTestnet }),
      {
        workspaceId: WS,
        venue: 'BINANCE',
        endpointEnvironment: 'testnet',
        executionMode: 'live',
        clientClaimedEnvironment: 'live',
      },
    );
    expect(result).toEqual({ ok: false, reason: 'client_environment_escalation' });
  });

  it('Test R — Secret/token never appears in logs/errors', () => {
    const secret = 'sk-live-SUPER-SECRET-KEY-9f3a';
    const noisy = `api_key=${secret} api_secret: "${secret}" Authorization: Bearer ${secret}`;
    const redacted = redactCredentialMaterial(noisy);
    expect(redacted).not.toContain(secret);
    expect(redacted).toMatch(/\[REDACTED\]/);

    const deny = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'binance', purpose: SecretPurpose.TradingLive }),
      {
        workspaceId: WS,
        venue: 'BINANCE',
        endpointEnvironment: 'testnet',
        executionMode: 'live',
      },
    );
    expect(deny.ok).toBe(false);
    if (!deny.ok) {
      const msg = liveCredentialBindingErrorMessage(deny.reason);
      expect(msg).toBe('live_credential_environment_denied:environment_mismatch');
      expect(msg).not.toMatch(/api[_-]?key|secret|token|passphrase/i);
    }
  });

  it('legacy purpose trading maps to live', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'binance', purpose: SecretPurpose.Trading }),
      {
        workspaceId: WS,
        venue: 'BINANCE',
        endpointEnvironment: 'live',
        executionMode: 'live',
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.credentialEnvironment).toBe('live');
  });

  it('non-trading purpose denied', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'binance', purpose: SecretPurpose.Notification }),
      {
        workspaceId: WS,
        venue: 'BINANCE',
        endpointEnvironment: 'live',
        executionMode: 'live',
      },
    );
    expect(result).toEqual({ ok: false, reason: 'non_trading_purpose' });
  });

  it('Binance demo environment unsupported', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'binance', purpose: SecretPurpose.TradingDemo }),
      {
        workspaceId: WS,
        venue: 'BINANCE',
        endpointEnvironment: 'demo',
        executionMode: 'live',
      },
    );
    expect(result).toEqual({ ok: false, reason: 'unsupported_venue_environment' });
  });

  it('OKX live must not carry demo header', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'okx', purpose: SecretPurpose.TradingLive }),
      {
        workspaceId: WS,
        venue: 'OKX',
        endpointEnvironment: 'live',
        executionMode: 'live',
        requestHeaders: { 'x-simulated-trading': '1' },
      },
    );
    expect(result).toEqual({
      ok: false,
      reason: 'okx_demo_header_forbidden_on_live',
    });
  });

  it('wrong EG1 host after env match → egress_denied', () => {
    const result = assertLiveCredentialEnvironmentBinding(
      trusted({ vaultType: 'binance', purpose: SecretPurpose.TradingLive }),
      {
        workspaceId: WS,
        venue: 'BINANCE',
        endpointEnvironment: 'live',
        executionMode: 'live',
        targetUrl: 'https://evil.example/exfil',
      },
    );
    expect(result).toEqual({ ok: false, reason: 'egress_denied' });
  });
});
