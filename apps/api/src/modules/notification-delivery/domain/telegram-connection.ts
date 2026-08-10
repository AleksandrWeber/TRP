/**
 * RC-24 Epic 6 — Telegram connection domain (chat id never entered by user).
 */

export const TELEGRAM_CONNECTION_STATUSES = Object.freeze([
  'not-connected',
  'pending',
  'connected',
] as const);

export type TelegramConnectionStatus = (typeof TELEGRAM_CONNECTION_STATUSES)[number];

export type TelegramConnection = Readonly<{
  workspaceId: string;
  userId: string;
  status: TelegramConnectionStatus;
  /** Opaque token for deep-link bind; never a trading credential. */
  connectionToken?: string;
  /** Captured automatically from Telegram when the user completes connect. */
  chatId?: string;
  connectedAt?: string;
  updatedAt: string;
}>;

export type CreatePendingTelegramConnectionInput = Readonly<{
  workspaceId: string;
  userId: string;
  connectionToken: string;
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

export function createPendingTelegramConnection(
  input: CreatePendingTelegramConnectionInput,
): TelegramConnection {
  return deepFreeze({
    workspaceId: assertNonEmpty(input.workspaceId, 'workspaceId'),
    userId: assertNonEmpty(input.userId, 'userId'),
    status: 'pending',
    connectionToken: assertNonEmpty(input.connectionToken, 'connectionToken'),
    updatedAt: assertNonEmpty(input.updatedAt, 'updatedAt'),
  });
}

export function bindTelegramChat(
  connection: TelegramConnection,
  chatId: string,
  connectedAt: string,
): TelegramConnection {
  if (connection.status !== 'pending' && connection.status !== 'connected') {
    throw new Error('Telegram connection is not awaiting bind');
  }
  return deepFreeze({
    workspaceId: connection.workspaceId,
    userId: connection.userId,
    status: 'connected',
    connectionToken: connection.connectionToken,
    chatId: assertNonEmpty(chatId, 'chatId'),
    connectedAt: assertNonEmpty(connectedAt, 'connectedAt'),
    updatedAt: connectedAt,
  });
}

export function disconnectTelegramConnection(
  connection: TelegramConnection,
  updatedAt: string,
): TelegramConnection {
  return deepFreeze({
    workspaceId: connection.workspaceId,
    userId: connection.userId,
    status: 'not-connected',
    updatedAt: assertNonEmpty(updatedAt, 'updatedAt'),
  });
}

export function notConnectedTelegram(
  workspaceId: string,
  userId: string,
  updatedAt: string,
): TelegramConnection {
  return deepFreeze({
    workspaceId: assertNonEmpty(workspaceId, 'workspaceId'),
    userId: assertNonEmpty(userId, 'userId'),
    status: 'not-connected',
    updatedAt: assertNonEmpty(updatedAt, 'updatedAt'),
  });
}
