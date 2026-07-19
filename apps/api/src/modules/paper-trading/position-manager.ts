import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { SignalResult } from '../signal-engine';
import { createPaperPosition } from './domain/paper-position';
import { createTradeResult, type TradeResult } from './domain/trade-result';
import { PnLCalculator } from './pnl-calculator';
import { PositionRegistry } from './position-registry';
import { TradeHistory } from './trade-history';

/**
 * Applies SignalResult decisions to long-only paper positions (US010).
 * BUY opens one LONG when none exists; SELL closes the strategy's open LONG;
 * HOLD, duplicate BUY, and SELL without a position are ignored.
 */
@Injectable()
export class PositionManager {
  constructor(
    @Inject(PositionRegistry) private readonly positions: PositionRegistry,
    @Inject(TradeHistory) private readonly history: TradeHistory,
    @Inject(PnLCalculator) private readonly pnl: PnLCalculator,
  ) {}

  execute(
    workspaceId: string,
    signal: SignalResult,
    executionPrice: number,
    quantity: number,
  ): TradeResult {
    const open = this.positions.getOpenByStrategy(workspaceId, signal.strategyId);
    const timestamp = new Date().toISOString();

    if (signal.signal === 'BUY' && !open) {
      const position = this.positions.add(
        workspaceId,
        createPaperPosition({
          id: randomUUID(),
          strategyId: signal.strategyId,
          symbol: signal.symbol,
          side: 'LONG',
          quantity,
          entryPrice: executionPrice,
          entryTime: timestamp,
          status: 'OPEN',
        }),
      );
      return this.history.record(
        workspaceId,
        createTradeResult({
          positionId: position.id,
          action: 'OPEN_LONG',
          price: executionPrice,
          quantity,
          realizedPnL: 0,
          timestamp,
        }),
      );
    }

    if (signal.signal === 'SELL' && open) {
      this.positions.close(workspaceId, open.id);
      return this.history.record(
        workspaceId,
        createTradeResult({
          positionId: open.id,
          action: 'CLOSE_LONG',
          price: executionPrice,
          quantity: open.quantity,
          realizedPnL: this.pnl.realized(open.entryPrice, executionPrice, open.quantity),
          timestamp,
        }),
      );
    }

    return createTradeResult({
      positionId: null,
      action: 'IGNORED',
      price: executionPrice,
      quantity: 0,
      realizedPnL: 0,
      timestamp,
    });
  }
}
