/**
 * RC-21 Epic 5 — Analytical fact query contract (read side).
 *
 * Mirrors docs/project/rc-21-api-contract.md §5.
 * Every result is an analytical projection — never Ledger / Orders / Session SoT.
 */

import type { AnalyticalFact, KnowledgeLakeFactMode } from './analytical-fact-admission';
import type { KnowledgeLakeEventCategory } from './knowledge-lake-boundary';

/**
 * Time-range semantics for RC-21 Epic 5:
 * - `occurredFrom` — inclusive lower bound (`occurredAt >= occurredFrom`)
 * - `occurredTo` — exclusive upper bound (`occurredAt < occurredTo`)
 */
export type AnalyticalFactQuery = Readonly<{
  workspaceId: string;
  categories?: readonly (KnowledgeLakeEventCategory | string)[];
  producers?: readonly string[];
  mode?: KnowledgeLakeFactMode | string;
  tradingSessionId?: string;
  exchangeScopeId?: string;
  /** Inclusive lower bound on `occurredAt`. */
  occurredFrom?: string;
  /** Exclusive upper bound on `occurredAt`. */
  occurredTo?: string;
  correlationId?: string;
  /** Page size (default applied by adapter when omitted). */
  limit?: number;
  /** Opaque cursor from a previous page's `nextCursor`. */
  cursor?: string;
}>;

/**
 * Paginated analytical read result.
 * `authorityClass` marks the page as non-authoritative projections (API Contract §5.3–5.4).
 */
export type AnalyticalFactPage = Readonly<{
  authorityClass: 'projection';
  items: readonly AnalyticalFact[];
  /** Opaque cursor for the next page, or null when exhausted. */
  nextCursor: string | null;
}>;

/** Default / max page sizes for the in-memory query adapter. */
export const KNOWLEDGE_LAKE_QUERY_DEFAULT_LIMIT = 50;
export const KNOWLEDGE_LAKE_QUERY_MAX_LIMIT = 200;

export const KNOWLEDGE_LAKE_QUERY_AUTHORITY_CLASS = 'projection' as const;
