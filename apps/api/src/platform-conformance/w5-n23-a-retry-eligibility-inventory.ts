/**
 * w5-n23-a — Notification Retry Eligibility Inventory & Honest Product Baseline.
 *
 * Discovery and classification only.
 * Not Notification Retry Eligibility implementation. Not production transport I/O.
 * Not eligibility evaluation runtime / backoff calculation / scheduling / execution /
 * retry lifecycle / timers / workers / orchestration.
 * Not Eligibility Engine / Retry Engine / Retry Platform / Workflow Engine / Event Bus.
 * Not W5-N23 COMPLETE. Not Notification Platform Complete. Not Wave 5 CLOSED.
 *
 * Classifications: ELIGIBILITY | CONFIGURATION | EPHEMERAL | RECOVERABLE | NON-RECOVERABLE
 * W5-N01…N22 foundations consumed as reference patterns only — not reopened.
 */

export const W5_N23_A_SLICE_ID = 'W5-N23-a' as const;

export const W5_N23_A_ALLOWED_OWNERS = Object.freeze([
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
  'ai-gateway-deferred',
  'live-trading-deferred',
  'strategy-trading-pipeline',
] as const);

export type W5N23AOwner = (typeof W5_N23_A_ALLOWED_OWNERS)[number];

export const W5_N23_A_SUBSTRATE_OWNERS = Object.freeze([
  'notification-delivery',
  'notification-product',
  'connection-management',
  'secret-vault',
  'platform-readiness',
] as const);

export const W5_N23_A_ARTIFACT_KINDS = Object.freeze([
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

export type W5N23AArtifactKind = (typeof W5_N23_A_ARTIFACT_KINDS)[number];
export const W5_N23_A_REQUIRED_ARTIFACT_KINDS = W5_N23_A_ARTIFACT_KINDS;

export const W5_N23_A_CAPABILITY_CATEGORIES = Object.freeze([
  'implemented-today',
  'infrastructure-only',
  'planned',
  'not-implemented',
  'future-roadmap',
] as const);

export type W5N23ACapabilityCategory = (typeof W5_N23_A_CAPABILITY_CATEGORIES)[number];

export const W5_N23_A_ELIGIBILITY_CLASSIFICATIONS = Object.freeze([
  'ELIGIBILITY',
  'CONFIGURATION',
  'EPHEMERAL',
  'RECOVERABLE',
  'NON-RECOVERABLE',
] as const);

export type W5N23AEligibilityClassification = (typeof W5_N23_A_ELIGIBILITY_CLASSIFICATIONS)[number];

export const W5_N23_A_HONEST_PRODUCT_STATES = Object.freeze([
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

export type W5N23AHonestProductState = (typeof W5_N23_A_HONEST_PRODUCT_STATES)[number];

export const W5_N23_A_FUTURE_RESPONSIBILITIES = Object.freeze([
  'W5-N23-b',
  'W5-N23-c',
  'W5-N23-d',
  'W5-N23-e',
  'honesty-baseline',
  'out-of-scope-live-trading',
  'out-of-scope-platform-eligibility-slice-a',
  'out-of-scope-eligibility-evaluation',
  'out-of-scope-backoff-calculation',
  'out-of-scope-production-transport-i/o',
  'out-of-scope-exchange-adapter',
  'out-of-scope-w5-n23-complete',
  'out-of-scope-wave-5-complete',
  'out-of-scope-notification-platform-complete',
  'out-of-scope-w5-n17-reopen',
  'out-of-scope-w5-n18-reopen',
  'out-of-scope-w5-n19-reopen',
  'out-of-scope-w5-n20-reopen',
  'out-of-scope-w5-n21-reopen',
  'out-of-scope-w5-n22-reopen',
  'out-of-scope-ai-gateway',
  'out-of-scope-eligibility-engine',
  'out-of-scope-retry-engine',
  'out-of-scope-retry-platform',
  'out-of-scope-retry-orchestration',
  'out-of-scope-retry-execution',
  'out-of-scope-retry-scheduling',
  'out-of-scope-retry-lifecycle',
  'out-of-scope-timers',
  'out-of-scope-workers',
  'out-of-scope-scheduler',
  'out-of-scope-runtime-eligibility',
  'w5-n17-reference',
  'w5-n18-reference',
  'w5-n19-reference',
  'w5-n20-reference',
  'w5-n21-reference',
  'w5-n22-reference',
] as const);

export type W5N23AFutureResponsibility = (typeof W5_N23_A_FUTURE_RESPONSIBILITIES)[number];

export type W5N23AInventoryRow = Readonly<{
  artifactId: string;
  artifact: string;
  kind: W5N23AArtifactKind;
  owner: W5N23AOwner;
  purpose: string;
  eligibilityRole: string;
  classification: W5N23AEligibilityClassification;
  persistenceRequirement: string;
  recoveryRequirement: string;
  operationalRequirement: string;
  dependencies: readonly string[];
  capabilityCategory: W5N23ACapabilityCategory;
  currentStatus: string;
  honestyRequirement: string;
  futureW5N23Responsibility: W5N23AFutureResponsibility;
  evidencePath: string;
  existsToday: boolean;
  authorizesEligibilityFunctional: false;
  authorizesW5N23Complete: false;
  honestProductState: W5N23AHonestProductState;
  operationalVisibility: string;
  customerVisibility: string;
}>;

const DOC = 'docs/project/version-3/wave-5/w5-n23-product-scope.md';
const PKG = 'docs/project/version-3/wave-5/w5-n23-implementation-package.md';
const OVR = 'docs/project/version-3/wave-5/w5-n23-overview.md';
const SEC = 'docs/project/version-3/wave-5/w5-n23-security-review.md';
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

type RowInput = {
  artifactId: string;
  artifact: string;
  kind: W5N23AArtifactKind;
  owner: W5N23AOwner;
  purpose: string;
  eligibilityRole: string;
  classification: W5N23AEligibilityClassification;
  honestyRequirement: string;
  futureW5N23Responsibility: W5N23AFutureResponsibility;
  persistenceRequirement?: string;
  recoveryRequirement?: string;
  operationalRequirement?: string;
  dependencies?: readonly string[];
  capabilityCategory?: W5N23ACapabilityCategory;
  currentStatus?: string;
  evidencePath?: string;
  existsToday?: boolean;
  honestProductState?: W5N23AHonestProductState;
  operationalVisibility?: string;
  customerVisibility?: string;
};

function row(input: RowInput): W5N23AInventoryRow {
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
        : classification === 'ELIGIBILITY' || classification === 'CONFIGURATION'
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
        : classification === 'ELIGIBILITY' || classification === 'CONFIGURATION' || isMissing
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
    eligibilityRole: input.eligibilityRole,
    classification,
    persistenceRequirement: input.persistenceRequirement ?? 'not-applicable',
    recoveryRequirement: input.recoveryRequirement ?? 'not-applicable',
    operationalRequirement: input.operationalRequirement ?? 'not-applicable',
    dependencies: Object.freeze([...(input.dependencies ?? [])]) as readonly string[],
    capabilityCategory,
    currentStatus:
      input.currentStatus ??
      (isOut
        ? 'Explicit OUT — must not authorize from W5-N23-a'
        : isHonesty
          ? 'Binding honesty frozen'
          : isMissing
            ? 'Missing — planned future slice'
            : 'Inventoried for W5-N23-a discovery'),
    honestyRequirement: input.honestyRequirement,
    futureW5N23Responsibility: input.futureW5N23Responsibility,
    evidencePath: input.evidencePath ?? DOC,
    existsToday: input.existsToday ?? false,
    authorizesEligibilityFunctional: false,
    authorizesW5N23Complete: false,
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
  owner: W5N23AOwner,
  purpose: string,
  classification: W5N23AEligibilityClassification,
  future: W5N23AFutureResponsibility,
  honesty: string,
  extra: Partial<RowInput> = {},
) =>
  row({
    artifactId,
    artifact,
    kind: 'ownership',
    owner,
    purpose,
    eligibilityRole: extra.eligibilityRole ?? 'ownership-boundary',
    classification,
    honestyRequirement: honesty,
    futureW5N23Responsibility: future,
    ...extra,
  });

const consume = (
  artifactId: string,
  artifact: string,
  owner: W5N23AOwner,
  future: W5N23AFutureResponsibility,
  evidencePath: string,
  purpose: string,
) =>
  row({
    artifactId,
    artifact,
    kind: 'dependency',
    owner,
    purpose,
    eligibilityRole: 'consumed-foundation',
    classification: 'RECOVERABLE',
    honestyRequirement: 'Consumed not redesigned; does not authorize eligibility functional',
    futureW5N23Responsibility: future,
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
  future: W5N23AFutureResponsibility,
) =>
  row({
    artifactId,
    artifact,
    kind: 'honesty-boundary',
    owner: 'wave-5-documentation',
    purpose: honestyRequirement,
    eligibilityRole: 'honesty-constraint',
    classification: 'NON-RECOVERABLE',
    honestyRequirement,
    futureW5N23Responsibility: future,
    existsToday: true,
    evidencePath: DOC,
  });

const out = (
  artifactId: string,
  artifact: string,
  honestyRequirement: string,
  future: W5N23AFutureResponsibility,
  classification: W5N23AEligibilityClassification = 'NON-RECOVERABLE',
  owner: W5N23AOwner = 'wave-5-documentation',
) =>
  row({
    artifactId,
    artifact,
    kind: 'explicit-out',
    owner,
    purpose: honestyRequirement,
    eligibilityRole: 'explicit-out',
    classification,
    honestyRequirement,
    futureW5N23Responsibility: future,
    evidencePath: classification === 'EPHEMERAL' ? PKG : DOC,
  });

export const W5_N23_A_RETRY_ELIGIBILITY_INVENTORY: readonly W5N23AInventoryRow[] = Object.freeze([
  // Ownership
  own(
    'own-platform-eligibility-layer',
    'Cross-channel Notification Retry Eligibility — notification-delivery owner',
    'notification-delivery',
    'Declare sole owner path for future eligibility foundation artifacts',
    'RECOVERABLE',
    'W5-N23-d',
    'Eligibility extends notification-delivery only; no Eligibility Engine or Retry Engine',
    {
      persistenceRequirement: 'notification-delivery',
      recoveryRequirement: 'notification-delivery',
      operationalRequirement: 'none-missing until W5-N23-d',
      currentStatus:
        'Owner path exists; unified eligibility runtime / persistence / recovery / continuity still absent',
      evidencePath: ND,
      existsToday: true,
    },
  ),
  own(
    'own-notification-delivery-domain',
    'Notification Delivery BC — sole owner for eligibility foundation artifacts',
    'notification-delivery',
    'Keep eligibility foundation inside existing notification-delivery BC',
    'RECOVERABLE',
    'honesty-baseline',
    'No new bounded context for eligibility',
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
    'Confirm eligibility consumes PC-06 routing and does not own it',
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
    'Delivery reliability ≠ eligibility; N17 not reopened',
    {
      eligibilityRole: 'consumed-foundation-ownership',
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
    'Retry execution ≠ eligibility; N18 not reopened',
    {
      eligibilityRole: 'consumed-foundation-ownership',
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
    'Retry scheduling ≠ eligibility; N19 not reopened',
    {
      eligibilityRole: 'consumed-foundation-ownership',
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
    'Retry policy ≠ eligibility; N20 not reopened',
    {
      eligibilityRole: 'consumed-foundation-ownership',
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
    'Retry backoff ≠ eligibility; N21 not reopened',
    {
      eligibilityRole: 'consumed-foundation-ownership',
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
    'Backoff calculation ≠ eligibility; N22 not reopened',
    {
      eligibilityRole: 'consumed-foundation-ownership',
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
    'own-secret-vault-consume',
    'Secret Vault — credential owner consumed only',
    'secret-vault',
    'Confirm eligibility does not store secrets',
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
    'Workspace Isolation — eligibility state workspace-scoped',
    'workspace-isolation',
    'Fail closed on missing workspace for any future eligibility state',
    'NON-RECOVERABLE',
    'honesty-baseline',
    'No cross-workspace eligibility state',
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
    'Consume durable queue substrate; not eligibility runtime',
    'RECOVERABLE',
    'honesty-baseline',
    'Queue substrate owner unchanged; not eligibility runtime',
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
    'Honest Product boundaries for Retry Eligibility Foundation',
    'wave-5-documentation',
    'Freeze binding honesty rules for eligibility-only slice a',
    'EPHEMERAL',
    'honesty-baseline',
    'Binding Honest Product rules frozen at planning and inventory',
    {
      eligibilityRole: 'honesty-baseline-ownership',
      capabilityCategory: 'implemented-today',
      honestProductState: 'binding-honesty',
      currentStatus:
        'Documented — Inventory ≠ eligibility evaluation / backoff calculation / scheduling / execution / lifecycle / timers / workers / orchestration',
      existsToday: true,
      operationalVisibility: 'documentation-only',
      customerVisibility: 'not customer-visible — documentation honesty',
    },
  ),

  // Consumed N17–N22
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
    'Consume Closed N21 backoff anchor as eligibility substrate reference',
  ),
  consume(
    'consume-w5-n22-retry-backoff-calculation-anchor',
    'W5-N22 retry backoff calculation durable anchor — consumed',
    'w5-n22-reference',
    'w5-n22-reference',
    N22,
    'Consume Closed N22 backoff calculation anchor as eligibility substrate reference',
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

  // Missing gaps (existsToday false — eligibility not yet built)
  row({
    artifactId: 'missing-unified-platform-eligibility-view',
    artifact: 'Unified platform eligibility view — missing',
    kind: 'ephemeral-artifact',
    owner: 'notification-delivery',
    purpose: 'Record absence of unified cross-channel eligibility view',
    eligibilityRole: 'missing-gap',
    classification: 'EPHEMERAL',
    honestyRequirement: 'Must not claim unified eligibility layer from inventory alone',
    futureW5N23Responsibility: 'W5-N23-d',
    persistenceRequirement: 'none-missing',
    recoveryRequirement: 'none-missing',
    operationalRequirement: 'none-missing',
    capabilityCategory: 'not-implemented',
    honestProductState: 'not-implemented',
    currentStatus: 'Missing — no unified platform eligibility view today',
    evidencePath: PKG,
    existsToday: false,
    customerVisibility: 'not customer-visible — absent',
  }),
  row({
    artifactId: 'missing-eligibility-persistence',
    artifact: 'Eligibility durable persistence — planned gap (W5-N23-b)',
    kind: 'persistence-candidate',
    owner: 'notification-delivery',
    purpose: 'Record planned durable eligibility persistence gap for W5-N23-b',
    eligibilityRole: 'missing-gap',
    classification: 'RECOVERABLE',
    honestyRequirement:
      'Planned W5-N23-b — persistence only; not eligibility evaluation runtime; not scheduling/execution',
    futureW5N23Responsibility: 'W5-N23-b',
    persistenceRequirement: 'planned W5-N23-b',
    recoveryRequirement: 'planned W5-N23-c',
    capabilityCategory: 'planned',
    honestProductState: 'planned',
    currentStatus: 'Missing — no eligibility durable persistence today',
    evidencePath: PKG,
    existsToday: false,
    customerVisibility: 'not customer-visible — planned gap',
  }),
  row({
    artifactId: 'missing-eligibility-recovery',
    artifact: 'Eligibility restart recovery — planned gap (W5-N23-c)',
    kind: 'ephemeral-artifact',
    owner: 'notification-delivery',
    purpose: 'Record planned eligibility recovery gap for W5-N23-c',
    eligibilityRole: 'missing-gap',
    classification: 'EPHEMERAL',
    honestyRequirement:
      'Planned W5-N23-c — recovery only; not eligibility evaluation runtime; not scheduling/execution',
    futureW5N23Responsibility: 'W5-N23-c',
    recoveryRequirement: 'planned W5-N23-c',
    evidencePath: PKG,
    existsToday: false,
    customerVisibility: 'not customer-visible — planned gap',
  }),
  row({
    artifactId: 'missing-eligibility-operational-continuity',
    artifact: 'Eligibility operational continuity — planned gap (W5-N23-d)',
    kind: 'operational',
    owner: 'platform-readiness',
    purpose: 'Record planned eligibility operational continuity gap for W5-N23-d',
    eligibilityRole: 'missing-gap',
    classification: 'EPHEMERAL',
    honestyRequirement:
      'Planned W5-N23-d — derived readiness only; not eligibility evaluation runtime',
    futureW5N23Responsibility: 'W5-N23-d',
    operationalRequirement: 'planned W5-N23-d',
    evidencePath: PKG,
    existsToday: false,
    customerVisibility: 'not customer-visible — planned gap',
  }),

  // CONFIGURATION
  row({
    artifactId: 'config-eligibility-rule-representation',
    artifact: 'Eligibility rule configuration representation — planned',
    kind: 'state',
    owner: 'notification-delivery',
    purpose: 'Represent how eligibility rules would be configured (inventory only)',
    eligibilityRole: 'configuration-representation',
    classification: 'CONFIGURATION',
    honestyRequirement: 'CONFIGURATION classification ≠ runtime eligibility evaluation',
    futureW5N23Responsibility: 'W5-N23-b',
    persistenceRequirement: 'planned W5-N23-b',
    recoveryRequirement: 'planned W5-N23-c',
    operationalRequirement: 'planned W5-N23-d',
    currentStatus: 'Planned representation — no configuration store or evaluation runtime',
    customerVisibility: 'not customer-visible — planned',
  }),
  row({
    artifactId: 'config-max-attempt-gate-representation',
    artifact: 'Max attempt gate configuration representation — planned',
    kind: 'state',
    owner: 'notification-delivery',
    purpose: 'Inventory planned max-attempt gate as configuration artifact',
    eligibilityRole: 'configuration-representation',
    classification: 'CONFIGURATION',
    honestyRequirement: 'Max-attempt gate config ≠ scheduler or worker ownership',
    futureW5N23Responsibility: 'W5-N23-b',
    persistenceRequirement: 'planned W5-N23-b',
    recoveryRequirement: 'planned W5-N23-c',
    evidencePath: OVR,
    customerVisibility: 'not customer-visible — planned',
  }),
  row({
    artifactId: 'config-retry-metadata-binding',
    artifact: 'Retry metadata binding configuration representation — planned',
    kind: 'state',
    owner: 'notification-delivery',
    purpose: 'Inventory planned binding between eligibility rules and retry metadata',
    eligibilityRole: 'configuration-representation',
    classification: 'CONFIGURATION',
    honestyRequirement: 'Does not authorize eligibility evaluation runtime',
    futureW5N23Responsibility: 'W5-N23-b',
    persistenceRequirement: 'planned W5-N23-b',
    recoveryRequirement: 'planned W5-N23-c',
    dependencies: ['consume-w5-n20-retry-policy-anchor'],
    evidencePath: OVR,
    customerVisibility: 'not customer-visible — planned',
  }),

  // ELIGIBILITY
  row({
    artifactId: 'eligibility-decision-model-representation',
    artifact: 'Eligibility decision model representation — planned',
    kind: 'projection',
    owner: 'notification-delivery',
    purpose: 'Inventory planned eligibility decision model as informational output',
    eligibilityRole: 'eligibility-representation',
    classification: 'ELIGIBILITY',
    honestyRequirement:
      'ELIGIBILITY output is informational — does not schedule or execute retries',
    futureW5N23Responsibility: 'W5-N23-b',
    persistenceRequirement: 'planned W5-N23-b',
    recoveryRequirement: 'planned W5-N23-c',
    operationalRequirement: 'planned W5-N23-d',
    dependencies: ['config-eligibility-rule-representation'],
    currentStatus: 'Planned — existsToday false; informational until consumed by future packages',
    customerVisibility: 'not customer-visible — planned',
  }),
  row({
    artifactId: 'eligibility-attempt-permission-descriptor',
    artifact: 'Attempt permission descriptor representation — planned',
    kind: 'projection',
    owner: 'notification-delivery',
    purpose: 'Inventory planned descriptor of whether another attempt is permitted',
    eligibilityRole: 'eligibility-representation',
    classification: 'ELIGIBILITY',
    honestyRequirement: 'Permission descriptor ≠ orchestration or worker execution',
    futureW5N23Responsibility: 'W5-N23-c',
    persistenceRequirement: 'planned W5-N23-b',
    recoveryRequirement: 'planned W5-N23-c',
    dependencies: ['consume-w5-n22-retry-backoff-calculation-anchor'],
    evidencePath: OVR,
    customerVisibility: 'not customer-visible — planned',
  }),
  row({
    artifactId: 'eligibility-informational-decision-output',
    artifact: 'Informational eligibility decision output — planned',
    kind: 'projection',
    owner: 'notification-delivery',
    purpose: 'Describe planned informational eligibility decision for consumers',
    eligibilityRole: 'eligibility-representation',
    classification: 'ELIGIBILITY',
    honestyRequirement: 'Output informational until consumed by future approved packages',
    futureW5N23Responsibility: 'honesty-baseline',
    customerVisibility: 'not customer-visible — planned',
  }),

  // Commands / runtime / operator / persistence candidate / state
  row({
    artifactId: 'command-inventory-eligibility-surfaces',
    artifact: 'Inventory command — enumerate eligibility surfaces',
    kind: 'command',
    owner: 'wave-5-documentation',
    purpose: 'Document inventory-only discovery command surface (no runtime mutation)',
    eligibilityRole: 'inventory-discovery',
    classification: 'EPHEMERAL',
    honestyRequirement: 'Inventory command ≠ eligibility evaluation runtime command',
    futureW5N23Responsibility: 'honesty-baseline',
    capabilityCategory: 'implemented-today',
    honestProductState: 'implemented-today',
    currentStatus: 'Implemented as machine inventory only — no production command bus',
    evidencePath: N22I,
    existsToday: true,
    operationalVisibility: 'documentation / conformance only',
    customerVisibility: 'not customer-visible',
  }),
  row({
    artifactId: 'runtime-pc06-resolve-delivery-routing',
    artifact: 'PC-06 resolve-delivery-routing runtime — consumed',
    kind: 'runtime',
    owner: 'notification-product',
    purpose: 'Confirm routing runtime remains SoT; eligibility does not own routing',
    eligibilityRole: 'consumed-runtime',
    classification: 'RECOVERABLE',
    honestyRequirement: 'No eligibility evaluation runtime introduced',
    futureW5N23Responsibility: 'honesty-baseline',
    persistenceRequirement: 'consumed-not-owned',
    recoveryRequirement: 'consumed-not-owned',
    operationalRequirement: 'platform-readiness',
    evidencePath: SVC,
    existsToday: true,
  }),
  row({
    artifactId: 'runtime-no-eligibility-engine',
    artifact: 'Eligibility engine runtime — absent',
    kind: 'runtime',
    owner: 'notification-delivery',
    purpose: 'Explicitly record absence of eligibility engine runtime',
    eligibilityRole: 'absent-runtime',
    classification: 'NON-RECOVERABLE',
    honestyRequirement: 'No Eligibility Engine',
    futureW5N23Responsibility: 'out-of-scope-eligibility-engine',
    capabilityCategory: 'not-implemented',
    currentStatus: 'Absent — no eligibility engine process',
    customerVisibility: 'not customer-visible — absent',
  }),
  row({
    artifactId: 'operator-visible-eligibility-none',
    artifact: 'Operator-visible eligibility UI — none',
    kind: 'operator-visible',
    owner: 'command-center',
    purpose: 'Confirm no customer/operator eligibility UI from slice a',
    eligibilityRole: 'operator-gap',
    classification: 'EPHEMERAL',
    honestyRequirement: 'No customer-visible feature from W5-N23-a',
    futureW5N23Responsibility: 'out-of-scope-platform-eligibility-slice-a',
    evidencePath: OVR,
    customerVisibility: 'not customer-visible — absent',
  }),
  row({
    artifactId: 'projection-platform-readiness-eligibility-missing',
    artifact: 'Platform Readiness notificationPlatformRetryEligibility — missing',
    kind: 'projection',
    owner: 'platform-readiness',
    purpose: 'Record that eligibility readiness projection is not yet present',
    eligibilityRole: 'readiness-projection-gap',
    classification: 'EPHEMERAL',
    honestyRequirement: 'Readiness must not claim eligibility functional from inventory alone',
    futureW5N23Responsibility: 'W5-N23-d',
    operationalRequirement: 'planned W5-N23-d',
    capabilityCategory: 'not-implemented',
    honestProductState: 'not-implemented',
    evidencePath: PKG,
    existsToday: false,
    customerVisibility: 'not customer-visible — absent',
  }),
  row({
    artifactId: 'persist-candidate-eligibility-anchor',
    artifact: 'WorkspaceNotificationPlatformRetryEligibilityAnchor — planned durable anchors',
    kind: 'persistence-candidate',
    owner: 'notification-delivery',
    purpose: 'Inventory planned durable eligibility anchor on notification-delivery owner',
    eligibilityRole: 'durable-anchor-candidate',
    classification: 'RECOVERABLE',
    honestyRequirement: 'Persistence candidate only; not eligibility evaluation runtime',
    futureW5N23Responsibility: 'W5-N23-b',
    persistenceRequirement: 'planned W5-N23-b',
    recoveryRequirement: 'planned W5-N23-c',
    operationalRequirement: 'planned W5-N23-d',
    capabilityCategory: 'planned',
    honestProductState: 'planned',
    currentStatus: 'Planned — no durable eligibility anchors today',
    evidencePath: PKG,
    existsToday: false,
    customerVisibility: 'not customer-visible — planned',
  }),
  row({
    artifactId: 'state-n22-backoff-calculation-anchor-reference',
    artifact: 'N22 backoff calculation anchor state — reference substrate',
    kind: 'state',
    owner: 'w5-n22-reference',
    purpose: 'Reference Closed N22 durable calculation state for eligibility inventory',
    eligibilityRole: 'consumed-state',
    classification: 'RECOVERABLE',
    honestyRequirement: 'Reference only; N22 not reopened',
    futureW5N23Responsibility: 'w5-n22-reference',
    persistenceRequirement: 'w5-n22-reference',
    recoveryRequirement: 'w5-n22-reference',
    operationalRequirement: 'w5-n22-reference',
    dependencies: ['consume-w5-n22-retry-backoff-calculation-anchor'],
    evidencePath: N22,
    existsToday: true,
  }),

  // Honesty boundaries
  honesty(
    'honesty-inventory-only-not-eligibility-determination',
    'Honesty — inventory only; not eligibility determination',
    'Inventory does not determine eligibility',
    'out-of-scope-eligibility-evaluation',
  ),
  honesty(
    'honesty-inventory-only-not-backoff-calculation',
    'Honesty — inventory only; not backoff calculation',
    'Inventory does not perform backoff calculation',
    'out-of-scope-backoff-calculation',
  ),
  honesty(
    'honesty-inventory-only-not-scheduling',
    'Honesty — inventory only; not retry scheduling',
    'Inventory does not schedule retries',
    'out-of-scope-retry-scheduling',
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
    'honesty-no-eligibility-engine',
    'Honesty — no Eligibility Engine',
    'No Eligibility Engine',
    'out-of-scope-eligibility-engine',
  ),
  honesty(
    'honesty-no-retry-engine',
    'Honesty — no Retry Engine',
    'No Retry Engine',
    'out-of-scope-retry-engine',
  ),
  honesty(
    'honesty-no-runtime-eligibility',
    'Honesty — no runtime eligibility',
    'No runtime eligibility evaluation',
    'out-of-scope-runtime-eligibility',
  ),

  // Explicit OUT
  out(
    'out-eligibility-evaluation-runtime',
    'Eligibility evaluation runtime — OUT',
    'No eligibility evaluation runtime',
    'out-of-scope-eligibility-evaluation',
  ),
  out(
    'out-backoff-calculation',
    'Backoff calculation — OUT of eligibility slice',
    'Inventory does not perform backoff calculation',
    'out-of-scope-backoff-calculation',
  ),
  out(
    'out-retry-scheduling',
    'Retry scheduling — OUT of eligibility slice',
    'Inventory does not schedule retries',
    'out-of-scope-retry-scheduling',
  ),
  out(
    'out-retry-execution',
    'Retry execution — OUT of eligibility slice',
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
    'No scheduler from eligibility inventory',
    'out-of-scope-scheduler',
  ),
  out('out-timers', 'Timers — OUT', 'No timers from eligibility inventory', 'out-of-scope-timers'),
  out(
    'out-w5-n23-b',
    'W5-N23-b Durable Persistence — OUT of slice a',
    'Slice a does not authorize W5-N23-b',
    'W5-N23-b',
    'EPHEMERAL',
  ),
  out(
    'out-w5-n23-c',
    'W5-N23-c Restart Recovery — OUT of slice a',
    'Slice a does not authorize W5-N23-c',
    'W5-N23-c',
    'EPHEMERAL',
  ),
  out(
    'out-w5-n23-d',
    'W5-N23-d Operational Continuity — OUT of slice a',
    'Slice a does not authorize W5-N23-d',
    'W5-N23-d',
    'EPHEMERAL',
  ),
  out(
    'out-w5-n23-e',
    'W5-N23-e Close Evidence — OUT of slice a',
    'Slice a does not authorize W5-N23-e',
    'W5-N23-e',
    'EPHEMERAL',
  ),
  out(
    'out-eligibility-engine',
    'Eligibility Engine — OUT',
    'No Eligibility Engine',
    'out-of-scope-eligibility-engine',
  ),
  out('out-retry-engine', 'Retry Engine — OUT', 'No Retry Engine', 'out-of-scope-retry-engine'),
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
    eligibilityRole: 'reference-pattern',
    classification: 'RECOVERABLE',
    honestyRequirement: 'Reference only; N22 not reopened',
    futureW5N23Responsibility: 'w5-n22-reference',
    persistenceRequirement: 'consumed-not-owned',
    recoveryRequirement: 'consumed-not-owned',
    evidencePath: N22I,
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
    eligibilityRole: 'deferred-dependency',
    classification: 'NON-RECOVERABLE',
    honestyRequirement: 'Production transports deferred',
    futureW5N23Responsibility: 'out-of-scope-production-transport-i/o',
    capabilityCategory: 'future-roadmap',
    honestProductState: 'deferred',
    currentStatus: 'Deferred — TD-049 / TD-050 unchanged by eligibility inventory',
    evidencePath: PKG,
    existsToday: true,
    operationalVisibility: 'deferred',
    customerVisibility: 'not customer-visible — deferred',
  }),
  row({
    artifactId: 'operational-inventory-slice-a-open',
    artifact: 'W5-N23-a inventory slice operational record',
    kind: 'operational',
    owner: 'wave-5-documentation',
    purpose: 'Mark slice a inventory baseline as operational documentation state',
    eligibilityRole: 'inventory-operational',
    classification: 'EPHEMERAL',
    honestyRequirement: 'Does not authorize eligibility functional',
    futureW5N23Responsibility: 'honesty-baseline',
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
    'AI Gateway out of W5-N23 scope',
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

export const W5_N23_A_BINDING_FINDINGS = Object.freeze({
  eligibilityFunctionalAuthorized: false,
  eligibilityFunctionsAfterSliceA: false,
  customerVisibleFeatureFromSliceA: false,
  w5N17DeliveryReliabilityExists: true,
  w5N18RetryExecutionExists: true,
  w5N19RetrySchedulingExists: true,
  w5N20RetryPolicyExists: true,
  w5N21RetryBackoffExists: true,
  w5N22RetryBackoffCalculationExists: true,
  unifiedPlatformEligibilityLayerMissing: true,
  eligibilityPersistenceMissing: true,
  eligibilityRecoveryMissing: true,
  eligibilityOperationalContinuityMissing: true,
  productionTransportsDeferred: true,
  inventoryDoesNotDetermineEligibility: true,
  inventoryDoesNotPerformBackoffCalculation: true,
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

export const W5_N23_A_EXPLICIT_OUT = Object.freeze([
  'eligibility-evaluation-runtime',
  'backoff-calculation',
  'retry-scheduling',
  'retry-execution',
  'retry-workers',
  'retry-lifecycle',
  'retry-orchestration',
  'scheduler',
  'timers',
  'production-transport-i/o',
  'notification-platform-complete',
  'live-trading-enablement',
  'w5-n23-b',
  'w5-n23-c',
  'w5-n23-d',
  'w5-n23-e',
  'w5-n23-complete',
  'wave-5-complete',
  'eligibility-engine',
  'retry-engine',
  'retry-platform',
  'workflow-engine',
  'event-bus-product',
  'orchestration-platform',
  'runtime-eligibility',
  'w5-n17-reopen',
  'w5-n18-reopen',
  'w5-n19-reopen',
  'w5-n20-reopen',
  'w5-n21-reopen',
  'w5-n22-reopen',
  'master-plan-revision',
  'version-2-redesign',
  'ownership-change',
  'new-persistence-owner',
  'new-bounded-context',
  'exchange-adapter-modification',
  'ai-gateway',
] as const);

export const W5_N23_A_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateEligibilitySubsystem: false,
  duplicateRetrySubsystem: false,
  duplicateRoutingEngine: false,
  eligibilityEngineIntroduced: false,
  retryEngineIntroduced: false,
  retryPlatformIntroduced: false,
  workflowEngineIntroduced: false,
  eventBusProductIntroduced: false,
  orchestrationPlatformIntroduced: false,
  schedulerIntroduced: false,
  workerIntroduced: false,
  runtimeEligibilityIntroduced: false,
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
  w5N23CompleteClaimed: false,
  eligibilityFunctionalClaimed: false,
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
} as const);

export const W5_N23_A_HONEST_PRODUCT_BASELINE = Object.freeze({
  implementedCapabilities: Object.freeze([
    'None — W5-N23-a inventory only; no customer-visible eligibility feature',
  ] as const),
  infrastructureCapabilities: Object.freeze([
    'Per-channel N01…N04 notification anchors on notification-delivery owner',
    'W5-N05…N16 platform foundations on notification-delivery owner (consumed)',
    'W5-N17 delivery reliability inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N18 retry execution inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N19 retry scheduling inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N20 retry policy inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N21 retry backoff inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N22 retry backoff calculation inventory, durable anchors, recovery, and continuity (consumed)',
    'PC-06 resolve-delivery-routing — routing SoT consumed unchanged',
    'PC-07 notification-product — per-channel settings and history',
    'Notification Durable Queue — W3-O02 on notification-delivery owner (consumed)',
    'W5-N01…N22 machine inventories — foundation reference patterns',
    'Exchange Adapter / Wave 4 — reference only; untouched',
  ] as const),
  plannedCapabilities: Object.freeze([
    'Persistence Foundation (W5-N23-b)',
    'Restart Recovery Foundation (W5-N23-c)',
    'Operational Continuity Foundation (W5-N23-d)',
    'Package Validation & Close Evidence (W5-N23-e)',
  ] as const),
  notYetImplementedCapabilities: Object.freeze([
    'Unified cross-channel platform eligibility layer',
    'Operator eligibility UI',
    'Eligibility evaluation runtime',
    'Eligibility Engine',
    'Retry Engine',
    'Eligibility persistence',
    'Eligibility restart recovery',
    'Eligibility operational continuity',
    'Transport execution / provider runtimes',
    'Production transport I/O (TD-049 / TD-050)',
    'Notification Platform Complete',
  ] as const),
  futureRoadmapCapabilities: Object.freeze([
    'Wave 6 — Live Trading (LT-02)',
    'Wave 7 — Anthropic / AI Gateway (out of W5-N23 scope)',
  ] as const),
} as const);

export const W5_N23_A_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'Notification Retry Eligibility inventory baseline established',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'Persistence Foundation (W5-N23-b)',
    'Restart Recovery Foundation (W5-N23-c)',
    'Operational Continuity Foundation (W5-N23-d)',
    'Package Validation & Close Evidence (W5-N23-e)',
  ] as const),
} as const);

export function artifactIds(): readonly string[] {
  return W5_N23_A_RETRY_ELIGIBILITY_INVENTORY.map((entry) => entry.artifactId);
}

export function rowsByKind(kind: W5N23AArtifactKind): readonly W5N23AInventoryRow[] {
  return W5_N23_A_RETRY_ELIGIBILITY_INVENTORY.filter((entry) => entry.kind === kind);
}

export function rowsByClassification(
  classification: W5N23AEligibilityClassification,
): readonly W5N23AInventoryRow[] {
  return W5_N23_A_RETRY_ELIGIBILITY_INVENTORY.filter(
    (entry) => entry.classification === classification,
  );
}

export function rowsRecoverable(): readonly W5N23AInventoryRow[] {
  return rowsByClassification('RECOVERABLE');
}

export function rowsEphemeral(): readonly W5N23AInventoryRow[] {
  return rowsByClassification('EPHEMERAL');
}

export function rowsEligibility(): readonly W5N23AInventoryRow[] {
  return rowsByClassification('ELIGIBILITY');
}

export function rowsConfiguration(): readonly W5N23AInventoryRow[] {
  return rowsByClassification('CONFIGURATION');
}

export function rowsNonRecoverable(): readonly W5N23AInventoryRow[] {
  return rowsByClassification('NON-RECOVERABLE');
}

export function rowsHonestyBoundaries(): readonly W5N23AInventoryRow[] {
  return W5_N23_A_RETRY_ELIGIBILITY_INVENTORY.filter((entry) => entry.kind === 'honesty-boundary');
}

export function rowsExplicitOut(): readonly W5N23AInventoryRow[] {
  return W5_N23_A_RETRY_ELIGIBILITY_INVENTORY.filter((entry) => entry.kind === 'explicit-out');
}

export function rowsByCapabilityCategory(
  category: W5N23ACapabilityCategory,
): readonly W5N23AInventoryRow[] {
  return W5_N23_A_RETRY_ELIGIBILITY_INVENTORY.filter(
    (entry) => entry.capabilityCategory === category,
  );
}
