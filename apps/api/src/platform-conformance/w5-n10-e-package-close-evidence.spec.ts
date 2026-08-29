import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import { W5_N10_A_ARCHITECTURE_CLAIMS } from './w5-n10-a-notification-platform-worker-execution-inventory';
import { W5_N10_B_ARCHITECTURE_CLAIMS } from './w5-n10-b-durable-notification-platform-worker-execution';
import { W5_N10_C_ARCHITECTURE_CLAIMS } from './w5-n10-c-notification-platform-worker-execution-restart-recovery';
import { W5_N10_D_ARCHITECTURE_CLAIMS } from './w5-n10-d-notification-platform-worker-execution-operational-continuity';
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
  verifyWorkerExecutionFoundationChain,
  W5_N10_E_APPROVED_SLICES,
  W5_N10_E_ARCHITECTURE_CLAIMS,
  W5_N10_E_BINDING_FINDINGS,
  W5_N10_E_CAPABILITY_EVOLUTION,
  W5_N10_E_DEPENDENCY_CHAIN,
  W5_N10_E_INTEGRITY_NON_EXPANSION,
  W5_N10_E_NOTIFICATION_OWNER,
  W5_N10_E_OPERATIONAL_MATURITY,
  W5_N10_E_REQUIRED_REPORTS,
  W5_N10_E_REQUIRED_SLICE_REPORTS,
  W5_N10_E_SLICE_ID,
  W5_N10_E_TECHNICAL_DEBT_DELTA,
  W5_N10_E_TRANSITION_MATRIX,
} from './w5-n10-e-package-close-evidence';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');

function readWave5(name: string): string {
  return readFileSync(join(WAVE5, name), 'utf8');
}

describe('W5-N10-e package close evidence — unit', () => {
  it('approved slices a–d recorded PASS for validation / architecture / security / product', () => {
    expect(W5_N10_E_SLICE_ID).toBe('W5-N10-e');
    expect(W5_N10_E_NOTIFICATION_OWNER).toBe('notification-delivery');
    expect(W5_N10_E_APPROVED_SLICES.map((s) => s.id)).toEqual([
      'W5-N10-a',
      'W5-N10-b',
      'W5-N10-c',
      'W5-N10-d',
    ]);
    expect(
      W5_N10_E_APPROVED_SLICES.every(
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
    expect(W5_N10_E_BINDING_FINDINGS.implementationChainComplete).toBe(true);
  });

  it('dependency chain intact — prior packages closed and consumed, not reopened', () => {
    const dependency = verifyDependencyChain();
    expect(dependency.ok).toBe(true);
    expect(dependency.priorPackagesClosed).toBe(true);
    expect(dependency.w5N05ConsumedNotReopened).toBe(true);
    expect(dependency.w5N07ConsumedNotReopened).toBe(true);
    expect(dependency.w5N08ConsumedNotReopened).toBe(true);
    expect(dependency.w5N09ConsumedNotReopened).toBe(true);
    expect(dependency.perChannelFoundationsNotReopened).toBe(true);
    expect(W5_N10_E_DEPENDENCY_CHAIN.map((link) => link.packageId)).toEqual([
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
    ]);
    expect(W5_N10_E_BINDING_FINDINGS.dependencyChainIntact).toBe(true);
  });

  it('worker execution foundation chain integrity holds', () => {
    const foundation = verifyWorkerExecutionFoundationChain();
    expect(foundation.ok).toBe(true);
    expect(foundation.inventoryOk).toBe(true);
    expect(foundation.persistenceOk).toBe(true);
    expect(foundation.recoveryOk).toBe(true);
    expect(foundation.continuityOk).toBe(true);
    expect(W5_N10_E_BINDING_FINDINGS.workerExecutionFoundationChainIntact).toBe(true);
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
    expect(W5_N10_E_BINDING_FINDINGS.operationalJourneyWorks).toBe(true);
  });

  it('Honest Product enforcement intact', () => {
    const honest = verifyHonestProduct();
    expect(honest.ok).toBe(true);
    expect(honest.operationalContinuityNotPlatformWorkerExecutionRuntime).toBe(true);
    expect(honest.restartRecoveryNotProductionReady).toBe(true);
    expect(honest.inventoryHonestBaselineIntact).toBe(true);
    expect(honest.platformWorkerExecutionFunctionalNotAuthorized).toBe(true);
    expect(honest.workerRuntimeNotClaimed).toBe(true);
    expect(W5_N10_E_BINDING_FINDINGS.honestProductEnforcementIntact).toBe(true);
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
    expect(W5_N10_E_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N10_E_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('this slice does not declare package CLOSED, worker execution functional, or Wave 5 COMPLETE', () => {
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.w5N10CompleteClaimed).toBe(false);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.platformWorkerExecutionFunctionalClaimed).toBe(false);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.notificationPlatformCompleteClaimed).toBe(false);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.wave5DeclaredComplete).toBe(false);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.finalPackageIntegrationVerificationPerformed).toBe(false);
    expect(W5_N10_E_BINDING_FINDINGS.packageDeclaredClosed).toBe(false);
    const diagnostics = buildCloseEvidenceDiagnostics();
    expect(diagnostics.packageDeclaredClosed).toBe(false);
  });
});

describe('W5-N10-e package close evidence — integration / planning', () => {
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
    expect(answers.w5N05NotReopened).toBe(true);
    expect(answers.w5N06NotReopened).toBe(true);
    expect(answers.w5N07NotReopened).toBe(true);
    expect(answers.w5N08NotReopened).toBe(true);
    expect(answers.w5N09NotReopened).toBe(true);
    expect(answers.w5N10CompleteNotClaimed).toBe(true);
    expect(answers.notificationPlatformCompleteNotClaimed).toBe(true);
    expect(answers.platformWorkerExecutionFunctionalNotClaimed).toBe(true);
    expect(answers.productionReadyNotClaimed).toBe(true);
    for (const claims of [
      W5_N10_A_ARCHITECTURE_CLAIMS,
      W5_N10_B_ARCHITECTURE_CLAIMS,
      W5_N10_C_ARCHITECTURE_CLAIMS,
      W5_N10_D_ARCHITECTURE_CLAIMS,
    ]) {
      expect(claims.ownershipBoundariesChanged).toBe(false);
      expect(claims.masterPlanModified).toBe(false);
      expect(claims.newPersistenceOwner).toBe(false);
      expect(claims.newBoundedContext).toBe(false);
    }
  });

  it('architecture non-claims: no new capability / no silent expansion', () => {
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.newCustomerFunctionality).toBe(false);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.newApi).toBe(false);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.newUi).toBe(false);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.newPersistence).toBe(false);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.platformWorkerExecutionRuntime).toBe(false);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.workerRuntimeImplemented).toBe(false);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.liveTrading).toBe(false);
    expect(W5_N10_E_INTEGRITY_NON_EXPANSION).toContain('Worker Runtime Implementation');
    expect(W5_N10_E_INTEGRITY_NON_EXPANSION).toContain(
      'Final Package Integration Verification Performed',
    );
  });

  it('product verification claims hold across c/d', () => {
    expect(W5_N10_C_ARCHITECTURE_CLAIMS.recoveryDeterministic).toBe(true);
    expect(W5_N10_C_ARCHITECTURE_CLAIMS.recoveryIdempotent).toBe(true);
    expect(
      W5_N10_C_ARCHITECTURE_CLAIMS.notificationPlatformWorkerExecutionAnchorStateRestoredAfterRestart,
    ).toBe(true);
    expect(W5_N10_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W5_N10_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N10_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
    expect(OPERATIONAL_STATES).toEqual(['Recovering', 'Ready', 'Degraded', 'Unavailable']);
  });

  it('required close evidence reports exist', () => {
    for (const name of W5_N10_E_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE5, name)), name).toBe(true);
    }
    for (const name of W5_N10_E_REQUIRED_SLICE_REPORTS) {
      expect(existsSync(join(WAVE5, name)), name).toBe(true);
    }
    expect(
      existsSync(join(WAVE5, 'w5-n10-a-notification-platform-worker-execution-inventory.md')),
    ).toBe(true);
    expect(existsSync(join(WAVE5, 'wave-5-overview.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'wave-5-validation-plan.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'wave-5-progress.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'w5-n10-planning-approval.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'w5-n10-final-integration-verification.md'))).toBe(true);
    expect(existsSync(join(WAVE5, 'w5-n10-product-owner-close-record.md'))).toBe(false);
  });

  it('documentation integrity helper verifies slice and package reports', () => {
    const docs = verifyDocumentationIntegrity((name) => existsSync(join(WAVE5, name)));
    expect(docs.ok).toBe(true);
    expect(docs.sliceReportsComplete).toBe(true);
    expect(docs.packageReportsComplete).toBe(true);
  });

  it('transition / maturity / capability / debt registries are complete', () => {
    expect(W5_N10_E_TRANSITION_MATRIX.before.length).toBeGreaterThan(0);
    expect(W5_N10_E_TRANSITION_MATRIX.after.length).toBeGreaterThan(0);
    expect(W5_N10_E_TRANSITION_MATRIX.stillMissing).toContain(
      'Final Package Integration Verification',
    );
    expect(W5_N10_E_OPERATIONAL_MATURITY.after).toContain('Package Close Evidence');
    expect(W5_N10_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(/restart recovery/);
    expect(W5_N10_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(
      /without platform worker execution runtime/,
    );
    expect(W5_N10_E_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N10_E_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
  });

  it('platform readiness exposes notification platform worker execution continuity without implementation controls', () => {
    const view = readFileSync(
      join(REPO_ROOT, 'apps/web/src/operational-continuity/OperationalContinuityView.tsx'),
      'utf8',
    );
    const api = readFileSync(join(REPO_ROOT, 'apps/web/src/shared/api.ts'), 'utf8');
    expect(api).toContain('NotificationPlatformWorkerExecutionContinuityView');
    expect(view).toMatch(
      /Notification Platform Worker Execution|notificationPlatformWorkerExecution/i,
    );
    expect(view).toContain('recoveryTimestamp');
    expect(view).toContain('canonicalAnchorCount');
    expect(view).not.toMatch(/Executing|Live Trading/i);
  });

  it('status docs: Final Integration Verification PASS local; package not CLOSED; Wave 5 COMPLETE not claimed', () => {
    const progress = readWave5('wave-5-progress.md');
    const overview = readWave5('wave-5-overview.md');
    const close = readWave5('w5-n10-package-close-report.md');
    const summary = readWave5('w5-n10-package-summary.md');
    const finalIntegration = readWave5('w5-n10-final-integration-verification.md');
    expect(progress).toMatch(/W5-N10-a|W5-N10-b|W5-N10-c|W5-N10-d|W5-N10-e/);
    expect(progress).toMatch(/Final Integration Verification[\s\S]*PASS/i);
    expect(progress).toMatch(/Awaiting Product Owner Final Close/i);
    expect(progress).toMatch(
      /\|\s\*\*W5-N10\*\*\s\|\s\*\*V3-N10\*\*[^\n]*Awaiting Product Owner Final Close/i,
    );
    expect(progress).not.toMatch(
      /\|\s\*\*W5-N10\*\*\s\|\s\*\*V3-N10\*\*[^\n]*CLOSED by Product Owner/i,
    );
    expect(progress).toMatch(/Wave 5 COMPLETE[\s\S]*Not claimed|Not claimed[\s\S]*Wave 5 COMPLETE/);
    expect(overview).toMatch(/Final Integration Verification[\s\S]*PASS/i);
    expect(overview).toMatch(/STOP/);
    expect(overview).not.toMatch(/W5-N10 status[\s\S]*CLOSED by Product Owner/i);
    expect(close).toMatch(/Awaiting Product Owner|not declare|must not/i);
    expect(summary).toMatch(/must not|not declare|foundation scope only/i);
    expect(finalIntegration).toMatch(/READY FOR PRODUCT OWNER FINAL CLOSE/);
    expect(finalIntegration).toMatch(/97%/);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
    expect(W5_N10_E_ARCHITECTURE_CLAIMS.finalPackageIntegrationVerificationPerformed).toBe(false);
  });

  it('slice validation reports a–d exist and record PASS', () => {
    for (const slice of ['a', 'b', 'c', 'd'] as const) {
      const report = readWave5(`w5-n10-${slice}-validation-report.md`);
      expect(report).toMatch(/PASS/);
    }
  });
});
