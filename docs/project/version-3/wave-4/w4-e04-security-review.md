# W4-E04 Security Review

**Package:** W4-E04 Kraken Adapter (factory)
**Wave:** 4 — Exchange Connectivity
**Master Plan / Roadmap:** V3-E04 · CM-10
**Status:** Planning **OPEN**. Awaiting Product Owner Review. Not implementation. Slices not opened.
**Date:** 2026-08-28
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Checklist:** [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Default Policy:** [`../security-default-policy.md`](../security-default-policy.md)
**Umbrella:** [`w4-e04-implementation-package.md`](./w4-e04-implementation-package.md)
**Scope:** [`w4-e04-product-scope.md`](./w4-e04-product-scope.md)

```text
Kraken Adapter (factory) uses Wave 1 security, Vault, Exchange Adapter factory, and W4-E01/E02/E03 foundation patterns.
It does not replace Vault, Auth, Authz, Isolation, Platform, or Audit.
It extends Exchange Adapter I/O only — no engine clone, no new order path.
Connected is not Live Trading.
No plaintext secret echo. SSRF controls on Kraken vendor endpoints only.
Fail Closed.
Honest not-offered when adapter not delivered.
```

## Planning verdict

| Area                                              | Verdict       |
| ------------------------------------------------- | ------------- |
| Authentication / Authorization consumed           | PASS (intent) |
| Workspace Isolation consumed                      | PASS (intent) |
| Vault consumed; no local secret store             | PASS (intent) |
| Security Platform / Audit consumed                | PASS (intent) |
| No Live Trading / capital control                 | PASS (intent) |
| No Wave 1–3 / W4-E01/E02/E03 / ownership redesign | PASS (intent) |
| No engine clone / second order path               | PASS (intent) |
| Evidence rows                                     | PENDING Close |

---

## Boundary (binding)

| In                                                             | Out                                    |
| -------------------------------------------------------------- | -------------------------------------- |
| Workspace-scoped Kraken connect/test/disconnect (when offered) | Owning customer secret ciphertext      |
| Authn/Authz gates on connection surfaces                       | Redesigning Auth / Vault / Audit store |
| Vault retrieve for adapter signing only                        | Storing secrets outside Vault          |
| Honest Connected / Error / not-offered outcomes                | Live order placement                   |
| Fail closed on missing context                                 | Risk / Gate rewrite                    |
| Audit attribution for connect/test/disconnect                  | Telegram / notification control plane  |
| SSRF allowlist to Kraken vendor endpoints                      | Arbitrary operator URL fetch           |
| Verification Standard + regression expectations                | Venue permission verification (E05)    |

---

## Threat model (planning intent)

| Threat                           | Mitigation (planning)                                             |
| -------------------------------- | ----------------------------------------------------------------- |
| Cross-workspace credential use   | Workspace Isolation + Vault scoped retrieve; fail closed          |
| Secret echo in logs/UI/errors    | Vault contract; no plaintext in responses                         |
| SSRF via adapter                 | Kraken vendor endpoint allowlist; no operator-supplied URLs       |
| Fake Connected without I/O       | Honest Product; tests require real round-trip or recorded sandbox |
| Silent Kraken availability       | Honest not-offered label when adapter not delivered               |
| Privilege escalation             | Reuse Authorization; connect/test requires permitted role         |
| Live order via connect path      | Out of scope; Canonical Order Path unchanged; Wave 6 gate         |
| Engine clone bypassing Risk      | Forbidden; single factory extension                               |
| W4-E01/E02/E03 foundation bypass | Extend existing owner; no duplicate persistence                   |
| First label-only venue bypass    | Factory registration only; no Runtime fork                        |

---

## Required coverage

### 1. Workspace isolation

| Outcome          | Required                                      |
| ---------------- | --------------------------------------------- |
| Workspace scoped | Workspace A cannot connect/test with B's keys |
| Fail closed      | Missing or forged workspace context denies    |

### 2. Authorization

| Outcome             | Required                                  |
| ------------------- | ----------------------------------------- |
| Role-gated connect  | Unauthorized roles denied on connect/test |
| No privilege bypass | Connect path cannot escalate permissions  |

### 3. Vault and secret handling

| Outcome              | Required                                 |
| -------------------- | ---------------------------------------- |
| Vault-only secrets   | Credentials retrieved from Vault only    |
| No plaintext echo    | Logs, errors, UI never expose secrets    |
| Revoke on disconnect | Disconnect does not leak stored material |

### 4. SSRF and endpoint control

| Outcome               | Required                                    |
| --------------------- | ------------------------------------------- |
| Vendor endpoints only | Adapter calls Kraken vendor URLs only       |
| No operator URLs      | Operator cannot supply arbitrary fetch URLs |

### 5. Honest Product security

| Outcome                     | Required                                        |
| --------------------------- | ----------------------------------------------- |
| No fake Connected           | Connected requires round-trip evidence          |
| Honest not-offered          | No silent catalog label without product honesty |
| No Live Trading implication | Connect/test does not enable live orders        |

---

## Architecture security verification

| Check                                | Verdict                                    |
| ------------------------------------ | ------------------------------------------ |
| Exchange Adapter ownership preserved | **PASS** — factory extension only          |
| Persistence ownership preserved      | **PASS** — extend `exchange-adapter` owner |
| No duplicate subsystem               | **PASS**                                   |
| No duplicate Source of Truth         | **PASS**                                   |
| No ownership drift                   | **PASS**                                   |
| No Version 2 modification            | **PASS**                                   |
| No Master Plan modification          | **PASS**                                   |

---

## Verification Standard intent (at Close)

| Area                      | Required at Close                             |
| ------------------------- | --------------------------------------------- |
| Workspace isolation tests | Cross-workspace deny evidenced                |
| Authorization tests       | Unauthorized role deny evidenced              |
| Secret non-echo           | Verification Standard rows PASS               |
| SSRF controls             | Kraken endpoint allowlist evidenced           |
| Regression                | Wave 1–3 and W4-E01/E02/E03 boundaries intact |

---

## Explicit non-claims

- W4-E04 Planning APPROVED — **not claimed**
- W4-E04 Planning Review PASS — **not claimed**
- W4-E04-a opened — **not claimed**
- W4-E04 CLOSED — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Live Trading — **not claimed**
- Kraken Connected — **not claimed**
- Venue permission verification Complete — **not claimed**

---

**STOP.** Planning **OPEN** only. Security evidence rows **PENDING** until implementation and Close.
