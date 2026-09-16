/**
 * Production Discord notification connection (bind + webhook verification).
 *
 * Credentials remain Vault/Connections owned. Connected requires a successful
 * webhook test send (HTTP 204) — credentials stored ≠ Connected. No recipient
 * field; destination is embedded in the Vault webhook URL.
 */

export const DISCORD_CONNECTION_STATUSES = Object.freeze([
  'not-connected',
  'pending',
  'connected',
] as const);

export type DiscordConnectionStatus = (typeof DISCORD_CONNECTION_STATUSES)[number];

export type DiscordConnection = Readonly<{
  workspaceId: string;
  userId: string;
  status: DiscordConnectionStatus;
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

export function notConnectedDiscord(
  workspaceId: string,
  userId: string,
  updatedAt: string,
): DiscordConnection {
  return deepFreeze({
    workspaceId: assertNonEmpty(workspaceId, 'workspaceId'),
    userId: assertNonEmpty(userId, 'userId'),
    status: 'not-connected',
    updatedAt: assertNonEmpty(updatedAt, 'updatedAt'),
  });
}

export function bindDiscordChannel(
  connection: DiscordConnection,
  updatedAt: string,
): DiscordConnection {
  const at = assertNonEmpty(updatedAt, 'updatedAt');
  return deepFreeze({
    workspaceId: connection.workspaceId,
    userId: connection.userId,
    status: 'pending',
    boundAt: at,
    updatedAt: at,
  });
}

export function markDiscordWebhookVerified(
  connection: DiscordConnection,
  verifiedAt: string,
): DiscordConnection {
  if (connection.status !== 'pending' && connection.status !== 'connected') {
    throw new Error('Discord channel is not bound');
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

export function markDiscordWebhookFailed(
  connection: DiscordConnection,
  updatedAt: string,
  lastErrorCode?: string,
): DiscordConnection {
  if (connection.status === 'not-connected' && !connection.boundAt) {
    return notConnectedDiscord(connection.workspaceId, connection.userId, updatedAt);
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

export function disconnectDiscordConnection(
  connection: DiscordConnection,
  updatedAt: string,
): DiscordConnection {
  return notConnectedDiscord(connection.workspaceId, connection.userId, updatedAt);
}
