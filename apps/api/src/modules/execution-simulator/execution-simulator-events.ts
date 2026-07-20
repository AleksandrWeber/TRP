/**
 * Application events for US201 Execution Simulator.
 *
 * Collected in-memory by ExecutionSimulatorService. No transport layer and
 * no message bus.
 */

import type { SimulatedExecutionStatus } from './execution-fill-status';

export const EXECUTION_SIMULATOR_EVENT_TYPES = Object.freeze([
  'ExecutionRequested',
  'ExecutionFilled',
  'ExecutionRejected',
] as const);

export type ExecutionSimulatorEventType = (typeof EXECUTION_SIMULATOR_EVENT_TYPES)[number];

type ExecutionSimulatorEventBase<Type extends string> = Readonly<{
  eventType: Type;
  requestId: string;
  occurredAt: string;
}>;

export type ExecutionRequested = ExecutionSimulatorEventBase<'ExecutionRequested'> &
  Readonly<{
    symbol: string;
    side: string;
    quantity: number;
    requestedPrice: number;
  }>;

export type ExecutionFilled = ExecutionSimulatorEventBase<'ExecutionFilled'> &
  Readonly<{
    fillId: string;
    executedPrice: number;
    executedQuantity: number;
    executionStatus: SimulatedExecutionStatus;
    commission: number;
  }>;

export type ExecutionRejected = ExecutionSimulatorEventBase<'ExecutionRejected'> &
  Readonly<{
    reason: string;
  }>;

export type ExecutionSimulatorEvent = ExecutionRequested | ExecutionFilled | ExecutionRejected;
