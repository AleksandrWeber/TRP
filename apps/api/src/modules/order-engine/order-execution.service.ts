import { Inject, Injectable } from '@nestjs/common';
import { FinancialDecimal } from '../financial';
import { PortfolioService } from '../portfolio-engine';
import { PositionService, type PositionView } from '../position-engine';
import { applyOrderFill, type Order } from './domain/order';
import type { OrderFill } from './domain/order-fill';
import { OrderEventPublisher } from './order-event-publisher';
import {
  OrderInvalidStateError,
  OrderPositionSyncError,
  OrderValidationError,
} from './order-errors';
import { OrderFillService } from './order-fill.service';
import { OrderHistoryService } from './order-history.service';
import { ORDER_REPOSITORY, type OrderRepository } from './order.repository';

export type ExecuteFillRequest = Readonly<{
  quantity?: string;
  price: string;
  fee?: string;
}>;

export type ExecuteFillResult = Readonly<{
  order: Order;
  fill: OrderFill;
  position: PositionView | null;
}>;

/**
 * OrderExecutionService — simulated fills, position updates, portfolio sync (US206).
 * No exchange communication. Position/Portfolio mutated only via public service APIs.
 */
@Injectable()
export class OrderExecutionService {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repository: OrderRepository,
    @Inject(OrderFillService) private readonly fills: OrderFillService,
    @Inject(OrderHistoryService) private readonly history: OrderHistoryService,
    @Inject(OrderEventPublisher) private readonly events: OrderEventPublisher,
    @Inject(PositionService) private readonly positions: PositionService,
    @Inject(PortfolioService) private readonly portfolios: PortfolioService,
  ) {}

  async execute(
    workspaceId: string,
    ownerId: string,
    order: Order,
    request: ExecuteFillRequest,
    now: string,
  ): Promise<ExecuteFillResult> {
    // Ensure portfolio exists (PositionService also does this; explicit for clarity).
    await this.portfolios.getOrCreate(workspaceId, ownerId);

    const fillQty =
      request.quantity !== undefined && request.quantity !== ''
        ? request.quantity
        : order.remainingQuantity;

    let applied: { order: Order; fillQuantity: string };
    try {
      applied = applyOrderFill(order, {
        quantity: fillQty,
        price: request.price,
        updatedAt: now,
      });
    } catch (error) {
      throw new OrderValidationError(
        error instanceof Error ? error.message : 'Invalid fill',
        error,
      );
    }

    const previousStatus = order.status;
    let position: PositionView | null = null;
    try {
      position = await this.applyPositionUpdate(
        workspaceId,
        ownerId,
        applied.order,
        applied.fillQuantity,
        request.price,
      );
    } catch (error) {
      throw new OrderPositionSyncError(
        error instanceof Error ? error.message : 'Failed to update position',
        error,
      );
    }

    const nextOrder =
      position !== null
        ? Object.freeze({ ...applied.order, positionId: position.id })
        : applied.order;

    const saved = await this.repository.save(nextOrder);
    const fill = await this.fills.generate({
      orderId: saved.id,
      timestamp: now,
      quantity: applied.fillQuantity,
      price: request.price,
      fee: request.fee ?? '0',
    });

    await this.history.record({
      orderId: saved.id,
      timestamp: now,
      previousStatus,
      currentStatus: saved.status,
      reason:
        saved.status === 'FILLED'
          ? `filled ${applied.fillQuantity} @ ${request.price}`
          : `partial fill ${applied.fillQuantity} @ ${request.price}`,
    });

    if (saved.status === 'FILLED') {
      await this.events.publish({
        eventType: 'OrderFilled',
        orderId: saved.id,
        occurredAt: now,
        fillQuantity: applied.fillQuantity,
        fillPrice: request.price,
        executedPrice: saved.executedPrice ?? request.price,
        filledQuantity: saved.filledQuantity,
      });
    } else {
      await this.events.publish({
        eventType: 'OrderPartiallyFilled',
        orderId: saved.id,
        occurredAt: now,
        fillQuantity: applied.fillQuantity,
        fillPrice: request.price,
        filledQuantity: saved.filledQuantity,
        remainingQuantity: saved.remainingQuantity,
      });
    }

    await this.events.publish({
      eventType: 'OrderUpdated',
      orderId: saved.id,
      occurredAt: now,
      status: saved.status,
      filledQuantity: saved.filledQuantity,
      remainingQuantity: saved.remainingQuantity,
    });

    return Object.freeze({ order: saved, fill, position });
  }

  /**
   * Maps order side to position mutations via PositionService only.
   * BUY prefers closing SHORT then opening/increasing LONG.
   * SELL prefers closing LONG then opening/increasing SHORT.
   */
  private async applyPositionUpdate(
    workspaceId: string,
    ownerId: string,
    order: Order,
    fillQuantity: string,
    price: string,
  ): Promise<PositionView> {
    const open = await this.positions.listOpen(workspaceId, ownerId);
    const qty = FinancialDecimal.from(fillQuantity);

    if (order.side === 'BUY') {
      const short = open.find((p) => p.symbol === order.symbol && p.side === 'SHORT');
      if (short) {
        return this.reduceOrClose(workspaceId, ownerId, short, qty, price);
      }
      const long = open.find((p) => p.symbol === order.symbol && p.side === 'LONG');
      if (long) {
        return this.positions.increase(workspaceId, ownerId, {
          positionId: long.id,
          quantity: fillQuantity,
          price,
        });
      }
      return this.positions.open(workspaceId, ownerId, {
        symbol: order.symbol,
        side: 'LONG',
        quantity: fillQuantity,
        entryPrice: price,
        markPrice: price,
      });
    }

    if (order.side === 'SELL') {
      const long = open.find((p) => p.symbol === order.symbol && p.side === 'LONG');
      if (long) {
        return this.reduceOrClose(workspaceId, ownerId, long, qty, price);
      }
      const short = open.find((p) => p.symbol === order.symbol && p.side === 'SHORT');
      if (short) {
        return this.positions.increase(workspaceId, ownerId, {
          positionId: short.id,
          quantity: fillQuantity,
          price,
        });
      }
      return this.positions.open(workspaceId, ownerId, {
        symbol: order.symbol,
        side: 'SHORT',
        quantity: fillQuantity,
        entryPrice: price,
        markPrice: price,
      });
    }

    throw new OrderInvalidStateError(`unsupported order side: ${order.side}`);
  }

  private async reduceOrClose(
    workspaceId: string,
    ownerId: string,
    position: PositionView,
    fillQty: FinancialDecimal,
    price: string,
  ): Promise<PositionView> {
    const positionQty = FinancialDecimal.from(position.quantity);
    if (fillQty.compare(positionQty) >= 0) {
      const closed = await this.positions.close(workspaceId, ownerId, {
        positionId: position.id,
        price,
      });
      const leftover = fillQty.minus(positionQty);
      if (leftover.isPositive()) {
        // Flip: remaining fill opens opposite side.
        const opposite = position.side === 'LONG' ? 'SHORT' : 'LONG';
        return this.positions.open(workspaceId, ownerId, {
          symbol: position.symbol,
          side: opposite,
          quantity: leftover.toString(),
          entryPrice: price,
          markPrice: price,
        });
      }
      return closed;
    }
    return this.positions.reduce(workspaceId, ownerId, {
      positionId: position.id,
      quantity: fillQty.toString(),
      price,
    });
  }
}
