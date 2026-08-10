/**
 * RC-26 Epic 5 — OrchestrationRun (immutable coordination attempt).
 *
 * Workflow coordination state only. Does not execute, create Sessions,
 * approve risk, or certify strategies.
 */

import {
  ORCHESTRATION_MODE_CONTEXTS,
  type OrchestrationModeContext,
  isOrchestrationModeContext,
} from './trading-orchestrator-domain-shared';
import {
  TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  assertOrchestrationRunTransition,
  deepFreeze,
  isOrchestrationRunStatus,
  type OrchestrationRunStatus,
} from './orchestration-workflow-shared';

export type OrchestrationRun = Readonly<{
  orchestrationRunId: string;
  tradingOrchestratorId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: OrchestrationModeContext;
  status: OrchestrationRunStatus;
  marketStateId: string;
  requestedBy: string;
  confirmedBy?: string;
  objective?: string;
  rejectionReasons?: readonly string[];
  selectionDecisionId?: string;
  sessionHandoffIntentId?: string;
  requiresConfirmation: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  authorityClass: typeof TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS;
  forcesTrade: false;
  approvesRisk: false;
  submitsOrders: false;
  ownsSessionLifecycle: false;
  isWorkflowCoordinator: true;
  mutable: false;
}>;

export type CreateOrchestrationRunInput = Readonly<{
  orchestrationRunId: string;
  tradingOrchestratorId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: string;
  marketStateId: string;
  requestedBy: string;
  objective?: string;
  requiresConfirmation?: boolean;
  createdAt: string;
}>;

export function createOrchestrationRun(input: CreateOrchestrationRunInput): OrchestrationRun {
  const modeRaw = assertNonEmptyString(input.modeContext, 'modeContext');
  if (!isOrchestrationModeContext(modeRaw)) {
    throw new Error(`modeContext must be one of: ${ORCHESTRATION_MODE_CONTEXTS.join(', ')}`);
  }

  return deepFreeze({
    orchestrationRunId: assertNonEmptyString(input.orchestrationRunId, 'orchestrationRunId'),
    tradingOrchestratorId: assertNonEmptyString(
      input.tradingOrchestratorId,
      'tradingOrchestratorId',
    ),
    workspaceId: assertNonEmptyString(input.workspaceId, 'workspaceId'),
    exchangeScopeId: assertNonEmptyString(input.exchangeScopeId, 'exchangeScopeId'),
    marketSymbol: assertNonEmptyString(input.marketSymbol, 'marketSymbol'),
    modeContext: modeRaw,
    status: 'requested' as const,
    marketStateId: assertNonEmptyString(input.marketStateId, 'marketStateId'),
    requestedBy: assertNonEmptyString(input.requestedBy, 'requestedBy'),
    ...(input.objective !== undefined && input.objective.trim() !== ''
      ? { objective: input.objective.trim() }
      : {}),
    requiresConfirmation: input.requiresConfirmation === true,
    createdAt: assertIsoTimestamp(input.createdAt, 'createdAt'),
    updatedAt: assertIsoTimestamp(input.createdAt, 'createdAt'),
    authorityClass: TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
    forcesTrade: false as const,
    approvesRisk: false as const,
    submitsOrders: false as const,
    ownsSessionLifecycle: false as const,
    isWorkflowCoordinator: true as const,
    mutable: false as const,
  });
}

export function withOrchestrationRunStatus(
  current: OrchestrationRun,
  to: OrchestrationRunStatus,
  updatedAt: string,
  extras?: Readonly<{
    confirmedBy?: string;
    rejectionReasons?: readonly string[];
    selectionDecisionId?: string;
    sessionHandoffIntentId?: string;
  }>,
): OrchestrationRun {
  assertOrchestrationRunTransition(current.status, to);
  const terminal =
    to === 'failed' || to === 'cancelled' || to === 'rejected' || to === 'handed_off';
  return deepFreeze({
    ...current,
    status: to,
    updatedAt: assertIsoTimestamp(updatedAt, 'updatedAt'),
    ...(extras?.confirmedBy !== undefined
      ? { confirmedBy: assertNonEmptyString(extras.confirmedBy, 'confirmedBy') }
      : {}),
    ...(extras?.rejectionReasons !== undefined
      ? { rejectionReasons: Object.freeze([...extras.rejectionReasons]) }
      : {}),
    ...(extras?.selectionDecisionId !== undefined
      ? {
          selectionDecisionId: assertNonEmptyString(
            extras.selectionDecisionId,
            'selectionDecisionId',
          ),
        }
      : {}),
    ...(extras?.sessionHandoffIntentId !== undefined
      ? {
          sessionHandoffIntentId: assertNonEmptyString(
            extras.sessionHandoffIntentId,
            'sessionHandoffIntentId',
          ),
        }
      : {}),
    ...(terminal ? { completedAt: assertIsoTimestamp(updatedAt, 'updatedAt') } : {}),
  });
}

export function assertIsOrchestrationRunStatus(value: string): OrchestrationRunStatus {
  if (!isOrchestrationRunStatus(value)) {
    throw new Error(`unknown OrchestrationRunStatus: ${value}`);
  }
  return value;
}
