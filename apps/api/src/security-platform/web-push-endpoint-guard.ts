/**
 * Web Push subscription endpoint URL validation (register + send).
 *
 * HTTPS-only. Rejects localhost / loopback / private / link-local / metadata via
 * validateOutboundSsrfTarget(url, []). Rejects userinfo, fragment, non-443 custom
 * ports, and IP-literal hostnames where practical. Syntactic only — no DNS
 * resolution. Does not claim DNS-rebinding immunity.
 */

import { validateOutboundSsrfTarget, type SsrfBlockReason } from './ssrf-allowlist';

export const MAX_WEB_PUSH_ENDPOINT_URL_CHARS = 4096;

export type WebPushEndpointGuardReason =
  SsrfBlockReason | 'userinfo' | 'fragment' | 'too_long' | 'blocked_port' | 'blocked_ip_literal';

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
