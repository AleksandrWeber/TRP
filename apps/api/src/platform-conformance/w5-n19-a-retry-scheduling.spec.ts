import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N19_A_ARCHITECTURE_CLAIMS,
  W5_N19_A_BINDING_FINDINGS,
  W5_N19_A_RETRY_SCHEDULING_CLASSIFICATIONS,
  W5_N19_A_TECHNICAL_DEBT_DELTA,
} from './w5-n19-a-retry-scheduling-inventory';
import {
  W5_N19_A_CONFORMANCE_SLICE_ID,
  W5_N19_A_REQUIRED_REPORTS,
  buildRetrySchedulingDiagnostics,
  verifyArchitectureIntegrity,
  verifyHonestProductBaseline,
  verifyHonestyBoundaries,
  verifyInventoryCompleteness,
  verifyOwnershipBoundaries,
} from './w5-n19-a-retry-scheduling';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');

describe('W5-N19-a retry scheduling conformance — unit', () => {
  it('slice id and required report list', () => {
    expect(W5_N19_A_CONFORMANCE_SLICE_ID).toBe('W5-N19-a');
    expect(W5_N19_A_REQUIRED_REPORTS.length).toBe(6);
    expect(W5_N19_A_RETRY_SCHEDULING_CLASSIFICATIONS).toEqual([
      'FOUNDATION',
      'DURABLE',
      'RECOVERABLE',
      'EPHEMERAL',
      'OUT OF SCOPE',
    ]);
  });

  it('inventory completeness verifies required ownership rows and no retry scheduling authorization', () => {
    const inventory = verifyInventoryCompleteness();
    expect(inventory.ok).toBe(true);
    expect(inventory.rowCount).toBeGreaterThanOrEqual(50);
    expect(inventory.noRowAuthorizesRetrySchedulingFunctional).toBe(true);
    expect(inventory.noRowAuthorizesW5N19Complete).toBe(true);
    expect(inventory.requiredOwnershipRowsPresent).toBe(true);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    const honest = verifyHonestProductBaseline();
    expect(honest.ok).toBe(true);
    expect(honest.noCustomerVisibleImplemented).toBe(true);
    expect(honest.infrastructureDocumented).toBe(true);
    expect(honest.plannedExplicit).toBe(true);
    expect(honest.notImplementedExplicit).toBe(true);
    expect(honest.retrySchedulingNotAuthorized).toBe(true);
    expect(honest.deliveryOnlyNotControlPlane).toBe(true);
  });

  it('architecture integrity: ownership preserved; no Scheduler Platform; Exchange Adapter untouched', () => {
    const arch = verifyArchitectureIntegrity();
    expect(arch.ok).toBe(true);
    expect(arch.ownershipUnchanged).toBe(true);
    expect(arch.noDuplicateSubsystem).toBe(true);
    expect(arch.noSchedulerPlatform).toBe(true);
    expect(arch.noMasterPlanChange).toBe(true);
    expect(arch.exchangeAdapterUntouched).toBe(true);
    expect(arch.notificationControlPlaneForbidden).toBe(true);
    expect(W5_N19_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N19_A_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N19_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('ownership boundaries: no new persistence owner', () => {
    const ownership = verifyOwnershipBoundaries();
    expect(ownership.ok).toBe(true);
    expect(ownership.ownershipVerified).toBe(true);
    expect(ownership.newPersistenceOwner).toBe(false);
    expect(ownership.substrateOwnersFrozen).toBe(true);
  });

  it('honesty boundaries: retry scheduling honesty rules frozen', () => {
    const honesty = verifyHonestyBoundaries();
    expect(honesty.ok).toBe(true);
    expect(honesty.retrySchedulingNotRuntime).toBe(true);
    expect(honesty.retryExecutionNotRetryScheduling).toBe(true);
    expect(honesty.schedulerFoundationNotPlatform).toBe(true);
  });

  it('binding findings: Retry Scheduling cannot function after slice a', () => {
    expect(W5_N19_A_BINDING_FINDINGS.retrySchedulingFunctionsAfterSliceA).toBe(false);
    expect(W5_N19_A_BINDING_FINDINGS.w5N18RetryExecutionExists).toBe(true);
    expect(W5_N19_A_BINDING_FINDINGS.w5N12SchedulerFoundationExists).toBe(true);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.retrySchedulingFunctionalClaimed).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.w5N19CompleteClaimed).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.notificationPlatformCompleteClaimed).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.liveTradingClaimed).toBe(false);
  });

  it('technical debt delta: inventory through close evidence resolved; FIV/PO Close/runtime deferred; nothing introduced', () => {
    expect(W5_N19_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Retry Scheduling inventory baseline established',
    );
    expect(W5_N19_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Durable Retry Scheduling persistence foundation',
    );
    expect(W5_N19_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Retry Scheduling restart recovery foundation',
    );
    expect(W5_N19_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Retry Scheduling Operational Continuity Foundation',
    );
    expect(W5_N19_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Retry Scheduling Package Close Evidence',
    );
    expect(W5_N19_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N19_A_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'Final Package Integration Verification',
      'Product Owner Final Close',
      'Retry scheduling runtime',
    ]);
  });

  it('diagnostics roll-up passes for slice a scope', () => {
    const diagnostics = buildRetrySchedulingDiagnostics();
    expect(diagnostics.ok).toBe(true);
    expect(diagnostics.inventory.ok).toBe(true);
    expect(diagnostics.honestProduct.ok).toBe(true);
    expect(diagnostics.architecture.ok).toBe(true);
    expect(diagnostics.ownership.ok).toBe(true);
    expect(diagnostics.honesty.ok).toBe(true);
  });
});

describe('W5-N19-a retry scheduling conformance — integration / planning', () => {
  it('required reports exist for W5-N19-a', () => {
    for (const name of W5_N19_A_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE5, name))).toBe(true);
    }
  });
});
