# RC-27 Epic Breakdown — Multi-Exchange Scope

**Document:** RC-27 Epic Breakdown  
**Status:** **CLOSED** (`v1.0.0-rc27`) — Epics 1–6 complete  
**Date:** 2026-08-14  
**Nature:** Thin architectural epics. Each Epic must independently compile, test, and be reviewable.

**Parent:** [RC-27 Implementation Plan](./rc-27-implementation-plan.md)  
**API:** [API Contract](./rc-27-api-contract.md)  
**Domain:** [Domain Model Contract](./rc-27-domain-model-contract.md)  
**Integration:** [Integration Diagram](./rc-27-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.10, §11  
**Isolation:** [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md)  
**Predecessor:** [RC-26 CLOSED](./rc-26-closure-report.md) · [RC-19 CLOSED](./rc-19-closure-report.md)

---

## Release epic map

```text
Epic 1  Exchange Scope boundary + ownership
  ↓
Epic 2  Domain model (scope / config / policy / binding / lifecycle)
  ↓
Epic 3  Application ports (lifecycle + query)
  ↓
Epic 4  Trading path integration (keying + isolation without ownership transfer)
  ↓
Epic 5  Consumer read ports
  ↓
Epic 6  Authority conformance + readiness
  ↓
Validation & Release  (separate task after Epics)
```

Each Epic must independently compile and pass tests. Later epics must not start until upstream DoD is met (or explicitly gated). Story IDs allocated after plan approval ([story-id-allocation](./story-id-allocation.md)).

---

## Epic 1 — Exchange Scope boundary + ownership

### Objective

Establish Exchange Scope as the multi-venue **isolation boundary** and publish hard ownership vs Strategy Library, Runtime Enforcement, Market Qualification, Market Profile, Market State, Trading Orchestrator, Trading Session, Risk Engine, Orders, Execution, Accounting, Reporting, Knowledge Lake, and Notification Delivery.

### Dependencies

- RC-26 CLOSED; RC-19 Exchange Scope identity; Spec §5.10 / §11; Authority Matrix; Alias Dictionary; Cluster Isolation Invariants
- Implementation Plan §§3–5

### Definition of Done

- [x] Module named and documented (canonical: **Exchange Scope** — UI: Cluster; not Runtime, not Session, not Library, not Lake).
- [x] Ownership table accepted: Scope owns identity / config / context / lifecycle / policy inputs / account bindings; business engines unchanged.
- [x] Explicit: Scope isolates; Scope never owns strategies, runtime validation, orchestration, orders, execution, or accounting.
- [x] Explicit: Multi-scope ≠ multi-runtime; no cloned Risk / Orders / Execution / Ledger / Library / Enforcement / Reporting.
- [x] Forbidden dependencies listed (no Scope → Risk Decision; no Scope → Order submit; no Scope → certify strategy).
- [x] Boundary tests / invariants compile and pass (docs + intended unit skeleton after kickoff).
- [x] Architecture Impact: no new Spec concepts beyond already approved §5.10 Exchange Scope.

**Epic 1 report:** [rc-27-epic1-exchange-scope-boundary.md](./rc-27-epic1-exchange-scope-boundary.md)  
**Boundary diagram:** [rc-27-epic1-boundary-diagram.md](./rc-27-epic1-boundary-diagram.md)

### Expected user value

Shared vocabulary: operators can manage multiple venues as Clusters without forking the trading stack.

---

## Epic 2 — Domain model (scope / config / policy / binding / lifecycle)

### Objective

Implement immutable Exchange Scope domain entities: ExchangeScope, ExchangeScopeConfig, ExchangeScopeLifecycle, ExchangeRiskPolicy, TradingAccountBinding, AdapterBindingContext — without activating trading-path behaviour or consumer fan-out.

### Dependencies

- Epic 1 accepted
- [Domain Model Contract](./rc-27-domain-model-contract.md)

### Definition of Done

- [x] Domain entities match Domain Model contract.
- [x] Lifecycle transitions documented and tested (created/active/suspended/archived edges only).
- [x] Version / overwrite protection for config and policy inputs (append-only where contracted).
- [x] Authority labels: `exchange_scope_artifact` / `exchange_policy_input` — never `risk_decision`, never `execution_sot`.
- [x] Explicit flags: `isRuntime` / `isStrategyLibrary` / `isRiskEngine` / `isExecutionEngine` always `false`.
- [x] No Orders / Risk-approve / Execution / Library-certify / Orchestrator-select / Session-own APIs.
- [x] Unit tests: immutability, lifecycle, isolation keys, no engine clone fields.
- [x] Compiles and passes tests independently of live exchange network.

**Epic 2 report:** [rc-27-epic2-domain-model.md](./rc-27-epic2-domain-model.md)

### Expected user value

Reviewers share one canonical immutable shape for venue isolation — never money, fills, or risk approval.

---

## Epic 3 — Application ports (lifecycle + query)

### Objective

Implement Exchange Scope application ports: register / activate / suspend / archive scopes; update config and policy inputs; bind accounts; query scopes. No REST. No persistence product. No trading-path mutation beyond Scope-owned artifacts.

### Dependencies

- Epic 2 domain
- [API Contract](./rc-27-api-contract.md) `ExchangeScopeServicePort` / `ExchangeScopeQueryPort`

### Definition of Done

- [x] `ExchangeScopeServicePort` can register/activate/suspend/archive scopes and update config/policy/bindings.
- [x] `ExchangeScopeQueryPort` can list/get scopes, config, policy inputs, bindings.
- [x] All commands require `workspaceId`; venue operations require `exchangeScopeId` after create.
- [x] Fail-closed on ambiguous / missing scope identity for scoped commands.
- [x] Default Binance scope remains valid; second scope (e.g. Bybit) creatable at port level.
- [x] No Session create, Order submit, Risk approve, Gate soft-pass, Library certify ports.
- [x] Unit/integration tests for happy path, duplicate venue reject policy, suspend blocks new capacity claims.
- [x] Compiles/tests without live adapter transport.

**Epic 3 report:** [rc-27-epic3-application-ports.md](./rc-27-epic3-application-ports.md)

### Expected user value

Operators (via future UI/API) can manage multiple Exchange Scopes through one port surface without inventing per-venue stacks.

---

## Epic 4 — Trading path integration (keying + isolation)

### Objective

Prove trading-path modules integrate cleanly with multi-scope keying **without ownership change**: Strategy Library eligibility allowlists, Runtime Enforcement Gate, Market Qualification / Profile, Market State, Trading Orchestrator, Trading Session capacity, Risk policy reads, and scoped Orders/Execution/Accounting **references**.

### Dependencies

- Epic 3 ports
- RC-22 / RC-23 / RC-25 / RC-26 closed ports
- Cluster Isolation Invariants

### Definition of Done

- [x] Library eligibility / allowlist checks accept `exchangeScopeId` without Library redesign. _(pre-existing RC-22)_
- [x] Runtime Enforcement Gate continues fail-closed with scope key — no duplicate Gate. _(pre-existing RC-23)_
- [x] Qualification / Profile / Market State / Orchestrator artifacts remain keyed by scope — modules not cloned. _(pre-existing RC-25/26)_
- [x] Session carries Scope identity; Session remains lifecycle SoT. _(capacity counting unchanged — identity only)_
- [x] Risk Engine path unchanged; no per-scope Risk Decision processor. _(policy-input consumption remains Epic 3 ports)_
- [x] Orders / Execution / Accounting references reject cross-scope usage (domain isolation tests).
- [x] Isolation tests: cross-scope Position / RuntimeContext / helper fail-closed — PASS at domain level.
- [x] No REST / transport / persistence product redesign; no live capital enablement. _(additive columns only)_
- [x] Upstream engines do not import Scope as business authority beyond identity / alignment helpers.

**Epic 4 report:** [rc-27-epic4-trading-path-scope-integration.md](./rc-27-epic4-trading-path-scope-integration.md)

### Expected user value

Two venues can coexist with separate wallets, bot caps, and policies while sharing one certified strategy library and one risk engine.

---

## Epic 5 — Consumer read ports

### Objective

Expose read-only façades of Exchange Scope identity, lifecycle, config summaries, and policy-input summaries for Reporting, AI Analytics, Command Center, Knowledge Lake, and Notification Delivery. No UI. No REST product.

### Dependencies

- Epics 3–4 accepted
- API Contract consumer ports
- RC-24 / RC-21 remain consumers only

### Definition of Done

- [x] `ExchangeScopeConsumerReadPort` projects scope list / detail / lifecycle / config summary / policy-input summary (read only).
- [x] Projections carry `authorityClass` and never claim risk / execution / ledger SoT.
- [x] Reporting / AI / Command Center / Lake / Notification may depend on consumer ports; reverse command dependencies forbidden.
- [x] Cross-scope aggregate views (if any) are explicit read-only and never invent balances.
- [x] No REST / persistence product / UI shipped under this epic.
- [x] Module README + index updates for consumer audiences (after kickoff).

**Epic 5 report:** [rc-27-epic5-consumer-read-ports.md](./rc-27-epic5-consumer-read-ports.md)

### Expected user value

Ops and analytics can observe multi-venue scope facts without gaining false SoT authority.

---

## Epic 6 — Authority conformance + readiness

### Objective

Prove authority conformance across RC-19…RC-26 closed boundaries, Cluster Isolation Invariants, and Spec §5.10 / §11. Produce internal audit + readiness for Validation & Release. No Spec rewrite.

### Dependencies

- Epics 1–5 accepted
- Authority Matrix · Alias Dictionary · Isolation Invariants
- Closed predecessors RC-19…RC-26

### Definition of Done

- [x] Authority conformance tests: Scope ≠ Runtime ≠ Session ≠ Library ≠ Gate ≠ Risk Engine ≠ Execution ≠ Ledger ≠ Lake.
- [x] No ownership overlap with closed modules; no duplicate engines.
- [x] Isolation invariant checklist 1–10 evidenced for ≥2 concurrent scopes.
- [x] Internal audit + readiness report for Validation & Release (separate task).
- [x] Residual/deferred register updated (UI, REST, live capital, additional adapters).
- [x] No implementation of forbidden items under “conformance.”

**Epic 6 report:** [rc-27-epic6-authority-conformance.md](./rc-27-epic6-authority-conformance.md)  
**Internal audit:** [rc-27-epic6-internal-audit-report.md](./rc-27-epic6-internal-audit-report.md) (**PASS**)  
**Readiness:** [rc-27-epic6-readiness-report.md](./rc-27-epic6-readiness-report.md)

### Expected user value

Reviewers can approve RC-27 close readiness knowing multi-exchange isolation did not invent a second platform.

---

## Epic sequencing rules

1. No Epic starts before plan approval.
2. Epic _N+1_ does not start until Epic _N_ DoD is met (or explicitly gated by human review).
3. Each Epic must independently compile and pass its tests.
4. Story IDs allocated only after plan approval.
5. Validation & Release is a **separate** task after Epic 6 readiness.

---

## STOP gate

**CLOSED.** RC-27 Validation PASS / Closure (`v1.0.0-rc27`). Proceed to RC-28 Planning under a separate task.
