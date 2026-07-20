import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PortfolioEventPublisher } from '../../modules/portfolio-engine/portfolio-event-publisher';
import { PortfolioService } from '../../modules/portfolio-engine/portfolio.service';
import { PortfolioSnapshotService } from '../../modules/portfolio-engine/portfolio-snapshot.service';
import { PrismaPortfolioRepository } from '../../modules/portfolio-engine/prisma-portfolio.repository';

const WS = 'ws-us204-integration';
const OWNER = 'owner-us204';
const T0 = '2026-07-20T14:00:00.000Z';

describe('US204 — Portfolio Engine persistence integration', () => {
  const prisma = new PrismaClient();
  const repository = new PrismaPortfolioRepository(prisma);
  const events = new PortfolioEventPublisher(repository);
  const snapshots = new PortfolioSnapshotService(repository, events);
  const config = {
    get: (key: string) => (key === 'NODE_ENV' ? 'development' : undefined),
  } as ConfigService;
  const service = new PortfolioService(repository, snapshots, events, config);

  beforeAll(() => prisma.$connect());
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    const rows = await prisma.portfolio.findMany({ where: { workspaceId: WS } });
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return;
    await prisma.portfolioEvent.deleteMany({ where: { portfolioId: { in: ids } } });
    await prisma.portfolioSnapshot.deleteMany({ where: { portfolioId: { in: ids } } });
    await prisma.portfolio.deleteMany({ where: { workspaceId: WS } });
  }

  it('persists portfolio, snapshot, and events via Prisma', async () => {
    service.setClock({ now: () => new Date(T0), iso: () => T0 });
    const view = await service.getOrCreate(WS, OWNER);

    const row = await prisma.portfolio.findUnique({ where: { id: view.id } });
    expect(row?.cash.toFixed()).toBe('100000');
    expect(row?.currency).toBe('USD');
    expect(row?.status).toBe('ACTIVE');

    const snapshotRows = await prisma.portfolioSnapshot.findMany({
      where: { portfolioId: view.id },
    });
    expect(snapshotRows).toHaveLength(1);
    expect(snapshotRows[0]?.equity.toFixed()).toBe('100000');

    const eventRows = await prisma.portfolioEvent.findMany({
      where: { portfolioId: view.id },
      orderBy: { occurredAt: 'asc' },
    });
    expect(eventRows.map((e) => e.eventType)).toEqual(['PortfolioCreated', 'SnapshotCreated']);
  });

  it('persists financial updates and additional snapshots', async () => {
    service.setClock({ now: () => new Date(T0), iso: () => T0 });
    await service.getOrCreate(WS, OWNER);
    const updated = await service.applyFinancials(WS, {
      cash: '98000',
      realizedPnL: '1500',
      unrealizedPnL: '-200',
      usedMargin: '5000',
    });

    expect(updated.equity.equity).toBe('99300');
    expect(updated.margin.availableMargin).toBe('94300');

    const snapshotsList = await service.listSnapshots(WS);
    expect(snapshotsList.length).toBeGreaterThanOrEqual(2);

    const row = await prisma.portfolio.findFirst({ where: { workspaceId: WS } });
    expect(row?.realizedPnl.toFixed()).toBe('1500');
    expect(row?.usedMargin.toFixed()).toBe('5000');
  });

  it('resets durable state to initial cash', async () => {
    service.setClock({ now: () => new Date(T0), iso: () => T0 });
    await service.getOrCreate(WS, OWNER);
    await service.applyFinancials(WS, {
      cash: '10',
      realizedPnL: '5',
      unrealizedPnL: '0',
      usedMargin: '1',
    });
    const reset = await service.reset(WS);
    expect(reset.balance.cash).toBe('100000');
    expect(reset.equity.realizedPnL).toBe('0');
    expect(reset.margin.usedMargin).toBe('0');

    const row = await prisma.portfolio.findFirst({ where: { workspaceId: WS } });
    expect(row?.cash.toFixed()).toBe('100000');
  });
});
