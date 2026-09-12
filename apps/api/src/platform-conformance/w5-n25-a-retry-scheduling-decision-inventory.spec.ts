import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N25_A_ALLOWED_OWNERS,
  W5_N25_A_ARCHITECTURE_CLAIMS,
  W5_N25_A_ARTIFACT_KINDS,
  W5_N25_A_BINDING_FINDINGS,
  W5_N25_A_DECISION_CLASSIFICATIONS,
  W5_N25_A_CAPABILITY_CATEGORIES,
  W5_N25_A_EXPLICIT_OUT,
  W5_N25_A_HONEST_PRODUCT_BASELINE,
  W5_N25_A_REQUIRED_ARTIFACT_KINDS,
  W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY,
  W5_N25_A_SLICE_ID,
  W5_N25_A_SUBSTRATE_OWNERS,
  W5_N25_A_TECHNICAL_DEBT_DELTA,
  artifactIds,
  rowsByCapabilityCategory,
  rowsByClassification,
  rowsByKind,
  rowsDecision,
  rowsConfiguration,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsNonRecoverable,
  rowsRecoverable,
} from './w5-n25-a-retry-scheduling-decision-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W5-N25-a notification retry scheduling decision inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.map((row) => row.kind));
    for (const kind of W5_N25_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W5_N25_A_ARTIFACT_KINDS).toEqual([...W5_N25_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(55);
  });

  it('inventory completeness: every row has required classification and responsibility fields', () => {
    for (const row of W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY) {
      expect(W5_N25_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W5_N25_A_CAPABILITY_CATEGORIES).toContain(row.capabilityCategory);
      expect(row.purpose.length).toBeGreaterThan(0);
      expect(row.decisionRole.length).toBeGreaterThan(0);
      expect(row.persistenceRequirement.length).toBeGreaterThan(0);
      expect(row.recoveryRequirement.length).toBeGreaterThan(0);
      expect(row.operationalRequirement.length).toBeGreaterThan(0);
      expect(Array.isArray(row.dependencies)).toBe(true);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW5N25Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.honestProductState.length).toBeGreaterThan(0);
      expect(W5_N25_A_DECISION_CLASSIFICATIONS).toContain(row.classification);
      expect(row.operationalVisibility.length).toBeGreaterThan(0);
      expect(row.customerVisibility.length).toBeGreaterThan(0);
      expect(row.authorizesDecisionFunctional).toBe(false);
      expect(row.authorizesW5N25Complete).toBe(false);
    }
  });

  it('classification: all five classifications appear at least once; RECOVERABLE and EPHEMERAL non-empty', () => {
    for (const classification of W5_N25_A_DECISION_CLASSIFICATIONS) {
      expect(rowsByClassification(classification).length).toBeGreaterThan(0);
    }
    expect(rowsRecoverable().length).toBeGreaterThan(0);
    expect(rowsEphemeral().length).toBeGreaterThan(0);
    expect(rowsDecision().length).toBeGreaterThan(0);
    expect(rowsConfiguration().length).toBeGreaterThan(0);
    expect(rowsNonRecoverable().length).toBeGreaterThan(0);
  });

  it('ownership consistency: core ownership rows stay on notification substrate owners', () => {
    const ownership = rowsByKind('ownership');
    const coreIds = [
      'own-platform-decision-layer',
      'own-notification-delivery-domain',
      'own-pc06-routing-delivery',
      'own-w5-n17-delivery-reliability-consume',
      'own-w5-n18-retry-execution-consume',
      'own-w5-n19-retry-scheduling-consume',
      'own-w5-n20-retry-policy-consume',
      'own-w5-n21-retry-backoff-consume',
      'own-w5-n22-retry-backoff-calculation-consume',
      'own-w5-n23-retry-eligibility-consume',
      'own-secret-vault-consume',
      'own-connection-management-consume',
      'own-notification-durable-queue',
    ];
    for (const row of ownership.filter((entry) => coreIds.includes(entry.artifactId))) {
      expect(W5_N25_A_SUBSTRATE_OWNERS).toContain(row.owner);
    }
    expect(
      ownership.find((row) => row.artifactId === 'own-workspace-isolation-notifications')?.owner,
    ).toBe('workspace-isolation');
    expect(ownership.find((row) => row.artifactId === 'own-honest-product-boundaries')?.owner).toBe(
      'wave-5-documentation',
    );
  });

  it('platform coverage: N17–N22 consume, missing eligibility gaps, PC-06 routing', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('consume-w5-n17-delivery-reliability-anchor')).toBe(true);
    expect(ids.has('consume-w5-n18-retry-execution-anchor')).toBe(true);
    expect(ids.has('consume-w5-n19-retry-scheduling-anchor')).toBe(true);
    expect(ids.has('consume-w5-n20-retry-policy-anchor')).toBe(true);
    expect(ids.has('consume-w5-n21-retry-backoff-anchor')).toBe(true);
    expect(ids.has('consume-w5-n22-retry-backoff-calculation-anchor')).toBe(true);
    expect(ids.has('consume-w5-n22-retry-backoff-calculation-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n22-retry-backoff-calculation-continuity')).toBe(true);
    expect(ids.has('own-w5-n17-delivery-reliability-consume')).toBe(true);
    expect(ids.has('own-w5-n18-retry-execution-consume')).toBe(true);
    expect(ids.has('own-w5-n19-retry-scheduling-consume')).toBe(true);
    expect(ids.has('own-w5-n20-retry-policy-consume')).toBe(true);
    expect(ids.has('own-w5-n21-retry-backoff-consume')).toBe(true);
    expect(ids.has('own-w5-n22-retry-backoff-calculation-consume')).toBe(true);
    expect(ids.has('own-w5-n23-retry-eligibility-consume')).toBe(true);
    expect(ids.has('own-w5-n24-retry-scheduling-consume')).toBe(true);
    expect(ids.has('consume-w5-n23-retry-eligibility-anchor')).toBe(true);
    expect(ids.has('consume-w5-n23-retry-eligibility-persistence')).toBe(true);
    expect(ids.has('consume-w5-n23-retry-eligibility-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n23-retry-eligibility-continuity')).toBe(true);
    expect(ids.has('consume-w5-n24-retry-scheduling-anchor')).toBe(true);
    expect(ids.has('consume-w5-n24-retry-scheduling-persistence')).toBe(true);
    expect(ids.has('consume-w5-n24-retry-scheduling-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n24-retry-scheduling-continuity')).toBe(true);
    expect(ids.has('missing-unified-platform-decision-view')).toBe(true);
    expect(ids.has('missing-decision-persistence')).toBe(true);
    expect(ids.has('missing-decision-recovery')).toBe(true);
    expect(ids.has('missing-decision-operational-continuity')).toBe(true);
    expect(ids.has('runtime-pc06-resolve-delivery-routing')).toBe(true);
    expect(ids.has('config-decision-rule-representation')).toBe(true);
    expect(ids.has('decision-candidate-model-representation')).toBe(true);
  });

  it('honesty boundaries: inventory-only honesty rules frozen', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-inventory-only-not-runtime-decision-logic')).toBe(true);
    expect(ids.has('honesty-inventory-only-not-scheduling-decisions')).toBe(true);
    expect(ids.has('honesty-inventory-only-not-eligibility-determination')).toBe(true);
    expect(ids.has('honesty-inventory-only-not-backoff-calculation')).toBe(true);
    expect(ids.has('honesty-inventory-only-not-runtime-scheduling')).toBe(true);
    expect(ids.has('honesty-inventory-only-not-execution')).toBe(true);
    expect(ids.has('honesty-inventory-only-not-retry-lifecycle')).toBe(true);
    expect(ids.has('honesty-inventory-only-not-timers')).toBe(true);
    expect(ids.has('honesty-inventory-only-not-workers')).toBe(true);
    expect(ids.has('honesty-inventory-only-not-orchestration')).toBe(true);
    expect(ids.has('honesty-inventory-output-informational')).toBe(true);
    expect(ids.has('honesty-no-runtime-scheduler')).toBe(true);
    expect(ids.has('honesty-no-retry-engine')).toBe(true);
    expect(ids.has('honesty-no-runtime-decision-engine')).toBe(true);
    expect(ids.has('honesty-no-timer-implementation')).toBe(true);
  });

  it('honesty: no row authorizes eligibility functional; slice a open with missing foundations', () => {
    expect(W5_N25_A_BINDING_FINDINGS.decisionFunctionalAuthorized).toBe(false);
    expect(W5_N25_A_BINDING_FINDINGS.decisionFunctionsAfterSliceA).toBe(false);
    expect(W5_N25_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W5_N25_A_BINDING_FINDINGS.w5N17DeliveryReliabilityExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.w5N18RetryExecutionExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.w5N19RetrySchedulingExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.w5N20RetryPolicyExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.w5N21RetryBackoffExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.w5N22RetryBackoffCalculationExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.w5N23RetryEligibilityExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.w5N24RetrySchedulingExists).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.unifiedPlatformDecisionLayerMissing).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.decisionPersistenceMissing).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.decisionRecoveryMissing).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.decisionOperationalContinuityMissing).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.productionTransportsDeferred).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.inventoryDoesNotDetermineEligibility).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.inventoryDoesNotPerformBackoffCalculation).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.inventoryDoesNotScheduleRetries).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.inventoryDoesNotExecuteRetries).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.inventoryDoesNotOwnRetryLifecycle).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.inventoryDoesNotOwnTimers).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.inventoryDoesNotOwnWorkers).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.inventoryDoesNotOwnOrchestration).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.inventoryOutputInformationalOnly).toBe(true);
  });

  it('capability categories cover implemented, infrastructure, planned, not-implemented, future-roadmap', () => {
    for (const category of W5_N25_A_CAPABILITY_CATEGORIES) {
      expect(rowsByCapabilityCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('explicit OUT surfaces cover eligibility evaluation, b–e, engines, platforms, Live Trading', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-runtime-decision-logic')).toBe(true);
    expect(ids.has('out-scheduling-decisions')).toBe(true);
    expect(ids.has('out-runtime-scheduling')).toBe(true);
    expect(ids.has('out-backoff-calculation')).toBe(true);
    expect(ids.has('out-eligibility-determination')).toBe(true);
    expect(ids.has('out-retry-execution')).toBe(true);
    expect(ids.has('out-retry-workers')).toBe(true);
    expect(ids.has('out-retry-lifecycle')).toBe(true);
    expect(ids.has('out-retry-orchestration')).toBe(true);
    expect(ids.has('out-scheduler')).toBe(true);
    expect(ids.has('out-runtime-scheduler')).toBe(true);
    expect(ids.has('out-timer-implementation')).toBe(true);
    expect(ids.has('out-timers')).toBe(true);
    expect(ids.has('out-w5-n25-b')).toBe(true);
    expect(ids.has('out-w5-n25-c')).toBe(true);
    expect(ids.has('out-w5-n25-d')).toBe(true);
    expect(ids.has('out-w5-n25-e')).toBe(true);
    expect(ids.has('out-runtime-scheduler')).toBe(true);
    expect(ids.has('out-retry-engine')).toBe(true);
    expect(ids.has('out-retry-platform')).toBe(true);
    expect(ids.has('out-notification-platform-complete')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
    expect(ids.has('out-w5-n22-reopen')).toBe(true);
    expect(ids.has('out-wave-5-complete')).toBe(true);
  });

  it('W5-N17 through W5-N22 foundations consumed not reopened', () => {
    expect(W5_N25_A_ALLOWED_OWNERS).toContain('w5-n17-reference');
    expect(W5_N25_A_ALLOWED_OWNERS).toContain('w5-n18-reference');
    expect(W5_N25_A_ALLOWED_OWNERS).toContain('w5-n19-reference');
    expect(W5_N25_A_ALLOWED_OWNERS).toContain('w5-n20-reference');
    expect(W5_N25_A_ALLOWED_OWNERS).toContain('w5-n21-reference');
    expect(W5_N25_A_ALLOWED_OWNERS).toContain('w5-n22-reference');
    expect(W5_N25_A_ALLOWED_OWNERS).toContain('w5-n24-reference');
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.w5N17Reopened).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.w5N18Reopened).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.w5N19Reopened).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.w5N20Reopened).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.w5N21Reopened).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.w5N22Reopened).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.w5N24Reopened).toBe(false);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    expect(W5_N25_A_HONEST_PRODUCT_BASELINE.implementedCapabilities[0]).toContain('None');
    expect(
      W5_N25_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length,
    ).toBeGreaterThanOrEqual(8);
    expect(W5_N25_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length).toBeGreaterThanOrEqual(1);
    expect(
      W5_N25_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      W5_N25_A_HONEST_PRODUCT_BASELINE.futureRoadmapCapabilities.length,
    ).toBeGreaterThanOrEqual(2);
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

  it('missing gaps remain absent today (persistence/recovery/continuity deferred to W5-N25-b/c/d)', () => {
    for (const id of [
      'missing-unified-platform-decision-view',
      'missing-decision-persistence',
      'missing-decision-recovery',
      'missing-decision-operational-continuity',
      'persist-candidate-decision-anchor',
      'projection-platform-readiness-decision-missing',
    ]) {
      const row = W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.find(
        (entry) => entry.artifactId === id,
      );
      expect(row).toBeDefined();
      expect(row?.existsToday).toBe(false);
    }
    expect(
      W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.find(
        (entry) => entry.artifactId === 'missing-decision-persistence',
      )?.classification,
    ).toBe('RECOVERABLE');
    expect(
      W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.find(
        (entry) => entry.artifactId === 'missing-unified-platform-decision-view',
      )?.classification,
    ).toBe('EPHEMERAL');
  });
});

describe('W5-N25-a notification retry scheduling decision inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W5_N25_A_SLICE_ID).toBe('W5-N25-a');
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.duplicateDecisionSubsystem).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.duplicateRetrySubsystem).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.runtimeSchedulerIntroduced).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.retryEngineIntroduced).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.schedulerPlatformIntroduced).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.workerIntroduced).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.timerImplementationIntroduced).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.runtimeDecisionLogicIntroduced).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.inventoryOnly).toBe(true);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.notificationControlPlane).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N25_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N25_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–4 unchanged', () => {
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.wave4Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no Runtime Scheduler / Retry Engine / new persistence owner', () => {
    expect(W5_N25_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    for (const item of [
      'runtime-scheduling',
      'runtime-scheduler',
      'retry-engine',
      'scheduler-platform',
      'workflow-engine',
      'event-bus-product',
      'new-persistence-owner',
      'new-bounded-context',
      'w5-n25-b',
      'exchange-adapter-modification',
      'w5-n22-reopen',
      'w5-n23-reopen',
    ]) {
      expect(W5_N25_A_EXPLICIT_OUT).toContain(item);
    }
  });

  it('architecture consistency: evidence paths exist on disk for existsToday rows', () => {
    for (const row of W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.filter(
      (entry) => entry.existsToday,
    )) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });
});
