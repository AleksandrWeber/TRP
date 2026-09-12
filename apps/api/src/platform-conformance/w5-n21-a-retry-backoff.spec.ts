import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N21_A_ARCHITECTURE_CLAIMS,
  W5_N21_A_BINDING_FINDINGS,
  W5_N21_A_RETRY_BACKOFF_CLASSIFICATIONS,
  W5_N21_A_TECHNICAL_DEBT_DELTA,
} from './w5-n21-a-retry-backoff-inventory';
import {
  W5_N21_A_CONFORMANCE_SLICE_ID,
  W5_N21_A_REQUIRED_REPORTS,
  buildRetryBackoffDiagnostics,
  verifyArchitectureIntegrity,
  verifyHonestProductBaseline,
  verifyHonestyBoundaries,
  verifyInventoryCompleteness,
  verifyOwnershipBoundaries,
} from './w5-n21-a-retry-backoff';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');

describe('W5-N21-a retry backoff conformance — unit', () => {
  it('slice id and required report list', () => {
    expect(W5_N21_A_CONFORMANCE_SLICE_ID).toBe('W5-N21-a');
    expect(W5_N21_A_REQUIRED_REPORTS.length).toBe(6);
    expect(W5_N21_A_RETRY_BACKOFF_CLASSIFICATIONS).toEqual([
      'FOUNDATION',
      'DURABLE',
      'RECOVERABLE',
      'EPHEMERAL',
      'OUT OF SCOPE',
    ]);
  });

  it('inventory completeness verifies required ownership rows and no retry backoff authorization', () => {
    const inventory = verifyInventoryCompleteness();
    expect(inventory.ok).toBe(true);
    expect(inventory.rowCount).toBeGreaterThanOrEqual(50);
    expect(inventory.noRowAuthorizesRetryBackoffFunctional).toBe(true);
    expect(inventory.noRowAuthorizesW5N21Complete).toBe(true);
    expect(inventory.requiredOwnershipRowsPresent).toBe(true);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    const honest = verifyHonestProductBaseline();
    expect(honest.ok).toBe(true);
    expect(honest.noCustomerVisibleImplemented).toBe(true);
    expect(honest.infrastructureDocumented).toBe(true);
    expect(honest.plannedExplicit).toBe(true);
    expect(honest.notImplementedExplicit).toBe(true);
    expect(honest.retryBackoffNotAuthorized).toBe(true);
    expect(honest.deliveryOnlyNotControlPlane).toBe(true);
  });

  it('architecture integrity: ownership preserved; no Backoff Engine; Exchange Adapter untouched', () => {
    const arch = verifyArchitectureIntegrity();
    expect(arch.ok).toBe(true);
    expect(arch.ownershipUnchanged).toBe(true);
    expect(arch.noDuplicateSubsystem).toBe(true);
    expect(arch.noBackoffEngine).toBe(true);
    expect(arch.noMasterPlanChange).toBe(true);
    expect(arch.exchangeAdapterUntouched).toBe(true);
    expect(arch.notificationControlPlaneForbidden).toBe(true);
    expect(W5_N21_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N21_A_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N21_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('ownership boundaries: no new persistence owner', () => {
    const ownership = verifyOwnershipBoundaries();
    expect(ownership.ok).toBe(true);
    expect(ownership.ownershipVerified).toBe(true);
    expect(ownership.newPersistenceOwner).toBe(false);
    expect(ownership.substrateOwnersFrozen).toBe(true);
  });

  it('honesty boundaries: retry backoff honesty rules frozen', () => {
    const honesty = verifyHonestyBoundaries();
    expect(honesty.ok).toBe(true);
    expect(honesty.retryBackoffNotCalculation).toBe(true);
    expect(honesty.noBackoffEngine).toBe(true);
    expect(honesty.retryPolicyNotRetryBackoff).toBe(true);
  });

  it('binding findings: Retry Backoff cannot function after slice a', () => {
    expect(W5_N21_A_BINDING_FINDINGS.retryBackoffFunctionsAfterSliceA).toBe(false);
    expect(W5_N21_A_BINDING_FINDINGS.w5N17DeliveryReliabilityExists).toBe(true);
    expect(W5_N21_A_BINDING_FINDINGS.w5N18RetryExecutionExists).toBe(true);
    expect(W5_N21_A_BINDING_FINDINGS.w5N19RetrySchedulingExists).toBe(true);
    expect(W5_N21_A_BINDING_FINDINGS.w5N20RetryPolicyExists).toBe(true);
    expect(W5_N21_A_BINDING_FINDINGS.unifiedPlatformRetryBackoffLayerMissing).toBe(true);
    expect(W5_N21_A_BINDING_FINDINGS.retryBackoffPersistenceMissing).toBe(true);
    expect(W5_N21_A_BINDING_FINDINGS.retryBackoffRecoveryMissing).toBe(true);
    expect(W5_N21_A_BINDING_FINDINGS.retryBackoffOperationalContinuityMissing).toBe(true);
    expect(W5_N21_A_ARCHITECTURE_CLAIMS.retryBackoffFunctionalClaimed).toBe(false);
    expect(W5_N21_A_ARCHITECTURE_CLAIMS.w5N21CompleteClaimed).toBe(false);
    expect(W5_N21_A_ARCHITECTURE_CLAIMS.notificationPlatformCompleteClaimed).toBe(false);
    expect(W5_N21_A_ARCHITECTURE_CLAIMS.liveTradingClaimed).toBe(false);
  });

  it('technical debt delta: only inventory baseline resolved; b–e deferred; nothing introduced', () => {
    expect(W5_N21_A_TECHNICAL_DEBT_DELTA.resolved).toEqual([
      'Retry Backoff inventory baseline established',
    ]);
    expect(W5_N21_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N21_A_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N21-b — Durable Persistence Foundation',
      'W5-N21-c — Restart Recovery Foundation',
      'W5-N21-d — Operational Continuity Foundation',
      'W5-N21-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('diagnostics roll-up passes for slice a scope', () => {
    const diagnostics = buildRetryBackoffDiagnostics();
    expect(diagnostics.ok).toBe(true);
    expect(diagnostics.inventory.ok).toBe(true);
    expect(diagnostics.honestProduct.ok).toBe(true);
    expect(diagnostics.architecture.ok).toBe(true);
    expect(diagnostics.ownership.ok).toBe(true);
    expect(diagnostics.honesty.ok).toBe(true);
  });
});

describe('W5-N21-a retry backoff conformance — integration / planning', () => {
  it('required reports exist for W5-N21-a', () => {
    expect(W5_N21_A_REQUIRED_REPORTS).toEqual([
      'w5-n21-a-retry-backoff-inventory.md',
      'w5-n21-a-implementation-report.md',
      'w5-n21-a-architecture-review.md',
      'w5-n21-a-security-review.md',
      'w5-n21-a-product-review.md',
      'w5-n21-a-validation-report.md',
    ]);
    for (const name of W5_N21_A_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE5, name))).toBe(true);
    }
  });

  it('conformance source files exist on disk', () => {
    expect(
      existsSync(
        join(REPO_ROOT, 'apps/api/src/platform-conformance/w5-n21-a-retry-backoff-inventory.ts'),
      ),
    ).toBe(true);
    expect(
      existsSync(join(REPO_ROOT, 'apps/api/src/platform-conformance/w5-n21-a-retry-backoff.ts')),
    ).toBe(true);
  });
});
