/**
 * RC-21 Epic 3 — map existing outbox envelopes → AnalyticalFactAdmission.
 *
 * Never invents business events. Never mutates envelopes.
 * Analytical copies only (Authority Matrix: SoT wins on conflict).
 */

import type { DurableEventEnvelope } from '../../event-processing';
import type {
  AnalyticalFactAdmission,
  KnowledgeLakeFactMode,
} from '../domain/analytical-fact-admission';
import type { KnowledgeLakeEventCategory } from '../domain/knowledge-lake-boundary';
import { KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS } from './trading-path-producer-registry';

const SESSION_SYSTEM_EVENTS = new Set(['TradingSessionRecovering', 'TradingSessionFailed']);

function registrationFor(
  aggregateType: string,
  eventType: string,
): (typeof KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS)[number] | undefined {
  return KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS.find(
    (row) =>
      row.aggregateType === aggregateType &&
      (row.eventTypes as readonly string[]).includes(eventType),
  );
}

function readString(payload: Readonly<Record<string, unknown>>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function paperMode(): KnowledgeLakeFactMode {
  return 'paper';
}

function categoryFor(producerId: string, eventType: string): KnowledgeLakeEventCategory {
  if (producerId === 'trading-session') {
    return SESSION_SYSTEM_EVENTS.has(eventType) ? 'System' : 'Trading';
  }
  if (producerId === 'risk-engine') return 'Risk';
  if (producerId === 'paper-trading') return 'Paper';
  return 'Trading';
}

/**
 * Project a durable outbox envelope into a Lake admission, or null if not in scope.
 */
export function projectTradingPathEnvelope(
  event: DurableEventEnvelope,
): AnalyticalFactAdmission | null {
  const registration = registrationFor(event.aggregateType, event.eventType);
  if (!registration) {
    return null;
  }

  const payload = event.payload;
  const tradingSessionId =
    readString(payload, 'tradingSessionId') ??
    (event.aggregateType === 'TradingSession'
      ? event.aggregateId
      : readString(payload, 'sessionId'));

  const category = categoryFor(registration.producerId, event.eventType);

  return Object.freeze({
    eventId: event.eventId,
    occurredAt: event.occurredAt,
    producer: registration.producerId,
    category,
    mode: paperMode(),
    workspaceId: event.workspaceId,
    ...(tradingSessionId !== undefined ? { tradingSessionId } : {}),
    ...(event.correlationId !== undefined ? { correlationId: event.correlationId } : {}),
    sourceRef: Object.freeze({
      ownerType: event.aggregateType,
      id: event.aggregateId,
    }),
    payload: Object.freeze({
      kind: 'trading_path_analytical_copy',
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      aggregateVersion: event.aggregateVersion,
      recordedAt: event.recordedAt,
      // Shallow analytical snapshot of existing envelope payload — not a new SoT event.
      sourcePayload: payload,
    }),
    schemaVersion: String(event.schemaVersion),
  });
}
