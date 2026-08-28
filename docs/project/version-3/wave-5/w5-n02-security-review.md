# W5-N02 Security Review

**Package:** W5-N02 Email SMTP
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N02 · CM-12
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Date:** 2026-08-28
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Checklist:** [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Default Policy:** [`../security-default-policy.md`](../security-default-policy.md)
**Umbrella:** [`w5-n02-implementation-package.md`](./w5-n02-implementation-package.md)
**Scope:** [`w5-n02-product-scope.md`](./w5-n02-product-scope.md)

```text
Email SMTP uses Wave 1 security, Vault, Notification Delivery adapters, and W5-N01 foundation patterns.
It does not replace Vault, Auth, Authz, Isolation, Platform, Audit, or PC-06 routing.
It extends Notification Delivery SMTP I/O only — no command bus, no second routing engine.
Real delivery is not Live Trading.
Email is delivery-only — never a control plane.
Auth host mail (S01-e) remains separate — not merged with Notification SMTP.
No plaintext secret echo. SSRF controls on SMTP/provider endpoints only.
Fail Closed.
```

## Planning verdict

| Area                                      | Verdict       |
| ----------------------------------------- | ------------- |
| Authentication / Authorization consumed   | PASS (intent) |
| Workspace Isolation consumed              | PASS (intent) |
| Vault consumed; no local secret store     | PASS (intent) |
| Security Platform / Audit consumed        | PASS (intent) |
| No Live Trading / capital control         | PASS (intent) |
| No Wave 1–4 / W5-N01 / ownership redesign | PASS (intent) |
| No second notification routing engine     | PASS (intent) |
| Exchange Adapter untouched                | PASS (intent) |
| Auth host mail separation preserved       | PASS (intent) |
| Evidence rows                             | PENDING Close |

---

## Boundary (binding)

| In                                              | Out                                              |
| ----------------------------------------------- | ------------------------------------------------ |
| Workspace-scoped email transport connect/test   | Owning customer secret ciphertext                |
| Authn/Authz gates on email connection surfaces  | Redesigning Auth / Vault / Audit store           |
| Vault retrieve for adapter SMTP send only       | Storing secrets outside Vault                    |
| Honest delivery / Error outcomes                | Live order placement                             |
| Fail closed on missing context                  | Risk / Gate rewrite                              |
| Audit attribution for connect/test/disconnect   | Email as trading control plane                   |
| SSRF allowlist to SMTP/provider endpoints       | Arbitrary operator URL fetch                     |
| Verification Standard + regression expectations | Telegram / Slack / Push security (N01, N03, N04) |
| Notification SMTP product path                  | Auth password-recovery host mail (S01-e)         |

---

## Threat model (planning intent)

| Threat                                | Mitigation (planning)                                         |
| ------------------------------------- | ------------------------------------------------------------- |
| Cross-workspace credential use        | Workspace Isolation + Vault scoped retrieve; fail closed      |
| Secret echo in logs/UI/errors         | Vault contract; no plaintext in responses                     |
| SSRF via SMTP adapter                 | Provider endpoint allowlist; no operator-supplied URLs        |
| Fake delivery without I/O             | Honest Product; tests require real SMTP round-trip or sandbox |
| Privilege escalation                  | Reuse Authorization; connect/test requires permitted role     |
| Auth host mail conflation             | Separate code paths; inventory flags S01-e vs V3-N02          |
| Open relay / misconfigured SMTP abuse | Connect/test scoped; workspace-bound; rate limits             |
| Live order via notification path      | Out of scope; Canonical Order Path unchanged; Wave 6 gate     |
| Second routing engine bypassing audit | Forbidden; PC-06 unchanged                                    |
| W5-N01 foundation bypass              | Extend existing owner; no duplicate persistence               |
| SMTP connected as live enablement     | Real delivery ≠ Live Trading; explicit OUT                    |

---

## Required coverage

### 1. Workspace isolation

| Outcome          | Required                                          |
| ---------------- | ------------------------------------------------- |
| Workspace scoped | Workspace A cannot use B's SMTP credentials/state |
| Fail closed      | Missing or forged workspace context denies        |

### 2. Authorization

| Outcome             | Required                                              |
| ------------------- | ----------------------------------------------------- |
| Role-gated connect  | Unauthorized roles denied on email transport surfaces |
| No privilege bypass | Email path cannot escalate permissions                |

### 3. Vault and secret handling

| Outcome              | Required                                   |
| -------------------- | ------------------------------------------ |
| Vault-only secrets   | SMTP credentials retrieved from Vault only |
| No plaintext echo    | Logs, errors, UI never expose secrets      |
| Revoke on disconnect | Disconnect does not leak stored material   |

### 4. SSRF and endpoint control

| Outcome                 | Required                                    |
| ----------------------- | ------------------------------------------- |
| Provider endpoints only | Adapter calls allowed SMTP hosts only       |
| No operator URLs        | Operator cannot supply arbitrary fetch URLs |
| SMTP allowlist          | Per Security Vision — no open relay surface |

### 5. Honest Product security

| Outcome                     | Required                                                   |
| --------------------------- | ---------------------------------------------------------- |
| No fake delivery labels     | Connected/Delivering requires SMTP evidence                |
| No reserved-as-connected    | Reserved-inactive must not masquerade as live              |
| No Live Trading implication | SMTP test does not enable live orders                      |
| Host mail separation        | Recovery mail path cannot impersonate notification product |

---

## Architecture security verification

| Check                                     | Verdict                                            |
| ----------------------------------------- | -------------------------------------------------- |
| Notification Platform ownership preserved | **PASS** — Wave 5 scope only                       |
| Notification Delivery ownership preserved | **PASS** — adapter extension only                  |
| Persistence ownership preserved           | **PASS** — extend notification-delivery owner      |
| Exchange Adapter ownership preserved      | **PASS** — untouched                               |
| No duplicate subsystem                    | **PASS**                                           |
| No duplicate Source of Truth              | **PASS** — PC-06 routing unchanged                 |
| No ownership drift                        | **PASS** — Vault / Connection Management unchanged |
| No Version 2 modification                 | **PASS**                                           |
| No Master Plan modification               | **PASS**                                           |

---

## Regression expectations (at Close)

| Area                 | Must hold                                 |
| -------------------- | ----------------------------------------- |
| Wave 1–4 boundaries  | No redesign of closed waves               |
| W5-N01 boundaries    | No reopen; no duplicate persistence owner |
| Auth host mail       | S01-e recovery path unchanged             |
| Telegram foundation  | N01 durable anchors unaffected            |
| Exchange Scope       | Isolation boundary unchanged              |
| Canonical Order Path | Unchanged                                 |

---

## Explicit non-claims

- Email SMTP security verified at Close — **not claimed** (planning intent only)
- SMTP implemented — **not claimed**
- Email notifications operational — **not claimed**
- Notification Platform Complete — **not claimed**
- Wave 5 COMPLETE — **not claimed**

---

**STOP.** W5-N02 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N02-a. Do not begin implementation.
