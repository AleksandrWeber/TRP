import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DurableEventEnvelope } from '../../modules/event-processing/domain/durable-event-envelope';
import { toDurableEventId } from '../../modules/event-processing/domain/durable-event-id';
import { EventProcessingModule } from '../../modules/event-processing/event-processing.module';
import type {
  OutboxRepository,
  UnpublishedOutboxQuery,
} from '../../modules/event-processing/repositories/outbox.repository';
import { OUTBOX_REPOSITORY } from '../../modules/event-processing/repositories/outbox.repository.token';
import { PrismaOutboxRepository } from '../../modules/event-processing/repositories/prisma-outbox.repository';
import { PrismaInboxRepository } from '../../modules/event-processing/repositories/prisma-inbox.repository';
import { PrismaConsumerCheckpointRepository } from '../../modules/event-processing/repositories/prisma-consumer-checkpoint.repository';
import { PrismaTransactionalOutboxWriter } from '../../modules/event-processing/repositories/prisma-transactional-outbox.writer';
import { OutboxDispatcher } from '../../modules/event-processing/outbox-dispatcher.service';
import { OutboxPollingService } from '../../modules/event-processing/outbox-polling.service';
import { TRANSACTIONAL_OUTBOX_WRITER } from '../../modules/event-processing/transactional-outbox-writer.token';

const WS = 'ws-us155';
const EVENT_ID = 'us155-runtime-event';
const timestamp = '2026-07-18T14:00:00.000Z';

describe('US155 — PostgreSQL event runtime wiring', () => {
  const prisma = new PrismaClient();
  let moduleRef: TestingModule;

  beforeAll(async () => {
    await prisma.$connect();
    await cleanup();
    moduleRef = await Test.createTestingModule({
      imports: [EventProcessingModule],
    }).compile();
    await moduleRef.init();
  });

  afterAll(async () => {
    await moduleRef?.close();
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.outboxEvent.deleteMany({ where: { workspaceId: WS } });
    await prisma.inboxRecord.deleteMany({ where: { consumerId: { startsWith: 'us155-' } } });
    await prisma.consumerCheckpointRecord.deleteMany({
      where: { consumerId: { startsWith: 'us155-' } },
    });
  }

  it('binds runtime tokens to Prisma repositories and writer', () => {
    expect(moduleRef.get(PrismaOutboxRepository)).toBeInstanceOf(PrismaOutboxRepository);
    expect(moduleRef.get(PrismaInboxRepository)).toBeInstanceOf(PrismaInboxRepository);
    expect(moduleRef.get(PrismaConsumerCheckpointRepository)).toBeInstanceOf(
      PrismaConsumerCheckpointRepository,
    );
    expect(moduleRef.get(TRANSACTIONAL_OUTBOX_WRITER)).toBeInstanceOf(
      PrismaTransactionalOutboxWriter,
    );
  });

  it('keeps unconsumed events pending, then durably publishes after acknowledgement', async () => {
    const postgresOutbox = moduleRef.get<OutboxRepository>(OUTBOX_REPOSITORY);
    const outbox = workspaceScopedOutbox(postgresOutbox, WS);
    const dispatcher = new OutboxDispatcher(outbox);
    const polling = new OutboxPollingService(dispatcher);
    dispatcher.start();
    const envelope: DurableEventEnvelope = Object.freeze({
      eventId: toDurableEventId(EVENT_ID),
      eventType: 'RuntimeWiringValidated',
      schemaVersion: 1,
      aggregateType: 'RuntimeValidation',
      aggregateId: EVENT_ID,
      aggregateVersion: 1,
      workspaceId: WS,
      occurredAt: timestamp,
      recordedAt: timestamp,
      payload: Object.freeze({ decimalValue: '0.1' }),
    });
    await outbox.insert(envelope, timestamp);

    await polling.pollOnce('2026-07-18T14:00:01.000Z');
    expect((await outbox.findByEventId(EVENT_ID))?.status).toBe('pending');

    const seen: string[] = [];
    dispatcher.register({
      consumerId: 'us155-runtime-consumer',
      handle: async (event) => {
        seen.push(String(event.eventId));
      },
    });
    await polling.pollOnce('2026-07-18T14:00:02.000Z');

    expect(seen).toEqual([EVENT_ID]);
    expect((await outbox.findByEventId(EVENT_ID))?.status).toBe('published');
    await dispatcher.stop();
  });
});

function workspaceScopedOutbox(
  repository: OutboxRepository,
  workspaceId: string,
): OutboxRepository {
  return {
    insert: (envelope, createdAt) => repository.insert(envelope, createdAt),
    findByEventId: (eventId) => repository.findByEventId(eventId),
    listUnpublished: (query: UnpublishedOutboxQuery = {}) =>
      repository.listUnpublished({ ...query, workspaceId }),
    updateDelivery: (eventId, patch) => repository.updateDelivery(eventId, patch),
    listByStatus: (status) => repository.listByStatus(status),
  };
}
