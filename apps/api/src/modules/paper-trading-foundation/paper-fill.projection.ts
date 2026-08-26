import type { PaperFill } from './paper-fill';

export type PaperFillView = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  paperOrderId: string;
  exchange: string;
  symbol: string;
  side: string;
  quantity: string;
  executionPrice: string;
  executionTime: string;
  createdAt: string;
}>;

export type PaperFillListView = Readonly<{
  fills: readonly PaperFillView[];
}>;

export type PaperExecutionView = Readonly<{
  orderId: string;
  status: string;
  fill: PaperFillView;
}>;

export function toPaperFillView(fill: PaperFill): PaperFillView {
  return Object.freeze({
    id: fill.id,
    workspaceId: fill.workspaceId,
    paperAccountId: fill.paperAccountId,
    paperOrderId: fill.paperOrderId,
    exchange: fill.exchange,
    symbol: fill.symbol,
    side: fill.side,
    quantity: fill.quantity,
    executionPrice: fill.executionPrice,
    executionTime: fill.executionTime,
    createdAt: fill.createdAt,
  });
}

export function toPaperFillListView(fills: readonly PaperFill[]): PaperFillListView {
  return Object.freeze({
    fills: Object.freeze(fills.map(toPaperFillView)),
  });
}
