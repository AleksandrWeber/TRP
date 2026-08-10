/**
 * RC-26 Epic 3 — MarketState (immutable versioned current-condition artifact).
 *
 * Normalized descriptive Market State for a venue/market.
 * Does not classify algorithms, select strategies, or authorize Runtime.
 * Publishing a new state = new version (no overwrite / mutation).
 */

import {
  MARKET_STATE_DOMAIN_AUTHORITY_CLASS,
  assertNonEmptyString,
  deepFreeze,
  type MarketStateLifecycleStatus,
} from './market-state-domain-shared';
import {
  createMarketStateLifecycle,
  transitionMarketStateLifecycle,
  type CreateMarketStateLifecycleInput,
  type MarketStateLifecycle,
} from './market-state-lifecycle';
import {
  createMarketStateMetadata,
  type CreateMarketStateMetadataInput,
  type MarketStateMetadata,
} from './market-state-metadata';
import {
  createMarketStateSnapshot,
  type CreateMarketStateSnapshotInput,
  type MarketStateSnapshot,
} from './market-state-snapshot';
import {
  assertNextVersionMonotonic,
  createMarketStateVersion,
  type CreateMarketStateVersionInput,
  type MarketStateVersion,
} from './market-state-version';

export type MarketState = Readonly<{
  marketStateId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: MarketStateVersion;
  lifecycle: MarketStateLifecycle;
  snapshot: MarketStateSnapshot;
  metadata: MarketStateMetadata;
  authorityClass: typeof MARKET_STATE_DOMAIN_AUTHORITY_CLASS;
  forcesTrade: false;
  isQualification: false;
  isProfile: false;
  authorizesRuntime: false;
  mutable: false;
}>;

export type CreateMarketStateInput = Readonly<{
  marketStateId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: CreateMarketStateVersionInput | MarketStateVersion;
  lifecycle: CreateMarketStateLifecycleInput | MarketStateLifecycle;
  snapshot: CreateMarketStateSnapshotInput | MarketStateSnapshot;
  metadata: CreateMarketStateMetadataInput | MarketStateMetadata;
}>;

function resolveVersion(
  value: CreateMarketStateVersionInput | MarketStateVersion,
): MarketStateVersion {
  if (
    Object.isFrozen(value) &&
    'mutable' in value &&
    (value as MarketStateVersion).mutable === false
  ) {
    return value as MarketStateVersion;
  }
  return createMarketStateVersion(value as CreateMarketStateVersionInput);
}

function resolveLifecycle(
  value: CreateMarketStateLifecycleInput | MarketStateLifecycle,
): MarketStateLifecycle {
  if (Object.isFrozen(value) && 'authorizesRuntime' in value) {
    return value as MarketStateLifecycle;
  }
  return createMarketStateLifecycle(value as CreateMarketStateLifecycleInput);
}

function resolveSnapshot(
  value: CreateMarketStateSnapshotInput | MarketStateSnapshot,
): MarketStateSnapshot {
  if (Object.isFrozen(value) && 'decidesTrade' in value) {
    return value as MarketStateSnapshot;
  }
  return createMarketStateSnapshot(value as CreateMarketStateSnapshotInput);
}

function resolveMetadata(
  value: CreateMarketStateMetadataInput | MarketStateMetadata,
): MarketStateMetadata {
  if (Object.isFrozen(value) && 'inputSummary' in value && 'authorityClass' in value) {
    return value as MarketStateMetadata;
  }
  return createMarketStateMetadata(value as CreateMarketStateMetadataInput);
}

/**
 * Create an immutable Market State version aggregate.
 * Does not run classification algorithms. Does not mutate after return.
 */
export function createMarketState(input: CreateMarketStateInput): MarketState {
  const marketStateId = assertNonEmptyString(input.marketStateId, 'marketStateId');
  const workspaceId = assertNonEmptyString(input.workspaceId, 'workspaceId');
  const exchangeScopeId = assertNonEmptyString(input.exchangeScopeId, 'exchangeScopeId');
  const marketSymbol = assertNonEmptyString(input.marketSymbol, 'marketSymbol');

  const version = resolveVersion(input.version);
  if (version.marketStateId !== marketStateId) {
    throw new Error('version.marketStateId must match marketStateId');
  }

  return deepFreeze({
    marketStateId,
    workspaceId,
    exchangeScopeId,
    marketSymbol,
    version,
    lifecycle: resolveLifecycle(input.lifecycle),
    snapshot: resolveSnapshot(input.snapshot),
    metadata: resolveMetadata(input.metadata),
    authorityClass: MARKET_STATE_DOMAIN_AUTHORITY_CLASS,
    forcesTrade: false as const,
    isQualification: false as const,
    isProfile: false as const,
    authorizesRuntime: false as const,
    mutable: false as const,
  });
}

/**
 * Return a new Market State with an allowed lifecycle transition applied.
 * Leaves snapshot/version identity unchanged — supersede/archive only.
 */
export function withMarketStateLifecycle(
  current: MarketState,
  to: MarketStateLifecycleStatus,
  updatedAt: string,
  updatedBy: string,
  reason: string,
): MarketState {
  const lifecycle = transitionMarketStateLifecycle(
    current.lifecycle,
    to,
    updatedAt,
    updatedBy,
    reason,
  );
  return createMarketState({
    marketStateId: current.marketStateId,
    workspaceId: current.workspaceId,
    exchangeScopeId: current.exchangeScopeId,
    marketSymbol: current.marketSymbol,
    version: current.version,
    lifecycle,
    snapshot: current.snapshot,
    metadata: current.metadata,
  });
}

/**
 * Publish the next Market State version for a target.
 * - Previous active version (if any) becomes superseded (new immutable copy).
 * - Next version is created as `created` then activated (or directly `active`).
 * - History overwrite is rejected.
 *
 * No classification algorithm — snapshot/metadata must be supplied by caller.
 */
export function publishNextMarketState(
  args: Readonly<{
    history: readonly MarketState[];
    next: Omit<CreateMarketStateInput, 'version' | 'lifecycle'> &
      Readonly<{
        marketStateId: string;
        versionNumber: number;
        publishedAt: string;
        publishedBy: string;
        activate?: boolean;
        lifecycleReason?: string;
      }>;
  }>,
): Readonly<{ previous: MarketState | null; next: MarketState; history: readonly MarketState[] }> {
  const { history, next: nextInput } = args;
  assertNextVersionMonotonic(
    history.map((row) => ({ version: row.version.version })),
    nextInput.versionNumber,
  );

  const targetKey = `${nextInput.workspaceId}|${nextInput.exchangeScopeId}|${nextInput.marketSymbol}`;
  for (const row of history) {
    const rowKey = `${row.workspaceId}|${row.exchangeScopeId}|${row.marketSymbol}`;
    if (rowKey !== targetKey) {
      throw new Error('publishNextMarketState history must share the same target key');
    }
  }

  const activePrevious = [...history].reverse().find((row) => row.lifecycle.status === 'active');
  const previous =
    activePrevious !== undefined
      ? withMarketStateLifecycle(
          activePrevious,
          'superseded',
          nextInput.publishedAt,
          nextInput.publishedBy,
          'superseded by newer Market State version',
        )
      : null;

  const activate = nextInput.activate !== false;
  const created = createMarketState({
    marketStateId: nextInput.marketStateId,
    workspaceId: nextInput.workspaceId,
    exchangeScopeId: nextInput.exchangeScopeId,
    marketSymbol: nextInput.marketSymbol,
    version: {
      marketStateId: nextInput.marketStateId,
      version: nextInput.versionNumber,
      publishedAt: nextInput.publishedAt,
      publishedBy: nextInput.publishedBy,
    },
    lifecycle: {
      status: 'created',
      updatedAt: nextInput.publishedAt,
      updatedBy: nextInput.publishedBy,
      reason: nextInput.lifecycleReason ?? 'market state version created',
    },
    snapshot: nextInput.snapshot,
    metadata: nextInput.metadata,
  });

  const next = activate
    ? withMarketStateLifecycle(
        created,
        'active',
        nextInput.publishedAt,
        nextInput.publishedBy,
        nextInput.lifecycleReason ?? 'market state version activated',
      )
    : created;

  const rebuiltHistory = history.map((row) =>
    previous &&
    row.marketStateId === previous.marketStateId &&
    row.version.version === previous.version.version
      ? previous
      : row,
  );

  return Object.freeze({
    previous,
    next,
    history: Object.freeze([...rebuiltHistory, next]),
  });
}
