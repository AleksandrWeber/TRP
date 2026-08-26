import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { hasMarketDataProviderCapability } from './market-data-provider-capabilities';
import { MarketDataAdapterFactory } from './market-data-adapter.factory';
import { MarketSymbolCache } from './market-symbol.cache';
import { MarketSymbolDiscoveryAudit } from './market-symbol.audit';
import {
  MARKET_DATA_SYMBOL_DISCOVERY_ADAPTERS,
  type MarketSymbolDiscoveryAdapter,
  type MarketSymbolDiscoveryAdapterResult,
} from './market-symbol.discovery';
import {
  DEFAULT_SYMBOL_DISCOVERY_TIMEOUT_MS,
  SYMBOL_DISCOVERY_TIMEOUT_MS,
} from './market-symbol.http';
import { projectSymbolDiscovery, type MarketSymbolDiscoveryView } from './market-symbol.projection';
import {
  MarketSymbolDuplicateError,
  MarketSymbolMalformedPayloadError,
  MarketSymbolValidationError,
  validateAndNormalizeSymbols,
} from './market-symbol.validate';

export type MarketSymbolDiscoveryRequest = Readonly<{
  workspaceId: string;
  actorUserId: string;
  connectionId: string;
}>;

/**
 * Exchange symbol discovery orchestration (W2-S03-b).
 *
 * Scoped through the authenticated workspace exchange connection. Retrieves,
 * normalizes, validates, caches, and projects symbols only. Does not retrieve
 * ticker, candles, order book, balances, or positions.
 */
@Injectable()
export class MarketSymbolDiscoveryService {
  private readonly adapters: ReadonlyMap<string, MarketSymbolDiscoveryAdapter>;
  private readonly timeoutMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly factory: MarketDataAdapterFactory,
    private readonly cache: MarketSymbolCache,
    private readonly audit: MarketSymbolDiscoveryAudit,
    @Inject(MARKET_DATA_SYMBOL_DISCOVERY_ADAPTERS)
    adapters: readonly MarketSymbolDiscoveryAdapter[],
    @Optional() @Inject(SYMBOL_DISCOVERY_TIMEOUT_MS) timeoutMs?: number,
  ) {
    this.adapters = new Map(adapters.map((adapter) => [adapter.providerId, adapter]));
    this.timeoutMs = timeoutMs ?? DEFAULT_SYMBOL_DISCOVERY_TIMEOUT_MS;
  }

  cached(workspaceId: string, connectionId: string): MarketSymbolDiscoveryView | null {
    const entry = this.cache.get(workspaceId, connectionId);
    if (!entry) {
      return null;
    }
    return projectSymbolDiscovery({
      connectionId,
      providerId: entry.providerId,
      discoveredAt: entry.discoveredAt,
      symbols: entry.symbols,
      outcome: 'COMPLETED',
      failureReason: null,
    });
  }

  clear(workspaceId: string, connectionId: string): void {
    this.cache.clear(workspaceId, connectionId);
  }

  async discover(input: MarketSymbolDiscoveryRequest): Promise<MarketSymbolDiscoveryView> {
    const connection = await this.prisma.connectionRecord.findFirst({
      where: { id: input.connectionId, workspaceId: input.workspaceId },
    });
    if (!connection) {
      throw new NotFoundException('Connection not found');
    }
    if (connection.connectionType !== 'EXCHANGE') {
      throw new NotFoundException('Exchange connection not found');
    }

    const providerId = connection.provider;
    await this.audit.record({
      outcome: 'symbol_discovery_started',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: input.connectionId,
      provider: providerId,
    });

    const discoveredAt = new Date().toISOString();

    try {
      if (connection.status !== 'CONNECTED') {
        return await this.fail(
          input,
          providerId,
          discoveredAt,
          'FAILED',
          'Connection is not Connected',
        );
      }

      const marketAdapter = this.factory.tryResolve(providerId);
      if (!marketAdapter) {
        return await this.fail(
          input,
          providerId,
          discoveredAt,
          'FAILED',
          'Unknown market data provider',
        );
      }
      const contract = marketAdapter.describe();
      if (!hasMarketDataProviderCapability(contract.capabilities, 'SYMBOLS')) {
        return await this.fail(
          input,
          providerId,
          discoveredAt,
          'FAILED',
          'Provider does not declare Symbols capability',
        );
      }

      const adapter = this.adapters.get(providerId);
      if (!adapter || !adapter.implemented) {
        return await this.fail(
          input,
          providerId,
          discoveredAt,
          'NOT_IMPLEMENTED',
          'Symbol discovery is not implemented for this provider',
        );
      }

      const adapterResult = await this.executeAdapter(adapter);
      return await this.projectAdapterResult(input, providerId, discoveredAt, adapterResult);
    } catch (error) {
      if (
        error instanceof MarketSymbolValidationError ||
        error instanceof MarketSymbolDuplicateError ||
        error instanceof MarketSymbolMalformedPayloadError
      ) {
        return await this.fail(input, providerId, discoveredAt, 'FAILED', error.message);
      }
      return await this.fail(input, providerId, discoveredAt, 'FAILED', 'Symbol discovery failed');
    }
  }

  private async executeAdapter(
    adapter: MarketSymbolDiscoveryAdapter,
  ): Promise<MarketSymbolDiscoveryAdapterResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const result = await adapter.discover({
        nowMs: Date.now(),
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        return { kind: 'failed' };
      }
      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  private async projectAdapterResult(
    input: MarketSymbolDiscoveryRequest,
    providerId: string,
    discoveredAt: string,
    result: MarketSymbolDiscoveryAdapterResult,
  ): Promise<MarketSymbolDiscoveryView> {
    switch (result.kind) {
      case 'discovered': {
        if (!result.definitions) {
          return this.fail(
            input,
            providerId,
            discoveredAt,
            'FAILED',
            'Malformed provider symbol payload',
          );
        }
        const symbols = validateAndNormalizeSymbols(providerId, result.definitions);
        this.cache.set(input.workspaceId, input.connectionId, {
          providerId,
          discoveredAt,
          symbols,
        });
        const view = projectSymbolDiscovery({
          connectionId: input.connectionId,
          providerId,
          discoveredAt,
          symbols,
          outcome: 'COMPLETED',
          failureReason: null,
        });
        await this.audit.record({
          outcome: 'symbol_discovery_completed',
          workspaceId: input.workspaceId,
          actorUserId: input.actorUserId,
          connectionId: input.connectionId,
          provider: providerId,
        });
        return view;
      }
      case 'not_implemented':
        return this.fail(
          input,
          providerId,
          discoveredAt,
          'NOT_IMPLEMENTED',
          'Symbol discovery is not implemented for this provider',
        );
      case 'provider_unavailable':
        return this.fail(
          input,
          providerId,
          discoveredAt,
          'PROVIDER_UNAVAILABLE',
          'Provider unavailable',
        );
      case 'malformed':
        return this.fail(
          input,
          providerId,
          discoveredAt,
          'FAILED',
          'Malformed provider symbol payload',
        );
      case 'failed':
        return this.fail(input, providerId, discoveredAt, 'FAILED', 'Symbol discovery failed');
    }
  }

  private async fail(
    input: MarketSymbolDiscoveryRequest,
    providerId: string,
    discoveredAt: string,
    outcome: Exclude<MarketSymbolDiscoveryView['outcome'], 'COMPLETED'>,
    failureReason: string,
  ): Promise<MarketSymbolDiscoveryView> {
    this.cache.clear(input.workspaceId, input.connectionId);
    const view = projectSymbolDiscovery({
      connectionId: input.connectionId,
      providerId,
      discoveredAt,
      symbols: [],
      outcome,
      failureReason,
    });
    await this.audit
      .record({
        outcome: 'symbol_discovery_failed',
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        connectionId: input.connectionId,
        provider: providerId,
        failureReason,
      })
      .catch(() => undefined);
    return view;
  }
}
