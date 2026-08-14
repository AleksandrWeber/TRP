import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertBotIsSessionFacade, toBotView } from '../modules/bot-facade/domain/bot-view';
import {
  EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES,
  EXCHANGE_SCOPE_UI_ALIAS,
  exchangeScopeApprovesRisk,
  exchangeScopeIsExecutionEngine,
  exchangeScopeIsRiskEngine,
} from '../modules/exchange-scope/domain/exchange-scope-boundary';
import { assertSameExchangeScope } from '../modules/exchange-scope/domain/trading-path-scope';
import { RUNTIME_ENFORCEMENT_FORBIDDEN_CAPABILITIES } from '../modules/runtime-enforcement/domain/runtime-enforcement-boundary';
import { STRATEGY_LIBRARY_OWNED_CONCERNS } from '../modules/strategy-library/domain/strategy-library-boundary';
import {
  TRADING_ORCHESTRATOR_FORBIDDEN_CAPABILITIES,
  TRADING_ORCHESTRATOR_MODULE_ID,
} from '../modules/trading-orchestrator/domain/trading-orchestrator-boundary';
import { createTradingSession } from '../modules/trading-session/domain/trading-session';
import { importPaths, listTsFiles } from './graph-scan';
import {
  V2_ALIAS_BINDINGS,
  V2_ALIAS_DICTIONARY_PATH,
  V2_AUTHORITY_MATRIX_PATH,
  V2_ISOLATION_INVARIANTS_PATH,
  V2_TACTICS_CONTRACT_PATH,
} from './v2-alias-bindings';
import { V2_AUTHORITY_GRAPH } from './v2-authority-graph';
import { V2_EXTERNAL_SOLE_OWNERS } from './v2-ownership-graph';
import { V2_NEST_MODULE_IDS, V2_PLATFORM_MODULE_CATALOG } from './v2-platform-modules';

const API_ROOT = process.cwd();

describe('RC-28 Epic 3 — module isolation', () => {
  it('binds Alias Dictionary terms without a second aggregate', () => {
    expect(V2_ALIAS_BINDINGS.map((row) => row.productTerm)).toEqual([
      'Bot',
      'Cluster',
      'Wallet',
      'Brain',
    ]);

    const bot = toBotView(
      createTradingSession({
        id: 'session-1',
        workspaceId: 'ws-1',
        exchangeScopeId: 'exchange-scope:binance',
        paperAccountId: 'acct-1',
        deploymentId: 'dep-1',
        origin: 'manual',
        actorId: 'op-1',
        idempotencyKey: 'idem-1',
        createdAt: '2026-08-14T00:00:00.000Z',
        recordedAt: '2026-08-14T00:00:00.000Z',
      }),
    );
    expect(bot.id).toBe(bot.tradingSessionId);
    expect(() => assertBotIsSessionFacade(bot)).not.toThrow();
    expect(existsSync(join(API_ROOT, 'src/modules/bot-facade/bot-facade.service.ts'))).toBe(true);
    const facade = readFileSync(
      join(API_ROOT, 'src/modules/bot-facade/bot-facade.service.ts'),
      'utf8',
    );
    expect(facade).toMatch(/Bot id === Trading Session id/);
    expect(facade).toMatch(/TradingSessionService/);
    const prisma = readFileSync(join(API_ROOT, 'prisma/schema.prisma'), 'utf8');
    expect(prisma).not.toMatch(/\bmodel Bot\b/);

    expect(EXCHANGE_SCOPE_UI_ALIAS).toBe('Cluster');
    expect(V2_EXTERNAL_SOLE_OWNERS.ledger).toBe('accounting');
    expect(TRADING_ORCHESTRATOR_MODULE_ID).toBe('trading-orchestrator');
    expect(TRADING_ORCHESTRATOR_FORBIDDEN_CAPABILITIES).toContain('call-exchange-adapter');
  });

  it('does not modify Authority Matrix, Alias Dictionary, Isolation Invariants, or Tactics Contract', () => {
    const matrix = readFileSync(join(API_ROOT, V2_AUTHORITY_MATRIX_PATH), 'utf8');
    const aliases = readFileSync(join(API_ROOT, V2_ALIAS_DICTIONARY_PATH), 'utf8');
    const isolation = readFileSync(join(API_ROOT, V2_ISOLATION_INVARIANTS_PATH), 'utf8');
    const tactics = readFileSync(join(API_ROOT, V2_TACTICS_CONTRACT_PATH), 'utf8');
    expect(matrix).toMatch(/\*\*Status:\*\* \*\*Approved\*\* \(2026-08-10\)/);
    expect(matrix).toContain('Ledger / Fill / Orders win');
    expect(aliases).toContain('| **Bot**');
    expect(aliases).toContain('**Trading Session**');
    expect(aliases).toContain('| **Cluster**');
    expect(aliases).toContain('**Exchange Scope**');
    expect(aliases).toContain('| **Wallet**');
    expect(aliases).toContain('**Trading Account**');
    expect(aliases).toContain('| **Brain / Trading Brain**');
    expect(aliases).toContain('**Trading Orchestrator**');
    expect(isolation).toContain('1. **No cross-scope funds.**');
    expect(isolation).toContain('10. **Qualification is per venue.**');
    expect(tactics).toContain('**Option B**');
    expect(matrix).not.toMatch(/RC-28 Epic 3/);
    expect(aliases).not.toMatch(/RC-28 Epic 3/);
  });

  it('reuses RC-27 isolation proof for invariants 1–10 (≥2 scopes)', () => {
    expect(() =>
      assertSameExchangeScope('exchange-scope:binance', 'exchange-scope:bybit', 'funds'),
    ).toThrow(/mismatch/);
    expect(exchangeScopeIsRiskEngine()).toBe(false);
    expect(exchangeScopeApprovesRisk()).toBe(false);
    expect(exchangeScopeIsExecutionEngine()).toBe(false);
    expect(EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES).toEqual(
      expect.arrayContaining([
        'clone-risk-engine',
        'clone-execution',
        'clone-accounting',
        'clone-strategy-library',
        'pick-another-exchange-on-ambiguity',
        'run-qualification',
        'invent-fill',
        'mutate-ledger',
      ]),
    );
  });

  it('enforces Tactics Contract Option B at Library ownership and Gate consume', () => {
    expect(STRATEGY_LIBRARY_OWNED_CONCERNS).toContain('tactical-envelope-binding-references');
    expect(RUNTIME_ENFORCEMENT_FORBIDDEN_CAPABILITIES).toContain('mutate-envelope');
    expect(TRADING_ORCHESTRATOR_FORBIDDEN_CAPABILITIES).toContain('expand-tactical-envelope');
    const gate = readFileSync(
      join(API_ROOT, 'src/modules/runtime-enforcement/domain/validate-deployment.ts'),
      'utf8',
    );
    expect(gate).toMatch(/libraryTacticalEnvelopeIsImmutable/);
    expect(gate).toMatch(/envelope_missing/);
    expect(gate).toMatch(/validateEnvelope/);
    const envelope = readFileSync(
      join(API_ROOT, 'src/modules/strategy-library/domain/library-tactical-envelope.ts'),
      'utf8',
    );
    expect(envelope).toMatch(/Tactics Contract Option B/);
  });

  it('isolates V2 Nest modules from Freeze money engines they do not own', () => {
    const forbidden = ['/orders', '/execution-engine', '/ledger', '/risk/'];
    const exempt = new Set(['command-center']);
    const hits: string[] = [];
    for (const moduleId of V2_NEST_MODULE_IDS) {
      if (exempt.has(moduleId)) continue;
      const dir = V2_PLATFORM_MODULE_CATALOG[moduleId].nestDir;
      if (!dir) continue;
      for (const file of listTsFiles(join(API_ROOT, dir))) {
        for (const importPath of importPaths(readFileSync(file, 'utf8'))) {
          for (const fragment of forbidden) {
            if (importPath.includes(fragment)) {
              hits.push(`${moduleId} → ${importPath}`);
            }
          }
        }
      }
    }
    expect(hits).toEqual([]);
    expect(V2_AUTHORITY_GRAPH['notification-delivery'].forbiddenResponsibilities).toContain(
      'pause-trading',
    );
    const emergency = readFileSync(
      join(API_ROOT, '../web/src/command-center/emergency-controls.ts'),
      'utf8',
    );
    expect(emergency).toMatch(/No UI-only kill is allowed/);
  });
});
