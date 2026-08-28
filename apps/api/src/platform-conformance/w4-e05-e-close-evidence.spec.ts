import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import { W4_E05_A_ARCHITECTURE_CLAIMS } from './w4-e05-a-venue-permission-inventory';
import { W4_E05_B_ARCHITECTURE_CLAIMS } from './w4-e05-b-durable-venue-permission';
import { W4_E05_C_ARCHITECTURE_CLAIMS } from './w4-e05-c-restart-recovery';
import { W4_E05_D_ARCHITECTURE_CLAIMS } from './w4-e05-d-operational-continuity';
import {
  buildCloseEvidenceDiagnostics,
  transitionSafetyAnswers,
  verifyArchitectureIntegrity,
  verifyGovernanceIntegrity,
  verifyHonestProduct,
  verifyOperationalChain,
  W4_E05_E_APPROVED_SLICES,
  W4_E05_E_ARCHITECTURE_CLAIMS,
  W4_E05_E_BINDING_FINDINGS,
  W4_E05_E_CAPABILITY_EVOLUTION,
  W4_E05_E_INTEGRITY_NON_EXPANSION,
  W4_E05_E_OPERATIONAL_MATURITY,
  W4_E05_E_REQUIRED_REPORTS,
  W4_E05_E_REQUIRED_SLICE_REPORTS,
  W4_E05_E_SLICE_ID,
  W4_E05_E_TECHNICAL_DEBT_DELTA,
  W4_E05_E_TRANSITION_MATRIX,
  W4_E05_E_VENUE_PERMISSION_OWNER,
} from './w4-e05-e-close-evidence';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');

function readWave4(name: string): string {
  return readFileSync(join(WAVE4, name), 'utf8');
}

describe('W4-E05-e package close evidence — unit', () => {
  it('approved slices a–d recorded PASS for validation / architecture / security / product', () => {
    expect(W4_E05_E_SLICE_ID).toBe('W4-E05-e');
    expect(W4_E05_E_VENUE_PERMISSION_OWNER).toBe('exchange-adapter');
    expect(W4_E05_E_APPROVED_SLICES.map((s) => s.id)).toEqual([
      'W4-E05-a',
      'W4-E05-b',
      'W4-E05-c',
      'W4-E05-d',
    ]);
    expect(
      W4_E05_E_APPROVED_SLICES.every(
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
    expect(chain.inventoryOk).toBe(true);
    expect(chain.persistenceOk).toBe(true);
    expect(chain.recoveryOk).toBe(true);
    expect(chain.continuityOk).toBe(true);
    expect(chain.platformReadinessOk).toBe(true);
    expect(chain.steps.length).toBe(6);
    expect(W4_E05_E_BINDING_FINDINGS.operationalJourneyWorks).toBe(true);
  });

  it('Honest Product enforcement intact', () => {
    const honest = verifyHonestProduct();
    expect(honest.ok).toBe(true);
    expect(honest.operationalContinuityNotVendorProbeIo).toBe(true);
    expect(honest.restartRecoveryNotProductionReady).toBe(true);
    expect(honest.hardcodedDefaultsNotAuthoritative).toBe(true);
    expect(honest.venuePermissionVerificationCompleteNotAuthorized).toBe(true);
    expect(honest.permissionVerifiedLabelNotFabricated).toBe(true);
    expect(W4_E05_E_BINDING_FINDINGS.honestProductEnforcementIntact).toBe(true);
  });

  it('governance: exchange-adapter sole owner; no second engine / persistence', () => {
    const gov = verifyGovernanceIntegrity();
    expect(gov.ok).toBe(true);
    expect(gov.exchangeAdapterSoleOwner).toBe(true);
    expect(gov.noSecondPermissionVerificationEngine).toBe(true);
    expect(gov.noSecondPersistenceOwner).toBe(true);
    expect(gov.platformReadinessHonest).toBe(true);
  });

  it('ownership and architecture integrity hold across a–e', () => {
    const arch = verifyArchitectureIntegrity();
    expect(arch.ok).toBe(true);
    expect(arch.ownershipUnchanged).toBe(true);
    expect(arch.noNewBoundedContext).toBe(true);
    expect(arch.noNewSourceOfTruth).toBe(true);
    expect(arch.masterPlanUnchanged).toBe(true);
    expect(arch.version2Unchanged).toBe(true);
    expect(W4_E05_E_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W4_E05_E_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('this slice does not declare package CLOSED, Venue Permission Verification Complete, or Wave 4 COMPLETE', () => {
    expect(W4_E05_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
    expect(W4_E05_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
    expect(W4_E05_E_ARCHITECTURE_CLAIMS.venuePermissionVerificationCompleteClaimed).toBe(false);
    expect(W4_E05_E_ARCHITECTURE_CLAIMS.exchangeConnectivityCompleteClaimed).toBe(false);
    expect(W4_E05_E_ARCHITECTURE_CLAIMS.wave4DeclaredComplete).toBe(false);
    expect(W4_E05_E_ARCHITECTURE_CLAIMS.finalPackageIntegrationVerificationPerformed).toBe(false);
    expect(W4_E05_E_BINDING_FINDINGS.packageDeclaredClosed).toBe(false);
    const diagnostics = buildCloseEvidenceDiagnostics();
    expect(diagnostics.packageDeclaredClosed).toBe(false);
  });
});

describe('W4-E05-e package close evidence — integration / planning', () => {
  it('transition safety answers hold', () => {
    const answers = transitionSafetyAnswers();
    expect(answers.version2Unchanged).toBe(true);
    expect(answers.wave1Unchanged).toBe(true);
    expect(answers.wave2Unchanged).toBe(true);
    expect(answers.wave3Unchanged).toBe(true);
    expect(answers.packageNotDeclaredClosed).toBe(true);
    expect(answers.wave4NotDeclaredComplete).toBe(true);
    expect(answers.finalPackageIntegrationVerificationNotPerformed).toBe(true);
    expect(answers.w4E01NotReopened).toBe(true);
    expect(answers.w4E02NotReopened).toBe(true);
    expect(answers.w4E03NotReopened).toBe(true);
    expect(answers.w4E04NotReopened).toBe(true);
    expect(answers.venuePermissionVerificationCompleteNotClaimed).toBe(true);
    expect(answers.exchangeConnectivityCompleteNotClaimed).toBe(true);
    expect(answers.productionReadyNotClaimed).toBe(true);
    for (const claims of [
      W4_E05_A_ARCHITECTURE_CLAIMS,
      W4_E05_B_ARCHITECTURE_CLAIMS,
      W4_E05_C_ARCHITECTURE_CLAIMS,
      W4_E05_D_ARCHITECTURE_CLAIMS,
    ]) {
      expect(claims.ownershipBoundariesChanged).toBe(false);
      expect(claims.masterPlanModified).toBe(false);
      expect(claims.newPersistenceOwner).toBe(false);
      expect(claims.newBoundedContext).toBe(false);
    }
  });

  it('architecture non-claims: no new capability / no silent expansion', () => {
    expect(W4_E05_E_ARCHITECTURE_CLAIMS.newCustomerFunctionality).toBe(false);
    expect(W4_E05_E_ARCHITECTURE_CLAIMS.newApi).toBe(false);
    expect(W4_E05_E_ARCHITECTURE_CLAIMS.newUi).toBe(false);
    expect(W4_E05_E_ARCHITECTURE_CLAIMS.newPersistence).toBe(false);
    expect(W4_E05_E_ARCHITECTURE_CLAIMS.vendorPermissionProbeIo).toBe(false);
    expect(W4_E05_E_ARCHITECTURE_CLAIMS.liveTrading).toBe(false);
    expect(W4_E05_E_INTEGRITY_NON_EXPANSION).toContain('Vendor Permission Probe I/O');
    expect(W4_E05_E_INTEGRITY_NON_EXPANSION).toContain(
      'Final Package Integration Verification Performed',
    );
  });

  it('product verification claims hold across c/d', () => {
    expect(W4_E05_C_ARCHITECTURE_CLAIMS.recoveryDeterministic).toBe(true);
    expect(W4_E05_C_ARCHITECTURE_CLAIMS.recoveryIdempotent).toBe(true);
    expect(W4_E05_C_ARCHITECTURE_CLAIMS.venuePermissionVerificationStateRestoredAfterRestart).toBe(
      true,
    );
    expect(W4_E05_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W4_E05_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W4_E05_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
    expect(OPERATIONAL_STATES).toEqual(['Recovering', 'Ready', 'Degraded', 'Unavailable']);
  });

  it('required close evidence reports exist', () => {
    for (const name of W4_E05_E_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE4, name)), name).toBe(true);
    }
    for (const name of W4_E05_E_REQUIRED_SLICE_REPORTS) {
      expect(existsSync(join(WAVE4, name)), name).toBe(true);
    }
    expect(existsSync(join(WAVE4, 'w4-e05-overview.md'))).toBe(true);
    expect(existsSync(join(WAVE4, 'w4-e05-validation-plan.md'))).toBe(true);
    expect(existsSync(join(WAVE4, 'wave-4-progress.md'))).toBe(true);
    expect(existsSync(join(WAVE4, 'w4-e05-planning-approval.md'))).toBe(true);
    expect(existsSync(join(WAVE4, 'w4-e05-product-owner-close-record.md'))).toBe(false);
  });

  it('transition / maturity / capability / debt registries are complete', () => {
    expect(W4_E05_E_TRANSITION_MATRIX.before.length).toBeGreaterThan(0);
    expect(W4_E05_E_TRANSITION_MATRIX.after.length).toBeGreaterThan(0);
    expect(W4_E05_E_TRANSITION_MATRIX.stillMissing).toContain('Product Owner Package Close');
    expect(W4_E05_E_OPERATIONAL_MATURITY.after).toContain('Package Close Evidence');
    expect(W4_E05_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(/restart recovery/);
    expect(W4_E05_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(
      /without vendor permission probe/,
    );
    expect(W4_E05_E_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W4_E05_E_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
  });

  it('platform readiness exposes venue permission verification continuity without permission verified / probe controls', () => {
    const view = readFileSync(
      join(REPO_ROOT, 'apps/web/src/operational-continuity/OperationalContinuityView.tsx'),
      'utf8',
    );
    const api = readFileSync(join(REPO_ROOT, 'apps/web/src/shared/api.ts'), 'utf8');
    expect(api).toContain('VenuePermissionContinuityView');
    expect(view).toMatch(/Venue Permission Verification|venuePermissionVerification/i);
    expect(view).toContain('recoveryTimestamp');
    expect(view).toContain('verifiedAnchorCount');
    expect(view).not.toMatch(/Permission verified|Verify permissions|Live Trading|vendor probe/i);
  });

  it('status docs: W4-E05-e COMPLETE; package CLOSED not claimed; Wave 4 COMPLETE not claimed', () => {
    const progress = readWave4('wave-4-progress.md');
    const overview = readWave4('w4-e05-overview.md');
    const close = readWave4('w4-e05-close-package-report.md');
    const summary = readWave4('w4-e05-package-summary.md');
    expect(progress).toMatch(/W4-E05-e|Close Evidence/);
    expect(progress).toMatch(/W4-E05-a|W4-E05-b|W4-E05-c|W4-E05-d/);
    expect(progress).toMatch(/Wave 4 COMPLETE[\s\S]*Not claimed|Not claimed[\s\S]*Wave 4 COMPLETE/);
    expect(progress).not.toMatch(/W4-E05 CLOSED by Product Owner/);
    expect(overview).toMatch(/STOP/);
    expect(overview).toMatch(
      /Venue Permission Verification Complete[\s\S]*not claimed|not claimed[\s\S]*Venue Permission Verification Complete/i,
    );
    expect(overview).not.toMatch(/W4-E05 \*\*CLOSED\*\* by Product Owner/);
    expect(close).toMatch(/awaiting Product Owner|Product Owner Package Review/i);
    expect(close).toMatch(/Wave 4 COMPLETE[\s\S]*not claimed|not claimed[\s\S]*Wave 4 COMPLETE/i);
    expect(close).not.toMatch(/Decision:\*\* \*\*CLOSED\*\*/);
    expect(summary).toMatch(/awaiting Product Owner|not claimed/i);
    expect(W4_E05_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
    expect(W4_E05_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
  });

  it('slice validation reports a–d exist and record PASS', () => {
    for (const slice of ['a', 'b', 'c', 'd'] as const) {
      const report = readWave4(`w4-e05-${slice}-validation-report.md`);
      expect(report).toMatch(/PASS/);
    }
  });
});
