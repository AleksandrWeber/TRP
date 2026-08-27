# W3-O02 Validation Plan

**Package:** W3-O02 Notification Durable Queue
**Wave:** 3 — Durability, Operations & Continuity
**Master Plan / Roadmap:** V3-O02 · NT-02 · TD-045
**Status:** Planning **APPROVED**. Implementation complete for slices a–e. **W3-O02-a…e COMPLETE** (Close Evidence). Package **not declared CLOSED** — awaiting Product Owner Package Review.
**Date:** 2026-08-27
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w3-o02-product-scope.md`](./w3-o02-product-scope.md)
**Security:** [`w3-o02-security-review.md`](./w3-o02-security-review.md)
**Umbrella:** [`w3-o02-implementation-package.md`](./w3-o02-implementation-package.md)
**Overview:** [`notification-durable-queue-overview.md`](./notification-durable-queue-overview.md)
**Inventory (a):** [`w3-o02-a-notification-queue-inventory.md`](./w3-o02-a-notification-queue-inventory.md)
**Persistence (b):** [`w3-o02-b-implementation-report.md`](./w3-o02-b-implementation-report.md)
**Recovery (c):** [`w3-o02-c-implementation-report.md`](./w3-o02-c-implementation-report.md)
**Continuity (d):** [`w3-o02-d-implementation-report.md`](./w3-o02-d-implementation-report.md)
**Close Evidence (e):** [`w3-o02-e-validation-report.md`](./w3-o02-e-validation-report.md) · [`w3-o02-close-package-report.md`](./w3-o02-close-package-report.md)
**Wave durability:** [`durability-overview.md`](./durability-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a helper wrote a queue row without proving in-flight delivery work still exists after API restart) do **not** count as Close evidence.

Do not validate US295 Complete (O03), Kill Switch product (O04), Monitoring product (O05), Live Trading, Wave 4 venue I/O, or Wave 5 production transports. Validate **Notification Durable Queue** product outcomes only.

Do not treat W3-O01 DeliveryResult **history** survival as proof of W3-O02 queue durability.

### Slice progress

| Slice    | Name                                                              | Validation record                                                                 |
| -------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| W3-O02-a | Notification queue inventory & honesty baseline                   | **COMPLETE** — [`w3-o02-a-validation-report.md`](./w3-o02-a-validation-report.md) |
| W3-O02-b | Durable queue persistence on existing notification-delivery owner | **COMPLETE** — [`w3-o02-b-validation-report.md`](./w3-o02-b-validation-report.md) |
| W3-O02-c | Restart-survival proof for in-flight delivery                     | **COMPLETE** — [`w3-o02-c-validation-report.md`](./w3-o02-c-validation-report.md) |
| W3-O02-d | Degraded delivery honesty & continuity alignment                  | **COMPLETE** — [`w3-o02-d-validation-report.md`](./w3-o02-d-validation-report.md) |
| W3-O02-e | Package Validation, Operational Verification & Close Evidence     | **COMPLETE** — [`w3-o02-e-validation-report.md`](./w3-o02-e-validation-report.md) |

---

## 0. What Close means for W3-O02

| Gate                | Meaning                                                         | Unlocks                                  |
| ------------------- | --------------------------------------------------------------- | ---------------------------------------- |
| **W3-O02 Closed**   | Notification Durable Queue outcomes evidenced; walkthrough PASS | TD-045 residual closed for package scope |
| **Wave 3 COMPLETE** | Not claimed from O02 alone                                      | Requires O01…O05 + PO declaration        |
| **Not claimed**     | Production restart-safety Complete                              | V3-O03 among other exits                 |
| **Not claimed**     | Wave 5 Notification Platform Complete                           | V3-N01…N04                               |
| **Not claimed**     | Monitoring product                                              | V3-O05                                   |
| **Not claimed**     | Kill Switch product                                             | V3-O04                                   |
| **Not claimed**     | Live Trading                                                    | Wave 6 / Order Path                      |
| **Not claimed**     | Queue durable from W3-O02-a alone                               | Requires W3-O02-b/c                      |
| **Not claimed**     | Restart survival from W3-O02-b alone                            | Requires W3-O02-c                        |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| Unit validation               | Queue classification; status integrity; secret non-echo; TD-045 ≠ TD-035 |
| Integration validation        | Persist on existing ports; restart survival; cross-workspace deny        |
| UI validation                 | Honest pending / failure; no dishonest Complete claims                   |
| Regression validation         | Wave 1 + Wave 2 + W3-O01 security and product boundaries                 |
| Product walkthrough           | Notification Durable Queue Walkthrough executed in product               |
| Architecture validation       | No ownership drift; no second Lake/Outbox; no new bounded context        |
| Security validation           | Verification Standard + isolation + authz + fail closed                  |
| Package acceptance validation | Acceptance criteria table; Close checklist                               |

---

## 2. Unit validation

| Area                   | Must prove                                                    |
| ---------------------- | ------------------------------------------------------------- |
| Queue inventory class  | In-flight / pending / retry vs history vs transport vs Outbox |
| Status integrity       | Client cannot set “delivered” / “survived”                    |
| Secret non-echo        | Responses, logs, and errors never include secrets             |
| Workspace binding      | Missing/wrong workspace fails closed                          |
| No capital side effect | Queue helpers never invoke live order placement               |
| No second SoT helpers  | No parallel Lake/Outbox invent helpers; TD-045 ≠ TD-035       |

### W3-O02-a unit focus — **COMPLETE**

| Area                    | Must prove                                                                     | Result |
| ----------------------- | ------------------------------------------------------------------------------ | ------ |
| Inventory completeness  | Every required queue surface appears; ids unique                               | PASS   |
| Ownership consistency   | Exactly one allowed existing owner (notification-delivery) per queue surface   | PASS   |
| Distinction consistency | Queue ≠ DeliveryResult history; queue ≠ paper Outbox; queue ≠ Wave 5 transport | PASS   |

Evidence: `apps/api/src/platform-conformance/w3-o02-a-notification-queue-inventory.spec.ts`

### W3-O02-b unit focus — **COMPLETE**

| Area                | Must prove                                                       | Result |
| ------------------- | ---------------------------------------------------------------- | ------ |
| Queue persistence   | DurableNotificationStore write-through of queue items            | PASS   |
| Workspace isolation | Cross-workspace queue list empty / fail-closed missing workspace | PASS   |
| Ownership           | Queue owner remains notification-delivery                        | PASS   |
| Serialization       | Round-trip export/import; no Outbox vocabulary                   | PASS   |

Evidence: `apps/api/src/platform-conformance/w3-o02-b-durable-queue-persistence.spec.ts`

### W3-O02-c unit focus — **COMPLETE**

| Area                 | Must prove                                    | Result |
| -------------------- | --------------------------------------------- | ------ |
| Recovery ordering    | Deterministic createdAt / queueItemId order   | PASS   |
| Recovery integrity   | Corrupt queue fails; missing stays empty      | PASS   |
| Recovery idempotency | Re-hydrate yields same queue state            | PASS   |
| Queue hydration      | Open statuses restore after new-store hydrate | PASS   |
| Workspace isolation  | Cross-workspace deny after recovery           | PASS   |

Evidence: `apps/api/src/platform-conformance/w3-o02-c-restart-recovery.spec.ts`

### W3-O02-d unit focus — **COMPLETE**

| Area                  | Must prove                                                              | Result |
| --------------------- | ----------------------------------------------------------------------- | ------ |
| State derivation      | Recovering / Ready / Degraded / Unavailable only; Ready never hardcoded | PASS   |
| Graceful degradation  | Channel-down / abandoned → Degraded; does not fabricate Ready           | PASS   |
| Dependency evaluation | Healthy notification-delivery continues while other owners degraded     | PASS   |
| Recovery verification | Integrity required before Ready; corrupt/failed → Unavailable           | PASS   |
| Workspace isolation   | Continuity diagnostics remain workspace-bound                           | PASS   |

Evidence: `apps/api/src/platform-conformance/w3-o02-d-operational-continuity.spec.ts`

### W3-O02-e unit focus — **COMPLETE**

| Area                    | Must prove                                        | Result |
| ----------------------- | ------------------------------------------------- | ------ |
| Slice roll-up           | a–d PASS; e evidence registry present             | PASS   |
| Architecture non-claims | No second Queue/Outbox; no Close self-declaration | PASS   |
| Transition safety       | V2 / Wave 1 / Wave 2 / ownership unchanged        | PASS   |
| Required reports        | Close evidence report set present on disk         | PASS   |

Evidence: `apps/api/src/platform-conformance/w3-o02-e-close-evidence.spec.ts`

---

## 3. Integration validation

| Area                          | Must prove                                                         |
| ----------------------------- | ------------------------------------------------------------------ |
| Persist on existing aggregate | Uses existing notification-delivery ports — not a new store domain |
| Restart survival              | After API restart, in-scope in-flight work remains / resumes       |
| Honest failure                | Incomplete delivery never claimed delivered                        |
| No silent drop without record | Missing work leaves durable honest record                          |
| Cross-workspace deny          | Workspace A cannot read Workspace B delivery / queue               |
| Authz deny                    | Unauthorized role cannot access                                    |
| W3-O01 untouched as redesign  | Analytical store outcomes not reopened                             |
| Outbox/Lake unchanged as SoT  | No second Outbox / Lake; no merge with TD-035                      |

### W3-O02-a integration note

Inventory-only: evidence paths on disk, required reports present, architecture claims frozen. Persist / restart survival deferred to W3-O02-b/c.

### W3-O02-b integration note — **COMPLETE for persistence**

Persist queue item on existing owner snapshot; workspace isolation; persistence integrity via deliver(); restart **preparation** (load persisted snapshot in new store instance) — **not** restart-survival product claim. Restart survival deferred to W3-O02-c.

### W3-O02-c integration note — **COMPLETE for recovery**

Recover persisted open queue after normal restart (new store + hydrate); idempotent re-hydrate; missing empty (no fabrication); corrupt fails honestly; workspace isolation preserved. Retry execution still out.

### W3-O02-d integration note — **COMPLETE for continuity**

Recovered queue projects Ready after integrity verification; unavailable/corrupt path projects Unavailable; channel-down / abandoned project Degraded; Platform readiness exposes limited queue continuity fields. Retry execution still out.

### W3-O02-e integration note — **COMPLETE for Close Evidence**

Package journey walkthrough evidenced (persist → restart → recover → derive readiness → Platform operational). No new runtime capability. Package **not** declared CLOSED by e.

---

## 4. UI validation

| Area                    | Must prove                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| Pre-restart visibility  | Operator can see / attribute in-scope pending or owed delivery                                            |
| Post-restart visibility | Survive path still shows / resumes work                                                                   |
| Failure honesty         | Unavailable / failed path is honest and visible                                                           |
| No dishonest claims     | UI never claims Live Trading, Wave 5 Complete, Monitoring Complete, Kill Switch Complete, Wave 3 COMPLETE |
| Unauthorized UX         | Denied roles see unavailable / deny — not foreign empty success                                           |

### W3-O02-a UI note — **COMPLETE for slice**

No requirement to claim queue durable from inventory alone. Must not imply Wave 5 production send. No UI change shipped in W3-O02-a.

### W3-O02-b UI note — **COMPLETE for slice**

No Pending Queue / Retry / Recovery / Scheduler / Replay / Operational Queue controls. No customer-visible functionality.

### W3-O02-c UI note — **COMPLETE for slice**

No Recovery / Retry / Queue editor / Replay / Scheduler / Operational queue management UI. Recovery is internal only.

### W3-O02-d UI note — **COMPLETE for slice**

Exposes only Notification Queue operational state, owner readiness, recovery timestamp, and recovery duration on Platform readiness. No Retry controls, Replay, Queue editing, Scheduler, Workflow controls, Monitoring dashboard, or Incident management.

### W3-O02-e UI note — **COMPLETE for slice**

No UI changes. Close Evidence only. Confirms existing Platform readiness fields remain honest and unbound to Retry / Monitoring / Incident surfaces.
---

## 5. Regression validation

| Suite                                                   | Must prove                                 |
| ------------------------------------------------------- | ------------------------------------------ |
| Wave 1 Authentication                                   | Login / session unchanged                  |
| Wave 1 Authorization                                    | Role matrix not rewritten                  |
| Wave 1 Vault                                            | Ciphertext ownership unchanged             |
| Wave 1 Isolation                                        | Cross-workspace deny still holds elsewhere |
| Wave 1 Audit / Platform                                 | Store and platform defaults not forked     |
| Wave 2 Connection Management                            | Catalog and lifecycle intact               |
| Wave 2 Exchange / Market Data / Paper / AI Connectivity | Closed behaviors not redesigned            |
| W3-O01 Durable Analytical Stores                        | Closed outcomes not redesigned             |

---

## 6. Product walkthrough

**Walkthrough name:** Notification Durable Queue Walkthrough

```text
□ Sign in
□ Create / enqueue in-scope notification delivery work (owed alert path)
□ Confirm pending / in-flight work visible or attributable before restart
□ Restart API process before delivery completes (or while retryable)
□ Confirm still present / resumed (survive)
   — or —
□ Confirm honest failure / unavailable recorded (never silent drop)
□ Foreign workspace delivery — denied
□ Unauthorized role — denied
□ Confirm no Live Trading / Wave 5 Complete / Monitoring Complete / Kill Switch Complete / Wave 3 COMPLETE
□ Confirm no second Lake / Outbox; TD-045 ≠ TD-035
```

Overall verdict for Package Review (fill at Close): **PENDING**. Only Product Owner may declare W3-O02 CLOSED.

**W3-O02-a:** Walkthrough **N/A** — inventory foundation only; no restart survival claimed. Recorded in [`w3-o02-a-validation-report.md`](./w3-o02-a-validation-report.md).

**W3-O02-b:** Walkthrough **N/A** — persistence foundation only; restart survival **not** claimed. Recorded in [`w3-o02-b-validation-report.md`](./w3-o02-b-validation-report.md).

**W3-O02-c:** Walkthrough **partial / internal** — persisted open queue restores after normal restart (hydrate proof). Full operator walkthrough + retry/degraded honesty remain later slices. Recorded in [`w3-o02-c-validation-report.md`](./w3-o02-c-validation-report.md).

**W3-O02-d:** Walkthrough **partial** — limited Platform readiness continuity fields after recovery; retry execution and full Close walkthrough remain for W3-O02-e. Recorded in [`w3-o02-d-validation-report.md`](./w3-o02-d-validation-report.md).

**W3-O02-e:** Walkthrough **COMPLETE for Close Evidence** — [`w3-o02-operational-walkthrough.md`](./w3-o02-operational-walkthrough.md). Product Owner Package Close declaration remains **PENDING**.

---

## 7. Architecture validation

| Rule                             | Must prove at Close                                           |
| -------------------------------- | ------------------------------------------------------------- |
| No new bounded context           | Outcomes live on existing notification-delivery owner         |
| No ownership drift               | Vault / Auth / Authz / Workspace / Platform / Audit unchanged |
| No second Lake                   | Lake projection not duplicated                                |
| No second Outbox                 | Outbox not duplicated; TD-045 not merged into TD-035          |
| Canonical Order Path / Ledger    | Untouched                                                     |
| Version 2 architecture preserved | No Version 2 redesign                                         |
| Master Plan unchanged            | No Master Plan edits in implementation                        |
| W3-O01 unchanged as redesign     | Analytical store package not reopened                         |

**W3-O02-a:** Architecture review **PASS** — [`w3-o02-a-architecture-review.md`](./w3-o02-a-architecture-review.md).

**W3-O02-b:** Architecture review **PASS** — [`w3-o02-b-architecture-review.md`](./w3-o02-b-architecture-review.md).

**W3-O02-c:** Architecture review **PASS** — [`w3-o02-c-architecture-review.md`](./w3-o02-c-architecture-review.md).

**W3-O02-d:** Architecture review **PASS** — [`w3-o02-d-architecture-review.md`](./w3-o02-d-architecture-review.md).

**W3-O02-e:** Architecture review **PASS** — [`w3-o02-e-architecture-review.md`](./w3-o02-e-architecture-review.md).

---

## 8. Security validation

| Area                  | Must prove                                          |
| --------------------- | --------------------------------------------------- |
| Verification Standard | Every applicable category/row evidenced             |
| Isolation             | A↛B notification delivery / queue                   |
| Authorization         | Unauthorized deny                                   |
| Secret handling       | No plaintext echo / local secret store              |
| Fail closed           | Missing permission / workspace denies               |
| No Live Trading path  | No live order / Gate-Risk bypass from queue package |
| No Wave 5 claim path  | No production transport claim from queue package    |
| Audit                 | Required queue outcomes attributable                |

**W3-O02-a:** Security review **PASS** for inventory-only scope — [`w3-o02-a-security-review.md`](./w3-o02-a-security-review.md).

**W3-O02-b:** Security review **PASS** for persistence-foundation scope — [`w3-o02-b-security-review.md`](./w3-o02-b-security-review.md).

**W3-O02-c:** Security review **PASS** for restart-recovery scope — [`w3-o02-c-security-review.md`](./w3-o02-c-security-review.md).

**W3-O02-d:** Security review **PASS** for operational-continuity scope — [`w3-o02-d-security-review.md`](./w3-o02-d-security-review.md).

**W3-O02-e:** Security review **PASS** for Close Evidence scope — [`w3-o02-e-security-review.md`](./w3-o02-e-security-review.md).

---

## 9. Package acceptance validation

At Close, every Product Acceptance Criterion in [`w3-o02-product-scope.md`](./w3-o02-product-scope.md) must PASS with evidence.

Copy and complete:

- [`../version-3-product-checklist.md`](../version-3-product-checklist.md)
- [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md)
- [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
- Security Verification Standard worksheets for package-owned surfaces

Commands expected at Close (unless Product Owner narrows a slice):

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @trp/web build`
- `git diff --check`

**W3-O02-a:** Commands executed — see [`w3-o02-a-validation-report.md`](./w3-o02-a-validation-report.md).

**W3-O02-b:** Commands executed — see [`w3-o02-b-validation-report.md`](./w3-o02-b-validation-report.md).

**W3-O02-c:** Commands executed — see [`w3-o02-c-validation-report.md`](./w3-o02-c-validation-report.md).

**W3-O02-d:** Commands executed — see [`w3-o02-d-validation-report.md`](./w3-o02-d-validation-report.md).

**W3-O02-e:** Commands executed — see [`w3-o02-e-validation-report.md`](./w3-o02-e-validation-report.md). Package acceptance criteria evidenced for Close Evidence; Product Owner Package Close declaration remains **PENDING**.

---

## Explicit non-validation

Do **not** treat as W3-O02 Close evidence:

- W3-O01 DeliveryResult history survival alone
- Paper Outbox/Inbox (TD-035) behavior
- Simulated Wave 5 Bot API / SMTP / Slack send success
- Monitoring dashboard screenshots (O05)
- Kill Switch arming (O04)
- US295 acceptance (O03)
- Live Trading proofs
- W3-O02-a inventory alone (foundation only)
- W3-O02-b persistence alone (restart survival requires c)
- W3-O02-c recovery alone without d/e Close (retry / degraded honesty / package Close remain)
- W3-O02-d continuity alone without e Close (retry execution / package Close remain)
- W3-O02-e Close Evidence alone without Product Owner Package Close declaration

---

**STOP.** Wait for Product Owner Package Review. Do not declare W3-O02 CLOSED. Do not declare Wave 3 COMPLETE. Do not open W3-O03.
