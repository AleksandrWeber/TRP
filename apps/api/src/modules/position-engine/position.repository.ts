import type { Position } from './domain/position';
import type { PositionHistory } from './domain/position-history';
import type { PositionDomainEvent } from './position-events';

export const POSITION_REPOSITORY = Symbol('POSITION_ENGINE_REPOSITORY');

export interface PositionRepository {
  create(position: Position): Promise<Position>;

  save(position: Position): Promise<Position>;

  findById(positionId: string): Promise<Position | null>;

  listByPortfolioId(portfolioId: string): Promise<Position[]>;

  listOpenByPortfolioId(portfolioId: string): Promise<Position[]>;

  createHistory(entry: PositionHistory): Promise<PositionHistory>;

  listHistoryByPositionId(positionId: string): Promise<PositionHistory[]>;

  listHistoryByPortfolioId(portfolioId: string): Promise<PositionHistory[]>;

  appendEvent(event: PositionDomainEvent, eventId: string): Promise<void>;

  listEvents(positionId: string): Promise<PositionDomainEvent[]>;
}
