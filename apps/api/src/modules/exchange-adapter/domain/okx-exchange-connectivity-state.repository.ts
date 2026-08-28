import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableOkxExchangeConnectivityState } from './durable-okx-exchange-connectivity-state';

/**
 * Persistence port for durable OKX exchange connectivity state (W4-E03-b).
 * Implementations belong to exchange-adapter infrastructure.
 */
export interface OkxExchangeConnectivityStateRepository {
  saveOkxExchangeConnectivityState(
    state: DurableOkxExchangeConnectivityState,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadOkxExchangeConnectivityState(
    workspaceId: string,
  ): Promise<DurableOkxExchangeConnectivityState | null>;

  /** Deterministic load for future restart recovery (W4-E03-c). */
  listAllOkxExchangeConnectivityStates(): Promise<readonly DurableOkxExchangeConnectivityState[]>;
}

export const OKX_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY = Symbol(
  'OKX_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY',
);
