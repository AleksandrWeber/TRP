/**
 * Application errors for US201 Execution Simulator.
 */

export type ExecutionSimulatorErrorCode =
  'EXECUTION_SIMULATOR_VALIDATION' | 'EXECUTION_SIMULATOR_DUPLICATE_REQUEST';

export abstract class ExecutionSimulatorError extends Error {
  abstract readonly code: ExecutionSimulatorErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ExecutionSimulatorValidationError extends ExecutionSimulatorError {
  readonly code = 'EXECUTION_SIMULATOR_VALIDATION' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class ExecutionSimulatorDuplicateRequestError extends ExecutionSimulatorError {
  readonly code = 'EXECUTION_SIMULATOR_DUPLICATE_REQUEST' as const;

  constructor(requestId: string) {
    super(`Execution request already simulated: ${requestId}`);
  }
}
