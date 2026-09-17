/**
 * V3-L02-S-EG1 — Live venue egress security tests (SB-01).
 * ZERO real venue network calls. Policy + mocked DNS/fetch only.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  assertLiveVenueEgress,
  assertLiveVenueEgressWithDns,
  assertLiveVenueRedirectTarget,
  buildLiveVenueRequestUrl,
  LiveVenueEgressHttpClient,
  liveVenueOrigin,
  rejectUserControlledLiveDestination,
} from './index';

describe('V3-L02-S-EG1 live venue egress security', () => {
  it('Test A — approved Binance host allowed', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'https://api.binance.com/api/v3/ping',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result.ok).toBe(true);
  });

  it('Test B — approved Bybit host allowed', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'https://api.bybit.com/v5/market/time',
      venue: 'BYBIT',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result.ok).toBe(true);
  });

  it('Test C — approved OKX host allowed', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'https://www.okx.com/api/v5/public/time',
      venue: 'OKX',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result.ok).toBe(true);
  });

  it('Test D — arbitrary host rejected', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'https://evil.example/exfil',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result).toEqual({ ok: false, reason: 'unknown_host' });
  });

  it('Test E — attacker subdomain rejected', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'https://api.binance.com.attacker.example/steal',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unknown_host');
  });

  it('Test F — userinfo bypass rejected', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'https://api.binance.com@attacker.example/path',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result).toEqual({ ok: false, reason: 'userinfo_forbidden' });
  });

  it('Test G — HTTP rejected', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'http://api.binance.com/api/v3/ping',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result).toEqual({ ok: false, reason: 'https_required' });
  });

  it('Test H — disallowed port rejected', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'https://api.binance.com:8443/api/v3/ping',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result).toEqual({ ok: false, reason: 'disallowed_port' });
  });

  it('Test I — loopback rejected', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'https://127.0.0.1/api',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(['blocked_address', 'unknown_host']).toContain(result.reason);
  });

  it('Test J — private IP rejected', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'https://10.0.0.5/api',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(['blocked_address', 'unknown_host']).toContain(result.reason);
  });

  it('Test K — link-local rejected', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'https://169.254.169.254/latest/meta-data',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(['blocked_address', 'unknown_host']).toContain(result.reason);
  });

  it('Test L — redirect to attacker host rejected', () => {
    const result = assertLiveVenueRedirectTarget(
      'https://attacker.example/collect',
      'BINANCE',
      'live',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('redirect_forbidden');
  });

  it('Test M — redirect to HTTP rejected', () => {
    const result = assertLiveVenueRedirectTarget('http://api.binance.com/api', 'BINANCE', 'live');
    expect(result).toEqual({ ok: false, reason: 'https_required' });
  });

  it('Test N — malformed URL rejected', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'not a url',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(['malformed_url', 'userinfo_forbidden']).toContain(result.reason);
  });

  it('Test O — missing destination rejected', () => {
    const result = assertLiveVenueEgress({
      targetUrl: '   ',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result).toEqual({ ok: false, reason: 'missing_destination' });
  });

  it('Test P — unknown venue rejected', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'https://api.binance.com/api/v3/ping',
      venue: 'KRAKEN',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result).toEqual({ ok: false, reason: 'unknown_venue' });
  });

  it('Test Q — user-controlled destination rejected', () => {
    expect(rejectUserControlledLiveDestination('https://api.binance.com/ok')).toEqual({
      ok: false,
      reason: 'user_controlled_destination',
    });
    expect(
      buildLiveVenueRequestUrl({
        venue: 'BINANCE',
        environment: 'live',
        pathAndQuery: 'https://evil.example/',
      }).ok,
    ).toBe(false);
  });

  it('Test R — Paper/Mock cannot select live production egress', () => {
    for (const mode of ['paper', 'mock'] as const) {
      const result = assertLiveVenueEgress({
        targetUrl: liveVenueOrigin('BINANCE', 'live') + '/api/v3/ping',
        venue: 'BINANCE',
        environment: 'live',
        executionMode: mode,
      });
      expect(result).toEqual({ ok: false, reason: 'paper_mock_forbidden' });
    }
  });

  it('DNS policy denies private resolved addresses (mocked)', async () => {
    const result = await assertLiveVenueEgressWithDns({
      targetUrl: 'https://api.binance.com/api/v3/ping',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
      enforceResolvedIpPolicy: true,
      resolveDns: async () => [{ address: '10.1.2.3', family: 4 }],
    });
    expect(result).toEqual({ ok: false, reason: 'blocked_resolved_address' });
  });

  it('DNS policy allows public resolved addresses (mocked)', async () => {
    const result = await assertLiveVenueEgressWithDns({
      targetUrl: 'https://api.binance.com/api/v3/ping',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
      enforceResolvedIpPolicy: true,
      resolveDns: async () => [{ address: '8.8.8.8', family: 4 }],
    });
    expect(result.ok).toBe(true);
  });

  it('HTTP client uses redirect:error and never follows Location', async () => {
    const fetchFn = vi.fn(async (_url: string, init: { redirect: string }) => {
      expect(init.redirect).toBe('error');
      return { status: 200, text: async () => '{}' };
    });
    const client = new LiveVenueEgressHttpClient({
      fetchFn: fetchFn as never,
      resolveDns: async () => [{ address: '1.1.1.1', family: 4 }],
    });
    const result = await client.execute({
      venue: 'BINANCE',
      environment: 'live',
      pathAndQuery: '/api/v3/ping',
    });
    expect(result.ok).toBe(true);
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it('cross-venue host mismatch fails closed', () => {
    const wrong = assertLiveVenueEgress({
      targetUrl: 'https://api.bybit.com/v5/market/time',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(wrong.ok).toBe(false);
    const okxOnBybit = assertLiveVenueEgress({
      targetUrl: 'https://www.okx.com/api/v5/public/time',
      venue: 'BYBIT',
      environment: 'live',
      executionMode: 'live',
    });
    expect(okxOnBybit.ok).toBe(false);
  });

  it('testnet hosts are distinct from live where configured', () => {
    expect(
      assertLiveVenueEgress({
        targetUrl: 'https://testnet.binance.vision/api/v3/ping',
        venue: 'BINANCE',
        environment: 'testnet',
        executionMode: 'live',
      }).ok,
    ).toBe(true);
    expect(
      assertLiveVenueEgress({
        targetUrl: 'https://api.binance.com/api/v3/ping',
        venue: 'BINANCE',
        environment: 'testnet',
        executionMode: 'live',
      }).ok,
    ).toBe(false);
  });
});
