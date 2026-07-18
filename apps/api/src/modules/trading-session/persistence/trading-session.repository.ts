import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { TradingSession } from '../domain/trading-session';

export const TRADING_SESSION_REPOSITORY = Symbol('TRADING_SESSION_REPOSITORY');

export interface TradingSessionRepository {
  create(session: TradingSession, transaction: TransactionContext): Promise<TradingSession>;

  save(session: TradingSession, transaction: TransactionContext): Promise<TradingSession>;

  findById(workspaceId: string, sessionId: string): Promise<TradingSession | null>;

  findByIdempotencyKey(workspaceId: string, idempotencyKey: string): Promise<TradingSession | null>;
}
