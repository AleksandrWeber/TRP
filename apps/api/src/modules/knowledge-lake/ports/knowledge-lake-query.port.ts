/**
 * RC-21 Epic 5 — Knowledge Lake Query Port.
 *
 * Consumer-safe analytical reads only. Never exposes Source of Truth.
 * No write / update / delete methods by design.
 *
 * Contract: docs/project/rc-21-api-contract.md §5
 */

import type { AnalyticalFact } from '../domain/analytical-fact-admission';
import type { AnalyticalFactPage, AnalyticalFactQuery } from '../domain/analytical-fact-query';

export const KNOWLEDGE_LAKE_QUERY_PORT = Symbol('KNOWLEDGE_LAKE_QUERY_PORT');

/**
 * Read-only analytical query interface for Knowledge Lake.
 *
 * Forbidden by design (do not add):
 * - admit / update / delete / overwrite
 * - SoT command delegation
 * - Reporting UI / AI / dashboards (port only)
 */
export interface KnowledgeLakeQueryPort {
  /**
   * Fetch one analytical fact by eventId.
   * Returns null when missing. Result is a projection when present.
   */
  getByEventId(eventId: string): AnalyticalFact | null;

  /**
   * List analytical facts matching filters.
   * Always returns a page marked `authorityClass: 'projection'`.
   * Empty filters (aside from required workspaceId) yield empty items — never SoT data.
   */
  list(query: AnalyticalFactQuery): AnalyticalFactPage;
}
