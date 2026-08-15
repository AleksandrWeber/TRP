import 'reflect-metadata';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  ListRuntimeValidationHistoryQueryDto,
  RunRuntimeValidationBodyDto,
  RuntimeValidationIdParamDto,
} from './runtime-validation.dto';

describe('Runtime Validation DTOs (PC-04)', () => {
  it('accepts a library entry pre-check', () => {
    const dto = Object.assign(new RunRuntimeValidationBodyDto(), {
      libraryEntryId: 'lib-entry-1',
      purpose: 'deployment_bind',
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('accepts family + version identity', () => {
    const dto = Object.assign(new RunRuntimeValidationBodyDto(), {
      strategyFamilyId: 'fam-momentum',
      strategyVersion: '1.0.0',
      exchangeScopeId: 'binance-spot',
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects an unknown purpose (no override / soft-pass)', () => {
    const dto = Object.assign(new RunRuntimeValidationBodyDto(), {
      libraryEntryId: 'lib-entry-1',
      purpose: 'force_deploy',
    });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('requires a validation id', () => {
    expect(validateSync(new RuntimeValidationIdParamDto()).length).toBeGreaterThan(0);
    const dto = Object.assign(new RuntimeValidationIdParamDto(), { validationId: 'val-1' });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects a history limit above 200', () => {
    const dto = Object.assign(new ListRuntimeValidationHistoryQueryDto(), { limit: 201 });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });
});
