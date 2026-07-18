export { EventProcessingModule } from './event-processing.module';

export type { DurableEventId } from './domain/durable-event-id';
export { toDurableEventId } from './domain/durable-event-id';

export type { DurableEventEnvelope } from './domain/durable-event-envelope';
export type { AcceptedMarketStreamState } from './domain/accepted-market-stream-state';
export { toDurableMarketEnvelope } from './domain/to-durable-market-envelope';

export { OutboxStatus, isOutboxStatus } from './domain/outbox-status';
export type { OutboxRecord, OutboxDeliveryPatch } from './domain/outbox-record';

export type { OutboxRepository, UnpublishedOutboxQuery } from './repositories/outbox.repository';
export { OUTBOX_REPOSITORY } from './repositories/outbox.repository.token';
export { InMemoryOutboxRepository } from './repositories/in-memory-outbox.repository';
export { InMemoryTransactionalOutboxWriter } from './repositories/in-memory-transactional-outbox.writer';

export type { InboxRecord } from './domain/inbox-record';
export type { ConsumerId } from './domain/consumer-id';
export { toConsumerId } from './domain/consumer-id';
export type { ConsumerCheckpoint } from './domain/consumer-checkpoint';
export { ConsumerCheckpointStatus, isConsumerCheckpointStatus } from './domain/consumer-checkpoint';
export type {
  ConsumerApplyResult,
  ConsumerProjectionHandler,
} from './domain/consumer-apply-result';

export type { InboxRepository } from './repositories/inbox.repository';
export { INBOX_REPOSITORY } from './repositories/inbox.repository.token';
export { InMemoryInboxRepository } from './repositories/in-memory-inbox.repository';

export type { ConsumerCheckpointRepository } from './repositories/consumer-checkpoint.repository';
export { CONSUMER_CHECKPOINT_REPOSITORY } from './repositories/consumer-checkpoint.repository.token';
export { InMemoryConsumerCheckpointRepository } from './repositories/in-memory-consumer-checkpoint.repository';

export { PrismaOutboxRepository } from './repositories/prisma-outbox.repository';
export { PrismaInboxRepository } from './repositories/prisma-inbox.repository';
export { PrismaConsumerCheckpointRepository } from './repositories/prisma-consumer-checkpoint.repository';
export { PrismaTransactionalOutboxWriter } from './repositories/prisma-transactional-outbox.writer';

export { IdempotentConsumerProcessor } from './idempotent-consumer.processor';

export type { OutboxRetryPolicy } from './domain/outbox-retry-policy';
export {
  DEFAULT_OUTBOX_RETRY_POLICY,
  computeOutboxBackoffDelayMs,
} from './domain/outbox-retry-policy';
export type { DurableOutboxConsumer } from './domain/durable-outbox-consumer';
export { OutboxDispatcher } from './outbox-dispatcher.service';
export type { DispatchOnceResult } from './outbox-dispatcher.service';
export { OutboxDispatcherMetrics } from './outbox-dispatcher.metrics';
export type { OutboxDispatcherMetricsSnapshot } from './outbox-dispatcher.metrics';

export type {
  AcceptMarketEventCommand,
  AcceptMarketEventResult,
  TransactionalOutboxWriter,
} from './transactional-outbox-writer';
export { TRANSACTIONAL_OUTBOX_WRITER } from './transactional-outbox-writer.token';
