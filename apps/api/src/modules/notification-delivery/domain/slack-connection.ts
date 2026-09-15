/**
 * Production Slack notification connection (bind + webhook verification).
 *
 * Credentials remain Vault/Connections owned. Connected requires a successful
 * webhook test send — credentials stored ≠ Connected. No recipient field;
 * destination is embedded in the Vault webhook URL.
 */

export const SLACK_CONNECTION_STATUSES = Object.freeze([
  'not-connected',
  'pending',
  'connected',
] as const);

export type SlackConnectionStatus = (typeof SLACK_CONNECTION_STATUSES)[number];

export type SlackConnection = Readonly<{
  workspaceId: string;
  userId: string;
  status: SlackConnectionStatus;
  /** Set when operator binds after Vault webhook exists. */
  boundAt?: string;
  verifiedAt?: string;
  connectedAt?: string;
  /** Stable adapter error code from last failed test. Never a webhook URL. */
  lastErrorCode?: string;
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

export function notConnectedSlack(
  workspaceId: string,
  userId: string,
  updatedAt: string,
): SlackConnection {
  return deepFreeze({
    workspaceId: assertNonEmpty(workspaceId, 'workspaceId'),
    userId: assertNonEmpty(userId, 'userId'),
    status: 'not-connected',
    updatedAt: assertNonEmpty(updatedAt, 'updatedAt'),
  });
}

export function bindSlackChannel(connection: SlackConnection, updatedAt: string): SlackConnection {
  const at = assertNonEmpty(updatedAt, 'updatedAt');
  return deepFreeze({
    workspaceId: connection.workspaceId,
    userId: connection.userId,
    status: 'pending',
    boundAt: at,
    updatedAt: at,
  });
}

export function markSlackWebhookVerified(
  connection: SlackConnection,
  verifiedAt: string,
): SlackConnection {
  if (connection.status !== 'pending' && connection.status !== 'connected') {
    throw new Error('Slack channel is not bound');
  }
  const at = assertNonEmpty(verifiedAt, 'verifiedAt');
  return deepFreeze({
    workspaceId: connection.workspaceId,
    userId: connection.userId,
    status: 'connected',
    boundAt: connection.boundAt ?? at,
    verifiedAt: at,
    connectedAt: at,
    updatedAt: at,
  });
}

export function markSlackWebhookFailed(
  connection: SlackConnection,
  updatedAt: string,
  lastErrorCode?: string,
): SlackConnection {
  if (connection.status === 'not-connected' && !connection.boundAt) {
    return notConnectedSlack(connection.workspaceId, connection.userId, updatedAt);
  }
  const at = assertNonEmpty(updatedAt, 'updatedAt');
  return deepFreeze({
    workspaceId: connection.workspaceId,
    userId: connection.userId,
    status: 'pending',
    boundAt: connection.boundAt ?? at,
    updatedAt: at,
    ...(lastErrorCode?.trim()
      ? { lastErrorCode: assertNonEmpty(lastErrorCode, 'lastErrorCode') }
      : {}),
  });
}

export function disconnectSlackConnection(
  connection: SlackConnection,
  updatedAt: string,
): SlackConnection {
  return notConnectedSlack(connection.workspaceId, connection.userId, updatedAt);
}
