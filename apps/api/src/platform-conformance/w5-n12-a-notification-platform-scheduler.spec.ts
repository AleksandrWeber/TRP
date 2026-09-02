import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N12_A_ARCHITECTURE_CLAIMS,
  W5_N12_A_BINDING_FINDINGS,
  W5_N12_A_TECHNICAL_DEBT_DELTA,
} from './w5-n12-a-notification-platform-scheduler-inventory';
import {
  W5_N12_A_CONFORMANCE_SLICE_ID,
  W5_N12_A_REQUIRED_REPORTS,
  buildNotificationPlatformSchedulerDiagnostics,
  verifyArchitectureIntegrity,
  verifyHonestProductBaseline,
  verifyHonestyBoundaries,
  verifyInventoryCompleteness,
  verifyOwnershipBoundaries,
} from './w5-n12-a-notification-platform-scheduler';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');

describe('W5-N12-a notification platform scheduler conformance — unit', () => {
  it('slice id and required report list', () => {
    expect(W5_N12_A_CONFORMANCE_SLICE_ID).toBe('W5-N12-a');
    expect(W5_N12_A_REQUIRED_REPORTS.length).toBe(6);
  });

  it('inventory completeness verifies required ownership rows and no platform scheduler authorization', () => {
    const inventory = verifyInventoryCompleteness();
    expect(inventory.ok).toBe(true);
    expect(inventory.rowCount).toBeGreaterThanOrEqual(45);
    expect(inventory.noRowAuthorizesPlatformSchedulerFunctional).toBe(true);
    expect(inventory.noRowAuthorizesW5N12Complete).toBe(true);
    expect(inventory.requiredOwnershipRowsPresent).toBe(true);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    const honest = verifyHonestProductBaseline();
    expect(honest.ok).toBe(true);
    expect(honest.noCustomerVisibleImplemented).toBe(true);
    expect(honest.infrastructureDocumented).toBe(true);
    expect(honest.plannedExplicit).toBe(true);
    expect(honest.notImplementedExplicit).toBe(true);
    expect(honest.platformSchedulerNotAuthorized).toBe(true);
    expect(honest.schedulerOnlyNotControlPlane).toBe(true);
  });

  it('architecture integrity: ownership preserved; no duplicate subsystem; Exchange Adapter untouched', () => {
    const arch = verifyArchitectureIntegrity();
    expect(arch.ok).toBe(true);
    expect(arch.ownershipUnchanged).toBe(true);
    expect(arch.noDuplicateSubsystem).toBe(true);
    expect(arch.noMasterPlanChange).toBe(true);
    expect(arch.exchangeAdapterUntouched).toBe(true);
    expect(arch.notificationControlPlaneForbidden).toBe(true);
    expect(W5_N12_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N12_A_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N12_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('ownership boundaries: no new persistence owner', () => {
    const ownership = verifyOwnershipBoundaries();
    expect(ownership.ok).toBe(true);
    expect(ownership.ownershipVerified).toBe(true);
    expect(ownership.newPersistenceOwner).toBe(false);
    expect(ownership.substrateOwnersFrozen).toBe(true);
  });

  it('honesty boundaries: workers foundation, platform ready, and per-channel rules frozen', () => {
    const honesty = verifyHonestyBoundaries();
    expect(honesty.ok).toBe(true);
    expect(honesty.schedulerFoundationNotLiveTrading).toBe(true);
    expect(honesty.platformReadyRequiresEvidence).toBe(true);
    expect(honesty.schedulerNotSchedulerComplete).toBe(true);
  });

  it('binding findings: Notification Platform Scheduler cannot function after slice a', () => {
    expect(W5_N12_A_BINDING_FINDINGS.platformSchedulerFunctionsAfterSliceA).toBe(false);
    expect(W5_N12_A_BINDING_FINDINGS.w5N05IntegrationFoundationExists).toBe(true);
    expect(W5_N12_A_ARCHITECTURE_CLAIMS.platformSchedulerFunctionalClaimed).toBe(false);
    expect(W5_N12_A_ARCHITECTURE_CLAIMS.w5N12CompleteClaimed).toBe(false);
    expect(W5_N12_A_ARCHITECTURE_CLAIMS.notificationPlatformCompleteClaimed).toBe(false);
    expect(W5_N12_A_ARCHITECTURE_CLAIMS.liveTradingClaimed).toBe(false);
  });

  it('technical debt delta: inventory resolved; b–e deferred', () => {
    expect(W5_N12_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Platform Scheduler Inventory Foundation',
    );
    expect(W5_N12_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N12_A_TECHNICAL_DEBT_DELTA.deferred.length).toBe(4);
  });

  it('diagnostics roll-up passes for slice a scope', () => {
    const diagnostics = buildNotificationPlatformSchedulerDiagnostics();
    expect(diagnostics.ok).toBe(true);
    expect(diagnostics.inventory.ok).toBe(true);
    expect(diagnostics.honestProduct.ok).toBe(true);
    expect(diagnostics.architecture.ok).toBe(true);
    expect(diagnostics.ownership.ok).toBe(true);
    expect(diagnostics.honesty.ok).toBe(true);
  });
});

describe('W5-N12-a notification platform scheduler conformance — integration / planning', () => {
  it('required reports exist for W5-N12-a', () => {
    for (const name of W5_N12_A_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE5, name))).toBe(true);
    }
  });
});
