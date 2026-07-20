import { createHash } from 'node:crypto';

import { createExecutionFill } from './execution-fill';
import { createExecutionPolicy, type ExecutionPolicy } from './execution-policy';
import { createExecutionRequest, type ExecutionRequest } from './execution-request';
import { createExecutionResult, type ExecutionResult } from './execution-result';
import type { ExecutionSide } from './execution-side';
import type { SimulatedExecutionStatus } from './execution-fill-status';
import {
  createExecutionSimulatorMetrics,
  type ExecutionSimulatorMetrics,
} from './execution-simulator-metrics';
import type {
  ExecutionFilled,
  ExecutionRejected,
  ExecutionRequested,
  ExecutionSimulatorEvent,
} from './execution-simulator-events';
import {
  ExecutionSimulatorDuplicateRequestError,
  ExecutionSimulatorValidationError,
} from './execution-simulator-errors';

export type ExecutionSimulatorClock = Readonly<{
  now: () => number;
  iso: () => string;
}>;

export type ExecutionSimulatorServiceDependencies = Readonly<{
  clock?: ExecutionSimulatorClock;
  rejectDuplicateRequestIds?: boolean;
}>;

export type SimulateExecutionInput = Readonly<{
  requestId: string;
  symbol: string;
  side: ExecutionSide;
  quantity: number;
  requestedPrice: number;
  timestamp: string;
}>;

/**
 * US201 Execution Simulator application service.
 *
 * Deterministic, stateless execution simulation with in-memory idempotency,
 * events, and metrics. No portfolio, position, or persistence concerns.
 */
export class ExecutionSimulatorService {
  private readonly clock: ExecutionSimulatorClock;
  private readonly rejectDuplicateRequestIds: boolean;
  private readonly collectedEvents: ExecutionSimulatorEvent[] = [];
  private readonly completedResults = new Map<string, ExecutionResult>();
  private totalExecutionTime = 0;
  private executionCount = 0;
  private filledCount = 0;
  private rejectedCount = 0;

  private constructor(dependencies: ExecutionSimulatorServiceDependencies = {}) {
    this.clock = dependencies.clock ?? defaultClock();
    this.rejectDuplicateRequestIds = dependencies.rejectDuplicateRequestIds === true;
  }

  static create(
    dependencies: ExecutionSimulatorServiceDependencies = {},
  ): ExecutionSimulatorService {
    return new ExecutionSimulatorService(dependencies);
  }

  /**
   * Simulates deterministic execution for a request under the supplied policy.
   * Replays the cached result when the same requestId is submitted again.
   */
  simulate(input: SimulateExecutionInput, policyInput: ExecutionPolicy): ExecutionResult {
    const policy = createExecutionPolicy(policyInput);
    const requestId = normalizeRequired(input.requestId, 'requestId');
    const cached = this.completedResults.get(requestId);
    if (cached !== undefined) {
      if (this.rejectDuplicateRequestIds) {
        throw new ExecutionSimulatorDuplicateRequestError(requestId);
      }
      return cached;
    }

    const startedAtMs = this.clock.now();
    const startedAt = this.clock.iso();

    this.recordEvent({
      eventType: 'ExecutionRequested',
      requestId,
      occurredAt: startedAt,
      symbol: input.symbol,
      side: input.side,
      quantity: input.quantity,
      requestedPrice: input.requestedPrice,
    } satisfies ExecutionRequested);

    const rejectionReason = validateSimulationInput(input);
    const result =
      rejectionReason === null
        ? this.simulateAccepted(input, policy, requestId, startedAt, startedAtMs)
        : this.simulateRejected(input, policy, requestId, startedAt, startedAtMs, rejectionReason);

    this.completedResults.set(requestId, result);
    this.executionCount += 1;
    this.totalExecutionTime += result.executionDuration;
    if (result.fill.executionStatus === 'REJECTED') {
      this.rejectedCount += 1;
    } else {
      this.filledCount += 1;
    }

    return result;
  }

  /**
   * Validates and freezes a request for callers that require immutable input.
   */
  createRequest(input: SimulateExecutionInput): ExecutionRequest {
    try {
      return createExecutionRequest(input);
    } catch (error) {
      throw new ExecutionSimulatorValidationError(
        error instanceof Error ? error.message : 'Invalid execution request',
        error,
      );
    }
  }

  applicationEvents(): readonly ExecutionSimulatorEvent[] {
    return Object.freeze([...this.collectedEvents]);
  }

  metrics(): ExecutionSimulatorMetrics {
    const averageExecutionTime =
      this.executionCount === 0 ? 0 : Math.floor(this.totalExecutionTime / this.executionCount);

    return createExecutionSimulatorMetrics({
      executionCount: this.executionCount,
      filled: this.filledCount,
      rejected: this.rejectedCount,
      averageExecutionTime,
    });
  }

  private simulateAccepted(
    input: SimulateExecutionInput,
    policy: ExecutionPolicy,
    requestId: string,
    startedAt: string,
    startedAtMs: number,
  ): ExecutionResult {
    const executedPrice = applyDeterministicSlippage(
      input.requestedPrice,
      input.side,
      policy.deterministicSlippage,
    );
    const { executedQuantity, executionStatus } = resolveExecutedQuantity(input.quantity, policy);
    const completedAt = this.clock.iso();
    const fill = createExecutionFill({
      fillId: deterministicFillId(requestId),
      requestId,
      executedPrice,
      executedQuantity,
      timestamp: input.timestamp,
      executionStatus,
    });

    const result = createExecutionResult({
      requestId,
      fill,
      commission: policy.fixedCommission,
      startedAt,
      completedAt,
      executionDuration: Math.max(0, this.clock.now() - startedAtMs),
    });

    this.recordEvent({
      eventType: 'ExecutionFilled',
      requestId,
      occurredAt: completedAt,
      fillId: fill.fillId,
      executedPrice: fill.executedPrice,
      executedQuantity: fill.executedQuantity,
      executionStatus: fill.executionStatus,
      commission: result.commission,
    } satisfies ExecutionFilled);

    return result;
  }

  private simulateRejected(
    input: SimulateExecutionInput,
    policy: ExecutionPolicy,
    requestId: string,
    startedAt: string,
    startedAtMs: number,
    reason: string,
  ): ExecutionResult {
    const completedAt = this.clock.iso();
    const fill = createExecutionFill({
      fillId: deterministicFillId(requestId),
      requestId,
      executedPrice: 0,
      executedQuantity: 0,
      timestamp: input.timestamp,
      executionStatus: 'REJECTED',
    });

    const result = createExecutionResult({
      requestId,
      fill,
      commission: 0,
      startedAt,
      completedAt,
      executionDuration: Math.max(0, this.clock.now() - startedAtMs),
    });

    this.recordEvent({
      eventType: 'ExecutionRejected',
      requestId,
      occurredAt: completedAt,
      reason,
    } satisfies ExecutionRejected);

    return result;
  }

  private recordEvent(event: ExecutionSimulatorEvent): void {
    this.collectedEvents.push(Object.freeze({ ...event }));
  }
}

export function validateSimulationInput(input: SimulateExecutionInput): string | null {
  if (normalizeRequired(input.requestId, 'requestId') === '') {
    return 'requestId is required';
  }
  if (normalizeRequired(input.symbol, 'symbol') === '') {
    return 'invalid symbol';
  }
  if (input.side !== 'BUY' && input.side !== 'SELL') {
    return 'invalid side';
  }
  if (input.quantity === 0) {
    return 'zero quantity';
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 0) {
    return 'invalid quantity';
  }
  if (!Number.isFinite(input.requestedPrice) || input.requestedPrice < 0) {
    return 'negative price';
  }
  if (!isCanonicalIso(input.timestamp)) {
    return 'invalid timestamp';
  }
  return null;
}

export function applyDeterministicSlippage(
  requestedPrice: number,
  side: ExecutionSide,
  deterministicSlippage: number,
): number {
  if (side === 'BUY') {
    return requestedPrice + deterministicSlippage;
  }
  return Math.max(0, requestedPrice - deterministicSlippage);
}

export function resolveExecutedQuantity(
  quantity: number,
  policy: ExecutionPolicy,
): Readonly<{ executedQuantity: number; executionStatus: SimulatedExecutionStatus }> {
  if (policy.allowPartialFill && quantity >= 2) {
    return Object.freeze({
      executedQuantity: Math.floor(quantity / 2),
      executionStatus: 'PARTIALLY_FILLED',
    });
  }

  return Object.freeze({
    executedQuantity: quantity,
    executionStatus: 'FILLED',
  });
}

export function deterministicFillId(requestId: string): string {
  const hash = createHash('sha256').update(requestId).digest('hex').slice(0, 16);
  return `sim_fill_${hash}`;
}

function defaultClock(): ExecutionSimulatorClock {
  return Object.freeze({
    now: () => Date.now(),
    iso: () => new Date().toISOString(),
  });
}

function normalizeRequired(value: string, _field: string): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isCanonicalIso(value: string): boolean {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}
