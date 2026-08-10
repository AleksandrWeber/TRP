import { describe, expect, it } from 'vitest';
import {
  toExchangeMetadataInputs,
  toMarketSnapshotInputs,
  toProfileLatestInput,
  toQualificationSummaryInput,
  toSymbolStateBundle,
} from './market-state-input-read-model';

describe('RC-26 Epic 2 — Market State input read model mappers', () => {
  it('freezes LMD snapshots and never marks them as classification', () => {
    const snapshots = toMarketSnapshotInputs('ws-1', [
      {
        workspaceId: 'ws-1',
        streamId: 's1',
        sourceId: 'binance',
        instrument: 'ETHUSDT',
        channel: 'closed_candle',
        timeframe: '5m',
        latestClosedCandle: {
          eventId: 'e1',
          instrument: 'ETHUSDT',
          timeframe: '5m',
          openTime: 't0',
          closeTime: 't1',
          open: 1,
          high: 2,
          low: 1,
          close: 1.8,
          volume: 5,
          exchangeOccurredAt: 't1',
          sequence: 1,
        },
        latestMarkPrice: {
          eventId: 'm1',
          instrument: 'ETHUSDT',
          price: '1.8',
          exchangeOccurredAt: 't1',
          sequence: 1,
        },
        checkpoint: null,
        freshnessAt: 't1',
        projectionVersion: 1,
        updatedAt: 't1',
        authoritative: false,
      },
    ]);
    expect(snapshots).toHaveLength(1);
    expect(Object.isFrozen(snapshots)).toBe(true);
    expect(Object.isFrozen(snapshots[0])).toBe(true);
    expect(snapshots[0]?.isMarketStateClassification).toBe(false);
    expect(snapshots[0]?.authorityClass).toBe('observation');
  });

  it('returns empty-safe bundles for missing LMD rows', () => {
    expect(toMarketSnapshotInputs('ws-1', [])).toEqual([]);
    expect(toExchangeMetadataInputs('ws-1', [])).toEqual([]);
    const symbols = toSymbolStateBundle('ws-1', []);
    expect(symbols.empty).toBe(true);
    expect(symbols.isMarketStateClassification).toBe(false);
  });

  it('preserves research_artifact and denies ownership transfer flags', () => {
    const summary = toQualificationSummaryInput({
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance',
      marketSymbol: 'BTCUSDT',
      targetId: 't1',
      lifecycle: null,
      confidence: null,
      health: null,
      authorityClass: 'research_artifact',
      forcesTrade: false,
      authorizesSession: false,
      mutable: false,
      consumerWritable: false,
    });
    expect(summary?.authorityClass).toBe('research_artifact');
    expect(summary?.isQualificationOwnership).toBe(false);
    expect(summary?.isMarketStateClassification).toBe(false);

    const profile = toProfileLatestInput({
      marketProfileId: 'mp-1',
      workspaceId: 'ws-1',
      targetId: 't1',
      exchangeScopeId: 'binance',
      marketSymbol: 'BTCUSDT',
      version: 1,
      qualificationRunId: 'run-1',
      dimensions: {
        volatilityRegime: 'low',
        liquidityRegime: 'medium',
        trendRegime: 'flat',
        structureCharacteristicCount: 0,
      },
      confidenceLevel: 'medium',
      publishedAt: '2026-08-10T00:00:00.000Z',
      authorityClass: 'research_artifact',
      forcesTrade: false,
      authorizesSession: false,
      mutable: false,
      consumerWritable: false,
    });
    expect(profile?.isProfileOwnership).toBe(false);
    expect(profile?.isMarketStateClassification).toBe(false);
    expect(toQualificationSummaryInput(null)).toBeNull();
    expect(toProfileLatestInput(null)).toBeNull();
  });
});
