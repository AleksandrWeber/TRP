/**
 * RC-26 Epic 5 — SessionHandoffIntent (immutable coordination intent).
 *
 * Asks Trading Session to bind a mission. Session remains lifecycle SoT.
 * Never an Order, Risk Decision, or Fill. Never creates a Session.
 */

import {
  TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  deepFreeze,
  isSessionHandoffIntentStatus,
  type SessionHandoffIntentStatus,
} from './orchestration-workflow-shared';

export type SessionHandoffIntent = Readonly<{
  sessionHandoffIntentId: string;
  orchestrationRunId: string;
  selectionDecisionId: string;
  workspaceId: string;
  tradingSessionId?: string;
  deploymentBindRef: string;
  enforcementDecisionRef: string;
  status: SessionHandoffIntentStatus;
  proposedAt: string;
  proposedBy: string;
  authorityClass: typeof TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS;
  isOrder: false;
  isRiskDecision: false;
  isFill: false;
  createsSession: false;
  submitsOrders: false;
  mutable: false;
}>;

export type CreateSessionHandoffIntentInput = Readonly<{
  sessionHandoffIntentId: string;
  orchestrationRunId: string;
  selectionDecisionId: string;
  workspaceId: string;
  tradingSessionId?: string;
  deploymentBindRef: string;
  enforcementDecisionRef: string;
  proposedAt: string;
  proposedBy: string;
}>;

export function createSessionHandoffIntent(
  input: CreateSessionHandoffIntentInput,
): SessionHandoffIntent {
  return deepFreeze({
    sessionHandoffIntentId: assertNonEmptyString(
      input.sessionHandoffIntentId,
      'sessionHandoffIntentId',
    ),
    orchestrationRunId: assertNonEmptyString(input.orchestrationRunId, 'orchestrationRunId'),
    selectionDecisionId: assertNonEmptyString(input.selectionDecisionId, 'selectionDecisionId'),
    workspaceId: assertNonEmptyString(input.workspaceId, 'workspaceId'),
    ...(input.tradingSessionId !== undefined && input.tradingSessionId.trim() !== ''
      ? { tradingSessionId: input.tradingSessionId.trim() }
      : {}),
    deploymentBindRef: assertNonEmptyString(input.deploymentBindRef, 'deploymentBindRef'),
    enforcementDecisionRef: assertNonEmptyString(
      input.enforcementDecisionRef,
      'enforcementDecisionRef',
    ),
    status: 'proposed' as const,
    proposedAt: assertIsoTimestamp(input.proposedAt, 'proposedAt'),
    proposedBy: assertNonEmptyString(input.proposedBy, 'proposedBy'),
    authorityClass: TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
    isOrder: false as const,
    isRiskDecision: false as const,
    isFill: false as const,
    createsSession: false as const,
    submitsOrders: false as const,
    mutable: false as const,
  });
}

export function assertSessionHandoffStatus(value: string): SessionHandoffIntentStatus {
  if (!isSessionHandoffIntentStatus(value)) {
    throw new Error(`unknown SessionHandoffIntentStatus: ${value}`);
  }
  return value;
}
