import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N20_A_ARCHITECTURE_CLAIMS,
  W5_N20_A_BINDING_FINDINGS,
  W5_N20_A_RETRY_POLICY_CLASSIFICATIONS,
  W5_N20_A_TECHNICAL_DEBT_DELTA,
} from './w5-n20-a-retry-policy-inventory';
import {
  W5_N20_A_CONFORMANCE_SLICE_ID,
  W5_N20_A_REQUIRED_REPORTS,
  buildRetryPolicyDiagnostics,
  verifyArchitectureIntegrity,
  verifyHonestProductBaseline,
  verifyHonestyBoundaries,
  verifyInventoryCompleteness,
  verifyOwnershipBoundaries,
} from './w5-n20-a-retry-policy';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');

describe('W5-N20-a retry policy conformance — unit', () => {
  it('slice id and required report list', () => {
    expect(W5_N20_A_CONFORMANCE_SLICE_ID).toBe('W5-N20-a');
    expect(W5_N20_A_REQUIRED_REPORTS.length).toBe(6);
    expect(W5_N20_A_RETRY_POLICY_CLASSIFICATIONS).toEqual([
      'FOUNDATION',
      'DURABLE',
      'RECOVERABLE',
      'EPHEMERAL',
      'OUT OF SCOPE',
    ]);
  });

  it('inventory completeness verifies required ownership rows and no retry policy authorization', () => {
    const inventory = verifyInventoryCompleteness();
    expect(inventory.ok).toBe(true);
    expect(inventory.rowCount).toBeGreaterThanOrEqual(50);
    expect(inventory.noRowAuthorizesRetryPolicyFunctional).toBe(true);
    expect(inventory.noRowAuthorizesW5N20Complete).toBe(true);
    expect(inventory.requiredOwnershipRowsPresent).toBe(true);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    const honest = verifyHonestProductBaseline();
    expect(honest.ok).toBe(true);
    expect(honest.noCustomerVisibleImplemented).toBe(true);
    expect(honest.infrastructureDocumented).toBe(true);
    expect(honest.plannedExplicit).toBe(true);
    expect(honest.notImplementedExplicit).toBe(true);
    expect(honest.retryPolicyNotAuthorized).toBe(true);
    expect(honest.deliveryOnlyNotControlPlane).toBe(true);
  });

  it('architecture integrity: ownership preserved; no Policy Engine; Exchange Adapter untouched', () => {
    const arch = verifyArchitectureIntegrity();
    expect(arch.ok).toBe(true);
    expect(arch.ownershipUnchanged).toBe(true);
    expect(arch.noDuplicateSubsystem).toBe(true);
    expect(arch.noPolicyEngine).toBe(true);
    expect(arch.noMasterPlanChange).toBe(true);
    expect(arch.exchangeAdapterUntouched).toBe(true);
    expect(arch.notificationControlPlaneForbidden).toBe(true);
    expect(W5_N20_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N20_A_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N20_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('ownership boundaries: no new persistence owner', () => {
    const ownership = verifyOwnershipBoundaries();
    expect(ownership.ok).toBe(true);
    expect(ownership.ownershipVerified).toBe(true);
    expect(ownership.newPersistenceOwner).toBe(false);
    expect(ownership.substrateOwnersFrozen).toBe(true);
  });

  it('honesty boundaries: retry policy honesty rules frozen', () => {
    const honesty = verifyHonestyBoundaries();
    expect(honesty.ok).toBe(true);
    expect(honesty.policyNotEvaluationRuntime).toBe(true);
    expect(honesty.noPolicyEngine).toBe(true);
    expect(honesty.schedulingNotRetryPolicy).toBe(true);
  });

  it('binding findings: Retry Policy cannot function after slice a', () => {
    expect(W5_N20_A_BINDING_FINDINGS.retryPolicyFunctionsAfterSliceA).toBe(false);
    expect(W5_N20_A_BINDING_FINDINGS.w5N18RetryExecutionExists).toBe(true);
    expect(W5_N20_A_BINDING_FINDINGS.w5N19RetrySchedulingExists).toBe(true);
    expect(W5_N20_A_BINDING_FINDINGS.unifiedPlatformRetryPolicyLayerMissing).toBe(true);
    expect(W5_N20_A_BINDING_FINDINGS.retryPolicyPersistenceMissing).toBe(false);
    expect(W5_N20_A_BINDING_FINDINGS.retryPolicyRecoveryMissing).toBe(false);
    expect(W5_N20_A_BINDING_FINDINGS.retryPolicyOperationalContinuityMissing).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.retryPolicyFunctionalClaimed).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.w5N20CompleteClaimed).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.notificationPlatformCompleteClaimed).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.liveTradingClaimed).toBe(false);
  });

  it('technical debt delta: inventory through official close resolved; evaluation runtime/remaining Wave 5 deferred; nothing introduced', () => {
    expect(W5_N20_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Retry Policy inventory baseline established',
    );
    expect(W5_N20_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Durable Retry Policy persistence foundation',
    );
    expect(W5_N20_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Retry Policy restart recovery foundation',
    );
    expect(W5_N20_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Retry Policy operational continuity foundation',
    );
    expect(W5_N20_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Retry Policy Package Close Evidence',
    );
    expect(W5_N20_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Final Package Integration Verification',
    );
    expect(W5_N20_A_TECHNICAL_DEBT_DELTA.resolved).toContain('W5-N20 officially closed');
    expect(W5_N20_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N20_A_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'Retry policy evaluation runtime',
      'Remaining Wave 5 packages',
    ]);
  });

  it('diagnostics roll-up passes for slice a scope', () => {
    const diagnostics = buildRetryPolicyDiagnostics();
    expect(diagnostics.ok).toBe(true);
    expect(diagnostics.inventory.ok).toBe(true);
    expect(diagnostics.honestProduct.ok).toBe(true);
    expect(diagnostics.architecture.ok).toBe(true);
    expect(diagnostics.ownership.ok).toBe(true);
    expect(diagnostics.honesty.ok).toBe(true);
  });
});

describe('W5-N20-a retry policy conformance — integration / planning', () => {
  it('required reports exist for W5-N20-a', () => {
    expect(W5_N20_A_REQUIRED_REPORTS).toEqual([
      'w5-n20-a-retry-policy-inventory.md',
      'w5-n20-a-implementation-report.md',
      'w5-n20-a-architecture-review.md',
      'w5-n20-a-security-review.md',
      'w5-n20-a-product-review.md',
      'w5-n20-a-validation-report.md',
    ]);
    for (const name of W5_N20_A_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE5, name))).toBe(true);
    }
  });

  it('conformance source files exist on disk', () => {
    expect(
      existsSync(
        join(REPO_ROOT, 'apps/api/src/platform-conformance/w5-n20-a-retry-policy-inventory.ts'),
      ),
    ).toBe(true);
    expect(
      existsSync(join(REPO_ROOT, 'apps/api/src/platform-conformance/w5-n20-a-retry-policy.ts')),
    ).toBe(true);
  });
});
