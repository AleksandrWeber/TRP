import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Role } from '../identity/role';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';
import { OpenRouterConnectivityAudit } from './openrouter-connectivity.audit';
import { OpenRouterConnectivityCache } from './openrouter-connectivity.cache';
import {
  vendorVisibleMessageFor,
  type OpenRouterConnectionTestOutcome,
  type OpenRouterConnectionTestResult,
} from './openrouter-connection-test.result';
import type { OpenRouterLastTestFailureReason } from './openrouter-connectivity.projection';
import { OpenRouterKeyResolution } from './openrouter-key-resolution';

export type OpenRouterConnectionTestRequest = Readonly<{
  workspaceId: string;
  actorUserId: string;
  actorRole: Role;
  connectionId: string;
  vaultSecretId: string;
}>;

export const OPENROUTER_TEST_TIMEOUT_MS = Symbol('OPENROUTER_TEST_TIMEOUT_MS');
export const OPENROUTER_TEST_CLOCK = Symbol('OPENROUTER_TEST_CLOCK');
export const DEFAULT_OPENROUTER_TEST_TIMEOUT_MS = 10_000;

export type OpenRouterTestClock = Readonly<{ nowMs: () => number }>;
export const SYSTEM_OPENROUTER_TEST_CLOCK: OpenRouterTestClock = {
  nowMs: () => Date.now(),
};

/**
 * OpenRouter connection test (W2-S05-a).
 *
 * Resolves the workspace Vault key and probes connectivity through the
 * existing OpenRouterProvider. Does not execute prompts, chat, or store
 * conversation history.
 */
@Injectable()
export class OpenRouterConnectionTestService {
  private readonly timeoutMs: number;
  private readonly clock: OpenRouterTestClock;

  constructor(
    private readonly keys: OpenRouterKeyResolution,
    private readonly provider: OpenRouterProvider,
    private readonly cache: OpenRouterConnectivityCache,
    private readonly connectivityAudit: OpenRouterConnectivityAudit,
    @Optional() @Inject(OPENROUTER_TEST_TIMEOUT_MS) timeoutMs?: number,
    @Optional() @Inject(OPENROUTER_TEST_CLOCK) clock?: OpenRouterTestClock,
  ) {
    this.timeoutMs = timeoutMs ?? DEFAULT_OPENROUTER_TEST_TIMEOUT_MS;
    this.clock = clock ?? SYSTEM_OPENROUTER_TEST_CLOCK;
  }

  async perform(input: OpenRouterConnectionTestRequest): Promise<OpenRouterConnectionTestResult> {
    try {
      const resolved = await this.keys.resolve({
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        actorRole: input.actorRole,
        expectedVaultSecretId: input.vaultSecretId,
      });
      if (resolved === null) {
        return this.finish(input, 'VALIDATION_FAILED');
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const probe = await this.provider.probeConnectivity(resolved.apiKey, controller.signal);
        if (controller.signal.aborted) {
          return this.finish(input, 'HANDSHAKE_TIMEOUT');
        }
        return this.finish(input, mapProbeKind(probe));
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return this.finish(input, 'VALIDATION_FAILED');
    }
  }

  private async finish(
    input: OpenRouterConnectionTestRequest,
    outcome: OpenRouterConnectionTestOutcome,
  ): Promise<OpenRouterConnectionTestResult> {
    const vendorVisibleMessage = vendorVisibleMessageFor(outcome);
    this.cache.set(input.workspaceId, input.connectionId, {
      outcome: outcome === 'CONNECTED' ? 'succeeded' : 'failed',
      failureReason: failureReasonFor(outcome),
      vendorVisibleMessage,
      testedAt: new Date(this.clock.nowMs()).toISOString(),
    });
    await this.connectivityAudit
      .tested({
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        connectionId: input.connectionId,
        outcome,
      })
      .catch(() => undefined);
    return { outcome, vendorVisibleMessage };
  }
}

function mapProbeKind(
  kind: 'authenticated' | 'authentication_failed' | 'provider_unavailable' | 'timeout' | 'failed',
): OpenRouterConnectionTestOutcome {
  switch (kind) {
    case 'authenticated':
      return 'CONNECTED';
    case 'authentication_failed':
      return 'AUTHENTICATION_FAILED';
    case 'provider_unavailable':
      return 'PROVIDER_UNAVAILABLE';
    case 'timeout':
      return 'HANDSHAKE_TIMEOUT';
    case 'failed':
      return 'VALIDATION_FAILED';
  }
}

function failureReasonFor(
  outcome: OpenRouterConnectionTestOutcome,
): OpenRouterLastTestFailureReason | null {
  switch (outcome) {
    case 'CONNECTED':
      return null;
    case 'AUTHENTICATION_FAILED':
      return 'AUTHENTICATION_FAILED';
    case 'PROVIDER_UNAVAILABLE':
      return 'PROVIDER_UNAVAILABLE';
    case 'HANDSHAKE_TIMEOUT':
      return 'TIMEOUT';
    case 'VALIDATION_FAILED':
      return 'VALIDATION_FAILED';
  }
}
