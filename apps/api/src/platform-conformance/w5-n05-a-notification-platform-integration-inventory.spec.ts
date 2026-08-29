import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N05_A_ALLOWED_OWNERS,
  W5_N05_A_ARCHITECTURE_CLAIMS,
  W5_N05_A_ARTIFACT_KINDS,
  W5_N05_A_BINDING_FINDINGS,
  W5_N05_A_CAPABILITY_CATEGORIES,
  W5_N05_A_DURABILITY_CLASSES,
  W5_N05_A_EXPLICIT_OUT,
  W5_N05_A_HONEST_PRODUCT_BASELINE,
  W5_N05_A_REQUIRED_ARTIFACT_KINDS,
  W5_N05_A_SLICE_ID,
  W5_N05_A_SUBSTRATE_OWNERS,
  W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY,
  W5_N05_A_TECHNICAL_DEBT_DELTA,
  artifactIds,
  rowsByCapabilityCategory,
  rowsByKind,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsNotificationPlatformIntegrationEphemeral,
  rowsNotificationPlatformIntegrationSurvive,
  rowsSurvive,
} from './w5-n05-a-notification-platform-integration-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W5-N05-a notification platform integration inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(
      W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY.map((row) => row.kind),
    );
    for (const kind of W5_N05_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W5_N05_A_ARTIFACT_KINDS).toEqual([...W5_N05_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification fields', () => {
    for (const row of W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY) {
      expect(W5_N05_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W5_N05_A_DURABILITY_CLASSES).toContain(row.durabilityClass);
      expect(W5_N05_A_CAPABILITY_CATEGORIES).toContain(row.capabilityCategory);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW5N05Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.authorizesPlatformIntegrationFunctional).toBe(false);
      expect(row.authorizesW5N05Complete).toBe(false);
    }
  });

  it('ownership consistency: core ownership rows stay on notification substrate owners', () => {
    const ownership = rowsByKind('ownership');
    const coreIds = [
      'own-platform-integration-layer',
      'own-notification-delivery-domain',
      'own-pc06-routing-integration',
      'own-platform-integration-persistence',
      'own-secret-vault-consume',
      'own-connection-management-consume',
      'own-notification-durable-queue',
      'own-per-channel-foundations-reference',
    ];
    for (const row of ownership.filter((entry) => coreIds.includes(entry.artifactId))) {
      expect(W5_N05_A_SUBSTRATE_OWNERS).toContain(row.owner);
    }
    expect(
      ownership.find((row) => row.artifactId === 'own-workspace-isolation-notifications')?.owner,
    ).toBe('workspace-isolation');
    expect(ownership.find((row) => row.artifactId === 'own-honest-product-boundaries')?.owner).toBe(
      'wave-5-documentation',
    );
  });

  it('platform coverage: per-channel anchors, PC-06 routing, continuity views, missing integration layer', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('channel-w5-n01-telegram-anchor')).toBe(true);
    expect(ids.has('channel-w5-n02-email-anchor')).toBe(true);
    expect(ids.has('channel-w5-n03-webhook-anchor')).toBe(true);
    expect(ids.has('channel-w5-n04-push-anchor')).toBe(true);
    expect(ids.has('missing-unified-platform-integration-view')).toBe(true);
    expect(ids.has('missing-platform-integration-restart-recovery')).toBe(true);
    expect(ids.has('missing-platform-integration-operational-continuity')).toBe(true);
    expect(ids.has('missing-durable-platform-integration-anchors')).toBe(true);
    expect(ids.has('runtime-pc06-resolve-delivery-routing')).toBe(true);
    expect(ids.has('continuity-telegram-notification-view')).toBe(true);
    expect(ids.has('continuity-push-notification-view')).toBe(true);
  });

  it('distinction consistency: platform integrated / platform ready / per-channel honesty boundaries', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-platform-integrated-not-live-trading')).toBe(true);
    expect(ids.has('honesty-platform-ready-requires-evidence')).toBe(true);
    expect(ids.has('honesty-foundation-not-transport-i/o')).toBe(true);
    expect(ids.has('honesty-per-channel-not-platform-complete')).toBe(true);
    expect(ids.has('honesty-delivery-only-not-control-plane')).toBe(true);
  });

  it('honesty blockers: missing unified layer, recovery, continuity, anchors, production transport', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('missing-unified-platform-integration-view')).toBe(true);
    expect(ids.has('missing-platform-integration-restart-recovery')).toBe(true);
    expect(ids.has('missing-platform-integration-operational-continuity')).toBe(true);
    expect(ids.has('missing-cross-channel-honesty-unification')).toBe(true);
    expect(ids.has('missing-production-transport-integration')).toBe(true);
    expect(ids.has('missing-durable-platform-integration-anchors')).toBe(true);
    expect(ids.has('missing-platform-integration-ui')).toBe(true);
  });

  it('honesty: no row authorizes platform integration functional; integration does not function from slice a', () => {
    expect(W5_N05_A_BINDING_FINDINGS.platformIntegrationFunctionalAuthorized).toBe(false);
    expect(W5_N05_A_BINDING_FINDINGS.platformIntegrationFunctionsAfterSliceA).toBe(false);
    expect(W5_N05_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W5_N05_A_BINDING_FINDINGS.perChannelFoundationsExist).toBe(true);
    expect(W5_N05_A_BINDING_FINDINGS.unifiedPlatformIntegrationLayerMissing).toBe(true);
    expect(W5_N05_A_BINDING_FINDINGS.platformIntegrationAnchorsMissing).toBe(true);
    expect(W5_N05_A_BINDING_FINDINGS.productionTransportsDeferred).toBe(true);
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(
      W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY.length,
    );
  });

  it('platform integration SURVIVE/EPHEMERAL subsets are documented', () => {
    expect(rowsNotificationPlatformIntegrationSurvive().length).toBeGreaterThan(0);
    expect(rowsNotificationPlatformIntegrationEphemeral().length).toBeGreaterThan(0);
  });

  it('capability categories cover implemented, infrastructure, planned, not-implemented, future-roadmap', () => {
    for (const category of W5_N05_A_CAPABILITY_CATEGORIES) {
      expect(rowsByCapabilityCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('explicit OUT surfaces cover platform impl, b–e, Live Trading, per-channel reopen', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-platform-integration-implementation-slice-a')).toBe(true);
    expect(ids.has('out-w5-n05-b-durable-integration')).toBe(true);
    expect(ids.has('out-w5-n05-c-restart-recovery')).toBe(true);
    expect(ids.has('out-w5-n05-d-operational-continuity')).toBe(true);
    expect(ids.has('out-w5-n05-e-close-evidence')).toBe(true);
    expect(ids.has('out-notification-platform-complete')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
    expect(ids.has('out-w5-n01-reopen')).toBe(true);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    expect(W5_N05_A_HONEST_PRODUCT_BASELINE.implementedCapabilities[0]).toContain('None');
    expect(
      W5_N05_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length,
    ).toBeGreaterThanOrEqual(8);
    expect(W5_N05_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length).toBeGreaterThanOrEqual(1);
    expect(
      W5_N05_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      W5_N05_A_HONEST_PRODUCT_BASELINE.futureRoadmapCapabilities.length,
    ).toBeGreaterThanOrEqual(3);
  });

  it('technical debt delta: inventory resolved; b–e deferred; nothing introduced', () => {
    expect(W5_N05_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Platform Integration Inventory Foundation',
    );
    expect(W5_N05_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N05_A_TECHNICAL_DEBT_DELTA.deferred.length).toBe(4);
  });
});

describe('W5-N05-a notification platform integration inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W5_N05_A_SLICE_ID).toBe('W5-N05-a');
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem).toBe(false);
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine).toBe(false);
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.notificationControlPlane).toBe(false);
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N05_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N05_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–4 unchanged', () => {
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.wave4Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no duplicate notification subsystem / persistence owner / routing engine', () => {
    expect(W5_N05_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    expect(W5_N05_A_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'platform-integration-implementation',
        'new-persistence-owner',
        'new-bounded-context',
        'w5-n05-b',
        'exchange-adapter-modification',
      ]),
    );
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });
});
