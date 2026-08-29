# W5-N03 Security Review

**Package:** W5-N03 Slack / Discord / Teams
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N03 · CM-13, CM-14, CM-15
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Date:** 2026-08-29
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Checklist:** [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Default Policy:** [`../security-default-policy.md`](../security-default-policy.md)
**Umbrella:** [`w5-n03-implementation-package.md`](./w5-n03-implementation-package.md)
**Scope:** [`w5-n03-product-scope.md`](./w5-n03-product-scope.md)

```text
Slack / Discord / Teams uses Wave 1 security, Vault, Notification Delivery adapters, and W5-N01/W5-N02 foundation patterns.
It does not replace Vault, Auth, Authz, Isolation, Platform, Audit, or PC-06 routing.
It extends Notification Delivery webhook I/O only — no command bus, no second routing engine.
Real delivery is not Live Trading.
Team chat channels are delivery-only — never a control plane.
No plaintext secret echo. SSRF controls on webhook/provider endpoints only.
Fail Closed.
```

## Planning verdict

| Area                                               | Verdict       |
| -------------------------------------------------- | ------------- |
| Authentication / Authorization consumed            | PASS (intent) |
| Workspace Isolation consumed                       | PASS (intent) |
| Vault consumed; no local secret store              | PASS (intent) |
| Security Platform / Audit consumed                 | PASS (intent) |
| No Live Trading / capital control                  | PASS (intent) |
| No Wave 1–4 / W5-N01 / W5-N02 / ownership redesign | PASS (intent) |
| No second notification routing engine              | PASS (intent) |
| Exchange Adapter untouched                         | PASS (intent) |
| Evidence rows                                      | PENDING Close |

---

## Boundary (binding)

| In                                              | Out                                              |
| ----------------------------------------------- | ------------------------------------------------ |
| Workspace-scoped webhook transport connect/test | Owning customer secret ciphertext                |
| Authn/Authz gates on connection surfaces        | Redesigning Auth / Vault / Audit store           |
| Vault retrieve for adapter webhook send only    | Storing secrets outside Vault                    |
| Honest delivery / Error outcomes                | Live order placement                             |
| Fail closed on missing context                  | Risk / Gate rewrite                              |
| Audit attribution for connect/test/disconnect   | Team chat as trading control plane               |
| SSRF allowlist to provider webhook endpoints    | Arbitrary operator URL fetch                     |
| Verification Standard + regression expectations | Telegram / Email / Push security (N01, N02, N04) |

---

## Threat model (planning intent)

| Threat                                | Mitigation (planning)                                            |
| ------------------------------------- | ---------------------------------------------------------------- |
| Cross-workspace credential use        | Workspace Isolation + Vault scoped retrieve; fail closed         |
| Secret echo in logs/UI/errors         | Vault contract; no plaintext in responses                        |
| SSRF via webhook adapter              | Provider endpoint allowlist; no operator-supplied URLs           |
| Fake delivery without I/O             | Honest Product; tests require real webhook round-trip or sandbox |
| Privilege escalation                  | Reuse Authorization; connect/test requires permitted role        |
| Open webhook / misconfigured abuse    | Connect/test scoped; workspace-bound; rate limits                |
| Live order via notification path      | Out of scope; Canonical Order Path unchanged; Wave 6 gate        |
| Second routing engine bypassing audit | Forbidden; PC-06 unchanged                                       |
| W5-N01 / W5-N02 foundation bypass     | Extend existing owner; no duplicate persistence                  |
| Webhook connected as live enablement  | Real delivery ≠ Live Trading; explicit OUT                       |
| Webhook URL token leakage             | Vault-only storage; no echo in UI/logs                           |

---

## Required coverage

### 1. Workspace isolation

| Outcome          | Required                                             |
| ---------------- | ---------------------------------------------------- |
| Workspace scoped | Workspace A cannot use B's webhook credentials/state |
| Fail closed      | Missing or forged workspace context denies           |

### 2. Authorization

| Outcome             | Required                                                |
| ------------------- | ------------------------------------------------------- |
| Role-gated connect  | Unauthorized roles denied on webhook transport surfaces |
| No privilege bypass | Webhook path cannot escalate permissions                |

### 3. Vault and secret handling

| Outcome              | Required                                      |
| -------------------- | --------------------------------------------- |
| Vault-only secrets   | Webhook credentials retrieved from Vault only |
| No plaintext echo    | Logs, errors, UI never expose secrets         |
| Revoke on disconnect | Disconnect does not leak stored material      |

### 4. SSRF and endpoint control

| Outcome                 | Required                                    |
| ----------------------- | ------------------------------------------- |
| Provider endpoints only | Adapter calls allowed webhook hosts only    |
| No operator URLs        | Operator cannot supply arbitrary fetch URLs |
| Webhook allowlist       | Per Security Vision — no open relay surface |

### 5. Honest Product security

| Outcome                     | Required                                       |
| --------------------------- | ---------------------------------------------- |
| No fake delivery labels     | Connected/Delivering requires webhook evidence |
| No reserved-as-connected    | Reserved-inactive must not masquerade as live  |
| No Live Trading implication | Webhook test does not enable live orders       |

---

## Architecture security verification

| Check                                     | Verdict                                            |
| ----------------------------------------- | -------------------------------------------------- |
| Notification Platform ownership preserved | **PASS** — Wave 5 scope only                       |
| Notification Delivery ownership preserved | **PASS** — adapter extension only                  |
| Persistence ownership preserved           | **PASS** — extend notification-delivery owner      |
| Exchange Adapter ownership preserved      | **PASS** — untouched                               |
| Secret Vault ownership preserved          | **PASS** — Vault owns credentials                  |
| Connection Management ownership preserved | **PASS** — consumed; not redesigned                |
| Workspace ownership preserved             | **PASS** — workspace-scoped state                  |
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
| W5-N02 boundaries    | No reopen; Email foundation unaffected    |
| Telegram foundation  | N01 durable anchors unaffected            |
| Email foundation     | N02 durable anchors unaffected            |
| Exchange Scope       | Isolation boundary unchanged              |
| Canonical Order Path | Unchanged                                 |

---

## Explicit non-claims

- Slack / Discord / Teams security verified at Close — **not claimed** (planning intent only)
- Slack implemented — **not claimed**
- Discord implemented — **not claimed**
- Microsoft Teams implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- Wave 5 COMPLETE — **not claimed**

---

**STOP.** W5-N03 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N03-a. Do not begin implementation.
