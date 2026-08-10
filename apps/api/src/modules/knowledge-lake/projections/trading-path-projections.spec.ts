import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toDurableEventId, type DurableEventEnvelope } from '../../event-processing';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../ingestion/in-memory-knowledge-lake-ingestion.adapter';
import type { AdmitResult, AnalyticalFactAdmission } from '../domain/analytical-fact-admission';
import type { KnowledgeLakeIngestionPort } from '../ports/knowledge-lake-ingestion.port';
import { bestEffortAdmit } from './best-effort-admit';
import { KnowledgeLakeTradingPathOutboxConsumer } from './knowledge-lake-trading-path-outbox.consumer';
import {
  ExecutionFillLakeProjectionAdapter,
  OrdersLakeProjectionAdapter,
  PaperTradingLakeProjectionAdapter,
  RiskLakeProjectionAdapter,
  TradingSessionLakeProjectionAdapter,
} from './trading-path-projection.adapters';

function envelope(
  overrides: Partial<DurableEventEnvelope> &
    Pick<DurableEventEnvelope, 'eventType' | 'aggregateType' | 'aggregateId'>,
): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId(
      overrides.eventId ??
        `${overrides.aggregateType}:${overrides.aggregateId}:${overrides.eventType}`,
    ),
    schemaVersion: 1,
    aggregateVersion: 1,
    workspaceId: 'ws-1',
    occurredAt: '2026-08-10T12:00:00.000Z',
    recordedAt: '2026-08-10T12:00:01.000Z',
    payload: Object.freeze({}),
    ...overrides,
  });
}

function buildConsumer(ingestion: KnowledgeLakeIngestionPort) {
  return new KnowledgeLakeTradingPathOutboxConsumer(
    { register: () => undefined } as never,
    new TradingSessionLakeProjectionAdapter(ingestion),
    new OrdersLakeProjectionAdapter(ingestion),
    new RiskLakeProjectionAdapter(ingestion),
    new PaperTradingLakeProjectionAdapter(ingestion),
    new ExecutionFillLakeProjectionAdapter(ingestion),
  );
}

describe('RC-21 Epic 3 — trading-path Lake projections', () => {
  it('admits analytical facts from every trading-path producer', async () => {
    const lake = new InMemoryKnowledgeLakeIngestionAdapter();
    const consumer = buildConsumer(lake);

    const events: DurableEventEnvelope[] = [
      envelope({
        eventType: 'TradingSessionStarted',
        aggregateType: 'TradingSession',
        aggregateId: 'session-1',
        payload: Object.freeze({ sessionId: 'session-1', toStatus: 'RUNNING' }),
      }),
      envelope({
        eventType: 'OrderProposed',
        aggregateType: 'Order',
        aggregateId: 'order-1',
        payload: Object.freeze({
          orderId: 'order-1',
          tradingSessionId: 'session-1',
        }),
      }),
      envelope({
        eventType: 'RiskDecisionApproved',
        aggregateType: 'RiskDecision',
        aggregateId: 'decision-1',
        payload: Object.freeze({ status: 'approved', orderId: 'order-1' }),
      }),
      envelope({
        eventType: 'PaperAccountCreated',
        aggregateType: 'PaperAccount',
        aggregateId: 'pa-1',
        payload: Object.freeze({ accountId: 'pa-1', mode: 'paper' }),
      }),
      envelope({
        eventType: 'OrderFillRecorded',
        aggregateType: 'Fill',
        aggregateId: 'fill-1',
        payload: Object.freeze({
          fillId: 'fill-1',
          orderId: 'order-1',
          tradingSessionId: 'session-1',
        }),
      }),
    ];

    for (const event of events) {
      await consumer.handle(event);
    }

    expect(lake.peekSize()).toBe(5);
    const producers = events.map((event) => lake.peekByEventId(event.eventId)?.producer);
    expect(producers).toEqual([
      'trading-session',
      'orders',
      'risk-engine',
      'paper-trading',
      'execution-engine',
    ]);
  });

  it('stores immutable analytical copies only', async () => {
    const lake = new InMemoryKnowledgeLakeIngestionAdapter();
    const consumer = buildConsumer(lake);
    const event = envelope({
      eventType: 'OrderFilled',
      aggregateType: 'Order',
      aggregateId: 'order-2',
      payload: Object.freeze({
        orderId: 'order-2',
        toStatus: 'FILLED',
        tradingSessionId: 'session-1',
      }),
    });

    await consumer.handle(event);
    const stored = lake.peekByEventId(event.eventId);
    expect(stored).toBeDefined();
    expect(Object.isFrozen(stored)).toBe(true);
    expect(Object.isFrozen(stored?.payload)).toBe(true);
    expect(() => {
      (stored as { producer: string }).producer = 'ledger';
    }).toThrow();
  });

  it('continues when Lake ingestion is unavailable (in-memory adapter throws)', async () => {
    const unavailable: KnowledgeLakeIngestionPort = {
      admit(): AdmitResult {
        throw new Error('knowledge lake unavailable');
      },
      admitMany(): AdmitResult[] {
        throw new Error('knowledge lake unavailable');
      },
    };
    const consumer = buildConsumer(unavailable);

    await expect(
      consumer.handle(
        envelope({
          eventType: 'TradingSessionStopped',
          aggregateType: 'TradingSession',
          aggregateId: 'session-9',
        }),
      ),
    ).resolves.toBeUndefined();

    // Producer SoT path is independent: bestEffortAdmit swallows Lake failures.
    const result = bestEffortAdmit(unavailable, {
      eventId: 'evt-x',
      occurredAt: '2026-08-10T12:00:00.000Z',
      producer: 'orders',
      category: 'Trading',
      mode: 'paper',
      workspaceId: 'ws-1',
      payload: {},
      schemaVersion: '1',
    } satisfies AnalyticalFactAdmission);
    expect(result).toBeNull();
  });

  it('does not import SoT command modules into Lake projection adapters', () => {
    const root = join(__dirname);
    const files = [
      'trading-path-projection.adapters.ts',
      'knowledge-lake-trading-path-outbox.consumer.ts',
      'project-trading-path-envelope.ts',
    ];
    for (const file of files) {
      const source = readFileSync(join(root, file), 'utf8');
      expect(source).not.toMatch(/from '\.\.\/\.\.\/trading-session'/);
      expect(source).not.toMatch(/from '\.\.\/\.\.\/orders'/);
      expect(source).not.toMatch(/from '\.\.\/\.\.\/risk'/);
      expect(source).not.toMatch(/from '\.\.\/\.\.\/paper-account'/);
      expect(source).not.toMatch(/from '\.\.\/\.\.\/execution-engine'/);
      expect(source).not.toMatch(
        /TradingSessionService|OrderService|RiskDecisionService|ExecutionEngineService/,
      );
    }
  });

  it('does not wire Knowledge Lake into trading-path SoT modules (no feedback)', () => {
    const modulesRoot = join(__dirname, '..', '..');
    const sotFiles = [
      'trading-session/trading-session.service.ts',
      'orders/order.service.ts',
      'risk/risk-decision.service.ts',
      'paper-account/paper-account.service.ts',
      'execution-engine/execution-engine.service.ts',
    ];
    for (const file of sotFiles) {
      const source = readFileSync(join(modulesRoot, file), 'utf8');
      expect(source).not.toMatch(/knowledge-lake|KnowledgeLake|KNOWLEDGE_LAKE/);
    }
  });
});
