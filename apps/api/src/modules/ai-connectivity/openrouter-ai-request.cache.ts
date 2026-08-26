import { Injectable } from '@nestjs/common';
import type { WorkspaceAiRequestView } from './openrouter-ai-request';

/**
 * Ephemeral last AI request result (W2-S05-b).
 *
 * Stores at most one result per connection for operator projection.
 * This is not conversation history, prompt history, or AI memory.
 */
@Injectable()
export class OpenRouterAiRequestCache {
  private readonly entries = new Map<string, WorkspaceAiRequestView>();

  get(workspaceId: string, connectionId: string): WorkspaceAiRequestView | null {
    return this.entries.get(cacheKey(workspaceId, connectionId)) ?? null;
  }

  set(workspaceId: string, connectionId: string, view: WorkspaceAiRequestView): void {
    this.entries.set(cacheKey(workspaceId, connectionId), view);
  }

  clear(workspaceId: string, connectionId: string): void {
    this.entries.delete(cacheKey(workspaceId, connectionId));
  }
}

function cacheKey(workspaceId: string, connectionId: string): string {
  return `${workspaceId}:${connectionId}`;
}
