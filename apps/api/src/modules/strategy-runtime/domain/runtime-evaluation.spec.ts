import { describe, expect, it } from 'vitest';
import { approveStrategyDeployment, createStrategyDeployment } from '../../strategy-deployment';
import { createEvaluationCandle } from './evaluation-candle';
import { decideRuntimeEvaluation, EvaluationOutcomeKind } from './runtime-evaluation';
import { SignalIntentDirection } from './signal-intent';

const at = '2026-07-29T18:00:00.000Z';

function deployment(parameters: Record<string, unknown> = {}) {
  const draft = createStrategyDeployment({
    id: 'deployment-1',
    workspaceId: 'workspace-1',
    strategyId: 'strategy-1',
    strategyVersion: '1.0.0',
    parameters,
    instrument: 'BTCUSDT',
    timeframe: '1h',
    marketDataSourceId: 'binance-spot',
    paperExecutionConfigurationId: 'paper-config',
    riskPolicyId: 'risk-1',
    riskPolicyVersion: 1,
    createdAt: at,
    recordedAt: at,
    actorId: 'trader-1',
    idempotencyKey: `idem-${JSON.stringify(parameters)}`,
  });
  return approveStrategyDeployment(draft, {
    approvedAt: at,
    approvedByActorId: 'admin-1',
    recordedAt: at,
  });
}

function candle(overrides: Partial<Parameters<typeof createEvaluationCandle>[0]> = {}) {
  return createEvaluationCandle({
    eventId: 'evt-11',
    workspaceId: 'workspace-1',
    streamId: 'binance:btcusdt:1h',
    sequence: 11,
    openTime: '2026-07-29T17:00:00.000Z',
    closeTime: '2026-07-29T17:59:59.999Z',
    instrument: 'BTCUSDT',
    timeframe: '1h',
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 12,
    ...overrides,
  });
}

describe('US219 — deterministic runtime evaluation', () => {
  it('emits SIGNAL_INTENT for explicit buy/sell actions', () => {
    const buy = decideRuntimeEvaluation({
      deployment: deployment({ action: 'buy', confidence: 0.8 }),
      candle: candle(),
    });
    expect(buy).toMatchObject({
      kind: EvaluationOutcomeKind.SIGNAL_INTENT,
      direction: SignalIntentDirection.BUY,
      confidence: 0.8,
    });

    const sell = decideRuntimeEvaluation({
      deployment: deployment({ action: 'sell' }),
      candle: candle(),
    });
    expect(sell.kind).toBe(EvaluationOutcomeKind.SIGNAL_INTENT);
    if (sell.kind === EvaluationOutcomeKind.SIGNAL_INTENT) {
      expect(sell.direction).toBe(SignalIntentDirection.SELL);
    }
  });

  it('returns NO_ACTION for hold and default parameters', () => {
    expect(
      decideRuntimeEvaluation({
        deployment: deployment({ action: 'hold' }),
        candle: candle(),
      }).kind,
    ).toBe(EvaluationOutcomeKind.NO_ACTION);

    expect(
      decideRuntimeEvaluation({
        deployment: deployment({}),
        candle: candle(),
      }).kind,
    ).toBe(EvaluationOutcomeKind.NO_ACTION);
  });

  it('compares close to open deterministically when configured', () => {
    const bullish = decideRuntimeEvaluation({
      deployment: deployment({ compareCloseToOpen: true }),
      candle: candle({ open: 100, close: 105, high: 110, low: 95 }),
    });
    expect(bullish).toMatchObject({
      kind: EvaluationOutcomeKind.SIGNAL_INTENT,
      direction: SignalIntentDirection.BUY,
    });

    const flat = decideRuntimeEvaluation({
      deployment: deployment({ compareCloseToOpen: true }),
      candle: candle({ open: 100, close: 100, high: 100, low: 100 }),
    });
    expect(flat.kind).toBe(EvaluationOutcomeKind.NO_ACTION);
  });

  it('is replay-stable for identical deployment + candle', () => {
    const input = {
      deployment: deployment({ compareCloseToOpen: true, confidence: 0.5 }),
      candle: candle(),
    };
    expect(decideRuntimeEvaluation(input)).toEqual(decideRuntimeEvaluation(input));
  });

  it('rejects instrument/timeframe mismatches', () => {
    expect(() =>
      decideRuntimeEvaluation({
        deployment: deployment({ action: 'buy' }),
        candle: candle({ instrument: 'ETHUSDT' }),
      }),
    ).toThrow(/instrument must match deployment/);
  });
});
