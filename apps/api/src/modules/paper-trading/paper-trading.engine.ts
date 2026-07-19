import { Inject, Injectable } from '@nestjs/common';
import type { SignalResult } from '../signal-engine';
import type { TradeResult } from './domain/trade-result';
import { PositionManager } from './position-manager';

/**
 * Pure paper-execution boundary (US010).
 * It consumes a SignalResult plus an already-resolved cached execution price;
 * it has no market-provider, exchange, API-key, or order-execution dependency.
 */
@Injectable()
export class PaperTradingEngine {
  constructor(@Inject(PositionManager) private readonly positions: PositionManager) {}

  execute(
    workspaceId: string,
    signal: SignalResult,
    executionPrice: number,
    quantity: number,
  ): TradeResult {
    return this.positions.execute(workspaceId, signal, executionPrice, quantity);
  }
}
