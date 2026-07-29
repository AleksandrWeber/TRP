import type { Order } from '../domain/order';
import type { ProposeOrderFromSignalIntentCommand } from '../domain/propose-from-signal-intent';

/**
 * Internal Orders intake port for Signal Intent → Order proposal (US221).
 * Not an HTTP surface. Callers must not invoke Strategy Runtime evaluation.
 */
export const ORDER_PROPOSAL_PORT = Symbol('ORDER_PROPOSAL_PORT');

export interface OrderProposalPort {
  proposeOrderFromSignalIntent(command: ProposeOrderFromSignalIntentCommand): Promise<Order | null>;
}
