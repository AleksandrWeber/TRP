# W3-O02 Notification Durable Queue — Implementation Package

```text
Package:            W3-O02
Name:               Notification Durable Queue
Also known as:      V3-O02 · NT-02 · TD-045 residual · durable notification delivery queue
Wave:               3 — Durability, Operations & Continuity
Master Plan map:    V3-O02 Notification durable queue (NT-02, TD-045).
                    Wave 3 exit: in-flight notification delivery is not lost
                    on process restart.
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
**Prior package (closed):** [`w3-o01-package-summary.md`](./w3-o01-package-summary.md) · [`durability-overview.md`](./durability-overview.md)

**Companions:**

| Document                                                                             | Role                                                  |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| [`w3-o02-product-scope.md`](./w3-o02-product-scope.md)                               | IN / OUT, ownership, honesty, acceptance              |
| [`w3-o02-security-review.md`](./w3-o02-security-review.md)                           | Threat model, integrity, Verification Standard intent |
| [`w3-o02-validation-plan.md`](./w3-o02-validation-plan.md)                           | How Close is proven                                   |
| [`notification-durable-queue-overview.md`](./notification-durable-queue-overview.md) | Operator / PO language product                        |
| [`w3-o02-planning-summary.md`](./w3-o02-planning-summary.md)                         | Planning open record                                  |
| [`wave-3-progress.md`](./wave-3-progress.md)                                         | Wave 3 package status                                 |
| [`durability-overview.md`](./durability-overview.md)                                 | Wave 3 durability operator language                   |

**Prerequisites:**

| Prerequisite                     | Status                                               |
| -------------------------------- | ---------------------------------------------------- |
| Version 2                        | **CERTIFIED**                                        |
| Wave 1 Security Foundation       | **CERTIFIED COMPLETE**                               |
| Wave 2 Connection Management     | **COMPLETE** (consumed; not redesigned)              |
| W3-O01 Durable Analytical Stores | **CLOSED** by Product Owner (required predecessor)   |
| V3-S01…V3-S06                    | **CLOSED** / available as consumed security products |
| Master Plan                      | **FROZEN** — this package does not revise it         |
| Security Verification Standard   | **Approved** (mandatory)                             |

**Planning question:** Can implementation of this package begin without changing planning?

**Answer: YES (after Product Owner Approval of this package and an authorized implementation task).** Wave 3 Planning is already **APPROVED**. Master Plan and Execution Roadmap already name **V3-O02 Notification durable queue** (NT-02 / TD-045). Architecture rule is persistence on **existing** aggregates — no second Lake or second Outbox. W3-O02 extends the existing **notification-delivery** owner only; it introduces no new persistence owner and does not redesign the resolved paper Outbox/Inbox (TD-035). Wave 1 remains CERTIFIED COMPLETE. Wave 2 remains COMPLETE. W3-O01 remains CLOSED. The Master Plan is not modified. No new Source of Truth is invented. No Version 2 redesign. No architecture or ownership changes. Live Trading is not introduced. Wave 5 production transports are not introduced. Monitoring product is not introduced (V3-O05). Kill Switch product is not introduced (V3-O04).

```text
Notification Durable Queue consumes Wave 1 security, Closed W3-O01 context, and existing Notification product.
It does NOT redesign Notification settings/routing (NT-01), paper Outbox/Inbox (TD-035), Auth, Vault, or Connections.
It does NOT own secrets, identity, authz, workspace, audit persistence, monitoring, or Kill Switch.
It does NOT introduce a new persistence owner, second Outbox, or bounded context.
It does NOT deliver Live Trading, Wave 4 venue I/O, or Wave 5 production transports.
Queue durability does NOT mean production Telegram/SMTP/Slack delivery is real (Wave 5).
Queue durability does NOT mean production restart-safety Complete (needs O03 among other exits).
STOP — Do not create W3-O02-a until Product Owner Approves planning and writes the implementation task.
```

**Planning status:** **COMPLETE for review.** Product Owner must review and Approve before any implementation. **STOP** until Approval. No implementation slices opened.

**Naming clarity:** Operational package ID `W3-O02` maps 1:1 to Master Plan / Execution Roadmap package **V3-O02**. This planning does not invent a new Master Plan ID. Residual name `Notification durable delivery queue` is TD-045 debt vocabulary only — not a new SoT and not a duplicate of paper Outbox (TD-035).

---

## Implementation lifecycle (canonical — every package)

```text
Master Plan
        ↓
Implementation Package   ← YOU ARE HERE (awaiting PO review)
        ↓
Review
        ↓
Approval                 ← required before code
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

Do not skip a stage. Do not start production code before Approval. Do not open W3-O02-a…e from this planning open. Do not open W3-O03…O05 from this package alone. Do not claim Wave 3 exit. Do not claim Live Trading. Do not claim Wave 5 Notification Platform Complete. Do not claim production restart-safety Complete. **This planning package does not open implementation slices.**

---

## Master Plan Alignment

| Source                              | Reference                                                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Master Plan capability**          | **V3-O02** Notification durable queue — Execution Roadmap Wave 3 package table                                                                                             |
| **Capability inventory**            | **NT-02** Durable notification queue (Purpose: delivery survives restart; Justification: TD-045; Distinct from paper Outbox TD-035)                                        |
| **Technical debt**                  | **TD-045** Notification durable delivery queue (in-process delivery; restart can lose in-flight adapter state)                                                             |
| **Execution Roadmap outcome**       | Wave 3 exit: “In-flight notification delivery is not lost on process restart.” Architecture: persistence on existing aggregates; no second Lake or Outbox                  |
| **Product Roadmap outcome**         | Infrastructure group — durability / queues (Wave 3, mandatory before live claims); Notification Platform (Wave 5) depends on Wave 3 durable queue                          |
| **Master Plan customer-observable** | Wave 3: “After an API restart, my paper work and **alerts I was owed** are not silently gone (or the product honestly says what does not survive — default: it survives).” |
| **Master Plan continuity note**     | “Notification provider unavailable → In-app history still works. Channel marked down. No silent drop without a record after Wave 3 queue.”                                 |

This package implements **only** V3-O02 / NT-02 / TD-045. It does not invent functionality outside the approved Master Plan.

---

## Overview

W3-O02 opens **Notification Durable Queue**. It is the product package that closes the TD-045 residual: **in-flight notification delivery work** must not be silently lost when the API process restarts.

It is **not** W3-O01. W3-O01 closed analytical-store survival for notification-related **artifacts** (preferences, Telegram connect state, delivery **history**). W3-O02 closes **queue durability** — pending / retryable delivery work survives restart so owed alerts are not silently dropped.

It is **not** Wave 5. Wave 5 activates production transports (Telegram Bot API, SMTP, Slack/Discord/Teams, Push). W3-O02 makes the delivery queue durable on the existing Notification product so later real transports have a restart-safe delivery foundation. Existing in-process / certified paths remain honest until Wave 5.

It consumes Wave 1 security products, Closed Wave 2 products as context, Closed W3-O01 as predecessor context, and the existing Notification product (NT-01 settings/routing; notification-delivery owner). It does not invent a second Outbox, a second Lake, or a new bounded context. Paper Outbox/Inbox (TD-035, resolved) remains the paper runtime event path and is **not** this queue.

---

## Durability Clarification (binding)

| Question                                           | Answer  |
| -------------------------------------------------- | ------- |
| Does W3-O02 extend existing durability mechanisms? | **YES** |
| Does W3-O02 introduce any new persistence owner?   | **NO**  |
| Does W3-O02 create a second Outbox?                | **NO**  |
| Is TD-045 the same as TD-035 (paper Outbox)?       | **NO**  |

**Binding:** Existing **notification-delivery** owner is **extended only**. W3-O02 does not introduce a new persistence owner, Event Store, Projection Store, Ledger, Knowledge Lake, Outbox, Inbox, or Canonical Order Path. Residual TD-045 vocabulary is not authorization for a second Outbox. Master Plan / Execution Roadmap already require persistence on existing aggregates and forbid a second Outbox.

---

| Field                           | Value                                                    |
| ------------------------------- | -------------------------------------------------------- |
| Package ID                      | W3-O02                                                   |
| Master Plan / Execution Roadmap | **V3-O02** Notification durable queue                    |
| Product name                    | Notification Durable Queue                               |
| Wave                            | 3 — Durability, Operations & Continuity                  |
| Capabilities (inventory IDs)    | **NT-02**; debt **TD-045**                               |
| Complexity                      | M                                                        |
| Previous                        | W3-O01 CLOSED                                            |
| Next after W3-O02 Close         | W3-O03 Recovery Residual US295 / ADL-008 (PO sequencing) |

---

## Business Goal

- **Goal:** After an API restart, in-flight notification delivery work operators were owed is not silently gone — delivery resumes or the product records honest failure / unavailable state (never silent drop without a record).
- **Honesty:** **Queue durable** means pending / retryable delivery work survives process restart. It does **not** mean Live Trading, Monitoring Complete, Kill Switch Complete, Wave 5 production transports, production Telegram Bot API, or Wave 3 COMPLETE.
- **Master Plan reference:** Wave 3 customer-observable — alerts owed are not silently gone. Execution Roadmap V3-O02 / exit criterion for in-flight notification delivery. Inventory NT-02. Debt TD-045.
- **Metric this package must meet or not regress:** silent in-flight notification loss **0** for in-scope queue work; dishonest “delivered” when not **0**; cross-workspace leak **0**; secret echo **0**; Live Trading claim **0**; second Outbox **0**. Production transports remain Wave 5. Production restart-safety Complete remains O03+. Live capital remains Wave 6.

---

## Customer Problem

- **Problem:** Notification delivery remains in-process for queue/adapter state (TD-045). Restart can lose in-flight delivery work even when W3-O01 preserved analytical history / preferences / connect state. Operators cannot trust that owed alerts survive deploy/restart.
- **Who feels it:** Operators who lose owed alerts after restart; Product Owner who cannot advance Wave 3 exit / Wave 5 transport readiness while TD-045 remains open; later Wave 5 packages that need a durable queue foundation without inventing a parallel delivery product.
- **What they must do today that they should not:** Treat restart as an acceptable silent wipe of in-flight notification delivery, SSH to reconstruct delivery state, or assume “alerts survive” from analytical history alone (W3-O01) without a durable queue.

---

## Business Value

- **Value delivered at W3-O02 Close (after implementation):** In-flight notification delivery work survives API restart (or honest failure/unavailable is recorded — never silent drop without a record). TD-045 residual is closed for package scope. Wave 3 can proceed to O03; Wave 5 can later bind real transports to a durable queue.
- **What remains blocked until later packages / waves:** US295/ADL-008 stance (O03); Durable Kill Switch product (O04); Monitoring & security health (O05); Wave 4 venue I/O; Wave 5 production transports (TD-049 / TD-050); Wave 6 live capital; Wave 3 COMPLETE.

---

## Current State

| Capability or surface                                   | Status                    | Evidence                      |
| ------------------------------------------------------- | ------------------------- | ----------------------------- |
| Wave 1 security products                                | Already CLOSED            | Wave 1 CERTIFIED COMPLETE     |
| Wave 2 Connections / Paper / AI Connectivity            | Already COMPLETE / CLOSED | Wave 2 COMPLETE               |
| W3-O01 analytical stores (incl. DeliveryResult history) | CLOSED                    | W3-O01 package summary        |
| Notification product settings / routing (NT-01)         | Exists (V2 maintain)      | Inventory NT-01 100%          |
| Notification durable delivery queue (NT-02)             | Missing / in-process      | TD-045 / NT-02 0%             |
| Paper Outbox / Inbox                                    | Resolved (distinct)       | TD-035 — **not** this package |
| Production Telegram / SMTP / Slack transports           | Out                       | Wave 5 / TD-049 / TD-050      |
| Kill Switch durable product                             | Out                       | V3-O04                        |
| Monitoring product                                      | Out                       | V3-O05                        |
| Live Trading                                            | Out                       | Wave 6                        |

Facts implementers must not forget:

- Wave 1 is CERTIFIED COMPLETE and must not be reopened.
- Wave 2 is COMPLETE and must not be redesigned.
- W3-O01 is CLOSED and must not be reopened or redesigned.
- Persistence on **existing** notification-delivery aggregates only.
- No second Lake. No second Outbox. TD-045 ≠ TD-035.
- Analytical delivery **history** survival (W3-O01) ≠ durable **queue** (this package).
- Fail closed; no fake “delivered” after restart.
- No Live Trading. No Gate/Risk bypass.
- No Wave 5 production transport claim from O02.
- No Monitoring Complete claim from O02.
- No production restart-safety Complete claim from O02 alone.
- No implementation slices in this planning open — Product Owner sequences slices only after Approval.

---

## Reuse from existing products

| Stance          | This package                                                                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reuse unchanged | Authentication; Authorization; Workspace Isolation; Vault; Security Platform; Security Audit ownership; Closed Wave 2 products; Closed W3-O01 outcomes; Notification settings/routing (NT-01); paper Outbox/Inbox (TD-035) as distinct path |
| Minor extension | Durable delivery queue persistence / restart recovery on existing notification-delivery owner                                                                                                                                               |
| Major extension | Nothing. No new notification domain. No second Outbox. No Wave 5 transport domain.                                                                                                                                                          |
| New justified   | Nothing. No new bounded context. Master Plan already named V3-O02 / NT-02.                                                                                                                                                                  |
| Replace         | **Nothing** on Canonical Order Path, Ledger, Runtime evaluator, Library, Wave 1, Wave 2, W3-O01 ownership, paper Outbox/Inbox                                                                                                               |

| Area                          | Owner                 | This package must not own         |
| ----------------------------- | --------------------- | --------------------------------- |
| Customer credentials          | Vault                 | Ciphertext / encryption keys      |
| Identity / sessions           | Authentication        | Login, MFA, recovery              |
| Permissions                   | Authorization         | Role matrix redesign              |
| Workspace membership          | Workspace             | Tenancy SoT                       |
| Hardening defaults            | Security Platform     | CSP / rate-limit product rewrite  |
| Audit persistence             | Security Audit        | Append-only store                 |
| Notification settings/routing | Existing NT-01 owner  | Preferences product rewrite       |
| Notification delivery domain  | notification-delivery | Domain rewrite as new product     |
| Paper runtime Outbox/Inbox    | Existing Outbox owner | Second Outbox / merge of TD-035   |
| Live money / orders           | Ledger / Order Path   | Live trading / exchange execution |
| Monitoring dashboards         | Wave 3 O05            | Health product                    |

---

## Dependencies

| Dependency                       | Kind                 | Status required before this package  |
| -------------------------------- | -------------------- | ------------------------------------ |
| Wave 1 CERTIFIED COMPLETE        | Prior wave           | **Required**                         |
| Wave 2 COMPLETE                  | Prior wave           | **Required**                         |
| W3-O01 Durable Analytical Stores | Prior Wave 3 package | **CLOSED**                           |
| Vault                            | Earlier V3 package   | Closed / available                   |
| Authentication                   | Earlier V3 package   | Closed                               |
| Authorization                    | Earlier V3 package   | Closed                               |
| Workspace Isolation              | Earlier V3 package   | Closed                               |
| Security Platform                | Earlier V3 package   | Closed                               |
| Security Audit                   | Earlier V3 package   | Closed                               |
| Existing Notification product    | Version 2            | Available (consumed; not redesigned) |

This package does **not** depend on:

- V3-O03 US295 / ADL-008 (sequenced after)
- V3-O04 Durable Kill Switch product (sequenced after)
- V3-O05 Monitoring & security health (sequenced after)
- Wave 4 remaining venue trading outcomes
- Wave 5 production Telegram / SMTP / Slack delivery (consumes this queue later)
- Wave 6 live trading ADR
- Billing, analytics dashboards, or Wave 9 SaaS admin

---

## Business Problem

In-process notification delivery queue/adapter state makes owed alerts dishonest under restart: pending delivery can vanish while analytical history may already survive (W3-O01), blocking Wave 3 exit and Wave 5 transport readiness.

## Business Goals

1. In-flight notification delivery work survives API restart (default).
2. No silent drop of owed alerts without a durable record / honest failure.
3. No fake “delivered” when delivery did not complete.
4. No second Lake / Outbox / bounded context; TD-045 ≠ TD-035.
5. Preserve Wave 1 / Wave 2 / W3-O01 / Version 2 ownership and architecture.

## Customer Journey

See [`notification-durable-queue-overview.md`](./notification-durable-queue-overview.md).

## Operator-visible functionality

- Owed in-flight notification delivery work still present / resumable after API restart
- Or honest failure / unavailable recorded — never silent wipe presented as success
- In-app notification surfaces remain workspace-scoped and authorized
- No SSH required to “recover” silently dropped in-flight delivery
- No Live Trading / Wave 5 Complete / monitoring / Kill Switch claims from this package

---

## Implementation Scope

### IN Scope

| Item                             | Customer meaning                                                      | Notes / owner inside existing domain           |
| -------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| Notification queue inventory     | In-flight / pending / retry delivery surfaces known and classified    | Planning → implementation evidence             |
| Durable notification queue       | In-flight delivery work survives process restart                      | NT-02 / TD-045; existing notification-delivery |
| Restart-survival for owed alerts | After API restart, pending work resumes or honest failure is recorded | Wave 3 exit criterion                          |
| No silent drop without record    | Master Plan continuity note for Wave 3 queue                          | Fail closed honesty                            |
| Workspace isolation              | A cannot see / drive B’s notification delivery                        | Isolation consume                              |
| Authorization                    | Unauthorized roles cannot access                                      | Authz consume                                  |
| Security boundaries              | Authn / Authz / Isolation / Vault / Audit / Platform consumed         | Does not redefine                              |
| Audit interaction                | Queue durability-relevant outcomes attributable where required        | Emits to Security Audit                        |
| Failure philosophy               | Fail closed; no fake delivered                                        | Security Default Policy                        |
| Validation strategy              | Close criteria, evidence, regressions                                 | This package + validation plan                 |

### OUT OF Scope

| Item                                                           | Why out                                  | Owner later          |
| -------------------------------------------------------------- | ---------------------------------------- | -------------------- |
| US295 / ADL-008 production restart-safety stance               | Separate package                         | V3-O03               |
| Durable Kill Switch product                                    | Separate package                         | V3-O04               |
| Monitoring & security health                                   | Separate package                         | V3-O05               |
| Second Knowledge Lake                                          | Forbidden                                | Never                |
| Second Outbox (or merge with paper Outbox TD-035)              | Forbidden                                | Never                |
| Paper Outbox/Inbox redesign                                    | Already resolved; distinct               | TD-035 (closed)      |
| Live Trading                                                   | Wave 6                                   | Wave 6 / Order Path  |
| Wave 4 venue I/O                                               | Later wave                               | Wave 4               |
| Wave 5 production notification transports                      | Later wave                               | Wave 5 / V3-N01…N04  |
| Notification settings/routing product rewrite (NT-01)          | Maintain / reuse                         | Existing NT-01       |
| W3-O01 analytical store redesign                               | Already CLOSED                           | Forbidden            |
| Connection Management redesign                                 | Already COMPLETE                         | Wave 2               |
| Vault / Auth / Authz / Isolation redesign                      | Wave 1 CLOSED                            | Forbidden            |
| Wave 1 / Wave 2 / Master Plan / Version 2 architecture changes | Frozen                                   | Forbidden            |
| Implementation slices                                          | Not opened in this planning task         | After Approval by PO |
| Wave 3 COMPLETE declaration                                    | Exit is Product Owner only after O01…O05 | Product Owner        |

Nothing in IN Scope may be invented. If a desired item is not already named in Master Plan / Execution Roadmap / inventory for V3-O02 / NT-02 / TD-045, **stop**.

---

## Product Acceptance Criteria

| #   | Outcome                                                                                                           | Fail if                        |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 1   | In-scope in-flight notification delivery work survives API restart (or honest failure is recorded)                | Silent loss of owed delivery   |
| 2   | Product never claims “delivered” when delivery did not complete                                                   | Fake success                   |
| 3   | No silent drop without a durable record after Wave 3 queue                                                        | Silent wipe                    |
| 4   | Workspace A cannot access Workspace B notification delivery / queue surfaces                                      | Cross-tenant leak              |
| 5   | Unauthorized roles cannot access queue-managed notification surfaces                                              | Privilege bypass               |
| 6   | Product never claims Live Trading, Wave 5 Complete, Monitoring Complete, Kill Switch Complete, or Wave 3 COMPLETE | Dishonest product claim        |
| 7   | Secrets never shown, exported, or logged as plaintext                                                             | Plaintext exposure             |
| 8   | No second Lake or second Outbox introduced; TD-045 remains distinct from TD-035                                   | Ownership / architecture drift |

The customer never uses SSH, customer `.env` vendor secrets, local secret files, or manual database edits for these journeys.

Copy and complete [`../version-3-product-checklist.md`](../version-3-product-checklist.md) at Close.

---

## Product Walkthrough

**Required in Product Review. Repeat at Close.**

```text
Notification Durable Queue Walkthrough

□ Sign in
□ Create / enqueue in-scope notification delivery work (owed alert path)
□ Confirm pending / in-flight work visible or attributable before restart
□ Restart API process before delivery completes (or while retryable)
□ Confirm work still present / resumed (survive path)
   — or —
□ Confirm honest failure / unavailable recorded (never silent drop)
□ Foreign workspace delivery — denied
□ Unauthorized role — denied
□ Confirm no Live Trading, Wave 5 Complete, Monitoring Complete, Kill Switch Complete, Wave 3 COMPLETE claims
□ Confirm no second Lake / Outbox; TD-045 ≠ TD-035

PASS / NOT APPLICABLE / REQUIRES ACTION
```

Overall verdict for this package (fill at Close):

| Field                   | Value                                  |
| ----------------------- | -------------------------------------- |
| Walkthrough name        | Notification Durable Queue Walkthrough |
| Executed in the product | Yes (at Close)                         |
| Overall                 | PENDING APPROVAL                       |

---

## Architecture constraints

| Rule                                                           | Decision                                                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| No new bounded context unless the Master Plan already named it | V3-O02 / NT-02 already named; no new domain; **no new persistence owner**                                     |
| No ownership drift                                             | notification-delivery / NT-01 / Vault / Auth / Authz / Workspace / Platform / Audit unchanged as owners       |
| No duplicate Source of Truth                                   | No second Lake; no second Outbox; no merge of TD-045 into TD-035 paper Outbox; no second Notification product |
| Persistence on existing aggregates                             | **Required** — extend existing notification-delivery durability only                                          |
| HTTP remains transport; UI remains not Source of Truth         | Yes                                                                                                           |
| Spec v2.0 / Authority Matrix / Alias Dictionary                | Unchanged                                                                                                     |
| No Version 2 architecture redesign                             | Binding                                                                                                       |
| No Master Plan modifications                                   | Binding                                                                                                       |

**Architecture Review (planning verification):**

| Check                          | Result |
| ------------------------------ | ------ |
| No ownership changes           | PASS   |
| No new bounded contexts        | PASS   |
| No new Source of Truth         | PASS   |
| No duplicate persistence owner | PASS   |
| No duplicate operational owner | PASS   |
| No duplicate monitoring owner  | PASS   |
| No Version 2 redesign          | PASS   |
| No Master Plan revision        | PASS   |

Forbidden: duplicate Lake/Outbox/Inbox/Event Store/Projection Store/Ledger/auth/vault; second Canonical Order Path; hidden redesign; Version 2-style RC track; reopening Wave 1, Wave 2, or W3-O01; claiming Live Trading; claiming Wave 5 Complete; claiming Wave 3 COMPLETE from O02; silent in-flight drop; inventing a persistence owner under residual name TD-045.

---

## Security constraints

| Rule                            | Decision                                     |
| ------------------------------- | -------------------------------------------- |
| Fail Closed                     | Missing auth / workspace / permission denies |
| Reuse Authentication            | Yes — no new identity owner                  |
| Reuse Authorization             | Yes — no new IAM                             |
| Reuse Workspace Isolation       | Yes — A↛B notification delivery              |
| Reuse Vault                     | Yes — no local secret store                  |
| Reuse Security Platform         | Yes — inherit hardening                      |
| Reuse Security Audit            | Emit only; do not own store                  |
| No new security ownership       | Binding                                      |
| No Live Trading from durability | Binding                                      |

See [`w3-o02-security-review.md`](./w3-o02-security-review.md).

---

## Operational constraints

| Rule                                       | Decision                                                |
| ------------------------------------------ | ------------------------------------------------------- |
| Operator walkthrough required at Close     | Notification Durable Queue Walkthrough                  |
| No SSH required for owed-alert recovery    | Binding for in-scope queue work                         |
| Channel unavailable honesty                | No silent drop without record; fake delivered forbidden |
| Wave 5 transports not claimed              | In-process / certified paths remain honest until Wave 5 |
| W3-O01 analytical history remains distinct | Delivery history survival ≠ queue durability            |
| Monitoring product not claimed             | O05 owns health dashboard productization                |

---

## Validation strategy

See [`w3-o02-validation-plan.md`](./w3-o02-validation-plan.md).

Layers: unit · integration · UI · regression (Wave 1 + Wave 2 + W3-O01) · product walkthrough · architecture · security Verification Standard · package acceptance.

Tests that mock “queued” without proving restart survival of in-flight delivery do **not** count as Close evidence.

---

## Required implementation slices (planning — not to implement now)

### W3-O02-a — Notification queue inventory & honesty baseline

**Goal:** Enumerate in-flight / pending / retry notification delivery surfaces; classify durable-queue vs out-of-scope (transports, analytical history, paper Outbox).
**Touch (expected):** Existing notification-delivery modules / persistence ports only.
**Done when:** Inventory evidenced; honesty baseline documented (TD-045 ≠ TD-035; ≠ W3-O01 DeliveryResult history).
**Must not:** New Outbox/Lake; Live Trading; Wave 5 transports; open other Wave 3 packages; open W3-O02-b.

### W3-O02-b — Durable queue persistence on existing notification-delivery owner

**Goal:** Persist in-flight / pending / retryable delivery work on existing notification-delivery owner / ports.
**Done when:** Priority queue work writes/reads durable state within existing domain.
**Must not:** Redesign NT-01; invent second SoT / second Outbox; merge with paper Outbox.

### W3-O02-c — Restart-survival proof for in-flight delivery

**Goal:** Prove API restart does not silently drop in-scope in-flight delivery; no fake delivered.
**Done when:** Restart walkthrough/tests PASS for durable queue; honest failure path if delivery cannot complete.
**Must not:** Claim O03 restart-safety Complete; claim Wave 5 transports; claim O05 monitoring.

### W3-O02-d — Degraded delivery honesty & continuity alignment

**Goal:** Align queue unavailable / channel-down honesty with Operational State Matrix / continuity foundation; no silent drop without record.
**Done when:** Degraded/unavailable honesty PASS for queue surfaces; no Monitoring product claim.
**Must not:** Expand into Monitoring / HA / DR / Incident Management (O05 / later).

### W3-O02-e — Package Validation, Operational Verification & Close Evidence

**Goal:** Validation / walkthrough / integrity / Close Evidence only.
**Done when:** Close Evidence assembled for Product Owner Package Review.
**Must not:** Declare W3-O02 CLOSED; start W3-O03; claim Wave 3 COMPLETE; add new customer functionality.

**Binding:** Do not create `W3-O02-a` (or any slice) until Product Owner Approves this planning package and writes / sequences an implementation task.

---

## Package boundaries

| Boundary                   | Rule                                                 |
| -------------------------- | ---------------------------------------------------- |
| Predecessor                | W3-O01 CLOSED — analytical stores; not reopened      |
| This package               | V3-O02 / NT-02 / TD-045 queue durability only        |
| Successor                  | W3-O03 after O02 Close + PO sequencing               |
| Distinct from paper Outbox | TD-035 remains separate; no second Outbox            |
| Distinct from Wave 5       | Transports remain Wave 5; queue is Wave 3 foundation |
| Distinct from NT-01        | Settings/routing reused; not rewritten               |

---

## Future slices (a…e)

| Slice    | Name                                                          | Status (planning open) |
| -------- | ------------------------------------------------------------- | ---------------------- |
| W3-O02-a | Notification queue inventory & honesty baseline               | **Not opened**         |
| W3-O02-b | Durable queue persistence on existing owner                   | **Not opened**         |
| W3-O02-c | Restart-survival proof for in-flight delivery                 | **Not opened**         |
| W3-O02-d | Degraded delivery honesty & continuity alignment              | **Not opened**         |
| W3-O02-e | Package Validation, Operational Verification & Close Evidence | **Not opened**         |

---

## Out-of-scope declarations (binding)

- No Live Trading
- No Wave 4 / Wave 5 / Wave 6 / Wave 7 product delivery from this package
- No Monitoring Complete (O05)
- No Kill Switch product (O04)
- No US295 Complete claim (O03)
- No second Lake / second Outbox
- No merge of Notification queue into paper Outbox (TD-035)
- No Wave 5 production Telegram / SMTP / Slack / Discord / Teams / Push
- No Master Plan changes
- No Version 2 architecture changes
- No Wave 1 or Wave 2 modifications
- No W3-O01 redesign
- No ownership changes
- No W3-O02-a…e opened by this planning task
- No W3-O02 CLOSED declaration without Product Owner Package Review
- No Wave 3 COMPLETE

---

## Mandatory Questions

1. **What business problem does W3-O02 solve?**
   In-flight notification delivery is process-local (TD-045). API restart can silently lose owed alerts even after W3-O01 preserved analytical artifacts — blocking Wave 3 exit and Wave 5 transport readiness.

2. **Why is W3-O01 insufficient?**
   W3-O01 closed durable **analytical stores** (including delivery **history**, preferences, connect state). It explicitly left the Notification **durable delivery queue** to V3-O02. History surviving is not the same as in-flight queue work surviving.

3. **Which existing products does W3-O02 consume?**
   Authentication, Authorization, Workspace Isolation, Vault, Security Platform, Security Audit; Closed Wave 2 products; Closed W3-O01 context; existing Notification product (NT-01 settings/routing; notification-delivery owner). Paper Outbox/Inbox remains distinct (TD-035) and is not consumed as this queue.

4. **What does W3-O02 own?**
   Notification durable queue **outcomes** (NT-02 / TD-045): in-flight / pending / retryable delivery work survives restart (or honest failure is recorded); no silent drop without a record — by extending the existing notification-delivery owner only.

5. **What is explicitly out of scope?**
   Wave 5 production transports; O03–O05 delivery; second Lake/Outbox; merge with paper Outbox; Live Trading; Master Plan / Version 2 / Wave 1 / Wave 2 / W3-O01 modifications; ownership changes; implementation slices in this open; Wave 3 COMPLETE from planning.

6. **Does W3-O02 modify Wave 1?**
   No.

7. **Does W3-O02 modify Wave 2?**
   No.

8. **Does W3-O02 modify Version 2 architecture?**
   No.

---

## Implementation Readiness

| Question                                             | Answer                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| Can implementation begin without modifying planning? | **YES** — after Product Owner Approval and an authorized slice task |
| If NO, stop reason                                   | N/A                                                                 |

Planning is implementation-ready: Master Plan ID, capability, debt, exit criterion, ownership, IN/OUT, slices a–e, security, and validation are frozen in this package set. **STOP** until Product Owner Approves. Do not open W3-O02-a.

---

**STOP.** Wait for Product Owner Planning Review before approving W3-O02 implementation. Do not create W3-O02-a. Do not claim Wave 3 COMPLETE.
