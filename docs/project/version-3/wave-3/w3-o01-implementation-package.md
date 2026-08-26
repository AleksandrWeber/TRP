# W3-O01 Durable Analytical Stores — Implementation Package

```text
Package:            W3-O01
Name:               Durable Analytical Stores
Also known as:      V3-O01 · IN-01 · TD-048 residual · durable-persistence-product
Wave:               3 — Durability, Operations & Continuity
Master Plan map:    V3-O01 Durable analytical stores (IN-01, TD-048).
                    Wave 3 exit: certified V2 analytical artifacts operators rely on
                    survive API restart (or honestly labeled ephemeral — default: survive).
Date:               2026-08-26
Status:             Implementation Package — Planning APPROVED. Implementation Readiness FINALIZED. Slices a–d APPROVED; e Close Evidence assembled. Package NOT declared CLOSED.
Nature:             Implementation package. Not an RC. Not an ADR. Not a Master Plan revision.
Canon:              version-3-master-plan.md
```

**Process:** [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md)
**Template:** [`../version-3-package-template.md`](../version-3-package-template.md)
**Annexes used (read-only):** [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md) · [`../v3-capability-inventory.md`](../v3-capability-inventory.md) · [`../v3-product-roadmap.md`](../v3-product-roadmap.md) · [`../v3-security-vision.md`](../v3-security-vision.md) · [`../v3-vision.md`](../v3-vision.md) · [`../../technical-debt.md`](../../technical-debt.md)
**Mandatory:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Constitution:** [`../security-default-policy.md`](../security-default-policy.md)
**Readiness:** [`implementation-readiness-checklist.md`](./implementation-readiness-checklist.md)

**Companions:**

| Document                                                                           | Role                                                  |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`w3-o01-product-scope.md`](./w3-o01-product-scope.md)                             | IN / OUT, ownership, honesty, acceptance              |
| [`w3-o01-security-review.md`](./w3-o01-security-review.md)                         | Threat model, integrity, Verification Standard intent |
| [`w3-o01-validation-plan.md`](./w3-o01-validation-plan.md)                         | How Close is proven                                   |
| [`durability-overview.md`](./durability-overview.md)                               | Operator / PO language product                        |
| [`wave-3-planning-summary.md`](./wave-3-planning-summary.md)                       | Wave Planning open record                             |
| [`wave-3-progress.md`](./wave-3-progress.md)                                       | Wave 3 package status                                 |
| [`implementation-readiness-checklist.md`](./implementation-readiness-checklist.md) | Implementation Readiness Checklist                    |

**Prerequisites:**

| Prerequisite                   | Status                                               |
| ------------------------------ | ---------------------------------------------------- |
| Version 2                      | **CERTIFIED**                                        |
| Wave 1 Security Foundation     | **CERTIFIED COMPLETE**                               |
| Wave 2 Connection Management   | **COMPLETE** (consumed; not redesigned)              |
| W2-S01…W2-S05                  | **CLOSED** (context; not redesigned)                 |
| V3-S01…V3-S06                  | **CLOSED** / available as consumed security products |
| Master Plan                    | **FROZEN** — this package does not revise it         |
| Security Verification Standard | **Approved** (mandatory)                             |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES (after Product Owner writes and authorizes an implementation task).** Wave 3 Planning is **APPROVED**. Implementation Readiness is **FINALIZED**. Master Plan and Execution Roadmap already name V3-O01 Durable analytical stores (IN-01 / TD-048). Architecture rule is persistence on existing aggregates — no second Lake or Outbox. **W3-O01 extends existing durability mechanisms only; it introduces no new persistence owner.** Wave 1 remains CERTIFIED COMPLETE. Wave 2 remains COMPLETE. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign. No architecture or ownership changes. Live Trading is not introduced. Monitoring product is not introduced (V3-O05). Kill Switch product is not introduced (V3-O04).

```text
Durable Analytical Stores consume existing Version 2 / Version 3 aggregates and Wave 1 security.
They do NOT redesign Reporting, Notification, Orchestrator, Lake, Outbox, Auth, Vault, or Connections.
They do NOT own secrets, identity, authz, workspace, audit persistence, monitoring, or Kill Switch.
They do NOT introduce a new persistence owner or bounded context.
They do NOT deliver Live Trading, Wave 4 venue I/O, or Wave 5 production transports.
Survive-restart does NOT mean production restart-safety Complete (needs O03 among other exits).
STOP — Do not create W3-O01-a until Product Owner writes the implementation task.
```

**Planning status:** **APPROVED.** Implementation Readiness **FINALIZED.** Slices a–d **APPROVED**; W3-O01-e Close Evidence **assembled**. Package **NOT declared CLOSED**.

**Naming clarity:** Operational package ID `W3-O01` maps 1:1 to Master Plan / Execution Roadmap package **V3-O01**. This planning does not invent a new Master Plan ID. Residual name `durable-persistence-product` is TD-048 debt vocabulary only — not a new SoT.

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Implementation Package   ← YOU ARE HERE (Planning APPROVED; Readiness FINALIZED)
        ↓
Review                   ← Planning Review complete
        ↓
Approval                 ← Planning Approved
        ↓
Implementation           ← only after PO writes / sequences a slice task
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

Do not skip a stage. Do not start production code before an authorized implementation task. Do not open W3-O02…O05 from this package alone. Do not claim Wave 3 exit. Do not claim Live Trading. Do not claim production restart-safety Complete. **This readiness refinement does not open implementation slices.**

---

## Overview

W3-O01 opens **Durable Analytical Stores**. It is the product package that closes the TD-048 residual: certified Version 2 analytical modules that were process-local (`persistence: false`) must either **survive API restart** for artifacts operators rely on, or be **honestly labeled ephemeral**. Default is survive.

It consumes Wave 1 security products, Closed Wave 2 products as context, and existing Version 2 analytical aggregates / persistence ports. It does not invent a second Knowledge Lake, a second Outbox, or a new bounded context. Reporting, Notification, Orchestrator, and related analytical owners remain owners of their domains; this package owns the **durability outcomes**.

---

## Durability Clarification (binding)

| Question                                           | Answer  |
| -------------------------------------------------- | ------- |
| Does W3-O01 extend existing durability mechanisms? | **YES** |
| Does W3-O01 introduce any new persistence owner?   | **NO**  |

**Binding:** Existing owners are **extended only**. W3-O01 does not introduce a new persistence owner, store, Event Store, Projection Store, Ledger, Knowledge Lake, Outbox, Inbox, or Canonical Order Path. Residual `durable-persistence-product` is technical-debt vocabulary for TD-048 — not authorization for a new SoT. Master Plan / Execution Roadmap already require persistence on existing aggregates.

---

| Field                           | Value                                             |
| ------------------------------- | ------------------------------------------------- |
| Package ID                      | W3-O01                                            |
| Master Plan / Execution Roadmap | **V3-O01** Durable analytical stores              |
| Product name                    | Durable Analytical Stores                         |
| Wave                            | 3 — Durability, Operations & Continuity           |
| Capabilities (inventory IDs)    | **IN-01**; debt **TD-048**                        |
| Complexity                      | M                                                 |
| Previous                        | Wave 2 COMPLETE                                   |
| Next after W3-O01 Close         | W3-O02 Notification Durable Queue (PO sequencing) |

---

## Business Goal

- **Goal:** After an API restart, operator-relied Version 2 analytical artifacts are not silently gone — or the product honestly says what does not survive (default: it survives).
- **Honesty:** **Survive-restart** means named analytical artifacts remain available after process restart. It does **not** mean Live Trading, Monitoring Complete, Kill Switch Complete, Notification production delivery, or Wave 3 COMPLETE.
- **Master Plan reference:** Wave 3 customer-observable — “After an API restart, my paper work and alerts I was owed are not silently gone (or the product honestly says what does not survive — default: it survives).” Execution Roadmap V3-O01 / exit criterion for analytical artifacts.
- **Metric this package must meet or not regress:** silent analytical loss **0** for in-scope survive surfaces; dishonest “still there” when gone **0**; cross-workspace leak **0**; secret echo **0**; Live Trading claim **0**. Production restart-safety Complete remains O03+. Live capital remains Wave 6.

---

## Customer Problem

- **Problem:** Several certified V2 analytical modules remain process-local. Restart can drop Reporting, Notification-related analytical artifacts, Orchestrator-related analytical artifacts, and related stores while identity / workspace / some paper sessions already persist — operators cannot trust production durability.
- **Who feels it:** Operators who lose relied-on analytical artifacts after deploy/restart; Product Owner who cannot advance production readiness / later live gates while TD-048 remains silent; later Wave 3 packages that need durable foundations without inventing parallel stores.
- **What they must do today that they should not:** Treat restart as an acceptable silent wipe of analytical work, SSH to reconstruct state, or assume “production restart-safe” without honesty.

---

## Business Value

- **Value delivered at W3-O01 Close (after implementation):** Operators can rely on named analytical artifacts surviving API restart (or see honest ephemeral labels). TD-048 residual for analytical stores is closed for package scope. Wave 3 can proceed to O02 without inventing a second Lake/Outbox.
- **What remains blocked until later packages / waves:** Notification durable queue (O02); US295/ADL-008 stance (O03); Durable Kill Switch product (O04); Monitoring & security health (O05); Wave 4 venue I/O; Wave 5 transports; Wave 6 live capital; Wave 3 COMPLETE.

---

## Current State

| Capability or surface                           | Status                    | Evidence                  |
| ----------------------------------------------- | ------------------------- | ------------------------- |
| Wave 1 security products                        | Already CLOSED            | Wave 1 CERTIFIED COMPLETE |
| Wave 2 Connections / Paper / AI Connectivity    | Already COMPLETE / CLOSED | Wave 2 COMPLETE           |
| Identity / workspace / paper session durability | Partially durable (V2)    | TD-048 note               |
| Process-local V2 analytical stores              | Residual                  | TD-048 / IN-01 25%        |
| Honest ephemeral labeling product               | Missing / incomplete      | This package              |
| Restart-survival proof for analytical artifacts | Missing as Wave 3 product | This package              |
| Notification durable queue                      | Out                       | V3-O02                    |
| Kill Switch durable product                     | Out                       | V3-O04                    |
| Monitoring product                              | Out                       | V3-O05                    |
| Live Trading                                    | Out                       | Wave 6                    |

Facts implementers must not forget:

- Wave 1 is CERTIFIED COMPLETE and must not be reopened.
- Wave 2 is COMPLETE and must not be redesigned.
- Persistence on **existing** aggregates only.
- No second Lake. No second Outbox.
- Default = survive; ephemeral only with honest product labeling.
- Fail closed; no fake success after restart.
- No Live Trading. No Gate/Risk bypass.
- No Monitoring Complete claim from O01.
- No production restart-safety Complete claim from O01 alone.
- No implementation slices in this planning open — Product Owner sequences slices only after Approval.

---

## Reuse from existing products

| Stance          | This package                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reuse unchanged | Authentication; Authorization; Workspace Isolation; Vault; Security Platform; Security Audit ownership; Closed Wave 2 products; Knowledge Lake as projection; existing Outbox/Inbox; Reporting / Notification / Orchestrator domain ownership |
| Minor extension | Persistence durability for process-local analytical stores on existing owners / ports                                                                                                                                                         |
| Major extension | Nothing. No new durability domain. No second Lake. No second Outbox.                                                                                                                                                                          |
| New justified   | Nothing. No new bounded context. Master Plan already named V3-O01 / IN-01.                                                                                                                                                                    |
| Replace         | **Nothing** on Canonical Order Path, Ledger, Runtime evaluator, Library, Wave 1, Wave 2 ownership                                                                                                                                             |

| Area                    | Owner               | This package must not own         |
| ----------------------- | ------------------- | --------------------------------- |
| Customer credentials    | Vault               | Ciphertext / encryption keys      |
| Identity / sessions     | Authentication      | Login, MFA, recovery              |
| Permissions             | Authorization       | Role matrix redesign              |
| Workspace membership    | Workspace           | Tenancy SoT                       |
| Hardening defaults      | Security Platform   | CSP / rate-limit product rewrite  |
| Audit persistence       | Security Audit      | Append-only store                 |
| Analytical domain logic | Existing V2 owners  | Domain rewrite as new product     |
| Live money / orders     | Ledger / Order Path | Live trading / exchange execution |
| Monitoring dashboards   | Wave 3 O05          | Health product                    |

---

## Dependencies

| Dependency                                | Kind               | Status required before this package  |
| ----------------------------------------- | ------------------ | ------------------------------------ |
| Wave 1 CERTIFIED COMPLETE                 | Prior wave         | **Required**                         |
| Wave 2 COMPLETE                           | Prior wave         | **Required**                         |
| Vault                                     | Earlier V3 package | Closed / available                   |
| Authentication                            | Earlier V3 package | Closed                               |
| Authorization                             | Earlier V3 package | Closed                               |
| Workspace Isolation                       | Earlier V3 package | Closed                               |
| Security Platform                         | Earlier V3 package | Closed                               |
| Security Audit                            | Earlier V3 package | Closed                               |
| Existing V2 analytical aggregates / ports | Version 2          | Available (consumed; not redesigned) |

This package does **not** depend on:

- V3-O02 Notification durable queue (sequenced after)
- V3-O03 US295 / ADL-008 (sequenced after)
- V3-O04 Durable Kill Switch product (sequenced after)
- V3-O05 Monitoring & security health (sequenced after)
- Wave 4 remaining venue trading outcomes
- Wave 5 production Telegram / SMTP delivery
- Wave 6 live trading ADR
- Billing, analytics dashboards, or Wave 9 SaaS admin

---

## Business Problem

Process-local analytical stores make production durability dishonest: restart can drop operator-relied artifacts without a product claim or honest ephemeral label, blocking Wave 3 continuity and later live gates.

## Business Goals

1. Survive-restart for operator-relied analytical artifacts (default).
2. Honest ephemeral labeling when survival is not delivered.
3. No silent loss presented as success.
4. No new Lake / Outbox / bounded context.
5. Preserve Wave 1 / Wave 2 / Version 2 ownership and architecture.

## Customer Journey

See [`durability-overview.md`](./durability-overview.md) — W3-O01 journey.

## Operator-visible functionality

- Relied-on analytical artifacts still present after API restart (in-scope survive surfaces)
- Or clear ephemeral honesty where labeled
- No SSH required to “recover” silently dropped in-scope artifacts
- No Live Trading / monitoring / Kill Switch claims from this package

---

## Implementation Scope

### IN Scope

| Item                       | Customer meaning                                              | Notes / owner inside existing domain   |
| -------------------------- | ------------------------------------------------------------- | -------------------------------------- |
| Analytical store inventory | Known process-local surfaces enumerated                       | Planning → implementation evidence     |
| Durable analytical stores  | Operator-relied artifacts survive restart                     | IN-01 / TD-048; existing aggregates    |
| Honest ephemeral labels    | Non-surviving surfaces labeled honestly                       | Exception path; default survive        |
| Restart-survival outcomes  | After API restart, artifacts remain or honesty applies        | Wave 3 customer-observable (O01 slice) |
| Workspace isolation        | A cannot see B’s analytical artifacts                         | Isolation consume                      |
| Authorization              | Unauthorized roles cannot access                              | Authz consume                          |
| Security boundaries        | Authn / Authz / Isolation / Vault / Audit / Platform consumed | Does not redefine                      |
| Audit interaction          | Durability-relevant outcomes attributable where required      | Emits to Security Audit                |
| Failure philosophy         | Fail closed; no fake success after restart                    | Security Default Policy                |
| Validation strategy        | Close criteria, evidence, regressions                         | This package + validation plan         |

### OUT OF Scope

| Item                                                           | Why out                                  | Owner later          |
| -------------------------------------------------------------- | ---------------------------------------- | -------------------- |
| Notification durable queue                                     | Separate package                         | V3-O02               |
| US295 / ADL-008 production restart-safety stance               | Separate package                         | V3-O03               |
| Durable Kill Switch product                                    | Separate package                         | V3-O04               |
| Monitoring & security health                                   | Separate package                         | V3-O05               |
| Second Knowledge Lake                                          | Forbidden                                | Never                |
| Second Outbox                                                  | Forbidden                                | Never                |
| Live Trading                                                   | Wave 6                                   | Wave 6 / Order Path  |
| Wave 4 venue I/O                                               | Later wave                               | Wave 4               |
| Wave 5 production notification transports                      | Later wave                               | Wave 5               |
| Connection Management redesign                                 | Already COMPLETE                         | Wave 2               |
| Vault / Auth / Authz / Isolation redesign                      | Wave 1 CLOSED                            | Forbidden            |
| Wave 1 / Wave 2 / Master Plan / Version 2 architecture changes | Frozen                                   | Forbidden            |
| Implementation slices                                          | Not opened in this planning task         | After Approval by PO |
| Wave 3 COMPLETE declaration                                    | Exit is Product Owner only after O01…O05 | Product Owner        |

Nothing in IN Scope may be invented. If a desired item is not already named in Master Plan / Execution Roadmap / inventory for V3-O01 / IN-01 / TD-048, **stop**.

---

## Product Acceptance Criteria

| #   | Outcome                                                                                          | Fail if                                    |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| 1   | In-scope operator-relied analytical artifacts survive API restart                                | Silent loss after restart                  |
| 2   | Any non-surviving in-scope surface is honestly labeled ephemeral                                 | Silent ephemeral wipe presented as durable |
| 3   | Product never claims “still present” when artifact is gone                                       | Fake success                               |
| 4   | Workspace A cannot access Workspace B analytical artifacts                                       | Cross-tenant leak                          |
| 5   | Unauthorized roles cannot access durability-managed analytical surfaces                          | Privilege bypass                           |
| 6   | Product never claims Live Trading, Monitoring Complete, Kill Switch Complete, or Wave 3 COMPLETE | Dishonest product claim                    |
| 7   | Secrets never shown, exported, or logged as plaintext                                            | Plaintext exposure                         |
| 8   | No second Lake or second Outbox introduced                                                       | Ownership / architecture drift             |

The customer never uses SSH, customer `.env` vendor secrets, local secret files, or manual database edits for these journeys.

Copy and complete [`../version-3-product-checklist.md`](../version-3-product-checklist.md) at Close.

---

## Product Walkthrough

**Required in Product Review. Repeat at Close.**

```text
Durable Analytical Stores Walkthrough

□ Sign in
□ Create or rely on in-scope analytical artifact(s) named in inventory
□ Confirm artifact visible / usable before restart
□ Restart API process
□ Confirm artifact still present (survive path)
   — or —
□ Confirm honest ephemeral labeling (exception path only)
□ Foreign workspace artifact — denied
□ Unauthorized role — denied
□ Confirm no Live Trading, Monitoring Complete, Kill Switch Complete, Wave 3 COMPLETE claims
□ Confirm no second Lake / Outbox

PASS / NOT APPLICABLE / REQUIRES ACTION
```

Overall verdict for this package (fill at Close):

| Field                   | Value                                 |
| ----------------------- | ------------------------------------- |
| Walkthrough name        | Durable Analytical Stores Walkthrough |
| Executed in the product | Yes (at Close)                        |
| Overall                 | PENDING APPROVAL                      |

---

## Architecture constraints

| Rule                                                           | Decision                                                                                                         |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| No new bounded context unless the Master Plan already named it | V3-O01 / Infrastructure durability already named; no new domain; **no new persistence owner**                    |
| No ownership drift                                             | Existing analytical owners / Vault / Auth / Authz / Workspace / Platform / Audit unchanged as owners             |
| No duplicate Source of Truth                                   | No second Lake; no second Outbox; no second Inbox; no second Reporting product; no second Event/Projection store |
| Persistence on existing aggregates                             | **Required** — extend existing durability mechanisms only                                                        |
| HTTP remains transport; UI remains not Source of Truth         | Yes                                                                                                              |
| Spec v2.0 / Authority Matrix / Alias Dictionary                | Unchanged                                                                                                        |
| No Version 2 architecture redesign                             | Binding                                                                                                          |
| No Master Plan modifications                                   | Binding                                                                                                          |

Forbidden: duplicate Lake/Outbox/Inbox/Event Store/Projection Store/Ledger/auth/vault; second Canonical Order Path; hidden redesign; Version 2-style RC track; reopening Wave 1 or Wave 2; claiming Live Trading; claiming Wave 3 COMPLETE from O01; silent ephemeral loss; inventing a persistence owner under residual name `durable-persistence-product`.

---

## Security constraints

| Rule                            | Decision                                     |
| ------------------------------- | -------------------------------------------- |
| Fail Closed                     | Missing auth / workspace / permission denies |
| Reuse Authentication            | Yes — no new identity owner                  |
| Reuse Authorization             | Yes — no new IAM                             |
| Reuse Workspace Isolation       | Yes — A↛B analytical artifacts               |
| Reuse Vault                     | Yes — no local secret store                  |
| Reuse Security Platform         | Yes — inherit hardening                      |
| Reuse Security Audit            | Emit only; do not own store                  |
| No new security ownership       | Binding                                      |
| No Live Trading from durability | Binding                                      |

See [`w3-o01-security-review.md`](./w3-o01-security-review.md).

---

## Validation strategy

See [`w3-o01-validation-plan.md`](./w3-o01-validation-plan.md).

Layers: unit · integration · UI · regression (Wave 1 + Wave 2) · product walkthrough · architecture · security Verification Standard · package acceptance.

Tests that mock “persisted” without proving restart survival do **not** count as Close evidence.

---

## Required implementation slices (planning — not to implement now)

### W3-O01-a — Analytical store inventory & honesty baseline

**Goal:** Enumerate process-local (`persistence: false`) analytical surfaces; classify survive vs honest ephemeral.
**Touch (expected):** Existing analytical modules / persistence ports only.
**Done when:** Inventory evidenced; honesty baseline documented for operators.
**Must not:** New Lake/Outbox; Live Trading; Monitoring product; open other Wave 3 packages.

### W3-O01-b — Durable persistence for priority analytical artifacts

**Goal:** Persist operator-relied analytical artifacts on existing owners / ports.
**Done when:** Priority survive surfaces write/read durable state within existing domains.
**Must not:** Redesign domain ownership; invent second SoT.

### W3-O01-c — Restart-survival proof & degraded honesty

**Goal:** Prove API restart does not silently drop in-scope artifacts; no fake success.
**Done when:** Restart walkthrough/tests PASS for survive surfaces; ephemeral path honest if any.
**Must not:** Claim O03 restart-safety Complete; claim O05 monitoring.

### W3-O01-d — Operational Continuity Foundation

**Goal:** Owner readiness, platform readiness projection, graceful degradation, Operational State Matrix, readiness API/UI.
**Done when:** Continuity foundation PASS; matrix authoritative; no BC/HA/Monitoring.
**Must not:** Expand into Monitoring / HA / DR / Incident Management.

### W3-O01-e — Package Validation, Operational Verification & Close Evidence

**Goal:** Validation / walkthrough / integrity / Close Evidence only.
**Done when:** Close Evidence assembled for Product Owner Package Review.
**Must not:** Declare W3-O01 CLOSED; start W3-O02; claim Wave 3 COMPLETE; add new customer functionality.

**Historical planning note:** Slice names above supersede earlier planning labels where they differed. Current stage: Close Evidence assembled; package NOT CLOSED.

---

## Out-of-scope declarations (binding)

- No Live Trading
- No Wave 4 / Wave 5 / Wave 6 / Wave 7 product delivery from this package
- No Monitoring Complete (O05)
- No Kill Switch product (O04)
- No Notification durable queue (O02)
- No US295 Complete claim (O03)
- No second Lake / second Outbox
- No Master Plan changes
- No Version 2 architecture changes
- No Wave 1 or Wave 2 modifications
- No ownership changes
- No W3-O01 CLOSED declaration without Product Owner Package Review
- No Wave 3 COMPLETE

---

## Mandatory Questions

1. **What business problem does Wave 3 solve?**
   Production durability and continuity: restarts must not silently destroy operator-relied artifacts; kill switch, monitoring/health, and recovery stance must exist so the product can be operated without SSH and without fake success when dependencies fail — before later live claims.

2. **Why can Wave 2 not solve this problem?**
   Wave 2 owned Connection Management. It deferred durability, monitoring, Kill Switch productization, and restart-safety claims to Wave 3. Connections do not make process-local analytical stores survive restart.

3. **Which existing products are consumed?**
   Authentication, Authorization, Workspace Isolation, Vault, Security Platform, Security Audit; Closed Wave 2 products; existing Version 2 analytical aggregates / Outbox / Inbox / Lake projection.

4. **What does Wave 3 own?**
   Durability, operations, and continuity **outcomes** for V3-O01…O05. W3-O01 owns durable analytical store **outcomes** (IN-01 / TD-048) by extending existing owners only — no new persistence owner.

5. **What is explicitly out of scope?**
   Live Trading; later waves’ products; O02–O05 delivery from this package; second Lake/Outbox; Master Plan / Version 2 / Wave 1 / Wave 2 modifications; ownership changes; implementation before Approval; Wave 3 COMPLETE from planning.

6. **Does this planning modify Wave 1?**
   No.

7. **Does this planning modify Wave 2?**
   No.

8. **Does this planning modify Version 2 architecture?**
   No.

---

## Planning verdict

Planning is **APPROVED**. Implementation Readiness is **FINALIZED** — see [`implementation-readiness-checklist.md`](./implementation-readiness-checklist.md).

Implementation must not begin until Product Owner writes and sequences an implementation task.

Implementation slices must not be opened from this readiness review.

Wave 3 COMPLETE must not be claimed.

Live Trading must not be claimed.

Master Plan remains unchanged.

No new persistence owner.

---

**STOP.** Wait for Product Owner review. Do not create W3-O01-a. Do not begin implementation.
