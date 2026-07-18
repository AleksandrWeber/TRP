import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import {
  TransactionalConsumerProgress,
  TransactionalOutboxAppender,
  toDurableEventId,
  type DurableEventEnvelope,
} from '../event-processing';
import type { PaperFillConfiguration } from '../execution-adapter';
import type { PaperFill } from '../execution-engine';
import { LedgerService, type LedgerTransaction } from '../ledger';
import { PaperAccountService, PaperAccountStatus } from '../paper-account';
import { applyFillToPosition, type Position } from './domain/position';
import { POSITION_REPOSITORY, type PositionRepository } from './persistence/position.repository';
import { POSITION_FILL_CONFIGURATION } from './positions.tokens';

export const FILL_ACCOUNTING_CONSUMER_ID = 'm2-fill-accounting';
export const FILL_ACCOUNTING_CONSUMER_VERSION = '1';

export type FillAccountingResult = Readonly<{
  outcome: 'applied' | 'duplicate';
  position: Position;
  ledgerTransaction: LedgerTransaction | null;
}>;

/**
 * Atomic Fill accounting consumer (US174 / ADR-013 / ADR-015).
 * Inbox, Position, balanced Ledger entries, both Outbox events, and consumer
 * checkpoint share one PostgreSQL transaction. Any failure rolls all of it back.
 */
@Injectable()
export class PositionAccountingConsumer {
  constructor(
    @Inject(POSITION_REPOSITORY)
    private readonly positions: PositionRepository,
    @Inject(LedgerService)
    private readonly ledger: LedgerService,
    @Inject(PaperAccountService)
    private readonly accounts: PaperAccountService,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalConsumerProgress)
    private readonly progress: TransactionalConsumerProgress,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
    @Inject(POSITION_FILL_CONFIGURATION)
    private readonly configuration: PaperFillConfiguration,
  ) {}

  async process(event: DurableEventEnvelope, processedAt: string): Promise<FillAccountingResult> {
    const fill = fillFromEnvelope(event);
    assertConfiguration(fill, this.configuration);
    const account = await this.accounts.get(fill.workspaceId, fill.paperAccountId);
    if (!account || account.status !== PaperAccountStatus.ACTIVE) {
      throw new Error('active paper account not found for Fill accounting');
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.transactions.run(async (transaction) => {
          if (
            await this.progress.hasProcessed(
              transaction,
              FILL_ACCOUNTING_CONSUMER_ID,
              event.eventId,
            )
          ) {
            const position = await this.positions.findByIdentityForUpdate(
              fill.workspaceId,
              fill.paperAccountId,
              fill.instrument,
              transaction,
            );
            if (!position) throw new Error('processed Fill has no Position projection');
            return Object.freeze({
              outcome: 'duplicate' as const,
              position,
              ledgerTransaction: null,
            });
          }

          const current = await this.positions.findByIdentityForUpdate(
            fill.workspaceId,
            fill.paperAccountId,
            fill.instrument,
            transaction,
          );
          const transition = applyFillToPosition(
            current,
            fill,
            this.configuration.precision,
            processedAt,
          );
          const position = await this.positions.save(
            transition.position,
            current?.version ?? 0,
            transaction,
          );
          const ledgerTransaction = await this.ledger.recordFill(transaction, {
            fill,
            currency: account.currency,
            transition,
            actorId: event.actorId ?? 'execution-engine',
            correlationId: event.correlationId,
            recordedAt: processedAt,
          });
          await this.outbox.append(transaction, positionEnvelope(position, fill), processedAt);
          await this.progress.recordApplied(transaction, {
            consumerId: FILL_ACCOUNTING_CONSUMER_ID,
            consumerVersion: FILL_ACCOUNTING_CONSUMER_VERSION,
            eventId: event.eventId,
            streamId: position.id,
            workspaceId: position.workspaceId,
            sequence: position.lastAppliedFillSequence,
            processedAt,
          });
          return Object.freeze({
            outcome: 'applied' as const,
            position,
            ledgerTransaction,
          });
        });
      } catch (error) {
        if (isUniqueConflict(error)) {
          const duplicate = await this.duplicateResult(fill);
          if (duplicate) return duplicate;
          if (attempt < 2) continue;
        }
        if (isOptimisticConflict(error) && attempt < 2) continue;
        throw error;
      }
    }
    throw new Error('Fill accounting concurrency limit exceeded');
  }

  get(workspaceId: string, paperAccountId: string, instrument: string): Promise<Position | null> {
    return this.positions.findByIdentity(workspaceId, paperAccountId, instrument);
  }

  private async duplicateResult(fill: PaperFill): Promise<FillAccountingResult | null> {
    const position = await this.positions.findByIdentity(
      fill.workspaceId,
      fill.paperAccountId,
      fill.instrument,
    );
    const ledgerTransaction = await this.ledgerTransactionForFill(fill);
    if (!position || !ledgerTransaction) return null;
    return Object.freeze({
      outcome: 'duplicate',
      position,
      ledgerTransaction: null,
    });
  }

  private ledgerTransactionForFill(fill: PaperFill): Promise<LedgerTransaction | null> {
    // The public Ledger query is intentionally idempotency-based; Position never
    // accesses Ledger persistence internals.
    return this.ledger.findByIdempotencyKey(fill.workspaceId, `fill:${fill.id}`);
  }
}

function fillFromEnvelope(event: DurableEventEnvelope): PaperFill {
  if (event.eventType !== 'OrderFillRecorded' || event.aggregateType !== 'Fill') {
    throw new Error('Position accounting accepts only OrderFillRecorded events');
  }
  const payload = event.payload;
  const fillId = text(payload.fillId, 'fillId');
  if (fillId !== event.aggregateId) throw new Error('Fill event aggregate identity mismatch');
  return Object.freeze({
    id: fillId,
    workspaceId: event.workspaceId,
    orderId: text(payload.orderId, 'orderId'),
    paperAccountId: text(payload.paperAccountId, 'paperAccountId'),
    tradingSessionId: text(payload.tradingSessionId, 'tradingSessionId'),
    adapterOrderId: text(payload.adapterOrderId, 'adapterOrderId'),
    adapterFillId: text(payload.adapterFillId, 'adapterFillId'),
    sequence: integer(payload.sequence, 'sequence'),
    instrument: text(payload.instrument, 'instrument'),
    side: side(payload.side),
    price: text(payload.price, 'price'),
    quantity: text(payload.quantity, 'quantity'),
    grossNotional: text(payload.grossNotional, 'grossNotional'),
    fee: text(payload.fee, 'fee'),
    executionContextHash: text(payload.executionContextHash, 'executionContextHash'),
    configurationId: text(payload.configurationId, 'configurationId'),
    configurationVersion: integer(payload.configurationVersion, 'configurationVersion'),
    configurationHash: text(payload.configurationHash, 'configurationHash'),
    occurredAt: event.occurredAt,
    recordedAt: event.recordedAt,
  });
}

function positionEnvelope(position: Position, fill: PaperFill): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId(`position:${position.id}:v${position.version}`),
    eventType: 'PositionUpdatedFromFill',
    schemaVersion: 1,
    aggregateType: 'Position',
    aggregateId: position.id,
    aggregateVersion: position.version,
    workspaceId: position.workspaceId,
    occurredAt: fill.occurredAt,
    recordedAt: position.recordedAt,
    causationId: `fill:${fill.id}`,
    actorId: 'position-accounting',
    payload: Object.freeze({
      positionId: position.id,
      paperAccountId: position.paperAccountId,
      instrument: position.instrument,
      side: position.side,
      quantity: position.quantity,
      averageEntryPrice: position.averageEntryPrice,
      costBasis: position.costBasis,
      realizedPnl: position.realizedPnl,
      lastAppliedFillId: position.lastAppliedFillId,
      lastAppliedFillSequence: position.lastAppliedFillSequence,
    }),
  });
}

function assertConfiguration(fill: PaperFill, configuration: PaperFillConfiguration): void {
  if (
    fill.configurationId !== configuration.configurationId ||
    fill.configurationVersion !== configuration.version ||
    fill.configurationHash !== configuration.hash
  ) {
    throw new Error('unknown historical Fill configuration for Position accounting');
  }
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Fill event ${label} must be a non-empty string`);
  }
  return value;
}

function integer(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Fill event ${label} must be a positive integer`);
  }
  return value;
}

function side(value: unknown): 'buy' | 'sell' {
  if (value !== 'buy' && value !== 'sell') throw new Error('Fill event side is unsupported');
  return value;
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function isOptimisticConflict(error: unknown): boolean {
  return error instanceof Error && error.message.includes('optimistic version conflict');
}
