/**
 * RC-21 Epic 5 — in-memory analytical query helpers.
 *
 * Filtering + cursor pagination over admitted AnalyticalFact projections.
 * No mutation. No SoT interpretation.
 */

import type { AnalyticalFact } from '../domain/analytical-fact-admission';
import {
  KNOWLEDGE_LAKE_QUERY_AUTHORITY_CLASS,
  KNOWLEDGE_LAKE_QUERY_DEFAULT_LIMIT,
  KNOWLEDGE_LAKE_QUERY_MAX_LIMIT,
  type AnalyticalFactPage,
  type AnalyticalFactQuery,
} from '../domain/analytical-fact-query';

type CursorPayload = Readonly<{
  occurredAt: string;
  eventId: string;
}>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function compareFacts(a: AnalyticalFact, b: AnalyticalFact): number {
  const byTime = a.occurredAt.localeCompare(b.occurredAt);
  if (byTime !== 0) return byTime;
  return a.eventId.localeCompare(b.eventId);
}

function encodeCursor(fact: AnalyticalFact): string {
  const payload: CursorPayload = {
    occurredAt: fact.occurredAt,
    eventId: fact.eventId,
  };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as Partial<CursorPayload>;
    if (!isNonEmptyString(parsed.occurredAt) || !isNonEmptyString(parsed.eventId)) {
      return null;
    }
    return {
      occurredAt: parsed.occurredAt.trim(),
      eventId: parsed.eventId.trim(),
    };
  } catch {
    return null;
  }
}

function isAfterCursor(fact: AnalyticalFact, cursor: CursorPayload): boolean {
  const byTime = fact.occurredAt.localeCompare(cursor.occurredAt);
  if (byTime > 0) return true;
  if (byTime < 0) return false;
  return fact.eventId.localeCompare(cursor.eventId) > 0;
}

function resolveLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit) || limit <= 0) {
    return KNOWLEDGE_LAKE_QUERY_DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(limit), KNOWLEDGE_LAKE_QUERY_MAX_LIMIT);
}

/**
 * Filter + paginate admitted facts for KnowledgeLakeQueryPort.list.
 *
 * Time bounds: occurredFrom inclusive, occurredTo exclusive.
 */
export function queryAnalyticalFacts(
  facts: readonly AnalyticalFact[],
  query: AnalyticalFactQuery,
): AnalyticalFactPage {
  if (!isNonEmptyString(query.workspaceId)) {
    return Object.freeze({
      authorityClass: KNOWLEDGE_LAKE_QUERY_AUTHORITY_CLASS,
      items: Object.freeze([]),
      nextCursor: null,
    });
  }

  const workspaceId = query.workspaceId.trim();
  const categorySet =
    query.categories !== undefined && query.categories.length > 0
      ? new Set(query.categories.map((c) => String(c)))
      : null;
  const producerSet =
    query.producers !== undefined && query.producers.length > 0
      ? new Set(query.producers.map((p) => String(p)))
      : null;

  let filtered = facts.filter((fact) => fact.workspaceId === workspaceId);

  if (categorySet) {
    filtered = filtered.filter((fact) => categorySet.has(fact.category));
  }
  if (producerSet) {
    filtered = filtered.filter((fact) => producerSet.has(fact.producer));
  }
  if (isNonEmptyString(query.mode)) {
    const mode = query.mode.trim();
    filtered = filtered.filter((fact) => fact.mode === mode);
  }
  if (isNonEmptyString(query.tradingSessionId)) {
    const tradingSessionId = query.tradingSessionId.trim();
    filtered = filtered.filter((fact) => fact.tradingSessionId === tradingSessionId);
  }
  if (isNonEmptyString(query.exchangeScopeId)) {
    const exchangeScopeId = query.exchangeScopeId.trim();
    filtered = filtered.filter((fact) => fact.exchangeScopeId === exchangeScopeId);
  }
  if (isNonEmptyString(query.correlationId)) {
    const correlationId = query.correlationId.trim();
    filtered = filtered.filter((fact) => fact.correlationId === correlationId);
  }
  if (isNonEmptyString(query.occurredFrom)) {
    const from = query.occurredFrom.trim();
    filtered = filtered.filter((fact) => fact.occurredAt >= from);
  }
  if (isNonEmptyString(query.occurredTo)) {
    const to = query.occurredTo.trim();
    // Exclusive upper bound (documented in AnalyticalFactQuery).
    filtered = filtered.filter((fact) => fact.occurredAt < to);
  }

  filtered = [...filtered].sort(compareFacts);

  if (isNonEmptyString(query.cursor)) {
    const cursor = decodeCursor(query.cursor.trim());
    if (cursor === null) {
      return Object.freeze({
        authorityClass: KNOWLEDGE_LAKE_QUERY_AUTHORITY_CLASS,
        items: Object.freeze([]),
        nextCursor: null,
      });
    }
    filtered = filtered.filter((fact) => isAfterCursor(fact, cursor));
  }

  const limit = resolveLimit(query.limit);
  const pageItems = filtered.slice(0, limit);
  const hasMore = filtered.length > limit;
  const nextCursor =
    hasMore && pageItems.length > 0 ? encodeCursor(pageItems[pageItems.length - 1]!) : null;

  return Object.freeze({
    authorityClass: KNOWLEDGE_LAKE_QUERY_AUTHORITY_CLASS,
    items: Object.freeze([...pageItems]),
    nextCursor,
  });
}
