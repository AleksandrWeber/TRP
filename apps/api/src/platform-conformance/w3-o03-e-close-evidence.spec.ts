import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { W3_O03_A_ARCHITECTURE_CLAIMS } from './w3-o03-a-recovery-residual-inventory';
import { W3_O03_B_ARCHITECTURE_CLAIMS } from './w3-o03-b-evidence-chain-sync';
import { W3_O03_C_ARCHITECTURE_CLAIMS } from './w3-o03-c-disposition-foundation';
import { W3_O03_D_ARCHITECTURE_CLAIMS } from './w3-o03-d-honest-claim-alignment';
import {
  W3_O03_E_APPROVED_SLICES,
  W3_O03_E_ARCHITECTURE_CLAIMS,
  W3_O03_E_BINDING_FINDINGS,
  W3_O03_E_CAPABILITY_EVOLUTION,
  W3_O03_E_INTEGRITY_NON_EXPANSION,
  W3_O03_E_OPERATIONAL_MATURITY,
  W3_O03_E_REQUIRED_REPORTS,
  W3_O03_E_REQUIRED_SLICE_REPORTS,
  W3_O03_E_SLICE_ID,
  W3_O03_E_TECHNICAL_DEBT_DELTA,
  W3_O03_E_TRANSITION_MATRIX,
  buildCloseEvidenceDiagnostics,
  transitionSafetyAnswers,
  verifyArchitectureIntegrity,
  verifyGovernanceIntegrity,
  verifyHonestProduct,
  verifyOperationalChain,
} from './w3-o03-e-close-evidence';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');

function readWave3(name: string): string {
  return readFileSync(join(WAVE3, name), 'utf8');
}

describe('W3-O03-e package close evidence — unit', () => {
  it('approved slices a–d recorded PASS for validation / architecture / security / product', () => {
    expect(W3_O03_E_SLICE_ID).toBe('W3-O03-e');
    expect(W3_O03_E_APPROVED_SLICES.map((s) => s.id)).toEqual([
      'W3-O03-a',
      'W3-O03-b',
      'W3-O03-c',
      'W3-O03-d',
    ]);
    expect(
      W3_O03_E_APPROVED_SLICES.every(
        (s) =>
          s.validation === 'PASS' &&
          s.architecture === 'PASS' &&
          s.security === 'PASS' &&
          s.product === 'PASS',
      ),
    ).toBe(true);
  });

  it('complete operational journey works', () => {
    const chain = verifyOperationalChain();
    expect(chain.ok).toBe(true);
    expect(chain.evidenceSynchronized).toBe(true);
    expect(chain.claimAlignmentOk).toBe(true);
    expect(chain.steps.length).toBe(6);
    expect(W3_O03_E_BINDING_FINDINGS.operationalJourneyWorks).toBe(true);
  });

  it('evidence chain remains complete; Honest Product enforcement intact', () => {
    expect(W3_O03_E_BINDING_FINDINGS.evidenceChainComplete).toBe(true);
    expect(W3_O03_E_BINDING_FINDINGS.honestProductEnforcementIntact).toBe(true);
    const honest = verifyHonestProduct();
    expect(honest.ok).toBe(true);
    expect(honest.claimsDerivedFromDispositionOnly).toBe(true);
    expect(honest.engineeringMayBypassDisposition).toBe(false);
  });

  it('Engineering cannot declare ADL-008 ACCEPTED or Production Restart Safe', () => {
    const gov = verifyGovernanceIntegrity();
    expect(gov.engineeringMayCreateAccepted).toBe(false);
    expect(gov.engineeringMayClaimRestartSafeWithoutDisposition).toBe(false);
    expect(W3_O03_E_BINDING_FINDINGS.engineeringMayDeclareAccepted).toBe(false);
    expect(W3_O03_E_BINDING_FINDINGS.engineeringMayDeclareProductionRestartSafe).toBe(false);
    expect(W3_O03_E_ARCHITECTURE_CLAIMS.adl008Accepted).toBe(false);
    expect(W3_O03_E_ARCHITECTURE_CLAIMS.productionRestartSafeClaimed).toBe(false);
  });

  it('ownership and architecture integrity hold across a–e', () => {
    const arch = verifyArchitectureIntegrity();
    expect(arch.ok).toBe(true);
    expect(arch.ownershipUnchanged).toBe(true);
    expect(arch.noNewBoundedContext).toBe(true);
    expect(arch.noNewSourceOfTruth).toBe(true);
    expect(arch.masterPlanUnchanged).toBe(true);
    expect(arch.version2Unchanged).toBe(true);
    expect(W3_O03_E_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W3_O03_E_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('this slice does not declare package CLOSED or Wave 3 COMPLETE', () => {
    expect(W3_O03_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
    expect(W3_O03_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
    expect(W3_O03_E_ARCHITECTURE_CLAIMS.wave3DeclaredComplete).toBe(false);
    expect(W3_O03_E_ARCHITECTURE_CLAIMS.w3O04Opened).toBe(false);
    expect(W3_O03_E_BINDING_FINDINGS.packageDeclaredClosed).toBe(false);
  });
});

describe('W3-O03-e package close evidence — integration / planning', () => {
  it('transition safety answers hold', () => {
    const answers = transitionSafetyAnswers();
    expect(answers.version2Unchanged).toBe(true);
    expect(answers.wave1Unchanged).toBe(true);
    expect(answers.wave2Unchanged).toBe(true);
    expect(answers.packageNotDeclaredClosed).toBe(true);
    expect(answers.wave3NotDeclaredComplete).toBe(true);
    expect(answers.w3O04NotOpened).toBe(true);
    expect(answers.adl008NotAcceptedByEngineering).toBe(true);
    expect(answers.productionRestartSafeNotClaimed).toBe(true);
    for (const claims of [
      W3_O03_A_ARCHITECTURE_CLAIMS,
      W3_O03_B_ARCHITECTURE_CLAIMS,
      W3_O03_C_ARCHITECTURE_CLAIMS,
      W3_O03_D_ARCHITECTURE_CLAIMS,
    ]) {
      expect(claims.ownershipBoundariesChanged).toBe(false);
      expect(claims.adl008Accepted).toBe(false);
      expect(claims.productionRestartSafeClaimed).toBe(false);
    }
  });

  it('transition / maturity / capability / debt registries are complete', () => {
    expect(W3_O03_E_TRANSITION_MATRIX.before.length).toBe(4);
    expect(W3_O03_E_TRANSITION_MATRIX.after.length).toBeGreaterThan(0);
    expect(W3_O03_E_TRANSITION_MATRIX.stillMissing).toContain(
      'Product Owner Package Close declaration',
    );
    expect(W3_O03_E_OPERATIONAL_MATURITY.after).toContain('Package Close Evidence');
    expect(W3_O03_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(
      /without Engineering self-promoting/,
    );
    expect(W3_O03_E_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W3_O03_E_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W3_O03_E_TECHNICAL_DEBT_DELTA.deferred.some((d) => d.includes('disposition'))).toBe(
      true,
    );
    expect(W3_O03_E_INTEGRITY_NON_EXPANSION).toContain('Business Continuity');
    expect(W3_O03_E_INTEGRITY_NON_EXPANSION).toContain('Kill Switch Product');
    expect(W3_O03_E_INTEGRITY_NON_EXPANSION).toContain('W3-O04 Opened');
  });

  it('required close evidence and slice reports exist', () => {
    for (const name of W3_O03_E_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE3, name)), name).toBe(true);
    }
    for (const name of W3_O03_E_REQUIRED_SLICE_REPORTS) {
      expect(existsSync(join(WAVE3, name)), name).toBe(true);
    }
    expect(existsSync(join(WAVE3, 'recovery-residual-overview.md'))).toBe(true);
    expect(existsSync(join(WAVE3, 'w3-o03-validation-plan.md'))).toBe(true);
    expect(existsSync(join(WAVE3, 'wave-3-progress.md'))).toBe(true);
  });

  it('slice validation reports a–d exist and record PASS', () => {
    for (const slice of ['a', 'b', 'c', 'd'] as const) {
      const report = readWave3(`w3-o03-${slice}-validation-report.md`);
      expect(report).toMatch(/PASS/);
    }
  });

  it('status docs: Close Evidence assembled; package NOT CLOSED; Wave 3 COMPLETE not claimed; O04 not opened', () => {
    const progress = readWave3('wave-3-progress.md');
    const overview = readWave3('recovery-residual-overview.md');
    const close = readWave3('w3-o03-close-package-report.md');
    const summary = readWave3('w3-o03-package-summary.md');
    const walkthrough = readWave3('w3-o03-operational-walkthrough.md');

    expect(progress).toMatch(/W3-O03-e/);
    expect(progress).toMatch(/Close Evidence|COMPLETE/);
    expect(progress).toMatch(/W3-O03 CLOSED[\s\S]*Not claimed|Not claimed[\s\S]*W3-O03 CLOSED/);
    expect(progress).toMatch(/Wave 3 COMPLETE[\s\S]*Not claimed|Not claimed[\s\S]*Wave 3 COMPLETE/);
    expect(progress).toMatch(/W3-O04/);
    expect(progress).toMatch(/Not opened/);
    expect(progress).toMatch(/STOP/);

    expect(overview).toMatch(/Close Evidence|W3-O03-e/);
    expect(overview).toMatch(/STOP/);
    expect(overview).toMatch(/not.*CLOSED|Not claimed|pending Product Owner/i);

    expect(close).toMatch(/Close Evidence/);
    expect(close).toMatch(/NOT.*CLOSED|not declare.*CLOSED|pending Product Owner/i);
    expect(close).toMatch(/Wave 3 is \*\*NOT\*\*|Wave 3.*NOT/i);
    expect(close).toMatch(/W3-O04.*\*\*NOT\*\*|NOT.*open W3-O04/i);
    expect(close).toMatch(/ADL-008 ACCEPTED/);

    expect(summary).toMatch(/Close Evidence/);
    expect(summary).toMatch(/NOT.*CLOSED|pending Product Owner|not declare/i);
    expect(walkthrough).toMatch(/Inventory/);
    expect(walkthrough).toMatch(/Evidence/);
    expect(walkthrough).toMatch(/Disposition|Claim Alignment/i);
  });

  it('internal diagnostics assemble without declaring Closed', () => {
    const diagnostics = buildCloseEvidenceDiagnostics();
    expect(diagnostics.sliceId).toBe(W3_O03_E_SLICE_ID);
    expect(diagnostics.packageCloseEvidenceAssembled).toBe(true);
    expect(diagnostics.packageDeclaredClosed).toBe(false);
    expect(diagnostics.operational.ok).toBe(true);
    expect(diagnostics.governance.ok).toBe(true);
    expect(diagnostics.architecture.ok).toBe(true);
    expect(diagnostics.honestProduct.ok).toBe(true);
    expect(W3_O03_E_BINDING_FINDINGS.customerVisibleFunctionality).toBe(false);
  });
});
