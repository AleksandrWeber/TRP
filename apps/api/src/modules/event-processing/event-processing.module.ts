import { Module } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { MetricsModule } from '../../metrics/metrics.module';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { IdempotentConsumerProcessor } from './idempotent-consumer.processor';
import { OutboxDispatcher } from './outbox-dispatcher.service';
import { OutboxPollingService } from './outbox-polling.service';
import type { ConsumerCheckpointRepository } from './repositories/consumer-checkpoint.repository';
import { CONSUMER_CHECKPOINT_REPOSITORY } from './repositories/consumer-checkpoint.repository.token';
import type { InboxRepository } from './repositories/inbox.repository';
import { INBOX_REPOSITORY } from './repositories/inbox.repository.token';
import type { OutboxRepository } from './repositories/outbox.repository';
import { OUTBOX_REPOSITORY } from './repositories/outbox.repository.token';
import { PrismaConsumerCheckpointRepository } from './repositories/prisma-consumer-checkpoint.repository';
import { PrismaInboxRepository } from './repositories/prisma-inbox.repository';
import { PrismaOutboxRepository } from './repositories/prisma-outbox.repository';
import { PrismaTransactionalOutboxWriter } from './repositories/prisma-transactional-outbox.writer';
import { TransactionalOutboxAppender } from './transactional-outbox-appender';
import { TransactionalConsumerProgress } from './transactional-consumer-progress';
import { TRANSACTIONAL_OUTBOX_WRITER } from './transactional-outbox-writer.token';

/**
 * Event Processing Nest module (US128–US130 / US155).
 * PostgreSQL is the runtime authority for Outbox/Inbox/checkpoints.
 * Existing EventsModule remains the process-local activity bus.
 */
@Module({
  imports: [PrismaModule, MetricsModule],
  providers: [
    {
      provide: PrismaOutboxRepository,
      useFactory: (prisma: PrismaService) => new PrismaOutboxRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: PrismaInboxRepository,
      useFactory: (prisma: PrismaService) => new PrismaInboxRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: PrismaConsumerCheckpointRepository,
      useFactory: (prisma: PrismaService) => new PrismaConsumerCheckpointRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: OUTBOX_REPOSITORY,
      useFactory: (repo: PrismaOutboxRepository, metrics: Metrics) =>
        instrumentRepository(repo, metrics, 'outbox'),
      inject: [PrismaOutboxRepository, METRICS],
    },
    {
      provide: INBOX_REPOSITORY,
      useFactory: (repo: PrismaInboxRepository, metrics: Metrics) =>
        instrumentRepository(repo, metrics, 'inbox'),
      inject: [PrismaInboxRepository, METRICS],
    },
    {
      provide: CONSUMER_CHECKPOINT_REPOSITORY,
      useFactory: (repo: PrismaConsumerCheckpointRepository, metrics: Metrics) =>
        instrumentRepository(repo, metrics, 'consumer-checkpoint'),
      inject: [PrismaConsumerCheckpointRepository, METRICS],
    },
    {
      provide: TRANSACTIONAL_OUTBOX_WRITER,
      useFactory: (prisma: PrismaService) => new PrismaTransactionalOutboxWriter(prisma),
      inject: [PrismaService],
    },
    {
      provide: IdempotentConsumerProcessor,
      useFactory: (inbox: InboxRepository, checkpoints: ConsumerCheckpointRepository) =>
        new IdempotentConsumerProcessor(inbox, checkpoints),
      inject: [INBOX_REPOSITORY, CONSUMER_CHECKPOINT_REPOSITORY],
    },
    {
      provide: OutboxDispatcher,
      useFactory: (repo: OutboxRepository) => new OutboxDispatcher(repo),
      inject: [OUTBOX_REPOSITORY],
    },
    TransactionalOutboxAppender,
    TransactionalConsumerProgress,
    OutboxPollingService,
  ],
  exports: [
    OUTBOX_REPOSITORY,
    INBOX_REPOSITORY,
    CONSUMER_CHECKPOINT_REPOSITORY,
    TRANSACTIONAL_OUTBOX_WRITER,
    IdempotentConsumerProcessor,
    OutboxDispatcher,
    OutboxPollingService,
    TransactionalOutboxAppender,
    TransactionalConsumerProgress,
  ],
})
export class EventProcessingModule {}
