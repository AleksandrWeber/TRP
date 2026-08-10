/**
 * RC-24 Epic 2 — Immutable Reporting analytical read models.
 *
 * Projection-only views of Knowledge Lake facts as consumed by Reporting.
 * Never Source of Truth. Never mutated after construction.
 *
 * These are NOT report-generation artifacts (ReportRun / AggregationSlice) —
 * those arrive in later Epics. This epic only exposes Lake facts to Reporting.
 */

import type {
  AnalyticalFact,
  AnalyticalFactSourceRef,
  KnowledgeLakeFactMode,
} from '../../knowledge-lake/domain/analytical-fact-admission';
import type {
  AnalyticalFactPage,
  AnalyticalFactQuery,
} from '../../knowledge-lake/domain/analytical-fact-query';
import type { KnowledgeLakeEventCategory } from '../../knowledge-lake/domain/knowledge-lake-boundary';

/** Authority class stamped on every Reporting Lake read model. */
export const REPORTING_READ_AUTHORITY_CLASS = 'projection' as const;

/**
 * Immutable Reporting view of one Knowledge Lake analytical fact.
 * Allowed fields mirror RC-24 Epic 2 read scope (API Contract consumer rules).
 */
export type ReportingAnalyticalFact = Readonly<{
  authorityClass: typeof REPORTING_READ_AUTHORITY_CLASS;
  eventId: string;
  occurredAt: string;
  admittedAt: string;
  producer: string;
  category: KnowledgeLakeEventCategory;
  mode: KnowledgeLakeFactMode;
  workspaceId: string;
  exchangeScopeId?: string;
  tradingSessionId?: string;
  correlationId?: string;
  sourceRef?: AnalyticalFactSourceRef;
  payload: unknown;
  schemaVersion: string;
}>;

/** Paginated Reporting Lake read result. */
export type ReportingAnalyticalFactPage = Readonly<{
  authorityClass: typeof REPORTING_READ_AUTHORITY_CLASS;
  items: readonly ReportingAnalyticalFact[];
  nextCursor: string | null;
}>;

/**
 * Reporting query filters for Lake reads (allowed Epic 2 fields only).
 * Delegates to KnowledgeLakeQueryPort semantics.
 */
export type ReportingAnalyticalFactQuery = Readonly<{
  workspaceId: string;
  categories?: readonly (KnowledgeLakeEventCategory | string)[];
  producers?: readonly string[];
  mode?: KnowledgeLakeFactMode | string;
  tradingSessionId?: string;
  exchangeScopeId?: string;
  occurredFrom?: string;
  occurredTo?: string;
  correlationId?: string;
  limit?: number;
  cursor?: string;
}>;

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Object.isFrozen(value)) {
    return value;
  }
  for (const key of Object.keys(value as object)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

/** Map a Lake AnalyticalFact into an immutable Reporting read model. */
export function toReportingAnalyticalFact(fact: AnalyticalFact): ReportingAnalyticalFact {
  return deepFreeze({
    authorityClass: REPORTING_READ_AUTHORITY_CLASS,
    eventId: fact.eventId,
    occurredAt: fact.occurredAt,
    admittedAt: fact.admittedAt,
    producer: fact.producer,
    category: fact.category,
    mode: fact.mode,
    workspaceId: fact.workspaceId,
    exchangeScopeId: fact.exchangeScopeId,
    tradingSessionId: fact.tradingSessionId,
    correlationId: fact.correlationId,
    sourceRef: fact.sourceRef,
    payload: fact.payload,
    schemaVersion: fact.schemaVersion,
  });
}

/** Map a Lake page into an immutable Reporting page (empty-safe). */
export function toReportingAnalyticalFactPage(
  page: AnalyticalFactPage,
): ReportingAnalyticalFactPage {
  return deepFreeze({
    authorityClass: REPORTING_READ_AUTHORITY_CLASS,
    items: page.items.map(toReportingAnalyticalFact),
    nextCursor: page.nextCursor,
  });
}

/** Convert Reporting query filters to Lake query (read-only passthrough). */
export function toAnalyticalFactQuery(query: ReportingAnalyticalFactQuery): AnalyticalFactQuery {
  return {
    workspaceId: query.workspaceId,
    categories: query.categories,
    producers: query.producers,
    mode: query.mode,
    tradingSessionId: query.tradingSessionId,
    exchangeScopeId: query.exchangeScopeId,
    occurredFrom: query.occurredFrom,
    occurredTo: query.occurredTo,
    correlationId: query.correlationId,
    limit: query.limit,
    cursor: query.cursor,
  };
}
