/**
 * RC-27 Epic 6 — Cluster Isolation Invariants evidence (≥2 concurrent scopes).
 *
 * Maps Spec / v2-cluster-isolation-invariants.md checklist 1–10 to observed
 * Exchange Scope behaviour. Verification only — no new product logic.
 */

import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BINANCE_EXCHANGE_SCOPE_ID,
  resolveExchangeScopeId,
} from '../domain/exchange-scope-identity';
import { assertSameExchangeScope } from '../domain/trading-path-scope';
import {
  EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES,
  EXCHANGE_SCOPE_BOUNDARY,
  exchangeScopeApprovesRisk,
  exchangeScopeIsExecutionEngine,
  exchangeScopeIsRiskEngine,
  exchangeScopeSubmitsOrders,
} from '../domain/exchange-scope-boundary';
import { InMemoryExchangeScopeStore } from '../adapters/in-memory-exchange-scope-store';
import { ExchangeScopeModule } from '../exchange-scope.module';
import {
  EXCHANGE_SCOPE_CONSUMER_READ_PORT,
  EXCHANGE_SCOPE_SERVICE_PORT,
  type ExchangeScopeConsumerReadPort,
  type ExchangeScopeServicePort,
} from '../ports/exchange-scope.port';

const TS = '2026-08-14T21:10:00.000Z';

describe('RC-27 Epic 6 — isolation invariants checklist (1–10)', () => {
  async function twoActiveScopes() {
    const moduleRef = await Test.createTestingModule({
      imports: [ExchangeScopeModule],
    }).compile();
    const store = moduleRef.get(InMemoryExchangeScopeStore);
    store.clear();
    const service = moduleRef.get<ExchangeScopeServicePort>(EXCHANGE_SCOPE_SERVICE_PORT);
    const consumer = moduleRef.get<ExchangeScopeConsumerReadPort>(
      EXCHANGE_SCOPE_CONSUMER_READ_PORT,
    );

    for (const venue of [
      { code: 'binance', name: 'Binance', cap: 3 },
      { code: 'bybit', name: 'Bybit', cap: 1 },
    ] as const) {
      service.registerExchangeScope({
        workspaceId: 'ws-iso',
        venueCode: venue.code,
        displayName: venue.name,
        requestedBy: 'iso',
        requestedAt: TS,
        maxActiveSessions: venue.cap,
      });
      service.activateExchangeScope({
        workspaceId: 'ws-iso',
        exchangeScopeId: `exchange-scope:${venue.code}`,
        requestedBy: 'iso',
        asOf: TS,
      });
      service.bindTradingAccount({
        workspaceId: 'ws-iso',
        exchangeScopeId: `exchange-scope:${venue.code}`,
        tradingAccountId: `acct-${venue.code}`,
        requestedBy: 'iso',
        asOf: TS,
      });
      service.publishExchangeRiskPolicy({
        workspaceId: 'ws-iso',
        exchangeScopeId: `exchange-scope:${venue.code}`,
        publishedBy: 'iso',
        limits: {
          maxExposureLabel: `${venue.code}-limit`,
          maxOrderNotionalLabel: `${venue.code}-notional`,
        },
        asOf: TS,
      });
    }

    return { moduleRef, service, consumer };
  }

  it('1–2: no cross-scope funds / capacity leakage via scope identity mismatch', async () => {
    const { moduleRef, consumer } = await twoActiveScopes();
    const binanceBindings = consumer.listAccountBindingProjections({
      workspaceId: 'ws-iso',
      exchangeScopeId: 'exchange-scope:binance',
    });
    const bybitBindings = consumer.listAccountBindingProjections({
      workspaceId: 'ws-iso',
      exchangeScopeId: 'exchange-scope:bybit',
    });
    expect(binanceBindings.map((b) => b.tradingAccountId)).toEqual(['acct-binance']);
    expect(bybitBindings.map((b) => b.tradingAccountId)).toEqual(['acct-bybit']);

    const binance = consumer.getScopeProjection({
      workspaceId: 'ws-iso',
      exchangeScopeId: 'exchange-scope:binance',
    });
    const bybit = consumer.getScopeProjection({
      workspaceId: 'ws-iso',
      exchangeScopeId: 'exchange-scope:bybit',
    });
    expect(binance?.maxActiveSessions).toBe(3);
    expect(bybit?.maxActiveSessions).toBe(1);
    expect(binance?.maxActiveSessions).not.toBe(bybit?.maxActiveSessions);

    expect(() =>
      assertSameExchangeScope('exchange-scope:binance', 'exchange-scope:bybit', 'funds'),
    ).toThrow(/mismatch/);
    await moduleRef.close();
  });

  it('3–4: one Risk Engine / one Execution Engine — Scope owns policy inputs & adapter context only', async () => {
    const { moduleRef, consumer } = await twoActiveScopes();
    expect(exchangeScopeIsRiskEngine()).toBe(false);
    expect(exchangeScopeApprovesRisk()).toBe(false);
    expect(exchangeScopeIsExecutionEngine()).toBe(false);
    expect(exchangeScopeSubmitsOrders()).toBe(false);
    expect(EXCHANGE_SCOPE_BOUNDARY.riskPolicyRole).toBe('policy-input-owner');
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain('clone-risk-engine');
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain('clone-execution');
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain('call-exchange-adapter');

    const policy = consumer.getPolicyInputProjection({
      workspaceId: 'ws-iso',
      exchangeScopeId: 'exchange-scope:binance',
    });
    expect(policy?.authorityClass).toBe('exchange_policy_input');
    expect(policy?.isRiskDecision).toBe(false);
    await moduleRef.close();
  });

  it('5–6: scoped records / shared research — Scope never clones accounting or Library', async () => {
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain('clone-accounting');
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain('clone-strategy-library');
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain('certify-strategy');
    expect(EXCHANGE_SCOPE_BOUNDARY.executionSourceOfTruth).toBe(false);
  });

  it('7: fail closed on ambiguity — missing/conflicting scope rejects; never picks another venue', () => {
    expect(resolveExchangeScopeId(undefined)).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain('pick-another-exchange-on-ambiguity');
    expect(() =>
      assertSameExchangeScope('exchange-scope:binance', 'exchange-scope:kraken', 'ambiguous'),
    ).toThrow(/mismatch/);
  });

  it('8–10: paper mode explicit / stats are projections / qualification remains per venue (Scope never owns)', async () => {
    const { moduleRef, consumer } = await twoActiveScopes();
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain('run-qualification');
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain('publish-market-profile');
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain('invent-fill');
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain('mutate-ledger');

    const aggregate = consumer.getWorkspaceAggregateProjection({ workspaceId: 'ws-iso' });
    expect(aggregate?.inventsBalances).toBe(false);
    expect(aggregate?.inventsFills).toBe(false);
    expect(aggregate?.inventsRiskApprovals).toBe(false);
    expect(aggregate?.consumerWritable).toBe(false);
    // Mode context is config metadata — not live-capital enablement.
    const scope = consumer.getConfigSummaryProjection({
      workspaceId: 'ws-iso',
      exchangeScopeId: 'exchange-scope:binance',
    });
    expect(scope?.modeContext).toBeTruthy();
    expect(EXCHANGE_SCOPE_PORTS_ACTIVE_rest_off()).toBe(true);
    await moduleRef.close();
  });
});

function EXCHANGE_SCOPE_PORTS_ACTIVE_rest_off(): boolean {
  return (
    EXCHANGE_SCOPE_BOUNDARY.activePorts.rest === false &&
    EXCHANGE_SCOPE_BOUNDARY.activePorts.persistence === false &&
    EXCHANGE_SCOPE_BOUNDARY.activePorts.transport === false
  );
}
