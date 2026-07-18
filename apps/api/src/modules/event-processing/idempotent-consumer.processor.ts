import { ConsumerCheckpointStatus, type ConsumerCheckpoint } from './domain/consumer-checkpoint';
import type {
  ConsumerApplyResult,
  ConsumerProjectionHandler,
} from './domain/consumer-apply-result';
import type { DurableEventEnvelope } from './domain/durable-event-envelope';
import { toConsumerId } from './domain/consumer-id';
import type { InboxRecord } from './domain/inbox-record';
import type { ConsumerCheckpointRepository } from './repositories/consumer-checkpoint.repository';
import type { InboxRepository } from './repositories/inbox.repository';

/**
 * Idempotent durable consumer processor (US129).
 * Inbox + projection + checkpoint commit atomically; duplicates are successful no-ops;
 * future sequences without predecessors are deferred (blocked_gap).
 */
export class IdempotentConsumerProcessor {
  constructor(
    private readonly inbox: InboxRepository,
    private readonly checkpoints: ConsumerCheckpointRepository,
  ) {}

  async process<TProjection>(
    event: DurableEventEnvelope,
    handler: ConsumerProjectionHandler<TProjection>,
    processedAt: string,
  ): Promise<ConsumerApplyResult> {
    const consumerId = toConsumerId(handler.consumerId);
    const existingInbox = await this.inbox.find(consumerId, event.eventId);
    if (existingInbox) {
      const checkpoint = await this.checkpoints.get(consumerId, event.aggregateId);
      return { outcome: 'duplicate', inbox: existingInbox, checkpoint };
    }

    const previousCheckpoint =
      (await this.checkpoints.get(consumerId, event.aggregateId)) ??
      emptyCheckpoint(consumerId, handler.consumerVersion, event, processedAt);

    const expectedNext = previousCheckpoint.lastAppliedSequence + 1;
    if (event.aggregateVersion > expectedNext) {
      const blocked: ConsumerCheckpoint = Object.freeze({
        ...previousCheckpoint,
        consumerVersion: handler.consumerVersion,
        status: ConsumerCheckpointStatus.BLOCKED_GAP,
        blockedSequence: event.aggregateVersion,
        lastError: `missing predecessor sequence ${expectedNext}`,
        updatedAt: processedAt,
      });
      await this.checkpoints.save(blocked);
      return {
        outcome: 'deferred_gap',
        checkpoint: blocked,
        expectedSequence: expectedNext,
        receivedSequence: event.aggregateVersion,
      };
    }

    if (event.aggregateVersion <= previousCheckpoint.lastAppliedSequence) {
      return {
        outcome: 'stale',
        checkpoint: previousCheckpoint,
        lastAppliedSequence: previousCheckpoint.lastAppliedSequence,
        receivedSequence: event.aggregateVersion,
      };
    }

    const previousProjection = handler.getProjection(event.workspaceId, event.aggregateId);
    let inboxInserted = false;
    let checkpointSaved = false;
    let projectionSaved = false;
    const previousCheckpointSnapshot = await this.checkpoints.get(consumerId, event.aggregateId);

    try {
      const projection = handler.apply(event, previousProjection);
      handler.saveProjection(event.workspaceId, event.aggregateId, projection);
      projectionSaved = true;

      const inbox: InboxRecord = Object.freeze({
        consumerId,
        eventId: event.eventId,
        consumerVersion: handler.consumerVersion,
        processedAt,
      });
      await this.inbox.insert(inbox);
      inboxInserted = true;

      const checkpoint: ConsumerCheckpoint = Object.freeze({
        consumerId,
        consumerVersion: handler.consumerVersion,
        streamId: event.aggregateId,
        workspaceId: event.workspaceId,
        lastAppliedSequence: event.aggregateVersion,
        lastAppliedEventId: String(event.eventId),
        status: ConsumerCheckpointStatus.READY,
        blockedSequence: null,
        lastError: null,
        updatedAt: processedAt,
      });
      await this.checkpoints.save(checkpoint);
      checkpointSaved = true;

      return { outcome: 'applied', inbox, checkpoint, projection };
    } catch (error) {
      if (inboxInserted) {
        await this.inbox.remove(consumerId, event.eventId);
      }
      if (checkpointSaved) {
        if (previousCheckpointSnapshot) {
          await this.checkpoints.save(previousCheckpointSnapshot);
        }
      }
      if (projectionSaved) {
        if (previousProjection === null) {
          handler.clearProjection?.(event.workspaceId, event.aggregateId);
        } else {
          handler.saveProjection(event.workspaceId, event.aggregateId, previousProjection);
        }
      }
      throw error;
    }
  }
}

function emptyCheckpoint(
  consumerId: ReturnType<typeof toConsumerId>,
  consumerVersion: string,
  event: DurableEventEnvelope,
  updatedAt: string,
): ConsumerCheckpoint {
  return Object.freeze({
    consumerId,
    consumerVersion,
    streamId: event.aggregateId,
    workspaceId: event.workspaceId,
    lastAppliedSequence: 0,
    lastAppliedEventId: null,
    status: ConsumerCheckpointStatus.READY,
    blockedSequence: null,
    lastError: null,
    updatedAt,
  });
}
