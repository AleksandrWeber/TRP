import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { InMemoryStrategyLibraryCertificationAdapter } from '../strategy-library/adapters/in-memory-strategy-library-certification.adapter';
import { InMemoryStrategyLibraryReadAdapter } from '../strategy-library/adapters/in-memory-strategy-library-read.adapter';
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

const DRIVER_KEYS = [
  'PERSISTENCE_DRIVER',
  'RESEARCH_PERSISTENCE_DRIVER',
  'W3_PERSISTENCE_DRIVER',
] as const;

describe('RC-23 RuntimeEnforcementModule', () => {
  it('registers boundary + Library reads + validateDeployment Gate', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const connect = vi.spyOn(PrismaClient.prototype, '$connect').mockImplementation(async () => {
      throw new Error('Runtime Enforcement module spec must not open a database connection');
    });
    const previous = Object.fromEntries(DRIVER_KEYS.map((key) => [key, process.env[key]]));
    delete process.env.PERSISTENCE_DRIVER;
    process.env.RESEARCH_PERSISTENCE_DRIVER = 'prisma';
    process.env.W3_PERSISTENCE_DRIVER = 'memory';
    try {
      const moduleRef = await Test.createTestingModule({
        imports: [RuntimeEnforcementModule],
      }).compile();
      await moduleRef.init();

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
        persistence: true,
        rest: true,
      });

      expect(moduleRef.get(RuntimeEnforcementLibraryReadService)).toBeDefined();
      expect(moduleRef.get(RuntimeEnforcementGateService)).toBeDefined();
      expect(moduleRef.get(STRATEGY_LIBRARY_LOOKUP_CONSUMER)).toBeDefined();
      expect(moduleRef.get(STRATEGY_LIBRARY_ELIGIBILITY_CONSUMER)).toBeDefined();
      expect(moduleRef.get(InMemoryStrategyLibraryReadAdapter).constructor).toBe(
        InMemoryStrategyLibraryReadAdapter,
      );
      expect(moduleRef.get(InMemoryStrategyLibraryCertificationAdapter).constructor).toBe(
        InMemoryStrategyLibraryCertificationAdapter,
      );

      const gate = moduleRef.get<RuntimeEnforcementPort>(RUNTIME_ENFORCEMENT_PORT);
      expect(typeof gate.validateDeployment).toBe('function');
      const decision = gate.validateDeployment({
        workspaceId: 'ws-1',
        purpose: 'deployment_bind',
        requestedAt: '2026-08-10T16:00:00.000Z',
      });
      expect(decision).not.toBeInstanceOf(Promise);
      expect(decision).toMatchObject({
        outcome: 'fail',
        validation: 'INVALID',
        reasons: ['identity_ambiguous'],
      });
      expect(connect).not.toHaveBeenCalled();

      await moduleRef.close();
    } finally {
      connect.mockRestore();
      for (const key of DRIVER_KEYS) {
        const prior = previous[key];
        if (prior === undefined) delete process.env[key];
        else process.env[key] = prior;
      }
    }
  });
});
