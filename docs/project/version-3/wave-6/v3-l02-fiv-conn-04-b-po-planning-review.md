# FIV-CONN-04-B PO/Governance Planning Review

**Document:** FIV-CONN-04-B Write-Gate / Lifecycle Mutation Lock — PO/Governance Planning Review  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B — Write-gate / lifecycle mutation lock  
**Authority:** Product Owner / Chief Architect  
**Nature:** **GOVERNANCE PLANNING REVIEW ONLY.** Reviews the FIV-CONN-04-B Planning Package and records readiness for Decision Freeze. Does **not** authorize implementation. Does **not** create migrations, mutate code/schema/Vault/credentials, perform LIVE backfill, or authorize FIV/C7/venue I/O/capital.

**Planning Package:** [`v3-l02-fiv-conn-04-b-planning-package.md`](./v3-l02-fiv-conn-04-b-planning-package.md)  
**Planning commit:** `5c3fb87de2147dce9a8f203b4bafb83117eeecc2`  
**Companion Decision Freeze:** [`v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-b-po-governance-decision-freeze.md)

**Repository baseline (review start):** `5c3fb87de2147dce9a8f203b4bafb83117eeecc2` (`HEAD == origin/main`)

```text
PO/GOVERNANCE PLANNING REVIEW = PASS

OD-B-01…OD-B-08 = RESOLVED / FROZEN (companion Decision Freeze)
FIV-CONN-04-B IMPLEMENTATION = NOT AUTHORIZED
```

Protected dirty/untracked leftovers outside these governance artifacts were **not** modified.

---

## 1. Planning Review Verdict

```text
PO/GOVERNANCE PLANNING REVIEW = PASS
```

**Rationale**

- Planning Package is internally coherent with frozen D-CONN-04-01…10, D-CRED-02-12, Architecture/Security C-01…C-06, and CLOSED FIV-CONN-04-A.
- It does **not** silently reopen Model C, Strategy B, environment immutability, or parent deny-set policy.
- All mandatory open decisions **OD-B-01…OD-B-08** are resolved in the companion Decision Freeze.
- Scope remains limited to write-gate / lifecycle mutation lock (C-01); does not absorb 04-C/D/E, FIV, Vault mutation, or LIVE backfill.
- Residual risks are implementation obligations (SEC-B / ARCH-B), not planning blockers.

---

## 2. Review Scope

Reviewed for sufficiency toward:

1. Architecture Review
2. Security Review
3. Eventual per-sub-slice Implementation Authorization / Slice gates

Not reviewed as implementation authorization.

---

## 3. Governance Baseline Checked

| Artifact                           | Status               | Result                                              |
| ---------------------------------- | -------------------- | --------------------------------------------------- |
| Parent FIV-CONN-04 Slice Approval  | GRANTED              | Not reopened                                        |
| D-CONN-04-01…10 Decision Freeze    | FROZEN               | Preserved; D-CONN-04-08 primary ownership for 04-B  |
| Architecture/Security Confirmation | PASS WITH CONDITIONS | C-01 addressed by plan; C-02…C-06 not redesigned    |
| FIV-CONN-04-A Closure              | CLOSED               | Not modified / not expanded                         |
| D-CRED-02-12 write serialization   | FROZEN               | App write gate primary; advisory alone insufficient |
| Model C / Strategy B / ENV1        | CLOSED parents       | Preserved                                           |

---

## 4. Findings

### 4.1 Strengths

| ID   | Finding                                                               |
| ---- | --------------------------------------------------------------------- |
| F-01 | Correct ownership: 04-B = gate; 04-D = UPDATE; 04-A closed input only |
| F-02 | Deny-set aligned to D-CONN-04-08                                      |
| F-03 | Multi-instance requirement correctly rejects process-local SoT        |
| F-04 | Race matrix RACE-01…10 is governance-usable                           |
| F-05 | Explicit non-scope prevents C7/FIV/Vault bleed                        |
| F-06 | Audit prefers existing Security Audit infrastructure                  |

### 4.2 Issues resolved by Decision Freeze (were open in planning)

| ID   | Issue                                                  | Disposition                                                               |
| ---- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| I-01 | OD-B-01 global vs workspace lock scope unresolved      | **FROZEN** → Global authorized migration window                           |
| I-02 | OD-B-02 NON-EXCHANGE create vs credential-hook breadth | **FROZEN** → create ALLOW; credential hooks DENY all types                |
| I-03 | OD-B-03 disconnect/disable assumed harmless            | **INSPECTED + FROZEN** → ALLOW (status-only; no Vault/env/binding change) |
| I-04 | OD-B-04 lease storage medium                           | **FROZEN** → dedicated singleton lease table + deny hooks                 |
| I-05 | OD-B-05 TTL/stale policy incomplete                    | **FROZEN** → TTL+heartbeat+fencing; stale cannot mutate                   |
| I-06 | OD-B-06 audit event catalog choice                     | **FROZEN** → dedicated `connection.migration-gate` class                  |
| I-07 | OD-B-07 operation matrix not frozen                    | **FROZEN** in Decision Freeze                                             |
| I-08 | OD-B-08 contention behavior                            | **FROZEN** → immediate deterministic reject                               |
| I-09 | AC-B03 wording ambiguous under global scope            | **CHANGE REQUIRED → RESOLVED** in freeze (refined AC-B03)                 |

### 4.3 Non-blocking gaps (forward to Architecture/Security Review)

| ID      | Gap                                                                                                     | Severity                   |
| ------- | ------------------------------------------------------------------------------------------------------- | -------------------------- |
| NB-B-01 | Exact max window duration numeric value (freeze sets governance ceiling; ops runbook may tighten)       | Low                        |
| NB-B-02 | Exact HTTP status code for gate-denied (Conflict vs Locked) — implementation detail under OD-B-08       | Low                        |
| NB-B-03 | Direct Prisma / emergency SQL remains residual bypass (documented; not solvable in app alone)           | Accepted residual          |
| NB-B-04 | Direct `SecretVaultService` mutate residual — CONN-04 must not call it; optional defense-in-depth later | Accepted residual for 04-B |

### 4.4 Blockers

```text
BLOCKERS: NONE
```

All mandatory OD-B decisions are resolved in the companion Decision Freeze.

---

## 5. OD-B Decisions (summary)

| ID          | Topic              | Frozen decision                                                                                                                              |
| ----------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **OD-B-01** | Lock scope         | **F — Global authorized migration window**                                                                                                   |
| **OD-B-02** | NON-EXCHANGE       | **NON-EXCHANGE create/rename ALLOW; credential store/replace/revoke DENY for all connectionTypes**                                           |
| **OD-B-03** | Disconnect/disable | **ALLOW** (status-only; all types)                                                                                                           |
| **OD-B-04** | Durable storage    | **Dedicated singleton lease table + application deny hooks** (advisory optional support only)                                                |
| **OD-B-05** | TTL / stale        | **TTL + heartbeat + fencing; stale holder cannot mutate; reclaim on expiry for new authorized acquire; operator-mediated reclaim if needed** |
| **OD-B-06** | Audit              | **Durable Security Audit via dedicated `connection.migration-gate` event type** for required gate events                                     |
| **OD-B-07** | Operation matrix   | **Frozen matrix in Decision Freeze §5**                                                                                                      |
| **OD-B-08** | Contention         | **Immediate deterministic rejection; no wait/queue/blind retry**                                                                             |

Full normative text: companion Decision Freeze.

---

## 6. Critical Governance Question — Lock Scope Analysis

### Option A — Workspace-scoped gate

| Dimension                                    | Assessment                                                                                                                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Safety                                       | Adequate **if** runner never processes more than one workspace without holding that workspace’s lease, and never overlaps                                                                                    |
| Blast radius                                 | Lower for unrelated workspaces                                                                                                                                                                               |
| Operational simplicity                       | Worse: N leases, ordering, incomplete inventory risk                                                                                                                                                         |
| Multi-instance                               | Still requires durable DB coordination per workspace key                                                                                                                                                     |
| Concurrency                                  | Allows parallel unrelated workspace mutations of deny-set while another workspace backfills — increases global inventory inconsistency risk during a single-runner migration designed to scan all workspaces |
| Isolation                                    | Strong workspace independence                                                                                                                                                                                |
| Suitability for one-time controlled backfill | Weaker: one-time migration benefits from a single exclusive window                                                                                                                                           |
| Permanent-freeze risk                        | Lower blast radius if stuck ON, but more complex stuck-state surface                                                                                                                                         |

### Option F — Global authorized migration window

| Dimension              | Assessment                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------- |
| Safety                 | Strongest exclusive critical section for D-CONN-04-08 deny-set                        |
| Blast radius           | Higher: deny-set blocked in all workspaces while ON                                   |
| Operational simplicity | Best for single-runner one-time migration                                             |
| Multi-instance         | One durable singleton lease; all instances observe same SoT                           |
| Concurrency            | Matches frozen “maintenance / write window” + single-runner                           |
| Isolation              | Workspace ACL still applies; gate does not grant cross-workspace powers               |
| Impact on operators    | Temporary deny of credential store/replace/revoke + EXCHANGE create only              |
| Suitability            | **Best fit** for authorized short CONN-04 backfill                                    |
| Permanent-freeze risk  | Must be constrained by max duration, authorized opener, TTL, mandatory release, audit |

### Decision

```text
OD-B-01 = F — GLOBAL AUTHORIZED MIGRATION WINDOW
```

Chosen for safety and fitness to a **one-time controlled migration**, not for implementation convenience. Narrow deny-set + max duration + release obligations prevent a general-purpose permanent credential freeze.

---

## 7. Disconnect / Disable Repository Inspection (OD-B-03)

Inspected `ConnectionsService.transitionLifecycle` / `updateStatus`:

- Writes **only** `status` (`DISCONNECTED` / `DISABLED`)
- Does **not** mutate `vaultSecretId`, `environment`, or Vault
- Clears capability caches only
- Strategy B unique index excludes `REVOKED` only — disconnect/disable do **not** free a Strategy B slot

Therefore disconnect/disable do **not** create RACE-01/02/04 binding or collision races that D-CONN-04-08 targets. **ALLOW** is safe and preserves narrowest deny scope.

---

## 8. Race Review (RACE-01…10)

| Race                                     | Governance outcome under frozen decisions                         |
| ---------------------------------------- | ----------------------------------------------------------------- |
| RACE-01 revoke before UPDATE             | Deny revoke while ON; 04-D recheck/conditional UPDATE fail-closed |
| RACE-02 replace before UPDATE            | Deny replace while ON; exact `vaultSecretId` predicate in 04-D    |
| RACE-03 delete before UPDATE             | No delete API today (N/A); UPDATE no-op if missing                |
| RACE-04 Strategy B sibling create        | Deny EXCHANGE create while ON; Strategy B final authority         |
| RACE-05 two backfill workers             | Singleton lease; second acquire denied                            |
| RACE-06 two API instances                | Durable lease SoT; deny hooks on all instances                    |
| RACE-07 holder crash                     | TTL expiry + fencing; stale cannot continue                       |
| RACE-08 commit then crash before release | Forward-fix UPDATEs; lease remains until release/TTL              |
| RACE-09 acquire timeout                  | Fail closed; do not start 04-D                                    |
| RACE-10 retry after partial              | Must re-prove fencing; no bypass                                  |

```text
RACE ANALYSIS = DETERMINISTIC SAFE OUTCOMES CONFIRMED
```

---

## 9. Bypass Analysis

| Path                              | Covered by plan? | Implementation obligation                   |
| --------------------------------- | ---------------- | ------------------------------------------- |
| REST → ConnectionsService         | Yes              | Deny hooks mandatory                        |
| Internal ConnectionsService call  | Yes              | Same hooks                                  |
| Credential-only alternate service | None today       | Must not introduce ungated path             |
| Workers / scheduled jobs          | None today       | Future must use gated service               |
| Admin / migration runner          | Privileged       | Must acquire lease; no ungated env backfill |
| Direct SecretVaultService         | Residual         | CONN-04 forbids Vault mutate; SEC-B05       |
| Direct Prisma                     | Residual         | Ops/governance only; NB-B-03                |

---

## 10. Scope Control

Confirmed **not** absorbed by 04-B:

```text
04-A classification redo
04-C Vault-proven classifier delivery
04-D environment UPDATE
04-E residual verification
Credential provisioning
Testnet verification
FIV execution
C7 / allowRealVenueIo / capital
```

No planning item crosses these boundaries in a blocking way.

---

## 11. Sub-Slice Decomposition

Proposed B-01…B-06 is **ACCEPTABLE** without change at governance level.

| Sub-slice                            | Verdict |
| ------------------------------------ | ------- |
| B-01 Gate domain/contract            | ACCEPT  |
| B-02 Durable concurrency mechanism   | ACCEPT  |
| B-03 Lifecycle enforcement           | ACCEPT  |
| B-04 Backfill integration boundary   | ACCEPT  |
| B-05 Security/audit regression tests | ACCEPT  |
| B-06 Crash/concurrency verification  | ACCEPT  |

---

## 12. Acceptance Criteria Disposition

| ID     | Disposition                    | Notes                                                             |
| ------ | ------------------------------ | ----------------------------------------------------------------- |
| AC-B01 | **PASS**                       |                                                                   |
| AC-B02 | **PASS**                       |                                                                   |
| AC-B03 | **CHANGE REQUIRED → RESOLVED** | Refined for global scope in Decision Freeze                       |
| AC-B04 | **PASS**                       |                                                                   |
| AC-B05 | **PASS**                       |                                                                   |
| AC-B06 | **PASS**                       |                                                                   |
| AC-B07 | **PASS**                       |                                                                   |
| AC-B08 | **PASS**                       |                                                                   |
| AC-B09 | **PASS**                       |                                                                   |
| AC-B10 | **PASS**                       |                                                                   |
| AC-B11 | **PASS**                       |                                                                   |
| AC-B12 | **PASS**                       |                                                                   |
| AC-B13 | **PASS**                       |                                                                   |
| AC-B14 | **PASS**                       |                                                                   |
| AC-B15 | **PASS**                       |                                                                   |
| AC-B16 | **PASS**                       |                                                                   |
| AC-B17 | **PASS**                       |                                                                   |
| AC-B18 | **PASS**                       |                                                                   |
| AC-B19 | **PASS**                       |                                                                   |
| AC-B20 | **PASS**                       |                                                                   |
| AC-B21 | **PASS**                       |                                                                   |
| AC-B22 | **PASS**                       |                                                                   |
| AC-B23 | **PASS**                       |                                                                   |
| AC-B24 | **PASS**                       |                                                                   |
| AC-B25 | **ADDED**                      | Global window max-duration / release / non-permanence obligations |

No AC remains **BLOCKED**.

---

## 13. Architecture Readiness

```text
ARCHITECTURE READINESS = READY FOR ARCHITECTURE REVIEW
Mandatory Architecture conditions: ARCH-B01…ARCH-B08 (Decision Freeze)
```

Planning is sufficiently defined; Architecture Review must confirm lease contract + deny-hook placement without redesigning frozen OD-B.

---

## 14. Security Readiness

```text
SECURITY READINESS = READY FOR SECURITY REVIEW
Mandatory Security conditions: SEC-B01…SEC-B14 (Decision Freeze)
```

---

## 15. Recommendation for Next Gate

```text
Next gate:
  1. Accept companion PO/Governance Decision Freeze (OD-B-01…08)
  2. Proceed to FIV-CONN-04-B Architecture Review
  3. Proceed to FIV-CONN-04-B Security Review
  4. Then Implementation Authorization (separate act)

DO NOT authorize implementation from this Planning Review alone.
DO NOT implement lease table / deny hooks yet.
DO NOT start 04-C / 04-D / 04-E.
```

---

## 16. Implementation Gate Status

```text
FIV-CONN-04-B IMPLEMENTATION = NOT AUTHORIZED
```

---

## 17. Safety State (this review act)

```text
Database writes:        ZERO
Schema/migrations:      NOT CREATED
Vault mutations:        ZERO
Credential mutations:   ZERO
External I/O:           ZERO
FIV:                    NOT PERFORMED
Capital:                ZERO
C7:                     DENY-ALL
allowRealVenueIo:       FALSE
LIVE backfill:          NOT PERFORMED
Protected leftovers:    UNTOUCHED
```

---

## Final State

```text
FIV-CONN-04-A = CLOSED
FIV-CONN-04-B = PLANNING REVIEW / DECISION FREEZE COMPLETE
FIV-CONN-04-B IMPLEMENTATION = NOT AUTHORIZED
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
LIVE CAPITAL = NOT ACTIVATED
```

**END OF FIV-CONN-04-B PO/GOVERNANCE PLANNING REVIEW**
