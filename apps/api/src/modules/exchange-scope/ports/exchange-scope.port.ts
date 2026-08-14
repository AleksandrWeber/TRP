/**
 * RC-27 Epic 3 — Exchange Scope application ports (activated).
 *
 * Contract: docs/project/rc-27-api-contract.md §§4–5, §8
 *
 * Service / Query / Consumer-read Nest ports active.
 * Persistence / REST / transport remain inactive.
 * No trading-path / Runtime / Session / Orders / Execution / Risk.
 */

import type { AdapterBindingContext } from '../domain/adapter-binding-context';
import type { ExchangeScope } from '../domain/exchange-scope';
import type { ExchangeScopeConfig } from '../domain/exchange-scope-config';
import type { ExchangeRiskPolicy } from '../domain/exchange-risk-policy';
import type { TradingAccountBinding } from '../domain/trading-account-binding';
import type {
  ExchangeScopeActiveStatusProjection,
  ExchangeScopeConfigProjection,
  ExchangeScopeLifecycleProjection,
  ExchangeScopeMetadataProjection,
  ExchangeScopeProjection,
  ExchangeScopeWorkspaceAggregateProjection,
  ExchangeRiskPolicyProjection,
  TradingAccountBindingProjection,
} from '../domain/exchange-scope-consumer-read-model';

/** Nest injection token for ExchangeScopeServicePort. */
export const EXCHANGE_SCOPE_SERVICE_PORT = Symbol('EXCHANGE_SCOPE_SERVICE_PORT');

/** Nest injection token for ExchangeScopeQueryPort. */
export const EXCHANGE_SCOPE_QUERY_PORT = Symbol('EXCHANGE_SCOPE_QUERY_PORT');

/** Downstream consumer read token. */
export const EXCHANGE_SCOPE_CONSUMER_READ_PORT = Symbol('EXCHANGE_SCOPE_CONSUMER_READ_PORT');

export type ExchangeScopeModeContextLabel = 'lab' | 'paper' | 'live';

export type ExchangeScopeOutcome =
  'accepted' | 'unchanged' | 'rejected' | 'suspended' | 'archived' | 'failed';

export type RegisterExchangeScope = Readonly<{
  workspaceId: string;
  venueCode: string;
  displayName: string;
  requestedBy: string;
  notes?: string;
  requestedAt?: string;
  exchangeScopeId?: string;
  maxActiveSessions?: number;
  modeContext?: ExchangeScopeModeContextLabel;
}>;

export type ActivateExchangeScope = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  requestedBy: string;
  reason?: string;
  asOf?: string;
}>;

export type SuspendExchangeScope = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  requestedBy: string;
  reason?: string;
  asOf?: string;
}>;

export type ArchiveExchangeScope = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  requestedBy: string;
  reason?: string;
  asOf?: string;
}>;

export type UpdateExchangeScopeConfig = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  updatedBy: string;
  maxActiveSessions?: number;
  symbolAllowlist?: readonly string[];
  strategyAllowlist?: readonly string[];
  modeContext?: ExchangeScopeModeContextLabel;
  asOf?: string;
}>;

export type PublishExchangeRiskPolicy = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  publishedBy: string;
  limits: Readonly<{
    maxExposureLabel: string;
    maxOrderNotionalLabel: string;
    notes?: string;
  }>;
  policyVersion?: number;
  exchangeRiskPolicyId?: string;
  asOf?: string;
}>;

export type BindTradingAccount = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  tradingAccountId: string;
  requestedBy: string;
  tradingAccountBindingId?: string;
  asOf?: string;
}>;

export type UnbindTradingAccount = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  tradingAccountBindingId: string;
  requestedBy: string;
  asOf?: string;
}>;

export type SetAdapterBindingContext = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  adapterIdentity: string;
  requestedBy: string;
  modeContext?: ExchangeScopeModeContextLabel;
  adapterBindingContextId?: string;
  asOf?: string;
}>;

export type ExchangeScopeResult = Readonly<{
  outcome: ExchangeScopeOutcome;
  exchangeScopeId: string;
  exchangeScope: ExchangeScope | null;
  exchangeRiskPolicyId?: string;
  tradingAccountBindingId?: string;
  adapterBindingContextId?: string;
  rejectionReasons?: readonly string[];
}>;

export type ExchangeRiskPolicyResult = Readonly<{
  outcome: ExchangeScopeOutcome;
  exchangeScopeId: string;
  exchangeRiskPolicyId: string;
  policy: ExchangeRiskPolicy | null;
  rejectionReasons?: readonly string[];
}>;

export type TradingAccountBindingResult = Readonly<{
  outcome: ExchangeScopeOutcome;
  exchangeScopeId: string;
  tradingAccountBindingId: string;
  binding: TradingAccountBinding | null;
  rejectionReasons?: readonly string[];
}>;

export type AdapterBindingContextResult = Readonly<{
  outcome: ExchangeScopeOutcome;
  exchangeScopeId: string;
  adapterBindingContextId: string;
  context: AdapterBindingContext | null;
  rejectionReasons?: readonly string[];
}>;

export interface ExchangeScopeServicePort {
  registerExchangeScope(cmd: RegisterExchangeScope): ExchangeScopeResult;
  activateExchangeScope(cmd: ActivateExchangeScope): ExchangeScopeResult;
  suspendExchangeScope(cmd: SuspendExchangeScope): ExchangeScopeResult;
  archiveExchangeScope(cmd: ArchiveExchangeScope): ExchangeScopeResult;
  updateExchangeScopeConfig(cmd: UpdateExchangeScopeConfig): ExchangeScopeResult;
  publishExchangeRiskPolicy(cmd: PublishExchangeRiskPolicy): ExchangeRiskPolicyResult;
  bindTradingAccount(cmd: BindTradingAccount): TradingAccountBindingResult;
  unbindTradingAccount(cmd: UnbindTradingAccount): TradingAccountBindingResult;
  setAdapterBindingContext(cmd: SetAdapterBindingContext): AdapterBindingContextResult;
}

export type GetExchangeScope = Readonly<{
  workspaceId: string;
  exchangeScopeId?: string;
  venueCode?: string;
}>;

export type ListExchangeScopes = Readonly<{
  workspaceId: string;
  lifecycleStatus?: string;
}>;

export type GetExchangeScopeConfig = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
}>;

export type GetExchangeRiskPolicy = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  policyVersion?: number;
}>;

export type ListTradingAccountBindings = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  status?: 'bound' | 'unbound';
}>;

export type GetAdapterBindingContext = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
}>;

export type ExchangeScopeAuthorityFlags = Readonly<{
  authorityClass: 'exchange_scope_artifact';
  isRiskEngine: false;
  isExecutionEngine: false;
  isStrategyLibrary: false;
  isRuntime: false;
  approvesRisk: false;
  submitsOrders: false;
  mutable: false;
}>;

export type ExchangeScopeView = ExchangeScope & ExchangeScopeAuthorityFlags;

export type ExchangeScopeSummary = Readonly<{
  exchangeScopeId: string;
  workspaceId: string;
  venueCode: string;
  displayName: string;
  lifecycleStatus: string;
  version: number;
  maxActiveSessions: number;
  modeContext: string;
  blocksNewSessionCapacity: boolean;
}> &
  ExchangeScopeAuthorityFlags;

export type ExchangeScopeConfigView = ExchangeScopeConfig & ExchangeScopeAuthorityFlags;

export type ExchangeRiskPolicyView = ExchangeRiskPolicy &
  Readonly<{
    isRuntime: false;
    isExecutionEngine: false;
    isStrategyLibrary: false;
    submitsOrders: false;
  }>;

export type TradingAccountBindingView = TradingAccountBinding & ExchangeScopeAuthorityFlags;

export type AdapterBindingContextView = AdapterBindingContext &
  Readonly<{
    isRiskEngine: false;
    isStrategyLibrary: false;
    isRuntime: false;
    approvesRisk: false;
  }>;

export interface ExchangeScopeQueryPort {
  getExchangeScope(query: GetExchangeScope): ExchangeScopeView | null;
  listExchangeScopes(query: ListExchangeScopes): readonly ExchangeScopeSummary[];
  getExchangeScopeConfig(query: GetExchangeScopeConfig): ExchangeScopeConfigView | null;
  getExchangeRiskPolicy(query: GetExchangeRiskPolicy): ExchangeRiskPolicyView | null;
  listTradingAccountBindings(
    query: ListTradingAccountBindings,
  ): readonly TradingAccountBindingView[];
  getAdapterBindingContext(query: GetAdapterBindingContext): AdapterBindingContextView | null;
}

export type ExchangeScopeConsumerReadQuery = Readonly<{
  workspaceId: string;
  exchangeScopeId?: string;
  venueCode?: string;
}>;

/**
 * Downstream consumer read port (RC-27 Epic 5).
 * Immutable projections only. No commands. No callbacks.
 */
export interface ExchangeScopeConsumerReadPort {
  listScopeProjections(query: ExchangeScopeConsumerReadQuery): readonly ExchangeScopeProjection[];
  getScopeProjection(query: ExchangeScopeConsumerReadQuery): ExchangeScopeProjection | null;
  getLifecycleProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeLifecycleProjection | null;
  getConfigSummaryProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeConfigProjection | null;
  getPolicyInputProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeRiskPolicyProjection | null;
  listAccountBindingProjections(
    query: ExchangeScopeConsumerReadQuery,
  ): readonly TradingAccountBindingProjection[];
  getMetadataProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeMetadataProjection | null;
  getActiveStatusProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeActiveStatusProjection | null;
  /**
   * Explicit cross-scope workspace aggregate (read only).
   * Never invents balances / fills / risk approvals.
   */
  getWorkspaceAggregateProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeWorkspaceAggregateProjection | null;
}

/** Epic 3–5 posture — service / query / consumer-read active. */
export const EXCHANGE_SCOPE_PORTS_ACTIVE = Object.freeze({
  exchangeScopeService: true,
  exchangeScopeQuery: true,
  consumerRead: true,
  persistence: false,
  rest: false,
  transport: false,
} as const);
