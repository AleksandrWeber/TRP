# FIV-CONN-04-B Planning Package — Write-Gate / Lifecycle Mutation Lock

**Document:** FIV-CONN-04-B Write-Gate / Lifecycle Mutation Lock — Planning Package  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B — Write-gate / lifecycle mutation lock  
**Parent:** FIV-CONN-04 — LIVE environment backfill / residual migration state  
**Authority:** Senior Staff Engineer / Architect (planning under Product Owner + Chief Architect governance)  
**Nature:** **PLANNING ONLY.** Does **not** authorize FIV-CONN-04-B implementation. Does **not** create migrations, mutate Prisma schema, mutate Connections/Vault/credentials, add runtime locks, perform LIVE backfill, or authorize FIV/C7/venue I/O/capital.

**Repository baseline (planning start):** `2f0686b413c0b3e34cbb09c16d8657ff31a46c80` (`HEAD == origin/main` at planning start)

```text
FIV-CONN-04-A = CLOSED
FIV-CONN-04-B = PLANNING ONLY
FIV-CONN-04-B IMPLEMENTATION = NOT AUTHORIZED
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
LIVE CAPITAL = NOT ACTIVATED
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Executive Summary

```text
PLANNING STATUS = READY FOR PO / GOVERNANCE REVIEW
```

FIV-CONN-04-B must deliver the **C-01 write gate** required by frozen **D-CONN-04-08 = B** and parent **D-CRED-02-12**: during the authorized FIV-CONN-04 backfill window, deny credential store/replace/revoke and EXCHANGE Connection create, under a **durable multi-instance-safe exclusive lease**, with fail-closed acquisition and durable Security Audit evidence.

**Recommended architecture (subject to open PO decisions in §26):**

1. **Durable DB lease row** (singleton migration-gate lease) with owner id, fencing token, TTL/heartbeat — patterned after Trading Session fenced leases.
2. **Application deny hooks** at `ConnectionsService` entry points (canonical mutation path).
3. **Optional** Postgres advisory lock only as a supporting secondary control — **never sole SoT** (D-CRED-02-12).
4. **Gate ON only for the authorized backfill window**; not a permanent global credential freeze.

04-B does **not** classify LIVE, does **not** UPDATE `Connection.environment`, does **not** mutate Vault, and does **not** perform FIV. It exists so that later **04-D** can run a controlled environment backfill without racing lifecycle mutations.

---

## 2. Current-State Findings

### 2.1 Repository facts (inspected)

| Area                                                | Finding                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Runtime write gate for CONN-04                      | **ABSENT** (expected; C-01 deferred to 04-B)                                                |
| Postgres advisory locks for connections             | **NOT FOUND**                                                                               |
| Connection migration lease table                    | **NOT FOUND**                                                                               |
| Process-local mutex as SoT                          | Present elsewhere (e.g. human-start); **insufficient** for multi-instance                   |
| Closest durable lease pattern                       | `TradingSession` fenced lease (`leaseOwnerId`, `fencingToken`, TTL/heartbeat)               |
| Credential mutations                                | Only via `ConnectionsService.storeCredentials` / `replaceCredentials` / `revoke`            |
| EXCHANGE create                                     | `ConnectionsService.create` (requires `environment` at create since CONN-01)                |
| Connection delete API                               | **NONE** on Connections controller                                                          |
| Public environment mutation                         | **FORBIDDEN** after create (immutable); rename writes `displayName` only                    |
| Background workers mutating credentials/connections | **NONE found**                                                                              |
| Direct public Vault HTTP API                        | **NONE**; Vault is internal Nest service                                                    |
| FIV-CONN-04-A                                       | **CLOSED** — read-only preflight; Prisma `findMany`/`findFirst`; Vault `list` metadata only |
| Strategy B                                          | Partial unique index already live (CONN-02)                                                 |
| Security Audit                                      | Durable `SecurityAuditRecord` + classified catalog; sensitive-key rejection                 |
| `allowRealVenueIo`                                  | `false`                                                                                     |
| C7                                                  | DENY-ALL                                                                                    |

### 2.2 Canonical mutation hook points (future 04-B deny targets)

| Operation          | Hook                                               |
| ------------------ | -------------------------------------------------- |
| Credential store   | `ConnectionsService.storeCredentials`              |
| Credential replace | `ConnectionsService.replaceCredentials`            |
| Credential revoke  | `ConnectionsService.revoke`                        |
| EXCHANGE create    | `ConnectionsService.create` when creating EXCHANGE |

Controller paths: `POST/PUT …/credentials`, `POST …/revoke`, `POST /v1/connections`.

### 2.3 Pre-existing non-atomicity (context, not 04-B scope)

`ConnectionsService` credential flows are sequential Vault then Connection update (no shared Prisma transaction across both). 04-B must not pretend to invent full Vault↔Connection atomicity; it must **exclude concurrent lifecycle races during the backfill window**.

### 2.4 Local dirty/untracked leftovers (protected)

Local working tree still contains protected leftovers (04-A implementation files, wave-5 docs, etc.). This planning act **must not** modify, stage, or clean them.

---

## 3. Governance Baseline

| Artifact                           | Path                                                                                                                     | Status                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| Parent Slice Approval              | [`v3-l02-fiv-conn-04-po-governance-slice-approval.md`](./v3-l02-fiv-conn-04-po-governance-slice-approval.md)             | **GRANTED**                      |
| Decision Freeze                    | [`v3-l02-fiv-conn-04-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-po-governance-decision-freeze.md)           | D-CONN-04-01…10 **FROZEN**       |
| Architecture/Security Confirmation | [`v3-l02-fiv-conn-04-architecture-security-confirmation.md`](./v3-l02-fiv-conn-04-architecture-security-confirmation.md) | **PASS WITH CONDITIONS**         |
| Parent Slice Planning              | [`v3-l02-fiv-conn-04-slice-planning-package.md`](./v3-l02-fiv-conn-04-slice-planning-package.md)                         | COMPLETE                         |
| FIV-CONN-04-A Closure              | [`v3-l02-fiv-conn-04-a-closure.md`](./v3-l02-fiv-conn-04-a-closure.md)                                                   | **CLOSED**                       |
| FIV-CONN-04-A PO Review            | [`v3-l02-fiv-conn-04-a-po-review.md`](./v3-l02-fiv-conn-04-a-po-review.md)                                               | **PASS**                         |
| Parent D-CRED-02-12                | [`v3-l02-fiv-cred-02-po-governance-decision-freeze.md`](./v3-l02-fiv-cred-02-po-governance-decision-freeze.md)           | **FROZEN** (write serialization) |

### Parent slice composition (do not combine)

```text
04-A Target inventory + read-only preflight     = CLOSED
04-B Write-gate / lifecycle mutation lock       = THIS PLANNING PACKAGE
04-C Vault-proven LIVE classifier               = NOT STARTED
04-D Conditional environment UPDATE + audit     = NOT STARTED
04-E Post-backfill residual inventory           = NOT STARTED
```

---

## 4. Frozen PO Decisions

These decisions are authoritative and **must not** be reopened by 04-B planning:

| ID                   | Binding summary for 04-B                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| **D-CONN-04-01 = A** | LIVE only with Vault-proven purpose on exact `vaultSecretId` — owned by 04-C/D, not B               |
| **D-CONN-04-02 = A** | Ambiguous remain NULL; fail closed; no waiver                                                       |
| **D-CONN-04-03 = A** | Mismatch skip/quarantine; eligible may continue                                                     |
| **D-CONN-04-04 = A** | Defective bindings never auto-LIVE                                                                  |
| **D-CONN-04-05 = A** | Strategy B prevention only; no cleanup                                                              |
| **D-CONN-04-06 = C** | NON-EXCHANGE NULL OK; EXCHANGE residual NULL OK fail-closed                                         |
| **D-CONN-04-07 = A** | `environment` remains nullable; no NOT NULL                                                         |
| **D-CONN-04-08 = B** | **PRIMARY 04-B OWNERSHIP:** deny store/replace/revoke + EXCHANGE create during backfill window      |
| **D-CONN-04-09 = B** | Security fields + durable Security Audit (04-B owns gate events; 04-D owns per-row backfill events) |
| **D-CONN-04-10 = B** | PRE-01 coupling unchanged; 04-B does not authorize PRE-01/FIV                                       |

### Parent serialization freeze (binding)

**D-CRED-02-12:** Primary control = application write gate; supporting unique index; advisory locks alone **insufficient**.

### Frozen architectural invariants (not reopened)

```text
Model C: exact vaultSecretId → Vault purpose → FAIL CLOSED on mismatch
Vault SecretPurpose = runtime SoT
Connection.environment = constraint / audit context
Strategy B = DB uniqueness authority
NULL ≠ LIVE
No provider-only lookup / sibling substitution / cross-workspace / cross-env fallback
No Vault mutation / credential rebinding / LIVE↔TESTNET rewrite in CONN-04
C7 = DENY-ALL
allowRealVenueIo = FALSE
```

---

## 5. Architecture / Security Constraints

Preserve Architecture/Security Confirmation conditions:

| ID       | Condition                            | 04-B ownership                                                   |
| -------- | ------------------------------------ | ---------------------------------------------------------------- |
| **C-01** | Write gate                           | **PRIMARY — this slice**                                         |
| **C-02** | Migration-time environment exception | Owned by **04-D**; 04-B only ensures gate ON during D            |
| **C-03** | Classifier / UPDATE                  | **04-C / 04-D**                                                  |
| **C-04** | Audit events                         | 04-B: gate lifecycle + blocked mutations; 04-D: per-row backfill |
| **C-05** | Target preflight                     | **04-A CLOSED** — do not expand                                  |
| **C-06** | Residual inventory                   | **04-E**                                                         |

Do **not** silently redesign C-02…C-06.

---

## 6. Problem Statement

Later **FIV-CONN-04-D** will perform conditional `NULL → live` UPDATEs using Vault-proven eligibility and Strategy B collision checks.

Without a write gate, concurrent lifecycle mutations can invalidate classification between read and write:

```text
classify(row) → ELIGIBLE_LIVE
  ↓ race
credential replace/revoke OR sibling EXCHANGE create
  ↓
UPDATE environment='live' against stale assumptions
  → wrong binding, Strategy B conflict, or unsafe metadata state
```

**04-B objective:** establish a **time-bounded, fail-closed, multi-instance-safe lifecycle mutation exclusion** so the backfill critical section cannot race with the frozen deny set — without becoming a permanent general-purpose credential freeze, without Vault mutation, and without performing the backfill itself.

---

## 7. Lock-Scope Alternatives

### 7.1 Alternatives matrix

| Alt   | Scope                               | What it freezes                                                        | Pros                                                                                      | Cons                                                                                                                                                                                                     |
| ----- | ----------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | Workspace-wide credential lifecycle | All credential store/replace/revoke + EXCHANGE create in one workspace | Aligns with Strategy B workspace boundary; smaller blast radius than global               | Multi-workspace backfill needs sequential gates or multiple leases; more complex runner                                                                                                                  |
| **B** | Workspace + provider                | Same deny set limited to one provider                                  | Minimal disruption                                                                        | Incomplete: revoke/replace on other-provider rows still can change Vault slots used by inventory edge cases; EXCHANGE create of other providers still adds concurrent Connection churn; harder to reason |
| **C** | Workspace + provider + environment  | Narrowest EXCHANGE create / credential ops for a slot                  | Matches Strategy B key shape                                                              | Credential ops are Connection-id keyed, not env keyed; NULL-env candidates are exactly the race surface — env dimension poorly defined for deny hooks                                                    |
| **D** | Specific Connection                 | Only one Connection’s credential ops                                   | Minimal freeze                                                                            | **Fails RACE-04** (sibling EXCHANGE create) and Strategy B collision races                                                                                                                               |
| **E** | Specific Vault secret               | Block Vault ops on one secret id                                       | Precise binding                                                                           | Bypass via Connection create + new secret; Vault has no public API but internal callers could still race Connection rows; does not cover EXCHANGE create                                                 |
| **F** | Global system migration window      | Deny set for **all** workspaces while single-runner lease held         | Matches D-CRED-02-12 maintenance window; simplest single-runner; strongest race reduction | Broader product impact during window                                                                                                                                                                     |

### 7.2 Consequences vs required invariants

| Invariant                                       | Implication for scope                                                                                                |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Model C / exact `vaultSecretId`                 | Gate must block replace/revoke that can change binding before 04-D UPDATE                                            |
| Strategy B `(workspace, provider, environment)` | Gate must block EXCHANGE create that can occupy LIVE slot                                                            |
| Workspace isolation                             | Lease/deny checks must always carry `workspaceId` on mutation paths; never cross-workspace “permission by confusion” |
| No cross-environment fallback                   | Gate must not invent env rewriting APIs; only exclusion                                                              |
| Not a general credential freeze                 | Gate must be window-scoped, releasable, audited; not permanent                                                       |

### 7.3 Planning recommendation (pending PO)

**Recommend Alt F (global migration-window gate) + durable singleton lease** for the authorized FIV-CONN-04 backfill window:

- One exclusive backfill runner system-wide.
- While gate ON: deny frozen set for all workspaces.
- Window is short, operator-controlled, and released after 04-E (or controlled abort).

**Acceptable PO alternative:** Alt A (per-workspace gate) **if** the backfill runner processes one workspace at a time and never holds multiple workspace gates concurrently without a global single-runner lease. Alt A reduces blast radius but increases implementation complexity.

**Reject as sole design:** Alt D / E (too narrow). **Reject as sole design:** process-local mutex.

Open PO decision: **OD-B-01** (exact lock scope) — see §26.

---

## 8. Concurrency / Race Analysis

For each race: protected invariant, required ordering, lock/transaction boundary, expected outcome, fail-closed behavior.

### RACE-01 — Classify then credential revoke before UPDATE

| Field           | Specification                                                                    |
| --------------- | -------------------------------------------------------------------------------- |
| **Invariant**   | Never UPDATE LIVE against a revoked/dangling binding                             |
| **Ordering**    | Gate ON before any 04-D classify/write; revoke denied while ON                   |
| **Boundary**    | Deny at `revoke` entry; 04-D still rechecks eligibility under conditional UPDATE |
| **Outcome**     | Revoke request fails closed with explicit gate-denied error; row unchanged       |
| **Fail-closed** | If gate state uncertain → deny revoke; if UPDATE recheck fails → skip row (04-D) |

### RACE-02 — Classify LIVE then credential replace before UPDATE

| Field           | Specification                                                                       |
| --------------- | ----------------------------------------------------------------------------------- |
| **Invariant**   | Exact `vaultSecretId` binding unchanged for conditional UPDATE                      |
| **Ordering**    | Gate ON; replace denied                                                             |
| **Boundary**    | Deny at `replaceCredentials`; 04-D `vault_secret_id IS NOT DISTINCT FROM :expected` |
| **Outcome**     | Replace denied; if somehow changed, UPDATE no-ops / skip                            |
| **Fail-closed** | Uncertainty → deny mutation; stale classification never force-writes                |

### RACE-03 — Classify LIVE then Connection deleted

| Field           | Specification                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------ |
| **Invariant**   | No UPDATE against missing row                                                                    |
| **Ordering**    | N/A for delete API (none exists today)                                                           |
| **Boundary**    | If delete is later added, treat as open PO (**OD-B-03**); until then, document as non-applicable |
| **Outcome**     | Conditional UPDATE `rowCount=0` → skip (04-D)                                                    |
| **Fail-closed** | Missing row ≠ invent LIVE                                                                        |

### RACE-04 — Classify LIVE then another EXCHANGE create causes Strategy B collision

| Field           | Specification                                                            |
| --------------- | ------------------------------------------------------------------------ |
| **Invariant**   | Strategy B uniqueness authority; prevention only                         |
| **Ordering**    | Gate ON; EXCHANGE create denied                                          |
| **Boundary**    | Deny at `create` for EXCHANGE; DB unique index remains final authority   |
| **Outcome**     | Create denied; collision candidate never materializes during window      |
| **Fail-closed** | If unique violation observed anyway → skip/quarantine that UPDATE (04-D) |

### RACE-05 — Two backfill workers same workspace / system

| Field           | Specification                                             |
| --------------- | --------------------------------------------------------- |
| **Invariant**   | Single-runner backfill                                    |
| **Ordering**    | Exclusive durable lease acquire before gate ON / before D |
| **Boundary**    | Lease row CAS / fencing token; second acquire fails       |
| **Outcome**     | Second runner exits non-zero; no writes                   |
| **Fail-closed** | Lease contention → do not start D                         |

### RACE-06 — Two API instances attempt lifecycle mutation simultaneously

| Field           | Specification                                                       |
| --------------- | ------------------------------------------------------------------- |
| **Invariant**   | All instances observe same gate SoT                                 |
| **Ordering**    | Deny hooks read durable gate/lease state (not process memory alone) |
| **Boundary**    | Shared DB lease/flag; each request checks before mutation           |
| **Outcome**     | Both denied while ON; both allowed after release                    |
| **Fail-closed** | If gate state unreadable → deny conflicting mutations               |

### RACE-07 — Lock holder crashes

| Field           | Specification                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Invariant**   | No silent unlock that permits unsafe mutation mid-window without operator awareness                                              |
| **Ordering**    | TTL expiry required before another acquire; fencing token increments                                                             |
| **Boundary**    | Lease expires; new owner must re-acquire; must not continue crashed owner’s in-memory work                                       |
| **Outcome**     | Mutations remain denied until lease expired **and** new authorized runner acquires, **or** operator-controlled release procedure |
| **Fail-closed** | No automatic “force unlock” API for normal callers; stale owner token rejected                                                   |

### RACE-08 — DB commit succeeds; process crashes before releasing lock

| Field           | Specification                                                                    |
| --------------- | -------------------------------------------------------------------------------- |
| **Invariant**   | Committed 04-D UPDATEs remain; gate must not stick forever without recovery path |
| **Ordering**    | TTL/heartbeat; operator runbook for expired lease reclaim                        |
| **Boundary**    | Lease row durable independent of process memory                                  |
| **Outcome**     | Gate stays ON until TTL expiry or authorized release; rerun idempotent (04-D)    |
| **Fail-closed** | Do not interpret crash as permission to mutate credentials                       |

### RACE-09 — Lock acquisition times out

| Field           | Specification                                                                           |
| --------------- | --------------------------------------------------------------------------------------- |
| **Invariant**   | No backfill without exclusive lease                                                     |
| **Ordering**    | Acquire with timeout → failure                                                          |
| **Boundary**    | Acquire transaction only                                                                |
| **Outcome**     | Runner aborts; gate remains as prior state (OFF if never acquired; ON if held by other) |
| **Fail-closed** | Timeout ≠ acquire success                                                               |

### RACE-10 — Retry after partial operation

| Field           | Specification                                                                     |
| --------------- | --------------------------------------------------------------------------------- |
| **Invariant**   | Retries cannot bypass gate; partial 04-D progress is forward-fix                  |
| **Ordering**    | Retry must re-check gate/lease; re-acquire if needed with new fencing token rules |
| **Boundary**    | Idempotent deny checks; 04-D conditional UPDATE idempotent                        |
| **Outcome**     | Retry without lease → denied/abort; retry with lease → safe continuation          |
| **Fail-closed** | Cached “I used to hold the lease” is invalid without fencing proof                |

---

## 9. Operation Matrix

| Operation                                        | During Backfill (gate ON)                                                                        | Reason                                                                                   | Fail Mode                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Credential store                                 | **DENIED**                                                                                       | D-CONN-04-08; prevents new binding races                                                 | Explicit conflict/locked error; audit `gate_denied`                  |
| Credential replace                               | **DENIED**                                                                                       | Binding change races RACE-02                                                             | Same                                                                 |
| Credential revoke                                | **DENIED**                                                                                       | Revocation races RACE-01                                                                 | Same                                                                 |
| EXCHANGE create                                  | **DENIED**                                                                                       | Strategy B collision race RACE-04                                                        | Same                                                                 |
| EXCHANGE update (rename displayName)             | **ALLOWED** (recommended)                                                                        | Not in frozen deny set; no env/credential change                                         | N/A                                                                  |
| EXCHANGE disconnect/disable                      | **ALLOWED** (recommended; confirm OD-B-03)                                                       | Status-only; Strategy B excludes REVOKED but revoke path is denied — disconnect ≠ revoke | N/A                                                                  |
| EXCHANGE delete                                  | **N/A today** (no API)                                                                           | If added later → PO decision OD-B-03                                                     | Fail closed if uncertain                                             |
| Environment update (public API)                  | **DENIED by existing immutability**                                                              | D-CRED-02-09; 04-D exception is privileged runner only                                   | Existing reject                                                      |
| Privileged 04-D env UPDATE                       | **ALLOWED only to authorized runner holding lease**                                              | C-02 migration exception                                                                 | Without lease → refuse                                               |
| Notification / NON-EXCHANGE create               | **ALLOWED**                                                                                      | Outside D-CONN-04-08 deny set; reduces unnecessary freeze                                | N/A                                                                  |
| NON-EXCHANGE credential ops (if any share hooks) | **DENIED if using same store/replace/revoke hooks**                                              | Frozen deny names credential store/replace/revoke without EXCHANGE qualifier             | Same deny error                                                      |
| Read-only lookup                                 | **ALLOWED**                                                                                      | No mutation                                                                              | N/A                                                                  |
| Health / capability / validate read paths        | **ALLOWED**                                                                                      | Read/handshake; EXCHANGE NULL remains fail-closed under CONN-03                          | Existing fail-closed                                                 |
| Vault direct mutate (internal)                   | **MUST remain unused by CONN-04**; recommend defense-in-depth check if feasible without redesign | Bypass surface                                                                           | Prefer deny or hard invariant: CONN-04 code never calls Vault mutate |
| Background worker credential mutate              | **N/A today**; if added → must call gated service                                                | Bypass surface                                                                           | Fail closed                                                          |

**Note:** Frozen text denies “Connection credential store/replace/revoke” — repository implements these for Connections generally. Planning recommendation: deny at those service methods regardless of `connectionType`, to avoid EXCHANGE/NON-EXCHANGE bypass confusion. Confirm **OD-B-02**.

---

## 10. Failure Model

| Condition                              | Behavior                                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Lock unavailable / DB down             | Do **not** start 04-D; lifecycle mutations that require gate check: **deny** (fail closed) rather than allow |
| Lock timeout on acquire                | Abort runner; no gate ON transition claimed                                                                  |
| Lock already held                      | Second runner/mutation acquire fails; mutations remain denied for non-holders                                |
| Transaction failure on acquire/release | No partial “half-on” without durable row evidence; retry acquire explicitly                                  |
| Process crash while ON                 | Lease remains until TTL/authorized release; mutations stay denied                                            |
| Stale lock (TTL expired)               | Eligible for re-acquire by authorized runner only; fencing token increments; old token rejected              |
| Invalid lock owner / fencing mismatch  | Reject release/heartbeat/writes that require ownership                                                       |
| Workspace mismatch on mutation         | Existing auth/workspace checks fail first; gate check still applied in-workspace                             |
| Unauthorized caller                    | Existing ACL/`VaultConnections` permission remains; gate is additive, not a new auth framework               |
| Unsupported operation during window    | If not in allow matrix and not clearly safe → **deny**                                                       |
| Uncertainty of gate state              | Interpret as **deny** for conflicting lifecycle mutations; interpret as **do not start backfill** for runner |

```text
UNCERTAINTY ≠ PERMISSION TO PROCEED
```

---

## 11. Multi-Instance Model

### Forbidden as sole SoT

```text
- in-memory mutex
- process-local boolean
- Node.js singleton Map/flag
- “this instance started the job” without durable lease
```

### Required durable coordination

```text
Shared PostgreSQL lease row (recommended):
  gate_key = 'FIV-CONN-04' (singleton)
  holder_id
  fencing_token (monotonic)
  acquired_at / expires_at / heartbeat_at
  state = OFF | ON | RELEASING (as needed)
```

All API instances read the same row (or equivalent CAS) before allowing deny-set operations.

Optional supporting advisory lock may serialize acquire attempts but **does not replace** the durable row or application deny hooks (D-CRED-02-12).

Trading Session fenced lease is the closest in-repo analogue; 04-B should **adapt the pattern**, not overload Trading Session rows.

---

## 12. Transaction Boundary

### Principles

1. **Do not** put Vault network/I/O inside the lease acquire transaction.
2. Preserve separation: DB lease/gate state ↔ external Vault ops (Vault ops are denied during window for deny-set paths anyway).
3. 04-B itself performs **no** Vault calls and **no** `Connection.environment` writes.

### Proposed lifecycle (logical)

```text
1. BEGIN short txn
2. Attempt CAS acquire lease row (holder null/expired → set holder, bump fencing_token, set expires_at)
3. COMMIT
4. Record durable audit: gate_acquired (outside or after commit; must be durable)
5. Gate ON observed by all instances (deny hooks active)
6. [04-D owns] per-row: Vault metadata read (outside long txn) → short txn: recheck + conditional UPDATE + row audit
7. [04-E owns] residual inventory (read-only)
8. BEGIN short txn: release lease if fencing_token matches
9. COMMIT
10. Audit: gate_released
```

### What is protected

| Under lease/gate            | Not under lease txn                                   |
| --------------------------- | ----------------------------------------------------- |
| Exclusive runner identity   | Vault metadata reads (04-D; still only while gate ON) |
| Deny-set mutation exclusion | Long-running classification loops                     |
| Release authorization       | External I/O (forbidden in CONN-04 anyway)            |

### Audit timing

- Prefer audit **after** durable lease state change commits.
- If audit persistence fails after acquire: fail closed — do not proceed to 04-D until audit can be recorded or operator abort path is explicit (open detail **OD-B-06**).

---

## 13. Crash Safety

| Crash point                               | Behavior                                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Before acquire                            | No gate ON; system normal; safe                                                                          |
| After acquire, before deny hooks observed | Durable ON must be visible to all instances; if not, design defect — CAS row is SoT                      |
| During credential op (denied path)        | Request fails; no partial credential write from denied path                                              |
| During Connection create (denied)         | No row created                                                                                           |
| After DB commit of 04-D row (04-D)        | Forward-fix; lease still held until release/TTL                                                          |
| Before audit persistence                  | Fail closed for progression; operator-visible incomplete audit                                           |
| Process restart                           | In-memory state discarded; lease row remains; runner must re-prove fencing token / re-acquire per policy |

**No unsafe force-unlock** for ordinary API users. Operator recovery is a controlled runbook action with audit, not an unauthenticated escape hatch.

---

## 14. Audit Model

### 14.1 04-B audit boundary

04-B must plan durable evidence for gate lifecycle and blocked mutations. Per-row LIVE backfill audits remain **04-D**.

### 14.2 Candidate events

| Event intent                     | Why needed                                       | Reuse vs new                                                                   |
| -------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| Gate acquired                    | Prove window start + owner + fencing token       | Prefer new classified type **or** `connection.lifecycle` outcome — **OD-B-06** |
| Gate denied (acquire contention) | Prove single-runner enforcement                  | Same                                                                           |
| Gate released                    | Prove window end                                 | Same                                                                           |
| Gate heartbeat / expiry reclaim  | Crash recovery evidence                          | Same                                                                           |
| Blocked lifecycle mutation       | Prove D-CONN-04-08 enforcement under attack/race | Same                                                                           |
| Lock timeout                     | Fail-closed evidence                             | Same                                                                           |

### 14.3 If new catalog types are required

Document before implementation:

| Field                    | Requirement                                                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Why not reuse            | Existing `connection.lifecycle` outcomes today are replace/disconnect/disable/revoke-shaped; gate window may confuse attribution unless carefully extended |
| Event schema             | `eventType`, `outcome`, safe payload only                                                                                                                  |
| Actor                    | system job id / operator id                                                                                                                                |
| Workspace                | for blocked mutation events: target workspace; for global gate acquire: system scope + optional workspace if Alt A                                         |
| Correlation / request id | required when available                                                                                                                                    |
| Operation                | `store` / `replace` / `revoke` / `exchange_create` / `gate_acquire` / `gate_release`                                                                       |
| Timestamp                | required                                                                                                                                                   |
| Result                   | `acquired` / `denied` / `released` / `timeout` / `expired_reclaim`                                                                                         |
| Reason                   | stable reason code (no secrets)                                                                                                                            |

### 14.4 Forbidden in audit/logs

```text
API keys, tokens, ciphertext, decrypted credentials, raw Vault bodies
```

Reuse Security Audit sensitive-key rejection. Do not invent a parallel logger.

### 14.5 Initial store gap (context)

Today, initial `storeCredentials` does not emit `connection.lifecycle` (Vault emits `vault.lifecycle`). Gate-denied store must still produce **gate deny** audit evidence under 04-B.

---

## 15. API / Service Enforcement Boundary

### Evaluation

| Layer                                    | Alone sufficient?               | Role                                               |
| ---------------------------------------- | ------------------------------- | -------------------------------------------------- |
| Controller guard                         | No                              | Easy to bypass via internal service calls          |
| **Service layer (`ConnectionsService`)** | **Primary — YES for app paths** | Canonical mutation facade; covers REST             |
| Domain/application port                  | Optional wrapper                | Useful if extract gate port for testability        |
| Repository layer                         | No as sole                      | Too late / easy to miss business meaning           |
| DB constraint                            | Supporting only                 | Strategy B uniqueness; not a credential write gate |
| Combination                              | **Required**                    | Durable lease (DB) + service deny hooks            |

### Final design requirement

```text
PRIMARY ENFORCEMENT:
  ConnectionsService deny hooks reading durable gate/lease SoT

SUPPORTING:
  Durable lease row (multi-instance)
  Strategy B unique index (final collision authority for 04-D)

NOT INTRODUCED:
  New authorization framework
  Replacement of WorkspaceAccess / PermissionClass.VaultConnections
```

### Bypass analysis

| Path                                             | Risk                                      | Mitigation                                                                                                         |
| ------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| REST API                                         | Covered if service hooks present          | Service-layer deny                                                                                                 |
| Internal service call to `ConnectionsService`    | Covered                                   | Same hooks                                                                                                         |
| Direct `SecretVaultService.store/replace/revoke` | Residual                                  | CONN-04 forbids Vault mutation; add explicit invariant/tests; optional future guard out of scope unless PO expands |
| Worker / scheduled job                           | None today; future must use gated service | Document invariant                                                                                                 |
| Migration script / admin                         | Privileged                                | Must acquire lease; no ungated env backfill scripts                                                                |
| Direct Prisma access                             | Residual (ops/emergency)                  | Runbook + governance; not solvable purely in app                                                                   |

---

## 16. Relationship to FIV-CONN-04-A

```text
04-A = CLOSED
```

- 04-A provides read-only inventory/classification **input** for later controlled operation.
- 04-B must **not** modify 04-A code scope, re-open NB-A-01…NB-A-04, or expand preflight into a write gate.
- 04-B may **consume** the fact that preflight exists; it does not re-implement inventory.

---

## 17. Relationship to FIV-CONN-04-D

| Owner    | Owns                                                                                                          | Does not own                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **04-B** | Lifecycle mutation exclusion; concurrency protection; gate state; gate enforcement; gate audit                | LIVE classification; environment UPDATE; Vault mutation; credential create/replace/revoke execution; FIV |
| **04-D** | Vault-proven classifier result application; conditional env UPDATE; per-row durable audit; backfill execution | Gate mechanism design (uses 04-B); must refuse to run without gate ON / valid fencing token              |

```text
04-D PRECONDITION:
  durable lease held by runner AND gate ON visible
04-D POSTCONDITION (with 04-E):
  residual inventory done → release gate (04-B release API/path)
```

---

## 18. Proposed Implementation Architecture

### 18.1 Components (future implementation — not authorized now)

```text
connection-migration-write-gate.service.ts
  - acquire(ownerId, ttl)
  - heartbeat(ownerId, fencingToken)
  - release(ownerId, fencingToken)
  - isGateOn(): Promise<boolean>  // durable read
  - assertMutationsAllowed(): Promise<void> // throws if ON

Prisma model (recommended): ConnectionMigrationGateLease (singleton key)
  OR fixed-row table without overloading TradingSession

Wire deny checks at start of:
  ConnectionsService.storeCredentials
  ConnectionsService.replaceCredentials
  ConnectionsService.revoke
  ConnectionsService.create (EXCHANGE branch / all creates per OD-B-02)

Security audit emitter for gate + deny events
Tests: unit + concurrency fixtures
```

### 18.2 Acquire / deny / release semantics

```text
ACQUIRE:
  CAS lease where state=OFF OR (state=ON AND expires_at < now())
  set holder, fencing_token = last+1, expires_at = now()+ttl
  audit gate_acquired
  fail closed on contention/timeout

DENY (request path):
  if durable gate ON → throw GateActiveError (stable code)
  audit blocked_lifecycle_mutation (safe fields)
  do not call Vault

RELEASE:
  only if holder+fencing_token match
  set OFF; clear holder
  audit gate_released
  mismatch → reject (fail closed)
```

### 18.3 What 04-B explicitly does not build

```text
- LIVE classifier (04-C)
- environment backfill runner writes (04-D)
- residual verification (04-E)
- Vault purpose changes
- C7 / allowRealVenueIo changes
- public environment PATCH
```

---

## 19. Proposed Sub-Slices

### B-01 — Gate domain / contract

| Attribute        | Definition                                                            |
| ---------------- | --------------------------------------------------------------------- |
| **Objective**    | Define gate port, error codes, fencing token semantics, deny-set enum |
| **Likely files** | `connection-migration-write-gate.ts` (types/port), error mapping      |
| **Dependencies** | Frozen D-CONN-04-08; OD-B decisions                                   |
| **Invariants**   | Uncertainty fails closed; no secrets in errors                        |
| **Tests**        | Pure contract tests for state machine transitions                     |
| **Security**     | No auth redesign                                                      |
| **AC**           | Stable codes for acquire/deny/release/timeout                         |
| **Non-scope**    | Persistence implementation                                            |

### B-02 — Durable concurrency mechanism

| Attribute        | Definition                                                                        |
| ---------------- | --------------------------------------------------------------------------------- |
| **Objective**    | Implement durable lease SoT (migration if required)                               |
| **Likely files** | Prisma schema + migration (if approved); gate repository; `connections.module.ts` |
| **Dependencies** | B-01; OD-B-01/04/05                                                               |
| **Invariants**   | Multi-instance safe; fencing token monotonic; no process-local SoT                |
| **Tests**        | Dual-client acquire contention; fencing mismatch; TTL expiry                      |
| **Security**     | Workspace fields on deny audits; singleton key not forgeable into other domains   |
| **AC**           | AC-B01, AC-B06, AC-B07, AC-B08, AC-B09                                            |
| **Non-scope**    | Trading Session changes; advisory-only designs                                    |

### B-03 — Lifecycle enforcement

| Attribute        | Definition                                                              |
| ---------------- | ----------------------------------------------------------------------- |
| **Objective**    | Wire deny hooks into ConnectionsService deny-set methods                |
| **Likely files** | `connections.service.ts`, controller error mapping if needed, specs     |
| **Dependencies** | B-02                                                                    |
| **Invariants**   | REST + internal service paths denied; retries don’t bypass              |
| **Tests**        | Each deny path; allow rename/NON-EXCHANGE create; negative bypass tests |
| **Security**     | No alternate unauthenticated unlock                                     |
| **AC**           | AC-B02, AC-B03, AC-B04, AC-B05, AC-B10, AC-B11                          |
| **Non-scope**    | Changing credential business logic beyond gate check                    |

### B-04 — Backfill integration boundary

| Attribute        | Definition                                                                          |
| ---------------- | ----------------------------------------------------------------------------------- |
| **Objective**    | Expose acquire/heartbeat/release API for future 04-D runner; refuse D without lease |
| **Likely files** | Gate service methods; runner port stub/docs; integration test doubles               |
| **Dependencies** | B-02/B-03                                                                           |
| **Invariants**   | 04-D cannot start without fencing proof                                             |
| **Tests**        | “D refused when gate OFF”; “second runner refused”                                  |
| **Security**     | Runner identity audited                                                             |
| **AC**           | AC-B01, AC-B14                                                                      |
| **Non-scope**    | Actual 04-D UPDATE implementation                                                   |

### B-05 — Security / audit regression tests

| Attribute        | Definition                                                                      |
| ---------------- | ------------------------------------------------------------------------------- |
| **Objective**    | Durable audit for gate + denials; no secret leakage                             |
| **Likely files** | audit helper; `security-audit-classification.ts` (if new types approved); specs |
| **Dependencies** | OD-B-06; B-02/B-03                                                              |
| **Invariants**   | Catalog registration; sensitive-key rejection                                   |
| **Tests**        | Audit payload allowlist; deny audit on store/replace/revoke/create              |
| **Security**     | AC-B12, AC-B13                                                                  |
| **Non-scope**    | 04-D per-row backfill audit types (may share catalog PR later carefully)        |

### B-06 — Crash / concurrency verification

| Attribute        | Definition                                                                          |
| ---------------- | ----------------------------------------------------------------------------------- |
| **Objective**    | Prove multi-instance + crash/TTL/retry semantics                                    |
| **Likely files** | concurrency specs; optional testcontainers/integration harness already used in repo |
| **Dependencies** | B-02…B-05                                                                           |
| **Invariants**   | RACE-05…RACE-10 covered                                                             |
| **Tests**        | See §20                                                                             |
| **Security**     | Stale fencing token cannot release or authorize D                                   |
| **AC**           | AC-B06…AC-B10                                                                       |
| **Non-scope**    | Production chaos on live capital systems                                            |

---

## 20. Test Strategy

| #    | Scenario                                                                       | Expected                                        |
| ---- | ------------------------------------------------------------------------------ | ----------------------------------------------- |
| T-01 | Single-instance concurrent store while ON                                      | Denied                                          |
| T-02 | Multi-instance: instance A holds lease; instance B store/replace/revoke/create | Denied                                          |
| T-03 | Simultaneous replace + revoke while ON                                         | Both denied                                     |
| T-04 | Simultaneous EXCHANGE create while ON                                          | Denied                                          |
| T-05 | Simultaneous environment public update                                         | Remains rejected by immutability                |
| T-06 | Lock acquisition failure / contention                                          | Second acquire fails; no D                      |
| T-07 | Lock acquire timeout                                                           | Fail closed; no ON claim                        |
| T-08 | Stale/crashed holder TTL expiry                                                | Re-acquire only after expiry; fencing bumps     |
| T-09 | Retry without fencing proof                                                    | Denied / abort                                  |
| T-10 | Workspace isolation on deny audits                                             | Payload workspace matches target                |
| T-11 | Provider/environment isolation preserved                                       | Gate does not rewrite env; Strategy B untouched |
| T-12 | NON-EXCHANGE create allowed (if OD confirms)                                   | Success while ON                                |
| T-13 | Read-only lookup / validate                                                    | Allowed; NULL EXCHANGE still fail-closed        |
| T-14 | Bypass attempt via calling service methods directly                            | Still denied                                    |
| T-15 | Bypass attempt via process-local flag only (negative architecture test)        | Documented insufficient; durable SoT required   |
| T-16 | Release with wrong fencing token                                               | Rejected                                        |
| T-17 | Gate OFF restores deny-set APIs                                                | Success paths work again                        |
| T-18 | Audit contains no secrets                                                      | Pass sensitive-key checks                       |
| T-19 | 04-B modules perform zero Vault mutate / zero env UPDATE                       | Static/unit guarantees                          |
| T-20 | Unauthorized caller still denied by ACL even if gate OFF                       | Existing auth preserved                         |

---

## 21. Migration Analysis

### Recommendation

| Question                  | Answer                                                                      |
| ------------------------- | --------------------------------------------------------------------------- |
| Schema change required?   | **LIKELY YES** — durable singleton lease row/table                          |
| Advisory-lock-only?       | **NO** — insufficient per D-CRED-02-12                                      |
| Existing table row reuse? | **NO** — do not overload `TradingSession`                                   |
| No schema change option?  | Only if an existing durable general lease registry appears — **none found** |

### If migration is required (plan only — do not create now)

| Topic              | Draft design                                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**        | Multi-instance exclusive FIV-CONN-04 write gate lease                                                                                           |
| **Fields (draft)** | `gateKey` (PK, e.g. `FIV-CONN-04`), `state`, `holderId`, `fencingToken`, `acquiredAt`, `expiresAt`, `heartbeatAt`, `correlationId`, `updatedAt` |
| **Indexes**        | PK on `gateKey`; optional index on `expiresAt`                                                                                                  |
| **Uniqueness**     | Exactly one row per gate key                                                                                                                    |
| **Lifecycle**      | Insert seed row OFF at migration; acquire/release updates; TTL reclaim                                                                          |
| **Rollback**       | Forward-fix preferred; dropping table only if gate never enabled in prod; do not use rollback to “unlock” mid-backfill casually                 |
| **Crash recovery** | TTL + fencing; operator runbook                                                                                                                 |

Open PO confirmation: **OD-B-04** (approve schema/migration approach).

---

## 22. Security Analysis

### Preserved requirements

| Requirement                   | 04-B handling                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------- |
| Workspace isolation           | Deny audits + mutation paths remain workspace-scoped via existing `getRow` / ACL |
| Exact `vaultSecretId` binding | Protected by denying replace/revoke during window                                |
| Vault purpose isolation       | No Vault mutation in 04-B                                                        |
| LIVE/TESTNET separation       | No env rewrite in 04-B                                                           |
| No cross-workspace fallback   | Gate must not grant cross-workspace powers                                       |
| No provider-only lookup       | Not introduced                                                                   |
| No credential substitution    | Deny replace during window                                                       |
| No secret leakage             | Audit allowlist                                                                  |
| No privilege escalation       | Gate ≠ C7/FIV/capital                                                            |
| No bypass via REST            | Service hooks                                                                    |
| No bypass via workers         | None today; invariant documented                                                 |
| No bypass via direct service  | Same hooks                                                                       |
| No bypass via retries         | Fencing token + durable ON                                                       |

### Conditions carried forward

```text
C-01 implemented by 04-B (this plan)
SC-09 concurrency safety → code delivery in 04-B
D-CRED-02-12 application write gate primary control
```

---

## 23. Acceptance Criteria

| ID         | Criterion                                                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AC-B01** | Authorized backfill runner can acquire the required gate/lease                                                                                                          |
| **AC-B02** | Concurrent conflicting lifecycle mutations (store/replace/revoke + EXCHANGE create) are blocked while ON                                                                |
| **AC-B03** | Unrelated workspaces are not blocked **beyond** the approved lock scope (global window may intentionally block all; if Alt A chosen, other workspaces remain unblocked) |
| **AC-B04** | Unrelated NON-EXCHANGE operations are not unnecessarily blocked (per approved operation matrix)                                                                         |
| **AC-B05** | Provider/environment isolation preserved; gate does not rewrite environment or purposes                                                                                 |
| **AC-B06** | Lock state is durable across API instances                                                                                                                              |
| **AC-B07** | Process-local mutex alone is insufficient and is not the SoT                                                                                                            |
| **AC-B08** | Lock acquisition failure fails closed (no D start)                                                                                                                      |
| **AC-B09** | Stale/crashed holder cannot silently permit unsafe mutation; fencing/TTL enforced                                                                                       |
| **AC-B10** | Retries cannot bypass the gate                                                                                                                                          |
| **AC-B11** | Alternate service/API paths through `ConnectionsService` cannot bypass the gate                                                                                         |
| **AC-B12** | Security audit evidence for gate lifecycle and denials is durable                                                                                                       |
| **AC-B13** | No secrets appear in audit/logs                                                                                                                                         |
| **AC-B14** | 04-B does not perform LIVE backfill / `environment` UPDATE                                                                                                              |
| **AC-B15** | 04-B does not mutate Vault                                                                                                                                              |
| **AC-B16** | 04-B does not perform external venue I/O                                                                                                                                |
| **AC-B17** | 04-B does not enable C7                                                                                                                                                 |
| **AC-B18** | 04-B does not authorize FIV                                                                                                                                             |
| **AC-B19** | Gate release restores normal deny-set APIs                                                                                                                              |
| **AC-B20** | Wrong fencing token cannot release or continue runner authority                                                                                                         |
| **AC-B21** | Advisory lock alone is not accepted as the implementation                                                                                                               |
| **AC-B22** | `allowRealVenueIo` remains false                                                                                                                                        |
| **AC-B23** | No new public environment mutation API is introduced                                                                                                                    |
| **AC-B24** | Existing canonical auth model preserved (no new auth framework)                                                                                                         |

**Acceptance criteria count: 24**

---

## 24. Non-Scope

```text
- FIV-CONN-04-C classifier delivery
- FIV-CONN-04-D environment UPDATE / per-row backfill audits
- FIV-CONN-04-E residual verification execution
- LIVE backfill itself
- Vault secret create/replace/revoke/delete
- Credential business-logic redesign
- NOT NULL migration
- Strategy B cleanup/duplicate merge
- TESTNET/DEMO population
- C7 enablement
- allowRealVenueIo=true
- Binance/Testnet/Bybit/OKX I/O
- FIV / FIV-PRE-01 closure
- Live capital activation
- Permanent global credential freeze beyond migration window
- Force-unlock escape hatches for normal users
- Rewriting 04-A preflight
- Trading Session lease redesign
```

---

## 25. Risks

| ID    | Risk                                                 | Severity | Mitigation                                              |
| ----- | ---------------------------------------------------- | -------- | ------------------------------------------------------- |
| R-B01 | Implementing process-local gate only                 | High     | AC-B07; durable lease mandatory                         |
| R-B02 | Scope too narrow (per-Connection)                    | High     | Reject Alt D; OD-B-01                                   |
| R-B03 | Scope too wide / permanent freeze                    | Medium   | Window + release AC-B19; OD-B-05 TTL                    |
| R-B04 | Direct Vault bypass                                  | Medium   | Tests + CONN-04 forbids Vault mutate; document residual |
| R-B05 | Stale lock blocks production indefinitely            | Medium   | TTL + operator runbook; OD-B-05                         |
| R-B06 | Audit catalog ambiguity                              | Low/Med  | OD-B-06 before impl                                     |
| R-B07 | Starting 04-D without 04-B closure                   | High     | Governance ladder; D precondition                       |
| R-B08 | Combining 04-B with 04-D in one change               | Medium   | Explicit slice separation                               |
| R-B09 | Prettier/hook noise from protected leftovers at sync | Low      | Commit only planning artifact; known exception policy   |

---

## 26. Open PO Decisions

| ID          | Decision needed                                    | Options                                                                     | Planning recommendation                                                  | Why PO must decide                                                               |
| ----------- | -------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **OD-B-01** | Exact lock scope                                   | F global window vs A workspace-scoped                                       | **F global** for single-runner simplicity                                | Blast radius vs complexity is product/ops judgment                               |
| **OD-B-02** | Deny credential ops for NON-EXCHANGE too?          | Deny all store/replace/revoke vs EXCHANGE-only                              | **Deny all** at those methods                                            | Frozen text names credential ops; EXCHANGE-only filtering adds bypass complexity |
| **OD-B-03** | Include EXCHANGE delete/update/disconnect/disable? | Delete N/A; rename allow; disconnect/disable allow or deny                  | **Allow rename/disconnect/disable**; delete N/A until API exists         | Not in D-CONN-04-08 deny set; confirm no hidden race PO cares about              |
| **OD-B-04** | Lock storage medium / migration                    | New lease table vs other                                                    | **New singleton lease table + migration**                                | Schema change needs explicit approval before impl                                |
| **OD-B-05** | TTL / stale lock / contention policy               | TTL values; heartbeat; operator reclaim                                     | TTL + fencing; no user force-unlock; operator runbook reclaim with audit | Ops safety vs availability trade-off                                             |
| **OD-B-06** | Audit event types                                  | Extend `connection.lifecycle` vs new `connection.migration-gate` (name TBD) | Prefer **dedicated classified type** for gate lifecycle clarity          | Catalog / attribution governance                                                 |
| **OD-B-07** | Allowed operations during backfill                 | Confirm §9 matrix                                                           | Adopt §9 as default                                                      | Product impact during window                                                     |
| **OD-B-08** | Behavior on lock contention for interactive API    | Always 409/423-style deny vs queue                                          | **Immediate fail-closed deny**                                           | Matches fail-closed doctrine                                                     |

If PO adopts all recommendations above without change, still record explicit acceptance of OD-B-01…08 so implementation does not silently decide governance matters.

---

## 27. Planning Recommendation

```text
RECOMMEND:
  1. Accept this FIV-CONN-04-B Planning Package for PO/Governance review.
  2. Resolve OD-B-01…OD-B-08 explicitly.
  3. Proceed next to FIV-CONN-04-B PO Review / Implementation Authorization
     ONLY after OD decisions are frozen or explicitly accepted.
  4. Implement 04-B alone (B-01…B-06); do not combine with 04-C/D/E.

DO NOT:
  - Implement from this artifact alone
  - Create migrations yet
  - Enable gate in production yet
  - Start LIVE backfill
  - Authorize FIV / C7 / venue I/O / capital
```

**Proposed lock architecture summary:** durable singleton DB lease (fencing token + TTL) + `ConnectionsService` deny hooks for D-CONN-04-08 set + Security Audit; advisory lock optional supporting only.

**Proposed lock scope summary:** global authorized migration window (OD-B-01 recommendation F), not permanent freeze, not per-Connection.

---

## 28. Implementation Gate Statement

```text
FIV-CONN-04-B IMPLEMENTATION = NOT AUTHORIZED BY THIS ARTIFACT

This planning package does not grant:
  - Implementation Authorization
  - Schema/migration creation rights
  - Runtime gate enablement in production
  - FIV-CONN-04-D backfill rights
  - FIV / C7 / allowRealVenueIo / capital rights

Required before implementation:
  PO/Governance review of this package
  Explicit disposition of OD-B-01…OD-B-08
  Per-slice Implementation Authorization under parent FIV-CONN-04 Slice Approval
```

---

## Safety State (this planning act)

```text
Database writes:        ZERO (planning artifact only)
Schema/migrations:      NOT CREATED
Vault mutations:        ZERO
Credential mutations:   ZERO
External I/O:           ZERO
Binance/Testnet I/O:    ZERO
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
FIV-CONN-04-B = PLANNING ONLY
FIV-CONN-04-B IMPLEMENTATION = NOT AUTHORIZED
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
LIVE CAPITAL = NOT ACTIVATED
```

**END OF FIV-CONN-04-B PLANNING PACKAGE**
