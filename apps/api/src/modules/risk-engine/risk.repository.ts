import type { RiskDecision } from './domain/risk-decision';
import type { RiskPolicy } from './domain/risk-policy';
import type { RiskDomainEvent } from './risk-events';

export const RISK_REPOSITORY = Symbol('RISK_ENGINE_REPOSITORY');

export interface RiskRepository {
  createDecision(decision: RiskDecision): Promise<RiskDecision>;

  findDecisionById(decisionId: string): Promise<RiskDecision | null>;

  listDecisionsByPortfolioId(portfolioId: string): Promise<RiskDecision[]>;

  listDecisionsByOrderId(orderId: string): Promise<RiskDecision[]>;

  createPolicy(policy: RiskPolicy): Promise<RiskPolicy>;

  savePolicy(policy: RiskPolicy): Promise<RiskPolicy>;

  findPolicyById(policyId: string): Promise<RiskPolicy | null>;

  listPolicies(portfolioId: string | null): Promise<RiskPolicy[]>;

  appendEvent(event: RiskDomainEvent, eventId: string): Promise<void>;

  listEventsByDecisionId(decisionId: string): Promise<RiskDomainEvent[]>;
}
