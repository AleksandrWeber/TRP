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
 * W3-O01-b: snapshot export/import enables durable persistence on this owner
 * via DurableKnowledgeLakeIngestionAdapter.
 */

export type KnowledgeLakeIngestionDurableState = Readonly<{
  facts: AnalyticalFact[];
  appendOrder: string[];
}>;

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

  exportDurableState(): KnowledgeLakeIngestionDurableState {
    return Object.freeze({
      facts: [...this.factsByEventId.values()],
      appendOrder: [...this.appendOrder],
    });
  }

  importDurableState(state: KnowledgeLakeIngestionDurableState): void {
    this.factsByEventId.clear();
    this.appendOrder.length = 0;
    const order = state.appendOrder ?? [];
    const byId = new Map((state.facts ?? []).map((fact) => [fact.eventId, fact] as const));
    for (const eventId of order) {
      const fact = byId.get(eventId);
      if (!fact || this.factsByEventId.has(eventId)) continue;
      this.factsByEventId.set(eventId, fact);
      this.appendOrder.push(eventId);
      byId.delete(eventId);
    }
    for (const fact of byId.values()) {
      if (this.factsByEventId.has(fact.eventId)) continue;
      this.factsByEventId.set(fact.eventId, fact);
      this.appendOrder.push(fact.eventId);
    }
  }
}
