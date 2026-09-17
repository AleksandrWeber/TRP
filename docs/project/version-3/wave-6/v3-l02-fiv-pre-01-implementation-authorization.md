# V3-L02 FIV-PRE-01 — Implementation Authorization

**Document:** FIV-PRE-01 Implementation Authorization
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02
**Prerequisite:** FIV-PRE-01 — Binance Testnet Credential Architecture
**Authority:** PO / Governance Implementation Authorization Package Author
**Nature:** GOVERNANCE AUTHORIZATION DOCUMENTATION ONLY. Authorizes **implementation** of the approved FIV-PRE-01 credential architecture within stated boundaries. **Not** FIV execution. **Not** C7 authorization. **Not** Testnet I/O enablement. **Not** credential provisioning. **Not** FIV-PRE-01 closure.

**Governance chain:**

```text
Planning Package
        → Architecture Review
        → Security Review
        → PO/Governance Decision Freeze
        → Implementation Authorization   ← THIS ARTIFACT
```

**Basis artifacts:**

| Artifact | Path | Status |
| -------- | ---- | ------ |
| Planning Package | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-testnet-credential-planning-package.md` | Complete |
| Architecture Review | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-architecture-review.md` | `ARCHITECTURE PASS WITH CONDITIONS` |
| Security Review | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-security-review.md` | `SECURITY PASS WITH CONDITIONS` |
| PO/Governance Decision Freeze | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-po-governance-decision-freeze.md` | `APPROVED WITH CONDITIONS` |

**Repository baseline:** `154f15247f9fbd334792d12aa9c2bbb3f12846f2`

```text
IMPLEMENTATION AUTHORIZATION = GRANTED
```

**Scope:**

```text
FIV-PRE-01 Testnet Credential Architecture
```

This authorization applies **ONLY** to the approved implementation boundaries below.
It does **not** authorize uncontrolled single-PR delivery of all slices without slice lifecycle gates.

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Authorization status

```text
IMPLEMENTATION AUTHORIZATION = GRANTED
```

| Claim | Status |
| ----- | ------ |
| FIV-PRE-01 credential architecture implementation | **AUTHORIZED** (within boundaries) |
| All slices in one uncontrolled change | **NOT** authorized |
| C7 | **NOT** authorized |
| Testnet I/O (`allowRealVenueIo=true`) | **NOT** authorized |
| Binance API / trading I/O during impl | **NOT** authorized |
| FIV execution | **NOT** authorized |
| FIV READY | **NOT** claimed |
| FIV-PRE-01 complete / closed | **NOT** claimed |

---

## 2. Approved decisions (carry-forward)

### PO-CRED-01

Reuse existing:

```text
SecretPurpose.TradingTestnet
```

No second Testnet purpose.

### PO-CRED-02

Asymmetric Model C:

```text
Vault purpose = runtime credential/environment SoT
Connection.environment = persisted store/audit constraint
mismatch = FAIL CLOSED
```

### PO-CRED-03

Multi-environment Connections require explicit environment.
No silent LIVE default where environment matters.

### PO-CRED-04

Binance Connection identity must support:

```text
provider + environment
```

so LIVE and TESTNET can coexist without ambiguity.

### PO-CRED-05

Binance handshake becomes environment-aware.
Fixed server-side origins only.

Expected mapping:

```text
LIVE
→ Binance Production origin

TESTNET
→ Binance Testnet origin
```

### PO-CRED-06

No:

```text
cross-environment fallback
provider-only credential lookup
```

### PO-CRED-07

Existing LIVE credentials and Connections remain LIVE.
No automatic LIVE → TESTNET conversion.

### PO-CRED-08

Mandatory security regression suite.

### PO-CRED-09

EG1/SSRF remains mandatory.
DNS-pin FIV condition remains separate and unresolved.

---

## 3. Authorized implementation scope

Implementation is authorized **ONLY** for:

```text
1. Credential model / environment representation
2. Connection environment handling
3. Provider + environment uniqueness
4. Exact-purpose Vault resolution
5. Environment-aware Binance handshake
6. Required API/UI changes for explicit Testnet selection
7. Security regression tests
8. Required migration/backfill work directly necessary for the above
```

The implementation **must** preserve existing LIVE behavior.

---

## 4. Implementation slices

The following slices are authorized as **implementation boundaries**:

```text
FIV-CRED-01 — Credential model
FIV-CRED-02 — Connection environment and slot identity
FIV-CRED-03 — Exact-purpose Vault resolution
FIV-CRED-04 — Environment-aware Binance handshake
FIV-CRED-05 — API/UI Testnet operator flow
FIV-CRED-06 — Security regression and isolation verification
```

**IMPORTANT:** This does **NOT** authorize implementation of all slices in one uncontrolled change.

Each slice must follow the project's normal lifecycle:

```text
Slice Planning
        → Planning Review
        → Slice Approval
        → Implementation
        → PO Review
        → Security/Architecture Verification where required
        → Closure
```

---

## 5. Mandatory security invariants

The implementation **MUST** preserve:

```text
LIVE credential
        X
TESTNET execution

TESTNET credential
        X
LIVE execution

Workspace A
        X
Workspace B credential

Testnet context
        X
Production Binance endpoint
```

And:

```text
purpose mismatch
        → FAIL CLOSED

environment mismatch
        → FAIL CLOSED

workspace mismatch
        → FAIL CLOSED

missing required credential
        → FAIL CLOSED
```

**No fallback.**

---

## 6. Credential resolution contract

The implementation must establish an exact credential resolution contract.

At minimum:

```text
workspace
+
provider/type
+
purpose
```

with environment semantics derived/validated according to approved Model C.

The implementation **MUST NOT** perform:

```text
provider-only Binance lookup
```

when environment/purpose is required.

The implementation **MUST NOT** perform:

```text
trading_testnet → trading
```

fallback.

The implementation **MUST NOT** perform:

```text
trading → trading_testnet
```

fallback.

---

## 7. Connection requirements

For multi-environment Binance Connections:

```text
environment = explicit
```

The implementation must support coexistence of:

```text
BINANCE + LIVE
BINANCE + TESTNET
```

for the same workspace where permitted by the existing workspace ownership model.

Provider-only uniqueness is **not** sufficient.
Concurrency and duplicate creation must remain safe.

---

## 8. Binance handshake requirements

The implementation must replace the production-hardcoded handshake behavior with an environment-aware mechanism.

**Required:**

```text
LIVE
→ fixed Binance Production origin

TESTNET
→ fixed Binance Testnet origin
```

| Rule | Requirement |
| ---- | ----------- |
| User-supplied URL | **Prohibited** |
| Arbitrary host | **Prohibited** |
| Redirect-based environment switching | **Prohibited** |
| Endpoint from untrusted user input | **Prohibited** |
| Existing LIVE path | Remain functionally compatible |
| Testnet → production origin | **Never** |

---

## 9. Vault requirements

Use the existing:

```text
SecretPurpose.TradingTestnet
```

Do **NOT** create another Testnet purpose.

Vault resolution must be exact-purpose.

Existing:

```text
SecretPurpose.Trading
```

must remain LIVE-class.

| Prohibition | Status |
| ----------- | ------ |
| Reclassification of existing secrets | **Prohibited** |
| Secret copying | **Prohibited** |
| Secret exposure | **Prohibited** |

---

## 10. Migration requirements

If migration is required:

- existing LIVE data remains LIVE;
- no secret material is copied;
- no LIVE secret is reclassified as Testnet;
- no automatic Testnet credential is created;
- existing Connections receive only the approved LIVE environment classification if needed;
- migration must be reversible where technically appropriate;
- migration must preserve workspace isolation.

Migration implementation requires its own review evidence.

---

## 11. API/UI requirements

Where the operator must create or manage a multi-environment Binance Connection, the environment must be **explicit**.

The UI/API must support:

```text
BINANCE
+
TESTNET
```

without exposing credentials.

The backend must validate the environment rather than trusting the UI.

Do **not** expose:

- Secret Key;
- decrypted credential;
- Vault ciphertext;
- Authorization headers;
- HMAC signatures.

---

## 12. Security regression requirements

The implementation **MUST** include tests for:

### Credential isolation

```text
LIVE → LIVE = ALLOW
TESTNET → TESTNET = ALLOW
LIVE → TESTNET = DENY
TESTNET → LIVE = DENY
```

### Workspace isolation

```text
A → A = ALLOW
A → B = DENY
```

### Purpose isolation

```text
exact purpose = ALLOW
wrong purpose = DENY
missing purpose = DENY
```

### Environment isolation

```text
matching environment = ALLOW
mismatch = DENY
```

### Endpoint isolation

```text
TESTNET → testnet.binance.vision = ALLOW
TESTNET → api.binance.com = DENY
LIVE → api.binance.com = ALLOW
LIVE → testnet.binance.vision = DENY
```

### Fallback

```text
provider-only lookup = DENY
missing Testnet credential → LIVE fallback = DENY
```

### Secret safety

No secret material in:

- API responses;
- frontend state;
- logs;
- errors;
- audit events.

### LIVE backward compatibility

Existing LIVE credential and Connection behavior must remain functional.

---

## 13. Explicit non-scope

The following are **NOT** authorized:

```text
C7 implementation
C7 authorization
C7 bypass
allowRealVenueIo = true
Testnet trading
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
Implementation authorization
        ≠
FIV authorization
```

and:

```text
Testnet credential support
        ≠
Testnet I/O authorization
```

---

## 14. Required implementation safety boundary

After implementation, the following must still be true:

```text
C7 = DENY-ALL
```

unless a separate authorized C7 mechanism is introduced through the independent FIV-PRE-02 gate.

And:

```text
allowRealVenueIo = false
```

must remain unchanged unless separately authorized by FIV-PRE-03.

No Binance network calls are permitted during implementation unless a later slice explicitly receives the required authorization. The credential architecture implementation itself must **not** execute trading I/O.

---

## 15. Acceptance gate

FIV-PRE-01 implementation may only be considered complete when:

- all authorized slices are implemented;
- LIVE/Testnet credential isolation is proven;
- workspace isolation is proven;
- exact-purpose Vault resolution is proven;
- Connection environment is explicit;
- provider+environment uniqueness is proven;
- Binance handshake is environment-aware;
- production/Testnet endpoint isolation is proven;
- no cross-environment fallback exists;
- existing LIVE behavior remains functional;
- migration is verified if applicable;
- secret non-exposure is verified;
- security regression suite passes;
- Architecture/Security conditions are satisfied;
- PO Review passes.

Only then may FIV-PRE-01 be considered **technically resolved**.

---

## 16. Governance after implementation

```text
Implementation Authorization          ← THIS ARTIFACT
        ↓
FIV-CRED Slice Planning
        ↓
Implementation
        ↓
PO Review
        ↓
Architecture/Security Verification
        ↓
FIV-PRE-01 Closure
```

Only after FIV-PRE-01 is resolved should the project proceed with separate remediation of:

```text
FIV-PRE-02 — Scoped C7 Authorization
FIV-PRE-03 — Controlled Testnet I/O
```

Those remain separate governance items.

---

## 17. Current FIV status

```text
FIV-PRE-01
IMPLEMENTATION AUTHORIZED

FIV-PRE-02
OPEN

FIV-PRE-03
OPEN

FIV
NOT READY

FIV EXECUTION
NOT AUTHORIZED
```

---

## 18. Governance status

```text
IMPLEMENTATION AUTHORIZATION = GRANTED
Scope = FIV-PRE-01 Testnet Credential Architecture only

C7 = NOT AUTHORIZED
Testnet I/O = NOT AUTHORIZED
FIV = NOT AUTHORIZED
Production I/O = PROHIBITED
Real Capital = PROHIBITED
allowRealVenueIo = MUST REMAIN false
```

### Explicit non-claims

This artifact does **not** claim:

- FIV READY / FIV PASS / FIV COMPLETE
- C7 authorized
- Testnet I/O authorized
- production I/O authorized
- real capital authorized
- FIV-PRE-01 closed

---

## 19. Authorization execution record

| Item | Value |
| ---- | ----- |
| Artifact path | `docs/project/version-3/wave-6/v3-l02-fiv-pre-01-implementation-authorization.md` |
| Code / schema / API / UI / Vault / C7 changes in this task | **None** |
| Credentials modified / provisioned | **None** |
| Secrets exposed | **None** |
| Binance API calls | **None** |
| FIV executed | **None** |
| Capital moved | **None** |
| Protected leftovers touched | **None** |
| Prior FIV-PRE-01 governance artifacts modified | **No** |
