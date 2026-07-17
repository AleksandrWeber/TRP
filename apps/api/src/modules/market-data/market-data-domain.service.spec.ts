import { beforeEach, describe, expect, it } from 'vitest';
import { toInstrument } from './instrument';
import { MarketDataDomainService } from './market-data-domain.service';
import { InMemoryMarketDataRepository } from './repositories/in-memory-market-data.repository';
import { Timeframe } from './timeframe';

const WS_1 = 'ws-1';
const WS_2 = 'ws-2';

describe('MarketDataDomainService (US115)', () => {
  let service: MarketDataDomainService;

  beforeEach(() => {
    service = new MarketDataDomainService(new InMemoryMarketDataRepository());
  });

  it('saveBars persists OHLCV bars with required fields', () => {
    const [bar] = service.saveBars([
      {
        workspaceId: ` ${WS_1} `,
        instrument: ' BTCUSDT ',
        timeframe: Timeframe.H1,
        timestamp: '2026-07-17T10:00:00.000Z',
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 12.5,
      },
    ]);

    expect(bar.id.length).toBeGreaterThan(0);
    expect(bar.workspaceId).toBe(WS_1);
    expect(bar.instrument).toBe(toInstrument('BTCUSDT'));
    expect(bar.timeframe).toBe(Timeframe.H1);
    expect(bar.timestamp).toBe('2026-07-17T10:00:00.000Z');
    expect(bar.open).toBe(100);
    expect(bar.high).toBe(110);
    expect(bar.low).toBe(95);
    expect(bar.close).toBe(105);
    expect(bar.volume).toBe(12.5);
    expect(Object.keys(bar).sort()).toEqual([
      'close',
      'high',
      'id',
      'instrument',
      'low',
      'open',
      'timeframe',
      'timestamp',
      'volume',
      'workspaceId',
    ]);
  });

  it('saveBars upserts by id', () => {
    const [created] = service.saveBars([
      {
        id: 'bar-1',
        workspaceId: WS_1,
        instrument: 'BTCUSDT',
        timeframe: Timeframe.H1,
        timestamp: '2026-07-17T10:00:00.000Z',
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 1,
      },
    ]);

    service.saveBars([
      {
        id: created.id,
        workspaceId: WS_1,
        instrument: 'BTCUSDT',
        timeframe: Timeframe.H1,
        timestamp: '2026-07-17T10:00:00.000Z',
        open: 101,
        high: 111,
        low: 96,
        close: 106,
        volume: 2,
      },
    ]);

    expect(service.getBar(created.id, WS_1)?.close).toBe(106);
    expect(
      service.getRange({
        workspaceId: WS_1,
        instrument: 'BTCUSDT',
        timeframe: Timeframe.H1,
        from: '2026-07-17T00:00:00.000Z',
        to: '2026-07-17T23:59:59.000Z',
      }),
    ).toHaveLength(1);
  });

  it('getBar returns bar only within the same workspace', () => {
    const [bar] = service.saveBars([
      {
        workspaceId: WS_1,
        instrument: 'ETHUSDT',
        timeframe: Timeframe.M15,
        timestamp: '2026-07-17T10:00:00.000Z',
        open: 1,
        high: 2,
        low: 1,
        close: 1.5,
        volume: 10,
      },
    ]);

    expect(service.getBar(bar.id, WS_1)).toEqual(bar);
    expect(service.getBar(bar.id, WS_2)).toBeNull();
    expect(service.getBar('missing', WS_1)).toBeNull();
  });

  it('getRange filters by workspace, instrument, timeframe, and time bounds', () => {
    service.saveBars([
      bar(WS_1, 'BTCUSDT', Timeframe.H1, '2026-07-17T09:00:00.000Z', 1),
      bar(WS_1, 'BTCUSDT', Timeframe.H1, '2026-07-17T10:00:00.000Z', 2),
      bar(WS_1, 'BTCUSDT', Timeframe.H1, '2026-07-17T11:00:00.000Z', 3),
      bar(WS_1, 'BTCUSDT', Timeframe.M5, '2026-07-17T10:00:00.000Z', 4),
      bar(WS_1, 'ETHUSDT', Timeframe.H1, '2026-07-17T10:00:00.000Z', 5),
      bar(WS_2, 'BTCUSDT', Timeframe.H1, '2026-07-17T10:00:00.000Z', 6),
    ]);

    const found = service.getRange({
      workspaceId: WS_1,
      instrument: 'BTCUSDT',
      timeframe: Timeframe.H1,
      from: '2026-07-17T10:00:00.000Z',
      to: '2026-07-17T11:00:00.000Z',
    });

    expect(found.map((item) => item.close)).toEqual([2, 3]);
  });

  it('deleteRange removes matching bars and preserves others', () => {
    service.saveBars([
      bar(WS_1, 'BTCUSDT', Timeframe.H1, '2026-07-17T10:00:00.000Z', 1),
      bar(WS_1, 'BTCUSDT', Timeframe.H1, '2026-07-17T11:00:00.000Z', 2),
      bar(WS_1, 'BTCUSDT', Timeframe.H1, '2026-07-17T12:00:00.000Z', 3),
      bar(WS_2, 'BTCUSDT', Timeframe.H1, '2026-07-17T11:00:00.000Z', 4),
    ]);

    const deleted = service.deleteRange({
      workspaceId: WS_1,
      instrument: 'BTCUSDT',
      timeframe: Timeframe.H1,
      from: '2026-07-17T11:00:00.000Z',
      to: '2026-07-17T11:00:00.000Z',
    });

    expect(deleted).toBe(1);
    expect(
      service
        .getRange({
          workspaceId: WS_1,
          instrument: 'BTCUSDT',
          timeframe: Timeframe.H1,
          from: '2026-07-17T00:00:00.000Z',
          to: '2026-07-17T23:59:59.000Z',
        })
        .map((item) => item.close),
    ).toEqual([1, 3]);
    expect(
      service.getRange({
        workspaceId: WS_2,
        instrument: 'BTCUSDT',
        timeframe: Timeframe.H1,
        from: '2026-07-17T00:00:00.000Z',
        to: '2026-07-17T23:59:59.000Z',
      }),
    ).toHaveLength(1);
  });

  it('rejects invalid OHLC / empty fields', () => {
    expect(() =>
      service.saveBars([
        {
          workspaceId: '  ',
          instrument: 'BTCUSDT',
          timeframe: Timeframe.H1,
          timestamp: '2026-07-17T10:00:00.000Z',
          open: 1,
          high: 2,
          low: 1,
          close: 1,
          volume: 1,
        },
      ]),
    ).toThrow(/workspaceId/i);

    expect(() =>
      service.saveBars([
        {
          workspaceId: WS_1,
          instrument: 'BTCUSDT',
          timeframe: Timeframe.H1,
          timestamp: '2026-07-17T10:00:00.000Z',
          open: 10,
          high: 5,
          low: 1,
          close: 3,
          volume: 1,
        },
      ]),
    ).toThrow(/high/i);

    expect(() =>
      service.getRange({
        workspaceId: WS_1,
        instrument: 'BTCUSDT',
        timeframe: Timeframe.H1,
        from: '2026-07-17T12:00:00.000Z',
        to: '2026-07-17T10:00:00.000Z',
      }),
    ).toThrow(/from/i);
  });
});

function bar(
  workspaceId: string,
  instrument: string,
  timeframe: Timeframe,
  timestamp: string,
  close: number,
) {
  return {
    workspaceId,
    instrument,
    timeframe,
    timestamp,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1,
  };
}
