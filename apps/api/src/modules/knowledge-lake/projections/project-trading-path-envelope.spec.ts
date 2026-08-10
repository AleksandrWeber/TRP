import { describe, expect, it } from 'vitest';
import { toDurableEventId, type DurableEventEnvelope } from '../../event-processing';
import { projectTradingPathEnvelope } from './project-trading-path-envelope';
import { KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS } from './trading-path-producer-registry';

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

describe('RC-21 Epic 3 — projectTradingPathEnvelope', () => {
  it('projects Trading Session lifecycle with trading-session producer identity', () => {
    const fact = projectTradingPathEnvelope(
      envelope({
        eventType: 'TradingSessionStarted',
        aggregateType: 'TradingSession',
        aggregateId: 'session-1',
        payload: Object.freeze({
          sessionId: 'session-1',
          toStatus: 'RUNNING',
        }),
      }),
    );
    expect(fact?.producer).toBe('trading-session');
    expect(fact?.category).toBe('Trading');
    expect(fact?.mode).toBe('paper');
    expect(fact?.tradingSessionId).toBe('session-1');
    expect(fact?.sourceRef).toEqual({
      ownerType: 'TradingSession',
      id: 'session-1',
    });
  });

  it('projects recovering/failed session markers as System', () => {
    const fact = projectTradingPathEnvelope(
      envelope({
        eventType: 'TradingSessionRecovering',
        aggregateType: 'TradingSession',
        aggregateId: 'session-2',
      }),
    );
    expect(fact?.category).toBe('System');
    expect(fact?.producer).toBe('trading-session');
  });

  it('skips session heartbeats (not in thin slice)', () => {
    expect(
      projectTradingPathEnvelope(
        envelope({
          eventType: 'TradingSessionLeaseHeartbeat',
          aggregateType: 'TradingSession',
          aggregateId: 'session-1',
        }),
      ),
    ).toBeNull();
  });

  it('projects Orders lifecycle with orders producer identity', () => {
    const fact = projectTradingPathEnvelope(
      envelope({
        eventType: 'OrderProposed',
        aggregateType: 'Order',
        aggregateId: 'order-1',
        payload: Object.freeze({
          orderId: 'order-1',
          tradingSessionId: 'session-1',
          toStatus: 'PROPOSED',
        }),
      }),
    );
    expect(fact?.producer).toBe('orders');
    expect(fact?.category).toBe('Trading');
    expect(fact?.tradingSessionId).toBe('session-1');
  });

  it('projects Risk decisions with risk-engine producer identity', () => {
    const fact = projectTradingPathEnvelope(
      envelope({
        eventType: 'RiskDecisionApproved',
        aggregateType: 'RiskDecision',
        aggregateId: 'decision-1',
        payload: Object.freeze({
          decisionId: 'decision-1',
          orderId: 'order-1',
          status: 'approved',
        }),
      }),
    );
    expect(fact?.producer).toBe('risk-engine');
    expect(fact?.category).toBe('Risk');
  });

  it('projects PaperAccount markers with paper-trading producer identity', () => {
    const fact = projectTradingPathEnvelope(
      envelope({
        eventType: 'PaperAccountCreated',
        aggregateType: 'PaperAccount',
        aggregateId: 'pa-1',
        payload: Object.freeze({
          accountId: 'pa-1',
          mode: 'paper',
          status: 'OPEN',
        }),
      }),
    );
    expect(fact?.producer).toBe('paper-trading');
    expect(fact?.category).toBe('Paper');
    expect(fact?.mode).toBe('paper');
  });

  it('projects Fill lineage with execution-engine producer identity', () => {
    const fact = projectTradingPathEnvelope(
      envelope({
        eventType: 'OrderFillRecorded',
        aggregateType: 'Fill',
        aggregateId: 'fill-1',
        payload: Object.freeze({
          fillId: 'fill-1',
          orderId: 'order-1',
          tradingSessionId: 'session-1',
          quantity: '1',
        }),
      }),
    );
    expect(fact?.producer).toBe('execution-engine');
    expect(fact?.category).toBe('Trading');
    expect(fact?.sourceRef).toEqual({ ownerType: 'Fill', id: 'fill-1' });
    expect((fact?.payload as { kind: string; sourcePayload: { fillId: string } }).kind).toBe(
      'trading_path_analytical_copy',
    );
    expect((fact?.payload as { sourcePayload: { fillId: string } }).sourcePayload.fillId).toBe(
      'fill-1',
    );
  });

  it('registers all five trading-path producers without feedback', () => {
    expect(KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS).toHaveLength(5);
    for (const row of KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS) {
      expect(row.direction).toBe('producer-to-lake');
      expect(row.feedbackToSoT).toBe(false);
    }
    expect(KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS.map((r) => r.producerId)).toEqual([
      'trading-session',
      'orders',
      'risk-engine',
      'paper-trading',
      'execution-engine',
    ]);
  });
});
