import { Injectable } from '@nestjs/common';
import { hashBars, type OhlcvBar as ResearchBar } from '@trp/research';
import { getGitCommit } from '../../common/git';
import { BinanceClient } from '../market/binance.client';
import { PrismaService } from '../../storage/prisma/prisma.module';

@Injectable()
export class DatasetsService {
  private readonly binance = new BinanceClient();

  constructor(private readonly prisma: PrismaService) {}

  async importFromBinance(symbol = 'BTCUSDT', timeframe = '1h', limit = 1000) {
    const bars = await this.binance.fetchKlines(symbol, timeframe, limit);
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
}
