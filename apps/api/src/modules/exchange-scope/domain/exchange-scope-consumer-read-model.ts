/**
 * RC-27 Epic 5 — Exchange Scope consumer read projections.
 *
 * Immutable façades for Reporting / AI Analytics / Command Center /
 * Knowledge Lake / Notification Delivery / future Multi-Exchange UI.
 * Read-only. Never cash / fills / risk / execution SoT.
 * Consumers must never mutate Exchange Scope.
 */

export const EXCHANGE_SCOPE_CONSUMER_FLAGS = Object.freeze({
  authorityClass: 'exchange_scope_artifact' as const,
  isRiskEngine: false as const,
  isExecutionEngine: false as const,
  isStrategyLibrary: false as const,
  isRuntime: false as const,
  isTradingSession: false as const,
  isLedger: false as const,
  approvesRisk: false as const,
  submitsOrders: false as const,
  forcesTrade: false as const,
  mutable: false as const,
  consumerWritable: false as const,
});

export const EXCHANGE_POLICY_CONSUMER_FLAGS = Object.freeze({
  authorityClass: 'exchange_policy_input' as const,
  isRiskDecision: false as const,
  approvesRisk: false as const,
  isRiskEngine: false as const,
  forcesTrade: false as const,
  mutable: false as const,
  consumerWritable: false as const,
});

/** Scope identity + lifecycle summary projection. */
export type ExchangeScopeProjection = Readonly<{
  exchangeScopeId: string;
  workspaceId: string;
  venueCode: string;
  displayName: string;
  lifecycleStatus: string;
  isActive: boolean;
  version: number;
  maxActiveSessions: number;
  modeContext: string;
  blocksNewSessionCapacity: boolean;
  publishedAt: string;
  publishedBy: string;
  metadataSummary: string;
}> &
  typeof EXCHANGE_SCOPE_CONSUMER_FLAGS;

/** Dedicated lifecycle projection (read only). */
export type ExchangeScopeLifecycleProjection = Readonly<{
  exchangeScopeId: string;
  workspaceId: string;
  status: string;
  isActive: boolean;
  updatedAt: string;
  updatedBy: string;
  reason: string;
  blocksNewSessionCapacity: boolean;
  authorizesRuntime: false;
  executesActions: false;
}> &
  typeof EXCHANGE_SCOPE_CONSUMER_FLAGS;

/** Configuration summary (counts / labels only — not trading decisions). */
export type ExchangeScopeConfigProjection = Readonly<{
  exchangeScopeId: string;
  workspaceId: string;
  version: number;
  maxActiveSessions: number;
  symbolAllowlistCount: number;
  strategyAllowlistCount: number;
  modeContext: string;
  updatedAt: string;
  updatedBy: string;
}> &
  typeof EXCHANGE_SCOPE_CONSUMER_FLAGS;

/** Policy-input summary — never a Risk Decision. */
export type ExchangeRiskPolicyProjection = Readonly<{
  exchangeRiskPolicyId: string;
  exchangeScopeId: string;
  workspaceId: string;
  policyVersion: number;
  maxExposureLabel: string;
  maxOrderNotionalLabel: string;
  publishedAt: string;
  publishedBy: string;
}> &
  typeof EXCHANGE_POLICY_CONSUMER_FLAGS;

/** Account binding projection — binding identity only; never ledger authority. */
export type TradingAccountBindingProjection = Readonly<{
  tradingAccountBindingId: string;
  exchangeScopeId: string;
  workspaceId: string;
  tradingAccountId: string;
  status: string;
  boundAt: string;
  boundBy: string;
  ownsLedger: false;
  movesBalances: false;
}> &
  typeof EXCHANGE_SCOPE_CONSUMER_FLAGS;

/** Metadata projection — opaque refs only. */
export type ExchangeScopeMetadataProjection = Readonly<{
  exchangeScopeId: string;
  workspaceId: string;
  asOf: string;
  inputSummary: string;
  adapterContextRef: string | null;
  policyRef: string | null;
  ownsStrategyLibrary: false;
  ownsRuntimeEnforcement: false;
  ownsTradingSession: false;
  ownsRiskDecisions: false;
  ownsOrders: false;
  ownsExecution: false;
  ownsAccounting: false;
}> &
  typeof EXCHANGE_SCOPE_CONSUMER_FLAGS;

/** Active-status projection for capacity / ops dashboards. */
export type ExchangeScopeActiveStatusProjection = Readonly<{
  exchangeScopeId: string;
  workspaceId: string;
  venueCode: string;
  lifecycleStatus: string;
  isActive: boolean;
  blocksNewSessionCapacity: boolean;
}> &
  typeof EXCHANGE_SCOPE_CONSUMER_FLAGS;

/**
 * Explicit cross-scope workspace aggregate (read only).
 * Never invents balances, fills, or risk approvals.
 */
export type ExchangeScopeWorkspaceAggregateProjection = Readonly<{
  workspaceId: string;
  scopeCount: number;
  activeCount: number;
  suspendedCount: number;
  createdCount: number;
  archivedCount: number;
  scopes: readonly ExchangeScopeProjection[];
  inventsBalances: false;
  inventsFills: false;
  inventsRiskApprovals: false;
  inventsOrders: false;
}> &
  typeof EXCHANGE_SCOPE_CONSUMER_FLAGS;

/** Intended consumer audiences (may depend on this port; never command Scope). */
export const EXCHANGE_SCOPE_CONSUMER_INTENDED = Object.freeze([
  'reporting',
  'ai-analytics',
  'knowledge-lake',
  'command-center',
  'notification-delivery',
  'trading-orchestrator',
  'multi-exchange-ui',
] as const);

export type ExchangeScopeConsumerAudience = (typeof EXCHANGE_SCOPE_CONSUMER_INTENDED)[number];
