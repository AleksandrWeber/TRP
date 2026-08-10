import type { AdmitResult, AnalyticalFactAdmission } from '../domain/analytical-fact-admission';
import type { KnowledgeLakeIngestionPort } from '../ports/knowledge-lake-ingestion.port';

/**
 * Best-effort Lake admit (ADR-019 spirit).
 *
 * Projection failure must never throw into OutboxDispatcher delivery —
 * producers already completed their SoT work before outbox dispatch.
 * No Lake-owned retry loop is introduced here.
 */
export function bestEffortAdmit(
  ingestion: KnowledgeLakeIngestionPort,
  fact: AnalyticalFactAdmission,
): AdmitResult | null {
  try {
    return ingestion.admit(fact);
  } catch {
    return null;
  }
}
