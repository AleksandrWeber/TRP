/**
 * RC-26 Epic 6 — Trading Orchestrator consumer read models.
 *
 * Immutable projections for Reporting / AI Analytics / Command Center.
 * Coordination artifacts only — never execution / risk / Session SoT.
 */

export const TRADING_ORCHESTRATOR_CONSUMER_INTENDED = Object.freeze([
  'reporting',
  'ai-analytics',
  'command-center',
  'multi-exchange',
  'monitoring',
] as const);

export type TradingOrchestratorConsumerAudience =
  (typeof TRADING_ORCHESTRATOR_CONSUMER_INTENDED)[number];

export const TRADING_ORCHESTRATOR_CONSUMER_FLAGS = Object.freeze({
  authorityClass: 'orchestration_artifact' as const,
  forcesTrade: false as const,
  approvesRisk: false as const,
  submitsOrders: false as const,
  ownsSessionLifecycle: false as const,
  isExecutionEngine: false as const,
  mutable: false as const,
  consumerWritable: false as const,
});

export type OrchestrationSummaryProjection = Readonly<{
  orchestrationRunId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: string;
  status: string;
  marketStateId: string;
  intentObjective?: string;
  requiresConfirmation: boolean;
  selectionDecisionId?: string;
  sessionHandoffIntentId?: string;
  handoffStatus?: string;
  createdAt: string;
  updatedAt: string;
  authorityClass: 'orchestration_artifact';
  forcesTrade: false;
  approvesRisk: false;
  submitsOrders: false;
  ownsSessionLifecycle: false;
  isExecutionEngine: false;
  mutable: false;
  consumerWritable: false;
}>;

export type SelectionDecisionProjection = Readonly<{
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
  mutable: false;
  consumerWritable: false;
}>;

export type SessionHandoffIntentProjection = Readonly<{
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
  mutable: false;
  consumerWritable: false;
}>;
