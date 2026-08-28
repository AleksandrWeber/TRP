import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifyPackageRollup } from './w4-e06-a-wave4-rollup';
import { W4_E06_A_COMPLETED_PACKAGE_IDS } from './w4-e06-a-wave4-rollup-inventory';
import {
  verifyGovernanceCompleteness,
  verifyPackageExitCriteria,
} from './w4-e06-b-wave-exit-criteria';
import { verifyCrossPackageIntegration } from './w4-e06-c-cross-package-integration';
import {
  W4_E06_D_ARCHITECTURE_CLAIMS,
  W4_E06_D_BINDING_FINDINGS,
  W4_E06_D_OPERATIONAL_CONTINUITY_CHECKS,
  W4_E06_D_PLATFORM_READINESS_PROJECTIONS,
  W4_E06_D_REQUIRED_REPORTS,
  W4_E06_D_REVIEW_DOMAINS,
  W4_E06_D_SLICE_ID,
  W4_E06_D_TECHNICAL_DEBT_DELTA,
  buildWaveOperationalContinuityDiagnostics,
  checksByDomain,
  reviewCheckIds,
  verifyArchitectureVerification,
  verifyDocumentationAccuracy,
  verifyGovernanceContinuity,
  verifyHonestProductPreservation,
  verifyNoFabricatedFunctionality,
  verifyNoHiddenDependencies,
  verifyOperationalContinuityPreservation,
  verifyPlatformReadinessTruthfulness,
  verifyWaveOperationalContinuity,
} from './w4-e06-d-wave-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');

describe('W4-E06-d wave operational continuity — unit', () => {
  it('slice id and review domain catalog', () => {
    expect(W4_E06_D_SLICE_ID).toBe('W4-E06-d');
    expect(W4_E06_D_REVIEW_DOMAINS.length).toBe(10);
    for (const domain of W4_E06_D_REVIEW_DOMAINS) {
      expect(checksByDomain(domain).length).toBeGreaterThan(0);
    }
  });

  it('review check ids are unique; every check PASS; none authorize Wave 4 COMPLETE', () => {
    const ids = reviewCheckIds();
    expect(new Set(ids).size).toBe(ids.length);
    for (const row of W4_E06_D_OPERATIONAL_CONTINUITY_CHECKS) {
      expect(row.result).toBe('PASS');
      expect(row.authorizesWave4Complete).toBe(false);
    }
  });

  it('platform readiness projections cover E01…E05', () => {
    expect(W4_E06_D_PLATFORM_READINESS_PROJECTIONS.length).toBe(5);
    expect(W4_E06_D_PLATFORM_READINESS_PROJECTIONS.map((row) => row.packageId)).toEqual([
      ...W4_E06_A_COMPLETED_PACKAGE_IDS,
    ]);
    expect(
      W4_E06_D_PLATFORM_READINESS_PROJECTIONS.every((row) => row.owner === 'exchange-adapter'),
    ).toBe(true);
  });

  it('operational continuity preservation verified across all packages', () => {
    const oc = verifyOperationalContinuityPreservation();
    expect(oc.ok).toBe(true);
    expect(oc.packageCount).toBe(5);
    expect(oc.allDerived).toBe(true);
  });

  it('honest product and platform readiness truthfulness verified', () => {
    expect(verifyHonestProductPreservation().ok).toBe(true);
    expect(verifyPlatformReadinessTruthfulness().ok).toBe(true);
    expect(verifyPlatformReadinessTruthfulness().neverHardcodesReady).toBe(true);
  });

  it('documentation accuracy and no fabricated functionality verified', () => {
    expect(verifyDocumentationAccuracy().ok).toBe(true);
    expect(verifyNoFabricatedFunctionality().ok).toBe(true);
    expect(verifyNoHiddenDependencies().ok).toBe(true);
  });

  it('architecture verification and governance continuity verified', () => {
    expect(verifyArchitectureVerification().ok).toBe(true);
    expect(verifyGovernanceContinuity().ok).toBe(true);
    expect(verifyPackageExitCriteria().ok).toBe(true);
    expect(verifyGovernanceCompleteness().ok).toBe(true);
  });

  it('verifyWaveOperationalContinuity passes all domains', () => {
    const review = verifyWaveOperationalContinuity();
    expect(review.ok).toBe(true);
    expect(review.failures).toEqual([]);
    expect(review.domainsVerified).toBe(10);
  });

  it('binding findings: continuity and honesty verified; Engineering cannot declare Wave 4 COMPLETE', () => {
    expect(W4_E06_D_BINDING_FINDINGS.wave4OperationalContinuityVerified).toBe(true);
    expect(W4_E06_D_BINDING_FINDINGS.honestProductVerifiedAcrossAllPackages).toBe(true);
    expect(W4_E06_D_BINDING_FINDINGS.platformReadinessRemainsTruthful).toBe(true);
    expect(W4_E06_D_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W4_E06_D_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W4_E06_D_BINDING_FINDINGS.architecturalDeviations).toBe(false);
    expect(W4_E06_D_BINDING_FINDINGS.engineeringCanDeclareWave4Complete).toBe(false);
    expect(W4_E06_D_BINDING_FINDINGS.customerVisibleFeatureFromSliceD).toBe(false);
  });

  it('diagnostics aggregate all verification gates PASS', () => {
    const diagnostics = buildWaveOperationalContinuityDiagnostics();
    expect(diagnostics.operationalContinuity.ok).toBe(true);
    expect(diagnostics.honestProduct.ok).toBe(true);
    expect(diagnostics.platformReadiness.ok).toBe(true);
    expect(diagnostics.documentation.ok).toBe(true);
    expect(diagnostics.noFabricatedFunctionality.ok).toBe(true);
    expect(diagnostics.noHiddenDependencies.ok).toBe(true);
    expect(diagnostics.governance.ok).toBe(true);
    expect(diagnostics.architecture.ok).toBe(true);
    expect(diagnostics.waveReview.ok).toBe(true);
  });

  it('technical debt delta: wave review resolved; W4-E06-e deferred', () => {
    expect(W4_E06_D_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Wave Operational Continuity & Honest Product Review Foundation',
    );
    expect(W4_E06_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W4_E06_D_TECHNICAL_DEBT_DELTA.deferred.length).toBe(1);
  });
});

describe('W4-E06-d wave operational continuity — integration', () => {
  it('consumes W4-E06-a/b/c evidence', () => {
    expect(verifyPackageRollup().ok).toBe(true);
    expect(verifyCrossPackageIntegration().ok).toBe(true);
    expect(verifyGovernanceContinuity().rollupConsumed).toBe(true);
    expect(verifyGovernanceContinuity().exitCriteriaConsumed).toBe(true);
    expect(verifyGovernanceContinuity().crossPackageConsumed).toBe(true);
    expect(W4_E06_D_BINDING_FINDINGS.consumesW4E06ARollUpInventory).toBe(true);
    expect(W4_E06_D_BINDING_FINDINGS.consumesW4E06BExitCriteriaEvidence).toBe(true);
    expect(W4_E06_D_BINDING_FINDINGS.consumesW4E06CCrossPackageIntegration).toBe(true);
  });

  it('architecture claims remain review-only', () => {
    expect(W4_E06_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W4_E06_D_ARCHITECTURE_CLAIMS.duplicateExchangeSubsystem).toBe(false);
    expect(W4_E06_D_ARCHITECTURE_CLAIMS.duplicatePermissionSubsystem).toBe(false);
    expect(W4_E06_D_ARCHITECTURE_CLAIMS.engineClonePerVenue).toBe(false);
    expect(W4_E06_D_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W4_E06_D_ARCHITECTURE_CLAIMS.wave4CompleteClaimed).toBe(false);
    expect(W4_E06_D_ARCHITECTURE_CLAIMS.waveOperationalContinuityVerified).toBe(true);
    expect(W4_E06_D_ARCHITECTURE_CLAIMS.honestProductWaveReviewVerified).toBe(true);
    expect(W4_E06_D_ARCHITECTURE_CLAIMS.platformReadinessTruthful).toBe(true);
  });

  it('evidence paths exist on disk for review checks and platform readiness projections', () => {
    for (const row of W4_E06_D_OPERATIONAL_CONTINUITY_CHECKS) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
    for (const row of W4_E06_D_PLATFORM_READINESS_PROJECTIONS) {
      expect(existsSync(join(REPO_ROOT, row.registryPath))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });

  it('required W4-E06-d reports exist on disk', () => {
    for (const name of W4_E06_D_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE4, name))).toBe(true);
    }
  });
});
