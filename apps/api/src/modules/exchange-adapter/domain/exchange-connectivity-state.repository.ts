import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableExchangeConnectivityState } from './durable-exchange-connectivity-state';

/**
 * Persistence port for durable exchange connectivity state (W4-E01-b).
 * Implementations belong to exchange-adapter infrastructure.
 */
export interface ExchangeConnectivityStateRepository {
  saveExchangeConnectivityState(
    state: DurableExchangeConnectivityState,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadExchangeConnectivityState(
    workspaceId: string,
  ): Promise<DurableExchangeConnectivityState | null>;

  /** Deterministic load for future restart recovery (W4-E01-c). */
  listAllExchangeConnectivityStates(): Promise<readonly DurableExchangeConnectivityState[]>;
}

export const EXCHANGE_CONNECTIVITY_STATE_REPOSITORY = Symbol(
  'EXCHANGE_CONNECTIVITY_STATE_REPOSITORY',
);
