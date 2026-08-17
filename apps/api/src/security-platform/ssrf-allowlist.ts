export type SsrfBlockReason = 'invalid' | 'blocked_scheme' | 'blocked_host' | 'blocked_address';

export type SsrfValidationResult =
  Readonly<{ ok: true; url: URL }> | Readonly<{ ok: false; reason: SsrfBlockReason }>;

const ALLOWED_SCHEMES = new Set(['http:', 'https:']);

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal', 'metadata.google']);

const METADATA_IPV4 = '169.254.169.254';

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '');
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

function isBlockedIpv4(value: string): boolean {
  const ip = ipv4ToInt(value);
  if (ip === null) return false;

  if (value === METADATA_IPV4) return true;

  const first = (ip >>> 24) & 0xff;
  const second = (ip >>> 16) & 0xff;

  if (first === 127) return true;
  if (first === 10) return true;
  if (first === 0) return true;
  if (first === 169 && second === 254) return true;
  if (first === 192 && second === 168) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;

  return false;
}

function isBlockedIpv6(value: string): boolean {
  const normalized = value.toLowerCase();
  if (normalized === '::1') return true;
  if (normalized.startsWith('fe80:')) return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  return false;
}

function hostnameIsBlocked(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith('.localhost')) return true;
  if (isBlockedIpv4(host)) return true;
  if (host.includes(':') && isBlockedIpv6(host)) return true;
  return false;
}

/**
 * Fail-closed outbound URL validation for later webhook consumers (V3-S04-e).
 * Does not perform DNS resolution; callers must not treat PASS as live-network proof.
 */
export function validateOutboundSsrfTarget(
  target: string,
  allowedHosts: readonly string[] = [],
): SsrfValidationResult {
  const trimmed = target.trim();
  if (!trimmed) {
    return { ok: false, reason: 'invalid' };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  if (!ALLOWED_SCHEMES.has(url.protocol)) {
    return { ok: false, reason: 'blocked_scheme' };
  }

  const hostname = normalizeHostname(url.hostname);
  if (hostnameIsBlocked(hostname)) {
    return { ok: false, reason: 'blocked_address' };
  }

  const allowlist = allowedHosts.map(normalizeHostname).filter(Boolean);
  if (allowlist.length > 0 && !allowlist.includes(hostname)) {
    return { ok: false, reason: 'blocked_host' };
  }

  return { ok: true, url };
}
