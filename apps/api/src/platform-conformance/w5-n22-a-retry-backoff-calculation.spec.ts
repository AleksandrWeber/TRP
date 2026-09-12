import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N22_A_ARCHITECTURE_CLAIMS,
  W5_N22_A_BINDING_FINDINGS,
  W5_N22_A_BACKOFF_CALCULATION_CLASSIFICATIONS,
  W5_N22_A_TECHNICAL_DEBT_DELTA,
} from './w5-n22-a-retry-backoff-calculation-inventory';
import {
  W5_N22_A_CONFORMANCE_SLICE_ID,
  W5_N22_A_REQUIRED_REPORTS,
  buildBackoffCalculationDiagnostics,
  verifyArchitectureIntegrity,
  verifyHonestProductBaseline,
  verifyHonestyBoundaries,
  verifyInventoryCompleteness,
  verifyOwnershipBoundaries,
} from './w5-n22-a-retry-backoff-calculation';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');

describe('W5-N22-a retry backoff calculation conformance — unit', () => {
  it('slice id and required report list', () => {
    expect(W5_N22_A_CONFORMANCE_SLICE_ID).toBe('W5-N22-a');
    expect(W5_N22_A_REQUIRED_REPORTS.length).toBe(6);
    expect(W5_N22_A_REQUIRED_REPORTS).toEqual([
      'w5-n22-a-retry-backoff-calculation-inventory.md',
      'w5-n22-a-implementation-report.md',
      'w5-n22-a-architecture-review.md',
      'w5-n22-a-security-review.md',
      'w5-n22-a-product-review.md',
      'w5-n22-a-validation-report.md',
    ]);
    expect(W5_N22_A_BACKOFF_CALCULATION_CLASSIFICATIONS).toEqual([
      'CALCULATED',
      'CONFIGURATION',
      'EPHEMERAL',
      'RECOVERABLE',
      'NON-RECOVERABLE',
    ]);
  });

  it('inventory completeness verifies required ownership rows and no backoff calculation authorization', () => {
    const inventory = verifyInventoryCompleteness();
    expect(inventory.ok).toBe(true);
    expect(inventory.rowCount).toBeGreaterThanOrEqual(50);
    expect(inventory.noRowAuthorizesBackoffCalculationFunctional).toBe(true);
    expect(inventory.noRowAuthorizesW5N22Complete).toBe(true);
    expect(inventory.requiredOwnershipRowsPresent).toBe(true);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    const honest = verifyHonestProductBaseline();
    expect(honest.ok).toBe(true);
    expect(honest.noCustomerVisibleImplemented).toBe(true);
    expect(honest.infrastructureDocumented).toBe(true);
    expect(honest.plannedExplicit).toBe(true);
    expect(honest.notImplementedExplicit).toBe(true);
    expect(honest.backoffCalculationNotAuthorized).toBe(true);
    expect(honest.deliveryOnlyNotControlPlane).toBe(true);
  });

  it('architecture integrity: ownership preserved; no Calculation Engine; Exchange Adapter untouched', () => {
    const arch = verifyArchitectureIntegrity();
    expect(arch.ok).toBe(true);
    expect(arch.ownershipUnchanged).toBe(true);
    expect(arch.noDuplicateSubsystem).toBe(true);
    expect(arch.noCalculationEngine).toBe(true);
    expect(arch.noMasterPlanChange).toBe(true);
    expect(arch.exchangeAdapterUntouched).toBe(true);
    expect(arch.notificationControlPlaneForbidden).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N22_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('ownership boundaries: no new persistence owner', () => {
    const ownership = verifyOwnershipBoundaries();
    expect(ownership.ok).toBe(true);
    expect(ownership.ownershipVerified).toBe(true);
    expect(ownership.newPersistenceOwner).toBe(false);
    expect(ownership.substrateOwnersFrozen).toBe(true);
  });

  it('honesty boundaries: calculation-only honesty rules frozen', () => {
    const honesty = verifyHonestyBoundaries();
    expect(honesty.ok).toBe(true);
    expect(honesty.calculationOnlyNotScheduling).toBe(true);
    expect(honesty.calculationOnlyNotExecution).toBe(true);
    expect(honesty.calculationOnlyNotLifecycle).toBe(true);
    expect(honesty.calculationOnlyNotTimers).toBe(true);
    expect(honesty.calculationOnlyNotWorkers).toBe(true);
    expect(honesty.calculationOnlyNotOrchestration).toBe(true);
    expect(honesty.calculationOutputInformational).toBe(true);
    expect(honesty.noCalculationEngine).toBe(true);
    expect(honesty.noBackoffEngine).toBe(true);
    expect(honesty.backoffFoundationNotCalculationRuntime).toBe(true);
  });

  it('binding findings: Backoff Calculation cannot function after slice a', () => {
    expect(W5_N22_A_BINDING_FINDINGS.backoffCalculationFunctionsAfterSliceA).toBe(false);
    expect(W5_N22_A_BINDING_FINDINGS.w5N17DeliveryReliabilityExists).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.w5N18RetryExecutionExists).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.w5N19RetrySchedulingExists).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.w5N20RetryPolicyExists).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.w5N21RetryBackoffExists).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.unifiedPlatformBackoffCalculationLayerMissing).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.backoffCalculationPersistenceMissing).toBe(false);
    expect(W5_N22_A_BINDING_FINDINGS.backoffCalculationRecoveryMissing).toBe(false);
    expect(W5_N22_A_BINDING_FINDINGS.backoffCalculationOperationalContinuityMissing).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.backoffCalculationFunctionalClaimed).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.w5N22CompleteClaimed).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.notificationPlatformCompleteClaimed).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.liveTradingClaimed).toBe(false);
  });

  it('technical debt delta: inventory baseline resolved; b–e deferred; nothing introduced', () => {
    expect(W5_N22_A_TECHNICAL_DEBT_DELTA.resolved).toEqual([
      'Retry Backoff Calculation inventory baseline established',
    ]);
    expect(W5_N22_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N22_A_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N22-b — Durable Persistence Foundation',
      'W5-N22-c — Restart Recovery Foundation',
      'W5-N22-d — Operational Continuity Foundation',
      'W5-N22-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('diagnostics roll-up passes for slice a scope', () => {
    const diagnostics = buildBackoffCalculationDiagnostics();
    expect(diagnostics.ok).toBe(true);
    expect(diagnostics.inventory.ok).toBe(true);
    expect(diagnostics.honestProduct.ok).toBe(true);
    expect(diagnostics.architecture.ok).toBe(true);
    expect(diagnostics.ownership.ok).toBe(true);
    expect(diagnostics.honesty.ok).toBe(true);
  });
});

describe('W5-N22-a retry backoff calculation conformance — integration / planning', () => {
  it('required reports list is frozen (docs created by parent / package close)', () => {
    expect(W5_N22_A_REQUIRED_REPORTS).toEqual([
      'w5-n22-a-retry-backoff-calculation-inventory.md',
      'w5-n22-a-implementation-report.md',
      'w5-n22-a-architecture-review.md',
      'w5-n22-a-security-review.md',
      'w5-n22-a-product-review.md',
      'w5-n22-a-validation-report.md',
    ]);
    // Parent agent creates markdown reports under docs/project/version-3/wave-5/.
    // Assert inventory report path when present; always assert the frozen filename list above.
    const inventoryReport = join(WAVE5, 'w5-n22-a-retry-backoff-calculation-inventory.md');
    if (existsSync(inventoryReport)) {
      for (const name of W5_N22_A_REQUIRED_REPORTS) {
        expect(existsSync(join(WAVE5, name))).toBe(true);
      }
    }
  });

  it('conformance source files exist on disk', () => {
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/platform-conformance/w5-n22-a-retry-backoff-calculation-inventory.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(REPO_ROOT, 'apps/api/src/platform-conformance/w5-n22-a-retry-backoff-calculation.ts'),
      ),
    ).toBe(true);
  });
});
