import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiProvider } from '../ai.types';

export type OpenRouterConnectivityProbeKind =
  'authenticated' | 'authentication_failed' | 'provider_unavailable' | 'timeout' | 'failed';

/**
 * OpenRouter protocol adapter.
 *
 * complete() remains the Version 2 chat-completions path (env key).
 * probeConnectivity() is the W2-S05-a connectivity probe: it proves the
 * supplied API key is accepted without executing a prompt or chat turn.
 */
@Injectable()
export class OpenRouterProvider implements AiProvider {
  readonly name = 'openrouter';

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('OPENROUTER_API_KEY'));
  }

  /**
   * Connectivity probe for a caller-supplied API key (Vault-resolved).
   * Uses GET /auth/key. Does not call chat/completions. Does not log the key.
   */
  async probeConnectivity(
    apiKey: string,
    signal?: AbortSignal,
  ): Promise<OpenRouterConnectivityProbeKind> {
    const trimmed = apiKey.trim();
    if (trimmed === '') {
      return 'authentication_failed';
    }

    const baseUrl =
      this.config.get<string>('OPENROUTER_BASE_URL') ?? 'https://openrouter.ai/api/v1';
    const url = `${baseUrl.replace(/\/$/, '')}/auth/key`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${trimmed}`,
        },
        redirect: 'error',
        signal,
      });
      if (response.status === 200) {
        return 'authenticated';
      }
      if (response.status === 401 || response.status === 403) {
        return 'authentication_failed';
      }
      if (response.status === 408 || response.status === 429 || response.status >= 500) {
        return 'provider_unavailable';
      }
      return 'failed';
    } catch (error) {
      if (isAbortError(error)) {
        return 'timeout';
      }
      if (isNetworkError(error)) {
        return 'provider_unavailable';
      }
      return 'failed';
    }
  }

  async complete(systemPrompt: string, userPrompt: string) {
    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }
    return this.completeWithKey(apiKey, systemPrompt, userPrompt);
  }

  /**
   * Chat completion for a caller-supplied API key (Vault-resolved).
   * Used by W2-S05-b workspace AI request. Does not log the key.
   * Does not store conversation history.
   */
  async completeWithKey(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string,
    signal?: AbortSignal,
  ): Promise<{ content: string; model: string }> {
    const trimmed = apiKey.trim();
    if (trimmed === '') {
      throw new OpenRouterCompletionError('authentication_failed', 'OpenRouter API key is empty.');
    }

    const model = this.config.get<string>('OPENROUTER_MODEL') ?? 'openai/gpt-4o-mini';
    const baseUrl =
      this.config.get<string>('OPENROUTER_BASE_URL') ?? 'https://openrouter.ai/api/v1';

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${trimmed}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
        redirect: 'error',
        signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new OpenRouterCompletionError(
            'authentication_failed',
            'OpenRouter rejected the API key.',
          );
        }
        if (response.status === 408 || response.status === 429 || response.status >= 500) {
          throw new OpenRouterCompletionError(
            'provider_unavailable',
            'OpenRouter was unreachable.',
          );
        }
        throw new OpenRouterCompletionError('failed', 'OpenRouter request failed.');
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        model?: string;
      };

      const content = data.choices?.[0]?.message?.content ?? '';
      return { content, model: data.model ?? model };
    } catch (error) {
      if (error instanceof OpenRouterCompletionError) {
        throw error;
      }
      if (isAbortError(error)) {
        throw new OpenRouterCompletionError('timeout', 'OpenRouter request timed out.');
      }
      if (isNetworkError(error)) {
        throw new OpenRouterCompletionError('provider_unavailable', 'OpenRouter was unreachable.');
      }
      throw new OpenRouterCompletionError('failed', 'OpenRouter request failed.');
    }
  }
}

export type OpenRouterCompletionFailureKind =
  'authentication_failed' | 'provider_unavailable' | 'timeout' | 'failed';

export class OpenRouterCompletionError extends Error {
  readonly kind: OpenRouterCompletionFailureKind;

  constructor(kind: OpenRouterCompletionFailureKind, message: string) {
    super(message);
    this.name = 'OpenRouterCompletionError';
    this.kind = kind;
  }
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === 'AbortError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name: unknown }).name === 'AbortError')
  );
}

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    error.name === 'TypeError' ||
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('enotfound')
  );
}
