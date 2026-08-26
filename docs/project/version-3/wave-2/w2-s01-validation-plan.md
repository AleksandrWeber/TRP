# W2-S01 Validation Plan

**Package:** W2-S01 Connection Management
**Wave:** 2 — Connection Management
**Status:** Planning **COMPLETE**. Not executed. Awaiting Product Owner Approval, then implementation, then validation.
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w2-s01-product-scope.md`](./w2-s01-product-scope.md)
**Security:** [`w2-s01-security-review.md`](./w2-s01-security-review.md)
**Umbrella:** [`w2-s01-implementation-package.md`](./w2-s01-implementation-package.md)
**Overview:** [`connection-management-overview.md`](./connection-management-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a helper was called without proving the operator can create and validate a connection in the product) do **not** count as Close evidence.

Do not validate exchange adapter I/O completion, Telegram send, SMTP send, OpenRouter chat execution, live order placement, monitoring dashboards, analytics, or billing. Validate **Connection Management** product outcomes only.

---

## 0. What Close means for W2-S01

| Gate              | Meaning                                                                                 | Unlocks                                          |
| ----------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **W2-S01 Closed** | Connection Management product outcomes for this package are evidenced; walkthrough PASS | Remaining Wave 2 sequencing / follow-on packages |
| **Not claimed**   | Wave 2 COMPLETE (full Execution Roadmap exit)                                           | All Wave 2 exit criteria                         |
| **Not claimed**   | Real Binance/Bybit/OKX handshake                                                        | Wave 4                                           |
| **Not claimed**   | Telegram / SMTP delivery                                                                | Wave 5                                           |
| **Not claimed**   | Live trading                                                                            | Wave 6                                           |
| **Not claimed**   | Monitoring product                                                                      | Wave 3                                           |

---

## 1. Implementation slices (validation mapping)

| Slice        | Must prove at slice review                             | Close contribution |
| ------------ | ------------------------------------------------------ | ------------------ |
| **W2-S01-a** | Catalog + metadata; honest non-Connected defaults      | Foundation         |
| **W2-S01-b** | Create/replace via Vault; secret not readable back     | Secret path        |
| **W2-S01-c** | Pending Validation → Connected \| Validation Failed    | State machine      |
| **W2-S01-d** | Disconnect / revoke / disable / review                 | Lifecycle complete |
| **W2-S01-e** | Verification Standard + regressions + full walkthrough | Close evidence     |

---

## W2-S01-a execution record

| Slice assertion                                                                                           | Result |
| --------------------------------------------------------------------------------------------------------- | ------ |
| Operator-visible catalog exposes Exchange, Notification, and AI only                                      | PASS   |
| Catalog exposes Binance, Bybit, OKX, Telegram, SMTP, and OpenRouter only                                  | PASS   |
| Metadata records are scoped to one workspace and require existing membership checks                       | PASS   |
| Create and rename require the existing own-workspace permission                                           | PASS   |
| New metadata records project only Disconnected                                                            | PASS   |
| Credentials, Vault integration, provider I/O, validation, delete, and other status transitions are absent | PASS   |

Evidence: [`w2-s01-a-validation-report.md`](./w2-s01-a-validation-report.md).

---

## W2-S01-b execution record

| Slice assertion                                                                   | Result |
| --------------------------------------------------------------------------------- | ------ |
| Credentials are stored and replaced only through the existing Vault               | PASS   |
| Connection metadata stores only an opaque nullable Vault reference                | PASS   |
| Credential mutation consumes existing C8 authorization and workspace verification | PASS   |
| Responses never contain credential material or Vault identifiers                  | PASS   |
| Credentials are cleared from the UI after save and cannot be revealed             | PASS   |
| Connection status remains Disconnected                                            | PASS   |
| Existing Vault created/replaced lifecycle events provide audit evidence           | PASS   |

Evidence: [`w2-s01-b-validation-report.md`](./w2-s01-b-validation-report.md).

---

## W2-S01-c execution record

| Slice assertion                                                                                | Result |
| ---------------------------------------------------------------------------------------------- | ------ |
| Validation transitions from Disconnected or Validation Failed through Pending Validation       | PASS   |
| Connected is assigned only after provider-independent validator success                        | PASS   |
| Validation reads credentials server-side from the existing Vault and never projects them       | PASS   |
| Validation is scoped to the owning workspace and consumes existing C8 authorization            | PASS   |
| Security Audit records validation started, succeeded, and failed                               | PASS   |
| Connections UI offers validation, shows each validation state, and permits retry after failure | PASS   |
| Provider I/O, background jobs, live trading, delivery, and AI execution remain absent          | PASS   |

Evidence: [`w2-s01-c-validation-report.md`](./w2-s01-c-validation-report.md).

---

## W2-S01-d execution record

| Slice assertion                                                                                   | Result |
| ------------------------------------------------------------------------------------------------- | ------ |
| Replacing credentials replaces Vault material and returns a connected connection to Disconnected  | PASS   |
| Disconnect changes Connected to Disconnected without provider communication or secret deletion    | PASS   |
| Disable prevents validation and presents Disabled status                                          | PASS   |
| Revoke makes the Vault credential unusable, presents Revoked status, and requires new credentials | PASS   |
| Lifecycle actions retain workspace isolation and existing C8 authorization                        | PASS   |
| Security Audit records credentials replaced, disconnected, disabled, and revoked                  | PASS   |
| UI shows lifecycle actions and never reveals or exports credentials                               | PASS   |

Evidence: [`w2-s01-d-validation-report.md`](./w2-s01-d-validation-report.md).

---

## W2-S01-e close evidence record

| Close evidence                                                                    | Result                               |
| --------------------------------------------------------------------------------- | ------------------------------------ |
| Implementation, architecture, security, product, and validation reviews           | PASS                                 |
| Security Verification Standard worksheet, OWASP mappings, and regression evidence | PASS                                 |
| Automated walkthrough-step evidence; live operator session not recorded           | RECORDED                             |
| Lint, typecheck, full tests, web build, and diff check                            | PASS                                 |
| Readiness Delta and Certification Readiness                                       | Ready for Product Owner Close Review |
| Product Owner Close decision                                                      | PENDING                              |

Evidence: [`w2-s01-close-report.md`](./w2-s01-close-report.md), [`w2-s01-certification-readiness.md`](./w2-s01-certification-readiness.md), and [`w2-s01-security-verification-worksheet.md`](./w2-s01-security-verification-worksheet.md).

---

## 2. Unit tests

| Area                       | Must prove                                                                   |
| -------------------------- | ---------------------------------------------------------------------------- |
| State transitions          | Illegal jumps to Connected without validation success rejected               |
| Provider catalog rules     | Connection Type → Provider honesty; reserved vs offered; Storage not offered |
| Workspace scope predicates | Missing/wrong workspace fails closed                                         |
| Secret field shaping       | Responses never include raw secret material                                  |
| Status projection          | Vault-revoked secret cannot project as Connected                             |

---

## 3. Integration tests

| Case family                   | Must prove                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Create connection             | Metadata created; secret stored only via Vault                                  |
| Validate success / failure    | Connected vs Validation Failed; Pending Validation transitional                 |
| Replace credentials           | New secret in Vault; re-validation required before Connected                    |
| Disconnect / revoke / disable | Connected use stops; states honest                                              |
| Cross-workspace deny          | A cannot list/mutate B connections                                              |
| Unauthorized role deny        | Mutate denied for roles without permission                                      |
| Audit emit                    | Lifecycle events recorded for create/validate/replace/disconnect                |
| No deferred I/O false success | Where vendor I/O is out of scope, product does not claim live Connected theater |
| Wave 1 unregressed            | Login, RBAC, Vault, isolation, audit still work inside workspace A              |

---

## 4. UI tests

| Case                       | Must prove                                                          |
| -------------------------- | ------------------------------------------------------------------- |
| Connections surface exists | Operator can open Connections without SSH                           |
| Secret fields write-only   | After save, secret values not shown                                 |
| Status badges honest       | Connected only after validation success path                        |
| Failure path visible       | Validation Failed shown without fake success                        |
| Unauthorized UX            | Unavailable or deny — not foreign/empty success theater             |
| No live/delivery/AI claims | Copy does not claim Wave 4/5/6/7 outcomes this package does not own |

---

## 5. Manual product walkthrough (mandatory)

Execute the **Connection Management Walkthrough** from [`w2-s01-product-scope.md`](./w2-s01-product-scope.md) and [`connection-management-overview.md`](./connection-management-overview.md).

```text
Connection Management Walkthrough

□ Sign in
□ Open Connections
□ Create connection (secret hidden after save)
□ Validate → Connected or Validation Failed
□ Replace credentials
□ Disconnect or revoke/disable
□ Review status (no plaintext secrets)
□ Foreign workspace denied
□ Unauthorized role denied
□ No live trading / delivery / AI-online claim from this package alone

PASS / REQUIRES ACTION
```

Automated tests do **not** replace this walkthrough.

| Field                   | Value (at execution)                                              |
| ----------------------- | ----------------------------------------------------------------- |
| Walkthrough name        | Connection Management Walkthrough                                 |
| Executed in the product | No live session recorded; ordinary tests cover each required step |
| Overall                 | Ready for Product Owner Close Review                              |

---

## 6. Close criteria

W2-S01 may Close only when all are true:

| #   | Criterion                                                                   | Verdict (at Close) |
| --- | --------------------------------------------------------------------------- | ------------------ |
| 1   | All in-scope slices done; Implementation Report written                     | PENDING            |
| 2   | Architecture checklist PASS; no ownership drift                             | PENDING            |
| 3   | Security checklist + STRIDE + Verification Standard + Regression Suite PASS | PENDING            |
| 4   | Product checklist PASS; Walkthrough PASS                                    | PENDING            |
| 5   | Validation plan executed; evidence recorded                                 | PENDING            |
| 6   | Mandatory reports present and consistent                                    | PENDING            |
| 7   | Master Plan compliance (no invented scope)                                  | PENDING            |
| 8   | Product Principles respected                                                | PENDING            |
| 9   | No SSH / customer `.env` / manual SQL in customer journeys                  | PENDING            |

---

## 7. Mandatory evidence

| Evidence                        | Form                                                              |
| ------------------------------- | ----------------------------------------------------------------- |
| Unit + integration results      | Ordinary CI / test run artifacts                                  |
| UI evidence                     | UI tests and/or recorded walkthrough notes                        |
| Product Walkthrough             | Completed checklist with PASS                                     |
| Security Verification worksheet | Every row PASS / NOT APPLICABLE                                   |
| Security Regression Suite       | Automated tests for Connections-owned fixed vulns                 |
| Architecture checklist          | Completed at Close                                                |
| Product checklist               | Completed at Close                                                |
| Cross-tenant deny evidence      | Integration proof A↛B                                             |
| Honest non-claim evidence       | Screenshots or test asserts that live/delivery/AI are not claimed |

---

## 8. Operator walkthrough (validation role)

The validator is an operator, not a host engineer.

1. Sign in to Workspace A with connection permission.
2. Open Connections.
3. Create one offered connection; confirm secret not shown after save.
4. Run Validate; observe Pending Validation then Connected or Validation Failed.
5. Replace credentials; confirm re-validation path.
6. Disconnect (or revoke/disable); confirm not Connected.
7. Review status; confirm no plaintext secret.
8. Switch to Workspace B context (or second operator); confirm A’s connections are inaccessible.
9. Sign in as unauthorized role; confirm mutate unavailable/denied.
10. Confirm UI does not claim live trading, Telegram delivered, email sent, or AI online from this package alone.

---

## 9. Regression strategy

| Class                 | Strategy                                                          |
| --------------------- | ----------------------------------------------------------------- |
| State machine         | Transition unit tests remain in ordinary suite                    |
| Secret non-disclosure | Response-shape tests on create/replace/get                        |
| Cross-tenant          | Isolation cases for connection routes in ordinary suite           |
| Authz                 | Role deny cases                                                   |
| Honest status         | Connected-without-validation must fail forever as regression      |
| Wave 1 smoke          | Login / Vault / isolation smoke not regressed by Connections work |
| Found vulnerabilities | Each Connections-owned fix adds a named regression test           |

---

## 10. Security Verification Standard expectations

| Expectation                                            | Required at Close |
| ------------------------------------------------------ | ----------------- |
| Categories 1–14 completed for connection surfaces      | Yes               |
| OWASP Top 10 mapping                                   | Yes               |
| OWASP API Top 10 mapping                               | Yes               |
| Timing/Abuse where validate/replace can be spammed     | Yes               |
| Regression Suite rows                                  | Yes               |
| NOT APPLICABLE named for out-of-scope live/delivery/AI | Yes               |
| Zero REQUIRES ACTION                                   | Yes               |

---

## 11. Explicit non-goals for validation

Do not treat the following as W2-S01 Close evidence:

- Successful live exchange order
- Telegram message received on a phone
- SMTP inbox delivery
- OpenRouter chat completion as an AI product journey
- Monitoring dashboard widgets
- Billing invoices
- Wave 1 recertification (Wave 1 is already CERTIFIED COMPLETE)

---

**STOP.** Wait for Product Owner review before W2-S01 implementation begins. Execute this plan only after implementation.
