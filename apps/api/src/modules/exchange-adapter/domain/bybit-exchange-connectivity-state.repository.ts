import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableBybitExchangeConnectivityState } from './durable-bybit-exchange-connectivity-state';

/**
 * Persistence port for durable Bybit exchange connectivity state (W4-E02-b).
 * Implementations belong to exchange-adapter infrastructure.
 */
export interface BybitExchangeConnectivityStateRepository {
  saveBybitExchangeConnectivityState(
    state: DurableBybitExchangeConnectivityState,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadBybitExchangeConnectivityState(
    workspaceId: string,
  ): Promise<DurableBybitExchangeConnectivityState | null>;

  /** Deterministic load for future restart recovery (W4-E02-c). */
  listAllBybitExchangeConnectivityStates(): Promise<
    readonly DurableBybitExchangeConnectivityState[]
  >;
}

export const BYBIT_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY = Symbol(
  'BYBIT_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY',
);
