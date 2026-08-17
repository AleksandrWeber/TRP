import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Role } from '../identity/role';
import { SecretVaultService } from '../secret-vault';
import { lookupExchangeProvider } from './exchange-provider-registry';
import {
  EXCHANGE_CAPABILITY_ADAPTERS,
  type ExchangeCapabilityAdapter,
  type ExchangeCapabilityAdapterResult,
} from './exchange-capability.adapter';
import { ExchangeCapabilityAudit } from './exchange-capability.audit';
import { ExchangeCapabilityCache } from './exchange-capability.cache';
import {
  mapProviderCapabilities,
  type ExchangeCapabilityEvidence,
  type ExchangeCapabilityVerificationOutcome,
} from './exchange-capability.mapping';
import {
  projectExchangeCapabilities,
  type ExchangeCapabilityView,
} from './exchange-capability.projection';
import { canUseVerifiedCapability } from './exchange-capability';
import { vaultSecretTypeForExchangeProvider } from './exchange-handshake.vault';
import {
  DEFAULT_HANDSHAKE_TIMEOUT_MS,
  HANDSHAKE_CLOCK,
  HANDSHAKE_TIMEOUT_MS,
  SYSTEM_HANDSHAKE_CLOCK,
  type HandshakeClock,
} from './exchange-handshake.tokens';

export type ExchangeCapabilityVerificationRequest = Readonly<{
  workspaceId: string;
  actorUserId: string;
  actorRole: Role;
  connectionId: string;
  provider: string;
  vaultSecretId: string;
  handshakeSucceeded: boolean;
}>;

/**
 * Exchange Connectivity capability verification (W2-S02-d).
 *
 * Runs only after authenticated handshake succeeded. Verification failures do
 * not invalidate the session. Verified capabilities are never used.
 */
@Injectable()
export class ExchangeCapabilityService {
  private readonly adapters: ReadonlyMap<string, ExchangeCapabilityAdapter>;
  private readonly timeoutMs: number;
  private readonly clock: HandshakeClock;

  constructor(
    private readonly vault: SecretVaultService,
    private readonly capabilityAudit: ExchangeCapabilityAudit,
    private readonly cache: ExchangeCapabilityCache,
    @Inject(EXCHANGE_CAPABILITY_ADAPTERS)
    adapters: readonly ExchangeCapabilityAdapter[],
    @Optional() @Inject(HANDSHAKE_TIMEOUT_MS) timeoutMs?: number,
    @Optional() @Inject(HANDSHAKE_CLOCK) clock?: HandshakeClock,
  ) {
    this.adapters = new Map(adapters.map((adapter) => [adapter.providerId, adapter]));
    this.timeoutMs = timeoutMs ?? DEFAULT_HANDSHAKE_TIMEOUT_MS;
    this.clock = clock ?? SYSTEM_HANDSHAKE_CLOCK;
  }

  projection(
    workspaceId: string,
    connectionId: string,
    connectionType: string,
    status: string,
  ): ExchangeCapabilityView | null {
    return projectExchangeCapabilities(
      connectionType,
      status,
      this.cache.get(workspaceId, connectionId),
    );
  }

  clear(workspaceId: string, connectionId: string): void {
    this.cache.clear(workspaceId, connectionId);
  }

  capabilityUseEnabled(): false {
    return canUseVerifiedCapability();
  }

  async verify(
    input: ExchangeCapabilityVerificationRequest,
  ): Promise<ExchangeCapabilityView | null> {
    if (!input.handshakeSucceeded) {
      return null;
    }

    await this.capabilityAudit.record({
      outcome: 'capability_verification_started',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: input.connectionId,
      provider: input.provider,
    });

    try {
      const result = await this.execute(input);
      const view = this.projectResult(input.provider, result, this.clock.nowMs());
      this.cache.set(input.workspaceId, input.connectionId, view);
      await this.capabilityAudit.record({
        outcome: view.verificationFailed
          ? 'capability_verification_failed'
          : 'capability_verification_completed',
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        connectionId: input.connectionId,
        provider: input.provider,
      });
      return view;
    } catch {
      const view = this.projectResult(input.provider, { kind: 'failed' }, this.clock.nowMs());
      this.cache.set(input.workspaceId, input.connectionId, view);
      await this.capabilityAudit
        .record({
          outcome: 'capability_verification_failed',
          workspaceId: input.workspaceId,
          actorUserId: input.actorUserId,
          connectionId: input.connectionId,
          provider: input.provider,
        })
        .catch(() => undefined);
      return view;
    }
  }

  private async execute(
    input: ExchangeCapabilityVerificationRequest,
  ): Promise<ExchangeCapabilityAdapterResult> {
    const type = vaultSecretTypeForExchangeProvider(input.provider);
    if (type === null) {
      return { kind: 'failed' };
    }

    const adapter = this.adapters.get(input.provider);
    if (!adapter || !adapter.implemented) {
      return { kind: 'not_implemented' };
    }

    const metadata = await this.vault.get({
      actorWorkspaceId: input.actorUserId,
      actorRole: input.actorRole,
      workspaceId: input.workspaceId,
      type,
    });
    if (metadata?.id !== input.vaultSecretId) {
      return { kind: 'failed' };
    }

    const credentials = await this.vault.retrieve({
      actorWorkspaceId: input.actorUserId,
      actorRole: input.actorRole,
      workspaceId: input.workspaceId,
      type,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const adapterResult = await adapter.verify({
        credentials,
        nowMs: this.clock.nowMs(),
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        return { kind: 'failed' };
      }
      return adapterResult;
    } finally {
      clearTimeout(timer);
    }
  }

  private projectResult(
    provider: string,
    result: ExchangeCapabilityAdapterResult,
    nowMs: number,
  ): ExchangeCapabilityView {
    const catalog = lookupExchangeProvider(provider);
    const outcome = verificationOutcome(result.kind);
    const evidence: ExchangeCapabilityEvidence = {
      restObserved: true,
      ...(result.evidence ?? {}),
    };
    const capabilities = mapProviderCapabilities({
      catalogCapabilities: catalog?.capabilities ?? [],
      evidence,
      outcome,
    });
    return {
      capabilities,
      verifiedAt: new Date(nowMs).toISOString(),
      verificationFailed: outcome === 'failed' || outcome === 'provider_unavailable',
    };
  }
}

function verificationOutcome(
  kind: ExchangeCapabilityAdapterResult['kind'],
): ExchangeCapabilityVerificationOutcome {
  switch (kind) {
    case 'verified':
      return 'completed';
    case 'provider_unavailable':
      return 'provider_unavailable';
    case 'not_implemented':
      return 'not_attempted';
    case 'failed':
      return 'failed';
  }
}
