import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N06_A_ALLOWED_OWNERS,
  W5_N06_A_ARCHITECTURE_CLAIMS,
  W5_N06_A_ARTIFACT_KINDS,
  W5_N06_A_BINDING_FINDINGS,
  W5_N06_A_CAPABILITY_CATEGORIES,
  W5_N06_A_DURABILITY_CLASSES,
  W5_N06_A_EXPLICIT_OUT,
  W5_N06_A_HONEST_PRODUCT_BASELINE,
  W5_N06_A_REQUIRED_ARTIFACT_KINDS,
  W5_N06_A_SLICE_ID,
  W5_N06_A_SUBSTRATE_OWNERS,
  W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY,
  W5_N06_A_TECHNICAL_DEBT_DELTA,
  artifactIds,
  rowsByCapabilityCategory,
  rowsByKind,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsNotificationPlatformDeliveryEphemeral,
  rowsNotificationPlatformDeliverySurvive,
  rowsSurvive,
} from './w5-n06-a-notification-platform-delivery-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W5-N06-a notification platform delivery inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY.map((row) => row.kind));
    for (const kind of W5_N06_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W5_N06_A_ARTIFACT_KINDS).toEqual([...W5_N06_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification and responsibility fields', () => {
    for (const row of W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY) {
      expect(W5_N06_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W5_N06_A_DURABILITY_CLASSES).toContain(row.durabilityClass);
      expect(W5_N06_A_CAPABILITY_CATEGORIES).toContain(row.capabilityCategory);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW5N06Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.persistenceResponsibility.length).toBeGreaterThan(0);
      expect(row.recoveryResponsibility.length).toBeGreaterThan(0);
      expect(row.operationalContinuityResponsibility.length).toBeGreaterThan(0);
      expect(row.honestProductState.length).toBeGreaterThan(0);
      expect(row.authorizesPlatformDeliveryFunctional).toBe(false);
      expect(row.authorizesW5N06Complete).toBe(false);
    }
  });

  it('ownership consistency: core ownership rows stay on notification substrate owners', () => {
    const ownership = rowsByKind('ownership');
    const coreIds = [
      'own-platform-delivery-layer',
      'own-notification-delivery-domain',
      'own-pc06-routing-delivery',
      'own-platform-delivery-persistence',
      'own-secret-vault-consume',
      'own-connection-management-consume',
      'own-notification-durable-queue',
      'own-per-channel-foundations-reference',
    ];
    for (const row of ownership.filter((entry) => coreIds.includes(entry.artifactId))) {
      expect(W5_N06_A_SUBSTRATE_OWNERS).toContain(row.owner);
    }
    expect(
      ownership.find((row) => row.artifactId === 'own-workspace-isolation-notifications')?.owner,
    ).toBe('workspace-isolation');
    expect(ownership.find((row) => row.artifactId === 'own-honest-product-boundaries')?.owner).toBe(
      'wave-5-documentation',
    );
  });

  it('platform coverage: per-channel anchors, W5-N05 integration consumption, PC-06 routing, missing delivery layer', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('channel-w5-n01-telegram-anchor')).toBe(true);
    expect(ids.has('channel-w5-n02-email-anchor')).toBe(true);
    expect(ids.has('channel-w5-n03-webhook-anchor')).toBe(true);
    expect(ids.has('channel-w5-n04-push-anchor')).toBe(true);
    expect(ids.has('consume-w5-n05-integration-anchor')).toBe(true);
    expect(ids.has('consume-w5-n05-integration-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n05-integration-operational-continuity')).toBe(true);
    expect(ids.has('missing-unified-platform-delivery-view')).toBe(true);
    expect(ids.has('missing-platform-delivery-restart-recovery')).toBe(true);
    expect(ids.has('missing-platform-delivery-operational-continuity')).toBe(true);
    expect(ids.has('persist-notification-platform-delivery-anchor')).toBe(true);
    expect(ids.has('missing-platform-delivery-durable-anchors')).toBe(false);
    expect(ids.has('runtime-pc06-resolve-delivery-routing')).toBe(true);
    expect(ids.has('continuity-telegram-notification-view')).toBe(true);
    expect(ids.has('continuity-push-notification-view')).toBe(true);
  });

  it('distinction consistency: delivery foundation / platform ready / per-channel honesty boundaries', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-platform-delivery-not-live-trading')).toBe(true);
    expect(ids.has('honesty-platform-ready-requires-delivery-evidence')).toBe(true);
    expect(ids.has('honesty-foundation-not-transport-i/o')).toBe(true);
    expect(ids.has('honesty-integration-not-delivery-complete')).toBe(true);
    expect(ids.has('honesty-delivery-only-not-control-plane')).toBe(true);
  });

  it('honesty blockers: missing unified delivery layer, recovery, continuity, anchors, production transport', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('missing-unified-platform-delivery-view')).toBe(true);
    expect(ids.has('missing-platform-delivery-restart-recovery')).toBe(true);
    expect(ids.has('missing-platform-delivery-operational-continuity')).toBe(true);
    expect(ids.has('missing-cross-channel-delivery-honesty-unification')).toBe(true);
    expect(ids.has('missing-production-transport-delivery')).toBe(true);
    expect(ids.has('persist-notification-platform-delivery-anchor')).toBe(true);
    expect(ids.has('missing-platform-delivery-durable-anchors')).toBe(false);
    expect(ids.has('missing-platform-delivery-ui')).toBe(true);
  });

  it('honesty: no row authorizes platform delivery functional; delivery does not function from slice a', () => {
    expect(W5_N06_A_BINDING_FINDINGS.platformDeliveryFunctionalAuthorized).toBe(false);
    expect(W5_N06_A_BINDING_FINDINGS.platformDeliveryFunctionsAfterSliceA).toBe(false);
    expect(W5_N06_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W5_N06_A_BINDING_FINDINGS.w5N05IntegrationFoundationExists).toBe(true);
    expect(W5_N06_A_BINDING_FINDINGS.unifiedPlatformDeliveryLayerMissing).toBe(true);
    expect(W5_N06_A_BINDING_FINDINGS.platformDeliveryAnchorsMissing).toBe(false);
    expect(W5_N06_A_BINDING_FINDINGS.productionTransportsDeferred).toBe(true);
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(
      W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY.length,
    );
  });

  it('platform delivery SURVIVE/EPHEMERAL subsets are documented', () => {
    expect(rowsNotificationPlatformDeliverySurvive().length).toBeGreaterThan(0);
    expect(rowsNotificationPlatformDeliveryEphemeral().length).toBeGreaterThan(0);
  });

  it('capability categories cover implemented, infrastructure, planned, not-implemented, future-roadmap', () => {
    for (const category of W5_N06_A_CAPABILITY_CATEGORIES) {
      expect(rowsByCapabilityCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('explicit OUT surfaces cover platform delivery impl, b–e, dispatcher/scheduler/retry, Live Trading, W5-N05 reopen', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-platform-delivery-implementation-slice-a')).toBe(true);
    expect(ids.has('out-w5-n06-b-durable-delivery')).toBe(true);
    expect(ids.has('out-w5-n06-c-restart-recovery')).toBe(true);
    expect(ids.has('out-w5-n06-d-operational-continuity')).toBe(true);
    expect(ids.has('out-w5-n06-e-close-evidence')).toBe(true);
    expect(ids.has('out-dispatcher-implementation')).toBe(true);
    expect(ids.has('out-scheduler-implementation')).toBe(true);
    expect(ids.has('out-retry-orchestration-implementation')).toBe(true);
    expect(ids.has('out-notification-platform-complete')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
    expect(ids.has('out-w5-n05-reopen')).toBe(true);
  });

  it('W5-N05 integration foundation consumed not reopened', () => {
    expect(W5_N06_A_ALLOWED_OWNERS).toContain('w5-n05-reference');
    const ids = new Set(artifactIds());
    expect(ids.has('consume-w5-n05-integration-anchor')).toBe(true);
    expect(ids.has('consume-w5-n05-integration-restart-recovery')).toBe(true);
    expect(ids.has('consume-w5-n05-integration-operational-continuity')).toBe(true);
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.w5N05Reopened).toBe(false);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    expect(W5_N06_A_HONEST_PRODUCT_BASELINE.implementedCapabilities[0]).toContain('None');
    expect(
      W5_N06_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length,
    ).toBeGreaterThanOrEqual(8);
    expect(W5_N06_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length).toBeGreaterThanOrEqual(1);
    expect(
      W5_N06_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      W5_N06_A_HONEST_PRODUCT_BASELINE.futureRoadmapCapabilities.length,
    ).toBeGreaterThanOrEqual(3);
  });

  it('technical debt delta: inventory resolved; b–e deferred; nothing introduced', () => {
    expect(W5_N06_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Platform Delivery Inventory Foundation',
    );
    expect(W5_N06_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N06_A_TECHNICAL_DEBT_DELTA.deferred.length).toBe(4);
  });
});

describe('W5-N06-a notification platform delivery inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W5_N06_A_SLICE_ID).toBe('W5-N06-a');
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem).toBe(false);
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine).toBe(false);
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.notificationControlPlane).toBe(false);
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N06_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N06_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–4 unchanged', () => {
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.wave4Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no duplicate notification subsystem / persistence owner / routing engine', () => {
    expect(W5_N06_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    for (const item of [
      'platform-delivery-implementation',
      'dispatcher-implementation',
      'scheduler-implementation',
      'retry-orchestration-implementation',
      'new-persistence-owner',
      'new-bounded-context',
      'w5-n06-b',
      'exchange-adapter-modification',
    ]) {
      expect(W5_N06_A_EXPLICIT_OUT).toContain(item);
    }
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });
});
