import { Injectable } from '@nestjs/common';
import {
  toAnalyticalFact,
  validateAnalyticalFactAdmission,
  type AdmitResult,
  type AnalyticalFact,
  type AnalyticalFactAdmission,
} from '../domain/analytical-fact-admission';
import type { AnalyticalFactPage, AnalyticalFactQuery } from '../domain/analytical-fact-query';
import type { KnowledgeLakeIngestionPort } from '../ports/knowledge-lake-ingestion.port';
import type { KnowledgeLakeQueryPort } from '../ports/knowledge-lake-query.port';
import { queryAnalyticalFacts } from '../query/query-analytical-facts';

/**
 * RC-21 — process-local append-only analytical fact buffer.
 *
 * Implements:
 * - Epic 2 `KnowledgeLakeIngestionPort` (admit)
 * - Epic 5 `KnowledgeLakeQueryPort` (read-only list/get)
 *
 * This is NOT a database, warehouse product, or Source of Truth.
 * Durable persistence remains out of RC-21 scope.
 */
@Injectable()
export class InMemoryKnowledgeLakeIngestionAdapter
  implements KnowledgeLakeIngestionPort, KnowledgeLakeQueryPort
{
  /** Append-only map keyed by eventId (first-wins). */
  private readonly factsByEventId = new Map<string, AnalyticalFact>();

  /** Insertion order for append-only audit in tests. */
  private readonly appendOrder: string[] = [];

  admit(fact: AnalyticalFactAdmission): AdmitResult {
    const rejected = validateAnalyticalFactAdmission(fact);
    if (rejected) {
      return rejected;
    }

    const existing = this.factsByEventId.get(fact.eventId.trim());
    if (existing) {
      return {
        outcome: 'duplicate',
        eventId: existing.eventId,
        fact: existing,
      };
    }

    const admitted = toAnalyticalFact(fact, new Date().toISOString());
    this.factsByEventId.set(admitted.eventId, admitted);
    this.appendOrder.push(admitted.eventId);

    return { outcome: 'admitted', fact: admitted };
  }

  admitMany(facts: AnalyticalFactAdmission[]): AdmitResult[] {
    return facts.map((fact) => this.admit(fact));
  }

  getByEventId(eventId: string): AnalyticalFact | null {
    if (typeof eventId !== 'string' || eventId.trim() === '') {
      return null;
    }
    return this.factsByEventId.get(eventId.trim()) ?? null;
  }

  list(query: AnalyticalFactQuery): AnalyticalFactPage {
    return queryAnalyticalFacts([...this.factsByEventId.values()], query);
  }

  /**
   * Test / diagnostic helper: inspect admitted fact by eventId.
   * Prefer {@link getByEventId} for the query contract surface.
   */
  peekByEventId(eventId: string): AnalyticalFact | undefined {
    return this.factsByEventId.get(eventId);
  }

  /** Test helper: append order of eventIds (append-only evidence). */
  peekAppendOrder(): readonly string[] {
    return this.appendOrder;
  }

  /** Test helper: count of admitted facts. */
  peekSize(): number {
    return this.factsByEventId.size;
  }
}
