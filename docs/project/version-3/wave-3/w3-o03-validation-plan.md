# W3-O03 Validation Plan

**Package:** W3-O03 Recovery Residual (US295 / ADL-008)
**Wave:** 3 — Durability, Operations & Continuity
**Master Plan / Roadmap:** V3-O03 · IN-02 · TD-036 (R6 / US295)
**Status:** Planning **COMPLETE**. Awaiting Product Owner Review and Approval. Not implementation. Slices not opened.
**Date:** 2026-08-27
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w3-o03-product-scope.md`](./w3-o03-product-scope.md)
**Security:** [`w3-o03-security-review.md`](./w3-o03-security-review.md)
**Umbrella:** [`w3-o03-implementation-package.md`](./w3-o03-implementation-package.md)
**Overview:** [`recovery-residual-overview.md`](./recovery-residual-overview.md)
**Wave durability:** [`durability-overview.md`](./durability-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a helper wrote “ACCEPTED” without proving disposition recording / limitation honesty) do **not** count as Close evidence.

Do not validate Kill Switch product (O04), Monitoring product (O05), Live Trading, Wave 4 venue I/O, Wave 5 production transports, Business Continuity, or High Availability. Validate **Recovery Residual** claim-stance outcomes only.

Do not treat W3-O01 analytical survival or W3-O02 queue durability as proof of US295 / ADL-008 stance Close.

### Slice progress

| Slice    | Name                                                          | Validation record |
| -------- | ------------------------------------------------------------- | ----------------- |
| W3-O03-a | Recovery residual inventory & claim-language baseline         | **Not opened**    |
| W3-O03-b | Evidence-chain sync for US295 inputs                          | **Not opened**    |
| W3-O03-c | ADL-008 disposition (ACCEPTED or explicit deferral)           | **Not opened**    |
| W3-O03-d | Live-claim limitation / honesty alignment                     | **Not opened**    |
| W3-O03-e | Package Validation, Operational Verification & Close Evidence | **Not opened**    |

---

## 0. What Close means for W3-O03

| Gate                | Meaning                                                     | Unlocks                                     |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| **W3-O03 Closed**   | US295 / ADL-008 stance outcomes evidenced; walkthrough PASS | TD-036 R6 residual closed for package scope |
| **Wave 3 COMPLETE** | Not claimed from O03 alone                                  | Requires O01…O05 + PO declaration           |
| **Not claimed**     | Kill Switch product                                         | V3-O04                                      |
| **Not claimed**     | Monitoring product                                          | V3-O05                                      |
| **Not claimed**     | Live Trading                                                | Wave 6 / Order Path                         |
| **Not claimed**     | Business Continuity / High Availability                     | Later / never silent                        |
| **Not claimed**     | Stance closed from W3-O03-a alone                           | Requires disposition path (c/d) + e         |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------- |
| Unit validation               | Claim inventory; disposition integrity; secret non-echo; no silent PASS helpers   |
| Integration validation        | Evidence-chain binding; disposition recording; cross-workspace deny               |
| UI validation                 | Honest ACCEPTED / limitation; no dishonest Complete claims                        |
| Regression validation         | Wave 1 + Wave 2 + W3-O01 + W3-O02 security and product boundaries                 |
| Product walkthrough           | Recovery Residual Walkthrough executed in product                                 |
| Architecture validation       | No ownership drift; no second Lake/Outbox/recovery domain; no new bounded context |
| Security validation           | Verification Standard + isolation + authz + fail closed                           |
| Package acceptance validation | Acceptance criteria table; Close checklist                                        |

---

## 2. Unit validation

| Area                     | Must prove                                                         |
| ------------------------ | ------------------------------------------------------------------ |
| Residual inventory class | Claim surfaces vs O04/O05 vs Live Trading vs US290–US294 substrate |
| Disposition integrity    | Client cannot set “ACCEPTED” / “restart-safe Complete”             |
| Secret non-echo          | Responses, logs, and errors never include secrets                  |
| Workspace binding        | Missing/wrong workspace fails closed                               |
| No capital side effect   | Stance helpers never invoke live order placement                   |
| No second SoT helpers    | No parallel Lake/Outbox/recovery invent helpers                    |

### W3-O03-a unit focus — **Not opened**

| Area                    | Must prove                                                            |
| ----------------------- | --------------------------------------------------------------------- |
| Inventory completeness  | Every required claim / ADL / US295 input surface appears; ids unique  |
| Ownership consistency   | Existing recovery / ADL owners only                                   |
| Distinction consistency | Stance ≠ O01 stores; ≠ O02 queue; ≠ O04 Kill Switch; ≠ O05 Monitoring |

### Later slices (planning expectations)

| Slice    | Unit focus                                                                     |
| -------- | ------------------------------------------------------------------------------ |
| W3-O03-b | Evidence inputs attributable; missing evidence fails honesty for ACCEPTED      |
| W3-O03-c | Disposition is ACCEPTED **or** explicit limitation; silent DEFERRED impossible |
| W3-O03-d | Limitation / accepted honesty aligned; Ready never forged from DEFERRED        |
| W3-O03-e | Close evidence registry; architecture non-claims; transition safety            |

---

## 3. Integration validation

| Area                           | Must prove                                                              |
| ------------------------------ | ----------------------------------------------------------------------- |
| Disposition on existing owners | Uses existing ADL / recovery documentation ownership — not a new domain |
| Accept or limitation           | One of two Master Plan paths recorded                                   |
| No silent PASS                 | DEFERRED cannot authorize production restart-safe language              |
| Evidence grounding             | ACCEPTED path cites US290–US294 / US294 Evidence Package inputs         |
| Cross-workspace deny           | Workspace A cannot read Workspace B claim surfaces                      |
| Authz deny                     | Unauthorized role cannot access                                         |
| W3-O01 / W3-O02 untouched      | Closed packages not reopened as redesign                                |
| Outbox/Lake/recovery unchanged | No second Outbox / Lake / recovery SoT                                  |

---

## 4. UI validation

| Area                | Must prove                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Stance visibility   | Operator can see ACCEPTED **or** explicit written limitation                                    |
| Failure honesty     | Limitation path is honest and visible when acceptance is not warranted                          |
| No dishonest claims | UI never claims Live Trading, Kill Switch Complete, Monitoring Complete, BC/HA, Wave 3 COMPLETE |
| Unauthorized UX     | Denied roles see unavailable / deny — not foreign empty success                                 |

### Slice UI notes (planning)

| Slice    | UI expectation                                                            |
| -------- | ------------------------------------------------------------------------- |
| W3-O03-a | Inventory foundation; must not imply stance Closed                        |
| W3-O03-b | No requirement for full operator Close walkthrough                        |
| W3-O03-c | Disposition recorded; may be governed docs + product honesty linkage      |
| W3-O03-d | Product-visible honesty aligned where claims appear                       |
| W3-O03-e | Close Evidence only — no new customer functionality beyond stance honesty |

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
| W3-O02 Notification Durable Queue                       | Closed outcomes not redesigned             |
| US290–US294 substrate                                   | Recovery behaviour not redesigned          |

---

## 6. Product walkthrough

**Walkthrough name:** Recovery Residual Walkthrough

```text
□ Sign in
□ Locate production restart-safety / recovery claim stance surface
□ Confirm stance is either ACCEPTED or explicit written live-claim limitation
□ Confirm no silent “production restart-safe” PASS
□ Confirm evidence grounding (accept) or explicit limitation language
□ Foreign workspace — denied (if UI)
□ Unauthorized role — denied
□ Confirm no Live Trading / Kill Switch Complete / Monitoring Complete / BC/HA / Wave 3 COMPLETE
□ Confirm no US290–US294 redesign / no second recovery SoT
```

Overall verdict for Package Review (fill at Close): **PENDING APPROVAL** (planning open).

---

## 7. Architecture validation

| Rule                             | Must prove at Close                                           |
| -------------------------------- | ------------------------------------------------------------- |
| No new bounded context           | Outcomes live on existing recovery / ADL ownership            |
| No ownership drift               | Vault / Auth / Authz / Workspace / Platform / Audit unchanged |
| No second Lake                   | Lake projection not duplicated                                |
| No second Outbox                 | Outbox not duplicated                                         |
| No second recovery domain        | US290–US294 / Session ownership unchanged                     |
| Canonical Order Path / Ledger    | Untouched                                                     |
| Version 2 architecture preserved | No Version 2 redesign                                         |
| Master Plan unchanged            | No Master Plan edits in implementation                        |
| W3-O01 / W3-O02 unchanged        | Closed packages not reopened                                  |

---

## 8. Security validation

| Area                  | Must prove                                             |
| --------------------- | ------------------------------------------------------ |
| Verification Standard | Every applicable category/row evidenced                |
| Isolation             | A↛B claim surfaces                                     |
| Authorization         | Unauthorized deny                                      |
| Secret handling       | No plaintext echo / local secret store                 |
| Fail closed           | Missing permission / workspace denies                  |
| No Live Trading path  | No live order / Gate-Risk bypass from residual package |
| No O04/O05 claim path | No Kill Switch / Monitoring Complete from O03          |
| Audit                 | Required stance outcomes attributable                  |

---

## 9. Package acceptance validation

At Close, every Product Acceptance Criterion in [`w3-o03-product-scope.md`](./w3-o03-product-scope.md) must PASS with evidence.

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

Do **not** treat as W3-O03 Close evidence:

- W3-O01 analytical store survival alone
- W3-O02 notification queue durability alone
- US294 chaos evidence alone without US295 / ADL-008 disposition
- Simulated Kill Switch arming (O04)
- Monitoring dashboard screenshots (O05)
- Live Trading proofs
- Business Continuity / High Availability claims
- W3-O03-a inventory alone (foundation only)
- W3-O03-e Close Evidence alone without Product Owner Package Close declaration

---

## Mandatory Planning Verification

| Check                           | Result               |
| ------------------------------- | -------------------- |
| No Master Plan revision         | PASS                 |
| No Version 2 modification       | PASS                 |
| No ownership changes            | PASS                 |
| No new bounded context          | PASS                 |
| No Source of Truth changes      | PASS                 |
| No hidden Wave 4/5/6 function   | PASS                 |
| No implementation authorization | PASS (planning only) |

---

**STOP.** Wait for Product Owner Planning Review before approving W3-O03 implementation. Do not create W3-O03-a. Do not declare Wave 3 COMPLETE.
