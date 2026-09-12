/**
 * w5-n25-a — Notification Retry Scheduling Decision Inventory & Honest Product Baseline.
 *
 * Discovery and classification only.
 * Not Notification Retry Scheduling Decision implementation. Not production transport I/O.
 * Not runtime decision logic / scheduling decisions / runtime scheduling / eligibility /
 * backoff calculation / execution / retry lifecycle / timers / workers / orchestration.
 * Not Retry Engine / Runtime Scheduler / runtime decision engine / Worker / Timer /
 * Scheduler Platform / Workflow Engine / Event Bus.
 * Not W5-N25 COMPLETE. Not Notification Platform Complete. Not Wave 5 CLOSED.
 *
 * Classifications: DECISION | CONFIGURATION | EPHEMERAL | RECOVERABLE | NON-RECOVERABLE
 * W5-N01…N24 foundations consumed as reference patterns only — not reopened.
 */

export const W5_N25_A_SLICE_ID = 'W5-N25-a' as const;

export const W5_N25_A_ALLOWED_OWNERS = Object.freeze([
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
  'w5-n05-reference',
  'w5-n06-reference',
  'w5-n07-reference',
  'w5-n08-reference',
  'w5-n09-reference',
  'w5-n10-reference',
  'w5-n11-reference',
  'w5-n12-reference',
  'w5-n13-reference',
  'w5-n14-reference',
  'w5-n15-reference',
  'w5-n16-reference',
  'w5-n17-reference',
  'w5-n18-reference',
  'w5-n19-reference',
  'w5-n20-reference',
  'w5-n21-reference',
  'w5-n22-reference',
  'w5-n23-reference',
  'w5-n24-reference',
  'ai-gateway-deferred',
  'live-trading-deferred',
  'strategy-trading-pipeline',
] as const);

export type W5N25AOwner = (typeof W5_N25_A_ALLOWED_OWNERS)[number];

export const W5_N25_A_SUBSTRATE_OWNERS = Object.freeze([
  'notification-delivery',
  'notification-product',
  'connection-management',
  'secret-vault',
  'platform-readiness',
] as const);

export const W5_N25_A_ARTIFACT_KINDS = Object.freeze([
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

export type W5N25AArtifactKind = (typeof W5_N25_A_ARTIFACT_KINDS)[number];
export const W5_N25_A_REQUIRED_ARTIFACT_KINDS = W5_N25_A_ARTIFACT_KINDS;

export const W5_N25_A_CAPABILITY_CATEGORIES = Object.freeze([
  'implemented-today',
  'infrastructure-only',
  'planned',
  'not-implemented',
  'future-roadmap',
] as const);

export type W5N25ACapabilityCategory = (typeof W5_N25_A_CAPABILITY_CATEGORIES)[number];

export const W5_N25_A_DECISION_CLASSIFICATIONS = Object.freeze([
  'DECISION',
  'CONFIGURATION',
  'EPHEMERAL',
  'RECOVERABLE',
  'NON-RECOVERABLE',
] as const);

export type W5N25ADecisionClassification = (typeof W5_N25_A_DECISION_CLASSIFICATIONS)[number];

export const W5_N25_A_HONEST_PRODUCT_STATES = Object.freeze([
  'not-implemented',
  'infrastructure-only',
  'implemented-today',
  'reserved-inactive',
  'planned',
  'deferred',
  'binding-honesty',
  'explicit-out',
  'not-applicable',
] as const);

export type W5N25AHonestProductState = (typeof W5_N25_A_HONEST_PRODUCT_STATES)[number];

export const W5_N25_A_FUTURE_RESPONSIBILITIES = Object.freeze([
  'W5-N25-b',
  'W5-N25-c',
  'W5-N25-d',
  'W5-N25-e',
  'honesty-baseline',
  'out-of-scope-live-trading',
  'out-of-scope-platform-decision-slice-a',
  'out-of-scope-runtime-decision-logic',
  'out-of-scope-scheduling-decisions',
  'out-of-scope-runtime-scheduling',
  'out-of-scope-backoff-calculation',
  'out-of-scope-eligibility-determination',
  'out-of-scope-retry-execution',
  'out-of-scope-retry-engine',
  'out-of-scope-runtime-scheduler',
  'out-of-scope-runtime-decision-engine',
  'out-of-scope-production-transport-i/o',
  'out-of-scope-exchange-adapter',
  'out-of-scope-wave-5-complete',
  'out-of-scope-notification-platform-complete',
  'out-of-scope-w5-n17-reopen',
  'out-of-scope-w5-n18-reopen',
  'out-of-scope-w5-n19-reopen',
  'out-of-scope-w5-n20-reopen',
  'out-of-scope-w5-n21-reopen',
  'out-of-scope-w5-n22-reopen',
  'out-of-scope-w5-n23-reopen',
  'out-of-scope-w5-n24-reopen',
  'out-of-scope-ai-gateway',
  'out-of-scope-timer-implementation',
  'out-of-scope-retry-platform',
  'out-of-scope-retry-orchestration',
  'out-of-scope-retry-lifecycle',
  'out-of-scope-timers',
  'out-of-scope-workers',
  'out-of-scope-scheduler',
  'w5-n17-reference',
  'w5-n18-reference',
  'w5-n19-reference',
  'w5-n20-reference',
  'w5-n21-reference',
  'w5-n22-reference',
  'w5-n23-reference',
  'w5-n24-reference',
] as const);

export type W5N25AFutureResponsibility = (typeof W5_N25_A_FUTURE_RESPONSIBILITIES)[number];

export type W5N25AInventoryRow = Readonly<{
  artifactId: string;
  artifact: string;
  kind: W5N25AArtifactKind;
  owner: W5N25AOwner;
  purpose: string;
  decisionRole: string;
  classification: W5N25ADecisionClassification;
  persistenceRequirement: string;
  recoveryRequirement: string;
  operationalRequirement: string;
  dependencies: readonly string[];
  capabilityCategory: W5N25ACapabilityCategory;
  currentStatus: string;
  honestyRequirement: string;
  futureW5N25Responsibility: W5N25AFutureResponsibility;
  evidencePath: string;
  existsToday: boolean;
  authorizesDecisionFunctional: false;
  authorizesW5N25Complete: false;
  honestProductState: W5N25AHonestProductState;
  operationalVisibility: string;
  customerVisibility: string;
}>;

const DOC = 'docs/project/version-3/wave-5/w5-n25-product-scope.md';
const PKG = 'docs/project/version-3/wave-5/w5-n25-implementation-package.md';
const OVR = 'docs/project/version-3/wave-5/w5-n25-overview.md';
const SEC = 'docs/project/version-3/wave-5/w5-n25-security-review.md';
const ND = 'apps/api/src/modules/notification-delivery/notification-delivery.module.ts';
const QUEUE = 'apps/api/src/modules/notification-delivery/domain/delivery-queue.ts';
const SVC = 'apps/api/src/modules/notification-delivery/notification-delivery.service.ts';
const N17 =
  'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-reliability-anchor.repository.ts';
const N18 =
  'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-execution-anchor.repository.ts';
const N19 =
  'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-scheduling-anchor.repository.ts';
const N20 =
  'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-policy-anchor.repository.ts';
const N21 =
  'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-backoff-anchor.repository.ts';
const N22 =
  'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-backoff-calculation-anchor.repository.ts';
const N22R =
  'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-calculation-restart-recovery.service.ts';
const N22C =
  'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-calculation-operational-continuity.ts';
const N22I = 'apps/api/src/platform-conformance/w5-n22-a-retry-backoff-calculation-inventory.ts';
const N23I = 'apps/api/src/platform-conformance/w5-n23-a-retry-eligibility-inventory.ts';
const N23P =
  'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-eligibility-anchor.repository.ts';
const N23B =
  'apps/api/src/modules/notification-delivery/notification-platform-retry-eligibility-persistence.service.ts';
const N23C =
  'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-eligibility-restart-recovery.service.ts';
const N23D =
  'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-eligibility-operational-continuity.ts';
const N24I = 'apps/api/src/platform-conformance/w5-n24-a-retry-scheduling-inventory.ts';
const N24B =
  'apps/api/src/platform-conformance/w5-n24-b-durable-notification-platform-retry-scheduling.ts';
const N24C =
  'apps/api/src/platform-conformance/w5-n24-c-notification-platform-retry-scheduling-restart-recovery.ts';
const N24D =
  'apps/api/src/platform-conformance/w5-n24-d-notification-platform-retry-scheduling-operational-continuity.ts';
const N25B =
  'apps/api/src/modules/notification-delivery/notification-platform-retry-scheduling-decision-persistence.service.ts';
const N25B_PRISMA =
  'apps/api/src/modules/notification-delivery/persistence/prisma-notification-platform-retry-scheduling-decision-anchor.repository.ts';

type RowInput = {
  artifactId: string;
  artifact: string;
  kind: W5N25AArtifactKind;
  owner: W5N25AOwner;
  purpose: string;
  decisionRole: string;
  classification: W5N25ADecisionClassification;
  honestyRequirement: string;
  futureW5N25Responsibility: W5N25AFutureResponsibility;
  persistenceRequirement?: string;
  recoveryRequirement?: string;
  operationalRequirement?: string;
  dependencies?: readonly string[];
  capabilityCategory?: W5N25ACapabilityCategory;
  currentStatus?: string;
  evidencePath?: string;
  existsToday?: boolean;
  honestProductState?: W5N25AHonestProductState;
  operationalVisibility?: string;
  customerVisibility?: string;
};

function row(input: RowInput): W5N25AInventoryRow {
  const { classification, kind } = input;
  const isOut = kind === 'explicit-out';
  const isHonesty = kind === 'honesty-boundary';
  const isMissing = input.artifactId.startsWith('missing-');
  const capabilityCategory =
    input.capabilityCategory ??
    (isOut
      ? classification === 'EPHEMERAL'
        ? 'future-roadmap'
        : 'not-implemented'
      : isHonesty
        ? 'implemented-today'
        : classification === 'DECISION' || classification === 'CONFIGURATION'
          ? 'planned'
          : classification === 'EPHEMERAL'
            ? isMissing
              ? 'planned'
              : 'not-implemented'
            : 'infrastructure-only');
  const honestProductState =
    input.honestProductState ??
    (isOut
      ? 'explicit-out'
      : isHonesty
        ? 'binding-honesty'
        : classification === 'DECISION' || classification === 'CONFIGURATION' || isMissing
          ? 'planned'
          : classification === 'EPHEMERAL'
            ? 'not-implemented'
            : 'infrastructure-only');
  return Object.freeze({
    artifactId: input.artifactId,
    artifact: input.artifact,
    kind: input.kind,
    owner: input.owner,
    purpose: input.purpose,
    decisionRole: input.decisionRole,
    classification,
    persistenceRequirement: input.persistenceRequirement ?? 'not-applicable',
    recoveryRequirement: input.recoveryRequirement ?? 'not-applicable',
    operationalRequirement: input.operationalRequirement ?? 'not-applicable',
    dependencies: Object.freeze([...(input.dependencies ?? [])]) as readonly string[],
    capabilityCategory,
    currentStatus:
      input.currentStatus ??
      (isOut
        ? 'Explicit OUT — must not authorize from W5-N25-a'
        : isHonesty
          ? 'Binding honesty frozen'
          : isMissing
            ? 'Missing — planned future slice'
            : 'Inventoried for W5-N25-a discovery'),
    honestyRequirement: input.honestyRequirement,
    futureW5N25Responsibility: input.futureW5N25Responsibility,
    evidencePath: input.evidencePath ?? DOC,
    existsToday: input.existsToday ?? false,
    authorizesDecisionFunctional: false,
    authorizesW5N25Complete: false,
    honestProductState,
    operationalVisibility:
      input.operationalVisibility ??
      (isHonesty ? 'documentation-only' : isOut ? 'internal-only' : 'internal-only'),
    customerVisibility:
      input.customerVisibility ??
      (isHonesty
        ? 'not customer-visible — honesty'
        : isOut
          ? 'not customer-visible — explicit out'
          : 'not customer-visible — infrastructure only'),
  });
}

/** Compact helpers for repeated row shapes. */
const own = (
  artifactId: string,
  artifact: string,
  owner: W5N25AOwner,
  purpose: string,
  classification: W5N25ADecisionClassification,
  future: W5N25AFutureResponsibility,
  honesty: string,
  extra: Partial<RowInput> = {},
) =>
  row({
    artifactId,
    artifact,
    kind: 'ownership',
    owner,
    purpose,
    decisionRole: extra.decisionRole ?? 'ownership-boundary',
    classification,
    honestyRequirement: honesty,
    futureW5N25Responsibility: future,
    ...extra,
  });

const consume = (
  artifactId: string,
  artifact: string,
  owner: W5N25AOwner,
  future: W5N25AFutureResponsibility,
  evidencePath: string,
  purpose: string,
) =>
  row({
    artifactId,
    artifact,
    kind: 'dependency',
    owner,
    purpose,
    decisionRole: 'consumed-foundation',
    classification: 'RECOVERABLE',
    honestyRequirement: 'Consumed not redesigned; does not authorize decision functional',
    futureW5N25Responsibility: future,
    persistenceRequirement: future,
    recoveryRequirement: future,
    operationalRequirement: future,
    evidencePath,
    existsToday: true,
  });

const honesty = (
  artifactId: string,
  artifact: string,
  honestyRequirement: string,
  future: W5N25AFutureResponsibility,
) =>
  row({
    artifactId,
    artifact,
    kind: 'honesty-boundary',
    owner: 'wave-5-documentation',
    purpose: honestyRequirement,
    decisionRole: 'honesty-constraint',
    classification: 'NON-RECOVERABLE',
    honestyRequirement,
    futureW5N25Responsibility: future,
    existsToday: true,
    evidencePath: DOC,
  });

const out = (
  artifactId: string,
  artifact: string,
  honestyRequirement: string,
  future: W5N25AFutureResponsibility,
  classification: W5N25ADecisionClassification = 'NON-RECOVERABLE',
  owner: W5N25AOwner = 'wave-5-documentation',
) =>
  row({
    artifactId,
    artifact,
    kind: 'explicit-out',
    owner,
    purpose: honestyRequirement,
    decisionRole: 'explicit-out',
    classification,
    honestyRequirement,
    futureW5N25Responsibility: future,
    evidencePath: classification === 'EPHEMERAL' ? PKG : DOC,
  });

export const W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY: readonly W5N25AInventoryRow[] =
  Object.freeze([
    // Ownership
    own(
      'own-platform-decision-layer',
      'Cross-channel Notification Retry Scheduling Decision Decision — notification-delivery owner',
      'notification-delivery',
      'Declare sole owner path for future decision foundation artifacts',
      'RECOVERABLE',
      'W5-N25-d',
      'Decision extends notification-delivery only; no Runtime Scheduler, Retry Engine, or runtime decision engine',
      {
        persistenceRequirement: 'notification-delivery',
        recoveryRequirement: 'notification-delivery',
        operationalRequirement: 'platform-readiness',
        currentStatus:
          'Owner path exists; N17…N24 consumed; unified whether-to-schedule decision layer still absent',
        evidencePath: ND,
        existsToday: true,
      },
    ),
    own(
      'own-notification-delivery-domain',
      'Notification Delivery BC — sole owner for decision foundation artifacts',
      'notification-delivery',
      'Keep decision foundation inside existing notification-delivery BC',
      'RECOVERABLE',
      'honesty-baseline',
      'No new bounded context for decision',
      {
        persistenceRequirement: 'notification-delivery',
        recoveryRequirement: 'notification-delivery',
        operationalRequirement: 'platform-readiness',
        evidencePath: ND,
        existsToday: true,
      },
    ),
    own(
      'own-pc06-routing-delivery',
      'PC-06 resolve-delivery-routing — routing SoT consumed unchanged',
      'notification-product',
      'Confirm decision consumes PC-06 routing and does not own it',
      'RECOVERABLE',
      'honesty-baseline',
      'No duplicate routing engine; PC-06 unchanged',
      {
        persistenceRequirement: 'consumed-not-owned',
        recoveryRequirement: 'consumed-not-owned',
        operationalRequirement: 'platform-readiness',
        dependencies: ['runtime-pc06-resolve-delivery-routing'],
        evidencePath: SVC,
        existsToday: true,
      },
    ),
    own(
      'own-w5-n17-delivery-reliability-consume',
      'W5-N17 CLOSED delivery reliability foundation — consumed not redesigned',
      'notification-delivery',
      'Consume N17 reliability foundation without reopen',
      'RECOVERABLE',
      'w5-n17-reference',
      'Delivery reliability ≠ decision; N17 not reopened',
      {
        decisionRole: 'consumed-foundation-ownership',
        persistenceRequirement: 'w5-n17-reference',
        recoveryRequirement: 'w5-n17-reference',
        operationalRequirement: 'w5-n17-reference',
        dependencies: ['consume-w5-n17-delivery-reliability-anchor'],
        evidencePath: N17,
        existsToday: true,
      },
    ),
    own(
      'own-w5-n18-retry-execution-consume',
      'W5-N18 CLOSED retry execution foundation — consumed not redesigned',
      'notification-delivery',
      'Consume N18 retry execution foundation without reopen',
      'RECOVERABLE',
      'w5-n18-reference',
      'Retry execution ≠ decision; N18 not reopened',
      {
        decisionRole: 'consumed-foundation-ownership',
        persistenceRequirement: 'w5-n18-reference',
        recoveryRequirement: 'w5-n18-reference',
        operationalRequirement: 'w5-n18-reference',
        dependencies: ['consume-w5-n18-retry-execution-anchor'],
        evidencePath: N18,
        existsToday: true,
      },
    ),
    own(
      'own-w5-n19-retry-scheduling-consume',
      'W5-N19 CLOSED retry scheduling foundation — consumed not redesigned',
      'notification-delivery',
      'Consume N19 retry scheduling foundation without reopen',
      'RECOVERABLE',
      'w5-n19-reference',
      'Retry scheduling ≠ decision; N19 not reopened',
      {
        decisionRole: 'consumed-foundation-ownership',
        persistenceRequirement: 'w5-n19-reference',
        recoveryRequirement: 'w5-n19-reference',
        operationalRequirement: 'w5-n19-reference',
        dependencies: ['consume-w5-n19-retry-scheduling-anchor'],
        evidencePath: N19,
        existsToday: true,
      },
    ),
    own(
      'own-w5-n20-retry-policy-consume',
      'W5-N20 CLOSED retry policy foundation — consumed not redesigned',
      'notification-delivery',
      'Consume N20 retry policy foundation without reopen',
      'RECOVERABLE',
      'w5-n20-reference',
      'Retry policy ≠ decision; N20 not reopened',
      {
        decisionRole: 'consumed-foundation-ownership',
        persistenceRequirement: 'w5-n20-reference',
        recoveryRequirement: 'w5-n20-reference',
        operationalRequirement: 'w5-n20-reference',
        dependencies: ['consume-w5-n20-retry-policy-anchor'],
        evidencePath: N20,
        existsToday: true,
      },
    ),
    own(
      'own-w5-n21-retry-backoff-consume',
      'W5-N21 CLOSED retry backoff foundation — consumed not redesigned',
      'notification-delivery',
      'Consume N21 retry backoff foundation without reopen',
      'RECOVERABLE',
      'w5-n21-reference',
      'Retry backoff ≠ decision; N21 not reopened',
      {
        decisionRole: 'consumed-foundation-ownership',
        persistenceRequirement: 'w5-n21-reference',
        recoveryRequirement: 'w5-n21-reference',
        operationalRequirement: 'w5-n21-reference',
        dependencies: ['consume-w5-n21-retry-backoff-anchor'],
        evidencePath: N21,
        existsToday: true,
      },
    ),
    own(
      'own-w5-n22-retry-backoff-calculation-consume',
      'W5-N22 CLOSED retry backoff calculation foundation — consumed not redesigned',
      'notification-delivery',
      'Consume N22 retry backoff calculation foundation without reopen',
      'RECOVERABLE',
      'w5-n22-reference',
      'Backoff calculation ≠ decision; N22 not reopened',
      {
        decisionRole: 'consumed-foundation-ownership',
        persistenceRequirement: 'w5-n22-reference',
        recoveryRequirement: 'w5-n22-reference',
        operationalRequirement: 'w5-n22-reference',
        dependencies: [
          'consume-w5-n22-retry-backoff-calculation-anchor',
          'consume-w5-n22-retry-backoff-calculation-restart-recovery',
          'consume-w5-n22-retry-backoff-calculation-continuity',
        ],
        evidencePath: N22,
        existsToday: true,
      },
    ),
    own(
      'own-w5-n23-retry-eligibility-consume',
      'W5-N23 CLOSED retry eligibility foundation — consumed not redesigned',
      'notification-delivery',
      'Consume N23 retry eligibility foundation without reopen',
      'RECOVERABLE',
      'w5-n23-reference',
      'Retry eligibility ≠ decision; N23 not reopened',
      {
        decisionRole: 'consumed-foundation-ownership',
        persistenceRequirement: 'w5-n23-reference',
        recoveryRequirement: 'w5-n23-reference',
        operationalRequirement: 'w5-n23-reference',
        dependencies: [
          'consume-w5-n23-retry-eligibility-anchor',
          'consume-w5-n23-retry-eligibility-persistence',
          'consume-w5-n23-retry-eligibility-restart-recovery',
          'consume-w5-n23-retry-eligibility-continuity',
        ],
        evidencePath: N23P,
        existsToday: true,
      },
    ),
    own(
      'own-w5-n24-retry-scheduling-consume',
      'W5-N24 CLOSED retry scheduling foundation — consumed not redesigned',
      'notification-delivery',
      'Consume N24 retry scheduling foundation without reopen',
      'RECOVERABLE',
      'w5-n24-reference',
      'Retry scheduling ≠ decision; N24 not reopened',
      {
        decisionRole: 'consumed-foundation-ownership',
        persistenceRequirement: 'w5-n24-reference',
        recoveryRequirement: 'w5-n24-reference',
        operationalRequirement: 'w5-n24-reference',
        dependencies: [
          'consume-w5-n24-retry-scheduling-anchor',
          'consume-w5-n24-retry-scheduling-inventory',
          'consume-w5-n24-retry-scheduling-persistence',
          'consume-w5-n24-retry-scheduling-restart-recovery',
          'consume-w5-n24-retry-scheduling-continuity',
        ],
        evidencePath: N24I,
        existsToday: true,
      },
    ),
    own(
      'own-secret-vault-consume',
      'Secret Vault — credential owner consumed only',
      'secret-vault',
      'Confirm decision does not store secrets',
      'NON-RECOVERABLE',
      'honesty-baseline',
      'No local secret store; no plaintext echo',
      {
        persistenceRequirement: 'consumed-not-owned',
        evidencePath: SEC,
        existsToday: true,
      },
    ),
    own(
      'own-connection-management-consume',
      'Connection Management facade — consumed not redesigned',
      'connection-management',
      'Confirm Connection Management ownership unchanged',
      'NON-RECOVERABLE',
      'honesty-baseline',
      'Connection Management not redesigned',
      { persistenceRequirement: 'consumed-not-owned', existsToday: true },
    ),
    own(
      'own-workspace-isolation-notifications',
      'Workspace Isolation — decision state workspace-scoped',
      'workspace-isolation',
      'Fail closed on missing workspace for any future decision state',
      'NON-RECOVERABLE',
      'honesty-baseline',
      'No cross-workspace decision state',
      {
        persistenceRequirement: 'consumed-not-owned',
        evidencePath: SEC,
        existsToday: true,
      },
    ),
    own(
      'own-notification-durable-queue',
      'W3-O02 durable notification queue — substrate consumed',
      'notification-delivery',
      'Consume durable queue substrate; not runtime decision logic',
      'RECOVERABLE',
      'honesty-baseline',
      'Queue substrate owner unchanged; not runtime decision logic',
      {
        persistenceRequirement: 'notification-delivery',
        recoveryRequirement: 'notification-delivery',
        operationalRequirement: 'platform-readiness',
        evidencePath: QUEUE,
        existsToday: true,
      },
    ),
    own(
      'own-honest-product-boundaries',
      'Honest Product boundaries for Retry Scheduling Decision Foundation',
      'wave-5-documentation',
      'Freeze binding honesty rules for decision-planning-only slice a',
      'EPHEMERAL',
      'honesty-baseline',
      'Binding Honest Product rules frozen at planning and inventory',
      {
        decisionRole: 'honesty-baseline-ownership',
        capabilityCategory: 'implemented-today',
        honestProductState: 'binding-honesty',
        currentStatus:
          'Documented — Inventory ≠ runtime decision logic / scheduling decisions / backoff / eligibility / schedule / execution / lifecycle / timers / workers / orchestration',
        existsToday: true,
        operationalVisibility: 'documentation-only',
        customerVisibility: 'not customer-visible — documentation honesty',
      },
    ),

    // Consumed N17–N24
    consume(
      'consume-w5-n17-delivery-reliability-anchor',
      'W5-N17 delivery reliability anchor — consumed',
      'w5-n17-reference',
      'w5-n17-reference',
      N17,
      'Consume Closed N17 reliability anchor',
    ),
    consume(
      'consume-w5-n18-retry-execution-anchor',
      'W5-N18 retry execution anchor — consumed',
      'w5-n18-reference',
      'w5-n18-reference',
      N18,
      'Consume Closed N18 retry execution anchor',
    ),
    consume(
      'consume-w5-n19-retry-scheduling-anchor',
      'W5-N19 retry scheduling anchor — consumed',
      'w5-n19-reference',
      'w5-n19-reference',
      N19,
      'Consume Closed N19 retry scheduling anchor',
    ),
    consume(
      'consume-w5-n20-retry-policy-anchor',
      'W5-N20 retry policy anchor — consumed',
      'w5-n20-reference',
      'w5-n20-reference',
      N20,
      'Consume Closed N20 retry policy anchor',
    ),
    consume(
      'consume-w5-n21-retry-backoff-anchor',
      'W5-N21 retry backoff durable anchor — consumed',
      'w5-n21-reference',
      'w5-n21-reference',
      N21,
      'Consume Closed N21 backoff anchor as decision substrate reference',
    ),
    consume(
      'consume-w5-n22-retry-backoff-calculation-anchor',
      'W5-N22 retry backoff calculation durable anchor — consumed',
      'w5-n22-reference',
      'w5-n22-reference',
      N22,
      'Consume Closed N22 backoff calculation anchor as decision substrate reference',
    ),
    consume(
      'consume-w5-n22-retry-backoff-calculation-restart-recovery',
      'W5-N22 retry backoff calculation restart recovery — consumed',
      'w5-n22-reference',
      'w5-n22-reference',
      N22R,
      'Consume Closed N22 restart recovery pattern',
    ),
    consume(
      'consume-w5-n22-retry-backoff-calculation-continuity',
      'W5-N22 retry backoff calculation operational continuity — consumed',
      'w5-n22-reference',
      'w5-n22-reference',
      N22C,
      'Consume Closed N22 operational continuity pattern',
    ),
    consume(
      'consume-w5-n23-retry-eligibility-anchor',
      'W5-N23 retry eligibility durable anchor — consumed',
      'w5-n23-reference',
      'w5-n23-reference',
      N23P,
      'Consume Closed N23 eligibility anchor as decision substrate reference',
    ),
    consume(
      'consume-w5-n23-retry-eligibility-persistence',
      'W5-N23 retry eligibility persistence — consumed',
      'w5-n23-reference',
      'w5-n23-reference',
      N23B,
      'Consume Closed N23 eligibility persistence pattern',
    ),
    consume(
      'consume-w5-n23-retry-eligibility-restart-recovery',
      'W5-N23 retry eligibility restart recovery — consumed',
      'w5-n23-reference',
      'w5-n23-reference',
      N23C,
      'Consume Closed N23 restart recovery pattern',
    ),
    consume(
      'consume-w5-n23-retry-eligibility-continuity',
      'W5-N23 retry eligibility operational continuity — consumed',
      'w5-n23-reference',
      'w5-n23-reference',
      N23D,
      'Consume Closed N23 operational continuity pattern',
    ),
    consume(
      'consume-w5-n24-retry-scheduling-anchor',
      'W5-N24 / N19 retry scheduling durable anchor — consumed',
      'w5-n24-reference',
      'w5-n24-reference',
      N19,
      'Consume Closed N24 scheduling substrate anchor (N19 persistence path)',
    ),
    consume(
      'consume-w5-n24-retry-scheduling-inventory',
      'W5-N24-a retry scheduling inventory — consumed',
      'w5-n24-reference',
      'w5-n24-reference',
      N24I,
      'Consume Closed N24 scheduling inventory as decision reference pattern',
    ),
    consume(
      'consume-w5-n24-retry-scheduling-persistence',
      'W5-N24-b durable retry scheduling persistence — consumed',
      'w5-n24-reference',
      'w5-n24-reference',
      N24B,
      'Consume Closed N24 persistence foundation evidence',
    ),
    consume(
      'consume-w5-n24-retry-scheduling-restart-recovery',
      'W5-N24-c retry scheduling restart recovery — consumed',
      'w5-n24-reference',
      'w5-n24-reference',
      N24C,
      'Consume Closed N24 restart recovery evidence',
    ),
    consume(
      'consume-w5-n24-retry-scheduling-continuity',
      'W5-N24-d retry scheduling operational continuity — consumed',
      'w5-n24-reference',
      'w5-n24-reference',
      N24D,
      'Consume Closed N24 operational continuity evidence',
    ),

    // Missing gaps (existsToday false — slice a only, nothing resolved yet)
    row({
      artifactId: 'missing-unified-platform-decision-view',
      artifact: 'Unified platform decision view — missing',
      kind: 'ephemeral-artifact',
      owner: 'notification-delivery',
      purpose:
        'Record absence of unified cross-channel whether-to-schedule decision view after calc+eligibility+scheduling',
      decisionRole: 'missing-gap',
      classification: 'EPHEMERAL',
      honestyRequirement: 'Must not claim unified decision layer from inventory alone',
      futureW5N25Responsibility: 'W5-N25-d',
      persistenceRequirement: 'none-missing',
      recoveryRequirement: 'none-missing',
      operationalRequirement: 'none-missing',
      capabilityCategory: 'not-implemented',
      honestProductState: 'not-implemented',
      currentStatus:
        'Missing — no unified platform decision view after calc+eligibility+scheduling today',
      evidencePath: PKG,
      existsToday: false,
      customerVisibility: 'not customer-visible — absent',
    }),
    row({
      artifactId: 'missing-decision-persistence',
      artifact:
        'Decision durable persistence — resolved by W5-N25-b (gap row retained for inventory honesty)',
      kind: 'persistence-candidate',
      owner: 'notification-delivery',
      purpose:
        'Record resolved durable whether-to-schedule decision persistence gap after W5-N25-b',
      decisionRole: 'missing-gap-resolved',
      classification: 'RECOVERABLE',
      honestyRequirement:
        'Resolved by W5-N25-b — persistence only; not runtime decision logic; not scheduling/eligibility/backoff/execution',
      futureW5N25Responsibility: 'honesty-baseline',
      persistenceRequirement: 'notification-delivery',
      recoveryRequirement: 'planned W5-N25-c',
      capabilityCategory: 'infrastructure-only',
      honestProductState: 'infrastructure-only',
      currentStatus:
        'Resolved by W5-N25-b — see persist-candidate-decision-anchor; gap row retained for inventory honesty',
      evidencePath: N25B,
      existsToday: true,
      customerVisibility: 'not customer-visible — gap resolved by W5-N25-b',
    }),
    row({
      artifactId: 'missing-decision-recovery',
      artifact: 'Decision restart recovery — missing (future W5-N25-c)',
      kind: 'ephemeral-artifact',
      owner: 'notification-delivery',
      purpose: 'Record restart-safe decision recovery gap for W5-N25-c',
      decisionRole: 'missing-gap',
      classification: 'EPHEMERAL',
      honestyRequirement:
        'Planned for W5-N25-c — recovery only; not runtime decision logic; not scheduling/eligibility/backoff/execution',
      futureW5N25Responsibility: 'W5-N25-c',
      recoveryRequirement: 'planned W5-N25-c',
      evidencePath: PKG,
      existsToday: false,
      customerVisibility: 'not customer-visible — absent',
    }),
    row({
      artifactId: 'missing-decision-operational-continuity',
      artifact: 'Decision operational continuity — missing (future W5-N25-d)',
      kind: 'operational',
      owner: 'platform-readiness',
      purpose: 'Record decision operational continuity gap for W5-N25-d',
      decisionRole: 'missing-gap',
      classification: 'EPHEMERAL',
      honestyRequirement:
        'Planned for W5-N25-d — derived readiness only; not runtime decision logic; not scheduling/eligibility/backoff/execution',
      futureW5N25Responsibility: 'W5-N25-d',
      operationalRequirement: 'planned W5-N25-d',
      evidencePath: PKG,
      existsToday: false,
      customerVisibility: 'not customer-visible — absent',
    }),

    // CONFIGURATION
    row({
      artifactId: 'config-decision-rule-representation',
      artifact: 'Decision rule configuration representation — planned',
      kind: 'state',
      owner: 'notification-delivery',
      purpose:
        'Represent how whether-to-schedule decision rules would be configured (inventory only)',
      decisionRole: 'configuration-representation',
      classification: 'CONFIGURATION',
      honestyRequirement: 'CONFIGURATION classification ≠ runtime decision logic',
      futureW5N25Responsibility: 'W5-N25-b',
      persistenceRequirement: 'planned W5-N25-b',
      recoveryRequirement: 'planned W5-N25-c',
      operationalRequirement: 'planned W5-N25-d',
      currentStatus: 'Planned representation — no configuration store or decision runtime',
      customerVisibility: 'not customer-visible — planned',
    }),
    row({
      artifactId: 'config-candidate-gate-representation',
      artifact: 'Candidate gate configuration representation — planned',
      kind: 'state',
      owner: 'notification-delivery',
      purpose: 'Inventory planned candidate gate as configuration artifact',
      decisionRole: 'configuration-representation',
      classification: 'CONFIGURATION',
      honestyRequirement:
        'Candidate gate config ≠ Runtime Scheduler, Retry Engine, or decision engine',
      futureW5N25Responsibility: 'W5-N25-b',
      persistenceRequirement: 'planned W5-N25-b',
      recoveryRequirement: 'planned W5-N25-c',
      evidencePath: PKG,
      customerVisibility: 'not customer-visible — planned',
    }),
    row({
      artifactId: 'config-calc-eligibility-scheduling-binding',
      artifact: 'Calc+eligibility+scheduling binding configuration representation — planned',
      kind: 'state',
      owner: 'notification-delivery',
      purpose:
        'Inventory planned binding between decision rules and calc+eligibility+scheduling inputs',
      decisionRole: 'configuration-representation',
      classification: 'CONFIGURATION',
      honestyRequirement: 'Does not authorize runtime decision logic or scheduling decisions',
      futureW5N25Responsibility: 'W5-N25-b',
      persistenceRequirement: 'planned W5-N25-b',
      recoveryRequirement: 'planned W5-N25-c',
      dependencies: [
        'consume-w5-n22-retry-backoff-calculation-anchor',
        'consume-w5-n23-retry-eligibility-anchor',
        'consume-w5-n24-retry-scheduling-anchor',
      ],
      evidencePath: PKG,
      customerVisibility: 'not customer-visible — planned',
    }),

    // DECISION
    row({
      artifactId: 'decision-candidate-model-representation',
      artifact: 'Whether-to-schedule candidate model representation — planned',
      kind: 'projection',
      owner: 'notification-delivery',
      purpose: 'Inventory planned decision candidate model as informational output',
      decisionRole: 'decision-representation',
      classification: 'DECISION',
      honestyRequirement:
        'DECISION output is informational — does not make scheduling decisions or execute retries',
      futureW5N25Responsibility: 'W5-N25-b',
      persistenceRequirement: 'planned W5-N25-b',
      recoveryRequirement: 'planned W5-N25-c',
      operationalRequirement: 'planned W5-N25-d',
      dependencies: ['config-decision-rule-representation'],
      currentStatus: 'Planned — existsToday false; informational until consumed by future slices',
      customerVisibility: 'not customer-visible — planned',
    }),
    row({
      artifactId: 'decision-informational-output',
      artifact: 'Informational decision output — planned',
      kind: 'projection',
      owner: 'notification-delivery',
      purpose: 'Describe planned informational whether-to-schedule decision for consumers',
      decisionRole: 'decision-representation',
      classification: 'DECISION',
      honestyRequirement: 'Output informational until consumed by future approved slices',
      futureW5N25Responsibility: 'honesty-baseline',
      customerVisibility: 'not customer-visible — planned',
    }),
    row({
      artifactId: 'decision-whether-to-schedule-descriptor',
      artifact: 'Whether-to-schedule descriptor representation — planned',
      kind: 'projection',
      owner: 'notification-delivery',
      purpose:
        'Inventory planned descriptor of whether an eligible retry should become a schedule candidate',
      decisionRole: 'decision-representation',
      classification: 'DECISION',
      honestyRequirement: 'Whether-to-schedule descriptor ≠ orchestration or worker execution',
      futureW5N25Responsibility: 'W5-N25-c',
      persistenceRequirement: 'planned W5-N25-b',
      recoveryRequirement: 'planned W5-N25-c',
      dependencies: [
        'consume-w5-n22-retry-backoff-calculation-anchor',
        'consume-w5-n23-retry-eligibility-anchor',
        'consume-w5-n24-retry-scheduling-anchor',
      ],
      evidencePath: PKG,
      customerVisibility: 'not customer-visible — planned',
    }),

    // Commands / runtime / operator / persistence candidate / state
    row({
      artifactId: 'command-inventory-decision-surfaces',
      artifact: 'Inventory command — enumerate decision surfaces',
      kind: 'command',
      owner: 'wave-5-documentation',
      purpose: 'Document inventory-only discovery command surface (no runtime mutation)',
      decisionRole: 'inventory-discovery',
      classification: 'EPHEMERAL',
      honestyRequirement: 'Inventory command ≠ runtime decision command',
      futureW5N25Responsibility: 'honesty-baseline',
      capabilityCategory: 'implemented-today',
      honestProductState: 'implemented-today',
      currentStatus: 'Implemented as machine inventory only — no production command bus',
      evidencePath:
        'apps/api/src/platform-conformance/w5-n25-a-retry-scheduling-decision-inventory.ts',
      existsToday: true,
      operationalVisibility: 'documentation / conformance only',
      customerVisibility: 'not customer-visible',
    }),
    row({
      artifactId: 'runtime-pc06-resolve-delivery-routing',
      artifact: 'PC-06 resolve-delivery-routing runtime — consumed',
      kind: 'runtime',
      owner: 'notification-product',
      purpose: 'Confirm routing runtime remains SoT; decision does not own routing',
      decisionRole: 'consumed-runtime',
      classification: 'RECOVERABLE',
      honestyRequirement: 'No runtime decision logic introduced',
      futureW5N25Responsibility: 'honesty-baseline',
      persistenceRequirement: 'consumed-not-owned',
      recoveryRequirement: 'consumed-not-owned',
      operationalRequirement: 'platform-readiness',
      evidencePath: SVC,
      existsToday: true,
    }),
    row({
      artifactId: 'runtime-no-runtime-scheduler',
      artifact: 'Runtime Scheduler process — absent',
      kind: 'runtime',
      owner: 'notification-delivery',
      purpose: 'Explicitly record absence of Runtime Scheduler process',
      decisionRole: 'absent-runtime',
      classification: 'NON-RECOVERABLE',
      honestyRequirement: 'No Runtime Scheduler',
      futureW5N25Responsibility: 'out-of-scope-runtime-scheduler',
      capabilityCategory: 'not-implemented',
      currentStatus: 'Absent — no Runtime Scheduler process',
      customerVisibility: 'not customer-visible — absent',
    }),
    row({
      artifactId: 'runtime-no-runtime-decision-engine',
      artifact: 'Runtime decision engine process — absent',
      kind: 'runtime',
      owner: 'notification-delivery',
      purpose: 'Explicitly record absence of runtime decision engine process',
      decisionRole: 'absent-runtime',
      classification: 'NON-RECOVERABLE',
      honestyRequirement: 'No runtime decision engine',
      futureW5N25Responsibility: 'out-of-scope-runtime-decision-engine',
      capabilityCategory: 'not-implemented',
      currentStatus: 'Absent — no runtime decision engine process',
      customerVisibility: 'not customer-visible — absent',
    }),
    row({
      artifactId: 'operator-visible-decision-none',
      artifact: 'Operator-visible decision UI — none',
      kind: 'operator-visible',
      owner: 'command-center',
      purpose: 'Confirm no customer/operator decision UI from slice a',
      decisionRole: 'operator-gap',
      classification: 'EPHEMERAL',
      honestyRequirement: 'No customer-visible feature from W5-N25-a',
      futureW5N25Responsibility: 'out-of-scope-platform-decision-slice-a',
      evidencePath: OVR,
      customerVisibility: 'not customer-visible — absent',
    }),
    row({
      artifactId: 'projection-platform-readiness-decision-missing',
      artifact: 'Platform Readiness notificationPlatformRetrySchedulingDecision — missing',
      kind: 'projection',
      owner: 'platform-readiness',
      purpose: 'Record that decision readiness projection is absent on Platform Readiness',
      decisionRole: 'readiness-projection-gap',
      classification: 'EPHEMERAL',
      honestyRequirement:
        'Derived readiness only when present; does not authorize runtime decision logic',
      futureW5N25Responsibility: 'W5-N25-d',
      operationalRequirement: 'planned W5-N25-d',
      capabilityCategory: 'not-implemented',
      honestProductState: 'not-implemented',
      evidencePath: PKG,
      existsToday: false,
      customerVisibility: 'operator Platform Readiness only — decision field absent',
    }),
    row({
      artifactId: 'persist-candidate-decision-anchor',
      artifact:
        'WorkspaceNotificationPlatformRetrySchedulingDecisionAnchor — durable decision anchors (W5-N25-b)',
      kind: 'persistence-candidate',
      owner: 'notification-delivery',
      purpose: 'Durable whether-to-schedule decision anchor on notification-delivery owner',
      decisionRole: 'durable-anchor',
      classification: 'RECOVERABLE',
      honestyRequirement:
        'Persistence only; not runtime decision logic; not scheduling/eligibility/backoff/execution',
      futureW5N25Responsibility: 'honesty-baseline',
      persistenceRequirement: 'notification-delivery',
      recoveryRequirement: 'planned W5-N25-c',
      operationalRequirement: 'planned W5-N25-d',
      capabilityCategory: 'infrastructure-only',
      honestProductState: 'infrastructure-only',
      currentStatus:
        'Implemented — durable decision description anchors; restart recovery deferred to W5-N25-c',
      evidencePath: N25B_PRISMA,
      existsToday: true,
      customerVisibility: 'not customer-visible — infrastructure only',
    }),
    row({
      artifactId: 'state-n24-scheduling-anchor-reference',
      artifact: 'N24 scheduling anchor state — reference substrate',
      kind: 'state',
      owner: 'w5-n24-reference',
      purpose: 'Reference Closed N24 durable scheduling state for decision inventory',
      decisionRole: 'consumed-state',
      classification: 'RECOVERABLE',
      honestyRequirement: 'Reference only; N24 not reopened',
      futureW5N25Responsibility: 'w5-n24-reference',
      persistenceRequirement: 'w5-n24-reference',
      recoveryRequirement: 'w5-n24-reference',
      operationalRequirement: 'w5-n24-reference',
      dependencies: ['consume-w5-n24-retry-scheduling-anchor'],
      evidencePath: PKG,
      existsToday: false,
    }),
    row({
      artifactId: 'state-n22-backoff-calculation-anchor-reference',
      artifact: 'N22 backoff calculation anchor state — reference substrate',
      kind: 'state',
      owner: 'w5-n22-reference',
      purpose: 'Reference Closed N22 durable calculation state for decision inventory',
      decisionRole: 'consumed-state',
      classification: 'RECOVERABLE',
      honestyRequirement: 'Reference only; N22 not reopened',
      futureW5N25Responsibility: 'w5-n22-reference',
      persistenceRequirement: 'w5-n22-reference',
      recoveryRequirement: 'w5-n22-reference',
      operationalRequirement: 'w5-n22-reference',
      dependencies: ['consume-w5-n22-retry-backoff-calculation-anchor'],
      evidencePath: PKG,
      existsToday: false,
    }),
    row({
      artifactId: 'state-n23-eligibility-anchor-reference',
      artifact: 'N23 eligibility anchor state — reference substrate',
      kind: 'state',
      owner: 'w5-n23-reference',
      purpose: 'Reference Closed N23 durable eligibility state for decision inventory',
      decisionRole: 'consumed-state',
      classification: 'RECOVERABLE',
      honestyRequirement: 'Reference only; N23 not reopened',
      futureW5N25Responsibility: 'w5-n23-reference',
      persistenceRequirement: 'w5-n23-reference',
      recoveryRequirement: 'w5-n23-reference',
      operationalRequirement: 'w5-n23-reference',
      dependencies: ['consume-w5-n23-retry-eligibility-anchor'],
      evidencePath: PKG,
      existsToday: false,
    }),

    // Honesty boundaries (≥12)
    honesty(
      'honesty-inventory-only-not-runtime-decision-logic',
      'Honesty — inventory only; not runtime decision logic',
      'Inventory does not perform runtime decision logic',
      'out-of-scope-runtime-decision-logic',
    ),
    honesty(
      'honesty-inventory-only-not-scheduling-decisions',
      'Honesty — inventory only; not scheduling decisions',
      'Inventory does not make scheduling decisions',
      'out-of-scope-scheduling-decisions',
    ),
    honesty(
      'honesty-inventory-only-not-eligibility-determination',
      'Honesty — inventory only; not eligibility determination',
      'Inventory does not determine eligibility',
      'out-of-scope-eligibility-determination',
    ),
    honesty(
      'honesty-inventory-only-not-backoff-calculation',
      'Honesty — inventory only; not backoff calculation',
      'Inventory does not perform backoff calculation',
      'out-of-scope-backoff-calculation',
    ),
    honesty(
      'honesty-inventory-only-not-runtime-scheduling',
      'Honesty — inventory only; not runtime scheduling',
      'Inventory does not perform runtime scheduling',
      'out-of-scope-runtime-scheduling',
    ),
    honesty(
      'honesty-inventory-only-not-schedule-retries',
      'Honesty — inventory only; not schedule retries',
      'Inventory does not schedule retries',
      'out-of-scope-runtime-scheduling',
    ),
    honesty(
      'honesty-inventory-only-not-execution',
      'Honesty — inventory only; not retry execution',
      'Inventory does not execute retries',
      'out-of-scope-retry-execution',
    ),
    honesty(
      'honesty-inventory-only-not-retry-lifecycle',
      'Honesty — inventory only; not retry lifecycle',
      'Inventory does not own retry lifecycle',
      'out-of-scope-retry-lifecycle',
    ),
    honesty(
      'honesty-inventory-only-not-timers',
      'Honesty — inventory only; not timers',
      'Inventory does not own timers',
      'out-of-scope-timers',
    ),
    honesty(
      'honesty-inventory-only-not-workers',
      'Honesty — inventory only; not workers',
      'Inventory does not own workers',
      'out-of-scope-workers',
    ),
    honesty(
      'honesty-inventory-only-not-orchestration',
      'Honesty — inventory only; not orchestration',
      'Inventory does not own orchestration',
      'out-of-scope-retry-orchestration',
    ),
    honesty(
      'honesty-inventory-output-informational',
      'Honesty — inventory output informational only',
      'Inventory output informational only',
      'honesty-baseline',
    ),
    honesty(
      'honesty-no-runtime-scheduler',
      'Honesty — no Runtime Scheduler',
      'No Runtime Scheduler',
      'out-of-scope-runtime-scheduler',
    ),
    honesty(
      'honesty-no-retry-engine',
      'Honesty — no Retry Engine',
      'No Retry Engine',
      'out-of-scope-retry-engine',
    ),
    honesty(
      'honesty-no-runtime-decision-engine',
      'Honesty — no runtime decision engine',
      'No runtime decision engine',
      'out-of-scope-runtime-decision-engine',
    ),
    honesty(
      'honesty-no-timer-implementation',
      'Honesty — no timer implementation',
      'No timer implementation from inventory',
      'out-of-scope-timer-implementation',
    ),

    // Explicit OUT
    out(
      'out-runtime-decision-logic',
      'Runtime decision logic — OUT',
      'No runtime decision logic from inventory',
      'out-of-scope-runtime-decision-logic',
    ),
    out(
      'out-scheduling-decisions',
      'Scheduling decisions — OUT',
      'Inventory does not make scheduling decisions',
      'out-of-scope-scheduling-decisions',
    ),
    out(
      'out-runtime-scheduling',
      'Runtime scheduling — OUT of inventory slice (discovery only)',
      'Inventory does not perform runtime scheduling',
      'out-of-scope-runtime-scheduling',
    ),
    out(
      'out-backoff-calculation',
      'Backoff calculation — OUT of decision slice',
      'Inventory does not perform backoff calculation',
      'out-of-scope-backoff-calculation',
    ),
    out(
      'out-eligibility-determination',
      'Eligibility determination — OUT of decision slice',
      'Inventory does not determine eligibility',
      'out-of-scope-eligibility-determination',
    ),
    out(
      'out-retry-execution',
      'Retry execution — OUT of decision slice',
      'Inventory does not execute retries',
      'out-of-scope-retry-execution',
    ),
    out(
      'out-retry-workers',
      'Retry workers — OUT',
      'Inventory does not own workers',
      'out-of-scope-workers',
    ),
    out(
      'out-retry-lifecycle',
      'Retry lifecycle — OUT',
      'Inventory does not own retry lifecycle',
      'out-of-scope-retry-lifecycle',
    ),
    out(
      'out-retry-orchestration',
      'Retry orchestration — OUT',
      'No orchestration platform',
      'out-of-scope-retry-orchestration',
    ),
    out(
      'out-scheduler',
      'Scheduler — OUT',
      'No Runtime Scheduler from decision inventory',
      'out-of-scope-scheduler',
    ),
    out('out-timers', 'Timers — OUT', 'No timers from decision inventory', 'out-of-scope-timers'),
    out(
      'out-w5-n25-b',
      'W5-N25-b Durable Persistence — OUT of slice a',
      'Slice a does not authorize W5-N25-b',
      'W5-N25-b',
      'EPHEMERAL',
    ),
    out(
      'out-w5-n25-c',
      'W5-N25-c Restart Recovery — OUT of slice a',
      'Slice a does not authorize W5-N25-c',
      'W5-N25-c',
      'EPHEMERAL',
    ),
    out(
      'out-w5-n25-d',
      'W5-N25-d Operational Continuity — OUT of slice a',
      'Slice a does not authorize W5-N25-d',
      'W5-N25-d',
      'EPHEMERAL',
    ),
    out(
      'out-w5-n25-e',
      'W5-N25-e Close Evidence — OUT of slice a',
      'Slice a does not authorize W5-N25-e',
      'W5-N25-e',
      'EPHEMERAL',
    ),
    out(
      'out-runtime-scheduler',
      'Runtime Scheduler — OUT',
      'No Runtime Scheduler',
      'out-of-scope-runtime-scheduler',
    ),
    out(
      'out-runtime-decision-engine',
      'Runtime decision engine — OUT',
      'No runtime decision engine',
      'out-of-scope-runtime-decision-engine',
    ),
    out('out-retry-engine', 'Retry Engine — OUT', 'No Retry Engine', 'out-of-scope-retry-engine'),
    out(
      'out-timer-implementation',
      'Timer implementation — OUT',
      'No Timer implementation',
      'out-of-scope-timer-implementation',
    ),
    out(
      'out-retry-platform',
      'Retry Platform — OUT',
      'No Retry Platform',
      'out-of-scope-retry-platform',
    ),
    out(
      'out-notification-platform-complete',
      'Notification Platform Complete — OUT',
      'Notification Platform Complete — not claimed',
      'out-of-scope-notification-platform-complete',
    ),
    out(
      'out-live-trading-wave6',
      'Live Trading Wave 6 — OUT',
      'Live Trading Wave 6 — out of scope',
      'out-of-scope-live-trading',
      'NON-RECOVERABLE',
      'live-trading-deferred',
    ),
    out(
      'out-w5-n22-reopen',
      'W5-N22 reopen — forbidden',
      'W5-N22 reopen — forbidden',
      'out-of-scope-w5-n22-reopen',
    ),
    out(
      'out-w5-n23-reopen',
      'W5-N23 reopen — forbidden',
      'W5-N23 reopen — forbidden',
      'out-of-scope-w5-n23-reopen',
    ),
    out(
      'out-w5-n24-reopen',
      'W5-N24 reopen — forbidden',
      'W5-N24 reopen — forbidden',
      'out-of-scope-w5-n24-reopen',
    ),
    out(
      'out-wave-5-complete',
      'Wave 5 COMPLETE — OUT',
      'Wave 5 COMPLETE — not claimed',
      'out-of-scope-wave-5-complete',
    ),

    // Extra coverage
    row({
      artifactId: 'dep-w5-n22-inventory-reference',
      artifact: 'W5-N22-a machine inventory — reference pattern',
      kind: 'dependency',
      owner: 'w5-n22-reference',
      purpose: 'Reuse N22 inventory pattern as reference only',
      decisionRole: 'reference-pattern',
      classification: 'RECOVERABLE',
      honestyRequirement: 'Reference only; N22 not reopened',
      futureW5N25Responsibility: 'w5-n22-reference',
      persistenceRequirement: 'consumed-not-owned',
      recoveryRequirement: 'consumed-not-owned',
      evidencePath: N22I,
      existsToday: true,
      operationalVisibility: 'conformance-only',
      customerVisibility: 'not customer-visible',
    }),
    row({
      artifactId: 'dep-w5-n23-inventory-reference',
      artifact: 'W5-N23-a machine inventory — reference pattern',
      kind: 'dependency',
      owner: 'w5-n23-reference',
      purpose: 'Reuse N23 inventory pattern as reference only',
      decisionRole: 'reference-pattern',
      classification: 'RECOVERABLE',
      honestyRequirement: 'Reference only; N23 not reopened',
      futureW5N25Responsibility: 'w5-n23-reference',
      persistenceRequirement: 'consumed-not-owned',
      recoveryRequirement: 'consumed-not-owned',
      evidencePath: N23I,
      existsToday: true,
      operationalVisibility: 'conformance-only',
      customerVisibility: 'not customer-visible',
    }),
    row({
      artifactId: 'dep-w5-n24-inventory-reference',
      artifact: 'W5-N24-a machine inventory — reference pattern',
      kind: 'dependency',
      owner: 'w5-n24-reference',
      purpose: 'Reuse N24 inventory pattern as reference only',
      decisionRole: 'reference-pattern',
      classification: 'RECOVERABLE',
      honestyRequirement: 'Reference only; N24 not reopened',
      futureW5N25Responsibility: 'w5-n24-reference',
      persistenceRequirement: 'consumed-not-owned',
      recoveryRequirement: 'consumed-not-owned',
      evidencePath: N24I,
      existsToday: true,
      operationalVisibility: 'conformance-only',
      customerVisibility: 'not customer-visible',
    }),
    row({
      artifactId: 'dep-production-transports-deferred',
      artifact: 'Production transports TD-049 / TD-050 — deferred',
      kind: 'dependency',
      owner: 'notification-delivery',
      purpose: 'Record production transport deferral remains binding',
      decisionRole: 'deferred-dependency',
      classification: 'NON-RECOVERABLE',
      honestyRequirement: 'Production transports deferred',
      futureW5N25Responsibility: 'out-of-scope-production-transport-i/o',
      capabilityCategory: 'future-roadmap',
      honestProductState: 'deferred',
      currentStatus: 'Deferred — TD-049 / TD-050 unchanged by decision inventory',
      evidencePath: PKG,
      existsToday: true,
      operationalVisibility: 'deferred',
      customerVisibility: 'not customer-visible — deferred',
    }),
    row({
      artifactId: 'operational-inventory-slice-a-open',
      artifact: 'W5-N25-a inventory slice operational record',
      kind: 'operational',
      owner: 'wave-5-documentation',
      purpose: 'Mark slice a inventory baseline as operational documentation state',
      decisionRole: 'inventory-operational',
      classification: 'EPHEMERAL',
      honestyRequirement: 'Does not authorize decision functional',
      futureW5N25Responsibility: 'honesty-baseline',
      operationalRequirement: 'honesty-baseline',
      capabilityCategory: 'implemented-today',
      honestProductState: 'implemented-today',
      currentStatus: 'Open — inventory/discovery only',
      evidencePath: PKG,
      existsToday: true,
      operationalVisibility: 'documentation-only',
      customerVisibility: 'not customer-visible',
    }),
    out(
      'out-ai-gateway',
      'AI Gateway / Anthropic — OUT',
      'AI Gateway out of W5-N25 scope',
      'out-of-scope-ai-gateway',
      'NON-RECOVERABLE',
      'ai-gateway-deferred',
    ),
    out(
      'out-exchange-adapter-modification',
      'Exchange Adapter modification — OUT',
      'No Exchange Adapter modification',
      'out-of-scope-exchange-adapter',
      'NON-RECOVERABLE',
      'exchange-adapter',
    ),
  ]);

export const W5_N25_A_BINDING_FINDINGS = Object.freeze({
  decisionFunctionalAuthorized: false,
  decisionFunctionsAfterSliceA: false,
  customerVisibleFeatureFromSliceA: false,
  w5N17DeliveryReliabilityExists: true,
  w5N18RetryExecutionExists: true,
  w5N19RetrySchedulingExists: true,
  w5N20RetryPolicyExists: true,
  w5N21RetryBackoffExists: true,
  w5N22RetryBackoffCalculationExists: true,
  w5N23RetryEligibilityExists: true,
  w5N24RetrySchedulingExists: true,
  unifiedPlatformDecisionLayerMissing: true,
  decisionPersistenceMissing: false,
  decisionRecoveryMissing: true,
  decisionOperationalContinuityMissing: true,
  productionTransportsDeferred: true,
  inventoryDoesNotMakeSchedulingDecisions: true,
  inventoryDoesNotPerformRuntimeDecisionLogic: true,
  inventoryDoesNotPerformBackoffCalculation: true,
  inventoryDoesNotDetermineEligibility: true,
  inventoryDoesNotScheduleRetries: true,
  inventoryDoesNotExecuteRetries: true,
  inventoryDoesNotOwnRetryLifecycle: true,
  inventoryDoesNotOwnTimers: true,
  inventoryDoesNotOwnWorkers: true,
  inventoryDoesNotOwnOrchestration: true,
  inventoryOutputInformationalOnly: true,
  ownershipBoundariesVerified: true,
  ownershipBoundariesChanged: false,
  architecturalDeviations: false,
} as const);

export const W5_N25_A_EXPLICIT_OUT = Object.freeze([
  'runtime-decision-logic',
  'scheduling-decisions',
  'runtime-scheduling',
  'eligibility-determination',
  'backoff-calculation',
  'retry-execution',
  'retry-workers',
  'retry-lifecycle',
  'retry-orchestration',
  'runtime-scheduler',
  'runtime-decision-engine',
  'timers',
  'timer-implementation',
  'production-transport-i/o',
  'notification-platform-complete',
  'live-trading-enablement',
  'w5-n25-b',
  'w5-n25-c',
  'w5-n25-d',
  'w5-n25-e',
  'w5-n25-complete',
  'wave-5-complete',
  'retry-engine',
  'runtime-scheduler-product',
  'worker-product',
  'scheduler-platform',
  'workflow-engine',
  'event-bus-product',
  'orchestration-platform',
  'w5-n17-reopen',
  'w5-n18-reopen',
  'w5-n19-reopen',
  'w5-n20-reopen',
  'w5-n21-reopen',
  'w5-n22-reopen',
  'w5-n23-reopen',
  'w5-n24-reopen',
  'master-plan-revision',
  'version-2-redesign',
  'ownership-change',
  'new-persistence-owner',
  'new-bounded-context',
  'exchange-adapter-modification',
  'ai-gateway',
] as const);

export const W5_N25_A_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateSchedulingSubsystem: false,
  duplicateDecisionSubsystem: false,
  duplicateRetrySubsystem: false,
  duplicateRoutingEngine: false,
  retryEngineIntroduced: false,
  runtimeSchedulerIntroduced: false,
  runtimeDecisionEngineIntroduced: false,
  workerIntroduced: false,
  timerImplementationIntroduced: false,
  schedulerPlatformIntroduced: false,
  workflowEngineIntroduced: false,
  eventBusProductIntroduced: false,
  orchestrationPlatformIntroduced: false,
  runtimeSchedulingIntroduced: false,
  runtimeDecisionLogicIntroduced: false,
  notificationControlPlane: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  wave3Modified: false,
  wave4Modified: false,
  exchangeAdapterUntouched: true,
  inventoryOnly: true,
  w5N25CompleteClaimed: false,
  decisionFunctionalClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
  liveTradingClaimed: false,
  liveNotificationsClaimed: false,
  productionReadyClaimed: false,
  customerVisibleFeature: false,
  w5N17Reopened: false,
  w5N18Reopened: false,
  w5N19Reopened: false,
  w5N20Reopened: false,
  w5N21Reopened: false,
  w5N22Reopened: false,
  w5N23Reopened: false,
  w5N24Reopened: false,
} as const);

export const W5_N25_A_HONEST_PRODUCT_BASELINE = Object.freeze({
  implementedCapabilities: Object.freeze([
    'None — W5-N25-a inventory only; no customer-visible decision feature',
  ] as const),
  infrastructureCapabilities: Object.freeze([
    'Per-channel N01…N04 notification anchors on notification-delivery owner',
    'W5-N05…N16 platform foundations on notification-delivery owner (consumed)',
    'W5-N17 delivery reliability inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N18 retry execution inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N19 retry scheduling foundation substrate (consumed)',
    'W5-N20 retry policy inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N21 retry backoff inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N22 retry backoff calculation inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N23 retry eligibility inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N24 retry scheduling inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N24 retry scheduling inventory, durable anchors, recovery, and continuity (consumed)',
    'PC-06 resolve-delivery-routing — routing SoT consumed unchanged',
    'PC-07 notification-product — per-channel settings and history',
    'Notification Durable Queue — W3-O02 on notification-delivery owner (consumed)',
    'W5-N01…N24 machine inventories — foundation reference patterns',
    'Exchange Adapter / Wave 4 — reference only; untouched',
  ] as const),
  plannedCapabilities: Object.freeze([
    'Repository Synchronization after Product Owner Final Close',
  ] as const),
  notYetImplementedCapabilities: Object.freeze([
    'Unified cross-channel platform decision layer after calc+eligibility+scheduling',
    'Operator decision UI',
    'Runtime decision logic',
    'Scheduling decisions',
    'Runtime Scheduler',
    'Runtime decision engine',
    'Retry Engine',
    'Transport execution / provider runtimes',
    'Production transport I/O (TD-049 / TD-050)',
    'Notification Platform Complete',
  ] as const),
  futureRoadmapCapabilities: Object.freeze([
    'Wave 6 — Live Trading (LT-02)',
    'Wave 7 — Anthropic / AI Gateway (out of W5-N25 scope)',
  ] as const),
} as const);

export const W5_N25_A_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'Notification Retry Scheduling Decision inventory baseline established',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'Persistence Foundation (W5-N25-b)',
    'Restart Recovery Foundation (W5-N25-c)',
    'Operational Continuity Foundation (W5-N25-d)',
    'Package Validation & Operational Verification (W5-N25-e)',
  ] as const),
} as const);

export function artifactIds(): readonly string[] {
  return W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.map((entry) => entry.artifactId);
}

export function rowsByKind(kind: W5N25AArtifactKind): readonly W5N25AInventoryRow[] {
  return W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.filter((entry) => entry.kind === kind);
}

export function rowsByClassification(
  classification: W5N25ADecisionClassification,
): readonly W5N25AInventoryRow[] {
  return W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.filter(
    (entry) => entry.classification === classification,
  );
}

export function rowsRecoverable(): readonly W5N25AInventoryRow[] {
  return rowsByClassification('RECOVERABLE');
}

export function rowsEphemeral(): readonly W5N25AInventoryRow[] {
  return rowsByClassification('EPHEMERAL');
}

export function rowsDecision(): readonly W5N25AInventoryRow[] {
  return rowsByClassification('DECISION');
}

export function rowsConfiguration(): readonly W5N25AInventoryRow[] {
  return rowsByClassification('CONFIGURATION');
}

export function rowsNonRecoverable(): readonly W5N25AInventoryRow[] {
  return rowsByClassification('NON-RECOVERABLE');
}

export function rowsHonestyBoundaries(): readonly W5N25AInventoryRow[] {
  return W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.filter(
    (entry) => entry.kind === 'honesty-boundary',
  );
}

export function rowsExplicitOut(): readonly W5N25AInventoryRow[] {
  return W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.filter(
    (entry) => entry.kind === 'explicit-out',
  );
}

export function rowsByCapabilityCategory(
  category: W5N25ACapabilityCategory,
): readonly W5N25AInventoryRow[] {
  return W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.filter(
    (entry) => entry.capabilityCategory === category,
  );
}
