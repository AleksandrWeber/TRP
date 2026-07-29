import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PrismaOutboxRepository,
  toDurableEventId,
  type DurableEventEnvelope,
} from '../../modules/event-processing';
import { PrismaPositionRepository } from '../../modules/positions';
import { PrismaWorkspaceRepository } from '../../modules/workspace/repositories/prisma-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';

const WORKSPACE_ID = 'ws-m3-e12-integration';
const EVENT_ID = toDurableEventId('evt-m3-e12-fanout');
const POSITION_ID = 'pos-m3-e12';
const FILL_ID = 'fill-m3-e12';
const AT = '2026-07-18T21:30:00.000Z';

describe('M3 E12 — durable entry gates', () => {
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await cleanup(prisma);
  });

  afterAll(async () => {
    await cleanup(prisma);
    await prisma.$disconnect();
  });

  it('rehydrates durable Workspace ownership after service restart', async () => {
    const repository = new PrismaWorkspaceRepository(prisma);
    const first = new WorkspaceDomainService(repository);
    const created = await first.create({
      name: 'M3 E12',
      ownerUserId: 'owner-m3-e12',
      createdAt: AT,
    });
    await prisma.workspaceRecord.update({
      where: { id: created.id },
      data: { id: WORKSPACE_ID },
    });

    const restarted = new WorkspaceDomainService(repository);
    await restarted.onModuleInit();
    const access = new WorkspaceAccessService(restarted);

    expect(access.isMember(WORKSPACE_ID, 'owner-m3-e12')).toBe(true);
    expect(access.isMember(WORKSPACE_ID, 'foreign-user')).toBe(false);
  });

  it('persists independent Outbox consumer acknowledgement across repository restart', async () => {
    const outbox = new PrismaOutboxRepository(prisma);
    await outbox.insert(envelope(), AT);
    await outbox.recordConsumerDelivery(EVENT_ID, 'consumer-a', AT);

    const restarted = new PrismaOutboxRepository(prisma);
    expect(await restarted.listDeliveredConsumerIds(EVENT_ID)).toEqual(['consumer-a']);
  });

  it('persists authoritative per-Position Fill application order atomically', async () => {
    await prisma.paperFill.create({
      data: {
        id: FILL_ID,
        workspaceId: WORKSPACE_ID,
        orderId: 'order-m3-e12',
        paperAccountId: 'account-m3-e12',
        tradingSessionId: 'session-m3-e12',
        adapterOrderId: 'adapter-order-m3-e12',
        adapterFillId: 'adapter-fill-m3-e12',
        sequence: 1,
        instrument: 'BTCUSDT',
        side: 'buy',
        price: '100',
        quantity: '1',
        grossNotional: '100',
        fee: '0.1',
        executionContextHash: 'context-m3-e12',
        configurationId: 'configuration-m3-e12',
        configurationVersion: 1,
        configurationHash: 'configuration-hash-m3-e12',
        occurredAt: new Date(AT),
        recordedAt: new Date(AT),
      },
    });
    await prisma.paperPosition.create({
      data: {
        id: POSITION_ID,
        workspaceId: WORKSPACE_ID,
        paperAccountId: 'account-m3-e12',
        instrument: 'BTCUSDT',
        side: 'long',
        quantity: '1',
        averageEntryPrice: '100',
        costBasis: '100',
        realizedPnl: '0',
        version: 1,
        lastAppliedFillId: FILL_ID,
        lastAppliedFillSequence: 1,
        occurredAt: new Date(AT),
        recordedAt: new Date(AT),
      },
    });

    const positions = new PrismaPositionRepository(prisma);
    const transactions = new PrismaTransactionService(prisma);
    await transactions.run((transaction) =>
      positions.recordFillApplication(
        { positionId: POSITION_ID, fillId: FILL_ID, applicationSequence: 1 },
        AT,
        transaction,
      ),
    );

    expect(await positions.listFillApplications(WORKSPACE_ID, 'account-m3-e12')).toEqual([
      {
        positionId: POSITION_ID,
        fillId: FILL_ID,
        applicationSequence: 1,
        appliedAt: AT,
      },
    ]);
  });
});

function envelope(): DurableEventEnvelope {
  return Object.freeze({
    eventId: EVENT_ID,
    eventType: 'M3E12Validation',
    schemaVersion: 1,
    aggregateType: 'Validation',
    aggregateId: 'm3-e12',
    aggregateVersion: 1,
    workspaceId: WORKSPACE_ID,
    occurredAt: AT,
    recordedAt: AT,
    payload: Object.freeze({}),
  });
}

async function cleanup(prisma: PrismaClient): Promise<void> {
  await prisma.positionFillApplication.deleteMany({ where: { positionId: POSITION_ID } });
  await prisma.paperPosition.deleteMany({ where: { id: POSITION_ID } });
  await prisma.paperFill.deleteMany({ where: { id: FILL_ID } });
  await prisma.outboxConsumerDelivery.deleteMany({ where: { eventId: EVENT_ID } });
  await prisma.outboxEvent.deleteMany({ where: { eventId: EVENT_ID } });
  await prisma.workspaceRecord.deleteMany({
    where: { OR: [{ id: WORKSPACE_ID }, { ownerUserId: 'owner-m3-e12' }] },
  });
}
