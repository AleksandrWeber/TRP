import { describe, expect, it } from 'vitest';
import type { ValidatedRecoveryCheckpoint } from './recovery-checkpoint-validation';
import type { LeasedRecoverySession } from './recovery-checkpoint-validation';
import {
  reconcileRecoveryState,
  type RecoverySessionSnapshot,
  type RecoveryStateReconciliationInput,
} from './recovery-state-reconciliation';
import { TradingSessionStatus } from './trading-session-status';
import type {
  RecoveryAccountingSnapshot,
  RecoveryExecutionSnapshot,
  RecoveryOrderSnapshot,
  RecoveryRiskSnapshot,
} from '../ports/recovery-reconciliation.ports';

const leased: LeasedRecoverySession = Object.freeze({
  sessionId: 'session-1',
  workspaceId: 'ws-1',
  deploymentId: 'deployment-1',
  ownerId: 'runtime-a',
  fencingToken: 3,
});

const checkpoint: ValidatedRecoveryCheckpoint = Object.freeze({
  checkpointId: 'scp_abc',
  sessionId: 'session-1',
  workspaceId: 'ws-1',
  deploymentId: 'deployment-1',
  lastProcessedEventId: 'evt-10',
  runtimeVersion: '1',
  version: 2,
  updatedAt: '2026-07-30T15:00:00.000Z',
  streamId: 'stream-1',
  sequence: 10,
});

function session(overrides: Partial<RecoverySessionSnapshot> = {}): RecoverySessionSnapshot {
  return Object.freeze({
    sessionId: 'session-1',
    workspaceId: 'ws-1',
    deploymentId: 'deployment-1',
    paperAccountId: 'account-1',
    status: TradingSessionStatus.RUNNING,
    fencingToken: 3,
    ...overrides,
  });
}

function baseInput(
  overrides: Partial<RecoveryStateReconciliationInput> = {},
): RecoveryStateReconciliationInput {
  return {
    leased,
    checkpoint,
    session: session(),
    runtime: {
      checkpointEventId: 'evt-10',
      checkpointStreamId: 'stream-1',
      checkpointSequence: 10,
      deploymentId: 'deployment-1',
      intents: [],
    },
    orders: [],
    execution: [],
    accounting: {
      status: 'consistent',
      sourceHash: 'hash-a',
      rebuiltHash: 'hash-a',
      reason: null,
    },
    risk: { killSwitchActive: false, decisions: [] },
    ...overrides,
  };
}

describe('US243 — recovery state reconciliation (pure)', () => {
  it('returns RECONCILED for fully consistent state', () => {
    const order: RecoveryOrderSnapshot = {
      orderId: 'ord-1',
      status: 'filled',
      tradingSessionId: 'session-1',
      paperAccountId: 'account-1',
      openOrUncertain: false,
    };
    const exec: RecoveryExecutionSnapshot = {
      orderId: 'ord-1',
      status: 'filled',
      terminal: true,
      fillCount: 1,
      reconciliationRequired: false,
    };
    const result = reconcileRecoveryState(
      baseInput({
        orders: [order],
        execution: [exec],
        runtime: {
          checkpointEventId: 'evt-10',
          checkpointStreamId: 'stream-1',
          checkpointSequence: 10,
          deploymentId: 'deployment-1',
          intents: [
            {
              intentId: 'intent-1',
              sessionId: 'session-1',
              deploymentId: 'deployment-1',
              eventId: 'evt-10',
              streamId: 'stream-1',
              sequence: 10,
            },
          ],
        },
      }),
    );
    expect(result.outcome).toBe('RECONCILED');
    expect(result.failedContext).toBeNull();
    expect(result.mismatches).toEqual([]);
  });

  it('fails on Session mismatch', () => {
    const result = reconcileRecoveryState(
      baseInput({ session: session({ fencingToken: 99, deploymentId: 'other' }) }),
    );
    expect(result.outcome).toBe('RECONCILIATION_FAILED');
    expect(result.failedContext).toBe('session');
    expect(result.mismatches.some((m) => m.startsWith('session:'))).toBe(true);
  });

  it('fails on Order mismatch', () => {
    const result = reconcileRecoveryState(
      baseInput({
        orders: [
          {
            orderId: 'ord-bad',
            status: 'proposed',
            tradingSessionId: 'other-session',
            paperAccountId: 'account-1',
            openOrUncertain: true,
          },
        ],
      }),
    );
    expect(result.outcome).toBe('RECONCILIATION_FAILED');
    expect(result.failedContext).toBe('orders');
    expect(result.reason).toContain('ord-bad');
  });

  it('fails on Execution mismatch', () => {
    const result = reconcileRecoveryState(
      baseInput({
        orders: [
          {
            orderId: 'ord-1',
            status: 'submitted',
            tradingSessionId: 'session-1',
            paperAccountId: 'account-1',
            openOrUncertain: true,
          },
        ],
        execution: [
          {
            orderId: 'ord-1',
            status: 'uncertain',
            terminal: false,
            fillCount: 0,
            reconciliationRequired: true,
          },
        ],
      }),
    );
    expect(result.outcome).toBe('RECONCILIATION_FAILED');
    expect(result.failedContext).toBe('execution');
  });

  it('fails on Accounting mismatch', () => {
    const accounting: RecoveryAccountingSnapshot = {
      status: 'mismatch',
      sourceHash: 'a',
      rebuiltHash: 'b',
      reason: 'position hash diverge',
    };
    const result = reconcileRecoveryState(baseInput({ accounting }));
    expect(result.outcome).toBe('RECONCILIATION_FAILED');
    expect(result.failedContext).toBe('accounting');
    expect(result.reason).toContain('position hash diverge');
  });

  it('fails when persisted state is missing', () => {
    expect(reconcileRecoveryState(baseInput({ session: null })).failedContext).toBe(
      'missing_state',
    );
    expect(reconcileRecoveryState(baseInput({ accounting: null })).failedContext).toBe(
      'missing_state',
    );
    expect(
      reconcileRecoveryState(
        baseInput({
          accounting: {
            status: 'unknown',
            sourceHash: null,
            rebuiltHash: null,
            reason: null,
          },
        }),
      ).failedContext,
    ).toBe('missing_state');
  });

  it('fails on Runtime intent ahead of checkpoint', () => {
    const result = reconcileRecoveryState(
      baseInput({
        runtime: {
          checkpointEventId: 'evt-10',
          checkpointStreamId: 'stream-1',
          checkpointSequence: 10,
          deploymentId: 'deployment-1',
          intents: [
            {
              intentId: 'intent-ahead',
              sessionId: 'session-1',
              deploymentId: 'deployment-1',
              eventId: 'evt-11',
              streamId: 'stream-1',
              sequence: 11,
            },
          ],
        },
      }),
    );
    expect(result.failedContext).toBe('strategy_runtime');
    expect(result.reason).toContain('ahead of checkpoint');
  });

  it('fails on Risk decision session mismatch', () => {
    const risk: RecoveryRiskSnapshot = {
      killSwitchActive: false,
      decisions: [{ orderId: 'ord-1', status: 'approved', sessionId: 'other' }],
    };
    const result = reconcileRecoveryState(baseInput({ risk }));
    expect(result.failedContext).toBe('risk');
  });

  it('orders mismatch findings deterministically', () => {
    const a = reconcileRecoveryState(
      baseInput({
        session: session({ fencingToken: 1 }),
        accounting: {
          status: 'mismatch',
          sourceHash: 'x',
          rebuiltHash: 'y',
          reason: 'acct',
        },
      }),
    );
    const b = reconcileRecoveryState(
      baseInput({
        accounting: {
          status: 'mismatch',
          sourceHash: 'x',
          rebuiltHash: 'y',
          reason: 'acct',
        },
        session: session({ fencingToken: 1 }),
      }),
    );
    expect(a.mismatches).toEqual(b.mismatches);
    expect(a.failedContext).toBe('session');
  });
});
