import 'reflect-metadata';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreatePaperAccountBodyDto } from './paper-account.dto';

describe('Paper Account DTOs (PC-13)', () => {
  it('accepts a paper account create', () => {
    const dto = Object.assign(new CreatePaperAccountBodyDto(), {
      currency: 'USDT',
      openingCapital: '100000',
      mode: 'paper',
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects live mode on the product transport', () => {
    const dto = Object.assign(new CreatePaperAccountBodyDto(), {
      currency: 'USDT',
      openingCapital: '100000',
      mode: 'live',
    });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });
});
