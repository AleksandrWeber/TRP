# Wave 5 Security Review

**Wave:** 5 — Notification Platform
**First package:** W5-N01 Production Telegram Bot API
**Master Plan / Roadmap:** V3-N01…N04 · CM-11…CM-16
**Status:** Planning **OPEN**. Awaiting Product Owner Review. Not implementation. Slices not opened.
**Date:** 2026-08-28
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Checklist:** [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Default Policy:** [`../security-default-policy.md`](../security-default-policy.md)
**Umbrella:** [`wave-5-implementation-package.md`](./wave-5-implementation-package.md)
**Scope:** [`wave-5-product-scope.md`](./wave-5-product-scope.md)
**Readiness:** [`implementation-readiness-checklist.md`](./implementation-readiness-checklist.md)

```text
Notification Platform uses Wave 1 security, Vault, and Notification Delivery adapters.
It does not replace Vault, Auth, Authz, Isolation, Platform, Audit, or PC-06 routing.
It extends Notification Delivery transports only — no command bus, no second routing engine.
Real delivery is not Live Trading.
Telegram is delivery-only — never a control plane.
No plaintext secret echo. SSRF controls on provider endpoints only.
Fail Closed.
```

## Planning verdict

| Area                                    | Verdict       |
| --------------------------------------- | ------------- |
| Authentication / Authorization consumed | PASS (intent) |
| Workspace Isolation consumed            | PASS (intent) |
| Vault consumed; no local secret store   | PASS (intent) |
| Security Platform / Audit consumed      | PASS (intent) |
| No Live Trading / capital control       | PASS (intent) |
| No Wave 1–4 / ownership redesign        | PASS (intent) |
| No Telegram command bus                 | PASS (intent) |
| No second notification routing engine   | PASS (intent) |
| Exchange Adapter untouched              | PASS (intent) |
| Evidence rows                           | PENDING Close |

---

## Boundary (binding)

| In                                                 | Out                                              |
| -------------------------------------------------- | ------------------------------------------------ |
| Workspace-scoped transport connect/test/disconnect | Owning customer secret ciphertext                |
| Authn/Authz gates on connection surfaces           | Redesigning Auth / Vault / Audit store           |
| Vault retrieve for adapter send only               | Storing secrets outside Vault                    |
| Honest delivery / Error outcomes                   | Live order placement                             |
| Fail closed on missing context                     | Risk / Gate rewrite                              |
| Audit attribution for connect/test/disconnect      | Telegram trading commands                        |
| SSRF allowlist to provider endpoints               | Arbitrary operator URL fetch                     |
| Verification Standard + regression expectations    | Email/Slack/Push security (N02–N04) at N01 scope |
| Telegram delivery-only invariant                   | Exchange I/O security (Wave 4)                   |

---

## Threat model (planning intent)

| Threat                                | Mitigation (planning)                                             |
| ------------------------------------- | ----------------------------------------------------------------- |
| Cross-workspace credential use        | Workspace Isolation + Vault scoped retrieve; fail closed          |
| Secret echo in logs/UI/errors         | Vault contract; no plaintext in responses                         |
| SSRF via adapter                      | Provider endpoint allowlist; no operator-supplied URLs            |
| Fake delivery without I/O             | Honest Product; tests require real round-trip or recorded sandbox |
| Privilege escalation                  | Reuse Authorization; connect/test requires permitted role         |
| Telegram as trading control plane     | Forbidden; conformance tests reject trade commands                |
| AI-initiated notification trade       | Out of scope; routing cannot bypass Gate/Risk                     |
| Stolen bot token / webhook secret     | Vault revoke/disconnect; rotation product Wave 2 (C04)            |
| Second routing engine bypassing audit | Forbidden; PC-06 unchanged                                        |

---

## Required coverage

### 1. Workspace isolation

| Outcome          | Required                                        |
| ---------------- | ----------------------------------------------- |
| Workspace scoped | Workspace A cannot connect/test with B's tokens |
| Fail closed      | Missing or forged workspace context denies      |

### 2. Authorization

| Outcome            | Required                                     |
| ------------------ | -------------------------------------------- |
| Authenticated only | Anonymous connect/test denied                |
| Authorized only    | Roles without permission cannot connect/test |
| No new role        | Reuse existing Authorization                 |
| Fail closed        | Missing permission denies                    |

### 3. Secret handling

| Outcome                | Required                                                  |
| ---------------------- | --------------------------------------------------------- |
| Vault-only credentials | Adapters retrieve from Vault; no local persistence        |
| No plaintext echo      | Logs, errors, exports never include bot tokens / secrets  |
| Send in adapter only   | Secrets used for provider signing inside adapter boundary |
| Disconnect stops use   | Revoked/disconnected material not used for new sends      |

### 4. Network / SSRF

| Outcome                 | Required                                                        |
| ----------------------- | --------------------------------------------------------------- |
| Provider endpoints only | Telegram `api.telegram.org`; SMTP allowlist; webhook allowlists |
| No arbitrary fetch      | Operator cannot supply callback URLs                            |

### 5. Honest product security

| Outcome                    | Required                                       |
| -------------------------- | ---------------------------------------------- |
| No fake delivery           | Status requires successful round-trip evidence |
| No live trading claim      | UI/API must not imply live capital orders      |
| Telegram delivery-only     | No start/stop/approve trade via Telegram       |
| Expired/permission honesty | Provider errors mapped to honest labels        |

### 6. Architecture security

| Outcome                | Required                                                   |
| ---------------------- | ---------------------------------------------------------- |
| No command bus         | Telegram forbidden as control plane                        |
| No second routing SoT  | PC-06 unchanged                                            |
| No ownership drift     | Vault / Notification Delivery / Exchange Adapter unchanged |
| Exchange I/O untouched | Wave 5 does not modify Wave 4                              |

---

## Security Verification Standard (at Close)

Every category and row of [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md) must be evidenced at package Close. Planning intent above is the baseline.

---

## Explicit non-claims

- Security Review PASS at Close — **not claimed** (planning only)
- Live Trading security controls — **not claimed** (Wave 6)
- Replay protection on financial APIs — **not claimed** (V3-L05)
- W5-N01 APPROVED — **not claimed**
- Telegram control plane tested — **not claimed**

---

**STOP.** Planning **OPEN** only. Close evidence recorded only after approved implementation.
