export const PAPER_TRADING_EXECUTOR_ERROR_CODES = ['PORTFOLIO_NOT_FOUND'] as const;

export type PaperTradingExecutorErrorCode = (typeof PAPER_TRADING_EXECUTOR_ERROR_CODES)[number];

/**
 * Canonical error boundary of the Paper Trading Executor (US016).
 */
export abstract class PaperTradingExecutorError extends Error {
  abstract readonly code: PaperTradingExecutorErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** No signals have been processed for the workspace-scoped strategy yet. */
export class ExecutorPortfolioNotFoundError extends PaperTradingExecutorError {
  readonly code = 'PORTFOLIO_NOT_FOUND' as const;

  constructor(workspaceId: string, strategyId: string) {
    super(
      `Paper trading portfolio not found for strategy '${strategyId}' in workspace '${workspaceId}'`,
    );
  }
}
