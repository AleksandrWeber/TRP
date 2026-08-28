import { Inject, Injectable } from '@nestjs/common';
import {
  buildOkxAdapterLayerAnchorState,
  buildOkxConnectionManagementAnchorState,
  type DurableOkxExchangeConnectivityState,
  type OkxExchangeConnectivityPersistenceOutcome,
} from './domain/durable-okx-exchange-connectivity-state';
import {
  OKX_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY,
  type OkxExchangeConnectivityStateRepository,
} from './domain/okx-exchange-connectivity-state.repository';
import { OkxExchangeConnectivityRecoveryStore } from './okx-exchange-connectivity-recovery-store';

export type PersistOkxConnectionManagementAnchorCommand = Readonly<{
  workspaceId: string;
  connectionId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
  integrityMetadataHash?: string | null;
}>;

export type PersistOkxAdapterLayerAnchorCommand = Readonly<{
  workspaceId: string;
  exchangeConnectionId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
  integrityMetadataHash?: string | null;
}>;

/**
 * W4-E03-b/c — durable OKX exchange connectivity persistence on Exchange Adapter owner.
 * W4-E03-c — write-through to recovery store after hydrate.
 * Storage only — no REST/WebSocket I/O or operational continuity.
 */
@Injectable()
export class OkxExchangeConnectivityPersistenceService {
  constructor(
    @Inject(OKX_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY)
    private readonly repository: OkxExchangeConnectivityStateRepository,
    @Inject(OkxExchangeConnectivityRecoveryStore)
    private readonly recoveryStore: OkxExchangeConnectivityRecoveryStore,
  ) {}

  async loadState(workspaceId: string): Promise<DurableOkxExchangeConnectivityState | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId);
    }
    return this.repository.loadOkxExchangeConnectivityState(workspaceId);
  }

  async persistConnectionManagementAnchor(
    command: PersistOkxConnectionManagementAnchorCommand,
  ): Promise<OkxExchangeConnectivityPersistenceOutcome> {
    const prior = await this.loadState(command.workspaceId);
    const outcome = buildOkxConnectionManagementAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveOkxExchangeConnectivityState(outcome.state);
    this.recoveryStore.set(outcome.state);
    return outcome;
  }

  async persistAdapterLayerAnchor(
    command: PersistOkxAdapterLayerAnchorCommand,
  ): Promise<OkxExchangeConnectivityPersistenceOutcome> {
    const prior = await this.loadState(command.workspaceId);
    const outcome = buildOkxAdapterLayerAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveOkxExchangeConnectivityState(outcome.state);
    this.recoveryStore.set(outcome.state);
    return outcome;
  }
}
