import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N23_A_ARCHITECTURE_CLAIMS,
  W5_N23_A_BINDING_FINDINGS,
  W5_N23_A_ELIGIBILITY_CLASSIFICATIONS,
  W5_N23_A_TECHNICAL_DEBT_DELTA,
} from './w5-n23-a-retry-eligibility-inventory';
import {
  W5_N23_A_CONFORMANCE_SLICE_ID,
  W5_N23_A_REQUIRED_REPORTS,
  buildEligibilityDiagnostics,
  verifyArchitectureIntegrity,
  verifyHonestProductBaseline,
  verifyHonestyBoundaries,
  verifyInventoryCompleteness,
  verifyOwnershipBoundaries,
} from './w5-n23-a-retry-eligibility';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');

describe('W5-N23-a retry eligibility conformance — unit', () => {
  it('slice id and required report list', () => {
    expect(W5_N23_A_CONFORMANCE_SLICE_ID).toBe('W5-N23-a');
    expect(W5_N23_A_REQUIRED_REPORTS.length).toBe(6);
    expect(W5_N23_A_REQUIRED_REPORTS).toEqual([
      'w5-n23-a-inventory.md',
      'w5-n23-a-implementation-report.md',
      'w5-n23-a-architecture-review.md',
      'w5-n23-a-security-review.md',
      'w5-n23-a-product-review.md',
      'w5-n23-a-validation-report.md',
    ]);
    expect(W5_N23_A_ELIGIBILITY_CLASSIFICATIONS).toEqual([
      'ELIGIBILITY',
      'CONFIGURATION',
      'EPHEMERAL',
      'RECOVERABLE',
      'NON-RECOVERABLE',
    ]);
  });

  it('inventory completeness verifies required ownership rows and no eligibility authorization', () => {
    const inventory = verifyInventoryCompleteness();
    expect(inventory.ok).toBe(true);
    expect(inventory.rowCount).toBeGreaterThanOrEqual(50);
    expect(inventory.noRowAuthorizesEligibilityFunctional).toBe(true);
    expect(inventory.noRowAuthorizesW5N23Complete).toBe(true);
    expect(inventory.requiredOwnershipRowsPresent).toBe(true);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    const honest = verifyHonestProductBaseline();
    expect(honest.ok).toBe(true);
    expect(honest.noCustomerVisibleImplemented).toBe(true);
    expect(honest.infrastructureDocumented).toBe(true);
    expect(honest.plannedExplicit).toBe(true);
    expect(honest.notImplementedExplicit).toBe(true);
    expect(honest.eligibilityNotAuthorized).toBe(true);
    expect(honest.deliveryOnlyNotControlPlane).toBe(true);
  });

  it('architecture integrity: ownership preserved; no Eligibility Engine; Exchange Adapter untouched', () => {
    const arch = verifyArchitectureIntegrity();
    expect(arch.ok).toBe(true);
    expect(arch.ownershipUnchanged).toBe(true);
    expect(arch.noDuplicateSubsystem).toBe(true);
    expect(arch.noEligibilityEngine).toBe(true);
    expect(arch.noMasterPlanChange).toBe(true);
    expect(arch.exchangeAdapterUntouched).toBe(true);
    expect(arch.notificationControlPlaneForbidden).toBe(true);
    expect(W5_N23_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N23_A_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N23_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
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
    expect(honesty.inventoryOnlyNotEligibilityDetermination).toBe(true);
    expect(honesty.inventoryOnlyNotBackoffCalculation).toBe(true);
    expect(honesty.inventoryOnlyNotScheduling).toBe(true);
    expect(honesty.inventoryOnlyNotExecution).toBe(true);
    expect(honesty.inventoryOnlyNotLifecycle).toBe(true);
    expect(honesty.inventoryOnlyNotTimers).toBe(true);
    expect(honesty.inventoryOnlyNotWorkers).toBe(true);
    expect(honesty.inventoryOnlyNotOrchestration).toBe(true);
    expect(honesty.inventoryOutputInformational).toBe(true);
    expect(honesty.noEligibilityEngine).toBe(true);
    expect(honesty.noRetryEngine).toBe(true);
    expect(honesty.noRuntimeEligibility).toBe(true);
  });

  it('binding findings: Eligibility cannot function after slice a', () => {
    expect(W5_N23_A_BINDING_FINDINGS.eligibilityFunctionsAfterSliceA).toBe(false);
    expect(W5_N23_A_BINDING_FINDINGS.w5N17DeliveryReliabilityExists).toBe(true);
    expect(W5_N23_A_BINDING_FINDINGS.w5N18RetryExecutionExists).toBe(true);
    expect(W5_N23_A_BINDING_FINDINGS.w5N19RetrySchedulingExists).toBe(true);
    expect(W5_N23_A_BINDING_FINDINGS.w5N20RetryPolicyExists).toBe(true);
    expect(W5_N23_A_BINDING_FINDINGS.w5N21RetryBackoffExists).toBe(true);
    expect(W5_N23_A_BINDING_FINDINGS.w5N22RetryBackoffCalculationExists).toBe(true);
    expect(W5_N23_A_BINDING_FINDINGS.unifiedPlatformEligibilityLayerMissing).toBe(true);
    expect(W5_N23_A_BINDING_FINDINGS.eligibilityPersistenceMissing).toBe(false);
    expect(W5_N23_A_BINDING_FINDINGS.eligibilityRecoveryMissing).toBe(false);
    expect(W5_N23_A_BINDING_FINDINGS.eligibilityOperationalContinuityMissing).toBe(true);
    expect(W5_N23_A_ARCHITECTURE_CLAIMS.eligibilityFunctionalClaimed).toBe(false);
    expect(W5_N23_A_ARCHITECTURE_CLAIMS.w5N23CompleteClaimed).toBe(false);
    expect(W5_N23_A_ARCHITECTURE_CLAIMS.notificationPlatformCompleteClaimed).toBe(false);
    expect(W5_N23_A_ARCHITECTURE_CLAIMS.liveTradingClaimed).toBe(false);
  });

  it('technical debt delta: inventory baseline resolved; b–e deferred; nothing introduced', () => {
    expect(W5_N23_A_TECHNICAL_DEBT_DELTA.resolved).toEqual([
      'Notification Retry Eligibility inventory baseline established',
    ]);
    expect(W5_N23_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N23_A_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'Persistence Foundation (W5-N23-b)',
      'Restart Recovery Foundation (W5-N23-c)',
      'Operational Continuity Foundation (W5-N23-d)',
      'Package Validation & Close Evidence (W5-N23-e)',
    ]);
  });

  it('diagnostics roll-up passes for slice a scope', () => {
    const diagnostics = buildEligibilityDiagnostics();
    expect(diagnostics.ok).toBe(true);
    expect(diagnostics.inventory.ok).toBe(true);
    expect(diagnostics.honestProduct.ok).toBe(true);
    expect(diagnostics.architecture.ok).toBe(true);
    expect(diagnostics.ownership.ok).toBe(true);
    expect(diagnostics.honesty.ok).toBe(true);
  });
});

describe('W5-N23-a retry eligibility conformance — integration / planning', () => {
  it('required reports list is frozen (docs created by parent / package close)', () => {
    expect(W5_N23_A_REQUIRED_REPORTS).toEqual([
      'w5-n23-a-inventory.md',
      'w5-n23-a-implementation-report.md',
      'w5-n23-a-architecture-review.md',
      'w5-n23-a-security-review.md',
      'w5-n23-a-product-review.md',
      'w5-n23-a-validation-report.md',
    ]);
    // Parent agent creates markdown reports under docs/project/version-3/wave-5/.
    // Assert inventory report path when present; always assert the frozen filename list above.
    const inventoryReport = join(WAVE5, 'w5-n23-a-inventory.md');
    if (existsSync(inventoryReport)) {
      for (const name of W5_N23_A_REQUIRED_REPORTS) {
        expect(existsSync(join(WAVE5, name))).toBe(true);
      }
    }
  });

  it('conformance source files exist on disk', () => {
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/platform-conformance/w5-n23-a-retry-eligibility-inventory.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(REPO_ROOT, 'apps/api/src/platform-conformance/w5-n23-a-retry-eligibility.ts'),
      ),
    ).toBe(true);
  });
});
