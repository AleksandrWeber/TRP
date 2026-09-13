# W5-N27 Product Scope

**Package:** W5-N27 Notification Retry Scheduling Decision Projection Foundation
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N27 · CM-35
**Status:** Planning Package **APPROVED** (2026-09-13). Planning Review **PASS**. Planning Approval **RECORDED**. Repository Synchronization (Planning) **COMPLETE**. No implementation. No slices opened.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Umbrella:** [`w5-n27-implementation-package.md`](./w5-n27-implementation-package.md)
**Overview:** [`w5-n27-overview.md`](./w5-n27-overview.md)

This document freezes **IN / OUT**, **ownership**, **honesty**, **customer workflows**, **failure philosophy**, and **acceptance** for W5-N27. It does not redesign Version 2 notification domains. It does not invent a command bus. It does not reopen Wave 1–4 or W5-N01…N26. It does not revise the Master Plan. It does not introduce Live Trading. It does not claim Wave 5 COMPLETE or Notification Platform Complete.

**Naming clarity:** `W5-N27` is the operational package ID for Product Owner authorization **V3-N27**. This scope does not invent capabilities beyond Product Owner authorization / Wave 5 Notification Platform scope. Inventory **CM-35** is Notification Retry Scheduling Decision Projection Foundation only — not Connection Management provider framework redesign, not AI Gateway, not Wave 3 MN-02 Observability product, not a Retry Engine product, not a Runtime Decision Engine product, not a Runtime Projection Engine product, not a Runtime Scheduler product, not a Worker product, not a Timer implementation.

---

## Product purpose

Notification Retry Scheduling Decision Projection Foundation is the product package that defines how a future **governed projection** component will project the evaluated scheduling decision — Closed W5-N26 Retry Scheduling Decision Evaluation Foundation, consuming Closed W5-N22…W5-N25 — into a stable representation consumable by downstream notification-delivery capabilities on the existing Notification Delivery adapter, PC-06 routing, and PC-07 catalog. Projection remains a future capability. No runtime decision projection is implemented by this Planning Package.

It does **not** hold customer secrets. Vault owns credentials.

It does **not** authenticate people. Authentication owns identity and sessions.

It does **not** decide roles. Authorization owns permissions.

It does **not** own workspace membership. Workspace owns membership; Isolation proves the boundary.

It does **not** own the Connection Management facade UI product (consumes it).

It does **not** own PC-06 routing. Routing remains owner — Wave 5 adds projection foundation consumption only.

It does **not** own Risk, Orders, Ledger, or live order submission.

It does **not** own per-channel transport I/O (N01…N04 reopen).

It does **not** own platform foundation redesign (N05…N26 reopen).

It does **not** own Anthropic / AI Gateway (Wave 7).

It does **not** own Wave 3 MN-02 Observability product.

It does **not** redesign Connection Management provider framework (inventory CM-21).

It does **not** perform Retry Backoff Calculation, determine Retry Eligibility, perform Scheduling Decision Evaluation, perform Runtime Decision Projection, perform runtime scheduling, schedule retries, execute retries, own retry lifecycle, own retry workers, own retry orchestration, implement retry timers, run transports, Monitoring Platform, Business Continuity, High Availability, or Disaster Recovery.

```text
Notification Delivery owns platform decision projection foundation artifacts and per-channel adapters.
Vault owns all channel credentials.
Connection Management facade owns the operator connect product surface.
PC-06 routing owns delivery routing decisions.
W3-O02 durable queue owns delivery work substrate.
W5-N27 owns Notification Retry Scheduling Decision Projection Foundation planning outcomes (V3-N27 · CM-35).
Decision Projection ≠ Retry Backoff Calculation.
Decision Projection ≠ Retry Eligibility.
Decision Projection ≠ Scheduling Decision Evaluation.
Decision Projection ≠ Runtime Decision Projection.
Decision Projection ≠ runtime scheduling.
Decision Projection ≠ scheduling execution.
Decision Projection ≠ retry execution.
Decision Projection ≠ successful delivery.
Decision Projection ≠ provider acceptance.
Decision Projection ≠ recipient receipt.
Decision Projection ≠ exactly-once delivery.
Decision Projection ≠ delivery guarantee.
Decision Projection ≠ Live Trading.
Foundation ≠ transport execution.
No Retry Engine. No Runtime Decision Engine. No Runtime Projection Engine.
No Runtime Scheduler. No Worker. No Timer implementation.
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

but there is no governed component that projects the evaluated scheduling decision into a stable representation consumable by downstream notification-delivery capabilities.

W5-N27 plans that projection capability. No runtime decision projection is implemented by this package.

---

## Business objective

Deliver honest **Notification Retry Scheduling Decision Projection Foundation** planning — and, when implemented after Approval, a deterministic governed foundation for projecting the evaluated scheduling decision into a stable representation consumable by downstream notification-delivery capabilities on the existing catalog and routing product. Operators see consistent honest projection rules — not successful delivery claims from planning alone.

---

## Product outcome

Governed decision projection foundation coherence on `notification-delivery`: projection ownership definition, projection architecture, projection validation strategy, projection operational boundaries, and package planning — without inventing a Retry Engine, Runtime Decision Engine, Runtime Projection Engine, Runtime Scheduler, Worker, Timer implementation, or control plane.

---

## What Decision Projection means in Version 3 (binding)

In Version 3, **Decision Projection** (W5-N27) means only the **retry scheduling decision projection foundation planning owned by the existing `notification-delivery` bounded context**:

| Capability                        | Meaning at W5-N27 scope                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Projection ownership definition   | Who owns projected evaluated-decision representation on the existing notification-delivery owner                    |
| Projection architecture           | How projection sits relative to evaluation, decision, scheduling, eligibility, and backoff foundations — same owner |
| Projection validation strategy    | How Close proves projection-foundation honesty without runtime claims                                               |
| Projection operational boundaries | What projection may and must not claim operationally                                                                |
| Package planning                  | Planning Package for Product Owner Planning Review                                                                  |

**Owner:** Existing **`notification-delivery` bounded context** only. W5-N27 extends that owner. It does **not** create a new owner or bounded context.

**Decision Projection is planning-only until future approved implementation slices.** It is the coherence layer that will project the evaluated scheduling decision into a stable representation consumable by downstream notification-delivery capabilities — not delay calculation, not eligibility determination, not Scheduling Decision Evaluation, not Runtime Decision Projection, not runtime scheduling, not execution, and not a trading control plane.

### Projection-only boundary (binding)

```text
Notification Retry Scheduling Decision Projection performs projection planning only.
It does NOT:
- calculate retry backoff,
- determine retry eligibility,
- perform Scheduling Decision Evaluation,
- perform Runtime Decision Projection,
- schedule retries,
- execute retries,
- own retry lifecycle,
- own retry workers,
- own retry orchestration.
Projection output is informational only until consumed by future approved packages.
```

Backoff Calculation remains Closed W5-N22 (consumed). Eligibility remains Closed W5-N23 (consumed). Scheduling Foundation remains Closed W5-N24 (consumed). Scheduling Decision Foundation remains Closed W5-N25 (consumed). Decision Evaluation Foundation remains Closed W5-N26 (consumed). Execution remains Closed W5-N18 (consumed). Retry workers, timers implementation, and orchestration are **not** owned by W5-N27. Projection planning does not activate retries by itself.

---

## What Decision Projection does NOT mean (binding)

Decision Projection **does not** mean:

- Retry Backoff Calculation
- Retry Eligibility determination
- Scheduling Decision Evaluation
- Runtime Decision Projection
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

Those remain **outside W5-N27** unless explicitly implemented by later packages.

Decision Projection also **does not** mean: SMTP provider behavior, Telegram provider behavior, Discord provider behavior, Slack provider behavior, Webhook provider behavior, dead-letter processing, notification routing, notification catalog, Monitoring Platform, telemetry platform, metrics platform, Business Continuity, High Availability, Disaster Recovery, Live Notifications, Production Ready, Notification Platform Complete, or Wave 5 COMPLETE.

---

## Relationship with W5-N17…W5-N26 (binding)

W5-N27 **consumes** closed packages through W5-N26. **No ownership is transferred. No previous package is redesigned.**

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

| W5-N27 rule                     | Binding                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------- |
| Consumes W5-N01…N26 foundations | Reads prior foundation outputs — does not redesign or re-own prior artifacts |
| Consumes W5-N22 backoff calc    | Reads N22 foundation outputs — does not redesign or re-own N22 artifacts     |
| Consumes W5-N23 eligibility     | Reads N23 foundation outputs — does not redesign or re-own N23 artifacts     |
| Consumes W5-N24 scheduling      | Reads N24 foundation outputs — does not redesign or re-own N24 artifacts     |
| Consumes W5-N25 decision        | Reads N25 foundation outputs — does not redesign or re-own N25 artifacts     |
| Consumes W5-N26 evaluation      | Reads N26 foundation outputs — does not redesign or re-own N26 artifacts     |
| Owns projection foundation plan | New projection foundation planning on same `notification-delivery` owner     |

**Why after W5-N26:** Decision Projection depends on the completed Decision Evaluation Foundation and all preceding retry foundations. Without Closed W5-N22, Closed W5-N23, Closed W5-N24, Closed W5-N25, and Closed W5-N26, scheduling decision projection cannot be planned deterministically on those inputs.

---

## Scope IN

| IN                                           | Meaning                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| Projection ownership definition (planning)   | Who owns projected evaluated-decision representation on existing owner            |
| Projection architecture (planning)           | Boundaries vs evaluation, decision, scheduling, eligibility, calculation, execute |
| Projection validation strategy (planning)    | How Close is proven without runtime claims                                        |
| Projection operational boundaries (planning) | Honest Product and operational limits                                             |
| Package planning                             | Planning Package for Product Owner Planning Review                                |
| Consumption of Closed W5-N01…N26             | Patterns and anchors only — not reopen                                            |

---

## Scope OUT

| OUT                                                                                                     | Status                                       |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Implementation                                                                                          | **OUT** until Planning Approval + slice auth |
| Implementation slices (W5-N27-a…)                                                                       | **OUT** — not opened, not named              |
| Retry Backoff Calculation                                                                               | **OUT** — projection does not calculate      |
| Retry Eligibility determination                                                                         | **OUT** — projection does not determine      |
| Scheduling Decision Evaluation                                                                          | **OUT** — Evaluation is W5-N26               |
| Runtime Decision Projection                                                                             | **OUT** — planning only                      |
| Runtime scheduling                                                                                      | **OUT** — planning only                      |
| Scheduling execution                                                                                    | **OUT** — projection only                    |
| Executing retries                                                                                       | **OUT** — projection only                    |
| Owning retry lifecycle / workers / orchestration                                                        | **OUT** — projection only                    |
| Retry timers implementation                                                                             | **OUT**                                      |
| Retry queue execution / orchestration                                                                   | **OUT**                                      |
| Transport execution / provider I/O                                                                      | **OUT**                                      |
| Dead-letter processing                                                                                  | **OUT**                                      |
| Live Notifications / Production Ready / Wave 5 COMPLETE                                                 | **OUT**                                      |
| Notification Platform Complete                                                                          | **OUT**                                      |
| Retry Engine / Runtime Decision Engine / Runtime Projection Engine / Runtime Scheduler / Worker / Timer | **Forbidden**                                |
| Scheduler Platform / Workflow Engine / Event Bus                                                        | **Forbidden**                                |
| Version 2 modification                                                                                  | **OUT**                                      |
| Master Plan revision                                                                                    | **OUT**                                      |
| Ownership / bounded context / SoT changes                                                               | **OUT**                                      |
| W5-N01…N26 reopen                                                                                       | **OUT**                                      |
| Monitoring / BC / HA / DR                                                                               | **OUT**                                      |
| Live Trading                                                                                            | **OUT**                                      |

---

## Customer-visible outcomes

**After approved implementation and Close (intent):** operators can rely on governed projection ownership, architecture, validation, and operational boundaries — without inferring delivery success or that retries were calculated, made eligible, decided, evaluated, projected at runtime, scheduled at runtime, or executed from planning alone.

**From this planning open alone:** no customer-visible projection behaviour. No runtime. No delivery claims.

---

## Operator journey (planning intent)

1. Operator stays inside workspace and authorization.
2. After implementation (not authorized now): governed projection-foundation surfaces appear on existing notification-delivery / Platform Readiness paths.
3. Operator does **not** infer transport success, recipient receipt, delay calculation, eligibility determination, Scheduling Decision Evaluation, Runtime Decision Projection, runtime scheduling, or execution from foundation surfaces alone.
4. Operator configures channels on existing surfaces (transport I/O remains per-channel scope / deferred).

---

## Consumes

| Product                        | How this package uses it                                | Must not do                     |
| ------------------------------ | ------------------------------------------------------- | ------------------------------- |
| **Authentication**             | Only signed-in operators see projection foundation      | Parallel login                  |
| **Authorization**              | Only permitted roles access projection surfaces         | New IAM                         |
| **Workspace Isolation**        | Projection state stays in workspace                     | Cross-workspace convenience     |
| **Vault**                      | Consumes vault availability; no new secret types        | Duplicate store; echo plaintext |
| **Security Platform**          | Hardening and rate-limit defaults                       | Fork platform controls          |
| **Security Audit**             | Attributable projection outcomes where required         | Own the audit store             |
| **Connection Management**      | Operator UI for all channels (consume)                  | Redesign facade ownership       |
| **Notification Delivery**      | Platform projection foundation extension                | Second engine; Retry Engine     |
| **Existing retry metadata**    | Inputs to projection planning (consume)                 | Redesign metadata owner         |
| **PC-06 routing**              | Routes to active transport when enabled (consume)       | Redefine routing SoT            |
| **PC-07 catalog**              | All channel surfaces (consume)                          | Invent parallel catalog         |
| **W3-O02 durable queue**       | Delivery work substrate (consume)                       | Redesign queue owner            |
| **W5-N22 backoff calculation** | Calculation foundation patterns and anchors (consume)   | Redesign N22 owner artifacts    |
| **W5-N23 eligibility**         | Eligibility foundation patterns and anchors (consume)   | Redesign N23 owner artifacts    |
| **W5-N24 scheduling**          | Scheduling foundation patterns and anchors (consume)    | Redesign N24 owner artifacts    |
| **W5-N25 decision**            | Decision foundation patterns and anchors (consume)      | Redesign N25 owner artifacts    |
| **W5-N26 evaluation**          | Evaluation foundation patterns and anchors (consume)    | Redesign N26 owner artifacts    |
| **W5-N01…N26 foundation**      | Per-channel and platform anchors and patterns (consume) | Redesign prior owner artifacts  |
| **Platform Readiness**         | Existing readiness projections (consume)                | Fork readiness product          |
| **Validation framework**       | Existing validation patterns (consume)                  | Fork validation product         |

---

## Owns

| Outcome                                      | Customer meaning                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| Projection ownership definition (planning)   | Who owns projected evaluated-decision representation production            |
| Projection architecture (planning)           | How projection relates to evaluation + decision + scheduling + eligibility |
| Projection validation strategy (planning)    | How Close proves honesty without runtime claims                            |
| Projection operational boundaries (planning) | What projection may and must not claim                                     |
| Package validation strategy                  | Close Evidence chain when implemented                                      |

**Does not own a new notification product, engine, Retry Engine, Runtime Decision Engine, Runtime Projection Engine, Runtime Scheduler, Worker, Timer implementation, Scheduler Platform, Workflow Engine, Event Bus, orchestration platform, delay calculation, eligibility determination, Scheduling Decision Evaluation, Runtime Decision Projection, runtime scheduling, scheduling execution, execution, or transport execution layer.** Notification Delivery remains transport owner.

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
| W5-N01…N26 prior foundations           | Respective closed packages     |
| Retry Backoff Calculation              | W5-N22 (consumed)              |
| Retry Eligibility                      | W5-N23 (consumed)              |
| Retry scheduling foundation            | W5-N24 (consumed)              |
| Retry scheduling decision foundation   | W5-N25 (consumed)              |
| Retry scheduling decision evaluation   | W5-N26 (consumed)              |
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
| Runtime Scheduler / Worker / Timer     | **Forbidden**                  |

---

## Architecture constraints

- Preserve Master Plan, Version 2, ownership boundaries, existing bounded contexts, persistence ownership, Source of Truth ownership, Honest Product principles.
- Do **not** introduce new bounded contexts, persistence owners, Sources of Truth, duplicate subsystems, or architectural drift.
- Extend `notification-delivery` only.
- Decision Projection remains a capability of notification-delivery.
- No Retry Engine. No Runtime Decision Engine. No Runtime Projection Engine. No Runtime Scheduler. No Worker. No Timer implementation.

---

## Security constraints

- Workspace Isolation; Fail Closed; Fail Honest; Vault-only credentials; no plaintext secret echo; Authorization reuse; Audit attribution where required; no Live Trading path; Verification Standard mandatory at Close.

---

## Honest Product boundaries

| Claim                          | Status from W5-N27 planning alone |
| ------------------------------ | --------------------------------- |
| Retry Backoff Calculation      | **NOT mean**                      |
| Retry Eligibility              | **NOT mean**                      |
| Scheduling Decision Evaluation | **NOT mean**                      |
| Runtime Decision Projection    | **NOT mean**                      |
| Runtime scheduling             | **NOT mean**                      |
| Scheduling execution           | **NOT mean**                      |
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

See [`w5-n27-validation-plan.md`](./w5-n27-validation-plan.md). Planning-phase gate: `git diff --check` on documentation only. Implementation validation deferred until Planning Approval and authorized slices.

---

## Package dependencies

| Dependency                                         | Status                             |
| -------------------------------------------------- | ---------------------------------- |
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

1. **What business problem does W5-N27 solve?** Plan Notification Retry Scheduling Decision Projection after the Decision Evaluation Foundation is complete.
2. **Why does it follow W5-N26?** Decision Projection depends on the completed Decision Evaluation Foundation and all preceding retry foundations.
3. **What does it consume?** Closed W5-N01…W5-N26 and existing notification-delivery capabilities.
4. **What does it own?** Planning for Notification Retry Scheduling Decision Projection only.
5. **What is explicitly OUT of scope?** Runtime decision projection, runtime decision evaluation, runtime scheduling, retry execution, Retry Engine, workers, timers, transports, monitoring, BC, HA, DR.
6. **Does it perform Retry Backoff Calculation?** No.
7. **Does it determine Retry Eligibility?** No.
8. **Does it perform Scheduling Decision Evaluation?** No.
9. **Does it perform Runtime Decision Projection?** No.
10. **Does it perform Runtime Scheduling?** No.
11. **Does it execute retries?** No.
12. **Were any ownership boundaries changed?** No.
13. **Were any architectural deviations introduced?** No.

---

**STOP.** W5-N27 Planning Package is **APPROVED**. Repository Synchronization (Planning) is **COMPLETE**. Await Product Owner Repository Review. Do not open W5-N27-a until Repository Synchronization has been approved. Do not begin implementation. Do NOT declare Wave 5 COMPLETE. Do NOT modify the Master Plan.
