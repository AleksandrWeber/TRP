# FIV-CONN-04 PO/Governance Decision Freeze

**Document:** FIV-CONN-04 PO/Governance Decision Freeze — D-CONN-04-01…10  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04 — LIVE environment backfill / residual migration state  
**Authority:** Product Owner / Chief Architect (immutable governance recording)  
**Nature:** **PO/GOVERNANCE DECISION FREEZE ONLY.** Freezes D-CONN-04-01…10. Does **not** grant Slice Approval. Does **not** authorize implementation. Does **not** create migrations, mutate Connections/Vault/credentials, perform backfill, or authorize FIV/C7/venue I/O/capital.

**Decision Support:** [`v3-l02-fiv-conn-04-po-governance-decision-support.md`](./v3-l02-fiv-conn-04-po-governance-decision-support.md) (`c296890f599824513720bfa1b2e4f9b20c0e4e7b`)  
**Planning Review:** [`v3-l02-fiv-conn-04-planning-review.md`](./v3-l02-fiv-conn-04-planning-review.md) — PASS WITH REQUIRED PO DECISIONS  
**Repository baseline (freeze act start):** `c296890f599824513720bfa1b2e4f9b20c0e4e7b` (`HEAD == origin/main`)

```text
PO/GOVERNANCE DECISION FREEZE = GRANTED
ALL TEN DECISIONS FROZEN / APPROVED
IMPLEMENTATION NOT AUTHORIZED BY THIS ARTIFACT
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Authority and Governance Context

```text
CLOSED:
  FIV-CRED-01
  FIV-CONN-01
  FIV-CONN-02
  FIV-CONN-03

FIV-CONN-04:
  Planning Package: SYNCED
  Planning Review: PASS WITH REQUIRED PO DECISIONS
  Decision Support: SYNCED
  Decision Freeze: THIS ARTIFACT

FIV-PRE-01:
  NOT CLOSED

FIV:
  NOT AUTHORIZED / NOT PERFORMED
```

Decision authority: **PO / Governance**.  
This artifact records explicit frozen decisions for D-CONN-04-01…10. Parent frozen decisions (D-CRED-02-01…14, D-CONN-03-01…05) are **not** reopened.

---

## 2. Source Artifacts

| Artifact                              | Path                                                                                    | Status                          |
| ------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------- |
| FIV-CRED-02 Decision Freeze           | `v3-l02-fiv-cred-02-po-governance-decision-freeze.md`                                   | FROZEN (not reopened)           |
| FIV-CONN-01 Closure                   | `v3-l02-fiv-conn-01-closure.md`                                                         | CLOSED                          |
| FIV-CONN-02 Closure                   | `v3-l02-fiv-conn-02-closure.md`                                                         | CLOSED                          |
| FIV-CONN-03 Closure / Decision Freeze | `v3-l02-fiv-conn-03-closure.md` / `v3-l02-fiv-conn-03-po-governance-decision-freeze.md` | CLOSED / FROZEN                 |
| FIV-CONN-04 Planning Package          | `v3-l02-fiv-conn-04-planning-package.md`                                                | COMPLETE / SYNCED               |
| FIV-CONN-04 Planning Review           | `v3-l02-fiv-conn-04-planning-review.md`                                                 | PASS WITH REQUIRED PO DECISIONS |
| FIV-CONN-04 Decision Support          | `v3-l02-fiv-conn-04-po-governance-decision-support.md`                                  | COMPLETE / SYNCED               |

---

## 3. Frozen Architectural Invariants

These remain unchanged and are **not** reopened by this freeze:

```text
Model C:
  Connection.environment
    → expected purpose class
    → exact vaultSecretId
    → Vault metadata
    → actual SecretPurpose
    → FAIL CLOSED on mismatch

Vault SecretPurpose     = runtime credential/environment SoT
Connection.environment  = constraint / audit context

Strategy B              = database uniqueness authority
NULL ≠ LIVE
No provider-only lookup
No sibling-secret substitution
No cross-workspace fallback
No cross-environment fallback
No Vault mutation
No credential rebinding
No LIVE ↔ TESTNET rewrite
DEMO deferred for Connections
C7                      = DENY-ALL
allowRealVenueIo        = FALSE
```

---

## 4. D-CONN-04-01 — LIVE Evidence Bar

```text
Status:   FROZEN / APPROVED
Decision: A — VAULT-PROVEN LIVE ONLY
```

### Exact frozen decision

A NULL-environment EXCHANGE Connection is eligible for NULL → LIVE backfill **ONLY** when the exact `vaultSecretId` resolves, within the correct workspace, to a LIVE-class Vault purpose:

- `SecretPurpose.Trading`
- `SecretPurpose.TradingLive`

### Required properties

- Provider alone is insufficient
- `connectionType` alone is insufficient
- Status alone is insufficient
- Metadata alone is insufficient
- No blanket NULL → LIVE classification
- No sibling credential selection
- No provider-only lookup
- No cross-workspace / cross-environment fallback

---

## 5. D-CONN-04-02 — Ambiguous NULL Handling

```text
Status:   FROZEN / APPROVED
Decision: A — REMAIN NULL + FAIL CLOSED
```

### Exact frozen decision

Ambiguous NULL-environment EXCHANGE Connections **remain NULL**.  
They remain fail-closed under FIV-CONN-03.

An audit-only disposition/list may identify them for future operator review, but this must **NOT** create:

- a runtime waiver
- an execution bypass
- an exception flag
- a credential-selection override

### Required properties

- No silent LIVE classification
- No new exception / waiver architecture

---

## 6. D-CONN-04-03 — Purpose Mismatch

```text
Status:   FROZEN / APPROVED
Decision: A — SKIP / AUDIT MISMATCHED ROWS AND CONTINUE ELIGIBLE ROWS
```

### Exact frozen decision

At classification/backfill time:

- LIVE environment requires LIVE-class purpose
- TESTNET environment requires `TradingTestnet`
- mismatch is **not** repaired automatically

Mismatched rows are skipped and recorded/audited.  
Eligible independent rows may continue.

Use-time Model C FAIL CLOSED remains mandatory and is **NOT** reopened.

### Required properties

- No Vault mutation
- No credential substitution
- No sibling lookup

---

## 7. D-CONN-04-04 — Revoked / Dangling Credentials

```text
Status:   FROZEN / APPROVED
Decision: A — SKIP / AUDIT DEFECTIVE BINDINGS; NEVER AUTO-LIVE
```

### Exact frozen decision

The following are **NOT** eligible for automatic LIVE backfill:

- missing `vaultSecretId`
- dangling `vaultSecretId`
- revoked credential
- invalid / unexpected purpose
- workspace mismatch
- exact-id mismatch

Such rows remain fail-closed.

### Required properties

- No credential rebinding
- No Vault repair
- No sibling / provider fallback
- No automatic LIVE metadata assignment merely because a credential exists elsewhere

---

## 8. D-CONN-04-05 — Strategy B Collisions

```text
Status:   FROZEN / APPROVED
Decision: A — PREVENTION ONLY
```

### Exact frozen decision

If NULL → LIVE would collide with an existing credentialed LIVE Connection under Strategy B:

- do not overwrite
- do not merge
- do not delete
- do not rebind
- do not substitute credentials
- do not bypass the unique constraint

Skip/report the colliding candidate.  
Continue non-colliding eligible candidates if otherwise allowed.

Strategy B remains the final database authority.  
Duplicate cleanup/resolution is **OUT OF SCOPE** for CONN-04 unless separately authorized.

---

## 9. D-CONN-04-06 — Residual NULL Policy

```text
Status:   FROZEN / APPROVED
Decision: C
```

### Exact frozen decision

- **NON-EXCHANGE NULL** is allowed to remain NULL.
- **EXCHANGE NULL** may also remain as a documented residual when it cannot be safely classified under D-CONN-04-01…04.

Such EXCHANGE NULL remains fail-closed for trading validation/use.

### Required properties

- NULL MUST NEVER mean LIVE
- CONN-04 does not force deletion or unsafe classification of residuals

---

## 10. D-CONN-04-07 — NOT NULL Scope

```text
Status:   FROZEN / APPROVED
Decision: A — KEEP NULLABLE
```

### Exact frozen decision

Do **NOT** make `Connection.environment` NOT NULL in FIV-CONN-04.  
No NOT NULL migration is authorized by this decision freeze.

### Rationale

Residual EXCHANGE NULL is an explicitly permitted fail-closed state under D-CONN-04-06.  
NOT NULL may be reconsidered only through a future explicit governance decision after residual policy and inventory justify it.

---

## 11. D-CONN-04-08 — Concurrency / Write Gate

```text
Status:   FROZEN / APPROVED
Decision: B
```

### Exact frozen decision

During the authorized future backfill write window, **DENY**:

- Connection credential store
- Connection credential replace
- Connection credential revoke
- EXCHANGE Connection creation

### Required controls

- controlled maintenance / write window
- single-runner backfill
- conditional updates
- `environment IS NULL` predicate
- unchanged exact `vaultSecretId` predicate
- eligibility re-check immediately before write
- Strategy B as final DB authority

### Required properties

- No stale classification may overwrite a newer state
- No concurrent EXCHANGE creation may race the backfill
- The gate applies **only** to the authorized migration/backfill window

---

## 12. D-CONN-04-09 — Audit / Observability

```text
Status:   FROZEN / APPROVED
Decision: B
```

### Exact frozen decision

Required:

- **A** — security-required audit fields and run counters
- **PLUS B** — durable Security Audit events for updated/blocked rows

### Audit must include (where applicable)

- Connection id
- workspaceId
- provider
- connectionType
- previous environment
- new environment
- evidence / classification
- opaque `vaultSecretId` reference
- Vault purpose metadata where safe
- actor / system identity
- timestamp
- correlation / request id where available
- outcome
- failure / collision reason

### Forbidden

Never record:

- API keys
- secrets
- tokens
- decrypted credential material

Do not create a parallel secret-bearing logging mechanism.  
Use existing Security Audit conventions.

Operator sign-off / retention-policy changes are **NOT** part of this decision freeze unless separately authorized.

---

## 13. D-CONN-04-10 — FIV-PRE-01 Blocking Relationship

```text
Status:   FROZEN / APPROVED
Decision: B
```

### Exact frozen decision

FIV-PRE-01 may proceed once the **specific Binance Testnet path** required for FIV-PRE-01 is coherent and passes its own governance/preflight requirements.

Unrelated residual NULL EXCHANGE Connections do **NOT** automatically block FIV-PRE-01 if they:

- remain documented
- remain fail-closed
- do not affect the specific Testnet path
- do not violate the approved security model

### This decision does NOT

- close FIV-PRE-01
- authorize FIV
- authorize Binance I/O
- authorize C7
- authorize live capital
- declare Testnet readiness

FIV-PRE-01 remains independently governed.

---

## 14. Consolidated Decision Matrix

| ID           | Topic                 | Decision                                                                                | Status            |
| ------------ | --------------------- | --------------------------------------------------------------------------------------- | ----------------- |
| D-CONN-04-01 | LIVE evidence bar     | **A** Vault-proven LIVE only                                                            | FROZEN / APPROVED |
| D-CONN-04-02 | Ambiguous NULL        | **A** Remain NULL + fail closed                                                         | FROZEN / APPROVED |
| D-CONN-04-03 | Purpose mismatch      | **A** Skip/audit; continue eligible                                                     | FROZEN / APPROVED |
| D-CONN-04-04 | Revoked/dangling      | **A** Skip/audit; never auto-LIVE                                                       | FROZEN / APPROVED |
| D-CONN-04-05 | Strategy B collisions | **A** Prevention only                                                                   | FROZEN / APPROVED |
| D-CONN-04-06 | Residual NULL         | **C** Non-EXCHANGE NULL OK; EXCHANGE residual OK fail-closed                            | FROZEN / APPROVED |
| D-CONN-04-07 | NOT NULL scope        | **A** Keep nullable                                                                     | FROZEN / APPROVED |
| D-CONN-04-08 | Write gate            | **B** Deny store/replace/revoke + EXCHANGE create                                       | FROZEN / APPROVED |
| D-CONN-04-09 | Audit                 | **B** Required fields/counters + durable Security Audit                                 | FROZEN / APPROVED |
| D-CONN-04-10 | FIV-PRE-01 blocking   | **B** Specific Testnet path; unrelated residuals non-blocking if documented/fail-closed | FROZEN / APPROVED |

```text
D-CONN-04-01  FROZEN / APPROVED
D-CONN-04-02  FROZEN / APPROVED
D-CONN-04-03  FROZEN / APPROVED
D-CONN-04-04  FROZEN / APPROVED
D-CONN-04-05  FROZEN / APPROVED
D-CONN-04-06  FROZEN / APPROVED
D-CONN-04-07  FROZEN / APPROVED
D-CONN-04-08  FROZEN / APPROVED
D-CONN-04-09  FROZEN / APPROVED
D-CONN-04-10  FROZEN / APPROVED

Decision Freeze: GRANTED
Implementation:  NOT AUTHORIZED BY THIS ARTIFACT
```

---

## 15. Implementation Boundary

This decision freeze **DOES NOT** authorize implementation. It only freezes policy.

Future implementation may be considered for:

- read-only target audit
- eligibility classification
- controlled LIVE backfill
- post-backfill verification
- security audit recording

Any implementation requires the normal governance ladder:

```text
Slice Planning
  → Architecture/Security Review as required
  → PO Slice Approval
  → Implementation Authorization
  → Implementation
  → PO Review
  → Closure
```

No implementation may begin from this artifact alone.

Explicitly **not** authorized by this freeze:

- NOT NULL migration (D-CONN-04-07)
- duplicate cleanup (D-CONN-04-05)
- Vault mutation / credential rebinding
- FIV / venue I/O / C7 / capital

---

## 16. FIV-PRE-01 Boundary

```text
FIV-CONN-04 policy freeze does NOT close PRE-01
FIV-CONN-04 does NOT authorize FIV
FIV-CONN-04 does NOT authorize venue I/O
FIV-CONN-04 does NOT authorize real capital
FIV-CONN-04 does NOT grant C7
```

Per D-CONN-04-10 Option B: PRE-01 may proceed when its **specific Binance Testnet path** is coherent under PRE-01’s own gates; unrelated documented fail-closed EXCHANGE NULL residuals do not automatically block PRE-01.

---

## 17. Safety State

```text
External I/O:       ZERO
Binance/Bybit/OKX:  ZERO
FIV:                NOT PERFORMED
Capital:            ZERO
C7:                 DENY-ALL
allowRealVenueIo:   FALSE
Vault:              NOT MODIFIED
Credentials:        NOT MODIFIED
Database:           NOT MODIFIED
LIVE backfill:      NOT PERFORMED
Schema/migrations:  NOT MODIFIED / NOT CREATED
Protected leftovers: UNTOUCHED
```

---

## 18. Next Governance Gate

```text
Next gate:
FIV-CONN-04 ARCHITECTURE / SECURITY CONFIRMATION
followed by
FIV-CONN-04 SLICE PLANNING
```

Do **not** create Slice Approval, authorize implementation, create migrations, perform backfill, or close FIV-CONN-04 / FIV-PRE-01 in this act.

---

**END OF FIV-CONN-04 PO/GOVERNANCE DECISION FREEZE**
