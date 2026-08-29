/**
 * W5-N05-a — Notification Platform Integration Inventory & Honest Product Baseline.
 *
 * Discovery and classification only.
 * Not Notification Platform Integration implementation. Not production transport I/O.
 * Not W5-N05 COMPLETE. Not Notification Platform Complete. Not Wave 5 CLOSED.
 *
 * Classification (binding for this slice):
 * - SURVIVE: artifact persists across API restart today or is the durable
 *   substrate on existing Notification Delivery / Vault / Connection / Queue owners.
 * - EPHEMERAL: artifact is transient, per-channel-only, missing integration layer,
 *   UI-only, process-local, or absent — must not be treated as platform-integrated truth.
 *
 * W5-N01…N04 per-channel foundations consumed as reference patterns only.
 */

export const W5_N05_A_SLICE_ID = 'W5-N05-a' as const;

export const W5_N05_A_ALLOWED_OWNERS = Object.freeze([
  'notification-delivery',
  'notification-product',
  'connection-management',
  'secret-vault',
  'authentication',
  'authorization',
  'workspace-isolation',
  'security-platform',
  'security-audit',
  'product-flow',
  'command-center',
  'platform-readiness',
  'exchange-adapter',
  'event-processing',
  'release-governance',
  'wave-5-documentation',
  'w5-n01-reference',
  'w5-n02-reference',
  'w5-n03-reference',
  'w5-n04-reference',
  'ai-gateway-deferred',
  'live-trading-deferred',
  'strategy-trading-pipeline',
] as const);

export type W5N05AOwner = (typeof W5_N05_A_ALLOWED_OWNERS)[number];

/** Existing notification / platform integration substrate owners — no new owner. */
export const W5_N05_A_SUBSTRATE_OWNERS = Object.freeze([
  'notification-delivery',
  'notification-product',
  'connection-management',
  'secret-vault',
  'platform-readiness',
] as const);

export const W5_N05_A_ARTIFACT_KINDS = Object.freeze([
  'command',
  'state',
  'projection',
  'runtime',
  'operational',
  'operator-visible',
  'persistence-candidate',
  'ephemeral-artifact',
  'dependency',
  'ownership',
  'honesty-boundary',
  'explicit-out',
] as const);

export type W5N05AArtifactKind = (typeof W5_N05_A_ARTIFACT_KINDS)[number];

export const W5_N05_A_REQUIRED_ARTIFACT_KINDS = W5_N05_A_ARTIFACT_KINDS;

export const W5_N05_A_CAPABILITY_CATEGORIES = Object.freeze([
  'implemented-today',
  'infrastructure-only',
  'planned',
  'not-implemented',
  'future-roadmap',
] as const);

export type W5N05ACapabilityCategory = (typeof W5_N05_A_CAPABILITY_CATEGORIES)[number];

export const W5_N05_A_DURABILITY_CLASSES = Object.freeze(['SURVIVE', 'EPHEMERAL'] as const);

export type W5N05ADurabilityClass = (typeof W5_N05_A_DURABILITY_CLASSES)[number];

export const W5_N05_A_DEPENDENCY_DIRECTIONS = Object.freeze([
  'consumes',
  'produces',
  'depends-on',
  'observed-by',
  'blocked-by',
] as const);

export type W5N05ADependencyDirection = (typeof W5_N05_A_DEPENDENCY_DIRECTIONS)[number];

export const W5_N05_A_FUTURE_RESPONSIBILITIES = Object.freeze([
  'W5-N05-b',
  'W5-N05-c',
  'W5-N05-d',
  'W5-N05-e',
  'honesty-baseline',
  'out-of-scope-live-trading',
  'out-of-scope-platform-integration-slice-a',
  'out-of-scope-production-transport-i/o',
  'out-of-scope-exchange-adapter',
  'out-of-scope-w5-n05-complete',
  'out-of-scope-wave-5-complete',
  'out-of-scope-notification-platform-complete',
  'out-of-scope-w5-n01-reopen',
  'out-of-scope-w5-n02-reopen',
  'out-of-scope-w5-n03-reopen',
  'out-of-scope-w5-n04-reopen',
  'out-of-scope-ai-gateway',
  'w5-n01-reference',
  'w5-n02-reference',
  'w5-n03-reference',
  'w5-n04-reference',
] as const);

export type W5N05AFutureResponsibility = (typeof W5_N05_A_FUTURE_RESPONSIBILITIES)[number];

export type W5N05AInventoryRow = Readonly<{
  artifactId: string;
  artifact: string;
  kind: W5N05AArtifactKind;
  owner: W5N05AOwner;
  durabilityClass: W5N05ADurabilityClass;
  capabilityCategory: W5N05ACapabilityCategory;
  dependencyDirection?: W5N05ADependencyDirection;
  currentStatus: string;
  honestyRequirement: string;
  futureW5N05Responsibility: W5N05AFutureResponsibility;
  evidencePath: string;
  existsToday: boolean;
  authorizesPlatformIntegrationFunctional: boolean;
  authorizesW5N05Complete: boolean;
}>;

export const W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY: readonly W5N05AInventoryRow[] =
  Object.freeze([
    // ── Ownership surfaces ───────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'own-platform-integration-layer',
      artifact: 'Cross-channel Notification Platform Integration — notification-delivery owner',
      kind: 'ownership' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'not-implemented' as const,
      currentStatus:
        'Missing — per-channel N01…N04 foundations exist; unified platform integration layer absent',
      honestyRequirement:
        'Platform integration extends notification-delivery only; no second engine',
      futureW5N05Responsibility: 'W5-N05-b' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-product-scope.md',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'own-notification-delivery-domain',
      artifact: 'Notification Delivery — deliver / test / queue / connection domain owner',
      kind: 'ownership' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Verified existing owner — sole delivery-domain SoT; consume not redesign',
      honestyRequirement: 'No second notification engine; Wave 5 extends adapters only',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-product-scope.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'own-pc06-routing-integration',
      artifact: 'PC-06 routing — delivery routing SoT consumed at platform scope',
      kind: 'ownership' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Implemented — resolve-delivery-routing; Wave 5 consumes unchanged',
      honestyRequirement: 'Routing owner unchanged; platform integration consumes only',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath:
        'apps/api/src/modules/notification-delivery/routing/resolve-delivery-routing.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'own-platform-integration-persistence',
      artifact: 'Platform integration anchors — workspace-scoped durable integration state',
      kind: 'ownership' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus:
        'Implemented — workspace_notification_platform_integration_anchors on notification-delivery owner',
      honestyRequirement:
        'Anchor persistence on notification-delivery owner only; hydrate is W5-N05-c',
      futureW5N05Responsibility: 'W5-N05-c' as const,
      evidencePath:
        'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-integration-anchor.repository.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'own-secret-vault-consume',
      artifact: 'Vault — credential owner consumed by all channel adapters',
      kind: 'ownership' as const,
      owner: 'secret-vault' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Implemented vault substrate — platform integration retrieves only',
      honestyRequirement: 'Vault remains sole credential owner; no new secret types in slice a',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/secret-vault/holdable-secret-type.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'own-connection-management-consume',
      artifact: 'Connection Management — operator connect facade for all channels',
      kind: 'ownership' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Wave 2 owner — consumed; not redesigned by platform integration',
      honestyRequirement: 'Connect product per channel; platform layer does not replace facade',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-product-scope.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'own-workspace-isolation-notifications',
      artifact: 'Workspace Isolation — notification and integration state per workspace',
      kind: 'ownership' as const,
      owner: 'workspace-isolation' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Consumed — workspace-bound delivery, prefs, anchors, connections',
      honestyRequirement: 'Cross-workspace integration state leak forbidden',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-security-review.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'own-notification-durable-queue',
      artifact: 'Notification Durable Queue — W3-O02 work items (TD-045)',
      kind: 'ownership' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Implemented — queue domain + durable store on notification-delivery owner',
      honestyRequirement: 'Queue survival ≠ platform integration Complete',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/notification-delivery/domain/delivery-queue.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'own-per-channel-foundations-reference',
      artifact: 'Per-channel N01…N04 foundations — consumed not reopened',
      kind: 'ownership' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus:
        'W5-N01…N04 CLOSED — telegram/email/slack-discord-teams/push anchors on same owner',
      honestyRequirement: 'Platform integration consumes channel artifacts; no redesign',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/notification-delivery/notification-delivery.module.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'own-honest-product-boundaries',
      artifact: 'Honest Product boundaries — Wave 5 platform integration invariants',
      kind: 'ownership' as const,
      owner: 'wave-5-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Binding — frozen in W5-N05 planning scope; inventory slice a catalogues only',
      honestyRequirement:
        'Platform integrated ≠ Live Trading; foundation ≠ production transport I/O',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-product-scope.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),

    // ── Per-channel foundation consumption (SURVIVE substrates) ─────────────
    Object.freeze({
      artifactId: 'channel-w5-n01-telegram-anchor',
      artifact: 'W5-N01 Telegram notification anchor — workspace_telegram_notification_anchors',
      kind: 'persistence-candidate' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'depends-on' as const,
      currentStatus: 'Implemented — W5-N01 CLOSED; anchor on notification-delivery owner',
      honestyRequirement: 'Telegram foundation consumed; not reopened by platform integration',
      futureW5N05Responsibility: 'w5-n01-reference' as const,
      evidencePath:
        'apps/api/src/modules/notification-delivery/persistence/prisma-telegram-notification-anchor.repository.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'channel-w5-n02-email-anchor',
      artifact: 'W5-N02 Email notification anchor — workspace_email_notification_anchors',
      kind: 'persistence-candidate' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'depends-on' as const,
      currentStatus: 'Implemented — W5-N02 CLOSED; anchor on notification-delivery owner',
      honestyRequirement: 'Email foundation consumed; not reopened',
      futureW5N05Responsibility: 'w5-n02-reference' as const,
      evidencePath:
        'apps/api/src/modules/notification-delivery/persistence/prisma-email-notification-anchor.repository.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'channel-w5-n03-webhook-anchor',
      artifact:
        'W5-N03 Slack/Discord/Teams anchor — workspace_slack_discord_teams_notification_anchors',
      kind: 'persistence-candidate' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'depends-on' as const,
      currentStatus: 'Implemented — W5-N03 CLOSED; anchor on notification-delivery owner',
      honestyRequirement: 'Team chat foundation consumed; not reopened',
      futureW5N05Responsibility: 'w5-n03-reference' as const,
      evidencePath:
        'apps/api/src/modules/notification-delivery/persistence/prisma-slack-discord-teams-notification-anchor.repository.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'channel-w5-n04-push-anchor',
      artifact: 'W5-N04 Push notification anchor — workspace_push_notification_anchors',
      kind: 'persistence-candidate' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'depends-on' as const,
      currentStatus: 'Implemented — W5-N04 CLOSED; anchor on notification-delivery owner',
      honestyRequirement: 'Push foundation consumed; not reopened',
      futureW5N05Responsibility: 'w5-n04-reference' as const,
      evidencePath:
        'apps/api/src/modules/notification-delivery/persistence/prisma-push-notification-anchor.repository.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),

    // ── Platform integration gaps ────────────────────────────────────────────
    Object.freeze({
      artifactId: 'missing-unified-platform-integration-view',
      artifact: 'Unified platform integration view — cross-channel Platform Ready projection',
      kind: 'projection' as const,
      owner: 'platform-readiness' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'not-implemented' as const,
      currentStatus:
        'Missing — PlatformOperationalProjection has per-channel views only; no notificationPlatformIntegration field',
      honestyRequirement: 'Platform Ready requires integration evidence; not per-channel alone',
      futureW5N05Responsibility: 'W5-N05-d' as const,
      evidencePath: 'apps/api/src/modules/operational-continuity/operational-readiness.ts',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'missing-platform-integration-restart-recovery',
      artifact: 'Platform integration restart recovery — hydrate integration anchors',
      kind: 'runtime' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'not-implemented' as const,
      currentStatus:
        'Missing — per-channel recovery exists; no NotificationPlatformIntegrationRestartRecoveryService',
      honestyRequirement: 'Recovery requires durable integration anchors first (W5-N05-b)',
      futureW5N05Responsibility: 'W5-N05-c' as const,
      evidencePath: 'apps/api/src/modules/notification-delivery/notification-delivery.module.ts',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'missing-platform-integration-operational-continuity',
      artifact:
        'Platform integration operational continuity — buildNotificationPlatformIntegrationView',
      kind: 'operational' as const,
      owner: 'platform-readiness' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'not-implemented' as const,
      currentStatus:
        'Missing — operational-continuity.service has per-channel builders only; no platform integration builder',
      honestyRequirement: 'Continuity follows integration recovery (W5-N05-c/d)',
      futureW5N05Responsibility: 'W5-N05-d' as const,
      evidencePath: 'apps/api/src/modules/operational-continuity/operational-continuity.service.ts',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'missing-cross-channel-honesty-unification',
      artifact: 'Cross-channel honest delivery rule unification — Platform Ready semantics',
      kind: 'state' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'not-implemented' as const,
      currentStatus:
        'Missing — per-channel honesty rules exist in N01…N04 inventories; no unified platform rules',
      honestyRequirement: 'Unification deferred to post-inventory slices; no fake Platform Ready',
      futureW5N05Responsibility: 'W5-N05-b' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-validation-plan.md',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),

    // ── Per-channel operational continuity (consumed, not platform-integrated) ─
    Object.freeze({
      artifactId: 'continuity-telegram-notification-view',
      artifact: 'Platform Readiness telegramNotification — W5-N01-d per-channel projection',
      kind: 'projection' as const,
      owner: 'platform-readiness' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'observed-by' as const,
      currentStatus: 'Implemented — per-channel continuity; not platform integration layer',
      honestyRequirement: 'Per-channel Ready ≠ Notification Platform Complete',
      futureW5N05Responsibility: 'w5-n01-reference' as const,
      evidencePath: 'apps/api/src/modules/operational-continuity/operational-continuity.service.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'continuity-email-notification-view',
      artifact: 'Platform Readiness emailNotification — W5-N02-d per-channel projection',
      kind: 'projection' as const,
      owner: 'platform-readiness' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'observed-by' as const,
      currentStatus: 'Implemented — per-channel continuity only',
      honestyRequirement: 'Email continuity ≠ platform integration Complete',
      futureW5N05Responsibility: 'w5-n02-reference' as const,
      evidencePath: 'apps/api/src/modules/operational-continuity/operational-continuity.service.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'continuity-slack-discord-teams-view',
      artifact:
        'Platform Readiness slackDiscordTeamsNotification — W5-N03-d per-channel projection',
      kind: 'projection' as const,
      owner: 'platform-readiness' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'observed-by' as const,
      currentStatus: 'Implemented — per-channel continuity only',
      honestyRequirement: 'Team chat continuity ≠ platform integration Complete',
      futureW5N05Responsibility: 'w5-n03-reference' as const,
      evidencePath: 'apps/api/src/modules/operational-continuity/operational-continuity.service.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'continuity-push-notification-view',
      artifact: 'Platform Readiness pushNotification — W5-N04-d per-channel projection',
      kind: 'projection' as const,
      owner: 'platform-readiness' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'observed-by' as const,
      currentStatus: 'Implemented — per-channel continuity only',
      honestyRequirement: 'Push continuity ≠ platform integration Complete',
      futureW5N05Responsibility: 'w5-n04-reference' as const,
      evidencePath: 'apps/api/src/modules/operational-continuity/operational-continuity.service.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'continuity-notification-queue-view',
      artifact: 'Platform Readiness notificationQueue — W3-O02-d aggregate projection',
      kind: 'projection' as const,
      owner: 'platform-readiness' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'observed-by' as const,
      currentStatus: 'Implemented — queue continuity consumed by platform integration planning',
      honestyRequirement: 'Queue continuity ≠ platform integration Complete',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/operational-continuity/operational-readiness.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),

    // ── Routing / catalog / delivery pipeline ────────────────────────────────
    Object.freeze({
      artifactId: 'runtime-pc06-resolve-delivery-routing',
      artifact: 'resolve-delivery-routing — PC-06 routing + quiet-hours (platform consumes)',
      kind: 'runtime' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Implemented — routing SoT; all channels including reserved-inactive',
      honestyRequirement: 'Routing ≠ production transport; platform integration consumes only',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath:
        'apps/api/src/modules/notification-delivery/routing/resolve-delivery-routing.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'runtime-notification-channel-catalog-all',
      artifact:
        'NOTIFICATION_CHANNEL_CATALOG — telegram active; email/slack/discord/teams/push reserved',
      kind: 'state' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Implemented — multi-channel catalog; most channels reserved-inactive',
      honestyRequirement: 'Catalog truth must not imply platform integration Complete',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/notification-delivery/domain/notification-channel.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'runtime-notification-delivery-deliver',
      artifact: 'NotificationDeliveryService.deliver() — sync pipeline all channels',
      kind: 'runtime' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'implemented-today' as const,
      currentStatus:
        'Implemented — reserved channels skip; only telegram has active transport path today',
      honestyRequirement:
        'deliver() skip ≠ platform integrated; production I/O TD-049/TD-050 deferred',
      futureW5N05Responsibility: 'out-of-scope-production-transport-i/o' as const,
      evidencePath: 'apps/api/src/modules/notification-delivery/notification-delivery.service.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'rest-notification-product-pc07',
      artifact: 'PC-07 REST — notification channel settings, routing, delivery history',
      kind: 'command' as const,
      owner: 'notification-product' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus:
        'Implemented — product adapter; per-channel surfaces; no platform integration UI',
      honestyRequirement: 'Product queries only; platform integration UI deferred',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/notification-product/notification-product.service.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'rest-pc07-channel-matrix',
      artifact: 'PC-07 Channel Matrix — multi-channel reserved-inactive honesty',
      kind: 'state' as const,
      owner: 'wave-5-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus:
        'Binding — most channels Not offered; telegram partial; platform not integrated',
      honestyRequirement: 'Matrix must not claim Notification Platform Complete',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/pc-07-channel-matrix.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),

    // ── Dependencies / references ────────────────────────────────────────────
    Object.freeze({
      artifactId: 'dep-w5-n01-inventory-reference',
      artifact: 'W5-N01-a Telegram notification inventory — foundation reference',
      kind: 'dependency' as const,
      owner: 'w5-n01-reference' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'depends-on' as const,
      currentStatus: 'Reference — W5-N01 CLOSED; consumed not reopened',
      honestyRequirement: 'Consume N01 inventory patterns; no Telegram redesign',
      futureW5N05Responsibility: 'w5-n01-reference' as const,
      evidencePath: 'apps/api/src/platform-conformance/w5-n01-a-telegram-notification-inventory.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'dep-w5-n02-inventory-reference',
      artifact: 'W5-N02-a Email notification inventory — foundation reference',
      kind: 'dependency' as const,
      owner: 'w5-n02-reference' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'depends-on' as const,
      currentStatus: 'Reference — W5-N02 CLOSED; consumed not reopened',
      honestyRequirement: 'Consume N02 inventory patterns; no Email redesign',
      futureW5N05Responsibility: 'w5-n02-reference' as const,
      evidencePath: 'apps/api/src/platform-conformance/w5-n02-a-email-notification-inventory.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'dep-w5-n03-inventory-reference',
      artifact: 'W5-N03-a Slack/Discord/Teams inventory — foundation reference',
      kind: 'dependency' as const,
      owner: 'w5-n03-reference' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'depends-on' as const,
      currentStatus: 'Reference — W5-N03 CLOSED; consumed not reopened',
      honestyRequirement: 'Consume N03 inventory patterns; no webhook redesign',
      futureW5N05Responsibility: 'w5-n03-reference' as const,
      evidencePath:
        'apps/api/src/platform-conformance/w5-n03-a-slack-discord-teams-notification-inventory.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'dep-w5-n04-inventory-reference',
      artifact: 'W5-N04-a Push notification inventory — foundation reference',
      kind: 'dependency' as const,
      owner: 'w5-n04-reference' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'depends-on' as const,
      currentStatus: 'Reference — W5-N04 CLOSED; consumed not reopened',
      honestyRequirement: 'Consume N04 inventory patterns; no Push redesign',
      futureW5N05Responsibility: 'w5-n04-reference' as const,
      evidencePath: 'apps/api/src/platform-conformance/w5-n04-a-push-notification-inventory.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'dep-blocked-by-td049-td050',
      artifact: 'TD-049 / TD-050 — production transports deferred; blocks platform Complete',
      kind: 'dependency' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'not-implemented' as const,
      dependencyDirection: 'blocked-by' as const,
      currentStatus:
        'Active gap — Telegram production Bot API + reserved channels; out of W5-N05 foundation scope',
      honestyRequirement: 'Platform integration foundation ≠ production transport operational',
      futureW5N05Responsibility: 'out-of-scope-production-transport-i/o' as const,
      evidencePath: 'docs/project/technical-debt.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'dep-exchange-adapter-untouched',
      artifact: 'Exchange Adapter / Wave 4 — not consumed; unchanged',
      kind: 'dependency' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'depends-on' as const,
      currentStatus: 'Reference only — Wave 5 must not modify exchange I/O',
      honestyRequirement: 'Notifications ≠ exchange connectivity; adapter untouched',
      futureW5N05Responsibility: 'out-of-scope-exchange-adapter' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-product-scope.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'dep-ai-gateway-out-of-scope',
      artifact: 'OpenRouter / AI Gateway (Wave 7 CM-17 path) — explicitly out of W5-N05 scope',
      kind: 'dependency' as const,
      owner: 'ai-gateway-deferred' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'future-roadmap' as const,
      dependencyDirection: 'blocked-by' as const,
      currentStatus: 'Out of scope — W5-N05 CM-17 is Notification Platform Integration only',
      honestyRequirement: 'Must not conflate Wave 7 OpenRouter with Wave 5 platform integration',
      futureW5N05Responsibility: 'out-of-scope-ai-gateway' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-planning-summary.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'dep-consumes-authentication',
      artifact: 'Authentication — signed-in operator for integration surfaces',
      kind: 'dependency' as const,
      owner: 'authentication' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      dependencyDirection: 'consumes' as const,
      currentStatus: 'Consumed — fail closed when missing',
      honestyRequirement: 'Reuse Wave 1 Authentication; no parallel login',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-security-review.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),

    // ── Missing platform integration artifacts ─────────────────────────────
    Object.freeze({
      artifactId: 'missing-production-transport-integration',
      artifact: 'Production transport I/O at platform scope — TD-049 / TD-050 resolution path',
      kind: 'command' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'not-implemented' as const,
      currentStatus: 'Missing — platform integration inventory only; transports remain deferred',
      honestyRequirement: 'Must not claim transports operational from platform integration slice a',
      futureW5N05Responsibility: 'out-of-scope-production-transport-i/o' as const,
      evidencePath: 'docs/project/technical-debt.md',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'persist-notification-platform-integration-anchor',
      artifact:
        'WorkspaceNotificationPlatformIntegrationAnchor — canonical platform integration anchors (W5-N05-b)',
      kind: 'persistence-candidate' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus:
        'Implemented — workspace_notification_platform_integration_anchors; anchor-recorded only; no platform integration I/O',
      honestyRequirement:
        'Anchor persistence ≠ platform integration functional; restart hydrate is W5-N05-c',
      futureW5N05Responsibility: 'W5-N05-c' as const,
      evidencePath:
        'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-integration-anchor.repository.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'missing-platform-integration-ui',
      artifact: 'Operator UI — unified platform integration state across channels',
      kind: 'operator-visible' as const,
      owner: 'notification-product' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'not-implemented' as const,
      currentStatus:
        'Missing — per-channel notification UI only; no platform integration dashboard',
      honestyRequirement: 'UI must not show Platform Ready without integration evidence',
      futureW5N05Responsibility: 'W5-N05-b' as const,
      evidencePath: 'apps/web/src/notifications/NotificationChannelsView.tsx',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'gap-per-channel-vs-unified-platform-integration',
      artifact:
        'Parallel gap — per-channel W5-N01…N04 foundations vs unified platform integration layer',
      kind: 'ephemeral-artifact' as const,
      owner: 'notification-delivery' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'not-implemented' as const,
      currentStatus:
        'Disconnected — per-channel anchors and continuity views exist; unified platform integration layer absent',
      honestyRequirement:
        'Must converge only under notification-delivery integration layer at W5-N05-b; no duplicate SoT',
      futureW5N05Responsibility: 'W5-N05-b' as const,
      evidencePath:
        'apps/api/src/platform-conformance/w5-n05-a-notification-platform-integration-inventory.ts',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),

    // ── Operational / planning ─────────────────────────────────────────────
    Object.freeze({
      artifactId: 'op-w5-n05-planning-approved',
      artifact: 'W5-N05 Planning Package — APPROVED; slice a inventory only',
      kind: 'operational' as const,
      owner: 'wave-5-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'planned' as const,
      currentStatus:
        'Planning APPROVED — slice a inventory only; platform integration implementation deferred',
      honestyRequirement: 'Planning Approval ≠ Notification Platform Integration implemented',
      futureW5N05Responsibility: 'W5-N05-b' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-planning-approval.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),

    // ── Honesty boundaries ───────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'honesty-platform-integrated-not-live-trading',
      artifact: 'Platform integrated ≠ Live Trading; integration ≠ order submission',
      kind: 'honesty-boundary' as const,
      owner: 'wave-5-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Binding — frozen in W5-N05 scope',
      honestyRequirement: 'Platform integration outside process ≠ live capital trading enablement',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-product-scope.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'honesty-platform-ready-requires-evidence',
      artifact: 'Platform Ready label requires cross-channel integration evidence',
      kind: 'honesty-boundary' as const,
      owner: 'wave-5-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Binding — per-channel continuity alone insufficient',
      honestyRequirement: 'No fake Platform Ready from per-channel foundations alone',
      futureW5N05Responsibility: 'W5-N05-d' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-validation-plan.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'honesty-foundation-not-transport-i/o',
      artifact: 'Platform integration foundation ≠ production transport I/O operational',
      kind: 'honesty-boundary' as const,
      owner: 'wave-5-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Binding — TD-049/TD-050 remain deferred',
      honestyRequirement: 'Durable anchors ≠ SMTP/webhook/push production delivery',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-product-scope.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'honesty-per-channel-not-platform-complete',
      artifact: 'Per-channel N01…N04 Close ≠ Notification Platform Complete',
      kind: 'honesty-boundary' as const,
      owner: 'wave-5-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Binding — platform integration is separate V3-N05 package',
      honestyRequirement: 'All channels closed at foundation ≠ wave/platform Complete',
      futureW5N05Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-overview.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'honesty-delivery-only-not-control-plane',
      artifact: 'Notifications delivery-only — never trading control plane',
      kind: 'honesty-boundary' as const,
      owner: 'wave-5-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Binding — all Wave 5 channels including platform integration',
      honestyRequirement: 'Integration layer must not enable live orders',
      futureW5N05Responsibility: 'out-of-scope-live-trading' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-product-scope.md',
      existsToday: true,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),

    // ── Explicit OUT ─────────────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'out-platform-integration-implementation-slice-a',
      artifact: 'Notification Platform Integration implementation in W5-N05-a',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'planned' as const,
      currentStatus: 'Forbidden — inventory only; W5-N05-b implements durable integration',
      honestyRequirement: 'Slice a catalogues surfaces; does not implement integration layer',
      futureW5N05Responsibility: 'out-of-scope-platform-integration-slice-a' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-implementation-package.md',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'out-w5-n05-b-durable-integration',
      artifact: 'W5-N05-b — Durable Notification Platform Integration Foundation',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'planned' as const,
      currentStatus: 'Deferred — named slice; not opened from slice a',
      honestyRequirement: 'Durable integration anchors are post-inventory work',
      futureW5N05Responsibility: 'W5-N05-b' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-planning-summary.md',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'out-w5-n05-c-restart-recovery',
      artifact: 'W5-N05-c — Platform integration restart recovery',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'planned' as const,
      currentStatus: 'Deferred — hydrate post W5-N05-b',
      honestyRequirement: 'Recovery requires durable integration anchors first',
      futureW5N05Responsibility: 'W5-N05-c' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-planning-summary.md',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'out-w5-n05-d-operational-continuity',
      artifact: 'W5-N05-d — Platform integration operational continuity',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'planned' as const,
      currentStatus: 'Deferred — continuity projection post integration recovery',
      honestyRequirement: 'Continuity follows durable integration implementation',
      futureW5N05Responsibility: 'W5-N05-d' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-planning-summary.md',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'out-w5-n05-e-close-evidence',
      artifact: 'W5-N05-e — Security verification + package Close evidence',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'planned' as const,
      currentStatus: 'Deferred — Close evidence assembly post implementation slices',
      honestyRequirement: 'Close requires FIV + PO act; not authorized from slice a',
      futureW5N05Responsibility: 'W5-N05-e' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-planning-summary.md',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'out-notification-platform-complete',
      artifact: 'Notification Platform Complete declaration',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'future-roadmap' as const,
      currentStatus: 'Forbidden — requires N01…N05 Close + PO act + production transports',
      honestyRequirement: 'Inventory slice a must not claim platform Complete',
      futureW5N05Responsibility: 'out-of-scope-notification-platform-complete' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-product-scope.md',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'out-live-trading-wave6',
      artifact: 'Live Trading / live order submission (Wave 6)',
      kind: 'explicit-out' as const,
      owner: 'live-trading-deferred' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'future-roadmap' as const,
      currentStatus: 'Out of W5-N05 platform integration scope',
      honestyRequirement: 'Notifications ≠ live capital orders',
      futureW5N05Responsibility: 'out-of-scope-live-trading' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n05-product-scope.md',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'out-w5-n01-reopen',
      artifact: 'Reopen W5-N01 Telegram Notification foundation',
      kind: 'explicit-out' as const,
      owner: 'w5-n01-reference' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'future-roadmap' as const,
      currentStatus: 'Forbidden — W5-N01 Closed; consume patterns only',
      honestyRequirement: 'Telegram artifacts remain frozen',
      futureW5N05Responsibility: 'out-of-scope-w5-n01-reopen' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n01-product-owner-close-record.md',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'out-w5-n02-reopen',
      artifact: 'Reopen W5-N02 Email Notification foundation',
      kind: 'explicit-out' as const,
      owner: 'w5-n02-reference' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'future-roadmap' as const,
      currentStatus: 'Forbidden — W5-N02 Closed; consume patterns only',
      honestyRequirement: 'Email artifacts remain frozen',
      futureW5N05Responsibility: 'out-of-scope-w5-n02-reopen' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n02-product-owner-close-record.md',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'out-w5-n03-reopen',
      artifact: 'Reopen W5-N03 Slack/Discord/Teams Notification foundation',
      kind: 'explicit-out' as const,
      owner: 'w5-n03-reference' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'future-roadmap' as const,
      currentStatus: 'Forbidden — W5-N03 Closed; consume patterns only',
      honestyRequirement: 'Webhook artifacts remain frozen',
      futureW5N05Responsibility: 'out-of-scope-w5-n03-reopen' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n03-product-owner-close-record.md',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
    Object.freeze({
      artifactId: 'out-w5-n04-reopen',
      artifact: 'Reopen W5-N04 Push Notification foundation',
      kind: 'explicit-out' as const,
      owner: 'w5-n04-reference' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'future-roadmap' as const,
      currentStatus: 'Forbidden — W5-N04 Closed; consume patterns only',
      honestyRequirement: 'Push artifacts remain frozen',
      futureW5N05Responsibility: 'out-of-scope-w5-n04-reopen' as const,
      evidencePath: 'docs/project/version-3/wave-5/w5-n04-product-owner-close-record.md',
      existsToday: false,
      authorizesPlatformIntegrationFunctional: false,
      authorizesW5N05Complete: false,
    }),
  ]);

export const W5_N05_A_BINDING_FINDINGS = Object.freeze({
  platformIntegrationFunctionalAuthorized: false,
  platformIntegrationFunctionsAfterSliceA: false,
  customerVisibleFeatureFromSliceA: false,
  perChannelFoundationsExist: true,
  unifiedPlatformIntegrationLayerMissing: true,
  platformIntegrationAnchorsMissing: false,
  productionTransportsDeferred: true,
  ownershipBoundariesVerified: true,
  ownershipBoundariesChanged: false,
  architecturalDeviations: false,
} as const);

export const W5_N05_A_EXPLICIT_OUT = Object.freeze([
  'platform-integration-implementation',
  'production-transport-i/o',
  'notification-platform-complete',
  'live-trading-enablement',
  'w5-n05-b',
  'w5-n05-c',
  'w5-n05-d',
  'w5-n05-e',
  'w5-n05-complete',
  'wave-5-complete',
  'w5-n01-reopen',
  'w5-n02-reopen',
  'w5-n03-reopen',
  'w5-n04-reopen',
  'ai-gateway-scope',
  'master-plan-revision',
  'version-2-redesign',
  'ownership-change',
  'new-persistence-owner',
  'new-bounded-context',
  'exchange-adapter-modification',
] as const);

export const W5_N05_A_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  notificationControlPlane: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  wave3Modified: false,
  wave4Modified: false,
  exchangeAdapterUntouched: true,
  w5N05CompleteClaimed: false,
  platformIntegrationFunctionalClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  liveTradingClaimed: false,
  customerVisibleFeature: false,
  w5N01Reopened: false,
  w5N02Reopened: false,
  w5N03Reopened: false,
  w5N04Reopened: false,
} as const);

export const W5_N05_A_HONEST_PRODUCT_BASELINE = Object.freeze({
  implementedCapabilities: Object.freeze([
    'None — no customer-visible Notification Platform Integration functionality',
  ] as const),
  infrastructureCapabilities: Object.freeze([
    'Per-channel N01…N04 notification anchors on notification-delivery owner',
    'Per-channel operational continuity projections in Platform Readiness',
    'PC-06 resolve-delivery-routing — routing SoT consumed unchanged',
    'PC-07 notification-product — per-channel settings and history',
    'NOTIFICATION_CHANNEL_CATALOG — multi-channel with reserved-inactive honesty',
    'Notification Durable Queue — W3-O02 on notification-delivery owner',
    'DurableNotificationStore — history + queue snapshot',
    'W5-N01…N04-a machine inventories — foundation reference patterns',
    'Exchange Adapter / Wave 4 — reference only; untouched',
  ] as const),
  plannedCapabilities: Object.freeze([
    'W5-N05-b — Durable Notification Platform Integration Foundation',
  ] as const),
  notYetImplementedCapabilities: Object.freeze([
    'Unified cross-channel platform integration layer',
    'Platform integration restart recovery',
    'Platform integration operational continuity projection',
    'Cross-channel honest delivery rule unification',
    'Operator platform integration UI',
    'Production transport I/O (TD-049 / TD-050)',
    'Notification Platform Complete',
  ] as const),
  futureRoadmapCapabilities: Object.freeze([
    'W5-N05-c — Platform integration restart recovery',
    'W5-N05-d — Platform integration operational continuity',
    'W5-N05-e — Package Close Evidence',
    'Wave 6 — Live Trading (LT-02)',
    'Wave 7 — OpenRouter / AI Gateway (out of W5-N05 scope)',
  ] as const),
} as const);

export const W5_N05_A_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Notification Platform Integration Inventory Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N05-b — Durable Notification Platform Integration Foundation',
    'W5-N05-c — Notification Platform Restart Recovery Integration Foundation',
    'W5-N05-d — Notification Platform Operational Continuity Integration Foundation',
    'W5-N05-e — Package Close Evidence',
  ] as const),
} as const);

export function artifactIds(): readonly string[] {
  return W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY.map((row) => row.artifactId);
}

export function rowsByKind(kind: W5N05AArtifactKind): readonly W5N05AInventoryRow[] {
  return W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY.filter((row) => row.kind === kind);
}

export function rowsSurvive(): readonly W5N05AInventoryRow[] {
  return W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY.filter(
    (row) => row.durabilityClass === 'SURVIVE',
  );
}

export function rowsEphemeral(): readonly W5N05AInventoryRow[] {
  return W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY.filter(
    (row) => row.durabilityClass === 'EPHEMERAL',
  );
}

export function rowsNotificationPlatformIntegrationSurvive(): readonly W5N05AInventoryRow[] {
  return rowsSurvive().filter((row) =>
    (W5_N05_A_SUBSTRATE_OWNERS as readonly string[]).includes(row.owner),
  );
}

export function rowsNotificationPlatformIntegrationEphemeral(): readonly W5N05AInventoryRow[] {
  return rowsEphemeral().filter((row) =>
    (W5_N05_A_SUBSTRATE_OWNERS as readonly string[]).includes(row.owner),
  );
}

export function rowsHonestyBoundaries(): readonly W5N05AInventoryRow[] {
  return W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY.filter(
    (row) => row.kind === 'honesty-boundary',
  );
}

export function rowsExplicitOut(): readonly W5N05AInventoryRow[] {
  return W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY.filter(
    (row) => row.kind === 'explicit-out',
  );
}

export function rowsByCapabilityCategory(
  category: W5N05ACapabilityCategory,
): readonly W5N05AInventoryRow[] {
  return W5_N05_A_NOTIFICATION_PLATFORM_INTEGRATION_INVENTORY.filter(
    (row) => row.capabilityCategory === category,
  );
}
