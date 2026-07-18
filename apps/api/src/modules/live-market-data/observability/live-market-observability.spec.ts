import { describe, expect, it } from 'vitest';
import { MarketHealthStatus } from '../domain/market-status';
import { MarketStatusService } from '../status/market-status.service';
import { LiveMarketHealthProbes } from './live-market-health-probes';
import {
  assertBoundedLabels,
  LiveMarketDataMetrics,
  LiveMarketMetricNames,
} from './live-market-data.metrics';
import { buildLiveMarketLog } from './live-market-log';

describe('US145 — Market Data Logging, Metrics, and Health Checks', () => {
  describe('metrics', () => {
    it('covers event rate, lag, duplicates, invalids, gaps, reconnects, backfill, outbox age, consumer lag, dead letters', () => {
      const metrics = new LiveMarketDataMetrics();
      const labels = { sourceId: 'binance_spot', channel: 'closed_candle' };

      metrics.recordEvent(labels);
      metrics.recordEventLagMs(42, labels);
      metrics.recordDuplicate(labels);
      metrics.recordInvalid({ ...labels, outcome: 'quarantined' });
      metrics.recordGap(labels);
      metrics.recordReconnect({ sourceId: 'binance_spot' });
      metrics.recordBackfillBars(10, labels);
      metrics.setOutboxOldestAgeMs(1_500);
      metrics.setConsumerLag(3, { consumerId: 'live-market-data.latest-state' });
      metrics.recordDeadLetter({ outcome: 'dead_letter' });

      const snap = metrics.snapshot();
      expect(snap.eventsTotal).toBe(1);
      expect(snap.lastEventLagMs).toBe(42);
      expect(snap.duplicatesTotal).toBe(1);
      expect(snap.invalidsTotal).toBe(1);
      expect(snap.gapsTotal).toBe(1);
      expect(snap.reconnectsTotal).toBe(1);
      expect(snap.backfillBarsTotal).toBe(10);
      expect(snap.outboxOldestAgeMs).toBe(1_500);
      expect(snap.consumerLag).toBe(3);
      expect(snap.deadLettersTotal).toBe(1);

      expect(LiveMarketMetricNames.eventsTotal).toBe('live_market_events_total');
    });

    it('rejects unbounded metric labels', () => {
      expect(() => assertBoundedLabels({ instrument: 'BTCUSDT' } as never)).toThrow(
        /forbidden live-market metric label/,
      );
    });
  });

  describe('logging', () => {
    it('includes correlation/stream identity without secrets', () => {
      const record = buildLiveMarketLog(
        'info',
        {
          message: 'stream recovering',
          workspaceId: 'ws-1',
          sourceId: 'binance_spot',
          streamId: 'ws-1:binance_spot:BTCUSDT:closed_candle:1m',
          channel: 'closed_candle',
          correlationId: 'corr-123',
          status: MarketHealthStatus.RECOVERING,
          apiKey: 'should-not-appear',
          authorization: 'Bearer super-secret-token-value-0123456789',
          password: 'hunter2',
        },
        '2026-07-18T12:00:00.000Z',
      );

      expect(record.correlationId).toBe('corr-123');
      expect(record.streamId).toContain('closed_candle');
      expect(JSON.stringify(record)).not.toContain('apiKey');
      expect(JSON.stringify(record)).not.toContain('Bearer');
      expect(JSON.stringify(record)).not.toContain('hunter2');
    });
  });

  describe('readiness / liveness', () => {
    function seedHealthy(service: MarketStatusService, at = '2026-07-18T12:00:00.000Z') {
      service.apply({
        workspaceId: 'ws-1',
        sourceId: 'binance_spot',
        instrument: 'BTCUSDT',
        connection: 'connecting',
        gapFree: true,
        lastOperationalMessageAt: null,
        now: at,
        recordedAt: at,
      });
      return service.apply({
        workspaceId: 'ws-1',
        sourceId: 'binance_spot',
        instrument: 'BTCUSDT',
        connection: 'connected',
        gapFree: true,
        lastOperationalMessageAt: at,
        now: at,
        recordedAt: at,
      });
    }

    it('readiness fails when required streams cannot become healthy', () => {
      const status = new MarketStatusService({ stalenessThresholdMs: 60_000 });
      const healthy = seedHealthy(status);
      const probes = new LiveMarketHealthProbes(status);
      probes.setRequiredStreams([
        { workspaceId: 'ws-1', streamId: healthy.snapshot.streamId },
        { workspaceId: 'ws-1', streamId: 'missing-required-stream' },
      ]);

      const ready = probes.readiness('2026-07-18T12:00:10.000Z');
      expect(ready.ok).toBe(false);
      expect(ready.reason).toMatch(/required streams/);
    });

    it('liveness does not fail solely because one stream is recovering', () => {
      const status = new MarketStatusService({ stalenessThresholdMs: 60_000 });
      const first = seedHealthy(status);

      // Second instrument enters recovering.
      status.apply({
        workspaceId: 'ws-1',
        sourceId: 'binance_spot',
        instrument: 'ETHUSDT',
        connection: 'connecting',
        gapFree: true,
        lastOperationalMessageAt: null,
        now: '2026-07-18T12:00:00.000Z',
        recordedAt: '2026-07-18T12:00:00.000Z',
      });
      status.apply({
        workspaceId: 'ws-1',
        sourceId: 'binance_spot',
        instrument: 'ETHUSDT',
        connection: 'connected',
        gapFree: false,
        lastOperationalMessageAt: '2026-07-18T12:00:00.000Z',
        now: '2026-07-18T12:00:00.000Z',
        recordedAt: '2026-07-18T12:00:00.000Z',
      });

      const probes = new LiveMarketHealthProbes(status);
      probes.setRequiredStreams([{ workspaceId: 'ws-1', streamId: first.snapshot.streamId }]);

      const live = probes.liveness('2026-07-18T12:00:10.000Z', 'ws-1');
      expect(live.ok).toBe(true);
      expect(live.details.recovering).toBe(1);

      // Readiness still requires the configured healthy stream.
      expect(probes.readiness('2026-07-18T12:00:10.000Z').ok).toBe(true);
    });
  });
});
