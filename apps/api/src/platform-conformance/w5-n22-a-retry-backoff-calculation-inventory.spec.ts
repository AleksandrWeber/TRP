import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N22_A_ALLOWED_OWNERS,
  W5_N22_A_ARCHITECTURE_CLAIMS,
  W5_N22_A_ARTIFACT_KINDS,
  W5_N22_A_BINDING_FINDINGS,
  W5_N22_A_BACKOFF_CALCULATION_CLASSIFICATIONS,
  W5_N22_A_CAPABILITY_CATEGORIES,
  W5_N22_A_EXPLICIT_OUT,
  W5_N22_A_HONEST_PRODUCT_BASELINE,
  W5_N22_A_REQUIRED_ARTIFACT_KINDS,
  W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY,
  W5_N22_A_SLICE_ID,
  W5_N22_A_SUBSTRATE_OWNERS,
  W5_N22_A_TECHNICAL_DEBT_DELTA,
  artifactIds,
  rowsByCapabilityCategory,
  rowsByClassification,
  rowsByKind,
  rowsCalculated,
  rowsConfiguration,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsNonRecoverable,
  rowsRecoverable,
} from './w5-n22-a-retry-backoff-calculation-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W5-N22-a notification retry backoff calculation inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY.map((row) => row.kind));
    for (const kind of W5_N22_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W5_N22_A_ARTIFACT_KINDS).toEqual([...W5_N22_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(55);
  });

  it('inventory completeness: every row has required classification and responsibility fields', () => {
    for (const row of W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY) {
      expect(W5_N22_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W5_N22_A_CAPABILITY_CATEGORIES).toContain(row.capabilityCategory);
      expect(row.purpose.length).toBeGreaterThan(0);
      expect(row.calculationRole.length).toBeGreaterThan(0);
      expect(row.persistenceRequirement.length).toBeGreaterThan(0);
      expect(row.recoveryRequirement.length).toBeGreaterThan(0);
      expect(row.operationalRequirement.length).toBeGreaterThan(0);
      expect(Array.isArray(row.dependencies)).toBe(true);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW5N22Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.honestProductState.length).toBeGreaterThan(0);
      expect(W5_N22_A_BACKOFF_CALCULATION_CLASSIFICATIONS).toContain(row.classification);
      expect(row.operationalVisibility.length).toBeGreaterThan(0);
      expect(row.customerVisibility.length).toBeGreaterThan(0);
      expect(row.authorizesBackoffCalculationFunctional).toBe(false);
      expect(row.authorizesW5N22Complete).toBe(false);
    }
  });

  it('classification: all five classifications appear at least once; RECOVERABLE and EPHEMERAL non-empty', () => {
    for (const classification of W5_N22_A_BACKOFF_CALCULATION_CLASSIFICATIONS) {
      expect(rowsByClassification(classification).length).toBeGreaterThan(0);
    }
    expect(rowsRecoverable().length).toBeGreaterThan(0);
    expect(rowsEphemeral().length).toBeGreaterThan(0);
    expect(rowsCalculated().length).toBeGreaterThan(0);
    expect(rowsConfiguration().length).toBeGreaterThan(0);
    expect(rowsNonRecoverable().length).toBeGreaterThan(0);
  });

  it('ownership consistency: core ownership rows stay on notification substrate owners', () => {
    const ownership = rowsByKind('ownership');
    const coreIds = [
      'own-platform-backoff-calculation-layer',
      'own-notification-delivery-domain',
      'own-pc06-routing-delivery',
      'own-w5-n17-delivery-reliability-consume',
      'own-w5-n18-retry-execution-consume',
      'own-w5-n19-retry-scheduling-consume',
      'own-w5-n20-retry-policy-consume',
      'own-w5-n21-retry-backoff-consume',
      'own-secret-vault-consume',
      'own-connection-management-consume',
      'own-notification-durable-queue',
    ];
    for (const row of ownership.filter((entry) => coreIds.includes(entry.artifactId))) {
      expect(W5_N22_A_SUBSTRATE_OWNERS).toContain(row.owner);
    }
    expect(
      ownership.find((row) => row.artifactId === 'own-workspace-isolation-notifications')?.owner,
    ).toBe('workspace-isolation');
    expect(ownership.find((row) => row.artifactId === 'own-honest-product-boundaries')?.owner).toBe(
      'wave-5-documentation',
    );
  });

  it('platform coverage: N17–N21 consume, missing calculation gaps, PC-06 routing', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('consume-w5-n21-retry-backoff-anchor')).toBe(true);
    expect(ids.has('consume-w5-n21-retry-backoff-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n21-retry-backoff-continuity')).toBe(true);
    expect(ids.has('consume-w5-n17-delivery-reliability-anchor')).toBe(true);
    expect(ids.has('consume-w5-n18-retry-execution-anchor')).toBe(true);
    expect(ids.has('consume-w5-n19-retry-scheduling-anchor')).toBe(true);
    expect(ids.has('consume-w5-n20-retry-policy-anchor')).toBe(true);
    expect(ids.has('own-w5-n17-delivery-reliability-consume')).toBe(true);
    expect(ids.has('own-w5-n18-retry-execution-consume')).toBe(true);
    expect(ids.has('own-w5-n19-retry-scheduling-consume')).toBe(true);
    expect(ids.has('own-w5-n20-retry-policy-consume')).toBe(true);
    expect(ids.has('own-w5-n21-retry-backoff-consume')).toBe(true);
    expect(ids.has('missing-unified-platform-backoff-calculation-view')).toBe(true);
    expect(ids.has('missing-backoff-calculation-persistence')).toBe(true);
    expect(ids.has('missing-backoff-calculation-recovery')).toBe(true);
    expect(ids.has('missing-backoff-calculation-operational-continuity')).toBe(true);
    expect(ids.has('runtime-pc06-resolve-delivery-routing')).toBe(true);
    expect(ids.has('config-delay-derivation-rule-representation')).toBe(true);
    expect(ids.has('calculated-derived-delay-value-representation')).toBe(true);
  });

  it('honesty boundaries: calculation-only honesty rules frozen', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-calculation-only-not-scheduling')).toBe(true);
    expect(ids.has('honesty-calculation-only-not-execution')).toBe(true);
    expect(ids.has('honesty-calculation-only-not-retry-lifecycle')).toBe(true);
    expect(ids.has('honesty-calculation-only-not-timers')).toBe(true);
    expect(ids.has('honesty-calculation-only-not-workers')).toBe(true);
    expect(ids.has('honesty-calculation-only-not-orchestration')).toBe(true);
    expect(ids.has('honesty-calculation-output-informational')).toBe(true);
    expect(ids.has('honesty-no-calculation-engine')).toBe(true);
    expect(ids.has('honesty-no-backoff-engine')).toBe(true);
    expect(ids.has('honesty-backoff-foundation-not-calculation-runtime')).toBe(true);
  });

  it('honesty: no row authorizes backoff calculation functional; slice a open with missing foundations', () => {
    expect(W5_N22_A_BINDING_FINDINGS.backoffCalculationFunctionalAuthorized).toBe(false);
    expect(W5_N22_A_BINDING_FINDINGS.backoffCalculationFunctionsAfterSliceA).toBe(false);
    expect(W5_N22_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W5_N22_A_BINDING_FINDINGS.w5N17DeliveryReliabilityExists).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.w5N18RetryExecutionExists).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.w5N19RetrySchedulingExists).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.w5N20RetryPolicyExists).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.w5N21RetryBackoffExists).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.unifiedPlatformBackoffCalculationLayerMissing).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.backoffCalculationPersistenceMissing).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.backoffCalculationRecoveryMissing).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.backoffCalculationOperationalContinuityMissing).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.productionTransportsDeferred).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.calculationDoesNotScheduleRetries).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.calculationDoesNotExecuteRetries).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.calculationDoesNotOwnRetryLifecycle).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.calculationDoesNotOwnTimers).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.calculationDoesNotOwnWorkers).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.calculationDoesNotOwnOrchestration).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.calculationOutputInformationalOnly).toBe(true);
  });

  it('capability categories cover implemented, infrastructure, planned, not-implemented, future-roadmap', () => {
    for (const category of W5_N22_A_CAPABILITY_CATEGORIES) {
      expect(rowsByCapabilityCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('explicit OUT surfaces cover calculation runtime, b–e, engines, platforms, Live Trading', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-backoff-calculation-runtime')).toBe(true);
    expect(ids.has('out-retry-scheduling')).toBe(true);
    expect(ids.has('out-retry-execution')).toBe(true);
    expect(ids.has('out-retry-workers')).toBe(true);
    expect(ids.has('out-retry-lifecycle')).toBe(true);
    expect(ids.has('out-retry-orchestration')).toBe(true);
    expect(ids.has('out-scheduler')).toBe(true);
    expect(ids.has('out-w5-n22-b')).toBe(true);
    expect(ids.has('out-w5-n22-c')).toBe(true);
    expect(ids.has('out-w5-n22-d')).toBe(true);
    expect(ids.has('out-w5-n22-e')).toBe(true);
    expect(ids.has('out-calculation-engine')).toBe(true);
    expect(ids.has('out-backoff-engine')).toBe(true);
    expect(ids.has('out-retry-platform')).toBe(true);
    expect(ids.has('out-notification-platform-complete')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
    expect(ids.has('out-w5-n21-reopen')).toBe(true);
    expect(ids.has('out-wave-5-complete')).toBe(true);
  });

  it('W5-N17 through W5-N21 foundations consumed not reopened', () => {
    expect(W5_N22_A_ALLOWED_OWNERS).toContain('w5-n17-reference');
    expect(W5_N22_A_ALLOWED_OWNERS).toContain('w5-n18-reference');
    expect(W5_N22_A_ALLOWED_OWNERS).toContain('w5-n19-reference');
    expect(W5_N22_A_ALLOWED_OWNERS).toContain('w5-n20-reference');
    expect(W5_N22_A_ALLOWED_OWNERS).toContain('w5-n21-reference');
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.w5N17Reopened).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.w5N18Reopened).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.w5N19Reopened).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.w5N20Reopened).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.w5N21Reopened).toBe(false);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    expect(W5_N22_A_HONEST_PRODUCT_BASELINE.implementedCapabilities[0]).toContain('None');
    expect(
      W5_N22_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length,
    ).toBeGreaterThanOrEqual(8);
    expect(W5_N22_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length).toBeGreaterThanOrEqual(1);
    expect(
      W5_N22_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      W5_N22_A_HONEST_PRODUCT_BASELINE.futureRoadmapCapabilities.length,
    ).toBeGreaterThanOrEqual(2);
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

  it('missing gaps remain absent today', () => {
    for (const id of [
      'missing-unified-platform-backoff-calculation-view',
      'missing-backoff-calculation-persistence',
      'missing-backoff-calculation-recovery',
      'missing-backoff-calculation-operational-continuity',
    ]) {
      const row = W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY.find(
        (entry) => entry.artifactId === id,
      );
      expect(row).toBeDefined();
      expect(row?.existsToday).toBe(false);
    }
  });
});

describe('W5-N22-a notification retry backoff calculation inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W5_N22_A_SLICE_ID).toBe('W5-N22-a');
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.duplicateBackoffSubsystem).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.duplicateCalculationSubsystem).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.calculationEngineIntroduced).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.backoffEngineIntroduced).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.retryPlatformIntroduced).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.schedulerIntroduced).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.workerIntroduced).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.runtimeCalculationIntroduced).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.inventoryOnly).toBe(true);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.notificationControlPlane).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N22_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N22_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–4 unchanged', () => {
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.wave4Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no Calculation Engine / Backoff Engine / new persistence owner', () => {
    expect(W5_N22_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    for (const item of [
      'backoff-calculation-runtime',
      'calculation-engine',
      'backoff-engine',
      'retry-platform',
      'workflow-engine',
      'event-bus-product',
      'new-persistence-owner',
      'new-bounded-context',
      'w5-n22-b',
      'exchange-adapter-modification',
    ]) {
      expect(W5_N22_A_EXPLICIT_OUT).toContain(item);
    }
  });

  it('architecture consistency: evidence paths exist on disk for existsToday rows', () => {
    for (const row of W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY.filter(
      (entry) => entry.existsToday,
    )) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });
});
