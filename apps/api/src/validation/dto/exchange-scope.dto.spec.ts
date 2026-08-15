import 'reflect-metadata';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  ListExchangeScopesQueryDto,
  RegisterExchangeScopeBodyDto,
  RenameExchangeScopeBodyDto,
  UpdateExchangeScopeConfigBodyDto,
} from './exchange-scope.dto';

describe('Exchange Scope DTOs (PC-12)', () => {
  it('accepts existing lifecycle filters and create fields', () => {
    expect(
      validateSync(Object.assign(new ListExchangeScopesQueryDto(), { lifecycleStatus: 'active' })),
    ).toHaveLength(0);
    expect(
      validateSync(
        Object.assign(new RegisterExchangeScopeBodyDto(), {
          venueCode: 'binance',
          displayName: 'Binance paper',
          modeContext: 'paper',
          maxActiveSessions: 2,
        }),
      ),
    ).toHaveLength(0);
  });

  it('rejects unknown lifecycle and live-capital mode labels that are not in the catalog', () => {
    expect(
      validateSync(Object.assign(new ListExchangeScopesQueryDto(), { lifecycleStatus: 'running' }))
        .length,
    ).toBeGreaterThan(0);
    expect(
      validateSync(Object.assign(new RegisterExchangeScopeBodyDto(), { venueCode: 'binance' }))
        .length,
    ).toBeGreaterThan(0);
    expect(
      validateSync(
        Object.assign(new UpdateExchangeScopeConfigBodyDto(), { modeContext: 'sandbox' }),
      ).length,
    ).toBeGreaterThan(0);
  });

  it('requires a display name to rename', () => {
    expect(validateSync(new RenameExchangeScopeBodyDto()).length).toBeGreaterThan(0);
    expect(
      validateSync(Object.assign(new RenameExchangeScopeBodyDto(), { displayName: 'Cluster A' })),
    ).toHaveLength(0);
  });
});
