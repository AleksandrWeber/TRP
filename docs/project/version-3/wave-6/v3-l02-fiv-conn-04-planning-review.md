# FIV-CONN-04 Planning Review

**Document:** FIV-CONN-04 LIVE Environment Backfill / Migration Residuals — Planning Review  
**Date:** 2026-09-17  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04 — LIVE environment backfill / residual migration state  
**Authority:** Repository-side Architecture / Security / Engineering Governance Reviewer  
**Nature:** **GOVERNANCE REVIEW ONLY.** Does **not** freeze PO decisions. Does **not** grant Slice Approval. Does **not** authorize implementation. Does **not** create migrations, mutate Connections/Vault/credentials, perform backfill, or authorize FIV/C7/venue I/O/capital.

**Planning package reviewed:** [`v3-l02-fiv-conn-04-planning-package.md`](./v3-l02-fiv-conn-04-planning-package.md)  
**Planning package commit:** `356a8a2a8d67ac70156f346ebecccfbf88c9970d`  
**Review baseline:** `356a8a2a8d67ac70156f346ebecccfbf88c9970d` (`HEAD == origin/main`)

```text
PLANNING REVIEW = PASS WITH REQUIRED PO DECISIONS
Implementation:                 NOT AUTHORIZED
Slice Approval:                 NOT GRANTED
PO Decision Freeze:             NOT PERFORMED BY THIS ARTIFACT
Backfill:                       NOT PERFORMED
FIV:                            NOT PERFORMED
Next gate:                      FIV-CONN-04 PO/GOVERNANCE DECISION REVIEW
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Review Status

```text
Status:           PASS WITH REQUIRED PO DECISIONS
Architecture:     PASS WITH CONDITIONS (conditions = residual PO freezes)
Security:         PASS WITH CONDITIONS (conditions = residual PO freezes)
Scope:            PASS
Replanning:       NOT REQUIRED
Blocking defects: NONE
```

Architecture, security, and scope of the Planning Package are coherent with CLOSED CONN-01/02/03 and frozen CRED-02 / CONN-03 decisions. Material remaining work is **explicit PO/Governance freeze** of D-CONN-04-01…10 — not architectural defect requiring replan.

---

## 2. Repository State

| Check                           | Result                                                |
| ------------------------------- | ----------------------------------------------------- |
| `HEAD`                          | `356a8a2a8d67ac70156f346ebecccfbf88c9970d`            |
| `origin/main`                   | `356a8a2a8d67ac70156f346ebecccfbf88c9970d`            |
| `HEAD == origin/main`           | **YES**                                               |
| Latest commit                   | `docs(wave-6): add fiv-conn-04 planning package`      |
| Planning package in git history | **YES**                                               |
| Protected leftovers             | Present dirty/untracked; **untouched** by this review |

Pre-check dirty/untracked set matches prior governance acts (composition spec, technical-debt, wave-5 progress, notification/wave-5/wave-6 untracked docs). No repair attempted.

---

## 3. Planning Package Reviewed

| Field              | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| Path               | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-planning-package.md` |
| Commit             | `356a8a2a8d67ac70156f346ebecccfbf88c9970d`                             |
| Nature             | Slice planning only; no implementation authorization                   |
| Declared verdict   | READY FOR PLANNING REVIEW                                              |
| Residual objective | LIVE backfill / migration residuals after CONN-01/02/03                |

Package was read in full for this review.

---

## 4. Governance Dependencies

| Artifact                                      | Status          | Compatibility                                                    |
| --------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| FIV-CRED-01 Closure                           | CLOSED          | Exact-purpose taxonomy preserved; not reopened                   |
| FIV-CRED-02 Decision Freeze (D-CRED-02-01…14) | FROZEN          | D-CRED-02-04/05/09/12 correctly cited as parent ownership        |
| FIV-CONN-01 Closure                           | CLOSED          | Nullable env + immutability + create validation not redesigned   |
| FIV-CONN-02 Closure                           | CLOSED          | Strategy B not redesigned; collision gate correctly residualized |
| FIV-CONN-03 Closure / Decision Freeze         | CLOSED / FROZEN | Model C + NULL EXCHANGE fail-closed preserved                    |
| FIV-PRE-01                                    | NOT CLOSED      | Correctly not auto-closed by CONN-04                             |

**PASS.** Frozen decisions are not reopened. Sequence divergence (Strategy B before backfill) is correctly treated as a CONN-04 collision-audit obligation, consistent with CONN-02 planning.

---

## 5. Scope Review

### In scope (package) — **PASS**

- Read-only audit / inventory
- Deterministic LIVE eligibility classifier (PO-frozen)
- Ambiguity / quarantine disposition (no silent LIVE)
- Controlled `Connection.environment` NULL→`live` for approved rows
- Strategy B collision detection
- Idempotency / concurrency / rollback / observability definitions
- Optional EXCHANGE NOT NULL (**conditional**, PO-gated)

### Out of scope (package) — **PASS**

- CONN-03 / CONN-05 redesign
- UI Testnet / CRED-05
- Venue I/O / Binance / FIV
- C7 / `allowRealVenueIo`
- Vault / SecretPurpose / ENV1 / EG1 redesign
- Credential create/rotate/delete / `vaultSecretId` rebind
- Blanket NULL→LIVE
- Automatic duplicate destructive cleanup

**No scope leakage found.** Sub-slices 04-A…D are coherent; 04-E correctly conditional.

---

## 6. Data Model Review

Repository verification (`apps/api/prisma/schema.prisma` + Strategy B migration):

| Concern                                                                                    | Result   |
| ------------------------------------------------------------------------------------------ | -------- |
| Fields: workspaceId, provider, connectionType, vaultSecretId, status, nullable environment | **PASS** |
| `environment` still `String?`                                                              | **PASS** |
| Strategy B index present (`connection_records_ws_provider_env_credentialed_uidx`)          | **PASS** |
| Package does not replace Strategy B                                                        | **PASS** |
| Logical identity = workspaceId + provider + environment                                    | **PASS** |
| `vaultSecretId` = credential reference only (not logical uniqueness)                       | **PASS** |
| Existing `@@unique([workspaceId, provider, vaultSecretId])` preserved                      | **PASS** |
| LIVE / TESTNET / NULL semantics; NULL ≠ LIVE                                               | **PASS** |

**PASS.**

---

## 7. NULL EXCHANGE Classification Review

### Local inventory re-verification (read-only; this review)

| Metric                   | Package claim               | Re-verified                                       |
| ------------------------ | --------------------------- | ------------------------------------------------- |
| Total Connections        | 13                          | **13**                                            |
| All environment NULL     | Yes                         | **Yes** (populated env = 0)                       |
| EXCHANGE NULL            | 4                           | **4**                                             |
| Credentialed EXCHANGE    | 1 BINANCE purpose `trading` | **1** BINANCE, purpose `trading`, workspace match |
| Metadata-only EXCHANGE   | 3                           | **3** (BINANCE×2, BYBIT×1)                        |
| Populated LIVE / TESTNET | 0 / 0                       | **0 / 0**                                         |
| Local purpose conflicts  | 0                           | **0**                                             |
| Strategy B index         | Present                     | **Present**                                       |

### Classification logic — **PASS WITH CONDITIONS**

| Class                 | Package rule                                      | Review                                   |
| --------------------- | ------------------------------------------------- | ---------------------------------------- |
| A unambiguous LIVE    | exact `vaultSecretId` → `{trading, trading_live}` | **PASS** — matches accepted evidence bar |
| B unambiguous TESTNET | exact `vaultSecretId` → `trading_testnet`         | **PASS**                                 |
| C/E metadata-only     | not silent LIVE; PO for eligibility               | **PASS**                                 |
| Provider/type alone   | insufficient                                      | **PASS**                                 |
| Vault during planning | metadata read-only                                | **PASS**                                 |

**Condition:** Local counts are **not** production proof (see §16). Target-environment audit remains mandatory before any authorized write.

Parent D-CRED-02-04 (“unambiguous LIVE; ambiguous ≠ auto-LIVE”) is correctly **not** treated as automatic metadata-only LIVE under the stricter CONN-04 evidence bar; that tension is correctly escalated to **D-CONN-04-01**.

---

## 8. D-CONN-04-01…10 Review

| ID                                     | Package framing                                               | Sufficiently framed? | PO freeze still required? | Review note                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------- | -------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **D-CONN-04-01** LIVE evidence bar     | Options A Vault-proven / B metadata-only / C allowlist hybrid | **YES**              | **YES**                   | Recommended A is coherent with security evidence bar; not frozen here                                        |
| **D-CONN-04-02** Ambiguous NULL        | Remain NULL / quarantine+review / defer slice                 | **YES**              | **YES**                   | “Quarantine” must not invent a new runtime bypass; remain NULL + fail-closed is already approved via CONN-03 |
| **D-CONN-04-03** Purpose mismatch      | Skip/quarantine / abort batch / manual only; no Vault mutate  | **YES**              | **YES**                   | Fail-closed principle correct                                                                                |
| **D-CONN-04-04** Revoked/dangling      | Skip/quarantine; revoked exclude recommended                  | **YES**              | **YES**                   | Must not silently LIVE-ify                                                                                   |
| **D-CONN-04-05** Duplicates/collisions | Block credentialed collisions; no auto-merge                  | **YES**              | **YES**                   | Strategy B already allows metadata-only duplicates                                                           |
| **D-CONN-04-06** Residual NULL policy  | May remain vs must clear                                      | **YES**              | **YES**                   | Gates NOT NULL and PRE-01 coupling                                                                           |
| **D-CONN-04-07** NOT NULL in CONN-04   | Include 04-E / defer / app-only                               | **YES**              | **YES**                   | Correctly conditional                                                                                        |
| **D-CONN-04-08** Write gate            | Confirm D-CRED-02-12 scope                                    | **YES**              | **YES**                   | Parent freeze exists; slice must confirm create deny scope                                                   |
| **D-CONN-04-09** Audit requirements    | Counters, retention, sign-off                                 | **YES**              | **YES**                   | Minimum counters already listed; retention/sign-off need freeze                                              |
| **D-CONN-04-10** PRE-01 blocking       | Unresolved NULL blocks PRE-01 vs documented residuals         | **YES**              | **YES**                   | Must not auto-close PRE-01                                                                                   |

**No PO decisions are made by this Planning Review.**

---

## 9. Architecture Review

| Criterion                                                          | Result                            |
| ------------------------------------------------------------------ | --------------------------------- |
| Residual objective clear after CONN-01/02/03                       | **PASS**                          |
| ENV1 LIVE/TESTNET reused; DEMO deferred                            | **PASS**                          |
| Migration-time env write as exception to D-CRED-02-09 immutability | **PASS** (explicit, time-bounded) |
| Does not redesign CONN-03 Model C path                             | **PASS**                          |
| Sub-slice A→B→C→D coherent; E conditional                          | **PASS**                          |
| AQ-04-01…10 answers consistent with Model C / Strategy B           | **PASS**                          |

**Architecture: PASS WITH CONDITIONS** — conditions are the residual PO freezes in §8/§20, not redesign defects.

---

## 10. Security Review

| Control                                                         | Result                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------- |
| Workspace isolation                                             | **PASS**                                                   |
| Exact `vaultSecretId` binding; no sibling/provider-only         | **PASS**                                                   |
| Purpose / environment isolation; no cross-env fallback          | **PASS**                                                   |
| Mismatch / dangling / revoked → fail closed (no Vault “repair”) | **PASS**                                                   |
| Collision fail-closed under Strategy B                          | **PASS**                                                   |
| Concurrency write gate (D-CRED-02-12)                           | **PASS** (policy framed; freeze needed for exact deny set) |
| Secret non-exposure (metadata-only audit)                       | **PASS**                                                   |
| No weakening of ENV1 / EG1 / C7 / S04 / human-start / live auth | **PASS**                                                   |
| No FIV / venue I/O / capital authorization                      | **PASS**                                                   |

**Security: PASS WITH CONDITIONS** — same PO residual conditions; no security bypass introduced.

---

## 11. Migration / Backfill Safety

| Requirement                                                                           | Result   |
| ------------------------------------------------------------------------------------- | -------- |
| Order: audit → classify → eligibility → controlled write → verify → optional NOT NULL | **PASS** |
| No write during planning                                                              | **PASS** |
| Conditional `UPDATE … WHERE environment IS NULL` + unchanged vault ref                | **PASS** |
| No blanket NULL→LIVE                                                                  | **PASS** |
| LIVE evidence requires Vault-class purpose (under recommended bar)                    | **PASS** |
| Collision check before write; Strategy B final authority                              | **PASS** |
| Idempotent / restart-safe                                                             | **PASS** |
| Forward-fix; never LIVE↔TESTNET rewrite; never Vault undo                             | **PASS** |

**PASS.**

---

## 12. Strategy B Review

| Requirement                                                      | Result   |
| ---------------------------------------------------------------- | -------- |
| Strategy B already implemented; not redesigned                   | **PASS** |
| Uniqueness authority remains WS+provider+env (partial predicate) | **PASS** |
| Credentialed NULL→live enters index; collisions fail closed      | **PASS** |
| No automatic duplicate cleanup authorized                        | **PASS** |
| No silent sibling/Connection substitution on collision           | **PASS** |

**PASS.**

---

## 13. Model C Review

Package preserves:

```text
Connection.environment
  → expected purpose class
  → exact vaultSecretId
  → Vault metadata
  → actual SecretPurpose
  → FAIL CLOSED on mismatch
```

| Forbidden behavior                            | Package position                       | Result   |
| --------------------------------------------- | -------------------------------------- | -------- |
| Vault purpose mutation                        | Forbidden                              | **PASS** |
| Credential rebind                             | Forbidden                              | **PASS** |
| Provider-only / sibling selection             | Forbidden                              | **PASS** |
| Cross-workspace / cross-env fallback          | Forbidden                              | **PASS** |
| NULL→LIVE assumption                          | Forbidden                              | **PASS** |
| Provider/type-only inference                  | Forbidden                              | **PASS** |
| Legacy `trading` + live Model C compatibility | Preserved (no force to `trading_live`) | **PASS** |

**PASS.**

---

## 14. Concurrency / Idempotency

| Concern                                                          | Result   |
| ---------------------------------------------------------------- | -------- |
| D-CRED-02-12 write serialization dependency                      | **PASS** |
| Prevents stale overwrite via `environment IS NULL` predicate     | **PASS** |
| Strategy B DB authority under race                               | **PASS** |
| Single-runner backfill expectation                               | **PASS** |
| Re-run does not rewrite LIVE/TESTNET; no Vault/rebind/duplicates | **PASS** |

**PASS** (exact create-deny breadth remains **D-CONN-04-08**).

---

## 15. Rollback / Forward-Fix

| Forbidden rollback              | Package      | Result   |
| ------------------------------- | ------------ | -------- |
| LIVE→TESTNET                    | Forbidden    | **PASS** |
| TESTNET→LIVE “repair”           | Forbidden    | **PASS** |
| Vault-purpose rollback          | Forbidden    | **PASS** |
| Destructive undo of Connections | Not proposed | **PASS** |
| Forward-fix preferred           | Explicit     | **PASS** |

**PASS.**

---

## 16. Production-vs-Local Limitation

```text
LOCAL inventory (developer DB / planning evidence):
  13 Connections
  1 Vault-proven LIVE-class EXCHANGE
  3 metadata-only ambiguous EXCHANGE
  ≠ production/deployed inventory certification
```

Package correctly labels inventory as local with production audit mandatory in 04-A.  
This review **reconfirms local counts only** and does **not** invent production data.

**PASS.** Future authorized implementation must run controlled preflight audit on the target environment before writes.

---

## 17. FIV-PRE-01 Relationship

| Claim                                                               | Result                                           |
| ------------------------------------------------------------------- | ------------------------------------------------ |
| CONN-04 may resolve residual Connection environment state           | **PASS**                                         |
| Does **not** auto-close FIV-PRE-01                                  | **PASS**                                         |
| Does **not** authorize FIV / Binance I/O / venue I/O / C7 / capital | **PASS**                                         |
| Whether unresolved NULL blocks PRE-01                               | Escalated to **D-CONN-04-10** — **PASS** framing |

**PASS.**

---

## 18. Risks

| ID   | Risk                              | Severity | Package mitigation                      | Review               |
| ---- | --------------------------------- | -------- | --------------------------------------- | -------------------- |
| R-01 | Metadata-only over-classification | High     | D-CONN-04-01 strict bar                 | Accepted             |
| R-02 | Strategy B collision              | High     | Pre-audit + abort                       | Accepted             |
| R-03 | Concurrent credential writes      | High     | Write gate                              | Accepted             |
| R-04 | Permanent immutability weakening  | Medium   | Time-bounded migration exception        | Accepted             |
| R-05 | NOT NULL with residual NULL       | High     | 04-E conditional                        | Accepted             |
| R-06 | Scope bleed                       | Medium   | Explicit non-scope                      | Accepted             |
| R-07 | Local ≠ production                | High     | Mandatory target audit                  | Accepted             |
| R-08 | Quarantine misread as bypass      | Medium   | Must remain fail-closed; no waiver flag | **Condition for PO** |

No new unmitigated architectural risk requiring replan.

---

## 19. Blocking Issues

```text
Blocking architectural/security/scope defects: NONE
```

Remaining work is **PO/Governance decision freeze**, not replanning.

Informational (non-blocking):

- “Quarantine” must be defined as audit disposition + remain NULL + CONN-03 fail-closed — **not** a new runtime exception path.
- Parent D-CRED-02-04 metadata-era “unambiguous semantics” vs CONN-04 Vault-evidence bar is correctly unresolved pending D-CONN-04-01.

---

## 20. Required PO Decisions

All remain **PO DECISION REQUIRED** before Slice Approval / implementation authorization:

1. **D-CONN-04-01** — LIVE evidence bar
2. **D-CONN-04-02** — Ambiguous NULL handling
3. **D-CONN-04-03** — Purpose mismatch handling
4. **D-CONN-04-04** — Revoked/dangling credential handling
5. **D-CONN-04-05** — Duplicate/collision handling
6. **D-CONN-04-06** — Residual NULL policy
7. **D-CONN-04-07** — NOT NULL scope in CONN-04
8. **D-CONN-04-08** — Concurrency/write gate exact deny set
9. **D-CONN-04-09** — Audit/observability sign-off requirements
10. **D-CONN-04-10** — Unresolved rows vs FIV-PRE-01 blocking

This Planning Review does **not** freeze any of the above.

---

## 21. Planning Review Verdict

```text
VERDICT:
PASS WITH REQUIRED PO DECISIONS

Rationale:
  - Scope coherent and bounded to residual LIVE backfill / migration state
  - Architecture consistent with CLOSED CONN-01/02/03 and Model C
  - Security fail-closed controls preserved; no Vault/credential redesign
  - Strategy B preserved as uniqueness authority
  - Local classification evidence verified; production distinct
  - Explicit PO decisions D-CONN-04-01…10 remain before approval/implementation
  - No material defect requiring replanning
```

```text
Implementation authorization:   NOT GRANTED
Slice Approval:                 NOT GRANTED
FIV-CONN-04:                    NOT CLOSED
FIV-PRE-01:                     NOT CLOSED
FIV:                            NOT AUTHORIZED
```

---

## 22. Next Governance Gate

```text
Next gate:
FIV-CONN-04 PO/GOVERNANCE DECISION REVIEW
(→ Decision Freeze for D-CONN-04-01…10)
```

Do **not** create Slice Approval, implement, migrate, backfill, or authorize FIV in this act.

---

## Safety State (this review act)

```text
External I/O:       ZERO
Binance/Bybit/OKX:  ZERO
FIV:                NOT PERFORMED
Capital:            ZERO
C7:                 DENY-ALL
allowRealVenueIo:   FALSE
Vault:              NOT MODIFIED (read-only metadata verify only)
Credentials:        NOT MODIFIED
Database:           NOT MODIFIED (read-only inventory verify only)
LIVE backfill:      NOT PERFORMED
Protected leftovers: UNTOUCHED
```

---

**END OF FIV-CONN-04 PLANNING REVIEW**
