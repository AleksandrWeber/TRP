/**
 * W4-E01-a — Inventory & Exchange Connectivity Baseline.
 *
 * Discovery and classification only.
 * Not exchange connectivity implementation. Not REST implementation.
 * Not WebSocket implementation. Not persistence. Not restart recovery.
 * Not operational continuity. Not Exchange Connectivity Complete. Not W4-E01 CLOSED.
 *
 * Capability label CM-07 is inventory vocabulary only —
 * not authorization to invent an engine clone or second order path.
 *
 * Classification (binding for this slice):
 * - SURVIVE: artifact persists across API restart today or is the durable
 *   substrate on existing Vault / Connection / Exchange Adapter / Scope owners.
 * - EPHEMERAL: artifact is transient, stub, simulated, UI-only, process-local,
 *   or missing — must not be treated as durable exchange connectivity truth.
 */

export const W4_E01_A_SLICE_ID = 'W4-E01-a' as const;

export const W4_E01_A_ALLOWED_OWNERS = Object.freeze([
  'exchange-adapter',
  'exchange-connectivity',
  'connection-management',
  'secret-vault',
  'exchange-scope',
  'market-data-foundation',
  'live-market-data',
  'security-platform',
  'security-audit',
  'authentication',
  'authorization',
  'workspace-isolation',
  'operational-continuity',
  'command-center',
  'release-governance',
  'wave-4-documentation',
  'live-trading-deferred',
  'live-trading-engine',
  'wave-5-deferred',
  'wave-6-deferred',
  'bybit-okx-deferred',
  'kraken-deferred',
  'venue-permission-deferred',
] as const);

export type W4E01AOwner = (typeof W4_E01_A_ALLOWED_OWNERS)[number];

/** Existing exchange connectivity substrate owners — no new owner. */
export const W4_E01_A_SUBSTRATE_OWNERS = Object.freeze([
  'exchange-adapter',
  'exchange-connectivity',
  'connection-management',
  'secret-vault',
  'exchange-scope',
] as const);

export const W4_E01_A_ARTIFACT_KINDS = Object.freeze([
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

export type W4E01AArtifactKind = (typeof W4_E01_A_ARTIFACT_KINDS)[number];

export const W4_E01_A_REQUIRED_ARTIFACT_KINDS = W4_E01_A_ARTIFACT_KINDS;

export const W4_E01_A_DURABILITY_CLASSES = Object.freeze(['SURVIVE', 'EPHEMERAL'] as const);

export type W4E01ADurabilityClass = (typeof W4_E01_A_DURABILITY_CLASSES)[number];

export const W4_E01_A_DEPENDENCY_DIRECTIONS = Object.freeze([
  'consumes',
  'produces',
  'depends-on',
  'observed-by',
  'blocked-by',
] as const);

export type W4E01ADependencyDirection = (typeof W4_E01_A_DEPENDENCY_DIRECTIONS)[number];

export const W4_E01_A_FUTURE_RESPONSIBILITIES = Object.freeze([
  'W4-E01-b',
  'W4-E01-c',
  'W4-E01-d',
  'W4-E01-e',
  'honesty-baseline',
  'out-of-scope-w4-e02',
  'out-of-scope-w4-e03',
  'out-of-scope-w4-e04',
  'out-of-scope-w4-e05',
  'out-of-scope-live-trading',
  'out-of-scope-rest-implementation',
  'out-of-scope-websocket-implementation',
  'out-of-scope-engine-clone',
  'out-of-scope-market-data-only',
] as const);

export type W4E01AFutureResponsibility = (typeof W4_E01_A_FUTURE_RESPONSIBILITIES)[number];

export type W4E01AInventoryRow = Readonly<{
  artifactId: string;
  artifact: string;
  kind: W4E01AArtifactKind;
  owner: W4E01AOwner;
  durabilityClass: W4E01ADurabilityClass;
  dependencyDirection?: W4E01ADependencyDirection;
  currentStatus: string;
  honestyRequirement: string;
  futureW4E01Responsibility: W4E01AFutureResponsibility;
  evidencePath: string;
  existsToday: boolean;
  isPaperProduct: boolean;
  authorizesExchangeConnectivityComplete: boolean;
}>;

/**
 * Frozen inventory of exchange REST/WS surfaces, authentication artifacts,
 * connection lifecycle, runtime/durable/ephemeral state, operator-visible
 * artifacts, security/platform dependencies, ownership, and honesty boundaries.
 */
export const W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY: readonly W4E01AInventoryRow[] =
  Object.freeze([
    // ── Exchange REST endpoints (commands) ───────────────────────────────────
    Object.freeze({
      artifactId: 'rest-binance-api-restrictions-handshake',
      artifact: 'Binance SAPI GET /sapi/v1/account/apiRestrictions — signed handshake',
      kind: 'command' as const,
      owner: 'exchange-connectivity' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus:
        'Implemented — real signed REST via BinanceHandshakeAdapter; Connection Management validate path only',
      honestyRequirement:
        'Handshake REST ≠ Exchange Adapter factory real I/O; ≠ Binance Real I/O Complete',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/src/modules/exchange-connectivity/binance-handshake.adapter.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'rest-binance-api-restrictions-capability',
      artifact: 'Binance SAPI GET /sapi/v1/account/apiRestrictions — capability probe',
      kind: 'command' as const,
      owner: 'exchange-connectivity' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Implemented — BinanceCapabilityAdapter reuses restrictions endpoint',
      honestyRequirement: 'Capability probe ≠ venue permission verification product (E05)',
      futureW4E01Responsibility: 'W4-E01-c' as const,
      evidencePath: 'apps/api/src/modules/exchange-connectivity/binance-capability.adapter.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'rest-connections-validate',
      artifact: 'POST /v1/connections/:id/validate — operator test connection',
      kind: 'command' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Implemented — delegates exchange I/O to Exchange Connectivity handshake',
      honestyRequirement:
        'Validate performs real Binance handshake today; adapter factory still stub',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/connections/connections.controller.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'rest-connections-disconnect',
      artifact: 'POST /v1/connections/:id/disconnect — operator disconnect',
      kind: 'command' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Implemented — lifecycle status transition; no vendor disconnect call today',
      honestyRequirement: 'Disconnect updates product state; vendor session teardown is W4-E01-b',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/src/modules/connections/connections.controller.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'rest-exchanges-connect',
      artifact: 'POST /v1/exchanges/connect — Exchange Adapter factory connect',
      kind: 'command' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Implemented — uses stub BinanceExchangeAdapter; simulated connect only',
      honestyRequirement: 'Simulated connect forbidden as honest Connected; W4-E01-b target',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/src/modules/exchange-adapter/exchange-adapter.controller.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'rest-exchanges-disconnect',
      artifact: 'POST /v1/exchanges/disconnect — Exchange Adapter factory disconnect',
      kind: 'command' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Implemented — clears in-memory connected flag on stub adapter',
      honestyRequirement: 'Factory disconnect ≠ Connection Management disconnect product alone',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/src/modules/exchange-adapter/exchange-adapter.controller.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'rest-market-data-public-binance',
      artifact: 'Market Data Foundation — public Binance REST (symbols/ticker/candles/order-book)',
      kind: 'command' as const,
      owner: 'market-data-foundation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus:
        'Implemented — public REST without trading key; separate from credentialed I/O',
      honestyRequirement: 'Public market data ≠ credentialed connect/test/disconnect Complete',
      futureW4E01Responsibility: 'out-of-scope-market-data-only' as const,
      evidencePath: 'apps/api/src/modules/market-data-foundation/binance-symbol.adapter.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),

    // ── Exchange WebSocket streams ───────────────────────────────────────────
    Object.freeze({
      artifactId: 'ws-binance-public-combined-stream',
      artifact: 'Binance combined public WebSocket stream (live-market-data)',
      kind: 'command' as const,
      owner: 'live-market-data' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Implemented — public kline/ticker streams; reconnect policy in-process',
      honestyRequirement: 'Public WS ≠ authenticated user-data stream; ≠ W4-E01 credentialed I/O',
      futureW4E01Responsibility: 'out-of-scope-market-data-only' as const,
      evidencePath:
        'apps/api/src/modules/live-market-data/connectors/binance/binance-websocket.connector.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'ws-venue-adapter-subscribe-stubs',
      artifact: 'VenueExchangeAdapter subscribeTicker/OrderUpdates/ExecutionUpdates — noop stubs',
      kind: 'command' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Stub — noop subscriptions until real adapter I/O (W4-E01-b+)',
      honestyRequirement: 'Noop WS hooks must not imply WebSocket Complete or Connected',
      futureW4E01Responsibility: 'out-of-scope-websocket-implementation' as const,
      evidencePath: 'apps/api/src/modules/exchange-adapter/adapters/venue.adapters.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'ws-binance-authenticated-user-data',
      artifact: 'Binance authenticated user-data WebSocket (orders/account)',
      kind: 'command' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Missing — not implemented; handshake explicitly avoids opening WS',
      honestyRequirement: 'Missing authenticated WS must not be faked; out of W4-E01-a scope',
      futureW4E01Responsibility: 'out-of-scope-websocket-implementation' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-product-scope.md',
      existsToday: false,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),

    // ── Exchange authentication artifacts ────────────────────────────────────
    Object.freeze({
      artifactId: 'auth-vault-binance-secret-type',
      artifact: 'HoldableSecretType.Binance — vault credential classification',
      kind: 'state' as const,
      owner: 'secret-vault' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Implemented — apiKey/apiSecret schema; ciphertext in vault store',
      honestyRequirement: 'Vault remains sole credential owner; adapter retrieves only',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/secret-vault/holdable-secret-type.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'auth-connection-vault-mapping',
      artifact: 'Connection vault mapping BINANCE → HoldableSecretType.Binance',
      kind: 'runtime' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Implemented — write-only credential store path',
      honestyRequirement: 'Credentials never echoed plaintext; fail closed on missing vault',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/connections/connection-vault.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'auth-handshake-vault-retrieve',
      artifact: 'ExchangeHandshakeService — vault retrieve before signed Binance REST',
      kind: 'runtime' as const,
      owner: 'exchange-connectivity' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Implemented — secrets used for signing inside handshake boundary only',
      honestyRequirement: 'Signing in adapter/handshake only; no local secret persistence',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/src/modules/exchange-connectivity/exchange-handshake.service.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'auth-handshake-hmac-signing',
      artifact: 'Binance HMAC-SHA256 request signing for SAPI endpoints',
      kind: 'runtime' as const,
      owner: 'exchange-connectivity' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Implemented in handshake adapter — not wired to Exchange Adapter factory',
      honestyRequirement: 'Real signing exists on handshake path; factory stub has no signing',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/src/modules/exchange-connectivity/binance-handshake.adapter.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),

    // ── Connection lifecycle ─────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'lifecycle-connection-record',
      artifact: 'ConnectionRecord — operator connection metadata and status',
      kind: 'state' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Persisted — Prisma connection_records; survives restart',
      honestyRequirement:
        'Durable status must reflect real vendor round-trip at Close; stub forbidden',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/prisma/schema.prisma',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'lifecycle-connection-transitions',
      artifact: 'connection-lifecycle.ts — legal status transitions (DISCONNECTED→CONNECTED)',
      kind: 'runtime' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Implemented — fail closed transition rules',
      honestyRequirement: 'CONNECTED transition requires validation evidence; no fake Connected',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/connections/connection-lifecycle.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'lifecycle-exchange-session-projection',
      artifact: 'ExchangeSessionView — session health after handshake',
      kind: 'projection' as const,
      owner: 'exchange-connectivity' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Computed projection — HEALTHY/EXPIRED/UNAVAILABLE from handshake outcome',
      honestyRequirement: 'Session projection ≠ adapter factory Connected; consume both honestly',
      futureW4E01Responsibility: 'W4-E01-c' as const,
      evidencePath: 'apps/api/src/modules/exchange-connectivity/exchange-session.health.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'lifecycle-exchange-connection-model',
      artifact: 'ExchangeConnection — adapter-layer connection persistence',
      kind: 'state' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Persisted — exchange_connections table; separate from ConnectionRecord',
      honestyRequirement: 'Two connection models must not drift; factory extension only',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/src/modules/exchange-adapter/prisma-exchange-adapter.repository.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'lifecycle-exchange-manager',
      artifact: 'ExchangeManager — adapter connect/disconnect orchestration',
      kind: 'runtime' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Implemented — calls stub adapter connect(); persists connection row',
      honestyRequirement:
        'Manager must not mark Connected without vendor round-trip after W4-E01-b',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/src/modules/exchange-adapter/exchange-manager.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),

    // ── Runtime state ────────────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'runtime-binance-adapter-stub-connected-flag',
      artifact: 'BinanceExchangeAdapter in-memory connected flag (simulated connect)',
      kind: 'ephemeral-artifact' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Process-local boolean — set true without network I/O',
      honestyRequirement: 'Simulated connected flag is honesty violation if shown as Connected',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/src/modules/exchange-adapter/adapters/venue.adapters.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'runtime-exchange-registry',
      artifact: 'ExchangeRegistry — in-memory adapter instances per workspace',
      kind: 'ephemeral-artifact' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'In-process registry — rebuilt on API restart',
      honestyRequirement: 'Registry loss on restart; continuity is W4-E01-d not this slice',
      futureW4E01Responsibility: 'W4-E01-d' as const,
      evidencePath: 'apps/api/src/modules/exchange-adapter/exchange-registry.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'runtime-exchange-factory-binance',
      artifact: 'ExchangeFactory.create(BINANCE) → BinanceExchangeAdapter stub',
      kind: 'runtime' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Implemented — US209 stub; W4-E01 primary extension point',
      honestyRequirement: 'Factory must extend stub to vault-backed real I/O; no engine clone',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/src/modules/exchange-adapter/exchange-factory.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'runtime-handshake-http-client',
      artifact: 'exchange-handshake.http.ts — fetch client for vendor REST',
      kind: 'runtime' as const,
      owner: 'exchange-connectivity' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Implemented — vendor endpoint fetch; SSRF allowlist expected at Close',
      honestyRequirement: 'Vendor endpoints only; no operator-supplied URLs',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/src/modules/exchange-connectivity/exchange-handshake.http.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),

    // ── Durable state candidates ─────────────────────────────────────────────
    Object.freeze({
      artifactId: 'persist-vault-ciphertext',
      artifact: 'Vault ciphertext store — authoritative credential persistence',
      kind: 'persistence-candidate' as const,
      owner: 'secret-vault' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Exists — Wave 1 closed; survives restart',
      honestyRequirement: 'Vault is credential SoT; W4-E01 must not duplicate',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/secret-vault/secret-vault.service.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'persist-connection-records',
      artifact: 'connection_records — Connection Management durable metadata',
      kind: 'persistence-candidate' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Exists — operator connection product state',
      honestyRequirement: 'Status column must stay honest post W4-E01-b real round-trip',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/prisma/schema.prisma',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'persist-exchange-connections',
      artifact: 'exchange_connections — Exchange Adapter layer persistence',
      kind: 'persistence-candidate' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Exists — adapter connection rows; may reflect stub connect today',
      honestyRequirement: 'No new persistence owner; extend existing tables only',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/src/modules/exchange-adapter/prisma-exchange-adapter.repository.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'persist-binance-connection-continuity',
      artifact: 'Binance connection continuity / restart recovery durable state',
      kind: 'persistence-candidate' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Missing — W4-E01-d target; not implemented in slice a',
      honestyRequirement: 'Must not claim restart survival until W4-E01-d',
      futureW4E01Responsibility: 'W4-E01-d' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-implementation-package.md',
      existsToday: false,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),

    // ── Operator-visible artifacts ───────────────────────────────────────────
    Object.freeze({
      artifactId: 'ui-connections-page-binance',
      artifact: 'ConnectionsPage — Binance provider validate/disconnect UX',
      kind: 'operator-visible' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Routed paper product — default provider BINANCE',
      honestyRequirement: 'Connected label must require real round-trip; no simulation in UI',
      futureW4E01Responsibility: 'W4-E01-c' as const,
      evidencePath: 'apps/web/src/connections/ConnectionsPage.tsx',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'ui-web-validate-connection-client',
      artifact: 'Web validateConnection API client',
      kind: 'operator-visible' as const,
      owner: 'command-center' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Client exists — calls POST /v1/connections/:id/validate',
      honestyRequirement: 'Client alone ≠ Binance Connected Complete',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/web/src/shared/api.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'ui-honest-connected-label-product',
      artifact: 'Honest Connected / Error / Expired / permission operator labels',
      kind: 'operator-visible' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Partial — handshake errors mapped; full honesty rules W4-E01-c',
      honestyRequirement: 'Never Connected without vendor evidence; paper default preserved',
      futureW4E01Responsibility: 'W4-E01-c' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-overview.md',
      existsToday: false,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),

    // ── Security dependencies ────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'dep-consumes-authentication',
      artifact: 'Authentication — signed-in operator for connect/test/disconnect',
      kind: 'dependency' as const,
      owner: 'authentication' as const,
      durabilityClass: 'SURVIVE' as const,
      dependencyDirection: 'consumes' as const,
      currentStatus: 'Consumed — fail closed when missing',
      honestyRequirement: 'Reuse Wave 1 Authentication; no parallel login',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-security-review.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'dep-consumes-authorization',
      artifact: 'Authorization — PermissionClass.Projection for connection surfaces',
      kind: 'dependency' as const,
      owner: 'authorization' as const,
      durabilityClass: 'SURVIVE' as const,
      dependencyDirection: 'consumes' as const,
      currentStatus: 'Consumed — connect/test requires permitted role',
      honestyRequirement: 'Unauthorized deny; no new IAM',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-security-review.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'dep-consumes-workspace-isolation',
      artifact: 'Workspace Isolation — A↛B credentials and connection state',
      kind: 'dependency' as const,
      owner: 'workspace-isolation' as const,
      durabilityClass: 'SURVIVE' as const,
      dependencyDirection: 'consumes' as const,
      currentStatus: 'Consumed — cross-workspace deny required at Close',
      honestyRequirement: 'Foreign workspace must not connect/test with B credentials',
      futureW4E01Responsibility: 'W4-E01-e' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-security-review.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'dep-consumes-security-audit',
      artifact: 'Security Audit — connect/test/disconnect attribution events',
      kind: 'dependency' as const,
      owner: 'security-audit' as const,
      durabilityClass: 'SURVIVE' as const,
      dependencyDirection: 'consumes' as const,
      currentStatus: 'Consumed — lifecycle audit on connections',
      honestyRequirement: 'Emit required outcomes; do not own audit store',
      futureW4E01Responsibility: 'W4-E01-e' as const,
      evidencePath: 'apps/api/src/modules/connections/connection-lifecycle-audit.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'dep-produces-connection-audit-events',
      artifact: 'Connection lifecycle audit — produces connect/test/disconnect audit events',
      kind: 'dependency' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'SURVIVE' as const,
      dependencyDirection: 'produces' as const,
      currentStatus: 'Implemented — emits to Security Audit store on lifecycle transitions',
      honestyRequirement:
        'Audit events are attribution inputs; Connection Management does not own audit store',
      futureW4E01Responsibility: 'W4-E01-e' as const,
      evidencePath: 'apps/api/src/modules/connections/connection-lifecycle-audit.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'dep-blocked-by-stub-adapter',
      artifact: 'Stub BinanceExchangeAdapter blocks honest factory Connected',
      kind: 'dependency' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'EPHEMERAL' as const,
      dependencyDirection: 'blocked-by' as const,
      currentStatus: 'Active blocker — simulated connect without vault/vendor I/O',
      honestyRequirement: 'W4-E01-b must replace stub connect with real round-trip',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'apps/api/src/modules/exchange-adapter/adapters/venue.adapters.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),

    // ── Platform dependencies ────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'dep-depends-on-w2-connection-management',
      artifact: 'W2 Connection Management — CLOSED predecessor facade',
      kind: 'dependency' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'SURVIVE' as const,
      dependencyDirection: 'depends-on' as const,
      currentStatus: 'CLOSED — consumed; not redesigned',
      honestyRequirement:
        'Connection Management owns operator surface; W4-E01 extends adapter only',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-2/connection-management-overview.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'dep-depends-on-w2-s02-handshake',
      artifact: 'W2-S02 Exchange Connectivity Foundation — Binance early handshake',
      kind: 'dependency' as const,
      owner: 'exchange-connectivity' as const,
      durabilityClass: 'SURVIVE' as const,
      dependencyDirection: 'depends-on' as const,
      currentStatus: 'CLOSED context — real REST handshake on validate path',
      honestyRequirement: 'Early handshake ≠ full Wave 4 adapter factory honesty',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'docs/project/version-3/wave-2/w2-s02-implementation-package.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'dep-depends-on-exchange-scope-rc27',
      artifact: 'Exchange Scope RC-27 — isolation boundary; not transport',
      kind: 'dependency' as const,
      owner: 'exchange-scope' as const,
      durabilityClass: 'SURVIVE' as const,
      dependencyDirection: 'depends-on' as const,
      currentStatus: 'Exists — DEFAULT_BINANCE_EXCHANGE_SCOPE_ID; no venue I/O',
      honestyRequirement: 'Exchange Scope remains isolation SoT; adapter must not redefine cluster',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/exchange-scope/domain/exchange-scope-identity.ts',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'dep-observed-by-live-trading-engine',
      artifact: 'Live Trading Engine consumes ExchangeAdapterService.connect (US210)',
      kind: 'dependency' as const,
      owner: 'live-trading-deferred' as const,
      durabilityClass: 'EPHEMERAL' as const,
      dependencyDirection: 'observed-by' as const,
      currentStatus: 'Live-only consumer of stub adapter — out of paper W4-E01 scope',
      honestyRequirement: 'Live path ≠ paper Connected honesty; Wave 6 gate unchanged',
      futureW4E01Responsibility: 'out-of-scope-live-trading' as const,
      evidencePath: 'apps/api/src/modules/live-trading-engine/connection-supervisor.ts',
      existsToday: true,
      isPaperProduct: false,
      authorizesExchangeConnectivityComplete: false,
    }),

    // ── Operational ──────────────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'op-cm07-capability-inventory',
      artifact: 'CM-07 Binance connectivity capability — inventory entry',
      kind: 'operational' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Named — partial readiness; W4-E01 productization target',
      honestyRequirement: 'CM-07 label ≠ Binance Real I/O Complete until package Close',
      futureW4E01Responsibility: 'W4-E01-e' as const,
      evidencePath: 'docs/project/version-3/v3-capability-inventory.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'op-w4-e01-planning-approved',
      artifact: 'W4-E01 Planning Package — APPROVED; W4-E01-a inventory in progress',
      kind: 'operational' as const,
      owner: 'wave-4-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Planning APPROVED — slice a inventory only',
      honestyRequirement: 'Planning Approval ≠ Exchange Connectivity Complete',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-planning-approval.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),

    // ── Ownership surfaces ───────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'own-exchange-adapter-factory',
      artifact: 'Exchange Adapter factory — venue protocol I/O owner (extend only)',
      kind: 'ownership' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Verified existing owner — W4-E01 extends stub; no engine clone',
      honestyRequirement: 'Factory extension only; no second order path',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-product-scope.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'own-connection-management-facade',
      artifact: 'Connection Management — operator connect/test/disconnect facade',
      kind: 'ownership' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Verified existing owner — Wave 2 COMPLETE; consume not redesign',
      honestyRequirement: 'Facade owns operator product surface; adapter owns protocol I/O',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-product-scope.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'own-secret-vault-credentials',
      artifact: 'Vault — customer secret ciphertext owner',
      kind: 'ownership' as const,
      owner: 'secret-vault' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Verified existing owner — retrieve-only for adapter I/O',
      honestyRequirement: 'No local secret store; no plaintext echo',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-product-scope.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'own-exchange-scope-isolation',
      artifact: 'Exchange Scope / Cluster — isolation boundary owner (RC-27)',
      kind: 'ownership' as const,
      owner: 'exchange-scope' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Verified existing owner — not transport or credentials',
      honestyRequirement: 'Exchange Scope remains isolation SoT; adapter consumes scope id',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/exchange-scope/README.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),

    // ── Honesty boundaries ───────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'honesty-connected-not-live-trading',
      artifact: 'Connected ≠ Live Trading; Connected ≠ live order submission',
      kind: 'honesty-boundary' as const,
      owner: 'wave-4-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Binding — frozen in inventory',
      honestyRequirement: 'Paper remains default; Wave 6 gate unchanged',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-overview.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'honesty-connected-requires-round-trip',
      artifact: 'Connected requires real vendor round-trip with vault credentials',
      kind: 'honesty-boundary' as const,
      owner: 'wave-4-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Binding — stub adapter violates today; W4-E01-b fixes',
      honestyRequirement: 'Simulated CONNECTED without keys forbidden',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-product-scope.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'honesty-handshake-not-adapter-complete',
      artifact: 'Connection Management handshake ≠ Exchange Adapter factory Complete',
      kind: 'honesty-boundary' as const,
      owner: 'wave-4-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Binding — two parallel paths catalogued; must converge honestly',
      honestyRequirement: 'Validate path real REST does not Close W4-E01 alone',
      futureW4E01Responsibility: 'W4-E01-b' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-implementation-package.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'honesty-public-market-data-not-connected',
      artifact: 'Public market data REST/WS ≠ credentialed Connected',
      kind: 'honesty-boundary' as const,
      owner: 'wave-4-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Binding — adjacent W2-S03 / live-market-data paths separate',
      honestyRequirement: 'Public data enablement ≠ trading key connect Complete',
      futureW4E01Responsibility: 'out-of-scope-market-data-only' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-product-scope.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'honesty-e01-not-wave4-complete',
      artifact: 'W4-E01 ≠ Wave 4 COMPLETE; E01 ≠ Bybit/OKX/Kraken connected',
      kind: 'honesty-boundary' as const,
      owner: 'wave-4-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Binding — E02–E05 sequenced separately',
      honestyRequirement: 'Binance-only scope; no catalog venue Complete claims',
      futureW4E01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/wave-4-progress.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'honesty-no-engine-clone',
      artifact: 'No engine clone per venue; factory extension only',
      kind: 'honesty-boundary' as const,
      owner: 'wave-4-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Binding architecture invariant',
      honestyRequirement: 'Single Exchange Adapter factory; Exchange Scope isolation boundary',
      futureW4E01Responsibility: 'out-of-scope-engine-clone' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-implementation-package.md',
      existsToday: true,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),

    // ── Explicit OUT ─────────────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'out-rest-implementation-slice-a',
      artifact: 'REST implementation in W4-E01-a',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Forbidden — inventory only; W4-E01-b implements real adapter REST',
      honestyRequirement: 'Slice a catalogues endpoints; does not implement them',
      futureW4E01Responsibility: 'out-of-scope-rest-implementation' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-implementation-package.md',
      existsToday: false,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'out-websocket-implementation-slice-a',
      artifact: 'WebSocket implementation in W4-E01-a',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Forbidden — inventory only',
      honestyRequirement: 'Authenticated WS deferred beyond slice a',
      futureW4E01Responsibility: 'out-of-scope-websocket-implementation' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-implementation-package.md',
      existsToday: false,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'out-engine-clone-per-venue',
      artifact: 'Engine clone per venue / second Canonical Order Path',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Forbidden — architecture invariant',
      honestyRequirement: 'Factory extension only',
      futureW4E01Responsibility: 'out-of-scope-engine-clone' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-implementation-package.md',
      existsToday: false,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'out-live-trading-wave6',
      artifact: 'Live Trading / live order submission (Wave 6)',
      kind: 'explicit-out' as const,
      owner: 'live-trading-deferred' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Out of W4-E01 paper scope',
      honestyRequirement: 'Connect/test ≠ live capital orders',
      futureW4E01Responsibility: 'out-of-scope-live-trading' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-product-scope.md',
      existsToday: false,
      isPaperProduct: false,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'out-bybit-okx-kraken-e02-e04',
      artifact: 'Bybit / OKX / Kraken real I/O (V3-E02–E04)',
      kind: 'explicit-out' as const,
      owner: 'bybit-okx-deferred' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Out of W4-E01 — separate packages',
      honestyRequirement: 'Binance-only inventory baseline',
      futureW4E01Responsibility: 'out-of-scope-w4-e02' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-product-scope.md',
      existsToday: false,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
    Object.freeze({
      artifactId: 'out-venue-permission-product-e05',
      artifact: 'Venue permission verification product (V3-E05)',
      kind: 'explicit-out' as const,
      owner: 'venue-permission-deferred' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Out of W4-E01 — E05 sequenced later',
      honestyRequirement: 'Capability probe ≠ E05 Complete',
      futureW4E01Responsibility: 'out-of-scope-w4-e05' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-product-scope.md',
      existsToday: false,
      isPaperProduct: true,
      authorizesExchangeConnectivityComplete: false,
    }),
  ]);

export const W4_E01_A_BINDING_FINDINGS = Object.freeze({
  exchangeConnectivityCompleteAuthorized: false,
  customerVisibleFeatureFromSliceA: false,
  exchangeConnectivitySurvivesRestartAfterSliceA: false,
  binanceAdapterRealIoExists: false,
  connectionManagementRealHandshakeExists: true,
  stubAdapterSimulatedConnectExists: true,
  honestConnectedProductRulesFrozen: true,
  publicMarketDataSeparateFromCredentialedIo: true,
} as const);

export const W4_E01_A_EXPLICIT_OUT = Object.freeze([
  'rest-implementation',
  'websocket-implementation',
  'persistence-implementation',
  'restart-recovery',
  'operational-continuity',
  'new-persistence-owner',
  'new-bounded-context',
  'new-source-of-truth',
  'engine-clone',
  'live-trading-enablement',
  'w4-e01-b',
  'w4-e01-c',
  'w4-e01-d',
  'w4-e01-e',
  'master-plan-revision',
  'version-2-redesign',
  'ownership-change',
  'exchange-connectivity-complete',
] as const);

export const W4_E01_A_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateExchangeSubsystem: false,
  engineClonePerVenue: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  wave3Modified: false,
  exchangeConnectivityCompleteClaimed: false,
  binanceRealIoCompleteClaimed: false,
  liveTradingClaimed: false,
  wave4CompleteClaimed: false,
  customerVisibleFeature: false,
  exchangeConnectivitySurvivesRestart: false,
} as const);

export function artifactIds(): readonly string[] {
  return W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY.map((row) => row.artifactId);
}

export function rowsByKind(kind: W4E01AArtifactKind): readonly W4E01AInventoryRow[] {
  return W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY.filter((row) => row.kind === kind);
}

export function rowsSurvive(): readonly W4E01AInventoryRow[] {
  return W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY.filter(
    (row) => row.durabilityClass === 'SURVIVE',
  );
}

export function rowsEphemeral(): readonly W4E01AInventoryRow[] {
  return W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY.filter(
    (row) => row.durabilityClass === 'EPHEMERAL',
  );
}

export function rowsDependencies(
  direction: W4E01ADependencyDirection,
): readonly W4E01AInventoryRow[] {
  return W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY.filter(
    (row) => row.kind === 'dependency' && row.dependencyDirection === direction,
  );
}

export function rowsPaperProduct(): readonly W4E01AInventoryRow[] {
  return W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY.filter((row) => row.isPaperProduct);
}

export function rowsExplicitOut(): readonly W4E01AInventoryRow[] {
  return W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY.filter((row) => row.kind === 'explicit-out');
}

export function rowsHonestyBoundaries(): readonly W4E01AInventoryRow[] {
  return W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY.filter((row) => row.kind === 'honesty-boundary');
}

export function rowsExchangeConnectivitySurvive(): readonly W4E01AInventoryRow[] {
  return rowsSurvive().filter((row) =>
    [
      'exchange-adapter',
      'exchange-connectivity',
      'connection-management',
      'secret-vault',
      'exchange-scope',
    ].includes(row.owner),
  );
}

export function rowsExchangeConnectivityEphemeral(): readonly W4E01AInventoryRow[] {
  return rowsEphemeral().filter((row) =>
    [
      'exchange-adapter',
      'exchange-connectivity',
      'connection-management',
      'secret-vault',
      'exchange-scope',
      'live-trading-deferred',
      'live-trading-engine',
    ].includes(row.owner),
  );
}
