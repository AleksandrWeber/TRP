import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignalIntentDirection } from './domain/signal-intent';
import type { SignalIntentRepository } from './persistence/signal-intent.repository';
import { SignalIntentService } from './signal-intent.service';

const generatedAt = '2026-07-29T16:00:00.000Z';
const recordedAt = '2026-07-29T16:00:01.000Z';

describe('US214 — SignalIntentService', () => {
  const repository: SignalIntentRepository = {
    append: vi.fn(),
    findById: vi.fn(),
    findByIntentHash: vi.fn(),
    listBySession: vi.fn(),
  };
  const transactions = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  };
  const outbox = {
    append: vi.fn(async () => undefined),
  };

  let service: SignalIntentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SignalIntentService(repository, transactions as never, outbox as never);
  });

  it('emits a new Signal Intent and appends Outbox SignalIntentCreated', async () => {
    vi.mocked(repository.findByIntentHash).mockResolvedValue(null);
    vi.mocked(repository.append).mockImplementation(async (intent) => intent);

    const result = await service.emit({
      workspaceId: 'workspace-1',
      deploymentId: 'deployment-1',
      sessionId: 'session-1',
      strategyVersion: '1.0.0',
      instrument: 'BTCUSDT',
      timeframe: '1h',
      direction: SignalIntentDirection.BUY,
      confidence: 0.75,
      marketCheckpoint: {
        streamId: 'binance:btcusdt:1h',
        sequence: 10,
        eventId: 'candle-10',
      },
      generatedAt,
      recordedAt,
      actorId: 'runtime-1',
    });

    expect(result.created).toBe(true);
    expect(result.intent.direction).toBe(SignalIntentDirection.BUY);
    expect(repository.append).toHaveBeenCalledOnce();
    expect(outbox.append).toHaveBeenCalledOnce();
    expect(eventTypeFrom(outbox.append.mock.calls[0])).toBe('SignalIntentCreated');
  });

  it('deduplicates by intentHash as a successful no-op without Outbox', async () => {
    vi.mocked(repository.findByIntentHash).mockResolvedValue(null);
    vi.mocked(repository.append).mockImplementation(async (intent) => intent);

    const command = {
      workspaceId: 'workspace-1',
      deploymentId: 'deployment-1',
      sessionId: 'session-1',
      strategyVersion: '1.0.0',
      instrument: 'BTCUSDT',
      timeframe: '1h',
      direction: SignalIntentDirection.SELL,
      marketCheckpoint: {
        streamId: 'binance:btcusdt:1h',
        sequence: 11,
        eventId: 'candle-11',
      },
      generatedAt,
      recordedAt,
      actorId: 'runtime-1',
    } as const;

    const first = await service.emit(command);
    expect(first.created).toBe(true);

    vi.clearAllMocks();
    vi.mocked(repository.findByIntentHash).mockResolvedValue(first.intent);

    const result = await service.emit({
      ...command,
      recordedAt: '2026-07-29T16:10:00.000Z',
      actorId: 'runtime-2',
    });

    expect(result.created).toBe(false);
    expect(result.intent.id).toBe(first.intent.id);
    expect(repository.append).not.toHaveBeenCalled();
    expect(outbox.append).not.toHaveBeenCalled();
  });

  it('queries by id and session', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);
    vi.mocked(repository.listBySession).mockResolvedValue([]);

    await expect(service.get('workspace-1', 'si_missing')).resolves.toBeNull();
    await expect(service.listBySession('workspace-1', 'session-1')).resolves.toEqual([]);
    expect(repository.findById).toHaveBeenCalledWith('workspace-1', 'si_missing');
    expect(repository.listBySession).toHaveBeenCalledWith('workspace-1', 'session-1');
  });
});

function eventTypeFrom(call: unknown[] | undefined): string | undefined {
  const envelope = call?.[1] as { eventType?: string } | undefined;
  return envelope?.eventType;
}
