import { BadRequestException, Injectable } from '@nestjs/common';
import { hashBars, type OhlcvBar as ResearchBar } from '@trp/research';
import { getGitCommit } from '../../common/git';
import { BinanceClient } from '../market/binance.client';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { createCandle, type Candle } from '../market-data-domain/domain/candle';
import {
  isTimeframe,
  timeframeToMillis,
  type Timeframe,
} from '../market-data-domain/domain/timeframe';
import { isMarketRegime, type MarketRegime } from './dataset-metadata';

export type BinanceImportInput = {
  symbol?: string;
  interval?: string;
  timeframe?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  displayName?: string;
  description?: string;
  marketRegime?: MarketRegime;
  enabled?: boolean;
};

export type UpdateDatasetInput = {
  displayName?: string;
  description?: string;
  marketRegime?: MarketRegime;
  enabled?: boolean;
};

@Injectable()
export class DatasetsService {
  private readonly binance = new BinanceClient();

  constructor(private readonly prisma: PrismaService) {}

  async importFromBinance(input: BinanceImportInput = {}) {
    const symbol = input.symbol ?? 'BTCUSDT';
    const timeframe = input.interval ?? input.timeframe ?? '1h';
    const hasStartTime = input.startTime !== undefined;
    const hasEndTime = input.endTime !== undefined;

    if (hasStartTime !== hasEndTime) {
      throw new BadRequestException('startTime and endTime must be provided together');
    }

    const bars = hasStartTime
      ? await this.binance.fetchHistoricalKlines(
          symbol,
          timeframe,
          input.startTime!,
          input.endTime!,
        )
      : await this.binance.fetchKlines(symbol, timeframe, input.limit ?? 1000);

    if (bars.length === 0) {
      throw new BadRequestException('No Binance candles found for the requested period');
    }

    const contentHash = hashBars(bars);

    const existing = await this.prisma.dataset.findUnique({ where: { contentHash } });
    if (existing) {
      return { dataset: existing, created: false };
    }

    const dataset = await this.prisma.dataset.create({
      data: {
        displayName: input.displayName?.trim() || `${symbol} ${timeframe} historical dataset`,
        description: input.description?.trim() ?? '',
        marketRegime: input.marketRegime ?? 'UNCLASSIFIED',
        symbol,
        symbols: [symbol],
        timeframe,
        exchange: 'binance',
        enabled: input.enabled ?? true,
        contentHash,
        barCount: bars.length,
        startTime: new Date(bars[0].timestamp),
        endTime: new Date(bars.at(-1)!.timestamp),
        gitCommit: getGitCommit(),
        bars: {
          create: bars.map((bar) => ({
            timestamp: new Date(bar.timestamp),
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: bar.volume,
          })),
        },
      },
    });

    return { dataset, created: true };
  }

  async list() {
    const datasets = await this.prisma.dataset.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayName: true,
        description: true,
        marketRegime: true,
        symbol: true,
        symbols: true,
        timeframe: true,
        exchange: true,
        enabled: true,
        contentHash: true,
        barCount: true,
        startTime: true,
        endTime: true,
        gitCommit: true,
        createdAt: true,
        _count: { select: { experiments: true } },
      },
    });
    return datasets.map((dataset) => ({
      ...dataset,
      datasetId: dataset.id,
      startDate: dataset.startTime,
      endDate: dataset.endTime,
    }));
  }

  get(id: string) {
    return this.prisma.dataset.findUnique({ where: { id } });
  }

  listEnabled() {
    return this.prisma.dataset.findMany({
      where: { enabled: true },
      orderBy: [{ marketRegime: 'asc' }, { createdAt: 'asc' }],
    });
  }

  getMany(ids: readonly string[]) {
    return this.prisma.dataset.findMany({
      where: { id: { in: [...ids] } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, input: UpdateDatasetInput) {
    if (input.marketRegime !== undefined && !isMarketRegime(input.marketRegime)) {
      throw new BadRequestException(`Unsupported market regime: ${input.marketRegime}`);
    }
    if (!(await this.get(id))) return null;
    return this.prisma.dataset.update({
      where: { id },
      data: {
        displayName: input.displayName?.trim(),
        description: input.description?.trim(),
        marketRegime: input.marketRegime,
        enabled: input.enabled,
      },
    });
  }

  async getBars(datasetId: string): Promise<ResearchBar[]> {
    const rows = await this.prisma.ohlcvBar.findMany({
      where: { datasetId },
      orderBy: { timestamp: 'asc' },
    });

    return rows.map((row) => ({
      timestamp: row.timestamp.getTime(),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    }));
  }

  async getCandles(datasetId: string, symbol: string): Promise<Candle[]> {
    const dataset = await this.get(datasetId);
    if (!dataset) return [];
    if (!isTimeframe(dataset.timeframe)) {
      throw new BadRequestException(`Dataset timeframe is unsupported: ${dataset.timeframe}`);
    }
    const supportedSymbols = dataset.symbols.length > 0 ? dataset.symbols : [dataset.symbol];
    if (!supportedSymbols.includes(symbol) || dataset.symbol !== symbol) return [];

    const rows = await this.prisma.ohlcvBar.findMany({
      where: { datasetId },
      orderBy: { timestamp: 'asc' },
    });
    const timeframe = dataset.timeframe as Timeframe;
    const duration = timeframeToMillis(timeframe);
    return rows.map((row) =>
      createCandle({
        symbol,
        timeframe,
        openTime: row.timestamp.toISOString(),
        closeTime: new Date(row.timestamp.getTime() + duration).toISOString(),
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
      }),
    );
  }
}
