import { expect } from 'vitest';
import { Timeframe } from '../../modules/market-data/timeframe';
import { MarketStreamChannel } from '../../modules/live-market-data/domain/market-stream-channel';
import { ConnectorConnectionState } from '../../modules/live-market-data/ports/connector-connection-state';
import type { LiveMarketConnector } from '../../modules/live-market-data/ports/live-market-connector';

/**
 * Shared LiveMarketConnector contract suite (US148).
 * Implementations must pass without live network access.
 */
export async function assertLiveMarketConnectorContract(
  connector: LiveMarketConnector,
  options: {
    instrument?: string;
    timeframe?: Timeframe;
  } = {},
): Promise<void> {
  const instrument = options.instrument ?? 'BTCUSDT';
  const timeframe = options.timeframe ?? Timeframe.H1;

  expect(connector.sourceId).toBeTruthy();
  const caps = connector.capabilities();
  expect(caps.requiresCredentials).toBe(false);
  expect(typeof caps.supportsClosedCandle).toBe('boolean');
  expect(typeof caps.supportsMarkPrice).toBe('boolean');
  expect(typeof caps.supportsBackfill).toBe('boolean');

  expect(connector.health().state).toBe(ConnectorConnectionState.DISCONNECTED);

  await connector.connect();
  expect([
    ConnectorConnectionState.CONNECTED,
    ConnectorConnectionState.READY,
    ConnectorConnectionState.RECOVERING,
  ]).toContain(connector.health().state);

  if (
    caps.supportsClosedCandle &&
    connector.supportsChannel(MarketStreamChannel.CLOSED_CANDLE, timeframe)
  ) {
    try {
      await connector.subscribe({
        workspaceId: 'ws-contract',
        instrument,
        channel: MarketStreamChannel.CLOSED_CANDLE,
        timeframe,
      });
      await connector.unsubscribe({
        workspaceId: 'ws-contract',
        instrument,
        channel: MarketStreamChannel.CLOSED_CANDLE,
        timeframe,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // REST-only adapters are allowed to reject live subscribe.
      if (!/does not support live subscribe/i.test(message)) {
        throw error;
      }
    }
  }

  if (caps.supportsBackfill) {
    try {
      const bars = await connector.backfill({
        workspaceId: 'ws-contract',
        instrument,
        timeframe,
        from: '2026-07-18T09:00:00.000Z',
        to: '2026-07-18T10:00:00.000Z',
      });
      expect(Array.isArray(bars)).toBe(true);
      for (const bar of bars) {
        expect(Object.keys(bar)).not.toContain('e');
        expect(Object.keys(bar)).not.toContain('k');
        expect(Object.keys(bar)).not.toContain('binance');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/does not support|use the .*rest/i.test(message)) {
        throw error;
      }
    }
  }

  await connector.disconnect();
  expect(connector.health().state).toBe(ConnectorConnectionState.DISCONNECTED);
}
