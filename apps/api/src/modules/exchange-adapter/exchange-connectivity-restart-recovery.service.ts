import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableExchangeConnectivityState } from './domain/durable-exchange-connectivity-state';
import {
  buildExchangeConnectivityRecoveryDiagnostics,
  prepareExchangeConnectivityStatesForRecovery,
  type ExchangeConnectivityRecoveryDiagnostics,
} from './domain/exchange-connectivity-restart-recovery';
import {
  EXCHANGE_CONNECTIVITY_STATE_REPOSITORY,
  type ExchangeConnectivityStateRepository,
} from './domain/exchange-connectivity-state.repository';
import { ExchangeConnectivityRecoveryStore } from './exchange-connectivity-recovery-store';

/**
 * W4-E01-c — deterministic restart recovery for durable exchange connectivity state.
 * Hydrates in-memory runtime cache from persistence. Not operational continuity.
 * Does not establish REST/WebSocket connections or synthesize Connected.
 */
@Injectable()
export class ExchangeConnectivityRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(EXCHANGE_CONNECTIVITY_STATE_REPOSITORY)
    private readonly repository: ExchangeConnectivityStateRepository,
    @Inject(ExchangeConnectivityRecoveryStore)
    private readonly recoveryStore: ExchangeConnectivityRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<ExchangeConnectivityRecoveryDiagnostics> {
    const persisted = await this.repository.listAllExchangeConnectivityStates();
    const recovered = prepareExchangeConnectivityStatesForRecovery(persisted);
    this.recoveryStore.replaceAll(recovered);
    return buildExchangeConnectivityRecoveryDiagnostics(recovered);
  }

  getRecoveredState(workspaceId: string): DurableExchangeConnectivityState | null {
    return this.recoveryStore.get(workspaceId);
  }

  getRecoveryDiagnostics(): ExchangeConnectivityRecoveryDiagnostics {
    return buildExchangeConnectivityRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
