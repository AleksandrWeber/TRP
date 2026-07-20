import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FinancialDecimal } from '../financial';
import { PortfolioService, type PortfolioView } from '../portfolio-engine';
import { PositionService, type PositionView } from '../position-engine';
import type { RiskDecision } from './domain/risk-decision';
import type {
  RiskActiveOrder,
  RiskOpenPosition,
  RiskOrderRequest,
  RiskPortfolioSnapshot,
} from './domain/risk-evaluation-context';
import {
  createRiskPolicy,
  DEFAULT_RISK_POLICIES,
  withRiskPolicyPatch,
  type RiskPolicy,
  type RiskPolicyConfiguration,
} from './domain/risk-policy';
import type { RiskResult } from './domain/risk-result';
import { RiskEvaluator } from './risk-evaluator';
import { RiskEventPublisher } from './risk-event-publisher';
import { RiskPolicyNotFoundError, RiskValidationError } from './risk-errors';
import { RISK_REPOSITORY, type RiskRepository } from './risk.repository';

export type RiskDecisionView = Readonly<{
  id: string;
  portfolioId: string;
  orderId: string;
  decision: string;
  reason: string;
  score: string;
  timestamp: string;
}>;

export type RiskPolicyView = Readonly<{
  id: string;
  portfolioId: string | null;
  name: string;
  enabled: boolean;
  priority: number;
  configuration: RiskPolicyConfiguration;
}>;

export type RiskEvaluationView = Readonly<{
  decision: RiskDecisionView;
  result: RiskResult;
}>;

export type RiskSummaryView = Readonly<{
  exposure: string;
  marginUsage: string;
  availableMargin: string;
  usedMargin: string;
  openPositionCount: number;
  equity: string;
  cash: string;
}>;

export type RiskClock = Readonly<{
  now: () => Date;
  iso: () => string;
}>;

export type EvaluateRiskRequest = Readonly<{
  orderId: string;
  symbol: string;
  side: string;
  type: string;
  quantity: string;
  requestedPrice?: string | null;
  referencePrice?: string | null;
  /** Active orders for duplicate detection (caller may supply; otherwise empty). */
  activeOrders?: readonly RiskActiveOrder[];
}>;

/**
 * Risk Engine application service (US207).
 * Centralized policy validation before order execution.
 * NEVER executes orders. NEVER mutates Portfolio, Position, or Order.
 */
@Injectable()
export class RiskService {
  private clock: RiskClock = defaultClock();
  private readonly evaluator = new RiskEvaluator();
  private defaultsEnsured = false;

  constructor(
    @Inject(RISK_REPOSITORY) private readonly repository: RiskRepository,
    @Inject(RiskEventPublisher) private readonly events: RiskEventPublisher,
    @Inject(PortfolioService) private readonly portfolios: PortfolioService,
    @Inject(PositionService) private readonly positions: PositionService,
  ) {}

  setClock(clock: RiskClock): void {
    this.clock = clock;
  }

  async evaluate(
    workspaceId: string,
    ownerId: string,
    request: EvaluateRiskRequest,
  ): Promise<RiskEvaluationView> {
    this.validateEvaluateRequest(request);
    const portfolio = await this.portfolios.getOrCreate(workspaceId, ownerId);
    await this.ensureDefaultPolicies();

    const now = this.clock.iso();
    const order: RiskOrderRequest = {
      id: request.orderId,
      portfolioId: portfolio.id,
      symbol: request.symbol.trim().toUpperCase(),
      side: String(request.side).toUpperCase(),
      type: String(request.type).toUpperCase(),
      quantity: request.quantity,
      requestedPrice:
        request.requestedPrice === undefined || request.requestedPrice === null
          ? null
          : request.requestedPrice,
      referencePrice:
        request.referencePrice === undefined || request.referencePrice === null
          ? null
          : request.referencePrice,
    };

    await this.events.publish({
      eventType: 'RiskEvaluationStarted',
      occurredAt: now,
      portfolioId: portfolio.id,
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
    });

    const policies = await this.repository.listPolicies(portfolio.id);
    const openPositions = await this.loadOpenPositions(workspaceId, ownerId);
    const portfolioSnapshot = await this.loadPortfolioSnapshot(workspaceId);
    const activeOrders = request.activeOrders ?? [];

    const outcome = this.evaluator.evaluate({
      decisionId: randomUUID(),
      order,
      portfolio: portfolioSnapshot,
      openPositions,
      activeOrders,
      policies,
      timestamp: now,
    });

    const persisted = await this.repository.createDecision(outcome.decision);
    await this.publishDecisionEvents(persisted, outcome.result, now);

    return Object.freeze({
      decision: this.toDecisionView(persisted),
      result: outcome.result,
    });
  }

  async listHistory(workspaceId: string, ownerId: string): Promise<RiskDecisionView[]> {
    return this.listDecisions(workspaceId, ownerId);
  }

  async listDecisions(workspaceId: string, ownerId: string): Promise<RiskDecisionView[]> {
    const portfolio = await this.portfolios.getOrCreate(workspaceId, ownerId);
    const decisions = await this.repository.listDecisionsByPortfolioId(portfolio.id);
    return decisions.map((d) => this.toDecisionView(d));
  }

  async listPolicies(workspaceId: string, ownerId: string): Promise<RiskPolicyView[]> {
    const portfolio = await this.portfolios.getOrCreate(workspaceId, ownerId);
    await this.ensureDefaultPolicies();
    const policies = await this.repository.listPolicies(portfolio.id);
    return policies.map((p) => this.toPolicyView(p));
  }

  async updatePolicy(
    workspaceId: string,
    ownerId: string,
    policyId: string,
    patch: Readonly<{
      enabled?: boolean;
      priority?: number;
      configuration?: RiskPolicyConfiguration;
    }>,
  ): Promise<RiskPolicyView> {
    const portfolio = await this.portfolios.getOrCreate(workspaceId, ownerId);
    await this.ensureDefaultPolicies();

    let existing = await this.repository.findPolicyById(policyId);
    if (!existing) {
      throw new RiskPolicyNotFoundError();
    }

    // Clone global policy into portfolio scope on first edit.
    if (existing.portfolioId === null) {
      existing = await this.repository.createPolicy(
        createRiskPolicy({
          id: randomUUID(),
          portfolioId: portfolio.id,
          name: existing.name,
          enabled: existing.enabled,
          priority: existing.priority,
          configuration: existing.configuration,
        }),
      );
    } else if (existing.portfolioId !== portfolio.id) {
      throw new RiskPolicyNotFoundError();
    }

    const next = withRiskPolicyPatch(existing, patch);
    const saved = await this.repository.savePolicy(next);
    return this.toPolicyView(saved);
  }

  async getSummary(workspaceId: string, ownerId: string): Promise<RiskSummaryView> {
    const portfolio = await this.portfolios.getOrCreate(workspaceId, ownerId);
    const open = await this.positions.listOpen(workspaceId, ownerId);
    return this.buildSummary(portfolio, open);
  }

  private buildSummary(portfolio: PortfolioView, open: readonly PositionView[]): RiskSummaryView {
    const exposure = open
      .reduce(
        (sum, p) => sum.plus(FinancialDecimal.from(p.exposure).abs()),
        FinancialDecimal.zero(),
      )
      .toString();
    const equity = FinancialDecimal.from(portfolio.equity.equity);
    const used = FinancialDecimal.from(portfolio.margin.usedMargin);
    const marginUsage = equity.isZero() ? '0' : used.dividedBy(equity).times('100').toString();

    return Object.freeze({
      exposure,
      marginUsage,
      availableMargin: portfolio.margin.availableMargin,
      usedMargin: portfolio.margin.usedMargin,
      openPositionCount: open.length,
      equity: portfolio.equity.equity,
      cash: portfolio.balance.cash,
    });
  }

  private async ensureDefaultPolicies(): Promise<void> {
    if (this.defaultsEnsured) return;
    const existing = await this.repository.listPolicies(null);
    const existingNames = new Set(existing.map((p) => p.name));
    for (const def of DEFAULT_RISK_POLICIES) {
      if (existingNames.has(def.name as RiskPolicy['name'])) continue;
      try {
        await this.repository.createPolicy(createRiskPolicy(def));
      } catch {
        // Concurrent seed — ignore unique conflicts.
      }
    }
    this.defaultsEnsured = true;
  }

  private async loadOpenPositions(
    workspaceId: string,
    ownerId: string,
  ): Promise<RiskOpenPosition[]> {
    const open = await this.positions.listOpen(workspaceId, ownerId);
    return open.map((p) =>
      Object.freeze({
        id: p.id,
        symbol: p.symbol,
        side: p.side,
        quantity: p.quantity,
        exposure: p.exposure,
      }),
    );
  }

  private async loadPortfolioSnapshot(workspaceId: string): Promise<RiskPortfolioSnapshot> {
    const portfolio = await this.portfolios.getPortfolio(workspaceId);
    return Object.freeze({
      cash: portfolio.balance.cash,
      equity: portfolio.equity.equity,
      availableMargin: portfolio.margin.availableMargin,
      usedMargin: portfolio.margin.usedMargin,
      realizedPnL: portfolio.equity.realizedPnL,
    });
  }

  private async publishDecisionEvents(
    decision: RiskDecision,
    result: RiskResult,
    now: string,
  ): Promise<void> {
    await this.events.publish({
      eventType: 'RiskEvaluationCompleted',
      occurredAt: now,
      portfolioId: decision.portfolioId,
      orderId: decision.orderId,
      decisionId: decision.id,
      decision: decision.decision,
      score: decision.score,
    });

    for (const violation of [...result.violations, ...result.warnings]) {
      await this.events.publish({
        eventType: 'PolicyViolationDetected',
        occurredAt: now,
        portfolioId: decision.portfolioId,
        orderId: decision.orderId,
        decisionId: decision.id,
        code: violation.code,
        severity: violation.severity,
        message: violation.message,
      });
    }

    if (decision.decision === 'APPROVED') {
      await this.events.publish({
        eventType: 'RiskApproved',
        occurredAt: now,
        portfolioId: decision.portfolioId,
        orderId: decision.orderId,
        decisionId: decision.id,
        score: decision.score,
      });
    } else if (decision.decision === 'REJECTED') {
      await this.events.publish({
        eventType: 'RiskRejected',
        occurredAt: now,
        portfolioId: decision.portfolioId,
        orderId: decision.orderId,
        decisionId: decision.id,
        reason: decision.reason,
        score: decision.score,
      });
    } else {
      await this.events.publish({
        eventType: 'RiskWarning',
        occurredAt: now,
        portfolioId: decision.portfolioId,
        orderId: decision.orderId,
        decisionId: decision.id,
        reason: decision.reason,
        score: decision.score,
      });
    }
  }

  private validateEvaluateRequest(request: EvaluateRiskRequest): void {
    if (!request.orderId?.trim()) {
      throw new RiskValidationError('orderId is required');
    }
    if (!request.symbol?.trim()) {
      throw new RiskValidationError('symbol is required');
    }
    if (!request.side?.trim()) {
      throw new RiskValidationError('side is required');
    }
    if (!request.type?.trim()) {
      throw new RiskValidationError('type is required');
    }
    if (!request.quantity?.trim()) {
      throw new RiskValidationError('quantity is required');
    }
  }

  private toDecisionView(decision: RiskDecision): RiskDecisionView {
    return Object.freeze({
      id: decision.id,
      portfolioId: decision.portfolioId,
      orderId: decision.orderId,
      decision: decision.decision,
      reason: decision.reason,
      score: decision.score,
      timestamp: decision.timestamp,
    });
  }

  private toPolicyView(policy: RiskPolicy): RiskPolicyView {
    return Object.freeze({
      id: policy.id,
      portfolioId: policy.portfolioId,
      name: policy.name,
      enabled: policy.enabled,
      priority: policy.priority,
      configuration: policy.configuration,
    });
  }
}

function defaultClock(): RiskClock {
  return {
    now: () => new Date(),
    iso: () => new Date().toISOString(),
  };
}
