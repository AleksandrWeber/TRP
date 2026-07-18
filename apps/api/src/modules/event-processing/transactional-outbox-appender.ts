import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';
import { prismaClientForTransaction } from '../../storage/prisma/prisma-transaction.service';
import type { DurableEventEnvelope } from './domain/durable-event-envelope';
import type { OutboxRecord } from './domain/outbox-record';
import { PrismaOutboxRepository } from './repositories/prisma-outbox.repository';

/**
 * Public transactional Outbox boundary for business modules (US155).
 * Callers provide an opaque transaction context; they never access Outbox persistence.
 */
@Injectable()
export class TransactionalOutboxAppender {
  append(
    transaction: TransactionContext,
    envelope: DurableEventEnvelope,
    createdAt: string,
  ): Promise<OutboxRecord> {
    const repository = new PrismaOutboxRepository(prismaClientForTransaction(transaction));
    return repository.insert(envelope, createdAt);
  }
}
