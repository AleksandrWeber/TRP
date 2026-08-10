import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { STRATEGY_LIBRARY_BOUNDARY } from './domain/strategy-library-boundary';
import { StrategyLibraryBoundaryService } from './strategy-library-boundary.service';
import { StrategyLibraryModule } from './strategy-library.module';

describe('RC-22 StrategyLibraryModule', () => {
  it('registers boundary with full domain active and application ports inactive', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [StrategyLibraryModule],
    }).compile();

    const boundary = moduleRef.get(StrategyLibraryBoundaryService);
    expect(boundary.getBoundary()).toBe(STRATEGY_LIBRARY_BOUNDARY);
    expect(boundary.ownsCertifiedMembership()).toBe(true);
    expect(boundary.registryActiveMeansCertified()).toBe(false);
    expect(boundary.knowledgeLakeOwnsMembership()).toBe(false);
    expect(boundary.getBoundary().activePorts).toEqual({
      registration: false,
      certification: false,
      certificationDomain: true,
      tacticalEnvelopeDomain: true,
      eligibilityDomain: true,
      lifecycleDomain: true,
      lookup: false,
      eligibility: false,
      lifecycle: false,
      persistence: false,
      strategyModel: true,
    });
    expect(boundary.getBoundary().knowledgeLakeRole).toBe('projection-consumer-only');
    expect(boundary.resolveLibraryConflict('certified-membership')).toBe('strategy-library');
    expect(boundary.resolveForeignConflict('knowledge-lake-facts')).toBe(
      'knowledge-lake-projection',
    );

    await moduleRef.close();
  });
});
