# W5-N28 Product Scope

**Package:** W5-N28 Notification Retry Scheduling Decision Projection Publication Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N28 · CM-35
**Status:** Planning Package **APPROVED** (2026-09-13). Planning Review **PASS**. Planning Approval **RECORDED**. Repository Synchronization (Planning) **COMPLETE**. No implementation. No slices opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n28-implementation-package.md`](./w5-n28-implementation-package.md)
**Overview:** [`w5-n28-overview.md`](./w5-n28-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N28. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01…N27. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N28` is the operational package ID for Product Owner authorization **V3-N28**. This scope does not invent capabilities beyond Product Owner authorization / Wave 5 Notification Platform scope. Inventory **CM-35** is Notification Retry Scheduling Decision Projection Publication Foundation only — not Connection Management provider framework redesign, not AI Gateway, not Wave 3 MN-02 Observability product, not a Retry Engine product, not a Runtime Decision Engine product, not a Runtime Projection Engine product, not a Runtime Publication Engine product, not a Runtime Scheduler product, not a Worker product, not a Timer implementation.

---

## Product purpose

Notification Retry Scheduling Decision Projection Publication Foundation is the product package that defines how a future **governed publication** component will publish the completed Decision Projection — Closed W5-N27 Decision Projection Foundation, consuming Closed W5-N22…W5-N26 — as a canonical internal publication consumable by downstream notification-delivery capabilities on the existing Notification Delivery adapter, PC-06 routing, and PC-07 catalog. Publication remains a future capability. No runtime Decision Projection Publication is implemented by this Planning Package.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds publication foundation consumption only.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own per-channel transport I/O (N01…N04 reopen).

It does **not** own platform foundation redesign (N05…N27 reopen).

It does **not** own Anthropic / AI Gateway (Wave 7).

It does **not** own Wave 3 MN-02 Observability product.

It does **not** redesign Connection Management provider framework (inventory CM-21).

It does **not** perform Decision Projection Publication at runtime, Runtime Decision Projection, Runtime Decision Evaluation, Retry Backoff Calculation, Retry Eligibility determination, runtime scheduling, schedule retries, execute retries, own retry lifecycle, own retry workers, own retry orchestration, implement retry timers, run transports, Monitoring Platform, Business Continuity, High Availability, or Disaster Recovery.

```text
Notification Delivery owns platform decision projection publication foundation artifacts and per-channel adapters.
Vault owns all channel credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W3-O02 durable queue owns delivery work substrate.
W5-N28 owns Notification Retry Scheduling Decision Projection Publication Foundation planning outcomes (V3-N28 · CM-35).
Decision Projection Publication ≠ Runtime Decision Projection Publication.
Decision Projection Publication ≠ Runtime Decision Projection.
Decision Projection Publication ≠ Runtime Decision Evaluation.
Decision Projection Publication ≠ runtime scheduling.
Decision Projection Publication ≠ scheduling execution.
Decision Projection Publication ≠ retry execution.
Decision Projection Publication ≠ successful delivery.
Decision Projection Publication ≠ provider acceptance.
Decision Projection Publication ≠ recipient receipt.
Decision Projection Publication ≠ exactly-once delivery.
Decision Projection Publication ≠ delivery guarantee.
Decision Projection Publication ≠ Live Trading.
Foundation ≠ transport execution.
No Retry Engine. No Runtime Decision Engine. No Runtime Projection Engine.
No Runtime Publication Engine. No Runtime Scheduler. No Worker. No Timer implementation.
No Scheduler Platform. No Workflow Engine. No Event Bus. No orchestration platform.
```

---

## Business problem

The platform can already:

- calculate retry backoff (W5-N22),
- determine retry eligibility (W5-N23),
- maintain scheduling state (W5-N24),
- establish scheduling decision foundation (W5-N25),
- evaluate scheduling decisions (W5-N26),
- project evaluated scheduling decisions (W5-N27),

but there is no governed component that publishes the Decision Projection as a canonical internal publication consumable by downstream notification-delivery capabilities.

W5-N28 plans that publication capability. No runtime Decision Projection Publication is implemented by this package.

---

## Business objective

Deliver honest **Notification Retry Scheduling Decision Projection Publication Foundation** planning — and, when implemented after Approval, a deterministic governed foundation for publishing the Decision Projection as a canonical internal publication consumable by downstream notification-delivery capabilities on the existing catalog and routing product. Operators see consistent honest publication rules — not successful delivery claims from planning alone.

---

## Product outcome

Governed decision projection publication foundation coherence on `notification-delivery`: publication ownership definition, publication architecture, publication validation strategy, publication operational boundaries, and package planning — without inventing a Retry Engine, Runtime Decision Engine, Runtime Projection Engine, Runtime Publication Engine, Runtime Scheduler, Worker, Timer implementation, or control plane.

---

## What Decision Projection Publication means in Version 3 (binding)

In Version 3, **Decision Projection Publication** (W5-N28) means only the **retry scheduling decision projection publication foundation planning owned by the existing `notification-delivery` bounded context**:

| Capability                         | Meaning at W5-N28 scope                                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Publication ownership definition   | Who owns canonical published Decision Projection representation on the existing notification-delivery owner          |
| Publication architecture           | How publication sits relative to projection, evaluation, decision, scheduling, eligibility, and backoff — same owner |
| Publication validation strategy    | How Close proves publication-foundation honesty without runtime claims                                               |
| Publication operational boundaries | What publication may and must not claim operationally                                                                |
| Package planning                   | Planning Package for Product Owner Planning Review                                                                   |

**Owner:** Existing **`notification-delivery` bounded context** only. W5-N28 extends that owner. It does **not** create a new owner or bounded context.

**Decision Projection Publication is planning-only until future approved implementation slices.** It is the coherence layer that will publish the Decision Projection as a canonical internal publication consumable by downstream notification-delivery capabilities — not Runtime Decision Projection, not Runtime Decision Evaluation, not runtime scheduling, not execution, and not a trading control plane.

### Publication-only boundary (binding)

```text
Notification Retry Scheduling Decision Projection Publication performs publication planning only.
It does NOT:
- publish Decision Projection at runtime,
- perform Runtime Decision Projection,
- perform Runtime Decision Evaluation,
- schedule retries,
- execute retries,
- own retry lifecycle,
- own retry workers,
- own retry orchestration.
Publication output is informational only until consumed by future approved packages.
```

Decision Projection remains Closed W5-N27 (consumed). Decision Evaluation remains Closed W5-N26 (consumed). Scheduling Decision Foundation remains Closed W5-N25 (consumed). Scheduling Foundation remains Closed W5-N24 (consumed). Eligibility remains Closed W5-N23 (consumed). Backoff Calculation remains Closed W5-N22 (consumed). Execution remains Closed W5-N18 (consumed). Retry workers, timers implementation, and orchestration are **not** owned by W5-N28. Publication planning does not activate retries by itself.

---

## What Decision Projection Publication does NOT mean (binding)

Decision Projection Publication **does not** mean:

- Runtime Decision Projection Publication
- Runtime Decision Projection
- Runtime Decision Evaluation
- Runtime scheduling
- Scheduling execution
- Executing retries
- Owning retry lifecycle
- Owning retry workers
- Owning retry orchestration
- Owning timers implementation
- Retry queue execution
- Transport providers
- Transport execution
- Provider execution
- Successful delivery
- Provider acceptance
- Recipient receipt
- Exactly-once delivery
- Delivery guarantee

Those remain **outside W5-N28** unless explicitly implemented by later packages.

Decision Projection Publication also **does not** mean: SMTP provider behavior, Telegram provider behavior, Discord provider behavior, Slack provider behavior, Webhook provider behavior, dead-letter processing, notification routing, notification catalog, Monitoring Platform, telemetry platform, metrics platform, Business Continuity, High Availability, Disaster Recovery, Live Notifications, Production Ready, Notification Platform Complete, or Wave 5 COMPLETE.

---

## Relationship with W5-N17…W5-N27 (binding)

W5-N28 **consumes** closed packages through W5-N27. **No ownership is transferred. No previous package is redesigned.**

| Package    | Provides (closed — ownership retained on `notification-delivery` owner) |
| ---------- | ----------------------------------------------------------------------- |
| **W5-N17** | Delivery reliability foundation                                         |
| **W5-N18** | Retry execution foundation                                              |
| **W5-N19** | Retry scheduling foundation substrate                                   |
| **W5-N20** | Retry policy foundation                                                 |
| **W5-N21** | Retry backoff foundation                                                |
| **W5-N22** | Retry backoff calculation foundation                                    |
| **W5-N23** | Retry eligibility foundation                                            |
| **W5-N24** | Retry scheduling foundation                                             |
| **W5-N25** | Retry scheduling decision foundation                                    |
| **W5-N26** | Retry scheduling decision evaluation foundation                         |
| **W5-N27** | Retry scheduling decision projection foundation                         |

| W5-N28 rule                      | Binding                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------- |
| Consumes W5-N01…N27 foundations  | Reads prior foundation outputs — does not redesign or re-own prior artifacts |
| Consumes W5-N27 projection       | Reads N27 foundation outputs — does not redesign or re-own N27 artifacts     |
| Owns publication foundation plan | New publication foundation planning on same `notification-delivery` owner    |

**Why after W5-N27:** Decision Projection Publication depends on the completed Decision Projection Foundation and all preceding retry foundations. Without Closed W5-N22…W5-N27, Decision Projection Publication cannot be planned deterministically on those inputs.

---

## Scope IN

| IN                                            | Meaning                                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| Publication ownership definition (planning)   | Who owns canonical published Decision Projection representation on existing owner |
| Publication architecture (planning)           | Boundaries vs projection, evaluation, decision, scheduling, eligibility, execute  |
| Publication validation strategy (planning)    | How Close is proven without runtime claims                                        |
| Publication operational boundaries (planning) | Honest Product and operational limits                                             |
| Package planning                              | Planning Package for Product Owner Planning Review                                |
| Consumption of Closed W5-N01…N27              | Patterns and anchors only — not reopen                                            |

---

## Scope OUT

| OUT                                                                                                                                  | Status                                       |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Implementation                                                                                                                       | **OUT** until Planning Approval + slice auth |
| Implementation slices (W5-N28-a…)                                                                                                    | **OUT** — not opened, not named              |
| Runtime Decision Projection Publication                                                                                              | **OUT** — planning only                      |
| Runtime Decision Projection                                                                                                          | **OUT** — Projection is W5-N27               |
| Runtime Decision Evaluation                                                                                                          | **OUT** — Evaluation is W5-N26               |
| Runtime scheduling                                                                                                                   | **OUT** — planning only                      |
| Scheduling execution                                                                                                                 | **OUT** — publication only                   |
| Executing retries                                                                                                                    | **OUT** — publication only                   |
| Owning retry lifecycle / workers / orchestration                                                                                     | **OUT** — publication only                   |
| Retry timers implementation                                                                                                          | **OUT**                                      |
| Retry queue execution / orchestration                                                                                                | **OUT**                                      |
| Transport execution / provider I/O                                                                                                   | **OUT**                                      |
| Dead-letter processing                                                                                                               | **OUT**                                      |
| Live Notifications / Production Ready / Wave 5 COMPLETE                                                                              | **OUT**                                      |
| Notification Platform Complete                                                                                                       | **OUT**                                      |
| Retry Engine / Runtime Decision Engine / Runtime Projection Engine / Runtime Publication Engine / Runtime Scheduler / Worker / Timer | **Forbidden**                                |
| Scheduler Platform / Workflow Engine / Event Bus                                                                                     | **Forbidden**                                |
| Version 2 modification                                                                                                               | **OUT**                                      |
| Master Plan revision                                                                                                                 | **OUT**                                      |
| Ownership / bounded context / SoT changes                                                                                            | **OUT**                                      |
| W5-N01…N27 reopen                                                                                                                    | **OUT**                                      |
| Monitoring / BC / HA / DR                                                                                                            | **OUT**                                      |
| Live Trading                                                                                                                         | **OUT**                                      |

---

## Customer-visible outcomes

**After approved implementation and Close (intent):** operators can rely on governed publication ownership, architecture, validation, and operational boundaries — without inferring delivery success or that Decision Projection was published at runtime, projected at runtime, evaluated, scheduled at runtime, or executed from planning alone.

**From this planning open alone:** no customer-visible publication behaviour. No runtime. No delivery claims.

---

## Operator journey (planning intent)

1. Operator stays inside workspace and authorization.
2. After implementation (not authorized now): governed publication-foundation surfaces appear on existing notification-delivery / Platform Readiness paths.
3. Operator does **not** infer transport success, recipient receipt, Runtime Decision Projection Publication, Runtime Decision Projection, Runtime Decision Evaluation, runtime scheduling, or execution from foundation surfaces alone.
4. Operator configures channels on existing surfaces (transport I/O remains per-channel scope / deferred).

---

## Consumes

| Product                     | How this package uses it                                | Must not do                     |
| --------------------------- | ------------------------------------------------------- | ------------------------------- |
| **Authentication**          | Only signed-in operators see publication foundation     | Parallel login                  |
| **Authorization**           | Only permitted roles access publication surfaces        | New IAM                         |
| **Workspace Isolation**     | Publication state stays in workspace                    | Cross-workspace convenience     |
| **Vault**                   | Consumes vault availability; no new secret types        | Duplicate store; echo plaintext |
| **Security Platform**       | Hardening and rate-limit defaults                       | Fork platform controls          |
| **Security Audit**          | Attributable publication outcomes where required        | Own the audit store             |
| **Connection Management**   | Operator UI for all channels (consume)                  | Redesign facade ownership       |
| **Notification Delivery**   | Platform publication foundation extension               | Second engine; Retry Engine     |
| **Existing retry metadata** | Inputs to publication planning (consume)                | Redesign metadata owner         |
| **PC-06 routing**           | Routes to active transport when enabled (consume)       | Redefine routing SoT            |
| **PC-07 catalog**           | All channel surfaces (consume)                          | Invent parallel catalog         |
| **W3-O02 durable queue**    | Delivery work substrate (consume)                       | Redesign queue owner            |
| **W5-N27 projection**       | Projection foundation patterns and anchors (consume)    | Redesign N27 owner artifacts    |
| **W5-N26 evaluation**       | Evaluation foundation patterns and anchors (consume)    | Redesign N26 owner artifacts    |
| **W5-N22…N25 foundations**  | Prior retry foundation patterns and anchors (consume)   | Redesign prior owner artifacts  |
| **W5-N01…N27 foundation**   | Per-channel and platform anchors and patterns (consume) | Redesign prior owner artifacts  |
| **Platform Readiness**      | Existing readiness projections (consume)                | Fork readiness product          |
| **Validation framework**    | Existing validation patterns (consume)                  | Fork validation product         |

---

## Owns

| Outcome                                       | Customer meaning                                                           |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| Publication ownership definition (planning)   | Who owns canonical published Decision Projection representation production |
| Publication architecture (planning)           | How publication relates to projection + evaluation + decision + scheduling |
| Publication validation strategy (planning)    | How Close proves honesty without runtime claims                            |
| Publication operational boundaries (planning) | What publication may and must not claim                                    |
| Package validation strategy                   | Close Evidence chain when implemented                                      |

**Does not own a new notification product, engine, Retry Engine, Runtime Decision Engine, Runtime Projection Engine, Runtime Publication Engine, Runtime Scheduler, Worker, Timer implementation, Scheduler Platform, Workflow Engine, Event Bus, orchestration platform, Runtime Decision Projection, Runtime Decision Evaluation, runtime scheduling, scheduling execution, execution, or transport execution layer.** Notification Delivery remains transport owner.

---

## Does NOT own

| Concern                                | Real owner                     |
| -------------------------------------- | ------------------------------ |
| Secret ciphertext / encryption         | Vault                          |
| Identity / sessions                    | Authentication                 |
| Permissions (IAM)                      | Authorization                  |
| Workspace membership / isolation       | Workspace / Isolation          |
| Connection Management facade           | Connection Management (Wave 2) |
| Notification routing                   | PC-06                          |
| Notification catalog                   | PC-07                          |
| Durable queue substrate                | W3-O02 (Wave 3)                |
| Observability product                  | MN-02 (Wave 3)                 |
| Risk decisions                         | Risk Engine                    |
| Orders / live execution                | Canonical Order Path / Wave 6  |
| W5-N01…N27 prior foundations           | Respective closed packages     |
| Decision Projection                    | W5-N27 (consumed)              |
| Decision Evaluation                    | W5-N26 (consumed)              |
| Retry scheduling decision foundation   | W5-N25 (consumed)              |
| Retry scheduling foundation            | W5-N24 (consumed)              |
| Retry Eligibility                      | W5-N23 (consumed)              |
| Retry Backoff Calculation              | W5-N22 (consumed)              |
| Retry execution                        | W5-N18 (consumed) / Deferred   |
| Retry workers / timers implementation  | Deferred                       |
| Transport execution                    | Deferred / per-channel I/O     |
| Monitoring Platform / BC / HA / DR     | Deferred / MN-02               |
| Production transport I/O               | TD-049 / TD-050 (deferred)     |
| Anthropic / AI Gateway                 | Wave 7 V3-A02                  |
| Live Trading                           | Wave 6 + ADR                   |
| Exchange I/O                           | Wave 4 Exchange Adapter        |
| Retry Engine / Runtime Decision Engine | **Forbidden**                  |
| Runtime Projection Engine              | **Forbidden**                  |
| Runtime Publication Engine             | **Forbidden**                  |
| Runtime Scheduler / Worker / Timer     | **Forbidden**                  |

---

## Architecture constraints

- Preserve Master Plan, Version 2, ownership boundaries, existing bounded contexts, persistence ownership, Source of Truth ownership, Honest Product principles.
- Do **not** introduce new bounded contexts, persistence owners, Sources of Truth, duplicate subsystems, or architectural drift.
- Extend `notification-delivery` only.
- Decision Projection Publication remains a capability of notification-delivery.
- No Retry Engine. No Runtime Decision Engine. No Runtime Projection Engine. No Runtime Publication Engine. No Runtime Scheduler. No Worker. No Timer implementation.

---

## Security constraints

- Workspace Isolation; Fail Closed; Fail Honest; Vault-only credentials; no plaintext secret echo; Authorization reuse; Audit attribution where required; no Live Trading path; Verification Standard mandatory at Close.

---

## Honest Product boundaries

| Claim                                     | Status from W5-N28 planning alone |
| ----------------------------------------- | --------------------------------- |
| Decision Projection Publication (runtime) | **NOT mean**                      |
| Runtime Decision Projection               | **NOT mean**                      |
| Runtime Decision Evaluation               | **NOT mean**                      |
| Runtime scheduling                        | **NOT mean**                      |
| Scheduling execution                      | **NOT mean**                      |
| Executing retries                         | **NOT mean**                      |
| Successful delivery                       | **NOT mean**                      |
| Provider acceptance                       | **NOT mean**                      |
| Recipient receipt                         | **NOT mean**                      |
| Exactly-once delivery                     | **NOT mean**                      |
| Delivery guarantee                        | **NOT mean**                      |
| Notification Platform COMPLETE            | **NOT mean**                      |
| Live Notifications                        | **NOT mean**                      |
| Production Ready                          | **NOT mean**                      |
| Wave 5 COMPLETE                           | **NOT mean**                      |

---

## Validation strategy

See [`w5-n28-validation-plan.md`](./w5-n28-validation-plan.md). Planning-phase gate: `git diff --check` on documentation only. Implementation validation deferred until Planning Approval and authorized slices.

---

## Package dependencies

| Dependency                                         | Status                             |
| -------------------------------------------------- | ---------------------------------- |
| Closed W5-N27 Retry Scheduling Decision Projection | **Required** — consumed            |
| Closed W5-N26 Retry Scheduling Decision Evaluation | **Required** — consumed            |
| Closed W5-N25 Retry Scheduling Decision            | **Required** — consumed            |
| Closed W5-N24 Retry Scheduling                     | **Required** — consumed            |
| Closed W5-N23 Retry Eligibility                    | **Required** — consumed            |
| Closed W5-N22 Retry Backoff Calc                   | **Required** — consumed            |
| Closed W5-N01…N21 foundations                      | **Required** — consumed            |
| Existing notification-delivery                     | **Required** — consumed            |
| Existing Platform Readiness                        | **Required** — consumed            |
| Wave 3 durability / W3-O02                         | **Required** — consumed            |
| PC-06 / PC-07                                      | **Required** — consumed            |
| Wave 1 Vault / Wave 2 CM                           | **Required** — consumed            |
| Existing Validation framework                      | **Required** — consumed            |
| Planning Approval                                  | **Required** before implementation |
| Implementation slices                              | **Deferred** — not opened          |

---

## Mandatory Questions

1. **What business problem does W5-N28 solve?** Plan Notification Retry Scheduling Decision Projection Publication after the Decision Projection Foundation is complete.
2. **Why does it follow W5-N27?** Decision Projection Publication depends on the completed Decision Projection Foundation and all preceding retry foundations.
3. **What does it consume?** Closed W5-N01…W5-N27 and existing notification-delivery capabilities.
4. **What does it own?** Planning for Notification Retry Scheduling Decision Projection Publication only.
5. **What is explicitly OUT of scope?** Runtime publication, runtime Decision Projection, runtime Decision Evaluation, runtime scheduling, retry execution, Retry Engine, workers, timers, transports, monitoring, BC, HA, DR.
6. **Does it perform Decision Projection Publication?** No.
7. **Does it perform Runtime Decision Projection?** No.
8. **Does it perform Runtime Decision Evaluation?** No.
9. **Does it perform Runtime Scheduling?** No.
10. **Does it execute retries?** No.
11. **Were any ownership boundaries changed?** No.
12. **Were any architectural deviations introduced?** No.

---

**STOP.** W5-N28 Planning Package is **APPROVED**. Repository Synchronization (Planning) is **COMPLETE**. Await Product Owner Repository Review. Do **not** open W5-N28-a until Repository Synchronization has been approved. Do **not** begin implementation. Do NOT declare Wave 5 COMPLETE. Do NOT modify the Master Plan.
