/**
 * Web Push adapter error classification.
 *
 * Stable internal codes only. Never echo endpoints, VAPID keys, or encryption keys.
 */

export const WEB_PUSH_NOTIFICATION_ERROR_CODES = Object.freeze([
  'web_push_invalid_request',
  'web_push_not_configured',
  'web_push_no_subscription',
  'web_push_blocked_endpoint',
  'web_push_timeout',
  'web_push_network_error',
  'web_push_tls_failure',
  'web_push_gone',
  'web_push_unauthorized',
  'web_push_rate_limited',
  'web_push_server_error',
  'web_push_invalid_response',
] as const);

export type WebPushNotificationErrorCode = (typeof WEB_PUSH_NOTIFICATION_ERROR_CODES)[number];

export function redactWebPushSecrets(
  value: string,
  secrets: Readonly<{
    endpoint?: string;
    publicKey?: string;
    privateKey?: string;
    p256dh?: string;
    auth?: string;
    subject?: string;
  }> = {},
): string {
  let redacted = value;
  for (const secret of [
    secrets.privateKey,
    secrets.publicKey,
    secrets.p256dh,
    secrets.auth,
    secrets.endpoint,
    secrets.subject,
  ]) {
    const trimmed = secret?.trim();
    if (trimmed && trimmed.length > 0) {
      redacted = redacted.split(trimmed).join('<redacted>');
    }
  }
  if (secrets.endpoint?.trim()) {
    try {
      const path = new URL(secrets.endpoint).pathname;
      if (path.length > 1) {
        redacted = redacted.split(path).join('<redacted>');
      }
    } catch {
      // Invalid URL — full endpoint redaction above is enough.
    }
  }
  return redacted;
}

export function containsWebPushSecret(
  value: string,
  secrets: Readonly<{
    endpoint?: string;
    publicKey?: string;
    privateKey?: string;
    p256dh?: string;
    auth?: string;
  }>,
): boolean {
  for (const secret of [
    secrets.privateKey,
    secrets.publicKey,
    secrets.p256dh,
    secrets.auth,
    secrets.endpoint,
  ]) {
    const trimmed = secret?.trim();
    if (trimmed && value.includes(trimmed)) return true;
  }
  return false;
}

export function classifyWebPushHttpStatus(status: number): WebPushNotificationErrorCode | 'ok' {
  if (status === 201 || status === 200) return 'ok';
  if (status === 410 || status === 404) return 'web_push_gone';
  if (status === 401 || status === 403) return 'web_push_unauthorized';
  if (status === 429) return 'web_push_rate_limited';
  if (status >= 500 && status <= 599) return 'web_push_server_error';
  if (status >= 400 && status <= 499) return 'web_push_invalid_response';
  return 'web_push_invalid_response';
}

export function classifyWebPushTransportError(error: unknown): WebPushNotificationErrorCode {
  const name =
    error && typeof error === 'object' ? String((error as { name?: unknown }).name ?? '') : '';
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code =
    error && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string'
      ? ((error as { code: string }).code as string)
      : '';
  const statusCode =
    error &&
    typeof error === 'object' &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number'
      ? ((error as { statusCode: number }).statusCode as number)
      : undefined;

  if (statusCode !== undefined) {
    const classified = classifyWebPushHttpStatus(statusCode);
    if (classified !== 'ok') return classified;
  }

  if (name === 'AbortError' || name === 'TimeoutError' || message.includes('timeout')) {
    return 'web_push_timeout';
  }
  if (
    message.includes('certificate') ||
    message.includes('ssl') ||
    message.includes('tls') ||
    code === 'CERT_HAS_EXPIRED' ||
    code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
  ) {
    return 'web_push_tls_failure';
  }
  if (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'EHOSTUNREACH' ||
    code === 'ENETUNREACH'
  ) {
    return 'web_push_network_error';
  }
  return 'web_push_network_error';
}

export function isWebPushAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = (error as { name?: unknown }).name;
  return name === 'AbortError' || name === 'TimeoutError';
}
