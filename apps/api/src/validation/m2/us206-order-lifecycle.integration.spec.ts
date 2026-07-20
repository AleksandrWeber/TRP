/**
 * US206 — Order Lifecycle Engine persistence + Position/Portfolio integration.
 */
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { OrderEventPublisher } from '../../modules/order-engine/order-event-publisher';
import { OrderExecutionService } from '../../modules/order-engine/order-execution.service';
import { OrderFillService } from '../../modules/order-engine/order-fill.service';
import { OrderHistoryService } from '../../modules/order-engine/order-history.service';
import { OrderService } from '../../modules/order-engine/order.service';
import { PrismaOrderRepository } from '../../modules/order-engine/prisma-order.repository';
import { PortfolioEventPublisher } from '../../modules/portfolio-engine/portfolio-event-publisher';
import { PortfolioService } from '../../modules/portfolio-engine/portfolio.service';
import { PortfolioSnapshotService } from '../../modules/portfolio-engine/portfolio-snapshot.service';
import { PrismaPortfolioRepository } from '../../modules/portfolio-engine/prisma-portfolio.repository';
import { PositionEventPublisher } from '../../modules/position-engine/position-event-publisher';
import { PositionHistoryService } from '../../modules/position-engine/position-history.service';
import { PositionService } from '../../modules/position-engine/position.service';
import { PrismaPositionRepository } from '../../modules/position-engine/prisma-position.repository';
import { PrismaRiskRepository } from '../../modules/risk-engine/prisma-risk.repository';
import { RiskEventPublisher } from '../../modules/risk-engine/risk-event-publisher';
import { RiskService } from '../../modules/risk-engine/risk.service';

const WS = 'ws-us206-integration';
const OWNER = 'owner-us206';
const T0 = '2026-07-20T16:00:00.000Z';

describe('US206 — Order Lifecycle Engine persistence integration', () => {
  const prisma = new PrismaClient();
  const portfolioRepo = new PrismaPortfolioRepository(prisma);
  const portfolioEvents = new PortfolioEventPublisher(portfolioRepo);
  const snapshots = new PortfolioSnapshotService(portfolioRepo, portfolioEvents);
  const portfolios = new PortfolioService(portfolioRepo, snapshots, portfolioEvents, {
    get: () => 'development',
  } as unknown as ConfigService);

  const positionRepo = new PrismaPositionRepository(prisma);
  const positionEvents = new PositionEventPublisher(positionRepo);
  const positionHistory = new PositionHistoryService(positionRepo);
  const positions = new PositionService(positionRepo, positionHistory, positionEvents, portfolios);

  const riskRepo = new PrismaRiskRepository(prisma);
  const riskEvents = new RiskEventPublisher(riskRepo);
  const risk = new RiskService(riskRepo, riskEvents, portfolios, positions);

  const orderRepo = new PrismaOrderRepository(prisma);
  const orderEvents = new OrderEventPublisher(orderRepo);
  const orderHistory = new OrderHistoryService(orderRepo, orderEvents);
  const fills = new OrderFillService(orderRepo);
  const execution = new OrderExecutionService(
    orderRepo,
    fills,
    orderHistory,
    orderEvents,
    positions,
    portfolios,
  );
  const service = new OrderService(
    orderRepo,
    orderHistory,
    orderEvents,
    fills,
    execution,
    portfolios,
    risk,
  );

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

    const decisions = await prisma.tradingRiskDecision.findMany({
      where: { portfolioId: { in: portfolioIds } },
    });
    const decisionIds = decisions.map((d) => d.id);
    if (decisionIds.length > 0) {
      await prisma.tradingRiskEvent.deleteMany({ where: { decisionId: { in: decisionIds } } });
      await prisma.tradingRiskDecision.deleteMany({ where: { id: { in: decisionIds } } });
    }
    await prisma.tradingRiskPolicy.deleteMany({ where: { portfolioId: { in: portfolioIds } } });

    const orders = await prisma.order.findMany({
      where: { portfolioId: { in: portfolioIds } },
    });
    const orderIds = orders.map((o) => o.id);
    if (orderIds.length > 0) {
      await prisma.orderEvent.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.orderHistory.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.orderFill.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    const positionRows = await prisma.position.findMany({
      where: { portfolioId: { in: portfolioIds } },
    });
    const positionIds = positionRows.map((p) => p.id);
    if (positionIds.length > 0) {
      await prisma.positionEvent.deleteMany({ where: { positionId: { in: positionIds } } });
      await prisma.positionHistory.deleteMany({ where: { positionId: { in: positionIds } } });
      await prisma.position.deleteMany({ where: { id: { in: positionIds } } });
    }

    await prisma.portfolioEvent.deleteMany({ where: { portfolioId: { in: portfolioIds } } });
    await prisma.portfolioSnapshot.deleteMany({ where: { portfolioId: { in: portfolioIds } } });
    await prisma.portfolio.deleteMany({ where: { workspaceId: WS } });
  }

  it('persists order lifecycle, fills, history, and position sync', async () => {
    service.setClock({ now: () => new Date(T0), iso: () => T0 });
    positions.setClock({ now: () => new Date(T0), iso: () => T0 });
    portfolios.setClock({ now: () => new Date(T0), iso: () => T0 });

    const created = await service.create(WS, OWNER, {
      symbol: 'BTC-USD',
      side: 'BUY',
      type: 'LIMIT',
      quantity: '2',
      requestedPrice: '100',
    });

    const row = await prisma.order.findUnique({ where: { id: created.id } });
    expect(row?.symbol).toBe('BTC-USD');
    expect(row?.status).toBe('PENDING');
    expect(row?.quantity.toFixed()).toBe('2');

    const filled = await service.execute(WS, OWNER, created.id, { price: '101' });
    expect(filled.status).toBe('FILLED');
    expect(filled.positionId).toBeTruthy();

    const fillRows = await prisma.orderFill.findMany({ where: { orderId: created.id } });
    expect(fillRows).toHaveLength(1);
    expect(fillRows[0].price.toFixed()).toBe('101');

    const historyRows = await prisma.orderHistory.findMany({
      where: { orderId: created.id },
      orderBy: { timestamp: 'asc' },
    });
    expect(historyRows.map((h) => h.currentStatus)).toEqual(
      expect.arrayContaining(['VALIDATED', 'PENDING', 'FILLED']),
    );

    const eventRows = await prisma.orderEvent.findMany({ where: { orderId: created.id } });
    expect(eventRows.map((e) => e.eventType)).toEqual(
      expect.arrayContaining(['OrderCreated', 'OrderFilled', 'OrderUpdated']),
    );

    const position = await prisma.position.findUnique({ where: { id: filled.positionId! } });
    expect(position?.side).toBe('LONG');
    expect(position?.quantity.toFixed()).toBe('2');
  });
});
