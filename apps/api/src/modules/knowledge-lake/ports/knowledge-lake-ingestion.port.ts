/**
 * RC-21 Epic 2 — Knowledge Lake Ingestion Port.
 *
 * Internal application port only. Accepts immutable analytical facts.
 * Append-only. Idempotent by eventId. No update / delete / overwrite.
 *
 * Contract: docs/project/rc-21-api-contract.md §4
 */

import type { AdmitResult, AnalyticalFactAdmission } from '../domain/analytical-fact-admission';

export const KNOWLEDGE_LAKE_INGESTION_PORT = Symbol('KNOWLEDGE_LAKE_INGESTION_PORT');

/**
 * Admission interface for Knowledge Lake.
 *
 * Forbidden by design (do not add):
 * - update / delete / overwrite / correct-in-place
 * - SoT command delegation
 * - public HTTP write API in RC-21
 */
export interface KnowledgeLakeIngestionPort {
  /**
   * Admit one analytical fact.
   * - `admitted` — new fact accepted
   * - `duplicate` — same eventId already present (idempotent success)
   * - `rejected` — invalid admission
   */
  admit(fact: AnalyticalFactAdmission): AdmitResult;

  /**
   * Optional helper: admit many with the same per-fact semantics.
   * Not a second authority — maps each item through {@link admit}.
   */
  admitMany(facts: AnalyticalFactAdmission[]): AdmitResult[];
}
