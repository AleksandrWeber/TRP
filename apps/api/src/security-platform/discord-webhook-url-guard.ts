/**
 * Discord Incoming Webhook URL validation (store + send).
 *
 * HTTPS-only. Host pinned to discord.com / discordapp.com (exact, no subdomains).
 * Path must match /api/webhooks/{snowflake}/{token}. Syntactic only — no DNS
 * resolution (same class as validateOutboundSsrfTarget / Slack guard). Does not
 * claim DNS-rebinding immunity.
 */

import { validateOutboundSsrfTarget, type SsrfBlockReason } from './ssrf-allowlist';

export const DISCORD_INCOMING_WEBHOOK_HOSTS = Object.freeze([
  'discord.com',
  'discordapp.com',
] as const);

export const MAX_DISCORD_WEBHOOK_URL_CHARS = 2048;

/** Canonical: /api/webhooks/{snowflake}/{token}. */
const WEBHOOK_PATH = /^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/;

export type DiscordWebhookUrlGuardResult =
  | Readonly<{ ok: true; url: URL }>
  | Readonly<{
      ok: false;
      reason: SsrfBlockReason | 'blocked_path' | 'userinfo' | 'query' | 'fragment' | 'too_long';
    }>;

export function validateDiscordIncomingWebhookUrl(target: string): DiscordWebhookUrlGuardResult {
  const trimmed = target.trim();
  if (!trimmed) {
    return Object.freeze({ ok: false as const, reason: 'invalid' as const });
  }
  if (trimmed.length > MAX_DISCORD_WEBHOOK_URL_CHARS) {
    return Object.freeze({ ok: false as const, reason: 'too_long' as const });
  }

  const ssrf = validateOutboundSsrfTarget(trimmed, DISCORD_INCOMING_WEBHOOK_HOSTS);
  if (!ssrf.ok) {
    return Object.freeze({ ok: false as const, reason: ssrf.reason });
  }

  if (ssrf.url.protocol !== 'https:') {
    return Object.freeze({ ok: false as const, reason: 'blocked_scheme' as const });
  }

  const hostname = ssrf.url.hostname.toLowerCase();
  if (hostname !== 'discord.com' && hostname !== 'discordapp.com') {
    return Object.freeze({ ok: false as const, reason: 'blocked_host' as const });
  }

  if (ssrf.url.username || ssrf.url.password) {
    return Object.freeze({ ok: false as const, reason: 'userinfo' as const });
  }

  if (ssrf.url.search.length > 0) {
    return Object.freeze({ ok: false as const, reason: 'query' as const });
  }

  if (ssrf.url.hash.length > 0) {
    return Object.freeze({ ok: false as const, reason: 'fragment' as const });
  }

  if (!WEBHOOK_PATH.test(ssrf.url.pathname)) {
    return Object.freeze({ ok: false as const, reason: 'blocked_path' as const });
  }

  return Object.freeze({ ok: true as const, url: ssrf.url });
}
