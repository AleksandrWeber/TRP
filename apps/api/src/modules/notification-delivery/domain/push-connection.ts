/**
 * Production Push notification connection (bind + Web Push verification).
 *
 * Credentials remain Vault/Connections owned (VAPID). Connected requires a
 * successful production Web Push send — credentials/subscription stored ≠
 * Connected. Device endpoints live in the subscription registry, not here.
 */

export const PUSH_CONNECTION_STATUSES = Object.freeze([
  'not-connected',
  'pending',
  'connected',
] as const);

export type PushConnectionStatus = (typeof PUSH_CONNECTION_STATUSES)[number];

export type PushConnection = Readonly<{
  workspaceId: string;
  userId: string;
  status: PushConnectionStatus;
  /** Set when operator binds after Vault VAPID exists. */
  boundAt?: string;
  verifiedAt?: string;
  connectedAt?: string;
  /** Stable adapter error code from last failed test. Never an endpoint or key. */
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

export function notConnectedPush(
  workspaceId: string,
  userId: string,
  updatedAt: string,
): PushConnection {
  return deepFreeze({
    workspaceId: assertNonEmpty(workspaceId, 'workspaceId'),
    userId: assertNonEmpty(userId, 'userId'),
    status: 'not-connected',
    updatedAt: assertNonEmpty(updatedAt, 'updatedAt'),
  });
}

export function bindPushChannel(connection: PushConnection, updatedAt: string): PushConnection {
  const at = assertNonEmpty(updatedAt, 'updatedAt');
  return deepFreeze({
    workspaceId: connection.workspaceId,
    userId: connection.userId,
    status: 'pending',
    boundAt: at,
    updatedAt: at,
  });
}

export function markPushVerified(connection: PushConnection, verifiedAt: string): PushConnection {
  if (connection.status !== 'pending' && connection.status !== 'connected') {
    throw new Error('Push channel is not bound');
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

export function markPushFailed(
  connection: PushConnection,
  updatedAt: string,
  lastErrorCode?: string,
): PushConnection {
  if (connection.status === 'not-connected' && !connection.boundAt) {
    return notConnectedPush(connection.workspaceId, connection.userId, updatedAt);
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

export function disconnectPushConnection(
  connection: PushConnection,
  updatedAt: string,
): PushConnection {
  return notConnectedPush(connection.workspaceId, connection.userId, updatedAt);
}
