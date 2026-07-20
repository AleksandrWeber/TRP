import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  applyDeterministicSlippage,
  createExecutionPolicy,
  type ExecutionPolicy,
  type ExecutionSide,
} from '../execution-simulator';
import { FinancialDecimal } from '../financial';
import { OrderService, type CreateOrderRequest, type OrderView } from '../order-engine';
import { PortfolioService } from '../portfolio-engine';
import { createPaperExecution, type PaperExecution } from './domain/paper-execution';
import type { PaperSession } from './domain/paper-session';
import { PaperEventPublisher } from './paper-event-publisher';
import { PaperSessionManager } from './paper-session-manager';
import {
  PaperExecutionFailedError,
  PaperOrderRejectedError,
  PaperSessionInvalidStateError,
  PaperSessionValidationError,
} from './paper-trading-errors';
import { PAPER_TRADING_REPOSITORY, type PaperTradingRepository } from './paper-trading.repository';

export type PaperTradeRequest = Readonly<{
  symbol: string;
  side: string;
  type: string;
  quantity: string;
  requestedPrice?: string | null;
  timeInForce?: string;
  marketPrice?: string;
  executionPolicy?: Partial<ExecutionPolicy>;
}>;

export type PaperTradeResult = Readonly<{
  session: PaperSession;
  order: OrderView;
  execution: PaperExecution | null;
}>;

const DEFAULT_POLICY = createExecutionPolicy({
  allowPartialFill: false,
  deterministicSlippage: 0,
  fixedCommission: 0,
});

/**
 * PaperExecutionCoordinator — orchestrates Order → Risk → Execution → Position → Portfolio (US208).
 * Does not mutate Portfolio/Position directly; uses OrderService public APIs (which gate Risk).
 */
@Injectable()
export class PaperExecutionCoordinator {
  constructor(
    @Inject(PAPER_TRADING_REPOSITORY) private readonly repository: PaperTradingRepository,
    @Inject(PaperSessionManager) private readonly sessions: PaperSessionManager,
    @Inject(PaperEventPublisher) private readonly events: PaperEventPublisher,
    @Inject(OrderService) private readonly orders: OrderService,
    @Inject(PortfolioService) private readonly portfolios: PortfolioService,
  ) {}

  async executeTrade(
    workspaceId: string,
    ownerId: string,
    sessionId: string,
    request: PaperTradeRequest,
  ): Promise<PaperTradeResult> {
    const session = await this.sessions.requireSession(workspaceId, sessionId);
    if (session.status !== 'RUNNING') {
      throw new PaperSessionInvalidStateError(
        `trades require RUNNING session (current: ${session.status})`,
      );
    }
    if (session.ownerId !== ownerId) {
      throw new PaperSessionInvalidStateError('session owner mismatch');
    }

    const createRequest = this.toCreateOrderRequest(request);
    const order = await this.orders.create(session.portfolioWorkspaceKey, ownerId, createRequest);

    if (order.status === 'REJECTED') {
      throw new PaperOrderRejectedError(`order rejected by risk engine: ${order.id}`);
    }

    if (order.status !== 'PENDING' && order.status !== 'PARTIALLY_FILLED') {
      throw new PaperExecutionFailedError(`order not executable in status ${order.status}`);
    }

    const referencePrice = this.resolveReferencePrice(order, request);
    const policy =
      request.executionPolicy !== undefined
        ? createExecutionPolicy({
            allowPartialFill: request.executionPolicy.allowPartialFill === true,
            deterministicSlippage: request.executionPolicy.deterministicSlippage ?? 0,
            fixedCommission: request.executionPolicy.fixedCommission ?? 0,
          })
        : DEFAULT_POLICY;

    const side = normalizeExecutionSide(order.side);
    const executionPriceNumber = applyDeterministicSlippage(
      Number(referencePrice),
      side,
      policy.deterministicSlippage,
    );
    if (!Number.isFinite(executionPriceNumber) || executionPriceNumber < 0) {
      throw new PaperExecutionFailedError('invalid simulated execution price');
    }
    const executionPrice = FinancialDecimal.from(
      toCanonicalDecimal(executionPriceNumber),
    ).toString();
    const commission = FinancialDecimal.from(toCanonicalDecimal(policy.fixedCommission)).toString();
    const slippage = FinancialDecimal.from(
      toCanonicalDecimal(policy.deterministicSlippage),
    ).toString();

    let filled: OrderView;
    try {
      filled = await this.orders.execute(session.portfolioWorkspaceKey, ownerId, order.id, {
        price: executionPrice,
        fee: commission,
      });
    } catch (error) {
      throw new PaperExecutionFailedError(
        error instanceof Error ? error.message : 'Order execution failed',
        error,
      );
    }

    const now = filled.executedAt ?? filled.updatedAt;
    const execution = createPaperExecution({
      id: randomUUID(),
      sessionId: session.id,
      orderId: filled.id,
      executionTime: now,
      executionPrice,
      slippage,
      commission,
    });
    const savedExecution = await this.repository.createExecution(execution);

    await this.events.publish({
      eventType: 'PaperTradeExecuted',
      sessionId: session.id,
      occurredAt: now,
      orderId: filled.id,
      executionId: savedExecution.id,
      executionPrice: savedExecution.executionPrice,
      slippage: savedExecution.slippage,
      commission: savedExecution.commission,
    });

    const portfolio = await this.portfolios.getPortfolio(session.portfolioWorkspaceKey);
    const synced = await this.sessions.syncBalance(session, portfolio.equity.equity);

    return Object.freeze({
      session: synced,
      order: filled,
      execution: savedExecution,
    });
  }

  private toCreateOrderRequest(request: PaperTradeRequest): CreateOrderRequest {
    try {
      return {
        symbol: String(request.symbol ?? ''),
        side: String(request.side ?? ''),
        type: String(request.type ?? ''),
        quantity: String(request.quantity ?? ''),
        requestedPrice:
          request.requestedPrice === undefined || request.requestedPrice === null
            ? request.requestedPrice
            : String(request.requestedPrice),
        timeInForce: request.timeInForce !== undefined ? String(request.timeInForce) : undefined,
      };
    } catch (error) {
      throw new PaperSessionValidationError(
        error instanceof Error ? error.message : 'Invalid trade request',
        error,
      );
    }
  }

  private resolveReferencePrice(order: OrderView, request: PaperTradeRequest): string {
    if (request.marketPrice !== undefined && request.marketPrice !== '') {
      return FinancialDecimal.from(String(request.marketPrice))
        .assertPositive('marketPrice')
        .toString();
    }
    if (order.requestedPrice !== null && order.requestedPrice !== '') {
      return FinancialDecimal.from(order.requestedPrice)
        .assertPositive('requestedPrice')
        .toString();
    }
    throw new PaperSessionValidationError(
      'marketPrice or requestedPrice is required for paper execution',
    );
  }
}

function normalizeExecutionSide(side: string): ExecutionSide {
  const normalized = side.trim().toUpperCase();
  if (normalized === 'BUY' || normalized === 'SELL') return normalized;
  throw new PaperSessionValidationError(`unsupported order side: ${side}`);
}

function toCanonicalDecimal(value: number): string {
  if (!Number.isFinite(value)) throw new Error('non-finite decimal');
  // Avoid exponential form; trim trailing zeros while keeping at least one fraction digit when needed.
  const fixed = value
    .toFixed(18)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '');
  return fixed === '-0' ? '0' : fixed;
}
