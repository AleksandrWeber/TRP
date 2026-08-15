import { describe, expect, it } from 'vitest';
import { mapCertificationDomainError } from './certification-reason';

describe('mapCertificationDomainError', () => {
  it('maps required evidence and envelope failures onto contract reason codes', () => {
    expect(
      mapCertificationDomainError(
        new Error('certification missing required evidence type: backtesting'),
      ),
    ).toBe('missing_evidence_backtesting');
    expect(
      mapCertificationDomainError(
        new Error('certification missing required evidence type: walk-forward'),
      ),
    ).toBe('missing_evidence_walk_forward');
    expect(
      mapCertificationDomainError(
        new Error('tactical envelope allowedMarkets must include StrategyVersion market'),
      ),
    ).toBe('invalid_envelope');
    expect(
      mapCertificationDomainError(
        new Error('StrategyVersion fam-x version 1.0.0 already has an active certification'),
      ),
    ).toBe('version_already_certified');
    expect(mapCertificationDomainError(new Error('certifiedBy is required (human operator)'))).toBe(
      'certified_by_required',
    );
  });
});
