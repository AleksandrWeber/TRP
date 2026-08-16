# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
for Research Engine / Validation / Knowledge Schema versions tracked in
`docs/project/project-status.md` and `docs/research/version-history.md`.

## [Unreleased]

### Added

- Production Runtime Engine for paper trading — after Command Center Start
  Session, closed-candle market events drive the existing
  `RuntimeEvaluationService` and `StrategyTradingPipelineService.run()`
  path to paper orders, accounting, reporting, notification, and AI
  narrative. No new bounded context, Source of Truth, or REST resource.
  Version 2 Certification remains **SUSPENDED** pending architectural
  review. Reports: `docs/project/runtime-sequence-diagram.md`,
  `runtime-engine-implementation-report.md`,
  `runtime-engine-architecture-impact.md`,
  `runtime-engine-compatibility-report.md`,
  `runtime-engine-integration-report.md`,
  `runtime-engine-validation-report.md`,
  `runtime-engine-end-to-end-report.md`,
  `runtime-engine-customer-visible-changes.md`,
  `runtime-engine-product-readiness-delta.md`.

## [2.0.1] — 2026-08-16

### Added

- Version 2 Final Certification — paper-first customer product **CERTIFIED**.
  **VERSION 2 COMPLETE.** Product tag `v2.0.1`. Architecture tag `v2.0.0`
  (RC-28) is preserved and not moved. Live capital remains unauthorized.
  Version 3 is next planned work. Report:
  `docs/project/version-2-final-certification.md`. Passport:
  `docs/project/version-2-release-manifest.md`.
- Version 2 Final Validation and Release Candidate audit — Product
  Completion COMPLETE. PC-01 … PC-20 Closed. Architecture freeze held.
  Paper-first readiness **99%**. Production readiness **40%**. Architecture
  **100%**. Audit verdict was READY FOR CERTIFICATION; this release certifies
  it. Reports:
  `docs/project/version-2-final-validation-report.md`,
  `version-2-release-candidate-audit.md`,
  `version-2-release-readiness-report.md`.
- PC-20 Product UX Polish — Version 2 presents as one paper-first platform.
  Navigation is grouped under Research / Paper trading / Administration.
  Certification, Trading Orchestrator, Market Profile, and Notification
  Channels use canonical names. Shared breadcrumbs, page actions, empty,
  loading, error, and success chrome cover completed product homes.
  Overview shows the operator journey. Login states paper-first. Campaign
  history prefers existing workspace campaign sessions and export. No new
  APIs, domains, or ownership. Stop before Final Validation. Reports:
  `docs/project/pc-20-implementation-report.md`,
  `pc-20-validation-report.md`, `pc-20-product-readiness-delta.md`,
  `pc-20-release-notes.md`, `pc-20-ux-audit.md`,
  `pc-20-navigation-audit.md`, `pc-20-consistency-report.md`,
  `pc-20-customer-journey-audit.md`, `pc-20-accessibility-summary.md`.
- PC-17 AI Analytics Product — existing AI Analytics generation port is one
  customer product. REST adds list, generate, analysis detail, history, and
  provenance on `/v1/ai-analytics`. UI is AI Analytics Home, analysis
  browser, generate, history, narrative details, recommendations, reasoning,
  source viewer, comparison, and knowledge / report / strategy refs at
  `/ai-analytics`. AI Analytics remains narrative owner. Knowledge Lake,
  Reporting, Notification, and Research `/ai` are unchanged. No trading,
  persistence, or new storage. Stop before PC-20. Reports:
  `docs/project/pc-17-implementation-report.md`,
  `pc-17-validation-report.md`, `pc-17-product-readiness-delta.md`,
  `pc-17-release-notes.md`, `pc-17-ai-analytics-ux-audit.md`.
- PC-16 Knowledge Lake Product — existing Knowledge Lake query port is one
  customer product. REST adds list, search, entry detail, relationships,
  history, and provenance on `/v1/knowledge-lake`. UI is Knowledge Lake
  Home, search, filters, entry details, relationship viewer, metadata,
  history, references, and connected reports / narratives / research /
  strategies / market refs at `/knowledge-lake`. Knowledge Lake remains
  owner. Reporting, AI, and Research are unchanged. Research `/knowledge`
  is not renamed. No editing, ingestion, or new storage. Stop before
  PC-17. Reports: `docs/project/pc-16-implementation-report.md`,
  `pc-16-validation-report.md`, `pc-16-product-readiness-delta.md`,
  `pc-16-release-notes.md`, `pc-16-knowledge-lake-ux-audit.md`.
- Version 2 documentation cleanup — one canonical Product Completion status,
  historical-snapshot rule for closed package reports, PC-07 living name
  Notification Channels Product, Wave C = PC-12 / PC-08 / PC-09 / PC-10,
  and `docs/project/technical-debt.md` as the sole debt register. Reports:
  `docs/project/documentation-cleanup-report.md`,
  `docs/project/consistency-validation-report.md`,
  `docs/project/product-completion-status.md`.
- Wave C closed — Exchange Scope (PC-12), Qualification (PC-08), Market
  Profile (PC-09), and Market State (PC-10) are customer products. Product
  Readiness Audit v2 recalculates overall readiness 55% → 83%. Remaining
  packages: PC-16 Knowledge Lake, PC-17 AI Analytics, PC-20 UX Polish.
  Reports: `docs/project/wave-c-closure-report.md`,
  `docs/project/product-readiness-audit-v2.md`.
- PC-10 Market State Product — existing Market State current, lifecycle,
  transitions, history, metadata, and Qualification / Profile references are
  one customer product. REST adds workspace, current, history, target,
  lifecycle, transitions, version details, metadata, Qualification reference,
  Profile reference, and snapshot-preserving refresh on `/v1/market-states`.
  UI is Market State Home, Current State, Lifecycle, Transitions, Version,
  Metadata, Qualification reference, Profile reference, History, and Refresh
  at `/market-state`. Market State remains owner. Qualification, Profile, and
  Trading Orchestrator are unchanged. No classification. Domain `rest: false`
  is unchanged. Wave C **Closed**. Reports:
  `docs/project/pc-10-implementation-report.md`,
  `pc-10-validation-report.md`, `pc-10-product-readiness-update.md`,
  `pc-10-release-notes.md`, `pc-10-market-state-ux-audit.md`,
  `wave-c-closure-report.md`, `product-readiness-audit-v2.md`.
- PC-09 Market Profile Product — existing Market Profile latest, versions,
  history, metadata, dimensions, and published Qualification source are one
  customer product. REST adds workspace, latest, history, target, version
  details, metadata, dimensions, published source, and metadata-only compare
  on `/v1/market-profiles`. UI is Profile Home, Latest, Versions, History,
  Version Details, Metadata, Dimensions, Published Source, and Compare at
  `/market-profile`. Market Profile remains owner. Qualification and Market
  State are unchanged. No new profile calculations. Domain `rest: false` is
  unchanged. Stop before PC-10. Reports:
  `docs/project/pc-09-implementation-report.md`,
  `pc-09-validation-report.md`, `pc-09-product-readiness-update.md`,
  `pc-09-release-notes.md`, `pc-09-market-profile-ux-audit.md`.
- PC-08 Qualification Product — existing Market Qualification targets,
  runs, lifecycle, confidence, health, and history are one customer
  product. REST adds workspace, target browser, run list/detail, request,
  confirm, cancel, complete, fail, and requalify on `/v1/qualification`.
  UI is Qualification Home, Target Browser, Runs, Lifecycle, Confidence,
  Health, History, and Run Details at `/qualification`. Qualification
  remains owner. Profile and Market State are unchanged. No scoring.
  Domain `rest: false` is unchanged. Stop before PC-09. Reports:
  `docs/project/pc-08-implementation-report.md`,
  `pc-08-validation-report.md`, `pc-08-product-readiness-update.md`,
  `pc-08-release-notes.md`, `pc-08-qualification-ux-audit.md`.
- PC-12 Exchange Scope Product — existing Exchange Scope identity,
  lifecycle, config versions, policy inputs, bindings, and metadata are
  one customer product (UI: Cluster). REST adds workspace, venue catalog,
  list/get, create, rename, activate, suspend, archive, config, policy,
  and binding operations on `/v1/exchange-scopes`. UI is Cluster home,
  scope browser, current active, versions, bindings, policies, lifecycle,
  history, and metadata at `/clusters`. Exchange Scope remains owner.
  Runtime, Trading Session, and Deployment are unchanged. No venue
  adapters or exchange APIs. Domain `rest: false` is unchanged. Stop
  before PC-08. Reports: `docs/project/pc-12-implementation-report.md`,
  `pc-12-validation-report.md`, `pc-12-product-readiness-update.md`,
  `pc-12-release-notes.md`, `pc-12-scope-matrix.md`.
- PC-07 Notification Channels Product — existing RC-24 channel catalog,
  routing, preferences, and Telegram transport are one customer product.
  REST adds `GET /v1/notification-channels/workspace`,
  `GET /v1/notification-channels/:channelId`,
  `GET /v1/notification-channels/:channelId/diagnostics`, and
  `GET /v1/notification-channels/:channelId/deliveries`. Telegram
  connect/verify/test remain `/v1/telegram/*`. UI is channel cards,
  reserved disclosure, routing matrix, preference-clock frequency,
  global quiet hours, per-channel history, and diagnostics. Telegram is
  the only active channel. Reserved Email / Slack / Discord / Teams /
  Push stay reserved. No Bot API, SMTP, webhooks, or digest scheduler.
  J-13 Complete. Stop before PC-12. Reports:
  `docs/project/pc-07-implementation-report.md`,
  `pc-07-validation-report.md`, `pc-07-product-readiness-update.md`,
  `pc-07-release-notes.md`, `pc-07-channel-matrix.md`,
  `pc-07-routing-matrix.md`, `pc-07-delivery-matrix.md`.
- PC-06 Notification Product — existing RC-24 Notification Delivery
  preferences, routing, channel status, and recorded deliveries are a
  customer product. REST is `GET /v1/notification-settings`,
  `GET/PUT /v1/notification-preferences`, `GET /v1/notification-channels`,
  `GET /v1/notification-routing`, and `GET /v1/notification-deliveries`
  over existing queries. UI is Notification Settings, history, and
  detail. Telegram remains transport only. Reserved channels stay
  reserved. No scheduler, retries, or Bot API. J-12 Complete. Stop
  before PC-07. Reports: `docs/project/pc-06-implementation-report.md`,
  `pc-06-validation-report.md`, `pc-06-product-readiness-update.md`,
  `pc-06-release-notes.md`.
- PC-05 Reporting Product — existing RC-24 ReportRuns, narratives, and
  delivery status are a customer product. REST is `GET /v1/report-runs`
  and `GET /v1/report-definitions` over existing queries, distinct from
  research `/v1/reports`. UI is Reporting Home, browser, detail, history,
  search, filters, and projection JSON export. Reporting remains report
  owner. AI remains narrative only. Notification remains delivery only.
  No new report engine, types, or storage. J-10 Complete. Stop before
  PC-06. Reports: `docs/project/pc-05-implementation-report.md`,
  `pc-05-validation-report.md`, `pc-05-product-readiness-update.md`,
  `pc-05-release-notes.md`.
- PC-15 Product Flow Integration — slice 15-f: existing owner reads
  compose into Dashboard and Command Center projections. Command Center
  session GET adds latest report and delivery. Home shows paper session
  count and runtime from existing APIs. No new REST resource. No owner
  redesign. Dashboard remains projection only. Command Center remains
  command UI. PC-15 package **Closed**. Stop before PC-05. Reports:
  `docs/project/pc-15-f-implementation-report.md`,
  `pc-15-f-integration-report.md`, `pc-15-f-validation-report.md`,
  `pc-15-f-product-readiness-update.md`, `pc-15-f-release-notes.md`,
  `pc-15-f-flow-status.md`.
- PC-15 Product Flow Integration — slice 15-e: Notification Delivery
  reaches the existing in-memory Telegram adapter after the existing
  connect/complete bind. Reserved Email / Slack / Discord / Teams /
  Push keep the documented skip. No Telegram Bot API. No channel
  ownership change. Notification remains delivery only. Adapters remain
  transport only. No REST or UI. PC-15 package remains in progress.
  Stop before 15-f. Reports:
  `docs/project/pc-15-e-implementation-report.md`,
  `pc-15-e-integration-report.md`, `pc-15-e-validation-report.md`,
  `pc-15-e-product-readiness-update.md`, `pc-15-e-release-notes.md`.
- PC-15 Product Flow Integration — slice 15-d: completed ReportRun
  invokes Notification Delivery `deliver()`. Existing routing rules and
  notification types are applied. Delivery result is recorded.
  ReportRun stays immutable. Email, Slack, and Telegram Bot stay
  unactivated. Reporting remains report owner. Notification Delivery
  remains delivery only. No REST or UI. PC-15 package remains in
  progress. Stop before 15-e. Reports:
  `docs/project/pc-15-d-implementation-report.md`,
  `pc-15-d-integration-report.md`, `pc-15-d-validation-report.md`,
  `pc-15-d-product-readiness-update.md`, `pc-15-d-release-notes.md`.
- PC-15 Product Flow Integration — slice 15-c: completed ReportRun
  invokes AI Analytics `generateNarrative()`. Analytical Narrative is
  attached as a projection; ReportRun stays immutable. Unavailable
  Reporting still produces the existing unavailable narrative.
  Reporting remains report owner. AI remains narrative only. Lake
  unchanged. No REST or UI. PC-15 package remains in progress. Stop
  before 15-d. Reports:
  `docs/project/pc-15-c-implementation-report.md`,
  `pc-15-c-integration-report.md`, `pc-15-c-validation-report.md`,
  `pc-15-c-product-readiness-update.md`, `pc-15-c-release-notes.md`.
- PC-15 Product Flow Integration — slice 15-b: completed Market
  Qualification publishes a Market Profile version through existing
  `publishProfileVersion()`. Latest updates; prior versions and
  Qualification history stay immutable. Qualification remains
  qualification owner. Profile remains profile-version owner. No
  scoring, new calculations, REST, or UI. PC-15 package remains in
  progress. Stop before 15-c. Reports:
  `docs/project/pc-15-b-implementation-report.md`,
  `pc-15-b-integration-report.md`, `pc-15-b-validation-report.md`,
  `pc-15-b-product-readiness-update.md`, `pc-15-b-release-notes.md`.
- PC-15 Product Flow Integration — paper-first wiring of certified
  products. Slice 15-a: Trading Session consumes
  `SessionHandoffIntent` and creates a paper session; Command Center
  reflects it; orchestration history stays immutable. Orchestrator
  `createsSession` remains false. Trading Session remains Session
  owner. No Orders, Execution, Risk approvals, or Live Trading. J-09
  Complete. PC-15 package remains in progress. Stop before 15-b.
  Reports: `docs/project/pc-15-a-implementation-report.md`,
  `pc-15-a-integration-report.md`, `pc-15-a-validation-report.md`,
  `pc-15-a-product-readiness-update.md`, `pc-15-a-release-notes.md`.
- PC-13 Command Center Product — Command Center is the paper-first operations
  console: view sessions, create paper bots through the existing Session
  workflow, pause / resume / stop, monitor lifecycle, health, runtime status,
  Deployment reference, and Orchestration reference. REST is existing
  `/v1/trading-sessions` plus create/start, and `POST /v1/paper-accounts`.
  Command Center remains command UI only. Trading Session remains Session
  owner. Orchestrator, Deployment, and Runtime unchanged. No Orders, Kill
  Switch, or Live Trading. Command Center declared scope 100%. Overall
  readiness remains 58%. J-14 Complete. Stop before PC-15.
  Reports: `docs/project/pc-13-implementation-report.md`,
  `pc-13-command-center-ux-audit.md`, `pc-13-validation-report.md`,
  `pc-13-product-readiness-update.md`, `pc-13-release-notes.md`.
- PC-11 Trading Orchestrator Product — certified Trading Orchestrator is a
  customer product: plans, lifecycle, request, progress, Session Handoff
  Intent, and history. REST is `/v1/orchestrations` over existing
  service/query ports. Coordination only. `createsSession` remains false.
  Not an Orchestrator, Session, Deployment, or Runtime redesign. No Orders
  or Risk approvals. Orchestrator declared scope 100%. Overall readiness
  remains 58%. J-08 Complete. Stop before PC-13.
  Reports: `docs/project/pc-11-implementation-report.md`,
  `pc-11-orchestrator-ux-audit.md`, `pc-11-validation-report.md`,
  `pc-11-product-readiness-update.md`, `pc-11-release-notes.md`.
- PC-03 Deployment Product — certified Strategy Deployment is a customer
  product: wizard, list, details, history, status, metadata, Library
  Version, and Runtime Validation result. REST is existing
  `/v1/strategy-deployments` (optional `libraryEntryId`). Not a
  Deployment, Runtime, Library, or Session redesign. No Deploy Engine
  or automatic deploy. Deployment declared scope 100%. Overall
  readiness remains 58%. J-07 Complete. Stop before PC-11.
  Reports: `docs/project/pc-03-implementation-report.md`,
  `pc-03-deployment-ux-audit.md`, `pc-03-validation-report.md`,
  `pc-03-product-readiness-update.md`, `pc-03-release-notes.md`.
- PC-04 Runtime Validation Product — certified Runtime Enforcement Gate is a
  customer product: run validation, progress, PASS / FAIL, deterministic
  reasons, Strategy Version, timestamp, history, and read-only details.
  REST is `/v1/runtime-validations` over the existing `validateDeployment`
  port. Not a Runtime, Library, Deployment, or Session redesign. No
  override or soft-pass. Runtime Validation declared scope 100%. Overall
  readiness remains 58%. J-06 Complete. Stop before PC-03.
  Reports: `docs/project/pc-04-implementation-report.md`,
  `pc-04-runtime-validation-ux-audit.md`, `pc-04-validation-report.md`,
  `pc-04-product-readiness-update.md`, `pc-04-release-notes.md`.
- PC-02 Certification Product — certified Strategy Certification is a
  customer product: wizard, progress, result, history, reasons, and
  read-only metadata. REST is `/v1/strategy-library/certifications`
  over the existing Certification port. Successful admit fills Strategy
  Library Lookup. Not a certification, Library, Runtime, or Deployment
  redesign. Certification declared scope 100%. Overall readiness remains
  58%. J-04 Complete. Stop before PC-04.
  Reports: `docs/project/pc-02-implementation-report.md`,
  `pc-02-certification-ux-audit.md`, `pc-02-validation-report.md`,
  `pc-02-product-readiness-update.md`, `pc-02-release-notes.md`.
- PC-01 Strategy Library Product — certified Strategy Library is a customer
  product: browse, search, filter, version history, certification /
  eligibility / envelope state, and read-only immutable versions.
  REST is `/v1/strategy-library` over existing Lookup / Eligibility ports.
  `/strategies` remains research CRUD and is not Library. Not a Library
  redesign. Library declared scope 100%. Overall readiness remains 58%.
  J-05 Complete. Stop before PC-02.
  Reports: `docs/project/pc-01-implementation-report.md`,
  `pc-01-library-ux-audit.md`, `pc-01-validation-report.md`,
  `pc-01-product-readiness-update.md`, `pc-01-release-notes.md`.
- PC-14 Workspace Management — Workspace is a customer product: list,
  create, rename, archive, and switch inside the paper-first Operator
  Shell. Selection persists across refresh. Bootstrap remains the
  fallback. Not a tenancy or Identity redesign. Workspace declared
  scope 100%. Overall readiness remains 58%. J-02 Complete.
  Reports: `docs/project/pc-14-implementation-report.md`,
  `pc-14-workspace-ux-audit.md`, `pc-14-validation-report.md`,
  `pc-14-product-readiness-update.md`, `pc-14-release-notes.md`.
- PC-19 Operator Shell Product — paper-first Version 2 chrome. Research,
  Paper trading, and Administration navigation only. Live Trading, retired
  Production, epic fixtures, Coming Soon, disabled Emergency Controls, and
  Portfolio Reset (dev) removed from the product path. Not a UI redesign.
  Operator Shell declared scope 100%. Overall readiness remains 58%.
  Reports: `docs/project/pc-19-implementation-report.md`,
  `pc-19-ui-audit.md`, `pc-19-validation-report.md`,
  `pc-19-product-readiness-update.md`, `pc-19-release-notes.md`.
- PC-18 Identity Product — durable customer accounts on the existing Prisma
  `User` table; professional sign-in / create-account without prefilled
  developer credentials. JWT and `/auth` unchanged. Paper-first; does not
  imply Live Trading. Identity readiness 18% → 100%. Overall 55% → 58%.
  J-01 Complete.
  Reports: `docs/project/pc-18-implementation-report.md`,
  `pc-18-validation-report.md`, `pc-18-product-readiness-update.md`,
  `pc-18-release-notes.md`.

## [2.0.0] — 2026-08-14

### Added

- RC-28 Validation & Release — paper-first Version 2 certified and closed
  (`v2.0.0`). Workflow §5 gates PASS (typecheck, lint, tests, build, smoke,
  platform conformance **107/107**). READY = YES.
  Reports: `docs/project/rc-28-validation-report.md`,
  `rc-28-version-2-certification.md`, `rc-28-closure-report.md`.
- RC-28 Epic 6 — Version 2 certification & release readiness:
  eight completeness dimensions PASS; internal audit PASS; paper-first
  Version 2 READY for Validation & Release (separate task). No tag.
  Gate: **107/107 PASS** (`src/platform-conformance`; Epic 6 **12/12**).
  Reports: `docs/project/rc-28-epic6-version-2-certification.md`,
  `rc-28-epic6-internal-audit-report.md`, `rc-28-epic6-readiness-report.md`.
- RC-28 Epic 5 — Performance, resilience & compatibility verification:
  RC-19…RC-27 compatibility matrix; fail-closed / empty / unavailable
  resilience; startup integrity; projection availability; dependency-graph
  stability. No optimizations / runtime / ports / SoT.
  Gate: **95/95 PASS** (`src/platform-conformance`; Epic 5 **17/17**).
  Reports: `docs/project/rc-28-epic5-performance-resilience-compatibility.md`,
  `rc-28-epic5-compatibility-verification-report.md`,
  `rc-28-epic5-performance-resilience-report.md`.
- RC-28 Epic 4 — End-to-end scenario validation:
  eight representative journeys on frozen ports (certified deploy,
  paper session, Gate fail, isolation, reporting, AI, notification,
  Command Center). No new ports / SoT / behaviour.
  Gate: **78/78 PASS** (`src/platform-conformance`; Epic 4 **13/13**).
  Reports: `docs/project/rc-28-epic4-end-to-end-scenario-validation.md`,
  `rc-28-epic4-scenario-validation-report.md`.
- RC-28 Epic 3 — Authority & ownership verification:
  sole-owner map, authority graph, SoT uniqueness, alias bindings,
  isolation invariants 1–10, Tactics Contract Option B at Gate.
  Authority Matrix / Alias Dictionary unmodified. No new ports / SoT.
  Gate: **65/65 PASS** (`src/platform-conformance`; Epic 3 **19/19**).
  Reports: `docs/project/rc-28-epic3-authority-ownership-verification.md`,
  `rc-28-epic3-authority-verification-report.md`,
  `rc-28-epic3-ownership-verification-report.md`.
- RC-28 Epic 2 — Cross-domain workflow verification:
  frozen hop catalog Research Lab → Command Center; contract usage,
  ownership continuity, fail-closed Gate, consumer isolation.
  No new ports / SoT / behaviour.
  Gate: **46/46 PASS** (`src/platform-conformance`; Epic 2 **25/25**).
  Reports: `docs/project/rc-28-epic2-cross-domain-workflow-verification.md`,
  `rc-28-epic2-workflow-verification-report.md`.
- RC-28 Epic 1 — Platform integration boundaries:
  verification catalog composing RC-20…RC-27 owners; allowed consume graph,
  forbidden reverse edges, ownership uniqueness, AppModule compile integrity.
  Not a Nest module. No new ports / SoT / behaviour.
  Gate: **21/21 PASS** (`src/platform-conformance`).
  Reports: `docs/project/rc-28-epic1-platform-integration-boundaries.md`,
  `rc-28-epic1-integration-boundary-report.md`,
  `rc-28-epic1-boundary-diagram.md`.
- RC-27 — Multi-Exchange Scope (Epics 1–6) **CLOSED** (`v1.0.0-rc27`):
  Exchange Scope isolation boundary (identity / config / lifecycle /
  bindings / policy inputs / metadata); trading-path `exchangeScopeId`
  metadata; consumer-read projections; authority + isolation conformance.
  No engine clones / routing / Multi-Exchange UI. Validation **PASS**.
  Reports: `docs/project/rc-27-validation-report.md`,
  `rc-27-exchange-scope-certification.md`, `rc-27-closure-report.md`.
- RC-27 Epic 6 — Authority conformance, internal audit & readiness:
  ownership / dependency / isolation suites; Internal Audit **PASS**;
  Readiness = ready for Validation (Validation not run). No new product
  behaviour. Gate: exchange-scope **48/48 PASS**.
  Reports: `docs/project/rc-27-epic6-authority-conformance.md`,
  `rc-27-epic6-internal-audit-report.md`, `rc-27-epic6-readiness-report.md`.
- RC-27 Epic 5 — Exchange Scope consumer read ports:
  `ExchangeScopeConsumerReadService` + query adapter; immutable projections
  for identity / lifecycle / config / policy / bindings / metadata / active
  status; explicit workspace aggregate (no invented balances). No REST /
  commands / trading-path. Gate: 33/33 PASS.
  Report: `docs/project/rc-27-epic5-consumer-read-ports.md`.
- RC-27 Epic 4 — Trading Path Scope Integration:
  Thread `exchangeScopeId` through Order / Fill / Position / Ledger /
  Deployment / Runtime Context / Signal Intent / Lake / Reporting
  (default Binance; semantic hashes unchanged). Cross-scope Position /
  Runtime alignment reject. Additive Prisma defaults. No routing /
  multi-runtime / engine clones. Gate: 75/75 PASS (Epic 4 focus).
  Report: `docs/project/rc-27-epic4-trading-path-scope-integration.md`.
- RC-27 Epic 3 — Exchange Scope application ports:
  Nest `ExchangeScopeServicePort` / `QueryPort` / `ConsumerReadPort` over
  process-local store; register/activate/suspend/archive, config/policy
  publish, account bind, logical adapter context; immutable consumer
  projections. No trading-path, REST, or durable persistence.
  Gate: 24/24 PASS. Report: `docs/project/rc-27-epic3-application-ports.md`.
- RC-27 Epic 2 — Exchange Scope domain model:
  Immutable `ExchangeScope` / Version / Lifecycle / Config / Metadata /
  `ExchangeRiskPolicy` / `TradingAccountBinding` / `AdapterBindingContext`
  factories; Created→Active↔Suspended→Archived; append-only config/policy
  versioning with overwrite protection. No trading-path, REST, or persistence.
  Gate: 23/23 PASS. Report: `docs/project/rc-27-epic2-domain-model.md`.
- RC-27 Epic 1 — Exchange Scope boundary:
  Nest module `exchange-scope` with frozen ownership invariants
  (`exchange_scope_artifact`), inactive application ports, and
  dependency-direction tests. RC-19 Binance identity preserved. No
  lifecycle behaviour, trading-path integration, REST, persistence, or
  transport. Gate: 15/15 PASS.
  Report: `docs/project/rc-27-epic1-exchange-scope-boundary.md`.
- RC-26 — Trading Orchestrator + Market State (Epics 1–6):
  Market State current-condition domain + observational reads + consumer
  projections; Trading Orchestrator coordination domain + workflow ports
  (Library Lookup/Eligibility + Runtime Gate fail-closed + Session handoff
  intent). No Session/Orders/Risk ownership, REST, or persistence product.
  Validation PASS. Tag `v1.0.0-rc26`.
  Closure: `docs/project/rc-26-closure-report.md`.
  Certification: `docs/project/rc-26-trading-orchestrator-market-state-certification.md`.
- RC-26 Epic 6 — Consumer read ports + authority conformance + readiness:
  `MarketStateConsumerReadPort` and `TradingOrchestratorConsumerReadPort`
  with immutable projections; authority conformance suite; internal audit
  PASS; consumed by Validation & Closure. No REST/persistence/execution.
  Gate: 63/63 PASS (market-state + trading-orchestrator).
  Reports: `docs/project/rc-26-epic6-consumer-read-authority.md`,
  `rc-26-epic6-internal-audit-report.md`, `rc-26-epic6-readiness-report.md`.
- RC-26 Epic 5 — Trading Orchestrator workflow ports:
  `TradingOrchestratorServicePort` / `QueryPort` +
  `OrchestrationWorkflowCoordinator` sequencing Market State → Library
  Lookup/Eligibility → Runtime Enforcement Gate → Session handoff intent.
  Delegation only; fail-closed Gate; no Session/Orders/Risk ownership, REST,
  or persistence. Gate: 28/28 PASS (trading-orchestrator). Report:
  `docs/project/rc-26-epic5-trading-orchestrator-workflow-ports.md`.
- RC-26 Epic 4 — Trading Orchestrator domain model:
  Immutable `TradingOrchestrator` / `OrchestrationPlan` / Intent /
  Lifecycle / Metadata factories; Created→Planned→Ready→Cancelled|Archived
  edges; append-only plan versioning with overwrite protection. No workflow,
  selection, Runtime/Session, REST, or persistence. Gate: 21/21 PASS
  (trading-orchestrator); RC-26 regression 46/46. Report:
  `docs/project/rc-26-epic4-trading-orchestrator-domain-model.md`.
- RC-26 Epic 3 — Market State domain model & lifecycle:
  Immutable `MarketState` / Version / Lifecycle / Snapshot / Metadata
  factories; Created→Active→Superseded→Archived edges; append-only
  versioning with overwrite protection. No classification algorithms,
  orchestration, REST, or persistence. Gate: 25/25 PASS (market-state).
  Report: `docs/project/rc-26-epic3-domain-model.md`.
- RC-26 Epic 2 — Market State input integration:
  Read-only adapters for Live Market Data, Market Qualification consumer
  projections, and Market Profile consumer projections. Immutable input
  models; no classification, orchestration, REST, or persistence.
  Gate: 17/17 PASS (market-state).
  Report: `docs/project/rc-26-epic2-market-state-input-integration.md`.
- RC-26 Epic 1 — Trading Orchestrator & Market State boundary:
  Nest modules `market-state` + `trading-orchestrator` with frozen ownership
  invariants, inactive application ports, and dependency-direction tests.
  No classification, orchestration, Runtime/Session/Orders/Risk wiring, REST,
  or persistence. Gate: 24/24 PASS.
  Report: `docs/project/rc-26-epic1-trading-orchestrator-market-state-boundary.md`.
- RC-26 Planning Package — Trading Orchestrator + Market State:
  Implementation Plan, Epic Breakdown, API Contract (ports), Domain Model
  Contract, Integration Diagram, Validation Summary, Architecture Consistency
  Report. Planning only — STOP before Epic 1.
  Plan: `docs/project/rc-26-implementation-plan.md`.
- RC-25 — Market Qualification + Market Profile (Epics 1–6):
  Qualification lifecycle ports, immutable Market Profile versioning,
  consumer read projections for future Orchestrator / Reporting / AI.
  No scoring algorithms, Runtime integration, Orchestrator, REST, or
  persistence product. Validation PASS. Tag `v1.0.0-rc25`.
  Closure: `docs/project/rc-25-closure-report.md`.
  Certification: `docs/project/rc-25-market-qualification-profile-certification.md`.
- RC-25 Epic 6 — Consumer read ports & authority conformance:
  read-only façades for future Orchestrator / Reporting / AI; immutable
  projections; Internal Audit PASS; readiness for Validation & Release
  (separate). No Orchestrator / Runtime / REST / persistence.
  Report: `docs/project/rc-25-epic6-consumer-read-authority.md`.
- RC-25 Epic 5 — Market Profile immutable versioning:
  `MarketProfileServicePort` / `MarketProfileQueryPort` with append-only
  publish, latest/by-version/history queries, and completed-run gate.
  No calculation, REST, or persistence product.
  Report: `docs/project/rc-25-epic5-market-profile-versioning.md`.
- RC-25 Epic 4 — Market Qualification lifecycle & application ports:
  `MarketQualificationServicePort` / `MarketQualificationQueryPort` with
  request/confirm/cancel/complete/fail runs, immutable lifecycle records,
  heavy-work confirm gate, and query views. No scoring, profile publish,
  REST, or persistence product.
  Report: `docs/project/rc-25-epic4-qualification-lifecycle-ports.md`.
- RC-24 — Reporting, AI Analytics & Notification Delivery (Epics 1–6):
  Reporting boundary + Lake reads + domain model + deterministic report
  generation; AI analytical narratives over ReportRun; Notification Delivery
  Layer (`notification-delivery` module) with Telegram channel adapter,
  preferences, connection workflow, and delivery routing. Telegram remains
  notification projection only (not a control plane). Validation PASS.
  Tag `v1.0.0-rc24`. Closure: `docs/project/rc-24-closure-report.md`.
  Certification: `docs/project/rc-24-reporting-ai-notification-certification.md`.
- RC-23 — Runtime Enforcement (Epics 1–6): sole validation Gate between
  Strategy Library SoT and Strategy Deployment / Trading Session
  (`runtime-enforcement` module) with Library read ports, fail-closed
  `validateDeployment`, Deployment authorization stamp, and Session start
  protection. Orchestrator / Selection deferred. Tag `v1.0.0-rc23`. Closure:
  `docs/project/rc-23-closure-report.md`. Certification:
  `docs/project/rc-23-runtime-enforcement-certification.md`.
- RC-22 — Strategy Library domain (Epics 1–6): certified strategy membership
  (`strategy-library` module) with Strategy/Version model, immutable
  certification + evidence refs, library tactical envelope, static eligibility,
  and deprecate/archive lifecycle. Nest application ports and persistence
  intentionally deferred. Tag `v1.0.0-rc22`. Closure:
  `docs/project/rc-22-closure-report.md`. Certification:
  `docs/project/rc-22-strategy-library-certification.md`.
- RC-21 — Knowledge Lake foundation (Epics 1–6): append-only analytical
  projection warehouse (`knowledge-lake` module) with ingestion port, trading-path
  - Research Lab one-way producers, consumer-safe query port, and authority
    conformance. Tag `v1.0.0-rc21`. Closure:
    `docs/project/rc-21-closure-report.md`. Certification:
    `docs/project/rc-21-knowledge-lake-certification.md`.
- RC-20 — Command Center foundation (Epics 1–6): ops workspace route,
  BotFacade read + lifecycle adapters, client navigation, in-memory
  notifications, Emergency Controls interaction model (disabled until
  durable ports). Closure: `docs/project/rc-20-closure-report.md`.
- RC-18 Mid-Release — US290–US293 production-recovery residuals + docs sync
  (`trading-session/`, composition ports, Prisma RecoveryState/Incident):
  force/confirm `RECOVERING` (US290); real reconcile adapters (US291);
  durable RecoveryState + phase machine (US292); durable Incident fail-closed
  (US293). RIV-001 / SIG-001 / mid-release health review / Residual Register /
  Tech Lead Decision Log / RC-18 development process synchronized. Remaining
  mandatory: US294 chaos evidence, US295 ADL-008. See
  `docs/project/rc-18-mid-release-health-review.md`.
- RC-17 Release Closure — Runtime Recovery **BASELINED**
  (`docs/project/`): retrospective, release history, project status, roadmap,
  architecture snapshot, and TD-036 residual ownership synchronized. E17
  US240–US249 + US244A are the reference implementation; production
  restart-safety remains subject to RC-18 mandatory residuals. See
  `docs/project/rc-17-retrospective.md`.
- RC-17 E17 US249 — Recovery Completion & Session Exit
  (`trading-session/`): after a terminal Stage 3 outcome (SignalIntent
  generated, non-actionable evaluation, or controlled termination), verify
  US240–US246 pipeline consistency, exit Session from `RECOVERING`, release
  recovery lease ownership, and emit `TradingSessionRecoveryCompleted`. No
  Orders or Runtime lifecycle mutation. See
  `docs/project/epics/e17-us249-recovery-completion.md`.
- RC-17 E17 US248 — Deterministic SignalIntent Generation
  (`trading-session/`): after a successful US247 evaluation decision, validate
  ARMED Runtime + Session/identity gates and emit exactly one SignalIntent via
  `StrategyRuntimePort.emitSignalIntent`. No Orders, Execution Engine,
  Accounting, or checkpoint writes. See
  `docs/project/epics/e17-us248-deterministic-signal-intent-generation.md`.
- RC-17 E17 US247 — First Deterministic Strategy Evaluation
  (`trading-session/`): after Runtime is `ARMED`, admit a market event and run
  pure `decideRuntimeEvaluation` against restored checkpoint-bound context.
  Produces an evaluation decision only — no SignalIntent emission, Orders,
  checkpoint writes, or `StrategyRuntimePort.evaluate` commit path. See
  `docs/project/epics/e17-us247-first-deterministic-strategy-evaluation.md`.
- RC-17 E17 US246 — Deterministic Runtime Arming (`trading-session/`): after
  `EVENT_ADMISSION_ENABLED`, re-validate lease, kill-switch, lifecycle,
  acceptsTicks, worker health, and runtime identity before transitioning
  Runtime to `ARMED`. Evaluation becomes allowed by lifecycle gates, but this
  slice performs no strategy evaluation, SignalIntent, Orders, or checkpoint
  writes. See `docs/project/epics/e17-us246-deterministic-runtime-arming.md`.
- RC-17 E17 US245 — Deterministic Event Admission (`trading-session/` +
  `strategy-runtime/`): after local recovery `READY`, a dedicated admission gate
  verifies lease validity, kill-switch policy, idle runtime lifecycle, and
  duplicate prevention before transitioning Runtime to
  `EVENT_ADMISSION_ENABLED`. Tick admission becomes externally reachable while
  evaluation, SignalIntent, Orders, and checkpoint writes remain blocked. See
  `docs/project/epics/e17-us245-deterministic-event-admission.md`.
- RC-17 E17 US244 — Deterministic Runtime Resume (`trading-session/`): after
  successful discovery/lease/checkpoint/reconcile, hydrate Runtime into local
  recovery `READY` while worker remains `IDLE` and `acceptsTicks=false`. No
  market processing, evaluation, SignalIntent, or Orders. See
  `docs/project/epics/e17-us244-runtime-resume.md`.
- RC-17 E17 US243 — Recovery State Reconciliation (`trading-session/`): after
  lease + `VALID_CHECKPOINT`, read-only cross-context reconcile via local
  `RECOVERY_RECONCILIATION_PORTS`. Outcomes `RECONCILED` /
  `RECONCILIATION_FAILED`. See `docs/project/epics/e17-us243-reconciliation.md`.
- RC-17 E17 US242 — Recovery Checkpoint Discovery & Validation
  (`trading-session/`): after `LEASE_ACQUIRED`, load latest strategy checkpoint
  via `StrategyRuntimePort` and validate integrity/Session consistency.
  Outcomes `VALID_CHECKPOINT` / `NO_CHECKPOINT` / `INVALID_CHECKPOINT` only.
  See `docs/project/epics/e17-us242-checkpoint-validation.md`.
- RC-17 E17 US241 — Recovery Lease Acquisition (`trading-session/`): exclusive
  fenced lease via optimistic `saveIfVersion` CAS after US240 discovery.
  Outcomes `LEASE_ACQUIRED` / `LEASE_DENIED` only; no checkpoint, reconcile, or
  Runtime resume. See `docs/project/epics/e17-us241-startup-recovery-lease.md`.
- RC-17 E17 US240 — Startup Recovery Discovery (`trading-session/`): deterministic
  process-bootstrap discovery of recovery-eligible Trading Sessions with exactly
  one selected candidate (or `no_recovery_required`). No force-`RECOVERING`,
  lease, checkpoint, reconcile, or Runtime resume in this slice. See
  `docs/project/epics/e17-us240-startup-recovery-discovery.md`.

### Changed

- Documentation — RC-17 baseline synchronization: RC-16 marked **BASELINE
  ACCEPTED** (M3 canonical path US211–US223); residual M3 hooks / M4–M7 product
  intent transferred to RC-17; Epic E17–E21 and story band **US240–US299**
  governed; ADL cross-linked from ADR index. See
  `docs/project/release-history.md` and `docs/project/story-id-allocation.md`.

### Added

- RC-16 M3 US223 — End-to-end strategy candle → Fill → accounting
  (`strategy-trading-pipeline/`): `run` orchestrates Runtime evaluate →
  Signal Intent → Order proposal → canonical Risk/Execution → existing
  `PositionAccountingConsumer`. Replay/duplicate Fill prevented; NO_ACTION
  produces no Order. DB origin check updated for strategy sessions.
- RC-16 M3 US222 — Canonical Risk + Execution path (`canonical-order-path/`):
  `runCanonicalPath` / `advanceToExecutable` wire proposed strategy-origin
  (and manual) Orders through existing `RiskDecisionService` + cash reservation
  - `ExecutionEngineService.submit`. Signal Intent identity/origin preserved
    end-to-end; duplicate submit is idempotent. No new adapters or Runtime
    coupling.
- RC-16 M3 US221 — Orders Signal Intent intake (`orders/`):
  `proposeOrderFromSignalIntent` / `ORDER_PROPOSAL_PORT`, strategy-origin
  Order Intent with immutable `signalIntentId`/`signalIntentHash`, idempotent
  Signal Intent → PROPOSED Order mapping, and NO_ACTION → no Order. No Risk,
  Execution, Fill, Portfolio, Position, or Session lifecycle coupling.
- RC-16 M3 US220 — Session ↔ Runtime lifecycle drain (`strategy-runtime/` +
  `trading-session/`): `RuntimeLifecycleCoordinator` (IDLE/ARMED/EVALUATING/
  DRAINING), `StrategyRuntimePort.arm|pause|resume|stop`, Session notifies
  Runtime through the port only, in-flight evaluation drained before IDLE.
  Checkpoint/Intent atomicity and replay guarantees preserved. No Orders/Risk/
  Execution.
- RC-16 M3 US219 — Runtime evaluation pipeline (`strategy-runtime/`):
  `StrategyRuntimePort.evaluate` admits a semantic tick, decides
  Signal Intent \| NO_ACTION via pure Deployment-parameter evaluation, and
  commits Intent (when actionable) + Strategy Checkpoint + Outbox in one
  transaction. Duplicate execution returns `ALREADY_PROCESSED`. No Orders,
  Risk, or Execution coupling.
- RC-16 M3 US218 — Semantic closed-candle tick admission (`strategy-runtime/`):
  `ClosedCandleTickEvent` + `RuntimeLeaseProof` contracts, pure
  `admitClosedCandleTick` gate (duplicate/stale/out-of-order/lease rejection),
  and `StrategyRuntimePort.admitTick` entry. Admission only — no evaluation,
  Signal Intent generation, checkpoint advance, Orders, Risk, or Execution.
- RC-16 M3 US217 — Trading Session ↔ Strategy Deployment binding:
  `origin: strategy` sessions require an APPROVED Deployment by id on create,
  initialize `RuntimeContext` through `StrategyRuntimePort.loadContext` during
  start, and keep Session free of evaluation/Orders/Risk/Execution. Manual
  origin remains for M2 compatibility.
- RC-16 M3 US216 — Strategy Runtime module boundary (`strategy-runtime/`):
  `StrategyRuntimePort` / `StrategyRuntimeService` shell composing approved
  Strategy Deployment with Signal Intent and Strategy Checkpoint,
  `RuntimeContext` / `RuntimeDiagnostics` contracts, Nest DI export of
  `STRATEGY_RUNTIME_PORT`, and dependency-boundary tests. No evaluation,
  scheduler, Session binding, Orders, Risk, or Execution coupling.
- RC-16 M3 US215 — Strategy Checkpoint contracts (`strategy-runtime/`):
  versioned monotonic Runtime progress aggregate (`deploymentId`, `sessionId`,
  `lastProcessedCandle`, `lastProcessedEventId`, `runtimeVersion`), PostgreSQL
  `strategy_checkpoints` persistence, Outbox `StrategyCheckpointAdvanced`, and
  internal save/load service ports. Resume pointer only — no Orders, Risk,
  Execution, Fill, Position, or Trading Session lifecycle ownership.
- RC-16 M3 US214 — Signal Intent bounded context (`strategy-runtime/`):
  immutable append-only Signal Intent aggregate with stable `intentHash`
  identity/dedupe, PostgreSQL `signal_intents` persistence, Outbox
  `SignalIntentCreated` event, internal emit service port, and read-only
  get/list query APIs. Canonical Strategy Runtime output — not an Order; no
  Risk evaluation, Execution Engine, Fill, or Trading Session lifecycle
  coupling.
- RC-16 M3 US211 — Strategy Deployment bounded context (`strategy-deployment/`):
  immutable draft→approved Deployment aggregate with provenance hash,
  PostgreSQL `paper_strategy_deployments` persistence (separate from Stage-1
  `StrategyDeployment`), Outbox `StrategyDeploymentCreated` /
  `StrategyDeploymentApproved` events, and authorized create/approve/get/list
  APIs. Owns configuration only — no Trading Session runtime, signals, Orders,
  Risk evaluation, or Execution Engine coupling.

## [1.0.0] — 2026-07-20

### Summary

Official stable release of **Trading Platform Version 1**. Production baseline
on branch `main`. Release candidate `v1.0.0-rc1` remains historical.

Certification gates: RC-1 PASS · RC-2 PASS · RC-3 PASS · RC-4 PASS.

### Major Components

#### Research Platform

- Historical Research Engine, campaigns, walk-forward, knowledge, pipelines
- Execution Simulator and Research & Simulation stack (RC-15 / RC-15.1)
- Research Control Center and runtime health surfaces

#### Trading Platform

- Portfolio Engine (US204)
- Position Engine (US205)
- Order Lifecycle (US206)
- Exchange Adapter (US209)
- Live Trading Workspace (US210)

#### Paper Trading

- Durable paper accounts, sessions, orders, fills (RC-16 M1–M2 foundation)
- Paper Trading coordinator over Trading Core (US208)

#### Live Trading

- Live Trading Workspace with emergency Kill Switch controls
- Exchange Adapter I/O boundary (no business accounting ownership)

#### Risk Engine

- Risk evaluation gate before execution (US207)
- Risk evaluates; does not execute

#### Optimization

- Strategy optimization surfaces in the Research Platform

#### Analytics

- Performance analytics / benchmark reporting
- Simulation Performance and Research Report domains

#### Engineering Certification

- RC-1 scorecard: Repository, Dependencies, Static Analysis, Build, Database,
  Tests, Architecture, Smoke, Performance, Security, Documentation — all PASS
- Artifacts under `docs/releases/`

#### CI/CD Pipeline

- Local pipeline: `pnpm release:rc` / `pnpm release:validate` (RC-2)
- GitHub Actions: CI, PR, Release, Nightly, Security (RC-3)
- Production promotion and stable tag `v1.0.0` (RC-4)

### Known Limitations

- Kill switch position close may bypass the preferred order-lifecycle path
  (architecture warning; non-blocking)
- Smoke validation registers UI routes; full browser E2E is not executed in
  the release smoke phase
- Coverage report is not attached to the GitHub Release when unavailable
- Items in [`docs/project/technical-debt.md`](./docs/project/technical-debt.md)
  remain accepted for V1 maintenance

### Future Roadmap

See [`docs/project/roadmap.md`](./docs/project/roadmap.md) and
[`docs/future/`](./docs/future/). Version 2 planning may continue from the V1
baseline without modifying V1 architecture unless a new ADR is accepted.

Completion report: [`docs/releases/V1-COMPLETION.md`](./docs/releases/V1-COMPLETION.md)

### Prior work retained in this baseline

The following historical notes remain part of the V1 codebase lineage
(previously tracked under `[Unreleased]` during RC-16 delivery):

- RC-16 M1 US126 — Live Market Data Domain Contracts
  (`apps/api/src/modules/live-market-data/`): immutable provider-neutral
  closed-candle, mark-price, and market-status events plus subscription and
  checkpoint contracts.
- RC-16 M1 US127 — Market Event Identity and Timestamp Semantics: deterministic
  stream IDs, semantic deduplication identity independent of UUID/operational
  clocks, distinct exchange/domain vs received/processed/recorded timestamps.
- RC-16 M1 US128 — Transactional Outbox Persistence (`event-processing/`):
  ADR-013 durable envelope, atomic accepted-state + Outbox commit, immutable
  envelopes with mutable delivery metadata, ordered unpublished retrieval,
  Prisma `OutboxEvent` model.
- RC-16 M1 US129 — Consumer Inbox and Checkpoints: unique `consumerId+eventId`,
  duplicate no-op, atomic Inbox+projection+checkpoint, blocked-gap deferral,
  restart-surviving checkpoints, Prisma Inbox/Checkpoint models.
- RC-16 M1 US130 — Outbox Dispatcher, Retry, and Dead Letters: in-process
  polling dispatcher, attempt/backoff policy, durable dead-letter state, and
  shutdown that leaves unpublished events recoverable.
- RC-16 M1 US131 — Live Market Connector Port and Registry: public-stream
  connector port, duplicate-source registration guard, fake connector tests
  without network access.
- RC-16 M1 US132 — Binance REST Metadata and Backfill Adapter: exchangeInfo
  precision mapping, bounded closed-candle backfill, rate-limit retry; Binance
  payloads remain adapter-internal.
- RC-16 M1 US133 — Binance WebSocket Connection Lifecycle: explicit connection
  states, subscription ack tracking, idempotent subscribe/unsubscribe, clean
  shutdown, raw messages retained inside adapter; no private credentials.
  Epic E2-A complete.
- RC-16 M1 US134 — Connector Reconnect and Rate-Limit Resilience: immediate
  disconnect health transition, bounded reconnect backoff/jitter, heartbeat
  timeout, non-busy-loop rate-limit delays, RECOVERING until gap recovery.
  Epic E2-B complete.
- RC-16 M1 US135 — Closed-Candle Normalization: reject open candles; OHLC
  validation; semantic equality independent of operational clocks; Binance
  kline mapping stays adapter-internal.
- RC-16 M1 US136 — Mark-Price Normalization: positive finite price; explicit
  mark source; deterministic identity; configurable publication/retention
  policy; no Position/Portfolio/fill logic.
- RC-16 M1 US137 — Data Validation and Quarantine: invalid drafts quarantine
  with reason + raw fingerprint (secrets stripped); stream-safe per-draft
  failures. Epic E3-A complete.
- RC-16 M1 US138 — Duplicate and Stream-Ordering Control: semantic/event-id
  dedup, per-stream sequence admit, stale ignore+metrics, deferred gap blocks
  only the affected stream (no global order).
- RC-16 M1 US139 — Gap Detection and REST Recovery: deterministic candle gaps,
  REST backfill via same validate/admit path, overlap elimination, RECOVERING
  until close, unresolved gaps remain visible. Epic E3-B / Epic E3 complete.

- RC-16 M1 US140 — Workspace-Scoped Subscription Registry: deterministic
  workspace-scoped identity, idempotent subscribe/unsubscribe, desired state
  survives connector replacement, strict workspace isolation.
- RC-16 M1 US141 — Durable Market Stream Checkpoints: Prisma-backed
  market_stream_checkpoints, advance gated on durable event recording,
  regression rejected, heartbeat separate from semantic progress. Epic E4-A
  complete. Fixed eslint unused-import in accepted-market-stream-state.

- RC-16 M1 US142 — Startup Recovery and Resubscription: durable subscription
  hydrate, checkpoint-seeded integrity, elapsed-gap REST backfill, live-event
  buffering until reconciliation, healthy only after checkpoint reconcile.
- RC-16 M1 US143 — Latest Market State Projection: Inbox-idempotent apply,
  workspace/stream-scoped read model with explicit freshness, rebuild from
  retained events/checkpoints; no strategy/Position/Portfolio/Risk. Epic E4
  complete.

- RC-16 M1 US144 — Market Status and Staleness Model: explicit health
  transitions; operational-time freshness; STALE/UNAVAILABLE; durable versioned
  MarketStatusChanged events; health never mutates candle/price semantics.
- RC-16 M1 US145 — Market Data Logging, Metrics, and Health Checks: bounded-label
  metrics (rate/lag/dupes/invalids/gaps/reconnects/backfill/outbox/consumer/
  dead-letters), secret-safe structured logs, readiness vs liveness probes.
  Epic E5-A complete.
- RC-16 M1 US146 — Market Status and Query API: workspace-scoped read-only
  GET endpoints for subscriptions, stream status, latest projections, and
  checkpoints; provider-neutral DTOs; no Orders/Sessions/strategy.
- RC-16 M1 US147 — Live Projection Channel: SSE fan-out of canonical
  projections with reconnect cursors, drop-oldest backpressure, and channel
  isolation from ingestion; `authoritative: false` on all envelopes.
  Epic E5 complete. M1 Live Market Data Foundation complete.
- RC-16 M1 US148–US152 — Epic E6 Mini Validation: contract/fixtures, PostgreSQL
  Outbox/Inbox/checkpoint integration (Prisma drivers + migration), deterministic
  replay, failure injection, performance baselines, architecture conformance.
  Verdict: PASS WITH MINOR RECOMMENDATIONS. Results:
  `docs/project/rc-16-m1-mini-validation.md`. M1 complete.
- RC-16 M2 US153 — Decimal and Financial Value Contracts: exact decimal
  arithmetic, canonical string serialization, explicit price/quantity/money/fee
  scales and rounding policies; binary floating-point input is rejected.
- RC-16 M2 US154 — Durable Paper Account: PostgreSQL paper-only accounts with
  `DECIMAL(38,18)` immutable opening-capital instructions, workspace-scoped
  lookup/idempotency, lifecycle contracts, and atomic `PaperAccountCreated`
  Outbox commit. Account state is not a mutable cash authority.
- RC-16 M2 US155 — PostgreSQL Event Runtime Wiring: Nest runtime now binds
  Outbox/Inbox/checkpoints and transactional writer to Prisma; lifecycle polling
  preserves unconsumed rows and performs durable at-least-once delivery.
  TD-035 and TD-038 resolved. Epic E7-A complete.
- RC-16 M2 US156 — Trading Session Core: durable manual ADR-014 Sessions with
  workspace/account ownership, immutable deployment references, and rejected
  transitions recorded via Outbox audit events. No strategy scheduler.
- RC-16 M2 US157 — Fenced Manual Execution Eligibility: lease generation,
  fencing tokens, heartbeat, and RUNNING-only execution eligibility. Lease
  clocks remain operational and never enter financial math.
- RC-16 M2 US158 — Workspace and Command Authorization: Trader role,
  Trader/Admin trading command gate, workspace membership checks, retained
  actor/correlation/idempotency context, and production JWT secret hardening.
  Epic E7 complete.
- RC-16 M2 US159 — Order Intent and Identity Contracts: immutable paper-only
  manual market/limit intents with decimal quantity/price, stable Order/client/
  idempotency/intent identities, fenced Session and market-checkpoint
  references, and reduce-only sells.
- RC-16 M2 US160 — Order Aggregate and State Machine: Orders-owned explicit
  lifecycle, immutable transition history, terminal-state protection, durable
  Risk/reservation/adapter references, and overfill prevention.
- RC-16 M2 US161 — Durable Order Repository and Outbox: PostgreSQL
  `paper_orders` and append-only `order_lifecycle_history`, workspace-scoped
  uniqueness, optimistic versions, and atomic Order/history/Outbox commits.
- RC-16 M2 US162 — Ledger-Owned Cash Reservation: decimal-safe PostgreSQL cash
  balances and idempotent reservations/releases behind the Ledger public port,
  row-serialized availability checks, and atomic reservation/balance/Outbox
  writes. Portfolio remains read-only.
- RC-16 M2 US163 — Order Cancellation Lifecycle: Orders-owned idempotent
  cancellation; pre-submission cash release through Ledger and terminal
  completion; submitted/acknowledged requests remain cancel-pending for
  Execution Engine adapter handling.
- RC-16 M2 US164 — Authorized Order Command and Query API: authenticated
  workspace-scoped propose/cancel/read routes, Trader/Admin command RBAC,
  required command idempotency, DTO validation, and no public Risk/Execution
  lifecycle bypass.
- RC-16 M2 US165 — M2 Baseline Risk Decision: fixed versioned paper policy,
  deterministic and explainable checkpoint-bound approvals/rejections,
  immutable PostgreSQL decision persistence with atomic Outbox events, and
  exact approved/unexpired Risk references required for executable Orders.
- RC-16 M2 US166 — Execution Adapter Port and Paper-Only Binding:
  provider-neutral submit/cancel/query/health/capability contracts, structural
  rejection of live mode and credentials, immutable adapter facts, and no
  domain persistence dependency.
- RC-16 M2 US167 — Versioned Paper Fill Configuration: stable configuration
  ID/version/hash, deterministic semantic execution-context identity, explicit
  fee/slippage/precision/rounding and market/limit policies, and immutable
  rounding provenance for future Fill facts.
- RC-16 M2 US168 — Deterministic Market Order Execution: pure paper matching
  that produces all-or-none market fills with versioned slippage, fee, and
  rounding; identical inputs yield identical immutable fill facts and no domain
  or accounting mutation.
- RC-16 M2 US169 — Deterministic Limit Order Execution and Cancellation:
  cross-then-all-or-none limit matching bounded by the limit price, non-crossing
  limits rest without a Fill, and provider-neutral cancellation reconciliation.
- RC-16 M2 US170 — Single Execution Engine (`execution-engine/`): the only
  component permitted to call the adapter; re-checks the mandatory unexpired
  Risk Decision, reservation, approved market checkpoint, and fenced Session
  eligibility; drives every Order transition through the Orders port; and keeps
  submission and cancellation idempotent so a duplicate submit cannot duplicate
  an adapter call or a Fill.
- RC-16 M2 US171 — Immutable Fill Persistence: deterministic Fill identity,
  append-only PostgreSQL `paper_fills` with per-order sequence and adapter-fill
  uniqueness, each Fill referencing exactly one persisted Order, and atomic
  commit of the Fill, its Outbox event, and the Orders-owned lifecycle
  transition inside one transaction.
- RC-16 M2 US172 — Long-Only Position Accounting (`positions/`): immutable
  Fill-only quantity, average entry, cost basis, and realized-PnL transitions;
  over-closing rejection; monotonic Position version and applied-Fill sequence.
- RC-16 M2 US173 — Append-Only Balanced Ledger (`ledger/`): decimal-only,
  durable-cause transactions and immutable entries for opening capital,
  reserve/release, Fill position cost, fees, cash, and realized PnL; cash
  balances are Ledger-derived projections and compensation requires a reason.
- RC-16 M2 US174 — Atomic Fill Accounting Consumer: Inbox deduplication,
  Position transition, balanced Ledger entries, Position/Ledger Outbox events,
  and checkpoint commit in one PostgreSQL transaction; duplicate delivery is a
  successful no-op and failure rolls back all accounting effects.
- RC-16 M2 US175 — Position Valuation Projection: normalized mark-price
  identity/sequence, decimal mark-to-market values, monotonic versions, and
  duplicate/out-of-order no-op behavior without changing Position or Ledger.
- RC-16 M2 US176 — Portfolio Projection: versioned Ledger-and-valuation-only
  cash, equity, fees, exposure, realized/unrealized/total PnL, source hash,
  completeness, and freshness.
- RC-16 M2 US177 — Accounting Rebuild/Reconciliation: deterministic immutable
  Fill/Ledger/valuation comparison without replaying financial effects, with
  durable mismatch state that blocks affected execution.
- RC-16 M2 US178 — Accounting Query API: authenticated workspace/account-scoped
  Fill, Position/valuation, authoritative Ledger, Portfolio, and reconciliation
  views with explicit projection labels and decimal-string serialization.
- RC-16 M2 US179 — contract/state-machine/authorization validation for decimal,
  paper-only, Session/Order transitions, mandatory Risk references, RBAC,
  workspace isolation, and API bypass prevention.
- RC-16 M2 US180 — PostgreSQL row-lock/concurrency, transaction rollback,
  Outbox/Inbox/checkpoint, and duplicate Fill exactly-once validation.
- RC-16 M2 US181 — deterministic Order/Fill/Position/Ledger/valuation/Portfolio
  replay with property fixtures and ADR-015 accounting identities.
- RC-16 M2 US182 — injected financial-boundary rollback, restart retry,
  uncertain adapter acknowledgement, and durable reconciliation fencing.
- RC-16 M2 US183 — small/medium/practical performance baseline, architecture
  conformance, full regression, quality gates, and release-readiness review.
  Results: `docs/project/rc-16-m2-mini-validation.md`.
- RC-16 final release review — documentation synchronized and final release
  correctly held until M3–M7, TD-034/TD-039/TD-040/TD-042 entry gates, and M7
  Release Validation are complete. Results:
  `docs/project/rc-16-release-summary.md`.

RC-15.1 is released. RC-16 M1 (US126–US152) and M2 (US153–US183) are complete.
M2 verdict: **PASS WITH MINOR RECOMMENDATIONS**. Next milestone: M3.

### Added (architecture)

- RC-16 Paper Trading Platform planning document:
  `docs/project/rc-16-paper-trading-plan.md`.
- RC-16 Architecture Freeze ADRs:
  - ADR-012 — Execution Architecture.
  - ADR-013 — Event Processing Model.
  - ADR-014 — Runtime Lifecycle.
  - ADR-015 — Accounting Model.
  - ADR-016 — Risk & Safety Model.
  - ADR-017 — Module Boundaries.
  - ADR-018 — Architectural Invariants.
- RC-15 Retrospective & Development Guide v2, including the official
  Architecture Freeze lifecycle gate.
- RC-16 Frozen Architecture Audit: PASS WITH MINOR RECOMMENDATIONS;
  Architecture Approved and Implementation Approved.
- RC-16 implementation-readiness handoff:
  `docs/project/rc-16-implementation-readiness.md`.

- Paginated Binance historical import (startTime/endTime).
- Multi-Strategy Foundation (Strategy Contract, Registry, Resolver).
- Donchian Breakout strategy.
- Knowledge Layer (`research_outcome`) with Result Identity dedup and immutable lineage.
- Experiment provenance fields: `researchEngineVersion`, `validationVersion` (separate from `gitCommit`).
- Campaign Layer: sequential Campaign Runner + in-memory Campaign Summary.
- Campaign Report Builder with campaign verdict and deterministic recommendations.
- Campaign API: `POST /research-campaigns` returns summary + report + experimentIds.
- Campaign API: `POST /campaigns/run` returns `CampaignSummary` via existing `ResearchCampaignService`.
- Web client: `runCampaign()` helper calls `POST /campaigns/run` and returns `CampaignSummary`.
- Campaign Run page (MVP): form for datasetId / strategyId / paramsList JSON → `runCampaign()`.
- Campaign Results page (MVP): shows CampaignSummary fields + display verdict/recommendations after run.
- Campaign History view (MVP): localStorage list of CampaignSummary after each successful run (newest first).
- Deterministic Research Analysis service: `buildAnalysis(CampaignReport)` → executiveSummary / strengths / weaknesses / recommendations / nextHypothesis (no external AI).
- Research Analysis API/UI: `POST /campaigns/analyze` + `CampaignAnalysisView` on Campaign Results page.
- Multi-dataset Campaign runner: `MultiDatasetCampaignService` reuses `ResearchCampaignService` per dataset and aggregates summaries.
- Multi-dataset Campaign API: `POST /campaigns/run-multi` returns `MultiDatasetCampaignSummary`.
- Multi-dataset Campaign UI: `MultiDatasetCampaignPage` runs `/campaigns/run-multi` and renders summary + per-dataset table.
- Walk-Forward Campaign foundation (US037): `WalkForwardCampaignService` validates request and returns empty `WalkForwardCampaignSummary` (stub; no real walk-forward yet).
- Walk-Forward Window Builder (US038): `buildWalkForwardWindows()` produces inclusive train/test index windows; service returns `windowCount` + `windows` (no experiments).
- Walk-Forward Campaign Runner (US039): one `ResearchCampaignService.run` per window; returns successful/failed window counts.
- Walk-Forward Aggregate Report (US040): averages, best/worst window, verdict counts, and `overallVerdict` over successful windows only.
- Walk-Forward Analysis (US041): deterministic `WalkForwardAnalysisService` with stability/consistency scores and ROBUST / PROMISING / UNSTABLE / UNUSABLE assessment (no AI).
- Walk-Forward API (US042): `POST /campaigns/run-walk-forward` returns `WalkForwardCampaignSummary` via existing `WalkForwardCampaignService`.
- Walk-Forward UI (US043): `WalkForwardCampaignPage` at `/campaigns/walk-forward` (summary + window table; no Analysis).
- Project documentation workflow: living Project Status, ADR Index, Version History, Release Process, Roadmap.
- Root `CHANGELOG.md` (this file).
- Release Candidate docs: Ready for Commit for Research OS (US003–US019, US020A–US020B) + documentation (DOC-021–DOC-024, US025–US026, US025A–US025C), pending explicit commit sequence.
- Architecture Snapshot: `docs/project/architecture-snapshot.md` (current-state only).
- Campaign Domain Model: `docs/project/campaign-domain-model.md` (implemented Campaign Layer only).
- Research Domain Model: `docs/project/research-domain-model.md` (implemented Research Layer only).
- Knowledge Domain Model: `docs/project/knowledge-domain-model.md` (implemented Knowledge Layer only).
- ADR-007 — Campaign Layer: `docs/adr/ADR-007-campaign-layer.md` (Accepted).
- ADR-008 — Deterministic Research Analysis: `docs/adr/ADR-008-deterministic-research-analysis.md` (Accepted).
- ADR-009 — Multi-dataset Campaign: `docs/adr/ADR-009-multi-dataset-campaign.md` (Accepted).
- ADR-010 — Walk-Forward Architecture: `docs/adr/ADR-010-walk-forward-architecture.md` (Accepted).
- ADR-011 — Dataset Slice Architecture: `docs/adr/ADR-011-dataset-slice-architecture.md` (Accepted).
- Dataset Slice Domain Model (US045): `@trp/research` `createSliceRef` / `resolveSlice` over in-memory bars (immutable `SliceRef`, no DB).
- Experiment Slice Support (US046): `runExperiment` accepts optional `SliceRef`; report gets `sliceIdentity` only for sliced runs (Engine unchanged).
- Campaign Slice Support (US047): `ResearchCampaignService.run` accepts optional `sliceRef`; CampaignReport may include `sliceIdentity`.
- True Walk-Forward Execution (US048): per-window Train/Test `SliceRef`; campaign runs on Train only; `trainSliceIdentity` / `testSliceIdentity` provenance (test evaluation deferred).
- Walk-Forward Test Evaluation (US049): best train experiment re-run on Test SliceRef; window train/test metrics & verdicts; aggregate still train-based.
- Walk-Forward Aggregate v2 (US050): Test Aggregate block + `overallVerdict` from Test only; Train Aggregate retained for reference.
- Campaign Persistence Domain (US051): `CampaignRecord`, `CampaignRepository`, `CampaignMapper`, `InMemoryCampaignRepository` (Map-backed; not wired to Campaign execution).
- Campaign Persistence Service (US052): `CampaignPersistenceService` injects repository, maps `CampaignReport` ↔ `CampaignRecord`, never exposes storage model externally.
- Campaign Session Model (US053): `CampaignSession` / `CampaignSessionStatus` / `CampaignSessionFactory` (CREATED sessions; no persistence).
- Persist Campaign Session (US054): `CampaignPersistenceService` persists `CampaignSession` via `CampaignSessionMapper` and session-shaped `CampaignRecord`.
- Integrate Campaign Persistence (US055): each `ResearchCampaignService.run` persists one COMPLETED or FAILED `CampaignSession` (DI; in-memory).
- Campaign History Query Service (US056): read-only `CampaignHistoryService` returns `CampaignSession` via repository + mapper.
- Campaign History Search & Filters (US057): `search(HistoryQuery)` filters by status / engineVersion / datasetId / tags (AND; Repository unchanged).
- Campaign History Pagination & Sorting (US058): `search(query, pageRequest)` returns `HistoryPage` after filter → sort → paginate.
- Campaign History API (US059): `GET /campaign-history` (paged/filtered) and `GET /campaign-history/:sessionId` (404 if missing).
- Export Foundation (US061): `CampaignExportModule` with Strategy Pattern JSON/CSV exporters; `CampaignExportService` accepts `CampaignSession` only (no HTTP API yet).
- Export API (US062): `GET /campaign-history/:sessionId/export?format=json|csv` (HistoryService → ExportService; 200/400/404; Content-Type).
- Import Foundation (US063): `CampaignImportModule` with Strategy Pattern JSON importer; `CampaignImportService` returns `CampaignSession` only (no persist / no HTTP API).
- JSON Import Validation (US064): `CampaignSessionValidator` + `ImportValidationError`; parse → validate metadata/report/timestamps/version → `CampaignSession`.
- Import API (US065): `POST /campaign-import` with `{ format: "json", payload }` → `CampaignSession` (200) or 400; does not persist.
- Replay Foundation (US066): `CampaignReplayModule` prepares `ReplayResult` from `CampaignSession` (READY; report copy; no execution/AI/persist/API).
- Replay Execution (US067): `CampaignReplayService.execute` reuses `ResearchCampaignService.run` with `persistSession: false`; READY→RUNNING→COMPLETED|FAILED; regenerated report.
- Job Domain Model (US069): `JobsModule` with `Job` / `JobResult` / `JobMetadata`, `JobStatus` / `JobType`, create-only `JobService` (no queue/execution/persist/API).
- Job Queue Abstraction (US070): `JobQueue` + `JOB_QUEUE` token + `InMemoryJobQueue`; job create auto-enqueues as `PENDING` (no worker/BullMQ/Redis).
- Background Campaign Runner (US071): `BackgroundJobRunner` executes CAMPAIGN via `ResearchCampaignService` and REPLAY via `CampaignReplayService`; stores `JobResult`; no job persistence.
- Job Status API (US072): read-only `GET /jobs` and `GET /jobs/:jobId` via `JobController` → `JobService` → `JobQueue` (404 if missing; no processing).
- Job Cancellation (US073): `POST /jobs/:jobId/cancel` cancels PENDING only (409 otherwise); `BackgroundJobRunner` skips CANCELLED; no execution result.
- Knowledge Domain Model (US075): in-memory `KnowledgeEntry` / `KnowledgeMetadata` / `KnowledgeTag` + `KnowledgeDomainService` (`create` / `update` / `get` / `list`); no Repository / API.
- Experiment Entity & Versioning (US076): in-memory `Experiment` / `ExperimentVersion` / `ExperimentMetadata` + `ExperimentDomainService` (`createFromSession` / `createVersion` / `get` / `list`); CampaignSession → Experiment → future KnowledgeEntry via `experimentId`.
- Knowledge Extraction Pipeline (US077): deterministic `KnowledgeExtractionService.extract` from `Experiment.currentVersion.report` + `createFromExperiment` upsert (one entry per experiment; no AI).
- Experiment Comparison Service (US078): deterministic structural `compareVersions` / `compareExperiments` (insights/summary/tags/metadata; no AI/similarity).
- Knowledge Search API (US079): `GET /knowledge` over in-memory `KnowledgeEntry` with `q` / `tag` / `experimentId` (AND; case-insensitive; no vectors).
- Pipeline Domain Model (US081): in-memory `Pipeline` / `PipelineRun` / `PipelineContext` / `PipelineResult` / `PipelineMetadata` + `PipelineDomainService` (no executor/API/Repository).
- Pipeline Step Contract (US082): `PipelineStep` + `AbstractPipelineStep` + `PipelineStepMetadata` / `PipelineStepResult` + `PipelineRegistry`; Pipeline stores metadata only.
- Pipeline Executor (US083): `PipelineExecutor` resolves registered steps by `metadata.order`, propagates context, updates optional `PipelineRun` lifecycle, returns `PipelineResult` (no persistence/API).
- Pipeline Hooks (US084): `PipelineHook` + `PipelineHookRegistry` + `LoggingPipelineHook`; executor lifecycle callbacks; hook failures ignored; no Events/bus.
- Pipeline Templates (US085): `PipelineTemplate` + `PipelineTemplateService`; built-in Campaign / Replay / Knowledge templates (step metadata only); `createPipelineFromTemplate` yields independent Pipeline copies.
- Campaign Pipeline Steps (US087): `PrepareCampaignStep` / `ExecuteResearchStep` / `AggregateResultStep` / `BuildReportStep` / `PersistCampaignStep`; registered on `PipelineRegistry`; Campaign template metadata updated; `ResearchCampaignService` unchanged (no executor wiring).
- Execute Campaign through PipelineExecutor (US088): `ResearchCampaignService` orchestrates Campaign via built-in template + `PipelineExecutor` + in-memory `PipelineRun`; public contract / REST / Jobs / Replay unchanged.
- Replay Pipeline Integration (US089): `LoadReplaySessionStep` / `RestoreReplayContextStep` / `ExecuteReplayCampaignStep` / `FinalizeReplayStep`; registered on `PipelineRegistry`; Replay template metadata updated; `CampaignReplayService` orchestrates via template + `PipelineExecutor`; identical `ReplayResult` / Jobs / History.
- Knowledge Extraction Pipeline Integration (US090): `PrepareKnowledgeExtractionStep` / `ExtractKnowledgeStep` / `UpsertKnowledgeEntryStep`; registered on `PipelineRegistry`; Knowledge template metadata updated; `KnowledgeDomainService.createFromExperiment` orchestrates via template + `PipelineExecutor`; identical KnowledgeEntry / upsert / Experiment compatibility.
- Architecture Snapshot Synchronization (US092): `architecture-snapshot.md` aligned to RC-12 unified Pipeline Engine runtime (Campaign / Replay / Knowledge orchestrators; generic PipelineContext; metadata-only templates; lifecycle hooks; no Event Bus); docs only.
- Technical Debt Register (US093): living `docs/project/technical-debt.md` (Accepted / Deferred / Planned; infrastructure debt + possible RC milestones); linked from Project Status; docs only.
- Module Maturity Matrix (US094): living `docs/project/module-maturity.md` (status / scope / limitations / next milestone per major module); linked from Project Status; docs only.
- Insight Domain (US095): in-memory `Insight` / `InsightType` / `InsightSource` / `InsightMetadata` + `InsightDomainService` (`create` / `update` / `delete` / `getById` / `search`); references Knowledge ids only; no AI / Pipeline / REST / Prisma.
- Insight Extraction Pipeline (US096): `insights.prepare` / `insights.extract` / `insights.persist`; built-in Insight template; deterministic rules; `InsightDomainService.extractFromKnowledge` via `PipelineExecutor`; Campaign / Replay / Knowledge pipelines unchanged.
- Cross-Campaign Analysis (US097): `CrossCampaignAnalysisService` + pipeline; result store for API lookup (`id` / `createdAt`); writes Insights via `InsightDomainService`.
- Recommendation Engine (US098): in-memory domain + deterministic `generateFromInsights`.
- Research Report Domain (US099): in-memory aggregation via `build()` (id refs only).
- Research Intelligence API (US100): read-only REST — `GET /insights`, `/recommendations`, `/reports`, `/cross-campaign-analysis` (+ `/:id`); `HistoryPage` envelope; pagination / sorting / filtering; domain services only.
- RC-14 — Production SaaS foundation (`feat(rc14)` / tag `rc-14`).
- RC-15 — Research & Simulation Platform (US115–US125): Market Data, Historical Import, Market Data Provider, Backtesting Engine, Walk-Forward Engine, Portfolio Simulation, Trade Execution Simulation, Performance Metrics, Strategy Comparison, Simulation Report + RC-15 Architecture Audit.
- Validation Sprint V1 harnesses (RC-15.1): VS001 functional-validation suite, VS002 stress runner (`vs002-stress-runner.ts`; synthetic 10k / 100k / 1M-bar workloads with memory / CPU / determinism capture), VS003 consistency & invariant suite; simulation-report large-array regression test.

### Fixed

- RC-15.1 Validation Release: integrated confirmed Validation Sprint V1 defect fixes and restored repository quality (no new functionality; no architectural changes):
  - Deterministic CAGR — `PerformanceAnalyzer` derives duration from equity-curve snapshot timestamps instead of wall-clock `startedAt` / `finishedAt`; backtest snapshots anchored to session / bar timestamps (VS001).
  - Deterministic Strategy Comparison — operational `durationMs` excluded from semantic equality via `stableComparison` (VS001).
  - Large-workload stability — `SimulationReportBuilder.summarizeSnapshots` computes peak / trough iteratively (previously overflowed the call stack via `Math.max(...)` on 1M+ snapshots); 150k-snapshot regression test added (VS002).
  - PnL identity restored — `TradeEngine.unrealizedPnL` is now classic unrealized PnL (position market value exposed separately via `computePositionMarketValue`); `equity = initialCapital + realizedPnL + unrealizedPnL`, so `realized + unrealized = total PnL` and `cash + market value = equity` hold per snapshot (VS003).
  - Repository lint restored to green (40 pre-existing errors): `no-unused-vars` now honors `^_` argsIgnorePattern; `no-explicit-any` scoped off for test files only (production strict; TD-008).
  - Standalone typecheck (`tsc --noEmit`) restored to green (13 pre-existing spec errors): `engineVersion` added to `CampaignSessionMetadata` fixtures, nullable JSON report access typed in experiments specs, branded `Instrument` in a simulation-report spec.
- RC-13 completed: Research Intelligence layer (US095–US100) + RC-13 Architecture Audit (US101) PASS WITH RECOMMENDATIONS; Execution vs Analysis pipeline categories; Living Next RC-14; Accepted Legacy dual paths documented (TD-011–TD-013); full monorepo tests green; docs synced (no remote release yet).
- RC-12 finalized: Research Pipeline Engine is the unified execution runtime for Campaign / Replay / Knowledge (US081–US091) architecture audit PASS (full monorepo tests green; pipeline orchestration lint scope clean; pre-existing experiments/knowledge Prisma-spec `any` debt unchanged); docs synced; committed and pushed.
- RC-11 finalized: Research Pipeline Engine (US081–US085) architecture audit PASS (full monorepo tests green; pipeline lint scope clean); docs synced; committed and pushed.
- RC-10 finalized: Knowledge & Experiment Intelligence (US075–US079) architecture audit PASS (full monorepo tests green); docs synced; committed and pushed.
- RC-09 finalized: Background Job Execution framework (US069–US073) verified (full monorepo tests green); docs synced; committed and pushed.
- RC-08 finalized: Campaign Import + Replay stack verified (full monorepo tests green); docs synced; committed and pushed.
- RC-07 finalized: Campaign Session Persistence + History + Export stack verified (full monorepo tests green); docs synced; committed and pushed.
- RC-06 Architecture Audit (US060): Campaign Session Persistence stack boundaries, History API, and docs aligned; 63 related unit tests green.
- Documentation sync (US050A): ADR-010 aligned to Dataset Slice + Train/Test execution + Aggregate v2; Analysis documented as still Train-oriented by intent; ADR index blurb updated.
- Documentation sync (US041A): Current Goal after Walk-Forward Aggregate + Analysis; Roadmap Next drops misplaced US024 (Portfolio Research remains a Future Milestone); CHANGELOG [Unreleased] labels US037–US041 explicitly.
- Backtest accounting: trade PnL includes entry fee (Research Engine 1.0.1 semantics).
- Documentation story IDs: former docs US021–US024 renumbered to DOC-021–DOC-024 (no collision with product backlog US021–US024).
- Terminology: Config Identity (was Configuration Identity); Research Layer for the architectural layer (ADR-002, Project Status).
- US007 title aligned to Architecture Review Before Implementation.
- Release Candidate scope refreshed to include current documentation stories.

### Changed

- Knowledge dedup moved from config-only identity to Result Identity
  (`configIdentityKey` + engine + validation versions).
- Simulation Platform accounting semantics (RC-15.1): `unrealizedPnL` now represents classic unrealized profit/loss on open positions (not raw market value), and `equity = initialCapital + realizedPnL + unrealizedPnL`. Simulation determinism is anchored to bar / session timestamps rather than wall-clock. Distinct from the `@trp/research` `researchEngineVersion` used for Knowledge identity (unchanged at `1.0.3`).
- RC-16 phase changed from an ambiguous simulation-realism placeholder to an
  approved, paper-only Trading Platform plan. The architecture remains a
  modular monolith and is frozen by ADR-012…ADR-018; future architectural
  changes require a new ADR.
- RC-16 current phase advanced to M1 — Live Market Data Foundation after the
  successful Frozen Architecture Audit.

### Research versions (working tree)

- Research Engine: `1.0.3`
- Validation: `1.0.2`
- Knowledge Schema: `2`

## [0.1.0] - 2026-07-16

Reflects what already exists in git history (bootstrap / MVP Stage 0–1), not the uncommitted Research OS campaign/knowledge extensions.

### Added

- Monorepo bootstrap (pnpm / Turborepo).
- Stage 0 research pipeline (OHLCV → strategy → backtest → validation → report).
- Stage 1 paper production pipeline (signal → adapter → execution history).
- JWT authentication.
- MVP Implementation stack (docs + core API/web wiring).
- Localhost CORS support and clearer API-down errors.
- MVP architecture documentation freeze / cleanup.

### Notes

- Dedicated Research OS release will be cut only after an explicit commit sequence.
