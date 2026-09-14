/**
 * SMTP notification adapter error classification.
 *
 * Stable internal codes only. Never echo SMTP passwords, usernames, senders,
 * or raw server banners.
 */

export const SMTP_NOTIFICATION_ERROR_CODES = Object.freeze([
  'smtp_invalid_request',
  'smtp_not_configured',
  'smtp_unauthorized',
  'smtp_blocked_host',
  'smtp_tls_required',
  'smtp_timeout',
  'smtp_network_error',
  'smtp_tls_failure',
  'smtp_recipient_rejected',
  'smtp_server_error',
  'smtp_invalid_response',
] as const);

export type SmtpNotificationErrorCode = (typeof SMTP_NOTIFICATION_ERROR_CODES)[number];

export function redactSmtpSecrets(
  value: string,
  secrets: Readonly<{ password?: string; username?: string; sender?: string }> = {},
): string {
  let redacted = value;
  for (const secret of [secrets.password, secrets.username, secrets.sender]) {
    if (secret && secret.length > 0) {
      redacted = redacted.split(secret).join('<redacted>');
    }
  }
  return redacted;
}

export function containsSmtpSecret(
  value: string,
  secrets: Readonly<{ password?: string; username?: string; sender?: string }>,
): boolean {
  for (const secret of [secrets.password, secrets.username, secrets.sender]) {
    if (secret && secret.length > 0 && value.includes(secret)) return true;
  }
  return false;
}

export function classifySmtpTransportError(error: unknown): SmtpNotificationErrorCode {
  const code = errorCode(error);
  const responseCode = smtpResponseCode(error);
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (isTimeoutError(error) || code === 'ETIMEDOUT' || code === 'ETIMEOUT' || code === 'ESOCKET') {
    if (message.includes('timeout') || code === 'ETIMEDOUT' || code === 'ETIMEOUT') {
      return 'smtp_timeout';
    }
  }
  if (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'EHOSTUNREACH' ||
    code === 'ENETUNREACH'
  ) {
    return 'smtp_network_error';
  }
  if (
    message.includes('certificate') ||
    message.includes('ssl') ||
    message.includes('tls') ||
    code === 'ECERTIFICATE' ||
    code === 'EPROTO'
  ) {
    return 'smtp_tls_failure';
  }
  if (responseCode === 535 || message.includes('invalid login') || message.includes('auth')) {
    return 'smtp_unauthorized';
  }
  if (responseCode === 550 || responseCode === 551 || responseCode === 553) {
    return 'smtp_recipient_rejected';
  }
  if (responseCode >= 400 && responseCode <= 599) {
    return 'smtp_server_error';
  }
  if (message.includes('timeout')) {
    return 'smtp_timeout';
  }
  return 'smtp_invalid_response';
}

function errorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const candidate = (error as { code?: unknown }).code;
  return typeof candidate === 'string' ? candidate : '';
}

function smtpResponseCode(error: unknown): number {
  if (!error || typeof error !== 'object') return 0;
  const candidate = (error as { responseCode?: unknown }).responseCode;
  return typeof candidate === 'number' ? candidate : 0;
}

function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = (error as { name?: unknown }).name;
  return name === 'AbortError' || name === 'TimeoutError';
}
