import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createPositionHistory, type PositionHistory } from './domain/position-history';
import type { PositionHistoryAction } from './domain/position-history-action';
import { POSITION_REPOSITORY, type PositionRepository } from './position.repository';

export type RecordPositionHistoryInput = Readonly<{
  positionId: string;
  timestamp: string;
  action: PositionHistoryAction;
  quantity: string;
  price: string;
  realizedPnL: string;
}>;

/**
 * Appends immutable position history entries (US205).
 */
@Injectable()
export class PositionHistoryService {
  constructor(@Inject(POSITION_REPOSITORY) private readonly repository: PositionRepository) {}

  async record(input: RecordPositionHistoryInput): Promise<PositionHistory> {
    const entry = createPositionHistory({
      id: randomUUID(),
      positionId: input.positionId,
      timestamp: input.timestamp,
      action: input.action,
      quantity: input.quantity,
      price: input.price,
      realizedPnL: input.realizedPnL,
    });
    return this.repository.createHistory(entry);
  }

  async listByPositionId(positionId: string): Promise<PositionHistory[]> {
    return this.repository.listHistoryByPositionId(positionId);
  }

  async listByPortfolioId(portfolioId: string): Promise<PositionHistory[]> {
    return this.repository.listHistoryByPortfolioId(portfolioId);
  }
}
