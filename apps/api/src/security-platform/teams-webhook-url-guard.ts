/**
 * Microsoft Teams Workflows Incoming Webhook URL validation (store + send).
 *
 * CM-15 frozen contract:
 * - HTTPS only
 * - host = <env>.<region>.environment.api.powerplatform.com (exact two-label)
 * - path Form A / Form B
 * - query exactly api-version, sp, sv, sig (all required; no duplicates/unknowns)
 * - preserve exact stored URL string for outbound delivery (do not rewrite query)
 *
 * Syntactic only — no DNS resolution. Does not claim DNS-rebinding immunity.
 */

import { validateOutboundSsrfTarget, type SsrfBlockReason } from './ssrf-allowlist';

export const MAX_TEAMS_WEBHOOK_URL_CHARS = 4096;

/** Exact two labels before .environment.api.powerplatform.com */
export const TEAMS_WEBHOOK_HOST_REGEX =
  /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.environment\.api\.powerplatform\.com$/;

const PATH_FORM_A =
  /^\/powerautomate\/automations\/direct\/workflows\/[A-Za-z0-9_-]+\/triggers\/manual\/paths\/invoke\/?$/;
const PATH_FORM_B =
  /^\/powerautomate\/automations\/direct\/cu\/[0-9]+\/workflows\/[A-Za-z0-9_-]+\/triggers\/manual\/paths\/invoke\/?$/;

const REQUIRED_QUERY_NAMES = Object.freeze(['api-version', 'sp', 'sv', 'sig'] as const);

export type TeamsWebhookUrlGuardReason =
  | SsrfBlockReason
  | 'blocked_path'
  | 'userinfo'
  | 'query'
  | 'fragment'
  | 'too_long'
  | 'blocked_port';

export type TeamsWebhookUrlGuardResult =
  | Readonly<{
      ok: true;
      url: URL;
      /** Exact trimmed operator URL — must be used for outbound fetch (query preserved). */
      preservedUrl: string;
    }>
  | Readonly<{
      ok: false;
      reason: TeamsWebhookUrlGuardReason;
    }>;

export function validateTeamsIncomingWebhookUrl(target: string): TeamsWebhookUrlGuardResult {
  const trimmed = target.trim();
  if (!trimmed) {
    return Object.freeze({ ok: false as const, reason: 'invalid' as const });
  }
  if (trimmed.length > MAX_TEAMS_WEBHOOK_URL_CHARS) {
    return Object.freeze({ ok: false as const, reason: 'too_long' as const });
  }

  // Block private/localhost/metadata via existing SSRF helper (empty host allowlist).
  const ssrf = validateOutboundSsrfTarget(trimmed, []);
  if (!ssrf.ok) {
    return Object.freeze({ ok: false as const, reason: ssrf.reason });
  }

  if (ssrf.url.protocol !== 'https:') {
    return Object.freeze({ ok: false as const, reason: 'blocked_scheme' as const });
  }

  const port = ssrf.url.port;
  if (port !== '' && port !== '443') {
    return Object.freeze({ ok: false as const, reason: 'blocked_port' as const });
  }

  if (ssrf.url.username || ssrf.url.password) {
    return Object.freeze({ ok: false as const, reason: 'userinfo' as const });
  }

  if (ssrf.url.hash.length > 0) {
    return Object.freeze({ ok: false as const, reason: 'fragment' as const });
  }

  const hostname = ssrf.url.hostname.toLowerCase();
  if (!TEAMS_WEBHOOK_HOST_REGEX.test(hostname)) {
    return Object.freeze({ ok: false as const, reason: 'blocked_host' as const });
  }

  const rawPath = extractRawPath(trimmed);
  if (rawPath === null || rawPath.includes('%')) {
    return Object.freeze({ ok: false as const, reason: 'blocked_path' as const });
  }
  if (!PATH_FORM_A.test(ssrf.url.pathname) && !PATH_FORM_B.test(ssrf.url.pathname)) {
    return Object.freeze({ ok: false as const, reason: 'blocked_path' as const });
  }

  const queryCheck = validateTeamsQuery(ssrf.url.search);
  if (!queryCheck.ok) {
    return Object.freeze({ ok: false as const, reason: 'query' as const });
  }

  return Object.freeze({
    ok: true as const,
    url: ssrf.url,
    preservedUrl: trimmed,
  });
}

function extractRawPath(trimmed: string): string | null {
  const schemeIdx = trimmed.indexOf('://');
  if (schemeIdx < 0) return null;
  const afterHost = trimmed.indexOf('/', schemeIdx + 3);
  if (afterHost < 0) return null;
  const queryIdx = trimmed.indexOf('?', afterHost);
  return queryIdx < 0 ? trimmed.slice(afterHost) : trimmed.slice(afterHost, queryIdx);
}

function validateTeamsQuery(search: string): Readonly<{ ok: boolean }> {
  if (!search || search === '?') {
    return Object.freeze({ ok: false });
  }
  const raw = search.startsWith('?') ? search.slice(1) : search;
  if (!raw) {
    return Object.freeze({ ok: false });
  }

  const pairs = raw.split('&');
  const seen = new Set<string>();
  const values = new Map<string, string>();

  for (const pair of pairs) {
    if (pair.length === 0) {
      return Object.freeze({ ok: false });
    }
    const eq = pair.indexOf('=');
    const name = eq < 0 ? pair : pair.slice(0, eq);
    const value = eq < 0 ? '' : pair.slice(eq + 1);
    if (!name || seen.has(name)) {
      return Object.freeze({ ok: false });
    }
    seen.add(name);
    values.set(name, value);
  }

  if (seen.size !== REQUIRED_QUERY_NAMES.length) {
    return Object.freeze({ ok: false });
  }
  for (const required of REQUIRED_QUERY_NAMES) {
    if (!seen.has(required)) {
      return Object.freeze({ ok: false });
    }
    const value = values.get(required) ?? '';
    if (value.length === 0) {
      return Object.freeze({ ok: false });
    }
  }
  for (const name of seen) {
    if (!(REQUIRED_QUERY_NAMES as readonly string[]).includes(name)) {
      return Object.freeze({ ok: false });
    }
  }

  return Object.freeze({ ok: true });
}
