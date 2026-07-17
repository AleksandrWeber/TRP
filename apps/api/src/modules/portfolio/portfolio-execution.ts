/**
 * State mutation applied to a PortfolioEngine (US120).
 * No order matching — callers supply cash / PnL deltas directly.
 */
export type PortfolioExecution = {
  timestamp: string;
  /** Change in cash (positive = credit, negative = debit). */
  cashDelta: number;
  /** Change in realized PnL (defaults to 0). */
  realizedPnLDelta?: number;
  /** Absolute unrealized PnL mark (optional; leaves previous value when omitted). */
  unrealizedPnL?: number;
};

/**
 * Input for PortfolioEngine.initialize (US120).
 */
export type InitializePortfolioInput = {
  workspaceId: string;
  initialCapital: number;
  /** Optional fixed id; otherwise a UUID is assigned. */
  id?: string;
  timestamp?: string;
};
