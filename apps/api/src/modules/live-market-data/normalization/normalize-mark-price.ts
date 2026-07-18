import { createMarkPriceEvent, type MarkPriceEvent } from '../domain/mark-price-event';
import { buildMarketEventSemanticIdentity } from '../domain/market-event-identity';
import type { MarkPriceDraft } from './mark-price-draft';
import {
  resolveMarkPricePublicationPolicy,
  shouldPublishMarkPrice,
  type MarkPricePublicationPolicy,
} from './mark-price-publication-policy';

export type MarkPriceNormalizationSuccess = Readonly<{
  ok: true;
  event: MarkPriceEvent;
  markSource: MarkPriceDraft['markSource'];
  published: boolean;
  policy: MarkPricePublicationPolicy;
}>;

export type MarkPriceNormalizationFailure = Readonly<{
  ok: false;
  reason: string;
}>;

export type MarkPriceNormalizationResult =
  MarkPriceNormalizationSuccess | MarkPriceNormalizationFailure;

export type NormalizeMarkPriceOptions = {
  policy?: Partial<MarkPricePublicationPolicy>;
  lastPublishedAt?: string | null;
};

/**
 * Normalize a provider-neutral mark-price draft (US136).
 * No Position, Portfolio, or fill calculation.
 */
export function normalizeMarkPrice(
  draft: MarkPriceDraft,
  options: NormalizeMarkPriceOptions = {},
): MarkPriceNormalizationResult {
  try {
    assertNoTradingFields(draft as unknown as Record<string, unknown>);
    assertNoProviderLeak(draft as unknown as Record<string, unknown>);

    const event = createMarkPriceEvent({
      workspaceId: draft.workspaceId,
      sourceId: draft.sourceId,
      instrument: draft.instrument,
      sequence: draft.sequence,
      price: draft.price,
      exchangeOccurredAt: draft.exchangeOccurredAt,
      occurredAt: draft.exchangeOccurredAt,
      receivedAt: draft.receivedAt,
      processedAt: draft.processedAt,
      recordedAt: draft.recordedAt,
    });

    const policy = resolveMarkPricePublicationPolicy(options.policy);
    const published = shouldPublishMarkPrice({
      policy,
      lastPublishedAt: options.lastPublishedAt ?? null,
      candidateOccurredAt: event.exchangeOccurredAt,
    });

    return {
      ok: true,
      event,
      markSource: draft.markSource,
      published,
      policy,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

export function markPricesAreSemanticallyEqual(a: MarkPriceEvent, b: MarkPriceEvent): boolean {
  return buildMarketEventSemanticIdentity(a) === buildMarketEventSemanticIdentity(b);
}

const FORBIDDEN = new Set([
  'e',
  'E',
  's',
  'b',
  'B',
  'a',
  'A',
  'u',
  'raw',
  'binance',
  'positionId',
  'portfolioId',
  'fillId',
  'orderId',
  'ledgerEntryId',
]);

function assertNoProviderLeak(draft: Record<string, unknown>): void {
  for (const key of Object.keys(draft)) {
    if (FORBIDDEN.has(key)) {
      throw new Error(`provider-specific or trading field must not enter normalization: ${key}`);
    }
  }
}

function assertNoTradingFields(draft: Record<string, unknown>): void {
  for (const key of [
    'positionId',
    'portfolioId',
    'fillId',
    'orderId',
    'ledgerEntryId',
    'unrealizedPnL',
    'equity',
  ]) {
    if (key in draft) {
      throw new Error(`mark-price normalization must not include trading field: ${key}`);
    }
  }
}
