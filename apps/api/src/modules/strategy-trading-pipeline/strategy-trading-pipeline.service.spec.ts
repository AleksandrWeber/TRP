import { describe, expect, it, vi } from 'vitest';
import { EvaluationStatus } from '../strategy-runtime/domain/evaluation-result';
import { EvaluationOutcomeKind } from '../strategy-runtime/domain/runtime-evaluation';
import { StrategyTradingPipelineService } from './strategy-trading-pipeline.service';

const at = '2026-07-29T18:00:00.000Z';

function baseCommand() {
  return {
    workspaceId: 'workspace-1',
    sessionId: 'session-1',
    deploymentId: 'deployment-1',
    paperAccountId: 'account-1',
    sessionFencingToken: 1,
    lease: {
      sessionId: 'session-1',
      fencingToken: 1,
      ownerId: 'worker-1',
      expiresAt: '2026-07-29T19:00:00.000Z',
      sessionStatus: 'RUNNING' as const,
    },
    event: {
      eventType: 'MarketClosedCandle' as const,
      eventId: 'evt-1',
      workspaceId: 'workspace-1',
      streamId: 'binance:BTCUSDT:1h',
      sequence: 1,
      openTime: '2026-07-29T17:00:00.000Z',
      closeTime: '2026-07-29T17:59:59.999Z',
      instrument: 'BTCUSDT',
      timeframe: '1h',
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      volume: 10,
    },
    quantity: '1',
    reservation: { currency: 'USDT', amount: '120' },
    risk: {
      account: {
        id: 'account-1',
        workspaceId: 'workspace-1',
        mode: 'paper',
        status: 'active',
        version: 1,
      },
      session: {
        id: 'session-1',
        workspaceId: 'workspace-1',
        paperAccountId: 'account-1',
        status: 'running',
        version: 1,
        fencingToken: 1,
        reconciled: true,
      },
      cash: {
        workspaceId: 'workspace-1',
        paperAccountId: 'account-1',
        currency: 'USDT',
        availableCash: '10000',
        version: 1,
        reconciled: true,
      },
      reservation: null,
      position: null,
      portfolio: {
        workspaceId: 'workspace-1',
        paperAccountId: 'account-1',
        checkpointId: 'pf-1',
        version: 1,
        reconciled: true,
      },
      duplicateIntent: false,
      unresolvedReconciliation: false,
    },
    referencePrice: '105',
    nowIso: at,
    recordedAt: at,
    actorId: 'pipeline-1',
  };
}

describe('US223 — StrategyTradingPipelineService', () => {
  it('returns no_action without proposing Orders', async () => {
    const runtime = {
      evaluate: vi.fn(async () =>
        Object.freeze({
          status: EvaluationStatus.COMPLETED,
          outcomeKind: EvaluationOutcomeKind.NO_ACTION,
          decision: { kind: EvaluationOutcomeKind.NO_ACTION, reason: 'hold' },
          intent: null,
          intentCreated: false,
          checkpoint: { id: 'cp-1' },
          checkpointAdvanced: true,
          admissionStatus: null,
          reason: 'hold',
          eventId: 'evt-1',
        }),
      ),
    };
    const proposals = { proposeOrderFromSignalIntent: vi.fn() };
    const path = { runCanonicalPath: vi.fn() };
    const accounting = { process: vi.fn() };
    const service = new StrategyTradingPipelineService(
      runtime as never,
      proposals as never,
      path as never,
      accounting as never,
    );

    const result = await service.run(baseCommand());
    expect(result.outcome).toBe('no_action');
    expect(proposals.proposeOrderFromSignalIntent).not.toHaveBeenCalled();
    expect(path.runCanonicalPath).not.toHaveBeenCalled();
    expect(accounting.process).not.toHaveBeenCalled();
  });

  it('wires SignalIntent → proposal → canonical path → accounting', async () => {
    const intent = {
      id: 'si_1',
      intentHash: 'hash-1',
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      instrument: 'BTCUSDT',
      direction: 'buy',
      marketCheckpoint: { streamId: 'binance:BTCUSDT:1h', sequence: 1, eventId: 'evt-1' },
      generatedAt: '2026-07-29T17:59:59.999Z',
      actorId: 'runtime-1',
      correlationId: null,
    };
    const order = {
      id: 'ord_1',
      intent: { origin: 'strategy', signalIntentId: 'si_1', signalIntentHash: 'hash-1' },
    };
    const fill = { id: 'fill_1', orderId: 'ord_1' };
    const runtime = {
      evaluate: vi.fn(async () =>
        Object.freeze({
          status: EvaluationStatus.COMPLETED,
          outcomeKind: EvaluationOutcomeKind.SIGNAL_INTENT,
          decision: {
            kind: EvaluationOutcomeKind.SIGNAL_INTENT,
            direction: 'buy',
            confidence: 0.7,
            reason: 'buy',
          },
          intent,
          intentCreated: true,
          checkpoint: { id: 'cp-1' },
          checkpointAdvanced: true,
          admissionStatus: null,
          reason: 'buy',
          eventId: 'evt-1',
        }),
      ),
    };
    const proposals = {
      proposeOrderFromSignalIntent: vi.fn(async () => order),
    };
    const path = {
      runCanonicalPath: vi.fn(async () => ({
        outcome: 'filled',
        order,
        riskDecision: { id: 'risk-1', status: 'approved' },
        execution: { order, fill, outcome: 'filled' },
      })),
    };
    const accounting = {
      process: vi.fn(async () => ({
        outcome: 'applied',
        position: { id: 'pos-1', quantity: '1' },
        ledgerTransaction: { id: 'ledger-1' },
      })),
    };
    const service = new StrategyTradingPipelineService(
      runtime as never,
      proposals as never,
      path as never,
      accounting as never,
    );

    const result = await service.run(baseCommand());
    expect(result.outcome).toBe('filled');
    expect(result.signalIntent).toBe(intent);
    expect(result.fill).toBe(fill);
    expect(result.accounting?.outcome).toBe('applied');
    expect(proposals.proposeOrderFromSignalIntent).toHaveBeenCalledOnce();
    expect(path.runCanonicalPath).toHaveBeenCalledOnce();
    expect(accounting.process).toHaveBeenCalledOnce();
  });
});
