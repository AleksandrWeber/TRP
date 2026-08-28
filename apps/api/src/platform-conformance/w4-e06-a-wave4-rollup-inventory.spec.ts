import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W4_E06_A_ARCHITECTURE_CLAIMS,
  W4_E06_A_ARTIFACT_KINDS,
  W4_E06_A_BINDING_FINDINGS,
  W4_E06_A_CAPABILITY_CATEGORIES,
  W4_E06_A_COMPLETED_PACKAGE_IDS,
  W4_E06_A_DURABILITY_CLASSES,
  W4_E06_A_HONEST_PRODUCT_BASELINE,
  W4_E06_A_PACKAGE_GOVERNANCE,
  W4_E06_A_REQUIRED_ARTIFACT_KINDS,
  W4_E06_A_SLICE_ID,
  W4_E06_A_WAVE_CAPABILITY_INVENTORY,
  capabilityIds,
  packageIds,
  rowsByCategory,
  rowsByKind,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsSurvive,
  verifyAllPackagesGovernance,
} from './w4-e06-a-wave4-rollup-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W4-E06-a wave 4 roll-up inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(W4_E06_A_WAVE_CAPABILITY_INVENTORY.map((row) => row.kind));
    for (const kind of W4_E06_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W4_E06_A_ARTIFACT_KINDS).toEqual([...W4_E06_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: capability ids are unique and non-empty', () => {
    const ids = capabilityIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('package governance: all five completed packages indexed with unique ids', () => {
    expect(W4_E06_A_COMPLETED_PACKAGE_IDS).toEqual([
      'W4-E01',
      'W4-E02',
      'W4-E03',
      'W4-E04',
      'W4-E05',
    ]);
    expect(packageIds()).toEqual([...W4_E06_A_COMPLETED_PACKAGE_IDS]);
    expect(W4_E06_A_PACKAGE_GOVERNANCE.length).toBe(5);
  });

  it('package governance: every package passes all verification gates', () => {
    const result = verifyAllPackagesGovernance();
    expect(result.ok).toBe(true);
    expect(result.packagesVerified).toBe(5);
    expect(result.failures).toEqual([]);
    for (const pkg of W4_E06_A_PACKAGE_GOVERNANCE) {
      expect(pkg.packageStatus).toBe('CLOSED');
      expect(pkg.planningCompleted).toBe(true);
      expect(pkg.planningApproved).toBe(true);
      expect(pkg.slicesCompleted).toBe(true);
      expect(pkg.fivCompleted).toBe(true);
      expect(pkg.poCloseCompleted).toBe(true);
      expect(pkg.documentationSynchronized).toBe(true);
      expect(pkg.honestProductMaintained).toBe(true);
      expect(pkg.ownershipPreserved).toBe(true);
      expect(pkg.architecturalIntegrityPreserved).toBe(true);
      expect(pkg.foundationDelivered.length).toBeGreaterThan(0);
      expect(pkg.deferredOutcomes.length).toBeGreaterThan(0);
    }
  });

  it('honest product baseline: every category populated; no customer-visible implemented', () => {
    for (const category of W4_E06_A_CAPABILITY_CATEGORIES) {
      expect(rowsByCategory(category).length).toBeGreaterThan(0);
    }
    expect(W4_E06_A_HONEST_PRODUCT_BASELINE.implementedCapabilities[0]).toContain('None');
    expect(
      W4_E06_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length,
    ).toBeGreaterThanOrEqual(5);
    expect(W4_E06_A_HONEST_PRODUCT_BASELINE.governanceCapabilities.length).toBeGreaterThan(0);
    expect(
      W4_E06_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length,
    ).toBeGreaterThanOrEqual(5);
    expect(W4_E06_A_HONEST_PRODUCT_BASELINE.futureRoadmapItems.length).toBeGreaterThanOrEqual(5);
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(W4_E06_A_WAVE_CAPABILITY_INVENTORY.length);
    for (const row of W4_E06_A_WAVE_CAPABILITY_INVENTORY) {
      expect(W4_E06_A_DURABILITY_CLASSES).toContain(row.durabilityClass);
    }
  });

  it('honesty: no row authorizes Wave 4 COMPLETE; binding findings frozen', () => {
    for (const row of W4_E06_A_WAVE_CAPABILITY_INVENTORY) {
      expect(row.authorizesWave4Complete).toBe(false);
    }
    expect(W4_E06_A_BINDING_FINDINGS.wave4CompleteAuthorized).toBe(false);
    expect(W4_E06_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W4_E06_A_BINDING_FINDINGS.honestProductBaselineAccurate).toBe(true);
    expect(W4_E06_A_BINDING_FINDINGS.engineeringCanDeclareWave4Complete).toBe(false);
  });

  it('honesty boundaries and explicit OUT cover reopen, Live Trading, Wave COMPLETE', () => {
    const honesty = rowsHonestyBoundaries();
    expect(honesty.length).toBeGreaterThanOrEqual(4);
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(6);
    const outIds = new Set(out.map((row) => row.capabilityId));
    expect(outIds.has('out-wave4-complete-from-slice-a')).toBe(true);
    expect(outIds.has('out-exchange-connectivity-complete')).toBe(true);
    expect(outIds.has('out-live-trading-wave6')).toBe(true);
    expect(outIds.has('out-w4-e01-reopen')).toBe(true);
    expect(outIds.has('out-w4-e05-reopen')).toBe(true);
  });

  it('package governance rows cover E01…E05 Close records', () => {
    const ids = new Set(packageIds());
    expect(ids.has('W4-E01')).toBe(true);
    expect(ids.has('W4-E02')).toBe(true);
    expect(ids.has('W4-E03')).toBe(true);
    expect(ids.has('W4-E04')).toBe(true);
    expect(ids.has('W4-E05')).toBe(true);
    expect(rowsByKind('package-governance').length).toBeGreaterThanOrEqual(5);
  });
});

describe('W4-E06-a wave 4 roll-up inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W4_E06_A_SLICE_ID).toBe('W4-E06-a');
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.duplicateExchangeSubsystem).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.duplicatePermissionSubsystem).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.engineClonePerVenue).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.wave4CompleteClaimed).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W4_E06_A_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W4_E06_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–3 / W4-E01…E05 unchanged', () => {
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.w4E01Reopened).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.w4E02Reopened).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.w4E03Reopened).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.w4E04Reopened).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.w4E05Reopened).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W4_E06_A_WAVE_CAPABILITY_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
    for (const pkg of W4_E06_A_PACKAGE_GOVERNANCE) {
      expect(existsSync(join(REPO_ROOT, pkg.closeRecordPath))).toBe(true);
      expect(existsSync(join(REPO_ROOT, pkg.fivPath))).toBe(true);
      expect(existsSync(join(REPO_ROOT, pkg.packageSummaryPath))).toBe(true);
    }
  });
});
