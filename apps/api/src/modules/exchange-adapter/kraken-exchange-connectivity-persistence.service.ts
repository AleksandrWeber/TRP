import { Inject, Injectable } from '@nestjs/common';
import {
  buildKrakenAdapterLayerAnchorState,
  buildKrakenConnectionManagementAnchorState,
  type DurableKrakenExchangeConnectivityState,
  type KrakenExchangeConnectivityPersistenceOutcome,
} from './domain/durable-kraken-exchange-connectivity-state';
import {
  KRAKEN_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY,
  type KrakenExchangeConnectivityStateRepository,
} from './domain/kraken-exchange-connectivity-state.repository';
import { KrakenExchangeConnectivityRecoveryStore } from './kraken-exchange-connectivity-recovery-store';

export type PersistKrakenConnectionManagementAnchorCommand = Readonly<{
  workspaceId: string;
  connectionId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
  integrityMetadataHash?: string | null;
}>;

export type PersistKrakenAdapterLayerAnchorCommand = Readonly<{
  workspaceId: string;
  exchangeConnectionId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
  integrityMetadataHash?: string | null;
}>;

/**
 * W4-E04-b/c — durable Kraken exchange connectivity persistence on Exchange Adapter owner.
 * W4-E04-c — write-through to recovery store after hydrate.
 * Storage only — no REST/WebSocket I/O or operational continuity.
 */
@Injectable()
export class KrakenExchangeConnectivityPersistenceService {
  constructor(
    @Inject(KRAKEN_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY)
    private readonly repository: KrakenExchangeConnectivityStateRepository,
    @Inject(KrakenExchangeConnectivityRecoveryStore)
    private readonly recoveryStore: KrakenExchangeConnectivityRecoveryStore,
  ) {}

  async loadState(workspaceId: string): Promise<DurableKrakenExchangeConnectivityState | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId);
    }
    return this.repository.loadKrakenExchangeConnectivityState(workspaceId);
  }

  async persistConnectionManagementAnchor(
    command: PersistKrakenConnectionManagementAnchorCommand,
  ): Promise<KrakenExchangeConnectivityPersistenceOutcome> {
    const prior = await this.loadState(command.workspaceId);
    const outcome = buildKrakenConnectionManagementAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveKrakenExchangeConnectivityState(outcome.state);
    this.recoveryStore.set(outcome.state);
    return outcome;
  }

  async persistAdapterLayerAnchor(
    command: PersistKrakenAdapterLayerAnchorCommand,
  ): Promise<KrakenExchangeConnectivityPersistenceOutcome> {
    const prior = await this.loadState(command.workspaceId);
    const outcome = buildKrakenAdapterLayerAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveKrakenExchangeConnectivityState(outcome.state);
    this.recoveryStore.set(outcome.state);
    return outcome;
  }
}
