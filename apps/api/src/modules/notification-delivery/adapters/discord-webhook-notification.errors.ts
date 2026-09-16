/**
 * Discord Incoming Webhook adapter error classification.
 *
 * Stable internal codes only. Never echo webhook URLs or path tokens.
 */

export const DISCORD_WEBHOOK_NOTIFICATION_ERROR_CODES = Object.freeze([
  'discord_webhook_invalid_request',
  'discord_webhook_not_configured',
  'discord_webhook_blocked_url',
  'discord_webhook_timeout',
  'discord_webhook_network_error',
  'discord_webhook_tls_failure',
  'discord_webhook_redirect_rejected',
  'discord_webhook_not_found',
  'discord_webhook_rate_limited',
  'discord_webhook_server_error',
  'discord_webhook_invalid_response',
] as const);

export type DiscordWebhookNotificationErrorCode =
  (typeof DISCORD_WEBHOOK_NOTIFICATION_ERROR_CODES)[number];

export function redactDiscordWebhookSecrets(
  value: string,
  secrets: Readonly<{ webhookUrl?: string }> = {},
): string {
  let redacted = value;
  const url = secrets.webhookUrl?.trim();
  if (url && url.length > 0) {
    redacted = redacted.split(url).join('<redacted>');
    try {
      const path = new URL(url).pathname;
      if (path.length > 1) {
        redacted = redacted.split(path).join('<redacted>');
      }
    } catch {
      // Invalid URL — full URL redaction above is enough.
    }
  }
  return redacted;
}

export function containsDiscordWebhookSecret(
  value: string,
  secrets: Readonly<{ webhookUrl?: string }>,
): boolean {
  const url = secrets.webhookUrl?.trim();
  if (!url) return false;
  if (value.includes(url)) return true;
  try {
    const path = new URL(url).pathname;
    return path.length > 1 && value.includes(path);
  } catch {
    return false;
  }
}

/**
 * Discord Incoming Webhook success criterion for this slice is HTTP 204 only.
 * HTTP 200 (with or without body) is NOT treated as Connected-eligible success.
 */
export function classifyDiscordWebhookHttpStatus(
  status: number,
): DiscordWebhookNotificationErrorCode | 'ok' {
  if (status === 204) return 'ok';
  if (status === 404 || status === 410 || status === 401 || status === 403) {
    return 'discord_webhook_not_found';
  }
  if (status === 429) return 'discord_webhook_rate_limited';
  if (status >= 500 && status <= 599) return 'discord_webhook_server_error';
  if (status === 200) return 'discord_webhook_invalid_response';
  if (status >= 400 && status <= 499) return 'discord_webhook_invalid_response';
  return 'discord_webhook_invalid_response';
}

export function classifyDiscordWebhookTransportError(
  error: unknown,
): DiscordWebhookNotificationErrorCode {
  const name =
    error && typeof error === 'object' ? String((error as { name?: unknown }).name ?? '') : '';
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code =
    error && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string'
      ? ((error as { code: string }).code as string)
      : '';

  if (name === 'AbortError' || name === 'TimeoutError' || message.includes('timeout')) {
    return 'discord_webhook_timeout';
  }
  if (
    message.includes('redirect') ||
    code === 'ERR_FR_TOO_MANY_REDIRECTS' ||
    (name === 'TypeError' && message.includes('redirect'))
  ) {
    return 'discord_webhook_redirect_rejected';
  }
  if (
    message.includes('certificate') ||
    message.includes('ssl') ||
    message.includes('tls') ||
    code === 'CERT_HAS_EXPIRED' ||
    code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
  ) {
    return 'discord_webhook_tls_failure';
  }
  if (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'EHOSTUNREACH' ||
    code === 'ENETUNREACH'
  ) {
    return 'discord_webhook_network_error';
  }
  return 'discord_webhook_network_error';
}

export function isDiscordAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = (error as { name?: unknown }).name;
  return name === 'AbortError' || name === 'TimeoutError';
}
