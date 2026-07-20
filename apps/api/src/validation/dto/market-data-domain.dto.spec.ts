import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { MarketCandlesQueryDto, MarketSymbolParamDto } from './market-data-domain.dto';

describe('Market Data Domain DTOs (US006)', () => {
  it('accepts a valid candles query and converts limit to a number', () => {
    const dto = plainToInstance(MarketCandlesQueryDto, {
      symbol: 'BTCUSDT',
      timeframe: '1h',
      limit: '50',
    });

    expect(validateSync(dto)).toEqual([]);
    expect(dto.limit).toBe(50);
  });

  it('accepts an omitted limit', () => {
    const dto = plainToInstance(MarketCandlesQueryDto, { symbol: 'ETHUSDT', timeframe: '1d' });
    expect(validateSync(dto)).toEqual([]);
  });

  it('rejects invalid symbol, timeframe, and limit', () => {
    const dto = plainToInstance(MarketCandlesQueryDto, {
      symbol: 'btc/usdt',
      timeframe: '30m',
      limit: '0',
    });

    const fields = validateSync(dto).map((error) => error.property);
    expect(fields).toEqual(expect.arrayContaining(['symbol', 'timeframe', 'limit']));
  });

  it('caps limit at 1000', () => {
    const dto = plainToInstance(MarketCandlesQueryDto, {
      symbol: 'BTCUSDT',
      timeframe: '1m',
      limit: '1001',
    });
    expect(validateSync(dto).map((error) => error.property)).toContain('limit');
  });

  it('validates the ticker symbol param', () => {
    expect(validateSync(plainToInstance(MarketSymbolParamDto, { symbol: 'BTCUSDT' }))).toEqual([]);
    expect(validateSync(plainToInstance(MarketSymbolParamDto, { symbol: 'btc-usdt' }))).not.toEqual(
      [],
    );
  });
});
