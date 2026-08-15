import { describe, expect, it } from 'vitest';
import { runtimeValidationReasonLabel } from './runtime-validation-reason';

describe('Runtime validation reason labels (PC-04)', () => {
  it('maps locked catalog codes without inventing new reasons', () => {
    expect(runtimeValidationReasonLabel('strategy_not_found')).toContain('Strategy Library');
    expect(runtimeValidationReasonLabel('envelope_violation')).toContain('envelope');
    expect(runtimeValidationReasonLabel('unknown_code')).toBe('unknown_code');
  });
});
