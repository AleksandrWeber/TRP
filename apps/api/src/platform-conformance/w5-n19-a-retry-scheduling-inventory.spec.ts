import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N19_A_ALLOWED_OWNERS,
  W5_N19_A_ARCHITECTURE_CLAIMS,
  W5_N19_A_ARTIFACT_KINDS,
  W5_N19_A_BINDING_FINDINGS,
  W5_N19_A_CAPABILITY_CATEGORIES,
  W5_N19_A_DURABILITY_CLASSES,
  W5_N19_A_EXPLICIT_OUT,
  W5_N19_A_HONEST_PRODUCT_BASELINE,
  W5_N19_A_REQUIRED_ARTIFACT_KINDS,
  W5_N19_A_SLICE_ID,
  W5_N19_A_SUBSTRATE_OWNERS,
  W5_N19_A_RETRY_SCHEDULING_INVENTORY,
  W5_N19_A_RETRY_SCHEDULING_CLASSIFICATIONS,
  W5_N19_A_TECHNICAL_DEBT_DELTA,
  artifactIds,
  rowsByCapabilityCategory,
  rowsByKind,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsNotificationRetrySchedulingEphemeral,
  rowsNotificationRetrySchedulingSurvive,
  rowsSurvive,
} from './w5-n19-a-retry-scheduling-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W5-N19-a notification retry scheduling inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(W5_N19_A_RETRY_SCHEDULING_INVENTORY.map((row) => row.kind));
    for (const kind of W5_N19_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W5_N19_A_ARTIFACT_KINDS).toEqual([...W5_N19_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification and responsibility fields', () => {
    for (const row of W5_N19_A_RETRY_SCHEDULING_INVENTORY) {
      expect(W5_N19_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W5_N19_A_DURABILITY_CLASSES).toContain(row.durabilityClass);
      expect(W5_N19_A_CAPABILITY_CATEGORIES).toContain(row.capabilityCategory);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW5N19Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.persistenceResponsibility.length).toBeGreaterThan(0);
      expect(row.recoveryResponsibility.length).toBeGreaterThan(0);
      expect(row.operationalContinuityResponsibility.length).toBeGreaterThan(0);
      expect(row.honestProductState.length).toBeGreaterThan(0);
      expect(W5_N19_A_RETRY_SCHEDULING_CLASSIFICATIONS).toContain(
        row.retrySchedulingClassification,
      );
      expect(row.operationalVisibility.length).toBeGreaterThan(0);
      expect(row.customerVisibility.length).toBeGreaterThan(0);
      expect(row.authorizesRetrySchedulingFunctional).toBe(false);
      expect(row.authorizesW5N19Complete).toBe(false);
    }
  });

  it('ownership consistency: core ownership rows stay on notification substrate owners', () => {
    const ownership = rowsByKind('ownership');
    const coreIds = [
      'own-platform-retry-scheduling-layer',
      'own-notification-delivery-domain',
      'own-pc06-routing-delivery',
      'own-w5-n18-retry-execution-consume',
      'own-secret-vault-consume',
      'own-connection-management-consume',
      'own-notification-durable-queue',
    ];
    for (const row of ownership.filter((entry) => coreIds.includes(entry.artifactId))) {
      expect(W5_N19_A_SUBSTRATE_OWNERS).toContain(row.owner);
    }
    expect(
      ownership.find((row) => row.artifactId === 'own-workspace-isolation-notifications')?.owner,
    ).toBe('workspace-isolation');
    expect(ownership.find((row) => row.artifactId === 'own-honest-product-boundaries')?.owner).toBe(
      'wave-5-documentation',
    );
  });

  it('platform coverage: N18/N12 consume, missing scheduling, PC-06 routing', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('channel-w5-n01-telegram-anchor')).toBe(true);
    expect(ids.has('consume-w5-n18-retry-execution-anchor')).toBe(true);
    expect(ids.has('consume-w5-n18-retry-execution-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n18-retry-execution-continuity')).toBe(true);
    expect(ids.has('consume-w5-n12-scheduler-foundation')).toBe(true);
    expect(ids.has('own-w5-n18-retry-execution-consume')).toBe(true);
    expect(ids.has('own-w5-n12-scheduler-foundation-consume')).toBe(true);
    expect(ids.has('missing-unified-platform-retry-scheduling-view')).toBe(true);
    expect(ids.has('missing-retry-scheduling-persistence')).toBe(true);
    expect(ids.has('missing-retry-scheduling-recovery')).toBe(true);
    expect(ids.has('missing-retry-scheduling-operational-continuity')).toBe(true);
    expect(ids.has('persist-notification-platform-retry-scheduling-anchor')).toBe(true);
    expect(ids.has('runtime-pc06-resolve-delivery-routing')).toBe(true);
  });

  it('honesty boundaries: retry scheduling honesty rules frozen', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-retry-scheduling-not-runtime')).toBe(true);
    expect(ids.has('honesty-retry-scheduling-not-successful-delivery')).toBe(true);
    expect(ids.has('honesty-retry-execution-not-retry-scheduling')).toBe(true);
    expect(ids.has('honesty-scheduler-foundation-not-scheduler-platform')).toBe(true);
  });

  it('honesty: no row authorizes retry scheduling functional; does not function from slice a', () => {
    expect(W5_N19_A_BINDING_FINDINGS.retrySchedulingFunctionalAuthorized).toBe(false);
    expect(W5_N19_A_BINDING_FINDINGS.retrySchedulingFunctionsAfterSliceA).toBe(false);
    expect(W5_N19_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W5_N19_A_BINDING_FINDINGS.w5N18RetryExecutionExists).toBe(true);
    expect(W5_N19_A_BINDING_FINDINGS.w5N12SchedulerFoundationExists).toBe(true);
    expect(W5_N19_A_BINDING_FINDINGS.unifiedPlatformRetrySchedulingLayerMissing).toBe(true);
    expect(W5_N19_A_BINDING_FINDINGS.retrySchedulingPersistenceMissing).toBe(false);
    expect(W5_N19_A_BINDING_FINDINGS.retrySchedulingRecoveryMissing).toBe(false);
    expect(W5_N19_A_BINDING_FINDINGS.retrySchedulingOperationalContinuityMissing).toBe(false);
    expect(W5_N19_A_BINDING_FINDINGS.productionTransportsDeferred).toBe(true);
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(W5_N19_A_RETRY_SCHEDULING_INVENTORY.length);
  });

  it('platform retry scheduling SURVIVE/EPHEMERAL subsets are documented', () => {
    expect(rowsNotificationRetrySchedulingSurvive().length).toBeGreaterThan(0);
    expect(rowsNotificationRetrySchedulingEphemeral().length).toBeGreaterThan(0);
  });

  it('capability categories cover implemented, infrastructure, planned, not-implemented, future-roadmap', () => {
    for (const category of W5_N19_A_CAPABILITY_CATEGORIES) {
      expect(rowsByCapabilityCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('explicit OUT surfaces cover scheduling impl, b–e, platforms, Live Trading', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-retry-scheduling-implementation-slice-a')).toBe(true);
    expect(ids.has('out-w5-n19-b-durable-persistence')).toBe(true);
    expect(ids.has('out-w5-n19-c-restart-safe-recovery')).toBe(true);
    expect(ids.has('out-w5-n19-d-operational-continuity')).toBe(true);
    expect(ids.has('out-w5-n19-e-close-evidence')).toBe(true);
    expect(ids.has('out-scheduler-platform')).toBe(true);
    expect(ids.has('out-workflow-engine')).toBe(true);
    expect(ids.has('out-notification-platform-complete')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
    expect(ids.has('out-w5-n18-reopen')).toBe(true);
  });

  it('W5-N12 and W5-N18 foundations consumed not reopened', () => {
    expect(W5_N19_A_ALLOWED_OWNERS).toContain('w5-n12-reference');
    expect(W5_N19_A_ALLOWED_OWNERS).toContain('w5-n18-reference');
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.w5N12Reopened).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.w5N18Reopened).toBe(false);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    expect(W5_N19_A_HONEST_PRODUCT_BASELINE.implementedCapabilities[0]).toContain('None');
    expect(
      W5_N19_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length,
    ).toBeGreaterThanOrEqual(8);
    expect(W5_N19_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length).toBeGreaterThanOrEqual(3);
    expect(
      W5_N19_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      W5_N19_A_HONEST_PRODUCT_BASELINE.futureRoadmapCapabilities.length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('technical debt delta: inventory, durable persistence, restart recovery, and operational continuity resolved; e deferred; nothing introduced', () => {
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
    expect(W5_N19_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N19_A_TECHNICAL_DEBT_DELTA.deferred).toEqual(['W5-N19-e']);
  });
});

describe('W5-N19-a notification retry scheduling inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W5_N19_A_SLICE_ID).toBe('W5-N19-a');
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.duplicateSchedulerSubsystem).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.schedulerPlatformIntroduced).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.workflowEngineIntroduced).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.notificationControlPlane).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N19_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N19_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–4 unchanged', () => {
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.wave4Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no Scheduler Platform / Workflow Engine / new persistence owner', () => {
    expect(W5_N19_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    for (const item of [
      'retry-scheduling-implementation',
      'scheduler-platform',
      'workflow-engine',
      'event-bus-product',
      'new-persistence-owner',
      'new-bounded-context',
      'w5-n19-b',
      'exchange-adapter-modification',
    ]) {
      expect(W5_N19_A_EXPLICIT_OUT).toContain(item);
    }
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W5_N19_A_RETRY_SCHEDULING_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });
});
