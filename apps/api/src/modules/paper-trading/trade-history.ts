import { Injectable } from '@nestjs/common';
import { createTradeResult, type TradeResult } from './domain/trade-result';

/**
 * In-memory history of executed paper trades (US010).
 * IGNORED requests are intentionally not recorded because no trade occurred.
 */
@Injectable()
export class TradeHistory {
  private readonly resultsByWorkspace = new Map<string, TradeResult[]>();

  record(workspaceId: string, result: TradeResult): TradeResult {
    if (result.action === 'IGNORED') {
      throw new Error('Ignored paper-trading decisions are not trade history');
    }
    const stored = createTradeResult(result);
    const history = this.resultsByWorkspace.get(workspaceId) ?? [];
    history.push(stored);
    this.resultsByWorkspace.set(workspaceId, history);
    return stored;
  }

  list(workspaceId: string): ReadonlyArray<TradeResult> {
    return Object.freeze([...(this.resultsByWorkspace.get(workspaceId) ?? [])]);
  }

  clear(): void {
    this.resultsByWorkspace.clear();
  }
}
