/**
 * RC-25 Epic 3 — QualificationRun (user-triggered evaluation attempt record).
 *
 * Domain Model Contract §5.
 * Structure only — does not run algorithms or score confidence.
 */

import {
  MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  deepFreeze,
  isQualificationModeContext,
  isQualificationRunStatus,
  isQualificationRunTerminalStatus,
  type QualificationModeContext,
  type QualificationRunStatus,
} from './market-qualification-domain-shared';

/** Non-authoritative refs to Live Market Data / Research inputs. */
export type QualificationRunInputSummary = Readonly<{
  observationCount: number;
  researchRefCount: number;
  liveMarketDataRefs: readonly string[];
  researchOutputRefs: readonly string[];
}>;

export type QualificationRun = Readonly<{
  qualificationRunId: string;
  workspaceId: string;
  targetId: string;
  modeContext: QualificationModeContext;
  status: QualificationRunStatus;
  requestedBy: string;
  confirmedBy?: string;
  inputSummary: QualificationRunInputSummary;
  rejectionReasons?: readonly string[];
  completedAt?: string;
  createdAt: string;
  authorityClass: typeof MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS;
}>;

export type CreateQualificationRunInput = Readonly<{
  qualificationRunId: string;
  workspaceId: string;
  targetId: string;
  modeContext: string;
  status: string;
  requestedBy: string;
  confirmedBy?: string;
  inputSummary: Readonly<{
    observationCount: number;
    researchRefCount: number;
    liveMarketDataRefs?: readonly string[];
    researchOutputRefs?: readonly string[];
  }>;
  rejectionReasons?: readonly string[];
  completedAt?: string;
  createdAt: string;
}>;

/**
 * Create an immutable QualificationRun.
 * Does not evaluate markets. Does not auto-spend heavy jobs.
 */
export function createQualificationRun(input: CreateQualificationRunInput): QualificationRun {
  const qualificationRunId = assertNonEmptyString(input.qualificationRunId, 'qualificationRunId');
  const workspaceId = assertNonEmptyString(input.workspaceId, 'workspaceId');
  const targetId = assertNonEmptyString(input.targetId, 'targetId');
  const requestedBy = assertNonEmptyString(input.requestedBy, 'requestedBy');
  const createdAt = assertIsoTimestamp(input.createdAt, 'createdAt');

  const modeRaw = assertNonEmptyString(input.modeContext, 'modeContext');
  if (!isQualificationModeContext(modeRaw)) {
    throw new Error(`modeContext must be one of: lab | paper | live`);
  }

  const statusRaw = assertNonEmptyString(input.status, 'status');
  if (!isQualificationRunStatus(statusRaw)) {
    throw new Error(`status must be a known QualificationRunStatus`);
  }

  if (statusRaw === 'running' && !input.confirmedBy?.trim()) {
    throw new Error('running status requires confirmedBy (heavy-work confirm rule)');
  }

  if (
    (statusRaw === 'rejected' || statusRaw === 'failed') &&
    (!input.rejectionReasons || input.rejectionReasons.length === 0)
  ) {
    throw new Error(`${statusRaw} runs require rejectionReasons`);
  }

  if (input.inputSummary.observationCount < 0 || input.inputSummary.researchRefCount < 0) {
    throw new Error('inputSummary counts must be >= 0');
  }

  const completedAt =
    input.completedAt !== undefined
      ? assertIsoTimestamp(input.completedAt, 'completedAt')
      : undefined;

  if (isQualificationRunTerminalStatus(statusRaw) && !completedAt) {
    throw new Error(`terminal status ${statusRaw} requires completedAt`);
  }

  const confirmedBy =
    input.confirmedBy !== undefined && input.confirmedBy.trim() !== ''
      ? input.confirmedBy.trim()
      : undefined;

  return deepFreeze({
    qualificationRunId,
    workspaceId,
    targetId,
    modeContext: modeRaw,
    status: statusRaw,
    requestedBy,
    ...(confirmedBy !== undefined ? { confirmedBy } : {}),
    inputSummary: Object.freeze({
      observationCount: input.inputSummary.observationCount,
      researchRefCount: input.inputSummary.researchRefCount,
      liveMarketDataRefs: Object.freeze([...(input.inputSummary.liveMarketDataRefs ?? [])]),
      researchOutputRefs: Object.freeze([...(input.inputSummary.researchOutputRefs ?? [])]),
    }),
    ...(input.rejectionReasons !== undefined
      ? { rejectionReasons: Object.freeze([...input.rejectionReasons]) }
      : {}),
    ...(completedAt !== undefined ? { completedAt } : {}),
    createdAt,
    authorityClass: MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS,
  });
}
