/**
 * RC-27 Epic 2 — ExchangeScope (immutable versioned isolation aggregate).
 *
 * Isolation identity + versioned configuration + lifecycle + metadata.
 * Does not route, orchestrate, trade, or become Runtime / Session / Execution.
 */

import {
  EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
  assertNonEmptyString,
  deepFreeze,
  isExchangeScopeVenueCode,
  type ExchangeScopeLifecycleStatus,
  type ExchangeScopeVenueCode,
} from './exchange-scope-domain-shared';
import {
  createExchangeScopeConfig,
  type CreateExchangeScopeConfigInput,
  type ExchangeScopeConfig,
} from './exchange-scope-config';
import {
  createExchangeScopeLifecycle,
  transitionExchangeScopeLifecycle,
  type CreateExchangeScopeLifecycleInput,
  type ExchangeScopeLifecycle,
} from './exchange-scope-lifecycle';
import {
  createExchangeScopeMetadata,
  type CreateExchangeScopeMetadataInput,
  type ExchangeScopeMetadata,
} from './exchange-scope-metadata';
import {
  assertNextVersionMonotonic,
  createExchangeScopeVersion,
  type CreateExchangeScopeVersionInput,
  type ExchangeScopeVersion,
} from './exchange-scope-version';

export type ExchangeScope = Readonly<{
  exchangeScopeId: string;
  workspaceId: string;
  venueCode: ExchangeScopeVenueCode | string;
  displayName: string;
  version: ExchangeScopeVersion;
  lifecycle: ExchangeScopeLifecycle;
  config: ExchangeScopeConfig;
  metadata: ExchangeScopeMetadata;
  authorityClass: typeof EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS;
  isRuntime: false;
  isStrategyLibrary: false;
  isRiskEngine: false;
  isExecutionEngine: false;
  isKnowledgeLake: false;
  isTradingSession: false;
  approvesRisk: false;
  submitsOrders: false;
  mutable: false;
}>;

export type CreateExchangeScopeInput = Readonly<{
  exchangeScopeId: string;
  workspaceId: string;
  venueCode: string;
  displayName: string;
  version: CreateExchangeScopeVersionInput | ExchangeScopeVersion;
  lifecycle: CreateExchangeScopeLifecycleInput | ExchangeScopeLifecycle;
  config: CreateExchangeScopeConfigInput | ExchangeScopeConfig;
  metadata: CreateExchangeScopeMetadataInput | ExchangeScopeMetadata;
}>;

function resolveVersion(
  value: CreateExchangeScopeVersionInput | ExchangeScopeVersion,
): ExchangeScopeVersion {
  if (
    Object.isFrozen(value) &&
    'mutable' in value &&
    (value as ExchangeScopeVersion).mutable === false
  ) {
    return value as ExchangeScopeVersion;
  }
  return createExchangeScopeVersion(value as CreateExchangeScopeVersionInput);
}

function resolveLifecycle(
  value: CreateExchangeScopeLifecycleInput | ExchangeScopeLifecycle,
): ExchangeScopeLifecycle {
  if (
    Object.isFrozen(value) &&
    'authorizesRuntime' in value &&
    'blocksNewSessionCapacity' in value
  ) {
    return value as ExchangeScopeLifecycle;
  }
  return createExchangeScopeLifecycle(value as CreateExchangeScopeLifecycleInput);
}

function resolveConfig(
  value: CreateExchangeScopeConfigInput | ExchangeScopeConfig,
): ExchangeScopeConfig {
  if (Object.isFrozen(value) && 'forcesTrade' in value && 'maxActiveSessions' in value) {
    return value as ExchangeScopeConfig;
  }
  return createExchangeScopeConfig(value as CreateExchangeScopeConfigInput);
}

function resolveMetadata(
  value: CreateExchangeScopeMetadataInput | ExchangeScopeMetadata,
): ExchangeScopeMetadata {
  if (Object.isFrozen(value) && 'ownsStrategyLibrary' in value) {
    return value as ExchangeScopeMetadata;
  }
  return createExchangeScopeMetadata(value as CreateExchangeScopeMetadataInput);
}

function assertVenueCode(value: string): ExchangeScopeVenueCode | string {
  const trimmed = assertNonEmptyString(value, 'venueCode');
  // Prefer known venue codes; allow future venue strings without failing closed on label alone.
  if (isExchangeScopeVenueCode(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

/**
 * Create an immutable Exchange Scope version aggregate.
 * Does not register Nest ports, persist, or integrate trading path.
 */
export function createExchangeScope(input: CreateExchangeScopeInput): ExchangeScope {
  const exchangeScopeId = assertNonEmptyString(input.exchangeScopeId, 'exchangeScopeId');
  const workspaceId = assertNonEmptyString(input.workspaceId, 'workspaceId');
  const displayName = assertNonEmptyString(input.displayName, 'displayName');
  const venueCode = assertVenueCode(input.venueCode);

  const version = resolveVersion(input.version);
  if (version.exchangeScopeId !== exchangeScopeId) {
    throw new Error('version.exchangeScopeId must match exchangeScopeId');
  }

  const config = resolveConfig(input.config);
  if (config.exchangeScopeId !== exchangeScopeId) {
    throw new Error('config.exchangeScopeId must match exchangeScopeId');
  }

  return deepFreeze({
    exchangeScopeId,
    workspaceId,
    venueCode,
    displayName,
    version,
    lifecycle: resolveLifecycle(input.lifecycle),
    config,
    metadata: resolveMetadata(input.metadata),
    authorityClass: EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
    isRuntime: false as const,
    isStrategyLibrary: false as const,
    isRiskEngine: false as const,
    isExecutionEngine: false as const,
    isKnowledgeLake: false as const,
    isTradingSession: false as const,
    approvesRisk: false as const,
    submitsOrders: false as const,
    mutable: false as const,
  });
}

/**
 * Return a new Exchange Scope with an allowed lifecycle transition applied.
 * Leaves version/config identity unchanged.
 */
export function withExchangeScopeLifecycle(
  current: ExchangeScope,
  to: ExchangeScopeLifecycleStatus,
  updatedAt: string,
  updatedBy: string,
  reason: string,
): ExchangeScope {
  const lifecycle = transitionExchangeScopeLifecycle(
    current.lifecycle,
    to,
    updatedAt,
    updatedBy,
    reason,
  );
  return createExchangeScope({
    exchangeScopeId: current.exchangeScopeId,
    workspaceId: current.workspaceId,
    venueCode: current.venueCode,
    displayName: current.displayName,
    version: current.version,
    lifecycle,
    config: current.config,
    metadata: current.metadata,
  });
}

/**
 * Publish the next configuration version for a scope (append-only).
 * - Previous versions remain queryable in returned history
 * - Duplicate / non-monotonic versions rejected
 * - Does not mutate prior objects in place
 */
export function publishNextExchangeScopeConfig(
  args: Readonly<{
    history: readonly ExchangeScope[];
    next: Omit<CreateExchangeScopeInput, 'version' | 'lifecycle' | 'config'> &
      Readonly<{
        versionNumber: number;
        publishedAt: string;
        publishedBy: string;
        config: CreateExchangeScopeConfigInput | ExchangeScopeConfig;
        activate?: boolean;
        lifecycleReason?: string;
        lifecycleStatus?: ExchangeScopeLifecycleStatus;
      }>;
  }>,
): Readonly<{
  previous: ExchangeScope | null;
  next: ExchangeScope;
  history: readonly ExchangeScope[];
}> {
  const { history, next: nextInput } = args;
  assertNextVersionMonotonic(
    history.map((row) => ({ version: row.version.version })),
    nextInput.versionNumber,
  );

  const targetKey = `${nextInput.workspaceId}|${nextInput.exchangeScopeId}`;
  for (const row of history) {
    const rowKey = `${row.workspaceId}|${row.exchangeScopeId}`;
    if (rowKey !== targetKey) {
      throw new Error('publishNextExchangeScopeConfig history must share workspace + scope');
    }
  }

  const previousActive = [...history].reverse().find((row) => row.lifecycle.status === 'active');

  const created = createExchangeScope({
    exchangeScopeId: nextInput.exchangeScopeId,
    workspaceId: nextInput.workspaceId,
    venueCode: nextInput.venueCode,
    displayName: nextInput.displayName,
    version: {
      exchangeScopeId: nextInput.exchangeScopeId,
      version: nextInput.versionNumber,
      publishedAt: nextInput.publishedAt,
      publishedBy: nextInput.publishedBy,
    },
    lifecycle: {
      status: 'created',
      updatedAt: nextInput.publishedAt,
      updatedBy: nextInput.publishedBy,
      reason: nextInput.lifecycleReason ?? 'exchange scope config version created',
    },
    config: nextInput.config,
    metadata: nextInput.metadata,
  });

  const activate = nextInput.activate !== false;
  const targetStatus = nextInput.lifecycleStatus ?? 'active';
  const next = activate
    ? withExchangeScopeLifecycle(
        created,
        targetStatus,
        nextInput.publishedAt,
        nextInput.publishedBy,
        nextInput.lifecycleReason ?? 'exchange scope config version activated',
      )
    : created;

  return Object.freeze({
    previous: previousActive ?? null,
    next,
    history: Object.freeze([...history, next]),
  });
}
