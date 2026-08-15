import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  CertificationAttemptIdParamDto,
  CertifyStrategyVersionBodyDto,
  CheckStrategyLibraryEligibilityQueryDto,
  LibraryEntryIdParamDto,
  ListStrategyLibraryQueryDto,
} from './strategy-library.dto';

describe('Strategy Library DTOs (PC-01)', () => {
  it('accepts an empty list query', () => {
    expect(validateSync(new ListStrategyLibraryQueryDto())).toHaveLength(0);
  });

  it('accepts lookup filters used by the Library browser', () => {
    const dto = Object.assign(new ListStrategyLibraryQueryDto(), {
      strategyFamilyId: 'fam-momentum',
      statuses: 'certified,deprecated',
      exchangeScopeId: 'binance-spot',
      includeArchived: 'true',
      limit: 50,
      q: 'momentum',
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects a limit above 200', () => {
    const dto = Object.assign(new ListStrategyLibraryQueryDto(), { limit: 201 });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('requires a library entry id', () => {
    expect(validateSync(new LibraryEntryIdParamDto()).length).toBeGreaterThan(0);
    const dto = Object.assign(new LibraryEntryIdParamDto(), { libraryEntryId: 'lib-entry-1' });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('accepts an eligibility purpose from the existing port', () => {
    const dto = Object.assign(new CheckStrategyLibraryEligibilityQueryDto(), {
      purpose: 'selection',
      exchangeScopeId: 'binance-spot',
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects an unknown eligibility purpose', () => {
    const dto = Object.assign(new CheckStrategyLibraryEligibilityQueryDto(), {
      purpose: 'force_deploy',
    });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('requires a certification attempt id', () => {
    expect(validateSync(new CertificationAttemptIdParamDto()).length).toBeGreaterThan(0);
    const dto = Object.assign(new CertificationAttemptIdParamDto(), { attemptId: 'attempt-1' });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('accepts a certify body used by the Certification Wizard', () => {
    const dto = plainToInstance(CertifyStrategyVersionBodyDto, {
      family: { name: 'Momentum', registryRef: 'st-1' },
      version: {
        version: '1.0.0',
        contentHash: 'research:st-1:1.0.0',
        market: 'crypto-spot',
        supportedExchangeScopeIds: ['binance-spot'],
        supportedTimeframes: ['1h'],
        supportedSymbols: ['BTCUSDT'],
      },
      evidence: [
        {
          evidenceId: 'ev-bt-1',
          type: 'backtesting',
          sourceRef: { owner: 'backtesting', id: 'bt-1' },
        },
        {
          evidenceId: 'ev-wf-1',
          type: 'walk-forward',
          sourceRef: { owner: 'walk-forward', id: 'wf-1' },
        },
      ],
      tacticalEnvelope: {
        envelopeVersion: 'env-1',
        allowedMarkets: ['crypto-spot'],
        allowedExchangeScopeIds: ['binance-spot'],
        allowedSymbols: ['BTCUSDT'],
        allowedTimeframes: ['1h'],
        riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
        maxPositions: { min: 1, max: 3 },
      },
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects a certify body without evidence', () => {
    const dto = Object.assign(new CertifyStrategyVersionBodyDto(), {
      family: { name: 'Momentum' },
      version: {
        version: '1.0.0',
        contentHash: 'research:st-1:1.0.0',
        market: 'crypto-spot',
        supportedExchangeScopeIds: ['binance-spot'],
        supportedTimeframes: ['1h'],
        supportedSymbols: ['BTCUSDT'],
      },
      evidence: [],
      tacticalEnvelope: {
        envelopeVersion: 'env-1',
        allowedMarkets: ['crypto-spot'],
        allowedExchangeScopeIds: ['binance-spot'],
        allowedSymbols: ['BTCUSDT'],
        allowedTimeframes: ['1h'],
        riskPerTrade: { min: 0.25, max: 1 },
        maxPositions: { min: 1, max: 3 },
      },
    });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });
});
