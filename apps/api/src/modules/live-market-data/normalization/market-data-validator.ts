import type { ClosedCandleEvent } from '../domain/closed-candle-event';
import type { MarkPriceEvent } from '../domain/mark-price-event';
import type { ClosedCandleDraft } from './closed-candle-draft';
import type { MarkPriceDraft } from './mark-price-draft';
import {
  createMarketDataQuarantine,
  type MarketDataQuarantineRecord,
} from './market-data-quarantine';
import { normalizeClosedCandle } from './normalize-closed-candle';
import { normalizeMarkPrice, type NormalizeMarkPriceOptions } from './normalize-mark-price';

export type MarketValidationAccepted<TEvent> = Readonly<{
  outcome: 'accepted';
  event: TEvent;
  published?: boolean;
}>;

export type MarketValidationQuarantined = Readonly<{
  outcome: 'quarantined';
  quarantine: MarketDataQuarantineRecord;
}>;

export type MarketValidationResult<TEvent> =
  MarketValidationAccepted<TEvent> | MarketValidationQuarantined;

export type ValidateClosedCandleInput = {
  draft: ClosedCandleDraft;
  /** Adapter-local raw reference material for fingerprint only. */
  rawMessage: unknown;
  quarantinedAt: string;
};

export type ValidateMarkPriceInput = {
  draft: MarkPriceDraft;
  rawMessage: unknown;
  quarantinedAt: string;
  normalizeOptions?: NormalizeMarkPriceOptions;
};

/**
 * Validate + normalize market drafts with quarantine on failure (US137).
 * Invalid data is never published as a Market Event.
 * Failures return quarantine records and do not throw (stream-safe).
 */
export class MarketDataValidator {
  validateClosedCandle(
    input: ValidateClosedCandleInput,
  ): MarketValidationResult<ClosedCandleEvent> {
    try {
      const normalized = normalizeClosedCandle(input.draft);
      if (!normalized.ok) {
        return {
          outcome: 'quarantined',
          quarantine: createMarketDataQuarantine({
            workspaceId: input.draft.workspaceId,
            sourceId: String(input.draft.sourceId),
            instrument: String(input.draft.instrument),
            channel: 'closed_candle',
            reason: normalized.reason,
            rawMessage: input.rawMessage,
            quarantinedAt: input.quarantinedAt,
          }),
        };
      }
      return { outcome: 'accepted', event: normalized.event };
    } catch (error) {
      return {
        outcome: 'quarantined',
        quarantine: createMarketDataQuarantine({
          workspaceId: input.draft.workspaceId,
          sourceId: String(input.draft.sourceId),
          instrument: String(input.draft.instrument),
          channel: 'closed_candle',
          reason: error instanceof Error ? error.message : String(error),
          rawMessage: input.rawMessage,
          quarantinedAt: input.quarantinedAt,
        }),
      };
    }
  }

  validateMarkPrice(input: ValidateMarkPriceInput): MarketValidationResult<MarkPriceEvent> {
    try {
      const normalized = normalizeMarkPrice(input.draft, input.normalizeOptions);
      if (!normalized.ok) {
        return {
          outcome: 'quarantined',
          quarantine: createMarketDataQuarantine({
            workspaceId: input.draft.workspaceId,
            sourceId: String(input.draft.sourceId),
            instrument: String(input.draft.instrument),
            channel: 'mark_price',
            reason: normalized.reason,
            rawMessage: input.rawMessage,
            quarantinedAt: input.quarantinedAt,
          }),
        };
      }
      return {
        outcome: 'accepted',
        event: normalized.event,
        published: normalized.published,
      };
    } catch (error) {
      return {
        outcome: 'quarantined',
        quarantine: createMarketDataQuarantine({
          workspaceId: input.draft.workspaceId,
          sourceId: String(input.draft.sourceId),
          instrument: String(input.draft.instrument),
          channel: 'mark_price',
          reason: error instanceof Error ? error.message : String(error),
          rawMessage: input.rawMessage,
          quarantinedAt: input.quarantinedAt,
        }),
      };
    }
  }
}
