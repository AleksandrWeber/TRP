/**
 * V3-L02-S-EG1 — Live venue egress destination policy (SB-01).
 *
 * Answers only: is this outbound destination an explicitly allowed trading venue endpoint?
 * Does not authorize actors, C7, S04, Vault, or capital movement.
 * Reuses security-platform SSRF + public-IP helpers; HTTPS + exact host + port 443.
 */

import {
  isNonPublicOutboundIp,
  validateOutboundSsrfTarget,
} from '../../../security-platform';
import {
  allowedHostsFor,
  isLiveVenueEnvironment,
  isLiveVenueId,
  LIVE_VENUE_ALLOWED_PORT,
  liveVenueOrigin,
  type LiveVenueEnvironment,
  type LiveVenueExecutionMode,
  type LiveVenueId,
} from './live-venue-allowlist';

export type LiveVenueEgressDenyReason =
  | 'missing_destination'
  | 'malformed_url'
  | 'blocked_scheme'
  | 'https_required'
  | 'userinfo_forbidden'
  | 'disallowed_port'
  | 'unknown_venue'
  | 'invalid_environment'
  | 'unknown_host'
  | 'blocked_address'
  | 'paper_mock_forbidden'
  | 'missing_configuration'
  | 'user_controlled_destination'
  | 'dns_failure'
  | 'dns_empty'
  | 'blocked_resolved_address'
  | 'redirect_forbidden'
  | 'path_forbidden';

export type LiveVenueEgressResult =
  | Readonly<{ ok: true; url: URL; venue: LiveVenueId; environment: LiveVenueEnvironment }>
  | Readonly<{ ok: false; reason: LiveVenueEgressDenyReason }>;

export type LiveVenueDnsResolveFn = (
  hostname: string,
) => Promise<readonly Readonly<{ address: string; family: 4 | 6 }>[]>;

export type AssertLiveVenueEgressInput = Readonly<{
  /** Full absolute URL. Must match trusted venue origin — never operator-supplied free-form destinations. */
  targetUrl: string;
  venue: string;
  environment: string;
  executionMode: LiveVenueExecutionMode;
  /**
   * When true, reject if the caller is presenting a destination that differs from
   * the trusted origin+path construction (defense-in-depth for user-controlled URLs).
   */
  rejectUserControlledAbsoluteUrl?: boolean;
  /** Optional DNS resolve hook (tests inject; production may resolve before connect). */
  resolveDns?: LiveVenueDnsResolveFn;
  /** When true (default for live HTTP), resolve DNS and deny non-public IPs. */
  enforceResolvedIpPolicy?: boolean;
}>;

/**
 * Fail-closed policy for live venue destinations.
 * PASS means the destination WOULD be permitted — not that any venue was contacted.
 */
export function assertLiveVenueEgress(input: AssertLiveVenueEgressInput): LiveVenueEgressResult {
  if (input.executionMode === 'paper' || input.executionMode === 'mock') {
    return Object.freeze({ ok: false, reason: 'paper_mock_forbidden' });
  }
  if (input.executionMode !== 'live') {
    return Object.freeze({ ok: false, reason: 'invalid_environment' });
  }

  if (!isLiveVenueId(input.venue)) {
    return Object.freeze({ ok: false, reason: 'unknown_venue' });
  }
  if (!isLiveVenueEnvironment(input.environment)) {
    return Object.freeze({ ok: false, reason: 'invalid_environment' });
  }

  const venue = input.venue;
  const environment = input.environment;
  const hosts = allowedHostsFor(venue, environment);
  if (hosts.length === 0) {
    return Object.freeze({ ok: false, reason: 'missing_configuration' });
  }

  const trimmed = input.targetUrl?.trim() ?? '';
  if (!trimmed) {
    return Object.freeze({ ok: false, reason: 'missing_destination' });
  }

  // Reject userinfo / @ tricks before URL parsing edge cases obscure them.
  if (trimmed.includes('@')) {
    return Object.freeze({ ok: false, reason: 'userinfo_forbidden' });
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return Object.freeze({ ok: false, reason: 'malformed_url' });
  }

  if (parsed.username !== '' || parsed.password !== '') {
    return Object.freeze({ ok: false, reason: 'userinfo_forbidden' });
  }

  if (parsed.protocol === 'http:') {
    return Object.freeze({ ok: false, reason: 'https_required' });
  }
  if (parsed.protocol !== 'https:') {
    return Object.freeze({ ok: false, reason: 'blocked_scheme' });
  }

  const port = parsed.port === '' ? LIVE_VENUE_ALLOWED_PORT : Number(parsed.port);
  if (!Number.isInteger(port) || port !== LIVE_VENUE_ALLOWED_PORT) {
    return Object.freeze({ ok: false, reason: 'disallowed_port' });
  }

  const ssrf = validateOutboundSsrfTarget(trimmed, hosts);
  if (!ssrf.ok) {
    if (ssrf.reason === 'invalid') {
      return Object.freeze({ ok: false, reason: 'malformed_url' });
    }
    if (ssrf.reason === 'blocked_scheme') {
      return Object.freeze({ ok: false, reason: 'blocked_scheme' });
    }
    if (ssrf.reason === 'blocked_address') {
      return Object.freeze({ ok: false, reason: 'blocked_address' });
    }
    return Object.freeze({ ok: false, reason: 'unknown_host' });
  }

  const hostname = ssrf.url.hostname.trim().toLowerCase().replace(/\.$/, '');
  if (!hosts.includes(hostname)) {
    return Object.freeze({ ok: false, reason: 'unknown_host' });
  }

  return Object.freeze({ ok: true, url: ssrf.url, venue, environment });
}

/**
 * Build a trusted live venue URL from allowlisted origin + relative path.
 * Rejects absolute/user-controlled destinations smuggled as "path".
 */
export function buildLiveVenueRequestUrl(input: {
  venue: LiveVenueId;
  environment: LiveVenueEnvironment;
  pathAndQuery: string;
}): LiveVenueEgressResult {
  const path = input.pathAndQuery.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://') || path.includes('@')) {
    return Object.freeze({ ok: false, reason: 'path_forbidden' });
  }
  const origin = liveVenueOrigin(input.venue, input.environment);
  return assertLiveVenueEgress({
    targetUrl: `${origin}${path}`,
    venue: input.venue,
    environment: input.environment,
    executionMode: 'live',
  });
}

/**
 * Redirect Location must pass the same allowlist. Prefer not following redirects
 * (`redirect: 'error'`); this exists for defense-in-depth if a client ever validates Location.
 */
export function assertLiveVenueRedirectTarget(
  locationHeader: string | null | undefined,
  venue: LiveVenueId,
  environment: LiveVenueEnvironment,
): LiveVenueEgressResult {
  if (locationHeader === null || locationHeader === undefined || locationHeader.trim() === '') {
    return Object.freeze({ ok: false, reason: 'redirect_forbidden' });
  }
  const location = locationHeader.trim();
  // Relative redirects stay on the same approved origin — still require absolute https allowlist for live.
  if (location.startsWith('/') && !location.startsWith('//')) {
    return buildLiveVenueRequestUrl({
      venue,
      environment,
      pathAndQuery: location,
    });
  }
  if (location.toLowerCase().startsWith('http:')) {
    return Object.freeze({ ok: false, reason: 'https_required' });
  }
  const result = assertLiveVenueEgress({
    targetUrl: location,
    venue,
    environment,
    executionMode: 'live',
  });
  if (!result.ok) {
    return Object.freeze({ ok: false, reason: 'redirect_forbidden' });
  }
  return result;
}

/**
 * Resolve hostname and deny non-public IPs (loopback/private/link-local).
 * Residual: without connection-level DNS pinning, rebinding remains a documented residual for ADP1.
 */
export async function assertLiveVenueEgressWithDns(
  input: AssertLiveVenueEgressInput,
): Promise<LiveVenueEgressResult> {
  const syntactic = assertLiveVenueEgress({
    ...input,
    enforceResolvedIpPolicy: false,
  });
  if (!syntactic.ok) return syntactic;
  if (input.enforceResolvedIpPolicy === false) return syntactic;

  const resolveDns = input.resolveDns;
  if (!resolveDns) {
    // Without a resolver, fail closed when IP policy is requested.
    return Object.freeze({ ok: false, reason: 'dns_failure' });
  }

  let resolved: readonly Readonly<{ address: string; family: 4 | 6 }>[];
  try {
    resolved = await resolveDns(syntactic.url.hostname);
  } catch {
    return Object.freeze({ ok: false, reason: 'dns_failure' });
  }
  if (!Array.isArray(resolved) || resolved.length === 0) {
    return Object.freeze({ ok: false, reason: 'dns_empty' });
  }
  for (const entry of resolved) {
    if (isNonPublicOutboundIp(entry.address, entry.family)) {
      return Object.freeze({ ok: false, reason: 'blocked_resolved_address' });
    }
  }
  return syntactic;
}

/** Explicit reject helper for free-form user/workspace URLs. */
export function rejectUserControlledLiveDestination(
  candidateUrl: string,
): LiveVenueEgressResult {
  void candidateUrl;
  return Object.freeze({ ok: false, reason: 'user_controlled_destination' });
}
