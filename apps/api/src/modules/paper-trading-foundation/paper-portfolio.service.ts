import { Inject, Injectable } from '@nestjs/common';
import type { PaperFill } from './paper-fill';
import { PAPER_FILL_STORE, type PaperFillStore } from './paper-fill.store';
import { PaperOrderMarketDataGateway } from './paper-order-market-data';
import { PaperPortfolioAudit } from './paper-portfolio.audit';
import {
  derivePortfolioFromFills,
  markPortfolio,
  type PaperPortfolioCashState,
} from './paper-portfolio.math';
import {
  toPaperPositionView,
  type PaperExecutionHistoryView,
  type PaperPnLView,
  type PaperPortfolioView,
  type PaperPositionListView,
} from './paper-portfolio.projection';
import { setPaperAccountCurrentBalance } from './paper-trading-account';
import {
  PAPER_TRADING_ACCOUNT_STORE,
  type PaperTradingAccountStore,
} from './paper-trading-account.store';

const HONESTY =
  'Paper portfolio, positions, balances, and PnL are simulated Paper Trading projections only. Not exchange assets. Not real capital.';

/**
 * Paper Positions / Portfolio / PnL / Execution History (W2-S04-d).
 * Derived from Paper Fills + Market Data marks. Not a Ledger.
 */
@Injectable()
export class PaperPortfolioService {
  constructor(
    @Inject(PAPER_TRADING_ACCOUNT_STORE) private readonly accounts: PaperTradingAccountStore,
    @Inject(PAPER_FILL_STORE) private readonly fills: PaperFillStore,
    private readonly marketData: PaperOrderMarketDataGateway,
    private readonly audit: PaperPortfolioAudit,
  ) {}

  async getPositions(workspaceId: string): Promise<PaperPositionListView> {
    const marked = await this.computeMarked(workspaceId);
    return Object.freeze({
      positions: Object.freeze(marked.positions.map(toPaperPositionView)),
    });
  }

  async getPortfolio(workspaceId: string): Promise<PaperPortfolioView> {
    const account = await this.requireAccount(workspaceId);
    const marked = await this.computeMarked(workspaceId);
    return Object.freeze({
      paperAccountId: account.id,
      workspaceId: account.workspaceId,
      baseCurrency: account.baseCurrency,
      cashBalance: marked.cashBalance,
      equity: marked.equity,
      realizedPnL: marked.realizedPnL,
      unrealizedPnL: marked.unrealizedPnL,
      totalPnL: marked.totalPnL,
      positions: Object.freeze(marked.positions.map(toPaperPositionView)),
      honesty: HONESTY,
    });
  }

  async getPnL(workspaceId: string): Promise<PaperPnLView> {
    const account = await this.requireAccount(workspaceId);
    const marked = await this.computeMarked(workspaceId);
    return Object.freeze({
      paperAccountId: account.id,
      workspaceId: account.workspaceId,
      realizedPnL: marked.realizedPnL,
      unrealizedPnL: marked.unrealizedPnL,
      totalPnL: marked.totalPnL,
      honesty: HONESTY,
    });
  }

  async getExecutionHistory(workspaceId: string): Promise<PaperExecutionHistoryView> {
    await this.requireAccount(workspaceId);
    const fills = await this.fills.listByWorkspace(workspaceId);
    const entries = [...fills]
      .sort((a, b) => {
        const byTime = b.executionTime.localeCompare(a.executionTime);
        return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
      })
      .map((fill) =>
        Object.freeze({
          id: `fill:${fill.id}`,
          kind: 'FILL' as const,
          paperOrderId: fill.paperOrderId,
          paperFillId: fill.id,
          exchange: fill.exchange,
          symbol: fill.symbol,
          side: fill.side,
          quantity: fill.quantity,
          executionPrice: fill.executionPrice,
          occurredAt: fill.executionTime,
        }),
      );
    return Object.freeze({
      entries: Object.freeze(entries),
      honesty:
        'Execution history is local Paper Trading fill history only. Not exchange execution.',
    });
  }

  /**
   * After a Paper Fill is persisted: sync cash balance and emit portfolio audits.
   */
  async applyFillEffects(input: {
    workspaceId: string;
    actorUserId: string;
    fill: PaperFill;
    priorFills: readonly PaperFill[];
  }): Promise<void> {
    const account = await this.requireAccount(input.workspaceId);
    const before = derivePortfolioFromFills(account.startingBalance, input.priorFills);
    const after = derivePortfolioFromFills(account.startingBalance, [
      ...input.priorFills,
      input.fill,
    ]);
    const now = input.fill.createdAt;
    const updated = setPaperAccountCurrentBalance(account, after.cashBalance, now);
    await this.accounts.save(updated);

    const beforeKey = positionKey(before, input.fill.exchange, input.fill.symbol);
    const afterKey = positionKey(after, input.fill.exchange, input.fill.symbol);
    if (!beforeKey && afterKey) {
      await this.audit.record({
        outcome: 'paper_position_created',
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        paperAccountId: account.id,
        resourceId: `${input.fill.exchange}:${input.fill.symbol}`,
        exchange: input.fill.exchange,
        symbol: input.fill.symbol,
      });
    } else {
      await this.audit.record({
        outcome: 'paper_position_updated',
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        paperAccountId: account.id,
        resourceId: `${input.fill.exchange}:${input.fill.symbol}`,
        exchange: input.fill.exchange,
        symbol: input.fill.symbol,
      });
    }

    const marked = markPortfolio(after, (exchange, symbol) =>
      this.markPrice(input.workspaceId, exchange, symbol),
    );

    await this.audit.record({
      outcome: 'paper_balance_updated',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      paperAccountId: account.id,
      cashBalance: after.cashBalance,
    });
    await this.audit.record({
      outcome: 'paper_portfolio_updated',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      paperAccountId: account.id,
      cashBalance: after.cashBalance,
      realizedPnL: marked.realizedPnL,
      unrealizedPnL: marked.unrealizedPnL,
    });
    await this.audit.record({
      outcome: 'paper_pnl_updated',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      paperAccountId: account.id,
      realizedPnL: marked.realizedPnL,
      unrealizedPnL: marked.unrealizedPnL,
    });
  }

  private async computeMarked(workspaceId: string) {
    const account = await this.requireAccount(workspaceId);
    const fills = await this.fills.listByWorkspace(workspaceId);
    const state = derivePortfolioFromFills(account.startingBalance, fills);
    return markPortfolio(state, (exchange, symbol) =>
      this.markPrice(workspaceId, exchange, symbol),
    );
  }

  private markPrice(workspaceId: string, exchange: string, symbol: string): string | null {
    const ticker = this.marketData.getTickerSnapshot(workspaceId, exchange, symbol);
    if (!ticker || ticker.freshness !== 'FRESH') return null;
    return ticker.lastPrice;
  }

  private async requireAccount(workspaceId: string) {
    const account = await this.accounts.findByWorkspace(workspaceId);
    if (!account) throw new PaperPortfolioNotFoundError('Paper Account not found');
    return account;
  }
}

function positionKey(
  state: PaperPortfolioCashState,
  exchange: string,
  symbol: string,
): string | null {
  const match = state.positions.find(
    (item) => item.exchange === exchange && item.symbol === symbol,
  );
  return match ? `${match.side}:${match.quantity}` : null;
}

export class PaperPortfolioNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaperPortfolioNotFoundError';
  }
}
