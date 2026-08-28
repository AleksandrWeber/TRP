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
 * Storage only — no REST/WebSocket I/O, restart recovery, or operational continuity.
 */
@Injectable()
export class BybitExchangeConnectivityPersistenceService {
  constructor(
    @Inject(BYBIT_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY)
    private readonly repository: BybitExchangeConnectivityStateRepository,
  ) {}

  async loadState(workspaceId: string): Promise<DurableBybitExchangeConnectivityState | null> {
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
    return outcome;
  }
}
