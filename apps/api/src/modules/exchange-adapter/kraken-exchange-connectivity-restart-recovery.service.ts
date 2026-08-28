import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableKrakenExchangeConnectivityState } from './domain/durable-kraken-exchange-connectivity-state';
import {
  buildKrakenExchangeConnectivityRecoveryDiagnostics,
  prepareKrakenExchangeConnectivityStatesForRecovery,
  type KrakenExchangeConnectivityRecoveryDiagnostics,
} from './domain/kraken-exchange-connectivity-restart-recovery';
import {
  KRAKEN_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY,
  type KrakenExchangeConnectivityStateRepository,
} from './domain/kraken-exchange-connectivity-state.repository';
import {
  recordKrakenExchangeConnectivityRecoveryFailure,
  recordKrakenExchangeConnectivityRecoveryStart,
  recordKrakenExchangeConnectivityRecoverySuccess,
} from './domain/kraken-exchange-connectivity-continuity-status';
import { KrakenExchangeConnectivityRecoveryStore } from './kraken-exchange-connectivity-recovery-store';

/**
 * W4-E04-c — deterministic restart recovery for durable Kraken exchange connectivity state.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish REST/WebSocket connections or synthesize Connected.
 */
@Injectable()
export class KrakenExchangeConnectivityRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(KRAKEN_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY)
    private readonly repository: KrakenExchangeConnectivityStateRepository,
    @Inject(KrakenExchangeConnectivityRecoveryStore)
    private readonly recoveryStore: KrakenExchangeConnectivityRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<KrakenExchangeConnectivityRecoveryDiagnostics> {
    recordKrakenExchangeConnectivityRecoveryStart();
    try {
      const persisted = await this.repository.listAllKrakenExchangeConnectivityStates();
      const recovered = prepareKrakenExchangeConnectivityStatesForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildKrakenExchangeConnectivityRecoveryDiagnostics(recovered);
      recordKrakenExchangeConnectivityRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordKrakenExchangeConnectivityRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredState(workspaceId: string): DurableKrakenExchangeConnectivityState | null {
    return this.recoveryStore.get(workspaceId);
  }

  getRecoveryDiagnostics(): KrakenExchangeConnectivityRecoveryDiagnostics {
    return buildKrakenExchangeConnectivityRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
