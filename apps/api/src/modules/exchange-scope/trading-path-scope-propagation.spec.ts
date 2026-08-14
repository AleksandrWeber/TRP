import { describe, expect, it } from 'vitest';
import {
  assertSameExchangeScope,
  DEFAULT_BINANCE_EXCHANGE_SCOPE_ID,
  resolveExchangeScopeId,
  sameExchangeScope,
} from '../exchange-scope';
import { createOrderIntent, OrderSide, OrderType } from '../orders/domain/order-intent';
import { createPaperFill } from '../execution-engine/domain/paper-fill';
import { applyFillToPosition } from '../positions/domain/position';
import {
  createLedgerTransaction,
  LedgerAccount,
  LedgerCauseType,
  LedgerDirection,
} from '../ledger/domain/ledger-transaction';
import {
  approveStrategyDeployment,
  createStrategyDeployment,
} from '../strategy-deployment/domain/strategy-deployment';
import { createRuntimeContext } from '../strategy-runtime/domain/runtime-context';
import {
  createSignalIntent,
  SignalIntentDirection,
} from '../strategy-runtime/domain/signal-intent';
import { M2_PAPER_FILL_CONFIGURATION } from '../execution-adapter';

const TS = '2026-08-14T12:00:00.000Z';
const PRECISION = M2_PAPER_FILL_CONFIGURATION.precision;

describe('RC-27 Epic 4 — trading-path Exchange Scope propagation', () => {
  it('defaults Order / Fill / Ledger / Deployment / Runtime / Signal to Binance', () => {
    const intent = createOrderIntent({
      clientOrderId: 'c1',
      idempotencyKey: 'i1',
      workspaceId: 'ws',
      paperAccountId: 'acct',
      tradingSessionId: 'sess',
      sessionFencingToken: 1,
      mode: 'paper',
      origin: 'manual',
      instrument: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      quantity: '1',
      marketCheckpoint: { streamId: 's', sequence: 1, eventId: 'e' },
      actorId: 'a',
      occurredAt: TS,
      recordedAt: TS,
    });
    expect(intent.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);

    const fill = createPaperFill({
      workspaceId: 'ws',
      exchangeScopeId: intent.exchangeScopeId,
      orderId: intent.orderId,
      paperAccountId: 'acct',
      tradingSessionId: 'sess',
      adapterOrderId: 'ao',
      executionContextHash: 'h',
      configurationId: 'cfg',
      configurationVersion: 1,
      configurationHash: 'ch',
      fact: {
        adapterFillId: 'af',
        sequence: 1,
        instrument: 'BTCUSDT',
        side: 'buy',
        price: '100',
        quantity: '1',
        grossNotional: '100',
        fee: '0.1',
        occurredAt: TS,
      },
      recordedAt: TS,
    });
    expect(fill.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);

    const ledger = createLedgerTransaction({
      workspaceId: 'ws',
      exchangeScopeId: fill.exchangeScopeId,
      paperAccountId: 'acct',
      idempotencyKey: 'ldg-1',
      causeType: LedgerCauseType.OPENING_CAPITAL,
      causeId: 'acct',
      currency: 'USDT',
      occurredAt: TS,
      recordedAt: TS,
      actorId: 'a',
      entries: [
        { account: LedgerAccount.AVAILABLE_CASH, direction: LedgerDirection.DEBIT, amount: '10' },
        {
          account: LedgerAccount.ADJUSTMENT_COMPENSATION,
          direction: LedgerDirection.CREDIT,
          amount: '10',
        },
      ],
    });
    expect(ledger.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);

    const draft = createStrategyDeployment({
      id: 'dep-1',
      workspaceId: 'ws',
      strategyId: 'strat',
      strategyVersion: '1.0.0',
      parameters: {},
      instrument: 'BTCUSDT',
      timeframe: '1m',
      marketDataSourceId: 'mds',
      paperExecutionConfigurationId: 'pec',
      riskPolicyId: 'rp',
      riskPolicyVersion: 1,
      createdAt: TS,
      recordedAt: TS,
      actorId: 'a',
      idempotencyKey: 'dep-idem',
    });
    const deployment = approveStrategyDeployment(draft, {
      approvedAt: TS,
      approvedByActorId: 'a',
      recordedAt: TS,
    });
    expect(deployment.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);

    const context = createRuntimeContext({
      workspaceId: 'ws',
      sessionId: 'sess',
      deployment,
    });
    expect(context.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);

    const signal = createSignalIntent({
      workspaceId: 'ws',
      exchangeScopeId: context.exchangeScopeId,
      deploymentId: deployment.id,
      sessionId: 'sess',
      strategyVersion: deployment.strategyVersion,
      instrument: 'BTCUSDT',
      timeframe: '1m',
      direction: SignalIntentDirection.BUY,
      marketCheckpoint: { streamId: 's', sequence: 1, eventId: 'e' },
      generatedAt: TS,
      recordedAt: TS,
      actorId: 'a',
    });
    expect(signal.exchangeScopeId).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
  });

  it('rejects cross-scope Position application', () => {
    const fill = createPaperFill({
      workspaceId: 'ws',
      exchangeScopeId: 'exchange-scope:bybit',
      orderId: 'ord',
      paperAccountId: 'acct',
      tradingSessionId: 'sess',
      adapterOrderId: 'ao',
      executionContextHash: 'h',
      configurationId: 'cfg',
      configurationVersion: 1,
      configurationHash: 'ch',
      fact: {
        adapterFillId: 'af1',
        sequence: 1,
        instrument: 'BTCUSDT',
        side: 'buy',
        price: '100',
        quantity: '1',
        grossNotional: '100',
        fee: '0',
        occurredAt: TS,
      },
      recordedAt: TS,
    });
    const { position } = applyFillToPosition(null, fill, PRECISION, TS);
    expect(position.exchangeScopeId).toBe('exchange-scope:bybit');

    const mismatched = createPaperFill({
      workspaceId: 'ws',
      exchangeScopeId: 'exchange-scope:binance',
      orderId: 'ord2',
      paperAccountId: 'acct',
      tradingSessionId: 'sess',
      adapterOrderId: 'ao2',
      executionContextHash: 'h',
      configurationId: 'cfg',
      configurationVersion: 1,
      configurationHash: 'ch',
      fact: {
        adapterFillId: 'af2',
        sequence: 1,
        instrument: 'BTCUSDT',
        side: 'buy',
        price: '100',
        quantity: '1',
        grossNotional: '100',
        fee: '0',
        occurredAt: TS,
      },
      recordedAt: TS,
    });
    expect(() => applyFillToPosition(position, mismatched, PRECISION, TS)).toThrow(
      /exchange scope mismatch/,
    );
  });

  it('rejects RuntimeContext when Session scope disagrees with Deployment', () => {
    const draft = createStrategyDeployment({
      id: 'dep-2',
      workspaceId: 'ws',
      exchangeScopeId: 'exchange-scope:binance',
      strategyId: 'strat',
      strategyVersion: '1.0.0',
      parameters: {},
      instrument: 'BTCUSDT',
      timeframe: '1m',
      marketDataSourceId: 'mds',
      paperExecutionConfigurationId: 'pec',
      riskPolicyId: 'rp',
      riskPolicyVersion: 1,
      createdAt: TS,
      recordedAt: TS,
      actorId: 'a',
      idempotencyKey: 'dep-2',
    });
    const deployment = approveStrategyDeployment(draft, {
      approvedAt: TS,
      approvedByActorId: 'a',
      recordedAt: TS,
    });
    expect(() =>
      createRuntimeContext({
        workspaceId: 'ws',
        sessionId: 'sess',
        exchangeScopeId: 'exchange-scope:bybit',
        deployment,
      }),
    ).toThrow(/exchange scope mismatch/);
  });

  it('assertSameExchangeScope helpers stay fail-closed without owning engines', () => {
    expect(resolveExchangeScopeId(undefined)).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
    expect(sameExchangeScope(undefined, 'exchange-scope:binance')).toBe(true);
    expect(() =>
      assertSameExchangeScope('exchange-scope:binance', 'exchange-scope:kraken', 'orders/account'),
    ).toThrow(/orders\/account mismatch/);
  });
});
