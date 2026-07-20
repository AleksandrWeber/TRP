import type { TradingSession } from './trading-session-aggregate';

/**
 * Persistence-agnostic contract for the US184 TradingSession aggregate.
 * Implementations belong to a later infrastructure story.
 */
export interface TradingSessionAggregateRepository {
  create(session: TradingSession): Promise<TradingSession>;
  findById(sessionId: string): Promise<TradingSession | null>;
  update(session: TradingSession): Promise<TradingSession>;
  delete(sessionId: string): Promise<void>;
}

export type TradingSessionRepository = TradingSessionAggregateRepository;
