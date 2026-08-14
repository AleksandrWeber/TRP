/**
 * RC-21 Epic 2 — Immutable analytical fact admission contract.
 *
 * Mirrors docs/project/rc-21-api-contract.md §4.
 * Facts are analytical projections — never Ledger / Orders / Session SoT.
 */

import {
  isKnowledgeLakeEventCategory,
  type KnowledgeLakeEventCategory,
} from './knowledge-lake-boundary';
import { resolveExchangeScopeId } from '../../exchange-scope';

/** Paper / live / research / system mode marker (API Contract §4.2). */
export const KNOWLEDGE_LAKE_FACT_MODES = Object.freeze([
  'paper',
  'live',
  'research',
  'system',
] as const);

export type KnowledgeLakeFactMode = (typeof KNOWLEDGE_LAKE_FACT_MODES)[number];

/** Optional pointer to owning SoT / research record. */
export type AnalyticalFactSourceRef = Readonly<{
  ownerType: string;
  id: string;
}>;

/**
 * Producer admission envelope (write side).
 * Callers must not treat this as a mutation API for business SoT.
 */
export type AnalyticalFactAdmission = Readonly<{
  eventId: string;
  occurredAt: string;
  admittedAt?: string;
  producer: string;
  category: KnowledgeLakeEventCategory | string;
  /**
   * Required for non-System categories.
   * System category may omit (defaults to `system` on admit).
   */
  mode?: KnowledgeLakeFactMode | string;
  workspaceId: string;
  exchangeScopeId?: string;
  tradingSessionId?: string;
  correlationId?: string;
  sourceRef?: AnalyticalFactSourceRef;
  payload: unknown;
  schemaVersion: string;
}>;

/** Read-model shape after successful admission (projection only). */
export type AnalyticalFact = Readonly<{
  eventId: string;
  occurredAt: string;
  admittedAt: string;
  producer: string;
  category: KnowledgeLakeEventCategory;
  mode: KnowledgeLakeFactMode;
  workspaceId: string;
  /** RC-27 Epic 4 — defaults to Binance when omitted on admission. */
  exchangeScopeId: string;
  tradingSessionId?: string;
  correlationId?: string;
  sourceRef?: AnalyticalFactSourceRef;
  payload: unknown;
  schemaVersion: string;
}>;

export type AdmitRejectedReason =
  | 'missing_event_id'
  | 'missing_occurred_at'
  | 'missing_producer'
  | 'missing_category'
  | 'unknown_category'
  | 'missing_mode'
  | 'unknown_mode'
  | 'missing_workspace_id'
  | 'missing_payload'
  | 'payload_not_json_serializable'
  | 'missing_schema_version';

export type AdmitResult =
  | Readonly<{ outcome: 'admitted'; fact: AnalyticalFact }>
  | Readonly<{ outcome: 'duplicate'; eventId: string; fact: AnalyticalFact }>
  | Readonly<{
      outcome: 'rejected';
      reason: AdmitRejectedReason;
      message: string;
    }>;

export function isKnowledgeLakeFactMode(value: string): value is KnowledgeLakeFactMode {
  return (KNOWLEDGE_LAKE_FACT_MODES as readonly string[]).includes(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isJsonSerializable(value: unknown): boolean {
  if (value === undefined) {
    return false;
  }
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates an admission envelope against the RC-21 ingestion contract.
 * Returns a rejected AdmitResult or null when valid.
 */
export function validateAnalyticalFactAdmission(
  fact: AnalyticalFactAdmission,
): Extract<AdmitResult, { outcome: 'rejected' }> | null {
  if (!isNonEmptyString(fact.eventId)) {
    return {
      outcome: 'rejected',
      reason: 'missing_event_id',
      message: 'eventId is required',
    };
  }
  if (!isNonEmptyString(fact.occurredAt)) {
    return {
      outcome: 'rejected',
      reason: 'missing_occurred_at',
      message: 'occurredAt is required',
    };
  }
  if (!isNonEmptyString(fact.producer)) {
    return {
      outcome: 'rejected',
      reason: 'missing_producer',
      message: 'producer is required',
    };
  }
  if (!isNonEmptyString(fact.category)) {
    return {
      outcome: 'rejected',
      reason: 'missing_category',
      message: 'category is required',
    };
  }
  if (!isKnowledgeLakeEventCategory(fact.category)) {
    return {
      outcome: 'rejected',
      reason: 'unknown_category',
      message: `category must be one of the closed RC-21 set; got "${fact.category}"`,
    };
  }
  const modeOmitted = fact.mode === undefined || fact.mode === null;
  if (modeOmitted) {
    if (fact.category !== 'System') {
      return {
        outcome: 'rejected',
        reason: 'missing_mode',
        message: 'mode is required unless category is System',
      };
    }
  } else if (typeof fact.mode !== 'string' || !isKnowledgeLakeFactMode(fact.mode)) {
    return {
      outcome: 'rejected',
      reason: 'unknown_mode',
      message: `mode must be paper|live|research|system; got "${String(fact.mode)}"`,
    };
  }
  if (!isNonEmptyString(fact.workspaceId)) {
    return {
      outcome: 'rejected',
      reason: 'missing_workspace_id',
      message: 'workspaceId is required',
    };
  }
  if (fact.payload === undefined) {
    return {
      outcome: 'rejected',
      reason: 'missing_payload',
      message: 'payload is required',
    };
  }
  if (!isJsonSerializable(fact.payload)) {
    return {
      outcome: 'rejected',
      reason: 'payload_not_json_serializable',
      message: 'payload must be JSON-serializable',
    };
  }
  if (!isNonEmptyString(fact.schemaVersion)) {
    return {
      outcome: 'rejected',
      reason: 'missing_schema_version',
      message: 'schemaVersion is required',
    };
  }
  return null;
}

/**
 * Normalize a validated admission into an immutable AnalyticalFact.
 * Fills admittedAt when omitted. System category defaults mode to `system`.
 */
export function toAnalyticalFact(
  fact: AnalyticalFactAdmission,
  admittedAtFallback: string,
): AnalyticalFact {
  const category = fact.category as KnowledgeLakeEventCategory;
  const mode: KnowledgeLakeFactMode =
    fact.mode === undefined || fact.mode === null ? 'system' : (fact.mode as KnowledgeLakeFactMode);

  const admitted: AnalyticalFact = {
    eventId: fact.eventId.trim(),
    occurredAt: fact.occurredAt.trim(),
    admittedAt: isNonEmptyString(fact.admittedAt) ? fact.admittedAt.trim() : admittedAtFallback,
    producer: fact.producer.trim(),
    category,
    mode,
    workspaceId: fact.workspaceId.trim(),
    exchangeScopeId: resolveExchangeScopeId(fact.exchangeScopeId),
    ...(fact.tradingSessionId !== undefined ? { tradingSessionId: fact.tradingSessionId } : {}),
    ...(fact.correlationId !== undefined ? { correlationId: fact.correlationId } : {}),
    ...(fact.sourceRef !== undefined ? { sourceRef: fact.sourceRef } : {}),
    payload: deepFreezeClone(fact.payload),
    schemaVersion: fact.schemaVersion.trim(),
  };

  return Object.freeze(admitted);
}

/** Deep-freeze a JSON-serializable clone so admitted payloads stay immutable. */
export function deepFreezeClone<T>(value: T): T {
  const cloned = structuredClone(value);
  return deepFreeze(cloned);
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const key of Reflect.ownKeys(value as object)) {
    const child = (value as Record<PropertyKey, unknown>)[key];
    if (child !== null && typeof child === 'object') {
      deepFreeze(child);
    }
  }
  return value;
}
