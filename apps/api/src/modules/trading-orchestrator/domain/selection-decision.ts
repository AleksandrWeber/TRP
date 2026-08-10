/**
 * RC-26 Epic 5 — SelectionDecision (immutable coordination record).
 *
 * Records certified Library identity after delegated lookup/eligibility.
 * Does not invent strategies, expand envelopes, or rank via confidence.
 */

import {
  TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  deepFreeze,
} from './orchestration-workflow-shared';

export type SelectionDecision = Readonly<{
  selectionDecisionId: string;
  orchestrationRunId: string;
  workspaceId: string;
  libraryEntryId: string;
  strategyVersionId: string;
  eligibilityRef: string;
  marketStateId?: string;
  envelopeVersion: string;
  tacticPoint: Readonly<Record<string, unknown>>;
  rankRationale: string;
  selectedAt: string;
  selectedBy: string;
  authorityClass: typeof TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS;
  forcesTrade: false;
  inventsStrategy: false;
  inventsEnvelopePoint: false;
  mutable: false;
}>;

export type CreateSelectionDecisionInput = Readonly<{
  selectionDecisionId: string;
  orchestrationRunId: string;
  workspaceId: string;
  libraryEntryId: string;
  strategyVersionId: string;
  eligibilityRef: string;
  marketStateId?: string;
  envelopeVersion: string;
  tacticPoint: Readonly<Record<string, unknown>>;
  rankRationale: string;
  selectedAt: string;
  selectedBy: string;
}>;

export function createSelectionDecision(input: CreateSelectionDecisionInput): SelectionDecision {
  return deepFreeze({
    selectionDecisionId: assertNonEmptyString(input.selectionDecisionId, 'selectionDecisionId'),
    orchestrationRunId: assertNonEmptyString(input.orchestrationRunId, 'orchestrationRunId'),
    workspaceId: assertNonEmptyString(input.workspaceId, 'workspaceId'),
    libraryEntryId: assertNonEmptyString(input.libraryEntryId, 'libraryEntryId'),
    strategyVersionId: assertNonEmptyString(input.strategyVersionId, 'strategyVersionId'),
    eligibilityRef: assertNonEmptyString(input.eligibilityRef, 'eligibilityRef'),
    ...(input.marketStateId !== undefined && input.marketStateId.trim() !== ''
      ? { marketStateId: input.marketStateId.trim() }
      : {}),
    envelopeVersion: assertNonEmptyString(input.envelopeVersion, 'envelopeVersion'),
    tacticPoint: deepFreeze({ ...input.tacticPoint }),
    rankRationale: assertNonEmptyString(input.rankRationale, 'rankRationale'),
    selectedAt: assertIsoTimestamp(input.selectedAt, 'selectedAt'),
    selectedBy: assertNonEmptyString(input.selectedBy, 'selectedBy'),
    authorityClass: TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
    forcesTrade: false as const,
    inventsStrategy: false as const,
    inventsEnvelopePoint: false as const,
    mutable: false as const,
  });
}
