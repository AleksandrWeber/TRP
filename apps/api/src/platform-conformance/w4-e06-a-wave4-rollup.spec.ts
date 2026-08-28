import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W4_E06_A_ARCHITECTURE_CLAIMS,
  W4_E06_A_BINDING_FINDINGS,
  W4_E06_A_HONEST_PRODUCT_BASELINE,
  W4_E06_A_TECHNICAL_DEBT_DELTA,
} from './w4-e06-a-wave4-rollup-inventory';
import {
  buildRollupDiagnostics,
  verifyArchitectureIntegrity,
  verifyHonestProductBaseline,
  verifyInventoryCompleteness,
  verifyPackageRollup,
  W4_E06_A_CONSUMED_CLOSE_RECORDS,
  W4_E06_A_CONSUMED_FIV_REPORTS,
  W4_E06_A_REQUIRED_REPORTS,
  W4_E06_A_ROLLUP_SLICE_ID,
} from './w4-e06-a-wave4-rollup';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');

describe('W4-E06-a wave 4 roll-up conformance — unit', () => {
  it('slice id and consumed evidence paths', () => {
    expect(W4_E06_A_ROLLUP_SLICE_ID).toBe('W4-E06-a');
    expect(W4_E06_A_CONSUMED_CLOSE_RECORDS.length).toBe(5);
    expect(W4_E06_A_CONSUMED_FIV_REPORTS.length).toBe(5);
  });

  it('package roll-up verifies all five CLOSED packages', () => {
    const rollup = verifyPackageRollup();
    expect(rollup.ok).toBe(true);
    expect(rollup.allPackagesIndexed).toBe(true);
    expect(rollup.governance.ok).toBe(true);
    expect(rollup.governance.packagesVerified).toBe(5);
  });

  it('honest product baseline distinguishes implemented from infrastructure', () => {
    const honest = verifyHonestProductBaseline();
    expect(honest.ok).toBe(true);
    expect(honest.noCustomerVisibleImplemented).toBe(true);
    expect(honest.infrastructureDocumented).toBe(true);
    expect(honest.deferredExplicit).toBe(true);
    expect(honest.wave4CompleteNotAuthorized).toBe(true);
    expect(W4_E06_A_HONEST_PRODUCT_BASELINE.implementedCapabilities[0]).toContain('None');
  });

  it('architecture integrity: ownership preserved; no duplicate subsystem; no reopen', () => {
    const arch = verifyArchitectureIntegrity();
    expect(arch.ok).toBe(true);
    expect(arch.ownershipUnchanged).toBe(true);
    expect(arch.noDuplicateSubsystem).toBe(true);
    expect(arch.noMasterPlanChange).toBe(true);
    expect(arch.noPackageReopen).toBe(true);
    expect(W4_E06_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W4_E06_A_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W4_E06_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('inventory completeness: no row authorizes Wave 4 COMPLETE', () => {
    const inventory = verifyInventoryCompleteness();
    expect(inventory.ok).toBe(true);
    expect(inventory.noRowAuthorizesWave4Complete).toBe(true);
    expect(inventory.capabilityCount).toBeGreaterThan(0);
  });

  it('binding findings: Engineering cannot declare Wave 4 COMPLETE', () => {
    expect(W4_E06_A_BINDING_FINDINGS.engineeringCanDeclareWave4Complete).toBe(false);
    expect(W4_E06_A_BINDING_FINDINGS.allPackagesClosed).toBe(true);
    expect(W4_E06_A_BINDING_FINDINGS.allPackagesGovernanceVerified).toBe(true);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.liveTradingClaimed).toBe(false);
    expect(W4_E06_A_ARCHITECTURE_CLAIMS.exchangeConnectivityCompleteClaimed).toBe(false);
  });

  it('technical debt delta: inventory resolved; b–e deferred', () => {
    expect(W4_E06_A_TECHNICAL_DEBT_DELTA.resolved).toContain('Wave 4 Roll-Up Inventory Foundation');
    expect(W4_E06_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W4_E06_A_TECHNICAL_DEBT_DELTA.deferred.length).toBe(4);
  });

  it('rollup diagnostics aggregate all verification gates PASS', () => {
    const diagnostics = buildRollupDiagnostics();
    expect(diagnostics.packageRollup.ok).toBe(true);
    expect(diagnostics.honestProduct.ok).toBe(true);
    expect(diagnostics.architecture.ok).toBe(true);
    expect(diagnostics.inventory.ok).toBe(true);
  });
});

describe('W4-E06-a wave 4 roll-up conformance — integration', () => {
  it('consumed Close records and FIV reports exist on disk', () => {
    for (const path of W4_E06_A_CONSUMED_CLOSE_RECORDS) {
      expect(existsSync(join(REPO_ROOT, path))).toBe(true);
    }
    for (const path of W4_E06_A_CONSUMED_FIV_REPORTS) {
      expect(existsSync(join(REPO_ROOT, path))).toBe(true);
    }
  });

  it('required W4-E06-a reports exist on disk', () => {
    for (const name of W4_E06_A_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE4, name))).toBe(true);
    }
  });
});
