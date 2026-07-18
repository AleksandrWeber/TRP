import { Injectable } from '@nestjs/common';
import type { Instrument } from '../../market-data/instrument';
import type { Timeframe } from '../../market-data/timeframe';
import type { MarketDataSourceId } from '../domain/market-data-source';
import type { MarketStreamChannel } from '../domain/market-stream-channel';
import {
  createMarketSubscription,
  MarketSubscriptionState,
  type MarketSubscription,
} from '../domain/market-subscription';
import { buildMarketStreamId } from '../domain/market-stream-identity';

/**
 * Desired-subscription command (US140).
 * Identity is derived deterministically — duplicate commands are idempotent.
 */
export type MarketSubscribeCommand = {
  workspaceId: string;
  sourceId: MarketDataSourceId | string;
  instrument: Instrument | string;
  channel: MarketStreamChannel;
  timeframe?: Timeframe;
};

/**
 * Workspace-scoped desired-subscription registry (US140 / ADR-017).
 * Desired state is independent of connector socket instances and survives
 * connector replacement. No Trading Session behavior.
 */
@Injectable()
export class MarketSubscriptionRegistry {
  private readonly byId = new Map<string, MarketSubscription>();

  /**
   * Register desire. Idempotent: repeating the same command returns the
   * existing subscription without state loss.
   */
  subscribe(command: MarketSubscribeCommand, at: string): MarketSubscription {
    const id = subscriptionIdFor(command);
    const existing = this.byId.get(id);
    if (existing && existing.state !== MarketSubscriptionState.STOPPED) {
      return existing;
    }

    const subscription = createMarketSubscription({
      id,
      workspaceId: command.workspaceId,
      sourceId: command.sourceId,
      instrument: command.instrument,
      channel: command.channel,
      streamId: buildMarketStreamId(command),
      ...(command.timeframe !== undefined ? { timeframe: command.timeframe } : {}),
      state: MarketSubscriptionState.DESIRED,
      updatedAt: at,
    });
    this.byId.set(id, subscription);
    return subscription;
  }

  /** Connector acknowledged the stream. */
  markActive(workspaceId: string, id: string, at: string): MarketSubscription {
    return this.transition(workspaceId, id, MarketSubscriptionState.ACTIVE, at);
  }

  /**
   * Connector instance was replaced or lost: desired subscriptions fall back
   * to DESIRED so a replacement connector can re-arm them. Stopped stays stopped.
   */
  markDesiredForSource(sourceId: MarketDataSourceId | string, at: string): void {
    for (const [id, subscription] of this.byId) {
      if (String(subscription.sourceId) !== String(sourceId)) continue;
      if (subscription.state !== MarketSubscriptionState.ACTIVE) continue;
      this.byId.set(
        id,
        createMarketSubscription({
          ...subscription,
          state: MarketSubscriptionState.DESIRED,
          updatedAt: at,
        }),
      );
    }
  }

  /** Idempotent stop; unknown ids are a no-op returning null. */
  unsubscribe(workspaceId: string, id: string, at: string): MarketSubscription | null {
    const existing = this.byId.get(id);
    if (!existing || existing.workspaceId !== workspaceId) {
      return null;
    }
    if (existing.state === MarketSubscriptionState.STOPPED) {
      return existing;
    }
    return this.transition(workspaceId, id, MarketSubscriptionState.STOPPED, at);
  }

  /** Workspace-scoped lookup; other workspaces cannot see the row. */
  get(workspaceId: string, id: string): MarketSubscription | null {
    const found = this.byId.get(id);
    if (!found || found.workspaceId !== workspaceId) return null;
    return found;
  }

  /** All subscriptions of one workspace only. */
  list(workspaceId: string): ReadonlyArray<MarketSubscription> {
    return Object.freeze([...this.byId.values()].filter((row) => row.workspaceId === workspaceId));
  }

  /**
   * Desired (non-stopped) subscriptions for a source — what a fresh connector
   * instance must arm after replacement.
   */
  desiredFor(sourceId: MarketDataSourceId | string): ReadonlyArray<MarketSubscription> {
    return Object.freeze(
      [...this.byId.values()].filter(
        (row) =>
          String(row.sourceId) === String(sourceId) &&
          row.state !== MarketSubscriptionState.STOPPED &&
          row.state !== MarketSubscriptionState.PAUSED,
      ),
    );
  }

  private transition(
    workspaceId: string,
    id: string,
    state: MarketSubscriptionState,
    at: string,
  ): MarketSubscription {
    const existing = this.byId.get(id);
    if (!existing || existing.workspaceId !== workspaceId) {
      throw new Error(`subscription not found in workspace: ${id}`);
    }
    const next = createMarketSubscription({
      ...existing,
      state,
      updatedAt: at,
    });
    this.byId.set(id, next);
    return next;
  }
}

/** Deterministic, workspace-scoped subscription identity (US140). */
export function subscriptionIdFor(command: MarketSubscribeCommand): string {
  return `sub:${buildMarketStreamId(command)}`;
}
