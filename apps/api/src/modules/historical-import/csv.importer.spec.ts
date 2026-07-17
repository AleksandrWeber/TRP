import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryMarketDataRepository } from '../market-data/repositories/in-memory-market-data.repository';
import { MarketDataDomainService } from '../market-data/market-data-domain.service';
import { Timeframe } from '../market-data/timeframe';
import { CsvImporter } from './csv.importer';

const WS = 'ws-1';
const HEADER = 'timestamp,open,high,low,close,volume';

describe('CsvImporter (US116)', () => {
  let marketData: MarketDataDomainService;
  let importer: CsvImporter;

  beforeEach(() => {
    marketData = new MarketDataDomainService(new InMemoryMarketDataRepository());
    importer = new CsvImporter(marketData);
  });

  it('imports valid CSV rows as MarketBars', () => {
    const result = importer.import({
      workspaceId: WS,
      instrument: 'BTCUSDT',
      timeframe: Timeframe.H1,
      file: [
        HEADER,
        '2026-07-17T10:00:00.000Z,100,110,95,105,12.5',
        '2026-07-17T11:00:00.000Z,105,115,100,110,8',
      ].join('\n'),
    });

    expect(result).toEqual({
      importedBars: 2,
      skippedBars: 0,
      duplicateBars: 0,
      validationErrors: [],
    });

    const bars = marketData.getRange({
      workspaceId: WS,
      instrument: 'BTCUSDT',
      timeframe: Timeframe.H1,
      from: '2026-07-17T00:00:00.000Z',
      to: '2026-07-17T23:59:59.000Z',
    });
    expect(bars).toHaveLength(2);
    expect(bars[0]?.close).toBe(105);
    expect(bars[1]?.close).toBe(110);
    expect(bars[0]?.instrument).toBe('BTCUSDT');
    expect(bars[0]?.workspaceId).toBe(WS);
  });

  it('skips duplicates and counts duplicateBars', () => {
    const result = importer.import({
      workspaceId: WS,
      instrument: 'ETHUSDT',
      timeframe: Timeframe.M15,
      file: [
        HEADER,
        '2026-07-17T10:00:00.000Z,1,2,1,1.5,10',
        '2026-07-17T10:00:00.000Z,1,2,1,1.6,11',
        '2026-07-17T10:15:00.000Z,1.5,2.5,1.4,2,9',
      ].join('\n'),
    });

    expect(result.importedBars).toBe(2);
    expect(result.duplicateBars).toBe(1);
    expect(result.skippedBars).toBe(1);
    expect(result.validationErrors).toEqual([]);
  });

  it('records OHLC / numeric validation errors and skips those rows', () => {
    const result = importer.import({
      workspaceId: WS,
      instrument: 'BTCUSDT',
      timeframe: Timeframe.H1,
      file: [
        HEADER,
        '2026-07-17T10:00:00.000Z,100,90,95,105,1',
        '2026-07-17T11:00:00.000Z,abc,110,95,105,1',
        '2026-07-17T12:00:00.000Z,100,110,95,105,2',
      ].join('\n'),
    });

    expect(result.importedBars).toBe(1);
    expect(result.skippedBars).toBe(2);
    expect(result.duplicateBars).toBe(0);
    expect(result.validationErrors).toHaveLength(2);
    expect(result.validationErrors[0]?.field).toBe('high');
    expect(result.validationErrors[1]?.field).toBe('open');
  });

  it('rejects out-of-order timestamps as validation errors', () => {
    const result = importer.import({
      workspaceId: WS,
      instrument: 'BTCUSDT',
      timeframe: Timeframe.H1,
      file: [
        HEADER,
        '2026-07-17T11:00:00.000Z,100,110,95,105,1',
        '2026-07-17T10:00:00.000Z,100,110,95,105,1',
        '2026-07-17T12:00:00.000Z,100,110,95,105,1',
      ].join('\n'),
    });

    expect(result.importedBars).toBe(2);
    expect(result.skippedBars).toBe(1);
    expect(result.validationErrors).toHaveLength(1);
    expect(result.validationErrors[0]?.field).toBe('timestamp');
    expect(result.validationErrors[0]?.message).toMatch(/ascending/i);
  });

  it('rejects invalid header', () => {
    expect(() =>
      importer.import({
        workspaceId: WS,
        instrument: 'BTCUSDT',
        timeframe: Timeframe.H1,
        file: 'time,open,high,low,close,volume\n2026-07-17T10:00:00.000Z,1,2,1,1.5,1',
      }),
    ).toThrow(/header/i);
  });

  it('scopes persisted bars to workspace and instrument from input', () => {
    importer.import({
      workspaceId: 'ws-a',
      instrument: 'BTCUSDT',
      timeframe: Timeframe.D1,
      file: `${HEADER}\n2026-07-17T00:00:00.000Z,1,2,1,1.5,1`,
    });

    expect(
      marketData.getRange({
        workspaceId: 'ws-b',
        instrument: 'BTCUSDT',
        timeframe: Timeframe.D1,
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T00:00:00.000Z',
      }),
    ).toHaveLength(0);
    expect(
      marketData.getRange({
        workspaceId: 'ws-a',
        instrument: 'ETHUSDT',
        timeframe: Timeframe.D1,
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T00:00:00.000Z',
      }),
    ).toHaveLength(0);
    expect(
      marketData.getRange({
        workspaceId: 'ws-a',
        instrument: 'BTCUSDT',
        timeframe: Timeframe.D1,
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-07-31T00:00:00.000Z',
      }),
    ).toHaveLength(1);
  });
});
