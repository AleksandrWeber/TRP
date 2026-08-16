import 'reflect-metadata';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  AiAnalyticsIdParamDto,
  GenerateAiAnalyticsBodyDto,
  ListAiAnalyticsQueryDto,
} from './ai-analytics.dto';

describe('AI Analytics DTOs (PC-17)', () => {
  it('accepts existing generation kinds and report ids', () => {
    const query = Object.assign(new ListAiAnalyticsQueryDto(), {
      kind: 'summarize',
      reportRunId: 'run-1',
      libraryEntryId: 'lib-1',
      q: 'trend',
      limit: 20,
    });
    expect(validateSync(query)).toHaveLength(0);
    const body = Object.assign(new GenerateAiAnalyticsBodyDto(), {
      kind: 'explain',
      reportRunId: 'run-1',
      compareReportRunId: 'run-2',
      focus: 'window',
    });
    expect(validateSync(body)).toHaveLength(0);
  });

  it('rejects unknown kinds and an oversized limit', () => {
    expect(
      validateSync(Object.assign(new ListAiAnalyticsQueryDto(), { kind: 'trade' })).length,
    ).toBeGreaterThan(0);
    expect(
      validateSync(Object.assign(new ListAiAnalyticsQueryDto(), { limit: 201 })).length,
    ).toBeGreaterThan(0);
  });

  it('requires an analysis id', () => {
    expect(validateSync(new AiAnalyticsIdParamDto()).length).toBeGreaterThan(0);
    expect(
      validateSync(Object.assign(new AiAnalyticsIdParamDto(), { analysisId: 'nar-1' })),
    ).toHaveLength(0);
  });
});
