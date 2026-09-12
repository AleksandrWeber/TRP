import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N20_A_ALLOWED_OWNERS,
  W5_N20_A_ARCHITECTURE_CLAIMS,
  W5_N20_A_ARTIFACT_KINDS,
  W5_N20_A_BINDING_FINDINGS,
  W5_N20_A_CAPABILITY_CATEGORIES,
  W5_N20_A_DURABILITY_CLASSES,
  W5_N20_A_EXPLICIT_OUT,
  W5_N20_A_HONEST_PRODUCT_BASELINE,
  W5_N20_A_REQUIRED_ARTIFACT_KINDS,
  W5_N20_A_SLICE_ID,
  W5_N20_A_SUBSTRATE_OWNERS,
  W5_N20_A_RETRY_POLICY_INVENTORY,
  W5_N20_A_RETRY_POLICY_CLASSIFICATIONS,
  W5_N20_A_TECHNICAL_DEBT_DELTA,
  artifactIds,
  rowsByCapabilityCategory,
  rowsByKind,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsNotificationRetryPolicyEphemeral,
  rowsNotificationRetryPolicySurvive,
  rowsSurvive,
} from './w5-n20-a-retry-policy-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W5-N20-a notification retry policy inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(W5_N20_A_RETRY_POLICY_INVENTORY.map((row) => row.kind));
    for (const kind of W5_N20_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W5_N20_A_ARTIFACT_KINDS).toEqual([...W5_N20_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification and responsibility fields', () => {
    for (const row of W5_N20_A_RETRY_POLICY_INVENTORY) {
      expect(W5_N20_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W5_N20_A_DURABILITY_CLASSES).toContain(row.durabilityClass);
      expect(W5_N20_A_CAPABILITY_CATEGORIES).toContain(row.capabilityCategory);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW5N20Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.persistenceResponsibility.length).toBeGreaterThan(0);
      expect(row.recoveryResponsibility.length).toBeGreaterThan(0);
      expect(row.operationalContinuityResponsibility.length).toBeGreaterThan(0);
      expect(row.honestProductState.length).toBeGreaterThan(0);
      expect(W5_N20_A_RETRY_POLICY_CLASSIFICATIONS).toContain(row.retryPolicyClassification);
      expect(row.operationalVisibility.length).toBeGreaterThan(0);
      expect(row.customerVisibility.length).toBeGreaterThan(0);
      expect(row.authorizesRetryPolicyFunctional).toBe(false);
      expect(row.authorizesW5N20Complete).toBe(false);
    }
  });

  it('ownership consistency: core ownership rows stay on notification substrate owners', () => {
    const ownership = rowsByKind('ownership');
    const coreIds = [
      'own-platform-retry-policy-layer',
      'own-notification-delivery-domain',
      'own-pc06-routing-delivery',
      'own-w5-n18-retry-execution-consume',
      'own-w5-n19-retry-scheduling-consume',
      'own-secret-vault-consume',
      'own-connection-management-consume',
      'own-notification-durable-queue',
    ];
    for (const row of ownership.filter((entry) => coreIds.includes(entry.artifactId))) {
      expect(W5_N20_A_SUBSTRATE_OWNERS).toContain(row.owner);
    }
    expect(
      ownership.find((row) => row.artifactId === 'own-workspace-isolation-notifications')?.owner,
    ).toBe('workspace-isolation');
    expect(ownership.find((row) => row.artifactId === 'own-honest-product-boundaries')?.owner).toBe(
      'wave-5-documentation',
    );
  });

  it('platform coverage: N18/N19 consume, missing policy gaps, PC-06 routing', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('channel-w5-n01-telegram-anchor')).toBe(true);
    expect(ids.has('consume-w5-n18-retry-execution-anchor')).toBe(true);
    expect(ids.has('consume-w5-n18-retry-execution-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n18-retry-execution-continuity')).toBe(true);
    expect(ids.has('consume-w5-n19-retry-scheduling-anchor')).toBe(true);
    expect(ids.has('consume-w5-n19-retry-scheduling-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n19-retry-scheduling-continuity')).toBe(true);
    expect(ids.has('own-w5-n18-retry-execution-consume')).toBe(true);
    expect(ids.has('own-w5-n19-retry-scheduling-consume')).toBe(true);
    expect(ids.has('missing-unified-platform-retry-policy-view')).toBe(true);
    expect(ids.has('missing-retry-policy-persistence')).toBe(true);
    expect(ids.has('missing-retry-policy-recovery')).toBe(true);
    expect(ids.has('missing-retry-policy-operational-continuity')).toBe(true);
    expect(ids.has('persist-notification-platform-retry-policy-anchor')).toBe(true);
    expect(ids.has('runtime-pc06-resolve-delivery-routing')).toBe(true);
  });

  it('honesty boundaries: retry policy honesty rules frozen', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-retry-policy-not-evaluation-runtime')).toBe(true);
    expect(ids.has('honesty-retry-policy-not-successful-delivery')).toBe(true);
    expect(ids.has('honesty-retry-scheduling-not-retry-policy')).toBe(true);
    expect(ids.has('honesty-retry-execution-not-retry-policy')).toBe(true);
    expect(ids.has('honesty-no-policy-engine')).toBe(true);
  });

  it('honesty: no row authorizes retry policy functional; slice a open with missing foundations', () => {
    expect(W5_N20_A_BINDING_FINDINGS.retryPolicyFunctionalAuthorized).toBe(false);
    expect(W5_N20_A_BINDING_FINDINGS.retryPolicyFunctionsAfterSliceA).toBe(false);
    expect(W5_N20_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W5_N20_A_BINDING_FINDINGS.w5N18RetryExecutionExists).toBe(true);
    expect(W5_N20_A_BINDING_FINDINGS.w5N19RetrySchedulingExists).toBe(true);
    expect(W5_N20_A_BINDING_FINDINGS.unifiedPlatformRetryPolicyLayerMissing).toBe(true);
    expect(W5_N20_A_BINDING_FINDINGS.retryPolicyPersistenceMissing).toBe(false);
    expect(W5_N20_A_BINDING_FINDINGS.retryPolicyRecoveryMissing).toBe(false);
    expect(W5_N20_A_BINDING_FINDINGS.retryPolicyOperationalContinuityMissing).toBe(false);
    expect(W5_N20_A_BINDING_FINDINGS.productionTransportsDeferred).toBe(true);
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(W5_N20_A_RETRY_POLICY_INVENTORY.length);
  });

  it('platform retry policy SURVIVE/EPHEMERAL subsets are documented', () => {
    expect(rowsNotificationRetryPolicySurvive().length).toBeGreaterThan(0);
    expect(rowsNotificationRetryPolicyEphemeral().length).toBeGreaterThan(0);
  });

  it('capability categories cover implemented, infrastructure, planned, not-implemented, future-roadmap', () => {
    for (const category of W5_N20_A_CAPABILITY_CATEGORIES) {
      expect(rowsByCapabilityCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('explicit OUT surfaces cover policy impl, b–e, platforms, Live Trading', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-retry-policy-implementation-slice-a')).toBe(true);
    expect(ids.has('out-w5-n20-b-durable-persistence')).toBe(true);
    expect(ids.has('out-w5-n20-c-restart-safe-recovery')).toBe(true);
    expect(ids.has('out-w5-n20-d-operational-continuity')).toBe(true);
    expect(ids.has('out-w5-n20-e-close-evidence')).toBe(true);
    expect(ids.has('out-policy-engine')).toBe(true);
    expect(ids.has('out-retry-platform')).toBe(true);
    expect(ids.has('out-workflow-engine')).toBe(true);
    expect(ids.has('out-notification-platform-complete')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
    expect(ids.has('out-w5-n18-reopen')).toBe(true);
    expect(ids.has('out-w5-n19-reopen')).toBe(true);
  });

  it('W5-N18 and W5-N19 foundations consumed not reopened', () => {
    expect(W5_N20_A_ALLOWED_OWNERS).toContain('w5-n18-reference');
    expect(W5_N20_A_ALLOWED_OWNERS).toContain('w5-n19-reference');
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.w5N18Reopened).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.w5N19Reopened).toBe(false);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    expect(W5_N20_A_HONEST_PRODUCT_BASELINE.implementedCapabilities[0]).toContain('None');
    expect(
      W5_N20_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length,
    ).toBeGreaterThanOrEqual(8);
    expect(W5_N20_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length).toBeGreaterThanOrEqual(1);
    expect(
      W5_N20_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      W5_N20_A_HONEST_PRODUCT_BASELINE.futureRoadmapCapabilities.length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('technical debt delta: inventory through operational continuity resolved; W5-N20-e deferred; nothing introduced', () => {
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
    expect(W5_N20_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N20_A_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N20-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('missing gaps remain EPHEMERAL; persistence, recovery, and continuity gaps resolved by W5-N20-b/c/d', () => {
    const stillMissingIds = ['missing-retry-policy-ui', 'operator-visible-retry-policy-none'];
    for (const id of stillMissingIds) {
      const row = W5_N20_A_RETRY_POLICY_INVENTORY.find((entry) => entry.artifactId === id);
      expect(row).toBeDefined();
      expect(row?.existsToday).toBe(false);
    }
    const resolvedPersistence = W5_N20_A_RETRY_POLICY_INVENTORY.find(
      (entry) => entry.artifactId === 'missing-retry-policy-persistence',
    );
    expect(resolvedPersistence?.existsToday).toBe(true);
    expect(
      W5_N20_A_RETRY_POLICY_INVENTORY.find(
        (entry) => entry.artifactId === 'missing-retry-policy-recovery',
      )?.existsToday,
    ).toBe(true);
    expect(
      W5_N20_A_RETRY_POLICY_INVENTORY.find(
        (entry) => entry.artifactId === 'missing-retry-policy-operational-continuity',
      )?.existsToday,
    ).toBe(true);
    expect(
      W5_N20_A_RETRY_POLICY_INVENTORY.find(
        (entry) => entry.artifactId === 'projection-platform-readiness-retry-policy-missing',
      )?.existsToday,
    ).toBe(true);
    expect(
      W5_N20_A_RETRY_POLICY_INVENTORY.find(
        (entry) => entry.artifactId === 'persist-notification-platform-retry-policy-anchor',
      )?.existsToday,
    ).toBe(true);
  });
});

describe('W5-N20-a notification retry policy inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W5_N20_A_SLICE_ID).toBe('W5-N20-a');
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.duplicatePolicySubsystem).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.policyEngineIntroduced).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.retryPlatformIntroduced).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.workflowEngineIntroduced).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.inventoryOnly).toBe(true);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.notificationControlPlane).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N20_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N20_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–4 unchanged', () => {
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.wave4Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no Policy Engine / Retry Platform / new persistence owner', () => {
    expect(W5_N20_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    for (const item of [
      'retry-policy-implementation',
      'policy-engine',
      'retry-platform',
      'workflow-engine',
      'event-bus-product',
      'new-persistence-owner',
      'new-bounded-context',
      'w5-n20-b',
      'exchange-adapter-modification',
    ]) {
      expect(W5_N20_A_EXPLICIT_OUT).toContain(item);
    }
  });

  it('architecture consistency: evidence paths exist on disk for existsToday rows', () => {
    for (const row of W5_N20_A_RETRY_POLICY_INVENTORY.filter((entry) => entry.existsToday)) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });
});
