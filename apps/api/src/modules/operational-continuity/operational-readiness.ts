/**
 * W3-O01-d — Operational readiness evaluation (pure).
 *
 * Platform readiness is derived only from owner readiness.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 */

import {
  W3_O01_C_RECOVERY_DEPENDENCIES,
  W3_O01_C_RECOVERY_ORDER,
  type W3O01CRecoveryOwner,
} from '../../persistence/analytical-restart-recovery';
import type { AnalyticalOwnerBootOutcome } from '../../persistence/analytical-owner-continuity-status';

export const OPERATIONAL_STATES = Object.freeze([
  'Recovering',
  'Ready',
  'Degraded',
  'Unavailable',
] as const);

export type OperationalState = (typeof OPERATIONAL_STATES)[number];

export function assertOperationalState(value: string): asserts value is OperationalState {
  if (!(OPERATIONAL_STATES as readonly string[]).includes(value)) {
    throw new Error(`Operational Continuity rejects unsupported state: ${value}`);
  }
}

export type OwnerOperationalView = Readonly<{
  owner: W3O01CRecoveryOwner;
  state: OperationalState;
  recoveryRequired: true;
  dependencyOwners: readonly W3O01CRecoveryOwner[];
  reason?: string;
}>;

/** W3-O04-d — Kill Switch continuity fields on platform readiness. */
export type KillSwitchContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  restoredCount: number;
  armedCount: number;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

/** W4-E01-d — Exchange Connectivity continuity fields on platform readiness. */
export type ExchangeConnectivityContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  restoredCount: number;
  connectionAnchorCount: number;
  adapterAnchorCount: number;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

/** W4-E02-d — Bybit Exchange Connectivity continuity fields on platform readiness. */
export type BybitExchangeConnectivityContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  restoredCount: number;
  connectionAnchorCount: number;
  adapterAnchorCount: number;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

/** W4-E03-d — OKX Exchange Connectivity continuity fields on platform readiness. */
export type OkxExchangeConnectivityContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  restoredCount: number;
  connectionAnchorCount: number;
  adapterAnchorCount: number;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

/** W4-E04-d — Kraken Exchange Connectivity continuity fields on platform readiness. */
export type KrakenExchangeConnectivityContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  restoredCount: number;
  connectionAnchorCount: number;
  adapterAnchorCount: number;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

/** W4-E05-d — Venue Permission Verification continuity fields on platform readiness. */
export type VenuePermissionContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  restoredCount: number;
  verifiedAnchorCount: number;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

/** W5-N01-d — Telegram Notification continuity fields on platform readiness. */
export type TelegramNotificationContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  restoredCount: number;
  canonicalAnchorCount: number;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

/** W5-N02-d — Email Notification continuity fields on platform readiness. */
export type EmailNotificationContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  restoredCount: number;
  canonicalAnchorCount: number;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

/** W5-N03-d — Slack / Discord / Teams Notification continuity fields on platform readiness. */
export type SlackDiscordTeamsNotificationContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  restoredCount: number;
  canonicalAnchorCount: number;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

/** W5-N04-d — Push Notification continuity fields on platform readiness. */
export type PushNotificationContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  restoredCount: number;
  canonicalAnchorCount: number;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

/** W5-N05-d — Notification Platform Integration continuity fields on platform readiness. */
export type NotificationPlatformIntegrationContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  restoredCount: number;
  canonicalAnchorCount: number;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

/** W5-N06-d — Notification Platform Delivery continuity fields on platform readiness. */
export type NotificationPlatformDeliveryContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  restoredCount: number;
  canonicalAnchorCount: number;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

/** W5-N07-d — Notification Platform Dispatch continuity fields on platform readiness. */
export type NotificationPlatformDispatchContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  restoredCount: number;
  canonicalAnchorCount: number;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

/** W3-O05-d — Monitoring & Security Health continuity fields on platform readiness. */
export type MonitoringHealthContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  restoredCount: number;
  securityHealthAnchorCount: number;
  connectionHealthAnchorCount: number;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

/** W3-O02-d — Notification Durable Queue continuity fields on platform readiness. */
export type NotificationQueueContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: AnalyticalOwnerBootOutcome;
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  openCount: number;
  abandonedCount: number;
  channelUnavailable: boolean;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

export type PlatformOperationalProjection = Readonly<{
  platformState: OperationalState;
  ownerStates: readonly OwnerOperationalView[];
  unavailableOwners: readonly W3O01CRecoveryOwner[];
  degradedOwners: readonly W3O01CRecoveryOwner[];
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  /** W3-O02-d — Notification Durable Queue operational continuity (derived). */
  notificationQueue: NotificationQueueContinuityView | null;
  /** W3-O04-d — Kill Switch operational continuity (derived). */
  killSwitch: KillSwitchContinuityView | null;
  /** W3-O05-d — Monitoring & Security Health operational continuity (derived). */
  monitoringHealth: MonitoringHealthContinuityView | null;
  /** W4-E01-d — Exchange Connectivity operational continuity (derived). */
  exchangeConnectivity: ExchangeConnectivityContinuityView | null;
  /** W4-E02-d — Bybit Exchange Connectivity operational continuity (derived). */
  bybitExchangeConnectivity: BybitExchangeConnectivityContinuityView | null;
  /** W4-E03-d — OKX Exchange Connectivity operational continuity (derived). */
  okxExchangeConnectivity: OkxExchangeConnectivityContinuityView | null;
  /** W4-E04-d — Kraken Exchange Connectivity operational continuity (derived). */
  krakenExchangeConnectivity: KrakenExchangeConnectivityContinuityView | null;
  /** W4-E05-d — Venue Permission Verification operational continuity (derived). */
  venuePermissionVerification: VenuePermissionContinuityView | null;
  /** W5-N01-d — Telegram Notification operational continuity (derived). */
  telegramNotification: TelegramNotificationContinuityView | null;
  /** W5-N02-d — Email Notification operational continuity (derived). */
  emailNotification: EmailNotificationContinuityView | null;
  /** W5-N03-d — Slack / Discord / Teams Notification operational continuity (derived). */
  slackDiscordTeamsNotification: SlackDiscordTeamsNotificationContinuityView | null;
  /** W5-N04-d — Push Notification operational continuity (derived). */
  pushNotification: PushNotificationContinuityView | null;
  /** W5-N05-d — Notification Platform Integration operational continuity (derived). */
  notificationPlatformIntegration: NotificationPlatformIntegrationContinuityView | null;
  /** W5-N06-d — Notification Platform Delivery operational continuity (derived). */
  notificationPlatformDelivery: NotificationPlatformDeliveryContinuityView | null;
  /** W5-N07-d — Notification Platform Dispatch operational continuity (derived). */
  notificationPlatformDispatch: NotificationPlatformDispatchContinuityView | null;
}>;

export type EvaluateOwnerReadinessInput = Readonly<{
  /** Raw boot outcomes from hydrate / memory driver. Missing → treated as Ready after recovery window. */
  bootByOwner: ReadonlyMap<W3O01CRecoveryOwner, AnalyticalOwnerBootOutcome>;
  bootReasons?: ReadonlyMap<W3O01CRecoveryOwner, string | undefined>;
  /** When true, every owner is still Recovering (recovery not finalized). */
  recovering: boolean;
}>;

/**
 * Evaluate each durable analytical owner, then apply dependency degradation.
 * Unavailable owners never become Ready via dependency rules.
 * Dependency Unavailable → dependent Degraded (if own boot was Ready).
 */
export function evaluateOwnerOperationalStates(
  input: EvaluateOwnerReadinessInput,
): readonly OwnerOperationalView[] {
  if (input.recovering) {
    return Object.freeze(
      W3_O01_C_RECOVERY_ORDER.map((owner) =>
        Object.freeze({
          owner,
          state: 'Recovering' as const,
          recoveryRequired: true as const,
          dependencyOwners: W3_O01_C_RECOVERY_DEPENDENCIES[owner],
          reason: input.bootReasons?.get(owner),
        }),
      ),
    );
  }

  const base = new Map<W3O01CRecoveryOwner, OperationalState>();
  for (const owner of W3_O01_C_RECOVERY_ORDER) {
    const boot = input.bootByOwner.get(owner) ?? 'ready';
    base.set(owner, boot === 'unavailable' ? 'Unavailable' : 'Ready');
  }

  const views: OwnerOperationalView[] = [];
  for (const owner of W3_O01_C_RECOVERY_ORDER) {
    let state = base.get(owner)!;
    const deps = W3_O01_C_RECOVERY_DEPENDENCIES[owner];
    if (state === 'Ready') {
      const depUnavailable = deps.some((dep) => base.get(dep) === 'Unavailable');
      if (depUnavailable) {
        state = 'Degraded';
      }
    }
    assertOperationalState(state);
    views.push(
      Object.freeze({
        owner,
        state,
        recoveryRequired: true,
        dependencyOwners: deps,
        reason: input.bootReasons?.get(owner),
      }),
    );
  }
  return Object.freeze(views);
}

/** Derive platform state solely from owner states. No hardcoded global. */
export function derivePlatformOperationalState(
  owners: readonly OwnerOperationalView[],
): OperationalState {
  if (owners.length === 0) {
    return 'Ready';
  }
  if (owners.some((o) => o.state === 'Recovering')) {
    return 'Recovering';
  }
  const allUnavailable = owners.every((o) => o.state === 'Unavailable');
  if (allUnavailable) {
    return 'Unavailable';
  }
  if (owners.some((o) => o.state === 'Unavailable' || o.state === 'Degraded')) {
    return 'Degraded';
  }
  return 'Ready';
}

export function buildPlatformOperationalProjection(input: {
  owners: readonly OwnerOperationalView[];
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  notificationQueue?: NotificationQueueContinuityView | null;
  killSwitch?: KillSwitchContinuityView | null;
  monitoringHealth?: MonitoringHealthContinuityView | null;
  exchangeConnectivity?: ExchangeConnectivityContinuityView | null;
  bybitExchangeConnectivity?: BybitExchangeConnectivityContinuityView | null;
  okxExchangeConnectivity?: OkxExchangeConnectivityContinuityView | null;
  krakenExchangeConnectivity?: KrakenExchangeConnectivityContinuityView | null;
  venuePermissionVerification?: VenuePermissionContinuityView | null;
  telegramNotification?: TelegramNotificationContinuityView | null;
  emailNotification?: EmailNotificationContinuityView | null;
  slackDiscordTeamsNotification?: SlackDiscordTeamsNotificationContinuityView | null;
  pushNotification?: PushNotificationContinuityView | null;
  notificationPlatformIntegration?: NotificationPlatformIntegrationContinuityView | null;
  notificationPlatformDelivery?: NotificationPlatformDeliveryContinuityView | null;
  notificationPlatformDispatch?: NotificationPlatformDispatchContinuityView | null;
}): PlatformOperationalProjection {
  const platformState = derivePlatformOperationalState(input.owners);
  assertOperationalState(platformState);
  return Object.freeze({
    platformState,
    ownerStates: input.owners,
    unavailableOwners: Object.freeze(
      input.owners.filter((o) => o.state === 'Unavailable').map((o) => o.owner),
    ),
    degradedOwners: Object.freeze(
      input.owners.filter((o) => o.state === 'Degraded').map((o) => o.owner),
    ),
    recoveryTimestamp: input.recoveryTimestamp,
    recoveryDurationMs: input.recoveryDurationMs,
    notificationQueue: input.notificationQueue ?? null,
    killSwitch: input.killSwitch ?? null,
    monitoringHealth: input.monitoringHealth ?? null,
    exchangeConnectivity: input.exchangeConnectivity ?? null,
    bybitExchangeConnectivity: input.bybitExchangeConnectivity ?? null,
    okxExchangeConnectivity: input.okxExchangeConnectivity ?? null,
    krakenExchangeConnectivity: input.krakenExchangeConnectivity ?? null,
    venuePermissionVerification: input.venuePermissionVerification ?? null,
    telegramNotification: input.telegramNotification ?? null,
    emailNotification: input.emailNotification ?? null,
    slackDiscordTeamsNotification: input.slackDiscordTeamsNotification ?? null,
    pushNotification: input.pushNotification ?? null,
    notificationPlatformIntegration: input.notificationPlatformIntegration ?? null,
    notificationPlatformDelivery: input.notificationPlatformDelivery ?? null,
    notificationPlatformDispatch: input.notificationPlatformDispatch ?? null,
  });
}

/**
 * Graceful degradation check: independent Ready owners remain Ready when another is Unavailable.
 */
export function healthyOwnersContinueWhileOthersUnavailable(
  owners: readonly OwnerOperationalView[],
): boolean {
  const unavailable = owners.filter((o) => o.state === 'Unavailable');
  if (unavailable.length === 0) return true;
  const independentReady = owners.filter(
    (o) =>
      o.state === 'Ready' &&
      !o.dependencyOwners.some((dep) => unavailable.some((u) => u.owner === dep)),
  );
  return independentReady.length > 0 || owners.every((o) => o.state === 'Unavailable');
}
