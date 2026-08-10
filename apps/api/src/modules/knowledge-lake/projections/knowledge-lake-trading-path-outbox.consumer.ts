import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { OutboxDispatcher, type DurableEventEnvelope } from '../../event-processing';
import {
  ExecutionFillLakeProjectionAdapter,
  OrdersLakeProjectionAdapter,
  PaperTradingLakeProjectionAdapter,
  RiskLakeProjectionAdapter,
  TradingSessionLakeProjectionAdapter,
} from './trading-path-projection.adapters';

/**
 * RC-21 Epic 3 — one-way trading-path outbox → Knowledge Lake.
 *
 * Registers a single outbox consumer that fans into thin producer adapters.
 * Adapters never throw (best-effort admit). SoT producers are not imported.
 * No query port, persistence product, retries, or feedback into command ports.
 */
@Injectable()
export class KnowledgeLakeTradingPathOutboxConsumer implements OnModuleInit {
  constructor(
    @Inject(OutboxDispatcher)
    private readonly dispatcher: OutboxDispatcher,
    private readonly tradingSession: TradingSessionLakeProjectionAdapter,
    private readonly orders: OrdersLakeProjectionAdapter,
    private readonly risk: RiskLakeProjectionAdapter,
    private readonly paper: PaperTradingLakeProjectionAdapter,
    private readonly executionFill: ExecutionFillLakeProjectionAdapter,
  ) {}

  onModuleInit(): void {
    this.dispatcher.register({
      consumerId: 'rc21-knowledge-lake-trading-path',
      handle: (event) => this.handle(event),
    });
  }

  async handle(event: DurableEventEnvelope): Promise<void> {
    // Never throw — projection must not fail outbox delivery for peer consumers.
    try {
      this.tradingSession.project(event);
      this.orders.project(event);
      this.risk.project(event);
      this.paper.project(event);
      this.executionFill.project(event);
    } catch {
      // Defensive: adapters already best-effort; swallow unexpected failures.
    }
  }
}
