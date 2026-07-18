import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import { toDurableEventId, type DurableEventEnvelope } from '../event-processing';
import { TransactionalOutboxAppender } from '../event-processing/transactional-outbox-appender';
import { createPaperAccount, type PaperAccount } from './domain/paper-account';
import {
  PAPER_ACCOUNT_REPOSITORY,
  type PaperAccountRepository,
} from './persistence/paper-account.repository';

export type CreatePaperAccountCommand = Readonly<{
  workspaceId: string;
  currency: string;
  mode: 'paper';
  openingCapital: string;
  idempotencyKey: string;
  actorId: string;
  correlationId?: string;
  openedAt: string;
  recordedAt: string;
}>;

/**
 * Durable paper-account application boundary (US154).
 * Account + creation event commit atomically. Cash is not stored here:
 * openingCapital is an immutable instruction for the Ledger foundation.
 */
@Injectable()
export class PaperAccountService {
  constructor(
    @Inject(PAPER_ACCOUNT_REPOSITORY)
    private readonly accounts: PaperAccountRepository,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
  ) {}

  async create(command: CreatePaperAccountCommand): Promise<PaperAccount> {
    const idempotencyKey = required(command.idempotencyKey, 'idempotency key');
    const actorId = required(command.actorId, 'actor id');
    const existing = await this.accounts.findByIdempotencyKey(command.workspaceId, idempotencyKey);
    if (existing) {
      assertSameCommand(existing, command);
      return existing;
    }

    const account = createPaperAccount({
      id: randomUUID(),
      workspaceId: command.workspaceId,
      currency: command.currency,
      mode: command.mode,
      openingCapital: command.openingCapital,
      openedAt: command.openedAt,
      recordedAt: command.recordedAt,
    });
    const envelope = accountCreatedEnvelope(
      account,
      actorId,
      command.correlationId,
      idempotencyKey,
    );

    try {
      return await this.transactions.run(async (transaction) => {
        const created = await this.accounts.create(account, idempotencyKey, transaction);
        await this.outbox.append(transaction, envelope, command.recordedAt);
        return created;
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        const raced = await this.accounts.findByIdempotencyKey(command.workspaceId, idempotencyKey);
        if (raced) {
          assertSameCommand(raced, command);
          return raced;
        }
      }
      throw error;
    }
  }

  get(workspaceId: string, accountId: string): Promise<PaperAccount | null> {
    return this.accounts.findById(workspaceId, accountId);
  }
}

function accountCreatedEnvelope(
  account: PaperAccount,
  actorId: string,
  correlationId: string | undefined,
  idempotencyKey: string,
): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId(`paper-account:${account.id}:created:v1`),
    eventType: 'PaperAccountCreated',
    schemaVersion: 1,
    aggregateType: 'PaperAccount',
    aggregateId: account.id,
    aggregateVersion: account.version,
    workspaceId: account.workspaceId,
    occurredAt: account.openedAt,
    recordedAt: account.recordedAt,
    ...(correlationId !== undefined ? { correlationId } : {}),
    actorId,
    payload: Object.freeze({
      accountId: account.id,
      currency: account.currency,
      mode: account.mode,
      status: account.status,
      openingCapital: account.openingCapital,
      idempotencyKey,
    }),
  });
}

function assertSameCommand(existing: PaperAccount, command: CreatePaperAccountCommand): void {
  const candidate = createPaperAccount({
    id: existing.id,
    workspaceId: command.workspaceId,
    currency: command.currency,
    mode: command.mode,
    openingCapital: command.openingCapital,
    openedAt: existing.openedAt,
    recordedAt: existing.recordedAt,
  });
  if (
    existing.currency !== candidate.currency ||
    existing.openingCapital !== candidate.openingCapital ||
    existing.mode !== candidate.mode
  ) {
    throw new Error('idempotency key reused with a different paper account command');
  }
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
