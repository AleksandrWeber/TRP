import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Role } from '../identity/role';
import { SecretVaultService } from '../secret-vault';
import { ExchangeHandshakeAudit } from './exchange-handshake.audit';
import { mapHandshakeAdapterKind } from './exchange-handshake.errors';
import type {
  ExchangeHandshakeOutcome,
  ExchangeHandshakeResult,
} from './exchange-handshake.result';
import {
  DEFAULT_HANDSHAKE_TIMEOUT_MS,
  HANDSHAKE_CLOCK,
  HANDSHAKE_TIMEOUT_MS,
  SYSTEM_HANDSHAKE_CLOCK,
  type HandshakeClock,
} from './exchange-handshake.tokens';
import { vaultSecretTypeForExchangeProvider } from './exchange-handshake.vault';
import {
  EXCHANGE_PROVIDER_ADAPTERS,
  type ExchangeProviderAdapter,
} from './exchange-provider-adapter';

export type ExchangeHandshakeRequest = Readonly<{
  workspaceId: string;
  actorUserId: string;
  actorRole: Role;
  connectionId: string;
  provider: string;
  vaultSecretId: string;
}>;

/**
 * Exchange Connectivity handshake service (W2-S02-b).
 *
 * Retrieves credentials from Vault, delegates provider-specific signing to an
 * adapter, and returns an operator-safe outcome. Connection Management never
 * receives plaintext secrets on this path.
 */
@Injectable()
export class ExchangeHandshakeService {
  private readonly adapters: ReadonlyMap<string, ExchangeProviderAdapter>;
  private readonly timeoutMs: number;
  private readonly clock: HandshakeClock;

  constructor(
    private readonly vault: SecretVaultService,
    private readonly handshakeAudit: ExchangeHandshakeAudit,
    @Inject(EXCHANGE_PROVIDER_ADAPTERS)
    adapters: readonly ExchangeProviderAdapter[],
    @Optional() @Inject(HANDSHAKE_TIMEOUT_MS) timeoutMs?: number,
    @Optional() @Inject(HANDSHAKE_CLOCK) clock?: HandshakeClock,
  ) {
    this.adapters = new Map(adapters.map((adapter) => [adapter.providerId, adapter]));
    this.timeoutMs = timeoutMs ?? DEFAULT_HANDSHAKE_TIMEOUT_MS;
    this.clock = clock ?? SYSTEM_HANDSHAKE_CLOCK;
  }

  async perform(input: ExchangeHandshakeRequest): Promise<ExchangeHandshakeResult> {
    await this.handshakeAudit.record({
      outcome: 'handshake_started',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: input.connectionId,
      provider: input.provider,
    });

    try {
      const outcome = await this.execute(input);
      if (outcome === 'CONNECTED') {
        await this.handshakeAudit.record({
          outcome: 'handshake_succeeded',
          workspaceId: input.workspaceId,
          actorUserId: input.actorUserId,
          connectionId: input.connectionId,
          provider: input.provider,
        });
      } else {
        await this.handshakeAudit.record({
          outcome: 'handshake_failed',
          workspaceId: input.workspaceId,
          actorUserId: input.actorUserId,
          connectionId: input.connectionId,
          provider: input.provider,
          failure: outcome,
        });
      }
      return { outcome };
    } catch {
      await this.handshakeAudit
        .record({
          outcome: 'handshake_failed',
          workspaceId: input.workspaceId,
          actorUserId: input.actorUserId,
          connectionId: input.connectionId,
          provider: input.provider,
          failure: 'VALIDATION_FAILED',
        })
        .catch(() => undefined);
      return { outcome: 'VALIDATION_FAILED' };
    }
  }

  private async execute(input: ExchangeHandshakeRequest): Promise<ExchangeHandshakeOutcome> {
    const type = vaultSecretTypeForExchangeProvider(input.provider);
    if (type === null) {
      return 'VALIDATION_FAILED';
    }

    const adapter = this.adapters.get(input.provider);
    if (!adapter || !adapter.implemented) {
      return 'VALIDATION_FAILED';
    }

    const metadata = await this.vault.get({
      actorWorkspaceId: input.actorUserId,
      actorRole: input.actorRole,
      workspaceId: input.workspaceId,
      type,
    });
    if (metadata?.id !== input.vaultSecretId) {
      return 'VALIDATION_FAILED';
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
      const adapterResult = await adapter.handshake({
        credentials,
        nowMs: this.clock.nowMs(),
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        return 'HANDSHAKE_TIMEOUT';
      }
      return mapHandshakeAdapterKind(adapterResult.kind);
    } finally {
      clearTimeout(timer);
    }
  }
}
