import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N18_A_ARCHITECTURE_CLAIMS,
  W5_N18_A_BINDING_FINDINGS,
  W5_N18_A_RETRY_CLASSIFICATIONS,
  W5_N18_A_TECHNICAL_DEBT_DELTA,
} from './w5-n18-a-retry-execution-inventory';
import {
  W5_N18_A_CONFORMANCE_SLICE_ID,
  W5_N18_A_REQUIRED_REPORTS,
  buildRetryExecutionDiagnostics,
  verifyArchitectureIntegrity,
  verifyHonestProductBaseline,
  verifyHonestyBoundaries,
  verifyInventoryCompleteness,
  verifyOwnershipBoundaries,
} from './w5-n18-a-retry-execution';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');

describe('W5-N18-a retry execution conformance — unit', () => {
  it('slice id and required report list', () => {
    expect(W5_N18_A_CONFORMANCE_SLICE_ID).toBe('W5-N18-a');
    expect(W5_N18_A_REQUIRED_REPORTS.length).toBe(6);
    expect(W5_N18_A_RETRY_CLASSIFICATIONS).toEqual([
      'FOUNDATION',
      'DURABLE',
      'RECOVERABLE',
      'EPHEMERAL',
      'OUT OF SCOPE',
    ]);
  });

  it('inventory completeness verifies required ownership rows and no retry execution authorization', () => {
    const inventory = verifyInventoryCompleteness();
    expect(inventory.ok).toBe(true);
    expect(inventory.rowCount).toBeGreaterThanOrEqual(45);
    expect(inventory.noRowAuthorizesRetryExecutionFunctional).toBe(true);
    expect(inventory.noRowAuthorizesW5N18Complete).toBe(true);
    expect(inventory.requiredOwnershipRowsPresent).toBe(true);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    const honest = verifyHonestProductBaseline();
    expect(honest.ok).toBe(true);
    expect(honest.noCustomerVisibleImplemented).toBe(true);
    expect(honest.infrastructureDocumented).toBe(true);
    expect(honest.plannedExplicit).toBe(true);
    expect(honest.notImplementedExplicit).toBe(true);
    expect(honest.retryExecutionNotAuthorized).toBe(true);
    expect(honest.deliveryOnlyNotControlPlane).toBe(true);
  });

  it('architecture integrity: ownership preserved; no Retry Platform; Exchange Adapter untouched', () => {
    const arch = verifyArchitectureIntegrity();
    expect(arch.ok).toBe(true);
    expect(arch.ownershipUnchanged).toBe(true);
    expect(arch.noDuplicateSubsystem).toBe(true);
    expect(arch.noRetryPlatform).toBe(true);
    expect(arch.noMasterPlanChange).toBe(true);
    expect(arch.exchangeAdapterUntouched).toBe(true);
    expect(arch.notificationControlPlaneForbidden).toBe(true);
    expect(W5_N18_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N18_A_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N18_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('ownership boundaries: no new persistence owner', () => {
    const ownership = verifyOwnershipBoundaries();
    expect(ownership.ok).toBe(true);
    expect(ownership.ownershipVerified).toBe(true);
    expect(ownership.newPersistenceOwner).toBe(false);
    expect(ownership.substrateOwnersFrozen).toBe(true);
  });

  it('honesty boundaries: retry execution honesty rules frozen', () => {
    const honesty = verifyHonestyBoundaries();
    expect(honesty.ok).toBe(true);
    expect(honesty.retryExecutionNotSuccessfulDelivery).toBe(true);
    expect(honesty.retryFoundationNotRetryExecution).toBe(true);
    expect(honesty.deliveryReliabilityNotRetryExecution).toBe(true);
  });

  it('binding findings: Retry Execution cannot function after slice a', () => {
    expect(W5_N18_A_BINDING_FINDINGS.retryExecutionFunctionsAfterSliceA).toBe(false);
    expect(W5_N18_A_BINDING_FINDINGS.w5N13RetryFoundationExists).toBe(true);
    expect(W5_N18_A_BINDING_FINDINGS.w5N17DeliveryReliabilityExists).toBe(true);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.retryExecutionFunctionalClaimed).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.w5N18CompleteClaimed).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.notificationPlatformCompleteClaimed).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.liveTradingClaimed).toBe(false);
  });

  it('technical debt delta: inventory + durable persistence + restart recovery + operational continuity resolved; later slices deferred; nothing introduced', () => {
    expect(W5_N18_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Retry Execution inventory baseline established',
    );
    expect(W5_N18_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Durable Retry Execution persistence foundation',
    );
    expect(W5_N18_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'W5-N18-c — Restart Recovery Foundation',
    );
    expect(W5_N18_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'W5-N18-d — Operational Continuity Foundation',
    );
    expect(W5_N18_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N18_A_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N18-e — Package Validation, Operational Verification & Close Evidence',
      'Final Package Integration Verification',
    ]);
  });

  it('diagnostics roll-up passes for slice a scope', () => {
    const diagnostics = buildRetryExecutionDiagnostics();
    expect(diagnostics.ok).toBe(true);
    expect(diagnostics.inventory.ok).toBe(true);
    expect(diagnostics.honestProduct.ok).toBe(true);
    expect(diagnostics.architecture.ok).toBe(true);
    expect(diagnostics.ownership.ok).toBe(true);
    expect(diagnostics.honesty.ok).toBe(true);
  });
});

describe('W5-N18-a retry execution conformance — integration / planning', () => {
  it('required reports exist for W5-N18-a', () => {
    for (const name of W5_N18_A_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE5, name))).toBe(true);
    }
  });
});
