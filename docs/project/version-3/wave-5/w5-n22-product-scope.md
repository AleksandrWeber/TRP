# W5-N22 Product Scope

**Package:** W5-N22 Notification Retry Backoff Calculation Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N22 · CM-32
**Status:** Planning **APPROVED** (2026-09-12). Planning Clarification **COMPLETE**. No implementation. No slices opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n22-implementation-package.md`](./w5-n22-implementation-package.md)
**Overview:** [`w5-n22-overview.md`](./w5-n22-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N22. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01…N21. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N22` is the operational package ID for Product Owner authorization **V3-N22**. This scope does not invent capabilities beyond Product Owner authorization / Wave 5 Notification Platform scope. Inventory **CM-32** is Notification Retry Backoff Calculation Foundation only — not Connection Management provider framework redesign, not AI Gateway, not Wave 3 MN-02 Observability product, not a Backoff Engine product, not a Calculation Engine product, not a Retry Platform, not a Workflow Engine, not an Event Bus product, not an orchestration platform.

---

## Product purpose

Notification Retry Backoff Calculation Foundation is the product package that defines how **governed backoff calculation integrity** is inventoried, persisted, recovered, and displayed on the existing Notification Delivery adapter, PC-06 routing, and PC-07 catalog — building on Closed W5-N21 Retry Backoff Foundation and Closed W5-N17…N20 reliability-through-policy foundations into a coherent backoff calculation foundation layer that describes how backoff delay derivation rules are represented, persisted, recovered, and operationally validated when implemented.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds backoff calculation foundation consumption only.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own per-channel transport I/O (N01…N04 reopen).

It does **not** own platform foundation redesign (N05…N21 reopen).

It does **not** own Anthropic / AI Gateway (Wave 7).

It does **not** own Wave 3 MN-02 Observability product.

It does **not** redesign Connection Management provider framework (inventory CM-21).

It does **not** implement backoff calculation runtime, exponential/linear algorithm execution, retry policy evaluation, retry scheduler runtime, retry execution runtime, transport execution, SMTP/Telegram/Discord/Slack/Webhook provider behavior, dead-letter processing, monitoring platform, telemetry platform, metrics platform, Business Continuity, High Availability, or Disaster Recovery.

```text
Notification Delivery owns platform backoff calculation foundation artifacts and per-channel adapters.
Vault owns all channel credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W3-O02 durable queue owns delivery work substrate.
W5-N22 owns Notification Retry Backoff Calculation Foundation outcomes (V3-N22 · CM-32).
Backoff Calculation Foundation ≠ backoff calculation runtime.
Backoff Calculation Foundation ≠ exponential backoff algorithm execution.
Backoff Calculation Foundation ≠ linear backoff algorithm execution.
Backoff Calculation Foundation ≠ retry policy evaluation.
Backoff Calculation Foundation ≠ retry scheduler runtime.
Backoff Calculation Foundation ≠ retry execution runtime.
Backoff Calculation Foundation ≠ successful delivery.
Backoff Calculation Foundation ≠ provider acceptance.
Backoff Calculation Foundation ≠ recipient receipt.
Backoff Calculation Foundation ≠ exactly-once delivery.
Backoff Calculation Foundation ≠ delivery guarantee.
Backoff Calculation Foundation ≠ Live Trading.
Foundation ≠ transport execution.
No Backoff Engine. No Calculation Engine. No Retry Platform. No Workflow Engine. No Event Bus. No orchestration platform.
```

---

## Business problem

W5-N17 established Delivery Reliability Foundation. W5-N18 established Retry Execution Foundation. W5-N19 established Retry Scheduling Foundation. W5-N20 established Retry Policy Foundation. W5-N21 established Retry Backoff Foundation — how retry delays are represented, persisted, recovered, and operationally validated.

However, the platform still has no governed **Retry Backoff Calculation Foundation** describing how backoff delay derivation rules are represented, persisted, recovered, and operationally validated. Operators lack deterministic backoff-calculation representation on the existing notification-delivery owner. TD-049 / TD-050 remain deferred.

---

## Business objective

Deliver honest **Notification Retry Backoff Calculation Foundation** planning — and, when implemented after Approval, a deterministic governed calculation-representation foundation on the existing catalog and routing product. Operators see consistent honest backoff-calculation rules — not successful delivery claims from planning alone.

---

## Product outcome

Governed backoff calculation foundation coherence on `notification-delivery`: calculation inventory, calculation persistence strategy, calculation recovery strategy, operational continuity for backoff calculation, and package planning — without inventing a Calculation Engine, Backoff Engine, Retry Platform, or control plane.

---

## What Backoff Calculation means in Version 3 (binding)

In Version 3, **Backoff Calculation** means only the **retry backoff calculation foundation capabilities owned by the existing `notification-delivery` bounded context**:

| Capability                             | Meaning at W5-N22 scope                                                                               |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Calculation inventory                  | Enumeration of backoff calculation surfaces; SURVIVE/EPHEMERAL; honesty rules                         |
| Calculation persistence strategy       | Deterministic durable anchors for how backoff delay derivation rules are represented and owned        |
| Calculation recovery strategy          | Hydration of backoff calculation state after normal API restart on the same owner                     |
| Operational continuity for calculation | Honest Platform Readiness projection for backoff calculation on existing operational continuity owner |
| Honest backoff-calculation rules       | Consistent platform-wide backoff-calculation semantics — foundation evidence only                     |

**Owner:** Existing **`notification-delivery` bounded context** only. W5-N22 extends that owner. It does **not** create a new owner or bounded context.

**Backoff Calculation is foundation-only.** It is the coherence layer that describes how backoff delay derivation rules are represented, persisted, recovered, and operationally validated on durable backoff, policy, scheduling, and execution inputs — not runtime calculation, not algorithm execution, not transport success, and not a trading control plane.

### Calculation-only boundary (binding — Product Owner clarification 2026-09-12)

```text
Notification Retry Backoff Calculation performs calculation only.
It does NOT:
- schedule retries,
- execute retries,
- own retry lifecycle,
- own timers,
- own workers,
- own retry orchestration.
Calculation output is informational until consumed by future approved packages.
```

Scheduling remains Closed W5-N19 (consumed). Execution remains Closed W5-N18 (consumed). Retry lifecycle, timers, workers, and retry orchestration are **not** owned by W5-N22. Calculation output does not activate retries by itself.

---

## What Backoff Calculation does NOT mean (binding)

Backoff Calculation **does not** mean:

- Backoff calculation runtime
- Exponential backoff algorithm execution
- Linear backoff algorithm execution
- Retry policy evaluation
- Retry scheduler runtime
- Retry execution runtime
- Scheduling retries
- Executing retries
- Owning retry lifecycle
- Owning timers
- Owning workers
- Owning retry orchestration
- Transport execution
- Provider execution
- Successful delivery
- Provider acceptance
- Recipient receipt
- Exactly-once delivery
- Delivery guarantee

Those remain **outside W5-N22** unless explicitly implemented by later packages.

Backoff Calculation also **does not** mean: SMTP provider behavior, Telegram provider behavior, Discord provider behavior, Slack provider behavior, Webhook provider behavior, dead-letter processing, notification routing, notification catalog, monitoring platform, telemetry platform, metrics platform, Business Continuity, High Availability, Disaster Recovery, Live Notifications, Production Ready, Notification Platform Complete, or Wave 5 COMPLETE.

---

## Relationship with W5-N17…W5-N21 (binding)

W5-N22 **consumes** all five closed packages. **No ownership is transferred. No previous package is redesigned.**

| Package    | Provides (closed — ownership retained on `notification-delivery` owner)                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **W5-N17** | Cross-channel **delivery reliability foundation**: inventory, durable persistence, restart recovery, operational continuity, Close Evidence |
| **W5-N18** | Cross-channel **retry execution foundation**: inventory, durable persistence, restart recovery, operational continuity, Close Evidence      |
| **W5-N19** | Cross-channel **retry scheduling foundation**: inventory, durable persistence, restart recovery, operational continuity, Close Evidence     |
| **W5-N20** | Cross-channel **retry policy foundation**: inventory, durable persistence, restart recovery, operational continuity, Close Evidence         |
| **W5-N21** | Cross-channel **retry backoff foundation**: inventory, durable persistence, restart recovery, operational continuity, Close Evidence        |

| W5-N22 rule                         | Binding                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| Consumes W5-N17…N20 foundations     | Reads prior foundation outputs — does not redesign or re-own prior artifacts   |
| Consumes W5-N21 retry backoff       | Reads N21 foundation outputs — does not redesign or re-own N21 artifacts       |
| Owns backoff calculation foundation | New backoff calculation foundation layer on same `notification-delivery` owner |

**Why after W5-N21:** Backoff Calculation builds upon the inventory, persistence, recovery, operational continuity, and Retry Backoff foundation established by W5-N21. Without Retry Backoff Foundation, delay-derivation rules cannot be planned deterministically on durable backoff-representation inputs.

---

## Scope IN

| IN                                                               | Meaning                                                   |
| ---------------------------------------------------------------- | --------------------------------------------------------- |
| Backoff calculation inventory (planning)                         | Enumerate calculation surfaces; honesty baseline          |
| Calculation persistence strategy (planning)                      | Durable delay-derivation representation on existing owner |
| Calculation recovery strategy (planning)                         | Restart-safe hydration on existing owner                  |
| Operational continuity for backoff calculation (planning)        | Honest Platform Readiness projection intent               |
| Package planning / validation strategy                           | Planning Package for Product Owner Planning Review        |
| Workspace-scoped calculation-foundation state (post-impl intent) | Isolation preserved                                       |
| Consumption of Closed W5-N01…N21                                 | Patterns and anchors only — not reopen                    |

---

## Scope OUT

| OUT                                                       | Status                                       |
| --------------------------------------------------------- | -------------------------------------------- |
| Implementation                                            | **OUT** until Planning Approval + slice auth |
| Implementation slices (W5-N22-a…)                         | **OUT** — not opened, not named              |
| Backoff calculation runtime                               | **OUT**                                      |
| Scheduling retries                                        | **OUT** — calculation only                   |
| Executing retries                                         | **OUT** — calculation only                   |
| Owning retry lifecycle / timers / workers / orchestration | **OUT** — calculation only                   |
| Exponential / linear algorithm execution                  | **OUT**                                      |
| Retry policy evaluation                                   | **OUT**                                      |
| Retry scheduler / execution runtime                       | **OUT**                                      |
| Transport execution / provider I/O                        | **OUT**                                      |
| Dead-letter processing                                    | **OUT**                                      |
| Live Notifications / Production Ready / Wave 5 COMPLETE   | **OUT**                                      |
| Notification Platform Complete                            | **OUT**                                      |
| Backoff Engine / Calculation Engine / Retry Platform      | **Forbidden**                                |
| Workflow Engine / Event Bus / orchestration               | **Forbidden**                                |
| Version 2 modification                                    | **OUT**                                      |
| Master Plan revision                                      | **OUT**                                      |
| Ownership / bounded context / SoT changes                 | **OUT**                                      |
| W5-N01…N21 reopen                                         | **OUT**                                      |
| Monitoring / BC / HA / DR                                 | **OUT**                                      |
| Live Trading                                              | **OUT**                                      |

---

## Customer-visible outcomes

**After approved implementation and Close (intent):** operators can rely on governed backoff calculation inventory, persistence, restart-safe recovery, and honest Platform Readiness for backoff calculation — without inferring delivery success.

**From this planning open alone:** no customer-visible calculation behaviour. No runtime. No delivery claims.

---

## Operator journey (planning intent)

1. Operator stays inside workspace and authorization.
2. After implementation (not authorized now): governed calculation-foundation surfaces appear on existing notification-delivery / Platform Readiness paths.
3. Operator does **not** infer transport success, recipient receipt, or live delay calculation from foundation surfaces alone.
4. Operator configures channels on existing surfaces (transport I/O remains per-channel scope / deferred).

---

## Consumes

| Product                    | How this package uses it                                  | Must not do                       |
| -------------------------- | --------------------------------------------------------- | --------------------------------- |
| **Authentication**         | Only signed-in operators see calculation foundation       | Parallel login                    |
| **Authorization**          | Only permitted roles access calculation surfaces          | New IAM                           |
| **Workspace Isolation**    | Calculation state stays in workspace                      | Cross-workspace convenience       |
| **Vault**                  | Consumes vault availability; no new secret types          | Duplicate store; echo plaintext   |
| **Security Platform**      | Hardening and rate-limit defaults                         | Fork platform controls            |
| **Security Audit**         | Attributable calculation outcomes where required          | Own the audit store               |
| **Connection Management**  | Operator UI for all channels (consume)                    | Redesign facade ownership         |
| **Notification Delivery**  | Platform backoff calculation foundation extension         | Second engine; Calculation Engine |
| **PC-06 routing**          | Routes to active transport when enabled (consume)         | Redefine routing SoT              |
| **PC-07 catalog**          | All channel surfaces (consume)                            | Invent parallel catalog           |
| **W3-O02 durable queue**   | Delivery work substrate (consume)                         | Redesign queue owner              |
| **W5-N17…N20 foundations** | Reliability-through-policy patterns and anchors (consume) | Redesign prior owner artifacts    |
| **W5-N21 retry backoff**   | Retry backoff foundation patterns and anchors (consume)   | Redesign N21 owner artifacts      |
| **W5-N01…N21 foundation**  | Per-channel and platform anchors and patterns (consume)   | Redesign prior owner artifacts    |

---

## Owns

| Outcome                                                     | Customer meaning                                                        |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Backoff calculation inventory & honesty baseline (planning) | Honest unified calculation vs per-channel surfaces                      |
| Calculation persistence strategy (planning)                 | Deterministic durable delay-derivation representation on existing owner |
| Calculation recovery strategy (planning)                    | Calculation state survives restart (when implemented)                   |
| Calculation operational continuity foundation (planning)    | Platform Readiness projection for backoff calculation                   |
| Cross-channel honest backoff-calculation rules (post-impl)  | Consistent calculation semantics at foundation scope                    |
| Workspace-scoped calculation state (post-impl)              | Operator-visible calculation-foundation truth                           |
| Package validation strategy                                 | Close Evidence chain when implemented                                   |

**Does not own a new notification product, engine, Backoff Engine, Calculation Engine, Retry Platform, Workflow Engine, Event Bus, orchestration platform, calculation runtime, or transport execution layer.** Notification Delivery remains transport owner.

---

## Does NOT own

| Concern                                      | Real owner                     |
| -------------------------------------------- | ------------------------------ |
| Secret ciphertext / encryption               | Vault                          |
| Identity / sessions                          | Authentication                 |
| Permissions (IAM)                            | Authorization                  |
| Workspace membership / isolation             | Workspace / Isolation          |
| Connection Management facade                 | Connection Management (Wave 2) |
| Notification routing                         | PC-06                          |
| Notification catalog                         | PC-07                          |
| Durable queue substrate                      | W3-O02 (Wave 3)                |
| Observability product                        | MN-02 (Wave 3)                 |
| Risk decisions                               | Risk Engine                    |
| Orders / live execution                      | Canonical Order Path / Wave 6  |
| W5-N01…N21 prior foundations                 | Respective closed packages     |
| Backoff calculation runtime                  | Deferred / post-foundation     |
| Exponential / linear algorithms              | Deferred                       |
| Retry policy evaluation                      | Deferred / N20 scope           |
| Retry scheduler runtime                      | Deferred / N19 scope           |
| Retry execution runtime                      | Deferred / post-foundation     |
| Transport execution                          | Deferred / per-channel I/O     |
| Dead-letter processing                       | Deferred post-foundation       |
| Monitoring / telemetry / metrics             | Deferred / MN-02               |
| Business Continuity / HA / DR                | Deferred                       |
| Production transport I/O                     | TD-049 / TD-050 (deferred)     |
| Anthropic / AI Gateway                       | Wave 7 V3-A02                  |
| Live Trading                                 | Wave 6 + ADR                   |
| Exchange I/O                                 | Wave 4 Exchange Adapter        |
| Backoff Engine / Calculation Engine          | **Forbidden**                  |
| Retry Platform / Workflow Engine / Event Bus | **Forbidden**                  |

---

## Architecture constraints

- Preserve Master Plan, Version 2, ownership boundaries, existing bounded contexts, persistence ownership, Source of Truth ownership, Honest Product principles.
- Do **not** introduce new bounded contexts, persistence owners, Sources of Truth, duplicate subsystems, or architectural drift.
- Extend `notification-delivery` only.

---

## Security constraints

- Workspace Isolation; Fail Closed; Fail Honest; Vault-only credentials; no plaintext secret echo; Authorization reuse; Audit attribution where required; no Live Trading path; Verification Standard mandatory at Close.

---

## Honest Product boundaries

| Claim                          | Status from W5-N22 planning alone |
| ------------------------------ | --------------------------------- |
| Backoff calculation runtime    | **NOT mean**                      |
| Exponential / linear execution | **NOT mean**                      |
| Retry policy evaluation        | **NOT mean**                      |
| Retry scheduler runtime        | **NOT mean**                      |
| Retry execution runtime        | **NOT mean**                      |
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

See [`w5-n22-validation-plan.md`](./w5-n22-validation-plan.md). Planning-phase gate: `git diff --check` on documentation only. Implementation validation deferred until Planning Approval and authorized slices.

---

## Package dependencies

| Dependency                    | Status                             |
| ----------------------------- | ---------------------------------- |
| Closed W5-N21 Retry Backoff   | **Required** — consumed            |
| Closed W5-N17…N20 foundations | **Required** — consumed            |
| Closed W5-N01…N16 foundations | **Required** — consumed            |
| Wave 3 durability / W3-O02    | **Required** — consumed            |
| PC-06 / PC-07                 | **Required** — consumed            |
| Wave 1 Vault / Wave 2 CM      | **Required** — consumed            |
| Planning Approval             | **Required** before implementation |
| Implementation slices         | **Deferred** — not opened          |

---

## Mandatory Questions

1. **What business problem does W5-N22 solve?** Provide the governed Retry Backoff Calculation Foundation on the existing notification-delivery owner.
2. **Why is W5-N22 sequenced after W5-N21?** Backoff Calculation builds upon the inventory, persistence, recovery, operational continuity, and Retry Backoff foundation established by W5-N21.
3. **Which completed packages does W5-N22 consume?** Closed W5-N21 and all prior notification foundations (Closed W5-N01…W5-N20), Wave 3 durability foundation, existing notification-delivery owner, existing routing, existing notification catalog.
4. **What does W5-N22 own?** Backoff Calculation Foundation planning only — calculation inventory, calculation persistence strategy, calculation recovery strategy, operational continuity for backoff calculation, and package planning.
5. **What is explicitly OUT of scope?** Implementation; implementation slices; calculation runtime; exponential/linear algorithm execution; policy evaluation; scheduling/execution runtime; transport; Live Notifications; Production Ready; Wave 5 COMPLETE; Monitoring; BC/HA/DR; architecture redesign; Backoff Engine / Calculation Engine / Retry Platform / Workflow Engine / Event Bus / orchestration platform; Version 2 changes; ownership changes; architectural changes.
6. **Does W5-N22 modify Version 2?** No.
7. **Does W5-N22 modify previous Wave 5 packages?** No.
8. **Does W5-N22 introduce ownership or architectural changes?** No.

---

**STOP.** W5-N22 Planning is **APPROVED**. Planning Clarification is **COMPLETE**. Do not open W5-N22-a until Product Owner authorizes the slice. Do not begin implementation. Do NOT declare Wave 5 COMPLETE. Do NOT modify the Master Plan.
