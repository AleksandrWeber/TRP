/**
 * w5-n22-a — Notification Retry Backoff Calculation Inventory & Honest Product Baseline.
 *
 * Discovery and classification only.
 * Not Notification Retry Backoff Calculation implementation. Not production transport I/O.
 * Not calculation runtime / scheduling / execution / retry lifecycle / timers / workers / orchestration.
 * Not Calculation Engine / Backoff Engine / Retry Platform / Workflow Engine / Event Bus.
 * Not W5-N22 COMPLETE. Not Notification Platform Complete. Not Wave 5 CLOSED.
 *
 * Classifications: CALCULATED | CONFIGURATION | EPHEMERAL | RECOVERABLE | NON-RECOVERABLE
 * W5-N01…N21 foundations consumed as reference patterns only — not reopened.
 */

export const W5_N22_A_SLICE_ID = 'W5-N22-a' as const;

export const W5_N22_A_ALLOWED_OWNERS = Object.freeze([
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
  'ai-gateway-deferred',
  'live-trading-deferred',
  'strategy-trading-pipeline',
] as const);

export type W5N22AOwner = (typeof W5_N22_A_ALLOWED_OWNERS)[number];

export const W5_N22_A_SUBSTRATE_OWNERS = Object.freeze([
  'notification-delivery',
  'notification-product',
  'connection-management',
  'secret-vault',
  'platform-readiness',
] as const);

export const W5_N22_A_ARTIFACT_KINDS = Object.freeze([
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

export type W5N22AArtifactKind = (typeof W5_N22_A_ARTIFACT_KINDS)[number];
export const W5_N22_A_REQUIRED_ARTIFACT_KINDS = W5_N22_A_ARTIFACT_KINDS;

export const W5_N22_A_CAPABILITY_CATEGORIES = Object.freeze([
  'implemented-today',
  'infrastructure-only',
  'planned',
  'not-implemented',
  'future-roadmap',
] as const);

export type W5N22ACapabilityCategory = (typeof W5_N22_A_CAPABILITY_CATEGORIES)[number];

export const W5_N22_A_BACKOFF_CALCULATION_CLASSIFICATIONS = Object.freeze([
  'CALCULATED',
  'CONFIGURATION',
  'EPHEMERAL',
  'RECOVERABLE',
  'NON-RECOVERABLE',
] as const);

export type W5N22ABackoffCalculationClassification =
  (typeof W5_N22_A_BACKOFF_CALCULATION_CLASSIFICATIONS)[number];

export const W5_N22_A_HONEST_PRODUCT_STATES = Object.freeze([
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

export type W5N22AHonestProductState = (typeof W5_N22_A_HONEST_PRODUCT_STATES)[number];

export const W5_N22_A_FUTURE_RESPONSIBILITIES = Object.freeze([
  'W5-N22-b',
  'W5-N22-c',
  'W5-N22-d',
  'W5-N22-e',
  'honesty-baseline',
  'out-of-scope-live-trading',
  'out-of-scope-platform-backoff-calculation-slice-a',
  'out-of-scope-production-transport-i/o',
  'out-of-scope-exchange-adapter',
  'out-of-scope-w5-n22-complete',
  'out-of-scope-wave-5-complete',
  'out-of-scope-notification-platform-complete',
  'out-of-scope-w5-n17-reopen',
  'out-of-scope-w5-n18-reopen',
  'out-of-scope-w5-n19-reopen',
  'out-of-scope-w5-n20-reopen',
  'out-of-scope-w5-n21-reopen',
  'out-of-scope-ai-gateway',
  'out-of-scope-calculation-engine',
  'out-of-scope-backoff-engine',
  'out-of-scope-retry-platform',
  'out-of-scope-retry-orchestration',
  'out-of-scope-retry-execution',
  'out-of-scope-retry-scheduling',
  'out-of-scope-retry-lifecycle',
  'out-of-scope-timers',
  'out-of-scope-workers',
  'out-of-scope-scheduler',
  'w5-n17-reference',
  'w5-n18-reference',
  'w5-n19-reference',
  'w5-n20-reference',
  'w5-n21-reference',
] as const);

export type W5N22AFutureResponsibility = (typeof W5_N22_A_FUTURE_RESPONSIBILITIES)[number];

export type W5N22AInventoryRow = Readonly<{
  artifactId: string;
  artifact: string;
  kind: W5N22AArtifactKind;
  owner: W5N22AOwner;
  purpose: string;
  calculationRole: string;
  classification: W5N22ABackoffCalculationClassification;
  persistenceRequirement: string;
  recoveryRequirement: string;
  operationalRequirement: string;
  dependencies: readonly string[];
  capabilityCategory: W5N22ACapabilityCategory;
  currentStatus: string;
  honestyRequirement: string;
  futureW5N22Responsibility: W5N22AFutureResponsibility;
  evidencePath: string;
  existsToday: boolean;
  authorizesBackoffCalculationFunctional: false;
  authorizesW5N22Complete: false;
  honestProductState: W5N22AHonestProductState;
  operationalVisibility: string;
  customerVisibility: string;
}>;

const DOC = 'docs/project/version-3/wave-5/w5-n22-product-scope.md';
const PKG = 'docs/project/version-3/wave-5/w5-n22-implementation-package.md';
const OVR = 'docs/project/version-3/wave-5/w5-n22-overview.md';
const SEC = 'docs/project/version-3/wave-5/w5-n22-security-review.md';
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
const N21R =
  'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-restart-recovery.service.ts';
const N21C =
  'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-operational-continuity.ts';
const N21I = 'apps/api/src/platform-conformance/w5-n21-a-retry-backoff-inventory.ts';
const N22B =
  'apps/api/src/modules/notification-delivery/notification-platform-retry-backoff-calculation-persistence.service.ts';

type RowInput = {
  artifactId: string;
  artifact: string;
  kind: W5N22AArtifactKind;
  owner: W5N22AOwner;
  purpose: string;
  calculationRole: string;
  classification: W5N22ABackoffCalculationClassification;
  honestyRequirement: string;
  futureW5N22Responsibility: W5N22AFutureResponsibility;
  persistenceRequirement?: string;
  recoveryRequirement?: string;
  operationalRequirement?: string;
  dependencies?: readonly string[];
  capabilityCategory?: W5N22ACapabilityCategory;
  currentStatus?: string;
  evidencePath?: string;
  existsToday?: boolean;
  honestProductState?: W5N22AHonestProductState;
  operationalVisibility?: string;
  customerVisibility?: string;
};

function row(input: RowInput): W5N22AInventoryRow {
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
        : classification === 'CALCULATED' || classification === 'CONFIGURATION'
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
        : classification === 'CALCULATED' || classification === 'CONFIGURATION' || isMissing
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
    calculationRole: input.calculationRole,
    classification,
    persistenceRequirement: input.persistenceRequirement ?? 'not-applicable',
    recoveryRequirement: input.recoveryRequirement ?? 'not-applicable',
    operationalRequirement: input.operationalRequirement ?? 'not-applicable',
    dependencies: Object.freeze([...(input.dependencies ?? [])]) as readonly string[],
    capabilityCategory,
    currentStatus:
      input.currentStatus ??
      (isOut
        ? 'Explicit OUT — must not authorize from W5-N22-a'
        : isHonesty
          ? 'Binding honesty frozen'
          : isMissing
            ? 'Missing — planned future slice'
            : 'Inventoried for W5-N22-a discovery'),
    honestyRequirement: input.honestyRequirement,
    futureW5N22Responsibility: input.futureW5N22Responsibility,
    evidencePath: input.evidencePath ?? DOC,
    existsToday: input.existsToday ?? false,
    authorizesBackoffCalculationFunctional: false,
    authorizesW5N22Complete: false,
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
  owner: W5N22AOwner,
  purpose: string,
  classification: W5N22ABackoffCalculationClassification,
  future: W5N22AFutureResponsibility,
  honesty: string,
  extra: Partial<RowInput> = {},
) =>
  row({
    artifactId,
    artifact,
    kind: 'ownership',
    owner,
    purpose,
    calculationRole: extra.calculationRole ?? 'ownership-boundary',
    classification,
    honestyRequirement: honesty,
    futureW5N22Responsibility: future,
    ...extra,
  });

const consume = (
  artifactId: string,
  artifact: string,
  owner: W5N22AOwner,
  future: W5N22AFutureResponsibility,
  evidencePath: string,
  purpose: string,
) =>
  row({
    artifactId,
    artifact,
    kind: 'dependency',
    owner,
    purpose,
    calculationRole: 'consumed-foundation',
    classification: 'RECOVERABLE',
    honestyRequirement: 'Consumed not redesigned; does not authorize calculation functional',
    futureW5N22Responsibility: future,
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
  future: W5N22AFutureResponsibility,
) =>
  row({
    artifactId,
    artifact,
    kind: 'honesty-boundary',
    owner: 'wave-5-documentation',
    purpose: honestyRequirement,
    calculationRole: 'honesty-constraint',
    classification: 'NON-RECOVERABLE',
    honestyRequirement,
    futureW5N22Responsibility: future,
    existsToday: true,
    evidencePath: DOC,
  });

const out = (
  artifactId: string,
  artifact: string,
  honestyRequirement: string,
  future: W5N22AFutureResponsibility,
  classification: W5N22ABackoffCalculationClassification = 'NON-RECOVERABLE',
  owner: W5N22AOwner = 'wave-5-documentation',
) =>
  row({
    artifactId,
    artifact,
    kind: 'explicit-out',
    owner,
    purpose: honestyRequirement,
    calculationRole: 'explicit-out',
    classification,
    honestyRequirement,
    futureW5N22Responsibility: future,
    evidencePath: classification === 'EPHEMERAL' ? PKG : DOC,
  });

export const W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY: readonly W5N22AInventoryRow[] =
  Object.freeze([
    // Ownership
    own(
      'own-platform-backoff-calculation-layer',
      'Cross-channel Notification Retry Backoff Calculation — notification-delivery owner',
      'notification-delivery',
      'Declare sole owner path for future backoff calculation foundation artifacts',
      'RECOVERABLE',
      'W5-N22-d',
      'Backoff calculation extends notification-delivery only; no Calculation Engine or Backoff Engine',
      {
        persistenceRequirement: 'notification-delivery — planned W5-N22-b',
        recoveryRequirement: 'notification-delivery — planned W5-N22-c',
        operationalRequirement: 'none-missing until W5-N22-d',
        currentStatus: 'Owner path exists; unified backoff calculation layer still absent',
        evidencePath: ND,
        existsToday: true,
      },
    ),
    own(
      'own-notification-delivery-domain',
      'Notification Delivery BC — sole owner for backoff calculation foundation artifacts',
      'notification-delivery',
      'Keep calculation foundation inside existing notification-delivery BC',
      'RECOVERABLE',
      'honesty-baseline',
      'No new bounded context for backoff calculation',
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
      'Confirm calculation consumes PC-06 routing and does not own it',
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
      'Delivery reliability ≠ backoff calculation; N17 not reopened',
      {
        calculationRole: 'consumed-foundation-ownership',
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
      'Retry execution ≠ backoff calculation; N18 not reopened',
      {
        calculationRole: 'consumed-foundation-ownership',
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
      'Retry scheduling ≠ backoff calculation; N19 not reopened',
      {
        calculationRole: 'consumed-foundation-ownership',
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
      'Retry policy ≠ backoff calculation; N20 not reopened',
      {
        calculationRole: 'consumed-foundation-ownership',
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
      'Retry backoff ≠ backoff calculation; N21 not reopened',
      {
        calculationRole: 'consumed-foundation-ownership',
        persistenceRequirement: 'w5-n21-reference',
        recoveryRequirement: 'w5-n21-reference',
        operationalRequirement: 'w5-n21-reference',
        dependencies: [
          'consume-w5-n21-retry-backoff-anchor',
          'consume-w5-n21-retry-backoff-restart-recovery',
          'consume-w5-n21-retry-backoff-continuity',
        ],
        evidencePath: N21,
        existsToday: true,
      },
    ),
    own(
      'own-secret-vault-consume',
      'Secret Vault — credential owner consumed only',
      'secret-vault',
      'Confirm calculation does not store secrets',
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
      'Workspace Isolation — backoff calculation state workspace-scoped',
      'workspace-isolation',
      'Fail closed on missing workspace for any future calculation state',
      'NON-RECOVERABLE',
      'honesty-baseline',
      'No cross-workspace backoff calculation state',
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
      'Consume durable queue substrate; not calculation runtime',
      'RECOVERABLE',
      'honesty-baseline',
      'Queue substrate owner unchanged; not calculation runtime',
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
      'Honest Product boundaries for Retry Backoff Calculation Foundation',
      'wave-5-documentation',
      'Freeze binding honesty rules for calculation-only slice a',
      'EPHEMERAL',
      'honesty-baseline',
      'Binding Honest Product rules frozen at planning and inventory',
      {
        calculationRole: 'honesty-baseline-ownership',
        capabilityCategory: 'implemented-today',
        honestProductState: 'binding-honesty',
        currentStatus:
          'Documented — Calculation ≠ scheduling / execution / lifecycle / timers / workers / orchestration',
        existsToday: true,
        operationalVisibility: 'documentation-only',
        customerVisibility: 'not customer-visible — documentation honesty',
      },
    ),

    // Consumed N21 + N17–N20
    consume(
      'consume-w5-n21-retry-backoff-anchor',
      'W5-N21 retry backoff durable anchor — consumed',
      'w5-n21-reference',
      'w5-n21-reference',
      N21,
      'Consume Closed N21 backoff anchor as calculation substrate reference',
    ),
    consume(
      'consume-w5-n21-retry-backoff-restart-recovery',
      'W5-N21 retry backoff restart recovery — consumed',
      'w5-n21-reference',
      'w5-n21-reference',
      N21R,
      'Consume Closed N21 restart recovery pattern',
    ),
    consume(
      'consume-w5-n21-retry-backoff-continuity',
      'W5-N21 retry backoff operational continuity — consumed',
      'w5-n21-reference',
      'w5-n21-reference',
      N21C,
      'Consume Closed N21 operational continuity pattern',
    ),
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

    // Missing gaps
    row({
      artifactId: 'missing-unified-platform-backoff-calculation-view',
      artifact: 'Unified platform backoff calculation view — missing',
      kind: 'ephemeral-artifact',
      owner: 'notification-delivery',
      purpose: 'Record absence of unified cross-channel calculation view',
      calculationRole: 'missing-gap',
      classification: 'EPHEMERAL',
      honestyRequirement: 'Must not claim unified calculation layer from inventory alone',
      futureW5N22Responsibility: 'W5-N22-d',
      persistenceRequirement: 'none-missing',
      recoveryRequirement: 'none-missing',
      operationalRequirement: 'none-missing',
      capabilityCategory: 'not-implemented',
      honestProductState: 'not-implemented',
      currentStatus: 'Missing — no unified platform backoff calculation view today',
      evidencePath: PKG,
      customerVisibility: 'not customer-visible — absent',
    }),
    row({
      artifactId: 'missing-backoff-calculation-persistence',
      artifact:
        'Backoff calculation durable persistence — resolved by W5-N22-b (gap row retained for inventory honesty)',
      kind: 'persistence-candidate',
      owner: 'notification-delivery',
      purpose: 'Record resolved durable calculation persistence gap after W5-N22-b',
      calculationRole: 'missing-gap-resolved',
      classification: 'RECOVERABLE',
      honestyRequirement:
        'Resolved by W5-N22-b — persistence only; not calculation runtime; not scheduling/execution',
      futureW5N22Responsibility: 'honesty-baseline',
      persistenceRequirement: 'notification-delivery',
      recoveryRequirement: 'none-missing until W5-N22-c',
      capabilityCategory: 'infrastructure-only',
      honestProductState: 'infrastructure-only',
      currentStatus:
        'Resolved by W5-N22-b — see persist-candidate-backoff-calculation-anchor; gap row retained for inventory honesty',
      evidencePath: N22B,
      existsToday: true,
      customerVisibility: 'not customer-visible — gap resolved by W5-N22-b',
    }),
    row({
      artifactId: 'missing-backoff-calculation-recovery',
      artifact: 'Backoff calculation restart recovery — missing (planned W5-N22-c)',
      kind: 'ephemeral-artifact',
      owner: 'notification-delivery',
      purpose: 'Record planned calculation recovery gap',
      calculationRole: 'missing-gap',
      classification: 'EPHEMERAL',
      honestyRequirement: 'Inventory does not create calculation recovery',
      futureW5N22Responsibility: 'W5-N22-c',
      recoveryRequirement: 'W5-N22-c',
      evidencePath: PKG,
      customerVisibility: 'not customer-visible — absent',
    }),
    row({
      artifactId: 'missing-backoff-calculation-operational-continuity',
      artifact: 'Backoff calculation operational continuity — missing (planned W5-N22-d)',
      kind: 'operational',
      owner: 'platform-readiness',
      purpose: 'Record planned calculation operational continuity gap',
      calculationRole: 'missing-gap',
      classification: 'EPHEMERAL',
      honestyRequirement: 'Inventory does not create calculation continuity',
      futureW5N22Responsibility: 'W5-N22-d',
      operationalRequirement: 'W5-N22-d',
      evidencePath: PKG,
      customerVisibility: 'not customer-visible — absent',
    }),

    // CONFIGURATION
    row({
      artifactId: 'config-delay-derivation-rule-representation',
      artifact: 'Delay derivation rule configuration representation — planned',
      kind: 'state',
      owner: 'notification-delivery',
      purpose: 'Represent how delay derivation rules would be configured (inventory only)',
      calculationRole: 'configuration-representation',
      classification: 'CONFIGURATION',
      honestyRequirement: 'CONFIGURATION classification ≠ runtime policy evaluation',
      futureW5N22Responsibility: 'W5-N22-b',
      persistenceRequirement: 'planned W5-N22-b',
      recoveryRequirement: 'planned W5-N22-c',
      operationalRequirement: 'planned W5-N22-d',
      currentStatus: 'Planned representation — no configuration store or evaluation runtime',
      customerVisibility: 'not customer-visible — planned',
    }),
    row({
      artifactId: 'config-backoff-curve-policy-binding',
      artifact: 'Backoff curve / policy binding configuration representation — planned',
      kind: 'state',
      owner: 'notification-delivery',
      purpose: 'Inventory planned binding between curve descriptors and retry policy ids',
      calculationRole: 'configuration-representation',
      classification: 'CONFIGURATION',
      honestyRequirement: 'Does not authorize policy evaluation runtime',
      futureW5N22Responsibility: 'W5-N22-b',
      persistenceRequirement: 'planned W5-N22-b',
      recoveryRequirement: 'planned W5-N22-c',
      dependencies: ['consume-w5-n20-retry-policy-anchor'],
      evidencePath: OVR,
      customerVisibility: 'not customer-visible — planned',
    }),
    row({
      artifactId: 'config-max-delay-ceiling-representation',
      artifact: 'Max delay ceiling configuration representation — planned',
      kind: 'state',
      owner: 'notification-delivery',
      purpose: 'Inventory planned max-delay ceiling as configuration artifact',
      calculationRole: 'configuration-representation',
      classification: 'CONFIGURATION',
      honestyRequirement: 'Ceiling config ≠ timer or scheduler ownership',
      futureW5N22Responsibility: 'W5-N22-b',
      persistenceRequirement: 'planned W5-N22-b',
      recoveryRequirement: 'planned W5-N22-c',
      customerVisibility: 'not customer-visible — planned',
    }),

    // CALCULATED
    row({
      artifactId: 'calculated-derived-delay-value-representation',
      artifact: 'Derived delay value representation — planned',
      kind: 'projection',
      owner: 'notification-delivery',
      purpose: 'Inventory planned derived delay value as informational calculation output',
      calculationRole: 'calculated-representation',
      classification: 'CALCULATED',
      honestyRequirement:
        'CALCULATED output is informational — does not schedule or execute retries',
      futureW5N22Responsibility: 'W5-N22-b',
      persistenceRequirement: 'planned W5-N22-b',
      recoveryRequirement: 'planned W5-N22-c',
      operationalRequirement: 'planned W5-N22-d',
      dependencies: ['config-delay-derivation-rule-representation'],
      currentStatus: 'Planned — existsToday false; informational until consumed by future packages',
      customerVisibility: 'not customer-visible — planned',
    }),
    row({
      artifactId: 'calculated-attempt-index-delay-projection',
      artifact: 'Attempt-index to delay projection representation — planned',
      kind: 'projection',
      owner: 'notification-delivery',
      purpose: 'Inventory planned projection of attempt index to delay descriptor',
      calculationRole: 'calculated-representation',
      classification: 'CALCULATED',
      honestyRequirement: 'Projection ≠ orchestration or worker execution',
      futureW5N22Responsibility: 'W5-N22-c',
      persistenceRequirement: 'planned W5-N22-b',
      recoveryRequirement: 'planned W5-N22-c',
      dependencies: ['consume-w5-n21-retry-backoff-anchor'],
      evidencePath: OVR,
      customerVisibility: 'not customer-visible — planned',
    }),
    row({
      artifactId: 'calculated-informational-delay-descriptor',
      artifact: 'Informational delay descriptor — planned calculated output',
      kind: 'projection',
      owner: 'notification-delivery',
      purpose: 'Describe planned informational delay descriptor for consumers',
      calculationRole: 'calculated-representation',
      classification: 'CALCULATED',
      honestyRequirement: 'Output informational until consumed by future approved packages',
      futureW5N22Responsibility: 'honesty-baseline',
      customerVisibility: 'not customer-visible — planned',
    }),

    // Commands / runtime / operator / persistence candidate / state
    row({
      artifactId: 'command-inventory-backoff-calculation-surfaces',
      artifact: 'Inventory command — enumerate backoff calculation surfaces',
      kind: 'command',
      owner: 'wave-5-documentation',
      purpose: 'Document inventory-only discovery command surface (no runtime mutation)',
      calculationRole: 'inventory-discovery',
      classification: 'EPHEMERAL',
      honestyRequirement: 'Inventory command ≠ calculation runtime command',
      futureW5N22Responsibility: 'honesty-baseline',
      capabilityCategory: 'implemented-today',
      honestProductState: 'implemented-today',
      currentStatus: 'Implemented as machine inventory only — no production command bus',
      evidencePath: N21I,
      existsToday: true,
      operationalVisibility: 'documentation / conformance only',
      customerVisibility: 'not customer-visible',
    }),
    row({
      artifactId: 'runtime-pc06-resolve-delivery-routing',
      artifact: 'PC-06 resolve-delivery-routing runtime — consumed',
      kind: 'runtime',
      owner: 'notification-product',
      purpose: 'Confirm routing runtime remains SoT; calculation does not own routing',
      calculationRole: 'consumed-runtime',
      classification: 'RECOVERABLE',
      honestyRequirement: 'No calculation runtime introduced',
      futureW5N22Responsibility: 'honesty-baseline',
      persistenceRequirement: 'consumed-not-owned',
      recoveryRequirement: 'consumed-not-owned',
      operationalRequirement: 'platform-readiness',
      evidencePath: SVC,
      existsToday: true,
    }),
    row({
      artifactId: 'runtime-no-backoff-calculation-engine',
      artifact: 'Backoff calculation engine runtime — absent',
      kind: 'runtime',
      owner: 'notification-delivery',
      purpose: 'Explicitly record absence of calculation engine runtime',
      calculationRole: 'absent-runtime',
      classification: 'NON-RECOVERABLE',
      honestyRequirement: 'No Calculation Engine',
      futureW5N22Responsibility: 'out-of-scope-calculation-engine',
      capabilityCategory: 'not-implemented',
      currentStatus: 'Absent — no calculation engine process',
      customerVisibility: 'not customer-visible — absent',
    }),
    row({
      artifactId: 'operator-visible-backoff-calculation-none',
      artifact: 'Operator-visible backoff calculation UI — none',
      kind: 'operator-visible',
      owner: 'command-center',
      purpose: 'Confirm no customer/operator calculation UI from slice a',
      calculationRole: 'operator-gap',
      classification: 'EPHEMERAL',
      honestyRequirement: 'No customer-visible feature from W5-N22-a',
      futureW5N22Responsibility: 'out-of-scope-platform-backoff-calculation-slice-a',
      evidencePath: OVR,
      customerVisibility: 'not customer-visible — absent',
    }),
    row({
      artifactId: 'projection-platform-readiness-backoff-calculation-missing',
      artifact: 'Platform readiness projection — backoff calculation missing',
      kind: 'projection',
      owner: 'platform-readiness',
      purpose: 'Project honest missing calculation continuity into readiness language',
      calculationRole: 'readiness-projection',
      classification: 'EPHEMERAL',
      honestyRequirement: 'Readiness must not claim calculation functional',
      futureW5N22Responsibility: 'W5-N22-d',
      operationalRequirement: 'W5-N22-d',
      capabilityCategory: 'infrastructure-only',
      honestProductState: 'infrastructure-only',
      evidencePath: PKG,
      customerVisibility: 'not customer-visible',
    }),
    row({
      artifactId: 'persist-candidate-backoff-calculation-anchor',
      artifact:
        'WorkspaceNotificationPlatformRetryBackoffCalculationAnchor — durable calculation anchors (W5-N22-b)',
      kind: 'persistence-candidate',
      owner: 'notification-delivery',
      purpose: 'Durable calculation anchor on notification-delivery owner',
      calculationRole: 'durable-anchor',
      classification: 'RECOVERABLE',
      honestyRequirement: 'Persistence only; not calculation runtime; not scheduling/execution',
      futureW5N22Responsibility: 'W5-N22-c',
      persistenceRequirement: 'notification-delivery',
      recoveryRequirement: 'W5-N22-c',
      operationalRequirement: 'W5-N22-d',
      capabilityCategory: 'infrastructure-only',
      honestProductState: 'infrastructure-only',
      currentStatus:
        'Implemented — durable calculation description anchors on notification-delivery; restart recovery still absent',
      evidencePath: N22B,
      existsToday: true,
      customerVisibility: 'not customer-visible — infrastructure only',
    }),
    row({
      artifactId: 'state-n21-backoff-anchor-reference',
      artifact: 'N21 backoff anchor state — reference substrate',
      kind: 'state',
      owner: 'w5-n21-reference',
      purpose: 'Reference Closed N21 durable backoff state for calculation inventory',
      calculationRole: 'consumed-state',
      classification: 'RECOVERABLE',
      honestyRequirement: 'Reference only; N21 not reopened',
      futureW5N22Responsibility: 'w5-n21-reference',
      persistenceRequirement: 'w5-n21-reference',
      recoveryRequirement: 'w5-n21-reference',
      operationalRequirement: 'w5-n21-reference',
      dependencies: ['consume-w5-n21-retry-backoff-anchor'],
      evidencePath: N21,
      existsToday: true,
    }),

    // Honesty boundaries
    honesty(
      'honesty-calculation-only-not-scheduling',
      'Honesty — calculation only; not retry scheduling',
      'Calculation does not schedule retries',
      'out-of-scope-retry-scheduling',
    ),
    honesty(
      'honesty-calculation-only-not-execution',
      'Honesty — calculation only; not retry execution',
      'Calculation does not execute retries',
      'out-of-scope-retry-execution',
    ),
    honesty(
      'honesty-calculation-only-not-retry-lifecycle',
      'Honesty — calculation only; not retry lifecycle',
      'Calculation does not own retry lifecycle',
      'out-of-scope-retry-lifecycle',
    ),
    honesty(
      'honesty-calculation-only-not-timers',
      'Honesty — calculation only; not timers',
      'Calculation does not own timers',
      'out-of-scope-timers',
    ),
    honesty(
      'honesty-calculation-only-not-workers',
      'Honesty — calculation only; not workers',
      'Calculation does not own workers',
      'out-of-scope-workers',
    ),
    honesty(
      'honesty-calculation-only-not-orchestration',
      'Honesty — calculation only; not orchestration',
      'Calculation does not own orchestration',
      'out-of-scope-retry-orchestration',
    ),
    honesty(
      'honesty-calculation-output-informational',
      'Honesty — calculation output informational only',
      'Calculation output informational only',
      'honesty-baseline',
    ),
    honesty(
      'honesty-no-calculation-engine',
      'Honesty — no Calculation Engine',
      'No Calculation Engine',
      'out-of-scope-calculation-engine',
    ),
    honesty(
      'honesty-no-backoff-engine',
      'Honesty — no Backoff Engine',
      'No Backoff Engine',
      'out-of-scope-backoff-engine',
    ),
    honesty(
      'honesty-backoff-foundation-not-calculation-runtime',
      'Honesty — backoff foundation ≠ calculation runtime',
      'Backoff Foundation ≠ calculation runtime',
      'w5-n21-reference',
    ),

    // Explicit OUT
    out(
      'out-backoff-calculation-runtime',
      'Backoff calculation runtime — OUT',
      'No calculation runtime',
      'out-of-scope-platform-backoff-calculation-slice-a',
    ),
    out(
      'out-retry-scheduling',
      'Retry scheduling — OUT of calculation slice',
      'Calculation does not schedule retries',
      'out-of-scope-retry-scheduling',
    ),
    out(
      'out-retry-execution',
      'Retry execution — OUT of calculation slice',
      'Calculation does not execute retries',
      'out-of-scope-retry-execution',
    ),
    out(
      'out-retry-workers',
      'Retry workers — OUT',
      'Calculation does not own workers',
      'out-of-scope-workers',
    ),
    out(
      'out-retry-lifecycle',
      'Retry lifecycle — OUT',
      'Calculation does not own retry lifecycle',
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
      'No scheduler from calculation inventory',
      'out-of-scope-scheduler',
    ),
    out(
      'out-w5-n22-b',
      'W5-N22-b Durable Persistence — OUT of slice a',
      'Slice a does not authorize W5-N22-b',
      'W5-N22-b',
      'EPHEMERAL',
    ),
    out(
      'out-w5-n22-c',
      'W5-N22-c Restart Recovery — OUT of slice a',
      'Slice a does not authorize W5-N22-c',
      'W5-N22-c',
      'EPHEMERAL',
    ),
    out(
      'out-w5-n22-d',
      'W5-N22-d Operational Continuity — OUT of slice a',
      'Slice a does not authorize W5-N22-d',
      'W5-N22-d',
      'EPHEMERAL',
    ),
    out(
      'out-w5-n22-e',
      'W5-N22-e Close Evidence — OUT of slice a',
      'Slice a does not authorize W5-N22-e',
      'W5-N22-e',
      'EPHEMERAL',
    ),
    out(
      'out-calculation-engine',
      'Calculation Engine — OUT',
      'No Calculation Engine',
      'out-of-scope-calculation-engine',
    ),
    out(
      'out-backoff-engine',
      'Backoff Engine — OUT',
      'No Backoff Engine',
      'out-of-scope-backoff-engine',
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
      'out-w5-n21-reopen',
      'W5-N21 reopen — forbidden',
      'W5-N21 reopen — forbidden',
      'out-of-scope-w5-n21-reopen',
    ),
    out(
      'out-wave-5-complete',
      'Wave 5 COMPLETE — OUT',
      'Wave 5 COMPLETE — not claimed',
      'out-of-scope-wave-5-complete',
    ),

    // Extra coverage
    row({
      artifactId: 'dep-w5-n21-inventory-reference',
      artifact: 'W5-N21-a machine inventory — reference pattern',
      kind: 'dependency',
      owner: 'w5-n21-reference',
      purpose: 'Reuse N21 inventory pattern as reference only',
      calculationRole: 'reference-pattern',
      classification: 'RECOVERABLE',
      honestyRequirement: 'Reference only; N21 not reopened',
      futureW5N22Responsibility: 'w5-n21-reference',
      persistenceRequirement: 'consumed-not-owned',
      recoveryRequirement: 'consumed-not-owned',
      evidencePath: N21I,
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
      calculationRole: 'deferred-dependency',
      classification: 'NON-RECOVERABLE',
      honestyRequirement: 'Production transports deferred',
      futureW5N22Responsibility: 'out-of-scope-production-transport-i/o',
      capabilityCategory: 'future-roadmap',
      honestProductState: 'deferred',
      currentStatus: 'Deferred — TD-049 / TD-050 unchanged by calculation inventory',
      evidencePath: PKG,
      existsToday: true,
      operationalVisibility: 'deferred',
      customerVisibility: 'not customer-visible — deferred',
    }),
    row({
      artifactId: 'operational-inventory-slice-a-open',
      artifact: 'W5-N22-a inventory slice operational record',
      kind: 'operational',
      owner: 'wave-5-documentation',
      purpose: 'Mark slice a inventory baseline as operational documentation state',
      calculationRole: 'inventory-operational',
      classification: 'EPHEMERAL',
      honestyRequirement: 'Does not authorize calculation functional',
      futureW5N22Responsibility: 'honesty-baseline',
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
      'AI Gateway out of W5-N22 scope',
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

export const W5_N22_A_BINDING_FINDINGS = Object.freeze({
  backoffCalculationFunctionalAuthorized: false,
  backoffCalculationFunctionsAfterSliceA: false,
  customerVisibleFeatureFromSliceA: false,
  w5N17DeliveryReliabilityExists: true,
  w5N18RetryExecutionExists: true,
  w5N19RetrySchedulingExists: true,
  w5N20RetryPolicyExists: true,
  w5N21RetryBackoffExists: true,
  unifiedPlatformBackoffCalculationLayerMissing: true,
  backoffCalculationPersistenceMissing: false,
  backoffCalculationRecoveryMissing: true,
  backoffCalculationOperationalContinuityMissing: true,
  productionTransportsDeferred: true,
  calculationDoesNotScheduleRetries: true,
  calculationDoesNotExecuteRetries: true,
  calculationDoesNotOwnRetryLifecycle: true,
  calculationDoesNotOwnTimers: true,
  calculationDoesNotOwnWorkers: true,
  calculationDoesNotOwnOrchestration: true,
  calculationOutputInformationalOnly: true,
  ownershipBoundariesVerified: true,
  ownershipBoundariesChanged: false,
  architecturalDeviations: false,
} as const);

export const W5_N22_A_EXPLICIT_OUT = Object.freeze([
  'backoff-calculation-runtime',
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
  'w5-n22-b',
  'w5-n22-c',
  'w5-n22-d',
  'w5-n22-e',
  'w5-n22-complete',
  'wave-5-complete',
  'calculation-engine',
  'backoff-engine',
  'retry-platform',
  'workflow-engine',
  'event-bus-product',
  'orchestration-platform',
  'w5-n17-reopen',
  'w5-n18-reopen',
  'w5-n19-reopen',
  'w5-n20-reopen',
  'w5-n21-reopen',
  'master-plan-revision',
  'version-2-redesign',
  'ownership-change',
  'new-persistence-owner',
  'new-bounded-context',
  'exchange-adapter-modification',
] as const);

export const W5_N22_A_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateBackoffSubsystem: false,
  duplicateCalculationSubsystem: false,
  duplicateRoutingEngine: false,
  calculationEngineIntroduced: false,
  backoffEngineIntroduced: false,
  retryPlatformIntroduced: false,
  workflowEngineIntroduced: false,
  eventBusProductIntroduced: false,
  orchestrationPlatformIntroduced: false,
  schedulerIntroduced: false,
  workerIntroduced: false,
  runtimeCalculationIntroduced: false,
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
  w5N22CompleteClaimed: false,
  backoffCalculationFunctionalClaimed: false,
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
} as const);

export const W5_N22_A_HONEST_PRODUCT_BASELINE = Object.freeze({
  implementedCapabilities: Object.freeze([
    'None — W5-N22-a inventory only; no customer-visible calculation feature',
  ] as const),
  infrastructureCapabilities: Object.freeze([
    'Per-channel N01…N04 notification anchors on notification-delivery owner',
    'W5-N05…N16 platform foundations on notification-delivery owner (consumed)',
    'W5-N17 delivery reliability inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N18 retry execution inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N19 retry scheduling inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N20 retry policy inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N21 retry backoff inventory, durable anchors, recovery, and continuity (consumed)',
    'W5-N22-b durable backoff calculation anchors on notification-delivery (persistence only)',
    'PC-06 resolve-delivery-routing — routing SoT consumed unchanged',
    'PC-07 notification-product — per-channel settings and history',
    'Notification Durable Queue — W3-O02 on notification-delivery owner (consumed)',
    'W5-N01…N21 machine inventories — foundation reference patterns',
    'Exchange Adapter / Wave 4 — reference only; untouched',
  ] as const),
  plannedCapabilities: Object.freeze([
    'W5-N22-b — Durable Persistence Foundation',
    'W5-N22-c — Restart Recovery Foundation',
    'W5-N22-d — Operational Continuity Foundation',
    'W5-N22-e — Package Validation, Operational Verification & Close Evidence',
  ] as const),
  notYetImplementedCapabilities: Object.freeze([
    'Unified cross-channel platform backoff calculation layer',
    'Backoff calculation recovery',
    'Backoff calculation operational continuity',
    'Operator backoff calculation UI',
    'Backoff calculation runtime',
    'Calculation Engine',
    'Backoff Engine',
    'Retry scheduling from calculation',
    'Retry execution from calculation',
    'Transport execution / provider runtimes',
    'Production transport I/O (TD-049 / TD-050)',
    'Notification Platform Complete',
  ] as const),
  futureRoadmapCapabilities: Object.freeze([
    'Wave 6 — Live Trading (LT-02)',
    'Wave 7 — Anthropic / AI Gateway (out of W5-N22 scope)',
  ] as const),
} as const);

export const W5_N22_A_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Retry Backoff Calculation inventory baseline established'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N22-b — Durable Persistence Foundation',
    'W5-N22-c — Restart Recovery Foundation',
    'W5-N22-d — Operational Continuity Foundation',
    'W5-N22-e — Package Validation, Operational Verification & Close Evidence',
  ] as const),
} as const);

export function artifactIds(): readonly string[] {
  return W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY.map((entry) => entry.artifactId);
}

export function rowsByKind(kind: W5N22AArtifactKind): readonly W5N22AInventoryRow[] {
  return W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY.filter((entry) => entry.kind === kind);
}

export function rowsByClassification(
  classification: W5N22ABackoffCalculationClassification,
): readonly W5N22AInventoryRow[] {
  return W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY.filter(
    (entry) => entry.classification === classification,
  );
}

export function rowsRecoverable(): readonly W5N22AInventoryRow[] {
  return rowsByClassification('RECOVERABLE');
}

export function rowsEphemeral(): readonly W5N22AInventoryRow[] {
  return rowsByClassification('EPHEMERAL');
}

export function rowsCalculated(): readonly W5N22AInventoryRow[] {
  return rowsByClassification('CALCULATED');
}

export function rowsConfiguration(): readonly W5N22AInventoryRow[] {
  return rowsByClassification('CONFIGURATION');
}

export function rowsNonRecoverable(): readonly W5N22AInventoryRow[] {
  return rowsByClassification('NON-RECOVERABLE');
}

export function rowsHonestyBoundaries(): readonly W5N22AInventoryRow[] {
  return W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY.filter(
    (entry) => entry.kind === 'honesty-boundary',
  );
}

export function rowsExplicitOut(): readonly W5N22AInventoryRow[] {
  return W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY.filter(
    (entry) => entry.kind === 'explicit-out',
  );
}

export function rowsByCapabilityCategory(
  category: W5N22ACapabilityCategory,
): readonly W5N22AInventoryRow[] {
  return W5_N22_A_RETRY_BACKOFF_CALCULATION_INVENTORY.filter(
    (entry) => entry.capabilityCategory === category,
  );
}
