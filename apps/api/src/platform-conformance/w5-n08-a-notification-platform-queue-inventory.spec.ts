import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N08_A_ALLOWED_OWNERS,
  W5_N08_A_ARCHITECTURE_CLAIMS,
  W5_N08_A_ARTIFACT_KINDS,
  W5_N08_A_BINDING_FINDINGS,
  W5_N08_A_CAPABILITY_CATEGORIES,
  W5_N08_A_DURABILITY_CLASSES,
  W5_N08_A_EXPLICIT_OUT,
  W5_N08_A_HONEST_PRODUCT_BASELINE,
  W5_N08_A_REQUIRED_ARTIFACT_KINDS,
  W5_N08_A_SLICE_ID,
  W5_N08_A_SUBSTRATE_OWNERS,
  W5_N08_A_NOTIFICATION_PLATFORM_QUEUE_INVENTORY,
  W5_N08_A_TECHNICAL_DEBT_DELTA,
  artifactIds,
  rowsByCapabilityCategory,
  rowsByKind,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsNotificationPlatformQueueEphemeral,
  rowsNotificationPlatformQueueSurvive,
  rowsSurvive,
} from './w5-n08-a-notification-platform-queue-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W5-N08-a notification platform queue inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(W5_N08_A_NOTIFICATION_PLATFORM_QUEUE_INVENTORY.map((row) => row.kind));
    for (const kind of W5_N08_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W5_N08_A_ARTIFACT_KINDS).toEqual([...W5_N08_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification and responsibility fields', () => {
    for (const row of W5_N08_A_NOTIFICATION_PLATFORM_QUEUE_INVENTORY) {
      expect(W5_N08_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W5_N08_A_DURABILITY_CLASSES).toContain(row.durabilityClass);
      expect(W5_N08_A_CAPABILITY_CATEGORIES).toContain(row.capabilityCategory);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW5N08Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.persistenceResponsibility.length).toBeGreaterThan(0);
      expect(row.recoveryResponsibility.length).toBeGreaterThan(0);
      expect(row.operationalContinuityResponsibility.length).toBeGreaterThan(0);
      expect(row.honestProductState.length).toBeGreaterThan(0);
      expect(row.authorizesPlatformQueueFunctional).toBe(false);
      expect(row.authorizesW5N08Complete).toBe(false);
    }
  });

  it('ownership consistency: core ownership rows stay on notification substrate owners', () => {
    const ownership = rowsByKind('ownership');
    const coreIds = [
      'own-platform-queue-layer',
      'own-platform-queue-persistence',
      'own-notification-delivery-domain',
      'own-pc06-routing-delivery',
      'own-w5-n06-delivery-foundation-consume',
      'own-secret-vault-consume',
      'own-connection-management-consume',
      'own-notification-durable-queue',
      'own-per-channel-foundations-reference',
    ];
    for (const row of ownership.filter((entry) => coreIds.includes(entry.artifactId))) {
      expect(W5_N08_A_SUBSTRATE_OWNERS).toContain(row.owner);
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
    expect(ids.has('missing-unified-platform-queue-view')).toBe(true);
    expect(ids.has('missing-platform-queue-restart-recovery')).toBe(true);
    expect(ids.has('missing-platform-queue-operational-continuity')).toBe(true);
    expect(ids.has('consume-w5-n06-delivery-anchor')).toBe(true);
    expect(ids.has('consume-w5-n07-dispatch-anchor')).toBe(true);
    expect(ids.has('persist-notification-platform-queue-anchor')).toBe(true);
    expect(ids.has('own-platform-queue-persistence')).toBe(true);
    expect(ids.has('runtime-pc06-resolve-delivery-routing')).toBe(true);
    expect(ids.has('continuity-telegram-notification-view')).toBe(true);
    expect(ids.has('continuity-push-notification-view')).toBe(true);
  });

  it('distinction consistency: queue foundation / platform ready / per-channel honesty boundaries', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-platform-queue-not-live-trading')).toBe(true);
    expect(ids.has('honesty-platform-ready-requires-queue-evidence')).toBe(true);
    expect(ids.has('honesty-foundation-not-transport-i/o')).toBe(true);
    expect(ids.has('honesty-dispatch-not-queue-complete')).toBe(true);
    expect(ids.has('honesty-queue-only-not-control-plane')).toBe(true);
  });

  it('honesty blockers: missing unified delivery layer, recovery, continuity, anchors, production transport', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('missing-unified-platform-queue-view')).toBe(true);
    expect(ids.has('missing-platform-queue-restart-recovery')).toBe(true);
    expect(ids.has('missing-platform-queue-operational-continuity')).toBe(true);
    expect(ids.has('missing-cross-channel-queue-honesty-unification')).toBe(true);
    expect(ids.has('missing-production-transport-delivery')).toBe(true);
    expect(ids.has('consume-w5-n06-delivery-anchor')).toBe(true);
    expect(ids.has('consume-w5-n07-dispatch-anchor')).toBe(true);
    expect(ids.has('persist-notification-platform-queue-anchor')).toBe(true);
    expect(ids.has('missing-platform-queue-ui')).toBe(true);
  });

  it('honesty: no row authorizes platform queue functional; queue does not function from slice a', () => {
    expect(W5_N08_A_BINDING_FINDINGS.platformQueueFunctionalAuthorized).toBe(false);
    expect(W5_N08_A_BINDING_FINDINGS.platformQueueFunctionsAfterSliceA).toBe(false);
    expect(W5_N08_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W5_N08_A_BINDING_FINDINGS.w5N05IntegrationFoundationExists).toBe(true);
    expect(W5_N08_A_BINDING_FINDINGS.unifiedPlatformQueueLayerMissing).toBe(true);
    expect(W5_N08_A_BINDING_FINDINGS.platformQueueAnchorsMissing).toBe(false);
    expect(W5_N08_A_BINDING_FINDINGS.w5N07DispatchFoundationExists).toBe(true);
    expect(W5_N08_A_BINDING_FINDINGS.productionTransportsDeferred).toBe(true);
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(
      W5_N08_A_NOTIFICATION_PLATFORM_QUEUE_INVENTORY.length,
    );
  });

  it('platform queue SURVIVE/EPHEMERAL subsets are documented', () => {
    expect(rowsNotificationPlatformQueueSurvive().length).toBeGreaterThan(0);
    expect(rowsNotificationPlatformQueueEphemeral().length).toBeGreaterThan(0);
  });

  it('capability categories cover implemented, infrastructure, planned, not-implemented, future-roadmap', () => {
    for (const category of W5_N08_A_CAPABILITY_CATEGORIES) {
      expect(rowsByCapabilityCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('explicit OUT surfaces cover platform queue impl, b–e, queue workers/scheduler/retry, Live Trading, W5-N05 reopen', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-platform-queue-implementation-slice-a')).toBe(true);
    expect(ids.has('out-w5-n08-b-durable-queue')).toBe(true);
    expect(ids.has('out-w5-n08-c-restart-recovery')).toBe(true);
    expect(ids.has('out-w5-n08-d-operational-continuity')).toBe(true);
    expect(ids.has('out-w5-n08-e-close-evidence')).toBe(true);
    expect(ids.has('out-queue-workers-implementation')).toBe(true);
    expect(ids.has('out-scheduler-implementation')).toBe(true);
    expect(ids.has('out-retry-orchestration-implementation')).toBe(true);
    expect(ids.has('out-notification-platform-complete')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
    expect(ids.has('out-w5-n05-reopen')).toBe(true);
  });

  it('W5-N07 dispatch foundation consumed not reopened', () => {
    expect(W5_N08_A_ALLOWED_OWNERS).toContain('w5-n07-reference');
    const ids = new Set(artifactIds());
    expect(ids.has('consume-w5-n07-dispatch-anchor')).toBe(true);
    expect(ids.has('own-w5-n07-dispatch-foundation-consume')).toBe(true);
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.w5N07Reopened).toBe(false);
  });

  it('W5-N06 delivery foundation consumed not reopened', () => {
    expect(W5_N08_A_ALLOWED_OWNERS).toContain('w5-n06-reference');
    const ids = new Set(artifactIds());
    expect(ids.has('consume-w5-n06-delivery-anchor')).toBe(true);
    expect(ids.has('consume-w5-n06-delivery-continuity-view')).toBe(true);
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.w5N06Reopened).toBe(false);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    expect(W5_N08_A_HONEST_PRODUCT_BASELINE.implementedCapabilities[0]).toContain('None');
    expect(
      W5_N08_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length,
    ).toBeGreaterThanOrEqual(8);
    expect(W5_N08_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length).toBeGreaterThanOrEqual(1);
    expect(
      W5_N08_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      W5_N08_A_HONEST_PRODUCT_BASELINE.futureRoadmapCapabilities.length,
    ).toBeGreaterThanOrEqual(3);
  });

  it('technical debt delta: inventory resolved; b–e deferred; nothing introduced', () => {
    expect(W5_N08_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Platform Queue Inventory Foundation',
    );
    expect(W5_N08_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N08_A_TECHNICAL_DEBT_DELTA.deferred.length).toBe(4);
  });
});

describe('W5-N08-a notification platform queue inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W5_N08_A_SLICE_ID).toBe('W5-N08-a');
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem).toBe(false);
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine).toBe(false);
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.notificationControlPlane).toBe(false);
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N08_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N08_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–4 unchanged', () => {
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.wave4Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no duplicate notification subsystem / persistence owner / routing engine', () => {
    expect(W5_N08_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    for (const item of [
      'platform-queue-implementation',
      'queue-workers-implementation',
      'scheduler-implementation',
      'retry-orchestration-implementation',
      'new-persistence-owner',
      'new-bounded-context',
      'w5-n08-b',
      'exchange-adapter-modification',
    ]) {
      expect(W5_N08_A_EXPLICIT_OUT).toContain(item);
    }
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W5_N08_A_NOTIFICATION_PLATFORM_QUEUE_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });
});
