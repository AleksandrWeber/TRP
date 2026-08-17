# V3-S06 Validation Plan

**Package:** V3-S06 Workspace Isolation Hardening
**Wave:** 1 — Security Foundation
**Status:** **EXECUTED / PASS** — Close results recorded in
[`v3-s06-close-report.md`](./v3-s06-close-report.md).
**Canon:** [`version-3-master-plan.md`](./version-3-master-plan.md)
**Scope:** [`v3-s06-product-scope.md`](./v3-s06-product-scope.md)
**Security:** [`v3-s06-security-review.md`](./v3-s06-security-review.md)
**Umbrella:** [`v3-s06-implementation-package.md`](./v3-s06-implementation-package.md)
**Overview:** [`workspace-isolation-overview.md`](./workspace-isolation-overview.md)
**Matrix:** [`wave-1-isolation-matrix.md`](./wave-1-isolation-matrix.md)
**Exit governance:** [`wave-1-exit-checklist.md`](./wave-1-exit-checklist.md)
**Checklists:** [`version-3-product-checklist.md`](./version-3-product-checklist.md) · [`version-3-architecture-checklist.md`](./version-3-architecture-checklist.md) · [`version-3-security-checklist.md`](./version-3-security-checklist.md)
**Verification Standard:** [`version-3-security-verification-standard.md`](./version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a helper was called without proving Workspace A cannot read Workspace B data on the real product path) do **not** count as Close evidence.

Do not validate Binance I/O, Telegram send, SMTP send, AI chat, Connection Management wizards, monitoring dashboards, billing, or live trading. Validate **Workspace Isolation proof** and **Wave 1 exit evidence readiness**.

---

## 0. What Close means for S06

| Gate                               | Meaning                                                                                                                                                  | Unlocks                                                                                      |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **S06 Closed**                     | SEC-11 Wave 1 isolation is proved across the Isolation Matrix; regression suite PASS; Master Plan line “I cannot see another workspace’s data” evidenced | Wave 1 Exit Checklist isolation rows may become ✅; **Wave 1 Certification Audit may begin** |
| **Not claimed by S06 Close alone** | Wave 1 COMPLETE                                                                                                                                          | Requires Certification Audit + Product Owner declaration                                     |
| **Not claimed**                    | Connection Management                                                                                                                                    | Wave 2 after Wave 1 COMPLETE                                                                 |
| **Not claimed**                    | Wave 9 multi-team isolation remainder                                                                                                                    | Wave 9                                                                                       |
| **Not claimed**                    | Monitoring / live / billing                                                                                                                              | Later waves                                                                                  |

There is no dual Platform/Customer Complete split for S06. Isolation proof closes as one package. Wave 1 COMPLETE is a **separate** Product Owner gate after Certification Audit.

---

## 1. Unit tests

| Area                         | Must prove                                                            |
| ---------------------------- | --------------------------------------------------------------------- |
| Scope helpers                | Workspace scope predicates fail closed on missing/wrong context       |
| Deny shaping                 | Foreign-workspace deny does not include foreign payloads              |
| Matrix fixtures              | Two-workspace fixture factory yields distinct A/B identities and data |
| Audit/timeline scope helpers | Query constraints cannot select foreign workspace rows                |
| Vault ownership helpers      | Foreign ownership checks deny without revealing plaintext             |
| Boundary guards              | Connection Management routes (if any stub) remain unavailable / deny  |

---

## 2. Integration tests (Isolation Suite — primary Close evidence)

### 2.1 Proof standard (every matrix row)

Each row must show all three:

1. **Positive scope** — allowed caller in A sees only A data for that surface
2. **Negative cross-tenant** — A credentials cannot obtain B identifiers/payloads/lists/exports beyond honest deny policy
3. **Fail closed** — missing/wrong workspace context denies (does not fall open)

### 2.2 Required case families

| Case family                               | Must prove                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Auth / identity binding                   | A session cannot act as B’s operator identity                                                                                      |
| Session list / revoke                     | A cannot list or end B’s sessions; B payloads absent                                                                               |
| People / role assignment                  | Identity-global People remains Admin-only; a role grant cannot create foreign Workspace membership                                 |
| Vault lifecycle / retrieve deny           | A cannot read, list, or lifecycle B secrets                                                                                        |
| Audit store read/write scope              | A cannot read or append-as-B for B’s audit records                                                                                 |
| Timeline HTTP / navigation                | A timeline never includes B events; cursor cannot hop tenants                                                                      |
| Incident investigate / export             | Mixed evidence is denied; internal-only investigation/export assemble linked same-workspace events; no customer HTTP caller exists |
| Membership gate                           | Non-member gets honest deny; no silent cross-tenant empty success                                                                  |
| Security Platform tenancy                 | **NOT APPLICABLE** — Platform owns hardening, not tenant state; reference V3-S04 Close                                             |
| Connection Management boundary            | Connections product path not available; no credential cross-read                                                                   |
| Wave 1 security route ownership inventory | Every security-relevant route maps to an owner and PASS/N/A matrix row; no orphan route                                            |
| S01–S05 unregressed                       | Login, People, Vault platform path, hardening, audit timeline still work inside A                                                  |
| No financial bypass                       | Isolation work does not expose Gate/Risk/Ledger skip                                                                               |

---

## 3. UI tests

| Case                                      | Must prove                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Honest non-claim                          | Product does not present Connection Management as available because S06 ran                                |
| Admin surfaces retain approved boundaries | People remains the S02 Identity-global Admin projection; no workspace-scoped teammate directory is claimed |
| Cross-tenant attempt UX                   | Foreign access is unavailable or honestly denied — not a B data view                                       |
| Isolation Proof Walkthrough support       | Walkthrough steps can be executed without SSH / customer `.env` / SQL                                      |

If a surface is API-only for Wave 1 (no page yet), mark UI **NOT APPLICABLE** for that surface and require HTTP/integration evidence instead. Do not invent UI to fill a blank.

---

## 4. Manual product walkthrough

Execute the **Isolation Proof Walkthrough** from [`v3-s06-product-scope.md`](./v3-s06-product-scope.md).

Automated tests do **not** replace this walkthrough. Walkthrough does **not** replace the Isolation Matrix suite.

Overall verdict required at Close: **PASS** or **REQUIRES ACTION**.

---

## 5. Security verification gates

| Gate                                      | Required | Evidence                                   |
| ----------------------------------------- | -------- | ------------------------------------------ |
| Security checklist                        | Yes      | Close Security Review                      |
| Threat Review (STRIDE)                    | Yes      | Evidence verdicts, not intent-only         |
| Security Verification Standard (all rows) | Yes      | Mandatory                                  |
| Security Regression Suite §19             | Yes      | Isolation defects leave lasting tests      |
| Privacy rows 13.2 / 13.3                  | Yes      | Primary S06 PASS targets                   |
| Architecture checklist                    | Yes      | No new bounded context; no ownership drift |
| Product checklist                         | Yes      | Honest receive / not-receive               |

A package cannot Close while any owned row is **REQUIRES ACTION**.

---

## 6. Isolation Regression Strategy (validation binding)

| Rule                 | Validation meaning                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Matrix → tests       | Every ✅ planning row has executed ⏳→PASS evidence                                                                               |
| Ordinary suite       | Isolation tests run in normal CI / ordinary test commands                                                                         |
| No assumption credit | Citing S03-d or S05 timeline scope tests alone is insufficient unless S06 explicitly accepts and re-runs them as matrix evidence  |
| Break detection      | Intentionally breaking a scope check (in a controlled test double or negative assertion) proves the suite would catch regressions |
| Cross-product        | Changing one product must not drop another product’s isolation cases                                                              |

---

## 7. Wave 1 Exit Criteria (validation view)

S06 validation produces evidence for these Exit Checklist rows — it does **not** declare Wave 1 COMPLETE.

| Exit Checklist row           | S06 validation must produce                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| Workspace Isolation          | S06 Close record + suite PASS                                                                          |
| Cross-workspace verification | Isolation Matrix all rows PASS or NOT APPLICABLE, with named evidence/reasons                          |
| Security Regression          | Regression Suite PASS for isolation-owned defects                                                      |
| Wave 1 Certification Audit   | **Inputs only** — audit package/index of S01–S06 Close evidence; audit itself runs **after** S06 Close |

### Evidence pack required before claiming Wave 1 COMPLETE (post-S06)

| Evidence                                             | Required                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| S01–S05 Close records accepted                       | Yes (already)                                                          |
| S06 Close record accepted                            | Yes                                                                    |
| Isolation Matrix executed results                    | Yes — all PASS or honestly NOT APPLICABLE, with named evidence/reasons |
| Isolation / Security Regression Suite green          | Yes                                                                    |
| Isolation Proof Walkthrough PASS                     | Yes                                                                    |
| Architecture / Security / Product Close checklists   | Yes                                                                    |
| Independent Wave 1 Certification Audit report        | Yes — PASS + Product Owner acceptance                                  |
| Explicit Product Owner declaration “Wave 1 COMPLETE” | Yes                                                                    |

Until the last two exist, validation may only say: **S06 Closed; Wave 1 Exit not claimed**.

---

## 8. Customer acceptance of Master Plan outcomes

| Outcome                               | Validation                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| I cannot see another workspace’s data | Matrix suite + walkthrough PASS                                                   |
| Other Wave 1 outcomes                 | Not re-proven from scratch; Certification Audit reconciles S01–S05 Close evidence |

---

## 9. Explicit non-validation

Do **not** treat the following as S06 Close evidence:

- Architecture diagrams without tests
- “Membership service exists” statements
- Prior package Close reports alone
- Manual SQL inspection as the primary proof
- Partial suite covering only Vault or only Audit
- A passing unit mock of `assertWorkspace` without HTTP/product-path negatives
- Starting Wave 2 “to test isolation with real keys”

---

## STOP

Planning only. Execute this plan only after Product Owner **Approves** V3-S06 and implementation finishes.
**Do not claim Wave 1 COMPLETE** from S06 validation PASS alone.
