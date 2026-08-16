import 'reflect-metadata';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { KnowledgeLakeEntryIdParamDto, ListKnowledgeLakeQueryDto } from './knowledge-lake.dto';

describe('Knowledge Lake DTOs (PC-16)', () => {
  it('accepts existing query filters', () => {
    const dto = Object.assign(new ListKnowledgeLakeQueryDto(), {
      q: 'risk',
      producer: 'risk-engine',
      category: 'Trading',
      mode: 'paper',
      libraryEntryId: 'lib-1',
      reportRunId: 'run-1',
      limit: 20,
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects unknown modes and an oversized limit', () => {
    expect(
      validateSync(Object.assign(new ListKnowledgeLakeQueryDto(), { mode: 'sandbox' })).length,
    ).toBeGreaterThan(0);
    expect(
      validateSync(Object.assign(new ListKnowledgeLakeQueryDto(), { limit: 201 })).length,
    ).toBeGreaterThan(0);
  });

  it('requires an entry id', () => {
    expect(validateSync(new KnowledgeLakeEntryIdParamDto()).length).toBeGreaterThan(0);
    expect(
      validateSync(Object.assign(new KnowledgeLakeEntryIdParamDto(), { entryId: 'evt-1' })),
    ).toHaveLength(0);
  });
});
