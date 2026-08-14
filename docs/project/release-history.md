# Release History

Date: 2026-08-14

Status: Authoritative living summary of release outcomes

Related:

- [Project Status](./project-status.md)
- [Roadmap](./roadmap.md)
- [Story ID Allocation](./story-id-allocation.md)
- [RC-18 Mid-Release Health Review](./rc-18-mid-release-health-review.md)
- [RC-17 Release Planning](./rc-17-release-planning.md)
- [Architecture Decision Log](../Architecture/ADR/ADL.md)
- ADR Index: [`../adr/README.md`](../adr/README.md)

---

## How to read this table

- **Historical audit verdicts** (e.g. an earlier FAIL) are preserved in the
  linked review documents.
- **Current baseline column** describes how the repository treats that release
  _now_ for planning and implementation.
- Prefer annotations over rewriting past review text.

| Release | Theme                                                                  | Status                | Completion                         | Notes                                                                                                                                                                                                                                                    |
| ------- | ---------------------------------------------------------------------- | --------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RC-14   | Production SaaS foundation                                             | COMPLETE              | Tag `rc-14`                        | Identity, Auth, RBAC, Workspace, Prisma drivers, Queue, Logging, Metrics, Validation, API versioning                                                                                                                                                     |
| RC-15   | Research & Simulation Platform                                         | COMPLETE              | Through US125                      | Market Data → Backtest / Walk-Forward → Portfolio / Trade → Performance → Comparison → Simulation Report                                                                                                                                                 |
| RC-15.1 | Validation Release                                                     | COMPLETE              | Tag `rc-15.1` (`bf46b64`)          | VS001–VS004 fixes integrated; docs synced; quality gates green                                                                                                                                                                                           |
| RC-16   | Paper Trading Platform (architecture + foundation + strategy path)     | **BASELINE ACCEPTED** | M0–M2 + M3 through US223 (E13–E16) | ADR-012…ADR-018 freeze; M1/M2 validated; canonical SignalIntent → CanonicalOrderPath path landed. Historical 2026-07-18 final-release audit remains FAIL for audit trail; residual M3 hooks + M4–M7 product intent **transferred to RC-17** (2026-07-30) |
| RC-17   | Production Readiness & Operational Runtime (Runtime Recovery baseline) | **BASELINED**         | E17 US240–US249 + US244A           | Runtime Recovery reference pipeline Stage 3 + Stage 4 PASS WITH RECOMMENDATIONS. Production restart-safety subject to RC-18 TD-036 mandatory residuals. E18–E21 product epics forwarded to RC-18+                                                        |
| RC-18   | Production Recovery & Operational Readiness                            | **IN PROGRESS**       | US290–US294 Done; US295 Open       | TD-036 R1–R5 closed; US295 ADL-008 remains Open before production restart-safety PASS claims                                                                                                                                                             |
| RC-19   | Spec v2.0 + thin integration hooks                                     | **CLOSED**            | Epics 1–3                          | Exchange Scope, Bot Facade, Tactical Envelope stub — [`rc-19-closure-report.md`](./rc-19-closure-report.md)                                                                                                                                              |
| RC-20   | Command Center foundation                                              | **CLOSED**            | Epics 1–6                          | Ops workspace projections + lifecycle commands — [`rc-20-closure-report.md`](./rc-20-closure-report.md)                                                                                                                                                  |
| RC-21   | Knowledge Lake (projection warehouse)                                  | **CLOSED**            | Epics 1–6 · tag `v1.0.0-rc21`      | Append-only Lake + query port; IDE deferred — [`rc-21-closure-report.md`](./rc-21-closure-report.md)                                                                                                                                                     |
| RC-22   | Strategy Library + library Tactical Envelope (domain)                  | **CLOSED**            | Epics 1–6 · tag `v1.0.0-rc22`      | Certified membership domain; Nest ports deferred — [`rc-22-closure-report.md`](./rc-22-closure-report.md)                                                                                                                                                |
| RC-23   | Runtime Enforcement (Gate)                                             | **CLOSED**            | Epics 1–6 · tag `v1.0.0-rc23`      | Library→Deployment/Session validation Gate — [`rc-23-closure-report.md`](./rc-23-closure-report.md)                                                                                                                                                      |
| RC-24   | Reporting, AI Analytics & Notification Delivery                        | **CLOSED**            | Epics 1–6 · tag `v1.0.0-rc24`      | Projection reports + AI narratives + Telegram delivery — [`rc-24-closure-report.md`](./rc-24-closure-report.md)                                                                                                                                          |
| RC-25   | Market Qualification + Market Profile                                  | **CLOSED**            | `v1.0.0-rc25`                      | Venue qualification + versioned profiles (confidence only) — [`rc-25-closure-report.md`](./rc-25-closure-report.md)                                                                                                                                      |
| RC-26   | Trading Orchestrator + Market State                                    | **CLOSED**            | `v1.0.0-rc26`                      | Coordination + current-condition SoT (ports/domain; no Session/Orders/Risk) — [`rc-26-closure-report.md`](./rc-26-closure-report.md)                                                                                                                     |
| RC-27   | Multi-Exchange Scope                                                   | **CLOSED**            | `v1.0.0-rc27`                      | Venue isolation without engine clones — [`rc-27-closure-report.md`](./rc-27-closure-report.md)                                                                                                                                                           |
| RC-28   | Version 2 Stabilization & Conformance                                  | **CLOSED**            | Tag `v2.0.0`                       | Paper-first Version 2 certified — [`rc-28-closure-report.md`](./rc-28-closure-report.md)                                                                                                                                                                 |

---

## RC-28

| Field                    | Value                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Theme                    | Version 2 Stabilization & Conformance                                                                                         |
| Status                   | **CLOSED** (`v2.0.0`)                                                                                                         |
| Implementation Plan      | [`rc-28-implementation-plan.md`](./rc-28-implementation-plan.md)                                                              |
| Epics                    | [`rc-28-epic-breakdown.md`](./rc-28-epic-breakdown.md)                                                                        |
| Epic 1                   | [`rc-28-epic1-platform-integration-boundaries.md`](./rc-28-epic1-platform-integration-boundaries.md) (**approved**)           |
| Boundary Catalog         | [`rc-28-epic1-integration-boundary-report.md`](./rc-28-epic1-integration-boundary-report.md)                                  |
| Boundary Diagram         | [`rc-28-epic1-boundary-diagram.md`](./rc-28-epic1-boundary-diagram.md)                                                        |
| Epic 2                   | [`rc-28-epic2-cross-domain-workflow-verification.md`](./rc-28-epic2-cross-domain-workflow-verification.md) (**approved**)     |
| Workflow Catalog         | [`rc-28-epic2-workflow-verification-report.md`](./rc-28-epic2-workflow-verification-report.md)                                |
| Epic 3                   | [`rc-28-epic3-authority-ownership-verification.md`](./rc-28-epic3-authority-ownership-verification.md) (**approved**)         |
| Authority Catalog        | [`rc-28-epic3-authority-verification-report.md`](./rc-28-epic3-authority-verification-report.md)                              |
| Ownership Catalog        | [`rc-28-epic3-ownership-verification-report.md`](./rc-28-epic3-ownership-verification-report.md)                              |
| Epic 4                   | [`rc-28-epic4-end-to-end-scenario-validation.md`](./rc-28-epic4-end-to-end-scenario-validation.md) (**approved**)             |
| Scenario Catalog         | [`rc-28-epic4-scenario-validation-report.md`](./rc-28-epic4-scenario-validation-report.md)                                    |
| Epic 5                   | [`rc-28-epic5-performance-resilience-compatibility.md`](./rc-28-epic5-performance-resilience-compatibility.md) (**approved**) |
| Compatibility Catalog    | [`rc-28-epic5-compatibility-verification-report.md`](./rc-28-epic5-compatibility-verification-report.md)                      |
| Performance & Resilience | [`rc-28-epic5-performance-resilience-report.md`](./rc-28-epic5-performance-resilience-report.md)                              |
| Epic 6                   | [`rc-28-epic6-version-2-certification.md`](./rc-28-epic6-version-2-certification.md) (**approved**)                           |
| Internal Audit           | [`rc-28-epic6-internal-audit-report.md`](./rc-28-epic6-internal-audit-report.md) (**PASS**)                                   |
| Readiness                | [`rc-28-epic6-readiness-report.md`](./rc-28-epic6-readiness-report.md) (**READY** — consumed)                                 |
| Validation               | [`rc-28-validation-report.md`](./rc-28-validation-report.md) (**PASS**)                                                       |
| Certification            | [`rc-28-version-2-certification.md`](./rc-28-version-2-certification.md) (**READY = YES**)                                    |
| Closure                  | [`rc-28-closure-report.md`](./rc-28-closure-report.md) (**CLOSED**)                                                           |
| API                      | [`rc-28-api-contract.md`](./rc-28-api-contract.md) (frozen inventory; no new APIs)                                            |
| Integration              | [`rc-28-integration-diagram.md`](./rc-28-integration-diagram.md)                                                              |
| Planning Validation      | [`rc-28-validation-summary.md`](./rc-28-validation-summary.md)                                                                |
| Consistency              | [`rc-28-architecture-consistency-report.md`](./rc-28-architecture-consistency-report.md)                                      |

### Validation & Release delivered

- Workflow §5 gates PASS: typecheck, lint, tests (api 2944 / web 96 / research 24), build, smoke (api 832 + Command Center 43), platform conformance **107/107**
- Version 2 Certification **READY = YES**; tag `v2.0.0`
- No new Nest module / ports / SoT / ownership / runtime

### Explicitly deferred / forbidden in RC-28 Validation & Release

- Live capital, IDE shell, REST / persistence products
- Spec / Authority Matrix / Alias Dictionary edits
- New APIs, modules, SoT, ownership

### Epic 6 delivered

- Certification checklist (architecture / ownership / integration / contracts / graph / compatibility / docs / tests) all **PASS**
- Internal audit **PASS**; paper-first Version 2 **READY** for Validation & Release (separate task)
- Residual register: IDE, REST, durable stores, live capital, US295/ADL-008, extra venue adapters — none block certification
- Gate: **107/107 PASS** (`src/platform-conformance`; Epic 6 suites **12/12**)
- No new Nest module / ports / SoT / ownership / runtime; Validation not run; git tag not created

### Explicitly deferred / forbidden in RC-28 Epic 6

- Validation Standard / Git tag / RC-28 Closure (separate task)
- New APIs, modules, SoT, ownership, business rules
- Live capital, IDE shell, REST / persistence products

### Epic 5 delivered

- Compatibility matrix RC-19…RC-27; resilience matrix for missing Gate / Library / scope / Lake / Reporting / AI / Notification
- Startup integrity + projection availability + dependency-graph stability (no optimizations)
- Gate: **95/95 PASS** (`src/platform-conformance`; Epic 5 suites **17/17**)
- No new Nest module / ports / SoT / ownership / runtime / performance product

### Explicitly deferred / forbidden in RC-28 Epic 5

- Epic 6 Version 2 certification closeout
- Optimizations, caching SoT, new orchestration, live capital
- New APIs, modules, SoT, ownership, business rules

### Epic 4 delivered

- Scenario catalog (`V2_E2E_SCENARIOS`) Research Lab → Command Center
- Successful paper path, fail-closed Gate, isolation, projection/reporting/notification continuity
- Gate: **78/78 PASS** (`src/platform-conformance`; Epic 4 suites **13/13**)
- No new Nest module / ports / SoT / ownership / business logic

### Explicitly deferred / forbidden in RC-28 Epic 4

- Epic 5+ performance / certification work
- New APIs, modules, SoT, ownership, business rules
- Runtime / Strategy / Reporting / Multi-Exchange redesign

### Epic 3 delivered

- Authority graph + SoT uniqueness map + alias bindings (documents unmodified)
- Isolation invariants 1–10 reused from RC-27; Tactics Contract Option B at Gate
- Gate: **65/65 PASS** (`src/platform-conformance`; Epic 3 suites **19/19**)
- No new Nest module / ports / SoT / ownership / business logic

### Explicitly deferred / forbidden in RC-28 Epic 3

- Epic 4+ E2E / performance / certification work
- New APIs, modules, SoT, ownership, business rules
- Authority Matrix / Alias Dictionary edits
- Runtime / Strategy / Reporting / Multi-Exchange redesign

### Epic 2 delivered

- Workflow-hop catalog (`V2_WORKFLOW_HOPS`) Research Lab → Command Center
- Contract, ownership, fail-closed, and consumer-isolation suites
- Gate: **46/46 PASS** (`src/platform-conformance`; Epic 2 suites **25/25**)
- No new Nest module / ports / SoT / ownership / business logic

### Explicitly deferred / forbidden in RC-28 Epic 2

- Epic 3+ authority / E2E / certification work
- New APIs, modules, SoT, ownership, business rules
- Runtime / Strategy / Reporting / Multi-Exchange redesign

### Epic 1 delivered

- Platform integration-boundary audit catalog (`apps/api/src/platform-conformance/`)
- Frozen consume / forbidden-reverse / ownership graphs
- Gate: **21/21 PASS** (`src/platform-conformance`) at Epic 1 close
- No new Nest module / ports / SoT / ownership

### Explicitly deferred / forbidden in RC-28 Epic 1

- Epic 2+ workflow / authority / E2E / certification work (Epic 2 now implemented)
- New APIs, modules, SoT, ownership, business rules
- Runtime / Strategy / Reporting / Multi-Exchange redesign

### Planning delivered

- Complete V2 integration / validation / certification plan (no new domains)
- Six independently reviewable verification epics
- Frozen port inventory of RC-19…RC-27 contracts
- End-to-end path map within existing ownership

### Explicitly deferred / forbidden in RC-28 planning

- Implementation / Epic 1 until architectural approval
- New APIs, modules, SoT, ownership, business rules
- Runtime / Strategy / Reporting / Multi-Exchange redesign
- Authority Matrix / Alias Dictionary modifications
- Live capital / IDE shell

---

## RC-27

| Field               | Value                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| Theme               | Multi-Exchange Scope                                                                               |
| Status              | **CLOSED** — Validation PASS · tag `v1.0.0-rc27`                                                   |
| Tag                 | `v1.0.0-rc27`                                                                                      |
| Closure             | [`rc-27-closure-report.md`](./rc-27-closure-report.md)                                             |
| Validation          | [`rc-27-validation-report.md`](./rc-27-validation-report.md) (**PASS**)                            |
| Certification       | [`rc-27-exchange-scope-certification.md`](./rc-27-exchange-scope-certification.md) (**Ready=YES**) |
| Implementation Plan | [`rc-27-implementation-plan.md`](./rc-27-implementation-plan.md)                                   |
| Epics               | [`rc-27-epic-breakdown.md`](./rc-27-epic-breakdown.md)                                             |
| Epic 1              | [`rc-27-epic1-exchange-scope-boundary.md`](./rc-27-epic1-exchange-scope-boundary.md)               |
| Boundary Diagram    | [`rc-27-epic1-boundary-diagram.md`](./rc-27-epic1-boundary-diagram.md)                             |
| Epic 2              | [`rc-27-epic2-domain-model.md`](./rc-27-epic2-domain-model.md)                                     |
| Epic 3              | [`rc-27-epic3-application-ports.md`](./rc-27-epic3-application-ports.md)                           |
| Epic 4              | [`rc-27-epic4-trading-path-scope-integration.md`](./rc-27-epic4-trading-path-scope-integration.md) |
| Epic 5              | [`rc-27-epic5-consumer-read-ports.md`](./rc-27-epic5-consumer-read-ports.md)                       |
| Epic 6              | [`rc-27-epic6-authority-conformance.md`](./rc-27-epic6-authority-conformance.md)                   |
| Epic 6 Audit        | [`rc-27-epic6-internal-audit-report.md`](./rc-27-epic6-internal-audit-report.md) (**PASS**)        |
| Epic 6 Readiness    | [`rc-27-epic6-readiness-report.md`](./rc-27-epic6-readiness-report.md)                             |
| API                 | [`rc-27-api-contract.md`](./rc-27-api-contract.md)                                                 |
| Domain              | [`rc-27-domain-model-contract.md`](./rc-27-domain-model-contract.md)                               |
| Integration         | [`rc-27-integration-diagram.md`](./rc-27-integration-diagram.md)                                   |
| Planning Validation | [`rc-27-validation-summary.md`](./rc-27-validation-summary.md)                                     |
| Consistency         | [`rc-27-architecture-consistency-report.md`](./rc-27-architecture-consistency-report.md)           |

### Epic 6 delivered

- Authority conformance + isolation invariants suites (≥2 concurrent scopes)
- Internal Audit **PASS**; Readiness = ready for Validation (Validation not run)
- Gate: exchange-scope **48/48 PASS**
- No new product behaviour / architecture changes

### Explicitly deferred / forbidden in RC-27 Epic 6

- Validation Standard / Module Certification / Git tag / RC Closure
- REST / UI / durable persistence / live capital
- New business features under “conformance”

### Epic 5 delivered

- `ExchangeScopeConsumerReadService` Nest façade + query adapter
- Immutable projections: identity / lifecycle / config / policy / bindings / metadata / active status
- Explicit workspace aggregate (never invents balances)
- Gate: 33/33 PASS (`src/modules/exchange-scope`)

### Explicitly deferred / forbidden in RC-27 Epic 5

- REST / UI / durable persistence
- Exchange routing / API / Runtime / Session / Orders / Execution commands
- Consumer mutation of Scope

### Epic 4 delivered

- Trading-path `exchangeScopeId` identity on Order / Fill / Position / Ledger / Deployment / Runtime / Signal / Lake / Reporting
- Additive Prisma defaults (`exchange-scope:binance`); semantic hashes unchanged
- Isolation: cross-scope Position / RuntimeContext reject
- Gate: 75/75 PASS (Epic 4 focus suite)

### Explicitly deferred / forbidden in RC-27 Epic 4

- Multi-runtime / routing engine / exchange adapters
- REST redesign / persistence redesign
- Cloned Orders / Execution / Accounting / Risk
- Validation & Release (post–Epic 6)

### Epic 3 delivered

- `ExchangeScopeServicePort` / `QueryPort` / `ConsumerReadPort` Nest wiring
- Process-local in-memory store (not persistence product)
- Gate: 24/24 PASS (`src/modules/exchange-scope`)

### Explicitly deferred / forbidden in RC-27 Epic 3

- Trading-path integration (Epic 4+)
- Multi-runtime / cloned Risk / Orders / Execution / Accounting / Reporting
- REST / durable persistence / WebSockets / event streaming / UI
- Live capital / exchange API / authentication / secrets
- Session / Runtime / Orders / Execution / Risk ownership

---

## RC-26

| Field               | Value                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Theme               | Trading Orchestrator + Market State                                                                                        |
| Status              | **CLOSED** — tag `v1.0.0-rc26`                                                                                             |
| Closure             | [`rc-26-closure-report.md`](./rc-26-closure-report.md)                                                                     |
| Validation          | [`rc-26-validation-report.md`](./rc-26-validation-report.md)                                                               |
| Certification       | [`rc-26-trading-orchestrator-market-state-certification.md`](./rc-26-trading-orchestrator-market-state-certification.md)   |
| Implementation Plan | [`rc-26-implementation-plan.md`](./rc-26-implementation-plan.md)                                                           |
| Epics               | [`rc-26-epic-breakdown.md`](./rc-26-epic-breakdown.md)                                                                     |
| Epic 1              | [`rc-26-epic1-trading-orchestrator-market-state-boundary.md`](./rc-26-epic1-trading-orchestrator-market-state-boundary.md) |
| Boundary Diagram    | [`rc-26-epic1-boundary-diagram.md`](./rc-26-epic1-boundary-diagram.md)                                                     |
| Epic 2              | [`rc-26-epic2-market-state-input-integration.md`](./rc-26-epic2-market-state-input-integration.md)                         |
| Epic 3              | [`rc-26-epic3-domain-model.md`](./rc-26-epic3-domain-model.md)                                                             |
| Epic 4              | [`rc-26-epic4-trading-orchestrator-domain-model.md`](./rc-26-epic4-trading-orchestrator-domain-model.md)                   |
| Epic 5              | [`rc-26-epic5-trading-orchestrator-workflow-ports.md`](./rc-26-epic5-trading-orchestrator-workflow-ports.md)               |
| Epic 6              | [`rc-26-epic6-consumer-read-authority.md`](./rc-26-epic6-consumer-read-authority.md)                                       |
| Internal Audit      | [`rc-26-epic6-internal-audit-report.md`](./rc-26-epic6-internal-audit-report.md)                                           |
| Readiness           | [`rc-26-epic6-readiness-report.md`](./rc-26-epic6-readiness-report.md)                                                     |
| API                 | [`rc-26-api-contract.md`](./rc-26-api-contract.md)                                                                         |
| Domain              | [`rc-26-domain-model-contract.md`](./rc-26-domain-model-contract.md)                                                       |
| Integration         | [`rc-26-integration-diagram.md`](./rc-26-integration-diagram.md)                                                           |
| Planning Validation | [`rc-26-validation-summary.md`](./rc-26-validation-summary.md)                                                             |
| Consistency         | [`rc-26-architecture-consistency-report.md`](./rc-26-architecture-consistency-report.md)                                   |

### Release delivered

- Market State domain + observational input reads + consumer read ports
- Trading Orchestrator domain + workflow ports (Library/Gate consume; Session handoff intent)
- Authority conformance + Internal Audit **PASS**; Validation **PASS**
- Tag `v1.0.0-rc26`

### Explicitly deferred / forbidden in RC-26

- Execution / Session creation / Orders / Risk Decision production
- REST / persistence / WebSockets / event streaming / UI
- Market State classify Nest activation
- Reporting / AI reverse Nest wiring (ports ready only)
- Multi-Exchange (RC-27)

---

## RC-25

| Field               | Value                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Theme               | Market Qualification + Market Profile                                                                                      |
| Status              | **CLOSED** — tag `v1.0.0-rc25`                                                                                             |
| Closure             | [`rc-25-closure-report.md`](./rc-25-closure-report.md)                                                                     |
| Validation          | [`rc-25-validation-report.md`](./rc-25-validation-report.md)                                                               |
| Certification       | [`rc-25-market-qualification-profile-certification.md`](./rc-25-market-qualification-profile-certification.md)             |
| Plan                | [`rc-25-implementation-plan.md`](./rc-25-implementation-plan.md)                                                           |
| Epic 1              | [`rc-25-epic1-market-qualification-profile-boundary.md`](./rc-25-epic1-market-qualification-profile-boundary.md)           |
| Epic 2              | [`rc-25-epic2-live-market-data-research-read-integration.md`](./rc-25-epic2-live-market-data-research-read-integration.md) |
| Epic 3              | [`rc-25-epic3-domain-model.md`](./rc-25-epic3-domain-model.md)                                                             |
| Epic 4              | [`rc-25-epic4-qualification-lifecycle-ports.md`](./rc-25-epic4-qualification-lifecycle-ports.md)                           |
| Epic 5              | [`rc-25-epic5-market-profile-versioning.md`](./rc-25-epic5-market-profile-versioning.md)                                   |
| Epic 6              | [`rc-25-epic6-consumer-read-authority.md`](./rc-25-epic6-consumer-read-authority.md)                                       |
| Audit               | [`rc-25-epic6-internal-audit-report.md`](./rc-25-epic6-internal-audit-report.md)                                           |
| Readiness           | [`rc-25-epic6-readiness-report.md`](./rc-25-epic6-readiness-report.md)                                                     |
| Epics               | [`rc-25-epic-breakdown.md`](./rc-25-epic-breakdown.md)                                                                     |
| API                 | [`rc-25-api-contract.md`](./rc-25-api-contract.md)                                                                         |
| Domain              | [`rc-25-domain-model-contract.md`](./rc-25-domain-model-contract.md)                                                       |
| Integration         | [`rc-25-integration-diagram.md`](./rc-25-integration-diagram.md)                                                           |
| Planning Validation | [`rc-25-validation-summary.md`](./rc-25-validation-summary.md)                                                             |
| Consistency         | [`rc-25-architecture-consistency-report.md`](./rc-25-architecture-consistency-report.md)                                   |

### Release delivered

- Market Qualification lifecycle + query + consumer read ports
- Market Profile immutable versioning + query + consumer read ports
- Authority conformance + Internal Audit **PASS**; Validation **PASS**
- Tag `v1.0.0-rc25`

### Epic 5 delivered

- `MarketProfileServicePort` / `MarketProfileQueryPort` active
- Append-only immutable profile versions; latest / by-version / history queries
- Publish gated on completed Qualification run; no calculation algorithms

### Epic 4 delivered

- `MarketQualificationServicePort` / `MarketQualificationQueryPort` active
- Lifecycle: request → confirm → running → complete/fail/cancel
- Immutable lifecycle records; heavy-work confirm gate; no scoring / profile publish

### Epic 3 delivered

- Immutable QualificationTarget / Run / State / Confidence / Health factories
- Immutable MarketProfile + volatility / liquidity / trend / structure dimensions
- Lifecycle transition invariants; version immutability; no evaluation/scoring

### Explicitly deferred / forbidden in RC-25

- Trading Orchestrator / Market State / Strategy Selection
- Runtime Enforcement / Strategy Library / Reporting / AI redesign
- Direct Session interaction / Execution / Multi Exchange / REST / UI
- Scoring / confidence algorithms / profile calculation engines (deferred)
- Consumer Orchestrator / Reporting / AI profile read façades (Epic 6)

---

## RC-24

| Field         | Value                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| Theme         | Reporting, AI Analytics & Notification Delivery                                                          |
| Status        | **CLOSED**                                                                                               |
| Completion    | Epics 1–6 · tag `v1.0.0-rc24`                                                                            |
| Closure       | [`rc-24-closure-report.md`](./rc-24-closure-report.md)                                                   |
| Validation    | [`rc-24-validation-report.md`](./rc-24-validation-report.md)                                             |
| Certification | [`rc-24-reporting-ai-notification-certification.md`](./rc-24-reporting-ai-notification-certification.md) |

### Delivered

- Reporting boundary + Knowledge Lake read integration + domain model
- Deterministic report generation + query ports
- AI analytical narratives over ReportRun (non-authoritative)
- Notification Delivery Layer — Telegram active; other channels reserved; delivery only

### Explicitly deferred

- Trading Orchestrator / Market State / Strategy Selection
- Market Qualification / Multi Exchange
- Reporting UI / REST / durable notification persistence / production Telegram Bot network

---

## RC-23

| Field         | Value                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------- |
| Theme         | Runtime Enforcement (validation Gate)                                                        |
| Status        | **CLOSED**                                                                                   |
| Completion    | Epics 1–6 · tag `v1.0.0-rc23`                                                                |
| Closure       | [`rc-23-closure-report.md`](./rc-23-closure-report.md)                                       |
| Validation    | [`rc-23-validation-report.md`](./rc-23-validation-report.md)                                 |
| Certification | [`rc-23-runtime-enforcement-certification.md`](./rc-23-runtime-enforcement-certification.md) |

### Delivered

- Runtime Enforcement boundary (Gate only; validates ≠ decides)
- Strategy Library read consumption (lookup / eligibility)
- Fail-closed `validateDeployment` with full reason catalog
- Deployment bind enforcement + authorization stamp
- Trading Session start protection (stamp-only; no Gate re-run)
- Authority conformance + Engineering Workflow validation gates green

### Explicitly deferred

- Trading Orchestrator / Market State / Strategy Selection
- Enforcement REST / UI product
- Reporting / AI / IDE / Multi Exchange

---

## RC-22

| Field         | Value                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Theme         | Strategy Library + library Tactical Envelope (domain)                                  |
| Status        | **CLOSED**                                                                             |
| Completion    | Epics 1–6 · tag `v1.0.0-rc22`                                                          |
| Closure       | [`rc-22-closure-report.md`](./rc-22-closure-report.md)                                 |
| Validation    | [`rc-22-validation-report.md`](./rc-22-validation-report.md)                           |
| Certification | [`rc-22-strategy-library-certification.md`](./rc-22-strategy-library-certification.md) |

### Delivered

- Strategy Library boundary and ownership invariants
- Strategy / StrategyVersion immutable domain model
- Certification + evidence refs + library tactical envelope
- Static eligibility gate and deprecate/archive lifecycle history
- Domain certification and Engineering Workflow validation gates green

### Explicitly deferred

- Nest application ports and durable persistence
- Session / Deployment / Orchestrator consumption
- REST / UI / Reporting / AI product surfaces

---

## RC-14

| Field      | Value                      |
| ---------- | -------------------------- |
| Theme      | Production SaaS foundation |
| Status     | COMPLETE                   |
| Completion | `rc-14`                    |

Foundation for multi-tenant workspace operation and platform services used by
later research and paper-trading work.

---

## RC-15 / RC-15.1

| Field      | Value                                       |
| ---------- | ------------------------------------------- |
| Theme      | Research & Simulation Platform + validation |
| Status     | COMPLETE                                    |
| Completion | RC-15 through US125; RC-15.1 tag `rc-15.1`  |

Simulation stack is separate from paper/live trading. Retrospective:
[`rc-15-retrospective-development-guide-v2.md`](./rc-15-retrospective-development-guide-v2.md).

---

## RC-16

| Field      | Value                                                         |
| ---------- | ------------------------------------------------------------- |
| Theme      | Paper Trading Platform                                        |
| Status     | **BASELINE ACCEPTED** (for RC-17)                             |
| Completion | Planning + Freeze + M1 + M2 + M3 canonical path (US211–US223) |

### Delivered (baseline)

- Architecture Freeze: ADR-012…ADR-018 (ADR-019 event emission semantics also Active)
- M1 — Live Market Data Foundation (US126–US152)
- M2 — Durable Paper Order and Accounting Core (US153–US183)
- M3 E13–E16 — Strategy Deployment, Runtime, Signal Intent, CanonicalOrderPath,
  E2E candle → Fill → accounting (US211–US223)
- Pre-M3 gates: TD-034, TD-039, TD-040, TD-042 resolved

### Historical audit (preserved)

On 2026-07-18, before M3 strategy path completion, the final-release review
recorded **FAIL — RC-16 FINAL RELEASE IS NOT READY** because M3–M7 were still
open in the original plan. That document remains the audit record:

[`rc-16-release-summary.md`](./rc-16-release-summary.md)

### Scope transfer (2026-07-30)

Remaining originally planned RC-16 product work was **formally transferred** into
RC-17 planning ownership:

| Original RC-16 intent                                         | RC-17 owner                      |
| ------------------------------------------------------------- | -------------------------------- |
| M3 recovery hooks / validation (hist. “Epic E17” US224–US227) | Epic E17 Runtime Recovery        |
| M4 Risk and Safety Controls                                   | Epic E19 Operations              |
| M5 Recovery and Reconciliation                                | Epic E17 Runtime Recovery        |
| M6 Operations Experience                                      | Epic E19 Operations              |
| Market-data operational hardening beyond M1                   | Epic E20 Market Data             |
| Concurrent multi-strategy operation                           | Epic E21 Multi-Strategy Platform |

RC-16 is therefore the **accepted engineering baseline** for RC-17
implementation. New recovery/ops work proceeds under RC-17, not under a
parallel RC-16 M3–M7 backlog.

Plans: [`rc-16-paper-trading-plan.md`](./rc-16-paper-trading-plan.md),
[`rc-16-m3-strategy-runtime-plan.md`](./rc-16-m3-strategy-runtime-plan.md).

---

## RC-17

| Field            | Value                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| Theme            | Production Readiness & Operational Runtime                             |
| Status           | **BASELINED** (Runtime Recovery reference)                             |
| Completion       | E17 US240–US249 + US244A (2026-07-30)                                  |
| Retrospective    | [`rc-17-retrospective.md`](./rc-17-retrospective.md)                   |
| Technical Review | [`e17-stage-4-technical-review.md`](./e17-stage-4-technical-review.md) |

### Delivered (baseline)

- Planning package (Stages 0–2 authority): release planning, roadmap, process,
  ADL seed, templates, story band US240–US299
- Epic E17 Runtime Recovery Stage 3 reference pipeline:
  discovery → lease → checkpoint → reconcile → READY → event admission →
  arming → evaluate-only → SignalIntent → Session exit / lease release
- US244A pipeline orchestration / bootstrap-safety corrective
- Stage 4 Technical Review: **PASS WITH RECOMMENDATIONS**
- Boundary preservation: Session orchestrator; Runtime via ports; no
  RecoveryCoordinator; Canonical Order Path unchanged

### Scope transfer to RC-18+ (2026-07-30)

Original RC-17 planning epics beyond the Runtime Recovery baseline remain
**forward work** (not closed by this baseline):

| Original RC-17 intent                                                                               | Forward owner                                                    |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| E17 residuals (force-`RECOVERING`, real reconcile adapters, RecoveryState/Incident, chaos evidence) | **RC-18 mandatory** (TD-036) — R1–R4 Done 2026-08-01; R5–R6 open |
| E18 Event Processing                                                                                | RC-18+                                                           |
| E19 Operations (Kill Switch product, operator status, auth leftovers)                               | RC-18+ / E19                                                     |
| E20 Market Data operational hardening                                                               | RC-18+                                                           |
| E21 Multi-Strategy Platform                                                                         | RC-18+                                                           |

### RC-18 mid-release note (2026-08-01)

US290–US293 Implemented. See
[`rc-18-mid-release-health-review.md`](./rc-18-mid-release-health-review.md)
and [`rc-18-residual-register.md`](./rc-18-residual-register.md). Production
restart-safety still requires US294 + US295.

### Production readiness note

RC-17 is the **accepted Runtime Recovery architecture baseline**. Claiming
operators can safely restart continuous paper sessions still requires RC-18
mandatory TD-036 items **US294–US295** (R1–R4 closed at mid-release). ADL-008
remains DEFERRED until those land or an explicit accepted deferral is recorded.

Plans: [`rc-17-release-planning.md`](./rc-17-release-planning.md),
[`rc-17-roadmap.md`](./rc-17-roadmap.md),
[`rc-17-retrospective.md`](./rc-17-retrospective.md).

---

## Version 1 note

Trading Platform **Version 1** (`v1.0.0`) remains the certified production tag
on `main` for the Research/Simulation + foundation stack. RC-16/RC-17 advance
the paper-trading runtime under the Architecture Freeze; they do not rewrite
V1 certification history. See [`../releases/V1-COMPLETION.md`](../releases/V1-COMPLETION.md).
