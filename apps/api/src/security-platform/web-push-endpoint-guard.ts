/**
 * Web Push subscription endpoint URL validation (register + send).
 *
 * HTTPS-only syntactic checks, then public DNS resolution of every returned
 * address. Outbound send pins Node's HTTPS agent lookup to the validated
 * public addresses so TLS SNI/hostname verification still uses the original
 * hostname while the TCP peer is the validated IP (TOCTOU / rebinding control).
 */

import { lookup as dnsLookup } from 'node:dns/promises';
import { Agent as HttpsAgent } from 'node:https';
import { validateOutboundSsrfTarget, type SsrfBlockReason } from './ssrf-allowlist';

export const MAX_WEB_PUSH_ENDPOINT_URL_CHARS = 4096;

export type WebPushEndpointGuardReason =
  | SsrfBlockReason
  | 'userinfo'
  | 'fragment'
  | 'too_long'
  | 'blocked_port'
  | 'blocked_ip_literal'
  | 'dns_failure'
  | 'dns_empty'
  | 'dns_malformed'
  | 'blocked_resolved_address';

export type WebPushResolvedAddress = Readonly<{
  address: string;
  family: 4 | 6;
}>;

export type WebPushDnsResolveFn = (hostname: string) => Promise<readonly WebPushResolvedAddress[]>;

/** Nest injection token for deterministic DNS mocks in security tests. */
export const WEB_PUSH_DNS_RESOLVE = Symbol('WEB_PUSH_DNS_RESOLVE');

export type WebPushEndpointGuardResult =
  | Readonly<{
      ok: true;
      url: URL;
      /** Exact trimmed operator URL — must be used for outbound send. */
      preservedUrl: string;
    }>
  | Readonly<{
      ok: false;
      reason: WebPushEndpointGuardReason;
    }>;

export type WebPushEndpointOutboundGuardResult =
  | Readonly<{
      ok: true;
      url: URL;
      preservedUrl: string;
      hostname: string;
      pinnedAddresses: readonly WebPushResolvedAddress[];
    }>
  | Readonly<{
      ok: false;
      reason: WebPushEndpointGuardReason;
    }>;

function isIpv4Literal(hostname: string): boolean {
  const parts = hostname.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const octet = Number(part);
    return Number.isInteger(octet) && octet >= 0 && octet <= 255;
  });
}

function isIpv6Literal(hostname: string): boolean {
  // URL.hostname for IPv6 is without brackets.
  return hostname.includes(':');
}

/**
 * Syntactic Web Push endpoint policy (no DNS).
 * IP literals are rejected — Push endpoints are hostname-based.
 */
export function validateWebPushEndpointUrl(target: string): WebPushEndpointGuardResult {
  const trimmed = target.trim();
  if (!trimmed) {
    return Object.freeze({ ok: false as const, reason: 'invalid' as const });
  }
  if (trimmed.length > MAX_WEB_PUSH_ENDPOINT_URL_CHARS) {
    return Object.freeze({ ok: false as const, reason: 'too_long' as const });
  }

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
  if (isIpv4Literal(hostname) || isIpv6Literal(hostname)) {
    return Object.freeze({ ok: false as const, reason: 'blocked_ip_literal' as const });
  }

  return Object.freeze({
    ok: true as const,
    url: ssrf.url,
    preservedUrl: trimmed,
  });
}

/** Production DNS resolver — `dns.lookup(..., { all: true })` for IPv4 + IPv6. */
export async function defaultWebPushDnsResolve(
  hostname: string,
): Promise<readonly WebPushResolvedAddress[]> {
  const records = await dnsLookup(hostname, { all: true, verbatim: true });
  return Object.freeze(
    records.map((record) =>
      Object.freeze({
        address: record.address,
        family: record.family === 6 ? (6 as const) : (4 as const),
      }),
    ),
  );
}

/**
 * Full outbound policy: syntactic checks + resolve hostname + validate every
 * address. Fail closed on DNS errors / empty / malformed / any non-public IP.
 */
export async function validateWebPushEndpointOutbound(
  target: string,
  options: Readonly<{ resolveDns?: WebPushDnsResolveFn }> = {},
): Promise<WebPushEndpointOutboundGuardResult> {
  const syntactic = validateWebPushEndpointUrl(target);
  if (!syntactic.ok) {
    return Object.freeze({ ok: false as const, reason: syntactic.reason });
  }

  const hostname = syntactic.url.hostname.toLowerCase();
  const resolveDns = options.resolveDns ?? defaultWebPushDnsResolve;

  let resolved: readonly WebPushResolvedAddress[];
  try {
    resolved = await resolveDns(hostname);
  } catch {
    return Object.freeze({ ok: false as const, reason: 'dns_failure' as const });
  }

  if (!Array.isArray(resolved) || resolved.length === 0) {
    return Object.freeze({ ok: false as const, reason: 'dns_empty' as const });
  }

  const pinned: WebPushResolvedAddress[] = [];
  for (const entry of resolved) {
    if (!isWellFormedResolvedAddress(entry)) {
      return Object.freeze({ ok: false as const, reason: 'dns_malformed' as const });
    }
    if (isNonPublicOutboundIp(entry.address, entry.family)) {
      return Object.freeze({ ok: false as const, reason: 'blocked_resolved_address' as const });
    }
    pinned.push(Object.freeze({ address: entry.address, family: entry.family }));
  }

  return Object.freeze({
    ok: true as const,
    url: syntactic.url,
    preservedUrl: syntactic.preservedUrl,
    hostname,
    pinnedAddresses: Object.freeze(pinned),
  });
}

/**
 * HTTPS agent whose DNS lookup returns only pre-validated public addresses.
 * Original hostname remains in the request URL → TLS SNI + cert verification
 * still bind to the push-service hostname, while TCP connects to pinned IPs.
 */
export function createWebPushPinnedHttpsAgent(
  pinnedAddresses: readonly WebPushResolvedAddress[],
): HttpsAgent {
  const addresses = pinnedAddresses.map((entry) =>
    Object.freeze({ address: entry.address, family: entry.family }),
  );

  const pinnedLookup = (
    _hostname: string,
    options: number | import('node:dns').LookupOneOptions | undefined,
    callback: (
      err: NodeJS.ErrnoException | null,
      address: string | Array<{ address: string; family: number }>,
      family?: number,
    ) => void,
  ): void => {
    const familyHint = extractLookupFamily(options);
    const wantsAll =
      typeof options === 'object' &&
      options !== null &&
      'all' in options &&
      (options as { all?: unknown }).all === true;
    const candidates =
      familyHint === 4 || familyHint === 6
        ? addresses.filter((entry) => entry.family === familyHint)
        : addresses;
    if (candidates.length === 0) {
      const error = Object.assign(new Error('No validated public address for family'), {
        code: 'ENOTFOUND',
      }) as NodeJS.ErrnoException;
      if (wantsAll) {
        callback(error, []);
      } else {
        callback(error, '', 0);
      }
      return;
    }
    // Node 18+ https.Agent often calls lookup with { all: true } and expects
    // callback(err, Array<{ address, family }>). The legacy 3-arg form still
    // applies when all is not set.
    if (wantsAll) {
      callback(
        null,
        candidates.map((entry) => ({ address: entry.address, family: entry.family })),
      );
      return;
    }
    const pick = candidates[0]!;
    callback(null, pick.address, pick.family);
  };

  return new HttpsAgent({
    keepAlive: false,
    // Pin TCP peer to validated public IPs; TLS hostname verification unchanged.
    lookup: pinnedLookup as unknown as HttpsAgent['options']['lookup'],
  });
}

function extractLookupFamily(options: unknown): 4 | 6 | 0 {
  if (typeof options === 'number') {
    if (options === 4 || options === 6) return options;
    return 0;
  }
  if (options && typeof options === 'object' && 'family' in options) {
    const family = (options as { family?: unknown }).family;
    if (family === 4 || family === 6) return family;
  }
  return 0;
}

function isWellFormedResolvedAddress(entry: unknown): entry is WebPushResolvedAddress {
  if (!entry || typeof entry !== 'object') return false;
  const address = (entry as { address?: unknown }).address;
  const family = (entry as { family?: unknown }).family;
  if (typeof address !== 'string' || !address.trim()) return false;
  if (family !== 4 && family !== 6) return false;
  if (family === 4) return isIpv4Literal(address.trim());
  // IPv6 must contain a colon; reject garbage.
  return address.includes(':');
}

/**
 * Non-public IP policy for resolved addresses (loopback / private / link-local /
 * metadata / IPv4-mapped equivalents). Fail closed on unparseable values.
 */
export function isNonPublicOutboundIp(address: string, family: 4 | 6): boolean {
  const trimmed = address.trim().toLowerCase();
  if (!trimmed) return true;

  if (family === 4) {
    return isBlockedIpv4Address(trimmed);
  }

  // IPv4-mapped IPv6 (::ffff:a.b.c.d)
  const mapped = trimmed.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped?.[1]) {
    return isBlockedIpv4Address(mapped[1]);
  }

  return isBlockedIpv6Address(trimmed);
}

function ipv4ToInt(value: string): number | null {
  const parts = value.split('.');
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null;
    result = (result << 8) + octet;
  }
  return result >>> 0;
}

function isBlockedIpv4Address(value: string): boolean {
  const ip = ipv4ToInt(value);
  if (ip === null) return true;

  if (value === '169.254.169.254') return true;

  const first = (ip >>> 24) & 0xff;
  const second = (ip >>> 16) & 0xff;

  if (first === 127) return true; // loopback
  if (first === 10) return true; // private
  if (first === 0) return true; // "this" network
  if (first === 169 && second === 254) return true; // link-local
  if (first === 192 && second === 168) return true; // private
  if (first === 172 && second >= 16 && second <= 31) return true; // private
  return false;
}

function isBlockedIpv6Address(value: string): boolean {
  if (value === '::1' || value === '::') return true;
  // fe80::/10 link-local
  if (/^fe[89ab][0-9a-f]:/i.test(value) || value.startsWith('fe80:')) return true;
  // fc00::/7 unique local
  if (value.startsWith('fc') || value.startsWith('fd')) return true;
  return false;
}
