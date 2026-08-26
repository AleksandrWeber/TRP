import { Injectable } from '@nestjs/common';
import type { OpenRouterLastTestResult } from './openrouter-connectivity.projection';

/**
 * Last OpenRouter connectivity test result cache (W2-S05-a).
 *
 * Entries are workspace-scoped and not persisted. Cleared when credentials
 * change or the connection is disconnected, disabled, or revoked.
 */
@Injectable()
export class OpenRouterConnectivityCache {
  private readonly entries = new Map<string, OpenRouterLastTestResult>();

  get(workspaceId: string, connectionId: string): OpenRouterLastTestResult | null {
    return this.entries.get(cacheKey(workspaceId, connectionId)) ?? null;
  }

  set(workspaceId: string, connectionId: string, result: OpenRouterLastTestResult): void {
    this.entries.set(cacheKey(workspaceId, connectionId), result);
  }

  clear(workspaceId: string, connectionId: string): void {
    this.entries.delete(cacheKey(workspaceId, connectionId));
  }
}

function cacheKey(workspaceId: string, connectionId: string): string {
  return `${workspaceId}:${connectionId}`;
}
