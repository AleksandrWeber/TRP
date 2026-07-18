import { Module } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { IdempotentConsumerProcessor } from './idempotent-consumer.processor';
import { OutboxDispatcher } from './outbox-dispatcher.service';
import { InMemoryConsumerCheckpointRepository } from './repositories/in-memory-consumer-checkpoint.repository';
import { InMemoryInboxRepository } from './repositories/in-memory-inbox.repository';
import { InMemoryOutboxRepository } from './repositories/in-memory-outbox.repository';
import { InMemoryTransactionalOutboxWriter } from './repositories/in-memory-transactional-outbox.writer';
import { CONSUMER_CHECKPOINT_REPOSITORY } from './repositories/consumer-checkpoint.repository.token';
import { INBOX_REPOSITORY } from './repositories/inbox.repository.token';
import { OUTBOX_REPOSITORY } from './repositories/outbox.repository.token';
import { TRANSACTIONAL_OUTBOX_WRITER } from './transactional-outbox-writer.token';

/**
 * Event Processing Nest module (US128–US130).
 * ADR-013 Outbox/Inbox/checkpoint/dispatcher foundation — InMemory for M1 E1.
 * Existing EventsModule remains the process-local activity bus.
 */
@Module({
  providers: [
    InMemoryOutboxRepository,
    InMemoryInboxRepository,
    InMemoryConsumerCheckpointRepository,
    {
      provide: OUTBOX_REPOSITORY,
      useFactory: (repo: InMemoryOutboxRepository, metrics: Metrics) =>
        instrumentRepository(repo, metrics, 'outbox'),
      inject: [InMemoryOutboxRepository, METRICS],
    },
    {
      provide: INBOX_REPOSITORY,
      useFactory: (repo: InMemoryInboxRepository, metrics: Metrics) =>
        instrumentRepository(repo, metrics, 'inbox'),
      inject: [InMemoryInboxRepository, METRICS],
    },
    {
      provide: CONSUMER_CHECKPOINT_REPOSITORY,
      useFactory: (repo: InMemoryConsumerCheckpointRepository, metrics: Metrics) =>
        instrumentRepository(repo, metrics, 'consumer-checkpoint'),
      inject: [InMemoryConsumerCheckpointRepository, METRICS],
    },
    {
      provide: TRANSACTIONAL_OUTBOX_WRITER,
      useFactory: (repo: InMemoryOutboxRepository) => new InMemoryTransactionalOutboxWriter(repo),
      inject: [InMemoryOutboxRepository],
    },
    {
      provide: IdempotentConsumerProcessor,
      useFactory: (
        inbox: InMemoryInboxRepository,
        checkpoints: InMemoryConsumerCheckpointRepository,
      ) => new IdempotentConsumerProcessor(inbox, checkpoints),
      inject: [InMemoryInboxRepository, InMemoryConsumerCheckpointRepository],
    },
    {
      provide: OutboxDispatcher,
      useFactory: (repo: InMemoryOutboxRepository) => {
        const dispatcher = new OutboxDispatcher(repo);
        dispatcher.start();
        return dispatcher;
      },
      inject: [InMemoryOutboxRepository],
    },
  ],
  exports: [
    OUTBOX_REPOSITORY,
    INBOX_REPOSITORY,
    CONSUMER_CHECKPOINT_REPOSITORY,
    TRANSACTIONAL_OUTBOX_WRITER,
    IdempotentConsumerProcessor,
    OutboxDispatcher,
    InMemoryOutboxRepository,
  ],
})
export class EventProcessingModule {}
