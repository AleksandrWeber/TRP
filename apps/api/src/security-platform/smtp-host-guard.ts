/**
 * SMTP host guard — reuse SSRF hostname/IP blocks without pinning a vendor host.
 * Does not perform DNS resolution.
 */

import { validateOutboundSsrfTarget, type SsrfBlockReason } from './ssrf-allowlist';

export type SmtpHostGuardResult =
  | Readonly<{ ok: true; host: string }>
  | Readonly<{ ok: false; reason: SsrfBlockReason | 'invalid' }>;

function bareHostname(host: string): string {
  const trimmed = host.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function toHttpsProbe(host: string): string | null {
  const trimmed = host.trim();
  if (!trimmed) return null;
  if (/[\s/?#]/.test(trimmed) || trimmed.includes('://')) return null;
  const bare = bareHostname(trimmed);
  if (!bare) return null;
  if (bare.includes(':')) {
    return `https://[${bare}]`;
  }
  return `https://${bare}`;
}

export function validateSmtpOutboundHost(host: string): SmtpHostGuardResult {
  const probe = toHttpsProbe(host);
  if (!probe) {
    return Object.freeze({ ok: false as const, reason: 'invalid' as const });
  }
  const result = validateOutboundSsrfTarget(probe);
  if (!result.ok) {
    return Object.freeze({ ok: false as const, reason: result.reason });
  }
  const bare = bareHostname(host);
  if (bare.includes(':')) {
    const normalized = bare.toLowerCase();
    if (
      normalized === '::1' ||
      normalized.startsWith('fe80:') ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd')
    ) {
      return Object.freeze({ ok: false as const, reason: 'blocked_address' as const });
    }
  }
  return Object.freeze({ ok: true as const, host: host.trim() });
}
