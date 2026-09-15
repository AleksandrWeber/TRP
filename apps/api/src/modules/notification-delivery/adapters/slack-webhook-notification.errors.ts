/**
 * Slack Incoming Webhook adapter error classification.
 *
 * Stable internal codes only. Never echo webhook URLs or path tokens.
 */

export const SLACK_WEBHOOK_NOTIFICATION_ERROR_CODES = Object.freeze([
  'slack_webhook_invalid_request',
  'slack_webhook_not_configured',
  'slack_webhook_blocked_url',
  'slack_webhook_timeout',
  'slack_webhook_network_error',
  'slack_webhook_tls_failure',
  'slack_webhook_redirect_rejected',
  'slack_webhook_not_found',
  'slack_webhook_rate_limited',
  'slack_webhook_server_error',
  'slack_webhook_invalid_response',
] as const);

export type SlackWebhookNotificationErrorCode =
  (typeof SLACK_WEBHOOK_NOTIFICATION_ERROR_CODES)[number];

export function redactSlackWebhookSecrets(
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

export function containsSlackWebhookSecret(
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

export function classifySlackWebhookHttpStatus(
  status: number,
): SlackWebhookNotificationErrorCode | 'ok' {
  if (status === 200) return 'ok';
  if (status === 404 || status === 410) return 'slack_webhook_not_found';
  if (status === 429) return 'slack_webhook_rate_limited';
  if (status >= 500 && status <= 599) return 'slack_webhook_server_error';
  if (status >= 400 && status <= 499) return 'slack_webhook_invalid_response';
  return 'slack_webhook_invalid_response';
}

export function classifySlackWebhookTransportError(
  error: unknown,
): SlackWebhookNotificationErrorCode {
  const name =
    error && typeof error === 'object' ? String((error as { name?: unknown }).name ?? '') : '';
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code =
    error && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string'
      ? ((error as { code: string }).code as string)
      : '';

  if (name === 'AbortError' || name === 'TimeoutError' || message.includes('timeout')) {
    return 'slack_webhook_timeout';
  }
  if (
    message.includes('redirect') ||
    code === 'ERR_FR_TOO_MANY_REDIRECTS' ||
    (name === 'TypeError' && message.includes('redirect'))
  ) {
    return 'slack_webhook_redirect_rejected';
  }
  if (
    message.includes('certificate') ||
    message.includes('ssl') ||
    message.includes('tls') ||
    code === 'CERT_HAS_EXPIRED' ||
    code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
  ) {
    return 'slack_webhook_tls_failure';
  }
  if (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'EHOSTUNREACH' ||
    code === 'ENETUNREACH'
  ) {
    return 'slack_webhook_network_error';
  }
  return 'slack_webhook_network_error';
}

export function isSlackAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = (error as { name?: unknown }).name;
  return name === 'AbortError' || name === 'TimeoutError';
}
