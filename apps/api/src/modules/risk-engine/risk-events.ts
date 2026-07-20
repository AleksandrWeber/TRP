/**
 * Application events for US207 Risk Engine.
 * Persisted via RiskEventPublisher; also collected in-memory for tests.
 */

export const RISK_EVENT_TYPES = Object.freeze([
  'RiskEvaluationStarted',
  'RiskEvaluationCompleted',
  'RiskApproved',
  'RiskRejected',
  'RiskWarning',
  'PolicyViolationDetected',
] as const);

export type RiskEventType = (typeof RISK_EVENT_TYPES)[number];

type RiskEventBase<Type extends RiskEventType> = Readonly<{
  eventType: Type;
  occurredAt: string;
  portfolioId: string;
  orderId: string;
  decisionId?: string;
}>;

export type RiskEvaluationStartedEvent = RiskEventBase<'RiskEvaluationStarted'> &
  Readonly<{
    symbol: string;
    side: string;
    quantity: string;
  }>;

export type RiskEvaluationCompletedEvent = RiskEventBase<'RiskEvaluationCompleted'> &
  Readonly<{
    decisionId: string;
    decision: string;
    score: string;
  }>;

export type RiskApprovedEvent = RiskEventBase<'RiskApproved'> &
  Readonly<{
    decisionId: string;
    score: string;
  }>;

export type RiskRejectedEvent = RiskEventBase<'RiskRejected'> &
  Readonly<{
    decisionId: string;
    reason: string;
    score: string;
  }>;

export type RiskWarningEvent = RiskEventBase<'RiskWarning'> &
  Readonly<{
    decisionId: string;
    reason: string;
    score: string;
  }>;

export type PolicyViolationDetectedEvent = RiskEventBase<'PolicyViolationDetected'> &
  Readonly<{
    decisionId: string;
    code: string;
    severity: string;
    message: string;
  }>;

export type RiskDomainEvent =
  | RiskEvaluationStartedEvent
  | RiskEvaluationCompletedEvent
  | RiskApprovedEvent
  | RiskRejectedEvent
  | RiskWarningEvent
  | PolicyViolationDetectedEvent;
