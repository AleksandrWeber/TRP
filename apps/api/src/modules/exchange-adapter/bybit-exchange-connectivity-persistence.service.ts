import { Inject, Injectable } from '@nestjs/common';
import {
  buildBybitAdapterLayerAnchorState,
  buildBybitConnectionManagementAnchorState,
  type DurableBybitExchangeConnectivityState,
  type BybitExchangeConnectivityPersistenceOutcome,
} from './domain/durable-bybit-exchange-connectivity-state';
import {
  BYBIT_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY,
  type BybitExchangeConnectivityStateRepository,
} from './domain/bybit-exchange-connectivity-state.repository';
import { BybitExchangeConnectivityRecoveryStore } from './bybit-exchange-connectivity-recovery-store';

export type PersistBybitConnectionManagementAnchorCommand = Readonly<{
  workspaceId: string;
  connectionId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
  integrityMetadataHash?: string | null;
}>;

export type PersistBybitAdapterLayerAnchorCommand = Readonly<{
  workspaceId: string;
  exchangeConnectionId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
  integrityMetadataHash?: string | null;
}>;

/**
 * W4-E02-b — durable Bybit exchange connectivity persistence on Exchange Adapter owner.
 * W4-E02-c — write-through to recovery store after hydrate.
 * Storage only — no REST/WebSocket I/O or operational continuity.
 */
@Injectable()
export class BybitExchangeConnectivityPersistenceService {
  constructor(
    @Inject(BYBIT_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY)
    private readonly repository: BybitExchangeConnectivityStateRepository,
    @Inject(BybitExchangeConnectivityRecoveryStore)
    private readonly recoveryStore: BybitExchangeConnectivityRecoveryStore,
  ) {}

  async loadState(workspaceId: string): Promise<DurableBybitExchangeConnectivityState | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId);
    }
    return this.repository.loadBybitExchangeConnectivityState(workspaceId);
  }

  async persistConnectionManagementAnchor(
    command: PersistBybitConnectionManagementAnchorCommand,
  ): Promise<BybitExchangeConnectivityPersistenceOutcome> {
    const prior = await this.loadState(command.workspaceId);
    const outcome = buildBybitConnectionManagementAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveBybitExchangeConnectivityState(outcome.state);
    this.recoveryStore.set(outcome.state);
    return outcome;
  }

  async persistAdapterLayerAnchor(
    command: PersistBybitAdapterLayerAnchorCommand,
  ): Promise<BybitExchangeConnectivityPersistenceOutcome> {
    const prior = await this.loadState(command.workspaceId);
    const outcome = buildBybitAdapterLayerAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveBybitExchangeConnectivityState(outcome.state);
    this.recoveryStore.set(outcome.state);
    return outcome;
  }
}
