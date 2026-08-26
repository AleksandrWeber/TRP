# W3-O01 Validation Plan

**Package:** W3-O01 Durable Analytical Stores
**Wave:** 3 — Durability, Operations & Continuity
**Master Plan / Roadmap:** V3-O01 · IN-01 · TD-048
**Status:** Planning **COMPLETE**. Not implementation. Awaiting Product Owner Planning Review and Approval.
**Date:** 2026-08-26
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w3-o01-product-scope.md`](./w3-o01-product-scope.md)
**Security:** [`w3-o01-security-review.md`](./w3-o01-security-review.md)
**Umbrella:** [`w3-o01-implementation-package.md`](./w3-o01-implementation-package.md)
**Overview:** [`durability-overview.md`](./durability-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a helper wrote a row without proving the operator still sees the analytical artifact after API restart) do **not** count as Close evidence.

Do not validate Notification durable queue (O02), US295 Complete (O03), Kill Switch product (O04), Monitoring product (O05), Live Trading, Wave 4 venue I/O, or Wave 5 transports. Validate **Durable Analytical Stores** product outcomes only.

**Implementation slices:** Named in planning only. **Not started.** Do not open until Product Owner Approves planning and sequences slices.

### Slice progress (planning — not started)

| Slice    | Name                                                  | Validation record |
| -------- | ----------------------------------------------------- | ----------------- |
| W3-O01-a | Analytical store inventory & honesty baseline         | Not started       |
| W3-O01-b | Durable persistence for priority analytical artifacts | Not started       |
| W3-O01-c | Restart-survival proof & degraded honesty             | Not started       |
| W3-O01-d | Security verification + package Close evidence        | Not started       |

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

Planning-package validation (this open):

- Documentation-only change set
- `git diff --check` PASS
- No production code introduced by this planning open

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

---

## 4. UI validation

| Area                    | Must prove                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| Pre-restart visibility  | Operator can see / rely on in-scope artifact                                             |
| Post-restart visibility | Survive path still shows artifact                                                        |
| Ephemeral labeling      | Exception path is honest and visible                                                     |
| No dishonest claims     | UI never claims Live Trading, Monitoring Complete, Kill Switch Complete, Wave 3 COMPLETE |
| Unauthorized UX         | Denied roles see unavailable / deny — not foreign empty run                              |

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

Close command validation (to be executed at package Close — not in this planning open):

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @trp/web build` (if UI touched)
- `git diff --check`

Planning open command validation:

- `git diff --check` — required PASS for this documentation package

---

## 10. Slice note

Implementation slices W3-O01-a…d are **planning names only**. They must not be started until:

1. Product Owner Approves this Wave 3 / W3-O01 Planning Package
2. Product Owner explicitly sequences the slice

Do not treat this validation plan as authorization to implement.

---

**STOP.** Wait for Product Owner Planning Review. Do not begin Wave 3 implementation. Do not open implementation slices.
