/**
 * W3-O01-d / W3-O02-d / W3-O04-d / W3-O05-d / W4-E01-d — Operational Continuity service.
 *
 * Extends recovered analytical owners with readiness / graceful degradation projection.
 * W3-O02-d adds Notification Durable Queue operational continuity (derived).
 * W3-O04-d adds Kill Switch operational continuity (derived).
 * W3-O05-d adds Monitoring & Security Health operational continuity (derived).
 * W4-E01-d adds Exchange Connectivity operational continuity (derived).
 * W4-E02-d adds Bybit Exchange Connectivity operational continuity (derived).
 * W4-E03-d adds OKX Exchange Connectivity operational continuity (derived).
 * W4-E04-d adds Kraken Exchange Connectivity operational continuity (derived).
 * W4-E05-d adds Venue Permission Verification operational continuity (derived).
 * W5-N01-d adds Telegram Notification operational continuity (derived).
 * W5-N02-d adds Email Notification operational continuity (derived).
 * W5-N03-d adds Slack / Discord / Teams Notification operational continuity (derived).
 * W5-N04-d adds Push Notification operational continuity (derived).
 * W5-N05-d adds Notification Platform Integration operational continuity (derived).
 * W5-N08-d adds Notification Platform Queue operational continuity (derived).
 * Recovery itself remains W3-O01-c / W3-O02-c / W3-O04-c / W3-O05-c only. No new persistence / BC / HA / monitoring evaluation.
 */

import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import {
  getAnalyticalOwnerBootOutcome,
  listAnalyticalOwnerBootOutcomes,
  recordAnalyticalOwnerBootOutcome,
  resetAnalyticalOwnerBootOutcomes,
  type AnalyticalOwnerBootOutcome,
} from '../../persistence/analytical-owner-continuity-status';
import {
  W3_O01_C_RECOVERY_ORDER,
  type W3O01CRecoveryOwner,
} from '../../persistence/analytical-restart-recovery';
import { getNotificationQueueContinuityRecord } from '../notification-delivery/domain/notification-queue-continuity-status';
import { buildNotificationQueueContinuityProjection } from '../notification-delivery/domain/notification-queue-operational-continuity';
import { getTelegramNotificationContinuityRecord } from '../notification-delivery/domain/telegram-notification-continuity-status';
import { buildTelegramNotificationContinuityProjection } from '../notification-delivery/domain/telegram-notification-operational-continuity';
import { getEmailNotificationContinuityRecord } from '../notification-delivery/domain/email-notification-continuity-status';
import { buildEmailNotificationContinuityProjection } from '../notification-delivery/domain/email-notification-operational-continuity';
import { getSlackDiscordTeamsNotificationContinuityRecord } from '../notification-delivery/domain/slack-discord-teams-notification-continuity-status';
import { buildSlackDiscordTeamsNotificationContinuityProjection } from '../notification-delivery/domain/slack-discord-teams-notification-operational-continuity';
import { getPushNotificationContinuityRecord } from '../notification-delivery/domain/push-notification-continuity-status';
import { buildPushNotificationContinuityProjection } from '../notification-delivery/domain/push-notification-operational-continuity';
import { getNotificationPlatformIntegrationContinuityRecord } from '../notification-delivery/domain/notification-platform-integration-continuity-status';
import { buildNotificationPlatformIntegrationContinuityProjection } from '../notification-delivery/domain/notification-platform-integration-operational-continuity';
import { getNotificationPlatformDeliveryContinuityRecord } from '../notification-delivery/domain/notification-platform-delivery-continuity-status';
import { buildNotificationPlatformDeliveryContinuityProjection } from '../notification-delivery/domain/notification-platform-delivery-operational-continuity';
import { getNotificationPlatformDispatchContinuityRecord } from '../notification-delivery/domain/notification-platform-dispatch-continuity-status';
import { buildNotificationPlatformDispatchContinuityProjection } from '../notification-delivery/domain/notification-platform-dispatch-operational-continuity';
import { getNotificationPlatformQueueContinuityRecord } from '../notification-delivery/domain/notification-platform-queue-continuity-status';
import { buildNotificationPlatformQueueContinuityProjection } from '../notification-delivery/domain/notification-platform-queue-operational-continuity';
import { getKillSwitchContinuityRecord } from '../trading-session/domain/kill-switch-continuity-status';
import { buildKillSwitchContinuityProjection } from '../trading-session/domain/kill-switch-operational-continuity';
import { getMonitoringHealthContinuityRecord } from '../../security-platform/monitoring-health/domain/monitoring-health-continuity-status';
import { buildMonitoringHealthContinuityProjection } from '../../security-platform/monitoring-health/domain/monitoring-health-operational-continuity';
import { getExchangeConnectivityContinuityRecord } from '../exchange-adapter/domain/exchange-connectivity-continuity-status';
import { buildExchangeConnectivityContinuityProjection } from '../exchange-adapter/domain/exchange-connectivity-operational-continuity';
import { getBybitExchangeConnectivityContinuityRecord } from '../exchange-adapter/domain/bybit-exchange-connectivity-continuity-status';
import { buildBybitExchangeConnectivityContinuityProjection } from '../exchange-adapter/domain/bybit-exchange-connectivity-operational-continuity';
import { getOkxExchangeConnectivityContinuityRecord } from '../exchange-adapter/domain/okx-exchange-connectivity-continuity-status';
import { buildOkxExchangeConnectivityContinuityProjection } from '../exchange-adapter/domain/okx-exchange-connectivity-operational-continuity';
import { getKrakenExchangeConnectivityContinuityRecord } from '../exchange-adapter/domain/kraken-exchange-connectivity-continuity-status';
import { buildKrakenExchangeConnectivityContinuityProjection } from '../exchange-adapter/domain/kraken-exchange-connectivity-operational-continuity';
import { getVenuePermissionContinuityRecord } from '../exchange-adapter/domain/venue-permission-continuity-status';
import { buildVenuePermissionContinuityProjection } from '../exchange-adapter/domain/venue-permission-operational-continuity';
import { OperationalContinuityAudit } from './operational-continuity-audit';
import {
  buildPlatformOperationalProjection,
  evaluateOwnerOperationalStates,
  type PlatformOperationalProjection,
} from './operational-readiness';

@Injectable()
export class OperationalContinuityService implements OnApplicationBootstrap {
  private projection: PlatformOperationalProjection;
  private recoveryStartedAt: number | null = null;
  private finalized = false;

  constructor(private readonly audit: OperationalContinuityAudit) {
    this.recoveryStartedAt = Date.now();
    this.projection = buildPlatformOperationalProjection({
      owners: evaluateOwnerOperationalStates({
        bootByOwner: new Map(),
        recovering: true,
      }),
      recoveryTimestamp: null,
      recoveryDurationMs: null,
      notificationQueue: buildNotificationQueueContinuityProjection({
        recovering: true,
        ownerBoot: 'ready',
        continuity: null,
      }),
      killSwitch: buildKillSwitchContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
      monitoringHealth: buildMonitoringHealthContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
      exchangeConnectivity: buildExchangeConnectivityContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
      bybitExchangeConnectivity: buildBybitExchangeConnectivityContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
      okxExchangeConnectivity: buildOkxExchangeConnectivityContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
      krakenExchangeConnectivity: buildKrakenExchangeConnectivityContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
      venuePermissionVerification: buildVenuePermissionContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
      telegramNotification: buildTelegramNotificationContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
      emailNotification: buildEmailNotificationContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
      slackDiscordTeamsNotification: buildSlackDiscordTeamsNotificationContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
      pushNotification: buildPushNotificationContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
      notificationPlatformIntegration: buildNotificationPlatformIntegrationContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
      notificationPlatformDelivery: buildNotificationPlatformDeliveryContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
      notificationPlatformDispatch: buildNotificationPlatformDispatchContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
      notificationPlatformQueue: buildNotificationPlatformQueueContinuityProjection({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    });
  }

  /**
   * Runs after Nest modules finish constructing (including W3-O01-c / W3-O02-c hydrates).
   * Continuity begins only after successful recovery path completion.
   */
  async onApplicationBootstrap(): Promise<void> {
    if (!this.finalized) {
      await this.finalizeFromBootRegistry();
    }
  }

  /** Read-only platform readiness projection (includes Notification Queue continuity). */
  getProjection(): PlatformOperationalProjection {
    return this.projection;
  }

  /**
   * Test / controlled evaluation: set boot outcomes then finalize.
   * Production path uses Nest OnModuleInit after hydrates.
   */
  async applyBootOutcomesForTest(
    outcomes: ReadonlyArray<{
      owner: W3O01CRecoveryOwner;
      outcome: AnalyticalOwnerBootOutcome;
      reason?: string;
    }>,
  ): Promise<PlatformOperationalProjection> {
    resetAnalyticalOwnerBootOutcomes();
    for (const row of outcomes) {
      recordAnalyticalOwnerBootOutcome(row.owner, row.outcome, row.reason);
    }
    return this.finalizeFromBootRegistry();
  }

  private buildKillSwitchView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getKillSwitchContinuityRecord();
    return buildKillSwitchContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildMonitoringHealthView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getMonitoringHealthContinuityRecord();
    return buildMonitoringHealthContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildExchangeConnectivityView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getExchangeConnectivityContinuityRecord();
    return buildExchangeConnectivityContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildBybitExchangeConnectivityView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getBybitExchangeConnectivityContinuityRecord();
    return buildBybitExchangeConnectivityContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildOkxExchangeConnectivityView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getOkxExchangeConnectivityContinuityRecord();
    return buildOkxExchangeConnectivityContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildKrakenExchangeConnectivityView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getKrakenExchangeConnectivityContinuityRecord();
    return buildKrakenExchangeConnectivityContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildVenuePermissionView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getVenuePermissionContinuityRecord();
    return buildVenuePermissionContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildTelegramNotificationView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getTelegramNotificationContinuityRecord();
    return buildTelegramNotificationContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildEmailNotificationView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getEmailNotificationContinuityRecord();
    return buildEmailNotificationContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildSlackDiscordTeamsNotificationView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getSlackDiscordTeamsNotificationContinuityRecord();
    return buildSlackDiscordTeamsNotificationContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildPushNotificationView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getPushNotificationContinuityRecord();
    return buildPushNotificationContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildNotificationPlatformIntegrationView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getNotificationPlatformIntegrationContinuityRecord();
    return buildNotificationPlatformIntegrationContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildNotificationPlatformDeliveryView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getNotificationPlatformDeliveryContinuityRecord();
    return buildNotificationPlatformDeliveryContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildNotificationPlatformDispatchView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getNotificationPlatformDispatchContinuityRecord();
    return buildNotificationPlatformDispatchContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildNotificationPlatformQueueView(input: {
    recovering: boolean;
    ownerReadiness: 'ready' | 'unavailable' | 'degraded';
  }) {
    const continuity = getNotificationPlatformQueueContinuityRecord();
    return buildNotificationPlatformQueueContinuityProjection({
      recovering: input.recovering,
      ownerReadiness: continuity?.ownerReadiness ?? input.ownerReadiness,
      continuity,
    });
  }

  private buildNotificationQueueView(input: {
    recovering: boolean;
    ownerBoot: AnalyticalOwnerBootOutcome;
  }) {
    return buildNotificationQueueContinuityProjection({
      recovering: input.recovering,
      ownerBoot: input.ownerBoot,
      continuity: getNotificationQueueContinuityRecord(),
    });
  }

  private async finalizeFromBootRegistry(): Promise<PlatformOperationalProjection> {
    this.recoveryStartedAt = this.recoveryStartedAt ?? Date.now();
    this.finalized = false;

    const bootByOwner = new Map<W3O01CRecoveryOwner, AnalyticalOwnerBootOutcome>();
    const bootReasons = new Map<W3O01CRecoveryOwner, string | undefined>();

    for (const owner of W3_O01_C_RECOVERY_ORDER) {
      const recorded = getAnalyticalOwnerBootOutcome(owner);
      if (recorded) {
        bootByOwner.set(owner, recorded.outcome);
        bootReasons.set(owner, recorded.reason);
      } else {
        bootByOwner.set(owner, 'ready');
      }
    }

    const notificationOwnerBoot = bootByOwner.get('notification-delivery') ?? 'ready';

    this.projection = buildPlatformOperationalProjection({
      owners: evaluateOwnerOperationalStates({
        bootByOwner,
        bootReasons,
        recovering: true,
      }),
      recoveryTimestamp: null,
      recoveryDurationMs: null,
      notificationQueue: this.buildNotificationQueueView({
        recovering: true,
        ownerBoot: notificationOwnerBoot,
      }),
      killSwitch: this.buildKillSwitchView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
      monitoringHealth: this.buildMonitoringHealthView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
      exchangeConnectivity: this.buildExchangeConnectivityView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
      bybitExchangeConnectivity: this.buildBybitExchangeConnectivityView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
      okxExchangeConnectivity: this.buildOkxExchangeConnectivityView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
      krakenExchangeConnectivity: this.buildKrakenExchangeConnectivityView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
      venuePermissionVerification: this.buildVenuePermissionView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
      telegramNotification: this.buildTelegramNotificationView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
      emailNotification: this.buildEmailNotificationView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
      slackDiscordTeamsNotification: this.buildSlackDiscordTeamsNotificationView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
      pushNotification: this.buildPushNotificationView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
      notificationPlatformIntegration: this.buildNotificationPlatformIntegrationView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
      notificationPlatformDelivery: this.buildNotificationPlatformDeliveryView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
      notificationPlatformDispatch: this.buildNotificationPlatformDispatchView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
      notificationPlatformQueue: this.buildNotificationPlatformQueueView({
        recovering: true,
        ownerReadiness: 'ready',
      }),
    });

    const owners = evaluateOwnerOperationalStates({
      bootByOwner,
      bootReasons,
      recovering: false,
    });
    const recoveryTimestamp = new Date().toISOString();
    const recoveryDurationMs = Math.max(0, Date.now() - (this.recoveryStartedAt ?? Date.now()));
    const notificationQueueBase = this.buildNotificationQueueView({
      recovering: false,
      ownerBoot: notificationOwnerBoot,
    });
    const notificationQueue = Object.freeze({
      ...notificationQueueBase,
      recoveryTimestamp:
        notificationQueueBase.recoveryTimestamp ??
        (notificationQueueBase.operationalState === 'Recovering' ? null : recoveryTimestamp),
      recoveryDurationMs:
        notificationQueueBase.recoveryDurationMs ??
        (notificationQueueBase.operationalState === 'Recovering' ? null : recoveryDurationMs),
    });
    const killSwitchBase = this.buildKillSwitchView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const killSwitch = Object.freeze({
      ...killSwitchBase,
      recoveryTimestamp:
        killSwitchBase.recoveryTimestamp ??
        (killSwitchBase.operationalState === 'Recovering' ? null : recoveryTimestamp),
      recoveryDurationMs:
        killSwitchBase.recoveryDurationMs ??
        (killSwitchBase.operationalState === 'Recovering' ? null : recoveryDurationMs),
    });
    const monitoringHealthBase = this.buildMonitoringHealthView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const monitoringHealth = Object.freeze({
      ...monitoringHealthBase,
      recoveryTimestamp:
        monitoringHealthBase.recoveryTimestamp ??
        (monitoringHealthBase.operationalState === 'Recovering' ? null : recoveryTimestamp),
      recoveryDurationMs:
        monitoringHealthBase.recoveryDurationMs ??
        (monitoringHealthBase.operationalState === 'Recovering' ? null : recoveryDurationMs),
    });
    const exchangeConnectivityBase = this.buildExchangeConnectivityView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const exchangeConnectivity = Object.freeze({
      ...exchangeConnectivityBase,
      recoveryTimestamp:
        exchangeConnectivityBase.recoveryTimestamp ??
        (exchangeConnectivityBase.operationalState === 'Recovering' ? null : recoveryTimestamp),
      recoveryDurationMs:
        exchangeConnectivityBase.recoveryDurationMs ??
        (exchangeConnectivityBase.operationalState === 'Recovering' ? null : recoveryDurationMs),
    });
    const bybitExchangeConnectivityBase = this.buildBybitExchangeConnectivityView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const bybitExchangeConnectivity = Object.freeze({
      ...bybitExchangeConnectivityBase,
      recoveryTimestamp:
        bybitExchangeConnectivityBase.recoveryTimestamp ??
        (bybitExchangeConnectivityBase.operationalState === 'Recovering'
          ? null
          : recoveryTimestamp),
      recoveryDurationMs:
        bybitExchangeConnectivityBase.recoveryDurationMs ??
        (bybitExchangeConnectivityBase.operationalState === 'Recovering'
          ? null
          : recoveryDurationMs),
    });
    const okxExchangeConnectivityBase = this.buildOkxExchangeConnectivityView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const okxExchangeConnectivity = Object.freeze({
      ...okxExchangeConnectivityBase,
      recoveryTimestamp:
        okxExchangeConnectivityBase.recoveryTimestamp ??
        (okxExchangeConnectivityBase.operationalState === 'Recovering' ? null : recoveryTimestamp),
      recoveryDurationMs:
        okxExchangeConnectivityBase.recoveryDurationMs ??
        (okxExchangeConnectivityBase.operationalState === 'Recovering' ? null : recoveryDurationMs),
    });
    const krakenExchangeConnectivityBase = this.buildKrakenExchangeConnectivityView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const krakenExchangeConnectivity = Object.freeze({
      ...krakenExchangeConnectivityBase,
      recoveryTimestamp:
        krakenExchangeConnectivityBase.recoveryTimestamp ??
        (krakenExchangeConnectivityBase.operationalState === 'Recovering'
          ? null
          : recoveryTimestamp),
      recoveryDurationMs:
        krakenExchangeConnectivityBase.recoveryDurationMs ??
        (krakenExchangeConnectivityBase.operationalState === 'Recovering'
          ? null
          : recoveryDurationMs),
    });
    const venuePermissionVerificationBase = this.buildVenuePermissionView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const venuePermissionVerification = Object.freeze({
      ...venuePermissionVerificationBase,
      recoveryTimestamp:
        venuePermissionVerificationBase.recoveryTimestamp ??
        (venuePermissionVerificationBase.operationalState === 'Recovering'
          ? null
          : recoveryTimestamp),
      recoveryDurationMs:
        venuePermissionVerificationBase.recoveryDurationMs ??
        (venuePermissionVerificationBase.operationalState === 'Recovering'
          ? null
          : recoveryDurationMs),
    });
    const telegramNotificationBase = this.buildTelegramNotificationView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const telegramNotification = Object.freeze({
      ...telegramNotificationBase,
      recoveryTimestamp:
        telegramNotificationBase.recoveryTimestamp ??
        (telegramNotificationBase.operationalState === 'Recovering' ? null : recoveryTimestamp),
      recoveryDurationMs:
        telegramNotificationBase.recoveryDurationMs ??
        (telegramNotificationBase.operationalState === 'Recovering' ? null : recoveryDurationMs),
    });
    const emailNotificationBase = this.buildEmailNotificationView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const emailNotification = Object.freeze({
      ...emailNotificationBase,
      recoveryTimestamp:
        emailNotificationBase.recoveryTimestamp ??
        (emailNotificationBase.operationalState === 'Recovering' ? null : recoveryTimestamp),
      recoveryDurationMs:
        emailNotificationBase.recoveryDurationMs ??
        (emailNotificationBase.operationalState === 'Recovering' ? null : recoveryDurationMs),
    });
    const slackDiscordTeamsNotificationBase = this.buildSlackDiscordTeamsNotificationView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const slackDiscordTeamsNotification = Object.freeze({
      ...slackDiscordTeamsNotificationBase,
      recoveryTimestamp:
        slackDiscordTeamsNotificationBase.recoveryTimestamp ??
        (slackDiscordTeamsNotificationBase.operationalState === 'Recovering'
          ? null
          : recoveryTimestamp),
      recoveryDurationMs:
        slackDiscordTeamsNotificationBase.recoveryDurationMs ??
        (slackDiscordTeamsNotificationBase.operationalState === 'Recovering'
          ? null
          : recoveryDurationMs),
    });
    const pushNotificationBase = this.buildPushNotificationView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const pushNotification = Object.freeze({
      ...pushNotificationBase,
      recoveryTimestamp:
        pushNotificationBase.recoveryTimestamp ??
        (pushNotificationBase.operationalState === 'Recovering' ? null : recoveryTimestamp),
      recoveryDurationMs:
        pushNotificationBase.recoveryDurationMs ??
        (pushNotificationBase.operationalState === 'Recovering' ? null : recoveryDurationMs),
    });
    const notificationPlatformIntegrationBase = this.buildNotificationPlatformIntegrationView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const notificationPlatformIntegration = Object.freeze({
      ...notificationPlatformIntegrationBase,
      recoveryTimestamp:
        notificationPlatformIntegrationBase.recoveryTimestamp ??
        (notificationPlatformIntegrationBase.operationalState === 'Recovering'
          ? null
          : recoveryTimestamp),
      recoveryDurationMs:
        notificationPlatformIntegrationBase.recoveryDurationMs ??
        (notificationPlatformIntegrationBase.operationalState === 'Recovering'
          ? null
          : recoveryDurationMs),
    });
    const notificationPlatformDeliveryBase = this.buildNotificationPlatformDeliveryView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const notificationPlatformDelivery = Object.freeze({
      ...notificationPlatformDeliveryBase,
      recoveryTimestamp:
        notificationPlatformDeliveryBase.recoveryTimestamp ??
        (notificationPlatformDeliveryBase.operationalState === 'Recovering'
          ? null
          : recoveryTimestamp),
      recoveryDurationMs:
        notificationPlatformDeliveryBase.recoveryDurationMs ??
        (notificationPlatformDeliveryBase.operationalState === 'Recovering'
          ? null
          : recoveryDurationMs),
    });
    const notificationPlatformDispatchBase = this.buildNotificationPlatformDispatchView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const notificationPlatformDispatch = Object.freeze({
      ...notificationPlatformDispatchBase,
      recoveryTimestamp:
        notificationPlatformDispatchBase.recoveryTimestamp ??
        (notificationPlatformDispatchBase.operationalState === 'Recovering'
          ? null
          : recoveryTimestamp),
      recoveryDurationMs:
        notificationPlatformDispatchBase.recoveryDurationMs ??
        (notificationPlatformDispatchBase.operationalState === 'Recovering'
          ? null
          : recoveryDurationMs),
    });
    const notificationPlatformQueueBase = this.buildNotificationPlatformQueueView({
      recovering: false,
      ownerReadiness: 'ready',
    });
    const notificationPlatformQueue = Object.freeze({
      ...notificationPlatformQueueBase,
      recoveryTimestamp:
        notificationPlatformQueueBase.recoveryTimestamp ??
        (notificationPlatformQueueBase.operationalState === 'Recovering'
          ? null
          : recoveryTimestamp),
      recoveryDurationMs:
        notificationPlatformQueueBase.recoveryDurationMs ??
        (notificationPlatformQueueBase.operationalState === 'Recovering'
          ? null
          : recoveryDurationMs),
    });
    this.projection = buildPlatformOperationalProjection({
      owners,
      recoveryTimestamp,
      recoveryDurationMs,
      notificationQueue,
      killSwitch,
      monitoringHealth,
      exchangeConnectivity,
      bybitExchangeConnectivity,
      okxExchangeConnectivity,
      krakenExchangeConnectivity,
      venuePermissionVerification,
      telegramNotification,
      emailNotification,
      slackDiscordTeamsNotification,
      pushNotification,
      notificationPlatformIntegration,
      notificationPlatformDelivery,
      notificationPlatformDispatch,
      notificationPlatformQueue,
    });
    this.finalized = true;

    for (const owner of owners) {
      if (owner.state === 'Ready' || owner.state === 'Degraded' || owner.state === 'Unavailable') {
        await this.audit.recordOwnerState({
          owner: owner.owner,
          state: owner.state,
          reason: owner.reason,
        });
      }
    }
    await this.audit.recordRecoveryCompleted({
      platformState: this.projection.platformState,
      recoveryDurationMs,
      unavailableOwners: this.projection.unavailableOwners,
      degradedOwners: this.projection.degradedOwners,
    });

    return this.projection;
  }

  /** Diagnostics for tests. */
  isFinalized(): boolean {
    return this.finalized;
  }

  /** Diagnostics for tests. */
  bootRegistrySnapshot() {
    return listAnalyticalOwnerBootOutcomes();
  }
}
