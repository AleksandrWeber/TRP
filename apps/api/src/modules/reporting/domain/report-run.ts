/**
 * RC-24 Epic 3 — ReportRun (immutable materialization record).
 *
 * Domain Model Contract §6.
 * Structure only — does not generate aggregations or query Lake.
 * Product aliases: Report Snapshot ≡ ReportRun; Report Metadata ⊂ definition/run fields.
 */

import { createHistoricalWindow, type HistoricalWindow } from './historical-window';
import { snapshotReportDefinition, type ReportDefinition } from './report-definition';
import {
  REPORTING_DOMAIN_AUTHORITY_CLASS,
  REPORT_RUN_STATUSES,
  assertIsoTimestamp,
  assertNonEmptyString,
  deepFreeze,
  isReportingFactMode,
  type ReportRunStatus,
  type ReportingFactMode,
} from './reporting-domain-shared';
import { createReportingSourceRef, type ReportingSourceRef } from './reporting-source-ref';

/** Non-authoritative summary of Lake/history inputs cited by a run. */
export type ReportRunSourceSummary = Readonly<{
  factCount: number;
  lakeEventIds: readonly string[];
  sourceRefs: readonly ReportingSourceRef[];
}>;

export type ReportRun = Readonly<{
  reportRunId: string;
  workspaceId: string;
  reportDefinitionId: string;
  definitionSnapshot: ReportDefinition;
  window: HistoricalWindow;
  modes: readonly ReportingFactMode[];
  exchangeScopeId?: string;
  tradingSessionId?: string;
  libraryEntryId?: string;
  status: ReportRunStatus;
  authorityClass: typeof REPORTING_DOMAIN_AUTHORITY_CLASS;
  sourceSummary: ReportRunSourceSummary;
  createdAt: string;
  rejectionReasons?: readonly string[];
}>;

export type CreateReportRunInput = Readonly<{
  reportRunId: string;
  workspaceId: string;
  definition: ReportDefinition;
  window: HistoricalWindow;
  modes: readonly string[];
  exchangeScopeId?: string;
  tradingSessionId?: string;
  libraryEntryId?: string;
  status: string;
  sourceSummary: Readonly<{
    factCount: number;
    lakeEventIds?: readonly string[];
    sourceRefs?: readonly Readonly<{ ownerType: string; id: string }>[];
  }>;
  createdAt: string;
  rejectionReasons?: readonly string[];
}>;

function resolveWindow(window: HistoricalWindow): HistoricalWindow {
  if (Object.isFrozen(window) && typeof window.from === 'string' && typeof window.to === 'string') {
    return window;
  }
  return createHistoricalWindow(window);
}

/**
 * Create an immutable ReportRun.
 * Does not aggregate. Does not call Knowledge Lake. Structure + validation only.
 */
export function createReportRun(input: CreateReportRunInput): ReportRun {
  const reportRunId = assertNonEmptyString(input.reportRunId, 'reportRunId');
  const workspaceId = assertNonEmptyString(input.workspaceId, 'workspaceId');
  if (workspaceId !== input.definition.workspaceId) {
    throw new Error('workspaceId must match definition.workspaceId');
  }
  const createdAt = assertIsoTimestamp(input.createdAt, 'createdAt');

  const statusRaw = assertNonEmptyString(input.status, 'status');
  if (!(REPORT_RUN_STATUSES as readonly string[]).includes(statusRaw)) {
    throw new Error(`status must be one of: ${REPORT_RUN_STATUSES.join(', ')}`);
  }
  const status = statusRaw as ReportRunStatus;

  if (!input.modes || input.modes.length === 0) {
    throw new Error('modes must be non-empty');
  }
  const modes = input.modes.map((mode) => {
    const trimmed = mode.trim();
    if (!isReportingFactMode(trimmed)) {
      throw new Error(`unknown reporting mode: ${mode}`);
    }
    return trimmed;
  });

  const resolvedWindow = resolveWindow(input.window);

  if (input.sourceSummary.factCount < 0) {
    throw new Error('sourceSummary.factCount must be >= 0');
  }

  const lakeEventIds = Object.freeze([...(input.sourceSummary.lakeEventIds ?? [])]);
  const sourceRefs = Object.freeze(
    (input.sourceSummary.sourceRefs ?? []).map((ref) => createReportingSourceRef(ref)),
  );

  if (status === 'rejected') {
    if (!input.rejectionReasons || input.rejectionReasons.length === 0) {
      throw new Error('rejected runs require rejectionReasons');
    }
  }

  const exchangeScopeId =
    input.exchangeScopeId !== undefined && input.exchangeScopeId.trim() !== ''
      ? input.exchangeScopeId.trim()
      : undefined;
  const tradingSessionId =
    input.tradingSessionId !== undefined && input.tradingSessionId.trim() !== ''
      ? input.tradingSessionId.trim()
      : undefined;
  const libraryEntryId =
    input.libraryEntryId !== undefined && input.libraryEntryId.trim() !== ''
      ? input.libraryEntryId.trim()
      : undefined;

  return deepFreeze({
    reportRunId,
    workspaceId,
    reportDefinitionId: input.definition.reportDefinitionId,
    definitionSnapshot: snapshotReportDefinition(input.definition),
    window: resolvedWindow,
    modes: Object.freeze([...modes]),
    ...(exchangeScopeId !== undefined ? { exchangeScopeId } : {}),
    ...(tradingSessionId !== undefined ? { tradingSessionId } : {}),
    ...(libraryEntryId !== undefined ? { libraryEntryId } : {}),
    status,
    authorityClass: REPORTING_DOMAIN_AUTHORITY_CLASS,
    sourceSummary: deepFreeze({
      factCount: input.sourceSummary.factCount,
      lakeEventIds,
      sourceRefs,
    }),
    createdAt,
    ...(status === 'rejected'
      ? { rejectionReasons: Object.freeze([...(input.rejectionReasons ?? [])]) }
      : {}),
  });
}

/** Product / UX alias — Report Snapshot ≡ ReportRun. */
export type ReportSnapshot = ReportRun;
export const createReportSnapshot = createReportRun;
