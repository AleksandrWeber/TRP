import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { ExecutePaperTradeBodyDto } from './paper-trading.dto';

describe('Paper Trading DTOs (US010)', () => {
  it('accepts a non-empty strategyId', () => {
    expect(
      validateSync(plainToInstance(ExecutePaperTradeBodyDto, { strategyId: 'strategy-1' })),
    ).toEqual([]);
  });

  it('rejects missing, empty, and non-string strategy ids', () => {
    for (const input of [{}, { strategyId: '' }, { strategyId: 42 }]) {
      expect(
        validateSync(plainToInstance(ExecutePaperTradeBodyDto, input)).map(
          (error) => error.property,
        ),
      ).toContain('strategyId');
    }
  });
});
