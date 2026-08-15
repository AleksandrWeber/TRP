import type { OrchestrationCommandResult } from './ports/trading-orchestrator.port';

/**
 * PC-11 — transport mapping for existing coordinator rejection/failure outcomes.
 * Does not invent Gate reasons. Does not override PASS/FAIL.
 */
export class OrchestrationRejectedError extends Error {
  readonly outcome: OrchestrationCommandResult['outcome'];
  readonly reasons: readonly string[];
  readonly result: OrchestrationCommandResult;

  constructor(result: OrchestrationCommandResult) {
    super(result.rejectionReasons?.join(', ') || `orchestration ${result.outcome}`);
    this.name = 'OrchestrationRejectedError';
    this.outcome = result.outcome;
    this.reasons = result.rejectionReasons ?? [];
    this.result = result;
  }
}

export function isOrchestrationRejectedError(error: unknown): error is OrchestrationRejectedError {
  return error instanceof OrchestrationRejectedError;
}
