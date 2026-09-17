# V3-L02 FIV-PRE-01 — PO / Governance Decision Freeze

**Document:** FIV-PRE-01 PO / Governance Decision Freeze
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02
**Prerequisite:** FIV-PRE-01 — Binance Testnet Credential Architecture
**Authority:** PO / Governance Documentation Author
**Nature:** GOVERNANCE DECISION FREEZE ONLY. **Not** Implementation Authorization. **Not** credential provisioning. **Not** C7 authorization. **Not** Testnet I/O authorization. **Not** FIV execution. **Not** FIV-PRE-01 completion.

**Basis artifacts:**

| Artifact | Path | Verdict / status |
| -------- | ---- | ---------------- |
| Planning Package | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-testnet-credential-planning-package.md` | Planning complete (not impl auth) |
| Architecture Review | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-architecture-review.md` | `ARCHITECTURE PASS WITH CONDITIONS` |
| Security Review | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-security-review.md` | `SECURITY PASS WITH CONDITIONS` |

**Repository baseline:** `ba905d6a071f145deffa54ed2ff54e22f810b87e`

```text
PO/GOVERNANCE DECISION = APPROVED WITH CONDITIONS
```

This means:

- the target architecture is approved as the basis for future implementation planning;
- the listed conditions (PO-CRED-01…09) are **mandatory**;
- implementation is **NOT** authorized by this document;
- C7 is **NOT** authorized;
- Testnet I/O is **NOT** authorized;
- FIV execution is **NOT** authorized;
- FIV-PRE-01 is **NOT** marked complete.

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Decision status

```text
PO/GOVERNANCE DECISION = APPROVED WITH CONDITIONS
```

| Claim | Status |
| ----- | ------ |
| Target credential architecture approved for later impl planning | **YES** |
| Conditions mandatory | **YES** |
| Implementation authorized | **NO** |
| C7 authorized | **NO** |
| Testnet I/O authorized | **NO** |
| FIV execution authorized | **NO** |
| FIV-PRE-01 complete | **NO** |

---

## 2. Frozen PO decisions

### PO-CRED-01 — SecretPurpose

```text
PO-CRED-01
REUSE EXISTING SecretPurpose.TradingTestnet
```

**Rationale:**

- repository already contains `SecretPurpose.TradingTestnet`;
- ENV1 supports the purpose;
- EG1 supports the Testnet hostname;
- creating a second Testnet-specific purpose would duplicate an existing capability.

**Prohibition:** Do **NOT** create another Testnet purpose.

**Status:** FROZEN

---

### PO-CRED-02 — Credential Environment Model

```text
PO-CRED-02
Accept asymmetric Model C:
Vault purpose = runtime credential/environment SoT
Connection.environment = persisted store/audit constraint
Mismatch = FAIL CLOSED
```

**Required invariant:**

```text
Connection.environment
        ==
environment implied by SecretPurpose
```

If not:

```text
DENY / FAIL CLOSED
```

There must be **no** fallback. Connection.environment is **not** an equal runtime source of truth.

**Status:** FROZEN

---

### PO-CRED-03 — Explicit Connection Environment

```text
PO-CRED-03
Multi-environment Connections MUST carry an explicit environment.
```

The system must **not** rely on:

```text
missing environment
        ↓
default = trading
```

for a multi-environment Binance Connection.

Required behavior for missing/invalid environment: **fail-closed or explicitly rejected**.
Do **not** silently select LIVE for multi-environment Binance Connection APIs.

**Status:** FROZEN

---

### PO-CRED-04 — Provider + Environment Slot Identity

```text
PO-CRED-04
Binance Connection uniqueness MUST support coexistence of:
BINANCE + LIVE
and
BINANCE + TESTNET
```

The provider-only slot policy is **insufficient**.

The implementation must establish an unambiguous identity using repository-approved workspace ownership plus:

```text
provider
+
environment
```

**Prohibitions:**

- Do **NOT** silently remove uniqueness constraints.
- Do **NOT** implement this decision in this governance act.

**Status:** FROZEN (decision only)

---

### PO-CRED-05 — Environment-Aware Binance Handshake

```text
PO-CRED-05
Binance handshake MUST be environment-aware.
```

**Required mapping:**

```text
trading / LIVE
        ↓
Binance Production origin

trading_testnet / TESTNET
        ↓
Binance Testnet origin
```

**Rules:**

- Origins MUST be fixed server-side.
- User-supplied URLs are **prohibited**.
- Preserve existing LIVE origin/path for LIVE.
- Testnet must **not** resolve to the production origin.
- Production must **not** resolve to the Testnet origin.
- Mismatch must **fail closed**.

**Status:** FROZEN

---

### PO-CRED-06 — No Cross-Environment Fallback

```text
PO-CRED-06
NO credential fallback across environments.
```

**Explicitly prohibit:**

```text
trading_testnet → trading
trading → trading_testnet
provider-only Binance lookup   (when environment/purpose is required)
missing Testnet credential → LIVE credential selection
```

**Status:** FROZEN

---

### PO-CRED-07 — Existing LIVE Data

```text
PO-CRED-07
Existing Binance LIVE credentials and Connections remain LIVE.
```

**Prohibit:**

- automatic conversion `LIVE → TESTNET`
- secret copying
- secret reclassification
- silent migration

If an environment field must be backfilled for existing Connections, the **only** permitted semantic backfill is the already-established **LIVE** classification, subject to implementation review and migration safety.

**Prohibition:** Do **NOT** perform migration in this governance act.

**Status:** FROZEN

---

### PO-CRED-08 — Security Regression Requirement

```text
PO-CRED-08
Implementation MUST include mandatory security regression coverage.
```

**Minimum coverage (frozen):**

#### Credential isolation

```text
LIVE credential → LIVE
TESTNET credential → TESTNET
LIVE credential → TESTNET = DENY
TESTNET credential → LIVE = DENY
```

#### Workspace isolation

```text
workspace A → A = ALLOW
workspace A → B = DENY
```

#### Environment isolation

```text
matching environment = ALLOW
mismatch = DENY
missing required environment = DENY
```

#### Endpoint isolation

```text
TESTNET → testnet.binance.vision
TESTNET → api.binance.com = DENY
LIVE → api.binance.com
LIVE → testnet.binance.vision = DENY
```

#### Fallback

```text
provider-only lookup = DENY
missing Testnet credential → LIVE fallback = DENY
```

#### Secret safety

Verify no secret material is exposed through:

- frontend;
- API responses;
- logs;
- errors;
- audit events.

**Status:** FROZEN

---

### PO-CRED-09 — DNS / EG1 Condition

```text
PO-CRED-09
Existing EG1/SSRF controls remain mandatory.
DNS pinning for the eventual FIV composition remains an explicit condition.
```

**Must not weaken:**

- fixed host allowlist;
- HTTPS;
- private IP protection;
- redirect protection;
- DNS/rebinding protection.

Credential architecture implementation does **not** resolve the existing DNS-pin FIV composition condition (tracked under FIV-PRE-03 / prior L02 security closeout).

**Status:** FROZEN

---

## 3. Decision summary table

| ID | Decision | Status |
| -- | -------- | ------ |
| PO-CRED-01 | Reuse `SecretPurpose.TradingTestnet` | FROZEN |
| PO-CRED-02 | Asymmetric Model C (Vault SoT; Connection env constraint; mismatch fail closed) | FROZEN |
| PO-CRED-03 | Explicit environment on multi-env Connections; no silent LIVE default | FROZEN |
| PO-CRED-04 | Provider+environment uniqueness for LIVE+TESTNET coexistence | FROZEN |
| PO-CRED-05 | Environment-aware Binance handshake; fixed origins | FROZEN |
| PO-CRED-06 | No cross-environment / provider-only fallback | FROZEN |
| PO-CRED-07 | Existing LIVE data remains LIVE; no silent conversion | FROZEN |
| PO-CRED-08 | Mandatory security regression suite | FROZEN |
| PO-CRED-09 | EG1/SSRF mandatory; DNS-pin FIV condition remains | FROZEN |

---

## 4. Implementation boundary (direction only)

This PO decision authorizes **only** the following future implementation **planning direction**:

```text
Credential model
Connection environment
Provider+environment uniqueness
Vault exact-purpose resolution
Environment-aware Binance handshake
Security regression suite
```

**Implementation Authorization itself is NOT granted by this artifact.**

---

## 5. Explicitly NOT authorized

This decision freeze does **NOT** authorize:

```text
C7 authorization
Testnet I/O
Binance API calls
Order submission
Order cancellation
FIV execution
Production trading
Real capital
Credential rotation
Production credential modification
EmergencyManager
LTE
S04 modification
HumanStartProof modification
EG1 weakening
ENV1 weakening
```

In particular:

```text
allowRealVenueIo = TRUE
```

is **NOT** authorized.

No C7 bypass is authorized.

---

## 6. Acceptance criteria for future implementation

Before implementation can be considered complete, implementation must demonstrate:

| ID | Criterion |
| -- | --------- |
| AC-01 | `SecretPurpose.TradingTestnet` is used as the approved Testnet purpose |
| AC-02 | Connection environment is explicit for multi-environment Binance Connections |
| AC-03 | Vault credential selection requires exact purpose/environment semantics |
| AC-04 | Provider-only lookup cannot select a credential where environment matters |
| AC-05 | LIVE and TESTNET Binance Connections can coexist without ambiguity |
| AC-06 | Testnet credential cannot reach the production Binance endpoint |
| AC-07 | LIVE credential cannot be used by Testnet execution |
| AC-08 | Existing LIVE Connections continue to work |
| AC-09 | Missing/mismatched credential/environment fails closed |
| AC-10 | No secret exposure occurs |
| AC-11 | Security regression suite passes |
| AC-12 | No C7, I/O, or FIV authorization is inferred from these criteria |

---

## 7. Required future implementation slices

Frozen as the proposed implementation sequence, subject to detailed slice planning (not implementation authorization):

```text
FIV-CRED-01 — Credential model
FIV-CRED-02 — Connection environment and slot identity
FIV-CRED-03 — Exact-purpose Vault resolution
FIV-CRED-04 — Environment-aware Binance handshake
FIV-CRED-05 — API/UI Testnet operator flow
FIV-CRED-06 — Security regression and isolation verification
```

Each slice requires its own planning/review gate according to project governance.

---

## 8. Governance sequence

```text
PO/Governance Decision Freeze          ← THIS ARTIFACT
        ↓
Implementation Authorization           ← NOT GRANTED HERE
        ↓
Slice Planning
        ↓
Architecture/Security review where required
        ↓
Implementation
        ↓
PO Review
        ↓
Security/Architecture Verification
        ↓
FIV Preflight
        ↓
Separate FIV Authorization
        ↓
Controlled FIV
```

Do **not** skip gates.

---

## 9. Current FIV status

```text
FIV-PRE-01 = NOT YET COMPLETE
FIV-PRE-02 = OPEN
FIV-PRE-03 = OPEN
FIV = NOT READY
FIV execution = NOT AUTHORIZED
```

Credential architecture PO approval **does not** change this.

---

## 10. Governance status

```text
PO/GOVERNANCE DECISION
APPROVED WITH CONDITIONS

Implementation
NOT AUTHORIZED BY THIS ARTIFACT

C7
NOT AUTHORIZED

Testnet I/O
NOT AUTHORIZED

FIV
NOT AUTHORIZED

Production I/O
PROHIBITED

Real Capital
PROHIBITED
```

### Explicit non-claims

This artifact does **not** claim:

- FIV READY / FIV PASS / FIV COMPLETE
- implementation complete
- C7 authorized
- Testnet I/O authorized
- production I/O authorized

---

## 11. Freeze execution record

| Item | Value |
| ---- | ----- |
| Artifact path | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-po-governance-decision-freeze.md` |
| Code / schema / API / UI / Vault / C7 changes | **None** |
| Credentials modified / provisioned | **None** |
| Secrets exposed | **None** |
| Binance API calls | **None** |
| FIV executed | **None** |
| Capital moved | **None** |
| Protected leftovers touched | **None** |
| Planning / Architecture / Security artifacts modified | **No** |
