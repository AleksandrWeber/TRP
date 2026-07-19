import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateEvaluationScheduleBodyDto, StrategyIdParamDto } from './evaluation-scheduler.dto';

describe('CreateEvaluationScheduleBodyDto (US015)', () => {
  it('accepts a valid schedule body', () => {
    const dto = plainToInstance(CreateEvaluationScheduleBodyDto, {
      strategyId: 'strategy-1',
      intervalMs: 60_000,
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects missing strategyId', () => {
    const dto = plainToInstance(CreateEvaluationScheduleBodyDto, { intervalMs: 60_000 });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('rejects interval below the minimum', () => {
    const dto = plainToInstance(CreateEvaluationScheduleBodyDto, {
      strategyId: 'strategy-1',
      intervalMs: 999,
    });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('rejects a non-integer interval', () => {
    const dto = plainToInstance(CreateEvaluationScheduleBodyDto, {
      strategyId: 'strategy-1',
      intervalMs: 1500.5,
    });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });
});

describe('StrategyIdParamDto (US015)', () => {
  it('accepts a non-empty strategyId', () => {
    const dto = plainToInstance(StrategyIdParamDto, { strategyId: 'strategy-1' });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects an empty strategyId', () => {
    const dto = plainToInstance(StrategyIdParamDto, { strategyId: '' });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });
});
