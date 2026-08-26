import { describe, expect, it } from 'vitest';
import { MarketDataAdapterFactory } from './market-data-adapter.factory';
import { MarketDataAdapterRegistry } from './market-data-adapter.registry';
import { BinanceSymbolDiscoveryAdapter } from './binance-symbol.adapter';
import { MarketSymbolCache } from './market-symbol.cache';
import { MarketSymbolDiscoveryAudit } from './market-symbol.audit';
import { MarketSymbolDiscoveryService } from './market-symbol.service';
import { PlannedSymbolDiscoveryAdapter } from './planned-symbol.adapter';
import type { SymbolDiscoveryHttpRequest, SymbolDiscoveryHttpResponse } from './market-symbol.http';

type ConnectionRow = {
  id: string;
  workspaceId: string;
  provider: string;
  connectionType: string;
  status: string;
};

function memoryPrisma(rows: ConnectionRow[]) {
  return {
    connectionRecord: {
      findFirst: async ({ where }: { where: { id: string; workspaceId: string } }) =>
        rows.find((row) => row.id === where.id && row.workspaceId === where.workspaceId) ?? null,
    },
  };
}

function memoryAudit() {
  const events: Array<{
    outcome: string;
    source: string;
    payload: Record<string, unknown>;
    attribution: Record<string, string>;
  }> = [];
  return {
    events,
    record: async (write: {
      outcome: string;
      source: string;
      payload: Record<string, unknown>;
      attribution: Record<string, string>;
    }) => {
      events.push(write);
    },
  };
}

function httpMock(
  handler: (request: SymbolDiscoveryHttpRequest) => Promise<SymbolDiscoveryHttpResponse>,
) {
  return {
    request: async (input: SymbolDiscoveryHttpRequest) => handler(input),
  };
}

function serviceFor(options: {
  rows: ConnectionRow[];
  audit: ReturnType<typeof memoryAudit>;
  http?: ReturnType<typeof httpMock>;
}) {
  const registry = new MarketDataAdapterRegistry();
  const factory = new MarketDataAdapterFactory(registry);
  const http =
    options.http ??
    httpMock(async () => ({
      status: 200,
      bodyText: JSON.stringify({
        symbols: [
          {
            symbol: 'BTCUSDT',
            status: 'TRADING',
            baseAsset: 'BTC',
            quoteAsset: 'USDT',
          },
          {
            symbol: 'ETHUSDT',
            status: 'TRADING',
            baseAsset: 'ETH',
            quoteAsset: 'USDT',
          },
        ],
      }),
    }));
  return new MarketSymbolDiscoveryService(
    memoryPrisma(options.rows) as never,
    factory,
    new MarketSymbolCache(),
    new MarketSymbolDiscoveryAudit(options.audit as never),
    [
      new BinanceSymbolDiscoveryAdapter(http),
      new PlannedSymbolDiscoveryAdapter('BYBIT'),
      new PlannedSymbolDiscoveryAdapter('OKX'),
    ],
    5_000,
  );
}

const connectedBinance = {
  id: 'connection-a',
  workspaceId: 'workspace-a',
  provider: 'BINANCE',
  connectionType: 'EXCHANGE',
  status: 'CONNECTED',
};

describe('MarketSymbolDiscoveryService (W2-S03-b)', () => {
  it('discovers, normalizes, caches, and audits Binance symbols', async () => {
    const audit = memoryAudit();
    const service = serviceFor({ rows: [connectedBinance], audit });

    const view = await service.discover({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
    });

    expect(view.outcome).toBe('COMPLETED');
    expect(view.symbols.map((symbol) => symbol.normalizedSymbol)).toEqual(['BTC-USDT', 'ETH-USDT']);
    expect(view.symbols.every((symbol) => symbol.providerId === 'BINANCE')).toBe(true);
    expect(service.cached('workspace-a', 'connection-a')?.symbols).toHaveLength(2);
    expect(service.cached('workspace-b', 'connection-a')).toBeNull();
    expect(audit.events.map((event) => event.outcome)).toEqual([
      'symbol_discovery_started',
      'symbol_discovery_completed',
    ]);
    expect(JSON.stringify(view)).not.toMatch(/price|ticker|candle|orderBook|balance|position/i);
  });

  it('isolates workspace ownership and denies foreign connections', async () => {
    const audit = memoryAudit();
    const service = serviceFor({ rows: [connectedBinance], audit });

    await expect(
      service.discover({
        workspaceId: 'workspace-b',
        actorUserId: 'operator-b',
        connectionId: 'connection-a',
      }),
    ).rejects.toThrow('Connection not found');
  });

  it('reports not implemented for Bybit and OKX', async () => {
    const audit = memoryAudit();
    const service = serviceFor({
      rows: [
        {
          id: 'connection-bybit',
          workspaceId: 'workspace-a',
          provider: 'BYBIT',
          connectionType: 'EXCHANGE',
          status: 'CONNECTED',
        },
      ],
      audit,
    });

    const view = await service.discover({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-bybit',
    });
    expect(view.outcome).toBe('NOT_IMPLEMENTED');
    expect(view.symbols).toEqual([]);
    expect(audit.events.map((event) => event.outcome)).toContain('symbol_discovery_failed');
  });

  it('rejects malformed payloads and provider unavailable without caching', async () => {
    const malformedAudit = memoryAudit();
    const malformed = serviceFor({
      rows: [connectedBinance],
      audit: malformedAudit,
      http: httpMock(async () => ({ status: 200, bodyText: '{"symbols":[{"symbol":"BTCUSDT"}]}' })),
    });
    const malformedView = await malformed.discover({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
    });
    expect(malformedView.outcome).toBe('FAILED');
    expect(malformed.cached('workspace-a', 'connection-a')).toBeNull();

    const unavailableAudit = memoryAudit();
    const unavailable = serviceFor({
      rows: [connectedBinance],
      audit: unavailableAudit,
      http: httpMock(async () => ({ status: 503, bodyText: 'down' })),
    });
    const unavailableView = await unavailable.discover({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
    });
    expect(unavailableView.outcome).toBe('PROVIDER_UNAVAILABLE');
  });

  it('fails when the exchange connection is not Connected', async () => {
    const audit = memoryAudit();
    const service = serviceFor({
      rows: [{ ...connectedBinance, status: 'DISCONNECTED' }],
      audit,
    });
    const view = await service.discover({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
    });
    expect(view.outcome).toBe('FAILED');
    expect(view.failureReason).toContain('Connected');
  });
});
