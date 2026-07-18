import { describe, expect, it } from 'vitest';
import { createClosedCandleEvent } from '../domain/closed-candle-event';
import { MarketHealthStatus } from '../domain/market-status';
import { Timeframe } from '../../market-data/timeframe';
import {
  evaluateMarketHealth,
  isMarketStreamHealthy,
  isOperationallyFresh,
} from './market-health-evaluator';
import {
  assertMarketHealthTransition,
  canTransitionMarketHealth,
} from './market-health-transitions';
import { MarketStatusService } from './market-status.service';

describe('US144 — Market Status and Staleness Model', () => {
  describe('evaluateMarketHealth', () => {
    it('requires connected, gap-free, and fresh for HEALTHY', () => {
      expect(
        evaluateMarketHealth({
          connection: 'connected',
          gapFree: true,
          lastOperationalMessageAt: '2026-07-18T12:00:00.000Z',
          now: '2026-07-18T12:00:30.000Z',
          policy: { stalenessThresholdMs: 60_000 },
        }),
      ).toBe(MarketHealthStatus.HEALTHY);

      expect(
        evaluateMarketHealth({
          connection: 'connected',
          gapFree: false,
          lastOperationalMessageAt: '2026-07-18T12:00:00.000Z',
          now: '2026-07-18T12:00:30.000Z',
        }),
      ).toBe(MarketHealthStatus.RECOVERING);

      expect(
        evaluateMarketHealth({
          connection: 'connected',
          gapFree: true,
          lastOperationalMessageAt: '2026-07-18T11:00:00.000Z',
          now: '2026-07-18T12:00:00.000Z',
          policy: { stalenessThresholdMs: 60_000 },
        }),
      ).toBe(MarketHealthStatus.STALE);
    });

    it('maps connection and unresolved-gap states explicitly', () => {
      expect(
        evaluateMarketHealth({
          connection: 'disconnected',
          gapFree: true,
          lastOperationalMessageAt: null,
          now: '2026-07-18T12:00:00.000Z',
        }),
      ).toBe(MarketHealthStatus.DISCONNECTED);
      expect(
        evaluateMarketHealth({
          connection: 'connecting',
          gapFree: true,
          lastOperationalMessageAt: null,
          now: '2026-07-18T12:00:00.000Z',
        }),
      ).toBe(MarketHealthStatus.CONNECTING);
      expect(
        evaluateMarketHealth({
          connection: 'failed',
          gapFree: true,
          lastOperationalMessageAt: null,
          now: '2026-07-18T12:00:00.000Z',
        }),
      ).toBe(MarketHealthStatus.FAILED);
      expect(
        evaluateMarketHealth({
          connection: 'connected',
          gapFree: false,
          unresolvedGap: true,
          lastOperationalMessageAt: '2026-07-18T12:00:00.000Z',
          now: '2026-07-18T12:00:10.000Z',
        }),
      ).toBe(MarketHealthStatus.UNAVAILABLE);
    });

    it('uses operational time only for freshness — not exchange candle time', () => {
      // Ops message is fresh even if we *imagine* an old exchange candle.
      expect(
        isOperationallyFresh('2026-07-18T12:00:50.000Z', '2026-07-18T12:01:00.000Z', 60_000),
      ).toBe(true);
      // Stale ops clock.
      expect(
        isOperationallyFresh('2026-07-18T11:00:00.000Z', '2026-07-18T12:01:00.000Z', 60_000),
      ).toBe(false);
    });
  });

  describe('transitions', () => {
    it('allows and rejects transitions explicitly', () => {
      expect(canTransitionMarketHealth(MarketHealthStatus.HEALTHY, MarketHealthStatus.STALE)).toBe(
        true,
      );
      expect(canTransitionMarketHealth(MarketHealthStatus.FAILED, MarketHealthStatus.HEALTHY)).toBe(
        false,
      );
      expect(() =>
        assertMarketHealthTransition(MarketHealthStatus.FAILED, MarketHealthStatus.HEALTHY),
      ).toThrow(/illegal market health transition/);
    });
  });

  describe('MarketStatusService', () => {
    it('emits durable versioned status events on state change', () => {
      const service = new MarketStatusService({ stalenessThresholdMs: 60_000 });
      const base = {
        workspaceId: 'ws-1',
        sourceId: 'binance_spot',
        instrument: 'BTCUSDT',
        recordedAt: '2026-07-18T12:00:00.000Z',
      };

      const connecting = service.apply({
        ...base,
        connection: 'connecting',
        gapFree: true,
        lastOperationalMessageAt: null,
        now: '2026-07-18T12:00:00.000Z',
        reason: 'connect started',
      });
      expect(connecting.changed).toBe(true);
      expect(connecting.snapshot.status).toBe(MarketHealthStatus.CONNECTING);
      expect(connecting.event?.schemaVersion).toBe(1);
      expect(connecting.event?.sequence).toBe(1);

      const healthy = service.apply({
        ...base,
        recordedAt: '2026-07-18T12:00:05.000Z',
        connection: 'connected',
        gapFree: true,
        lastOperationalMessageAt: '2026-07-18T12:00:05.000Z',
        now: '2026-07-18T12:00:05.000Z',
      });
      expect(healthy.snapshot.status).toBe(MarketHealthStatus.HEALTHY);
      expect(healthy.event?.sequence).toBe(2);
      expect(isMarketStreamHealthy(healthy.snapshot.status)).toBe(true);

      const noop = service.apply({
        ...base,
        recordedAt: '2026-07-18T12:00:06.000Z',
        connection: 'connected',
        gapFree: true,
        lastOperationalMessageAt: '2026-07-18T12:00:06.000Z',
        now: '2026-07-18T12:00:06.000Z',
      });
      expect(noop.changed).toBe(false);
      expect(noop.event).toBeNull();
      expect(service.emittedEvents()).toHaveLength(2);
    });

    it('never changes candle/price semantics when health becomes STALE', () => {
      const candle = createClosedCandleEvent({
        workspaceId: 'ws-1',
        sourceId: 'binance_spot',
        instrument: 'BTCUSDT',
        timeframe: Timeframe.M1,
        sequence: 1,
        openTime: '2026-07-18T10:00:00.000Z',
        closeTime: '2026-07-18T10:00:59.999Z',
        open: 100,
        high: 110,
        low: 90,
        close: 105,
        volume: 2,
        exchangeOccurredAt: '2026-07-18T10:00:00.000Z',
        occurredAt: '2026-07-18T10:00:00.000Z',
        receivedAt: '2026-07-18T10:00:01.000Z',
        processedAt: '2026-07-18T10:00:02.000Z',
        recordedAt: '2026-07-18T10:00:03.000Z',
      });
      const before = structuredClone(candle);

      const service = new MarketStatusService({ stalenessThresholdMs: 1_000 });
      service.apply({
        workspaceId: 'ws-1',
        sourceId: 'binance_spot',
        instrument: 'BTCUSDT',
        connection: 'connecting',
        gapFree: true,
        lastOperationalMessageAt: null,
        now: '2026-07-18T12:00:00.000Z',
        recordedAt: '2026-07-18T12:00:00.000Z',
      });
      service.apply({
        workspaceId: 'ws-1',
        sourceId: 'binance_spot',
        instrument: 'BTCUSDT',
        connection: 'connected',
        gapFree: true,
        lastOperationalMessageAt: '2026-07-18T12:00:00.000Z',
        now: '2026-07-18T12:00:00.000Z',
        recordedAt: '2026-07-18T12:00:00.000Z',
      });
      const stale = service.apply({
        workspaceId: 'ws-1',
        sourceId: 'binance_spot',
        instrument: 'BTCUSDT',
        connection: 'connected',
        gapFree: true,
        lastOperationalMessageAt: '2026-07-18T12:00:00.000Z',
        now: '2026-07-18T12:05:00.000Z',
        recordedAt: '2026-07-18T12:05:00.000Z',
      });

      expect(stale.snapshot.status).toBe(MarketHealthStatus.STALE);
      expect(candle).toEqual(before);
      expect(JSON.stringify(candle)).not.toContain('stale');
    });
  });
});
