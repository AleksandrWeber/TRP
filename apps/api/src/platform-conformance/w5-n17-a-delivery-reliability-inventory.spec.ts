import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N17_A_ALLOWED_OWNERS,
  W5_N17_A_ARCHITECTURE_CLAIMS,
  W5_N17_A_ARTIFACT_KINDS,
  W5_N17_A_BINDING_FINDINGS,
  W5_N17_A_CAPABILITY_CATEGORIES,
  W5_N17_A_DURABILITY_CLASSES,
  W5_N17_A_EXPLICIT_OUT,
  W5_N17_A_HONEST_PRODUCT_BASELINE,
  W5_N17_A_REQUIRED_ARTIFACT_KINDS,
  W5_N17_A_SLICE_ID,
  W5_N17_A_SUBSTRATE_OWNERS,
  W5_N17_A_DELIVERY_RELIABILITY_INVENTORY,
  W5_N17_A_RELIABILITY_CLASSIFICATIONS,
  W5_N17_A_TECHNICAL_DEBT_DELTA,
  artifactIds,
  rowsByCapabilityCategory,
  rowsByKind,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsNotificationPlatformDeliveryReliabilityEphemeral,
  rowsNotificationPlatformDeliveryReliabilitySurvive,
  rowsSurvive,
} from './w5-n17-a-delivery-reliability-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W5-N17-a notification platform delivery reliability inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(W5_N17_A_DELIVERY_RELIABILITY_INVENTORY.map((row) => row.kind));
    for (const kind of W5_N17_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W5_N17_A_ARTIFACT_KINDS).toEqual([...W5_N17_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification and responsibility fields', () => {
    for (const row of W5_N17_A_DELIVERY_RELIABILITY_INVENTORY) {
      expect(W5_N17_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W5_N17_A_DURABILITY_CLASSES).toContain(row.durabilityClass);
      expect(W5_N17_A_CAPABILITY_CATEGORIES).toContain(row.capabilityCategory);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW5N17Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.persistenceResponsibility.length).toBeGreaterThan(0);
      expect(row.recoveryResponsibility.length).toBeGreaterThan(0);
      expect(row.operationalContinuityResponsibility.length).toBeGreaterThan(0);
      expect(row.honestProductState.length).toBeGreaterThan(0);
      expect(W5_N17_A_RELIABILITY_CLASSIFICATIONS).toContain(row.reliabilityClassification);
      expect(row.operationalVisibility.length).toBeGreaterThan(0);
      expect(row.customerVisibility.length).toBeGreaterThan(0);
      expect(row.authorizesDeliveryReliabilityFunctional).toBe(false);
      expect(row.authorizesW5N17Complete).toBe(false);
    }
  });

  it('ownership consistency: core ownership rows stay on notification substrate owners', () => {
    const ownership = rowsByKind('ownership');
    const coreIds = [
      'own-platform-reliability-layer',
      'own-notification-delivery-domain',
      'own-pc06-routing-delivery',
      'own-w5-n06-delivery-foundation-consume',
      'own-secret-vault-consume',
      'own-connection-management-consume',
      'own-notification-durable-queue',
      'own-per-channel-foundations-reference',
    ];
    for (const row of ownership.filter((entry) => coreIds.includes(entry.artifactId))) {
      expect(W5_N17_A_SUBSTRATE_OWNERS).toContain(row.owner);
    }
    expect(
      ownership.find((row) => row.artifactId === 'own-workspace-isolation-notifications')?.owner,
    ).toBe('workspace-isolation');
    expect(ownership.find((row) => row.artifactId === 'own-honest-product-boundaries')?.owner).toBe(
      'wave-5-documentation',
    );
  });

  it('platform coverage: per-channel anchors, W5-N05/N06 foundation consumption, PC-06 routing, missing queue layer', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('channel-w5-n01-telegram-anchor')).toBe(true);
    expect(ids.has('channel-w5-n02-email-anchor')).toBe(true);
    expect(ids.has('channel-w5-n03-webhook-anchor')).toBe(true);
    expect(ids.has('channel-w5-n04-push-anchor')).toBe(true);
    expect(ids.has('consume-w5-n05-integration-anchor')).toBe(true);
    expect(ids.has('consume-w5-n05-integration-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n05-integration-operational-continuity')).toBe(true);
    expect(ids.has('consume-w5-n06-delivery-continuity-view')).toBe(true);
    expect(ids.has('consume-w5-n06-delivery-restart-recovery')).toBe(true);
    expect(ids.has('missing-unified-platform-reliability-view')).toBe(true);
    expect(ids.has('missing-platform-reliability-restart-recovery')).toBe(true);
    expect(ids.has('missing-platform-reliability-operational-continuity')).toBe(true);
    expect(ids.has('consume-w5-n06-delivery-anchor')).toBe(true);
    expect(ids.has('consume-w5-n07-dispatch-anchor')).toBe(true);
    expect(ids.has('consume-w5-n11-worker-runtime-anchor')).toBe(true);
    expect(ids.has('own-w5-n11-worker-runtime-foundation-consume')).toBe(true);
    expect(ids.has('own-w5-n09-workers-foundation-consume')).toBe(true);
    expect(ids.has('consume-w5-n09-workers-anchor')).toBe(true);
    expect(ids.has('runtime-pc06-resolve-delivery-routing')).toBe(true);
    expect(ids.has('continuity-telegram-notification-view')).toBe(true);
    expect(ids.has('continuity-push-notification-view')).toBe(true);
  });

  it('distinction consistency: workers foundation / platform ready / per-channel honesty boundaries', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-platform-reliability-not-live-trading')).toBe(true);
    expect(ids.has('honesty-platform-ready-requires-reliability-evidence')).toBe(true);
    expect(ids.has('honesty-foundation-not-transport-i/o')).toBe(true);
    expect(ids.has('honesty-metrics-foundation-not-reliability-complete')).toBe(true);
    expect(ids.has('honesty-workers-only-not-control-plane')).toBe(true);
  });

  it('honesty blockers: missing unified delivery layer, recovery, continuity, anchors, production transport', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('missing-unified-platform-reliability-view')).toBe(true);
    expect(ids.has('missing-platform-reliability-restart-recovery')).toBe(true);
    expect(ids.has('missing-platform-reliability-operational-continuity')).toBe(true);
    expect(ids.has('missing-cross-channel-queue-honesty-unification')).toBe(true);
    expect(ids.has('missing-production-transport-delivery')).toBe(true);
    expect(ids.has('consume-w5-n06-delivery-anchor')).toBe(true);
    expect(ids.has('consume-w5-n07-dispatch-anchor')).toBe(true);
    expect(ids.has('consume-w5-n11-worker-runtime-anchor')).toBe(true);
    expect(ids.has('persist-notification-platform-reliability-anchor')).toBe(true);
    expect(ids.has('missing-platform-reliability-ui')).toBe(true);
  });

  it('honesty: no row authorizes platform delivery reliability functional; queue does not function from slice a', () => {
    expect(W5_N17_A_BINDING_FINDINGS.deliveryReliabilityFunctionalAuthorized).toBe(false);
    expect(W5_N17_A_BINDING_FINDINGS.deliveryReliabilityFunctionsAfterSliceA).toBe(false);
    expect(W5_N17_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W5_N17_A_BINDING_FINDINGS.w5N05IntegrationFoundationExists).toBe(true);
    expect(W5_N17_A_BINDING_FINDINGS.w5N09WorkersFoundationExists).toBe(true);
    expect(W5_N17_A_BINDING_FINDINGS.w5N11WorkerRuntimeFoundationExists).toBe(true);
    expect(W5_N17_A_BINDING_FINDINGS.unifiedPlatformReliabilityLayerMissing).toBe(true);
    expect(W5_N17_A_BINDING_FINDINGS.platformReliabilityAnchorsMissing).toBe(false);
    expect(W5_N17_A_BINDING_FINDINGS.w5N16MetricsFoundationExists).toBe(true);
    expect(W5_N17_A_BINDING_FINDINGS.w5N15TelemetryFoundationExists).toBe(true);
    expect(W5_N17_A_BINDING_FINDINGS.w5N08QueueFoundationExists).toBe(true);
    expect(W5_N17_A_BINDING_FINDINGS.w5N07DispatchFoundationExists).toBe(true);
    expect(W5_N17_A_BINDING_FINDINGS.productionTransportsDeferred).toBe(true);
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(W5_N17_A_DELIVERY_RELIABILITY_INVENTORY.length);
  });

  it('platform delivery reliability SURVIVE/EPHEMERAL subsets are documented', () => {
    expect(rowsNotificationPlatformDeliveryReliabilitySurvive().length).toBeGreaterThan(0);
    expect(rowsNotificationPlatformDeliveryReliabilityEphemeral().length).toBeGreaterThan(0);
  });

  it('capability categories cover implemented, infrastructure, planned, not-implemented, future-roadmap', () => {
    for (const category of W5_N17_A_CAPABILITY_CATEGORIES) {
      expect(rowsByCapabilityCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('explicit OUT surfaces cover platform delivery reliability impl, b–e, scheduler/scheduler/retry, Live Trading, W5-N05 reopen', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-platform-workers-implementation-slice-a')).toBe(true);
    expect(ids.has('out-w5-n14-b-durable-scheduler')).toBe(true);
    expect(ids.has('out-w5-n14-c-restart-recovery')).toBe(true);
    expect(ids.has('out-w5-n14-d-operational-continuity')).toBe(true);
    expect(ids.has('out-w5-n14-e-close-evidence')).toBe(true);
    expect(ids.has('out-metric-collection-runtime-implementation')).toBe(true);
    expect(ids.has('out-metrics-collection-implementation')).toBe(true);
    expect(ids.has('out-exporter-implementation')).toBe(true);
    expect(ids.has('out-notification-platform-complete')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
    expect(ids.has('out-w5-n05-reopen')).toBe(true);
  });

  it('W5-N11 worker runtime foundation consumed not reopened', () => {
    expect(W5_N17_A_ALLOWED_OWNERS).toContain('w5-n10-reference');
    const ids = new Set(artifactIds());
    expect(ids.has('consume-w5-n11-worker-runtime-anchor')).toBe(true);
    expect(ids.has('own-w5-n11-worker-runtime-foundation-consume')).toBe(true);
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.w5N10Reopened).toBe(false);
  });

  it('W5-N11 worker runtime foundation consumed not reopened', () => {
    expect(W5_N17_A_ALLOWED_OWNERS).toContain('w5-n06-reference');
    const ids = new Set(artifactIds());
    expect(ids.has('consume-w5-n06-delivery-anchor')).toBe(true);
    expect(ids.has('consume-w5-n06-delivery-continuity-view')).toBe(true);
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.w5N11Reopened).toBe(false);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    expect(W5_N17_A_HONEST_PRODUCT_BASELINE.implementedCapabilities[0]).toContain('None');
    expect(
      W5_N17_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length,
    ).toBeGreaterThanOrEqual(8);
    expect(W5_N17_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length).toBeGreaterThanOrEqual(1);
    expect(
      W5_N17_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      W5_N17_A_HONEST_PRODUCT_BASELINE.futureRoadmapCapabilities.length,
    ).toBeGreaterThanOrEqual(3);
  });

  it('technical debt delta: inventory resolved; final integration deferred; nothing introduced', () => {
    expect(W5_N17_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Delivery Reliability inventory baseline established',
    );
    expect(W5_N17_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N17_A_TECHNICAL_DEBT_DELTA.deferred).toEqual(['W5-N17-d', 'W5-N17-e']);
  });
});

describe('W5-N17-a notification platform delivery reliability inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W5_N17_A_SLICE_ID).toBe('W5-N17-a');
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem).toBe(false);
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine).toBe(false);
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.notificationControlPlane).toBe(false);
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N17_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N17_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–4 unchanged', () => {
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.wave4Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no duplicate notification subsystem / persistence owner / routing engine', () => {
    expect(W5_N17_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    for (const item of [
      'platform-workers-implementation',
      'worker-execution-implementation',
      'scheduler-implementation',
      'retry-orchestration-implementation',
      'new-persistence-owner',
      'new-bounded-context',
      'w5-n17-b',
      'exchange-adapter-modification',
    ]) {
      expect(W5_N17_A_EXPLICIT_OUT).toContain(item);
    }
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W5_N17_A_DELIVERY_RELIABILITY_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });
});
