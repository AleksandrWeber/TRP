import { describe, expect, it, vi } from 'vitest';
import { OrderStatus } from '../orders/domain/order-status';
import { createOrder } from '../orders/domain/order';
import { createOrderIntent, OrderSide, OrderType } from '../orders/domain/order-intent';
import { RiskDecisionStatus } from '../risk';
import { CanonicalOrderPathService } from './canonical-order-path.service';

const t0 = '2026-07-29T17:00:00.000Z';
const t1 = '2026-07-29T17:00:01.000Z';

function strategyOrder() {
  return createOrder(
    createOrderIntent({
      clientOrderId: 'si_cccccccccccccccccccccccccccccccc',
      idempotencyKey: 'signal-intent:' + 'e'.repeat(64),
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      tradingSessionId: 'session-1',
      sessionFencingToken: 3,
      mode: 'paper',
      origin: 'strategy',
      signalIntentId: 'si_cccccccccccccccccccccccccccccccc',
      signalIntentHash: 'e'.repeat(64),
      instrument: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      quantity: '0.1',
      marketCheckpoint: {
        streamId: 'binance:BTCUSDT:1m',
        sequence: 9,
        eventId: 'market-event-9',
      },
      actorId: 'runtime-1',
      occurredAt: t0,
      recordedAt: t0,
    }),
  );
}

function riskSnapshot() {
  return {
    account: {
      id: 'account-1',
      workspaceId: 'workspace-1',
      mode: 'paper',
      status: 'active',
      version: 1,
    },
    session: {
      id: 'session-1',
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      status: 'running',
      version: 1,
      fencingToken: 3,
      reconciled: true,
    },
    market: {
      workspaceId: 'workspace-1',
      streamId: 'binance:BTCUSDT:1m',
      eventId: 'market-event-9',
      sequence: 9,
      instrument: 'BTCUSDT',
      health: 'healthy',
      referencePrice: '100',
      occurredAt: t0,
      projectionVersion: 9,
    },
    cash: {
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      currency: 'USDT',
      availableCash: '10000',
      version: 1,
      reconciled: true,
    },
    reservation: null,
    position: null,
    portfolio: {
      workspaceId: 'workspace-1',
      paperAccountId: 'account-1',
      checkpointId: 'pf-1',
      version: 1,
      reconciled: true,
    },
    duplicateIntent: false,
    unresolvedReconciliation: false,
  };
}

describe('US222 — CanonicalOrderPathService', () => {
  it('rejects non-strategy Orders when requireStrategyOrigin is set', async () => {
    const manual = createOrder(
      createOrderIntent({
        clientOrderId: 'manual-1',
        idempotencyKey: 'manual-1',
        workspaceId: 'workspace-1',
        paperAccountId: 'account-1',
        tradingSessionId: 'session-1',
        sessionFencingToken: 1,
        mode: 'paper',
        origin: 'manual',
        instrument: 'BTCUSDT',
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        quantity: '1',
        marketCheckpoint: { streamId: 's', sequence: 1, eventId: 'e' },
        actorId: 'trader',
        occurredAt: t0,
        recordedAt: t0,
      }),
    );
    const service = new CanonicalOrderPathService(
      { get: async () => manual } as never,
      { evaluate: vi.fn() } as never,
      { reserveCash: vi.fn() } as never,
      { submit: vi.fn() } as never,
    );
    await expect(
      service.advanceToExecutable({
        workspaceId: 'workspace-1',
        orderId: manual.id,
        actorId: 'path',
        evaluatedAt: t1,
        recordedAt: t1,
        risk: riskSnapshot(),
        reservation: { currency: 'USDT', amount: '10' },
        requireStrategyOrigin: true,
      }),
    ).rejects.toThrow(/origin strategy/);
  });

  it('advances strategy Order through Risk to EXECUTABLE preserving Signal Intent', async () => {
    const proposed = strategyOrder();
    const states = [proposed];
    const orders = {
      get: vi.fn(async () => states.at(-1)!),
      transition: vi.fn(async (command: { toStatus: OrderStatus; riskDecision?: unknown }) => {
        const next = Object.freeze({
          ...states.at(-1)!,
          status: command.toStatus,
          version: states.at(-1)!.version + 1,
          riskDecision:
            (command.riskDecision as typeof proposed.riskDecision) ?? states.at(-1)!.riskDecision,
          reservationId:
            command.toStatus === OrderStatus.RESERVED || command.toStatus === OrderStatus.EXECUTABLE
              ? 'res-1'
              : states.at(-1)!.reservationId,
        });
        states.push(next as typeof proposed);
        return next;
      }),
    };
    const decision = {
      id: 'risk-1',
      status: RiskDecisionStatus.APPROVED,
      workspaceId: 'workspace-1',
      orderId: proposed.id,
      intentHash: proposed.intent.intentHash,
      policyId: 'm2-baseline-paper-risk',
      policyVersion: 1,
      policyHash: 'policy',
      inputHash: 'input',
      ruleResults: [],
      reasons: [],
      evaluatedAt: t1,
      expiresAt: '2026-07-29T17:00:31.000Z',
      recordedAt: t1,
      actorId: 'path',
      correlationId: null,
      input: {} as never,
    };
    const risk = { evaluate: vi.fn(async () => decision) };
    const cash = {
      reserveCash: vi.fn(async () => ({ id: 'res-1' })),
    };
    const execution = { submit: vi.fn() };
    const service = new CanonicalOrderPathService(
      orders as never,
      risk as never,
      cash as never,
      execution as never,
    );

    const result = await service.advanceToExecutable({
      workspaceId: 'workspace-1',
      orderId: proposed.id,
      actorId: 'path',
      evaluatedAt: t1,
      recordedAt: t1,
      risk: riskSnapshot(),
      reservation: { currency: 'USDT', amount: '10' },
      requireStrategyOrigin: true,
    });

    expect(result.outcome).toBe('executable');
    expect(result.order.status).toBe(OrderStatus.EXECUTABLE);
    expect(result.order.intent.origin).toBe('strategy');
    expect(result.order.intent.signalIntentId).toBe(proposed.intent.signalIntentId);
    expect(result.order.intent.signalIntentHash).toBe(proposed.intent.signalIntentHash);
    expect(risk.evaluate).toHaveBeenCalledOnce();
    const evaluateCalls = risk.evaluate.mock.calls as unknown as Array<
      [{ intent: { signalIntentHash: string } }]
    >;
    expect(evaluateCalls[0]?.[0].intent.signalIntentHash).toBe(proposed.intent.signalIntentHash);
    expect(cash.reserveCash).toHaveBeenCalledOnce();
    expect(execution.submit).not.toHaveBeenCalled();
  });

  it('runCanonicalPath submits through ExecutionEngine and is duplicate-safe', async () => {
    const executable = Object.freeze({
      ...strategyOrder(),
      status: OrderStatus.EXECUTABLE,
      version: 5,
      riskDecision: {
        id: 'risk-1',
        status: RiskDecisionStatus.APPROVED,
        workspaceId: 'workspace-1',
        orderId: 'ord',
        intentHash: 'hash',
        policyId: 'p',
        policyVersion: 1,
        policyHash: 'ph',
        inputHash: 'ih',
        evaluatedAt: t1,
        expiresAt: '2026-07-29T17:00:31.000Z',
      },
      reservationId: 'res-1',
    });
    const filled = Object.freeze({
      ...executable,
      status: OrderStatus.FILLED,
      version: 7,
    });
    const orders = {
      get: vi.fn(async () => executable),
      transition: vi.fn(),
    };
    const execution = {
      submit: vi
        .fn()
        .mockResolvedValueOnce({
          order: filled,
          fill: { id: 'fill-1' },
          outcome: 'filled',
        })
        .mockResolvedValueOnce({
          order: filled,
          fill: { id: 'fill-1' },
          outcome: 'already_executed',
        }),
    };
    const service = new CanonicalOrderPathService(
      orders as never,
      { evaluate: vi.fn() } as never,
      { reserveCash: vi.fn() } as never,
      execution as never,
    );

    const command = {
      workspaceId: 'workspace-1',
      orderId: executable.id,
      actorId: 'path',
      evaluatedAt: t1,
      recordedAt: t1,
      occurredAt: t1,
      risk: riskSnapshot(),
      reservation: { currency: 'USDT', amount: '10' },
      requireStrategyOrigin: true,
      marketState: {
        streamId: 'binance:BTCUSDT:1m',
        eventId: 'market-event-9',
        sequence: 9,
        referencePrice: '100',
        occurredAt: t0,
      },
    };

    const first = await service.runCanonicalPath(command);
    const second = await service.runCanonicalPath(command);

    expect(first.outcome).toBe('filled');
    expect(first.order.intent.signalIntentId).toBe(executable.intent.signalIntentId);
    expect(second.outcome).toBe('already_executed');
    expect(execution.submit).toHaveBeenCalledTimes(2);
  });
});
