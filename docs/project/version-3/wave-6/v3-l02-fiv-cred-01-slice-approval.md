# V3-L02 FIV-CRED-01 — Slice Approval

**Document:** FIV-CRED-01 Product Owner / Chief Architect Individual Slice Approval
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02
**Prerequisite package:** FIV-PRE-01 — Binance Testnet Credential Architecture
**Nature:** Official Individual Slice Approval for **FIV-CRED-01** only. **Not** FIV-CRED-02…06 authorization. **Not** FIV-PRE-01 closure. **Not** FIV authorization. **Not** C7 authorization. **Not** Testnet I/O enablement. **Not** credential provisioning. **Not** an ADR. **Not** a Master Plan / Roadmap revision.
**Authority:** Product Owner / Chief Architect (Governance / Architecture Documentation Engineer recording)
**Preceded by:** FIV-CRED-01 Planning Review — **PASS** (required planning changes = **NONE**)
**Planning package:** [`v3-l02-fiv-cred-01-planning-package.md`](./v3-l02-fiv-cred-01-planning-package.md)
**Package implementation authorization:** [`v3-l02-fiv-pre-01-implementation-authorization.md`](./v3-l02-fiv-pre-01-implementation-authorization.md)
**PO decision freeze:** [`v3-l02-fiv-pre-01-po-governance-decision-freeze.md`](./v3-l02-fiv-pre-01-po-governance-decision-freeze.md)
**Repository baseline (approval start):** `ffb47fef60efaa2b341f7ce75a9e3845e096a955` (`docs(wave-6): plan v3-l02 fiv-cred-01 credential model`)

```text
FIV-CRED-01
SLICE APPROVAL = GRANTED

FIV-CRED-01 Planning Review              = PASS
Required planning changes                = NONE
FIV-CRED-01 Slice Approval               = GRANTED (this act)
FIV-CRED-01 implementation               = AUTHORIZED (narrow boundary only)
FIV-CRED-02…06 implementation            = NOT AUTHORIZED
FIV-PRE-01 closed                        = NO
FIV READY / FIV AUTHORIZED               = NO
C7 AUTHORIZED                            = NO
LIVE TRADING AUTHORIZED                  = NO
TESTNET I/O AUTHORIZED                   = NO
allowRealVenueIo                         = MUST REMAIN FALSE
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified by this act.

---

## 1. Approval Status

```text
FIV-CRED-01 SLICE APPROVAL = GRANTED
```

| Field | Decision |
| ----- | -------- |
| **FIV-CRED-01 Planning Review** | **PASS** |
| **Required planning changes** | **NONE** |
| **FIV-CRED-01 Slice Approval Decision** | **APPROVED / GRANTED** |
| **FIV-CRED-01 Implementation Authorization** | **AUTHORIZED** (this act; credential-model / verification boundary only) |
| **Governance** | **APPROVED** |
| **Repository Synchronization (this Approval)** | **AUTHORIZED** (this act) |
| **FIV-CRED-02…06** | **NOT AUTHORIZED** |
| **FIV-PRE-01 closed** | **NO** |
| **FIV / C7 / Testnet I/O / live trading** | **NOT AUTHORIZED** |

```text
FIV-CRED-01 SLICE APPROVED FOR IMPLEMENTATION
≠ FIV-PRE-01 CLOSED
≠ FIV READY
≠ FIV AUTHORIZED
≠ C7 AUTHORIZED
≠ LIVE TRADING AUTHORIZED
≠ TESTNET I/O AUTHORIZED
```

This means:

```text
Implementation of FIV-CRED-01 is authorized
within the explicitly approved boundary.
```

---

## 2. Slice Identity

| Field | Value |
| ----- | ----- |
| **ID** | **FIV-CRED-01** |
| **Name** | Credential Model / Vault Purpose Isolation |
| **Package** | V3-L02 / FIV-PRE-01 |
| **Type** | Credential-model verification (likely no production code change; tests/verification only if required) |
| **Position** | First implementation slice in FIV-CRED-01 → FIV-CRED-06 |

---

## 3. Governance Basis

| Prerequisite | Status |
| ------------ | ------ |
| Wave 6 Planning Package | **APPROVED** |
| D-GOV-04 (Live-Capital ADR creation) | **APPROVED** |
| ADR-020 | **Accepted** |
| D-GOV-05 (Wave 6 implementation authorization) | **GRANTED** (wave-level; per-slice gates remain) |
| FIV-PRE-01 Implementation Authorization | **GRANTED** — [`v3-l02-fiv-pre-01-implementation-authorization.md`](./v3-l02-fiv-pre-01-implementation-authorization.md) |
| PO-CRED-01…09 | **AUTHORITATIVE / FROZEN** — [`v3-l02-fiv-pre-01-po-governance-decision-freeze.md`](./v3-l02-fiv-pre-01-po-governance-decision-freeze.md) |
| FIV-CRED-01 Planning Package | **COMPLETE** — [`v3-l02-fiv-cred-01-planning-package.md`](./v3-l02-fiv-cred-01-planning-package.md) |
| FIV-CRED-01 Planning Review | **PASS** (required planning changes = **NONE**) |

**Planning conclusions accepted by this Approval (not re-litigated):**

| Finding | Accepted |
| ------- | -------- |
| `SecretPurpose.TradingTestnet` already first-class in credential/Vault model | **YES** |
| No schema / enum / migration change currently justified | **YES** |
| Primary case classification | **Case A** |
| Likely implementation outcome | **`NO CODE CHANGE REQUIRED`** or **tests / verification only** |
| Credential-side half of Model C only (no `Connection.environment`) | **YES** |

---

## 4. Approved Slice Scope

### Credential Model / Vault Purpose Isolation

This Approval authorizes **only**:

1. Verify the existing `SecretPurpose.TradingTestnet` model.
2. Preserve `SecretPurpose.Trading` as the existing LIVE-class purpose.
3. Preserve exact-purpose resolution.
4. Preserve workspace isolation.
5. Verify fail-closed behavior.
6. Add only narrowly scoped tests if the existing model lacks the required regression coverage.

The slice may establish or verify:

```text
Trading → Trading
TradingTestnet → TradingTestnet
```

and must reject:

```text
Trading → TradingTestnet
TradingTestnet → Trading
```

---

## 5. Implementation Boundary

### Allowed

* credential/Vault model tests;
* purpose-isolation tests;
* workspace-isolation tests;
* fail-closed regression tests;
* secret non-exposure regression tests;
* LIVE credential regression tests;
* minimal credential-model changes **strictly required** to satisfy the approved acceptance criteria.

### Not allowed

* Connection changes;
* `Connection.environment`;
* provider + environment uniqueness;
* provider lookup redesign;
* Binance handshake;
* Binance endpoint selection;
* API changes;
* UI changes;
* credential provisioning;
* secret rotation;
* C7;
* S04;
* HumanStartProof;
* ExecutionAdapter changes;
* EG1 changes;
* FIV execution;
* Binance network calls;
* production / live trading;
* Testnet trading;
* enabling `allowRealVenueIo`.

---

## 6. Critical Constraint — Do Not Manufacture Implementation

Because Planning Review established:

```text
SecretPurpose.TradingTestnet = already first-class
```

Engineering **MUST NOT** introduce:

* a new enum;
* a duplicate purpose;
* a new credential environment model;
* a schema migration;
* a new Vault abstraction;

unless repository inspection during implementation proves that such a change is **strictly necessary** for the approved acceptance criteria.

If no code change is necessary, the correct implementation outcome is:

```text
NO CODE CHANGE REQUIRED
```

A **test-only** change is acceptable if required to establish regression evidence.

**Expected delivery posture under this Approval:**

```text
PREFERRED: NO CODE CHANGE REQUIRED
ACCEPTABLE: TESTS / VERIFICATION ONLY
DISCOURAGED: production credential-model code changes without proven AC necessity
FORBIDDEN: schema / enum duplication / Connections / handshake / I/O
```

---

## 7. Mandatory Invariants

### INV-01 — Exact purpose

```text
Trading → Trading
TradingTestnet → TradingTestnet
```

### INV-02 — No cross-purpose fallback

```text
TradingTestnet → Trading = DENY
Trading → TradingTestnet = DENY
```

### INV-03 — Workspace isolation

```text
Workspace A → Workspace A credential = ALLOW
Workspace A → Workspace B credential = DENY
```

### INV-04 — Missing credential

```text
Missing exact credential = FAIL CLOSED
```

### INV-05 — LIVE preservation

Existing:

```text
SecretPurpose.Trading
```

must remain LIVE-class. No migration or silent reclassification is permitted.

### INV-06 — Secret safety

No secret values may appear in:

* logs;
* errors;
* test output;
* API responses;
* governance artifacts;
* git diff.

---

## 8. Required Verification

If implementation is performed, verify at minimum:

### Positive

* Trading credential resolves as Trading.
* TradingTestnet credential resolves as TradingTestnet.

### Negative

* TradingTestnet request cannot resolve Trading.
* Trading request cannot resolve TradingTestnet.
* Missing credential fails closed.
* Provider-only fallback cannot bypass purpose isolation.

### Workspace

* Same workspace succeeds.
* Cross-workspace resolution fails.

### Regression

* Existing LIVE credential behavior remains unchanged.

### Secret safety

* No actual secret values are introduced into tests.
* Use mocks / fixtures / placeholders only.

---

## 9. Security Requirements

Implementation must preserve the security conclusions from FIV-CRED-01 / FIV-PRE-01 security governance.

In particular:

```text
Purpose confusion = DENY
Cross-workspace access = DENY
Implicit purpose fallback = DENY
Secret exposure = DENY
LIVE → TESTNET conversion = DENY
TESTNET → LIVE conversion = DENY
```

* Do **not** weaken ENV1.
* Do **not** weaken Vault isolation.
* Do **not** introduce provider-only credential resolution.
* PO-CRED-01…09 remain authoritative.

---

## 10. Explicit Future-Slice Boundary

The following remain **outside** this Approval:

| Slice | Scope |
| ----- | ----- |
| **FIV-CRED-02** | Connection environment representation and provider + environment uniqueness |
| **FIV-CRED-03** | Vault-backed live credential provider wiring |
| **FIV-CRED-04** | Environment-aware Binance handshake |
| **FIV-CRED-05** | API/UI Testnet operator flow |
| **FIV-CRED-06** | Security regression / isolation verification across the complete FIV-PRE-01 path |

Do **not** implement any of them as part of FIV-CRED-01.

---

## 11. Acceptance Criteria

| ID | Criterion |
| -- | --------- |
| **AC-01** | Existing Trading purpose remains unchanged |
| **AC-02** | TradingTestnet remains a distinct first-class credential purpose |
| **AC-03** | Exact-purpose resolution is preserved |
| **AC-04** | Cross-purpose fallback is impossible |
| **AC-05** | Workspace isolation is preserved |
| **AC-06** | Missing credentials fail closed |
| **AC-07** | Existing LIVE credentials remain LIVE |
| **AC-08** | No secret values are exposed |
| **AC-09** | Required regression tests pass if tests are added/changed |
| **AC-10** | No Connection behavior is changed |
| **AC-11** | No Binance network I/O occurs |
| **AC-12** | C7 remains DENY-ALL |
| **AC-13** | `allowRealVenueIo` remains false |

---

## 12. Governance Decision

```text
FIV-CRED-01
SLICE APPROVAL = GRANTED
```

```text
Implementation of FIV-CRED-01 is authorized
within the explicitly approved boundary.
```

This Approval does **NOT** mean:

```text
FIV-PRE-01 CLOSED
FIV READY
FIV AUTHORIZED
C7 AUTHORIZED
LIVE TRADING AUTHORIZED
TESTNET I/O AUTHORIZED
```

---

## 13. Status After Approval

```text
FIV-CRED-01
SLICE APPROVED / IMPLEMENTATION AUTHORIZED

FIV-PRE-01
IMPLEMENTATION AUTHORIZED / NOT CLOSED

FIV-CRED-02
NOT STARTED

FIV-CRED-03
NOT STARTED

FIV-CRED-04
NOT STARTED

FIV-CRED-05
NOT STARTED

FIV-CRED-06
NOT STARTED

FIV
NOT READY / NOT AUTHORIZED

C7
DENY-ALL

allowRealVenueIo
FALSE
```

---

## 14. Next Gate

```text
FIV-CRED-01 Implementation
        → PO Review
        → Security / Architecture verification where required
        → Slice closure (separate act)
```

Engineering may proceed to FIV-CRED-01 implementation **only** within §§4–6 of this Approval.

---

## 15. Safety Confirmations (this governance act)

| Confirmation | Status |
| ------------ | ------ |
| No implementation code shipped | YES |
| No Prisma / schema / migration changes | YES |
| No Vault / Connections / Binance / API / UI / C7 changes | YES |
| No credentials modified or provisioned | YES |
| No secrets accessed, printed, copied, or exposed | YES |
| No Binance API calls | YES |
| No FIV execution | YES |
| No capital moved | YES |
| C7 remains DENY-ALL | YES |
| `allowRealVenueIo` remains false | YES |
| Protected leftovers untouched | YES |
