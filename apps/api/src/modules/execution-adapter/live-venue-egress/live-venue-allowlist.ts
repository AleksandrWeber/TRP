/**
 * V3-L02-S-EG1 — Trusted build-time live venue host allowlist (SB-01 / AD-L02-14).
 *
 * Application-controlled only. Not workspace/user configurable.
 * Not a generic HTTP proxy. Handshake/connectivity ≠ authorization.
 * Paper/Mock must not use these origins for ExecutionAdapterPort live I/O.
 */

export const LIVE_VENUE_IDS = Object.freeze(['BINANCE', 'BYBIT', 'OKX'] as const);
export type LiveVenueId = (typeof LIVE_VENUE_IDS)[number];

export const LIVE_VENUE_ENVIRONMENTS = Object.freeze(['live', 'testnet'] as const);
export type LiveVenueEnvironment = (typeof LIVE_VENUE_ENVIRONMENTS)[number];

/** Execution modes that may never select live venue egress via this boundary. */
export const NON_LIVE_EXECUTION_MODES = Object.freeze(['paper', 'mock'] as const);
export type NonLiveExecutionMode = (typeof NON_LIVE_EXECUTION_MODES)[number];
export type LiveVenueExecutionMode = 'live' | NonLiveExecutionMode;

/**
 * Official REST API hostnames only (exact match after normalize).
 * Paths are appended by adapters; hosts are never taken from user input.
 */
export const LIVE_VENUE_ALLOWED_HOSTS: Readonly<
  Record<LiveVenueId, Readonly<Record<LiveVenueEnvironment, readonly string[]>>>
> = Object.freeze({
  BINANCE: Object.freeze({
    live: Object.freeze(['api.binance.com']),
    testnet: Object.freeze(['testnet.binance.vision']),
  }),
  BYBIT: Object.freeze({
    live: Object.freeze(['api.bybit.com']),
    testnet: Object.freeze(['api-testnet.bybit.com']),
  }),
  OKX: Object.freeze({
    // OKX REST uses www.okx.com; demo/simulated trading uses the same host + header (ENV1).
    live: Object.freeze(['www.okx.com']),
    testnet: Object.freeze(['www.okx.com']),
  }),
});

export const LIVE_VENUE_ALLOWED_PORT = 443 as const;

export function isLiveVenueId(value: string): value is LiveVenueId {
  return (LIVE_VENUE_IDS as readonly string[]).includes(value);
}

export function isLiveVenueEnvironment(value: string): value is LiveVenueEnvironment {
  return (LIVE_VENUE_ENVIRONMENTS as readonly string[]).includes(value);
}

export function allowedHostsFor(
  venue: LiveVenueId,
  environment: LiveVenueEnvironment,
): readonly string[] {
  return LIVE_VENUE_ALLOWED_HOSTS[venue][environment];
}

/** Trusted origin for a venue/environment (first allowlisted host). */
export function liveVenueOrigin(
  venue: LiveVenueId,
  environment: LiveVenueEnvironment,
): string {
  const host = LIVE_VENUE_ALLOWED_HOSTS[venue][environment][0];
  return `https://${host}`;
}
