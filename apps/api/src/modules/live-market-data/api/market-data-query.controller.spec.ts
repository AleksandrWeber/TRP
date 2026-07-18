import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MarketDataQueryController } from './market-data-query.controller';
import { MarketDataQueryService } from './market-data-query.service';

const WORKSPACE_ID = 'ws-1';
const STREAM_ID = 'ws-1:binance_spot:BTCUSDT:closed_candle:1m';

describe('US146 — MarketDataQueryController', () => {
  function createController(
    overrides?: Partial<{
      queries: Partial<MarketDataQueryService>;
      workspaces: { getById: ReturnType<typeof vi.fn> };
    }>,
  ) {
    const queries = {
      listSubscriptions: vi.fn().mockReturnValue([]),
      getSubscription: vi.fn().mockReturnValue(null),
      listStatuses: vi.fn().mockReturnValue([]),
      getStatus: vi.fn().mockReturnValue(null),
      listLatest: vi.fn().mockReturnValue([]),
      getLatest: vi.fn().mockReturnValue(null),
      getCheckpoint: vi.fn().mockResolvedValue(null),
      getStreamDetail: vi.fn().mockResolvedValue(null),
      ...overrides?.queries,
    };
    const workspaces = overrides?.workspaces ?? {
      getById: vi.fn().mockReturnValue({ id: WORKSPACE_ID }),
    };
    return {
      controller: new MarketDataQueryController(queries as never, workspaces as never),
      queries,
      workspaces,
    };
  }

  it('requires workspace header and isolates by workspace', () => {
    const { controller, queries } = createController({
      queries: {
        listSubscriptions: vi.fn().mockReturnValue([
          {
            id: 'sub:1',
            workspaceId: WORKSPACE_ID,
            sourceId: 'binance_spot',
            instrument: 'BTCUSDT',
            channel: 'closed_candle',
            streamId: STREAM_ID,
            state: 'desired',
            updatedAt: '2026-07-18T12:00:00.000Z',
          },
        ]),
      },
    });

    expect(() => controller.listSubscriptions()).toThrow(BadRequestException);
    const rows = controller.listSubscriptions(WORKSPACE_ID);
    expect(queries.listSubscriptions).toHaveBeenCalledWith(WORKSPACE_ID);
    expect(rows[0]?.workspaceId).toBe(WORKSPACE_ID);
  });

  it('returns latest state with freshness and projection version', () => {
    const { controller } = createController({
      queries: {
        getLatest: vi.fn().mockReturnValue({
          workspaceId: WORKSPACE_ID,
          streamId: STREAM_ID,
          sourceId: 'binance_spot',
          instrument: 'BTCUSDT',
          channel: 'closed_candle',
          timeframe: '1m',
          latestClosedCandle: {
            eventId: 'e1',
            instrument: 'BTCUSDT',
            timeframe: '1m',
            openTime: '2026-07-18T12:00:00.000Z',
            closeTime: '2026-07-18T12:00:59.999Z',
            open: 1,
            high: 2,
            low: 1,
            close: 2,
            volume: 1,
            exchangeOccurredAt: '2026-07-18T12:00:00.000Z',
            sequence: 1,
          },
          latestMarkPrice: null,
          checkpoint: null,
          freshnessAt: '2026-07-18T12:00:00.000Z',
          projectionVersion: 3,
          updatedAt: '2026-07-18T12:01:00.000Z',
          authoritative: false,
        }),
      },
    });

    const latest = controller.getLatest(STREAM_ID, WORKSPACE_ID);
    expect(latest.freshnessAt).toBe('2026-07-18T12:00:00.000Z');
    expect(latest.projectionVersion).toBe(3);
    expect(latest.authoritative).toBe(false);
    expect(Object.keys(latest.latestClosedCandle ?? {})).not.toContain('e');
    expect(Object.keys(latest.latestClosedCandle ?? {})).not.toContain('k');
    expect(Object.keys(latest)).not.toContain('kline');
  });

  it('404s for missing workspace-scoped resources', async () => {
    const { controller } = createController();
    expect(() => controller.getSubscription({ id: 'missing' }, WORKSPACE_ID)).toThrow(
      NotFoundException,
    );
    expect(() => controller.getStatus(STREAM_ID, WORKSPACE_ID)).toThrow(NotFoundException);
    await expect(controller.getCheckpoint(STREAM_ID, WORKSPACE_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('exposes only GET handlers — no Orders/Sessions/strategy mutations', () => {
    const proto = Object.getPrototypeOf(new MarketDataQueryController({} as never, {} as never));
    const methods = Object.getOwnPropertyNames(proto).filter((name) => name !== 'constructor');
    for (const forbidden of [
      'createOrder',
      'startSession',
      'evaluateStrategy',
      'post',
      'put',
      'patch',
      'delete',
    ]) {
      expect(methods.some((name) => name.toLowerCase().includes(forbidden.toLowerCase()))).toBe(
        false,
      );
    }
  });
});
