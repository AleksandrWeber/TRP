import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FinancialDecimal } from '../financial';
import { PortfolioService } from '../portfolio-engine';
import {
  closePosition,
  increasePosition,
  markPosition,
  openPosition,
  reducePosition,
  withUnrealizedPnL,
  type Position,
} from './domain/position';
import type { PositionHistory } from './domain/position-history';
import { isOpenPositionStatus } from './domain/position-status';
import { PositionCalculator } from './position-calculator';
import { PositionEventPublisher } from './position-event-publisher';
import {
  PositionImmutableError,
  PositionInvalidStateError,
  PositionNotFoundError,
  PositionPortfolioSyncError,
  PositionValidationError,
} from './position-errors';
import { PositionHistoryService } from './position-history.service';
import { POSITION_REPOSITORY, type PositionRepository } from './position.repository';

export type PositionView = Readonly<{
  id: string;
  portfolioId: string;
  symbol: string;
  side: string;
  status: string;
  quantity: string;
  entryPrice: string;
  markPrice: string;
  averageEntryPrice: string;
  realizedPnL: string;
  unrealizedPnL: string;
  exposure: string;
  positionValue: string;
  returnPercent: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}>;

export type PositionClock = Readonly<{
  now: () => Date;
  iso: () => string;
}>;

export type OpenPositionRequest = Readonly<{
  symbol: string;
  side: string;
  quantity: string;
  entryPrice: string;
  markPrice?: string;
}>;

export type IncreasePositionRequest = Readonly<{
  positionId: string;
  quantity: string;
  price: string;
}>;

export type ReducePositionRequest = Readonly<{
  positionId: string;
  quantity: string;
  price: string;
}>;

export type ClosePositionRequest = Readonly<{
  positionId: string;
  price: string;
}>;

export type MarkPriceRequest = Readonly<{
  positionId: string;
  markPrice: string;
}>;

/**
 * Position Engine application service (US205).
 * Single source of truth for trading position lifecycle.
 * Integrates with Portfolio via PortfolioService only.
 */
@Injectable()
export class PositionService {
  private clock: PositionClock = defaultClock();

  constructor(
    @Inject(POSITION_REPOSITORY) private readonly repository: PositionRepository,
    @Inject(PositionHistoryService) private readonly history: PositionHistoryService,
    @Inject(PositionEventPublisher) private readonly events: PositionEventPublisher,
    @Inject(PortfolioService) private readonly portfolios: PortfolioService,
  ) {}

  /** Test hook for deterministic timestamps. */
  setClock(clock: PositionClock): void {
    this.clock = clock;
  }

  async list(workspaceId: string, ownerId: string): Promise<PositionView[]> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const positions = await this.repository.listByPortfolioId(portfolioId);
    return positions.map((p) => this.toView(PositionCalculator.withDerivedMetrics(p)));
  }

  async listOpen(workspaceId: string, ownerId: string): Promise<PositionView[]> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const positions = await this.repository.listOpenByPortfolioId(portfolioId);
    return positions.map((p) => this.toView(PositionCalculator.withDerivedMetrics(p)));
  }

  async getById(workspaceId: string, ownerId: string, positionId: string): Promise<PositionView> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const position = await this.requirePosition(positionId, portfolioId);
    return this.toView(PositionCalculator.withDerivedMetrics(position));
  }

  async listHistory(
    workspaceId: string,
    ownerId: string,
    positionId?: string,
  ): Promise<PositionHistory[]> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    if (positionId) {
      await this.requirePosition(positionId, portfolioId);
      return this.history.listByPositionId(positionId);
    }
    return this.history.listByPortfolioId(portfolioId);
  }

  async open(
    workspaceId: string,
    ownerId: string,
    request: OpenPositionRequest,
  ): Promise<PositionView> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const now = this.clock.iso();
    let position: Position;
    try {
      position = openPosition({
        id: randomUUID(),
        portfolioId,
        symbol: request.symbol,
        side: request.side,
        quantity: request.quantity,
        entryPrice: request.entryPrice,
        markPrice: request.markPrice,
        createdAt: now,
        updatedAt: now,
      });
      position = PositionCalculator.withDerivedMetrics(position);
      PositionCalculator.assertValid(position);
    } catch (error) {
      throw this.wrapValidation(error, 'Invalid position open');
    }

    const created = await this.repository.create(position);
    await this.history.record({
      positionId: created.id,
      timestamp: now,
      action: 'OPENED',
      quantity: created.quantity,
      price: created.entryPrice,
      realizedPnL: '0',
    });
    await this.events.publish({
      eventType: 'PositionOpened',
      positionId: created.id,
      occurredAt: now,
      portfolioId: created.portfolioId,
      symbol: created.symbol,
      side: created.side,
      quantity: created.quantity,
      entryPrice: created.entryPrice,
    });
    await this.events.publish({
      eventType: 'PositionUpdated',
      positionId: created.id,
      occurredAt: now,
      status: created.status,
      quantity: created.quantity,
    });
    await this.events.publish({
      eventType: 'PnLUpdated',
      positionId: created.id,
      occurredAt: now,
      realizedPnL: created.realizedPnL,
      unrealizedPnL: created.unrealizedPnL,
    });
    await this.syncPortfolio(workspaceId, ownerId);
    return this.toView(created);
  }

  async increase(
    workspaceId: string,
    ownerId: string,
    request: IncreasePositionRequest,
  ): Promise<PositionView> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const existing = await this.requireMutablePosition(request.positionId, portfolioId);
    const now = this.clock.iso();
    let next: Position;
    try {
      next = increasePosition(existing, {
        quantity: request.quantity,
        price: request.price,
        updatedAt: now,
      });
      next = PositionCalculator.withDerivedMetrics(next);
      PositionCalculator.assertValid(next);
    } catch (error) {
      throw this.wrapValidation(error, 'Invalid position increase');
    }

    const saved = await this.repository.save(next);
    await this.history.record({
      positionId: saved.id,
      timestamp: now,
      action: 'INCREASED',
      quantity: request.quantity,
      price: request.price,
      realizedPnL: '0',
    });
    await this.events.publish({
      eventType: 'PositionIncreased',
      positionId: saved.id,
      occurredAt: now,
      quantity: request.quantity,
      price: request.price,
      averageEntryPrice: saved.averageEntryPrice,
    });
    await this.events.publish({
      eventType: 'PositionUpdated',
      positionId: saved.id,
      occurredAt: now,
      status: saved.status,
      quantity: saved.quantity,
    });
    await this.events.publish({
      eventType: 'PnLUpdated',
      positionId: saved.id,
      occurredAt: now,
      realizedPnL: saved.realizedPnL,
      unrealizedPnL: saved.unrealizedPnL,
    });
    await this.syncPortfolio(workspaceId, ownerId);
    return this.toView(saved);
  }

  async reduce(
    workspaceId: string,
    ownerId: string,
    request: ReducePositionRequest,
  ): Promise<PositionView> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const existing = await this.requireMutablePosition(request.positionId, portfolioId);
    const now = this.clock.iso();
    let result: { position: Position; realizedDelta: string };
    try {
      result = reducePosition(existing, {
        quantity: request.quantity,
        price: request.price,
        updatedAt: now,
      });
      result = {
        ...result,
        position: PositionCalculator.withDerivedMetrics(result.position),
      };
      PositionCalculator.assertValid(result.position);
    } catch (error) {
      throw this.wrapValidation(error, 'Invalid position reduce');
    }

    const saved = await this.repository.save(result.position);
    const closed = saved.status === 'CLOSED';
    await this.history.record({
      positionId: saved.id,
      timestamp: now,
      action: closed ? 'CLOSED' : 'REDUCED',
      quantity: request.quantity,
      price: request.price,
      realizedPnL: result.realizedDelta,
    });

    if (closed) {
      await this.events.publish({
        eventType: 'PositionClosed',
        positionId: saved.id,
        occurredAt: now,
        price: request.price,
        realizedPnL: saved.realizedPnL,
      });
    } else {
      await this.events.publish({
        eventType: 'PositionReduced',
        positionId: saved.id,
        occurredAt: now,
        quantity: request.quantity,
        price: request.price,
        remainingQuantity: saved.quantity,
        realizedPnL: saved.realizedPnL,
      });
    }
    await this.events.publish({
      eventType: 'PositionUpdated',
      positionId: saved.id,
      occurredAt: now,
      status: saved.status,
      quantity: saved.quantity,
    });
    await this.events.publish({
      eventType: 'PnLUpdated',
      positionId: saved.id,
      occurredAt: now,
      realizedPnL: saved.realizedPnL,
      unrealizedPnL: saved.unrealizedPnL,
    });
    await this.syncPortfolio(workspaceId, ownerId);
    return this.toView(saved);
  }

  async close(
    workspaceId: string,
    ownerId: string,
    request: ClosePositionRequest,
  ): Promise<PositionView> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const existing = await this.requireMutablePosition(request.positionId, portfolioId);
    const now = this.clock.iso();
    let result: { position: Position; realizedDelta: string };
    try {
      result = closePosition(existing, {
        price: request.price,
        updatedAt: now,
      });
      result = {
        ...result,
        position: PositionCalculator.withDerivedMetrics(result.position),
      };
      PositionCalculator.assertValid(result.position);
    } catch (error) {
      throw this.wrapValidation(error, 'Invalid position close');
    }

    const saved = await this.repository.save(result.position);
    await this.history.record({
      positionId: saved.id,
      timestamp: now,
      action: 'CLOSED',
      quantity: existing.quantity,
      price: request.price,
      realizedPnL: result.realizedDelta,
    });
    await this.events.publish({
      eventType: 'PositionClosed',
      positionId: saved.id,
      occurredAt: now,
      price: request.price,
      realizedPnL: saved.realizedPnL,
    });
    await this.events.publish({
      eventType: 'PositionUpdated',
      positionId: saved.id,
      occurredAt: now,
      status: saved.status,
      quantity: saved.quantity,
    });
    await this.events.publish({
      eventType: 'PnLUpdated',
      positionId: saved.id,
      occurredAt: now,
      realizedPnL: saved.realizedPnL,
      unrealizedPnL: saved.unrealizedPnL,
    });
    await this.syncPortfolio(workspaceId, ownerId);
    return this.toView(saved);
  }

  async markPrice(
    workspaceId: string,
    ownerId: string,
    request: MarkPriceRequest,
  ): Promise<PositionView> {
    const portfolioId = await this.requirePortfolioId(workspaceId, ownerId);
    const existing = await this.requireMutablePosition(request.positionId, portfolioId);
    const now = this.clock.iso();
    let next: Position;
    try {
      next = markPosition(existing, {
        markPrice: request.markPrice,
        updatedAt: now,
      });
      next = PositionCalculator.withDerivedMetrics(next);
      PositionCalculator.assertValid(next);
    } catch (error) {
      throw this.wrapValidation(error, 'Invalid mark price update');
    }

    const saved = await this.repository.save(next);
    await this.history.record({
      positionId: saved.id,
      timestamp: now,
      action: 'MARKED',
      quantity: saved.quantity,
      price: saved.markPrice,
      realizedPnL: '0',
    });
    await this.events.publish({
      eventType: 'PositionMarked',
      positionId: saved.id,
      occurredAt: now,
      markPrice: saved.markPrice,
      unrealizedPnL: saved.unrealizedPnL,
    });
    await this.events.publish({
      eventType: 'PnLUpdated',
      positionId: saved.id,
      occurredAt: now,
      realizedPnL: saved.realizedPnL,
      unrealizedPnL: saved.unrealizedPnL,
    });
    await this.syncPortfolio(workspaceId, ownerId);
    return this.toView(saved);
  }

  private async syncPortfolio(workspaceId: string, ownerId: string): Promise<void> {
    const portfolio = await this.portfolios.getOrCreate(workspaceId, ownerId);
    const positions = await this.repository.listByPortfolioId(portfolio.id);

    let realized = FinancialDecimal.zero();
    let unrealized = FinancialDecimal.zero();
    let exposure = FinancialDecimal.zero();

    for (const raw of positions) {
      const position = PositionCalculator.withDerivedMetrics(raw);
      if (position.unrealizedPnL !== raw.unrealizedPnL) {
        await this.repository.save(withUnrealizedPnL(raw, position.unrealizedPnL));
      }
      realized = realized.plus(position.realizedPnL);
      if (isOpenPositionStatus(position.status)) {
        unrealized = unrealized.plus(position.unrealizedPnL);
        exposure = exposure.plus(PositionCalculator.calculateExposure(position));
      }
    }

    try {
      await this.portfolios.applyFinancials(workspaceId, {
        cash: portfolio.balance.cash,
        realizedPnL: realized.toString(),
        unrealizedPnL: unrealized.toString(),
        usedMargin: exposure.toString(),
      });
    } catch (error) {
      throw new PositionPortfolioSyncError(
        error instanceof Error ? error.message : 'Failed to sync portfolio financials',
        error,
      );
    }
  }

  private async requirePortfolioId(workspaceId: string, ownerId: string): Promise<string> {
    const portfolio = await this.portfolios.getOrCreate(workspaceId, ownerId);
    return portfolio.id;
  }

  private async requirePosition(positionId: string, portfolioId: string): Promise<Position> {
    const position = await this.repository.findById(positionId);
    if (!position || position.portfolioId !== portfolioId) {
      throw new PositionNotFoundError();
    }
    return position;
  }

  private async requireMutablePosition(positionId: string, portfolioId: string): Promise<Position> {
    const position = await this.requirePosition(positionId, portfolioId);
    if (position.status === 'CLOSED' || position.status === 'LIQUIDATED') {
      throw new PositionImmutableError();
    }
    return position;
  }

  private wrapValidation(error: unknown, fallback: string): Error {
    if (error instanceof PositionInvalidStateError) return error;
    if (error instanceof PositionImmutableError) return error;
    if (error instanceof Error && error.message.includes('immutable')) {
      return new PositionImmutableError(error.message);
    }
    return new PositionValidationError(error instanceof Error ? error.message : fallback, error);
  }

  private toView(position: Position): PositionView {
    PositionCalculator.assertValid(position);
    return Object.freeze({
      id: position.id,
      portfolioId: position.portfolioId,
      symbol: position.symbol,
      side: position.side,
      status: position.status,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      markPrice: position.markPrice,
      averageEntryPrice: position.averageEntryPrice,
      realizedPnL: position.realizedPnL,
      unrealizedPnL: PositionCalculator.calculateUnrealizedPnL(position),
      exposure: PositionCalculator.calculateExposure(position),
      positionValue: PositionCalculator.calculatePositionValue(position),
      returnPercent: PositionCalculator.calculateReturnPercent(position),
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
      closedAt: position.closedAt,
    });
  }
}

function defaultClock(): PositionClock {
  return {
    now: () => new Date(),
    iso: () => new Date().toISOString(),
  };
}
