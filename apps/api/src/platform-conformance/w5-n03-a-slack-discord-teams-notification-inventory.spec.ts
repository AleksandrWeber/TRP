import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W5_N03_A_ALLOWED_OWNERS,
  W5_N03_A_ARCHITECTURE_CLAIMS,
  W5_N03_A_ARTIFACT_KINDS,
  W5_N03_A_BINDING_FINDINGS,
  W5_N03_A_CAPABILITY_CATEGORIES,
  W5_N03_A_DURABILITY_CLASSES,
  W5_N03_A_EXPLICIT_OUT,
  W5_N03_A_HONEST_PRODUCT_BASELINE,
  W5_N03_A_REQUIRED_ARTIFACT_KINDS,
  W5_N03_A_SLICE_ID,
  W5_N03_A_SUBSTRATE_OWNERS,
  W5_N03_A_SLACK_DISCORD_TEAMS_NOTIFICATION_INVENTORY,
  W5_N03_A_TECHNICAL_DEBT_DELTA,
  artifactIds,
  rowsByCapabilityCategory,
  rowsByKind,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsSurvive,
  rowsSlackDiscordTeamsNotificationEphemeral,
  rowsSlackDiscordTeamsNotificationSurvive,
} from './w5-n03-a-slack-discord-teams-notification-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W5-N03-a slack/discord/teams notification inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(
      W5_N03_A_SLACK_DISCORD_TEAMS_NOTIFICATION_INVENTORY.map((row) => row.kind),
    );
    for (const kind of W5_N03_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W5_N03_A_ARTIFACT_KINDS).toEqual([...W5_N03_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification fields', () => {
    for (const row of W5_N03_A_SLACK_DISCORD_TEAMS_NOTIFICATION_INVENTORY) {
      expect(W5_N03_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W5_N03_A_DURABILITY_CLASSES).toContain(row.durabilityClass);
      expect(W5_N03_A_CAPABILITY_CATEGORIES).toContain(row.capabilityCategory);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW5N03Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.authorizesWebhookRealDelivery).toBe(false);
      expect(row.authorizesW5N03Complete).toBe(false);
    }
  });

  it('ownership consistency: core ownership rows stay on notification substrate owners', () => {
    const ownership = rowsByKind('ownership');
    const coreIds = [
      'own-slack-discord-teams-webhook-transport',
      'own-notification-delivery-domain',
      'own-delivery-pipeline',
      'own-notification-persistence',
      'own-secret-vault-webhook',
      'own-connection-management-webhook',
      'own-user-notification-preferences',
      'own-notification-durable-queue',
    ];
    for (const row of ownership.filter((entry) => coreIds.includes(entry.artifactId))) {
      expect(W5_N03_A_SUBSTRATE_OWNERS).toContain(row.owner);
    }
    expect(
      ownership.find((row) => row.artifactId === 'own-workspace-isolation-notifications')?.owner,
    ).toBe('workspace-isolation');
  });

  it('per-channel coverage: Slack, Discord, and Microsoft Teams binding/credential/mapping/endpoint/metadata rows', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('slack-workspace-binding-disclosure')).toBe(true);
    expect(ids.has('slack-bot-token-vault-absent')).toBe(true);
    expect(ids.has('slack-channel-mapping-routing')).toBe(true);
    expect(ids.has('slack-webhook-endpoint-transport')).toBe(true);
    expect(ids.has('slack-delivery-metadata-attempts')).toBe(true);
    expect(ids.has('discord-guild-binding-disclosure')).toBe(true);
    expect(ids.has('discord-bot-token-vault-absent')).toBe(true);
    expect(ids.has('discord-channel-mapping-routing')).toBe(true);
    expect(ids.has('discord-webhook-endpoint-transport')).toBe(true);
    expect(ids.has('discord-delivery-metadata-attempts')).toBe(true);
    expect(ids.has('teams-tenant-binding-disclosure')).toBe(true);
    expect(ids.has('teams-bot-credentials-vault-absent')).toBe(true);
    expect(ids.has('teams-channel-mapping-routing')).toBe(true);
    expect(ids.has('teams-webhook-endpoint-transport')).toBe(true);
    expect(ids.has('teams-delivery-metadata-attempts')).toBe(true);
  });

  it('distinction consistency: real delivery / reserved-inactive / webhook round-trip honesty boundaries', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-real-delivery-not-live-trading')).toBe(true);
    expect(ids.has('honesty-reserved-inactive-not-production-webhook')).toBe(true);
    expect(ids.has('honesty-connected-requires-webhook-round-trip')).toBe(true);
    expect(ids.has('honesty-w5-n03-not-wave5-complete')).toBe(true);
  });

  it('honesty blockers: missing production transports, runtime delivery, recovery, continuity, anchors, execution', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('missing-production-webhook-transports')).toBe(true);
    expect(ids.has('missing-runtime-webhook-delivery')).toBe(true);
    expect(ids.has('missing-webhook-restart-recovery')).toBe(true);
    expect(ids.has('missing-webhook-operational-continuity')).toBe(true);
    expect(ids.has('missing-durable-webhook-anchors')).toBe(true);
    expect(ids.has('missing-webhook-delivery-execution')).toBe(true);
  });

  it('honesty: no row authorizes webhook real delivery; notifications do not function from slice a', () => {
    expect(W5_N03_A_BINDING_FINDINGS.webhookRealDeliveryAuthorized).toBe(false);
    expect(W5_N03_A_BINDING_FINDINGS.slackDiscordTeamsNotificationsFunctionAfterSliceA).toBe(false);
    expect(W5_N03_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W5_N03_A_BINDING_FINDINGS.reservedInactiveWebhookAdaptersExist).toBe(true);
    expect(W5_N03_A_BINDING_FINDINGS.vaultWebhookTypesAbsent).toBe(true);
    expect(W5_N03_A_BINDING_FINDINGS.productionWebhookTransportsMissing).toBe(true);
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(
      W5_N03_A_SLACK_DISCORD_TEAMS_NOTIFICATION_INVENTORY.length,
    );
  });

  it('slack/discord/teams SURVIVE/EPHEMERAL subsets are documented', () => {
    expect(rowsSlackDiscordTeamsNotificationSurvive().length).toBeGreaterThan(0);
    expect(rowsSlackDiscordTeamsNotificationEphemeral().length).toBeGreaterThan(0);
  });

  it('capability categories cover implemented, infrastructure, planned, not-implemented, future-roadmap', () => {
    for (const category of W5_N03_A_CAPABILITY_CATEGORIES) {
      expect(rowsByCapabilityCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('explicit OUT surfaces cover webhook impl, W5-N03-b…e, N04, Live Trading', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-webhook-implementation-slice-a')).toBe(true);
    expect(ids.has('out-w5-n03-b-durable-anchors')).toBe(true);
    expect(ids.has('out-w5-n04-push')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
  });

  it('honest product baseline distinguishes implemented from infrastructure and deferred work', () => {
    expect(W5_N03_A_HONEST_PRODUCT_BASELINE.implementedCapabilities[0]).toContain('None');
    expect(
      W5_N03_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length,
    ).toBeGreaterThanOrEqual(8);
    expect(W5_N03_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length).toBeGreaterThanOrEqual(1);
    expect(
      W5_N03_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      W5_N03_A_HONEST_PRODUCT_BASELINE.futureRoadmapCapabilities.length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('technical debt delta: inventory resolved; b–e deferred; nothing introduced', () => {
    expect(W5_N03_A_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Slack / Discord / Teams Notification Inventory Foundation',
    );
    expect(W5_N03_A_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N03_A_TECHNICAL_DEBT_DELTA.deferred.length).toBe(4);
  });
});

describe('W5-N03-a slack/discord/teams notification inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W5_N03_A_SLICE_ID).toBe('W5-N03-a');
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem).toBe(false);
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine).toBe(false);
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.webhookControlPlane).toBe(false);
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N03_A_BINDING_FINDINGS.ownershipBoundariesVerified).toBe(true);
    expect(W5_N03_A_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–4 unchanged', () => {
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.wave4Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no duplicate notification subsystem / persistence owner / routing engine', () => {
    expect(W5_N03_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    expect(W5_N03_A_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'webhook-implementation',
        'new-persistence-owner',
        'new-bounded-context',
        'w5-n03-b',
        'exchange-adapter-modification',
      ]),
    );
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W5_N03_A_SLACK_DISCORD_TEAMS_NOTIFICATION_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });
});
