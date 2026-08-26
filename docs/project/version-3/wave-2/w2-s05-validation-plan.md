# W2-S05 Validation Plan

**Package:** W2-S05 AI Connectivity Foundation
**Wave:** 2 — Connection Management
**Status:** Planning approved. **W2-S05 CLOSED.** Wave 2 **COMPLETE** — see [`../wave-2-completion-report.md`](../wave-2-completion-report.md) and [`w2-s05-e-validation-report.md`](./w2-s05-e-validation-report.md).
**Date:** 2026-08-26
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Scope:** [`w2-s05-product-scope.md`](./w2-s05-product-scope.md)
**Security:** [`w2-s05-security-review.md`](./w2-s05-security-review.md)
**Umbrella:** [`w2-s05-implementation-package.md`](./w2-s05-implementation-package.md)
**Overview:** [`ai-connectivity-overview.md`](./ai-connectivity-overview.md)
**Checklists:** [`../version-3-product-checklist.md`](../version-3-product-checklist.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md) · [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)

Validation runs after implementation and the implementation report.

Tests that mock the customer outcome (for example: assert a helper was called without proving the operator can store an OpenRouter key, test it, and use AI for the workspace without customer `.env` or restart) do **not** count as Close evidence.

Do not validate Wave 7 multi-provider AI, Knowledge exporters, Notification delivery, Live Trading, exchange order placement, Paper Trading redesign, Market Data redesign, or Connection Management redesign. Validate **AI Connectivity Foundation** product outcomes only.

**Implementation slices:** W2-S05-a through W2-S05-d delivered customer outcomes. W2-S05-e assembled package Close evidence. **W2-S05 is CLOSED.** Wave 2 is **COMPLETE**.

### Slice progress

| Slice    | Name                                | Validation record                                                         |
| -------- | ----------------------------------- | ------------------------------------------------------------------------- |
| W2-S05-a | OpenRouter Connectivity Foundation  | [`w2-s05-a-validation-report.md`](./w2-s05-a-validation-report.md) — PASS |
| W2-S05-b | Workspace AI Request Foundation     | [`w2-s05-b-validation-report.md`](./w2-s05-b-validation-report.md) — PASS |
| W2-S05-c | Workspace AI Session Foundation     | [`w2-s05-c-validation-report.md`](./w2-s05-c-validation-report.md) — PASS |
| W2-S05-d | Workspace AI Request History        | [`w2-s05-d-validation-report.md`](./w2-s05-d-validation-report.md) — PASS |
| W2-S05-e | Package Validation & Close Evidence | [`w2-s05-e-validation-report.md`](./w2-s05-e-validation-report.md) — PASS |

W2-S05-a validates connectivity only. W2-S05-b validates one workspace AI request/response. W2-S05-c validates metadata-only Session lifecycle and request grouping. W2-S05-d validates read-only Request History. W2-S05-e validates the assembled package. None validates chat, conversation reconstruction, AI memory, Knowledge, or AI Platform.

---

## 0. What Close means for W2-S05

| Gate                | Meaning                                                                        | Unlocks                                        |
| ------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------- |
| **W2-S05 Closed**   | AI Connectivity Foundation outcomes evidenced; walkthrough PASS                | Vaulted OpenRouter use without customer `.env` |
| **Wave 2 COMPLETE** | Declared in [`../wave-2-completion-report.md`](../wave-2-completion-report.md) | Wave 3 Planning may open                       |
| **Not claimed**     | Wave 7 AI Platform Complete                                                    | V3-A01…A04                                     |
| **Not claimed**     | Live Trading                                                                   | Wave 6 / Order Path                            |
| **Not claimed**     | Notification delivery                                                          | Wave 5                                         |
| **Not claimed**     | Monitoring product                                                             | Wave 3                                         |

---

## 1. Validation strategy overview

| Layer                         | Purpose                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| Unit validation               | Preference rules, offline honesty, secret non-echo, status integrity    |
| Integration validation        | Vault retrieve → AI Gateway use; OpenRouter test success/failure paths  |
| UI validation                 | Connections OpenRouter journeys; write-only fields; honest statuses     |
| Regression validation         | Wave 1 + W2-S01…W2-S04 security and product boundaries                  |
| Product walkthrough           | AI Connectivity Walkthrough executed in product                         |
| Architecture validation       | No ownership drift; no new bounded context; gateway/facade/vault intact |
| Security validation           | Verification Standard + isolation + authz + no capital control          |
| Package acceptance validation | Acceptance criteria table; Close checklist                              |

---

## 2. Unit validation

| Area                   | Must prove                                                                 |
| ---------------------- | -------------------------------------------------------------------------- |
| Runtime preference     | Workspace vault key preferred when present                                 |
| Fallback policy        | Host env is not production customer story; no auto-import into all tenants |
| Offline honesty        | No usable key → offline; not fake online                                   |
| Status integrity       | Client cannot set Connected / AI online                                    |
| Secret non-echo        | Responses, logs, and errors never include plaintext OpenRouter key         |
| Workspace binding      | Missing/wrong workspace fails closed                                       |
| No capital side effect | Preference/use helpers never invoke live order placement                   |
| No-restart contract    | Preference resolution does not depend on process restart after vault save  |

---

## 3. Integration validation

| Area                                     | Must prove                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| Vault → Gateway use                      | Authorized workspace retrieve powers OpenRouter runtime use               |
| OpenRouter test success                  | Valid vaulted key can produce honest test success                         |
| OpenRouter test failure                  | Invalid / rejected key produces vendor-visible failure                    |
| Rotate invalidates previous              | After replace, previous material is not used                              |
| Disconnect / revoke stops use            | After disconnect/revoke, workspace AI use stops honestly                  |
| Cross-workspace deny                     | Workspace A cannot retrieve or use Workspace B key                        |
| Authz deny                               | Unauthorized role cannot manage or use                                    |
| Connection Management consume            | Uses existing OpenRouter connection record; no second Connections product |
| Paper / Market Data / Exchange untouched | W2-S02…S04 behaviors not redesigned by this package                       |

---

## 4. UI validation

| Area                     | Must prove                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Connections place        | OpenRouter managed under existing Connections AI catalog                                                                 |
| Write-only credentials   | After save, key fields clear; no view/copy/export                                                                        |
| Test action              | Operator can run OpenRouter Test                                                                                         |
| Honest statuses          | Success / failure / offline / Not Configured / Configured / Connected / Connection Failed / Disabled match honesty model |
| AI Connectivity UI (a)   | Configure OpenRouter, Save API Key, Test Connection, status, last test — no chat/prompts                                 |
| No dishonest claims      | UI never claims Live Trading, capital control, Notification, Wave 7                                                      |
| Unauthorized UX          | Denied roles see unavailable / deny — not another workspace’s empty run                                                  |
| No customer `.env` steps | Journey never instructs editing host `.env` for OpenRouter use                                                           |

---

## 5. Regression validation

| Suite                        | Must prove                                           |
| ---------------------------- | ---------------------------------------------------- |
| Wave 1 Authentication        | Login / session unchanged                            |
| Wave 1 Authorization         | Role matrix not rewritten                            |
| Wave 1 Vault                 | Ciphertext ownership unchanged                       |
| Wave 1 Isolation             | Cross-workspace deny still holds elsewhere           |
| Wave 1 Audit / Platform      | Store and platform defaults not forked               |
| W2-S01 Connection Management | Exchange / Notification catalog and lifecycle intact |
| W2-S02 Exchange Connectivity | Connected meaning unchanged                          |
| W2-S03 Market Data           | Market Data honesty unchanged                        |
| W2-S04 Paper Trading         | Paper-only; no Live Trading; no exchange orders      |

---

## 6. Product walkthrough

**Walkthrough name:** AI Connectivity Walkthrough
**Close evidence:** [`w2-s05-live-product-walkthrough.md`](./w2-s05-live-product-walkthrough.md) — **PASS**

```text
☑ Sign in
☑ Open Connections → AI Connectivity
☑ Configure OpenRouter
☑ Store / replace Vault-backed OpenRouter key (write-only)
☑ Run OpenRouter Test — success or vendor-visible failure
☑ Create Workspace AI Session
☑ Submit AI Request / receive one response (no customer .env; no restart)
☑ View AI Request History (list / filter / entry)
☑ Confirm no conversation, memory, knowledge, Live Trading, Wave 7 Complete
```

Overall verdict for Package Review: **PASS**. Only Product Owner may declare W2-S05 CLOSED.

---

## 7. Architecture validation

| Rule                                | Must prove at Close                                             |
| ----------------------------------- | --------------------------------------------------------------- |
| No new bounded context              | Outcomes live on existing Connections / Vault / AI Gateway line |
| No ownership drift                  | Vault / Auth / Authz / Workspace / Platform / Audit unchanged   |
| Connection Management unchanged SoT | Facade not replaced                                             |
| AI Gateway remains protocol owner   | No second gateway domain                                        |
| Canonical Order Path / Ledger       | Untouched                                                       |
| Provider / transport independence   | Product boundary does not hard-wire UI as SoT                   |
| Version 2 architecture preserved    | No Version 2 redesign                                           |

---

## 8. Security validation

| Area                       | Must prove                                                |
| -------------------------- | --------------------------------------------------------- |
| Verification Standard      | Every applicable category/row evidenced                   |
| Isolation                  | A↛B OpenRouter material                                   |
| Authorization              | Unauthorized deny                                         |
| Secret handling            | No plaintext echo / export / local store                  |
| No host env tenant fan-out | Host OpenRouter env not auto-imported into all workspaces |
| No capital control         | No live order / Gate-Risk bypass from AI connectivity     |
| Audit                      | Test / use / fail / offline attributable                  |
| Fail closed                | Missing vault / permission / workspace denies             |

---

## 9. Package acceptance validation

| #   | Acceptance criterion                                             | Evidence type       |
| --- | ---------------------------------------------------------------- | ------------------- |
| 1   | Vaulted OpenRouter key used without customer `.env`              | Walkthrough + tests |
| 2   | Save/rotate does not require operator restart for use            | Walkthrough + tests |
| 3   | OpenRouter Test success or vendor-visible failure                | Walkthrough + tests |
| 4   | Honest offline when no usable workspace key                      | Walkthrough + tests |
| 5   | Cross-workspace deny                                             | Isolation tests     |
| 6   | Unauthorized deny                                                | Authz tests         |
| 7   | No Live Trading / capital control / Notification / Wave 7 claims | Product review      |
| 8   | No plaintext secret exposure                                     | Security review     |

Close command validation (executed at W2-S05-e Close evidence):

- `pnpm lint` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS
- `pnpm --filter @trp/web build` — PASS
- `git diff --check` — PASS

---

## 10. Slice note

W2-S05-a through W2-S05-d delivered package outcomes. W2-S05-e assembled Close evidence. **W2-S05 is CLOSED.** Wave 2 is **COMPLETE** — see [`../wave-2-completion-report.md`](../wave-2-completion-report.md).

---

**STOP.** Wave 2 COMPLETE. Do not begin Wave 3 implementation until Wave 3 Planning is Approved.
