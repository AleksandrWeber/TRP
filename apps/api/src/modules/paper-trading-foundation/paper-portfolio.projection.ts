import type { PaperPositionMark } from './paper-portfolio.math';

export type PaperPositionView = Readonly<{
  exchange: string;
  symbol: string;
  side: string;
  quantity: string;
  averageEntryPrice: string;
  markPrice: string | null;
  realizedPnL: string;
  unrealizedPnL: string | null;
}>;

export type PaperPositionListView = Readonly<{
  positions: readonly PaperPositionView[];
}>;

export type PaperPortfolioView = Readonly<{
  paperAccountId: string;
  workspaceId: string;
  baseCurrency: string;
  cashBalance: string;
  equity: string | null;
  realizedPnL: string;
  unrealizedPnL: string | null;
  totalPnL: string | null;
  positions: readonly PaperPositionView[];
  honesty: string;
}>;

export type PaperPnLView = Readonly<{
  paperAccountId: string;
  workspaceId: string;
  realizedPnL: string;
  unrealizedPnL: string | null;
  totalPnL: string | null;
  honesty: string;
}>;

export type PaperExecutionHistoryEntryView = Readonly<{
  id: string;
  kind: 'FILL';
  paperOrderId: string;
  paperFillId: string;
  exchange: string;
  symbol: string;
  side: string;
  quantity: string;
  executionPrice: string;
  occurredAt: string;
}>;

export type PaperExecutionHistoryView = Readonly<{
  entries: readonly PaperExecutionHistoryEntryView[];
  honesty: string;
}>;

export function toPaperPositionView(position: PaperPositionMark): PaperPositionView {
  return Object.freeze({
    exchange: position.exchange,
    symbol: position.symbol,
    side: position.side,
    quantity: position.quantity,
    averageEntryPrice: position.averageEntryPrice,
    markPrice: position.markPrice,
    realizedPnL: position.realizedPnL,
    unrealizedPnL: position.unrealizedPnL,
  });
}
