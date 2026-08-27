# W3-O02 Validation Plan

**Package:** W3-O02 Notification Durable Queue
**Wave:** 3 — Durability, Operations & Continuity
**Master Plan / Roadmap:** V3-O02 · NT-02 · TD-045
**Status:** Planning **COMPLETE**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Date:** 2026-08-27
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w3-o02-product-scope.md`](./w3-o02-product-scope.md)
**Security:** [`w3-o02-security-review.md`](./w3-o02-security-review.md)
**Umbrella:** [`w3-o02-implementation-package.md`](./w3-o02-implementation-package.md)
**Overview:** [`notification-durable-queue-overview.md`](./notification-durable-queue-overview.md)
**Wave durability:** [`durability-overview.md`](./durability-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a helper wrote a queue row without proving in-flight delivery work still exists after API restart) do **not** count as Close evidence.

Do not validate US295 Complete (O03), Kill Switch product (O04), Monitoring product (O05), Live Trading, Wave 4 venue I/O, or Wave 5 production transports. Validate **Notification Durable Queue** product outcomes only.

Do not treat W3-O01 DeliveryResult **history** survival as proof of W3-O02 queue durability.

### Slice progress (planning — not opened)

| Slice    | Name                                                              | Validation record |
| -------- | ----------------------------------------------------------------- | ----------------- |
| W3-O02-a | Notification queue inventory & honesty baseline                   | Not opened        |
| W3-O02-b | Durable queue persistence on existing notification-delivery owner | Not opened        |
| W3-O02-c | Restart-survival proof for in-flight delivery                     | Not opened        |
| W3-O02-d | Degraded delivery honesty & continuity alignment                  | Not opened        |
| W3-O02-e | Package Validation, Operational Verification & Close Evidence     | Not opened        |

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

### W3-O02-a unit focus (when opened)

| Area                    | Must prove                                                                     |
| ----------------------- | ------------------------------------------------------------------------------ |
| Inventory completeness  | Every required queue surface appears; ids unique                               |
| Ownership consistency   | Exactly one allowed existing owner (notification-delivery) per surface         |
| Distinction consistency | Queue ≠ DeliveryResult history; queue ≠ paper Outbox; queue ≠ Wave 5 transport |

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

---

## 4. UI validation

| Area                    | Must prove                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| Pre-restart visibility  | Operator can see / attribute in-scope pending or owed delivery                                            |
| Post-restart visibility | Survive path still shows / resumes work                                                                   |
| Failure honesty         | Unavailable / failed path is honest and visible                                                           |
| No dishonest claims     | UI never claims Live Trading, Wave 5 Complete, Monitoring Complete, Kill Switch Complete, Wave 3 COMPLETE |
| Unauthorized UX         | Denied roles see unavailable / deny — not foreign empty success                                           |

### W3-O02-a UI note

No requirement to claim queue durable from inventory alone. Must not imply Wave 5 production send.

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

**W3-O02-a:** Walkthrough N/A — inventory foundation only; no restart survival claimed.

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

---

**STOP.** Wait for Product Owner Planning Review before approving W3-O02 implementation. Do not create W3-O02-a. Do not declare Wave 3 COMPLETE.
