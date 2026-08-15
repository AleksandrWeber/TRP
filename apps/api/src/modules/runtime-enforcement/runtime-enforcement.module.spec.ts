import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { RUNTIME_ENFORCEMENT_BOUNDARY } from './domain/runtime-enforcement-boundary';
import {
  RUNTIME_ENFORCEMENT_PORT,
  STRATEGY_LIBRARY_ELIGIBILITY_CONSUMER,
  STRATEGY_LIBRARY_LOOKUP_CONSUMER,
  type RuntimeEnforcementPort,
} from './ports/runtime-enforcement.port';
import { RuntimeEnforcementBoundaryService } from './runtime-enforcement-boundary.service';
import { RuntimeEnforcementGateService } from './runtime-enforcement-gate.service';
import { RuntimeEnforcementLibraryReadService } from './runtime-enforcement-library-read.service';
import { RuntimeEnforcementModule } from './runtime-enforcement.module';

describe('RC-23 RuntimeEnforcementModule', () => {
  it('registers boundary + Library reads + validateDeployment Gate', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RuntimeEnforcementModule],
    }).compile();

    const boundary = moduleRef.get(RuntimeEnforcementBoundaryService);
    expect(boundary.getBoundary()).toBe(RUNTIME_ENFORCEMENT_BOUNDARY);
    expect(boundary.ownsPassFail()).toBe(true);
    expect(boundary.ownsCertification()).toBe(false);
    expect(boundary.selectsStrategies()).toBe(false);
    expect(boundary.validatesDoesNotDecide()).toBe(true);
    expect(boundary.getBoundary().activePorts).toEqual({
      validateDeployment: true,
      libraryLookup: true,
      libraryEligibility: true,
      persistence: false,
      rest: true,
    });

    expect(moduleRef.get(RuntimeEnforcementLibraryReadService)).toBeDefined();
    expect(moduleRef.get(RuntimeEnforcementGateService)).toBeDefined();
    expect(moduleRef.get(STRATEGY_LIBRARY_LOOKUP_CONSUMER)).toBeDefined();
    expect(moduleRef.get(STRATEGY_LIBRARY_ELIGIBILITY_CONSUMER)).toBeDefined();

    const gate = moduleRef.get<RuntimeEnforcementPort>(RUNTIME_ENFORCEMENT_PORT);
    expect(typeof gate.validateDeployment).toBe('function');

    await moduleRef.close();
  });
});
