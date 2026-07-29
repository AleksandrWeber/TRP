import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StrategyCheckpointRepository } from './persistence/strategy-checkpoint.repository';
import { StrategyCheckpointService } from './strategy-checkpoint.service';

const updatedAt = '2026-07-29T17:00:00.000Z';

describe('US215 — StrategyCheckpointService', () => {
  const repository: StrategyCheckpointRepository = {
    save: vi.fn(),
    findBySession: vi.fn(),
    findById: vi.fn(),
  };
  const transactions = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  };
  const outbox = {
    append: vi.fn(async () => undefined),
  };

  let service: StrategyCheckpointService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StrategyCheckpointService(repository, transactions as never, outbox as never);
  });

  it('creates a checkpoint and appends Outbox StrategyCheckpointAdvanced', async () => {
    vi.mocked(repository.findBySession).mockResolvedValue(null);
    vi.mocked(repository.save).mockImplementation(async (checkpoint) => checkpoint);

    const result = await service.save({
      workspaceId: 'workspace-1',
      deploymentId: 'deployment-1',
      sessionId: 'session-1',
      lastProcessedCandle: {
        streamId: 'binance:btcusdt:1h',
        sequence: 1,
        openTime: '2026-07-29T16:00:00.000Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
      },
      lastProcessedEventId: 'evt-1',
      updatedAt,
      actorId: 'runtime-1',
    });

    expect(result.advanced).toBe(true);
    expect(result.checkpoint.version).toBe(1);
    expect(repository.save).toHaveBeenCalledOnce();
    expect(outbox.append).toHaveBeenCalledOnce();
    expect(eventTypeFrom(outbox.append.mock.calls[0])).toBe('StrategyCheckpointAdvanced');
  });

  it('advances an existing checkpoint monotonically with Outbox', async () => {
    const existing = (
      await (async () => {
        vi.mocked(repository.findBySession).mockResolvedValue(null);
        vi.mocked(repository.save).mockImplementation(async (checkpoint) => checkpoint);
        return service.save({
          workspaceId: 'workspace-1',
          deploymentId: 'deployment-1',
          sessionId: 'session-1',
          lastProcessedCandle: {
            streamId: 'binance:btcusdt:1h',
            sequence: 1,
            openTime: '2026-07-29T16:00:00.000Z',
            instrument: 'BTCUSDT',
            timeframe: '1h',
          },
          lastProcessedEventId: 'evt-1',
          updatedAt,
          actorId: 'runtime-1',
        });
      })()
    ).checkpoint;

    vi.clearAllMocks();
    vi.mocked(repository.findBySession).mockResolvedValue(existing);
    vi.mocked(repository.save).mockImplementation(async (checkpoint) => checkpoint);

    const result = await service.save({
      workspaceId: 'workspace-1',
      deploymentId: 'deployment-1',
      sessionId: 'session-1',
      lastProcessedCandle: {
        streamId: 'binance:btcusdt:1h',
        sequence: 2,
        openTime: '2026-07-29T17:00:00.000Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
      },
      lastProcessedEventId: 'evt-2',
      updatedAt: '2026-07-29T17:01:00.000Z',
      actorId: 'runtime-1',
    });

    expect(result.advanced).toBe(true);
    expect(result.checkpoint.version).toBe(2);
    expect(outbox.append).toHaveBeenCalledOnce();
  });

  it('no-ops identical progress without Outbox', async () => {
    vi.mocked(repository.findBySession).mockResolvedValue(null);
    vi.mocked(repository.save).mockImplementation(async (checkpoint) => checkpoint);
    const first = await service.save({
      workspaceId: 'workspace-1',
      deploymentId: 'deployment-1',
      sessionId: 'session-1',
      lastProcessedCandle: {
        streamId: 'binance:btcusdt:1h',
        sequence: 5,
        openTime: '2026-07-29T16:00:00.000Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
      },
      lastProcessedEventId: 'evt-5',
      updatedAt,
      actorId: 'runtime-1',
    });

    vi.clearAllMocks();
    vi.mocked(repository.findBySession).mockResolvedValue(first.checkpoint);

    const result = await service.save({
      workspaceId: 'workspace-1',
      deploymentId: 'deployment-1',
      sessionId: 'session-1',
      lastProcessedCandle: {
        streamId: 'binance:btcusdt:1h',
        sequence: 5,
        openTime: '2026-07-29T16:00:00.000Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
      },
      lastProcessedEventId: 'evt-5',
      updatedAt: '2026-07-29T18:00:00.000Z',
      actorId: 'runtime-2',
    });

    expect(result.advanced).toBe(false);
    expect(result.checkpoint.version).toBe(1);
    expect(repository.save).not.toHaveBeenCalled();
    expect(outbox.append).not.toHaveBeenCalled();
  });

  it('loads by session', async () => {
    vi.mocked(repository.findBySession).mockResolvedValue(null);
    await expect(service.load('workspace-1', 'session-1')).resolves.toBeNull();
    expect(repository.findBySession).toHaveBeenCalledWith('workspace-1', 'session-1');
  });

  it('rejects deployment id mutation on an existing checkpoint', async () => {
    vi.mocked(repository.findBySession).mockResolvedValue(null);
    vi.mocked(repository.save).mockImplementation(async (checkpoint) => checkpoint);
    const first = await service.save({
      workspaceId: 'workspace-1',
      deploymentId: 'deployment-1',
      sessionId: 'session-1',
      lastProcessedCandle: {
        streamId: 'binance:btcusdt:1h',
        sequence: 1,
        openTime: '2026-07-29T16:00:00.000Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
      },
      lastProcessedEventId: 'evt-1',
      updatedAt,
      actorId: 'runtime-1',
    });

    vi.mocked(repository.findBySession).mockResolvedValue(first.checkpoint);
    await expect(
      service.save({
        workspaceId: 'workspace-1',
        deploymentId: 'deployment-other',
        sessionId: 'session-1',
        lastProcessedCandle: {
          streamId: 'binance:btcusdt:1h',
          sequence: 2,
          openTime: '2026-07-29T17:00:00.000Z',
          instrument: 'BTCUSDT',
          timeframe: '1h',
        },
        lastProcessedEventId: 'evt-2',
        updatedAt: '2026-07-29T17:01:00.000Z',
        actorId: 'runtime-1',
      }),
    ).rejects.toThrow(/deployment id cannot change/);
  });
});

function eventTypeFrom(call: unknown[] | undefined): string | undefined {
  const envelope = call?.[1] as { eventType?: string } | undefined;
  return envelope?.eventType;
}
