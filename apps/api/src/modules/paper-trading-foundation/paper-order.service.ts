import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PaperOrderAudit } from './paper-order.audit';
import { PaperOrderMarketDataGateway } from './paper-order-market-data';
import {
  cancelPaperOrder,
  createPaperOrder,
  updatePaperOrder,
  type PaperOrder,
} from './paper-order';
import {
  toPaperOrderListView,
  toPaperOrderView,
  type PaperOrderListView,
  type PaperOrderView,
} from './paper-order.projection';
import { PAPER_ORDER_STORE, type PaperOrderStore } from './paper-order.store';
import {
  PAPER_TRADING_ACCOUNT_STORE,
  type PaperTradingAccountStore,
} from './paper-trading-account.store';

export type CreatePaperOrderCommand = Readonly<{
  workspaceId: string;
  actorUserId: string;
  paperAccountId?: string;
  exchange: string;
  symbol: string;
  side: string;
  orderType: string;
  quantity: string;
  limitPrice?: string | null;
  stopPrice?: string | null;
  asDraft?: boolean;
}>;

export type UpdatePaperOrderCommand = Readonly<{
  workspaceId: string;
  actorUserId: string;
  orderId: string;
  exchange?: string;
  symbol?: string;
  side?: string;
  orderType?: string;
  quantity?: string;
  limitPrice?: string | null;
  stopPrice?: string | null;
}>;

/**
 * Paper Order application boundary (W2-S04-b).
 * Creates and manages trading intent. Does not execute, fill, or change balances.
 */
@Injectable()
export class PaperOrderService {
  constructor(
    @Inject(PAPER_ORDER_STORE) private readonly orders: PaperOrderStore,
    @Inject(PAPER_TRADING_ACCOUNT_STORE) private readonly accounts: PaperTradingAccountStore,
    private readonly marketData: PaperOrderMarketDataGateway,
    private readonly audit: PaperOrderAudit,
  ) {}

  async list(workspaceId: string): Promise<PaperOrderListView> {
    const orders = await this.orders.listByWorkspace(workspaceId);
    return toPaperOrderListView(orders);
  }

  async get(workspaceId: string, orderId: string): Promise<PaperOrderView> {
    const order = await this.requireOrder(workspaceId, orderId);
    return toPaperOrderView(order);
  }

  async create(command: CreatePaperOrderCommand): Promise<PaperOrderView> {
    const orderId = randomUUID();
    try {
      const account = await this.requireActiveAccount(command.workspaceId, command.paperAccountId);
      this.assertMarketData(command.workspaceId, command.exchange, command.symbol);
      const now = new Date().toISOString();
      const order = createPaperOrder({
        id: orderId,
        workspaceId: command.workspaceId,
        paperAccountId: account.id,
        exchange: command.exchange,
        symbol: command.symbol,
        side: command.side,
        orderType: command.orderType,
        quantity: command.quantity,
        limitPrice: command.limitPrice,
        stopPrice: command.stopPrice,
        status: command.asDraft ? 'DRAFT' : 'PENDING',
        createdAt: now,
      });
      const created = await this.orders.create(order);
      await this.audit.record({
        outcome: 'paper_order_created',
        workspaceId: created.workspaceId,
        actorUserId: command.actorUserId,
        paperOrderId: created.id,
        status: created.status,
        exchange: created.exchange,
        symbol: created.symbol,
      });
      return toPaperOrderView(created);
    } catch (error) {
      await this.audit.record({
        outcome: 'paper_order_rejected',
        workspaceId: command.workspaceId,
        actorUserId: command.actorUserId,
        paperOrderId: orderId,
        status: 'REJECTED',
        exchange: command.exchange?.toUpperCase(),
        symbol: command.symbol?.toUpperCase(),
        reason: error instanceof Error ? error.message : 'paper order rejected',
      });
      throw error instanceof PaperOrderValidationError
        ? error
        : new PaperOrderValidationError(
            error instanceof Error ? error.message : 'paper order rejected',
          );
    }
  }

  async update(command: UpdatePaperOrderCommand): Promise<PaperOrderView> {
    const existing = await this.requireOrder(command.workspaceId, command.orderId);
    const updatedAt = new Date().toISOString();
    try {
      const patched = updatePaperOrder(
        existing,
        {
          exchange: command.exchange,
          symbol: command.symbol,
          side: command.side,
          orderType: command.orderType,
          quantity: command.quantity,
          limitPrice: command.limitPrice,
          stopPrice: command.stopPrice,
        },
        updatedAt,
      );
      this.assertMarketData(patched.workspaceId, patched.exchange, patched.symbol);
      const saved = await this.orders.save(patched);
      await this.audit.record({
        outcome: 'paper_order_updated',
        workspaceId: saved.workspaceId,
        actorUserId: command.actorUserId,
        paperOrderId: saved.id,
        status: saved.status,
        exchange: saved.exchange,
        symbol: saved.symbol,
      });
      return toPaperOrderView(saved);
    } catch (error) {
      await this.audit.record({
        outcome: 'paper_order_rejected',
        workspaceId: existing.workspaceId,
        actorUserId: command.actorUserId,
        paperOrderId: existing.id,
        status: existing.status,
        exchange: existing.exchange,
        symbol: existing.symbol,
        reason: error instanceof Error ? error.message : 'paper order update rejected',
      });
      throw error instanceof PaperOrderValidationError || error instanceof PaperOrderNotFoundError
        ? error
        : new PaperOrderValidationError(
            error instanceof Error ? error.message : 'paper order update rejected',
          );
    }
  }

  async cancel(workspaceId: string, orderId: string, actorUserId: string): Promise<PaperOrderView> {
    const existing = await this.requireOrder(workspaceId, orderId);
    const cancelled = cancelPaperOrder(existing, new Date().toISOString());
    const saved = await this.orders.save(cancelled);
    await this.audit.record({
      outcome: 'paper_order_cancelled',
      workspaceId: saved.workspaceId,
      actorUserId,
      paperOrderId: saved.id,
      status: saved.status,
      exchange: saved.exchange,
      symbol: saved.symbol,
    });
    return toPaperOrderView(saved);
  }

  private assertMarketData(workspaceId: string, exchange: string, symbol: string): void {
    if (!this.marketData.isOfferedExchange(exchange)) {
      throw new PaperOrderValidationError(`unsupported exchange: ${exchange}`);
    }
    if (!this.marketData.isKnownSymbol(workspaceId, exchange, symbol)) {
      throw new PaperOrderValidationError(`unknown symbol: ${symbol}`);
    }
  }

  private async requireActiveAccount(workspaceId: string, paperAccountId?: string) {
    if (!workspaceId.trim()) {
      throw new PaperOrderValidationError('workspace id is required');
    }
    const account = await this.accounts.findByWorkspace(workspaceId);
    if (!account) {
      throw new PaperOrderValidationError('Paper Account is required');
    }
    if (paperAccountId && paperAccountId.trim() !== '' && paperAccountId.trim() !== account.id) {
      throw new PaperOrderValidationError('Paper Account does not belong to this workspace');
    }
    if (account.status !== 'ACTIVE') {
      throw new PaperOrderValidationError('Paper Account must be Active');
    }
    return account;
  }

  private async requireOrder(workspaceId: string, orderId: string): Promise<PaperOrder> {
    const order = await this.orders.findById(workspaceId, orderId);
    if (!order) {
      throw new PaperOrderNotFoundError(orderId);
    }
    return order;
  }
}

export class PaperOrderNotFoundError extends Error {
  constructor(readonly orderId: string) {
    super(`Paper Order not found: ${orderId}`);
    this.name = 'PaperOrderNotFoundError';
  }
}

export class PaperOrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaperOrderValidationError';
  }
}
