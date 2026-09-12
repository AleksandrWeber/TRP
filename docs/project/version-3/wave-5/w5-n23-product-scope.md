# W5-N23 Product Scope

**Package:** W5-N23 Notification Retry Eligibility Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N23 · CM-33
**Status:** Planning Package **APPROVED** (2026-09-12). Planning Review **PASS**. No implementation. No slices opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n23-implementation-package.md`](./w5-n23-implementation-package.md)
**Overview:** [`w5-n23-overview.md`](./w5-n23-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N23. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01…N22. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N23` is the operational package ID for Product Owner authorization **V3-N23**. This scope does not invent capabilities beyond Product Owner authorization / Wave 5 Notification Platform scope. Inventory **CM-33** is Notification Retry Eligibility Foundation only — not Connection Management provider framework redesign, not AI Gateway, not Wave 3 MN-02 Observability product, not an Eligibility Engine product, not a Retry Engine product, not a Scheduler product, not a Runtime Execution product, not a Retry Platform.

---

## Product purpose

Notification Retry Eligibility Foundation is the product package that defines how **governed eligibility decision integrity** is inventoried, persisted, recovered, and displayed on the existing Notification Delivery adapter, PC-06 routing, and PC-07 catalog — building on Closed W5-N22 Retry Backoff Calculation Foundation and Closed W5-N01…N22 foundations into a coherent eligibility foundation layer that determines whether another retry attempt is permitted when implemented.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds eligibility foundation consumption only.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own per-channel transport I/O (N01…N04 reopen).

It does **not** own platform foundation redesign (N05…N22 reopen).

It does **not** own Anthropic / AI Gateway (Wave 7).

It does **not** own Wave 3 MN-02 Observability product.

It does **not** redesign Connection Management provider framework (inventory CM-21).

It does **not** implement Retry Backoff Calculation, retry delay calculation, retry scheduling, retry execution, retry lifecycle, timers, workers, orchestration, transport providers, SMTP/Telegram/Discord/Slack/Webhook provider behavior, dead-letter processing, Monitoring Platform, Business Continuity, High Availability, or Disaster Recovery.

```text
Notification Delivery owns platform eligibility foundation artifacts and per-channel adapters.
Vault owns all channel credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W3-O02 durable queue owns delivery work substrate.
W5-N23 owns Notification Retry Eligibility Foundation outcomes (V3-N23 · CM-33).
Eligibility Foundation ≠ Retry Backoff Calculation.
Eligibility Foundation ≠ retry delay calculation.
Eligibility Foundation ≠ retry scheduling.
Eligibility Foundation ≠ retry execution.
Eligibility Foundation ≠ successful delivery.
Eligibility Foundation ≠ provider acceptance.
Eligibility Foundation ≠ recipient receipt.
Eligibility Foundation ≠ exactly-once delivery.
Eligibility Foundation ≠ delivery guarantee.
Eligibility Foundation ≠ Live Trading.
Foundation ≠ transport execution.
No Eligibility Engine. No Retry Engine. No Scheduler. No Runtime Execution.
No Retry Platform. No Workflow Engine. No Event Bus. No orchestration platform.
```

---

## Business problem

After W5-N22, the platform can calculate Retry Backoff values. Before any future scheduling or execution packages, the platform must determine whether another retry is permitted. Retry Eligibility provides this decision foundation.

Operators lack a governed eligibility decision foundation on the existing notification-delivery owner. TD-049 / TD-050 remain deferred.

---

## Business objective

Deliver honest **Notification Retry Eligibility Foundation** planning — and, when implemented after Approval, a deterministic governed eligibility-decision foundation on the existing catalog and routing product. Operators see consistent honest eligibility rules — not successful delivery claims from planning alone.

---

## Product outcome

Governed eligibility foundation coherence on `notification-delivery`: eligibility decision model, eligibility inventory strategy, persistence planning, recovery planning, operational continuity planning, and package planning — without inventing an Eligibility Engine, Retry Engine, Scheduler, or control plane.

---

## What Eligibility means in Version 3 (binding)

In Version 3, **Eligibility** means only the **retry eligibility foundation capabilities owned by the existing `notification-delivery` bounded context**:

| Capability                      | Meaning at W5-N23 scope                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| Eligibility decision model      | Rules describing whether another retry attempt is permitted                                   |
| Eligibility inventory strategy  | Enumeration of eligibility surfaces; SURVIVE/EPHEMERAL; honesty rules                         |
| Persistence planning            | Deterministic durable anchors for eligibility decision representation on existing owner       |
| Recovery planning               | Hydration of eligibility state after normal API restart on the same owner                     |
| Operational continuity planning | Honest Platform Readiness projection for eligibility on existing operational continuity owner |
| Honest eligibility rules        | Consistent platform-wide eligibility semantics — foundation evidence only                     |

**Owner:** Existing **`notification-delivery` bounded context** only. W5-N23 extends that owner. It does **not** create a new owner or bounded context.

**Eligibility is foundation-only.** It is the coherence layer that determines whether another retry is permitted on durable retry metadata and calculated backoff inputs — not delay calculation, not scheduling, not execution, and not a trading control plane.

### Eligibility-only boundary (binding)

```text
Notification Retry Eligibility determines eligibility only.
It does NOT:
- calculate retry delays,
- schedule retries,
- execute retries,
- own retry lifecycle,
- own timers,
- own workers,
- own orchestration.
Eligibility output is informational until consumed by future approved packages.
```

Backoff Calculation remains Closed W5-N22 (consumed). Scheduling remains Closed W5-N19 (consumed). Execution remains Closed W5-N18 (consumed). Retry lifecycle, timers, workers, and orchestration are **not** owned by W5-N23. Eligibility output does not activate retries by itself.

---

## What Eligibility does NOT mean (binding)

Eligibility **does not** mean:

- Retry Backoff Calculation
- Retry delay calculation
- Scheduling retries
- Executing retries
- Owning retry lifecycle
- Owning timers
- Owning workers
- Owning retry orchestration
- Retry queues
- Transport providers
- Transport execution
- Provider execution
- Successful delivery
- Provider acceptance
- Recipient receipt
- Exactly-once delivery
- Delivery guarantee

Those remain **outside W5-N23** unless explicitly implemented by later packages.

Eligibility also **does not** mean: SMTP provider behavior, Telegram provider behavior, Discord provider behavior, Slack provider behavior, Webhook provider behavior, dead-letter processing, notification routing, notification catalog, Monitoring Platform, telemetry platform, metrics platform, Business Continuity, High Availability, Disaster Recovery, Live Notifications, Production Ready, Notification Platform Complete, or Wave 5 COMPLETE.

---

## Relationship with W5-N17…W5-N22 (binding)

W5-N23 **consumes** all six closed packages. **No ownership is transferred. No previous package is redesigned.**

| Package    | Provides (closed — ownership retained on `notification-delivery` owner)                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **W5-N17** | Cross-channel **delivery reliability foundation**: inventory, durable persistence, restart recovery, operational continuity, Close Evidence      |
| **W5-N18** | Cross-channel **retry execution foundation**: inventory, durable persistence, restart recovery, operational continuity, Close Evidence           |
| **W5-N19** | Cross-channel **retry scheduling foundation**: inventory, durable persistence, restart recovery, operational continuity, Close Evidence          |
| **W5-N20** | Cross-channel **retry policy foundation**: inventory, durable persistence, restart recovery, operational continuity, Close Evidence              |
| **W5-N21** | Cross-channel **retry backoff foundation**: inventory, durable persistence, restart recovery, operational continuity, Close Evidence             |
| **W5-N22** | Cross-channel **retry backoff calculation foundation**: inventory, durable persistence, restart recovery, operational continuity, Close Evidence |

| W5-N23 rule                     | Binding                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------- |
| Consumes W5-N17…N21 foundations | Reads prior foundation outputs — does not redesign or re-own prior artifacts |
| Consumes W5-N22 backoff calc    | Reads N22 foundation outputs — does not redesign or re-own N22 artifacts     |
| Owns eligibility foundation     | New eligibility foundation layer on same `notification-delivery` owner       |

**Why after W5-N22:** Eligibility depends on existing retry metadata and calculated backoff, but remains independent from calculation itself. Without Closed Retry Backoff Calculation Foundation, eligibility cannot be planned deterministically on durable calculation inputs.

---

## Scope IN

| IN                                                        | Meaning                                              |
| --------------------------------------------------------- | ---------------------------------------------------- |
| Eligibility decision model (planning)                     | Whether another retry is permitted                   |
| Eligibility inventory strategy (planning)                 | Enumerate eligibility surfaces; honesty baseline     |
| Persistence planning                                      | Durable eligibility representation on existing owner |
| Recovery planning                                         | Restart-safe hydration on existing owner             |
| Operational continuity planning                           | Honest Platform Readiness projection intent          |
| Package planning / validation strategy                    | Planning Package for Product Owner Planning Review   |
| Workspace-scoped eligibility-foundation state (post-impl) | Isolation preserved                                  |
| Consumption of Closed W5-N01…N22                          | Patterns and anchors only — not reopen               |

---

## Scope OUT

| OUT                                                       | Status                                       |
| --------------------------------------------------------- | -------------------------------------------- |
| Implementation                                            | **OUT** until Planning Approval + slice auth |
| Implementation slices (W5-N23-a…)                         | **OUT** — not opened, not named              |
| Retry Backoff Calculation                                 | **OUT** — eligibility does not calculate     |
| Retry delay calculation                                   | **OUT**                                      |
| Scheduling retries                                        | **OUT** — eligibility only                   |
| Executing retries                                         | **OUT** — eligibility only                   |
| Owning retry lifecycle / timers / workers / orchestration | **OUT** — eligibility only                   |
| Retry queues / transport providers                        | **OUT**                                      |
| Transport execution / provider I/O                        | **OUT**                                      |
| Dead-letter processing                                    | **OUT**                                      |
| Live Notifications / Production Ready / Wave 5 COMPLETE   | **OUT**                                      |
| Notification Platform Complete                            | **OUT**                                      |
| Eligibility Engine / Retry Engine / Scheduler             | **Forbidden**                                |
| Runtime Execution / Retry Platform / Workflow Engine      | **Forbidden**                                |
| Event Bus / orchestration                                 | **Forbidden**                                |
| Version 2 modification                                    | **OUT**                                      |
| Master Plan revision                                      | **OUT**                                      |
| Ownership / bounded context / SoT changes                 | **OUT**                                      |
| W5-N01…N22 reopen                                         | **OUT**                                      |
| Monitoring / BC / HA / DR                                 | **OUT**                                      |
| Live Trading                                              | **OUT**                                      |

---

## Customer-visible outcomes

**After approved implementation and Close (intent):** operators can rely on governed eligibility inventory, persistence, restart-safe recovery, and honest Platform Readiness for eligibility — without inferring delivery success or that retries were scheduled/executed.

**From this planning open alone:** no customer-visible eligibility behaviour. No runtime. No delivery claims.

---

## Operator journey (planning intent)

1. Operator stays inside workspace and authorization.
2. After implementation (not authorized now): governed eligibility-foundation surfaces appear on existing notification-delivery / Platform Readiness paths.
3. Operator does **not** infer transport success, recipient receipt, delay calculation, scheduling, or execution from foundation surfaces alone.
4. Operator configures channels on existing surfaces (transport I/O remains per-channel scope / deferred).

---

## Consumes

| Product                        | How this package uses it                                   | Must not do                       |
| ------------------------------ | ---------------------------------------------------------- | --------------------------------- |
| **Authentication**             | Only signed-in operators see eligibility foundation        | Parallel login                    |
| **Authorization**              | Only permitted roles access eligibility surfaces           | New IAM                           |
| **Workspace Isolation**        | Eligibility state stays in workspace                       | Cross-workspace convenience       |
| **Vault**                      | Consumes vault availability; no new secret types           | Duplicate store; echo plaintext   |
| **Security Platform**          | Hardening and rate-limit defaults                          | Fork platform controls            |
| **Security Audit**             | Attributable eligibility outcomes where required           | Own the audit store               |
| **Connection Management**      | Operator UI for all channels (consume)                     | Redesign facade ownership         |
| **Notification Delivery**      | Platform eligibility foundation extension                  | Second engine; Eligibility Engine |
| **Existing retry metadata**    | Inputs to eligibility decision model (consume)             | Redesign metadata owner           |
| **PC-06 routing**              | Routes to active transport when enabled (consume)          | Redefine routing SoT              |
| **PC-07 catalog**              | All channel surfaces (consume)                             | Invent parallel catalog           |
| **W3-O02 durable queue**       | Delivery work substrate (consume)                          | Redesign queue owner              |
| **W5-N17…N21 foundations**     | Reliability-through-backoff patterns and anchors (consume) | Redesign prior owner artifacts    |
| **W5-N22 backoff calculation** | Calculation foundation patterns and anchors (consume)      | Redesign N22 owner artifacts      |
| **W5-N01…N22 foundation**      | Per-channel and platform anchors and patterns (consume)    | Redesign prior owner artifacts    |
| **Validation framework**       | Existing validation patterns (consume)                     | Fork validation product           |

---

## Owns

| Outcome                                                      | Customer meaning                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| Eligibility decision model (planning)                        | Whether another retry is permitted                                 |
| Eligibility inventory strategy & honesty baseline (planning) | Honest unified eligibility vs per-channel surfaces                 |
| Persistence planning                                         | Deterministic durable eligibility representation on existing owner |
| Recovery planning                                            | Eligibility state survives restart (when implemented)              |
| Operational continuity planning                              | Platform Readiness projection for eligibility                      |
| Cross-channel honest eligibility rules (post-impl)           | Consistent eligibility semantics at foundation scope               |
| Workspace-scoped eligibility state (post-impl)               | Operator-visible eligibility-foundation truth                      |
| Package validation strategy                                  | Close Evidence chain when implemented                              |

**Does not own a new notification product, engine, Eligibility Engine, Retry Engine, Scheduler, Runtime Execution, Retry Platform, Workflow Engine, Event Bus, orchestration platform, delay calculation, scheduling, execution, or transport execution layer.** Notification Delivery remains transport owner.

---

## Does NOT own

| Concern                                        | Real owner                     |
| ---------------------------------------------- | ------------------------------ |
| Secret ciphertext / encryption                 | Vault                          |
| Identity / sessions                            | Authentication                 |
| Permissions (IAM)                              | Authorization                  |
| Workspace membership / isolation               | Workspace / Isolation          |
| Connection Management facade                   | Connection Management (Wave 2) |
| Notification routing                           | PC-06                          |
| Notification catalog                           | PC-07                          |
| Durable queue substrate                        | W3-O02 (Wave 3)                |
| Observability product                          | MN-02 (Wave 3)                 |
| Risk decisions                                 | Risk Engine                    |
| Orders / live execution                        | Canonical Order Path / Wave 6  |
| W5-N01…N22 prior foundations                   | Respective closed packages     |
| Retry Backoff Calculation                      | W5-N22 (consumed)              |
| Retry delay calculation                        | Deferred / N22 scope           |
| Retry scheduling                               | Deferred / N19 scope           |
| Retry execution                                | Deferred / N18 scope           |
| Retry lifecycle / timers / workers             | Deferred                       |
| Transport execution                            | Deferred / per-channel I/O     |
| Monitoring Platform / BC / HA / DR             | Deferred / MN-02               |
| Production transport I/O                       | TD-049 / TD-050 (deferred)     |
| Anthropic / AI Gateway                         | Wave 7 V3-A02                  |
| Live Trading                                   | Wave 6 + ADR                   |
| Exchange I/O                                   | Wave 4 Exchange Adapter        |
| Eligibility Engine / Retry Engine              | **Forbidden**                  |
| Scheduler / Runtime Execution / Retry Platform | **Forbidden**                  |

---

## Architecture constraints

- Preserve Master Plan, Version 2, ownership boundaries, existing bounded contexts, persistence ownership, Source of Truth ownership, Honest Product principles.
- Do **not** introduce new bounded contexts, persistence owners, Sources of Truth, duplicate subsystems, or architectural drift.
- Extend `notification-delivery` only.
- Eligibility remains a capability of notification-delivery.
- No Retry Engine. No Scheduler. No Runtime Execution.

---

## Security constraints

- Workspace Isolation; Fail Closed; Fail Honest; Vault-only credentials; no plaintext secret echo; Authorization reuse; Audit attribution where required; no Live Trading path; Verification Standard mandatory at Close.

---

## Honest Product boundaries

| Claim                          | Status from W5-N23 planning alone |
| ------------------------------ | --------------------------------- |
| Retry Backoff Calculation      | **NOT mean**                      |
| Retry delay calculation        | **NOT mean**                      |
| Scheduling retries             | **NOT mean**                      |
| Executing retries              | **NOT mean**                      |
| Successful delivery            | **NOT mean**                      |
| Provider acceptance            | **NOT mean**                      |
| Recipient receipt              | **NOT mean**                      |
| Exactly-once delivery          | **NOT mean**                      |
| Delivery guarantee             | **NOT mean**                      |
| Notification Platform COMPLETE | **NOT mean**                      |
| Live Notifications             | **NOT mean**                      |
| Production Ready               | **NOT mean**                      |
| Wave 5 COMPLETE                | **NOT mean**                      |

---

## Validation strategy

See [`w5-n23-validation-plan.md`](./w5-n23-validation-plan.md). Planning-phase gate: `git diff --check` on documentation only. Implementation validation deferred until Planning Approval and authorized slices.

---

## Package dependencies

| Dependency                       | Status                             |
| -------------------------------- | ---------------------------------- |
| Closed W5-N22 Retry Backoff Calc | **Required** — consumed            |
| Closed W5-N17…N21 foundations    | **Required** — consumed            |
| Closed W5-N01…N16 foundations    | **Required** — consumed            |
| Existing retry metadata          | **Required** — consumed            |
| Wave 3 durability / W3-O02       | **Required** — consumed            |
| PC-06 / PC-07                    | **Required** — consumed            |
| Wave 1 Vault / Wave 2 CM         | **Required** — consumed            |
| Existing Validation framework    | **Required** — consumed            |
| Planning Approval                | **Required** before implementation |
| Implementation slices            | **Deferred** — not opened          |

---

## Mandatory Questions

1. **What business problem does W5-N23 solve?** Determine whether another retry is permitted before any future scheduling or execution.
2. **Why does it follow W5-N22?** Eligibility depends on existing retry metadata and calculated backoff, but remains independent from calculation itself.
3. **What existing capabilities does it consume?** Closed W5-N01…W5-N22 and existing notification-delivery capabilities.
4. **What does W5-N23 own?** Planning for Notification Retry Eligibility only.
5. **What is explicitly OUT of scope?** Calculation, scheduling, execution, timers, workers, orchestration, transports, Monitoring, BC, HA, DR.
6. **Does Eligibility perform Retry Backoff Calculation?** No.
7. **Does Eligibility schedule retries?** No.
8. **Does Eligibility execute retries?** No.
9. **Were any ownership boundaries changed?** No.
10. **Were any architectural deviations introduced?** No.

---

**STOP.** W5-N23 Planning is **APPROVED**. Await Repository Synchronization review. Do not open W5-N23-a until after Repository Synchronization is approved. Do not begin implementation. Do NOT declare Wave 5 COMPLETE. Do NOT modify the Master Plan.
