import { describe, expect, it } from 'vitest';
import type { StrategyLibraryRecordView } from '../shared/api';
import {
  buildRuntimeValidationRequest,
  runtimeValidationOutcomeLabel,
  runtimeValidationReasonLabel,
} from './runtime-validation';

const entry: StrategyLibraryRecordView = {
  authorityClass: 'source_of_truth',
  membershipStatus: 'certified',
  strategy: {
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    description: null,
    registryRef: null,
    workspaceId: 'ws-1',
    createdAt: '2026-08-15T12:00:00.000Z',
  },
  version: {
    libraryEntryId: 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h'],
    supportedUniverse: { kind: 'symbols', symbols: ['BTCUSDT'] },
    workspaceId: 'ws-1',
    createdAt: '2026-08-15T12:00:00.000Z',
    immutable: true,
  },
  certification: null,
  eligibility: null,
  tacticalEnvelope: null,
  envelopeState: 'empty',
};

describe('Runtime Validation helpers (PC-04)', () => {
  it('labels PASS / FAIL and locked catalog reasons', () => {
    expect(runtimeValidationOutcomeLabel('pass')).toBe('PASS');
    expect(runtimeValidationOutcomeLabel('fail')).toBe('FAIL');
    expect(runtimeValidationReasonLabel('strategy_not_found')).toContain('Strategy Library');
    expect(runtimeValidationReasonLabel('envelope_violation')).toContain('envelope');
  });

  it('builds a Gate pre-check without deploy or override fields', () => {
    const request = buildRuntimeValidationRequest(entry, ' binance-spot ');
    expect(request.libraryEntryId).toBe('lib-entry-1');
    expect(request.strategyVersion).toBe('1.0.0');
    expect(request.purpose).toBe('deployment_bind');
    expect(request.exchangeScopeId).toBe('binance-spot');
    expect(request).not.toHaveProperty('force');
    expect(request).not.toHaveProperty('override');
  });
});
