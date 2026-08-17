import { Injectable } from '@nestjs/common';
import type { ExchangeCapabilityView } from './exchange-capability.projection';

/**
 * Session-scoped capability cache (W2-S02-d).
 *
 * Entries belong to one authenticated workspace session. They are not
 * persisted and are cleared when the session is no longer Connected.
 */
@Injectable()
export class ExchangeCapabilityCache {
  private readonly entries = new Map<string, ExchangeCapabilityView>();

  get(workspaceId: string, connectionId: string): ExchangeCapabilityView | null {
    return this.entries.get(cacheKey(workspaceId, connectionId)) ?? null;
  }

  set(workspaceId: string, connectionId: string, view: ExchangeCapabilityView): void {
    this.entries.set(cacheKey(workspaceId, connectionId), view);
  }

  clear(workspaceId: string, connectionId: string): void {
    this.entries.delete(cacheKey(workspaceId, connectionId));
  }
}

function cacheKey(workspaceId: string, connectionId: string): string {
  return `${workspaceId}:${connectionId}`;
}
