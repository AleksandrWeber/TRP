import type { TradeSide } from './trade-side';

/**
 * Input for TradeEngine.openTrade (US121).
 */
export type OpenTradeInput = {
  side: TradeSide;
  quantity: number;
  entryPrice: number;
  entryTimestamp: string;
  id?: string;
};

/**
 * Input for TradeEngine.closeTrade (US121).
 */
export type CloseTradeInput = {
  tradeId: string;
  exitPrice: number;
  exitTimestamp: string;
};
