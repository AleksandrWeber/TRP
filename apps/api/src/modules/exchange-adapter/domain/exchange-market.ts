export type ExchangeBalance = Readonly<{
  asset: string;
  free: string;
  locked: string;
  total: string;
}>;

export type ExchangePosition = Readonly<{
  symbol: string;
  side: 'LONG' | 'SHORT' | 'FLAT';
  quantity: string;
  entryPrice: string | null;
  unrealizedPnl: string | null;
}>;

export type ExchangeTicker = Readonly<{
  symbol: string;
  bid: string | null;
  ask: string | null;
  last: string;
  timestamp: string;
}>;

export type ExchangeExecution = Readonly<{
  executionId: string;
  exchangeOrderId: string;
  clientOrderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: string;
  price: string;
  fee: string;
  feeAsset: string;
  timestamp: string;
}>;

export function freezeBalance(input: ExchangeBalance): ExchangeBalance {
  return Object.freeze({ ...input });
}

export function freezePosition(input: ExchangePosition): ExchangePosition {
  return Object.freeze({ ...input });
}

export function freezeTicker(input: ExchangeTicker): ExchangeTicker {
  return Object.freeze({ ...input });
}

export function freezeExecution(input: ExchangeExecution): ExchangeExecution {
  return Object.freeze({ ...input });
}
