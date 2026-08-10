# TRP V2 — Implementation Roadmap (RC-19…RC-28)

**Document:** V2 Implementation Roadmap  
**Status:** Approved planning baseline (expanded from Engineering Audit; **order/goals unchanged**)  
**Date:** 2026-08-10  
**Source roadmap:** [`engineering-audit-report-v2-freeze.md`](./engineering-audit-report-v2-freeze.md) §7

This document **does not change** the RC sequence. It adds Product Owner–facing **User Value**, **Estimated complexity**, and **Main implementation risk** for each RC.

Related:

- [RC-18 Current System Snapshot](./rc-18-current-system-snapshot.md)
- [V2 Freeze Preconditions](./v2-freeze-preconditions.md)
- [Final Readiness Assessment](./v2-final-readiness-assessment.md)
- [C4 Container Diagram](./v2-c4-container-diagram.md)

### Complexity scale

| Scale      | Meaning                                                |
| ---------- | ------------------------------------------------------ |
| **Small**  | Mostly docs/governance or thin facade                  |
| **Medium** | Focused feature slice; limited cross-module risk       |
| **Large**  | Multi-module delivery; careful SoT/boundary discipline |
| **XL**     | Broad surface (UI+domain+ops) or multi-venue proof     |

---

## RC-18 closeout (gate before V2 integration)

**Goal (unchanged):** Finish production-recovery claim and doc sync.  
**Tasks (unchanged):** US295 ADL-008; sync release-history/project-status; Freeze package treated Approved.  
**Result (unchanged):** RC-18 closable; clean gate into Spec/implementation.

**User Value:** Operators and maintainers can trust that restart/recovery is formally accepted (or explicitly deferred) — no ambiguous “almost production recovery” state.

**Estimated complexity:** **Small**

**Main implementation risk:** Treating US295 as optional while starting V2 features — governance drift.

**Depends on:** US294 Evidence Package (done).

---

## RC-19 — Architecture Spec v2.0 + integration skeleton

**Status:** **COMPLETE** (2026-08-10) — [Closure Report](./rc-19-closure-report.md)

**Goal (unchanged):** Turn approved preconditions into Spec v2.0 and minimal code hooks (no feature flood).  
**Tasks (unchanged):** Write Architecture Specification v2.0; ADR(s) only if ownership gaps appear; introduce Exchange Scope id on session/account (thin); Bot UI alias on Session surfaces; envelope schema stub.  
**Result (unchanged):** Implementers share one Spec; zero parallel architecture.

**Delivered:** Spec v2.0 **Approved**; Epic 1 Exchange Scope Identity; Epic 2 Bot Facade; Epic 3 Tactical Envelope stub (inactive); Migration Plan closed. No ADR required. Frozen path unchanged.

**User Value:** The team stops debating naming and boundaries. Product language (Bot/Cluster) maps cleanly to what engineers build, so Version 2 work can start without rewrites.

**Estimated complexity:** **Medium** (docs Large-effort intellectually; code hooks Small–Medium)

**Main implementation risk:** Spec drift — writing new ideas instead of compiling approved artifacts.

**Depends on:** RC-18 closeout + Approved Freeze package.

**Next:** RC-20 — Ops readiness (Command Center foundation), after Closure Report approval.

---

## RC-20 — Ops readiness (Command Center foundation)

**Goal (unchanged):** Operator visibility/control on existing paper path (E19 themes).  
**Tasks (unchanged):** Kill Switch productization; recovery/status APIs; Command Center v1 over Session/Risk commands; non-authoritative ops dashboard widgets.  
**Result (unchanged):** Safe ops surface without new trading brain.

**User Value:** The user can see system health and stop/pause risky activity safely from one operations workspace — without opening many disconnected pages.

**Estimated complexity:** **Large**

**Main implementation risk:** UI becomes a false Source of Truth (Command Center mutating finance/lifecycle outside ports).

**Depends on:** RC-19 Spec; existing Session/Risk/Execution.

---

## RC-21 — Knowledge Lake (projection) — **sequencing override**

> **Approved sequencing (RC-21 Implementation Plan §0):** Knowledge Lake is delivered as **RC-21**.  
> Baseline roadmap below listed IDE as RC-21 and Lake as RC-23 — that baseline theme order is **superseded** for numbering only (not an architecture redesign).  
> **IDE shell + Bot fleet UX** is **deferred** to a later RC after Lake closeout.

**Goal:** Append-only analytical projection warehouse from research + trading events.  
**Result:** Single analytical feed foundation for later Reporting/AI — without a second ledger.  
**Status:** Implementation Epics 1–6 complete; **CLOSED** (validation PASS, tag `v1.0.0-rc21`).

See: [`rc-21-implementation-plan.md`](./rc-21-implementation-plan.md), [`rc-21-closure-report.md`](./rc-21-closure-report.md).

---

## RC-21 (baseline theme) — IDE shell + Bot fleet UX — **DEFERRED**

**Goal (unchanged):** Research IDE layout; Bot = Session in UX.  
**Tasks (unchanged):** Top/left/tabs/bottom/AI side shell; project explorer; jobs/logs bottom panel; Bot list/detail bound to Sessions; Exchange Scope views (even single Binance).  
**Result (unchanged):** UI matches V2 feeling; still one backend path.

**User Value:** Research IDE becomes the primary workspace. “Bots” appear as manageable workers, while the backend remains Trading Sessions.

**Estimated complexity:** **Large**

**Main implementation risk:** Accidental duplicated runtime if UI “Bot” spawns a new backend entity.

**Depends on:** RC-19 naming; RC-20 status APIs helpful but shell can start in parallel after Spec.

**Sequencing:** Deferred out of the RC-21 number; schedule after Knowledge Lake Validation.

---

## RC-22 — Strategy Library + Tactical Envelope

**Goal (unchanged):** Certified strategies with enforceable envelopes (Option B).  
**Tasks (unchanged):** Library certification records; envelope persistence; runtime reject out-of-envelope tactics; wire Deployment/Session.  
**Result (unchanged):** Validated Knowledge becomes enforceable.

**User Value:** Only proven strategies can be used in paper/live paths, and “tactics” changes stay inside previously validated limits — less self-deception and accidental strategy mutation.

**Estimated complexity:** **Large**

**Main implementation risk:** Envelope not enforced at runtime → Option B becomes documentation-only.

**Depends on:** Strategy Lab outputs; Spec tactics contract; Session/Deployment.

**Status:** Domain Epics 1–6 complete; **CLOSED** (validation PASS, tag `v1.0.0-rc22`).  
Library owns certified membership / envelope / eligibility / lifecycle at the domain layer. Nest application ports, durable persistence, and Orchestrator remain deferred (explicit RC-22 non-goals). Session/Deployment bind enforcement delivered as **RC-23**.

---

## RC-23 — Runtime Enforcement (vacated Lake integer)

**Goal:** Prove a Trading Session may deploy only Library-permitted strategies — without deciding _which_ strategy to run.  
**Tasks:** Enforcement boundary; Library read consumption; fail-closed Gate; Deployment bind + authorization stamp; Session start protection; authority conformance.  
**Result:** Runtime Enforcement is the sole validation Gate between Strategy Library SoT and Deployment/Session.

**User Value:** Operators can refuse uncertified / ineligible / out-of-envelope deployments deterministically before paper/live sessions start.

**Estimated complexity:** **Large**

**Main implementation risk:** Soft-fail / duplicate validation / Session calling Library directly — mitigated by fail-closed Gate + stamp-only Session start.

**Depends on:** RC-22 Strategy Library domain (**CLOSED**); existing Deployment / Session.

**Status:** Epics 1–6 complete; **CLOSED** (validation PASS, tag `v1.0.0-rc23`).  
Orchestrator / Market State / Selection / Enforcement REST remain deferred.

**Sequencing note:** Baseline roadmap listed Knowledge Lake as RC-23 (delivered early as **RC-21**). The vacated RC-23 integer is assigned to **Runtime Enforcement** per approved Implementation Plan §0.

---

## RC-23b — Knowledge Lake (projection) — **delivered early as RC-21**

**Goal (unchanged):** Append-only warehouse from research + trading events.  
**Tasks (unchanged):** Event projection pipeline from Outbox/SoT facts; retention/query API; explicitly non-SoT; migrate consumers off ad-hoc dual stacks where touched.  
**Result (unchanged):** Single analytical feed for Reporting/AI.

**User Value:** Historical trading and research knowledge becomes available in one place for analytics and AI explanations — without inventing a second ledger.

**Estimated complexity:** **Large**

**Main implementation risk:** Inconsistent Source of Truth if Lake is treated as financial authority.

**Sequencing note:** Delivered under the **RC-21** label per approved Implementation Plan §0. Historical Lake slot retained for roadmap history only — do not re-implement Lake here.

**Depends on:** Stable execution/accounting events (have); durability decision for Lake store.

---

## RC-24 — Reporting & AI Analytics

**Goal (unchanged):** Daily/weekly narratives + web reports; Telegram alerts later in same or next RC.  
**Tasks (unchanged):** Report jobs over Lake/projections; AI explain-only; Telegram for reports/alerts only.  
**Result (unchanged):** Ops/research reporting without control-plane Telegram.

**User Value:** Automatic daily and weekly reports (and later critical alerts) explain what happened — AI clarifies, it does not trade.

**Estimated complexity:** **Medium**

**Main implementation risk:** Reports recompute money independently of Ledger (shadow accounting).

**Depends on:** Knowledge Lake (RC-23); Command Center metrics helpful.

---

## RC-25 — Market Qualification + Market Profile

**Goal (unchanged):** Venue qualification pipeline + versioned profiles.  
**Tasks (unchanged):** User-triggered qualification runs; profile versions; confidence inputs only.  
**Result (unchanged):** Multi-exchange prep without forcing trades.

**User Value:** Before trusting a new exchange/market, the user gets a clear, versioned research profile of that venue’s behavior and data quality — and decides when to requalify.

**Estimated complexity:** **Medium**

**Main implementation risk:** Profiles silently force exchange/strategy choice instead of confidence-only inputs.

**Depends on:** Strategy Lab + data layer; Library metrics useful.

---

## RC-26 — Trading Orchestrator (thin) + Market State inputs

**Goal (unchanged):** Coordinate library + profiles + tactics selection into Session missions.  
**Tasks (unchanged):** Orchestrator service; optional Market State classifier MVP; never bypass Risk/Execution.  
**Result (unchanged):** Adaptive tactics inside envelopes; still no live strategy invention.

**User Value:** The platform can recommend/select how to apply an already certified strategy under current conditions — without inventing a new strategy while trading.

**Estimated complexity:** **XL**

**Main implementation risk:** God-module that bypasses Risk/Execution or invents tactics outside envelopes.

**Depends on:** RC-22 Library/Envelope; RC-25 Profiles strongly recommended; Risk/Session.

---

## RC-27 — Multi Exchange Scope expansion

**Goal (unchanged):** Second exchange scope (e.g. Bybit) as proof of isolation invariants.  
**Tasks (unchanged):** Adapter + scope policy + accounts; cross-scope isolation tests; qualification for new venue.  
**Result (unchanged):** Cluster model proven without engine clones.

**User Value:** The user can run isolated exchange workspaces (separate balances/bots/policies) without mixing funds or risk across venues.

**Estimated complexity:** **XL**

**Main implementation risk:** Cloning Risk/Ledger/Execution per exchange (breaks Freeze).

**Depends on:** Exchange Scope model (RC-19/20); Qualification/Profile (RC-25); isolation tests.

---

## RC-28 — V2 stabilization / Version 2 release candidate

**Goal (unchanged):** Harden, validate, document V2 as stable.  
**Tasks (unchanged):** Conformance tests for aliases/authority/tactics/isolation; UX polish; residual TD triage; V2 release notes.  
**Result (unchanged):** **Stable Version 2** (paper-first; live capital still future ADR unless separately approved).

**User Value:** Version 2 becomes a trustworthy daily platform: research → validated strategies → paper bots/ops/reporting under one consistent product language.

**Estimated complexity:** **Large**

**Main implementation risk:** Declaring V2 “done” while critical-path RCs are only partially enforced.

**Depends on:** RC-20…RC-27 critical path items (see Audit §9).

---

## Summary table

| RC             | Theme                            | Complexity | Biggest risk (one line)                   | Status                     |
| -------------- | -------------------------------- | ---------- | ----------------------------------------- | -------------------------- |
| 18 closeout    | US295 / docs sync                | Small      | Starting V2 before recovery claim closure | Open (US295)               |
| 19             | Spec v2.0 + thin hooks           | Medium     | Spec invents new architecture             | **COMPLETE**               |
| 20             | Command Center foundation        | Large      | UI as false SoT                           | **COMPLETE**               |
| 21             | Knowledge Lake (projection)      | Large      | Lake as SoT                               | **CLOSED** (`v1.0.0-rc21`) |
| 21b (deferred) | IDE + Bot UX                     | Large      | Duplicated runtime (Bot ≠ Session)        | Deferred                   |
| 22             | Library + Envelope               | Large      | Envelope not enforced                     | **CLOSED** (`v1.0.0-rc22`) |
| 23             | Runtime Enforcement (Gate)       | Large      | Soft-fail / duplicate validation          | **CLOSED** (`v1.0.0-rc23`) |
| 23b (history)  | Knowledge Lake (historical slot) | Large      | — (delivered as RC-21)                    | Superseded by RC-21        |
| 24             | Reporting / AI / Telegram        | Medium     | Shadow accounting in reports              | Planned                    |
| 25             | Qualification / Profile          | Medium     | Profiles force trades                     | Planned                    |
| 26             | Orchestrator                     | XL         | God-module / bypass                       | Planned                    |
| 27             | Multi-exchange scope             | XL         | Cloned engines                            | Planned                    |
| 28             | V2 stabilize                     | Large      | Fake “done” without conformance           | Planned                    |

Sequencing note: RC-21 Implementation Plan §0 advanced Knowledge Lake to RC-21 and deferred IDE. RC-23 Implementation Plan §0 assigned the vacated RC-23 integer to Runtime Enforcement. Goals unchanged; numbering override only.
