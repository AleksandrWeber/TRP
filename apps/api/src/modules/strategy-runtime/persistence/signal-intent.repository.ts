import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { SignalIntent } from '../domain/signal-intent';

export const SIGNAL_INTENT_REPOSITORY = Symbol('SIGNAL_INTENT_REPOSITORY');

/**
 * Append-only Signal Intent persistence port (US214).
 * Unique semantic identity (workspace + intentHash) enforces dedupe.
 */
export interface SignalIntentRepository {
  append(intent: SignalIntent, transaction: TransactionContext): Promise<SignalIntent>;

  findById(workspaceId: string, intentId: string): Promise<SignalIntent | null>;

  findByIntentHash(
    workspaceId: string,
    intentHash: string,
    transaction?: TransactionContext,
  ): Promise<SignalIntent | null>;

  listBySession(workspaceId: string, sessionId: string): Promise<SignalIntent[]>;
}
