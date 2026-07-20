import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { Balance } from './domain/balance';
import type { Equity } from './domain/equity';
import type { Margin } from './domain/margin';
import {
  applyPortfolioFinancials,
  archivePortfolio,
  createPortfolio,
  DEFAULT_PORTFOLIO_CURRENCY,
  DEFAULT_PORTFOLIO_INITIAL_CASH,
  pausePortfolio,
  resetPortfolio,
  resumePortfolio,
  type Portfolio,
} from './domain/portfolio';
import type { PortfolioSnapshot } from './domain/portfolio-snapshot';
import { PortfolioCalculator } from './portfolio-calculator';
import {
  PortfolioArchivedError,
  PortfolioInvalidStateError,
  PortfolioNotFoundError,
  PortfolioResetForbiddenError,
  PortfolioValidationError,
} from './portfolio-errors';
import { PortfolioEventPublisher } from './portfolio-event-publisher';
import { PORTFOLIO_REPOSITORY, type PortfolioRepository } from './portfolio.repository';
import { PortfolioSnapshotService } from './portfolio-snapshot.service';

export type PortfolioView = Readonly<{
  id: string;
  ownerId: string;
  currency: string;
  status: string;
  balance: Balance;
  equity: Equity;
  margin: Margin;
  portfolioValue: string;
  portfolioReturn: string;
  createdAt: string;
  updatedAt: string;
  refreshedAt: string;
}>;

export type PortfolioClock = Readonly<{
  now: () => Date;
  iso: () => string;
}>;

/**
 * Portfolio Engine application service (US204).
 * Single source of truth for trading-account financial state.
 * No exchange, paper trading, order, or position concerns.
 */
@Injectable()
export class PortfolioService {
  private clock: PortfolioClock = defaultClock();

  constructor(
    @Inject(PORTFOLIO_REPOSITORY) private readonly repository: PortfolioRepository,
    @Inject(PortfolioSnapshotService) private readonly snapshots: PortfolioSnapshotService,
    @Inject(PortfolioEventPublisher) private readonly events: PortfolioEventPublisher,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  /** Test hook for deterministic timestamps. */
  setClock(clock: PortfolioClock): void {
    this.clock = clock;
  }

  async getOrCreate(workspaceId: string, ownerId: string): Promise<PortfolioView> {
    return this.getOrCreateWithInitialCash(workspaceId, ownerId, DEFAULT_PORTFOLIO_INITIAL_CASH);
  }

  /**
   * Creates a portfolio with a custom initial cash balance when absent.
   * Used by Paper Trading Engine (US208) for per-session portfolio isolation.
   */
  async getOrCreateWithInitialCash(
    workspaceId: string,
    ownerId: string,
    initialCash: string,
  ): Promise<PortfolioView> {
    const existing = await this.repository.findByWorkspaceId(workspaceId);
    if (existing) return this.toView(existing);

    const now = this.clock.iso();
    const portfolio = createPortfolio({
      id: randomUUID(),
      workspaceId,
      ownerId,
      currency: DEFAULT_PORTFOLIO_CURRENCY,
      initialCash,
      createdAt: now,
      updatedAt: now,
    });
    PortfolioCalculator.assertValid(portfolio);

    try {
      const created = await this.repository.create(portfolio);
      await this.events.publish({
        eventType: 'PortfolioCreated',
        portfolioId: created.id,
        occurredAt: now,
        ownerId: created.ownerId,
        currency: created.currency,
        cash: created.cash,
      });
      await this.snapshots.createSnapshot(created, now);
      return this.toView(created);
    } catch (error) {
      if (isUniqueConflict(error)) {
        const raced = await this.repository.findByWorkspaceId(workspaceId);
        if (raced) return this.toView(raced);
      }
      throw error;
    }
  }

  async getPortfolio(workspaceId: string): Promise<PortfolioView> {
    const portfolio = await this.requirePortfolio(workspaceId);
    return this.toView(portfolio);
  }

  async getBalance(workspaceId: string): Promise<Balance> {
    const portfolio = await this.requirePortfolio(workspaceId);
    return PortfolioCalculator.calculateBalance(portfolio);
  }

  async getEquity(workspaceId: string): Promise<Equity> {
    const portfolio = await this.requirePortfolio(workspaceId);
    return PortfolioCalculator.calculateEquity(portfolio);
  }

  async getMargin(workspaceId: string): Promise<Margin> {
    const portfolio = await this.requirePortfolio(workspaceId);
    return PortfolioCalculator.calculateMargin(portfolio);
  }

  async listSnapshots(workspaceId: string): Promise<PortfolioSnapshot[]> {
    const portfolio = await this.requirePortfolio(workspaceId);
    return this.snapshots.listSnapshots(portfolio.id);
  }

  /**
   * Resets portfolio to initial cash / zero PnL / zero margin.
   * Development only.
   */
  async reset(workspaceId: string): Promise<PortfolioView> {
    this.assertDevelopmentReset();
    const portfolio = await this.requirePortfolio(workspaceId);
    const now = this.clock.iso();
    let reset: Portfolio;
    try {
      reset = resetPortfolio(portfolio, now);
      PortfolioCalculator.assertValid(reset);
    } catch (error) {
      throw new PortfolioValidationError(
        error instanceof Error ? error.message : 'Invalid portfolio reset',
        error,
      );
    }

    const saved = await this.repository.save(reset);
    await this.publishFinancialChanges(portfolio, saved, now);
    await this.snapshots.createSnapshot(saved, now);
    return this.toView(saved);
  }

  async pause(workspaceId: string): Promise<PortfolioView> {
    return this.transition(workspaceId, (p, now) => pausePortfolio(p, now));
  }

  async resume(workspaceId: string): Promise<PortfolioView> {
    return this.transition(workspaceId, (p, now) => resumePortfolio(p, now));
  }

  async archive(workspaceId: string): Promise<PortfolioView> {
    const portfolio = await this.requirePortfolio(workspaceId);
    const now = this.clock.iso();
    let archived: Portfolio;
    try {
      archived = archivePortfolio(portfolio, now);
    } catch (error) {
      throw new PortfolioValidationError(
        error instanceof Error ? error.message : 'Invalid archive transition',
        error,
      );
    }
    const saved = await this.repository.save(archived);
    await this.events.publish({
      eventType: 'PortfolioUpdated',
      portfolioId: saved.id,
      occurredAt: now,
      status: saved.status,
    });
    await this.events.publish({
      eventType: 'PortfolioArchived',
      portfolioId: saved.id,
      occurredAt: now,
    });
    return this.toView(saved);
  }

  /**
   * Applies financial state updates from future engines (positions / orders).
   * Not exposed via REST in US204.
   */
  async applyFinancials(
    workspaceId: string,
    financials: Readonly<{
      cash: string;
      realizedPnL: string;
      unrealizedPnL: string;
      usedMargin: string;
    }>,
  ): Promise<PortfolioView> {
    const portfolio = await this.requirePortfolio(workspaceId);
    if (portfolio.status === 'ARCHIVED') {
      throw new PortfolioArchivedError();
    }
    const now = this.clock.iso();
    let updated: Portfolio;
    try {
      updated = applyPortfolioFinancials(portfolio, financials, now);
      PortfolioCalculator.assertValid(updated);
    } catch (error) {
      if (error instanceof PortfolioInvalidStateError) throw error;
      throw new PortfolioValidationError(
        error instanceof Error ? error.message : 'Invalid financial update',
        error,
      );
    }

    const saved = await this.repository.save(updated);
    await this.publishFinancialChanges(portfolio, saved, now);
    await this.snapshots.createSnapshot(saved, now);
    return this.toView(saved);
  }

  private async transition(
    workspaceId: string,
    mutate: (portfolio: Portfolio, now: string) => Portfolio,
  ): Promise<PortfolioView> {
    const portfolio = await this.requirePortfolio(workspaceId);
    const now = this.clock.iso();
    let next: Portfolio;
    try {
      next = mutate(portfolio, now);
    } catch (error) {
      throw new PortfolioValidationError(
        error instanceof Error ? error.message : 'Invalid status transition',
        error,
      );
    }
    const saved = await this.repository.save(next);
    await this.events.publish({
      eventType: 'PortfolioUpdated',
      portfolioId: saved.id,
      occurredAt: now,
      status: saved.status,
    });
    return this.toView(saved);
  }

  private async requirePortfolio(workspaceId: string): Promise<Portfolio> {
    const portfolio = await this.repository.findByWorkspaceId(workspaceId);
    if (!portfolio) throw new PortfolioNotFoundError();
    return portfolio;
  }

  private assertDevelopmentReset(): void {
    const nodeEnv = (this.config.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development')
      .trim()
      .toLowerCase();
    if (nodeEnv === 'production') {
      throw new PortfolioResetForbiddenError();
    }
  }

  private async publishFinancialChanges(
    before: Portfolio,
    after: Portfolio,
    occurredAt: string,
  ): Promise<void> {
    await this.events.publish({
      eventType: 'PortfolioUpdated',
      portfolioId: after.id,
      occurredAt,
      status: after.status,
    });

    if (before.cash !== after.cash) {
      await this.events.publish({
        eventType: 'BalanceChanged',
        portfolioId: after.id,
        occurredAt,
        cash: after.cash,
      });
    }

    const beforeEquity = PortfolioCalculator.calculateEquity(before);
    const afterEquity = PortfolioCalculator.calculateEquity(after);
    if (
      beforeEquity.equity !== afterEquity.equity ||
      before.realizedPnL !== after.realizedPnL ||
      before.unrealizedPnL !== after.unrealizedPnL
    ) {
      await this.events.publish({
        eventType: 'EquityChanged',
        portfolioId: after.id,
        occurredAt,
        equity: afterEquity.equity,
        realizedPnL: afterEquity.realizedPnL,
        unrealizedPnL: afterEquity.unrealizedPnL,
      });
    }

    const beforeMargin = PortfolioCalculator.calculateMargin(before);
    const afterMargin = PortfolioCalculator.calculateMargin(after);
    if (
      beforeMargin.usedMargin !== afterMargin.usedMargin ||
      beforeMargin.availableMargin !== afterMargin.availableMargin
    ) {
      await this.events.publish({
        eventType: 'MarginChanged',
        portfolioId: after.id,
        occurredAt,
        usedMargin: afterMargin.usedMargin,
        availableMargin: afterMargin.availableMargin,
      });
    }
  }

  private toView(portfolio: Portfolio): PortfolioView {
    const state = PortfolioCalculator.toFinancialState(portfolio);
    return Object.freeze({
      id: portfolio.id,
      ownerId: portfolio.ownerId,
      currency: portfolio.currency,
      status: portfolio.status,
      balance: state.balance,
      equity: state.equity,
      margin: state.margin,
      portfolioValue: state.portfolioValue,
      portfolioReturn: state.portfolioReturn,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
      refreshedAt: this.clock.iso(),
    });
  }
}

function defaultClock(): PortfolioClock {
  return {
    now: () => new Date(),
    iso: () => new Date().toISOString(),
  };
}

function isUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}
