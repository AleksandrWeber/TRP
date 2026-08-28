import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N02_A_ALLOWED_OWNERS,
  W5_N02_A_ARCHITECTURE_CLAIMS,
  W5_N02_A_ARTIFACT_KINDS,
  W5_N02_A_BINDING_FINDINGS,
  W5_N02_A_CAPABILITY_CATEGORIES,
  W5_N02_A_DURABILITY_CLASSES,
  W5_N02_A_EXPLICIT_OUT,
  W5_N02_A_HONEST_PRODUCT_BASELINE,
  W5_N02_A_REQUIRED_ARTIFACT_KINDS,
  W5_N02_A_SLICE_ID,
  W5_N02_A_SUBSTRATE_OWNERS,
  W5_N02_A_EMAIL_NOTIFICATION_INVENTORY,
  W5_N02_A_TECHNICAL_DEBT_DELTA,
  artifactIds,
  rowsByCapabilityCategory,
  rowsByKind,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsSurvive,
  rowsEmailNotificationEphemeral,
  rowsEmailNotificationSurvive,
} from './w5-n02-a-email-notification-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W5-N02-a email notification inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(W5_N02_A_EMAIL_NOTIFICATION_INVENTORY.map((row) => row.kind));
    for (const kind of W5_N02_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W5_N02_A_ARTIFACT_KINDS).toEqual([...W5_N02_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification fields', () => {
    for (const row of W5_N02_A_EMAIL_NOTIFICATION_INVENTORY) {
      expect(W5_N02_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W5_N02_A_DURABILITY_CLASSES).toContain(row.durabilityClass);
      expect(W5_N02_A_CAPABILITY_CATEGORIES).toContain(row.capabilityCategory);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW5N02Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.authorizesEmailRealDelivery).toBe(false);
      expect(row.authorizesW5N02Complete).toBe(false);
    }
  });

  it('ownership consistency: core ownership rows stay on notification substrate owners', () => {
    const ownership = rowsByKind('ownership');
    const coreIds = [
      'own-email-smtp-transport',
      'own-notification-delivery-domain',
      'own-delivery-pipeline',
      'own-notification-persistence',
      'own-secret-vault-smtp',
      'own-user-notification-preferences',
      'own-message-template-catalog',
      'own-notification-durable-queue',
    ];
    for (const row of ownership.filter((entry) => coreIds.includes(entry.artifactId))) {
      expect(W5_N02_A_SUBSTRATE_OWNERS).toContain(row.owner);
    }
    expect(
      ownership.find((row) => row.artifactId === 'own-workspace-isolation-notifications')?.owner,
    ).toBe('workspace-isolation');
    expect(ownership.find((row) => row.artifactId === 'own-auth-host-mail-separate')?.owner).toBe(
      'authentication',
    );
  });

  it('distinction consistency: real delivery / reserved-inactive / auth host mail honesty boundaries', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-real-delivery-not-live-trading')).toBe(true);
    expect(ids.has('honesty-reserved-inactive-not-production-smtp')).toBe(true);
    expect(ids.has('honesty-auth-host-mail-not-notification-email')).toBe(true);
    expect(ids.has('honesty-connected-requires-smtp-round-trip')).toBe(true);
    expect(ids.has('honesty-w5-n02-not-wave5-complete')).toBe(true);
  });

  it('honesty: no row authorizes Email real delivery; notifications do not function from slice a', () => {
    expect(W5_N02_A_BINDING_FINDINGS.emailRealDeliveryAuthorized).toBe(false);
    expect(W5_N02_A_BINDING_FINDINGS.emailNotificationsFunctionAfterSliceA).toBe(false);
    expect(W5_N02_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W5_N02_A_BINDING_FINDINGS.reservedInactiveEmailAdapterExists).toBe(true);
    expect(W5_N02_A_BINDING_FINDINGS.vaultSmtpNotConsumedByDelivery).toBe(true);
    expect(W5_N02_A_BINDING_FINDINGS.productionSmtpMissing).toBe(true);
    expect(W5_N02_A_BINDING_FINDINGS.authHostMailSeparate).toBe(true);
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(W5_N02_A_EMAIL_NOTIFICATION_INVENTORY.length);
  });

  it('email notification SURVIVE/EPHEMERAL subsets are documented', () => {
    expect(rowsEmailNotificationSurvive().length).toBeGreaterThan(0);
    expect(rowsEmailNotificationEphemeral().length).toBeGreaterThan(0);
  });

  it('capability categories cover implemented, infrastructure, planned, not-implemented, future-roadmap', () => {
    for (const category of W5_N02_A_CAPABILITY_CATEGORIES) {
      expect(rowsByCapabilityCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('explicit OUT surfaces cover SMTP impl, W5-N02-b…e, N03–N04, Live Trading', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-smtp-implementation-slice-a')).toBe(true);
    expect(ids.has('out-w5-n02-b-durable-anchors')).toBe(true);
    expect(ids.has('out-w5-n03-slack-discord-teams')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    expect(W5_N02_A_HONEST_PRODUCT_BASELINE.implementedCapabilities[0]).toContain('None');
    expect(
      W5_N02_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length,
    ).toBeGreaterThanOrEqual(8);
    expect(W5_N02_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length).toBeGreaterThanOrEqual(1);
    expect(
      W5_N02_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      W5_N02_A_HONEST_PRODUCT_BASELINE.futureRoadmapCapabilities.length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('technical debt delta: inventory resolved; b–e deferred; nothing introduced', () => {
    expect(W5_N02_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Email Notification Inventory Foundation',
    );
    expect(W5_N02_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N02_A_TECHNICAL_DEBT_DELTA.deferred.length).toBe(4);
  });
});

describe('W5-N02-a email notification inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W5_N02_A_SLICE_ID).toBe('W5-N02-a');
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem).toBe(false);
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine).toBe(false);
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.authHostMailMerged).toBe(false);
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N02_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N02_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–4 unchanged', () => {
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.wave4Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no duplicate notification subsystem / persistence owner / routing engine', () => {
    expect(W5_N02_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    expect(W5_N02_A_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'smtp-implementation',
        'new-persistence-owner',
        'new-bounded-context',
        'w5-n02-b',
        'exchange-adapter-modification',
        'auth-host-mail-merge',
      ]),
    );
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W5_N02_A_EMAIL_NOTIFICATION_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });
});
