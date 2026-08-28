import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableOkxExchangeConnectivityState } from './domain/durable-okx-exchange-connectivity-state';
import {
  buildOkxExchangeConnectivityRecoveryDiagnostics,
  prepareOkxExchangeConnectivityStatesForRecovery,
  type OkxExchangeConnectivityRecoveryDiagnostics,
} from './domain/okx-exchange-connectivity-restart-recovery';
import {
  OKX_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY,
  type OkxExchangeConnectivityStateRepository,
} from './domain/okx-exchange-connectivity-state.repository';
import {
  recordOkxExchangeConnectivityRecoveryFailure,
  recordOkxExchangeConnectivityRecoveryStart,
  recordOkxExchangeConnectivityRecoverySuccess,
} from './domain/okx-exchange-connectivity-continuity-status';
import { OkxExchangeConnectivityRecoveryStore } from './okx-exchange-connectivity-recovery-store';

/**
 * W4-E03-c — deterministic restart recovery for durable OKX exchange connectivity state.
 * Hydrates in-memory recovery cache from persistence on module init.
 * Does not establish REST/WebSocket connections or synthesize Connected.
 */
@Injectable()
export class OkxExchangeConnectivityRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(OKX_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY)
    private readonly repository: OkxExchangeConnectivityStateRepository,
    @Inject(OkxExchangeConnectivityRecoveryStore)
    private readonly recoveryStore: OkxExchangeConnectivityRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<OkxExchangeConnectivityRecoveryDiagnostics> {
    recordOkxExchangeConnectivityRecoveryStart();
    try {
      const persisted = await this.repository.listAllOkxExchangeConnectivityStates();
      const recovered = prepareOkxExchangeConnectivityStatesForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildOkxExchangeConnectivityRecoveryDiagnostics(recovered);
      recordOkxExchangeConnectivityRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordOkxExchangeConnectivityRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredState(workspaceId: string): DurableOkxExchangeConnectivityState | null {
    return this.recoveryStore.get(workspaceId);
  }

  getRecoveryDiagnostics(): OkxExchangeConnectivityRecoveryDiagnostics {
    return buildOkxExchangeConnectivityRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
