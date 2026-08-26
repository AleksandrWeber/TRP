# W3-O01 Validation Plan

**Package:** W3-O01 Durable Analytical Stores
**Wave:** 3 — Durability, Operations & Continuity
**Master Plan / Roadmap:** V3-O01 · IN-01 · TD-048
**Status:** Planning **APPROVED**. W3-O01-a/b/c/d **APPROVED**. W3-O01-e Close Evidence **assembled**. Package **NOT declared CLOSED**.
**Date:** 2026-08-26
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w3-o01-product-scope.md`](./w3-o01-product-scope.md)
**Security:** [`w3-o01-security-review.md`](./w3-o01-security-review.md)
**Umbrella:** [`w3-o01-implementation-package.md`](./w3-o01-implementation-package.md)
**Overview:** [`durability-overview.md`](./durability-overview.md)
**Inventory:** [`w3-o01-a-analytical-inventory.md`](./w3-o01-a-analytical-inventory.md)
**Operational State Matrix:** [`operational-state-matrix.md`](./operational-state-matrix.md)
**Close Evidence:** [`w3-o01-close-package-report.md`](./w3-o01-close-package-report.md)
**Readiness:** [`implementation-readiness-checklist.md`](./implementation-readiness-checklist.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a helper wrote a row without proving the operator still sees the analytical artifact after API restart) do **not** count as Close evidence.

Do not validate Notification durable queue (O02), US295 Complete (O03), Kill Switch product (O04), Monitoring product (O05), Live Trading, Wave 4 venue I/O, or Wave 5 transports. Validate **Durable Analytical Stores** product outcomes only.

### Slice progress

| Slice    | Name                                                  | Validation record                                                                 |
| -------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| W3-O01-a | Analytical store inventory & honesty baseline         | [`w3-o01-a-validation-report.md`](./w3-o01-a-validation-report.md) — **complete** |
| W3-O01-b | Durable persistence for priority analytical artifacts | [`w3-o01-b-validation-report.md`](./w3-o01-b-validation-report.md) — **complete** |
| W3-O01-c | Restart-survival proof & degraded honesty             | [`w3-o01-c-validation-report.md`](./w3-o01-c-validation-report.md) — **complete** |
| W3-O01-d | Operational Continuity Foundation                     | [`w3-o01-d-validation-report.md`](./w3-o01-d-validation-report.md) — **complete** |
| W3-O01-e | Package Close evidence                                | [`w3-o01-e-validation-report.md`](./w3-o01-e-validation-report.md) — **complete** |

---

## 0. What Close means for W3-O01

| Gate                | Meaning                                                        | Unlocks                                                   |
| ------------------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| **W3-O01 Closed**   | Durable Analytical Stores outcomes evidenced; walkthrough PASS | TD-048 analytical-store residual closed for package scope |
| **Wave 3 COMPLETE** | Not claimed from O01 alone                                     | Requires O01…O05 + PO declaration                         |
| **Not claimed**     | Production restart-safety Complete                             | V3-O03 among other exits                                  |
| **Not claimed**     | Monitoring product                                             | V3-O05                                                    |
| **Not claimed**     | Kill Switch product                                            | V3-O04                                                    |
| **Not claimed**     | Live Trading                                                   | Wave 6 / Order Path                                       |
| **Not claimed**     | Restart-safe from W3-O01-a alone                               | Requires W3-O01-b/c                                       |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                                |
| ----------------------------- | ---------------------------------------------------------------------- |
| Unit validation               | Survive vs ephemeral classification; status integrity; secret non-echo |
| Integration validation        | Persist on existing ports; restart survival; cross-workspace deny      |
| UI validation                 | Honest presence / ephemeral labels; no dishonest Complete claims       |
| Regression validation         | Wave 1 + Wave 2 security and product boundaries                        |
| Product walkthrough           | Durable Analytical Stores Walkthrough executed in product              |
| Architecture validation       | No ownership drift; no second Lake/Outbox; no new bounded context      |
| Security validation           | Verification Standard + isolation + authz + fail closed                |
| Package acceptance validation | Acceptance criteria table; Close checklist                             |

### W3-O01-a validation (this slice)

| Layer       | Purpose                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Unit        | Inventory completeness; ownership consistency; classification consistency                          |
| Integration | Planning consistency; Master Plan consistency; architecture consistency                            |
| Regression  | Wave 1 / Wave 2 unchanged (no production redesign); conformance suite still green                  |
| Commands    | `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm --filter @trp/web build` · `git diff --check` |

---

## 2. Unit validation

| Area                     | Must prove                                           |
| ------------------------ | ---------------------------------------------------- |
| Inventory classification | Survive vs ephemeral rules deterministic             |
| Status integrity         | Client cannot set “survived” / present               |
| Secret non-echo          | Responses, logs, and errors never include secrets    |
| Workspace binding        | Missing/wrong workspace fails closed                 |
| No capital side effect   | Durability helpers never invoke live order placement |
| No second SoT helpers    | No parallel Lake/Outbox invent helpers               |

### W3-O01-a unit focus

| Area                       | Must prove                                                        |
| -------------------------- | ----------------------------------------------------------------- |
| Inventory completeness     | Every required analytical owner appears; artifact ids unique      |
| Ownership consistency      | Exactly one allowed existing owner per artifact                   |
| Classification consistency | SURVIVE or EPHEMERAL; EPHEMERAL has honesty note; default SURVIVE |

---

## 3. Integration validation

| Area                          | Must prove                                           |
| ----------------------------- | ---------------------------------------------------- |
| Persist on existing aggregate | Uses existing owner ports — not a new store domain   |
| Restart survival              | After API restart, in-scope survive artifacts remain |
| Ephemeral honesty             | Labeled ephemeral surfaces do not claim durable      |
| Cross-workspace deny          | Workspace A cannot read Workspace B artifacts        |
| Authz deny                    | Unauthorized role cannot access                      |
| Wave 2 untouched              | Connections / Paper / AI Connectivity not redesigned |
| Outbox/Lake unchanged as SoT  | No second Outbox / Lake                              |

### W3-O01-a integration focus

| Area                     | Must prove                                                                 |
| ------------------------ | -------------------------------------------------------------------------- |
| Planning consistency     | Slice claims align with approved package (no new persistence owner)        |
| Master Plan consistency  | Master Plan / V2 / Wave 1 / Wave 2 modification flags remain false         |
| Architecture consistency | Evidence paths exist; no second SoT/Lake/Outbox; platform not restart-safe |

---

## 4. UI validation

| Area                    | Must prove                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| Pre-restart visibility  | Operator can see / rely on in-scope artifact                                             |
| Post-restart visibility | Survive path still shows artifact                                                        |
| Ephemeral labeling      | Exception path is honest and visible                                                     |
| No dishonest claims     | UI never claims Live Trading, Monitoring Complete, Kill Switch Complete, Wave 3 COMPLETE |
| Unauthorized UX         | Denied roles see unavailable / deny — not foreign empty run                              |

### W3-O01-a UI note

No UI change. Must not imply restart-safe / durable / recoverable from inventory alone.

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

---

## 6. Product walkthrough

**Walkthrough name:** Durable Analytical Stores Walkthrough

```text
□ Sign in
□ Create or rely on in-scope analytical artifact(s)
□ Confirm visible / usable before restart
□ Restart API process
□ Confirm still present (survive) OR honest ephemeral label
□ Foreign workspace artifact — denied
□ Unauthorized role — denied
□ Confirm no Live Trading / Monitoring Complete / Kill Switch Complete / Wave 3 COMPLETE
□ Confirm no second Lake / Outbox
```

Overall verdict for Package Review (fill at Close): **PENDING**. Only Product Owner may declare W3-O01 CLOSED.

**W3-O01-a:** Walkthrough N/A — inventory foundation only; no restart survival claimed.

---

## 7. Architecture validation

| Rule                             | Must prove at Close                                           |
| -------------------------------- | ------------------------------------------------------------- |
| No new bounded context           | Outcomes live on existing analytical owners                   |
| No ownership drift               | Vault / Auth / Authz / Workspace / Platform / Audit unchanged |
| No second Lake                   | Lake projection not duplicated                                |
| No second Outbox                 | Outbox not duplicated                                         |
| Canonical Order Path / Ledger    | Untouched                                                     |
| Version 2 architecture preserved | No Version 2 redesign                                         |
| Master Plan unchanged            | No Master Plan edits in implementation                        |

---

## 8. Security validation

| Area                  | Must prove                                       |
| --------------------- | ------------------------------------------------ |
| Verification Standard | Every applicable category/row evidenced          |
| Isolation             | A↛B analytical artifacts                         |
| Authorization         | Unauthorized deny                                |
| Secret handling       | No plaintext echo / local secret store           |
| Fail closed           | Missing permission / workspace denies            |
| No Live Trading path  | No live order / Gate-Risk bypass from durability |
| Audit                 | Required durability outcomes attributable        |

---

## 9. Package acceptance validation

| #   | Acceptance criterion                                                | Evidence type               |
| --- | ------------------------------------------------------------------- | --------------------------- |
| 1   | In-scope artifacts survive API restart                              | Walkthrough + restart tests |
| 2   | Non-surviving surfaces honestly labeled ephemeral                   | Walkthrough + tests         |
| 3   | No fake post-restart success                                        | Product + security review   |
| 4   | Cross-workspace deny                                                | Isolation tests             |
| 5   | Unauthorized deny                                                   | Authz tests                 |
| 6   | No Live Trading / Monitoring / Kill Switch / Wave 3 COMPLETE claims | Product review              |
| 7   | No plaintext secret exposure                                        | Security review             |
| 8   | No second Lake / Outbox                                             | Architecture review         |

Close command validation (to be executed at package Close — not claimed by W3-O01-a alone):

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @trp/web build` (if UI touched)
- `git diff --check`

W3-O01-a command validation (required for this slice):

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @trp/web build`
- `git diff --check`

---

## 10. Slice note

| Slice    | Authorization                |
| -------- | ---------------------------- |
| W3-O01-a | **APPROVED**                 |
| W3-O01-b | **APPROVED**                 |
| W3-O01-c | **APPROVED**                 |
| W3-O01-d | **APPROVED**                 |
| W3-O01-e | **Close Evidence assembled** |

Do not treat W3-O01-e Close Evidence as a Product Owner declaration that W3-O01 is CLOSED, Wave 3 COMPLETE, or authorization to open W3-O02.

---

**STOP.** Wait for Product Owner Package Review. Do not declare W3-O01 CLOSED. Do not declare Wave 3 COMPLETE. Do not open W3-O02. Do not implement Business Continuity. Do not implement High Availability. Do not implement Monitoring.
