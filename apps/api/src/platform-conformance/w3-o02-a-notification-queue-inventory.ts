/**
 * W3-O02-a — Notification Queue Inventory & Honesty Baseline.
 *
 * Discovery and honesty preparation only.
 * Not a queue persistence product. Not restart recovery. Not a second Outbox.
 * Existing notification-delivery owner remains the sole delivery-domain owner.
 *
 * Residual vocabulary TD-045 / NT-02 is debt / capability label only —
 * distinct from paper Outbox (TD-035), Notification History (W3-O01),
 * and Wave 5 production transports.
 */

import { DELIVERY_OUTCOMES } from '../modules/notification-delivery/domain/delivery';
import {
  ACTIVE_NOTIFICATION_CHANNELS,
  RESERVED_NOTIFICATION_CHANNELS,
} from '../modules/notification-delivery/domain/notification-channel';
import { NOTIFICATION_PORTS_ACTIVE } from '../modules/notification-delivery/ports/notification.port';
import { OutboxStatus } from '../modules/event-processing/domain/outbox-status';

export const W3_O02_A_SLICE_ID = 'W3-O02-a' as const;

export const W3_O02_A_ALLOWED_OWNERS = Object.freeze([
  'notification-delivery',
  'notification-product',
  'telegram-product',
  'product-flow',
  'strategy-trading-pipeline',
  'event-processing',
  'command-center-ui',
] as const);

export type W3O02AOwner = (typeof W3_O02_A_ALLOWED_OWNERS)[number];

/** Only notification-delivery may own future durable queue work (W3-O02-b). */
export const W3_O02_A_QUEUE_OWNER = 'notification-delivery' as const;

export const W3_O02_A_SURFACE_KINDS = Object.freeze([
  'producing-path',
  'pending-state',
  'retryable-state',
  'completed-state',
  'abandoned-state',
  'failure-state',
  'operator-projection',
  'internal-queue-representation',
] as const);

export type W3O02ASurfaceKind = (typeof W3_O02_A_SURFACE_KINDS)[number];

export const W3_O02_A_DOMAIN_CLASSES = Object.freeze([
  'notification-queue-td045',
  'paper-outbox-td035',
  'notification-history-w3-o01',
  'wave-5-notification-providers',
  'ephemeral-operator-ux',
  'adjacent-config-not-queue',
] as const);

export type W3O02ADomainClass = (typeof W3_O02_A_DOMAIN_CLASSES)[number];

export const W3_O02_A_STORAGE_CLASSES = Object.freeze([
  'none-synchronous-stack',
  'process-local-in-memory',
  'durable-owner-snapshot-history',
  'durable-paper-outbox',
  'react-session-state',
  'absent-not-implemented',
] as const);

export type W3O02AStorageClass = (typeof W3_O02_A_STORAGE_CLASSES)[number];

export const W3_O02_A_EPHEMERAL_OR_DURABLE = Object.freeze(['EPHEMERAL', 'DURABLE'] as const);

export type W3O02AEphemeralOrDurable = (typeof W3_O02_A_EPHEMERAL_OR_DURABLE)[number];

export const W3_O02_A_FUTURE_RESPONSIBILITIES = Object.freeze([
  'W3-O02-b',
  'W3-O02-c',
  'W3-O02-d',
  'honesty-baseline',
  'out-of-scope-td035',
  'out-of-scope-w3-o01',
  'out-of-scope-wave-5',
  'out-of-scope-ux',
] as const);

export type W3O02AFutureResponsibility = (typeof W3_O02_A_FUTURE_RESPONSIBILITIES)[number];

export type W3O02AInventoryRow = Readonly<{
  surfaceId: string;
  surface: string;
  kind: W3O02ASurfaceKind;
  owner: W3O02AOwner;
  workspaceScope: 'workspace-bound' | 'workspace-bound-via-delivery' | 'n/a-not-notification-queue';
  currentStorage: W3O02AStorageClass;
  ephemeralOrDurable: W3O02AEphemeralOrDurable;
  restartImpact: string;
  honestyRequirement: string;
  domainClass: W3O02ADomainClass;
  futureW3O02Responsibility: W3O02AFutureResponsibility;
  evidencePath: string;
  existsToday: boolean;
  requiresDurableQueue: boolean;
}>;

/**
 * Frozen inventory of every notification-delivery surface that can create,
 * hold, retry, or complete in-flight notification work — plus honest
 * adjacent surfaces that must not be confused with TD-045.
 */
export const W3_O02_A_NOTIFICATION_QUEUE_INVENTORY: readonly W3O02AInventoryRow[] = Object.freeze([
  // ── Producing paths ──────────────────────────────────────────────────────
  Object.freeze({
    surfaceId: 'produce-notification-delivery-deliver',
    surface: 'NotificationDeliveryService.deliver()',
    kind: 'producing-path' as const,
    owner: 'notification-delivery' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'none-synchronous-stack' as const,
    ephemeralOrDurable: 'EPHEMERAL' as const,
    restartImpact:
      'Crash mid-deliver() loses unrecorded owed send; only completed DeliveryResult history may already be written',
    honestyRequirement:
      'Must not claim in-flight work survives restart until W3-O02-b/c; delivery is sync-terminal today',
    domainClass: 'notification-queue-td045' as const,
    futureW3O02Responsibility: 'W3-O02-b' as const,
    evidencePath: 'apps/api/src/modules/notification-delivery/notification-delivery.service.ts',
    existsToday: true,
    requiresDurableQueue: true,
  }),
  Object.freeze({
    surfaceId: 'produce-send-test-notification',
    surface: 'NotificationDeliveryService.sendTestNotification()',
    kind: 'producing-path' as const,
    owner: 'notification-delivery' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'none-synchronous-stack' as const,
    ephemeralOrDurable: 'EPHEMERAL' as const,
    restartImpact: 'Same as deliver(); test path is sync and records history only when complete',
    honestyRequirement: 'Test send is not Wave 5 Bot API; not a durable queue item today',
    domainClass: 'notification-queue-td045' as const,
    futureW3O02Responsibility: 'W3-O02-b' as const,
    evidencePath: 'apps/api/src/modules/notification-delivery/notification-delivery.service.ts',
    existsToday: true,
    requiresDurableQueue: true,
  }),
  Object.freeze({
    surfaceId: 'produce-report-notification-consumer',
    surface: 'ReportNotificationConsumerService (requestAndDeliver / deliverCompletedRun)',
    kind: 'producing-path' as const,
    owner: 'product-flow' as const,
    workspaceScope: 'workspace-bound-via-delivery' as const,
    currentStorage: 'none-synchronous-stack' as const,
    ephemeralOrDurable: 'EPHEMERAL' as const,
    restartImpact:
      'Best-effort sync call into notification-delivery; no held queue row if process dies before deliver() completes',
    honestyRequirement:
      'No scheduler/retries claimed; producer must not be treated as paper Outbox',
    domainClass: 'notification-queue-td045' as const,
    futureW3O02Responsibility: 'W3-O02-b' as const,
    evidencePath: 'apps/api/src/modules/product-flow/report-notification-consumer.service.ts',
    existsToday: true,
    requiresDurableQueue: true,
  }),
  Object.freeze({
    surfaceId: 'produce-channel-dispatch',
    surface: 'NotificationChannelDispatchService.dispatch / bindAndDispatch',
    kind: 'producing-path' as const,
    owner: 'product-flow' as const,
    workspaceScope: 'workspace-bound-via-delivery' as const,
    currentStorage: 'none-synchronous-stack' as const,
    ephemeralOrDurable: 'EPHEMERAL' as const,
    restartImpact: 'Sync deliver() only; comments forbid Bot API / scheduler / retries',
    honestyRequirement: 'In-process certified path until Wave 5; not TD-035',
    domainClass: 'notification-queue-td045' as const,
    futureW3O02Responsibility: 'W3-O02-b' as const,
    evidencePath: 'apps/api/src/modules/product-flow/notification-channel-dispatch.service.ts',
    existsToday: true,
    requiresDurableQueue: true,
  }),
  Object.freeze({
    surfaceId: 'produce-runtime-worker-report-deliver',
    surface: 'TradingSessionRuntimeWorker → requestAndDeliver',
    kind: 'producing-path' as const,
    owner: 'strategy-trading-pipeline' as const,
    workspaceScope: 'workspace-bound-via-delivery' as const,
    currentStorage: 'none-synchronous-stack' as const,
    ephemeralOrDurable: 'EPHEMERAL' as const,
    restartImpact: 'Best-effort catch/warn; owed alert can vanish without durable queue work',
    honestyRequirement: 'Runtime producer is not Live Trading enablement; queue gap is TD-045',
    domainClass: 'notification-queue-td045' as const,
    futureW3O02Responsibility: 'W3-O02-b' as const,
    evidencePath:
      'apps/api/src/modules/strategy-trading-pipeline/trading-session-runtime.worker.ts',
    existsToday: true,
    requiresDurableQueue: true,
  }),
  Object.freeze({
    surfaceId: 'produce-telegram-product-test',
    surface: 'TelegramProductService.sendTest → sendTestNotification',
    kind: 'producing-path' as const,
    owner: 'telegram-product' as const,
    workspaceScope: 'workspace-bound-via-delivery' as const,
    currentStorage: 'none-synchronous-stack' as const,
    ephemeralOrDurable: 'EPHEMERAL' as const,
    restartImpact: 'HTTP test path still sync-terminal via notification-delivery',
    honestyRequirement: 'Not production Telegram Bot API (TD-049 / Wave 5)',
    domainClass: 'notification-queue-td045' as const,
    futureW3O02Responsibility: 'W3-O02-b' as const,
    evidencePath: 'apps/api/src/modules/telegram-product',
    existsToday: true,
    requiresDurableQueue: true,
  }),

  // ── Pending / retryable / abandoned (queue) — ABSENT today ───────────────
  Object.freeze({
    surfaceId: 'pending-notification-delivery-work',
    surface: 'Pending / in-flight notification delivery work item',
    kind: 'pending-state' as const,
    owner: 'notification-delivery' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'absent-not-implemented' as const,
    ephemeralOrDurable: 'EPHEMERAL' as const,
    restartImpact: 'No durable pending row exists; restart cannot resume owed delivery work',
    honestyRequirement:
      'Must not claim pending queue exists; TelegramConnection pending is connect-only, not delivery queue',
    domainClass: 'notification-queue-td045' as const,
    futureW3O02Responsibility: 'W3-O02-b' as const,
    evidencePath: 'apps/api/src/modules/notification-delivery/domain/delivery.ts',
    existsToday: false,
    requiresDurableQueue: true,
  }),
  Object.freeze({
    surfaceId: 'retryable-notification-delivery-work',
    surface: 'Retryable notification delivery work item',
    kind: 'retryable-state' as const,
    owner: 'notification-delivery' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'absent-not-implemented' as const,
    ephemeralOrDurable: 'EPHEMERAL' as const,
    restartImpact: 'No notification retry queue; product-flow and ports forbid retries today',
    honestyRequirement:
      'Must not confuse with OutboxStatus.PENDING retry (TD-035) or invent a second Outbox',
    domainClass: 'notification-queue-td045' as const,
    futureW3O02Responsibility: 'W3-O02-b' as const,
    evidencePath: 'apps/api/src/modules/notification-delivery/ports/notification.port.ts',
    existsToday: false,
    requiresDurableQueue: true,
  }),
  Object.freeze({
    surfaceId: 'abandoned-notification-delivery-work',
    surface: 'Abandoned notification delivery work item',
    kind: 'abandoned-state' as const,
    owner: 'notification-delivery' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'absent-not-implemented' as const,
    ephemeralOrDurable: 'EPHEMERAL' as const,
    restartImpact: 'No abandoned queue state; silent loss is the honesty gap (TD-045)',
    honestyRequirement:
      'Must not map Outbox dead_letter onto notification queue without PO scope; distinct domains',
    domainClass: 'notification-queue-td045' as const,
    futureW3O02Responsibility: 'W3-O02-d' as const,
    evidencePath: 'apps/api/src/modules/notification-delivery/domain/delivery.ts',
    existsToday: false,
    requiresDurableQueue: true,
  }),

  // ── Completed / failure as history (W3-O01) ──────────────────────────────
  Object.freeze({
    surfaceId: 'completed-delivery-result-history',
    surface: 'DeliveryResult outcome delivered|skipped|failed (history)',
    kind: 'completed-state' as const,
    owner: 'notification-delivery' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'durable-owner-snapshot-history' as const,
    ephemeralOrDurable: 'DURABLE' as const,
    restartImpact:
      'Completed history survives via W3-O01 DurableNotificationStore snapshot — not in-flight queue work',
    honestyRequirement:
      'History survival ≠ queue durability; must not claim W3-O02 closed from O01 history alone',
    domainClass: 'notification-history-w3-o01' as const,
    futureW3O02Responsibility: 'out-of-scope-w3-o01' as const,
    evidencePath: 'apps/api/src/modules/notification-delivery/domain/delivery.ts',
    existsToday: true,
    requiresDurableQueue: false,
  }),
  Object.freeze({
    surfaceId: 'failure-delivery-result-failed',
    surface: 'DeliveryResult / ChannelDeliveryAttempt outcome failed',
    kind: 'failure-state' as const,
    owner: 'notification-delivery' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'durable-owner-snapshot-history' as const,
    ephemeralOrDurable: 'DURABLE' as const,
    restartImpact: 'Terminal failed history may survive; does not create retryable queue work',
    honestyRequirement: 'failed is terminal history today — not a pending retry item',
    domainClass: 'notification-history-w3-o01' as const,
    futureW3O02Responsibility: 'out-of-scope-w3-o01' as const,
    evidencePath: 'apps/api/src/modules/notification-delivery/domain/delivery.ts',
    existsToday: true,
    requiresDurableQueue: false,
  }),

  // ── Operator projections ─────────────────────────────────────────────────
  Object.freeze({
    surfaceId: 'projection-notification-deliveries-http',
    surface: 'GET v1/notification-deliveries (history list/detail)',
    kind: 'operator-projection' as const,
    owner: 'notification-product' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'durable-owner-snapshot-history' as const,
    ephemeralOrDurable: 'DURABLE' as const,
    restartImpact: 'Shows DeliveryResult history only; no pending/retry queue projection',
    honestyRequirement: 'Must not present history list as durable queue / Wave 5 Complete',
    domainClass: 'notification-history-w3-o01' as const,
    futureW3O02Responsibility: 'honesty-baseline' as const,
    evidencePath: 'apps/api/src/modules/notification-product',
    existsToday: true,
    requiresDurableQueue: false,
  }),
  Object.freeze({
    surfaceId: 'projection-web-notification-history',
    surface: 'Web NotificationHistory / ChannelHistory views',
    kind: 'operator-projection' as const,
    owner: 'notification-product' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'durable-owner-snapshot-history' as const,
    ephemeralOrDurable: 'DURABLE' as const,
    restartImpact: 'UI filters delivered|skipped|failed only — no pending queue UX',
    honestyRequirement: 'Inventory slice must not add UI claiming queue durable',
    domainClass: 'notification-history-w3-o01' as const,
    futureW3O02Responsibility: 'honesty-baseline' as const,
    evidencePath: 'apps/web/src/notifications',
    existsToday: true,
    requiresDurableQueue: false,
  }),
  Object.freeze({
    surfaceId: 'projection-command-center-toasts',
    surface: 'Command Center OperatorNotification toasts',
    kind: 'operator-projection' as const,
    owner: 'command-center-ui' as const,
    workspaceScope: 'n/a-not-notification-queue' as const,
    currentStorage: 'react-session-state' as const,
    ephemeralOrDurable: 'EPHEMERAL' as const,
    restartImpact: 'Browser session toasts wiped on refresh; unrelated to API delivery queue',
    honestyRequirement: 'Never conflate toast UX with owed channel delivery queue',
    domainClass: 'ephemeral-operator-ux' as const,
    futureW3O02Responsibility: 'out-of-scope-ux' as const,
    evidencePath: 'apps/web/src/command-center/use-operator-notifications.ts',
    existsToday: true,
    requiresDurableQueue: false,
  }),

  // ── Internal representations ─────────────────────────────────────────────
  Object.freeze({
    surfaceId: 'internal-deliveries-array',
    surface: 'InMemoryNotificationStore.deliveries[]',
    kind: 'internal-queue-representation' as const,
    owner: 'notification-delivery' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'durable-owner-snapshot-history' as const,
    ephemeralOrDurable: 'DURABLE' as const,
    restartImpact: 'Append-only history buffer; durable via owner snapshot — not pending queue',
    honestyRequirement: 'Comments: distinct from W3-O02 durable delivery queue',
    domainClass: 'notification-history-w3-o01' as const,
    futureW3O02Responsibility: 'out-of-scope-w3-o01' as const,
    evidencePath:
      'apps/api/src/modules/notification-delivery/adapters/in-memory-notification-store.ts',
    existsToday: true,
    requiresDurableQueue: false,
  }),
  Object.freeze({
    surfaceId: 'internal-telegram-adapter-sent',
    surface: 'InMemoryTelegramAdapter.sent[]',
    kind: 'internal-queue-representation' as const,
    owner: 'notification-delivery' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'process-local-in-memory' as const,
    ephemeralOrDurable: 'EPHEMERAL' as const,
    restartImpact: 'Sent-message side-effect log lost on restart; not production Bot API',
    honestyRequirement: 'Adapter memory is not the durable queue; Wave 5 owns real transport later',
    domainClass: 'notification-queue-td045' as const,
    futureW3O02Responsibility: 'honesty-baseline' as const,
    evidencePath:
      'apps/api/src/modules/notification-delivery/adapters/in-memory-telegram.adapter.ts',
    existsToday: true,
    requiresDurableQueue: false,
  }),
  Object.freeze({
    surfaceId: 'internal-durable-notification-store',
    surface: 'DurableNotificationStore (prefs + telegram + deliveries snapshot)',
    kind: 'internal-queue-representation' as const,
    owner: 'notification-delivery' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'durable-owner-snapshot-history' as const,
    ephemeralOrDurable: 'DURABLE' as const,
    restartImpact: 'W3-O01 analytical survival only; file header: Not W3-O02 queue',
    honestyRequirement:
      'W3-O01 history/prefs snapshot only — must not extend into W3-O02 queue or a second Outbox',
    domainClass: 'notification-history-w3-o01' as const,
    futureW3O02Responsibility: 'out-of-scope-w3-o01' as const,
    evidencePath:
      'apps/api/src/modules/notification-delivery/adapters/durable-notification-store.ts',
    existsToday: true,
    requiresDurableQueue: false,
  }),
  Object.freeze({
    surfaceId: 'internal-absent-notification-queue-table',
    surface: 'Dedicated NotificationQueue / DeliveryJob persistence',
    kind: 'internal-queue-representation' as const,
    owner: 'notification-delivery' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'absent-not-implemented' as const,
    ephemeralOrDurable: 'EPHEMERAL' as const,
    restartImpact: 'No table/aggregate for pending delivery work today (TD-045 gap)',
    honestyRequirement: 'Future persistence must extend existing owner — no new persistence owner',
    domainClass: 'notification-queue-td045' as const,
    futureW3O02Responsibility: 'W3-O02-b' as const,
    evidencePath:
      'apps/api/src/modules/notification-delivery/adapters/durable-notification-store.ts',
    existsToday: false,
    requiresDurableQueue: true,
  }),

  // ── Adjacent: Telegram connect pending (not queue) ───────────────────────
  Object.freeze({
    surfaceId: 'adjacent-telegram-connection-pending',
    surface: 'TelegramConnection status pending (connect workflow)',
    kind: 'pending-state' as const,
    owner: 'notification-delivery' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'durable-owner-snapshot-history' as const,
    ephemeralOrDurable: 'DURABLE' as const,
    restartImpact: 'Connect-state pending survives via O01 snapshot; not delivery work pending',
    honestyRequirement: 'Connect pending ≠ notification delivery queue pending',
    domainClass: 'adjacent-config-not-queue' as const,
    futureW3O02Responsibility: 'honesty-baseline' as const,
    evidencePath: 'apps/api/src/modules/notification-delivery/domain/telegram-connection.ts',
    existsToday: true,
    requiresDurableQueue: false,
  }),

  // ── Paper Outbox TD-035 (distinct) ───────────────────────────────────────
  Object.freeze({
    surfaceId: 'paper-outbox-pending-publishing',
    surface: 'OutboxEvent status pending|publishing (paper Outbox)',
    kind: 'pending-state' as const,
    owner: 'event-processing' as const,
    workspaceScope: 'n/a-not-notification-queue' as const,
    currentStorage: 'durable-paper-outbox' as const,
    ephemeralOrDurable: 'DURABLE' as const,
    restartImpact: 'Paper runtime events survive; not owed channel notification delivery',
    honestyRequirement: 'TD-035 ≠ TD-045; forbidden to merge or invent second Outbox for O02',
    domainClass: 'paper-outbox-td035' as const,
    futureW3O02Responsibility: 'out-of-scope-td035' as const,
    evidencePath: 'apps/api/src/modules/event-processing/domain/outbox-status.ts',
    existsToday: true,
    requiresDurableQueue: false,
  }),
  Object.freeze({
    surfaceId: 'paper-outbox-retry-dead-letter',
    surface: 'Outbox dispatcher retry / dead_letter',
    kind: 'retryable-state' as const,
    owner: 'event-processing' as const,
    workspaceScope: 'n/a-not-notification-queue' as const,
    currentStorage: 'durable-paper-outbox' as const,
    ephemeralOrDurable: 'DURABLE' as const,
    restartImpact: 'Paper Outbox retries are resolved TD-035 — out of W3-O02 ownership',
    honestyRequirement: 'Must not reuse Outbox as Notification Durable Queue',
    domainClass: 'paper-outbox-td035' as const,
    futureW3O02Responsibility: 'out-of-scope-td035' as const,
    evidencePath: 'apps/api/src/modules/event-processing/outbox-dispatcher.service.ts',
    existsToday: true,
    requiresDurableQueue: false,
  }),
  Object.freeze({
    surfaceId: 'paper-outbox-published-completed',
    surface: 'OutboxEvent status published',
    kind: 'completed-state' as const,
    owner: 'event-processing' as const,
    workspaceScope: 'n/a-not-notification-queue' as const,
    currentStorage: 'durable-paper-outbox' as const,
    ephemeralOrDurable: 'DURABLE' as const,
    restartImpact: 'Paper event publication complete — not DeliveryResult / channel send',
    honestyRequirement: 'TD-045 remains distinct from TD-035',
    domainClass: 'paper-outbox-td035' as const,
    futureW3O02Responsibility: 'out-of-scope-td035' as const,
    evidencePath: 'apps/api/src/modules/event-processing/domain/outbox-status.ts',
    existsToday: true,
    requiresDurableQueue: false,
  }),
  Object.freeze({
    surfaceId: 'paper-outbox-dead-letter-abandoned',
    surface: 'OutboxEvent status dead_letter',
    kind: 'abandoned-state' as const,
    owner: 'event-processing' as const,
    workspaceScope: 'n/a-not-notification-queue' as const,
    currentStorage: 'durable-paper-outbox' as const,
    ephemeralOrDurable: 'DURABLE' as const,
    restartImpact: 'Paper Outbox exhaustion path only',
    honestyRequirement: 'Not notification delivery abandoned state',
    domainClass: 'paper-outbox-td035' as const,
    futureW3O02Responsibility: 'out-of-scope-td035' as const,
    evidencePath: 'apps/api/src/modules/event-processing/domain/outbox-status.ts',
    existsToday: true,
    requiresDurableQueue: false,
  }),

  // ── Wave 5 reserved providers ────────────────────────────────────────────
  Object.freeze({
    surfaceId: 'wave5-reserved-inactive-channels',
    surface: 'Reserved-inactive channels email|slack|discord|teams|push',
    kind: 'producing-path' as const,
    owner: 'notification-delivery' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'absent-not-implemented' as const,
    ephemeralOrDurable: 'EPHEMERAL' as const,
    restartImpact: 'Skipped as channel-reserved today; no production transport send',
    honestyRequirement: 'Wave 5 / TD-049 / TD-050 — must not claim production send from W3-O02',
    domainClass: 'wave-5-notification-providers' as const,
    futureW3O02Responsibility: 'out-of-scope-wave-5' as const,
    evidencePath: 'apps/api/src/modules/notification-delivery/domain/notification-channel.ts',
    existsToday: true,
    requiresDurableQueue: false,
  }),
  Object.freeze({
    surfaceId: 'wave5-reserved-inactive-adapter',
    surface: 'ReservedInactiveChannelAdapter (stub; not Nest-wired)',
    kind: 'internal-queue-representation' as const,
    owner: 'notification-delivery' as const,
    workspaceScope: 'workspace-bound' as const,
    currentStorage: 'absent-not-implemented' as const,
    ephemeralOrDurable: 'EPHEMERAL' as const,
    restartImpact: 'Stub send always fails reserved-inactive; not a queue',
    honestyRequirement: 'Production providers remain Wave 5',
    domainClass: 'wave-5-notification-providers' as const,
    futureW3O02Responsibility: 'out-of-scope-wave-5' as const,
    evidencePath:
      'apps/api/src/modules/notification-delivery/adapters/reserved-inactive-channel.adapter.ts',
    existsToday: true,
    requiresDurableQueue: false,
  }),
]);

export const W3_O02_A_REQUIRED_SURFACE_KINDS: readonly W3O02ASurfaceKind[] = Object.freeze([
  ...W3_O02_A_SURFACE_KINDS,
]);

export const W3_O02_A_EXPLICIT_OUT = Object.freeze([
  'queue-persistence-implementation',
  'restart-recovery-implementation',
  'retry-engine',
  'scheduler',
  'workflow-engine',
  'event-bus',
  'second-outbox',
  'second-notification-domain',
  'monitoring-product',
  'business-continuity',
  'high-availability',
  'disaster-recovery',
  'wave-5-production-transports',
  'kill-switch-product',
  'live-trading',
  'w3-o02-b',
] as const);

export const W3_O02_A_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  newEventStore: false,
  newKnowledgeLake: false,
  newProjectionStore: false,
  newLedger: false,
  newOutbox: false,
  newInbox: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  w3O01Redesigned: false,
  td045MergedIntoTd035: false,
  queueDurableClaimed: false,
  wave5TransportsClaimed: false,
  customerVisibleQueueFeature: false,
  platformRestartSafeFromO02: false,
} as const);

/** Live evidence anchors for distinction consistency. */
export const W3_O02_A_DISTINCTION_EVIDENCE = Object.freeze({
  deliveryOutcomes: DELIVERY_OUTCOMES,
  activeChannels: ACTIVE_NOTIFICATION_CHANNELS,
  reservedChannels: RESERVED_NOTIFICATION_CHANNELS,
  notificationPorts: NOTIFICATION_PORTS_ACTIVE,
  outboxStatuses: Object.freeze([
    OutboxStatus.PENDING,
    OutboxStatus.PUBLISHING,
    OutboxStatus.PUBLISHED,
    OutboxStatus.DEAD_LETTER,
  ]),
  queueOwner: W3_O02_A_QUEUE_OWNER,
} as const);

export function surfaceIds(): readonly string[] {
  return W3_O02_A_NOTIFICATION_QUEUE_INVENTORY.map((row) => row.surfaceId);
}

export function inventoryOwners(): readonly W3O02AOwner[] {
  return [
    ...new Set(W3_O02_A_NOTIFICATION_QUEUE_INVENTORY.map((row) => row.owner)),
  ].sort() as W3O02AOwner[];
}

export function rowsByKind(kind: W3O02ASurfaceKind): readonly W3O02AInventoryRow[] {
  return W3_O02_A_NOTIFICATION_QUEUE_INVENTORY.filter((row) => row.kind === kind);
}

export function rowsRequiringDurableQueue(): readonly W3O02AInventoryRow[] {
  return W3_O02_A_NOTIFICATION_QUEUE_INVENTORY.filter((row) => row.requiresDurableQueue);
}

export function rowsEphemeral(): readonly W3O02AInventoryRow[] {
  return W3_O02_A_NOTIFICATION_QUEUE_INVENTORY.filter(
    (row) => row.ephemeralOrDurable === 'EPHEMERAL',
  );
}

export function rowsWave5(): readonly W3O02AInventoryRow[] {
  return W3_O02_A_NOTIFICATION_QUEUE_INVENTORY.filter(
    (row) => row.domainClass === 'wave-5-notification-providers',
  );
}

export function rowsTd045(): readonly W3O02AInventoryRow[] {
  return W3_O02_A_NOTIFICATION_QUEUE_INVENTORY.filter(
    (row) => row.domainClass === 'notification-queue-td045',
  );
}

export function rowsTd035(): readonly W3O02AInventoryRow[] {
  return W3_O02_A_NOTIFICATION_QUEUE_INVENTORY.filter(
    (row) => row.domainClass === 'paper-outbox-td035',
  );
}

export function rowsW3O01History(): readonly W3O02AInventoryRow[] {
  return W3_O02_A_NOTIFICATION_QUEUE_INVENTORY.filter(
    (row) => row.domainClass === 'notification-history-w3-o01',
  );
}
