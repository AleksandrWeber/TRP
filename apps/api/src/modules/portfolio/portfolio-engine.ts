import { randomUUID } from 'node:crypto';
import type { InitializePortfolioInput, PortfolioExecution } from './portfolio-execution';
import type { Portfolio } from './portfolio';
import { toPortfolioId } from './portfolio-id';
import type { PortfolioSnapshot } from './portfolio-snapshot';
import { PortfolioStatus } from './portfolio-status';

/**
 * In-session portfolio state machine for backtesting (US120).
 * initialize → applyExecution* → snapshot / close.
 * No order matching / broker / live trading.
 *
 * Instantiate one engine per BacktestSession (not a Nest singleton).
 */
export class PortfolioEngine {
  private portfolio: Portfolio | null = null;
  private unrealizedPnL = 0;
  private realizedPnL = 0;
  private lastTimestamp: string | null = null;

  initialize(input: InitializePortfolioInput): Portfolio {
    assertNonEmpty(input.workspaceId, 'workspaceId');
    assertFiniteNumber(input.initialCapital, 'initialCapital');
    if (input.initialCapital < 0) {
      throw new Error('initialCapital must not be negative');
    }
    if (this.portfolio !== null && this.portfolio.status === PortfolioStatus.Active) {
      throw new Error('PortfolioEngine is already initialized with an active portfolio');
    }

    const timestamp = input.timestamp ?? new Date().toISOString();
    const capital = input.initialCapital;

    this.unrealizedPnL = 0;
    this.realizedPnL = 0;
    this.lastTimestamp = timestamp;
    this.portfolio = {
      id: toPortfolioId(input.id?.trim() || randomUUID()),
      workspaceId: input.workspaceId.trim(),
      initialCapital: capital,
      currentCapital: capital,
      equity: capital,
      cash: capital,
      status: PortfolioStatus.Active,
    };

    return this.getPortfolio();
  }

  applyExecution(execution: PortfolioExecution): Portfolio {
    const portfolio = this.requireActive();
    assertNonEmpty(execution.timestamp, 'timestamp');
    assertFiniteNumber(execution.cashDelta, 'cashDelta');
    if (execution.realizedPnLDelta !== undefined) {
      assertFiniteNumber(execution.realizedPnLDelta, 'realizedPnLDelta');
    }
    if (execution.unrealizedPnL !== undefined) {
      assertFiniteNumber(execution.unrealizedPnL, 'unrealizedPnL');
      this.unrealizedPnL = execution.unrealizedPnL;
    }

    portfolio.cash += execution.cashDelta;
    this.realizedPnL += execution.realizedPnLDelta ?? 0;
    this.recalculateEquity(portfolio);
    this.lastTimestamp = execution.timestamp.trim();
    return this.getPortfolio();
  }

  snapshot(timestamp?: string): PortfolioSnapshot {
    const portfolio = this.requirePortfolio();
    return {
      timestamp: timestamp?.trim() || this.lastTimestamp || new Date().toISOString(),
      cash: portfolio.cash,
      equity: portfolio.equity,
      unrealizedPnL: this.unrealizedPnL,
      realizedPnL: this.realizedPnL,
    };
  }

  close(timestamp?: string): Portfolio {
    const portfolio = this.requireActive();
    portfolio.status = PortfolioStatus.Closed;
    this.lastTimestamp = timestamp?.trim() || this.lastTimestamp || new Date().toISOString();
    this.recalculateEquity(portfolio);
    return this.getPortfolio();
  }

  getPortfolio(): Portfolio {
    return clonePortfolio(this.requirePortfolio());
  }

  isInitialized(): boolean {
    return this.portfolio !== null;
  }

  private recalculateEquity(portfolio: Portfolio): void {
    // Total PnL = realized + unrealized; equity = initialCapital + Total PnL.
    portfolio.equity = portfolio.initialCapital + this.realizedPnL + this.unrealizedPnL;
    portfolio.currentCapital = portfolio.equity;
  }

  private requirePortfolio(): Portfolio {
    if (!this.portfolio) {
      throw new Error('PortfolioEngine has not been initialized');
    }
    return this.portfolio;
  }

  private requireActive(): Portfolio {
    const portfolio = this.requirePortfolio();
    if (portfolio.status !== PortfolioStatus.Active) {
      throw new Error('Portfolio is closed');
    }
    return portfolio;
  }
}

function clonePortfolio(portfolio: Portfolio): Portfolio {
  return {
    id: portfolio.id,
    workspaceId: portfolio.workspaceId,
    initialCapital: portfolio.initialCapital,
    currentCapital: portfolio.currentCapital,
    equity: portfolio.equity,
    cash: portfolio.cash,
    status: portfolio.status,
  };
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new Error(`${field} must not be empty`);
  }
}

function assertFiniteNumber(value: number, field: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
}
