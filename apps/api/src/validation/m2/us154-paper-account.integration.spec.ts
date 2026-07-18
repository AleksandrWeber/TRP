import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import { TransactionalOutboxAppender } from '../../modules/event-processing/transactional-outbox-appender';
import { PaperAccountService } from '../../modules/paper-account/paper-account.service';
import { PrismaPaperAccountRepository } from '../../modules/paper-account/persistence/prisma-paper-account.repository';

const WS = 'ws-us154';
const OTHER_WS = 'ws-us154-other';
const timestamp = '2026-07-18T13:00:00.000Z';

describe('US154 — durable PostgreSQL paper account', () => {
  const prisma = new PrismaClient();
  const transactions = new PrismaTransactionService(prisma);
  const accounts = new PrismaPaperAccountRepository(prisma);
  const outbox = new TransactionalOutboxAppender();
  const service = new PaperAccountService(accounts, transactions, outbox);

  beforeAll(() => prisma.$connect());
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.outboxEvent.deleteMany({
      where: { workspaceId: { in: [WS, OTHER_WS] }, aggregateType: 'PaperAccount' },
    });
    await prisma.paperAccount.deleteMany({
      where: { workspaceId: { in: [WS, OTHER_WS] } },
    });
  }

  it('atomically persists an account and decimal-string creation event', async () => {
    const account = await service.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '10000.125000000000000001',
      idempotencyKey: 'open-primary',
      actorId: 'operator-1',
      correlationId: 'correlation-1',
      openedAt: timestamp,
      recordedAt: timestamp,
    });

    const row = await prisma.paperAccount.findUnique({ where: { id: account.id } });
    const event = await prisma.outboxEvent.findFirst({
      where: { aggregateType: 'PaperAccount', aggregateId: account.id },
    });
    expect(row?.openingCapital.toFixed()).toBe('10000.125000000000000001');
    expect(event?.status).toBe('pending');
    expect(event?.payload).toMatchObject({
      openingCapital: '10000.125000000000000001',
      accountId: account.id,
    });
    expect(event?.payload).not.toHaveProperty('cashBalance');
  });

  it('is idempotent within a workspace and rejects changed command reuse', async () => {
    const command = {
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper' as const,
      openingCapital: '500',
      idempotencyKey: 'same-command',
      actorId: 'operator-1',
      openedAt: timestamp,
      recordedAt: timestamp,
    };
    const first = await service.create(command);
    const duplicate = await service.create(command);
    expect(duplicate.id).toBe(first.id);
    expect(await prisma.paperAccount.count({ where: { workspaceId: WS } })).toBe(1);

    await expect(service.create({ ...command, openingCapital: '501' })).rejects.toThrow(
      /idempotency key reused/,
    );
  });

  it('enforces workspace-scoped lookups and rolls account back if Outbox append fails', async () => {
    const failing = new PaperAccountService(accounts, transactions, {
      append: async () => {
        throw new Error('injected outbox failure');
      },
    } as TransactionalOutboxAppender);
    await expect(
      failing.create({
        workspaceId: OTHER_WS,
        currency: 'USDT',
        mode: 'paper',
        openingCapital: '100',
        idempotencyKey: 'rollback',
        actorId: 'operator-1',
        openedAt: timestamp,
        recordedAt: timestamp,
      }),
    ).rejects.toThrow(/injected outbox failure/);

    expect(await prisma.paperAccount.count({ where: { workspaceId: OTHER_WS } })).toBe(0);

    const visible = await service.create({
      workspaceId: WS,
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '100',
      idempotencyKey: 'workspace-scope',
      actorId: 'operator-1',
      openedAt: timestamp,
      recordedAt: timestamp,
    });
    expect(await service.get(OTHER_WS, visible.id)).toBeNull();
  });
});
