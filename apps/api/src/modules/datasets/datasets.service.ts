import { Injectable } from '@nestjs/common';
import { hashBars, type OhlcvBar as ResearchBar } from '@trp/research';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { getGitCommit } from '../../common/git';

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

@Injectable()
export class DatasetsService {
  constructor(private readonly prisma: PrismaService) {}

  async importFromBinance(symbol = 'BTCUSDT', timeframe = '1h', limit = 1000) {
    const bars = await this.fetchBinanceKlines(symbol, timeframe, limit);
    const contentHash = hashBars(bars);

    const existing = await this.prisma.dataset.findUnique({ where: { contentHash } });
    if (existing) {
      return { dataset: existing, created: false };
    }

    const dataset = await this.prisma.dataset.create({
      data: {
        symbol,
        timeframe,
        exchange: 'binance',
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

  list() {
    return this.prisma.dataset.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        symbol: true,
        timeframe: true,
        exchange: true,
        contentHash: true,
        barCount: true,
        startTime: true,
        endTime: true,
        gitCommit: true,
        createdAt: true,
        _count: { select: { experiments: true } },
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

  private async fetchBinanceKlines(
    symbol: string,
    interval: string,
    limit: number,
  ): Promise<ResearchBar[]> {
    const url = new URL('https://api.binance.com/api/v3/klines');
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('interval', interval);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as BinanceKline[];
    return data.map((kline) => ({
      timestamp: kline[0],
      open: Number(kline[1]),
      high: Number(kline[2]),
      low: Number(kline[3]),
      close: Number(kline[4]),
      volume: Number(kline[5]),
    }));
  }
}
