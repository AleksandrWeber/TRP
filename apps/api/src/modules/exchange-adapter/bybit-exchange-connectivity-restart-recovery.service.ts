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
import {
  recordBybitExchangeConnectivityRecoveryFailure,
  recordBybitExchangeConnectivityRecoveryStart,
  recordBybitExchangeConnectivityRecoverySuccess,
} from './domain/bybit-exchange-connectivity-continuity-status';
import { BybitExchangeConnectivityRecoveryStore } from './bybit-exchange-connectivity-recovery-store';

/**
 * W4-E02-c/d — deterministic restart recovery for durable Bybit exchange connectivity state.
 * Hydrates in-memory runtime cache from persistence and records continuity outcomes (W4-E02-d).
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
    recordBybitExchangeConnectivityRecoveryStart();
    try {
      const persisted = await this.repository.listAllBybitExchangeConnectivityStates();
      const recovered = prepareBybitExchangeConnectivityStatesForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildBybitExchangeConnectivityRecoveryDiagnostics(recovered);
      recordBybitExchangeConnectivityRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordBybitExchangeConnectivityRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredState(workspaceId: string): DurableBybitExchangeConnectivityState | null {
    return this.recoveryStore.get(workspaceId);
  }

  getRecoveryDiagnostics(): BybitExchangeConnectivityRecoveryDiagnostics {
    return buildBybitExchangeConnectivityRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
