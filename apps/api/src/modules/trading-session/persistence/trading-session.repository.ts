import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { TradingSession } from '../domain/trading-session';
import type { TradingSessionStatus } from '../domain/trading-session-status';

export const TRADING_SESSION_REPOSITORY = Symbol('TRADING_SESSION_REPOSITORY');

export interface TradingSessionRepository {
  create(session: TradingSession, transaction: TransactionContext): Promise<TradingSession>;

  save(session: TradingSession, transaction: TransactionContext): Promise<TradingSession>;

  /**
   * Optimistic CAS save (US241). Updates only when durable `version` equals
   * `expectedVersion`. Returns the session on success, or `null` on conflict.
   */
  saveIfVersion(
    session: TradingSession,
    expectedVersion: number,
    transaction: TransactionContext,
  ): Promise<TradingSession | null>;

  findById(workspaceId: string, sessionId: string): Promise<TradingSession | null>;

  findByIdempotencyKey(workspaceId: string, idempotencyKey: string): Promise<TradingSession | null>;

  /**
   * Process-wide Session lookup by status set (US240 startup discovery).
   * Results are ordered by createdAt ASC, id ASC for deterministic selection.
   */
  findByStatuses(statuses: readonly TradingSessionStatus[]): Promise<TradingSession[]>;
}
