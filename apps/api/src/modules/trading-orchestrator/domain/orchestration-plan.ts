/**
 * RC-26 Epic 4 — OrchestrationPlan (immutable versioned coordination plan).
 *
 * Describes orchestration intent only. Does not execute workflows,
 * select strategies, call Runtime, or create Sessions.
 */

import {
  createOrchestrationIntent,
  type CreateOrchestrationIntentInput,
  type OrchestrationIntent,
} from './orchestration-intent';
import {
  createOrchestrationLifecycle,
  transitionOrchestrationLifecycle,
  type CreateOrchestrationLifecycleInput,
  type OrchestrationLifecycle,
} from './orchestration-lifecycle';
import {
  createOrchestrationMetadata,
  type CreateOrchestrationMetadataInput,
  type OrchestrationMetadata,
} from './orchestration-metadata';
import {
  assertNextPlanVersionMonotonic,
  createOrchestrationPlanVersion,
  type CreateOrchestrationPlanVersionInput,
  type OrchestrationPlanVersion,
} from './orchestration-plan-version';
import {
  TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
  assertNonEmptyString,
  deepFreeze,
  isOrchestrationModeContext,
  type OrchestrationLifecycleStatus,
  type OrchestrationModeContext,
} from './trading-orchestrator-domain-shared';

export type OrchestrationPlan = Readonly<{
  orchestrationPlanId: string;
  tradingOrchestratorId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: OrchestrationModeContext;
  version: OrchestrationPlanVersion;
  lifecycle: OrchestrationLifecycle;
  intent: OrchestrationIntent;
  metadata: OrchestrationMetadata;
  authorityClass: typeof TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS;
  forcesTrade: false;
  executesActions: false;
  selectsStrategy: false;
  createsSession: false;
  submitsOrders: false;
  approvesRisk: false;
  isWorkflow: false;
  mutable: false;
}>;

export type CreateOrchestrationPlanInput = Readonly<{
  orchestrationPlanId: string;
  tradingOrchestratorId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: string;
  version: CreateOrchestrationPlanVersionInput | OrchestrationPlanVersion;
  lifecycle: CreateOrchestrationLifecycleInput | OrchestrationLifecycle;
  intent: CreateOrchestrationIntentInput | OrchestrationIntent;
  metadata: CreateOrchestrationMetadataInput | OrchestrationMetadata;
}>;

function resolveVersion(
  value: CreateOrchestrationPlanVersionInput | OrchestrationPlanVersion,
): OrchestrationPlanVersion {
  if (
    Object.isFrozen(value) &&
    'mutable' in value &&
    (value as OrchestrationPlanVersion).mutable === false
  ) {
    return value as OrchestrationPlanVersion;
  }
  return createOrchestrationPlanVersion(value as CreateOrchestrationPlanVersionInput);
}

function resolveLifecycle(
  value: CreateOrchestrationLifecycleInput | OrchestrationLifecycle,
): OrchestrationLifecycle {
  if (Object.isFrozen(value) && 'authorizesRuntime' in value) {
    return value as OrchestrationLifecycle;
  }
  return createOrchestrationLifecycle(value as CreateOrchestrationLifecycleInput);
}

function resolveIntent(
  value: CreateOrchestrationIntentInput | OrchestrationIntent,
): OrchestrationIntent {
  if (Object.isFrozen(value) && 'executesActions' in value && 'isWorkflow' in value) {
    return value as OrchestrationIntent;
  }
  return createOrchestrationIntent(value as CreateOrchestrationIntentInput);
}

function resolveMetadata(
  value: CreateOrchestrationMetadataInput | OrchestrationMetadata,
): OrchestrationMetadata {
  if (Object.isFrozen(value) && 'ownsLibrary' in value && 'inputSummary' in value) {
    return value as OrchestrationMetadata;
  }
  return createOrchestrationMetadata(value as CreateOrchestrationMetadataInput);
}

/**
 * Create an immutable OrchestrationPlan version.
 * Does not run workflows. Does not mutate after return.
 */
export function createOrchestrationPlan(input: CreateOrchestrationPlanInput): OrchestrationPlan {
  const orchestrationPlanId = assertNonEmptyString(
    input.orchestrationPlanId,
    'orchestrationPlanId',
  );
  const tradingOrchestratorId = assertNonEmptyString(
    input.tradingOrchestratorId,
    'tradingOrchestratorId',
  );
  const workspaceId = assertNonEmptyString(input.workspaceId, 'workspaceId');
  const exchangeScopeId = assertNonEmptyString(input.exchangeScopeId, 'exchangeScopeId');
  const marketSymbol = assertNonEmptyString(input.marketSymbol, 'marketSymbol');
  const modeRaw = assertNonEmptyString(input.modeContext, 'modeContext');
  if (!isOrchestrationModeContext(modeRaw)) {
    throw new Error(`modeContext must be a known OrchestrationModeContext`);
  }

  const version = resolveVersion(input.version);
  if (version.orchestrationPlanId !== orchestrationPlanId) {
    throw new Error('version.orchestrationPlanId must match orchestrationPlanId');
  }

  return deepFreeze({
    orchestrationPlanId,
    tradingOrchestratorId,
    workspaceId,
    exchangeScopeId,
    marketSymbol,
    modeContext: modeRaw,
    version,
    lifecycle: resolveLifecycle(input.lifecycle),
    intent: resolveIntent(input.intent),
    metadata: resolveMetadata(input.metadata),
    authorityClass: TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
    forcesTrade: false as const,
    executesActions: false as const,
    selectsStrategy: false as const,
    createsSession: false as const,
    submitsOrders: false as const,
    approvesRisk: false as const,
    isWorkflow: false as const,
    mutable: false as const,
  });
}

/**
 * Return a new plan with an allowed lifecycle transition applied.
 */
export function withOrchestrationPlanLifecycle(
  current: OrchestrationPlan,
  to: OrchestrationLifecycleStatus,
  updatedAt: string,
  updatedBy: string,
  reason: string,
): OrchestrationPlan {
  const lifecycle = transitionOrchestrationLifecycle(
    current.lifecycle,
    to,
    updatedAt,
    updatedBy,
    reason,
  );
  return createOrchestrationPlan({
    orchestrationPlanId: current.orchestrationPlanId,
    tradingOrchestratorId: current.tradingOrchestratorId,
    workspaceId: current.workspaceId,
    exchangeScopeId: current.exchangeScopeId,
    marketSymbol: current.marketSymbol,
    modeContext: current.modeContext,
    version: current.version,
    lifecycle,
    intent: current.intent,
    metadata: current.metadata,
  });
}

/**
 * Publish the next OrchestrationPlan version for an orchestrator + target.
 * - Prior ready/planned/created non-terminal plan may be archived when superseded by a new ready plan
 *   (Epic 4: archive prior `ready` plan only — descriptive supersede without workflow).
 * - History overwrite is rejected.
 *
 * No strategy selection / Session / Runtime behaviour.
 */
export function publishNextOrchestrationPlan(
  args: Readonly<{
    history: readonly OrchestrationPlan[];
    next: Omit<CreateOrchestrationPlanInput, 'version' | 'lifecycle'> &
      Readonly<{
        orchestrationPlanId: string;
        versionNumber: number;
        publishedAt: string;
        publishedBy: string;
        planToReady?: boolean;
        lifecycleReason?: string;
      }>;
  }>,
): Readonly<{
  previous: OrchestrationPlan | null;
  next: OrchestrationPlan;
  history: readonly OrchestrationPlan[];
}> {
  const { history, next: nextInput } = args;
  assertNextPlanVersionMonotonic(
    history.map((row) => ({ version: row.version.version })),
    nextInput.versionNumber,
  );

  const targetKey = `${nextInput.tradingOrchestratorId}|${nextInput.workspaceId}|${nextInput.exchangeScopeId}|${nextInput.marketSymbol}`;
  for (const row of history) {
    const rowKey = `${row.tradingOrchestratorId}|${row.workspaceId}|${row.exchangeScopeId}|${row.marketSymbol}`;
    if (rowKey !== targetKey) {
      throw new Error('publishNextOrchestrationPlan history must share the same target key');
    }
  }

  const priorReady = [...history].reverse().find((row) => row.lifecycle.status === 'ready');
  const previous =
    priorReady !== undefined
      ? withOrchestrationPlanLifecycle(
          priorReady,
          'archived',
          nextInput.publishedAt,
          nextInput.publishedBy,
          'archived after newer orchestration plan version',
        )
      : null;

  const created = createOrchestrationPlan({
    orchestrationPlanId: nextInput.orchestrationPlanId,
    tradingOrchestratorId: nextInput.tradingOrchestratorId,
    workspaceId: nextInput.workspaceId,
    exchangeScopeId: nextInput.exchangeScopeId,
    marketSymbol: nextInput.marketSymbol,
    modeContext: nextInput.modeContext,
    version: {
      orchestrationPlanId: nextInput.orchestrationPlanId,
      version: nextInput.versionNumber,
      publishedAt: nextInput.publishedAt,
      publishedBy: nextInput.publishedBy,
    },
    lifecycle: {
      status: 'created',
      updatedAt: nextInput.publishedAt,
      updatedBy: nextInput.publishedBy,
      reason: nextInput.lifecycleReason ?? 'orchestration plan version created',
    },
    intent: nextInput.intent,
    metadata: nextInput.metadata,
  });

  const planToReady = nextInput.planToReady !== false;
  let next = created;
  if (planToReady) {
    next = withOrchestrationPlanLifecycle(
      next,
      'planned',
      nextInput.publishedAt,
      nextInput.publishedBy,
      nextInput.lifecycleReason ?? 'orchestration plan planned',
    );
    next = withOrchestrationPlanLifecycle(
      next,
      'ready',
      nextInput.publishedAt,
      nextInput.publishedBy,
      nextInput.lifecycleReason ?? 'orchestration plan ready',
    );
  }

  const rebuiltHistory = history.map((row) =>
    previous &&
    row.orchestrationPlanId === previous.orchestrationPlanId &&
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
