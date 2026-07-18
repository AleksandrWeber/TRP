import type { PrismaClient } from '@prisma/client';
import { createMarketSubscription } from '../domain/market-subscription';
import type { MarketSubscription } from '../domain/market-subscription';
import type { MarketSubscriptionPersistence } from './market-subscription-persistence';

/**
 * Prisma-backed durable subscription persistence (US142).
 */
export class PrismaMarketSubscriptionPersistence implements MarketSubscriptionPersistence {
  constructor(private readonly prisma: PrismaClient) {}

  async loadAll(): Promise<MarketSubscription[]> {
    const rows = await this.prisma.marketSubscriptionRecord.findMany();
    return rows.map(toDomain);
  }

  async loadByWorkspace(workspaceId: string): Promise<MarketSubscription[]> {
    const rows = await this.prisma.marketSubscriptionRecord.findMany({ where: { workspaceId } });
    return rows.map(toDomain);
  }

  async save(subscription: MarketSubscription): Promise<void> {
    const data = {
      workspaceId: subscription.workspaceId,
      sourceId: String(subscription.sourceId),
      instrument: String(subscription.instrument),
      channel: String(subscription.channel),
      streamId: String(subscription.streamId),
      timeframe: subscription.timeframe !== undefined ? String(subscription.timeframe) : null,
      state: String(subscription.state),
      updatedAt: new Date(subscription.updatedAt),
    };
    await this.prisma.marketSubscriptionRecord.upsert({
      where: { id: String(subscription.id) },
      create: { id: String(subscription.id), ...data },
      update: data,
    });
  }
}

type SubscriptionRow = {
  id: string;
  workspaceId: string;
  sourceId: string;
  instrument: string;
  channel: string;
  streamId: string;
  timeframe: string | null;
  state: string;
  updatedAt: Date;
};

function toDomain(row: SubscriptionRow): MarketSubscription {
  return createMarketSubscription({
    id: row.id,
    workspaceId: row.workspaceId,
    sourceId: row.sourceId,
    instrument: row.instrument,
    channel: row.channel,
    streamId: row.streamId,
    ...(row.timeframe !== null ? { timeframe: row.timeframe } : {}),
    state: row.state,
    updatedAt: row.updatedAt.toISOString(),
  });
}
