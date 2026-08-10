/**
 * RC-26 Epic 5–6 — Trading Orchestrator application ports (activated).
 *
 * Contract: docs/project/rc-26-api-contract.md §§6–9
 *
 * Service / Query + Library / Gate / Market State / Risk-read + consumer-read active.
 * Persistence / REST remain inactive.
 * No execution / Session ownership / Risk approval.
 */

import type {
  OrchestrationSummaryProjection,
  SelectionDecisionProjection,
  SessionHandoffIntentProjection,
} from '../domain/trading-orchestrator-consumer-read-model';

/** Nest injection token for TradingOrchestratorServicePort. */
export const TRADING_ORCHESTRATOR_SERVICE_PORT = Symbol('TRADING_ORCHESTRATOR_SERVICE_PORT');

/** Nest injection token for TradingOrchestratorQueryPort. */
export const TRADING_ORCHESTRATOR_QUERY_PORT = Symbol('TRADING_ORCHESTRATOR_QUERY_PORT');

/** Strategy Library consumer token. */
export const ORCHESTRATOR_STRATEGY_LIBRARY_CONSUMER = Symbol(
  'ORCHESTRATOR_STRATEGY_LIBRARY_CONSUMER',
);

/** Runtime Enforcement Gate consumer token. */
export const ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER = Symbol(
  'ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER',
);

/** Risk policy / constraint read consumer token. */
export const ORCHESTRATOR_RISK_POLICY_READ_CONSUMER = Symbol(
  'ORCHESTRATOR_RISK_POLICY_READ_CONSUMER',
);

/** Market State consumer token. */
export const ORCHESTRATOR_MARKET_STATE_CONSUMER = Symbol('ORCHESTRATOR_MARKET_STATE_CONSUMER');

/** Market Qualification consumer token (deferred — confidence via State later). */
export const ORCHESTRATOR_QUALIFICATION_CONSUMER = Symbol('ORCHESTRATOR_QUALIFICATION_CONSUMER');

/** Market Profile consumer token (deferred). */
export const ORCHESTRATOR_PROFILE_CONSUMER = Symbol('ORCHESTRATOR_PROFILE_CONSUMER');

/** Downstream consumer read token (Epic 6+). */
export const TRADING_ORCHESTRATOR_CONSUMER_READ_PORT = Symbol(
  'TRADING_ORCHESTRATOR_CONSUMER_READ_PORT',
);

export type OrchestrationModeContextLabel = 'lab' | 'paper' | 'live';

export type RequestOrchestrationRun = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: OrchestrationModeContextLabel;
  requestedBy: string;
  tradingOrchestratorId?: string;
  objective?: string;
  marketStateId?: string;
  requiresConfirmation?: boolean;
  asOf?: string;
}>;

export type ConfirmOrchestrationRun = Readonly<{
  workspaceId: string;
  orchestrationRunId: string;
  confirmedBy: string;
  changesActiveSessionMission?: boolean;
  asOf?: string;
}>;

export type CancelOrchestrationRun = Readonly<{
  workspaceId: string;
  orchestrationRunId: string;
  cancelledBy: string;
  reason?: string;
  asOf?: string;
}>;

export type ProposeSelection = Readonly<{
  workspaceId: string;
  orchestrationRunId: string;
  libraryEntryId: string;
  strategyVersionId: string;
  tacticPoint: Readonly<Record<string, unknown>>;
  envelopeVersion: string;
  proposedBy: string;
  asOf?: string;
}>;

export type EmitSessionHandoff = Readonly<{
  workspaceId: string;
  orchestrationRunId: string;
  selectionDecisionId: string;
  tradingSessionId?: string;
  deploymentBindRef: string;
  requestedBy: string;
  asOf?: string;
}>;

export type OrchestrationCommandOutcome =
  'accepted' | 'proposed' | 'handed_off' | 'rejected' | 'cancelled' | 'failed';

export type OrchestrationCommandResult = Readonly<{
  outcome: OrchestrationCommandOutcome;
  orchestrationRunId: string;
  selectionDecisionId?: string;
  sessionHandoffIntentId?: string;
  enforcementDecisionRef?: string;
  rejectionReasons?: readonly string[];
  authorityClass: 'orchestration_artifact';
  forcesTrade: false;
  approvesRisk: false;
  submitsOrders: false;
}>;

export type GetOrchestrationRun = Readonly<{
  workspaceId: string;
  orchestrationRunId: string;
}>;

export type ListOrchestrationRuns = Readonly<{
  workspaceId: string;
  exchangeScopeId?: string;
  marketSymbol?: string;
  limit?: number;
}>;

export type GetSelectionDecision = Readonly<{
  workspaceId: string;
  selectionDecisionId: string;
}>;

export type GetSessionHandoffIntent = Readonly<{
  workspaceId: string;
  sessionHandoffIntentId: string;
}>;

export type OrchestrationRunView = Readonly<{
  orchestrationRunId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: OrchestrationModeContextLabel;
  status: string;
  marketStateId: string;
  selectionDecisionId?: string;
  sessionHandoffIntentId?: string;
  requiresConfirmation: boolean;
  createdAt: string;
  updatedAt: string;
  authorityClass: 'orchestration_artifact';
  forcesTrade: false;
  approvesRisk: false;
  submitsOrders: false;
}>;

export type SelectionDecisionView = Readonly<{
  selectionDecisionId: string;
  orchestrationRunId: string;
  workspaceId: string;
  libraryEntryId: string;
  strategyVersionId: string;
  envelopeVersion: string;
  tacticPoint: Readonly<Record<string, unknown>>;
  selectedAt: string;
  authorityClass: 'orchestration_artifact';
  forcesTrade: false;
  inventsStrategy: false;
}>;

export type SessionHandoffIntentView = Readonly<{
  sessionHandoffIntentId: string;
  orchestrationRunId: string;
  selectionDecisionId: string;
  workspaceId: string;
  deploymentBindRef: string;
  enforcementDecisionRef: string;
  status: string;
  proposedAt: string;
  authorityClass: 'orchestration_artifact';
  isOrder: false;
  isRiskDecision: false;
  createsSession: false;
}>;

export type OrchestratorMarketStateView = Readonly<{
  marketStateId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  lifecycleStatus: string;
  authorityClass: 'market_state_artifact';
  forcesTrade: false;
  isQualification: false;
  isProfile: false;
}>;

export type GetCurrentMarketStateQuery = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  marketStateId?: string;
}>;

export type LookupCertifiedQuery = Readonly<{
  libraryEntryId: string;
  workspaceId: string;
}>;

export type OrchestratorLibraryRecord = Readonly<{
  libraryEntryId: string;
  strategyVersionId: string;
  strategyFamilyId: string;
  workspaceId: string;
  membershipStatus: string;
  envelopeVersion: string | null;
  exchangeScopeIds: readonly string[];
}>;

export type OrchestratorEligibilityQuery = Readonly<{
  libraryEntryId: string;
  workspaceId: string;
  exchangeScopeId?: string;
  tacticPoint?: Readonly<{
    symbol?: string;
    timeframe?: string;
    exchangeScopeId?: string;
    riskPerTrade?: number;
  }>;
}>;

export type OrchestratorEligibilityDecision = Readonly<{
  outcome: 'eligible' | 'ineligible';
  reasons: readonly string[];
  libraryEntryId: string | null;
  checkedAt: string;
}>;

export type OrchestratorValidateDeployment = Readonly<{
  workspaceId: string;
  libraryEntryId: string;
  exchangeScopeId?: string;
  tacticPoint?: Readonly<Record<string, unknown>>;
  tradingSessionId?: string;
  purpose: 'deployment_bind' | 'session_start';
  requestedAt?: string;
}>;

export type OrchestratorEnforcementDecision = Readonly<{
  outcome: 'pass' | 'fail';
  validation: 'VALID' | 'INVALID';
  reasons: readonly string[];
  checkedAt: string;
  decisionRef: string;
}>;

export type ExchangeRiskPolicyView = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  policyLabel: string;
}>;

export type SelectionConstraintView = Readonly<{
  workspaceId: string;
  maxRiskPerTrade?: number;
  allowedSymbols?: readonly string[];
  notes?: string;
}>;

/**
 * Trading Orchestrator service port — coordination commands only.
 */
export interface TradingOrchestratorServicePort {
  requestOrchestrationRun(cmd: RequestOrchestrationRun): OrchestrationCommandResult;
  confirmOrchestrationRun(cmd: ConfirmOrchestrationRun): OrchestrationCommandResult;
  cancelOrchestrationRun(cmd: CancelOrchestrationRun): OrchestrationCommandResult;
  proposeSelection(cmd: ProposeSelection): OrchestrationCommandResult;
  emitSessionHandoff(cmd: EmitSessionHandoff): OrchestrationCommandResult;
}

/**
 * Trading Orchestrator query port — read coordination artifacts only.
 */
export interface TradingOrchestratorQueryPort {
  getOrchestrationRun(query: GetOrchestrationRun): OrchestrationRunView | null;
  listOrchestrationRuns(query: ListOrchestrationRuns): readonly OrchestrationRunView[];
  getSelectionDecision(query: GetSelectionDecision): SelectionDecisionView | null;
  getSessionHandoffIntent(query: GetSessionHandoffIntent): SessionHandoffIntentView | null;
}

/**
 * Strategy Library Lookup / Eligibility — consume only. Never certify.
 */
export interface OrchestratorStrategyLibraryConsumerPort {
  lookupCertified(query: LookupCertifiedQuery): OrchestratorLibraryRecord | null;
  checkEligibility(query: OrchestratorEligibilityQuery): OrchestratorEligibilityDecision;
}

/**
 * Runtime Enforcement Gate — consume only. Never soft-pass.
 */
export interface OrchestratorRuntimeEnforcementConsumerPort {
  validateDeployment(cmd: OrchestratorValidateDeployment): OrchestratorEnforcementDecision;
}

/**
 * Risk policy / constraint reads only. Never approveRisk.
 */
export interface OrchestratorRiskPolicyReadPort {
  getExchangeRiskPolicy(query: {
    workspaceId: string;
    exchangeScopeId: string;
  }): ExchangeRiskPolicyView | null;
  getSelectionConstraints(query: {
    workspaceId: string;
    exchangeScopeId?: string;
  }): SelectionConstraintView | null;
}

/**
 * Market State reads — consume only. Never classify / own State.
 */
export interface OrchestratorMarketStateConsumerPort {
  getCurrentMarketState(query: GetCurrentMarketStateQuery): OrchestratorMarketStateView | null;
}

/**
 * Epic 6 — Read-only façade for Reporting / AI / Command Center.
 */
export interface TradingOrchestratorConsumerReadPort {
  getOrchestrationSummary(query: {
    workspaceId: string;
    orchestrationRunId: string;
  }): OrchestrationSummaryProjection | null;
  getLatestSelectionProjection(query: {
    workspaceId: string;
    selectionDecisionId: string;
  }): SelectionDecisionProjection | null;
  getHandoffIntentProjection(query: {
    workspaceId: string;
    sessionHandoffIntentId: string;
  }): SessionHandoffIntentProjection | null;
}

/** Epic 6 posture — service/query + coordination + consumer-read active. */
export const TRADING_ORCHESTRATOR_PORTS_ACTIVE = Object.freeze({
  tradingOrchestratorService: true,
  tradingOrchestratorQuery: true,
  strategyLibraryConsumer: true,
  runtimeEnforcementConsumer: true,
  riskPolicyConsumer: true,
  marketStateConsumer: true,
  qualificationConsumer: false,
  profileConsumer: false,
  sessionHandoff: true,
  consumerRead: true,
  persistence: false,
  rest: false,
} as const);
