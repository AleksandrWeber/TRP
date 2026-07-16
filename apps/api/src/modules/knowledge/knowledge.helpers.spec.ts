import { describe, expect, it } from 'vitest';
import {
  buildConclusion,
  buildDedupeKey,
  buildConfigIdentityKey,
  buildResultIdentityKey,
  buildHypothesis,
  buildResearchPayload,
  isLegacyKnowledgePayload,
} from './knowledge.helpers';
import {
  KNOWLEDGE_SCHEMA_VERSION,
  RESEARCH_ENGINE_VERSION,
  VALIDATION_VERSION,
} from './knowledge.version';

describe('knowledge.helpers', () => {
  it('builds stable dedupe keys', () => {
    const configIdentityKey = buildConfigIdentityKey('ema-crossover', 'ds1', 'hash1');
    const expectedResultIdentityKey = buildResultIdentityKey(
      configIdentityKey,
      RESEARCH_ENGINE_VERSION,
      VALIDATION_VERSION,
    );

    expect(
      buildDedupeKey('ema-crossover', 'ds1', 'hash1', RESEARCH_ENGINE_VERSION, VALIDATION_VERSION),
    ).toBe(expectedResultIdentityKey);
  });

  it('builds hypothesis from strategy params and market', () => {
    expect(buildHypothesis('donchian-breakout', { channelPeriod: 20 }, 'BTCUSDT', '1h')).toBe(
      'donchian-breakout (channelPeriod=20) on BTCUSDT 1h can achieve validated performance',
    );
  });

  it('builds conclusion from verdict and reasons', () => {
    expect(
      buildConclusion('ema-crossover', 'BTCUSDT', '1h', 'fail', [
        'Profit factor too low (0.35)',
        'Non-positive expectancy',
      ]),
    ).toBe(
      'ema-crossover on BTCUSDT 1h: FAIL. Profit factor too low (0.35); Non-positive expectancy',
    );
  });

  it('builds full research payload with required fields', () => {
    const payload = buildResearchPayload({
      strategyId: 'ema-crossover',
      params: { emaFast: 12, emaSlow: 20 },
      datasetId: 'dataset-1',
      configHash: 'cfg-hash',
      researchEngineVersion: RESEARCH_ENGINE_VERSION,
      validationVersion: VALIDATION_VERSION,
      knowledgeSchemaVersion: KNOWLEDGE_SCHEMA_VERSION,
      gitCommit: 'abc12345',
      metrics: { tradeCount: 42, expectancy: -10 },
      validation: { verdict: 'fail', reasons: ['Non-positive expectancy'] },
      verdict: 'fail',
      dataset: {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        barCount: 1000,
        contentHash: 'content-hash',
      },
      experimentCreatedAt: new Date('2026-07-16T08:00:00.000Z'),
    });

    expect(payload.configIdentityKey).toBe(
      buildConfigIdentityKey('ema-crossover', 'dataset-1', 'cfg-hash'),
    );
    expect(payload.resultIdentityKey).toBe(
      `ema-crossover:dataset-1:cfg-hash:${RESEARCH_ENGINE_VERSION}:${VALIDATION_VERSION}`,
    );
    expect(payload.dedupeKey).toBe(
      `ema-crossover:dataset-1:cfg-hash:${RESEARCH_ENGINE_VERSION}:${VALIDATION_VERSION}`,
    );
    expect(payload.hypothesis).toContain('ema-crossover');
    expect(payload.evidence.metrics.tradeCount).toBe(42);
    expect(payload.conclusion).toContain('FAIL');
    expect(payload.strategyId).toBe('ema-crossover');
    expect(payload.params).toEqual({ emaFast: 12, emaSlow: 20 });
    expect(payload.datasetId).toBe('dataset-1');
    expect(payload.configHash).toBe('cfg-hash');
    expect(payload.validation.verdict).toBe('fail');
    expect(payload.researchEngineVersion).toBe(RESEARCH_ENGINE_VERSION);
    expect(payload.validationVersion).toBe(VALIDATION_VERSION);
    expect(payload.knowledgeSchemaVersion).toBe(KNOWLEDGE_SCHEMA_VERSION);
    expect(payload.provenance.gitCommit).toBe('abc12345');
  });

  it('detects legacy payloads by structure, not by version number', () => {
    expect(
      isLegacyKnowledgePayload({
        dedupeKey: 'ema-crossover:dataset-1:cfg-hash',
      }),
    ).toBe(true);

    expect(
      isLegacyKnowledgePayload({
        dedupeKey: 'ema-crossover:dataset-1:cfg-hash:1:1',
        configIdentityKey: 'ema-crossover:dataset-1:cfg-hash',
        resultIdentityKey: 'ema-crossover:dataset-1:cfg-hash:1:1',
        researchEngineVersion: '1',
        validationVersion: '1',
      }),
    ).toBe(false);
  });

  it('Result Identity invariants', () => {
    const configIdentityKey = buildConfigIdentityKey('donchian-breakout', 'ds1', 'hash1');

    const rSame1 = buildResultIdentityKey(configIdentityKey, 'engineA', 'validationA');
    const rSame2 = buildResultIdentityKey(configIdentityKey, 'engineA', 'validationA');
    expect(rSame1).toBe(rSame2);

    const rSameConfigNewEngine = buildResultIdentityKey(
      configIdentityKey,
      'engineB',
      'validationA',
    );
    expect(rSameConfigNewEngine).not.toBe(rSame1);
  });
});
