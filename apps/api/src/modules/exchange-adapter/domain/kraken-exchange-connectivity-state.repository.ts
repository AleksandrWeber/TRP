import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableKrakenExchangeConnectivityState } from './durable-kraken-exchange-connectivity-state';

/**
 * Persistence port for durable Kraken exchange connectivity state (W4-E04-b).
 * Implementations belong to exchange-adapter infrastructure.
 */
export interface KrakenExchangeConnectivityStateRepository {
  saveKrakenExchangeConnectivityState(
    state: DurableKrakenExchangeConnectivityState,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadKrakenExchangeConnectivityState(
    workspaceId: string,
  ): Promise<DurableKrakenExchangeConnectivityState | null>;

  /** Deterministic load for future restart recovery (W4-E04-c). */
  listAllKrakenExchangeConnectivityStates(): Promise<
    readonly DurableKrakenExchangeConnectivityState[]
  >;
}

export const KRAKEN_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY = Symbol(
  'KRAKEN_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY',
);
