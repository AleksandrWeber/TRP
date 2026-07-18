import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import {
  toDurableEventId,
  TransactionalOutboxAppender,
  type DurableEventEnvelope,
} from '../../event-processing';
import { FinancialDecimal } from '../../financial';
import { PRISMA_CLIENT } from '../../../storage/prisma/prisma-client.token';
import {
  PrismaTransactionService,
  prismaClientForTransaction,
} from '../../../storage/prisma/prisma-transaction.service';
import type { PrismaClient } from '@prisma/client';
import {
  CashReservationStatus,
  type CashReservation,
  type CashReservationPort,
  type ReleaseCashCommand,
  type ReserveCashCommand,
} from '../ports/cash-reservation.port';

@Injectable()
export class PrismaCashReservationAdapter implements CashReservationPort {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
  ) {}

  async reserveCash(command: ReserveCashCommand): Promise<CashReservation> {
    const normalized = normalizeReserve(command);
    const existing = await this.findExisting(normalized.workspaceId, normalized);
    if (existing) return existing;

    try {
      return await this.transactions.run(async (context) => {
        const tx = prismaClientForTransaction(context);
        const raced = await tx.ledgerCashReservation.findFirst({
          where: {
            workspaceId: normalized.workspaceId,
            OR: [{ orderId: normalized.orderId }, { idempotencyKey: normalized.idempotencyKey }],
          },
        });
        if (raced) return assertSameReservation(toReservation(raced), normalized);

        const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT "id"
          FROM "ledger_cash_balances"
          WHERE "workspace_id" = ${normalized.workspaceId}
            AND "paper_account_id" = ${normalized.paperAccountId}
            AND "currency" = ${normalized.currency}
          FOR UPDATE
        `);
        if (locked.length !== 1) throw new Error('Ledger cash balance not found');

        const balance = await tx.ledgerCashBalance.findUniqueOrThrow({
          where: { id: locked[0].id },
        });
        const available = FinancialDecimal.from(balance.postedCash.toString()).minus(
          balance.reservedCash.toString(),
        );
        if (available.compare(normalized.amount) < 0) {
          throw new Error('insufficient available cash for reservation');
        }

        const created = await tx.ledgerCashReservation.create({
          data: {
            id: reservationId(normalized.workspaceId, normalized.orderId),
            workspaceId: normalized.workspaceId,
            paperAccountId: normalized.paperAccountId,
            orderId: normalized.orderId,
            idempotencyKey: normalized.idempotencyKey,
            currency: normalized.currency,
            amount: normalized.amount,
            status: CashReservationStatus.ACTIVE,
            createdAt: new Date(normalized.recordedAt),
          },
        });
        await tx.ledgerCashBalance.update({
          where: { id: balance.id },
          data: {
            reservedCash: { increment: normalized.amount },
            version: { increment: 1 },
            updatedAt: new Date(normalized.recordedAt),
          },
        });
        const result = toReservation(created);
        await this.outbox.append(
          context,
          reservationEnvelope(result, normalized, 1),
          normalized.recordedAt,
        );
        return result;
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        const raced = await this.findExisting(normalized.workspaceId, normalized);
        if (raced) return raced;
      }
      throw error;
    }
  }

  async releaseCash(command: ReleaseCashCommand): Promise<CashReservation | null> {
    const normalized = normalizeRelease(command);
    return this.transactions.run(async (context) => {
      const tx = prismaClientForTransaction(context);
      const stored = await tx.ledgerCashReservation.findUnique({
        where: {
          workspaceId_orderId: {
            workspaceId: normalized.workspaceId,
            orderId: normalized.orderId,
          },
        },
      });
      if (!stored) return null;
      const current = toReservation(stored);
      if (current.status === CashReservationStatus.RELEASED) return current;

      await tx.$queryRaw(Prisma.sql`
        SELECT "id"
        FROM "ledger_cash_balances"
        WHERE "workspace_id" = ${current.workspaceId}
          AND "paper_account_id" = ${current.paperAccountId}
          AND "currency" = ${current.currency}
        FOR UPDATE
      `);
      const balance = await tx.ledgerCashBalance.findUnique({
        where: {
          workspaceId_paperAccountId_currency: {
            workspaceId: current.workspaceId,
            paperAccountId: current.paperAccountId,
            currency: current.currency,
          },
        },
      });
      if (!balance) throw new Error('Ledger cash balance not found');
      if (FinancialDecimal.from(balance.reservedCash.toString()).compare(current.amount) < 0) {
        throw new Error('Ledger reserved cash invariant violated');
      }

      const released = await tx.ledgerCashReservation.update({
        where: { id: current.id },
        data: {
          status: CashReservationStatus.RELEASED,
          releaseIdempotencyKey: normalized.idempotencyKey,
          releasedAt: new Date(normalized.recordedAt),
        },
      });
      await tx.ledgerCashBalance.update({
        where: { id: balance.id },
        data: {
          reservedCash: { decrement: current.amount },
          version: { increment: 1 },
          updatedAt: new Date(normalized.recordedAt),
        },
      });
      const result = toReservation(released);
      await this.outbox.append(
        context,
        reservationEnvelope(result, normalized, 2),
        normalized.recordedAt,
      );
      return result;
    });
  }

  async findByOrder(workspaceId: string, orderId: string): Promise<CashReservation | null> {
    const stored = await this.prisma.ledgerCashReservation.findUnique({
      where: { workspaceId_orderId: { workspaceId, orderId } },
    });
    return stored ? toReservation(stored) : null;
  }

  private async findExisting(
    workspaceId: string,
    command: ReserveCashCommand,
  ): Promise<CashReservation | null> {
    const stored = await this.prisma.ledgerCashReservation.findFirst({
      where: {
        workspaceId,
        OR: [{ orderId: command.orderId }, { idempotencyKey: command.idempotencyKey }],
      },
    });
    return stored ? assertSameReservation(toReservation(stored), command) : null;
  }
}

function normalizeReserve(command: ReserveCashCommand): ReserveCashCommand {
  return Object.freeze({
    ...command,
    workspaceId: required(command.workspaceId, 'workspace id'),
    paperAccountId: required(command.paperAccountId, 'paper account id'),
    orderId: required(command.orderId, 'order id'),
    idempotencyKey: required(command.idempotencyKey, 'idempotency key'),
    actorId: required(command.actorId, 'actor id'),
    currency: required(command.currency, 'currency').toUpperCase(),
    amount: FinancialDecimal.from(command.amount).assertPositive('reservation amount').toString(),
    recordedAt: iso(command.recordedAt, 'recorded at'),
  });
}

function normalizeRelease(command: ReleaseCashCommand): ReleaseCashCommand {
  return Object.freeze({
    ...command,
    workspaceId: required(command.workspaceId, 'workspace id'),
    orderId: required(command.orderId, 'order id'),
    idempotencyKey: required(command.idempotencyKey, 'idempotency key'),
    actorId: required(command.actorId, 'actor id'),
    recordedAt: iso(command.recordedAt, 'recorded at'),
  });
}

function assertSameReservation(
  existing: CashReservation,
  command: ReserveCashCommand,
): CashReservation {
  if (
    existing.orderId !== command.orderId ||
    existing.paperAccountId !== command.paperAccountId ||
    existing.currency !== command.currency ||
    existing.amount !== command.amount
  ) {
    throw new Error('reservation idempotency conflict');
  }
  return existing;
}

function toReservation(stored: {
  id: string;
  workspaceId: string;
  paperAccountId: string;
  orderId: string;
  idempotencyKey: string;
  releaseIdempotencyKey: string | null;
  currency: string;
  amount: Prisma.Decimal;
  status: string;
  createdAt: Date;
  releasedAt: Date | null;
}): CashReservation {
  return Object.freeze({
    ...stored,
    amount: stored.amount.toString(),
    status: stored.status as CashReservationStatus,
    createdAt: stored.createdAt.toISOString(),
    releasedAt: stored.releasedAt?.toISOString() ?? null,
  });
}

function reservationEnvelope(
  reservation: CashReservation,
  command: ReserveCashCommand | ReleaseCashCommand,
  version: number,
): DurableEventEnvelope {
  const eventType = version === 1 ? 'CashReserved' : 'CashReservationReleased';
  return Object.freeze({
    eventId: toDurableEventId(`cash-reservation:${reservation.id}:v${version}`),
    eventType,
    schemaVersion: 1,
    aggregateType: 'LedgerCashReservation',
    aggregateId: reservation.id,
    aggregateVersion: version,
    workspaceId: reservation.workspaceId,
    occurredAt: command.recordedAt,
    recordedAt: command.recordedAt,
    ...(command.correlationId !== undefined ? { correlationId: command.correlationId } : {}),
    actorId: command.actorId,
    payload: Object.freeze({
      reservationId: reservation.id,
      paperAccountId: reservation.paperAccountId,
      orderId: reservation.orderId,
      currency: reservation.currency,
      amount: reservation.amount,
      status: reservation.status,
      idempotencyKey: command.idempotencyKey,
    }),
  });
}

function reservationId(workspaceId: string, orderId: string): string {
  return `cashres_${createHash('sha256').update(`${workspaceId}:${orderId}`).digest('hex').slice(0, 24)}`;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized === '') throw new Error(`${label} is required`);
  return normalized;
}

function iso(value: string, label: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${label} must be canonical ISO-8601`);
  }
  return value;
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
