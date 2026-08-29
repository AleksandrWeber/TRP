import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import { W5_N05_A_ARCHITECTURE_CLAIMS } from './w5-n05-a-notification-platform-integration-inventory';
import { W5_N05_B_ARCHITECTURE_CLAIMS } from './w5-n05-b-durable-notification-platform-integration';
import { W5_N05_C_ARCHITECTURE_CLAIMS } from './w5-n05-c-notification-platform-integration-restart-recovery';
import { W5_N05_D_ARCHITECTURE_CLAIMS } from './w5-n05-d-notification-platform-integration-operational-continuity';
import {
  buildCloseEvidenceDiagnostics,
  transitionSafetyAnswers,
  verifyArchitectureIntegrity,
  verifyDocumentationIntegrity,
  verifyGovernanceIntegrity,
  verifyHonestProduct,
  verifyOperationalChain,
  W5_N05_E_APPROVED_SLICES,
  W5_N05_E_ARCHITECTURE_CLAIMS,
  W5_N05_E_BINDING_FINDINGS,
  W5_N05_E_CAPABILITY_EVOLUTION,
  W5_N05_E_INTEGRITY_NON_EXPANSION,
  W5_N05_E_NOTIFICATION_OWNER,
  W5_N05_E_OPERATIONAL_MATURITY,
  W5_N05_E_REQUIRED_REPORTS,
  W5_N05_E_REQUIRED_SLICE_REPORTS,
  W5_N05_E_SLICE_ID,
  W5_N05_E_TECHNICAL_DEBT_DELTA,
  W5_N05_E_TRANSITION_MATRIX,
} from './w5-n05-e-package-close-evidence';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');

function readWave5(name: string): string {
  return readFileSync(join(WAVE5, name), 'utf8');
}

describe('W5-N05-e package close evidence — unit', () => {
  it('approved slices a–d recorded PASS for validation / architecture / security / product', () => {
    expect(W5_N05_E_SLICE_ID).toBe('W5-N05-e');
    expect(W5_N05_E_NOTIFICATION_OWNER).toBe('notification-delivery');
    expect(W5_N05_E_APPROVED_SLICES.map((s) => s.id)).toEqual([
      'W5-N05-a',
      'W5-N05-b',
      'W5-N05-c',
      'W5-N05-d',
    ]);
    expect(
      W5_N05_E_APPROVED_SLICES.every(
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
    expect(W5_N05_E_BINDING_FINDINGS.operationalJourneyWorks).toBe(true);
  });

  it('Honest Product enforcement intact', () => {
    const honest = verifyHonestProduct();
    expect(honest.ok).toBe(true);
    expect(honest.operationalContinuityNotPlatformIntegrationIo).toBe(true);
    expect(honest.restartRecoveryNotProductionReady).toBe(true);
    expect(honest.inventoryHonestBaselineIntact).toBe(true);
    expect(honest.platformIntegrationFunctionalNotAuthorized).toBe(true);
    expect(honest.crossChannelUnificationNotClaimed).toBe(true);
    expect(W5_N05_E_BINDING_FINDINGS.honestProductEnforcementIntact).toBe(true);
  });

  it('governance: notification-delivery sole owner; no second engine / persistence', () => {
    const gov = verifyGovernanceIntegrity();
    expect(gov.ok).toBe(true);
    expect(gov.notificationDeliverySoleOwner).toBe(true);
    expect(gov.noSecondNotificationEngine).toBe(true);
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
    expect(W5_N05_E_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N05_E_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('this slice does not declare package CLOSED, platform integration functional, or Wave 5 COMPLETE', () => {
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.w5N05CompleteClaimed).toBe(false);
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.platformIntegrationFunctionalClaimed).toBe(false);
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.notificationPlatformCompleteClaimed).toBe(false);
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.wave5DeclaredComplete).toBe(false);
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.finalPackageIntegrationVerificationPerformed).toBe(false);
    expect(W5_N05_E_BINDING_FINDINGS.packageDeclaredClosed).toBe(false);
    const diagnostics = buildCloseEvidenceDiagnostics();
    expect(diagnostics.packageDeclaredClosed).toBe(false);
  });
});

describe('W5-N05-e package close evidence — integration / planning', () => {
  it('transition safety answers hold', () => {
    const answers = transitionSafetyAnswers();
    expect(answers.version2Unchanged).toBe(true);
    expect(answers.wave1Unchanged).toBe(true);
    expect(answers.wave2Unchanged).toBe(true);
    expect(answers.wave3Unchanged).toBe(true);
    expect(answers.wave4Unchanged).toBe(true);
    expect(answers.packageNotDeclaredClosed).toBe(true);
    expect(answers.wave5NotDeclaredComplete).toBe(true);
    expect(answers.finalPackageIntegrationVerificationNotPerformed).toBe(true);
    expect(answers.w5N01NotReopened).toBe(true);
    expect(answers.w5N02NotReopened).toBe(true);
    expect(answers.w5N03NotReopened).toBe(true);
    expect(answers.w5N04NotReopened).toBe(true);
    expect(answers.w5N05CompleteNotClaimed).toBe(true);
    expect(answers.notificationPlatformCompleteNotClaimed).toBe(true);
    expect(answers.platformIntegrationFunctionalNotClaimed).toBe(true);
    expect(answers.productionReadyNotClaimed).toBe(true);
    for (const claims of [
      W5_N05_A_ARCHITECTURE_CLAIMS,
      W5_N05_B_ARCHITECTURE_CLAIMS,
      W5_N05_C_ARCHITECTURE_CLAIMS,
      W5_N05_D_ARCHITECTURE_CLAIMS,
    ]) {
      expect(claims.ownershipBoundariesChanged).toBe(false);
      expect(claims.masterPlanModified).toBe(false);
      expect(claims.newPersistenceOwner).toBe(false);
      expect(claims.newBoundedContext).toBe(false);
    }
  });

  it('architecture non-claims: no new capability / no silent expansion', () => {
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.newCustomerFunctionality).toBe(false);
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.newApi).toBe(false);
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.newUi).toBe(false);
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.newPersistence).toBe(false);
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.platformIntegrationIo).toBe(false);
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.liveTrading).toBe(false);
    expect(W5_N05_E_INTEGRITY_NON_EXPANSION).toContain('Platform Integration I/O');
    expect(W5_N05_E_INTEGRITY_NON_EXPANSION).toContain(
      'Final Package Integration Verification Performed',
    );
  });

  it('product verification claims hold across c/d', () => {
    expect(W5_N05_C_ARCHITECTURE_CLAIMS.recoveryDeterministic).toBe(true);
    expect(W5_N05_C_ARCHITECTURE_CLAIMS.recoveryIdempotent).toBe(true);
    expect(
      W5_N05_C_ARCHITECTURE_CLAIMS.notificationPlatformIntegrationAnchorStateRestoredAfterRestart,
    ).toBe(true);
    expect(W5_N05_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W5_N05_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N05_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
    expect(OPERATIONAL_STATES).toEqual(['Recovering', 'Ready', 'Degraded', 'Unavailable']);
  });

  it('required close evidence reports exist', () => {
    for (const name of W5_N05_E_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE5, name)), name).toBe(true);
    }
    for (const name of W5_N05_E_REQUIRED_SLICE_REPORTS) {
      expect(existsSync(join(WAVE5, name)), name).toBe(true);
    }
    expect(existsSync(join(WAVE5, 'w5-n05-a-notification-platform-integration-inventory.md'))).toBe(
      true,
    );
    expect(existsSync(join(WAVE5, 'wave-5-overview.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'wave-5-validation-plan.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'wave-5-progress.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'w5-n05-planning-approval.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'w5-n05-product-owner-close-record.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'w5-n05-final-integration-verification.md'))).toBe(true);
  });

  it('documentation integrity helper verifies slice and package reports', () => {
    const docs = verifyDocumentationIntegrity((name) => existsSync(join(WAVE5, name)));
    expect(docs.ok).toBe(true);
    expect(docs.sliceReportsComplete).toBe(true);
    expect(docs.packageReportsComplete).toBe(true);
  });

  it('transition / maturity / capability / debt registries are complete', () => {
    expect(W5_N05_E_TRANSITION_MATRIX.before.length).toBeGreaterThan(0);
    expect(W5_N05_E_TRANSITION_MATRIX.after.length).toBeGreaterThan(0);
    expect(W5_N05_E_TRANSITION_MATRIX.stillMissing).toContain(
      'Final Package Integration Verification',
    );
    expect(W5_N05_E_OPERATIONAL_MATURITY.after).toContain('Package Close Evidence');
    expect(W5_N05_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(/restart recovery/);
    expect(W5_N05_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(
      /without platform integration I\/O/,
    );
    expect(W5_N05_E_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N05_E_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
  });

  it('platform readiness exposes notification platform integration continuity without implementation controls', () => {
    const view = readFileSync(
      join(REPO_ROOT, 'apps/web/src/operational-continuity/OperationalContinuityView.tsx'),
      'utf8',
    );
    const api = readFileSync(join(REPO_ROOT, 'apps/web/src/shared/api.ts'), 'utf8');
    expect(api).toContain('NotificationPlatformIntegrationContinuityView');
    expect(view).toMatch(/Notification Platform Integration|notificationPlatformIntegration/i);
    expect(view).toContain('recoveryTimestamp');
    expect(view).toContain('canonicalAnchorCount');
    expect(view).not.toMatch(/Delivering|Live Trading/i);
  });

  it('status docs: W5-N05 CLOSED by Product Owner; Wave 5 COMPLETE not claimed', () => {
    const progress = readWave5('wave-5-progress.md');
    const overview = readWave5('wave-5-overview.md');
    const close = readWave5('w5-n05-package-close-report.md');
    const summary = readWave5('w5-n05-package-summary.md');
    const poClose = readWave5('w5-n05-product-owner-close-record.md');
    const finalIntegration = readWave5('w5-n05-final-integration-verification.md');
    expect(progress).toMatch(/CLOSED by Product Owner|Package \*\*CLOSED\*\*/);
    expect(progress).toMatch(/W5-N05-a|W5-N05-b|W5-N05-c|W5-N05-d|W5-N05-e/);
    expect(progress).toMatch(
      /Awaiting explicit Product Owner instruction for W5-N06 Planning Package|W5-N06 Planning Package/i,
    );
    expect(finalIntegration).toMatch(/READY FOR PRODUCT OWNER FINAL CLOSE/i);
    expect(progress).toMatch(/Wave 5 COMPLETE[\s\S]*Not claimed|Not claimed[\s\S]*Wave 5 COMPLETE/);
    expect(overview).toMatch(/\*\*CLOSED\*\* by Product Owner|CLOSED by Product Owner/);
    expect(overview).toMatch(/STOP/);
    expect(overview).toMatch(
      /Notification Platform Integration implemented[\s\S]*not|not[\s\S]*Notification Platform Integration implemented/i,
    );
    expect(close).toMatch(
      /Package \*\*CLOSED\*\* by Product Owner|\*\*CLOSED\*\* by Product Owner|CLOSED by Product Owner/,
    );
    expect(close).toMatch(/Wave 5 COMPLETE[\s\S]*not claimed|not claimed[\s\S]*Wave 5 COMPLETE/i);
    expect(summary).toMatch(/\*\*CLOSED\*\* by Product Owner/);
    expect(poClose).toMatch(
      /officially CLOSED|Decision:\*\* \*\*CLOSED\*\*|Decision: \*\*CLOSED\*\*/,
    );
    expect(finalIntegration).toMatch(/Product Owner Final Close executed|CLOSED by Product Owner/);
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
    expect(W5_N05_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
  });

  it('slice validation reports a–d exist and record PASS', () => {
    for (const slice of ['a', 'b', 'c', 'd'] as const) {
      const report = readWave5(`w5-n05-${slice}-validation-report.md`);
      expect(report).toMatch(/PASS/);
    }
  });
});
