import { Inject, Injectable } from '@nestjs/common';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import {
  TransactionalConsumerProgress,
  TransactionalOutboxAppender,
  toDurableEventId,
  type DurableEventEnvelope,
} from '../event-processing';
import type { PaperFillConfiguration } from '../execution-adapter';
import {
  POSITION_VALUATION_SCHEMA_VERSION,
  valuePosition,
  type PositionMarkPrice,
  type PositionValuation,
} from './domain/position-valuation';
import { POSITION_REPOSITORY, type PositionRepository } from './persistence/position.repository';
import {
  POSITION_VALUATION_REPOSITORY,
  type PositionValuationRepository,
} from './persistence/position-valuation.repository';
import { POSITION_FILL_CONFIGURATION } from './positions.tokens';

export const POSITION_VALUATION_CONSUMER_ID = 'm2-position-valuation';
export const POSITION_VALUATION_CONSUMER_VERSION = '1';

export type PositionValuationResult = Readonly<{
  outcome: 'applied' | 'duplicate' | 'stale';
  valuations: readonly PositionValuation[];
}>;

/** Dedicated normalized mark-price boundary for the US175 projection. */
@Injectable()
export class PositionValuationService {
  constructor(
    @Inject(POSITION_REPOSITORY)
    private readonly positions: PositionRepository,
    @Inject(POSITION_VALUATION_REPOSITORY)
    private readonly valuations: PositionValuationRepository,
    @Inject(POSITION_FILL_CONFIGURATION)
    private readonly configuration: PaperFillConfiguration,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalConsumerProgress)
    private readonly progress: TransactionalConsumerProgress,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
  ) {}

  async applyMark(mark: PositionMarkPrice): Promise<PositionValuationResult> {
    const positions = await this.positions.listByInstrument(mark.workspaceId, mark.instrument);
    return this.transactions.run(async (transaction) => {
      if (
        await this.progress.hasProcessed(
          transaction,
          POSITION_VALUATION_CONSUMER_ID,
          mark.marketEventId,
        )
      ) {
        return Object.freeze({ outcome: 'duplicate' as const, valuations: Object.freeze([]) });
      }

      const current = await Promise.all(
        positions.map((position) =>
          this.valuations.findByPosition(mark.workspaceId, position.id, transaction),
        ),
      );
      if (current.some((value) => value && value.marketSequence >= mark.marketSequence)) {
        return Object.freeze({ outcome: 'stale' as const, valuations: Object.freeze([]) });
      }

      const applied: PositionValuation[] = [];
      for (let index = 0; index < positions.length; index += 1) {
        const position = positions[index]!;
        const prior = current[index] ?? null;
        const valuation = valuePosition(position, mark, prior, this.configuration.precision);
        await this.valuations.save(valuation, prior?.version ?? 0, transaction);
        await this.outbox.append(transaction, valuationEnvelope(valuation), mark.recordedAt);
        applied.push(valuation);
      }

      await this.progress.recordApplied(transaction, {
        consumerId: POSITION_VALUATION_CONSUMER_ID,
        consumerVersion: POSITION_VALUATION_CONSUMER_VERSION,
        eventId: mark.marketEventId,
        streamId: mark.marketStreamId,
        workspaceId: mark.workspaceId,
        sequence: mark.marketSequence,
        processedAt: mark.recordedAt,
      });
      return Object.freeze({
        outcome: 'applied' as const,
        valuations: Object.freeze(applied),
      });
    });
  }

  get(workspaceId: string, positionId: string): Promise<PositionValuation | null> {
    return this.valuations.findByPosition(workspaceId, positionId);
  }

  list(workspaceId: string, paperAccountId: string): Promise<PositionValuation[]> {
    return this.valuations.listByAccount(workspaceId, paperAccountId);
  }
}

function valuationEnvelope(value: PositionValuation): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId(`position-valuation:${value.positionId}:v${value.version}`),
    eventType: 'PositionValuationUpdated',
    schemaVersion: POSITION_VALUATION_SCHEMA_VERSION,
    aggregateType: 'PositionValuation',
    aggregateId: value.id,
    aggregateVersion: value.version,
    workspaceId: value.workspaceId,
    occurredAt: value.occurredAt,
    recordedAt: value.recordedAt,
    causationId: value.marketEventId,
    actorId: 'position-valuation',
    payload: Object.freeze({
      positionId: value.positionId,
      paperAccountId: value.paperAccountId,
      instrument: value.instrument,
      positionVersion: value.positionVersion,
      markPrice: value.markPrice,
      quantity: value.quantity,
      costBasis: value.costBasis,
      realizedPnl: value.realizedPnl,
      marketValue: value.marketValue,
      unrealizedPnl: value.unrealizedPnl,
      marketStreamId: value.marketStreamId,
      marketEventId: value.marketEventId,
      marketSequence: value.marketSequence,
    }),
  });
}
