import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableBybitExchangeConnectivityState } from './domain/durable-bybit-exchange-connectivity-state';
import {
  buildBybitExchangeConnectivityRecoveryDiagnostics,
  prepareBybitExchangeConnectivityStatesForRecovery,
  type BybitExchangeConnectivityRecoveryDiagnostics,
} from './domain/bybit-exchange-connectivity-restart-recovery';
import {
  BYBIT_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY,
  type BybitExchangeConnectivityStateRepository,
} from './domain/bybit-exchange-connectivity-state.repository';
import { BybitExchangeConnectivityRecoveryStore } from './bybit-exchange-connectivity-recovery-store';

/**
 * W4-E02-c — deterministic restart recovery for durable Bybit exchange connectivity state.
 * Hydrates in-memory runtime cache from persistence on module init.
 * Does not establish REST/WebSocket connections or synthesize Connected.
 */
@Injectable()
export class BybitExchangeConnectivityRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(BYBIT_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY)
    private readonly repository: BybitExchangeConnectivityStateRepository,
    @Inject(BybitExchangeConnectivityRecoveryStore)
    private readonly recoveryStore: BybitExchangeConnectivityRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<BybitExchangeConnectivityRecoveryDiagnostics> {
    const persisted = await this.repository.listAllBybitExchangeConnectivityStates();
    const recovered = prepareBybitExchangeConnectivityStatesForRecovery(persisted);
    this.recoveryStore.replaceAll(recovered);
    return buildBybitExchangeConnectivityRecoveryDiagnostics(recovered);
  }

  getRecoveredState(workspaceId: string): DurableBybitExchangeConnectivityState | null {
    return this.recoveryStore.get(workspaceId);
  }

  getRecoveryDiagnostics(): BybitExchangeConnectivityRecoveryDiagnostics {
    return buildBybitExchangeConnectivityRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
