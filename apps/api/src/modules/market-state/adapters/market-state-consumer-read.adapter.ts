/**
 * RC-26 Epic 6 — Market State consumer read adapter.
 *
 * Maps MarketState domain → immutable consumer projections.
 * Read-only. No commands. No callbacks.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  MARKET_STATE_CONSUMER_FLAGS,
  type MarketStateProjection,
  type MarketStateTransitionProjection,
} from '../domain/market-state-consumer-read-model';
import { MarketStateProjectionStore } from '../domain/market-state-projection.store';
import type { MarketStateConsumerReadPort } from '../ports/market-state.port';

export type MarketStateConsumerTargetQuery = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  marketStateId?: string;
  limit?: number;
}>;

@Injectable()
export class MarketStateConsumerReadAdapter implements MarketStateConsumerReadPort {
  constructor(
    @Inject(MarketStateProjectionStore)
    private readonly store: MarketStateProjectionStore,
  ) {}

  getCurrentStateProjection(query: MarketStateConsumerTargetQuery): MarketStateProjection | null {
    const state = this.store.getCurrent(query);
    if (!state) return null;
    return Object.freeze({
      marketStateId: state.marketStateId,
      workspaceId: state.workspaceId,
      exchangeScopeId: state.exchangeScopeId,
      marketSymbol: state.marketSymbol,
      version: state.version.version,
      lifecycleStatus: state.lifecycle.status,
      regimeLabel: state.snapshot.regime,
      ...(state.snapshot.volatilityClass
        ? { volatilityLabel: state.snapshot.volatilityClass }
        : {}),
      ...(state.snapshot.liquidityClass ? { liquidityLabel: state.snapshot.liquidityClass } : {}),
      metadataSummary: state.metadata.inputSummary,
      publishedAt: state.version.publishedAt,
      publishedBy: state.version.publishedBy,
      ...MARKET_STATE_CONSUMER_FLAGS,
    });
  }

  listRecentTransitions(
    query: MarketStateConsumerTargetQuery,
  ): readonly MarketStateTransitionProjection[] {
    return Object.freeze(
      this.store.listTransitions(query).map((row) =>
        Object.freeze({
          marketStateId: row.marketStateId,
          workspaceId: row.workspaceId,
          exchangeScopeId: row.exchangeScopeId,
          marketSymbol: row.marketSymbol,
          fromVersion: row.fromVersion,
          toVersion: row.toVersion,
          ...(row.fromLifecycle !== undefined ? { fromLifecycle: row.fromLifecycle } : {}),
          toLifecycle: row.toLifecycle,
          transitionedAt: row.transitionedAt,
          authorityClass: 'market_state_artifact' as const,
          forcesTrade: false as const,
          isQualification: false as const,
          isProfile: false as const,
          mutable: false as const,
          consumerWritable: false as const,
        }),
      ),
    );
  }
}
