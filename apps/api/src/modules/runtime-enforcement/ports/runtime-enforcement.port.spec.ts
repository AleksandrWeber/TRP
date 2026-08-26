import { describe, expect, it } from 'vitest';
import {
  RUNTIME_ENFORCEMENT_PORTS_ACTIVE,
  RUNTIME_ENFORCEMENT_PORT,
  STRATEGY_LIBRARY_ELIGIBILITY_CONSUMER,
  STRATEGY_LIBRARY_LOOKUP_CONSUMER,
} from './runtime-enforcement.port';

describe('RC-23 Epic 3 — Runtime Enforcement ports posture', () => {
  it('activates Library consumers + validateDeployment', () => {
    expect(typeof RUNTIME_ENFORCEMENT_PORT).toBe('symbol');
    expect(typeof STRATEGY_LIBRARY_LOOKUP_CONSUMER).toBe('symbol');
    expect(typeof STRATEGY_LIBRARY_ELIGIBILITY_CONSUMER).toBe('symbol');
    expect(RUNTIME_ENFORCEMENT_PORTS_ACTIVE).toEqual({
      validateDeployment: true,
      libraryLookup: true,
      libraryEligibility: true,
      persistence: true,
      rest: true,
    });
  });
});
