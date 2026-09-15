/**
 * Slack Incoming Webhook URL validation (store + send).
 *
 * HTTPS-only. Host pinned to hooks.slack.com. Path must match Slack
 * incoming-webhook shape. Syntactic only — no DNS resolution (same class
 * as validateOutboundSsrfTarget). Does not relax host pinning.
 */

import { validateOutboundSsrfTarget, type SsrfBlockReason } from './ssrf-allowlist';

export const SLACK_INCOMING_WEBHOOK_HOST = 'hooks.slack.com' as const;
export const MAX_SLACK_WEBHOOK_URL_CHARS = 2048;

/** Canonical: /services/{team}/{hook}/{token}. Legacy OAuth: /{team}/{hook}/{token}. */
const SERVICES_PATH = /^\/services\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/;
const LEGACY_PATH = /^\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/;

export type SlackWebhookUrlGuardResult =
  | Readonly<{ ok: true; url: URL }>
  | Readonly<{
      ok: false;
      reason: SsrfBlockReason | 'blocked_path' | 'userinfo' | 'query' | 'fragment' | 'too_long';
    }>;

export function validateSlackIncomingWebhookUrl(target: string): SlackWebhookUrlGuardResult {
  const trimmed = target.trim();
  if (!trimmed) {
    return Object.freeze({ ok: false as const, reason: 'invalid' as const });
  }
  if (trimmed.length > MAX_SLACK_WEBHOOK_URL_CHARS) {
    return Object.freeze({ ok: false as const, reason: 'too_long' as const });
  }

  const ssrf = validateOutboundSsrfTarget(trimmed, [SLACK_INCOMING_WEBHOOK_HOST]);
  if (!ssrf.ok) {
    return Object.freeze({ ok: false as const, reason: ssrf.reason });
  }

  if (ssrf.url.protocol !== 'https:') {
    return Object.freeze({ ok: false as const, reason: 'blocked_scheme' as const });
  }

  if (ssrf.url.hostname.toLowerCase() !== SLACK_INCOMING_WEBHOOK_HOST) {
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

  const path = ssrf.url.pathname;
  if (!SERVICES_PATH.test(path) && !LEGACY_PATH.test(path)) {
    return Object.freeze({ ok: false as const, reason: 'blocked_path' as const });
  }

  return Object.freeze({ ok: true as const, url: ssrf.url });
}
