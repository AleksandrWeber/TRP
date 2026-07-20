import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { EvaluateSignalBodyDto } from './signal-engine.dto';

describe('Signal Engine DTOs (US009)', () => {
  it('accepts a non-empty strategyId', () => {
    const dto = plainToInstance(EvaluateSignalBodyDto, { strategyId: 'strategy-1' });
    expect(validateSync(dto)).toEqual([]);
  });

  it('rejects a missing strategyId', () => {
    const dto = plainToInstance(EvaluateSignalBodyDto, {});
    expect(validateSync(dto).map((error) => error.property)).toContain('strategyId');
  });

  it('rejects an empty strategyId', () => {
    const dto = plainToInstance(EvaluateSignalBodyDto, { strategyId: '' });
    expect(validateSync(dto).map((error) => error.property)).toContain('strategyId');
  });

  it('rejects a non-string strategyId', () => {
    const dto = plainToInstance(EvaluateSignalBodyDto, { strategyId: 42 });
    expect(validateSync(dto).map((error) => error.property)).toContain('strategyId');
  });
});
