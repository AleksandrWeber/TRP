# W3-O04 Durable Kill Switch Product — Implementation Package

```text
Package:            W3-O04
Name:               Durable Kill Switch Product
Also known as:      V3-O04 · LT-03 · TD-047 residual · durable paper Kill Switch
Wave:               3 — Durability, Operations & Continuity
Master Plan map:    V3-O04 Durable Kill Switch product (LT-03, TD-047).
                    Wave 3 exit: Kill Switch is visible, durable, and blocks
                    evaluation/admission on paper; live uses the same control
                    in Wave 6.
Date:               2026-08-27
Status:             Implementation Package — Planning COMPLETE. Awaiting Product Owner Review and Approval.
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision. Not implementation.
Canon:              version-3-master-plan.md
```

**Process:** [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md)
**Template:** [`../version-3-package-template.md`](../version-3-package-template.md)
**Annexes used (read-only):** [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md) · [`../v3-capability-inventory.md`](../v3-capability-inventory.md) · [`../v3-product-roadmap.md`](../v3-product-roadmap.md) · [`../v3-security-vision.md`](../v3-security-vision.md) · [`../v3-vision.md`](../v3-vision.md) · [`../../technical-debt.md`](../../technical-debt.md)
**Mandatory:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Constitution:** [`../security-default-policy.md`](../security-default-policy.md)
**Prior package (closed):** [`w3-o03-package-summary.md`](./w3-o03-package-summary.md) · [`recovery-residual-overview.md`](./recovery-residual-overview.md) · [`durability-overview.md`](./durability-overview.md)

**Companions:**

| Document                                                               | Role                                                  |
| ---------------------------------------------------------------------- | ----------------------------------------------------- |
| [`w3-o04-product-scope.md`](./w3-o04-product-scope.md)                 | IN / OUT, ownership, honesty, acceptance              |
| [`w3-o04-security-review.md`](./w3-o04-security-review.md)             | Threat model, integrity, Verification Standard intent |
| [`w3-o04-validation-plan.md`](./w3-o04-validation-plan.md)             | How Close is proven                                   |
| [`durable-kill-switch-overview.md`](./durable-kill-switch-overview.md) | Operator / PO language product                        |
| [`w3-o04-planning-summary.md`](./w3-o04-planning-summary.md)           | Planning open record                                  |
| [`wave-3-progress.md`](./wave-3-progress.md)                           | Wave 3 package status                                 |
| [`durability-overview.md`](./durability-overview.md)                   | Wave 3 durability operator language                   |

**Prerequisites:**

| Prerequisite                           | Status                                               |
| -------------------------------------- | ---------------------------------------------------- |
| Version 2                              | **CERTIFIED**                                        |
| Wave 1 Security Foundation             | **CERTIFIED COMPLETE**                               |
| Wave 2 Connection Management           | **COMPLETE** (consumed; not redesigned)              |
| W3-O01 Durable Analytical Stores       | **CLOSED** by Product Owner                          |
| W3-O02 Notification Durable Queue      | **CLOSED** by Product Owner                          |
| W3-O03 Recovery Residual               | **CLOSED** by Product Owner (required predecessor)   |
| Existing Kill Switch REST              | Exists (live-only, hidden from paper product)        |
| Runtime admission `kill_switch_active` | Exists (domain hooks)                                |
| V3-S01…V3-S06                          | **CLOSED** / available as consumed security products |
| Master Plan                            | **FROZEN** — this package does not revise it         |
| Security Verification Standard         | **Approved** (mandatory)                             |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES (after Product Owner Approval of this package and an authorized implementation task).** Wave 3 Planning is already **APPROVED**. Master Plan and Execution Roadmap already name **V3-O04 Durable Kill Switch product** (LT-03 / TD-047). Architecture rule is persistence and operations on **existing** aggregates — no second Lake or Outbox. W3-O04 productizes Kill Switch on the existing **Session / Command Center** ownership named in the Master Plan; it introduces no new persistence owner, no second Kill Switch engine, and no second runtime controller. Wave 1 remains CERTIFIED COMPLETE. Wave 2 remains COMPLETE. W3-O01, W3-O02, and W3-O03 remain CLOSED. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign. No architecture or ownership changes. Live Trading is not introduced (Wave 6 reuses the same control). Monitoring product is not introduced (V3-O05).

```text
Durable Kill Switch Product consumes Wave 1 security, Closed Wave 2,
Closed W3-O01 / W3-O02 / W3-O03 context, existing Kill Switch REST,
Runtime admission kill_switch_active, and Session / Command Center ownership.
It does NOT redesign Risk Engine, Runtime evaluator, or Canonical Order Path.
It does NOT own secrets, identity, authz, workspace, audit persistence,
monitoring, or Live Trading capital control.
It does NOT introduce a new persistence owner, second Kill Switch engine,
second runtime controller, or bounded context.
It does NOT deliver Live Trading, Wave 4 venue I/O, or Wave 5 transports.
Kill Switch Complete does NOT mean Monitoring Complete (O05).
Kill Switch Complete does NOT mean Wave 3 COMPLETE.
Kill Switch Complete does NOT mean Live Trading enabled (Wave 6).
STOP — Do not create W3-O04-a until Product Owner Approves planning and writes the implementation task.
```

**Planning status:** **COMPLETE for review.** Product Owner must review and Approve before any implementation. **STOP** until Approval. No implementation slices opened.

**Naming clarity:** Operational package ID `W3-O04` maps 1:1 to Master Plan / Execution Roadmap package **V3-O04**. This planning does not invent a new Master Plan ID. Residual name `Durable paper Kill Switch` is TD-047 debt vocabulary only — not a new SoT and not authorization to invent a second Kill Switch domain.

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Implementation Package   ← YOU ARE HERE (awaiting PO review)
        ↓
Review
        ↓
Approval                 ← required before code / governance close work
        ↓
Implementation           ← after Approval only; slices sequenced later by PO
        ↓
Implementation Report
        ↓
Architecture Review
        ↓
Security Review
        ↓
Product Review
        ↓
Validation
        ↓
Close
```

Do not skip a stage. Do not start production code before Approval. Do not open W3-O04-a…e from this planning open. Do not open W3-O05 from this package alone. Do not claim Wave 3 exit. Do not claim Live Trading. Do not claim Monitoring Complete. **This planning package does not open implementation slices.**

---

## Master Plan Alignment

| Source                              | Reference                                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Master Plan capability**          | **V3-O04** Durable Kill Switch product — Execution Roadmap Wave 3 package table                                                                                                 |
| **Capability inventory**            | **LT-03** Durable Kill Switch (Purpose: operator halt that survives restart and blocks evaluation/orders; Business value: capital preservation overrides profit)                |
| **Technical debt**                  | **TD-047** Durable paper Kill Switch — REST is live-only; paper product hides the control; pause/resume/stop remain                                                             |
| **Execution Roadmap outcome**       | Wave 3 exit: “Kill Switch is visible, durable, and blocks evaluation/admission on paper; live uses the same control in Wave 6.” After runtime restart, Kill Switch still armed. |
| **Master Plan customer-observable** | Wave 3: “I can arm a Kill Switch and see that sessions stop.” Wave 6: “Kill Switch stops live orders.”                                                                          |
| **Master Plan owner table**         | Kill Switch → Session/Command Center product (V3-O04); must not own Telegram                                                                                                    |
| **Master Plan continuity note**     | Runtime restart → Kill Switch still armed; sessions recover or stay safely stopped                                                                                              |
| **Master Plan risk**                | Capital preservation; no silent loss of armed halt state on restart                                                                                                             |

This package implements **only** V3-O04 / LT-03 / TD-047. It does not invent functionality outside the approved Master Plan.

---

## Overview

W3-O04 opens **Durable Kill Switch Product**. It is the product package that closes the TD-047 residual: operators can **arm** a Kill Switch from the paper product, **see** that sessions stop, and **trust** that the armed state survives API restart and blocks evaluation/admission on paper.

It is **not** W3-O01, W3-O02, or W3-O03. Those closed analytical-store survival, notification queue durability, and recovery-claim stance honesty respectively. W3-O04 closes **operational safety productization** for Kill Switch on paper.

It is **not** a Monitoring Platform, Incident Management product, Business Continuity product, High Availability product, Disaster Recovery product, Workflow Engine, Scheduler, Retry Engine, Notification Platform, AI Platform, Risk Engine redesign, Live Trading controller, or infrastructure orchestrator.

It is **not** a redesign of Risk Engine safety decisions, Runtime evaluator, Canonical Order Path, or Live Trading orchestration. Domain hooks (`kill_switch_active`, hidden live-only REST, emergency-manager lineage) already exist. W3-O04 makes the control **visible**, **durable**, and **honest** on paper under existing Session / Command Center ownership.

It consumes Wave 1 security products, Closed Wave 2 products as context, Closed W3-O01 / W3-O02 / W3-O03 as predecessor context, and existing Session / Command Center / Trading Session / Runtime admission ownership. It does not invent a second Kill Switch engine, a second runtime controller, or a new bounded context.

---

## Kill Switch Clarification (binding)

| Question                                                    | Answer  |
| ----------------------------------------------------------- | ------- |
| Does W3-O04 invent a second Kill Switch engine?             | **NO**  |
| Does W3-O04 introduce any new persistence owner?            | **NO**  |
| Does W3-O04 create a second runtime controller?             | **NO**  |
| Does W3-O04 redesign Risk Engine safety semantics?          | **NO**  |
| Must armed Kill Switch survive API restart on paper?        | **YES** |
| Must armed Kill Switch block evaluation/admission on paper? | **YES** |
| Does Kill Switch Complete mean Live Trading enabled?        | **NO**  |

**Binding:** Existing **Session / Command Center** and **Trading Session** owners remain owners. W3-O04 does not introduce a new persistence owner, Event Store, Projection Store, Ledger, Knowledge Lake, Outbox, Inbox, or Canonical Order Path. Residual TD-047 vocabulary is not authorization for a second Kill Switch domain or a second operational authority.

---

| Field                           | Value                                               |
| ------------------------------- | --------------------------------------------------- |
| Package ID                      | W3-O04                                              |
| Master Plan / Execution Roadmap | **V3-O04** Durable Kill Switch product              |
| Product name                    | Durable Kill Switch Product                         |
| Wave                            | 3 — Durability, Operations & Continuity             |
| Capabilities (inventory IDs)    | **LT-03**; debt **TD-047**                          |
| Complexity                      | M (productization on existing domain hooks)         |
| Previous                        | W3-O03 CLOSED                                       |
| Next after W3-O04 Close         | W3-O05 Monitoring & Security Health (PO sequencing) |

---

## Business Goal

- **Goal:** Operators can arm a Kill Switch from the paper product, see that sessions stop, and trust that the armed state survives restart and blocks evaluation/admission — without SSH, hidden live-only REST, or silent loss of halt state.
- **Honesty:** **Kill Switch Complete** means visible, durable, restart-surviving halt control on paper that blocks evaluation/admission. It does **not** mean Live Trading, Monitoring Complete, Business Continuity, High Availability, Disaster Recovery, Wave 3 COMPLETE, or a second operational platform.
- **Master Plan reference:** Wave 3 customer-observable Kill Switch; Execution Roadmap V3-O04 / LT-03 / TD-047; Master Plan owner Session/Command Center (V3-O04).
- **Metric this package must meet or not regress:** silent loss of armed Kill Switch on restart **0**; hidden-only Kill Switch on paper **0**; evaluation/admission bypass while armed **0**; cross-workspace leak **0**; secret echo **0**; Live Trading claim **0**; second Kill Switch SoT **0**; second runtime controller **0**. Monitoring remains O05. Live capital remains Wave 6.

---

## Customer Problem

- **Problem:** Durable Kill Switch REST exists but is live-only and hidden from the paper product (TD-047). Operators on paper cannot visibly arm a Kill Switch, cannot see sessions stop through the product, and cannot trust that halt state survives restart. Pause / resume / stop remain but do not substitute for a durable, visible emergency halt product.
- **Who feels it:** Operators who need an immediate, attributable halt without live-trading surfaces; Product Owner who cannot close Wave 3 Kill Switch exit criterion; Architecture owners who need honest operational safety before Monitoring (O05) and before Wave 6 live capital reuses the same control.
- **What they must do today that they should not:** Rely on hidden live-only REST; assume pause/stop equals durable Kill Switch; treat restart as clearing an armed halt silently; or invent parallel halt mechanisms outside Session / Command Center ownership.

---

## Business Value

- **Value delivered at W3-O04 Close (after implementation):** Kill Switch is visible, durable, and blocks evaluation/admission on paper; armed state survives API restart; TD-047 residual closed for package scope. Wave 3 can proceed to O05; Wave 6 can later reuse the same control for live capital.
- **What remains blocked until later packages / waves:** Monitoring & security health (O05); Wave 4 venue I/O; Wave 5 production transports; Wave 6 live capital and live-order halt proof; Wave 3 COMPLETE; Business Continuity / High Availability as products.

---

## Current State

| Capability or surface                        | Status                         | Evidence                       |
| -------------------------------------------- | ------------------------------ | ------------------------------ |
| Wave 1 security products                     | Already CLOSED                 | Wave 1 CERTIFIED COMPLETE      |
| Wave 2 Connections / Paper / AI Connectivity | Already COMPLETE / CLOSED      | Wave 2 COMPLETE                |
| W3-O01 / W3-O02 / W3-O03                     | CLOSED                         | Package summaries              |
| Kill Switch domain hooks                     | Exist                          | `kill_switch_active` admission |
| Kill Switch REST                             | Exists — live-only, hidden     | TD-047                         |
| Durable paper Kill Switch product (LT-03)    | Missing / hidden               | TD-047 / LT-03 ~25%            |
| Command Center Kill Switch presentation      | Partial / not durable on paper | Master Plan minor extension    |
| Monitoring product                           | Out                            | V3-O05                         |
| Live Trading                                 | Out                            | Wave 6                         |

Facts implementers must not forget:

- Wave 1 is CERTIFIED COMPLETE and must not be reopened.
- Wave 2 is COMPLETE and must not be redesigned.
- W3-O01, W3-O02, and W3-O03 are CLOSED and must not be reopened or redesigned.
- Persistence on **existing** Session / Command Center aggregates only.
- No second Lake. No second Outbox. No second Kill Switch engine.
- Risk Engine remains owner of risk **decisions**; this package does not redesign Risk Engine.
- Fail closed; no fake “cleared” or “inactive” while armed state persists.
- Telegram must not become Kill Switch owner (Master Plan).

---

## Scope IN

| Area                                     | Planning intent                                        |
| ---------------------------------------- | ------------------------------------------------------ |
| Visible Kill Switch arm / clear on paper | Operator can arm and see sessions stop                 |
| Durable armed state                      | Survives API restart on paper                          |
| Blocks evaluation/admission on paper     | `kill_switch_active` enforced for paper paths          |
| Workspace-scoped product surfaces        | A↛B; authorized roles only                             |
| Attributable arm / clear outcomes        | Emit to Security Audit where required                  |
| Command Center / Session product pattern | Product facade over existing owners — not a new engine |
| Honest product claims                    | Kill Switch Complete for O04 scope only                |
| Operator walkthrough                     | Durable Kill Switch Walkthrough at Close               |
| TD-047 residual close                    | Durable paper Kill Switch no longer hidden-only        |

---

## Scope OUT

| Area                                   | Owner / later package           |
| -------------------------------------- | ------------------------------- |
| Monitoring Platform                    | V3-O05                          |
| Incident Management product            | Out — not a platform            |
| Business Continuity product            | Out                             |
| High Availability product              | Out                             |
| Disaster Recovery product              | Out                             |
| Workflow Engine                        | Out                             |
| Scheduler product                      | Out                             |
| Retry Engine product                   | Out                             |
| Notification Platform                  | Wave 5                          |
| AI Platform                            | Wave 7                          |
| Risk Engine redesign                   | Existing Risk Engine owner      |
| Live Trading controller / live capital | Wave 6                          |
| Infrastructure orchestrator            | Out                             |
| Telegram as Kill Switch owner          | Forbidden (Master Plan)         |
| Second Kill Switch engine              | Forbidden                       |
| Second runtime controller              | Forbidden                       |
| US290–US294 recovery redesign          | Closed substrate — not reopened |
| W3-O01 / W3-O02 / W3-O03 redesign      | Forbidden                       |
| Wave 1 / Wave 2 modification           | Forbidden                       |
| Master Plan / Version 2 changes        | Forbidden                       |
| Ownership changes                      | Forbidden                       |
| Implementation slices in this open     | Forbidden                       |
| Wave 3 COMPLETE from planning          | Forbidden                       |

---

## Consumes

| Product / package             | How this package uses it                                   | Must not do                                   |
| ----------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| **Authentication**            | Only signed-in operators access Kill Switch surfaces       | Parallel login                                |
| **Authorization**             | Only permitted roles arm / clear                           | New IAM                                       |
| **Workspace Isolation**       | Kill Switch state stays in one workspace                   | Cross-workspace convenience                   |
| **Vault**                     | No local secret store                                      | Duplicate store; echo plaintext               |
| **Security Platform**         | Hardening and abuse/rate-limit defaults                    | Fork platform controls                        |
| **Security Audit**            | Attributable arm / clear outcomes                          | Own the audit store                           |
| **Trading Session**           | Session stop / halt semantics                              | Redesign lifecycle owner                      |
| **Session / Command Center**  | Product facade and existing Kill Switch ownership          | Invent second Command Center domain           |
| **Runtime admission**         | Existing `kill_switch_active` gate                         | Bypass Gate/Risk/Kill Switch chain            |
| **Existing Kill Switch REST** | Live-only lineage as implementation input — not duplicated | Second REST product with competing SoT        |
| **Risk Engine**               | Safety decision context — consumed, not redesigned         | Become Risk Engine or second risk SoT         |
| **W3-O01 CLOSED outcomes**    | Durability context; not redesigned                         | Reopen O01                                    |
| **W3-O02 CLOSED outcomes**    | Queue durability context; not redesigned                   | Reopen O02                                    |
| **W3-O03 CLOSED outcomes**    | Recovery claim honesty context; not redesigned             | Reopen O03; claim restart-safe from O04 alone |
| **Wave 2 CLOSED products**    | Connections context; not redesigned                        | Reopen Connections ownership                  |

---

## Owns

| Outcome                                           | Customer meaning                                            |
| ------------------------------------------------- | ----------------------------------------------------------- |
| **LT-03 / TD-047 product outcomes**               | Visible, durable Kill Switch on paper                       |
| **Arm / clear operator product**                  | Operator arms halt; sessions stop; clear is explicit        |
| **Restart-surviving armed state**                 | Armed Kill Switch still active after API restart            |
| **Evaluation/admission block on paper**           | Armed state blocks paper evaluation/admission               |
| **Workspace-scoped Kill Switch surfaces**         | Foreign workspace denied                                    |
| **Attributable halt outcomes**                    | Emit to Security Audit where required                       |
| **Honest Kill Switch Complete claim (O04 scope)** | Does not imply Monitoring, Live Trading, or Wave 3 COMPLETE |

**Does not own persistence as a new product.** Existing Session / Command Center / Trading Session owners remain owners.

---

## Does NOT Own

| Concern                                  | Real owner                           |
| ---------------------------------------- | ------------------------------------ |
| Secret ciphertext / encryption           | Vault                                |
| Identity / sessions                      | Authentication                       |
| Permissions                              | Authorization                        |
| Workspace membership / isolation SoT     | Workspace / Isolation                |
| Security Platform defaults               | Security Platform                    |
| Audit persistence                        | Security Audit                       |
| Risk decisions                           | Risk Engine                          |
| Runtime evaluator / Canonical Order Path | Existing runtime owners              |
| Recovery algorithm / US290–US294         | Trading Session / Runtime Recovery   |
| Monitoring / health dashboard            | V3-O05                               |
| Live capital / live order path           | Wave 6                               |
| Notification delivery                    | Notification Delivery                |
| Telegram                                 | Notification — not Kill Switch owner |

---

## Architecture constraints

| Rule                                                           | Decision                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| No new bounded context unless the Master Plan already named it | V3-O04 / LT-03 already named; Session/Command Center owner already named; **no new persistence owner**                      |
| No ownership drift                                             | Session / Command Center / Trading Session / Risk / Vault / Auth / Authz / Workspace / Platform / Audit unchanged as owners |
| No duplicate Source of Truth                                   | No second Lake; no second Outbox; no second Kill Switch engine                                                              |
| Persistence on existing aggregates                             | **Required** — Kill Switch state on existing Session / Command Center ownership only                                        |
| HTTP remains transport; UI remains not Source of Truth         | Yes                                                                                                                         |
| Product facade pattern                                         | Command Center pattern over existing owners — not a second runtime                                                          |
| Spec v2.0 / Authority Matrix / Alias Dictionary                | Unchanged                                                                                                                   |
| No Version 2 architecture redesign                             | Binding                                                                                                                     |
| No Master Plan modifications                                   | Binding                                                                                                                     |

**Architecture Review (planning verification):**

| Check                           | Result |
| ------------------------------- | ------ |
| No ownership changes            | PASS   |
| No new bounded contexts         | PASS   |
| No new Source of Truth          | PASS   |
| No duplicate persistence owner  | PASS   |
| No duplicate operational owner  | PASS   |
| No duplicate Kill Switch owner  | PASS   |
| No duplicate runtime controller | PASS   |
| No duplicate monitoring owner   | PASS   |
| No Version 2 redesign           | PASS   |
| No Master Plan revision         | PASS   |

Forbidden: duplicate Lake/Outbox/Inbox/Event Store/Projection Store/Ledger/auth/vault; second Canonical Order Path; second Kill Switch engine; second runtime controller; hidden Monitoring/BC/HA/DR/Live Trading/AI Platform; reopening Wave 1, Wave 2, W3-O01, W3-O02, or W3-O03; claiming Live Trading; claiming Wave 3 COMPLETE from O04; claiming Monitoring Complete from O04.

---

## Security constraints

| Rule                       | Decision                                     |
| -------------------------- | -------------------------------------------- |
| Fail Closed                | Missing auth / workspace / permission denies |
| Reuse Authentication       | Yes — no new identity owner                  |
| Reuse Authorization        | Yes — no new IAM                             |
| Reuse Workspace Isolation  | Yes — A↛B Kill Switch surfaces               |
| Reuse Vault                | Yes — no local secret store                  |
| Reuse Security Platform    | Yes — inherit hardening                      |
| Reuse Security Audit       | Emit only; do not own store                  |
| No new security ownership  | Binding                                      |
| No Live Trading from O04   | Binding                                      |
| Arm / clear requires authz | Binding                                      |

See [`w3-o04-security-review.md`](./w3-o04-security-review.md).

---

## Operational constraints

| Rule                                     | Decision                                  |
| ---------------------------------------- | ----------------------------------------- |
| Operator walkthrough required at Close   | Durable Kill Switch Walkthrough           |
| No SSH required to arm Kill Switch       | Binding for in-scope product              |
| Armed state must survive restart         | Binding                                   |
| Sessions must stop when armed            | Binding on paper                          |
| Monitoring product not claimed           | O05 owns monitoring productization        |
| Live Trading not claimed                 | Wave 6 reuses control; not enabled by O04 |
| Pause/resume/stop ≠ Kill Switch Complete | Honesty binding                           |

---

## Validation strategy

See [`w3-o04-validation-plan.md`](./w3-o04-validation-plan.md).

Layers: unit · integration · UI · regression (Wave 1 + Wave 2 + W3-O01 + W3-O02 + W3-O03) · product walkthrough · architecture · security Verification Standard · package acceptance.

Tests that mock “armed” without proving restart survival / admission block / session stop do **not** count as Close evidence.

---

## Required implementation slices (planning — not to implement now)

### W3-O04-a — Kill Switch inventory & honesty baseline

**Goal:** Enumerate existing Kill Switch surfaces (hidden REST, admission hooks, Command Center gaps); classify IN vs OUT (O05, Live Trading, BC/HA); document TD-047 / LT-03 baseline.
**Touch (expected):** Existing Session / Command Center / Runtime surfaces only.
**Done when:** Inventory evidenced; honesty baseline documented (pause/stop ≠ Kill Switch Complete; hidden-only ≠ Complete).
**Must not:** Invent second Kill Switch engine; Live Trading; open other Wave 3 packages; open W3-O04-b.

### W3-O04-b — Durable Kill Switch persistence on existing owner

**Goal:** Armed / cleared state persists on existing Session / Command Center aggregates; no new persistence owner.
**Done when:** Persistence evidenced on existing owner only.
**Must not:** Second SoT; second Outbox; redesign Risk Engine.

### W3-O04-c — Paper product visibility & Command Center integration

**Goal:** Operator-visible arm / clear on paper; sessions stop; attributable reason capture as required by existing ports.
**Done when:** Visible product surfaces evidenced; unauthorized / cross-workspace deny.
**Must not:** Live Trading UI; Monitoring dashboard; Telegram ownership.

### W3-O04-d — Restart survival & admission block proof

**Goal:** Armed state survives API restart; evaluation/admission blocked on paper while armed; sessions stay safely stopped.
**Done when:** Restart proof and admission block evidenced.
**Must not:** Claim BC/HA/DR; expand into recovery redesign.

### W3-O04-e — Package Validation, Operational Verification & Close Evidence

**Goal:** Roll up slices a–d; Durable Kill Switch Walkthrough; Close Evidence; honesty checks (not Wave 3 COMPLETE; not Monitoring; not Live Trading).
**Done when:** Close checklist PASS; Product Owner Package Review.
**Must not:** Declare W3-O04 CLOSED without PO; start W3-O05; claim Wave 3 COMPLETE.

---

## Explicit Non-Claims

| Claim                            | Status for W3-O04 planning           |
| -------------------------------- | ------------------------------------ |
| Wave 3 COMPLETE                  | **Not claimed**                      |
| Monitoring Complete              | **Not claimed** (O05)                |
| Live Trading enabled             | **Not claimed** (Wave 6)             |
| Business Continuity product      | **Not claimed**                      |
| High Availability product        | **Not claimed**                      |
| Disaster Recovery product        | **Not claimed**                      |
| Production restart-safe Complete | **Not claimed** from O04 alone       |
| Risk Engine Complete             | **Not claimed**                      |
| AI Platform                      | **Not claimed**                      |
| Package APPROVED                 | **Not claimed** — awaiting PO review |
| Implementation authorized        | **Not claimed**                      |
| W3-O04-a opened                  | **Not claimed**                      |

---

## Out-of-scope declarations (binding)

- No Live Trading
- No Wave 4 / Wave 5 / Wave 6 / Wave 7 product delivery from this package
- No Monitoring Complete (O05)
- No Business Continuity / High Availability / Disaster Recovery product claims
- No Monitoring Platform / Incident Management platform
- No Workflow Engine / Scheduler / Retry Engine / Notification Platform / AI Platform
- No Risk Engine redesign
- No second Kill Switch engine / second runtime controller
- No second Lake / second Outbox
- No Master Plan changes
- No Version 2 architecture changes
- No Wave 1 or Wave 2 modifications
- No W3-O01 / W3-O02 / W3-O03 redesign
- No ownership changes
- No W3-O04-a…e opened by this planning task
- No W3-O04 CLOSED declaration without Product Owner Package Review
- No Wave 3 COMPLETE

---

## Mandatory Questions

1. **What business problem does W3-O04 solve?**
   Kill Switch control is live-only and hidden from the paper product (TD-047). Operators cannot visibly arm a durable halt, see sessions stop, or trust armed state survives restart and blocks evaluation/admission on paper.

2. **Why is W3-O04 sequenced after W3-O03?**
   Master Plan / Execution Roadmap order is binding: **O01 → O02 → O03 → O04 → O05**. W3-O03 closed recovery-claim stance honesty. Durability foundations (stores, queue, recovery stance) precede operational safety productization (Kill Switch) and Monitoring (O05).

3. **Which existing packages does W3-O04 consume?**
   Authentication, Authorization, Workspace Isolation, Vault, Security Platform, Security Audit; Closed Wave 2; Closed W3-O01; Closed W3-O02; Closed W3-O03; existing Session / Command Center / Trading Session ownership; existing Kill Switch REST lineage; Runtime admission `kill_switch_active`; Risk Engine context (not redesigned).

4. **What does W3-O04 own?**
   LT-03 / TD-047 **Durable Kill Switch product outcomes** on existing Session / Command Center ownership: visible arm/clear on paper, restart-surviving armed state, evaluation/admission block on paper, workspace-scoped surfaces, attributable halt outcomes, honest Kill Switch Complete claim for O04 scope only.

5. **What is explicitly OUT of scope?**
   Monitoring (O05); Live Trading (Wave 6); BC/HA/DR products; Monitoring Platform; Incident Management; Workflow Engine; Scheduler; Retry Engine; Notification Platform; AI Platform; Risk Engine redesign; second Kill Switch engine; second runtime controller; Master Plan / Version 2 / Wave 1 / Wave 2 / W3-O01 / W3-O02 / W3-O03 modifications; ownership changes; implementation slices in this open; Wave 3 COMPLETE from planning.

6. **Does W3-O04 modify Version 2?**
   No.

7. **Does W3-O04 modify Wave 1, Wave 2, or completed Wave 3 packages?**
   No.

8. **Does W3-O04 introduce new ownership?**
   No. Master Plan already names Session/Command Center (V3-O04) as Kill Switch owner. This package productizes on that existing ownership only.

9. **Does W3-O04 introduce a new bounded context?**
   No.

10. **Does W3-O04 introduce a new Source of Truth?**
    No.

---

## Implementation Readiness

| Question                                             | Answer                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| Can implementation begin without modifying planning? | **YES** — after Product Owner Approval and an authorized slice task |
| If NO, stop reason                                   | N/A                                                                 |

Planning is implementation-ready: Master Plan ID, capability, debt, exit criterion, ownership, IN/OUT, slices a–e, security, and validation are frozen in this package set. **STOP** until Product Owner Approves. Do not open W3-O04-a.

---

**STOP.** Wait for Product Owner Planning Review before approving W3-O04 implementation. Do not create W3-O04-a. Do not claim Wave 3 COMPLETE.
