import { assertConnectionStatus, type ConnectionStatus } from './connection-status';
import type { ExchangeCapabilities } from './exchange-capabilities';
import { assertExchangeId, type ExchangeId } from './exchange-id';

/**
 * ExchangeConnection aggregate (US209).
 * Tracks adapter connection state only — never Portfolio / Position / Order / Risk.
 */
export type ExchangeConnection = Readonly<{
  id: string;
  workspaceId: string;
  exchangeId: ExchangeId;
  status: ConnectionStatus;
  latencyMs: number | null;
  lastHeartbeatAt: string | null;
  lastSynchronizedAt: string | null;
  apiPermissions: readonly string[];
  supportedMarkets: readonly string[];
  capabilities: ExchangeCapabilities;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateExchangeConnectionInput = Readonly<{
  id: string;
  workspaceId: string;
  exchangeId: string;
  capabilities: ExchangeCapabilities;
  apiPermissions?: readonly string[];
  supportedMarkets?: readonly string[];
  createdAt: string;
  updatedAt: string;
}>;

export function createExchangeConnection(input: CreateExchangeConnectionInput): ExchangeConnection {
  const id = required(input.id, 'connection id');
  const workspaceId = required(input.workspaceId, 'workspace id');
  const exchangeId = assertExchangeId(input.exchangeId);
  assertIso(input.createdAt, 'createdAt');
  assertIso(input.updatedAt, 'updatedAt');

  return Object.freeze({
    id,
    workspaceId,
    exchangeId,
    status: 'DISCONNECTED' as const,
    latencyMs: null,
    lastHeartbeatAt: null,
    lastSynchronizedAt: null,
    apiPermissions: Object.freeze([...(input.apiPermissions ?? [])]),
    supportedMarkets: Object.freeze([...(input.supportedMarkets ?? [])]),
    capabilities: Object.freeze({ ...input.capabilities }),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

export function withConnectionStatus(
  connection: ExchangeConnection,
  status: ConnectionStatus,
  now: string,
): ExchangeConnection {
  assertConnectionStatus(status);
  assertIso(now, 'now');
  return Object.freeze({
    ...connection,
    status,
    updatedAt: now,
  });
}

export function withHeartbeat(
  connection: ExchangeConnection,
  now: string,
  latencyMs: number,
): ExchangeConnection {
  assertIso(now, 'now');
  if (!Number.isFinite(latencyMs) || latencyMs < 0) {
    throw new Error('latencyMs must be a non-negative finite number');
  }
  return Object.freeze({
    ...connection,
    status: connection.status === 'DISCONNECTED' ? connection.status : ('CONNECTED' as const),
    latencyMs,
    lastHeartbeatAt: now,
    updatedAt: now,
  });
}

export function withSynchronization(
  connection: ExchangeConnection,
  now: string,
): ExchangeConnection {
  assertIso(now, 'now');
  return Object.freeze({
    ...connection,
    lastSynchronizedAt: now,
    updatedAt: now,
  });
}

export function rehydrateExchangeConnection(input: ExchangeConnection): ExchangeConnection {
  assertExchangeId(input.exchangeId);
  assertConnectionStatus(input.status);
  assertIso(input.createdAt, 'createdAt');
  assertIso(input.updatedAt, 'updatedAt');
  if (input.lastHeartbeatAt !== null) assertIso(input.lastHeartbeatAt, 'lastHeartbeatAt');
  if (input.lastSynchronizedAt !== null) {
    assertIso(input.lastSynchronizedAt, 'lastSynchronizedAt');
  }
  return Object.freeze({
    ...input,
    apiPermissions: Object.freeze([...input.apiPermissions]),
    supportedMarkets: Object.freeze([...input.supportedMarkets]),
    capabilities: Object.freeze({ ...input.capabilities }),
  });
}

function required(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required`);
  return trimmed;
}

function assertIso(value: string, label: string): void {
  if (new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}
