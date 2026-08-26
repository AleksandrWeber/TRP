/**
 * RC-24 Epic 4 — Reporting application ports (active service + query).
 *
 * Contract: docs/project/rc-24-api-contract.md §§4–5
 */

import type { AggregationSlice } from '../domain/aggregation-slice';
import type { HistoricalWindow } from '../domain/historical-window';
import type { ReportDefinition } from '../domain/report-definition';
import type { ReportRun } from '../domain/report-run';
import type { ReportingFactMode } from '../domain/reporting-domain-shared';

/** Nest injection token for ReportingServicePort (Epic 4+). */
export const REPORTING_SERVICE_PORT = Symbol('REPORTING_SERVICE_PORT');

/** Nest injection token for ReportingQueryPort (Epic 4+). */
export const REPORTING_QUERY_PORT = Symbol('REPORTING_QUERY_PORT');

/**
 * Knowledge Lake Query Port consumer token (Epic 2+).
 * Wired to KNOWLEDGE_LAKE_QUERY_PORT — read only.
 */
export const KNOWLEDGE_LAKE_QUERY_CONSUMER = Symbol('KNOWLEDGE_LAKE_QUERY_CONSUMER');

export type ReportRunOutcome = 'completed' | 'empty' | 'rejected';

export type RequestReportRun = Readonly<{
  workspaceId: string;
  reportDefinitionId?: string;
  definition?: ReportDefinition;
  window: HistoricalWindow;
  modes: readonly ReportingFactMode[];
  exchangeScopeId?: string;
  tradingSessionId?: string;
  /** Metadata / Lake payload filter only — never queries Strategy Library. */
  libraryEntryId?: string;
  requestedBy?: string;
  requestedAt?: string;
  /** Optional stable id for deterministic replay; otherwise derived from inputs. */
  reportRunId?: string;
}>;

export type ReportRunResult = Readonly<{
  outcome: ReportRunOutcome;
  reportRun?: ReportRun;
  aggregations: readonly AggregationSlice[];
  rejectionReasons?: readonly string[];
  authorityClass: 'projection';
}>;

export type CompareReportRuns = Readonly<{
  workspaceId: string;
  leftReportRunId: string;
  rightReportRunId: string;
}>;

export type ComparisonSlice = Readonly<{
  authorityClass: 'projection';
  leftReportRunId: string;
  rightReportRunId: string;
  metricKey: string;
  leftValue: unknown;
  rightValue: unknown;
  delta: unknown;
}>;

export type ReportDefinitionQuery = Readonly<{
  workspaceId: string;
  kind?: string;
  limit?: number;
}>;

export type ReportDefinitionPage = Readonly<{
  authorityClass: 'projection';
  items: readonly ReportDefinition[];
}>;

export type ReportRunQuery = Readonly<{
  workspaceId: string;
  reportDefinitionId?: string;
  limit?: number;
}>;

export type ReportRunPage = Readonly<{
  authorityClass: 'projection';
  items: readonly ReportRun[];
}>;

/**
 * Reporting service port (API Contract §4).
 * Generates deterministic projection reports from Lake reads + domain models.
 */
export interface ReportingServicePort {
  requestReportRun(cmd: RequestReportRun): ReportRunResult;
  compareRuns(cmd: CompareReportRuns): readonly ComparisonSlice[];
  /** Register a definition for later requestReportRun by id (process-local). */
  registerDefinition(definition: ReportDefinition): ReportDefinition;
}

/**
 * Reporting query port (API Contract §5).
 * Read-only access to generated report artifacts.
 */
export interface ReportingQueryPort {
  getDefinition(reportDefinitionId: string): ReportDefinition | null;
  listDefinitions(query: ReportDefinitionQuery): ReportDefinitionPage;
  getRun(reportRunId: string): ReportRun | null;
  listRuns(query: ReportRunQuery): ReportRunPage;
  listAggregations(reportRunId: string): readonly AggregationSlice[];
}

/** Epic 4 posture: service + query + Lake consumer active. */
export const REPORTING_PORTS_ACTIVE = Object.freeze({
  reportingService: true,
  reportingQuery: true,
  knowledgeLakeConsumer: true,
  historyReads: false,
  persistence: true,
  rest: false,
} as const);
