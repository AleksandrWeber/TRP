import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifyPackageRollup } from './w4-e06-a-wave4-rollup';
import { W4_E06_A_COMPLETED_PACKAGE_IDS } from './w4-e06-a-wave4-rollup-inventory';
import {
  verifyGovernanceCompleteness,
  verifyPackageExitCriteria,
} from './w4-e06-b-wave-exit-criteria';
import {
  W4_E06_C_ARCHITECTURE_CLAIMS,
  W4_E06_C_BINDING_FINDINGS,
  W4_E06_C_CROSS_PACKAGE_INTEGRATION_CHECKS,
  W4_E06_C_PACKAGE_DEPENDENCY_CHAIN,
  W4_E06_C_PERSISTENCE_OWNERSHIP,
  W4_E06_C_REQUIRED_REPORTS,
  W4_E06_C_SLICE_ID,
  W4_E06_C_TECHNICAL_DEBT_DELTA,
  W4_E06_C_VERIFICATION_DOMAINS,
  buildCrossPackageDiagnostics,
  checksByDomain,
  integrationCheckIds,
  verifyArchitectureContinuity,
  verifyCrossPackageIntegration,
  verifyCrossPackageOwnership,
  verifyCrossPackagePersistence,
  verifyGovernanceContinuity,
  verifyHonestProductConsistency,
  verifyPackageDependencyChain,
} from './w4-e06-c-cross-package-integration';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');

describe('W4-E06-c cross-package integration — unit', () => {
  it('slice id and verification domain catalog', () => {
    expect(W4_E06_C_SLICE_ID).toBe('W4-E06-c');
    expect(W4_E06_C_VERIFICATION_DOMAINS.length).toBe(11);
    for (const domain of W4_E06_C_VERIFICATION_DOMAINS) {
      expect(checksByDomain(domain).length).toBeGreaterThan(0);
    }
  });

  it('integration check ids are unique; every check PASS; none authorize Wave 4 COMPLETE', () => {
    const ids = integrationCheckIds();
    expect(new Set(ids).size).toBe(ids.length);
    for (const row of W4_E06_C_CROSS_PACKAGE_INTEGRATION_CHECKS) {
      expect(row.result).toBe('PASS');
      expect(row.authorizesWave4Complete).toBe(false);
    }
  });

  it('package dependency chain E01 → E05 intact', () => {
    const chain = verifyPackageDependencyChain();
    expect(chain.ok).toBe(true);
    expect(chain.chainLength).toBe(5);
    expect(W4_E06_C_PACKAGE_DEPENDENCY_CHAIN.map((link) => link.packageId)).toEqual([
      ...W4_E06_A_COMPLETED_PACKAGE_IDS,
    ]);
  });

  it('cross-package ownership and persistence integrity verified', () => {
    expect(verifyCrossPackageOwnership().ok).toBe(true);
    expect(verifyCrossPackagePersistence().ok).toBe(true);
    expect(W4_E06_C_PERSISTENCE_OWNERSHIP.every((row) => row.owner === 'exchange-adapter')).toBe(
      true,
    );
  });

  it('honest product consistency and governance continuity verified', () => {
    expect(verifyHonestProductConsistency().ok).toBe(true);
    expect(verifyGovernanceContinuity().ok).toBe(true);
    expect(verifyPackageExitCriteria().ok).toBe(true);
    expect(verifyGovernanceCompleteness().ok).toBe(true);
  });

  it('architecture continuity: no duplicate subsystem / SoT / regression', () => {
    const arch = verifyArchitectureContinuity();
    expect(arch.ok).toBe(true);
    expect(arch.noDuplicateSubsystem).toBe(true);
    expect(arch.noDuplicateSourceOfTruth).toBe(true);
    expect(arch.noArchitecturalRegression).toBe(true);
  });

  it('verifyCrossPackageIntegration passes all domains', () => {
    const integration = verifyCrossPackageIntegration();
    expect(integration.ok).toBe(true);
    expect(integration.failures).toEqual([]);
    expect(integration.domainsVerified).toBe(11);
  });

  it('binding findings: all packages consistent; Engineering cannot declare Wave 4 COMPLETE', () => {
    expect(W4_E06_C_BINDING_FINDINGS.allPackagesCrossPackageConsistent).toBe(true);
    expect(W4_E06_C_BINDING_FINDINGS.crossPackageArchitecturalIntegrityVerified).toBe(true);
    expect(W4_E06_C_BINDING_FINDINGS.honestProductBoundariesPreservedAcrossPackages).toBe(true);
    expect(W4_E06_C_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W4_E06_C_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W4_E06_C_BINDING_FINDINGS.architecturalDeviations).toBe(false);
    expect(W4_E06_C_BINDING_FINDINGS.engineeringCanDeclareWave4Complete).toBe(false);
    expect(W4_E06_C_BINDING_FINDINGS.customerVisibleFeatureFromSliceC).toBe(false);
  });

  it('diagnostics aggregate all verification gates PASS', () => {
    const diagnostics = buildCrossPackageDiagnostics();
    expect(diagnostics.dependencyChain.ok).toBe(true);
    expect(diagnostics.ownership.ok).toBe(true);
    expect(diagnostics.persistence.ok).toBe(true);
    expect(diagnostics.honestProduct.ok).toBe(true);
    expect(diagnostics.integration.ok).toBe(true);
    expect(diagnostics.architecture.ok).toBe(true);
    expect(diagnostics.governance.ok).toBe(true);
  });

  it('technical debt delta: integration verification resolved; d–e deferred', () => {
    expect(W4_E06_C_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Cross-Package Integration Verification Foundation',
    );
    expect(W4_E06_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W4_E06_C_TECHNICAL_DEBT_DELTA.deferred.length).toBe(2);
  });
});

describe('W4-E06-c cross-package integration — integration', () => {
  it('consumes W4-E06-a roll-up and W4-E06-b exit criteria evidence', () => {
    expect(verifyPackageRollup().ok).toBe(true);
    expect(verifyGovernanceContinuity().rollupConsumed).toBe(true);
    expect(verifyGovernanceContinuity().exitCriteriaConsumed).toBe(true);
    expect(W4_E06_C_BINDING_FINDINGS.consumesW4E06ARollUpInventory).toBe(true);
    expect(W4_E06_C_BINDING_FINDINGS.consumesW4E06BExitCriteriaEvidence).toBe(true);
  });

  it('architecture claims remain verification-only', () => {
    expect(W4_E06_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W4_E06_C_ARCHITECTURE_CLAIMS.duplicateExchangeSubsystem).toBe(false);
    expect(W4_E06_C_ARCHITECTURE_CLAIMS.duplicatePermissionSubsystem).toBe(false);
    expect(W4_E06_C_ARCHITECTURE_CLAIMS.engineClonePerVenue).toBe(false);
    expect(W4_E06_C_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W4_E06_C_ARCHITECTURE_CLAIMS.wave4CompleteClaimed).toBe(false);
    expect(W4_E06_C_ARCHITECTURE_CLAIMS.crossPackageIntegrationVerified).toBe(true);
  });

  it('evidence paths exist on disk for integration checks and persistence ownership', () => {
    for (const row of W4_E06_C_CROSS_PACKAGE_INTEGRATION_CHECKS) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
    for (const row of W4_E06_C_PERSISTENCE_OWNERSHIP) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
    for (const link of W4_E06_C_PACKAGE_DEPENDENCY_CHAIN) {
      expect(existsSync(join(REPO_ROOT, link.closeRecordPath))).toBe(true);
    }
  });

  it('required W4-E06-c reports exist on disk', () => {
    for (const name of W4_E06_C_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE4, name))).toBe(true);
    }
  });
});
