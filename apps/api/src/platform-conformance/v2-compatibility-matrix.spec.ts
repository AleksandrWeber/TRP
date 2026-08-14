import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { assertSameExchangeScope } from '../modules/exchange-scope/domain/trading-path-scope';
import { ExchangeScopeModule } from '../modules/exchange-scope/exchange-scope.module';
import { InMemoryExchangeScopeStore } from '../modules/exchange-scope/adapters/in-memory-exchange-scope-store';
import {
  EXCHANGE_SCOPE_CONSUMER_READ_PORT,
  EXCHANGE_SCOPE_SERVICE_PORT,
  type ExchangeScopeConsumerReadPort,
  type ExchangeScopeServicePort,
} from '../modules/exchange-scope/ports/exchange-scope.port';
import { validateDeployment } from '../modules/runtime-enforcement/domain/validate-deployment';
import { V2_APPROVED_PORT_FILES } from './v2-authority-graph';
import { V2_COMPATIBILITY_MATRIX, V2_IDENTITY_KEYS } from './v2-compatibility-matrix';
import { E2E_AS_OF, e2eCertifiedRecord, e2eLibraryReads } from './v2-e2e-fixtures';
import { importPaths, listTsFiles } from './graph-scan';
import { V2_NEST_MODULE_IDS, V2_PLATFORM_MODULE_CATALOG } from './v2-platform-modules';
import { V2_PLATFORM_BOUNDARY } from './v2-platform-boundary';

const API_ROOT = process.cwd();
const SPEC = join(API_ROOT, '../../docs/project/trp-architecture-specification-v2.md');
const MATRIX = join(API_ROOT, '../../docs/project/v2-authority-matrix.md');
const ALIAS = join(API_ROOT, '../../docs/project/v2-alias-dictionary.md');

describe('RC-28 Epic 5 — compatibility matrix', () => {
  it('covers closed RC-19…RC-27 without introducing RC-28 contracts', () => {
    expect(V2_COMPATIBILITY_MATRIX.map((row) => row.rc)).toEqual([
      'RC-19',
      'RC-20',
      'RC-21',
      'RC-22',
      'RC-23',
      'RC-24',
      'RC-25',
      'RC-26',
      'RC-27',
    ]);
    for (const row of V2_COMPATIBILITY_MATRIX) {
      expect(row.newInRc28).toBe(false);
      expect(row.paperFreeze).toBe(true);
      for (const token of row.portTokens) {
        expect(token in V2_APPROVED_PORT_FILES, token).toBe(true);
        expect(
          existsSync(
            join(API_ROOT, V2_APPROVED_PORT_FILES[token as keyof typeof V2_APPROVED_PORT_FILES]),
          ),
        ).toBe(true);
      }
    }
    expect(V2_IDENTITY_KEYS).toEqual([
      'workspaceId',
      'exchangeScopeId',
      'tradingSessionId',
      'libraryEntryId',
    ]);
  });

  it('keeps Spec v2.0 §5 headings, Authority Matrix, and Alias Dictionary as frozen companions', () => {
    expect(existsSync(SPEC)).toBe(true);
    expect(existsSync(MATRIX)).toBe(true);
    expect(existsSync(ALIAS)).toBe(true);
    const spec = readFileSync(SPEC, 'utf8');
    const matrix = readFileSync(MATRIX, 'utf8');
    const alias = readFileSync(ALIAS, 'utf8');
    for (const row of V2_COMPATIBILITY_MATRIX) {
      for (const heading of row.specSections) {
        expect(spec).toContain(heading);
      }
    }
    expect(matrix).toMatch(/Authority Matrix/i);
    expect(alias).toMatch(/Alias Dictionary/i);
    expect(V2_PLATFORM_BOUNDARY.isNewApplicationPort).toBe(false);
    expect(V2_PLATFORM_BOUNDARY.isNewSourceOfTruth).toBe(false);
    expect(V2_PLATFORM_BOUNDARY.isNewRuntime).toBe(false);
  });

  it('keeps documented identity keys on the closed RC contract files', () => {
    for (const row of V2_COMPATIBILITY_MATRIX) {
      const combined = row.identityFiles
        .map((relative) => {
          const path = join(API_ROOT, relative);
          expect(existsSync(path), relative).toBe(true);
          return readFileSync(path, 'utf8');
        })
        .join('\n');
      for (const key of row.identityKeys) {
        expect(combined.includes(key), `${row.rc} missing ${key}`).toBe(true);
      }
    }
  });

  it('preserves the frozen paper path and does not import live-trading-engine from V2 Nest modules', () => {
    const commands = readFileSync(
      join(API_ROOT, '../web/src/command-center/session-commands.ts'),
      'utf8',
    );
    expect(commands).toMatch(/pauseTradingSession/);
    expect(commands).not.toMatch(/submitOrder/);
    expect(commands).not.toMatch(/approveRisk/);

    const hits: string[] = [];
    for (const id of V2_NEST_MODULE_IDS) {
      const dir = V2_PLATFORM_MODULE_CATALOG[id].nestDir;
      if (!dir) continue;
      for (const file of listTsFiles(join(API_ROOT, dir))) {
        const source = readFileSync(file, 'utf8');
        for (const importPath of importPaths(source)) {
          if (importPath.includes('live-trading-engine')) {
            hits.push(`${id}: ${file}`);
          }
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('keeps single-scope Gate pass and multi-scope isolation on existing ports', async () => {
    const record = e2eCertifiedRecord();
    const single = validateDeployment(
      {
        workspaceId: 'ws-1',
        libraryEntryId: record.version.libraryEntryId,
        exchangeScopeId: 'binance-spot',
        purpose: 'deployment_bind',
        requestedAt: E2E_AS_OF,
      },
      e2eLibraryReads(record),
      E2E_AS_OF,
    );
    expect(single.outcome).toBe('pass');
    expect(single.validation).toBe('VALID');

    const moduleRef = await Test.createTestingModule({
      imports: [ExchangeScopeModule],
    }).compile();
    const store = moduleRef.get(InMemoryExchangeScopeStore);
    store.clear();
    const service = moduleRef.get<ExchangeScopeServicePort>(EXCHANGE_SCOPE_SERVICE_PORT);
    const consumer = moduleRef.get<ExchangeScopeConsumerReadPort>(
      EXCHANGE_SCOPE_CONSUMER_READ_PORT,
    );
    for (const venue of ['binance', 'bybit'] as const) {
      service.registerExchangeScope({
        workspaceId: 'ws-compat',
        venueCode: venue,
        displayName: venue,
        requestedBy: 'compat',
        requestedAt: E2E_AS_OF,
        maxActiveSessions: 1,
      });
      service.activateExchangeScope({
        workspaceId: 'ws-compat',
        exchangeScopeId: `exchange-scope:${venue}`,
        requestedBy: 'compat',
        asOf: E2E_AS_OF,
      });
      service.bindTradingAccount({
        workspaceId: 'ws-compat',
        exchangeScopeId: `exchange-scope:${venue}`,
        tradingAccountId: `acct-${venue}`,
        requestedBy: 'compat',
        asOf: E2E_AS_OF,
      });
    }
    expect(
      consumer
        .listAccountBindingProjections({
          workspaceId: 'ws-compat',
          exchangeScopeId: 'exchange-scope:binance',
        })
        .map((row) => row.tradingAccountId),
    ).toEqual(['acct-binance']);
    expect(
      consumer
        .listAccountBindingProjections({
          workspaceId: 'ws-compat',
          exchangeScopeId: 'exchange-scope:bybit',
        })
        .map((row) => row.tradingAccountId),
    ).toEqual(['acct-bybit']);
    expect(() =>
      assertSameExchangeScope('exchange-scope:binance', 'exchange-scope:bybit', 'funds'),
    ).toThrow(/mismatch/);
    await moduleRef.close();
  });
});
