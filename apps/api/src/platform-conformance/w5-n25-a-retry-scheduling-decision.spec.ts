import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N25_A_ARCHITECTURE_CLAIMS,
  W5_N25_A_BINDING_FINDINGS,
  W5_N25_A_DECISION_CLASSIFICATIONS,
  W5_N25_A_TECHNICAL_DEBT_DELTA,
} from './w5-n25-a-retry-scheduling-decision-inventory';
import {
  W5_N25_A_CONFORMANCE_SLICE_ID,
  W5_N25_A_REQUIRED_REPORTS,
  buildDecisionDiagnostics,
  verifyArchitectureIntegrity,
  verifyHonestProductBaseline,
  verifyHonestyBoundaries,
  verifyInventoryCompleteness,
  verifyOwnershipBoundaries,
} from './w5-n25-a-retry-scheduling-decision';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');

describe('W5-N25-a retry scheduling decision conformance — unit', () => {
  it('slice id and required report list', () => {
    expect(W5_N25_A_CONFORMANCE_SLICE_ID).toBe('W5-N25-a');
    expect(W5_N25_A_REQUIRED_REPORTS.length).toBe(6);
    expect(W5_N25_A_REQUIRED_REPORTS).toEqual([
      'w5-n25-a-inventory.md',
      'w5-n25-a-implementation-report.md',
      'w5-n25-a-architecture-review.md',
      'w5-n25-a-security-review.md',
      'w5-n25-a-product-review.md',
      'w5-n25-a-validation-report.md',
    ]);
    expect(W5_N25_A_DECISION_CLASSIFICATIONS).toEqual([
      'DECISION',
      'CONFIGURATION',
      'EPHEMERAL',
      'RECOVERABLE',
      'NON-RECOVERABLE',
    ]);
  });

  it('inventory completeness verifies required ownership rows and no scheduling authorization', () => {
    const inventory = verifyInventoryCompleteness();
    expect(inventory.ok).toBe(true);
    expect(inventory.rowCount).toBeGreaterThanOrEqual(50);
    expect(inventory.noRowAuthorizesDecisionFunctional).toBe(true);
    expect(inventory.noRowAuthorizesW5N25Complete).toBe(true);
    expect(inventory.requiredOwnershipRowsPresent).toBe(true);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    const honest = verifyHonestProductBaseline();
    expect(honest.ok).toBe(true);
    expect(honest.noCustomerVisibleImplemented).toBe(true);
    expect(honest.infrastructureDocumented).toBe(true);
    expect(honest.plannedExplicit).toBe(true);
    expect(honest.notImplementedExplicit).toBe(true);
    expect(honest.decisionNotAuthorized).toBe(true);
    expect(honest.deliveryOnlyNotControlPlane).toBe(true);
  });

  it('architecture integrity: ownership preserved; no Runtime Scheduler; Exchange Adapter untouched', () => {
    const arch = verifyArchitectureIntegrity();
    expect(arch.ok).toBe(true);
    expect(arch.ownershipUnchanged).toBe(true);
    expect(arch.noDuplicateSubsystem).toBe(true);
    expect(arch.noRuntimeScheduler).toBe(true);
    expect(arch.noMasterPlanChange).toBe(true);
    expect(arch.exchangeAdapterUntouched).toBe(true);
    expect(arch.notificationControlPlaneForbidden).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N25_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('ownership boundaries: no new persistence owner', () => {
    const ownership = verifyOwnershipBoundaries();
    expect(ownership.ok).toBe(true);
    expect(ownership.ownershipVerified).toBe(true);
    expect(ownership.newPersistenceOwner).toBe(false);
    expect(ownership.substrateOwnersFrozen).toBe(true);
  });

  it('honesty boundaries: inventory-only honesty rules frozen', () => {
    const honesty = verifyHonestyBoundaries();
    expect(honesty.ok).toBe(true);
    expect(honesty.inventoryOnlyNotRuntimeDecisionLogic).toBe(true);
    expect(honesty.inventoryOnlyNotSchedulingDecisions).toBe(true);
    expect(honesty.inventoryOnlyNotEligibilityDetermination).toBe(true);
    expect(honesty.inventoryOnlyNotBackoffCalculation).toBe(true);
    expect(honesty.inventoryOnlyNotRuntimeScheduling).toBe(true);
    expect(honesty.inventoryOnlyNotExecution).toBe(true);
    expect(honesty.inventoryOnlyNotLifecycle).toBe(true);
    expect(honesty.inventoryOnlyNotTimers).toBe(true);
    expect(honesty.inventoryOnlyNotWorkers).toBe(true);
    expect(honesty.inventoryOnlyNotOrchestration).toBe(true);
    expect(honesty.inventoryOutputInformational).toBe(true);
    expect(honesty.noRuntimeScheduler).toBe(true);
    expect(honesty.noRetryEngine).toBe(true);
    expect(honesty.noRuntimeDecisionEngine).toBe(true);
    expect(honesty.noTimerImplementation).toBe(true);
  });

  it('binding findings: Scheduling cannot function after slice a', () => {
    expect(W5_N25_A_BINDING_FINDINGS.decisionFunctionsAfterSliceA).toBe(false);
    expect(W5_N25_A_BINDING_FINDINGS.w5N17DeliveryReliabilityExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.w5N18RetryExecutionExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.w5N19RetrySchedulingExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.w5N20RetryPolicyExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.w5N21RetryBackoffExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.w5N22RetryBackoffCalculationExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.w5N23RetryEligibilityExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.w5N24RetrySchedulingExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.unifiedPlatformDecisionLayerMissing).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.decisionPersistenceMissing).toBe(false);
    expect(W5_N25_A_BINDING_FINDINGS.decisionRecoveryMissing).toBe(false);
    expect(W5_N25_A_BINDING_FINDINGS.decisionOperationalContinuityMissing).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.decisionFunctionalClaimed).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.w5N25CompleteClaimed).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.notificationPlatformCompleteClaimed).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.liveTradingClaimed).toBe(false);
  });

  it('technical debt delta: inventory baseline resolved; Repo Sync after Close / runtime scheduling deferred; nothing introduced', () => {
    expect(W5_N25_A_TECHNICAL_DEBT_DELTA.resolved).toEqual([
      'Notification Retry Scheduling Decision inventory baseline established',
    ]);
    expect(W5_N25_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N25_A_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'Persistence Foundation (W5-N25-b)',
      'Restart Recovery Foundation (W5-N25-c)',
      'Operational Continuity Foundation (W5-N25-d)',
      'Package Validation & Operational Verification (W5-N25-e)',
    ]);
  });

  it('diagnostics roll-up passes for slice a scope', () => {
    const diagnostics = buildDecisionDiagnostics();
    expect(diagnostics.ok).toBe(true);
    expect(diagnostics.inventory.ok).toBe(true);
    expect(diagnostics.honestProduct.ok).toBe(true);
    expect(diagnostics.architecture.ok).toBe(true);
    expect(diagnostics.ownership.ok).toBe(true);
    expect(diagnostics.honesty.ok).toBe(true);
  });
});

describe('W5-N25-a retry scheduling decision conformance — integration / planning', () => {
  it('required reports list is frozen (docs created by parent / package close)', () => {
    expect(W5_N25_A_REQUIRED_REPORTS).toEqual([
      'w5-n25-a-inventory.md',
      'w5-n25-a-implementation-report.md',
      'w5-n25-a-architecture-review.md',
      'w5-n25-a-security-review.md',
      'w5-n25-a-product-review.md',
      'w5-n25-a-validation-report.md',
    ]);
    // Parent agent creates markdown reports under docs/project/version-3/wave-5/.
    // Assert inventory report path when present; always assert the frozen filename list above.
    const inventoryReport = join(WAVE5, 'w5-n25-a-inventory.md');
    if (existsSync(inventoryReport)) {
      for (const name of W5_N25_A_REQUIRED_REPORTS) {
        expect(existsSync(join(WAVE5, name))).toBe(true);
      }
    }
  });

  it('conformance source files exist on disk', () => {
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/platform-conformance/w5-n25-a-retry-scheduling-decision-inventory.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(REPO_ROOT, 'apps/api/src/platform-conformance/w5-n25-a-retry-scheduling-decision.ts'),
      ),
    ).toBe(true);
  });
});
