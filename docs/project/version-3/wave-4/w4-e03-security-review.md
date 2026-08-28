# W4-E03 Security Review

**Package:** W4-E03 OKX Real I/O
**Wave:** 4 — Exchange Connectivity
**Master Plan / Roadmap:** V3-E03 · CM-09
**Status:** Planning **OPEN**. Awaiting Product Owner Review. Not implementation. Slices not opened.
**Date:** 2026-08-28
**Canon:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
**Checklist:** [`../version-3-security-checklist.md`](../version-3-security-checklist.md)
**Verification Standard:** [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md)
**Default Policy:** [`../security-default-policy.md`](../security-default-policy.md)
**Umbrella:** [`w4-e03-implementation-package.md`](./w4-e03-implementation-package.md)
**Scope:** [`w4-e03-product-scope.md`](./w4-e03-product-scope.md)

```text
OKX Real I/O uses Wave 1 security, Vault, Exchange Adapter factory, and W4-E01/E02 foundation patterns.
It does not replace Vault, Auth, Authz, Isolation, Platform, or Audit.
It extends Exchange Adapter I/O only — no engine clone, no new order path.
Connected is not Live Trading.
No plaintext secret echo. SSRF controls on OKX vendor endpoints only.
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
| No Wave 1–3 / W4-E01/E02 / ownership redesign | PASS (intent) |
| No engine clone / second order path           | PASS (intent) |
| Evidence rows                                 | PENDING Close |

---

## Boundary (binding)

| In                                              | Out                                    |
| ----------------------------------------------- | -------------------------------------- |
| Workspace-scoped OKX connect/test/disconnect    | Owning customer secret ciphertext      |
| Authn/Authz gates on connection surfaces        | Redesigning Auth / Vault / Audit store |
| Vault retrieve for adapter signing only         | Storing secrets outside Vault          |
| Honest Connected / Error outcomes               | Live order placement                   |
| Fail closed on missing context                  | Risk / Gate rewrite                    |
| Audit attribution for connect/test/disconnect   | Telegram / notification control plane  |
| SSRF allowlist to OKX vendor endpoints          | Arbitrary operator URL fetch           |
| Verification Standard + regression expectations | Kraken security (E04)                  |

---

## Threat model (planning intent)

| Threat                         | Mitigation (planning)                                             |
| ------------------------------ | ----------------------------------------------------------------- |
| Cross-workspace credential use | Workspace Isolation + Vault scoped retrieve; fail closed          |
| Secret echo in logs/UI/errors  | Vault contract; no plaintext in responses                         |
| SSRF via adapter               | OKX vendor endpoint allowlist; no operator-supplied URLs          |
| Fake Connected without I/O     | Honest Product; tests require real round-trip or recorded sandbox |
| Privilege escalation           | Reuse Authorization; connect/test requires permitted role         |
| Live order via connect path    | Out of scope; Canonical Order Path unchanged; Wave 6 gate         |
| Stolen API key / passphrase    | Vault revoke/disconnect; rotation product Wave 2 (C04)            |
| Engine clone bypassing Risk    | Forbidden; single factory extension                               |
| W4-E01/E02 foundation bypass   | Extend existing owner; no duplicate persistence                   |
| Incomplete OKX material stored | Vault typed validation refuses incomplete passphrase material     |

---

## Required coverage

### 1. Workspace isolation

| Outcome          | Required                                      |
| ---------------- | --------------------------------------------- |
| Workspace scoped | Workspace A cannot connect/test with B's keys |
| Fail closed      | Missing or forged workspace context denies    |

### 2. Authorization

| Outcome            | Required                                     |
| ------------------ | -------------------------------------------- |
| Authenticated only | Anonymous connect/test denied                |
| Authorized only    | Roles without permission cannot connect/test |
| No new role        | Reuse existing Authorization                 |
| Fail closed        | Missing permission denies                    |

### 3. Secret handling

| Outcome                 | Required                                                   |
| ----------------------- | ---------------------------------------------------------- |
| Vault-only credentials  | Adapter retrieves from Vault; no local persistence         |
| No plaintext echo       | Logs, errors, exports never include key/secret/passphrase  |
| Signing in adapter only | Secrets used for vendor signing inside adapter boundary    |
| Disconnect stops use    | Revoked/disconnected material not used for new round-trips |

### 4. Network / SSRF

| Outcome               | Required                             |
| --------------------- | ------------------------------------ |
| Vendor endpoints only | OKX official API hosts allowlisted   |
| No arbitrary fetch    | Operator cannot supply callback URLs |

### 5. Honest product security

| Outcome                    | Required                                       |
| -------------------------- | ---------------------------------------------- |
| No fake Connected          | Status requires successful round-trip evidence |
| No live trading claim      | UI/API must not imply live capital orders      |
| Expired/permission honesty | Vendor errors mapped to honest labels          |

### 6. Architecture security

| Outcome              | Required                            |
| -------------------- | ----------------------------------- |
| No engine clone      | Forbidden                           |
| No second order path | Forbidden                           |
| No ownership drift   | Vault / Adapter / Cluster unchanged |

---

## Architecture verification (planning)

| Check                               | Result |
| ----------------------------------- | ------ |
| Existing bounded contexts preserved | Pass   |
| Existing ownership preserved        | Pass   |
| Existing Source of Truth preserved  | Pass   |
| No duplicate subsystem introduced   | Pass   |
| No Version 2 modification           | Pass   |
| No Master Plan modification         | Pass   |

---

## Security Verification Standard (at Close)

Every category and row of [`../version-3-security-verification-standard.md`](../version-3-security-verification-standard.md) must be evidenced at package Close. Planning intent above is the baseline.

---

## Explicit non-claims

- Security Review PASS at Close — **not claimed** (planning only)
- Live Trading security controls — **not claimed** (Wave 6)
- Replay protection on financial APIs — **not claimed** (V3-L05)
- W4-E03 APPROVED — **not claimed**
- OKX Connected — **not claimed**

---

**STOP.** Planning **OPEN** only. Close evidence recorded only after approved implementation.
