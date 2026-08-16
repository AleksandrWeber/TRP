import { Inject, Injectable } from '@nestjs/common';
import {
  TRANSACTIONAL_OUTBOX_WRITER,
  toDurableMarketEnvelope,
  type TransactionalOutboxWriter,
} from '../../event-processing';
import { isTimeframe, type Timeframe } from '../../market-data/timeframe';
import { MarketCheckpointStore } from '../checkpoints/market-checkpoint-store';
import { BINANCE_SPOT_SOURCE_ID } from '../connectors/binance/binance-spot.source';
import { mapBinanceKlineMessageToDraft } from '../connectors/binance/map-binance-kline-message';
import type { ClosedCandleEvent } from '../domain/closed-candle-event';
import { MarketHealthStatus } from '../domain/market-status';
import { MarketStreamChannel } from '../domain/market-stream-channel';
import { buildMarketStreamId } from '../domain/market-stream-identity';
import { MarketDataValidator } from '../normalization/market-data-validator';
import type { ClosedCandleDraft } from '../normalization/closed-candle-draft';
import { MarketStreamIntegrityController } from '../integrity/market-stream-integrity-controller';
import { LatestMarketStateProjection } from '../projection/latest-market-state-projection';

export type ClosedCandleIngestOutcome =
  'published' | 'quarantined' | 'duplicate' | 'stale' | 'deferred_gap' | 'open';

export type ClosedCandleIngestResult = Readonly<{
  outcome: ClosedCandleIngestOutcome;
  event: ClosedCandleEvent | null;
  reason?: string;
}>;

/**
 * Production closed-candle ingest (Live Market Data).
 * Connector frames and accepted drafts enter the same path:
 * validate → integrity → durable MarketClosedCandle Outbox → projection.
 * No Strategy Runtime, Orders, or accounting.
 */
@Injectable()
export class ClosedCandleIngestService {
  constructor(
    @Inject(MarketDataValidator)
    private readonly validator: MarketDataValidator,
    @Inject(MarketStreamIntegrityController)
    private readonly integrity: MarketStreamIntegrityController,
    @Inject(TRANSACTIONAL_OUTBOX_WRITER)
    private readonly writer: TransactionalOutboxWriter,
    @Inject(LatestMarketStateProjection)
    private readonly projection: LatestMarketStateProjection,
    @Inject(MarketCheckpointStore)
    private readonly checkpoints: MarketCheckpointStore,
  ) {}

  async ingestKline(input: {
    workspaceId: string;
    timeframe: Timeframe | string;
    message: unknown;
    receivedAt: string;
    nowMs: number;
  }): Promise<ClosedCandleIngestResult> {
    const timeframe = String(input.timeframe);
    if (!isTimeframe(timeframe)) {
      return freezeResult({ outcome: 'quarantined', event: null, reason: 'unsupported timeframe' });
    }
    const sequence = await this.nextSequence(input.workspaceId, input.message, timeframe);
    let draft: ClosedCandleDraft;
    try {
      draft = mapBinanceKlineMessageToDraft({
        workspaceId: input.workspaceId,
        timeframe,
        sequence,
        message: input.message as never,
        receivedAt: input.receivedAt,
        processedAt: input.receivedAt,
        recordedAt: input.receivedAt,
        nowMs: input.nowMs,
      });
    } catch (error) {
      return freezeResult({
        outcome: 'quarantined',
        event: null,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
    if (!draft.isClosed) {
      return freezeResult({ outcome: 'open', event: null, reason: 'incomplete candle' });
    }
    return this.ingestDraft(draft, input.message);
  }

  async ingestDraft(
    draft: ClosedCandleDraft,
    rawMessage: unknown,
  ): Promise<ClosedCandleIngestResult> {
    const validated = this.validator.validateClosedCandle({
      draft,
      rawMessage,
      quarantinedAt: draft.recordedAt,
    });
    if (validated.outcome === 'quarantined') {
      return freezeResult({
        outcome: 'quarantined',
        event: null,
        reason: validated.quarantine.reason,
      });
    }
    return this.publish(validated.event);
  }

  /**
   * Production entry for an already-normalized closed candle.
   * Tests inject market events through this method — not through pipeline.run.
   */
  async publish(event: ClosedCandleEvent): Promise<ClosedCandleIngestResult> {
    const admitted = this.integrity.admit(event, event.recordedAt);
    if (admitted.outcome === 'duplicate') {
      return freezeResult({ outcome: 'duplicate', event, reason: admitted.kind });
    }
    if (admitted.outcome === 'stale') {
      return freezeResult({ outcome: 'stale', event, reason: 'stale sequence' });
    }
    if (admitted.outcome === 'deferred_gap') {
      return freezeResult({
        outcome: 'deferred_gap',
        event,
        reason: `expected sequence ${admitted.expectedSequence}`,
      });
    }

    try {
      await this.writer.acceptMarketEvent({
        state: {
          workspaceId: event.workspaceId,
          streamId: String(event.streamId),
          lastSequence: event.sequence,
          lastEventId: String(event.eventId),
          lastOccurredAt: event.occurredAt,
          updatedAt: event.recordedAt,
        },
        envelope: toDurableMarketEnvelope(event),
        recordedAt: event.recordedAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/unique|already exists|duplicate/i.test(message)) {
        return freezeResult({ outcome: 'duplicate', event, reason: 'durable event exists' });
      }
      throw error;
    }

    await this.projection.apply(event, event.processedAt);
    try {
      await this.checkpoints.advance({
        event,
        health: MarketHealthStatus.HEALTHY,
        updatedAt: event.recordedAt,
        eventDurablyRecorded: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/regression rejected/i.test(message)) {
        return freezeResult({ outcome: 'duplicate', event, reason: message });
      }
      throw error;
    }

    return freezeResult({ outcome: 'published', event });
  }

  private async nextSequence(
    workspaceId: string,
    message: unknown,
    timeframe: Timeframe,
  ): Promise<number> {
    const instrument = klineInstrument(message);
    if (!instrument) return 1;
    const streamId = String(
      buildMarketStreamId({
        workspaceId,
        sourceId: BINANCE_SPOT_SOURCE_ID,
        instrument,
        channel: MarketStreamChannel.CLOSED_CANDLE,
        timeframe,
      }),
    );
    const accepted = await this.writer.getAcceptedState(workspaceId, streamId);
    return (accepted?.lastSequence ?? 0) + 1;
  }
}

function klineInstrument(message: unknown): string | null {
  if (!message || typeof message !== 'object') return null;
  const record = message as { s?: unknown; k?: { s?: unknown }; data?: unknown };
  const nested =
    record.data && typeof record.data === 'object'
      ? (record.data as { s?: unknown; k?: { s?: unknown } })
      : record;
  const symbol = nested.k?.s ?? nested.s;
  if (typeof symbol !== 'string' || symbol.trim() === '') return null;
  return symbol.trim().toUpperCase();
}

function freezeResult(result: ClosedCandleIngestResult): ClosedCandleIngestResult {
  return Object.freeze(result);
}
