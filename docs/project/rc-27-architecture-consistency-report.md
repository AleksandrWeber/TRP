# RC-27 Architecture Consistency Report

**Document:** RC-27 Architecture Consistency Report  
**Status:** APPROVED — planning package accepted; Epic 1 boundary awaiting review  
**Date:** 2026-08-14  
**Nature:** Conformance check of the RC-27 planning package against approved constitution. No Spec rewrite.

**Subjects:** Implementation Plan · Epic Breakdown · API Contract · Domain Model Contract · Integration Diagram

---

## 1. Summary verdict

| Authority document                 | Consistency | Notes                                                                                   |
| ---------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| Architecture Specification v2.0    | **PASS**    | §5.10 Exchange Scope; §11 Future Evolution preserved                                    |
| Authority Matrix                   | **PASS**    | Scope + Exchange Risk Policy = config/policy inputs — not money/fills/risk-decision SoT |
| Alias Dictionary                   | **PASS**    | Cluster → Exchange Scope; forbidden per-exchange Risk/Ledger/Execution clones           |
| Cluster Isolation Invariants       | **PASS**    | Shared engines; isolated resources/policies; fail-closed ambiguity                      |
| Strategy Library (RC-22 CLOSED)    | **PASS**    | Shared certification; allowlists only                                                   |
| Runtime Enforcement (RC-23 CLOSED) | **PASS**    | Shared Gate keyed by scope; no soft-pass / duplicate Gate                               |
| Reporting / AI / Notify (RC-24)    | **PASS**    | Future consumers of multi-scope reads; not redesigned                                   |
| Qualification / Profile (RC-25)    | **PASS**    | Per-venue research owners preserved                                                     |
| Orchestrator / State (RC-26)       | **PASS**    | Scope-keyed artifacts; ownership unchanged                                              |
| Knowledge Lake (RC-21 CLOSED)      | **PASS**    | Optional scoped markers only; never SoT                                                 |
| Exchange Scope identity (RC-19)    | **PASS**    | Thin Binance hook expanded — concept not reinvented                                     |
| Engineering Workflow Standard v1.0 | **PASS**    | Plan + API Contract + Domain Model before implementation; thin Epics                    |

**Overall:** RC-27 planning package is **architecturally consistent**. Safe to approve for implementation gating.

**Critical confirmation:** Exchange Scope remains an **isolation context** and never becomes a new business authority.

---

## 2. Architecture Specification v2.0

### 2.1 §5.10 Exchange Scope

| Spec requirement                                     | Planning response                                      | Status |
| ---------------------------------------------------- | ------------------------------------------------------ | ------ |
| Isolation boundary for one exchange’s resources      | Multi-scope registry of ExchangeScope entities         | **OK** |
| Bind adapter identity                                | AdapterBindingContext (logical)                        | **OK** |
| Own Trading Accounts for that venue                  | TradingAccountBinding (binding; Ledger SoT preserved)  | **OK** |
| Enforce session capacity                             | Config `maxActiveSessions` inputs; Session remains SoT | **OK** |
| Hold Exchange Risk Policy and allowlists             | ExchangeRiskPolicy + config allowlists                 | **OK** |
| Does not clone Risk / Ledger / Portfolio / Execution | Explicit non-goals + forbidden verbs + non-edges       | **OK** |

### 2.2 §11 Future Evolution

| Spec requirement                                                      | Planning response                              | Status |
| --------------------------------------------------------------------- | ---------------------------------------------- | ------ |
| Add Exchange Scope + adapter + accounts + Exchange Risk Policy        | Ports + domain for multi-scope lifecycle       | **OK** |
| Keep one Risk Engine, one Execution entry, one Ledger, one Library    | Shared engines topology + anti-clone rules     | **OK** |
| Qualification/profile for the venue                                   | Consume RC-25 per-venue; no ownership transfer | **OK** |
| Live capital requires future ADR                                      | Explicit non-goal                              | **OK** |
| Expand facades/scopes over frozen path; never parallel execution arch | Frozen path untouched; adapters context only   | **OK** |

### 2.3 Adjacent modules (explicitly preserved)

| Spec module                                 | Planning disposition                    | Status |
| ------------------------------------------- | --------------------------------------- | ------ |
| §5.2 Strategy Library                       | Shared; allowlist consume               | **OK** |
| §5.3 Qualification / Profile                | Per-venue; not replaced                 | **OK** |
| §5.4 / §5.5 State / Orchestrator            | Scope-keyed; ownership unchanged        | **OK** |
| §5.6 Trading Session / Runtime              | Capacity per scope; Session SoT         | **OK** |
| §5.7 Risk Engine                            | Policy inputs; Risk Decisions untouched | **OK** |
| §5.8 / §5.9 Orders / Execution              | Scoped refs; engines untouched          | **OK** |
| §5.11 / §5.12 Accounts / Accounting         | Bindings + scoped records               | **OK** |
| §5.13 / §5.14 / §5.15 Lake / Reporting / AI | Consumer fan-out                        | **OK** |

### 2.4 No Spec rewrite

Planning conforms to Spec v2.0; introduces no new global module beyond already approved Exchange Scope (§5.10). Multi-exchange is expansion of approved isolation, not a new constitution concept.

---

## 3. Authority Matrix

| Matrix concern                                        | RC-27 mapping                                             | Status |
| ----------------------------------------------------- | --------------------------------------------------------- | ------ |
| Exchange Scope config (max bots, allowlists)          | Owned by Exchange Scope                                   | **OK** |
| Exchange Risk Policy                                  | Policy inputs owned by Scope; Risk Engine decides         | **OK** |
| Risk decision / Orders / Execution / Ledger           | Untouched                                                 | **OK** |
| Forbidden: treating policy store as execution eng.    | Explicit non-ports + Domain §5 / §8                       | **OK** |
| Forbidden: direct adapter calls from Strategy/UI/Orch | AdapterBindingContext logical only; Execution remains SoT | **OK** |
| Cluster (UI)                                          | Alias to Exchange Scope projection/editor — UI deferred   | **OK** |

---

## 4. Alias Dictionary

| Alias rule                                 | Planning compliance                         | Status |
| ------------------------------------------ | ------------------------------------------- | ------ |
| Cluster → Exchange Scope                   | Canonical module naming                     | **OK** |
| Bot fleet / bot count under Exchange Scope | Capacity inputs per scope                   | **OK** |
| Forbidden: Cluster Risk Engine             | Exchange Risk Policy + platform Risk Engine | **OK** |
| Forbidden: duplicate Risk/Ledger/Execution | Anti-clone rules throughout package         | **OK** |
| Bot = Trading Session (not Cluster)        | Domain §8.1                                 | **OK** |

---

## 5. Cluster Isolation Invariants

| Invariant                            | RC-27 planning                                    | Status |
| ------------------------------------ | ------------------------------------------------- | ------ |
| 1 No cross-scope funds               | Account binding + Orders isolation tests (Epic 4) | **OK** |
| 2 No cross-scope session capacity    | Config capacity per scope; Session SoT            | **OK** |
| 3 One Risk Engine                    | Policy inputs only                                | **OK** |
| 4 One Execution Engine               | AdapterBindingContext logical; Execution SoT      | **OK** |
| 5 Scoped accounting records          | Bindings; Ledger model untouched                  | **OK** |
| 6 Shared research, scoped production | Library shared; allowlists per scope              | **OK** |
| 7 Fail closed on ambiguity           | API / Domain fail-closed rules                    | **OK** |
| 8 Paper vs live explicit             | `modeContext`; live deferred ADR                  | **OK** |
| 9 Statistics are projections         | Consumer reads; no shadow books                   | **OK** |
| 10 Qualification is per venue        | RC-25 consume; confidence never moves balances    | **OK** |

Shared services list (Library, Runtime, Orders, Risk, Execution, Ledger modules, Lake schema, Orchestrator) remains singleton in Integration Diagram §1 / §3.1.

---

## 6. Non-overlap with closed / adjacent modules

### 6.1 RC-19 Exchange Scope identity

| Rule                         | RC-27 planning                    | Status |
| ---------------------------- | --------------------------------- | ------ |
| Thin identity exists         | Expanded to multi-scope lifecycle | **OK** |
| No reinvented module concept | Same Spec §5.10 Exchange Scope    | **OK** |

### 6.2 Strategy Library (RC-22)

| Library rule                    | RC-27 planning                             | Status |
| ------------------------------- | ------------------------------------------ | ------ |
| Certification / eligibility SoT | Untouched; Scope allowlists reference only | **OK** |
| Shared across venues            | Explicit shared engine                     | **OK** |

### 6.3 Runtime Enforcement (RC-23)

| Enforcement rule         | RC-27 planning                   | Status |
| ------------------------ | -------------------------------- | ------ |
| Gate validates ≠ decides | Scope does not own Gate          | **OK** |
| Fail-closed              | Scope key required; no soft-pass | **OK** |
| No duplicate Gate        | Explicit anti-duplication        | **OK** |

### 6.4 Reporting / AI / Notification (RC-24)

| Rule                              | RC-27 planning           | Status |
| --------------------------------- | ------------------------ | ------ |
| Projection / Narrative / Delivery | Consumer read ports only | **OK** |
| No AI trading decisions           | Forbidden ports          | **OK** |
| Notification not control plane    | Scope-tagged reads only  | **OK** |

### 6.5 Qualification / Profile (RC-25)

| Rule                              | RC-27 planning               | Status |
| --------------------------------- | ---------------------------- | ------ |
| Research SoT for profile versions | Untouched; per-venue consume | **OK** |
| Confidence never forces trades    | Hard rule retained           | **OK** |

### 6.6 Market State / Trading Orchestrator (RC-26)

| Rule                                 | RC-27 planning                             | Status |
| ------------------------------------ | ------------------------------------------ | ------ |
| Current-condition / coordination SoT | Untouched; multi-scope = keyed concurrency | **OK** |
| Orchestrator ≠ Execution             | Preserved                                  | **OK** |
| State ≠ Qualification                | Preserved                                  | **OK** |

### 6.7 Knowledge Lake (RC-21)

| Lake rule                        | RC-27 planning                                          | Status |
| -------------------------------- | ------------------------------------------------------- | ------ |
| Append-only projection warehouse | Optional scoped markers only                            | **OK** |
| Never owns business state        | Scope owns isolation artifacts; Lake remains projection | **OK** |

---

## 7. Ownership overlap & duplicate-engine check

| Risk                                     | Planning control                    | Status |
| ---------------------------------------- | ----------------------------------- | ------ |
| Scope replaces Library                   | Allowlist only; no certify ports    | **OK** |
| Scope replaces Enforcement               | No Gate ownership; forbid soft-pass | **OK** |
| Scope replaces Session                   | Capacity inputs; Session SoT        | **OK** |
| Scope replaces Risk / Orders / Execution | Explicit non-ports + Spec §11 path  | **OK** |
| Scope replaces State / Orchestrator      | Peer keying only                    | **OK** |
| Scope becomes Runtime / Lake             | Domain flags always false           | **OK** |
| Multi-exchange clones engines            | Anti-clone topology + DoD           | **OK** |
| Scope becomes new business authority     | Isolation-only ownership matrix     | **OK** |

**Verdict:** No ownership overlap. No duplicate engines. Exchange Scope remains isolation-only.

---

## 8. Engineering Workflow Standard v1.0

| Requirement                            | Evidence                                      | Status |
| -------------------------------------- | --------------------------------------------- | ------ |
| No implementation before plan approval | Status PLANNING; STOP gates                   | **OK** |
| API Contract when backend ports added  | `rc-27-api-contract.md` ports only            | **OK** |
| Domain model when Spec modules require | `rc-27-domain-model-contract.md`              | **OK** |
| Thin Epics                             | Six epics, sequential, independently testable | **OK** |
| Explicit non-goals / deferred RCs      | Implementation Plan §2.2                      | **OK** |
| Validation before RC close             | Deferred post-implementation                  | **OK** |

UI Contract correctly skipped (ports-first; no RC-27 UI in this package).

---

## 9. Residual / intentional deferrals

| Item                                       | Disposition                                   |
| ------------------------------------------ | --------------------------------------------- |
| REST / transport product                   | After ports                                   |
| Persistence product                        | After ports                                   |
| Credential vault / wire protocols          | Out of planning; future implementation choice |
| Command Center multi-Cluster UI            | After ports; UI Contract if/when approved     |
| Live capital mode / live adapters          | Future ADR                                    |
| Additional venues beyond isolation proof   | Model supports N; shipping cadence post-proof |
| AI decisioning                             | Forever forbidden as capital authority        |
| Library / Enforcement / Reporting redesign | Forbidden — CLOSED predecessors               |
| Spec rewrite                               | Forbidden                                     |

---

## 10. Consistency verdict

RC-27 planning package is **consistent** with Architecture Specification v2.0, Authority Matrix, Alias Dictionary, Cluster Isolation Invariants, and RC-19…RC-26 closed boundaries.

**Exchange Scope remains an isolation context and never becomes a new business authority.**

**Safe to approve.** Do not start Epic 1 until human approval is recorded.

---

## 11. STOP

**STOP.** Planning package approved. Epic 1 complete for review — wait before Epic 2.
