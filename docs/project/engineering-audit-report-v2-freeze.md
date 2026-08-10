# TRP — Engineering Audit Report

**Document:** Engineering Audit Report (post–V2 Freeze Preconditions)  
**Date:** 2026-08-10  
**Baseline:** RC-18 (US290–US294 Done; US295 open) + V2 Freeze Preconditions **Approved**  
**Authority:** Audit only — does not redesign V2; does not invent global modules; does not override ADR-012…ADR-018

Related:

- [V2 Freeze Preconditions](./v2-freeze-preconditions.md)
- [V2 Alias Dictionary](./v2-alias-dictionary.md)
- [V2 Authority Matrix](./v2-authority-matrix.md)
- [V2 Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)
- [V2 Tactics Contract](./v2-tactics-contract.md)
- [V2 Architecture Glossary](./v2-architecture-glossary.md)
- [V2 Architecture Decision Log](./v2-architecture-decision-log.md)
- [V2 C4 Container Diagram](./v2-c4-container-diagram.md)
- [RC-18 Current System Snapshot](./rc-18-current-system-snapshot.md)
- [V2 Implementation Roadmap](./v2-implementation-roadmap.md)
- [Final Readiness Assessment](./v2-final-readiness-assessment.md)
- [RC-18 Residual Register](./rc-18-residual-register.md)
- [Technical Debt](./technical-debt.md)
- [Module Maturity](./module-maturity.md)
- [Release History](./release-history.md)

---

## 1. General assessment

### Current state

TRP is a **working Research OS + durable Paper Trading platform** on a frozen RC-16 path (ADR-012…018), with **Runtime Recovery baselined** (RC-17) and **almost closed production-recovery claim** (RC-18 R1–R5 closed; **US295 / ADL-008 still open**).

V2 product language is **mapped and approved** (Bot=Session, Cluster=Exchange Scope, Lake≠SoT, Tactics Option B). **V2 modules are not integrated in code.** Architecture Specification v2.0 is the next documentation gate before large V2 implementation.

### Strengths

- Clear Level-0 / Level-1 / ADR authority stack.
- Canonical paper path exists: Session → Runtime → SignalIntent → Orders → Risk → Execution → Fill → Ledger.
- Strong determinism culture in research + accounting (decimal, rebuild, Outbox/Inbox).
- Recovery/fail-closed evidence advanced through US290–US294.
- V2 Freeze Preconditions prevent parallel rewrite (facades/scopes over existing BC).

### Weaknesses

- Dual stacks remain in research intelligence (legacy analysis vs Insight/Recommendation/Report).
- Many research domain stores still **in-memory** (TD-001/TD-003).
- Frontend is a **page collection**, not the approved Research IDE / Command Center shell.
- Productized Strategy Library, Market State, Selector/Orchestrator, Monte Carlo, multi-exchange scopes not built.
- Ops surfaces (Kill Switch productization, operator recovery UX) still open (E19).

### Main technical risks

1. Starting V2 UI/modules before **US295** closes the recovery governance claim.
2. Expanding in-memory Knowledge into “Lake” without durable event projection design.
3. Letting Bot/Cluster language spawn a second runtime path in code.
4. Auth still partially dev-shaped (TD-005/TD-006) for stronger ops claims.

### Main architectural risks

1. **Trading Orchestrator** becoming a god-module that bypasses Risk/Execution.
2. **Exchange Scope** implemented as cloned engines instead of policy/scope.
3. **Knowledge Lake** treated as SoT by reports/AI.
4. **Tactics** envelope not enforced → silent strategy mutation (violates Option B).

---

## 2. Readiness by area (%)

Percentages = readiness for **stable V2 on top of current RC-18**, not “done forever.”

| Area                           | Ready   | Notes                                                                    |
| ------------------------------ | ------- | ------------------------------------------------------------------------ |
| Core Platform                  | **85%** | Monorepo, auth/workspace, Nest modules, Docker; auth hardening partial   |
| Data Layer                     | **70%** | Binance live + historical/import foundations; multi-exchange not started |
| Paper Trading                  | **85%** | Canonical path + recovery largely done; ops polish open                  |
| Execution                      | **75%** | Paper Execution Engine path solid; live adapter future ADR               |
| Risk Engine                    | **65%** | Mandatory Risk Decisions exist; Kill Switch/ops policy incomplete        |
| Strategy Lab                   | **70%** | Backtest + Walk-Forward + campaigns; Monte Carlo absent                  |
| Strategy Library               | **35%** | Knowledge/Experiment foundations; not certified library + envelopes      |
| Reporting                      | **30%** | Research reports/read APIs exist; ops/Telegram/PDF not productized       |
| Command Center                 | **10%** | Not started as product; fragments of trading pages only                  |
| Knowledge Lake                 | **20%** | Knowledge domain exists; Lake warehouse not designed/built               |
| Market Qualification / Profile | **0%**  | Not started                                                              |
| Trading Orchestrator           | **5%**  | Conceptual only; no Selector orchestration product                       |
| Documentation                  | **90%** | Strong; Spec v2.0 still outstanding                                      |
| Architecture (RC Freeze)       | **95%** | ADR-012…018 solid; V2 mapped; Spec v2.0 pending                          |
| Architecture (V2 integration)  | **25%** | Preconditions approved; code integration not started                     |
| Frontend                       | **40%** | Many routes; not IDE shell / density / bot facade                        |
| Backend                        | **80%** | Large Nest surface; some dual stacks / in-memory gaps                    |
| Infrastructure                 | **75%** | Docker Compose, CI-oriented quality gates; K8s out of scope              |
| Testing                        | **75%** | Strong unit/integration/chaos evidence; Playwright deferred (TD-043)     |
| DevOps                         | **60%** | Compose + release docs; no full prod multi-exchange ops story            |
| UI/UX (vs V2 IDE vision)       | **30%** | Docs strong; implementation far from C4 operator/research IDE            |

**Blended platform readiness (RC-18 + V2 preconditions, pre-integration): ~55–60% toward stable Version 2.**

---

## 3. Module status (implemented / partial / not)

### Existing RC platform

| Module                                   | Status | Why                                        |
| ---------------------------------------- | ------ | ------------------------------------------ |
| Monorepo / CI / Docker bootstrap         | ✅     | Sprint 0 / RC-14 foundation                |
| Auth / Workspace                         | 🟡     | Works; hardening incomplete (TD-005/006)   |
| Live Market Data (Binance)               | ✅     | M1 complete                                |
| Historical / simulation MarketData       | 🟡     | Foundation; durability/product APIs uneven |
| Research Campaign / Pipeline             | ✅     | Mature for current phase                   |
| Backtesting                              | 🟡     | Foundation validated; tooling/product gaps |
| Walk-Forward                             | 🟡     | Implemented; not full productization       |
| Monte Carlo                              | 🔴     | Parking Lot                                |
| Knowledge / Insight / Reports (research) | 🟡     | Exists; dual stacks + in-memory            |
| Trading Session                          | ✅     | ADR-014 + RC-18 recovery work              |
| Strategy Runtime / Signal Intent         | ✅     | M3 path                                    |
| Orders / Execution / Paper Adapter       | ✅     | Canonical path                             |
| Risk Decisions                           | 🟡     | Core yes; Kill Switch/ops incomplete       |
| Ledger / Position / Portfolio            | ✅     | ADR-015 path                               |
| Runtime Recovery                         | 🟡     | R1–R5 done; US295 governance open          |
| Dashboard / trading UI pages             | 🟡     | Present; non-IDE; non-Command Center       |
| AI Gateway                               | 🟡     | Exists; not full Analyst product           |
| Telegram                                 | 🔴     | Not started                                |
| Multi-exchange                           | 🔴     | Explicitly deferred historically           |

### V2 named surfaces

| V2 surface                               | Status  | Why                                                                |
| ---------------------------------------- | ------- | ------------------------------------------------------------------ |
| Exchange Scope (Cluster)                 | 🔴      | Concept approved; no scope aggregate/policy model in product sense |
| Bot UI facade                            | 🔴      | Session exists; Bot naming/UX not applied as product facade        |
| Tactical Envelope                        | 🔴      | Contract approved; no envelope artifact enforcement                |
| Trading Orchestrator                     | 🔴      | Name approved; no module                                           |
| Knowledge Lake                           | 🔴      | Knowledge ≠ Lake warehouse yet                                     |
| Reporting & AI Analytics (ops)           | 🔴 / 🟡 | Research reporting fragments only                                  |
| Command Center                           | 🔴      | Not started                                                        |
| Market Qualification                     | 🔴      | Not started                                                        |
| Market Profile Library                   | 🔴      | Not started                                                        |
| IDE shell (tabs/explorer/bottom/AI side) | 🔴      | Layout is classic nav, not IDE                                     |

---

## 4. V2 module integration analysis

| V2 module                | Similar logic today?                            | Integrate by                                           | Refactor needed?                                       | Complexity                                           |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------- |
| Exchange Scope           | Workspace + account + adapter binding fragments | Add scope identity + policy on shared engines          | Low if scope-as-binding; **Critical** if clone engines | **Medium** (High if mismapped)                       |
| Bot facade               | Trading Session APIs/UI                         | UI alias + session capacity views                      | No backend rewrite                                     | **Low**                                              |
| Tactical Envelope        | Deployment params                               | Certified envelope on strategy version + runtime guard | Small runtime validation                               | **Medium**                                           |
| Trading Orchestrator     | None productized; closest = future Selector     | Thin orchestrator over Session/Risk/Library            | Must not own execution                                 | **High** (depends on Library + Market State/Profile) |
| Knowledge Lake           | Knowledge domain + Outbox events                | Append-only projection consumer from SoT events        | Avoid dual SoT; may need durable store                 | **High**                                             |
| Reporting & AI Analytics | ResearchReport / AI page                        | Read models + scheduled narratives                     | Keep non-authoritative                                 | **Medium**                                           |
| Command Center           | Trading pages + diagnostics fragments           | Ops workspace over existing commands                   | UI-heavy; wire Kill Switch/status APIs                 | **Medium**                                           |
| Market Qualification     | Lab + market data quality ideas                 | New research pipeline                                  | Additive                                               | **Medium**                                           |
| Market Profile Library   | None                                            | Versioned artifacts from Qualification                 | Additive                                               | **Low–Medium**                                       |
| IDE shell                | AppLayout + research-control                    | Frontend shell epic                                    | Layout refactor, not domain rewrite                    | **Medium**                                           |

---

## 5. Technical debt (audit view)

### Fix or harden before deep V2 integration

| Item                                          | Action                                                              |
| --------------------------------------------- | ------------------------------------------------------------------- |
| US295 / ADL-008 (TD-036 R6)                   | **Close before claiming RC-18 done**                                |
| TD-005 / TD-006 auth hardening                | Before serious Command Center / multi-operator claims               |
| Dual research stacks (TD-011/012/013)         | Do **not** expand; migrate carefully when Lake/Reporting touch them |
| In-memory Knowledge/Campaign stores (TD-001)  | Decide durability strategy before Lake                              |
| Kill Switch / operator status (E19 residuals) | Needed for Command Center emergency controls                        |

### Better leave alone for now

| Item                        | Why                                                            |
| --------------------------- | -------------------------------------------------------------- |
| ADR-012…018 canonical path  | Freeze — extend via facade/scope only                          |
| Ledger / decimal accounting | Stable SoT — do not re-open                                    |
| Outbox/Inbox model          | Working durability spine                                       |
| TD-009 forwardRef           | Cosmetic Nest wiring                                           |
| TD-043 Playwright           | Useful later; not V2 architecture blocker                      |
| Monte Carlo                 | Important product gap, but not required to start Scope/Bot/IDE |

### Duplication / temporary solutions to watch

- Legacy `ResearchAnalysis` vs Insight/Recommendation/Report.
- Dual Experiment/Knowledge stacks (domain in-memory vs Prisma paths).
- Stage-1 production path retired (good) — ensure no new parallel “Bot engine.”
- Docs lag in places (release-history still mentioning older US294 open while residual register closes R5) — sync in RC-18 closeout.

---

## 6. Architectural compatibility (RC-18 ↔ V2)

**Compatibility: ~92–95%**

RC-18 already implements the spine V2 must reuse. Approved mappings avoid rewrite.

### Still needed before “fully married” in code

1. **Architecture Specification v2.0** (contracts → normative Spec; still outstanding).
2. Exchange Scope identity on accounts/sessions/orders (data model + APIs).
3. Bot-as-alias consistency in UI/API docs.
4. Tactical Envelope enforcement points.
5. Lake as projection consumer (explicit non-SoT).
6. Orchestrator boundaries documented in Spec and later ADR if ownership expands.

No ADR conflict if V2-D01…D13 are honored.

---

## 7. Practical roadmap to stable Version 2

> Expanded Product Owner fields (User Value / complexity / risk) live in  
> [`v2-implementation-roadmap.md`](./v2-implementation-roadmap.md).  
> **RC order and goals below are unchanged.**

### RC-18 closeout (immediate)

**Goal:** Finish production-recovery claim and doc sync.  
**Tasks:** US295 ADL-008; sync release-history/project-status; mark Freeze Preconditions checklist Approved in hub.  
**Result:** RC-18 closable; clean gate into Spec/implementation.

**Depends on:** US294 Evidence Package (done).

---

### RC-19 — Architecture Spec v2.0 + integration skeleton

**Goal:** Turn approved preconditions into Spec v2.0 and minimal code hooks (no feature flood).  
**Tasks:** Write Architecture Specification v2.0; ADR(s) only if ownership gaps appear; introduce Exchange Scope id on session/account (thin); Bot UI alias on Session surfaces; envelope schema stub.  
**Result:** Implementers share one Spec; zero parallel architecture.

**Depends on:** RC-18 closeout + Approved Freeze package.

---

### RC-20 — Ops readiness (Command Center foundation)

**Goal:** Operator visibility/control on existing paper path (E19 themes).  
**Tasks:** Kill Switch productization; recovery/status APIs; Command Center v1 over Session/Risk commands; non-authoritative ops dashboard widgets.  
**Result:** Safe ops surface without new trading brain.

**Depends on:** RC-19 Spec; existing Session/Risk/Execution.

---

### RC-21 — IDE shell + Bot fleet UX

**Goal:** Research IDE layout; Bot = Session in UX.  
**Tasks:** Top/left/tabs/bottom/AI side shell; project explorer; jobs/logs bottom panel; Bot list/detail bound to Sessions; Exchange Scope views (even single Binance).  
**Result:** UI matches V2 feeling; still one backend path.

**Depends on:** RC-19 naming; RC-20 status APIs helpful but shell can start in parallel after Spec.

---

### RC-22 — Strategy Library + Tactical Envelope

**Goal:** Certified strategies with enforceable envelopes (Option B).  
**Tasks:** Library certification records; envelope persistence; runtime reject out-of-envelope tactics; wire Deployment/Session.  
**Result:** Validated Knowledge becomes enforceable.

**Depends on:** Strategy Lab outputs; Spec tactics contract; Session/Deployment.

---

### RC-23 — Knowledge Lake (projection)

**Goal:** Append-only warehouse from research + trading events.  
**Tasks:** Event projection pipeline from Outbox/SoT facts; retention/query API; explicitly non-SoT; migrate consumers off ad-hoc dual stacks where touched.  
**Result:** Single analytical feed for Reporting/AI.

**Depends on:** Stable execution/accounting events (have); durability decision for Lake store; prefer after RC-22 if library events matter.

---

### RC-24 — Reporting & AI Analytics

**Goal:** Daily/weekly narratives + web reports; Telegram alerts later in same or next RC.  
**Tasks:** Report jobs over Lake/projections; AI explain-only; Telegram for reports/alerts only.  
**Result:** Ops/research reporting without control-plane Telegram.

**Depends on:** Knowledge Lake (RC-23); Command Center metrics helpful.

---

### RC-25 — Market Qualification + Market Profile

**Goal:** Venue qualification pipeline + versioned profiles.  
**Tasks:** User-triggered qualification runs; profile versions; confidence inputs only.  
**Result:** Multi-exchange prep without forcing trades.

**Depends on:** Strategy Lab + data layer; Library metrics useful.

---

### RC-26 — Trading Orchestrator (thin) + Market State inputs

**Goal:** Coordinate library + profiles + tactics selection into Session missions.  
**Tasks:** Orchestrator service; optional Market State classifier MVP; never bypass Risk/Execution.  
**Result:** Adaptive tactics inside envelopes; still no live strategy invention.

**Depends on:** RC-22 Library/Envelope; RC-25 Profiles strongly recommended; Risk/Session.

---

### RC-27 — Multi Exchange Scope expansion

**Goal:** Second exchange scope (e.g. Bybit) as proof of isolation invariants.  
**Tasks:** Adapter + scope policy + accounts; cross-scope isolation tests; qualification for new venue.  
**Result:** Cluster model proven without engine clones.

**Depends on:** Exchange Scope model (RC-19/20); Qualification/Profile (RC-25); isolation tests.

---

### RC-28 — V2 stabilization / Version 2 release candidate

**Goal:** Harden, validate, document V2 as stable.  
**Tasks:** Conformance tests for aliases/authority/tactics/isolation; UX polish; residual TD triage; V2 release notes.  
**Result:** **Stable Version 2** (paper-first; live capital still future ADR unless separately approved).

**Depends on:** RC-20…RC-27 critical path items below.

---

## 8. Dependency analysis

```text
US295 / RC-18 closeout
  → Spec v2.0 (RC-19)
    → Exchange Scope skeleton + Bot alias
      → Command Center / Kill Switch ops (RC-20)
      → IDE shell (RC-21) ──┐
    → Strategy Library + Tactical Envelope (RC-22)
      → Knowledge Lake (RC-23)
        → Reporting / AI / Telegram (RC-24)
      → Market Qualification → Market Profile (RC-25)
        → Trading Orchestrator (RC-26)
          → Multi Exchange Scope (RC-27)
            → V2 stabilization (RC-28)
```

Compressed dependency examples requested:

```text
Reporting
  → Knowledge Lake
    → Execution/Paper events (existing)
      → Paper Trading (existing)

Trading Orchestrator
  → Strategy Library + Tactical Envelope
  → Market Profile (recommended)
  → Risk Engine + Trading Session (existing)

Command Center
  → Trading Session + Risk commands (existing)
  → Spec/alias rules (RC-19)
  → Kill Switch productization (RC-20)
```

---

## 9. Critical path (minimum to stable V2)

```text
1. Close RC-18 (US295)
2. Architecture Spec v2.0
3. Exchange Scope skeleton + Bot=Session facade
4. Strategy Library + Tactical Envelope enforcement
5. Knowledge Lake projection (non-SoT)
6. Command Center + Kill Switch ops (safe operator control)
7. Trading Orchestrator (thin) using Library/Profiles/Envelopes
8. V2 conformance + stabilization release
```

Everything else (IDE polish, Telegram, second exchange, Monte Carlo, Market State richness) **accelerates product quality** but the path above is the minimum architectural completion of approved V2.

---

## 10. Summary

### Ready for RC-19?

**Yes, with one gate:** finish **US295** (or explicitly accept deferral per residual register) and treat Spec v2.0 as the first RC-19 deliverable. Conceptual V2 is approved; code integration should not start as a feature free-for-all before Spec.

### Needed before Version 2 integration?

1. RC-18 closeout (US295).
2. Architecture Specification v2.0.
3. Discipline: facades/scopes only — no Bot/Cluster engines.

### Top 3 priorities now

1. **US295 / ADL-008** — close RC-18 recovery governance.
2. **Architecture Specification v2.0** — normative text from approved preconditions + C4.
3. **Exchange Scope skeleton + Bot UI alias** — first non-breaking V2 code hooks on existing Session/Account path.

---

## Audit verdict

| Question                                        | Verdict                                                  |
| ----------------------------------------------- | -------------------------------------------------------- |
| Is V2 concept ready?                            | **Yes** (Freeze Preconditions approved)                  |
| Is codebase ready to absorb V2 without rewrite? | **Yes (~92–95% compatible)**                             |
| Is Version 2 implemented?                       | **No**                                                   |
| Next phase                                      | **RC-18 closeout → Spec v2.0 → incremental integration** |
| Brainstorming further architecture?             | **Stop** — implement approved design                     |

This report is the planning baseline for RC-19+ execution of the approved architecture.
