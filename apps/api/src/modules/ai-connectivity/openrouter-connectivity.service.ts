import { Injectable } from '@nestjs/common';
import { OpenRouterConnectivityCache } from './openrouter-connectivity.cache';
import {
  projectOpenRouterConnectivity,
  type OpenRouterConnectivityView,
} from './openrouter-connectivity.projection';

/**
 * OpenRouter connectivity projection facade (W2-S05-a).
 *
 * Connection Management attaches this view for AI / OpenRouter connections.
 */
@Injectable()
export class OpenRouterConnectivityService {
  constructor(private readonly cache: OpenRouterConnectivityCache) {}

  projection(
    workspaceId: string,
    connectionId: string,
    connectionType: string,
    provider: string,
    status: string,
    credentialsStored: boolean,
  ): OpenRouterConnectivityView | null {
    return projectOpenRouterConnectivity(
      connectionType,
      provider,
      status,
      credentialsStored,
      this.cache.get(workspaceId, connectionId),
    );
  }

  clear(workspaceId: string, connectionId: string): void {
    this.cache.clear(workspaceId, connectionId);
  }
}
