import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import { W5_N20_A_ARCHITECTURE_CLAIMS } from './w5-n20-a-retry-policy-inventory';
import { W5_N20_B_ARCHITECTURE_CLAIMS } from './w5-n20-b-durable-notification-platform-retry-policy';
import { W5_N20_C_ARCHITECTURE_CLAIMS } from './w5-n20-c-notification-platform-retry-policy-restart-recovery';
import { W5_N20_D_ARCHITECTURE_CLAIMS } from './w5-n20-d-notification-platform-retry-policy-operational-continuity';
import {
  buildCloseEvidenceDiagnostics,
  transitionSafetyAnswers,
  verifyArchitectureIntegrity,
  verifyDependencyChain,
  verifyDocumentationIntegrity,
  verifyGovernanceIntegrity,
  verifyHonestProduct,
  verifyImplementationChain,
  verifyOperationalChain,
  verifyRetryPolicyFoundationChain,
  W5_N20_E_APPROVED_SLICES,
  W5_N20_E_ARCHITECTURE_CLAIMS,
  W5_N20_E_BINDING_FINDINGS,
  W5_N20_E_CAPABILITY_EVOLUTION,
  W5_N20_E_DEPENDENCY_CHAIN,
  W5_N20_E_INTEGRITY_NON_EXPANSION,
  W5_N20_E_NOTIFICATION_OWNER,
  W5_N20_E_OPERATIONAL_MATURITY,
  W5_N20_E_REQUIRED_REPORTS,
  W5_N20_E_REQUIRED_SLICE_REPORTS,
  W5_N20_E_SLICE_ID,
  W5_N20_E_TECHNICAL_DEBT_DELTA,
  W5_N20_E_TRANSITION_MATRIX,
} from './w5-n20-e-package-close-evidence';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');

function readWave5(name: string): string {
  return readFileSync(join(WAVE5, name), 'utf8');
}

describe('W5-N20-e package close evidence — unit', () => {
  it('approved slices a–d recorded PASS for validation / architecture / security / product', () => {
    expect(W5_N20_E_SLICE_ID).toBe('W5-N20-e');
    expect(W5_N20_E_NOTIFICATION_OWNER).toBe('notification-delivery');
    expect(W5_N20_E_APPROVED_SLICES.map((s) => s.id)).toEqual([
      'W5-N20-a',
      'W5-N20-b',
      'W5-N20-c',
      'W5-N20-d',
    ]);
    expect(
      W5_N20_E_APPROVED_SLICES.every(
        (s) =>
          s.validation === 'PASS' &&
          s.architecture === 'PASS' &&
          s.security === 'PASS' &&
          s.product === 'PASS',
      ),
    ).toBe(true);
  });

  it('implementation chain complete', () => {
    const implementation = verifyImplementationChain();
    expect(implementation.ok).toBe(true);
    expect(implementation.allSlicesPass).toBe(true);
    expect(implementation.steps.length).toBe(5);
    expect(W5_N20_E_BINDING_FINDINGS.implementationChainComplete).toBe(true);
  });

  it('dependency chain intact — prior packages closed and consumed, not reopened', () => {
    const dependency = verifyDependencyChain();
    expect(dependency.ok).toBe(true);
    expect(dependency.priorPackagesClosed).toBe(true);
    expect(dependency.w5N18ConsumedNotReopened).toBe(true);
    expect(dependency.w5N19ConsumedNotReopened).toBe(true);
    expect(dependency.perChannelFoundationsNotReopened).toBe(true);
    expect(W5_N20_E_DEPENDENCY_CHAIN.map((link) => link.packageId)).toEqual([
      'W5-N01',
      'W5-N02',
      'W5-N03',
      'W5-N04',
      'W5-N05',
      'W5-N06',
      'W5-N07',
      'W5-N08',
      'W5-N09',
      'W5-N10',
      'W5-N11',
      'W5-N12',
      'W5-N13',
      'W5-N14',
      'W5-N15',
      'W5-N16',
      'W5-N17',
      'W5-N18',
      'W5-N19',
      'W5-N20',
    ]);
    expect(W5_N20_E_BINDING_FINDINGS.dependencyChainIntact).toBe(true);
  });

  it('retry policy foundation chain integrity holds', () => {
    const foundation = verifyRetryPolicyFoundationChain();
    expect(foundation.ok).toBe(true);
    expect(foundation.inventoryOk).toBe(true);
    expect(foundation.persistenceOk).toBe(true);
    expect(foundation.recoveryOk).toBe(true);
    expect(foundation.continuityOk).toBe(true);
    expect(W5_N20_E_BINDING_FINDINGS.retryPolicyFoundationChainIntact).toBe(true);
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
    expect(W5_N20_E_BINDING_FINDINGS.operationalJourneyWorks).toBe(true);
  });

  it('Honest Product enforcement intact', () => {
    const honest = verifyHonestProduct();
    expect(honest.ok).toBe(true);
    expect(honest.operationalContinuityNotRetryRuntime).toBe(true);
    expect(honest.restartRecoveryNotProductionReady).toBe(true);
    expect(honest.inventoryHonestBaselineIntact).toBe(true);
    expect(honest.retryPolicyFunctionalNotAuthorized).toBe(true);
    expect(honest.retryPolicyNotClaimed).toBe(true);
    expect(W5_N20_E_BINDING_FINDINGS.honestProductEnforcementIntact).toBe(true);
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
    expect(W5_N20_E_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N20_E_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('this slice does not declare package CLOSED, retry policy functional, or Wave 5 COMPLETE', () => {
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.w5N20CompleteClaimed).toBe(false);
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.retryPolicyFunctionalClaimed).toBe(false);
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.notificationPlatformCompleteClaimed).toBe(false);
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.wave5DeclaredComplete).toBe(false);
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.finalPackageIntegrationVerificationPerformed).toBe(false);
    expect(W5_N20_E_BINDING_FINDINGS.packageDeclaredClosed).toBe(false);
    const diagnostics = buildCloseEvidenceDiagnostics();
    expect(diagnostics.packageDeclaredClosed).toBe(false);
    expect(diagnostics.retryPolicyFoundation.ok).toBe(true);
  });
});

describe('W5-N20-e package close evidence — integration / planning', () => {
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
    expect(answers.w5N19NotReopened).toBe(true);
    expect(answers.w5N18NotReopened).toBe(true);
    expect(answers.w5N20CompleteNotClaimed).toBe(true);
    expect(answers.notificationPlatformCompleteNotClaimed).toBe(true);
    expect(answers.retryPolicyFunctionalNotClaimed).toBe(true);
    expect(answers.productionReadyNotClaimed).toBe(true);
    for (const claims of [
      W5_N20_A_ARCHITECTURE_CLAIMS,
      W5_N20_B_ARCHITECTURE_CLAIMS,
      W5_N20_C_ARCHITECTURE_CLAIMS,
      W5_N20_D_ARCHITECTURE_CLAIMS,
    ]) {
      expect(claims.ownershipBoundariesChanged).toBe(false);
      expect(claims.masterPlanModified).toBe(false);
      expect(claims.newPersistenceOwner).toBe(false);
      expect(claims.newBoundedContext).toBe(false);
    }
  });

  it('architecture non-claims: no new capability / no silent expansion', () => {
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.newCustomerFunctionality).toBe(false);
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.newApi).toBe(false);
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.newUi).toBe(false);
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.newPersistence).toBe(false);
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.retryPolicyImplemented).toBe(false);
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.policyEvaluationRuntime).toBe(false);
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.deliveryExecutionRuntime).toBe(false);
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.liveTrading).toBe(false);
    expect(W5_N20_E_INTEGRITY_NON_EXPANSION).toContain('Retry Policy Runtime');
    expect(W5_N20_E_INTEGRITY_NON_EXPANSION).toContain('Notification Platform COMPLETE');
    expect(W5_N20_E_INTEGRITY_NON_EXPANSION).toContain(
      'Final Package Integration Verification Performed',
    );
  });

  it('product verification claims hold across c/d', () => {
    expect(W5_N20_C_ARCHITECTURE_CLAIMS.recoveryDeterministic).toBe(true);
    expect(W5_N20_C_ARCHITECTURE_CLAIMS.recoveryIdempotent).toBe(true);
    expect(
      W5_N20_C_ARCHITECTURE_CLAIMS.notificationPlatformRetryPolicyAnchorStateRestoredAfterRestart,
    ).toBe(true);
    expect(W5_N20_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W5_N20_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N20_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
    expect(OPERATIONAL_STATES).toEqual(['Recovering', 'Ready', 'Degraded', 'Unavailable']);
  });

  it('required close evidence reports exist', () => {
    for (const name of W5_N20_E_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE5, name)), name).toBe(true);
    }
    for (const name of W5_N20_E_REQUIRED_SLICE_REPORTS) {
      expect(existsSync(join(WAVE5, name)), name).toBe(true);
    }
    expect(existsSync(join(WAVE5, 'w5-n20-a-retry-policy-inventory.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'notification-retry-policy-overview.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'wave-5-overview.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'wave-5-validation-plan.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'wave-5-progress.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'w5-n20-planning-summary.md'))).toBe(true);
  });

  it('status docs: W5-N20 CLOSED by Product Owner; Wave 5 COMPLETE not claimed', () => {
    const progress = readWave5('wave-5-progress.md');
    const overview = readWave5('notification-retry-policy-overview.md');
    const close = readWave5('w5-n20-close-package-report.md');
    const summary = readWave5('w5-n20-package-summary.md');
    const finalIntegration = readWave5('w5-n20-final-integration-verification.md');
    const poClose = readWave5('w5-n20-product-owner-close-record.md');
    expect(existsSync(join(WAVE5, 'w5-n20-product-owner-close-record.md'))).toBe(true);
    expect(progress).toMatch(/W5-N20-a|W5-N20-b|W5-N20-c|W5-N20-d|W5-N20-e/);
    expect(progress).toMatch(/CLOSED by Product Owner|W5-N20\s+\*\*CLOSED\*\*/i);
    expect(progress).toMatch(/Final Integration Verification[\s\S]*PASS|FIV[\s\S]*PASS/i);
    expect(progress).toMatch(/Wave 5 COMPLETE[\s\S]*Not claimed|Not claimed[\s\S]*Wave 5 COMPLETE/);
    expect(overview).toMatch(/CLOSED by Product Owner|W5-N20[\s\S]*CLOSED/i);
    expect(overview).toMatch(/STOP/);
    expect(overview).toMatch(
      /Retry Policy implemented[\s\S]*not|not[\s\S]*Retry Policy implemented|Do not declare Retry Policy implemented|Do NOT declare Retry Policy implemented/i,
    );
    expect(close).toMatch(
      /Package \*\*CLOSED\*\* by Product Owner|\*\*CLOSED\*\* by Product Owner|CLOSED by Product Owner/i,
    );
    expect(summary).toMatch(/\*\*CLOSED\*\* by Product Owner/);
    expect(poClose).toMatch(
      /officially CLOSED|Decision:\*\* \*\*CLOSED\*\*|Product Owner decision:\*\* \*\*CLOSED\*\*|Product Owner decision: \*\*CLOSED\*\*/i,
    );
    expect(poClose).toMatch(/Acceptance commit hash|Acceptance Commit/);
    expect(poClose).toMatch(/`[0-9a-f]{7}`/);
    expect(finalIntegration).toMatch(
      /READY FOR PRODUCT OWNER FINAL CLOSE|Final Integration Verification[\s\S]*PASS/i,
    );
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
    expect(W5_N20_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
  });

  it('documentation integrity helper verifies slice and package reports', () => {
    const docs = verifyDocumentationIntegrity((name) => existsSync(join(WAVE5, name)));
    expect(docs.ok).toBe(true);
    expect(docs.sliceReportsComplete).toBe(true);
    expect(docs.packageReportsComplete).toBe(true);
  });

  it('transition / maturity / capability / debt registries are complete', () => {
    expect(W5_N20_E_TRANSITION_MATRIX.before.length).toBeGreaterThan(0);
    expect(W5_N20_E_TRANSITION_MATRIX.after.length).toBeGreaterThan(0);
    expect(W5_N20_E_TRANSITION_MATRIX.stillMissing).toContain(
      'Final Package Integration Verification',
    );
    expect(W5_N20_E_OPERATIONAL_MATURITY.after).toContain('Package Close Evidence');
    expect(W5_N20_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(/restart recovery/);
    expect(W5_N20_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(
      /without retry policy runtime/,
    );
    expect(W5_N20_E_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N20_E_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N20_E_TECHNICAL_DEBT_DELTA.deferred).toContain(
      'Final Package Integration Verification',
    );
  });

  it('platform readiness exposes notification platform retry policy continuity without implementation controls', () => {
    const view = readFileSync(
      join(REPO_ROOT, 'apps/web/src/operational-continuity/OperationalContinuityView.tsx'),
      'utf8',
    );
    const api = readFileSync(join(REPO_ROOT, 'apps/web/src/shared/api.ts'), 'utf8');
    const readiness = readFileSync(
      join(REPO_ROOT, 'apps/api/src/modules/operational-continuity/operational-readiness.ts'),
      'utf8',
    );
    expect(api).toContain('NotificationPlatformRetryPolicyContinuityView');
    expect(view).toMatch(/Notification Platform Retry Policy|notificationPlatformRetryPolicy/i);
    expect(readiness).toMatch(/notificationPlatformRetryPolicy/);
    expect(view).toContain('recoveryTimestamp');
    expect(view).toContain('canonicalAnchorCount');
    expect(view).not.toMatch(/Live Trading|Retry policy evaluation runtime/i);
  });

  it('slice validation reports a–d exist and record PASS', () => {
    for (const slice of ['a', 'b', 'c', 'd'] as const) {
      const report = readWave5(`w5-n20-${slice}-validation-report.md`);
      expect(report).toMatch(/PASS/);
    }
  });
});
