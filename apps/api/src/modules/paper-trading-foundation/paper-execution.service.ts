import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PaperExecutionAudit } from './paper-execution.audit';
import { createPaperFill } from './paper-fill';
import {
  toPaperFillListView,
  toPaperFillView,
  type PaperExecutionView,
  type PaperFillListView,
  type PaperFillView,
} from './paper-fill.projection';
import { PAPER_FILL_STORE, type PaperFillStore } from './paper-fill.store';
import { matchPaperOrder } from './paper-matching';
import { PaperOrderMarketDataGateway } from './paper-order-market-data';
import { markPaperOrderFilled } from './paper-order';
import { PAPER_ORDER_STORE, type PaperOrderStore } from './paper-order.store';

export type ExecutePaperOrderCommand = Readonly<{
  workspaceId: string;
  actorUserId: string;
  orderId: string;
}>;

/**
 * Paper Execution application boundary (W2-S04-c).
 * Matches Pending orders against Market Data snapshots and creates Paper Fills.
 * Does not update balances, positions, portfolio, PnL, or Ledger.
 */
@Injectable()
export class PaperExecutionService {
  constructor(
    @Inject(PAPER_ORDER_STORE) private readonly orders: PaperOrderStore,
    @Inject(PAPER_FILL_STORE) private readonly fills: PaperFillStore,
    private readonly marketData: PaperOrderMarketDataGateway,
    private readonly audit: PaperExecutionAudit,
  ) {}

  async listFills(workspaceId: string): Promise<PaperFillListView> {
    return toPaperFillListView(await this.fills.listByWorkspace(workspaceId));
  }

  async getFill(workspaceId: string, fillId: string): Promise<PaperFillView> {
    const fill = await this.fills.findById(workspaceId, fillId);
    if (!fill) throw new PaperExecutionNotFoundError(`Paper Fill not found: ${fillId}`);
    return toPaperFillView(fill);
  }

  async execute(command: ExecutePaperOrderCommand): Promise<PaperExecutionView> {
    const order = await this.orders.findById(command.workspaceId, command.orderId);
    if (!order) {
      await this.reject(command, undefined, undefined, 'Paper Order not found');
      throw new PaperExecutionNotFoundError(`Paper Order not found: ${command.orderId}`);
    }
    if (order.status !== 'PENDING') {
      await this.reject(
        command,
        order.exchange,
        order.symbol,
        `paper order cannot execute from ${order.status}`,
      );
      throw new PaperExecutionRejectedError(`paper order cannot execute from ${order.status}`);
    }

    const existingFill = await this.fills.findByOrderId(command.workspaceId, order.id);
    if (existingFill) {
      await this.reject(command, order.exchange, order.symbol, 'paper order already has a fill');
      throw new PaperExecutionRejectedError('paper order already has a fill');
    }

    const ticker = this.marketData.getTickerSnapshot(
      command.workspaceId,
      order.exchange,
      order.symbol,
    );
    const match = matchPaperOrder(order, ticker);
    if (!match.matched) {
      await this.reject(command, order.exchange, order.symbol, match.reason);
      throw new PaperExecutionRejectedError(match.reason);
    }

    const now = new Date().toISOString();
    const fill = createPaperFill({
      id: randomUUID(),
      workspaceId: order.workspaceId,
      paperAccountId: order.paperAccountId,
      paperOrderId: order.id,
      exchange: order.exchange,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      executionPrice: match.executionPrice,
      executionTime: now,
      createdAt: now,
    });
    const created = await this.fills.create(fill);
    const filledOrder = markPaperOrderFilled(order, now);
    await this.orders.save(filledOrder);

    await this.audit.record({
      outcome: 'paper_fill_created',
      workspaceId: created.workspaceId,
      actorUserId: command.actorUserId,
      paperOrderId: order.id,
      paperFillId: created.id,
      exchange: created.exchange,
      symbol: created.symbol,
    });
    await this.audit.record({
      outcome: 'paper_execution_completed',
      workspaceId: created.workspaceId,
      actorUserId: command.actorUserId,
      paperOrderId: order.id,
      paperFillId: created.id,
      exchange: created.exchange,
      symbol: created.symbol,
    });

    return Object.freeze({
      orderId: filledOrder.id,
      status: filledOrder.status,
      fill: toPaperFillView(created),
    });
  }

  private async reject(
    command: ExecutePaperOrderCommand,
    exchange: string | undefined,
    symbol: string | undefined,
    reason: string,
  ): Promise<void> {
    await this.audit.record({
      outcome: 'paper_execution_rejected',
      workspaceId: command.workspaceId,
      actorUserId: command.actorUserId,
      paperOrderId: command.orderId,
      exchange,
      symbol,
      reason,
    });
  }
}

export class PaperExecutionNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaperExecutionNotFoundError';
  }
}

export class PaperExecutionRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaperExecutionRejectedError';
  }
}
