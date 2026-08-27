# W3-O03 Validation Plan

**Package:** W3-O03 Recovery Residual (US295 / ADL-008)
**Wave:** 3 — Durability, Operations & Continuity
**Master Plan / Roadmap:** V3-O03 · IN-02 · TD-036 (R6 / US295)
**Status:** Planning **APPROVED** for implementation. **W3-O03-a…e COMPLETE**. Package **CLOSED** by Product Owner. ADL-008 disposition **not recorded**.
**Date:** 2026-08-27
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w3-o03-product-scope.md`](./w3-o03-product-scope.md)
**Security:** [`w3-o03-security-review.md`](./w3-o03-security-review.md)
**Umbrella:** [`w3-o03-implementation-package.md`](./w3-o03-implementation-package.md)
**Overview:** [`recovery-residual-overview.md`](./recovery-residual-overview.md)
**Inventory (a):** [`w3-o03-a-recovery-residual-inventory.md`](./w3-o03-a-recovery-residual-inventory.md)
**Wave durability:** [`durability-overview.md`](./durability-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a helper wrote “ACCEPTED” without proving disposition recording / limitation honesty) do **not** count as Close evidence.

Do not validate Kill Switch product (O04), Monitoring product (O05), Live Trading, Wave 4 venue I/O, Wave 5 production transports, Business Continuity, or High Availability. Validate **Recovery Residual** claim-stance outcomes only.

Do not treat W3-O01 analytical survival or W3-O02 queue durability as proof of US295 / ADL-008 stance Close.

### Slice progress

| Slice    | Name                                                          | Validation record                                                                 |
| -------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| W3-O03-a | Recovery residual inventory & claim-language baseline         | **COMPLETE** — [`w3-o03-a-validation-report.md`](./w3-o03-a-validation-report.md) |
| W3-O03-b | Evidence-chain sync for US295 inputs                          | **COMPLETE** — [`w3-o03-b-validation-report.md`](./w3-o03-b-validation-report.md) |
| W3-O03-c | ADL-008 disposition (ACCEPTED or explicit deferral)           | **COMPLETE** — [`w3-o03-c-validation-report.md`](./w3-o03-c-validation-report.md) |
| W3-O03-d | Live-claim limitation / honesty alignment                     | **COMPLETE** — [`w3-o03-d-validation-report.md`](./w3-o03-d-validation-report.md) |
| W3-O03-e | Package Validation, Operational Verification & Close Evidence | **COMPLETE** — [`w3-o03-e-validation-report.md`](./w3-o03-e-validation-report.md) |

---

## 0. What Close means for W3-O03

| Gate                | Meaning                                                     | Unlocks                                        |
| ------------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| **W3-O03 Closed**   | US295 / ADL-008 stance outcomes evidenced; walkthrough PASS | TD-036 R6 residual closed for package scope    |
| **Wave 3 COMPLETE** | Not claimed from O03 alone                                  | Requires O01…O05 + PO declaration              |
| **Not claimed**     | Kill Switch product                                         | V3-O04                                         |
| **Not claimed**     | Monitoring product                                          | V3-O05                                         |
| **Not claimed**     | Live Trading                                                | Wave 6 / Order Path                            |
| **Not claimed**     | Business Continuity / High Availability                     | Later / never silent                           |
| **Not claimed**     | Stance closed from W3-O03-a…e alone                         | Requires Product Owner Close + disposition act |

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

### W3-O03-a unit focus — **COMPLETE**

| Area                    | Must prove                                                            |
| ----------------------- | --------------------------------------------------------------------- |
| Inventory completeness  | Every required claim / ADL / US295 input surface appears; ids unique  |
| Ownership consistency   | Existing recovery / ADL owners only                                   |
| Distinction consistency | Stance ≠ O01 stores; ≠ O02 queue; ≠ O04 Kill Switch; ≠ O05 Monitoring |

**Evidence:** [`w3-o03-a-validation-report.md`](./w3-o03-a-validation-report.md) · `w3-o03-a-recovery-residual-inventory.spec.ts`

### W3-O03-b unit focus — **COMPLETE**

| Area                 | Must prove                                                                |
| -------------------- | ------------------------------------------------------------------------- |
| Evidence attribution | Every mandatory US295 input has id / owner / path / status / dependencies |
| Sync honesty         | Missing / duplicate / orphan / cycle / broken dependency fail openly      |
| ACCEPTED honesty     | Missing evidence blocks ACCEPTED; Engineering cannot self-promote         |

**Evidence:** [`w3-o03-b-validation-report.md`](./w3-o03-b-validation-report.md) · `w3-o03-b-evidence-chain-sync.spec.ts`

### W3-O03-c unit focus — **COMPLETE**

| Area                     | Must prove                                                                 |
| ------------------------ | -------------------------------------------------------------------------- |
| Two-state decisions only | ACCEPTED or DEFERRED — no third / hidden / implicit state                  |
| Authority gate           | Engineering cannot create ACCEPTED; Product Owner can when evidence synced |
| Limitation honesty       | DEFERRED requires non-empty written live-claim limitation                  |
| Immutability             | Records immutable; rewrite forbidden; change appends new record            |

**Evidence:** [`w3-o03-c-validation-report.md`](./w3-o03-c-validation-report.md) · `w3-o03-c-disposition-foundation.spec.ts`

### W3-O03-d unit focus — **COMPLETE**

| Area                       | Must prove                                                            |
| -------------------------- | --------------------------------------------------------------------- |
| Disposition-derived claims | Restart-safe claims originate only from Product Owner disposition     |
| Limitation honesty         | DEFERRED / no disposition requires explicit written limitation        |
| Surface consistency        | Documentation / validation / overview / operational / runtime aligned |
| Engineering bypass         | Engineering cannot present Production Restart Safe independently      |

**Evidence:** [`w3-o03-d-validation-report.md`](./w3-o03-d-validation-report.md) · `w3-o03-d-honest-claim-alignment.spec.ts`

### W3-O03-e unit focus — **COMPLETE**

| Area                        | Must prove                                                                    |
| --------------------------- | ----------------------------------------------------------------------------- |
| Slice roll-up               | a–d Validation / Architecture / Security / Product all PASS                   |
| Operational chain           | Inventory → Registry → Sync → Disposition → Claim alignment → integrity       |
| Close Evidence honesty      | Package NOT CLOSED; ADL-008 NOT ACCEPTED; Wave 3 NOT COMPLETE; O04 NOT opened |
| Governance / Honest Product | Engineering cannot ACCEPT or claim restart-safe; claims disposition-derived   |

**Evidence:** [`w3-o03-e-validation-report.md`](./w3-o03-e-validation-report.md) · `w3-o03-e-close-evidence.spec.ts` · [`w3-o03-close-package-report.md`](./w3-o03-close-package-report.md)

---

## 3. Integration validation

| Area                           | Must prove                                                               |
| ------------------------------ | ------------------------------------------------------------------------ |
| Disposition on existing owners | Uses existing ADL / recovery documentation ownership — not a new domain  |
| Accept or limitation           | One of two Master Plan paths recorded by **Product Owner**               |
| No silent PASS                 | DEFERRED cannot authorize production restart-safe language               |
| Evidence grounding             | ACCEPTED path cites US290–US294 / US294 Evidence Package inputs          |
| Insufficient evidence          | Explicit written live-claim limitation required; evidence never invented |
| No Engineering self-promote    | Engineering cannot promote ADL-008 to ACCEPTED                           |
| Cross-workspace deny           | Workspace A cannot read Workspace B claim surfaces                       |
| Authz deny                     | Unauthorized role cannot access                                          |
| W3-O01 / W3-O02 untouched      | Closed packages not reopened as redesign                                 |
| Outbox/Lake/recovery unchanged | No second Outbox / Lake / recovery SoT                                   |

---

## 4. UI validation

| Area                | Must prove                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Stance visibility   | Operator can see ACCEPTED **or** explicit written limitation                                    |
| Failure honesty     | Limitation path is honest and visible when acceptance is not warranted                          |
| No dishonest claims | UI never claims Live Trading, Kill Switch Complete, Monitoring Complete, BC/HA, Wave 3 COMPLETE |
| Unauthorized UX     | Denied roles see unavailable / deny — not foreign empty success                                 |

### Slice UI notes (planning)

| Slice    | UI expectation                                                                   |
| -------- | -------------------------------------------------------------------------------- |
| W3-O03-a | Inventory foundation; must not imply stance Closed — **COMPLETE** (no UI change) |
| W3-O03-b | No requirement for full operator Close walkthrough                               |
| W3-O03-c | Disposition recorded; may be governed docs + product honesty linkage             |
| W3-O03-d | Product-visible honesty aligned where claims appear                              |
| W3-O03-e | Close Evidence only — no new customer functionality beyond stance honesty        |

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

Overall verdict for Package Review (fill at Close): **CLOSED** by Product Owner.

**W3-O03-a:** Walkthrough **N/A** — inventory foundation only; no stance Closed claimed. Recorded in [`w3-o03-a-validation-report.md`](./w3-o03-a-validation-report.md).

**W3-O03-b:** Walkthrough **N/A** — evidence-chain sync foundation only; stance Close **not** claimed. Recorded in [`w3-o03-b-validation-report.md`](./w3-o03-b-validation-report.md).

**W3-O03-c:** Walkthrough **N/A** — disposition foundation mechanism only; no disposition recorded. Recorded in [`w3-o03-c-validation-report.md`](./w3-o03-c-validation-report.md).

**W3-O03-d:** Walkthrough **partial / internal** — honest claim alignment verified across documentation and runtime surfaces; Product Owner disposition act still pending. Recorded in [`w3-o03-d-validation-report.md`](./w3-o03-d-validation-report.md).

**W3-O03-e:** Walkthrough **COMPLETE for Close Evidence** — [`w3-o03-operational-walkthrough.md`](./w3-o03-operational-walkthrough.md). Product Owner Package Close declaration: **CLOSED**.

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

**W3-O03-a:** Architecture review **PASS** — [`w3-o03-a-architecture-review.md`](./w3-o03-a-architecture-review.md).

**W3-O03-b:** Architecture review **PASS** — [`w3-o03-b-architecture-review.md`](./w3-o03-b-architecture-review.md).

**W3-O03-c:** Architecture review **PASS** — [`w3-o03-c-architecture-review.md`](./w3-o03-c-architecture-review.md).

**W3-O03-d:** Architecture review **PASS** — [`w3-o03-d-architecture-review.md`](./w3-o03-d-architecture-review.md).

**W3-O03-e:** Architecture review **PASS** — [`w3-o03-e-architecture-review.md`](./w3-o03-e-architecture-review.md).

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

**W3-O03-a:** Security review **PASS** for inventory-only scope — [`w3-o03-a-security-review.md`](./w3-o03-a-security-review.md).

**W3-O03-b:** Security review **PASS** for evidence-chain sync scope — [`w3-o03-b-security-review.md`](./w3-o03-b-security-review.md).

**W3-O03-c:** Security review **PASS** for disposition foundation scope — [`w3-o03-c-security-review.md`](./w3-o03-c-security-review.md).

**W3-O03-d:** Security review **PASS** for honest claim alignment scope — [`w3-o03-d-security-review.md`](./w3-o03-d-security-review.md).

**W3-O03-e:** Security review **PASS** for Close Evidence scope — [`w3-o03-e-security-review.md`](./w3-o03-e-security-review.md).

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

**W3-O03-a:** Commands executed — see [`w3-o03-a-validation-report.md`](./w3-o03-a-validation-report.md).

**W3-O03-b:** Commands executed — see [`w3-o03-b-validation-report.md`](./w3-o03-b-validation-report.md).

**W3-O03-c:** Commands executed — see [`w3-o03-c-validation-report.md`](./w3-o03-c-validation-report.md).

**W3-O03-d:** Commands executed — see [`w3-o03-d-validation-report.md`](./w3-o03-d-validation-report.md).

**W3-O03-e:** Commands executed — see [`w3-o03-e-validation-report.md`](./w3-o03-e-validation-report.md). Package acceptance criteria evidenced; Product Owner Package Close declaration: **CLOSED**.

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

| Check                         | Result                                              |
| ----------------------------- | --------------------------------------------------- |
| No Master Plan revision       | PASS                                                |
| No Version 2 modification     | PASS                                                |
| No ownership changes          | PASS                                                |
| No new bounded context        | PASS                                                |
| No Source of Truth changes    | PASS                                                |
| No hidden Wave 4/5/6 function | PASS                                                |
| Slices a–e COMPLETE           | PASS (package CLOSED; ADL-008 disposition separate) |

---

**STOP.** W3-O03 is **CLOSED** by Product Owner. Do not declare ADL-008 ACCEPTED without disposition act. Do not declare Production Restart Safe automatically. Do not declare Wave 3 COMPLETE. W3-O04 Planning Package **authorized** — implementation slices not opened.
