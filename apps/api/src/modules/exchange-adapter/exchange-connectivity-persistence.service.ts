import { Inject, Injectable } from '@nestjs/common';
import {
  buildAdapterLayerAnchorState,
  buildConnectionManagementAnchorState,
  type DurableExchangeConnectivityState,
  type ExchangeConnectivityPersistenceOutcome,
} from './domain/durable-exchange-connectivity-state';
import {
  EXCHANGE_CONNECTIVITY_STATE_REPOSITORY,
  type ExchangeConnectivityStateRepository,
} from './domain/exchange-connectivity-state.repository';

export type PersistConnectionManagementAnchorCommand = Readonly<{
  workspaceId: string;
  provider: string;
  connectionId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
}>;

export type PersistAdapterLayerAnchorCommand = Readonly<{
  workspaceId: string;
  provider: string;
  exchangeConnectionId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
}>;

/**
 * W4-E01-b — durable exchange connectivity persistence on Exchange Adapter owner.
 * Storage only — no REST/WebSocket I/O, restart recovery, or operational continuity.
 */
@Injectable()
export class ExchangeConnectivityPersistenceService {
  constructor(
    @Inject(EXCHANGE_CONNECTIVITY_STATE_REPOSITORY)
    private readonly repository: ExchangeConnectivityStateRepository,
  ) {}

  async loadState(workspaceId: string): Promise<DurableExchangeConnectivityState | null> {
    return this.repository.loadExchangeConnectivityState(workspaceId);
  }

  async persistConnectionManagementAnchor(
    command: PersistConnectionManagementAnchorCommand,
  ): Promise<ExchangeConnectivityPersistenceOutcome> {
    const prior = await this.loadState(command.workspaceId);
    const outcome = buildConnectionManagementAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveExchangeConnectivityState(outcome.state);
    return outcome;
  }

  async persistAdapterLayerAnchor(
    command: PersistAdapterLayerAnchorCommand,
  ): Promise<ExchangeConnectivityPersistenceOutcome> {
    const prior = await this.loadState(command.workspaceId);
    const outcome = buildAdapterLayerAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveExchangeConnectivityState(outcome.state);
    return outcome;
  }
}
