import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PortfolioEventPublisher } from '../../modules/portfolio-engine/portfolio-event-publisher';
import { PortfolioService } from '../../modules/portfolio-engine/portfolio.service';
import { PortfolioSnapshotService } from '../../modules/portfolio-engine/portfolio-snapshot.service';
import { PrismaPortfolioRepository } from '../../modules/portfolio-engine/prisma-portfolio.repository';
import { PositionEventPublisher } from '../../modules/position-engine/position-event-publisher';
import { PositionHistoryService } from '../../modules/position-engine/position-history.service';
import { PositionService } from '../../modules/position-engine/position.service';
import { PrismaPositionRepository } from '../../modules/position-engine/prisma-position.repository';

const WS = 'ws-us205-integration';
const OWNER = 'owner-us205';
const T0 = '2026-07-20T14:00:00.000Z';

describe('US205 — Position Engine persistence integration', () => {
  const prisma = new PrismaClient();
  const portfolioRepo = new PrismaPortfolioRepository(prisma);
  const portfolioEvents = new PortfolioEventPublisher(portfolioRepo);
  const snapshots = new PortfolioSnapshotService(portfolioRepo, portfolioEvents);
  const portfolios = new PortfolioService(portfolioRepo, snapshots, portfolioEvents, {
    get: () => 'development',
  } as unknown as ConfigService);

  const positionRepo = new PrismaPositionRepository(prisma);
  const positionEvents = new PositionEventPublisher(positionRepo);
  const history = new PositionHistoryService(positionRepo);
  const service = new PositionService(positionRepo, history, positionEvents, portfolios);

  beforeAll(() => prisma.$connect());
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    const rows = await prisma.portfolio.findMany({ where: { workspaceId: WS } });
    const portfolioIds = rows.map((r) => r.id);
    if (portfolioIds.length === 0) return;

    const positions = await prisma.position.findMany({
      where: { portfolioId: { in: portfolioIds } },
    });
    const positionIds = positions.map((p) => p.id);
    if (positionIds.length > 0) {
      await prisma.positionEvent.deleteMany({ where: { positionId: { in: positionIds } } });
      await prisma.positionHistory.deleteMany({ where: { positionId: { in: positionIds } } });
      await prisma.position.deleteMany({ where: { id: { in: positionIds } } });
    }

    await prisma.portfolioEvent.deleteMany({ where: { portfolioId: { in: portfolioIds } } });
    await prisma.portfolioSnapshot.deleteMany({ where: { portfolioId: { in: portfolioIds } } });
    await prisma.portfolio.deleteMany({ where: { workspaceId: WS } });
  }

  it('persists position, history, events, and portfolio sync', async () => {
    service.setClock({ now: () => new Date(T0), iso: () => T0 });
    portfolios.setClock({ now: () => new Date(T0), iso: () => T0 });

    const opened = await service.open(WS, OWNER, {
      symbol: 'BTC-USD',
      side: 'LONG',
      quantity: '2',
      entryPrice: '100',
    });

    const row = await prisma.position.findUnique({ where: { id: opened.id } });
    expect(row?.symbol).toBe('BTC-USD');
    expect(row?.quantity.toFixed()).toBe('2');
    expect(row?.status).toBe('OPEN');

    const historyRows = await prisma.positionHistory.findMany({
      where: { positionId: opened.id },
    });
    expect(historyRows.map((h) => h.action)).toEqual(['OPENED']);

    const eventRows = await prisma.positionEvent.findMany({
      where: { positionId: opened.id },
      orderBy: { occurredAt: 'asc' },
    });
    expect(eventRows.map((e) => e.eventType)).toEqual([
      'PositionOpened',
      'PositionUpdated',
      'PnLUpdated',
    ]);

    const marked = await service.markPrice(WS, OWNER, {
      positionId: opened.id,
      markPrice: '110',
    });
    expect(marked.unrealizedPnL).toBe('20');

    const portfolio = await portfolios.getPortfolio(WS);
    expect(portfolio.equity.unrealizedPnL).toBe('20');
    expect(portfolio.margin.usedMargin).toBe('220');

    const closed = await service.close(WS, OWNER, {
      positionId: opened.id,
      price: '115',
    });
    expect(closed.status).toBe('CLOSED');
    expect(closed.realizedPnL).toBe('30');

    const portfolioAfter = await portfolios.getPortfolio(WS);
    expect(portfolioAfter.equity.realizedPnL).toBe('30');
    expect(portfolioAfter.equity.unrealizedPnL).toBe('0');
    expect(portfolioAfter.margin.usedMargin).toBe('0');
  });

  it('persists partial close and increase average entry', async () => {
    service.setClock({ now: () => new Date(T0), iso: () => T0 });
    portfolios.setClock({ now: () => new Date(T0), iso: () => T0 });

    const opened = await service.open(WS, OWNER, {
      symbol: 'ETH-USD',
      side: 'LONG',
      quantity: '2',
      entryPrice: '50',
    });
    const increased = await service.increase(WS, OWNER, {
      positionId: opened.id,
      quantity: '2',
      price: '70',
    });
    expect(increased.averageEntryPrice).toBe('60');

    const reduced = await service.reduce(WS, OWNER, {
      positionId: opened.id,
      quantity: '1',
      price: '80',
    });
    expect(reduced.status).toBe('PARTIALLY_CLOSED');
    expect(reduced.realizedPnL).toBe('20');

    const row = await prisma.position.findUnique({ where: { id: opened.id } });
    expect(row?.status).toBe('PARTIALLY_CLOSED');
    expect(row?.quantity.toFixed()).toBe('3');
    expect(row?.realizedPnl.toFixed()).toBe('20');
  });
});
