import { Injectable } from '@nestjs/common';
import type { DurableEventId } from './domain/durable-event-id';
import { ConsumerCheckpointStatus } from './domain/consumer-checkpoint';
import { toConsumerId } from './domain/consumer-id';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../storage/prisma/prisma-transaction.service';

export type RecordConsumerProgressInput = Readonly<{
  consumerId: string;
  consumerVersion: string;
  eventId: DurableEventId | string;
  streamId: string;
  workspaceId: string;
  sequence: number;
  processedAt: string;
}>;

/**
 * Public Event Processing boundary for business consumers whose projection and
 * financial effects must share one PostgreSQL transaction (US174).
 */
@Injectable()
export class TransactionalConsumerProgress {
  async hasProcessed(
    transaction: TransactionContext,
    consumerId: string,
    eventId: DurableEventId | string,
  ): Promise<boolean> {
    const row = await prismaClientForTransaction(transaction).inboxRecord.findUnique({
      where: {
        consumerId_eventId: {
          consumerId: String(toConsumerId(consumerId)),
          eventId: String(eventId),
        },
      },
      select: { eventId: true },
    });
    return row !== null;
  }

  async recordApplied(
    transaction: TransactionContext,
    input: RecordConsumerProgressInput,
  ): Promise<void> {
    if (!Number.isSafeInteger(input.sequence) || input.sequence < 1) {
      throw new Error('consumer progress sequence must be a positive integer');
    }
    const client = prismaClientForTransaction(transaction);
    const consumerId = String(toConsumerId(input.consumerId));
    await client.inboxRecord.create({
      data: {
        consumerId,
        eventId: String(input.eventId),
        consumerVersion: input.consumerVersion,
        processedAt: new Date(input.processedAt),
      },
    });
    await client.consumerCheckpointRecord.upsert({
      where: {
        consumerId_streamId: { consumerId, streamId: input.streamId },
      },
      create: {
        consumerId,
        streamId: input.streamId,
        consumerVersion: input.consumerVersion,
        workspaceId: input.workspaceId,
        lastAppliedSequence: input.sequence,
        lastAppliedEventId: String(input.eventId),
        status: ConsumerCheckpointStatus.READY,
        blockedSequence: null,
        lastError: null,
        updatedAt: new Date(input.processedAt),
      },
      update: {
        consumerVersion: input.consumerVersion,
        workspaceId: input.workspaceId,
        lastAppliedSequence: input.sequence,
        lastAppliedEventId: String(input.eventId),
        status: ConsumerCheckpointStatus.READY,
        blockedSequence: null,
        lastError: null,
        updatedAt: new Date(input.processedAt),
      },
    });
  }
}
