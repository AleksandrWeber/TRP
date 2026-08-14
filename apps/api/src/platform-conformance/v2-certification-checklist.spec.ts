import { describe, expect, it } from 'vitest';
import {
  V2_ARCHITECTURE_INVARIANTS,
  V2_CERTIFICATION_CHECKLIST,
  V2_CERTIFICATION_DIMENSION_IDS,
  V2_CERTIFICATION_SURFACES,
  V2_CERTIFICATION_VERDICT,
  V2_READINESS,
} from './v2-certification-checklist';
import { V2_PLATFORM_MODULE_IDS } from './v2-platform-modules';
import { V2_RESIDUAL_ITEM_IDS, V2_RESIDUAL_REGISTER } from './v2-residual-register';
import { V2_PLATFORM_BOUNDARY } from './v2-platform-boundary';

describe('RC-28 Epic 6 — certification checklist', () => {
  it('reviews all twelve Version 2 surfaces and eight completeness dimensions as PASS', () => {
    expect(V2_CERTIFICATION_SURFACES).toEqual([...V2_PLATFORM_MODULE_IDS]);
    expect(V2_CERTIFICATION_CHECKLIST.map((row) => row.dimensionId)).toEqual([
      ...V2_CERTIFICATION_DIMENSION_IDS,
    ]);
    for (const row of V2_CERTIFICATION_CHECKLIST) {
      expect(row.result).toBe('PASS');
    }
  });

  it('records READY for Validation & Release without performing validation or tagging', () => {
    expect(V2_CERTIFICATION_VERDICT).toBe('READY');
    expect(V2_READINESS.verdict).toBe('READY');
    expect(V2_READINESS.paperFirst).toBe(true);
    expect(V2_READINESS.liveCapitalAuthorized).toBe(false);
    expect(V2_READINESS.validationPerformed).toBe(false);
    expect(V2_READINESS.gitTagCreated).toBe(false);
    expect(V2_READINESS.newFunctionality).toBe(false);
    expect(V2_READINESS.newApis).toBe(false);
    expect(V2_READINESS.newModules).toBe(false);
    expect(V2_READINESS.newRuntime).toBe(false);
    expect(V2_READINESS.newOwnership).toBe(false);
    expect(V2_READINESS.justification.length).toBeGreaterThan(80);
  });

  it('keeps architecture invariants and residual register non-blocking for paper-first READY', () => {
    expect(V2_ARCHITECTURE_INVARIANTS).toEqual({
      newSourceOfTruth: false,
      ownershipOverlap: false,
      dependencyCycles: false,
      hiddenCommandPaths: false,
      architecturalDrift: false,
    });
    expect(V2_PLATFORM_BOUNDARY.isNewSourceOfTruth).toBe(false);
    expect(V2_PLATFORM_BOUNDARY.isNewApplicationPort).toBe(false);
    expect(V2_PLATFORM_BOUNDARY.isNewRuntime).toBe(false);
    expect(V2_RESIDUAL_REGISTER.map((row) => row.itemId)).toEqual([...V2_RESIDUAL_ITEM_IDS]);
    for (const row of V2_RESIDUAL_REGISTER) {
      expect(row.blocksPaperFirstCertification).toBe(false);
    }
  });
});
