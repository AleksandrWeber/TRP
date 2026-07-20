import { assertRiskDecisionType, type RiskDecisionType } from './risk-decision-type';

/**
 * RiskDecision aggregate root — immutable evaluation outcome (US207).
 * Risk Engine never mutates Portfolio, Position, or Order.
 */
export type RiskDecision = Readonly<{
  id: string;
  portfolioId: string;
  orderId: string;
  decision: RiskDecisionType;
  reason: string;
  score: string;
  timestamp: string;
}>;

export type CreateRiskDecisionInput = Readonly<{
  id: string;
  portfolioId: string;
  orderId: string;
  decision: string;
  reason: string;
  score: string;
  timestamp: string;
}>;

export function createRiskDecision(input: CreateRiskDecisionInput): RiskDecision {
  if (!input.id?.trim()) throw new Error('risk decision id is required');
  if (!input.portfolioId?.trim()) throw new Error('portfolioId is required');
  if (!input.orderId?.trim()) throw new Error('orderId is required');
  if (!input.reason?.trim()) throw new Error('reason is required');
  if (!input.timestamp?.trim()) throw new Error('timestamp is required');

  return Object.freeze({
    id: input.id,
    portfolioId: input.portfolioId,
    orderId: input.orderId,
    decision: assertRiskDecisionType(String(input.decision).toUpperCase()),
    reason: input.reason,
    score: input.score,
    timestamp: input.timestamp,
  });
}

export function rehydrateRiskDecision(input: CreateRiskDecisionInput): RiskDecision {
  return createRiskDecision(input);
}
