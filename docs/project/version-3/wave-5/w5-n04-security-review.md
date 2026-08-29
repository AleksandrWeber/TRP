# W5-N04 Security Review

**Package:** W5-N04 Push
**Wave:** 5 — Notification Platform
**Master Plan / Roadmap:** V3-N04 · CM-16
**Status:** Planning **OPEN**. Awaiting Planning Review. Not implementation. Slices not opened.
**Date:** 2026-08-29
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Checklist:** [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Default Policy:** [`../security-default-policy.md`](../security-default-policy.md)
**Umbrella:** [`w5-n04-implementation-package.md`](./w5-n04-implementation-package.md)
**Scope:** [`w5-n04-product-scope.md`](./w5-n04-product-scope.md)

```text
Push uses Wave 1 security, Vault, Notification Delivery adapters, and W5-N01…N03 foundation patterns.
It does not replace Vault, Auth, Authz, Isolation, Platform, Audit, or PC-06 routing.
It extends Notification Delivery push I/O only — no command bus, no second routing engine.
Real delivery is not Live Trading.
Push is delivery-only — never a control plane.
No plaintext secret echo. SSRF controls on push provider endpoints only.
Fail Closed.
```

## Planning verdict

| Area                                          | Verdict       |
| --------------------------------------------- | ------------- |
| Authentication / Authorization consumed       | PASS (intent) |
| Workspace Isolation consumed                  | PASS (intent) |
| Vault consumed; no local secret store         | PASS (intent) |
| Security Platform / Audit consumed            | PASS (intent) |
| No Live Trading / capital control             | PASS (intent) |
| No Wave 1–4 / W5-N01…N03 / ownership redesign | PASS (intent) |
| No second notification routing engine         | PASS (intent) |
| Exchange Adapter untouched                    | PASS (intent) |
| Evidence rows                                 | PENDING Close |

---

## Boundary (binding)

| In                                              | Out                                               |
| ----------------------------------------------- | ------------------------------------------------- |
| Workspace-scoped push transport connect/test    | Owning customer secret ciphertext                 |
| Authn/Authz gates on connection surfaces        | Redesigning Auth / Vault / Audit store            |
| Vault retrieve for adapter push send only       | Storing secrets outside Vault                     |
| Honest delivery / Error outcomes                | Live order placement                              |
| Fail closed on missing context                  | Risk / Gate rewrite                               |
| Audit attribution for connect/test/disconnect   | Push as trading control plane                     |
| SSRF allowlist to provider push endpoints       | Arbitrary operator URL fetch                      |
| Workspace-scoped device token registry          | Cross-workspace device token sharing              |
| Verification Standard + regression expectations | Telegram / Email / Slack security (N01, N02, N03) |

---

## Threat model (planning intent)

| Threat                                | Mitigation (planning)                                          |
| ------------------------------------- | -------------------------------------------------------------- |
| Cross-workspace credential use        | Workspace Isolation + Vault scoped retrieve; fail closed       |
| Cross-workspace device token use      | Device registry scoped to workspace; fail closed               |
| Secret echo in logs/UI/errors         | Vault contract; no plaintext in responses                      |
| SSRF via push adapter                 | Provider endpoint allowlist; no operator-supplied URLs         |
| Fake delivery without I/O             | Honest Product; tests require real push round-trip or sandbox  |
| Privilege escalation                  | Reuse Authorization; connect/test requires permitted role      |
| Open push / misconfigured abuse       | Connect/test scoped; workspace-bound; rate limits              |
| Live order via notification path      | Out of scope; Canonical Order Path unchanged; Wave 6 gate      |
| Second routing engine bypassing audit | Forbidden; PC-06 unchanged                                     |
| W5-N01…N03 foundation bypass          | Extend existing owner; no duplicate persistence                |
| Push connected as live enablement     | Real delivery ≠ Live Trading; explicit OUT                     |
| VAPID/FCM token leakage               | Vault-only storage; no echo in UI/logs                         |
| Device token hijack across workspaces | Isolation + workspace-bound registration; revoke on disconnect |

---

## Required coverage

### 1. Workspace isolation

| Outcome          | Required                                            |
| ---------------- | --------------------------------------------------- |
| Workspace scoped | Workspace A cannot use B's credentials/tokens/state |
| Fail closed      | Missing or forged workspace context denies          |

### 2. Authorization

| Outcome             | Required                                             |
| ------------------- | ---------------------------------------------------- |
| Role-gated connect  | Unauthorized roles denied on push transport surfaces |
| No privilege bypass | Push path cannot escalate permissions                |

### 3. Vault and secret handling

| Outcome              | Required                                        |
| -------------------- | ----------------------------------------------- |
| Vault-only secrets   | VAPID/FCM credentials retrieved from Vault only |
| No plaintext echo    | Logs, errors, UI never expose secrets           |
| Revoke on disconnect | Disconnect does not leak stored material        |

### 4. SSRF and endpoint control

| Outcome                 | Required                                       |
| ----------------------- | ---------------------------------------------- |
| Provider endpoints only | Adapter calls allowed push provider hosts only |
| No operator URLs        | Operator cannot supply arbitrary fetch URLs    |
| Push allowlist          | Per Security Vision — no open relay surface    |

### 5. Device token security

| Outcome                  | Required                                            |
| ------------------------ | --------------------------------------------------- |
| Workspace-bound tokens   | Device tokens registered and used in workspace only |
| Revocation on disconnect | Tokens removed or invalidated on disconnect         |
| No token echo            | Device secrets not exposed in UI/logs               |

### 6. Honest Product security

| Outcome                     | Required                                      |
| --------------------------- | --------------------------------------------- |
| No fake delivery labels     | Connected/Delivering requires push evidence   |
| No reserved-as-connected    | Reserved-inactive must not masquerade as live |
| No Live Trading implication | Push test does not enable live orders         |

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
| W5-N03 boundaries    | No reopen; Slack/Discord/Teams unaffected |
| Telegram foundation  | N01 durable anchors unaffected            |
| Email foundation     | N02 durable anchors unaffected            |
| Team chat foundation | N03 durable anchors unaffected            |
| Exchange Scope       | Isolation boundary unchanged              |
| Canonical Order Path | Unchanged                                 |

---

## Explicit non-claims

- Push security verified at Close — **not claimed** (planning intent only)
- Push implemented — **not claimed**
- Push notifications operational — **not claimed**
- CM-16 implemented — **not claimed**
- Notification Platform Complete — **not claimed**
- Wave 5 COMPLETE — **not claimed**
- W5-N04 Planning Review completed — **not claimed**

---

**STOP.** W5-N04 Planning Package is **OPEN**. Await explicit Product Owner instruction before Planning Review. Do not create W5-N04-a. Do not begin implementation.
