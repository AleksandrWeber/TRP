import { describe, expect, it } from 'vitest';

import {
  applyDeterministicSlippage,
  createExecutionFill,
  createExecutionPolicy,
  createExecutionRequest,
  createExecutionResult,
  createExecutionSimulatorMetrics,
  deterministicFillId,
  EXECUTION_SIMULATOR_EVENT_TYPES,
  ExecutionSimulatorDuplicateRequestError,
  ExecutionSimulatorService,
  ExecutionSimulatorValidationError,
  isExecutionSide,
  isSimulatedExecutionStatus,
  resolveExecutedQuantity,
  SIMULATED_EXECUTION_STATUSES,
  validateSimulationInput,
  type ExecutionSimulatorClock,
  type SimulateExecutionInput,
} from './index';

const REQUEST_AT = '2026-07-20T10:00:00.000Z';
const STARTED_AT = '2026-07-20T10:00:01.000Z';
const COMPLETED_AT = '2026-07-20T10:00:02.000Z';
const REQUEST_ID = 'req-us201-filled';

const DEFAULT_POLICY = createExecutionPolicy({
  allowPartialFill: false,
  deterministicSlippage: 0.5,
  fixedCommission: 1.25,
});

const DEFAULT_INPUT: SimulateExecutionInput = Object.freeze({
  requestId: REQUEST_ID,
  symbol: 'BTC-USD',
  side: 'BUY',
  quantity: 4,
  requestedPrice: 100,
  timestamp: REQUEST_AT,
});

function createClock(
  isoTimes: readonly string[],
  nowValues: readonly number[] = [1_000, 1_005],
): ExecutionSimulatorClock {
  let isoIndex = 0;
  let nowIndex = 0;
  return Object.freeze({
    iso: () => {
      const value = isoTimes[Math.min(isoIndex, isoTimes.length - 1)] as string;
      isoIndex += 1;
      return value;
    },
    now: () => {
      const value = nowValues[Math.min(nowIndex, nowValues.length - 1)] as number;
      nowIndex += 1;
      return value;
    },
  });
}

function createService(
  overrides: {
    clock?: ExecutionSimulatorClock;
    rejectDuplicateRequestIds?: boolean;
  } = {},
): ExecutionSimulatorService {
  return ExecutionSimulatorService.create({
    clock: overrides.clock ?? createClock([STARTED_AT, COMPLETED_AT]),
    rejectDuplicateRequestIds: overrides.rejectDuplicateRequestIds,
  });
}

describe('US201 ExecutionRequest', () => {
  it('creates an immutable valid request', () => {
    const request = createExecutionRequest(DEFAULT_INPUT);
    expect(request).toEqual(DEFAULT_INPUT);
    expect(Object.isFrozen(request)).toBe(true);
  });

  it('rejects invalid request fields', () => {
    expect(() => createExecutionRequest({ ...DEFAULT_INPUT, requestId: '' })).toThrow(
      'requestId is required',
    );
    expect(() =>
      createExecutionRequest({
        ...DEFAULT_INPUT,
        requestId: null as unknown as string,
      }),
    ).toThrow('requestId is required');
    expect(() => createExecutionRequest({ ...DEFAULT_INPUT, symbol: '  ' })).toThrow(
      'symbol is required',
    );
    expect(() => createExecutionRequest({ ...DEFAULT_INPUT, side: 'HOLD' as 'BUY' })).toThrow(
      'Invalid side',
    );
    expect(() => createExecutionRequest({ ...DEFAULT_INPUT, quantity: 0 })).toThrow(
      'quantity must be a positive integer',
    );
    expect(() => createExecutionRequest({ ...DEFAULT_INPUT, requestedPrice: -1 })).toThrow(
      'requestedPrice must be a non-negative number',
    );
    expect(() => createExecutionRequest({ ...DEFAULT_INPUT, timestamp: 'invalid' })).toThrow(
      'timestamp must be an ISO-8601 UTC timestamp',
    );
  });
});

describe('US201 ExecutionPolicy', () => {
  it('freezes policy values', () => {
    const policy = createExecutionPolicy(DEFAULT_POLICY);
    expect(policy).toEqual(DEFAULT_POLICY);
    expect(Object.isFrozen(policy)).toBe(true);
  });

  it('rejects invalid policy values', () => {
    expect(() => createExecutionPolicy({ ...DEFAULT_POLICY, deterministicSlippage: -0.1 })).toThrow(
      'deterministicSlippage must be a non-negative number',
    );
    expect(() => createExecutionPolicy({ ...DEFAULT_POLICY, fixedCommission: Number.NaN })).toThrow(
      'fixedCommission must be a non-negative number',
    );
  });
});

describe('US201 ExecutionFill and ExecutionResult', () => {
  it('creates immutable fill and result objects', () => {
    const fill = createExecutionFill({
      fillId: deterministicFillId(REQUEST_ID),
      requestId: REQUEST_ID,
      executedPrice: 100.5,
      executedQuantity: 4,
      timestamp: REQUEST_AT,
      executionStatus: 'FILLED',
    });
    const result = createExecutionResult({
      requestId: REQUEST_ID,
      fill,
      commission: 1.25,
      startedAt: STARTED_AT,
      completedAt: COMPLETED_AT,
      executionDuration: 5,
    });

    expect(Object.isFrozen(fill)).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.fill.executionStatus).toBe('FILLED');
  });

  it('validates fill and result factories', () => {
    expect(() =>
      createExecutionFill({
        fillId: '',
        requestId: REQUEST_ID,
        executedPrice: 1,
        executedQuantity: 1,
        timestamp: REQUEST_AT,
        executionStatus: 'FILLED',
      }),
    ).toThrow('fillId is required');
    expect(() =>
      createExecutionFill({
        fillId: 'fill-1',
        requestId: REQUEST_ID,
        executedPrice: -1,
        executedQuantity: 1,
        timestamp: REQUEST_AT,
        executionStatus: 'FILLED',
      }),
    ).toThrow('executedPrice must be a non-negative number');
    expect(() =>
      createExecutionFill({
        fillId: 'fill-1',
        requestId: REQUEST_ID,
        executedPrice: 1,
        executedQuantity: -1,
        timestamp: REQUEST_AT,
        executionStatus: 'FILLED',
      }),
    ).toThrow('executedQuantity must be a non-negative integer');
    expect(() =>
      createExecutionFill({
        fillId: 'fill-1',
        requestId: REQUEST_ID,
        executedPrice: 1,
        executedQuantity: 1,
        timestamp: REQUEST_AT,
        executionStatus: 'UNKNOWN' as 'FILLED',
      }),
    ).toThrow('Invalid executionStatus');
    expect(() =>
      createExecutionFill({
        fillId: 'fill-1',
        requestId: '',
        executedPrice: 1,
        executedQuantity: 1,
        timestamp: REQUEST_AT,
        executionStatus: 'FILLED',
      }),
    ).toThrow('requestId is required');
    expect(() =>
      createExecutionFill({
        fillId: 'fill-1',
        requestId: REQUEST_ID,
        executedPrice: 1,
        executedQuantity: 1,
        timestamp: 'bad',
        executionStatus: 'FILLED',
      }),
    ).toThrow('timestamp must be an ISO-8601 UTC timestamp');
    expect(() =>
      createExecutionResult({
        requestId: '',
        fill: createExecutionFill({
          fillId: 'fill-1',
          requestId: REQUEST_ID,
          executedPrice: 0,
          executedQuantity: 0,
          timestamp: REQUEST_AT,
          executionStatus: 'REJECTED',
        }),
        commission: 0,
        startedAt: STARTED_AT,
        completedAt: COMPLETED_AT,
        executionDuration: 0,
      }),
    ).toThrow('requestId is required');
    expect(() =>
      createExecutionResult({
        requestId: REQUEST_ID,
        fill: createExecutionFill({
          fillId: 'fill-1',
          requestId: REQUEST_ID,
          executedPrice: 0,
          executedQuantity: 0,
          timestamp: REQUEST_AT,
          executionStatus: 'REJECTED',
        }),
        commission: -1,
        startedAt: STARTED_AT,
        completedAt: COMPLETED_AT,
        executionDuration: 0,
      }),
    ).toThrow('commission must be a non-negative number');
    expect(() =>
      createExecutionResult({
        requestId: REQUEST_ID,
        fill: createExecutionFill({
          fillId: 'fill-1',
          requestId: REQUEST_ID,
          executedPrice: 0,
          executedQuantity: 0,
          timestamp: REQUEST_AT,
          executionStatus: 'REJECTED',
        }),
        commission: 0,
        startedAt: STARTED_AT,
        completedAt: COMPLETED_AT,
        executionDuration: -1,
      }),
    ).toThrow('executionDuration must be a non-negative integer');
    expect(() =>
      createExecutionResult({
        requestId: REQUEST_ID,
        fill: createExecutionFill({
          fillId: 'fill-1',
          requestId: REQUEST_ID,
          executedPrice: 0,
          executedQuantity: 0,
          timestamp: REQUEST_AT,
          executionStatus: 'REJECTED',
        }),
        commission: 0,
        startedAt: 'bad',
        completedAt: COMPLETED_AT,
        executionDuration: 0,
      }),
    ).toThrow('startedAt must be an ISO-8601 UTC timestamp');
    expect(() =>
      createExecutionResult({
        requestId: REQUEST_ID,
        fill: createExecutionFill({
          fillId: 'fill-1',
          requestId: REQUEST_ID,
          executedPrice: 0,
          executedQuantity: 0,
          timestamp: REQUEST_AT,
          executionStatus: 'REJECTED',
        }),
        commission: 0,
        startedAt: STARTED_AT,
        completedAt: 'bad',
        executionDuration: 0,
      }),
    ).toThrow('completedAt must be an ISO-8601 UTC timestamp');
  });
});

describe('US201 execution helpers', () => {
  it('applies deterministic slippage by side', () => {
    expect(applyDeterministicSlippage(100, 'BUY', 0.5)).toBe(100.5);
    expect(applyDeterministicSlippage(100, 'SELL', 0.5)).toBe(99.5);
    expect(applyDeterministicSlippage(0.25, 'SELL', 1)).toBe(0);
  });

  it('resolves full and partial quantities from policy', () => {
    expect(
      resolveExecutedQuantity(
        4,
        createExecutionPolicy({ ...DEFAULT_POLICY, allowPartialFill: false }),
      ),
    ).toEqual({ executedQuantity: 4, executionStatus: 'FILLED' });
    expect(
      resolveExecutedQuantity(
        4,
        createExecutionPolicy({ ...DEFAULT_POLICY, allowPartialFill: true }),
      ),
    ).toEqual({ executedQuantity: 2, executionStatus: 'PARTIALLY_FILLED' });
    expect(
      resolveExecutedQuantity(
        1,
        createExecutionPolicy({ ...DEFAULT_POLICY, allowPartialFill: true }),
      ),
    ).toEqual({ executedQuantity: 1, executionStatus: 'FILLED' });
  });

  it('creates deterministic fill ids and validates simulation input', () => {
    expect(deterministicFillId('same-id')).toBe(deterministicFillId('same-id'));
    expect(deterministicFillId('other-id')).not.toBe(deterministicFillId('same-id'));
    expect(validateSimulationInput(DEFAULT_INPUT)).toBeNull();
    expect(validateSimulationInput({ ...DEFAULT_INPUT, symbol: ' ' })).toBe('invalid symbol');
    expect(validateSimulationInput({ ...DEFAULT_INPUT, quantity: 0 })).toBe('zero quantity');
    expect(validateSimulationInput({ ...DEFAULT_INPUT, quantity: 1.5 })).toBe('invalid quantity');
    expect(validateSimulationInput({ ...DEFAULT_INPUT, quantity: -2 })).toBe('invalid quantity');
    expect(validateSimulationInput({ ...DEFAULT_INPUT, requestedPrice: -1 })).toBe(
      'negative price',
    );
    expect(validateSimulationInput({ ...DEFAULT_INPUT, side: 'HOLD' as 'BUY' })).toBe(
      'invalid side',
    );
    expect(validateSimulationInput({ ...DEFAULT_INPUT, timestamp: 'bad' })).toBe(
      'invalid timestamp',
    );
    expect(validateSimulationInput({ ...DEFAULT_INPUT, requestId: '' })).toBe(
      'requestId is required',
    );
  });

  it('exports status and side guards', () => {
    expect(isExecutionSide('BUY')).toBe(true);
    expect(isExecutionSide('HOLD')).toBe(false);
    expect(isSimulatedExecutionStatus('FILLED')).toBe(true);
    expect(isSimulatedExecutionStatus('UNKNOWN')).toBe(false);
    expect(SIMULATED_EXECUTION_STATUSES).toContain('PARTIALLY_FILLED');
    expect(EXECUTION_SIMULATOR_EVENT_TYPES).toEqual([
      'ExecutionRequested',
      'ExecutionFilled',
      'ExecutionRejected',
    ]);
  });

  it('creates metrics', () => {
    const metrics = createExecutionSimulatorMetrics({
      executionCount: 2,
      filled: 1,
      rejected: 1,
      averageExecutionTime: 3,
    });
    expect(Object.isFrozen(metrics)).toBe(true);
    expect(() =>
      createExecutionSimulatorMetrics({
        executionCount: -1,
        filled: 0,
        rejected: 0,
        averageExecutionTime: 0,
      }),
    ).toThrow('executionCount must be a non-negative integer');
  });
});

describe('US201 ExecutionSimulatorService filled execution', () => {
  it('simulates a filled execution with slippage and commission', () => {
    const service = createService();
    const result = service.simulate(DEFAULT_INPUT, DEFAULT_POLICY);

    expect(result.requestId).toBe(REQUEST_ID);
    expect(result.fill.executionStatus).toBe('FILLED');
    expect(result.fill.executedQuantity).toBe(4);
    expect(result.fill.executedPrice).toBe(100.5);
    expect(result.commission).toBe(1.25);
    expect(result.executionDuration).toBe(5);
    expect(result.fill.fillId).toBe(deterministicFillId(REQUEST_ID));
  });

  it('wraps createRequest validation errors', () => {
    const service = createService();
    expect(() => service.createRequest({ ...DEFAULT_INPUT, quantity: 0 })).toThrow(
      ExecutionSimulatorValidationError,
    );
  });
});

describe('US201 ExecutionSimulatorService partial fill', () => {
  it('simulates a partial fill when policy allows it', () => {
    const service = createService();
    const result = service.simulate(
      { ...DEFAULT_INPUT, requestId: 'req-us201-partial' },
      createExecutionPolicy({ ...DEFAULT_POLICY, allowPartialFill: true }),
    );

    expect(result.fill.executionStatus).toBe('PARTIALLY_FILLED');
    expect(result.fill.executedQuantity).toBe(2);
    expect(result.commission).toBe(1.25);
  });
});

describe('US201 ExecutionSimulatorService rejected execution', () => {
  it('rejects invalid simulation input without throwing', () => {
    const service = createService();
    const result = service.simulate(
      { ...DEFAULT_INPUT, requestId: 'req-us201-rejected', quantity: 0 },
      DEFAULT_POLICY,
    );

    expect(result.fill.executionStatus).toBe('REJECTED');
    expect(result.fill.executedQuantity).toBe(0);
    expect(result.fill.executedPrice).toBe(0);
    expect(result.commission).toBe(0);
  });
});

describe('US201 ExecutionSimulatorService validation', () => {
  it('rejects zero quantity, invalid symbol, negative price, and invalid quantity', () => {
    const service = createService();

    const zeroQuantity = service.simulate(
      { ...DEFAULT_INPUT, requestId: 'req-zero-qty', quantity: 0 },
      DEFAULT_POLICY,
    );
    const invalidSymbol = service.simulate(
      { ...DEFAULT_INPUT, requestId: 'req-invalid-symbol', symbol: '  ' },
      DEFAULT_POLICY,
    );
    const negativePrice = service.simulate(
      { ...DEFAULT_INPUT, requestId: 'req-negative-price', requestedPrice: -10 },
      DEFAULT_POLICY,
    );
    const invalidQuantity = service.simulate(
      { ...DEFAULT_INPUT, requestId: 'req-invalid-qty', quantity: 2.5 },
      DEFAULT_POLICY,
    );

    expect(zeroQuantity.fill.executionStatus).toBe('REJECTED');
    expect(invalidSymbol.fill.executionStatus).toBe('REJECTED');
    expect(negativePrice.fill.executionStatus).toBe('REJECTED');
    expect(invalidQuantity.fill.executionStatus).toBe('REJECTED');
  });
});

describe('US201 ExecutionSimulatorService events', () => {
  it('emits requested and filled events for successful simulation', () => {
    const service = createService();
    service.simulate({ ...DEFAULT_INPUT, requestId: 'req-us201-events-filled' }, DEFAULT_POLICY);

    const events = service.applicationEvents();
    expect(events).toHaveLength(2);
    expect(events[0]?.eventType).toBe('ExecutionRequested');
    expect(events[1]?.eventType).toBe('ExecutionFilled');
    if (events[1]?.eventType === 'ExecutionFilled') {
      expect(events[1].executionStatus).toBe('FILLED');
      expect(events[1].commission).toBe(1.25);
    }
  });

  it('emits requested and rejected events for failed validation', () => {
    const service = createService();
    service.simulate(
      { ...DEFAULT_INPUT, requestId: 'req-us201-events-rejected', quantity: 0 },
      DEFAULT_POLICY,
    );

    const events = service.applicationEvents();
    expect(events).toHaveLength(2);
    expect(events[0]?.eventType).toBe('ExecutionRequested');
    expect(events[1]?.eventType).toBe('ExecutionRejected');
    if (events[1]?.eventType === 'ExecutionRejected') {
      expect(events[1].reason).toBe('zero quantity');
    }
  });
});

describe('US201 ExecutionSimulatorService determinism', () => {
  it('returns identical results for identical inputs', () => {
    const first = createService({
      clock: createClock([STARTED_AT, COMPLETED_AT], [100, 105]),
    });
    const second = createService({
      clock: createClock([STARTED_AT, COMPLETED_AT], [100, 105]),
    });

    const input = { ...DEFAULT_INPUT, requestId: 'req-us201-deterministic' };
    const firstResult = first.simulate(input, DEFAULT_POLICY);
    const secondResult = second.simulate(input, DEFAULT_POLICY);

    expect(firstResult).toEqual(secondResult);
  });
});

describe('US201 ExecutionSimulatorService idempotency', () => {
  it('returns the cached result for repeated request ids', () => {
    const service = createService();
    const input = { ...DEFAULT_INPUT, requestId: 'req-us201-idempotent' };

    const first = service.simulate(input, DEFAULT_POLICY);
    const second = service.simulate({ ...input, quantity: 99 }, DEFAULT_POLICY);

    expect(second).toBe(first);
    expect(service.metrics().executionCount).toBe(1);
  });

  it('can reject duplicate request ids when configured', () => {
    const service = createService({ rejectDuplicateRequestIds: true });
    const input = { ...DEFAULT_INPUT, requestId: 'req-us201-duplicate-error' };
    service.simulate(input, DEFAULT_POLICY);

    expect(() => service.simulate(input, DEFAULT_POLICY)).toThrow(
      ExecutionSimulatorDuplicateRequestError,
    );
  });
});

describe('US201 ExecutionSimulatorService metrics', () => {
  it('collects execution count, filled, rejected, and average execution time', () => {
    const service = createService({
      clock: createClock(
        [STARTED_AT, COMPLETED_AT, STARTED_AT, COMPLETED_AT, STARTED_AT, COMPLETED_AT],
        [1_000, 1_004, 2_000, 2_010, 3_000, 3_002],
      ),
    });

    service.simulate({ ...DEFAULT_INPUT, requestId: 'req-metrics-filled-1' }, DEFAULT_POLICY);
    service.simulate(
      { ...DEFAULT_INPUT, requestId: 'req-metrics-rejected', quantity: 0 },
      DEFAULT_POLICY,
    );
    service.simulate({ ...DEFAULT_INPUT, requestId: 'req-metrics-filled-2' }, DEFAULT_POLICY);

    expect(service.metrics()).toEqual({
      executionCount: 3,
      filled: 2,
      rejected: 1,
      averageExecutionTime: 5,
    });
  });

  it('returns zero average execution time before any simulation', () => {
    const service = createService();
    expect(service.metrics()).toEqual({
      executionCount: 0,
      filled: 0,
      rejected: 0,
      averageExecutionTime: 0,
    });
  });
});

describe('US201 ExecutionSimulatorService default clock', () => {
  it('uses the system clock when none is supplied', () => {
    const service = ExecutionSimulatorService.create();
    const result = service.simulate(
      { ...DEFAULT_INPUT, requestId: 'req-us201-default-clock' },
      DEFAULT_POLICY,
    );

    expect(result.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.executionDuration).toBeGreaterThanOrEqual(0);
  });
});

describe('US201 ExecutionSimulatorService createRequest', () => {
  it('wraps non-error causes in validation errors', () => {
    const service = createService();
    expect(() => service.createRequest({ ...DEFAULT_INPUT, quantity: 0 })).toThrow(
      ExecutionSimulatorValidationError,
    );
  });
});

describe('US201 ExecutionSimulatorService slippage and commission', () => {
  it('applies sell-side slippage and zero commission on rejected fills', () => {
    const service = createService();
    const sellResult = service.simulate(
      {
        ...DEFAULT_INPUT,
        requestId: 'req-us201-sell',
        side: 'SELL',
        requestedPrice: 50,
      },
      createExecutionPolicy({
        allowPartialFill: false,
        deterministicSlippage: 2,
        fixedCommission: 3,
      }),
    );

    expect(sellResult.fill.executedPrice).toBe(48);
    expect(sellResult.commission).toBe(3);

    const rejected = service.simulate(
      { ...DEFAULT_INPUT, requestId: 'req-us201-no-commission', quantity: 0 },
      createExecutionPolicy({
        allowPartialFill: false,
        deterministicSlippage: 2,
        fixedCommission: 3,
      }),
    );
    expect(rejected.commission).toBe(0);
  });
});
