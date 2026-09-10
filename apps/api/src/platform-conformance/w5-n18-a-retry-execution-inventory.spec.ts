import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N18_A_ALLOWED_OWNERS,
  W5_N18_A_ARCHITECTURE_CLAIMS,
  W5_N18_A_ARTIFACT_KINDS,
  W5_N18_A_BINDING_FINDINGS,
  W5_N18_A_CAPABILITY_CATEGORIES,
  W5_N18_A_DURABILITY_CLASSES,
  W5_N18_A_EXPLICIT_OUT,
  W5_N18_A_HONEST_PRODUCT_BASELINE,
  W5_N18_A_REQUIRED_ARTIFACT_KINDS,
  W5_N18_A_SLICE_ID,
  W5_N18_A_SUBSTRATE_OWNERS,
  W5_N18_A_RETRY_EXECUTION_INVENTORY,
  W5_N18_A_RETRY_CLASSIFICATIONS,
  W5_N18_A_TECHNICAL_DEBT_DELTA,
  artifactIds,
  rowsByCapabilityCategory,
  rowsByKind,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsNotificationPlatformRetryExecutionEphemeral,
  rowsNotificationPlatformRetryExecutionSurvive,
  rowsSurvive,
} from './w5-n18-a-retry-execution-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W5-N18-a notification platform retry execution inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(W5_N18_A_RETRY_EXECUTION_INVENTORY.map((row) => row.kind));
    for (const kind of W5_N18_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W5_N18_A_ARTIFACT_KINDS).toEqual([...W5_N18_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification and responsibility fields', () => {
    for (const row of W5_N18_A_RETRY_EXECUTION_INVENTORY) {
      expect(W5_N18_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W5_N18_A_DURABILITY_CLASSES).toContain(row.durabilityClass);
      expect(W5_N18_A_CAPABILITY_CATEGORIES).toContain(row.capabilityCategory);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW5N18Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.persistenceResponsibility.length).toBeGreaterThan(0);
      expect(row.recoveryResponsibility.length).toBeGreaterThan(0);
      expect(row.operationalContinuityResponsibility.length).toBeGreaterThan(0);
      expect(row.honestProductState.length).toBeGreaterThan(0);
      expect(W5_N18_A_RETRY_CLASSIFICATIONS).toContain(row.retryClassification);
      expect(row.operationalVisibility.length).toBeGreaterThan(0);
      expect(row.customerVisibility.length).toBeGreaterThan(0);
      expect(row.authorizesRetryExecutionFunctional).toBe(false);
      expect(row.authorizesW5N18Complete).toBe(false);
    }
  });

  it('ownership consistency: core ownership rows stay on notification substrate owners', () => {
    const ownership = rowsByKind('ownership');
    const coreIds = [
      'own-platform-retry-execution-layer',
      'own-notification-delivery-domain',
      'own-pc06-routing-delivery',
      'own-w5-n06-delivery-foundation-consume',
      'own-secret-vault-consume',
      'own-connection-management-consume',
      'own-notification-durable-queue',
      'own-per-channel-foundations-reference',
    ];
    for (const row of ownership.filter((entry) => coreIds.includes(entry.artifactId))) {
      expect(W5_N18_A_SUBSTRATE_OWNERS).toContain(row.owner);
    }
    expect(
      ownership.find((row) => row.artifactId === 'own-workspace-isolation-notifications')?.owner,
    ).toBe('workspace-isolation');
    expect(ownership.find((row) => row.artifactId === 'own-honest-product-boundaries')?.owner).toBe(
      'wave-5-documentation',
    );
  });

  it('platform coverage: N13/N17 consume, missing retry execution, PC-06 routing', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('channel-w5-n01-telegram-anchor')).toBe(true);
    expect(ids.has('channel-w5-n02-email-anchor')).toBe(true);
    expect(ids.has('channel-w5-n03-webhook-anchor')).toBe(true);
    expect(ids.has('channel-w5-n04-push-anchor')).toBe(true);
    expect(ids.has('consume-w5-n13-retry-anchor')).toBe(true);
    expect(ids.has('consume-w5-n13-retry-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n13-retry-continuity')).toBe(true);
    expect(ids.has('consume-w5-n17-reliability-anchor')).toBe(true);
    expect(ids.has('consume-w5-n17-reliability-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n17-reliability-continuity')).toBe(true);
    expect(ids.has('missing-unified-platform-retry-execution-view')).toBe(true);
    expect(ids.has('missing-retry-eligibility-anchors')).toBe(true);
    expect(ids.has('missing-retry-execution-sequencing')).toBe(true);
    expect(ids.has('missing-restart-safe-retry-planning')).toBe(true);
    expect(ids.has('missing-retry-execution-operational-continuity')).toBe(true);
    expect(ids.has('persist-notification-platform-retry-execution-anchor')).toBe(true);
    expect(ids.has('runtime-pc06-resolve-delivery-routing')).toBe(true);
    expect(ids.has('own-w5-n13-retry-foundation-consume')).toBe(true);
    expect(ids.has('own-w5-n17-delivery-reliability-consume')).toBe(true);
  });

  it('honesty boundaries: retry execution honesty rules frozen', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-retry-execution-not-successful-delivery')).toBe(true);
    expect(ids.has('honesty-retry-execution-not-provider-acceptance')).toBe(true);
    expect(ids.has('honesty-retry-execution-not-recipient-receipt')).toBe(true);
    expect(ids.has('honesty-retry-execution-not-exactly-once')).toBe(true);
    expect(ids.has('honesty-retry-execution-not-delivery-guarantee')).toBe(true);
    expect(ids.has('honesty-retry-foundation-not-retry-execution')).toBe(true);
    expect(ids.has('honesty-delivery-reliability-not-retry-execution')).toBe(true);
    expect(ids.has('honesty-retry-execution-not-live-trading')).toBe(true);
  });

  it('honesty: no row authorizes retry execution functional; does not function from slice a', () => {
    expect(W5_N18_A_BINDING_FINDINGS.retryExecutionFunctionalAuthorized).toBe(false);
    expect(W5_N18_A_BINDING_FINDINGS.retryExecutionFunctionsAfterSliceA).toBe(false);
    expect(W5_N18_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W5_N18_A_BINDING_FINDINGS.w5N13RetryFoundationExists).toBe(true);
    expect(W5_N18_A_BINDING_FINDINGS.w5N17DeliveryReliabilityExists).toBe(true);
    expect(W5_N18_A_BINDING_FINDINGS.unifiedPlatformRetryExecutionLayerMissing).toBe(true);
    expect(W5_N18_A_BINDING_FINDINGS.retryExecutionEligibilityMissing).toBe(false);
    expect(W5_N18_A_BINDING_FINDINGS.retryExecutionSequencingMissing).toBe(false);
    expect(W5_N18_A_BINDING_FINDINGS.restartSafeRetryPlanningMissing).toBe(false);
    expect(W5_N18_A_BINDING_FINDINGS.retryExecutionOperationalContinuityMissing).toBe(false);
    expect(W5_N18_A_BINDING_FINDINGS.productionTransportsDeferred).toBe(true);
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(W5_N18_A_RETRY_EXECUTION_INVENTORY.length);
  });

  it('platform retry execution SURVIVE/EPHEMERAL subsets are documented', () => {
    expect(rowsNotificationPlatformRetryExecutionSurvive().length).toBeGreaterThan(0);
    expect(rowsNotificationPlatformRetryExecutionEphemeral().length).toBeGreaterThan(0);
  });

  it('capability categories cover implemented, infrastructure, planned, not-implemented, future-roadmap', () => {
    for (const category of W5_N18_A_CAPABILITY_CATEGORIES) {
      expect(rowsByCapabilityCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('explicit OUT surfaces cover retry execution impl, b–e, platforms, Live Trading', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-retry-execution-implementation-slice-a')).toBe(true);
    expect(ids.has('out-w5-n18-b-durable-eligibility-sequencing')).toBe(true);
    expect(ids.has('out-w5-n18-c-restart-safe-planning')).toBe(true);
    expect(ids.has('out-w5-n18-d-operational-continuity')).toBe(true);
    expect(ids.has('out-w5-n18-e-close-evidence')).toBe(true);
    expect(ids.has('out-retry-platform')).toBe(true);
    expect(ids.has('out-workflow-engine')).toBe(true);
    expect(ids.has('out-notification-platform-complete')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
    expect(ids.has('out-w5-n13-reopen')).toBe(true);
  });

  it('W5-N13 and W5-N17 foundations consumed not reopened', () => {
    expect(W5_N18_A_ALLOWED_OWNERS).toContain('w5-n13-reference');
    expect(W5_N18_A_ALLOWED_OWNERS).toContain('w5-n17-reference');
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.w5N13Reopened).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.w5N17Reopened).toBe(false);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    expect(W5_N18_A_HONEST_PRODUCT_BASELINE.implementedCapabilities[0]).toContain('None');
    expect(
      W5_N18_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length,
    ).toBeGreaterThanOrEqual(8);
    expect(W5_N18_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length).toBeGreaterThanOrEqual(1);
    expect(
      W5_N18_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      W5_N18_A_HONEST_PRODUCT_BASELINE.futureRoadmapCapabilities.length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('technical debt delta: inventory + durable persistence + restart recovery + operational continuity + Close Evidence resolved; FIV deferred; nothing introduced', () => {
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
    expect(W5_N18_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Platform Retry Execution Package Close Evidence',
    );
    expect(W5_N18_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N18_A_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'Final Package Integration Verification',
      'Product Owner Final Close',
      'Retry execution runtime',
    ]);
    expect(W5_N18_A_HONEST_PRODUCT_BASELINE.plannedCapabilities).toEqual([
      'Final Package Integration Verification',
    ]);
  });
});

describe('W5-N18-a notification platform retry execution inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W5_N18_A_SLICE_ID).toBe('W5-N18-a');
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.duplicateRetrySubsystem).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.retryPlatformIntroduced).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.workflowEngineIntroduced).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.notificationControlPlane).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N18_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N18_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–4 unchanged', () => {
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.wave4Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no Retry Platform / Workflow Engine / new persistence owner', () => {
    expect(W5_N18_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    for (const item of [
      'retry-execution-implementation',
      'retry-platform',
      'workflow-engine',
      'scheduler-product',
      'event-bus-product',
      'new-persistence-owner',
      'new-bounded-context',
      'w5-n18-b',
      'exchange-adapter-modification',
    ]) {
      expect(W5_N18_A_EXPLICIT_OUT).toContain(item);
    }
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W5_N18_A_RETRY_EXECUTION_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });
});
