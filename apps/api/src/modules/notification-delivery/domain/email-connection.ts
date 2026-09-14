/**
 * Production Email notification connection (recipient bind + SMTP verification).
 *
 * Credentials remain Vault/Connections owned. Connected requires a successful
 * SMTP test send — credentials stored ≠ Connected.
 */

export const EMAIL_CONNECTION_STATUSES = Object.freeze([
  'not-connected',
  'pending',
  'connected',
] as const);

export type EmailConnectionStatus = (typeof EMAIL_CONNECTION_STATUSES)[number];

export type EmailConnection = Readonly<{
  workspaceId: string;
  userId: string;
  status: EmailConnectionStatus;
  /** Operator-bound mailbox. Not a Vault secret. */
  recipient?: string;
  verifiedAt?: string;
  connectedAt?: string;
  updatedAt: string;
}>;

function assertNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${field} is required`);
  return trimmed;
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Object.isFrozen(value)) return value;
  for (const key of Object.keys(value as object)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

const MAX_RECIPIENT_CHARS = 320;
const RECIPIENT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmailRecipient(
  value: string,
): Readonly<{ ok: true; recipient: string }> | Readonly<{ ok: false }> {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_RECIPIENT_CHARS) {
    return Object.freeze({ ok: false as const });
  }
  if (/[\r\n]/.test(trimmed)) {
    return Object.freeze({ ok: false as const });
  }
  if (!RECIPIENT_PATTERN.test(trimmed)) {
    return Object.freeze({ ok: false as const });
  }
  return Object.freeze({ ok: true as const, recipient: trimmed });
}

export function notConnectedEmail(
  workspaceId: string,
  userId: string,
  updatedAt: string,
): EmailConnection {
  return deepFreeze({
    workspaceId: assertNonEmpty(workspaceId, 'workspaceId'),
    userId: assertNonEmpty(userId, 'userId'),
    status: 'not-connected',
    updatedAt: assertNonEmpty(updatedAt, 'updatedAt'),
  });
}

export function bindEmailRecipient(
  connection: EmailConnection,
  recipient: string,
  updatedAt: string,
): EmailConnection {
  const parsed = parseEmailRecipient(recipient);
  if (!parsed.ok) {
    throw new Error('Email recipient is invalid');
  }
  return deepFreeze({
    workspaceId: connection.workspaceId,
    userId: connection.userId,
    status: 'pending',
    recipient: parsed.recipient,
    updatedAt: assertNonEmpty(updatedAt, 'updatedAt'),
  });
}

export function markEmailSmtpVerified(
  connection: EmailConnection,
  verifiedAt: string,
): EmailConnection {
  if (!connection.recipient) {
    throw new Error('Email recipient is not bound');
  }
  const at = assertNonEmpty(verifiedAt, 'verifiedAt');
  return deepFreeze({
    workspaceId: connection.workspaceId,
    userId: connection.userId,
    status: 'connected',
    recipient: connection.recipient,
    verifiedAt: at,
    connectedAt: at,
    updatedAt: at,
  });
}

export function markEmailSmtpFailed(
  connection: EmailConnection,
  updatedAt: string,
): EmailConnection {
  if (!connection.recipient) {
    return notConnectedEmail(connection.workspaceId, connection.userId, updatedAt);
  }
  return deepFreeze({
    workspaceId: connection.workspaceId,
    userId: connection.userId,
    status: 'pending',
    recipient: connection.recipient,
    updatedAt: assertNonEmpty(updatedAt, 'updatedAt'),
  });
}

export function disconnectEmailConnection(
  connection: EmailConnection,
  updatedAt: string,
): EmailConnection {
  return notConnectedEmail(connection.workspaceId, connection.userId, updatedAt);
}
