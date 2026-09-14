import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N29_A_ALLOWED_OWNERS,
  W5_N29_A_ARCHITECTURE_CLAIMS,
  W5_N29_A_ARTIFACT_KINDS,
  W5_N29_A_BINDING_FINDINGS,
  W5_N29_A_DECISION_CLASSIFICATIONS,
  W5_N29_A_CAPABILITY_CATEGORIES,
  W5_N29_A_EXPLICIT_OUT,
  W5_N29_A_HONEST_PRODUCT_BASELINE,
  W5_N29_A_REQUIRED_ARTIFACT_KINDS,
  W5_N29_A_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_INVENTORY,
  W5_N29_A_SLICE_ID,
  W5_N29_A_SUBSTRATE_OWNERS,
  W5_N29_A_TECHNICAL_DEBT_DELTA,
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
} from './w5-n29-a-retry-scheduling-decision-projection-publication-consumption-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W5-N29-a notification retry scheduling decision projection publication consumption inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(
      W5_N29_A_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_INVENTORY.map(
        (row) => row.kind,
      ),
    );
    for (const kind of W5_N29_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W5_N29_A_ARTIFACT_KINDS).toEqual([...W5_N29_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(55);
  });

  it('inventory completeness: every row has required classification and responsibility fields', () => {
    for (const row of W5_N29_A_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_INVENTORY) {
      expect(W5_N29_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W5_N29_A_CAPABILITY_CATEGORIES).toContain(row.capabilityCategory);
      expect(row.purpose.length).toBeGreaterThan(0);
      expect(row.consumptionRole.length).toBeGreaterThan(0);
      expect(row.persistenceRequirement.length).toBeGreaterThan(0);
      expect(row.recoveryRequirement.length).toBeGreaterThan(0);
      expect(row.operationalRequirement.length).toBeGreaterThan(0);
      expect(Array.isArray(row.dependencies)).toBe(true);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW5N29Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.honestProductState.length).toBeGreaterThan(0);
      expect(W5_N29_A_DECISION_CLASSIFICATIONS).toContain(row.classification);
      expect(row.operationalVisibility.length).toBeGreaterThan(0);
      expect(row.customerVisibility.length).toBeGreaterThan(0);
      expect(row.authorizesConsumptionFunctional).toBe(false);
      expect(row.authorizesW5N29Complete).toBe(false);
    }
  });

  it('classification: all five classifications appear at least once; RECOVERABLE and EPHEMERAL non-empty', () => {
    for (const classification of W5_N29_A_DECISION_CLASSIFICATIONS) {
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
      'own-platform-decision-projection-publication-consumption-layer',
      'own-notification-delivery-domain',
      'own-pc06-routing-delivery',
      'own-w5-n17-delivery-reliability-consume',
      'own-w5-n18-retry-execution-consume',
      'own-w5-n19-retry-scheduling-consume',
      'own-w5-n20-retry-policy-consume',
      'own-w5-n21-retry-backoff-consume',
      'own-w5-n22-retry-backoff-calculation-consume',
      'own-w5-n23-retry-eligibility-consume',
      'own-w5-n24-retry-scheduling-consume',
      'own-w5-n25-retry-scheduling-decision-consume',
      'own-w5-n26-retry-scheduling-decision-evaluation-consume',
      'own-w5-n27-retry-scheduling-decision-projection-consume',
      'own-secret-vault-consume',
      'own-connection-management-consume',
      'own-notification-durable-queue',
    ];
    for (const row of ownership.filter((entry) => coreIds.includes(entry.artifactId))) {
      expect(W5_N29_A_SUBSTRATE_OWNERS).toContain(row.owner);
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
    expect(ids.has('own-w5-n25-retry-scheduling-decision-consume')).toBe(true);
    expect(ids.has('consume-w5-n23-retry-eligibility-anchor')).toBe(true);
    expect(ids.has('consume-w5-n23-retry-eligibility-persistence')).toBe(true);
    expect(ids.has('consume-w5-n23-retry-eligibility-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n23-retry-eligibility-continuity')).toBe(true);
    expect(ids.has('consume-w5-n24-retry-scheduling-anchor')).toBe(true);
    expect(ids.has('consume-w5-n24-retry-scheduling-persistence')).toBe(true);
    expect(ids.has('consume-w5-n24-retry-scheduling-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n24-retry-scheduling-continuity')).toBe(true);
    expect(ids.has('consume-w5-n25-retry-scheduling-decision-anchor')).toBe(true);
    expect(ids.has('consume-w5-n25-retry-scheduling-decision-inventory')).toBe(true);
    expect(ids.has('consume-w5-n25-retry-scheduling-decision-persistence')).toBe(true);
    expect(ids.has('consume-w5-n25-retry-scheduling-decision-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n25-retry-scheduling-decision-continuity')).toBe(true);
    expect(ids.has('own-w5-n26-retry-scheduling-decision-evaluation-consume')).toBe(true);
    expect(ids.has('own-w5-n27-retry-scheduling-decision-projection-consume')).toBe(true);
    expect(ids.has('own-w5-n28-retry-scheduling-decision-projection-publication-consume')).toBe(
      true,
    );
    expect(ids.has('consume-w5-n26-retry-scheduling-decision-evaluation-anchor')).toBe(true);
    expect(ids.has('consume-w5-n27-retry-scheduling-decision-projection-anchor')).toBe(true);
    expect(ids.has('consume-w5-n28-publication-anchor')).toBe(true);
    expect(ids.has('consume-w5-n28-publication-inventory')).toBe(true);
    expect(ids.has('config-publication-consumption-binding')).toBe(true);
    expect(ids.has('decision-whether-to-consume-descriptor')).toBe(true);
    expect(
      ids.has('missing-unified-platform-decision-projection-publication-consumption-view'),
    ).toBe(true);
    expect(ids.has('missing-consumption-persistence')).toBe(true);
    expect(ids.has('missing-consumption-recovery')).toBe(true);
    expect(ids.has('missing-consumption-operational-continuity')).toBe(true);
    expect(ids.has('runtime-pc06-resolve-delivery-routing')).toBe(true);
    expect(ids.has('config-consumption-rule-representation')).toBe(true);
    expect(ids.has('consumption-result-model-representation')).toBe(true);
  });

  it('honesty boundaries: inventory-only honesty rules frozen', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-inventory-only-not-runtime-consumption')).toBe(true);
    expect(ids.has('honesty-no-runtime-consumption-engine')).toBe(true);
    expect(
      ids.has('honesty-inventory-only-not-runtime-decision-projection-publication-consumption'),
    ).toBe(true);
    expect(ids.has('honesty-inventory-only-not-runtime-decision-projection')).toBe(true);
    expect(ids.has('honesty-inventory-only-not-runtime-decision-evaluation')).toBe(true);
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
    expect(W5_N29_A_BINDING_FINDINGS.consumptionFunctionalAuthorized).toBe(false);
    expect(W5_N29_A_BINDING_FINDINGS.consumptionFunctionsAfterSliceA).toBe(false);
    expect(W5_N29_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W5_N29_A_BINDING_FINDINGS.w5N17DeliveryReliabilityExists).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.w5N18RetryExecutionExists).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.w5N19RetrySchedulingExists).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.w5N20RetryPolicyExists).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.w5N21RetryBackoffExists).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.w5N22RetryBackoffCalculationExists).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.w5N23RetryEligibilityExists).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.w5N24RetrySchedulingExists).toBe(true);
    expect(
      W5_N29_A_BINDING_FINDINGS.unifiedPlatformDecisionProjectionPublicationConsumptionLayerMissing,
    ).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.consumptionPersistenceMissing).toBe(false);
    expect(W5_N29_A_BINDING_FINDINGS.consumptionInventoryMissing).toBe(false);
    expect(W5_N29_A_BINDING_FINDINGS.consumptionRecoveryMissing).toBe(false);
    expect(W5_N29_A_BINDING_FINDINGS.consumptionOperationalContinuityMissing).toBe(false);
    expect(W5_N29_A_BINDING_FINDINGS.w5N25RetrySchedulingDecisionExists).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.w5N26RetrySchedulingDecisionEvaluationExists).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.w5N27RetrySchedulingDecisionProjectionExists).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.w5N28RetrySchedulingDecisionProjectionPublicationExists).toBe(
      true,
    );
    expect(W5_N29_A_BINDING_FINDINGS.productionTransportsDeferred).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.inventoryDoesNotDetermineEligibility).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.inventoryDoesNotPerformBackoffCalculation).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.inventoryDoesNotScheduleRetries).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.inventoryDoesNotExecuteRetries).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.inventoryDoesNotOwnRetryLifecycle).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.inventoryDoesNotOwnTimers).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.inventoryDoesNotOwnWorkers).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.inventoryDoesNotOwnOrchestration).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.inventoryOutputInformationalOnly).toBe(true);
  });

  it('capability categories cover implemented, infrastructure, planned, not-implemented, future-roadmap', () => {
    for (const category of W5_N29_A_CAPABILITY_CATEGORIES) {
      expect(rowsByCapabilityCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('explicit OUT surfaces cover eligibility evaluation, b–e, engines, platforms, Live Trading', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-runtime-consumption')).toBe(true);
    expect(ids.has('out-runtime-consumption-engine')).toBe(true);
    expect(ids.has('out-w5-n28-reopen')).toBe(true);
    expect(ids.has('out-runtime-decision-projection-publication-consumption')).toBe(true);
    expect(ids.has('out-runtime-decision-projection')).toBe(true);
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
    expect(ids.has('out-w5-n29-b')).toBe(true);
    expect(ids.has('out-w5-n29-c')).toBe(true);
    expect(ids.has('out-w5-n29-d')).toBe(true);
    expect(ids.has('out-w5-n29-e')).toBe(true);
    expect(ids.has('out-runtime-scheduler')).toBe(true);
    expect(ids.has('out-retry-engine')).toBe(true);
    expect(ids.has('out-retry-platform')).toBe(true);
    expect(ids.has('out-notification-platform-complete')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
    expect(ids.has('out-w5-n22-reopen')).toBe(true);
    expect(ids.has('out-wave-5-complete')).toBe(true);
  });

  it('W5-N17 through W5-N22 foundations consumed not reopened', () => {
    expect(W5_N29_A_ALLOWED_OWNERS).toContain('w5-n17-reference');
    expect(W5_N29_A_ALLOWED_OWNERS).toContain('w5-n18-reference');
    expect(W5_N29_A_ALLOWED_OWNERS).toContain('w5-n19-reference');
    expect(W5_N29_A_ALLOWED_OWNERS).toContain('w5-n20-reference');
    expect(W5_N29_A_ALLOWED_OWNERS).toContain('w5-n21-reference');
    expect(W5_N29_A_ALLOWED_OWNERS).toContain('w5-n22-reference');
    expect(W5_N29_A_ALLOWED_OWNERS).toContain('w5-n24-reference');
    expect(W5_N29_A_ALLOWED_OWNERS).toContain('w5-n25-reference');
    expect(W5_N29_A_ALLOWED_OWNERS).toContain('w5-n26-reference');
    expect(W5_N29_A_ALLOWED_OWNERS).toContain('w5-n27-reference');
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.w5N17Reopened).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.w5N18Reopened).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.w5N19Reopened).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.w5N20Reopened).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.w5N21Reopened).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.w5N22Reopened).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.w5N24Reopened).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.w5N25Reopened).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.w5N26Reopened).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.w5N27Reopened).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.w5N28Reopened).toBe(false);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    expect(W5_N29_A_HONEST_PRODUCT_BASELINE.implementedCapabilities[0]).toContain('None');
    expect(
      W5_N29_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length,
    ).toBeGreaterThanOrEqual(8);
    expect(W5_N29_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length).toBe(0);
    expect(
      W5_N29_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      W5_N29_A_HONEST_PRODUCT_BASELINE.futureRoadmapCapabilities.length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('technical debt delta: inventory through governance lifecycle resolved; runtime deferred; nothing introduced', () => {
    expect(W5_N29_A_TECHNICAL_DEBT_DELTA.resolved).toEqual([
      'Notification Retry Scheduling Decision Projection Publication Consumption inventory baseline established',
      'Notification Retry Scheduling Decision Projection Publication Consumption Persistence Foundation',
      'Notification Retry Scheduling Decision Projection Publication Consumption Restart Recovery Foundation',
      'Notification Retry Scheduling Decision Projection Publication Consumption Operational Continuity Foundation',
      'Notification Retry Scheduling Decision Projection Publication Consumption Package Close Evidence',
      'Final Package Integration Verification completed',
      'W5-N29 governance lifecycle completed',
    ]);
    expect(W5_N29_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N29_A_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'Runtime Consumption',
      'Runtime Publication',
      'Runtime Decision Projection',
      'Runtime Decision Evaluation',
      'Runtime Scheduling',
      'Retry Engine / Retry Execution',
      'Any future worker/timer/queue runtime implementation',
    ]);
  });

  it('persistence, recovery, and continuity gaps resolved by W5-N29-b/c/d; unified consumption view remains open', () => {
    expect(
      W5_N29_A_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_INVENTORY.find(
        (entry) => entry.artifactId === 'missing-consumption-persistence',
      )?.existsToday,
    ).toBe(true);
    expect(
      W5_N29_A_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_INVENTORY.find(
        (entry) => entry.artifactId === 'persist-candidate-consumption-anchor',
      )?.existsToday,
    ).toBe(true);
    expect(
      W5_N29_A_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_INVENTORY.find(
        (entry) => entry.artifactId === 'missing-consumption-persistence',
      )?.classification,
    ).toBe('RECOVERABLE');
    expect(
      W5_N29_A_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_INVENTORY.find(
        (entry) => entry.artifactId === 'persist-candidate-consumption-anchor',
      )?.classification,
    ).toBe('RECOVERABLE');
    expect(
      W5_N29_A_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_INVENTORY.find(
        (entry) => entry.artifactId === 'missing-consumption-recovery',
      )?.existsToday,
    ).toBe(true);
    expect(
      W5_N29_A_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_INVENTORY.find(
        (entry) => entry.artifactId === 'missing-consumption-recovery',
      )?.classification,
    ).toBe('EPHEMERAL');
    expect(
      W5_N29_A_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_INVENTORY.find(
        (entry) => entry.artifactId === 'missing-consumption-operational-continuity',
      )?.existsToday,
    ).toBe(true);
    expect(
      W5_N29_A_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_INVENTORY.find(
        (entry) => entry.artifactId === 'consumption-platform-readiness-projection-missing',
      )?.existsToday,
    ).toBe(true);
    for (const id of [
      'missing-unified-platform-decision-projection-publication-consumption-view',
    ]) {
      const row =
        W5_N29_A_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_INVENTORY.find(
          (entry) => entry.artifactId === id,
        );
      expect(row).toBeDefined();
      expect(row?.existsToday).toBe(false);
    }
    expect(
      W5_N29_A_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_INVENTORY.find(
        (entry) =>
          entry.artifactId ===
          'missing-unified-platform-decision-projection-publication-consumption-view',
      )?.classification,
    ).toBe('EPHEMERAL');
    expect(W5_N29_A_BINDING_FINDINGS.consumptionPersistenceMissing).toBe(false);
    expect(W5_N29_A_BINDING_FINDINGS.consumptionInventoryMissing).toBe(false);
    expect(W5_N29_A_BINDING_FINDINGS.consumptionRecoveryMissing).toBe(false);
    expect(W5_N29_A_BINDING_FINDINGS.consumptionOperationalContinuityMissing).toBe(false);
  });
});

describe('W5-N29-a notification retry scheduling decision projection publication consumption inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W5_N29_A_SLICE_ID).toBe('W5-N29-a');
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem).toBe(false);
    expect(
      W5_N29_A_ARCHITECTURE_CLAIMS.duplicateDecisionProjectionPublicationConsumptionSubsystem,
    ).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.duplicateRetrySubsystem).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.runtimeSchedulerIntroduced).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.retryEngineIntroduced).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.schedulerPlatformIntroduced).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.workerIntroduced).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.timerImplementationIntroduced).toBe(false);
    expect(
      W5_N29_A_ARCHITECTURE_CLAIMS.runtimeDecisionProjectionPublicationConsumptionIntroduced,
    ).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.inventoryOnly).toBe(true);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.notificationControlPlane).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N29_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–4 unchanged', () => {
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.wave4Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no Runtime Scheduler / Retry Engine / new persistence owner', () => {
    expect(W5_N29_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    for (const item of [
      'runtime-scheduling',
      'runtime-scheduler',
      'retry-engine',
      'scheduler-platform',
      'workflow-engine',
      'event-bus-product',
      'new-persistence-owner',
      'new-bounded-context',
      'w5-n29-b',
      'exchange-adapter-modification',
      'w5-n22-reopen',
      'w5-n23-reopen',
      'w5-n26-reopen',
      'runtime-decision-projection',
      'runtime-projection-engine',
    ]) {
      expect(W5_N29_A_EXPLICIT_OUT).toContain(item);
    }
  });

  it('architecture consistency: evidence paths exist on disk for existsToday rows', () => {
    for (const row of W5_N29_A_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_INVENTORY.filter(
      (entry) => entry.existsToday,
    )) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });
});
