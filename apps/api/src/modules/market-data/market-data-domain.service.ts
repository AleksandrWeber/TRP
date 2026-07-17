import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { toInstrument, type Instrument } from './instrument';
import type { MarketBar } from './market-bar';
import { toMarketBarId, type MarketBarId } from './market-bar-id';
import type { Timeframe } from './timeframe';
import type {
  MarketDataRangeQuery,
  MarketDataRepository,
} from './repositories/market-data.repository';
import { MARKET_DATA_REPOSITORY } from './repositories/market-data.repository.token';

export type SaveMarketBarInput = {
  id?: MarketBarId | string;
  workspaceId: string;
  instrument: Instrument | string;
  timeframe: Timeframe;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/**
 * Market Data domain service (US115).
 * saveBars / getBar / getRange / deleteRange.
 * Storage is delegated to MarketDataRepository (no owned Map).
 *
 * Workspace-scoped. No REST / Prisma / Pipeline / Backtesting.
 */
@Injectable()
export class MarketDataDomainService {
  constructor(
    @Inject(MARKET_DATA_REPOSITORY)
    private readonly repository: MarketDataRepository,
  ) {}

  saveBars(inputs: SaveMarketBarInput[]): MarketBar[] {
    if (inputs.length === 0) return [];

    const bars = inputs.map((input) => this.toBar(input));
    this.repository.saveBars(bars);
    return bars;
  }

  getBar(id: MarketBarId | string, workspaceId: string): MarketBar | null {
    assertNonEmpty(workspaceId, 'workspaceId');
    return this.repository.findById(id, workspaceId.trim());
  }

  getRange(query: MarketDataRangeQuery): MarketBar[] {
    return this.repository.findRange(this.normalizeQuery(query));
  }

  deleteRange(query: MarketDataRangeQuery): number {
    return this.repository.deleteRange(this.normalizeQuery(query));
  }

  private toBar(input: SaveMarketBarInput): MarketBar {
    assertNonEmpty(input.workspaceId, 'workspaceId');
    assertNonEmpty(String(input.instrument), 'instrument');
    assertNonEmpty(input.timestamp, 'timestamp');
    assertFiniteNumber(input.open, 'open');
    assertFiniteNumber(input.high, 'high');
    assertFiniteNumber(input.low, 'low');
    assertFiniteNumber(input.close, 'close');
    assertFiniteNumber(input.volume, 'volume');

    if (input.volume < 0) {
      throw new Error('volume must not be negative');
    }
    if (input.high < input.low) {
      throw new Error('high must be greater than or equal to low');
    }
    if (input.high < input.open || input.high < input.close) {
      throw new Error('high must be greater than or equal to open and close');
    }
    if (input.low > input.open || input.low > input.close) {
      throw new Error('low must be less than or equal to open and close');
    }
    if (Number.isNaN(Date.parse(input.timestamp))) {
      throw new Error('timestamp must be a valid ISO-8601 datetime');
    }

    return {
      id: toMarketBarId(input.id?.toString().trim() || randomUUID()),
      workspaceId: input.workspaceId.trim(),
      instrument: toInstrument(String(input.instrument).trim()),
      timeframe: input.timeframe,
      timestamp: input.timestamp.trim(),
      open: input.open,
      high: input.high,
      low: input.low,
      close: input.close,
      volume: input.volume,
    };
  }

  private normalizeQuery(query: MarketDataRangeQuery): MarketDataRangeQuery {
    assertNonEmpty(query.workspaceId, 'workspaceId');
    assertNonEmpty(String(query.instrument), 'instrument');
    assertNonEmpty(query.from, 'from');
    assertNonEmpty(query.to, 'to');

    if (Number.isNaN(Date.parse(query.from)) || Number.isNaN(Date.parse(query.to))) {
      throw new Error('from and to must be valid ISO-8601 datetimes');
    }
    if (query.from > query.to) {
      throw new Error('from must be less than or equal to to');
    }

    return {
      workspaceId: query.workspaceId.trim(),
      instrument: toInstrument(String(query.instrument).trim()),
      timeframe: query.timeframe,
      from: query.from.trim(),
      to: query.to.trim(),
    };
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new Error(`${field} must not be empty`);
  }
}

function assertFiniteNumber(value: number, field: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
}
