import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_LAKE_BOUNDARY,
  KNOWLEDGE_LAKE_DISTINCT_FROM,
  KNOWLEDGE_LAKE_FORBIDDEN_CAPABILITIES,
  KNOWLEDGE_LAKE_NON_OWNED_SOT,
  knowledgeLakeOwnsBusinessState,
  resolveAuthorityConflict,
} from '../domain/knowledge-lake-boundary';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../ingestion/in-memory-knowledge-lake-ingestion.adapter';
import type { KnowledgeLakeIngestionPort } from '../ports/knowledge-lake-ingestion.port';
import type { KnowledgeLakeQueryPort } from '../ports/knowledge-lake-query.port';
import { KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER } from '../projections/research-lab-producer-registry';
import { KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS } from '../projections/trading-path-producer-registry';

const MODULE_ROOT = join(__dirname, '..');
const MODULES_ROOT = join(__dirname, '..', '..');

const PLANNED_RC21_PRODUCERS = Object.freeze([
  'trading-session',
  'orders',
  'risk-engine',
  'paper-trading',
  'execution-engine',
  'research-lab',
] as const);

const RESERVED_PRODUCERS = Object.freeze(['reporting', 'system', 'market-data'] as const);

const SOT_COMMAND_MODULES = Object.freeze([
  'trading-session/trading-session.service.ts',
  'orders/order.service.ts',
  'risk/risk-decision.service.ts',
  'paper-account/paper-account.service.ts',
  'execution-engine/execution-engine.service.ts',
  'research-campaign/research-campaign.service.ts',
  'experiments/experiments.service.ts',
  'knowledge/knowledge.service.ts',
  'insight/insight-domain.service.ts',
  'recommendation/recommendation-domain.service.ts',
] as const);

function listTsFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTsFiles(path));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(path);
    }
  }
  return files;
}

describe('RC-21 Epic 6 — Authority conformance', () => {
  it('declares Lake as projection only (conformance checklist)', () => {
    expect(KNOWLEDGE_LAKE_BOUNDARY.authorityClass).toBe('projection');
    expect(knowledgeLakeOwnsBusinessState()).toBe(false);
    expect(KNOWLEDGE_LAKE_BOUNDARY.ownershipChain).toEqual([
      'source-of-truth',
      'projection',
      'knowledge-lake',
    ]);
    expect(KNOWLEDGE_LAKE_BOUNDARY.writeSemantics).toBe('append-only');
    expect(KNOWLEDGE_LAKE_BOUNDARY.activePorts).toEqual({
      ingestion: true,
      query: true,
      persistence: false,
      producers: true,
    });
  });

  it('resolves money/order/session conflicts to Source of Truth', () => {
    expect(resolveAuthorityConflict('cash')).toBe('source-of-truth');
    expect(resolveAuthorityConflict('fills')).toBe('source-of-truth');
    expect(resolveAuthorityConflict('orders')).toBe('source-of-truth');
    expect(resolveAuthorityConflict('session-lifecycle')).toBe('source-of-truth');
  });

  it('forbids Lake capabilities that would mutate SoT or admitted facts', () => {
    for (const capability of [
      'mutate-orders',
      'mutate-ledger',
      'mutate-positions',
      'mutate-session-lifecycle',
      'approve-risk',
      'submit-execution',
      'update-admitted-fact',
      'delete-admitted-fact',
      'command-sot-feedback',
    ] as const) {
      expect(KNOWLEDGE_LAKE_FORBIDDEN_CAPABILITIES).toContain(capability);
    }
  });

  it('exposes no SoT mutation surface on Lake ports (negative evidence)', () => {
    const store = new InMemoryKnowledgeLakeIngestionAdapter();
    const ingestion: KnowledgeLakeIngestionPort = store;
    const query: KnowledgeLakeQueryPort = store;

    for (const port of [ingestion, query] as const) {
      expect(port).not.toHaveProperty('update');
      expect(port).not.toHaveProperty('delete');
      expect(port).not.toHaveProperty('overwrite');
      expect(port).not.toHaveProperty('approveRisk');
      expect(port).not.toHaveProperty('submitOrder');
      expect(port).not.toHaveProperty('submitExecution');
      expect(port).not.toHaveProperty('mutateSession');
      expect(port).not.toHaveProperty('mutateLedger');
      expect(port).not.toHaveProperty('mutatePositions');
    }

    expect(typeof ingestion.admit).toBe('function');
    expect(typeof ingestion.admitMany).toBe('function');
    expect(typeof query.getByEventId).toBe('function');
    expect(typeof query.list).toBe('function');
  });

  it('evidences append-only admission (no in-place update/delete)', () => {
    const port = new InMemoryKnowledgeLakeIngestionAdapter();
    const first = port.admit({
      eventId: 'evt-conf-1',
      occurredAt: '2026-08-10T12:00:00.000Z',
      producer: 'orders',
      category: 'Trading',
      mode: 'paper',
      workspaceId: 'ws-1',
      payload: { status: 'proposed' },
      schemaVersion: '1',
    });
    expect(first.outcome).toBe('admitted');

    const duplicate = port.admit({
      eventId: 'evt-conf-1',
      occurredAt: '2026-08-10T12:00:00.000Z',
      producer: 'orders',
      category: 'Trading',
      mode: 'paper',
      workspaceId: 'ws-1',
      payload: { status: 'filled' },
      schemaVersion: '1',
    });
    expect(duplicate.outcome).toBe('duplicate');
    if (first.outcome === 'admitted') {
      expect(port.peekByEventId('evt-conf-1')?.payload).toEqual({
        status: 'proposed',
      });
    }

    const correction = port.admit({
      eventId: 'evt-conf-1-correction',
      occurredAt: '2026-08-10T12:01:00.000Z',
      producer: 'orders',
      category: 'Trading',
      mode: 'paper',
      workspaceId: 'ws-1',
      correlationId: 'evt-conf-1',
      payload: { status: 'filled', compensating: true },
      schemaVersion: '1',
    });
    expect(correction.outcome).toBe('admitted');
    expect(port.peekSize()).toBe(2);
    expect(port.peekByEventId('evt-conf-1')?.payload).toEqual({
      status: 'proposed',
    });
  });

  it('covers planned RC-21 producers only (no unexpected registry entries)', () => {
    const tradingIds = KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS.map((row) => row.producerId);
    const researchId = KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER.producerId;
    const connected = [...tradingIds, researchId].sort();
    expect(connected).toEqual([...PLANNED_RC21_PRODUCERS].sort());

    for (const reserved of RESERVED_PRODUCERS) {
      expect(connected).not.toContain(reserved);
    }

    expect(KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER.feedbackToSoT).toBe(false);
    for (const row of KNOWLEDGE_LAKE_TRADING_PATH_PRODUCERS) {
      expect(row.feedbackToSoT).toBe(false);
      expect(row.direction).toBe('producer-to-lake');
    }
  });

  it('keeps Research domains distinct from Lake (no rebrand)', () => {
    expect(KNOWLEDGE_LAKE_DISTINCT_FROM).toEqual(
      expect.arrayContaining(['knowledge', 'insight', 'recommendation', 'research-report']),
    );
    expect(KNOWLEDGE_LAKE_NON_OWNED_SOT).toEqual(
      expect.arrayContaining([
        'orders',
        'trading-session',
        'risk-engine',
        'execution-engine',
        'ledger',
        'position',
        'fill',
      ]),
    );
  });

  it('has no Lake → SoT feedback imports (one-way only)', () => {
    const lakeSources = listTsFiles(MODULE_ROOT).filter((path) => !path.endsWith('.spec.ts'));
    for (const file of lakeSources) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(
        /TradingSessionService|OrderService|RiskDecisionService|ExecutionEngineService|LedgerService/,
      );
      expect(source).not.toMatch(
        /from '\.\.\/trading-session'|from '\.\.\/orders'|from '\.\.\/risk'|from '\.\.\/execution-engine'|from '\.\.\/ledger'/,
      );
    }

    for (const relative of SOT_COMMAND_MODULES) {
      const source = readFileSync(join(MODULES_ROOT, relative), 'utf8');
      expect(source).not.toMatch(/knowledge-lake|KnowledgeLake|KNOWLEDGE_LAKE/);
    }
  });

  it('does not introduce Kafka/queue/event-sourcing products in Lake module', () => {
    const lakeSources = listTsFiles(MODULE_ROOT).filter((path) => !path.endsWith('.spec.ts'));
    for (const file of lakeSources) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/from ['"]kafkajs['"]/);
      expect(source).not.toMatch(/from ['"]@nestjs\/microservices['"]/);
      expect(source).not.toMatch(/from ['"]bullmq['"]|from ['"]@nestjs\/bull/);
      expect(source).not.toMatch(/\bBullModule\b|\bClientsModule\b/);
      expect(source).not.toMatch(/EventStore|eventStoreClient|EventSourcingModule/);
    }
  });
});
