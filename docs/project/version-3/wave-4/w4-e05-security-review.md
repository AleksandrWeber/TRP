# W4-E05 Security Review

**Package:** W4-E05 Venue Permission Verification
**Wave:** 4 — Exchange Connectivity
**Master Plan / Roadmap:** V3-E05 · feeds LT-02 later
**Status:** Planning **OPEN**. Awaiting Product Owner Review. Not implementation. Slices not opened.
**Date:** 2026-08-28
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Checklist:** [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Default Policy:** [`../security-default-policy.md`](../security-default-policy.md)
**Umbrella:** [`w4-e05-implementation-package.md`](./w4-e05-implementation-package.md)
**Scope:** [`w4-e05-product-scope.md`](./w4-e05-product-scope.md)

```text
Venue Permission Verification uses Wave 1 security, Vault, Exchange Adapter factory, and W4-E01…E04 foundation patterns.
It does not replace Vault, Auth, Authz, Isolation, Platform, or Audit.
It extends Exchange Adapter permission probe I/O only — no engine clone, no new order path.
Permission verified is not Live Trading.
No plaintext secret echo. SSRF controls on vendor endpoints only.
Fail Closed.
Hardcoded defaults must not be presented as vendor-verified.
```

## Planning verdict

| Area                                          | Verdict       |
| --------------------------------------------- | ------------- |
| Authentication / Authorization consumed       | PASS (intent) |
| Workspace Isolation consumed                  | PASS (intent) |
| Vault consumed; no local secret store         | PASS (intent) |
| Security Platform / Audit consumed            | PASS (intent) |
| No Live Trading / capital control             | PASS (intent) |
| No Wave 1–3 / W4-E01…E04 / ownership redesign | PASS (intent) |
| No engine clone / second order path           | PASS (intent) |
| Evidence rows                                 | PENDING Close |

---

## Boundary (binding)

| In                                               | Out                                    |
| ------------------------------------------------ | -------------------------------------- |
| Workspace-scoped permission verification         | Owning customer secret ciphertext      |
| Authn/Authz gates on permission surfaces         | Redesigning Auth / Vault / Audit store |
| Vault retrieve for permission probe signing only | Storing secrets outside Vault          |
| Honest vendor-reported permission outcomes       | Live order placement                   |
| Fail closed on missing context                   | Risk / Gate rewrite                    |
| Audit attribution for permission verification    | Telegram / notification control plane  |
| SSRF allowlist to vendor endpoints               | Arbitrary operator URL fetch           |
| Verification Standard + regression expectations  | Per-venue Real I/O product (E01–E04)   |

---

## Threat model (planning intent)

| Threat                              | Mitigation (planning)                                         |
| ----------------------------------- | ------------------------------------------------------------- |
| Cross-workspace credential use      | Workspace Isolation + Vault scoped retrieve; fail closed      |
| Secret echo in logs/UI/errors       | Vault contract; no plaintext in responses                     |
| SSRF via adapter                    | Vendor endpoint allowlist; no operator-supplied URLs          |
| Fake permission labels without I/O  | Honest Product; tests require real probe or recorded sandbox  |
| Hardcoded defaults as verified      | Explicit honesty rules; inventory flags default surfaces      |
| Privilege escalation                | Reuse Authorization; permission probe requires permitted role |
| Live order via permission path      | Out of scope; Canonical Order Path unchanged; Wave 6 gate     |
| Engine clone bypassing Risk         | Forbidden; single factory extension                           |
| W4-E01…E04 foundation bypass        | Extend existing owner; no duplicate persistence               |
| Permission probe as live enablement | Permission verified ≠ Live Trading; explicit OUT              |

---

## Required coverage

### 1. Workspace isolation

| Outcome          | Required                                          |
| ---------------- | ------------------------------------------------- |
| Workspace scoped | Workspace A cannot probe/use B's permission state |
| Fail closed      | Missing or forged workspace context denies        |

### 2. Authorization

| Outcome             | Required                                             |
| ------------------- | ---------------------------------------------------- |
| Role-gated probe    | Unauthorized roles denied on permission verification |
| No privilege bypass | Permission path cannot escalate permissions          |

### 3. Vault and secret handling

| Outcome              | Required                                 |
| -------------------- | ---------------------------------------- |
| Vault-only secrets   | Credentials retrieved from Vault only    |
| No plaintext echo    | Logs, errors, UI never expose secrets    |
| Revoke on disconnect | Disconnect does not leak stored material |

### 4. SSRF and endpoint control

| Outcome               | Required                                    |
| --------------------- | ------------------------------------------- |
| Vendor endpoints only | Adapter calls vendor URLs only              |
| No operator URLs      | Operator cannot supply arbitrary fetch URLs |

### 5. Honest Product security

| Outcome                     | Required                                        |
| --------------------------- | ----------------------------------------------- |
| No fake permission labels   | Verified requires probe evidence                |
| No hardcoded-as-verified    | Defaults must not masquerade as vendor-reported |
| No Live Trading implication | Permission probe does not enable live orders    |

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

| Area                      | Required at Close                         |
| ------------------------- | ----------------------------------------- |
| Workspace isolation tests | Cross-workspace deny evidenced            |
| Authorization tests       | Unauthorized role deny evidenced          |
| Secret non-echo           | Verification Standard rows PASS           |
| SSRF controls             | Vendor endpoint allowlist evidenced       |
| Regression                | Wave 1–3 and W4-E01…E04 boundaries intact |

---

## Explicit non-claims

- W4-E05 Planning APPROVED — **not claimed**
- W4-E05 Planning Review PASS — **not claimed**
- W4-E05-a opened — **not claimed**
- W4-E05 CLOSED — **not claimed**
- Wave 4 COMPLETE — **not claimed**
- Exchange Connectivity Complete — **not claimed**
- Live Trading — **not claimed**
- Venue Permission Verification Complete — **not claimed**

---

**STOP.** Planning **OPEN** only. Security evidence rows **PENDING** until implementation and Close.
