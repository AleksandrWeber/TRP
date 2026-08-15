/**
 * PC-12 — HTTP product views of existing Exchange Scope artifacts.
 *
 * Exchange Scope remains owner. Runtime / Session / Deployment unchanged.
 * Not a venue adapter. Not live capital. Not a new SoT.
 */

import {
  canTransitionExchangeScopeLifecycle,
  EXCHANGE_SCOPE_VENUE_CODES,
  isExchangeScopeLifecycleStatus,
  type ExchangeScopeLifecycleStatus,
  type ExchangeScopeModeContext,
} from '../exchange-scope/domain/exchange-scope-domain-shared';
import type {
  AdapterBindingContextView,
  ExchangeRiskPolicyView,
  ExchangeScopeConfigView,
  ExchangeScopeSummary,
  ExchangeScopeView,
  TradingAccountBindingView,
} from '../exchange-scope/ports/exchange-scope.port';
import type {
  ExchangeScopeActiveStatusProjection,
  ExchangeScopeLifecycleProjection,
  ExchangeScopeMetadataProjection,
  ExchangeScopeWorkspaceAggregateProjection,
} from '../exchange-scope/domain/exchange-scope-consumer-read-model';

export const EXCHANGE_SCOPE_PRODUCT_FLAGS = Object.freeze({
  authorityClass: 'exchange_scope_artifact' as const,
  isRuntime: false as const,
  isTradingSession: false as const,
  isRiskEngine: false as const,
  isExecutionEngine: false as const,
  isStrategyLibrary: false as const,
  approvesRisk: false as const,
  submitsOrders: false as const,
  liveVenueAdapter: false as const,
  venueApiUsed: false as const,
  liveCapital: false as const,
  mutable: false as const,
});

export const EXCHANGE_POLICY_PRODUCT_FLAGS = Object.freeze({
  authorityClass: 'exchange_policy_input' as const,
  isRiskDecision: false as const,
  approvesRisk: false as const,
  isRiskEngine: false as const,
  liveVenueAdapter: false as const,
  venueApiUsed: false as const,
  mutable: false as const,
});

const VENUE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  binance: 'Binance',
  bybit: 'Bybit',
  kraken: 'Kraken',
  okx: 'OKX',
});

export type ExchangeScopeLifecycleActionView = Readonly<{
  canActivate: boolean;
  canSuspend: boolean;
  canArchive: boolean;
  canRename: boolean;
  canUpdateConfig: boolean;
  canPublishPolicy: boolean;
  canBind: boolean;
}>;

export type ExchangeVenueCatalogItemView = Readonly<{
  venueCode: string;
  label: string;
  offered: true;
  liveAdapter: false;
  venueApiUsed: false;
}>;

export type ExchangeScopeListItemView = Readonly<{
  exchangeScopeId: string;
  workspaceId: string;
  venueCode: string;
  displayName: string;
  lifecycleStatus: string;
  isActive: boolean;
  version: number;
  maxActiveSessions: number;
  modeContext: string;
  modeContextIsLabelOnly: boolean;
  blocksNewSessionCapacity: boolean;
}> &
  typeof EXCHANGE_SCOPE_PRODUCT_FLAGS;

export type ExchangeScopeWorkspaceView = Readonly<{
  workspaceId: string;
  scopeCount: number;
  activeCount: number;
  suspendedCount: number;
  createdCount: number;
  archivedCount: number;
  currentActive: readonly ExchangeScopeListItemView[];
  scopes: readonly ExchangeScopeListItemView[];
  venues: readonly ExchangeVenueCatalogItemView[];
  inventsBalances: false;
  inventsFills: false;
  inventsRiskApprovals: false;
}> &
  typeof EXCHANGE_SCOPE_PRODUCT_FLAGS;

export type ExchangeScopeConfigProductView = Readonly<{
  exchangeScopeId: string;
  version: number;
  maxActiveSessions: number;
  symbolAllowlist: readonly string[];
  strategyAllowlist: readonly string[];
  modeContext: string;
  modeContextIsLabelOnly: boolean;
  updatedAt: string;
  updatedBy: string;
}> &
  typeof EXCHANGE_SCOPE_PRODUCT_FLAGS;

export type ExchangeScopeVersionView = Readonly<{
  exchangeScopeId: string;
  version: number;
  displayName: string;
  lifecycleStatus: string;
  publishedAt: string;
  publishedBy: string;
  maxActiveSessions: number;
  modeContext: string;
  inputSummary: string;
}> &
  typeof EXCHANGE_SCOPE_PRODUCT_FLAGS;

export type ExchangeRiskPolicyProductView = Readonly<{
  exchangeRiskPolicyId: string;
  exchangeScopeId: string;
  workspaceId: string;
  policyVersion: number;
  maxExposureLabel: string;
  maxOrderNotionalLabel: string;
  notes: string;
  publishedAt: string;
  publishedBy: string;
}> &
  typeof EXCHANGE_POLICY_PRODUCT_FLAGS;

export type TradingAccountBindingProductView = Readonly<{
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
  typeof EXCHANGE_SCOPE_PRODUCT_FLAGS;

export type AdapterBindingContextProductView = Readonly<{
  adapterBindingContextId: string;
  exchangeScopeId: string;
  workspaceId: string;
  adapterIdentity: string;
  modeContext: string;
  status: string;
  updatedAt: string;
  updatedBy: string;
  isExecutionEngine: false;
  definesWireProtocol: false;
}> &
  typeof EXCHANGE_SCOPE_PRODUCT_FLAGS;

export type ExchangeScopeLifecycleProductView = Readonly<{
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
  actions: ExchangeScopeLifecycleActionView;
}> &
  typeof EXCHANGE_SCOPE_PRODUCT_FLAGS;

export type ExchangeScopeMetadataProductView = Readonly<{
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
  typeof EXCHANGE_SCOPE_PRODUCT_FLAGS;

export type ExchangeScopeHistoryItemView = Readonly<{
  kind: 'version' | 'lifecycle' | 'policy' | 'binding';
  at: string;
  by: string;
  summary: string;
  version?: number;
  lifecycleStatus?: string;
  policyVersion?: number;
  bindingStatus?: string;
}> &
  typeof EXCHANGE_SCOPE_PRODUCT_FLAGS;

export type ExchangeScopeDetailView = Readonly<{
  exchangeScopeId: string;
  workspaceId: string;
  venueCode: string;
  displayName: string;
  lifecycle: ExchangeScopeLifecycleProductView;
  current: ExchangeScopeListItemView;
  config: ExchangeScopeConfigProductView | null;
  versions: readonly ExchangeScopeVersionView[];
  policies: readonly ExchangeRiskPolicyProductView[];
  currentPolicy: ExchangeRiskPolicyProductView | null;
  bindings: readonly TradingAccountBindingProductView[];
  adapterContext: AdapterBindingContextProductView | null;
  metadata: ExchangeScopeMetadataProductView | null;
  history: readonly ExchangeScopeHistoryItemView[];
  activeStatus: Readonly<{
    isActive: boolean;
    lifecycleStatus: string;
    blocksNewSessionCapacity: boolean;
  }>;
}> &
  typeof EXCHANGE_SCOPE_PRODUCT_FLAGS;

export type ExchangeScopeCommandView = Readonly<{
  outcome: string;
  exchangeScopeId: string;
  exchangeRiskPolicyId?: string;
  tradingAccountBindingId?: string;
  adapterBindingContextId?: string;
  rejectionReasons: readonly string[];
  scope: ExchangeScopeDetailView | null;
}> &
  typeof EXCHANGE_SCOPE_PRODUCT_FLAGS;

export type ExchangeScopePageView = Readonly<{
  items: readonly ExchangeScopeListItemView[];
}> &
  typeof EXCHANGE_SCOPE_PRODUCT_FLAGS;

export type ExchangeVenueCatalogView = Readonly<{
  items: readonly ExchangeVenueCatalogItemView[];
}> &
  typeof EXCHANGE_SCOPE_PRODUCT_FLAGS;

export function toVenueCatalog(): ExchangeVenueCatalogView {
  return Object.freeze({
    items: Object.freeze(EXCHANGE_SCOPE_VENUE_CODES.map(toVenueCatalogItem)),
    ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
  });
}

export function toVenueCatalogItem(venueCode: string): ExchangeVenueCatalogItemView {
  return Object.freeze({
    venueCode,
    label: VENUE_LABELS[venueCode] ?? venueCode,
    offered: true as const,
    liveAdapter: false as const,
    venueApiUsed: false as const,
  });
}

export function toLifecycleActions(status: string): ExchangeScopeLifecycleActionView {
  const known = isExchangeScopeLifecycleStatus(status);
  const archived = status === 'archived';
  return Object.freeze({
    canActivate:
      known &&
      canTransitionExchangeScopeLifecycle(status as ExchangeScopeLifecycleStatus, 'active'),
    canSuspend:
      known &&
      canTransitionExchangeScopeLifecycle(status as ExchangeScopeLifecycleStatus, 'suspended'),
    canArchive:
      known &&
      canTransitionExchangeScopeLifecycle(status as ExchangeScopeLifecycleStatus, 'archived'),
    canRename: !archived,
    canUpdateConfig: !archived,
    canPublishPolicy: !archived,
    canBind: !archived,
  });
}

export function toListItemView(summary: ExchangeScopeSummary): ExchangeScopeListItemView {
  return Object.freeze({
    exchangeScopeId: summary.exchangeScopeId,
    workspaceId: summary.workspaceId,
    venueCode: summary.venueCode,
    displayName: summary.displayName,
    lifecycleStatus: summary.lifecycleStatus,
    isActive: summary.lifecycleStatus === 'active',
    version: summary.version,
    maxActiveSessions: summary.maxActiveSessions,
    modeContext: summary.modeContext,
    modeContextIsLabelOnly: summary.modeContext === 'live',
    blocksNewSessionCapacity: summary.blocksNewSessionCapacity,
    ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
  });
}

export function toPageView(items: readonly ExchangeScopeSummary[]): ExchangeScopePageView {
  return Object.freeze({
    items: Object.freeze(items.map(toListItemView)),
    ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
  });
}

export function toWorkspaceView(
  aggregate: ExchangeScopeWorkspaceAggregateProjection,
  summaries: readonly ExchangeScopeSummary[],
): ExchangeScopeWorkspaceView {
  const items = summaries.map(toListItemView);
  return Object.freeze({
    workspaceId: aggregate.workspaceId,
    scopeCount: aggregate.scopeCount,
    activeCount: aggregate.activeCount,
    suspendedCount: aggregate.suspendedCount,
    createdCount: aggregate.createdCount,
    archivedCount: aggregate.archivedCount,
    currentActive: Object.freeze(items.filter((item) => item.isActive)),
    scopes: Object.freeze(items),
    venues: Object.freeze(EXCHANGE_SCOPE_VENUE_CODES.map(toVenueCatalogItem)),
    inventsBalances: false as const,
    inventsFills: false as const,
    inventsRiskApprovals: false as const,
    ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
  });
}

export function toConfigView(
  config: ExchangeScopeConfigView,
  version: number,
): ExchangeScopeConfigProductView {
  return Object.freeze({
    exchangeScopeId: config.exchangeScopeId,
    version,
    maxActiveSessions: config.maxActiveSessions,
    symbolAllowlist: config.symbolAllowlist,
    strategyAllowlist: config.strategyAllowlist,
    modeContext: config.modeContext,
    modeContextIsLabelOnly: config.modeContext === 'live',
    updatedAt: config.updatedAt,
    updatedBy: config.updatedBy,
    ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
  });
}

export function toVersionView(scope: ExchangeScopeView): ExchangeScopeVersionView {
  return Object.freeze({
    exchangeScopeId: scope.exchangeScopeId,
    version: scope.version.version,
    displayName: scope.displayName,
    lifecycleStatus: scope.lifecycle.status,
    publishedAt: scope.version.publishedAt,
    publishedBy: scope.version.publishedBy,
    maxActiveSessions: scope.config.maxActiveSessions,
    modeContext: scope.config.modeContext,
    inputSummary: scope.metadata.inputSummary,
    ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
  });
}

export function toPolicyView(policy: ExchangeRiskPolicyView): ExchangeRiskPolicyProductView {
  return Object.freeze({
    exchangeRiskPolicyId: policy.exchangeRiskPolicyId,
    exchangeScopeId: policy.exchangeScopeId,
    workspaceId: policy.workspaceId,
    policyVersion: policy.policyVersion,
    maxExposureLabel: policy.limits.maxExposureLabel,
    maxOrderNotionalLabel: policy.limits.maxOrderNotionalLabel,
    notes: policy.limits.notes,
    publishedAt: policy.publishedAt,
    publishedBy: policy.publishedBy,
    ...EXCHANGE_POLICY_PRODUCT_FLAGS,
  });
}

export function toBindingView(
  binding: TradingAccountBindingView,
): TradingAccountBindingProductView {
  return Object.freeze({
    tradingAccountBindingId: binding.tradingAccountBindingId,
    exchangeScopeId: binding.exchangeScopeId,
    workspaceId: binding.workspaceId,
    tradingAccountId: binding.tradingAccountId,
    status: binding.status,
    boundAt: binding.boundAt,
    boundBy: binding.boundBy,
    ownsLedger: false as const,
    movesBalances: false as const,
    ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
  });
}

export function toAdapterContextView(
  context: AdapterBindingContextView,
): AdapterBindingContextProductView {
  return Object.freeze({
    adapterBindingContextId: context.adapterBindingContextId,
    exchangeScopeId: context.exchangeScopeId,
    workspaceId: context.workspaceId,
    adapterIdentity: context.adapterIdentity,
    modeContext: context.modeContext,
    status: context.status,
    updatedAt: context.updatedAt,
    updatedBy: context.updatedBy,
    isExecutionEngine: false as const,
    definesWireProtocol: false as const,
    ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
  });
}

export function toLifecycleView(
  projection: ExchangeScopeLifecycleProjection,
): ExchangeScopeLifecycleProductView {
  return Object.freeze({
    exchangeScopeId: projection.exchangeScopeId,
    workspaceId: projection.workspaceId,
    status: projection.status,
    isActive: projection.isActive,
    updatedAt: projection.updatedAt,
    updatedBy: projection.updatedBy,
    reason: projection.reason,
    blocksNewSessionCapacity: projection.blocksNewSessionCapacity,
    authorizesRuntime: false as const,
    executesActions: false as const,
    actions: toLifecycleActions(projection.status),
    ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
  });
}

export function toMetadataView(
  projection: ExchangeScopeMetadataProjection,
): ExchangeScopeMetadataProductView {
  return Object.freeze({
    exchangeScopeId: projection.exchangeScopeId,
    workspaceId: projection.workspaceId,
    asOf: projection.asOf,
    inputSummary: projection.inputSummary,
    adapterContextRef: projection.adapterContextRef,
    policyRef: projection.policyRef,
    ownsStrategyLibrary: false as const,
    ownsRuntimeEnforcement: false as const,
    ownsTradingSession: false as const,
    ownsRiskDecisions: false as const,
    ownsOrders: false as const,
    ownsExecution: false as const,
    ownsAccounting: false as const,
    ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
  });
}

export function toHistoryView(
  args: Readonly<{
    versions: readonly ExchangeScopeView[];
    policies: readonly ExchangeRiskPolicyView[];
    bindings: readonly TradingAccountBindingView[];
  }>,
): readonly ExchangeScopeHistoryItemView[] {
  const items: ExchangeScopeHistoryItemView[] = [];

  for (const version of args.versions) {
    items.push(
      Object.freeze({
        kind: 'version' as const,
        at: version.version.publishedAt,
        by: version.version.publishedBy,
        summary: `Configuration version ${version.version.version} (${version.displayName})`,
        version: version.version.version,
        lifecycleStatus: version.lifecycle.status,
        ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
      }),
    );
    items.push(
      Object.freeze({
        kind: 'lifecycle' as const,
        at: version.lifecycle.updatedAt,
        by: version.lifecycle.updatedBy,
        summary: version.lifecycle.reason,
        version: version.version.version,
        lifecycleStatus: version.lifecycle.status,
        ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
      }),
    );
  }

  for (const policy of args.policies) {
    items.push(
      Object.freeze({
        kind: 'policy' as const,
        at: policy.publishedAt,
        by: policy.publishedBy,
        summary: `Policy input v${policy.policyVersion}`,
        policyVersion: policy.policyVersion,
        ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
      }),
    );
  }

  for (const binding of args.bindings) {
    items.push(
      Object.freeze({
        kind: 'binding' as const,
        at: binding.boundAt,
        by: binding.boundBy,
        summary: `Account ${binding.tradingAccountId} ${binding.status}`,
        bindingStatus: binding.status,
        ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
      }),
    );
  }

  return Object.freeze(
    items.sort(
      (left, right) => right.at.localeCompare(left.at) || left.kind.localeCompare(right.kind),
    ),
  );
}

export function toDetailView(
  args: Readonly<{
    scope: ExchangeScopeView;
    summary: ExchangeScopeSummary;
    config: ExchangeScopeConfigView | null;
    versions: readonly ExchangeScopeView[];
    policies: readonly ExchangeRiskPolicyView[];
    bindings: readonly TradingAccountBindingView[];
    adapterContext: AdapterBindingContextView | null;
    lifecycle: ExchangeScopeLifecycleProjection | null;
    metadata: ExchangeScopeMetadataProjection | null;
    activeStatus: ExchangeScopeActiveStatusProjection | null;
  }>,
): ExchangeScopeDetailView {
  const currentPolicy = args.policies.at(-1) ?? null;
  return Object.freeze({
    exchangeScopeId: args.scope.exchangeScopeId,
    workspaceId: args.scope.workspaceId,
    venueCode: String(args.scope.venueCode),
    displayName: args.scope.displayName,
    lifecycle: args.lifecycle
      ? toLifecycleView(args.lifecycle)
      : toLifecycleView({
          exchangeScopeId: args.scope.exchangeScopeId,
          workspaceId: args.scope.workspaceId,
          status: args.scope.lifecycle.status,
          isActive: args.scope.lifecycle.status === 'active',
          updatedAt: args.scope.lifecycle.updatedAt,
          updatedBy: args.scope.lifecycle.updatedBy,
          reason: args.scope.lifecycle.reason,
          blocksNewSessionCapacity: args.scope.lifecycle.blocksNewSessionCapacity,
          authorizesRuntime: false,
          executesActions: false,
          authorityClass: 'exchange_scope_artifact',
          isRiskEngine: false,
          isExecutionEngine: false,
          isStrategyLibrary: false,
          isRuntime: false,
          isTradingSession: false,
          isLedger: false,
          approvesRisk: false,
          submitsOrders: false,
          forcesTrade: false,
          mutable: false,
          consumerWritable: false,
        }),
    current: toListItemView(args.summary),
    config: args.config ? toConfigView(args.config, args.scope.version.version) : null,
    versions: Object.freeze(args.versions.map(toVersionView)),
    policies: Object.freeze(args.policies.map(toPolicyView)),
    currentPolicy: currentPolicy ? toPolicyView(currentPolicy) : null,
    bindings: Object.freeze(args.bindings.map(toBindingView)),
    adapterContext: args.adapterContext ? toAdapterContextView(args.adapterContext) : null,
    metadata: args.metadata ? toMetadataView(args.metadata) : null,
    history: toHistoryView({
      versions: args.versions,
      policies: args.policies,
      bindings: args.bindings,
    }),
    activeStatus: Object.freeze({
      isActive: args.activeStatus?.isActive ?? args.scope.lifecycle.status === 'active',
      lifecycleStatus: args.activeStatus?.lifecycleStatus ?? args.scope.lifecycle.status,
      blocksNewSessionCapacity:
        args.activeStatus?.blocksNewSessionCapacity ??
        args.scope.lifecycle.blocksNewSessionCapacity,
    }),
    ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
  });
}

export type ModeContextLabel = ExchangeScopeModeContext;
