import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifyPackageRollup } from './w4-e06-a-wave4-rollup';
import { W4_E06_A_COMPLETED_PACKAGE_IDS } from './w4-e06-a-wave4-rollup-inventory';
import {
  W4_E06_B_ARCHITECTURE_CLAIMS,
  W4_E06_B_BINDING_FINDINGS,
  W4_E06_B_DEFERRAL_REGISTER,
  W4_E06_B_PACKAGE_EXIT_CRITERIA,
  W4_E06_B_PACKAGE_EXIT_GATES,
  W4_E06_B_REQUIRED_REPORTS,
  W4_E06_B_SATISFACTION_STATUSES,
  W4_E06_B_SLICE_ID,
  W4_E06_B_TECHNICAL_DEBT_DELTA,
  W4_E06_B_WAVE_EXIT_CRITERIA,
  buildExitCriteriaDiagnostics,
  packageExitCriteriaRows,
  rowsBySatisfactionStatus,
  verifyArchitectureIntegrity,
  verifyGovernanceCompleteness,
  verifyHonestProductBoundaries,
  verifyPackageExitCriteria,
  verifyWaveExitCriteriaEvidence,
  waveExitCriteriaRows,
} from './w4-e06-b-wave-exit-criteria';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');

describe('W4-E06-b wave exit criteria — unit', () => {
  it('slice id and package exit gate catalog', () => {
    expect(W4_E06_B_SLICE_ID).toBe('W4-E06-b');
    expect(W4_E06_B_PACKAGE_EXIT_GATES.length).toBe(10);
    expect(W4_E06_B_SATISFACTION_STATUSES).toEqual([
      'SATISFIED',
      'FOUNDATION_SATISFIED',
      'GOVERNANCE_VERIFIED',
      'DEFERRED',
    ]);
  });

  it('all five CLOSED packages have package exit criteria rows', () => {
    const rows = packageExitCriteriaRows();
    expect(rows.length).toBe(5);
    expect(rows.map((row) => row.packageId)).toEqual([...W4_E06_A_COMPLETED_PACKAGE_IDS]);
    for (const row of rows) {
      expect(row.allPackageExitGatesSatisfied).toBe(true);
      expect(row.poCloseCompleted).toBe(true);
      expect(row.fivCompleted).toBe(true);
      expect(row.honestProductMaintained).toBe(true);
      expect(row.architecturePreserved).toBe(true);
    }
  });

  it('verifyPackageExitCriteria passes for all packages', () => {
    const result = verifyPackageExitCriteria();
    expect(result.ok).toBe(true);
    expect(result.packagesVerified).toBe(5);
    expect(result.failures).toEqual([]);
  });

  it('wave exit criteria mapped with honest satisfaction labels', () => {
    const rows = waveExitCriteriaRows();
    expect(rows.length).toBeGreaterThanOrEqual(10);
    expect(rowsBySatisfactionStatus('SATISFIED').length).toBeGreaterThan(0);
    expect(rowsBySatisfactionStatus('DEFERRED').length).toBeGreaterThan(0);
    expect(rowsBySatisfactionStatus('FOUNDATION_SATISFIED').length).toBeGreaterThan(0);
    expect(rowsBySatisfactionStatus('GOVERNANCE_VERIFIED').length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.authorizesWave4Complete).toBe(false);
      if (row.satisfactionStatus === 'DEFERRED') {
        expect(row.deferredProductOutcome?.length).toBeGreaterThan(0);
      }
    }
  });

  it('deferral register lists every DEFERRED criterion explicitly', () => {
    const deferred = rowsBySatisfactionStatus('DEFERRED');
    expect(W4_E06_B_DEFERRAL_REGISTER.length).toBe(deferred.length);
    expect(W4_E06_B_DEFERRAL_REGISTER.length).toBeGreaterThanOrEqual(3);
  });

  it('verifyWaveExitCriteriaEvidence passes without authorizing Wave 4 COMPLETE', () => {
    const result = verifyWaveExitCriteriaEvidence();
    expect(result.ok).toBe(true);
    expect(result.noRowAuthorizesWave4Complete).toBe(true);
    expect(result.noHiddenDeferred).toBe(true);
  });

  it('binding findings: all package exit criteria verified; Engineering cannot declare Wave 4 COMPLETE', () => {
    expect(W4_E06_B_BINDING_FINDINGS.allPackageExitCriteriaVerified).toBe(true);
    expect(W4_E06_B_BINDING_FINDINGS.governanceCompletenessDemonstrated).toBe(true);
    expect(W4_E06_B_BINDING_FINDINGS.honestProductBoundariesPreserved).toBe(true);
    expect(W4_E06_B_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W4_E06_B_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W4_E06_B_BINDING_FINDINGS.architecturalDeviations).toBe(false);
    expect(W4_E06_B_BINDING_FINDINGS.engineeringCanDeclareWave4Complete).toBe(false);
    expect(W4_E06_B_BINDING_FINDINGS.customerVisibleFeatureFromSliceB).toBe(false);
  });

  it('each package gate evidence path is defined for all ten gates', () => {
    for (const row of W4_E06_B_PACKAGE_EXIT_CRITERIA) {
      for (const gate of W4_E06_B_PACKAGE_EXIT_GATES) {
        expect(row.gateEvidence[gate].length).toBeGreaterThan(0);
      }
    }
  });

  it('diagnostics aggregate all verification gates PASS', () => {
    const diagnostics = buildExitCriteriaDiagnostics();
    expect(diagnostics.packageExit.ok).toBe(true);
    expect(diagnostics.waveEvidence.ok).toBe(true);
    expect(diagnostics.governance.ok).toBe(true);
    expect(diagnostics.honestProduct.ok).toBe(true);
    expect(diagnostics.architecture.ok).toBe(true);
  });

  it('technical debt delta: exit criteria resolved; c–e deferred', () => {
    expect(W4_E06_B_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Wave Exit Criteria Evidence Foundation',
    );
    expect(W4_E06_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W4_E06_B_TECHNICAL_DEBT_DELTA.deferred.length).toBe(3);
  });
});

describe('W4-E06-b wave exit criteria — integration', () => {
  it('consumes W4-E06-a roll-up inventory', () => {
    expect(verifyPackageRollup().ok).toBe(true);
    expect(verifyGovernanceCompleteness().rollupConsumed).toBe(true);
  });

  it('architecture claims remain evidence-only', () => {
    expect(W4_E06_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W4_E06_B_ARCHITECTURE_CLAIMS.duplicateExchangeSubsystem).toBe(false);
    expect(W4_E06_B_ARCHITECTURE_CLAIMS.engineClonePerVenue).toBe(false);
    expect(W4_E06_B_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W4_E06_B_ARCHITECTURE_CLAIMS.wave4CompleteClaimed).toBe(false);
    expect(verifyArchitectureIntegrity().ok).toBe(true);
  });

  it('evidence paths exist on disk for wave and package exit criteria', () => {
    for (const row of W4_E06_B_WAVE_EXIT_CRITERIA) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
    for (const row of W4_E06_B_PACKAGE_EXIT_CRITERIA) {
      for (const gate of W4_E06_B_PACKAGE_EXIT_GATES) {
        expect(existsSync(join(REPO_ROOT, row.gateEvidence[gate]))).toBe(true);
      }
    }
  });

  it('honest product boundaries preserved', () => {
    const honest = verifyHonestProductBoundaries();
    expect(honest.ok).toBe(true);
    expect(honest.deferredExplicit).toBe(true);
    expect(honest.wave4CompleteNotAuthorized).toBe(true);
  });

  it('required W4-E06-b reports exist on disk', () => {
    for (const name of W4_E06_B_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE4, name))).toBe(true);
    }
  });
});
