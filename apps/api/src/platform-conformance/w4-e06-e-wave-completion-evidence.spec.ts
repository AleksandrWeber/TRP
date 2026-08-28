import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifyPackageRollup } from './w4-e06-a-wave4-rollup';
import { verifyCrossPackageIntegration } from './w4-e06-c-cross-package-integration';
import {
  verifyGovernanceCompleteness,
  verifyPackageExitCriteria,
} from './w4-e06-b-wave-exit-criteria';
import { verifyWaveOperationalContinuity } from './w4-e06-d-wave-operational-continuity';
import {
  W4_E06_E_APPROVED_PREDECESSOR_SLICES,
  W4_E06_E_ARCHITECTURE_CLAIMS,
  W4_E06_E_BINDING_FINDINGS,
  W4_E06_E_CONSUMED_PREDECESSOR_REPORTS,
  W4_E06_E_EVIDENCE_DOMAINS,
  W4_E06_E_REQUIRED_REPORTS,
  W4_E06_E_SLICE_ID,
  W4_E06_E_TECHNICAL_DEBT_DELTA,
  W4_E06_E_WAVE_COMPLETION_CHAIN,
  W4_E06_E_WAVE_COMPLETION_EVIDENCE_CHECKS,
  assemblyCheckIds,
  buildWaveCompletionEvidenceDiagnostics,
  checksByDomain,
  verifyArchitecturePreserved,
  verifyCrossPackageIntegrationVerified,
  verifyDocumentationSynchronized,
  verifyExitCriteriaCompleted,
  verifyGovernancePreserved,
  verifyHonestProductPreserved,
  verifyOperationalContinuityReviewed,
  verifyRollUpInventoryCompleted,
  verifyWaveCompletionEvidence,
} from './w4-e06-e-wave-completion-evidence';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');

describe('W4-E06-e wave completion evidence — unit', () => {
  it('slice id and evidence domain catalog', () => {
    expect(W4_E06_E_SLICE_ID).toBe('W4-E06-e');
    expect(W4_E06_E_EVIDENCE_DOMAINS.length).toBe(8);
    for (const domain of W4_E06_E_EVIDENCE_DOMAINS) {
      expect(checksByDomain(domain).length).toBeGreaterThan(0);
    }
  });

  it('assembly check ids are unique; every check PASS; none authorize Wave 4 COMPLETE', () => {
    const ids = assemblyCheckIds();
    expect(new Set(ids).size).toBe(ids.length);
    for (const row of W4_E06_E_WAVE_COMPLETION_EVIDENCE_CHECKS) {
      expect(row.result).toBe('PASS');
      expect(row.authorizesWave4Complete).toBe(false);
    }
  });

  it('approved predecessor slices a–d recorded PASS', () => {
    expect(W4_E06_E_APPROVED_PREDECESSOR_SLICES.map((slice) => slice.id)).toEqual([
      'W4-E06-a',
      'W4-E06-b',
      'W4-E06-c',
      'W4-E06-d',
    ]);
    expect(
      W4_E06_E_APPROVED_PREDECESSOR_SLICES.every(
        (slice) =>
          slice.validation === 'PASS' &&
          slice.architecture === 'PASS' &&
          slice.security === 'PASS' &&
          slice.product === 'PASS',
      ),
    ).toBe(true);
  });

  it('wave completion chain spans a through e', () => {
    expect(W4_E06_E_WAVE_COMPLETION_CHAIN.length).toBe(5);
    expect(W4_E06_E_WAVE_COMPLETION_CHAIN.at(-1)).toContain('W4-E06-e');
  });

  it('roll-up inventory and exit criteria evidence completed', () => {
    expect(verifyRollUpInventoryCompleted().ok).toBe(true);
    expect(verifyExitCriteriaCompleted().ok).toBe(true);
    expect(verifyPackageRollup().ok).toBe(true);
    expect(verifyPackageExitCriteria().ok).toBe(true);
    expect(verifyGovernanceCompleteness().ok).toBe(true);
  });

  it('cross-package integration and operational continuity reviewed', () => {
    expect(verifyCrossPackageIntegrationVerified().ok).toBe(true);
    expect(verifyOperationalContinuityReviewed().ok).toBe(true);
    expect(verifyCrossPackageIntegration().ok).toBe(true);
    expect(verifyWaveOperationalContinuity().ok).toBe(true);
  });

  it('honest product, governance, architecture, and documentation preserved', () => {
    expect(verifyHonestProductPreserved().ok).toBe(true);
    expect(verifyGovernancePreserved().ok).toBe(true);
    expect(verifyArchitecturePreserved().ok).toBe(true);
    expect(verifyDocumentationSynchronized().ok).toBe(true);
  });

  it('verifyWaveCompletionEvidence passes all domains', () => {
    const evidence = verifyWaveCompletionEvidence();
    expect(evidence.ok).toBe(true);
    expect(evidence.failures).toEqual([]);
    expect(evidence.domainsVerified).toBe(8);
  });

  it('binding findings: evidence assembled; Engineering cannot declare Wave 4 COMPLETE', () => {
    expect(W4_E06_E_BINDING_FINDINGS.waveCompletionEvidenceAssembled).toBe(true);
    expect(W4_E06_E_BINDING_FINDINGS.governanceRequirementsSatisfied).toBe(true);
    expect(W4_E06_E_BINDING_FINDINGS.honestProductPreserved).toBe(true);
    expect(W4_E06_E_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W4_E06_E_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W4_E06_E_BINDING_FINDINGS.architecturalDeviations).toBe(false);
    expect(W4_E06_E_BINDING_FINDINGS.engineeringCanDeclareWave4Complete).toBe(false);
    expect(W4_E06_E_BINDING_FINDINGS.finalWaveIntegrationVerificationPerformed).toBe(false);
    expect(W4_E06_E_BINDING_FINDINGS.customerVisibleFeatureFromSliceE).toBe(false);
  });

  it('diagnostics aggregate all verification gates PASS', () => {
    const diagnostics = buildWaveCompletionEvidenceDiagnostics();
    expect(diagnostics.rollupInventory.ok).toBe(true);
    expect(diagnostics.exitCriteria.ok).toBe(true);
    expect(diagnostics.crossPackageIntegration.ok).toBe(true);
    expect(diagnostics.operationalContinuity.ok).toBe(true);
    expect(diagnostics.honestProduct.ok).toBe(true);
    expect(diagnostics.governance.ok).toBe(true);
    expect(diagnostics.architecture.ok).toBe(true);
    expect(diagnostics.documentation.ok).toBe(true);
    expect(diagnostics.waveCompletionEvidence.ok).toBe(true);
  });

  it('technical debt delta: completion evidence resolved; Final Wave Integration Verification deferred', () => {
    expect(W4_E06_E_TECHNICAL_DEBT_DELTA.resolved).toContain('Wave Completion Evidence Assembly');
    expect(W4_E06_E_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W4_E06_E_TECHNICAL_DEBT_DELTA.deferred).toEqual(['Final Wave Integration Verification']);
  });
});

describe('W4-E06-e wave completion evidence — integration', () => {
  it('consumes W4-E06-a/b/c/d evidence', () => {
    expect(W4_E06_E_BINDING_FINDINGS.consumesW4E06ARollUpInventory).toBe(true);
    expect(W4_E06_E_BINDING_FINDINGS.consumesW4E06BExitCriteriaEvidence).toBe(true);
    expect(W4_E06_E_BINDING_FINDINGS.consumesW4E06CCrossPackageIntegration).toBe(true);
    expect(W4_E06_E_BINDING_FINDINGS.consumesW4E06DOperationalContinuityReview).toBe(true);
  });

  it('architecture claims remain evidence assembly only', () => {
    expect(W4_E06_E_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W4_E06_E_ARCHITECTURE_CLAIMS.duplicateExchangeSubsystem).toBe(false);
    expect(W4_E06_E_ARCHITECTURE_CLAIMS.duplicatePermissionSubsystem).toBe(false);
    expect(W4_E06_E_ARCHITECTURE_CLAIMS.engineClonePerVenue).toBe(false);
    expect(W4_E06_E_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W4_E06_E_ARCHITECTURE_CLAIMS.wave4CompleteClaimed).toBe(false);
    expect(W4_E06_E_ARCHITECTURE_CLAIMS.waveCompletionEvidenceAssembled).toBe(true);
    expect(W4_E06_E_ARCHITECTURE_CLAIMS.finalWaveIntegrationVerificationPerformed).toBe(false);
  });

  it('evidence paths exist on disk for assembly checks and predecessor slices', () => {
    for (const row of W4_E06_E_WAVE_COMPLETION_EVIDENCE_CHECKS) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
    for (const slice of W4_E06_E_APPROVED_PREDECESSOR_SLICES) {
      expect(existsSync(join(REPO_ROOT, slice.registryPath))).toBe(true);
      expect(existsSync(join(REPO_ROOT, slice.primaryEvidencePath))).toBe(true);
    }
  });

  it('consumed predecessor reports and required W4-E06-e reports exist on disk', () => {
    for (const name of W4_E06_E_CONSUMED_PREDECESSOR_REPORTS) {
      expect(existsSync(join(WAVE4, name))).toBe(true);
    }
    for (const name of W4_E06_E_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE4, name))).toBe(true);
    }
  });
});
