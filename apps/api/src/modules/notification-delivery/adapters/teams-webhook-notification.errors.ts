/**
 * Microsoft Teams Incoming Webhook adapter error classification.
 *
 * Stable internal codes only. Never echo webhook URLs, query strings, or sig.
 */

export const TEAMS_WEBHOOK_NOTIFICATION_ERROR_CODES = Object.freeze([
  'teams_webhook_invalid_request',
  'teams_webhook_not_configured',
  'teams_webhook_blocked_url',
  'teams_webhook_timeout',
  'teams_webhook_network_error',
  'teams_webhook_tls_failure',
  'teams_webhook_redirect_rejected',
  'teams_webhook_unauthorized',
  'teams_webhook_not_found',
  'teams_webhook_rate_limited',
  'teams_webhook_server_error',
  'teams_webhook_unsupported_status',
  'teams_webhook_invalid_response',
] as const);

export type TeamsWebhookNotificationErrorCode =
  (typeof TEAMS_WEBHOOK_NOTIFICATION_ERROR_CODES)[number];

export function redactTeamsWebhookSecrets(
  value: string,
  secrets: Readonly<{ webhookUrl?: string }> = {},
): string {
  let redacted = value;
  const url = secrets.webhookUrl?.trim();
  if (url && url.length > 0) {
    redacted = redacted.split(url).join('<redacted>');
    try {
      const parsed = new URL(url);
      if (parsed.pathname.length > 1) {
        redacted = redacted.split(parsed.pathname).join('<redacted>');
      }
      if (parsed.search.length > 1) {
        redacted = redacted.split(parsed.search).join('<redacted>');
        const sig = parsed.searchParams.get('sig');
        if (sig && sig.length > 0) {
          redacted = redacted.split(sig).join('<redacted>');
        }
      }
    } catch {
      // Invalid URL — full URL redaction above is enough.
    }
  }
  return redacted;
}

export function containsTeamsWebhookSecret(
  value: string,
  secrets: Readonly<{ webhookUrl?: string }>,
): boolean {
  const url = secrets.webhookUrl?.trim();
  if (!url) return false;
  if (value.includes(url)) return true;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.length > 1 && value.includes(parsed.pathname)) return true;
    if (parsed.search.length > 1 && value.includes(parsed.search)) return true;
    const sig = parsed.searchParams.get('sig');
    if (sig && sig.length > 0 && value.includes(sig)) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Microsoft Teams Incoming Webhook success criterion for this slice is HTTP 202 only.
 * HTTP 200 and any other 2xx are NOT treated as Connected-eligible success.
 */
export function classifyTeamsWebhookHttpStatus(
  status: number,
): TeamsWebhookNotificationErrorCode | 'ok' {
  if (status === 202) return 'ok';
  if (status === 401 || status === 403) return 'teams_webhook_unauthorized';
  if (status === 404 || status === 410) return 'teams_webhook_not_found';
  if (status === 429) return 'teams_webhook_rate_limited';
  if (status >= 500 && status <= 599) return 'teams_webhook_server_error';
  if (status >= 200 && status <= 299) return 'teams_webhook_unsupported_status';
  if (status >= 400 && status <= 499) return 'teams_webhook_invalid_response';
  return 'teams_webhook_invalid_response';
}

export function classifyTeamsWebhookTransportError(
  error: unknown,
): TeamsWebhookNotificationErrorCode {
  const name =
    error && typeof error === 'object' ? String((error as { name?: unknown }).name ?? '') : '';
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code =
    error && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string'
      ? ((error as { code: string }).code as string)
      : '';

  if (name === 'AbortError' || name === 'TimeoutError' || message.includes('timeout')) {
    return 'teams_webhook_timeout';
  }
  if (
    message.includes('redirect') ||
    code === 'ERR_FR_TOO_MANY_REDIRECTS' ||
    (name === 'TypeError' && message.includes('redirect'))
  ) {
    return 'teams_webhook_redirect_rejected';
  }
  if (
    message.includes('certificate') ||
    message.includes('ssl') ||
    message.includes('tls') ||
    code === 'CERT_HAS_EXPIRED' ||
    code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
  ) {
    return 'teams_webhook_tls_failure';
  }
  if (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'EHOSTUNREACH' ||
    code === 'ENETUNREACH'
  ) {
    return 'teams_webhook_network_error';
  }
  return 'teams_webhook_network_error';
}

export function isTeamsAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = (error as { name?: unknown }).name;
  return name === 'AbortError' || name === 'TimeoutError';
}
