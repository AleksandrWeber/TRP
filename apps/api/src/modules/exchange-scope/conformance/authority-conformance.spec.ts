/**
 * RC-27 Epic 6 — Exchange Scope authority conformance.
 *
 * Proves Scope ≠ Runtime ≠ Session ≠ Library ≠ Gate ≠ Risk ≠ Execution ≠ Ledger ≠ Lake.
 * No ownership overlap. No duplicate engines. No reverse Nest command deps.
 * No new product behaviour — verification only.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BINANCE_EXCHANGE_SCOPE_ID,
  resolveExchangeScopeId,
} from '../domain/exchange-scope-identity';
import { assertSameExchangeScope } from '../domain/trading-path-scope';
import {
  EXCHANGE_SCOPE_AUTHORITY_CLASS,
  EXCHANGE_SCOPE_BOUNDARY,
  EXCHANGE_SCOPE_DISTINCT_FROM,
  EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES,
  EXCHANGE_SCOPE_MODULE_ID,
  EXCHANGE_SCOPE_NON_OWNED,
  EXCHANGE_SCOPE_OWNED_CONCERNS,
  exchangeScopeApprovesRisk,
  exchangeScopeForcesTrade,
  exchangeScopeIsExecutionEngine,
  exchangeScopeIsExecutionSourceOfTruth,
  exchangeScopeIsRiskEngine,
  exchangeScopeIsRuntime,
  exchangeScopeIsStrategyLibrary,
  exchangeScopeIsTradingSession,
  exchangeScopeOwnsSessionLifecycle,
  exchangeScopeOwnsStrategyCertification,
  exchangeScopeSubmitsOrders,
} from '../domain/exchange-scope-boundary';
import {
  EXCHANGE_SCOPE_CONSUMER_FLAGS,
  EXCHANGE_SCOPE_CONSUMER_INTENDED,
  EXCHANGE_POLICY_CONSUMER_FLAGS,
} from '../domain/exchange-scope-consumer-read-model';
import { ExchangeScopeModule } from '../exchange-scope.module';
import {
  EXCHANGE_SCOPE_CONSUMER_READ_PORT,
  EXCHANGE_SCOPE_PORTS_ACTIVE,
  EXCHANGE_SCOPE_QUERY_PORT,
  EXCHANGE_SCOPE_SERVICE_PORT,
  type ExchangeScopeConsumerReadPort,
  type ExchangeScopeQueryPort,
  type ExchangeScopeServicePort,
} from '../ports/exchange-scope.port';
import { InMemoryExchangeScopeStore } from '../adapters/in-memory-exchange-scope-store';

const SCOPE_ROOT = join(process.cwd(), 'src/modules/exchange-scope');
const LIBRARY_ROOT = join(process.cwd(), 'src/modules/strategy-library');
const GATE_ROOT = join(process.cwd(), 'src/modules/runtime-enforcement');
const QUAL_ROOT = join(process.cwd(), 'src/modules/market-qualification');
const PROFILE_ROOT = join(process.cwd(), 'src/modules/market-profile');
const STATE_ROOT = join(process.cwd(), 'src/modules/market-state');
const ORCH_ROOT = join(process.cwd(), 'src/modules/trading-orchestrator');
const SESSION_ROOT = join(process.cwd(), 'src/modules/trading-session');
const RUNTIME_ROOT = join(process.cwd(), 'src/modules/strategy-runtime');
const ORDERS_ROOT = join(process.cwd(), 'src/modules/orders');
const RISK_ROOT = join(process.cwd(), 'src/modules/risk');
const EXEC_ROOT = join(process.cwd(), 'src/modules/execution-engine');
const LEDGER_ROOT = join(process.cwd(), 'src/modules/ledger');
const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');
const LAKE_ROOT = join(process.cwd(), 'src/modules/knowledge-lake');
const AI_ROOT = join(process.cwd(), 'src/modules/ai-analytics');

const FORBIDDEN_FROM_SCOPE = [
  '/orders',
  '/risk/',
  '/execution-engine',
  '/ledger',
  '/trading-session',
  '/strategy-runtime',
  '/runtime-enforcement',
  '/strategy-library',
  '/reporting',
  '/ai-analytics',
  '/knowledge-lake',
  '/trading-orchestrator',
  '/market-state',
  '/market-qualification',
  '/market-profile',
] as const;

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...listTsFiles(full));
    else if (full.endsWith('.ts') && !full.endsWith('.spec.ts')) out.push(full);
  }
  return out;
}

function importPaths(source: string): string[] {
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!);
}

function moduleImportsNestSurface(root: string): boolean {
  try {
    for (const file of listTsFiles(root)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        const n = importPath.replace(/\\/g, '/');
        if (n.includes('ExchangeScopeModule')) return true;
        if (n.includes('exchange-scope-boundary')) return true;
        if (n.includes('/ports/exchange-scope.port')) return true;
        if (n.includes('ExchangeScopeLifecycleService')) return true;
        if (n.includes('ExchangeScopeConsumerReadService')) return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

describe('RC-27 Epic 6 — authority conformance', () => {
  it('owns only identity / config / lifecycle / bindings / policy inputs / metadata', () => {
    expect(EXCHANGE_SCOPE_BOUNDARY.authorityClass).toBe(EXCHANGE_SCOPE_AUTHORITY_CLASS);
    expect(EXCHANGE_SCOPE_BOUNDARY.moduleId).toBe(EXCHANGE_SCOPE_MODULE_ID);
    expect(EXCHANGE_SCOPE_BOUNDARY.isolationRole).toBe('isolation-boundary');
    expect(EXCHANGE_SCOPE_BOUNDARY.riskPolicyRole).toBe('policy-input-owner');
    expect(EXCHANGE_SCOPE_OWNED_CONCERNS).toEqual(
      expect.arrayContaining([
        'exchange-scope-identity',
        'exchange-scope-config',
        'exchange-scope-lifecycle',
        'exchange-scope-metadata',
        'exchange-risk-policy-inputs',
        'trading-account-binding',
        'adapter-binding-context',
      ]),
    );
  });

  it('never owns Library / Gate / Qual / Profile / State / Orchestrator / Session / Orders / Execution / Accounting / Reporting', () => {
    expect(EXCHANGE_SCOPE_NON_OWNED).toEqual(
      expect.arrayContaining([
        'strategy-library',
        'runtime-enforcement',
        'market-qualification',
        'market-profile',
        'market-state',
        'trading-orchestrator',
        'trading-session',
        'orders',
        'execution-engine',
        'accounting',
        'reporting',
        'risk-engine',
        'knowledge-lake',
      ]),
    );
    expect(EXCHANGE_SCOPE_DISTINCT_FROM).toEqual(
      expect.arrayContaining([
        'strategy-runtime',
        'trading-session',
        'strategy-library',
        'runtime-enforcement',
        'execution-engine',
        'risk-engine',
        'orders',
        'accounting',
        'reporting',
        'knowledge-lake',
      ]),
    );
    expect(exchangeScopeIsRuntime()).toBe(false);
    expect(exchangeScopeIsTradingSession()).toBe(false);
    expect(exchangeScopeIsStrategyLibrary()).toBe(false);
    expect(exchangeScopeIsExecutionEngine()).toBe(false);
    expect(exchangeScopeIsRiskEngine()).toBe(false);
    expect(exchangeScopeIsExecutionSourceOfTruth()).toBe(false);
    expect(exchangeScopeApprovesRisk()).toBe(false);
    expect(exchangeScopeSubmitsOrders()).toBe(false);
    expect(exchangeScopeForcesTrade()).toBe(false);
    expect(exchangeScopeOwnsSessionLifecycle()).toBe(false);
    expect(exchangeScopeOwnsStrategyCertification()).toBe(false);
  });

  it('forbids engine clones and trading-path command authority', () => {
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toEqual(
      expect.arrayContaining([
        'clone-runtime',
        'clone-orders',
        'clone-execution',
        'clone-accounting',
        'clone-risk-engine',
        'approve-risk',
        'submit-order',
        'submit-execution',
        'mutate-ledger',
        'pick-another-exchange-on-ambiguity',
        'become-execution-source-of-truth',
      ]),
    );
  });

  it('activates planned ports; keeps REST / persistence / transport off', () => {
    expect(EXCHANGE_SCOPE_PORTS_ACTIVE).toEqual({
      exchangeScopeService: true,
      exchangeScopeQuery: true,
      consumerRead: true,
      persistence: true,
      rest: false,
      transport: false,
    });
    expect(EXCHANGE_SCOPE_BOUNDARY.activePorts).toEqual(EXCHANGE_SCOPE_PORTS_ACTIVE);
    expect(EXCHANGE_SCOPE_CONSUMER_INTENDED).toEqual(
      expect.arrayContaining([
        'reporting',
        'ai-analytics',
        'knowledge-lake',
        'command-center',
        'notification-delivery',
        'multi-exchange-ui',
      ]),
    );
    expect(EXCHANGE_SCOPE_CONSUMER_FLAGS.consumerWritable).toBe(false);
    expect(EXCHANGE_POLICY_CONSUMER_FLAGS.isRiskDecision).toBe(false);
  });

  it('keeps Scope imports acyclic — no trading-path / engine module imports', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(SCOPE_ROOT)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const n = importPath.replace(/\\/g, '/');
        for (const forbidden of FORBIDDEN_FROM_SCOPE) {
          if (n.includes(forbidden)) {
            violations.push(`${file.split('/exchange-scope/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('forbids reverse Nest-surface deps from peer engines / consumers', () => {
    expect(moduleImportsNestSurface(LIBRARY_ROOT)).toBe(false);
    expect(moduleImportsNestSurface(GATE_ROOT)).toBe(false);
    expect(moduleImportsNestSurface(QUAL_ROOT)).toBe(false);
    expect(moduleImportsNestSurface(PROFILE_ROOT)).toBe(false);
    expect(moduleImportsNestSurface(STATE_ROOT)).toBe(false);
    expect(moduleImportsNestSurface(ORCH_ROOT)).toBe(false);
    expect(moduleImportsNestSurface(RUNTIME_ROOT)).toBe(false);
    expect(moduleImportsNestSurface(ORDERS_ROOT)).toBe(false);
    expect(moduleImportsNestSurface(RISK_ROOT)).toBe(false);
    expect(moduleImportsNestSurface(EXEC_ROOT)).toBe(false);
    expect(moduleImportsNestSurface(LEDGER_ROOT)).toBe(false);
    expect(moduleImportsNestSurface(REPORTING_ROOT)).toBe(false);
    expect(moduleImportsNestSurface(LAKE_ROOT)).toBe(false);
    expect(moduleImportsNestSurface(AI_ROOT)).toBe(false);
  });

  it('Session may consume identity helpers only — not Nest Scope command surface', () => {
    // RC-19 identity resolve is allowed; Nest lifecycle/consumer Nest surfaces are not.
    expect(moduleImportsNestSurface(SESSION_ROOT)).toBe(false);
  });

  it('consumer / service façades expose no mutation or routing helpers beyond declared ports', async () => {
    const serviceMod = await import('../exchange-scope-lifecycle.service');
    const consumerMod = await import('../exchange-scope-consumer-read.service');
    const adapterMod = await import('../adapters/exchange-scope-consumer-read.adapter');
    expect(serviceMod).not.toHaveProperty('createTradingSession');
    expect(serviceMod).not.toHaveProperty('approveRisk');
    expect(serviceMod).not.toHaveProperty('submitOrder');
    expect(serviceMod).not.toHaveProperty('callExchangeApi');
    expect(serviceMod).not.toHaveProperty('routeToExchange');
    expect(consumerMod).not.toHaveProperty('registerExchangeScope');
    expect(adapterMod).not.toHaveProperty('activateExchangeScope');
  });

  it('default Binance identity remains the single-scope compatibility default', () => {
    expect(resolveExchangeScopeId(undefined)).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
    expect(resolveExchangeScopeId('')).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
    expect(resolveExchangeScopeId('  ')).toBe(DEFAULT_BINANCE_EXCHANGE_SCOPE_ID);
  });

  it('hosts ≥2 concurrent scopes with isolated policy inputs and fail-closed mismatch', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ExchangeScopeModule],
    }).compile();
    const store = moduleRef.get(InMemoryExchangeScopeStore);
    store.clear();
    const service = moduleRef.get<ExchangeScopeServicePort>(EXCHANGE_SCOPE_SERVICE_PORT);
    const query = moduleRef.get<ExchangeScopeQueryPort>(EXCHANGE_SCOPE_QUERY_PORT);
    const consumer = moduleRef.get<ExchangeScopeConsumerReadPort>(
      EXCHANGE_SCOPE_CONSUMER_READ_PORT,
    );

    const binance = service.registerExchangeScope({
      workspaceId: 'ws-audit',
      venueCode: 'binance',
      displayName: 'Binance',
      requestedBy: 'auditor',
      requestedAt: '2026-08-14T21:00:00.000Z',
      maxActiveSessions: 3,
    });
    expect(binance.outcome).toBe('accepted');
    service.activateExchangeScope({
      workspaceId: 'ws-audit',
      exchangeScopeId: 'exchange-scope:binance',
      requestedBy: 'auditor',
      asOf: '2026-08-14T21:01:00.000Z',
    });
    service.publishExchangeRiskPolicy({
      workspaceId: 'ws-audit',
      exchangeScopeId: 'exchange-scope:binance',
      publishedBy: 'auditor',
      limits: { maxExposureLabel: 'binance-10%', maxOrderNotionalLabel: '1000' },
      asOf: '2026-08-14T21:02:00.000Z',
    });

    const bybit = service.registerExchangeScope({
      workspaceId: 'ws-audit',
      venueCode: 'bybit',
      displayName: 'Bybit',
      requestedBy: 'auditor',
      requestedAt: '2026-08-14T21:03:00.000Z',
      maxActiveSessions: 1,
    });
    expect(bybit.outcome).toBe('accepted');
    service.activateExchangeScope({
      workspaceId: 'ws-audit',
      exchangeScopeId: 'exchange-scope:bybit',
      requestedBy: 'auditor',
      asOf: '2026-08-14T21:04:00.000Z',
    });
    service.publishExchangeRiskPolicy({
      workspaceId: 'ws-audit',
      exchangeScopeId: 'exchange-scope:bybit',
      publishedBy: 'auditor',
      limits: { maxExposureLabel: 'bybit-5%', maxOrderNotionalLabel: '500' },
      asOf: '2026-08-14T21:05:00.000Z',
    });

    const listed = query.listExchangeScopes({ workspaceId: 'ws-audit' });
    expect(listed.length).toBe(2);
    expect(listed.every((s) => s.isRuntime === false)).toBe(true);
    expect(listed.every((s) => s.approvesRisk === false)).toBe(true);

    const binancePolicy = consumer.getPolicyInputProjection({
      workspaceId: 'ws-audit',
      exchangeScopeId: 'exchange-scope:binance',
    });
    const bybitPolicy = consumer.getPolicyInputProjection({
      workspaceId: 'ws-audit',
      exchangeScopeId: 'exchange-scope:bybit',
    });
    expect(binancePolicy?.maxExposureLabel).toBe('binance-10%');
    expect(bybitPolicy?.maxExposureLabel).toBe('bybit-5%');
    expect(binancePolicy?.isRiskDecision).toBe(false);
    expect(bybitPolicy?.isRiskDecision).toBe(false);

    const aggregate = consumer.getWorkspaceAggregateProjection({ workspaceId: 'ws-audit' });
    expect(aggregate?.activeCount).toBe(2);
    expect(aggregate?.inventsBalances).toBe(false);
    expect(aggregate?.inventsFills).toBe(false);
    expect(aggregate?.inventsRiskApprovals).toBe(false);

    expect(() =>
      assertSameExchangeScope('exchange-scope:binance', 'exchange-scope:bybit', 'order/account'),
    ).toThrow(/mismatch/);

    // One Risk / Execution / Accounting model — Scope never clones engines.
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain('clone-risk-engine');
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain('clone-execution');
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toContain('clone-accounting');

    await moduleRef.close();
  });
});
