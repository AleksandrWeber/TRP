export {
  ExecutionSimulatorService,
  applyDeterministicSlippage,
  deterministicFillId,
  resolveExecutedQuantity,
  validateSimulationInput,
  type ExecutionSimulatorClock,
  type ExecutionSimulatorServiceDependencies,
  type SimulateExecutionInput,
} from './execution-simulator.service';
export { createExecutionRequest, type ExecutionRequest } from './execution-request';
export { createExecutionFill, type ExecutionFill } from './execution-fill';
export { createExecutionPolicy, type ExecutionPolicy } from './execution-policy';
export { createExecutionResult, type ExecutionResult } from './execution-result';
export {
  SIMULATED_EXECUTION_STATUSES,
  isSimulatedExecutionStatus,
  type SimulatedExecutionStatus,
} from './execution-fill-status';
export { EXECUTION_SIDES, isExecutionSide, type ExecutionSide } from './execution-side';
export {
  createExecutionSimulatorMetrics,
  type ExecutionSimulatorMetrics,
} from './execution-simulator-metrics';
export type {
  ExecutionFilled,
  ExecutionRejected,
  ExecutionRequested,
  ExecutionSimulatorEvent,
  ExecutionSimulatorEventType,
} from './execution-simulator-events';
export { EXECUTION_SIMULATOR_EVENT_TYPES } from './execution-simulator-events';
export {
  ExecutionSimulatorDuplicateRequestError,
  ExecutionSimulatorError,
  ExecutionSimulatorValidationError,
  type ExecutionSimulatorErrorCode,
} from './execution-simulator-errors';
