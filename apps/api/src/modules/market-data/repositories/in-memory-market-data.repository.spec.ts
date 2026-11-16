import { describe, expect, it } from 'vitest';
import { toInstrument } from '../instrument';
import { toMarketBarId } from '../market-bar-id';
import type { MarketBar } from '../market-bar';
import { Timeframe } from '../timeframe';
import { InMemoryMarketDataRepository } from './in-memory-market-data.repository';
import type { MarketDataRangeQuery } from './market-data.repository';

const WORKSPACE = 'ws-1';
const RANGE: MarketDataRangeQuery = {
  workspaceId: WORKSPACE,
  instrument: 'BTCUSDT',
  timeframe: Timeframe.H1,
  from: '2026-07-17T00:00:00.000Z',
  to: '2026-07-17T23:59:59.000Z',
};

describe('InMemoryMarketDataRepository range isolation', () => {
  it('returns a new array sorted by timestamp, including duplicate timestamps in insertion order', () => {
    const repository = new InMemoryMarketDataRepository();
    repository.saveBars([
      bar('late', '2026-07-17T12:00:00.000Z', 3),
      bar('same-b', '2026-07-17T10:00:00.000Z', 2),
      bar('same-a', '2026-07-17T10:00:00.000Z', 1),
      bar('early', '2026-07-17T09:00:00.000Z', 4),
    ]);

    const first = repository.findRange(RANGE);
    const second = repository.findRange(RANGE);

    expect(first.map((item) => item.id)).toEqual(['early', 'same-b', 'same-a', 'late']);
    expect(second.map((item) => item.id)).toEqual(['early', 'same-b', 'same-a', 'late']);
    expect(first).not.toBe(second);
    expect(first[0]).toBe(second[0]);
    expect(Object.isFrozen(first[0])).toBe(true);
  });

  it('keeps range boundaries inclusive and returns an empty array outside them', () => {
    const repository = new InMemoryMarketDataRepository();
    repository.saveBars([
      bar('before', '2026-07-16T23:59:59.000Z', 1),
      bar('start', '2026-07-17T10:00:00.000Z', 2),
      bar('end', '2026-07-17T12:00:00.000Z', 3),
      bar('after', '2026-07-17T12:00:00.001Z', 4),
    ]);

    const bounded = repository.findRange({
      ...RANGE,
      from: '2026-07-17T10:00:00.000Z',
      to: '2026-07-17T12:00:00.000Z',
    });
    expect(bounded.map((item) => item.id)).toEqual(['start', 'end']);

    expect(
      repository.findRange({
        ...RANGE,
        from: '2026-07-18T00:00:00.000Z',
        to: '2026-07-18T01:00:00.000Z',
      }),
    ).toEqual([]);
  });

  it('does not let a returned array or a later mutation change stored bars', () => {
    const repository = new InMemoryMarketDataRepository();
    const input = bar('stored', '2026-07-17T10:00:00.000Z', 105);
    repository.saveBars([input]);
    input.close = 1;

    const returned = repository.findRange(RANGE);
    expect(returned).toHaveLength(1);
    expect(returned[0]?.close).toBe(105);
    returned.push(bar('extra', '2026-07-17T11:00:00.000Z', 9));
    expect(() => {
      returned[0]!.close = 999;
    }).toThrow(TypeError);

    const again = repository.findRange(RANGE);
    expect(again.map((item) => item.id)).toEqual(['stored']);
    expect(again[0]?.close).toBe(105);
    expect(repository.findById('stored', WORKSPACE)?.close).toBe(105);
  });

  it('returns a mutable findById copy that does not write back to storage', () => {
    const repository = new InMemoryMarketDataRepository();
    repository.saveBars([bar('stored', '2026-07-17T10:00:00.000Z', 105)]);

    const loaded = repository.findById('stored', WORKSPACE);
    expect(loaded).not.toBeNull();
    loaded!.close = 999;

    expect(repository.findById('stored', WORKSPACE)?.close).toBe(105);
    expect(repository.findRange(RANGE)[0]?.close).toBe(105);
  });

  it('keeps an earlier returned bar unchanged when the stored bar is replaced', () => {
    const repository = new InMemoryMarketDataRepository();
    repository.saveBars([bar('stored', '2026-07-17T10:00:00.000Z', 105)]);
    const [previous] = repository.findRange(RANGE);

    repository.saveBars([bar('stored', '2026-07-17T10:00:00.000Z', 200)]);

    expect(previous?.close).toBe(105);
    expect(repository.findById('stored', WORKSPACE)?.close).toBe(200);
    expect(repository.findRange(RANGE)[0]).not.toBe(previous);
  });

  it('repeated reads stay isolated across workspace and instrument filters', () => {
    const repository = new InMemoryMarketDataRepository();
    repository.saveBars([
      bar('btc', '2026-07-17T10:00:00.000Z', 1),
      {
        ...bar('eth', '2026-07-17T10:00:00.000Z', 2),
        instrument: toInstrument('ETHUSDT'),
      },
      {
        ...bar('other-workspace', '2026-07-17T10:00:00.000Z', 3),
        workspaceId: 'ws-2',
      },
    ]);

    expect(repository.findRange(RANGE).map((item) => item.id)).toEqual(['btc']);
    expect(repository.findById('btc', 'ws-2')).toBeNull();
    expect(repository.findById('other-workspace', 'ws-2')?.close).toBe(3);
  });
});

function bar(id: string, timestamp: string, close: number): MarketBar {
  return {
    id: toMarketBarId(id),
    workspaceId: WORKSPACE,
    instrument: toInstrument('BTCUSDT'),
    timeframe: Timeframe.H1,
    timestamp,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1,
  };
}
