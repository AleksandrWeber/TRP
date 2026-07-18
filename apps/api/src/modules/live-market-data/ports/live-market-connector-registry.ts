import { Injectable } from '@nestjs/common';
import { toMarketDataSourceId, type MarketDataSourceId } from '../domain/market-data-source';
import type { LiveMarketConnector } from './live-market-connector';

/**
 * Registry for LiveMarketConnector adapters (US131).
 * Duplicate sourceId registration is rejected.
 */
@Injectable()
export class LiveMarketConnectorRegistry {
  private readonly bySourceId = new Map<string, LiveMarketConnector>();

  register(connector: LiveMarketConnector): void {
    const sourceId = String(connector.sourceId).trim();
    if (sourceId === '') {
      throw new Error('sourceId must not be empty');
    }
    if (connector.capabilities().requiresCredentials !== false) {
      throw new Error(`connector ${sourceId} must not require credentials for public streams`);
    }
    if (this.bySourceId.has(sourceId)) {
      throw new Error(`LiveMarketConnector already registered for source: ${sourceId}`);
    }
    this.bySourceId.set(sourceId, connector);
  }

  resolve(sourceId: MarketDataSourceId | string): LiveMarketConnector {
    const normalized = String(sourceId).trim();
    if (normalized === '') {
      throw new Error('sourceId must not be empty');
    }
    const found = this.bySourceId.get(normalized);
    if (!found) {
      throw new Error(`No LiveMarketConnector registered for source: ${normalized}`);
    }
    return found;
  }

  has(sourceId: MarketDataSourceId | string): boolean {
    return this.bySourceId.has(String(sourceId).trim());
  }

  list(): ReadonlyArray<LiveMarketConnector> {
    return Object.freeze([...this.bySourceId.values()]);
  }

  sourceIds(): ReadonlyArray<MarketDataSourceId> {
    return Object.freeze([...this.bySourceId.keys()].map((id) => toMarketDataSourceId(id)));
  }
}
