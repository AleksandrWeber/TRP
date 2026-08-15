import 'reflect-metadata';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  ListReportRunsQueryDto,
  ReportDefinitionIdParamDto,
  ReportRunIdParamDto,
} from './reporting.dto';

describe('Reporting DTOs (PC-05)', () => {
  it('accepts existing query filters', () => {
    const dto = Object.assign(new ListReportRunsQueryDto(), {
      kind: 'ops_daily',
      status: 'completed',
      mode: 'paper',
      q: 'ops',
      limit: 20,
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects unknown kinds, statuses, and modes (no new report types)', () => {
    expect(
      validateSync(Object.assign(new ListReportRunsQueryDto(), { kind: 'pnl_engine' })).length,
    ).toBeGreaterThan(0);
    expect(
      validateSync(Object.assign(new ListReportRunsQueryDto(), { status: 'running' })).length,
    ).toBeGreaterThan(0);
    expect(
      validateSync(Object.assign(new ListReportRunsQueryDto(), { mode: 'sandbox' })).length,
    ).toBeGreaterThan(0);
  });

  it('requires ids and rejects an oversized limit', () => {
    expect(validateSync(new ReportRunIdParamDto()).length).toBeGreaterThan(0);
    expect(
      validateSync(Object.assign(new ReportRunIdParamDto(), { reportRunId: 'run-1' })),
    ).toHaveLength(0);
    expect(
      validateSync(
        Object.assign(new ReportDefinitionIdParamDto(), { reportDefinitionId: 'def-1' }),
      ),
    ).toHaveLength(0);
    expect(
      validateSync(Object.assign(new ListReportRunsQueryDto(), { limit: 201 })).length,
    ).toBeGreaterThan(0);
  });
});
