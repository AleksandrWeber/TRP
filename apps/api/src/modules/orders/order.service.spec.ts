import { describe, expect, it, vi } from 'vitest';
import { OrderStatus } from './domain/order-status';
import { OrderService } from './order.service';
import type { SignalIntentIntake } from './domain/propose-from-signal-intent';

const t0 = '2026-07-29T16:00:00.000Z';
const t1 = '2026-07-29T16:00:00.100Z';

const signal: SignalIntentIntake = {
  id: 'si_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  intentHash: 'd'.repeat(64),
  workspaceId: 'workspace-1',
  sessionId: 'session-1',
  instrument: 'BTCUSDT',
  direction: 'buy',
  marketCheckpoint: {
    streamId: 'binance:BTCUSDT:1m',
    sequence: 10,
    eventId: 'market-event-10',
  },
  generatedAt: t0,
  actorId: 'runtime-1',
  correlationId: null,
};

function buildService(
  overrides: {
    findByIdempotencyKey?: ReturnType<typeof vi.fn>;
    findByClientOrderId?: ReturnType<typeof vi.fn>;
    create?: ReturnType<typeof vi.fn>;
  } = {},
) {
  const orders = {
    findByIdempotencyKey: overrides.findByIdempotencyKey ?? vi.fn().mockResolvedValue(null),
    findByClientOrderId: overrides.findByClientOrderId ?? vi.fn().mockResolvedValue(null),
    create: overrides.create ?? vi.fn(async (order: unknown) => order),
    save: vi.fn(),
    findById: vi.fn(),
    listByWorkspace: vi.fn(),
  };
  const accounts = {
    findById: vi.fn().mockResolvedValue({ id: 'account-1', mode: 'paper' }),
  };
  const sessions = {
    findById: vi.fn().mockResolvedValue({
      id: 'session-1',
      paperAccountId: 'account-1',
      status: 'running',
      lease: {
        fencingToken: 7,
        ownerId: 'worker-1',
        acquiredAt: t0,
        expiresAt: '2026-07-29T17:00:00.000Z',
        heartbeatAt: t0,
      },
    }),
  };
  const transactions = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  };
  const outbox = { append: vi.fn().mockResolvedValue(undefined) };
  const cashReservations = {
    reserveCash: vi.fn(),
    releaseCash: vi.fn(),
    findByOrder: vi.fn(),
  };

  const service = new OrderService(
    orders as never,
    accounts as never,
    sessions as never,
    transactions as never,
    outbox as never,
    cashReservations as never,
  );
  return { service, orders, outbox };
}

describe('US221 — OrderService.proposeOrderFromSignalIntent', () => {
  it('returns null for NO_ACTION without persisting', async () => {
    const { service, orders, outbox } = buildService();
    const result = await service.proposeOrderFromSignalIntent({
      kind: 'NO_ACTION',
      reason: 'hold',
    });
    expect(result).toBeNull();
    expect(orders.create).not.toHaveBeenCalled();
    expect(outbox.append).not.toHaveBeenCalled();
  });

  it('proposes a strategy-origin Order from Signal Intent', async () => {
    const { service, orders } = buildService();
    const order = await service.proposeOrderFromSignalIntent({
      kind: 'SIGNAL_INTENT',
      signalIntent: signal,
      paperAccountId: 'account-1',
      sessionFencingToken: 7,
      quantity: '1.0',
      recordedAt: t1,
      eligibilityCheckedAt: t1,
    });

    expect(order).not.toBeNull();
    expect(order!.status).toBe(OrderStatus.PROPOSED);
    expect(order!.intent.origin).toBe('strategy');
    expect(order!.intent.signalIntentId).toBe(signal.id);
    expect(order!.intent.signalIntentHash).toBe(signal.intentHash);
    expect(orders.create).toHaveBeenCalledOnce();
  });

  it('replays duplicate Signal Intent processing idempotently', async () => {
    const { service, orders } = buildService();
    const first = await service.proposeOrderFromSignalIntent({
      kind: 'SIGNAL_INTENT',
      signalIntent: signal,
      paperAccountId: 'account-1',
      sessionFencingToken: 7,
      quantity: '1.0',
      recordedAt: t1,
      eligibilityCheckedAt: t1,
    });
    orders.findByIdempotencyKey.mockResolvedValue(first);
    const second = await service.proposeOrderFromSignalIntent({
      kind: 'SIGNAL_INTENT',
      signalIntent: signal,
      paperAccountId: 'account-1',
      sessionFencingToken: 7,
      quantity: '1.0',
      recordedAt: '2026-07-29T16:10:00.000Z',
      eligibilityCheckedAt: '2026-07-29T16:10:00.000Z',
    });

    expect(second).toBe(first);
    expect(orders.create).toHaveBeenCalledOnce();
  });

  it('rejects conflicting duplicate Signal Intent payload', async () => {
    const { service, orders } = buildService();
    const first = await service.proposeOrderFromSignalIntent({
      kind: 'SIGNAL_INTENT',
      signalIntent: signal,
      paperAccountId: 'account-1',
      sessionFencingToken: 7,
      quantity: '1.0',
      recordedAt: t1,
      eligibilityCheckedAt: t1,
    });
    orders.findByIdempotencyKey.mockResolvedValue(first);

    await expect(
      service.proposeOrderFromSignalIntent({
        kind: 'SIGNAL_INTENT',
        signalIntent: signal,
        paperAccountId: 'account-1',
        sessionFencingToken: 7,
        quantity: '2.0',
        recordedAt: t1,
        eligibilityCheckedAt: t1,
      }),
    ).rejects.toThrow(/different intent/);
  });
});
