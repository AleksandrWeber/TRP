/**
 * RC-21 Epic 3 — Trading-path producer registry (documentation + routing).
 *
 * One-way projections only. Producers remain SoT; Lake never commands them.
 * Contract producer ids: docs/project/rc-21-api-contract.md §7
 */

import type { KnowledgeLakeEventCategory } from '../domain/knowledge-lake-boundary';

export type TradingPathProducerRegistration = Readonly<{
  producerId: 'trading-session' | 'orders' | 'risk-engine' | 'paper-trading' | 'execution-engine';
  /** Frozen paper-path module that owns the SoT facts. */
  owningModule: 'trading-session' | 'orders' | 'risk' | 'paper-account' | 'execution-engine';
  aggregateType: string;
  categories: readonly KnowledgeLakeEventCategory[];
  /** Outbox event types projected in the Epic 3 thin slice. */
  eventTypes: readonly string[];
  direction: 'producer-to-lake';
  feedbackToSoT: false;
}>;

/**
 * Canonical trading-path producers for RC-21 Epic 3.
 * Research Lab is Epic 4. Dual-stack US207/US208 engines are not registered here.
 */
export const KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS = Object.freeze([
  Object.freeze({
    producerId: 'trading-session',
    owningModule: 'trading-session',
    aggregateType: 'TradingSession',
    categories: Object.freeze(['Trading', 'System'] as const),
    eventTypes: Object.freeze([
      'TradingSessionCreated',
      'TradingSessionStarted',
      'TradingSessionPaused',
      'TradingSessionResumed',
      'TradingSessionStopped',
      'TradingSessionRecovering',
      'TradingSessionFailed',
    ] as const),
    direction: 'producer-to-lake',
    feedbackToSoT: false,
  }),
  Object.freeze({
    producerId: 'orders',
    owningModule: 'orders',
    aggregateType: 'Order',
    categories: Object.freeze(['Trading'] as const),
    eventTypes: Object.freeze([
      'OrderProposed',
      'OrderRiskPending',
      'OrderApproved',
      'OrderRejected',
      'OrderSubmitted',
      'OrderAcknowledged',
      'OrderFilled',
      'OrderCancellationRequested',
      'OrderCancelled',
      'OrderFillApplied',
    ] as const),
    direction: 'producer-to-lake',
    feedbackToSoT: false,
  }),
  Object.freeze({
    producerId: 'risk-engine',
    owningModule: 'risk',
    aggregateType: 'RiskDecision',
    categories: Object.freeze(['Risk'] as const),
    eventTypes: Object.freeze(['RiskDecisionApproved', 'RiskDecisionRejected'] as const),
    direction: 'producer-to-lake',
    feedbackToSoT: false,
  }),
  Object.freeze({
    producerId: 'paper-trading',
    owningModule: 'paper-account',
    aggregateType: 'PaperAccount',
    categories: Object.freeze(['Paper'] as const),
    eventTypes: Object.freeze(['PaperAccountCreated', 'PaperAccountActivated'] as const),
    direction: 'producer-to-lake',
    feedbackToSoT: false,
  }),
  Object.freeze({
    producerId: 'execution-engine',
    owningModule: 'execution-engine',
    aggregateType: 'Fill',
    categories: Object.freeze(['Trading'] as const),
    eventTypes: Object.freeze(['OrderFillRecorded'] as const),
    direction: 'producer-to-lake',
    feedbackToSoT: false,
  }),
] as const satisfies readonly TradingPathProducerRegistration[]);

export type TradingPathProducerId =
  (typeof KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS)[number]['producerId'];
