# FIV-CONN-04-D Planning Package — Conditional Environment UPDATE + Durable Audit

**Document:** FIV-CONN-04-D Conditional Environment UPDATE + Durable Audit — Planning Discovery / Package  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-D — Conditional environment UPDATE + durable audit  
**Parent:** FIV-CONN-04 — LIVE environment backfill / residual migration state  
**Authority:** Engineering / Architecture planning support under Wave 6 PO + Chief Architect governance  
**Nature:** **PLANNING DISCOVERY / PACKAGE ONLY.** Does **not** grant Slice Approval. Does **not** grant Implementation Authorization. Does **not** freeze new PO/Architecture/Security decisions. Does **not** implement D. Does **not** modify application source, tests, Prisma/schema, Vault, API contracts, A/B/C implementations, or residual statuses.

**Evidence labels used throughout:**

| Label                              | Meaning                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| **FACT / REPOSITORY EVIDENCE**     | Observed in repo / HEAD at discovery                                             |
| **INHERITED / FROZEN REQUIREMENT** | Binding from parent Decision Freeze / Slice Plan / C Decision Freeze / B freezes |
| **PROPOSED PLANNING ITEM**         | Planning recommendation; not ratified                                            |
| **OPEN QUESTION**                  | Requires later Decision Freeze / Implementation Planning                         |
| **RISK**                           | Planning risk; not automatically a blocker                                       |
| **ACCEPTED RESIDUAL**              | Existing residual; status preserved                                              |

```text
DOCUMENT STATUS = PLANNING DISCOVERY / PACKAGE
NOT IMPLEMENTATION AUTHORIZATION

FIV-CONN-04-A = CLOSED (source sync 32388f4…)
FIV-CONN-04-B = FORMALLY CLOSED (B-01…B-06)
FIV-CONN-04-C = FORMALLY CLOSED (closure e4c4e9a…)
FIV-CONN-04-D = PLANNING ONLY (this artifact)
FIV-CONN-04-E = NOT STARTED
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED

D IMPLEMENTATION = NOT STARTED
D IMPLEMENTATION AUTHORIZATION = NOT GRANTED

FIV / C7 / LIVE CAPITAL / LIVE TRADING / VENUE I/O = NOT AUTHORIZED
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Document Status

```text
PLANNING DISCOVERY / PACKAGE = CREATED
PLANNING STATUS = READY FOR FIV-CONN-04-D PLANNING REVIEW

This artifact:
  - discovers D purpose/scope from repository governance + code reality
  - packages planning inputs for Planning Review
  - does NOT authorize implementation
  - does NOT create Slice Approval
  - does NOT create Implementation Planning / Authorization
  - does NOT start D execution
```

**Next governance gate (identify only):** `FIV-CONN-04-D PLANNING REVIEW`

---

## 2. Baseline

| Field                                     | Value                                           | Evidence class                                                 |
| ----------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| Current `HEAD`                            | `e4c4e9a183c016ac23eb0d0685341438e860f46e`      | **FACT**                                                       |
| `origin/main` (verified task baseline)    | `e4c4e9a183c016ac23eb0d0685341438e860f46e`      | **FACT** (task-asserted; matches local HEAD)                   |
| C formal closure commit                   | `e4c4e9a183c016ac23eb0d0685341438e860f46e`      | **FACT**                                                       |
| A synchronization commit                  | `32388f4ed73ae95320584c650d364af633d67776`      | **FACT**                                                       |
| C synchronization commit                  | `ee252be04460729f4545a23f407c4c82f7330616`      | **FACT**                                                       |
| C tests (closure evidence)                | 26/26 PASS                                      | **FACT** (recorded in C closure; not re-executed in this task) |
| A classification tests (closure evidence) | 24/24 PASS                                      | **FACT** (recorded; not re-executed here)                      |
| A preflight (closure evidence)            | 2/2 PASS                                        | **FACT** (recorded; not re-executed here)                      |
| B regression (closure evidence)           | 87/87 PASS                                      | **FACT** (recorded; not re-executed here)                      |
| typecheck / security (closure evidence)   | PASS                                            | **FACT** (recorded; not re-executed here)                      |
| C→D boundary                              | PRESERVED                                       | **INHERITED** (C closure §8)                                   |
| Residuals                                 | C-B06-02 OPEN/OPTIONAL; D-B03-04/06/08 ACCEPTED | **ACCEPTED RESIDUAL** / preserved                              |

### Master Plan / Roadmap note

| Artifact                                          | Finding                                                                | Evidence class |
| ------------------------------------------------- | ---------------------------------------------------------------------- | -------------- |
| `docs/project/version-3/version-3-master-plan.md` | No direct `FIV-CONN-04` / `CONN-04` string hit at discovery            | **FACT**       |
| `docs/project/version-3/v3-execution-roadmap.md`  | V3-L02 = Live order I/O on canonical path; no CONN-04 sub-slice detail | **FACT**       |

Authoritative CONN-04 sub-slice identity for D is therefore Wave-6 FIV-CONN-04 governance (Slice Planning Package + Decision Freeze + C closure handoff), not the master plan text.

### Sub-slice identity precedence (critical)

| Source                                                                  | Historical label for “C” / “D”                                                                                   | Status for this package                                                        |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Parent Planning Package (`v3-l02-fiv-conn-04-planning-package.md`)      | C = “Controlled LIVE backfill”; D = “Post-backfill verification”                                                 | **SUPERSEDED** for sub-slice identity (explicitly noted in C Planning Package) |
| Slice Planning Package (`v3-l02-fiv-conn-04-slice-planning-package.md`) | C = Vault-proven LIVE classifier; **D = Conditional environment UPDATE + durable audit**; E = residual inventory | **AUTHORITATIVE**                                                              |
| PO Slice Review / Slice Approval                                        | Same A→B→C→D→E as Slice Plan                                                                                     | **INHERITED**                                                                  |
| C Formal Closure                                                        | Next gate = D Planning Discovery / Package                                                                       | **INHERITED**                                                                  |

```text
FROZEN SEQUENCE (UNCHANGED):
  A → B → C → D → E
```

---

## 3. D Purpose

**INHERITED / FROZEN REQUIREMENT** (Slice Planning §7.4; PO Slice Review §5.4; PO Governance Slice Approval):

> Apply `NULL → live` **only** for Vault-proven eligible EXCHANGE rows under an active FIV-CONN-04 write gate / lease, and emit durable Security Audit (D-CONN-04-09) for updated and blocked outcomes.

D is the **write / audit execution** slice of FIV-CONN-04. It is **not** the classifier (C), **not** the write-gate (B), **not** preflight inventory (A), and **not** post-backfill residual verification / gate release (E).

```text
D PURPOSE (BINDING IDENTITY):
  Conditional Connection.environment UPDATE (NULL → 'live')
  + durable Security Audit
  under B gate/fencing authority
  using C (re-verified) LIVE eligibility
  after fresh A/preflight evidence as required by parent plan
```

---

## 4. D Scope

**INHERITED / FROZEN** in-scope responsibilities (from Slice Planning §5 / §7.4 / §10 / §13):

1. Privileged migration-window runner that consumes B-04 integration boundary (`Conn04MigrationBoundaryService` or equivalent composition).
2. Independent re-verification before each write (Connection row, Vault metadata-only, Strategy B occupancy, gate/CAS).
3. Conditional `Connection.environment` UPDATE: `NULL → 'live'` only when predicates still hold.
4. Durable Security Audit events + run counters for updated / blocked / skipped outcomes (D-CONN-04-09 = B).
5. Batch continue-on-skip/block semantics (D-CONN-04-03/05).
6. Idempotent rerun safety (`environment IS NULL` predicate; no populated-env rewrite).
7. Focused offline tests for predicates, races, audit shapes, gate refuse-without-proof (new D tests; preserve A/B/C regressions).

**PROPOSED PLANNING ITEM** (surface identification only — not authorization):

- Likely new module(s)/script(s) under `apps/api/src/modules/connections/` and optionally `apps/api/scripts/`.
- Likely Security Audit catalog registration for backfill outcomes (NB-01 choice still open).
- Likely Nest/DI wiring of a privileged runner that is **not** a public ConnectionsController env PATCH.

---

## 5. D Non-Scope

**INHERITED / FROZEN** — D is **not** responsible for:

| Non-scope                                                        | Owner / note                                                |
| ---------------------------------------------------------------- | ----------------------------------------------------------- |
| Vault-proven LIVE classification SoT                             | **C** (thin facade over A); D re-invokes, does not redesign |
| Write-gate lease / deny-set / fencing SoT                        | **B** (B-01…B-06 closed); D consumes                        |
| Read-only target preflight inventory design                      | **A**; D requires fresh evidence, does not replace A        |
| Post-backfill residual inventory + gate release                  | **E**                                                       |
| NOT NULL enforcement                                             | Forbidden (D-CONN-04-07 = A)                                |
| Strategy B index redesign / cleanup / merge / delete             | Forbidden (D-CONN-04-05 = A)                                |
| Vault secret mutation / purpose change / `vaultSecretId` replace | Forbidden (D-CRED-02-04/05; Slice §7.4)                     |
| TESTNET / DEMO population                                        | Out of CONN-04                                              |
| NON-EXCHANGE LIVE classification                                 | Out of scope                                                |
| Public environment mutation API                                  | Forbidden (C-02 exception is migration-window only)         |
| Model C / CONN-03 use-path waiver for residual NULL              | Forbidden                                                   |
| FIV / C7 / `allowRealVenueIo` / venue I/O / live capital         | Not authorized                                              |
| Closing FIV-CONN-04 parent / FIV-PRE-01                          | Not authorized                                              |
| Remediating ACCEPTED residuals D-B03-04/06/08                    | **PRESERVED** — not D’s silent duty                         |
| Closing C-B06-02                                                 | **PRESERVED OPEN/OPTIONAL**                                 |
| Reopening C / changing A→B→C→D→E                                 | Forbidden                                                   |

```text
D IS NOT:
  classifier redesign, gate redesign, preflight redesign,
  residual verification/gate release (E),
  Vault mutator, public env API, FIV/C7 enabler,
  residual closer, C reopener
```

---

## 6. Frozen Sequence Context

**INHERITED / FROZEN** dependency order (Slice Planning §7):

```text
FIV-CONN-04-A (CLOSED)  — preflight inventory / fresh target scan obligation for D window
        │
        ▼
FIV-CONN-04-B (CLOSED)  — write gate / lease / fencing / B-04 refuse-without-proof boundary
        │
        ▼
FIV-CONN-04-C (CLOSED)  — Vault-proven LIVE classifier (read-only dispositions)
        │
        ▼
FIV-CONN-04-D (THIS)    — conditional NULL→live UPDATE + durable audit   ← PLANNING ONLY
        │
        ▼
FIV-CONN-04-E (FUTURE)  — residual inventory + verification + gate release
```

Notes:

- C may have been unit-developed after A without B runtime; **D requires B+C**.
- C closure explicitly does **not** authorize D.
- D completion does **not** close parent FIV-CONN-04 without E + parent gates.

---

## 7. D-CONN-04 Requirements

Authoritative freeze: [`v3-l02-fiv-conn-04-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-po-governance-decision-freeze.md).  
C Decision Freeze: **UNCHANGED / NOT REOPENED**.

| ID                   | Frozen choice                       | D implication                                                                         | Class                                     |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------- |
| **D-CONN-04-01 = A** | Vault-proven LIVE only              | UPDATE only when exact `vaultSecretId` → Trading / TradingLive (+ IPR-C-01 Connected) | **INHERITED**                             |
| **D-CONN-04-02 = A** | Ambiguous remain NULL + fail closed | Never force LIVE on metadata-only / insufficient evidence                             | **INHERITED**                             |
| **D-CONN-04-03 = A** | Skip/audit mismatch; continue       | Batch continues after skip/block                                                      | **INHERITED**                             |
| **D-CONN-04-04 = A** | Skip defective; never auto-LIVE     | Missing/dangling/revoked/invalid/ws-mismatch skipped                                  | **INHERITED**                             |
| **D-CONN-04-05 = A** | Strategy B prevention only          | Collision → skip/report; no cleanup                                                   | **INHERITED**                             |
| **D-CONN-04-06 = C** | Residual NULL OK fail-closed        | D may leave residual NULL; NULL ≠ LIVE                                                | **INHERITED**                             |
| **D-CONN-04-07 = A** | Keep nullable                       | D must not introduce NOT NULL                                                         | **INHERITED**                             |
| **D-CONN-04-08 = B** | Write-gate deny set                 | D window requires gate ON; D does not implement deny-set                              | **INHERITED** (owned by B; consumed by D) |
| **D-CONN-04-09 = B** | Durable Security Audit              | **Owned by D** for updated/blocked backfill outcomes                                  | **INHERITED**                             |
| **D-CONN-04-10 = B** | PRE-01 residual policy              | D does not close PRE-01 / authorize FIV                                               | **INHERITED**                             |

### Related parent freezes (binding for D design)

| Decision                     | Role                                                                                   | Class                            |
| ---------------------------- | -------------------------------------------------------------------------------------- | -------------------------------- |
| **D-CRED-02-04**             | Unambiguous LIVE backfill; zero Vault mutation; pre-audit                              | **INHERITED**                    |
| **D-CRED-02-09**             | Environment immutable after create — D is the **only** migration-time exception (C-02) | **INHERITED**                    |
| **D-CRED-02-12**             | Write serialization during migration critical section                                  | **INHERITED** (via B)            |
| **D-CONN-03-03**             | EXCHANGE + NULL → FAIL CLOSED on use; NULL ≠ LIVE                                      | **INHERITED**                    |
| **IPR-C-01**                 | `SecretState.Connected` required for `ELIGIBLE_LIVE`                                   | **INHERITED** (C-RATIFIED)       |
| **IPR-C-02**                 | AC provenance rules                                                                    | **INHERITED**                    |
| **ARCH-B04 / COND-ARCH-B04** | Refuse start without lease+fence; same-txn CAS for privileged writes                   | **INHERITED**                    |
| **COND-SEC-B05 / B10**       | Runner must hold lease+fence; UNKNOWN ⇒ refuse D start                                 | **INHERITED**                    |
| **C-02**                     | Migration-time env exception bounded (not public API / not Model C/C7/FIV bypass)      | **INHERITED**                    |
| **C-04**                     | Durable audit for updated/blocked rows                                                 | **INHERITED** (D-owned delivery) |

### Slice Acceptance Criteria owned by D (Slice Planning §23)

| ID          | Criterion                                     | Class                                                             |
| ----------- | --------------------------------------------- | ----------------------------------------------------------------- |
| **AC-D-01** | Conditional UPDATE predicates enforced        | **INHERITED** (SLICE-APPROVED-AC via parent Slice Approval chain) |
| **AC-D-02** | `vaultSecretId` unchanged for all rows        | **INHERITED**                                                     |
| **AC-D-03** | No rewrite of populated env                   | **INHERITED**                                                     |
| **AC-D-04** | Durable audit for updated and blocked rows    | **INHERITED**                                                     |
| **AC-D-05** | Batch continues after skip/block              | **INHERITED**                                                     |
| **AC-D-06** | Zero Vault mutations                          | **INHERITED**                                                     |
| **AC-D-07** | Migration exception not exposed as public API | **INHERITED**                                                     |

---

## 8. Inputs / Outputs / State Transitions

### Inputs (binding design intent)

| Input                                                              | Source                                                                 | Class                                   |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| Fresh A/preflight evidence on target env                           | A (+ operator gate)                                                    | **INHERITED**                           |
| Active B grant + fencing proof                                     | B-04 `start`/`resume` + `assertWriteAuthority`                         | **INHERITED** / **FACT** (code present) |
| Connection rows (`EXCHANGE`, `environment IS NULL`, credentialed)  | Prisma `ConnectionRecord`                                              | **FACT**                                |
| Vault metadata (exact id; purpose/state/workspace; **no payload**) | Secret Vault metadata ports                                            | **FACT** / **INHERITED**                |
| Strategy B live-slot occupancy                                     | Typed occupancy (`verified_vacant` / `occupied` / `unavailable`)       | **INHERITED** (IMPL-REV-C-01)           |
| C classification disposition                                       | `classifyFivConn04LiveConnection` (or equivalent re-invoke of A via C) | **FACT** / **INHERITED**                |

### Outputs

| Output                                                   | Class                           |
| -------------------------------------------------------- | ------------------------------- |
| Committed `environment = 'live'` for still-eligible rows | **INHERITED**                   |
| Durable audit events + run counters                      | **INHERITED** (D-CONN-04-09)    |
| Per-row skip/block outcomes (no write)                   | **INHERITED**                   |
| Partial-batch completion allowed                         | **INHERITED** (D-CONN-04-03/05) |

### Authorized state transition

```text
ConnectionRecord.environment:  NULL  ──(D, gated, Vault-proven)──►  'live'

FORBIDDEN transitions under D:
  live|testnet → anything
  NULL → 'testnet' | 'demo'
  any Vault/credential field mutation
```

### Authorized SQL shape (Slice Planning §10) — **INHERITED**

```sql
UPDATE connection_records
SET environment = 'live'
WHERE id = :connectionId
  AND workspace_id = :workspaceId
  AND connection_type = 'EXCHANGE'
  AND environment IS NULL
  AND vault_secret_id IS NOT DISTINCT FROM :expectedVaultSecretId;
```

`rowCount = 0` → `SKIPPED_NO_LONGER_ELIGIBLE` (do not force-write).

### Mandatory pre-UPDATE recheck (Slice Planning §10; C Decision Freeze §6) — **INHERITED**

1. Re-read Connection (prefer `FOR UPDATE`)
2. Confirm still NULL + EXCHANGE + same `vaultSecretId`
3. Re-fetch Vault purpose metadata (metadata only)
4. Confirm LIVE-class purpose + Connected state semantics
5. Recheck Strategy B occupancy
6. Require B gate / same-txn fencing CAS
7. UPDATE only if predicates hold
8. Emit durable audit
9. Never rewrite populated env
10. Continue batch on skip/block

**Stale C dispositions alone are never sufficient.**

---

## 9. C→D Boundary

**INHERITED** from C Formal Closure §8 and C Decision Freeze §6:

```text
C→D BOUNDARY = PRESERVED

C PROVIDES:
  deterministic classification / disposition evidence only
  (thin facade over A; pure/read-only)

C DOES NOT:
  execute D
  perform UPDATE / backfill
  write Connection.environment
  mutate Vault
  authorize live capital / venue I/O / FIV / C7
  replace D independent re-verification

D MUST INDEPENDENTLY:
  re-read Connection
  re-read Vault metadata
  recheck Strategy B occupancy
  require B gate / fencing authority ON
  use fresh A/preflight evidence as required
  conditional UPDATE only when predicates still hold
  emit durable audit (D-CONN-04-09)

C closure ≠ D authorization
```

### How D consumes C (current code reality)

**FACT:** D does **not** yet call C. Planned consumption pattern (**PROPOSED**, aligned with frozen boundary):

1. D loads Connection + Vault metadata + occupancy.
2. D calls `classifyFivConn04LiveConnection(...)` (C) — **direct** reuse of C API.
3. Only if `isFivConn04EligibleLive(result)` (or equivalent) **and** B write proof in same txn → conditional UPDATE.
4. C result from an earlier batch pass is **informational**; write-time re-invoke is mandatory.

Classification: C→D = **hard dependency** on C’s closed classifier contract; consumption is **direct** (call C) with **mandatory independent I/O re-reads** owned by D.

---

## 10. Dependency Graph

| Dependency                                             | Classification            | Notes                                                                            |
| ------------------------------------------------------ | ------------------------- | -------------------------------------------------------------------------------- |
| C closed classifier (`fiv-conn-04-live-classifier.ts`) | **Hard**                  | Write eligibility SoT facade; re-invoke at write time                            |
| A classifier (`fiv-conn-04-a-classification.ts`)       | **Hard** (indirect via C) | Evidence SoT under C; do not fork                                                |
| A fresh preflight on target                            | **Hard** (parent plan)    | Systemic Vault failure blocks D progression                                      |
| A preflight **service** on `origin/main`               | **Unresolved**            | Pure A tracked; `fiv-conn-04-a-preflight.service.ts` untracked locally — see §21 |
| B write gate / lease / deny-set                        | **Hard**                  | Window must be ON                                                                |
| B-04 `Conn04MigrationBoundaryService`                  | **Hard**                  | Refuse start/write without proof                                                 |
| B-02 `assertDurableAuthorityCas`                       | **Hard**                  | Same-txn CAS for privileged write                                                |
| B-01 `assertPrivilegedEnvironmentUpdateAllowed`        | **Hard** (contract)       | Pure grant assertion; insufficient alone                                         |
| Prisma `ConnectionRecord.environment` nullable         | **Hard**                  | Persistence target; no schema change                                             |
| Strategy B partial unique index                        | **Hard**                  | Final DB collision authority (P2002)                                             |
| Vault metadata read (exact id)                         | **Hard**                  | No payload; Connected required for LIVE                                          |
| Security Audit catalog / service                       | **Hard**                  | D-CONN-04-09 delivery                                                            |
| `connection.environment-backfill` event type           | **Unresolved**            | NB-01 open (new type vs extend lifecycle)                                        |
| ConnectionsService public APIs                         | **Informational / soft**  | Must **not** become public env PATCH; D is privileged runner                     |
| E residual inventory                                   | **Soft** (downstream)     | D may complete with residuals; E owns verification/release                       |
| FIV / C7 / venue                                       | **Informational**         | Explicit non-deps; must remain unauthorized                                      |

```text
C → D: HARD (classifier contract + independent re-verify)
B → D: HARD (gate ON + CAS)
A → D: HARD (fresh preflight evidence)
D → DB: HARD (conditional UPDATE + Strategy B)
D → Vault: HARD (metadata read only; zero mutation)
D → Audit: HARD (durable outcomes)
D → E: SOFT / SEQUENCING (E after D)
```

---

## 11. Current Implementation Reality

**FACT / REPOSITORY EVIDENCE** at HEAD `e4c4e9a…`:

| Area                           | Reality                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| D runner / UPDATE executor     | **ABSENT** — no `fiv-conn-04-d*` production module                                                                |
| Privileged env UPDATE path     | **ABSENT** — no service method performs `environment` UPDATE after create                                         |
| Public env mutation            | **DENIED** — `classifyConnectionMutation('updateEnvironment')` → deny; no DTO path                                |
| Create-time env                | **PRESENT** — EXCHANGE create requires `live\|testnet`; historical NULL EXCHANGE rows are the backfill population |
| B-04 façade                    | **PRESENT** — `Conn04MigrationBoundaryService` (`start`/`resume`/`heartbeat`/`release`/`assertWriteAuthority`)    |
| Same-txn CAS                   | **PRESENT** — `assertDurableAuthorityCas` / `assertWriteAuthority`                                                |
| C classifier                   | **PRESENT** — `classifyFivConn04LiveConnection` on `origin/main` (sync `ee252be`)                                 |
| A pure classifier              | **PRESENT** — `fiv-conn-04-a-classification.ts` (sync `32388f4`)                                                  |
| A preflight service            | **NOT on tracked origin/main** — local untracked WIP only                                                         |
| Backfill audit event type      | **ABSENT** — `connection.environment-backfill` not registered                                                     |
| Gate audit                     | **PRESENT** — `connection.migration-gate`                                                                         |
| Lifecycle audit                | **PRESENT** — `connection.lifecycle` (replace/disconnect/disable/revoke)                                          |
| Competing CONN-04 UPDATE paths | **NONE** found                                                                                                    |
| Unrelated “backfill” names     | Market/knowledge backfills exist — **not** CONN-04                                                                |

### Legacy / competing paths

- No second migration-gate SoT.
- No legacy env backfill script for Connections.
- Risk of **dual inventory path** if untracked A preflight is later merged without deliberate DI/ownership — record as **RISK**, not auto-blocker.

---

## 12. Reuse Candidates

| Candidate                     | Path / symbol                                             | Reuse role for D              | Class                                  |
| ----------------------------- | --------------------------------------------------------- | ----------------------------- | -------------------------------------- |
| C classifier                  | `fiv-conn-04-live-classifier.ts`                          | Write-time eligibility        | **FACT** / **PROPOSED** reuse          |
| A classifier                  | `fiv-conn-04-a-classification.ts`                         | Evidence SoT under C          | **FACT**                               |
| B-04 façade                   | `Conn04MigrationBoundaryService`                          | Start/refuse + write proof    | **FACT** / **PROPOSED** reuse          |
| Durable CAS                   | `MigrationGateDurableAuthority.assertDurableAuthorityCas` | Same-txn fencing              | **FACT**                               |
| Privileged assert             | `assertPrivilegedEnvironmentUpdateAllowed`                | Grant shape check             | **FACT**                               |
| B-03 enforcement              | `connection-migration-gate-enforcement.ts`                | Keep deny-set during D window | **FACT** (do not weaken)               |
| ENV1 helpers                  | `trading-credential-environment.ts` / purpose helpers     | Already used by A/C           | **FACT**                               |
| Strategy B queries            | Prisma `findFirst` / unique index                         | Occupancy + P2002 backstop    | **FACT**                               |
| Security Audit infra          | classification + attribution + `SecurityAuditService`     | Register D outcomes           | **FACT**                               |
| Prisma transactions           | `PrismaTransactionService` / `TransactionContext`         | Per-row txn composition       | **FACT**                               |
| Untracked A preflight service | `fiv-conn-04-a-preflight.service.ts`                      | Possible inventory loader     | **OPEN QUESTION** (not on origin/main) |

```text
D SHOULD REUSE (PROPOSED, not authorized):
  C classifier + B-04 boundary + CAS + existing audit infra + Strategy B
D SHOULD NOT REIMPLEMENT:
  gate lease SoT, classifier evidence bar, Strategy B index, Vault store/replace
```

---

## 13. Potential Implementation Surface

**PROPOSED PLANNING ITEM only — identification, not implementation, not authorization.**

| Surface                                                 | Likely role                                                | Notes                                  |
| ------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| New D runner service (connections module)               | Orchestrate start → scan/classify → per-row txn → counters | Privileged internal only               |
| Optional CLI/script                                     | Operator entry under governance                            | Must still use B-04; no ungated script |
| Per-row write helper                                    | CAS → reclassify → conditional UPDATE → audit              | Same txn                               |
| Audit helper + catalog registration                     | D-CONN-04-09 outcomes                                      | NB-01 choice                           |
| Specs: D predicate / race / audit / refuse-without-gate | AC-D-01…07                                                 | New                                    |
| Module DI exports                                       | Wire runner; **no** public HTTP env PATCH                  | Preserve AC-D-07                       |

**Explicitly not proposed here:** Prisma migrations, schema nullability change, Vault module redesign, ConnectionsController env endpoints.

---

## 14. Data / Persistence Considerations

| Topic                                   | Status                                               | Class                                                             |
| --------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `ConnectionRecord.environment` nullable | Remains nullable (D-CONN-04-07)                      | **INHERITED**                                                     |
| Strategy B partial unique index         | Already applied; final collision authority           | **FACT** / **INHERITED**                                          |
| Prisma schema change for D              | **Not expected**                                     | **INHERITED** (Slice §24)                                         |
| Write fields                            | `environment` (+ ORM `updatedAt` if applicable) only | **INHERITED**                                                     |
| `vaultSecretId`                         | Unchanged                                            | **INHERITED** (AC-D-02)                                           |
| Historical NULL EXCHANGE rows           | Primary write population                             | **FACT** (create path now requires env for new EXCHANGE)          |
| P2002 handling                          | Skip/report collision; continue                      | **INHERITED**                                                     |
| `FOR UPDATE` row lock                   | Preferred in Slice §10                               | **INHERITED** intent; exact ORM API = **OPEN QUESTION** if needed |

---

## 15. Vault / SecretState Considerations

| Topic                     | Requirement                                            | Class                         |
| ------------------------- | ------------------------------------------------------ | ----------------------------- |
| Metadata-only reads       | Exact `vaultSecretId`; no ciphertext/payload           | **INHERITED**                 |
| LIVE purpose              | Trading / TradingLive only                             | **INHERITED** (D-CONN-04-01)  |
| Usable state              | `SecretState.Connected` only for `ELIGIBLE_LIVE`       | **INHERITED** (IPR-C-01)      |
| Workspace match           | Vault workspace must equal Connection workspace        | **INHERITED**                 |
| Vault mutation            | **Zero** in D                                          | **INHERITED** (AC-D-06)       |
| Sibling / provider lookup | Forbidden                                              | **INHERITED**                 |
| Systemic Vault outage     | Abort D progression (fail closed)                      | **INHERITED** (Slice §14/§17) |
| Per-row Vault error       | Skip/block that row; continue unless policy says abort | **INHERITED**                 |

D does **not** remediate Vault↔Connection orphans created by B-03 mid-flight deny (**D-B03-04** ACCEPTED RESIDUAL) unless a later governed remediation says so.

---

## 16. Concurrency / Fencing / Idempotency Considerations

| Mechanism                                | Role for D                                       | Class                            |
| ---------------------------------------- | ------------------------------------------------ | -------------------------------- |
| Single-runner lease (B)                  | Prevent dual D writers                           | **INHERITED**                    |
| Deny-set while ACTIVE (B-03)             | Reduce concurrent credential/create races        | **INHERITED**                    |
| Same-txn CAS (B-04/B-02)                 | Stale grant cannot mutate                        | **INHERITED** / **FACT**         |
| Conditional UPDATE `environment IS NULL` | Idempotent / race-safe                           | **INHERITED**                    |
| Strategy B unique index                  | Final DB fencing for live slot                   | **INHERITED** / **FACT**         |
| Observe-only / check-then-save           | **FORBIDDEN** as write authority                 | **INHERITED**                    |
| C-B06-02 live dual-process residual      | OPEN/OPTIONAL; not silently closed by D planning | **ACCEPTED RESIDUAL** / **OPEN** |

**Idempotency (Slice §16) — INHERITED:**

- Rerun must no-op already-`live` rows.
- Never rewrite populated env.
- Never touch credentials.
- `rowCount=0` → skip outcome.

---

## 17. Failure and Recovery Considerations

**INHERITED** from Slice Planning §17 / §18:

| Failure                              | Handling                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Non-eligible classification          | Skip + audit; continue                                                                                 |
| Conditional UPDATE 0 rows            | `skipped_no_longer_eligible`; continue                                                                 |
| Strategy B P2002                     | Skip/report; continue                                                                                  |
| Systemic Vault outage                | Abort D; no silent LIVE                                                                                |
| Audit fails after UPDATE             | Forward-fix: retry audit; do **not** auto-revert env to NULL; mark run errors; operator reconciliation |
| Gate contention / UNKNOWN            | Fail closed; do not dual-run                                                                           |
| Crash mid-batch                      | Re-acquire + fresh preflight; committed LIVE rows remain; rerun idempotent                             |
| Incorrect LIVE assignment discovered | Stop automated env writes; quarantine IDs; governed forward-fix only                                   |

```text
NO destructive rollback under D:
  no Vault rollback, no auto LIVE→NULL, no delete, no credential replace
```

---

## 18. Security Considerations

| Boundary                                                | Required posture                                                                  | Class                                       |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------- |
| Credential / Vault                                      | Metadata-only; zero mutation; no secret in audit                                  | **INHERITED**                               |
| LIVE classification                                     | Vault-proven + Connected; no DB-only LIVE                                         | **INHERITED**                               |
| Workspace ownership                                     | Exact workspace match; no cross-ws writes                                         | **INHERITED**                               |
| Binance venue / env                                     | No venue I/O; LIVE is Connection metadata only                                    | **INHERITED**                               |
| Migration exception C-02                                | Window-bounded; not public API; not Model C/C7/FIV bypass                         | **INHERITED**                               |
| Concurrent actors                                       | Gate deny-set + CAS + conditional UPDATE                                          | **INHERITED**                               |
| Stale writers                                           | Same-txn CAS fail                                                                 | **INHERITED**                               |
| Retries                                                 | Per-row safe; no blanket rewrite                                                  | **INHERITED**                               |
| Fail-open vs fail-closed                                | Uncertainty (UNKNOWN gate, occupancy unavailable, Vault outage) → **fail closed** | **INHERITED**                               |
| Direct Prisma / DBA path                                | Remains S20 residual (**D-B03-06**)                                               | **ACCEPTED RESIDUAL**                       |
| Observe→Vault→observe→mutate race on ordinary lifecycle | Remains (**D-B03-08**); D privileged path uses same-txn CAS for env UPDATE        | **ACCEPTED RESIDUAL** + **INHERITED** D CAS |

### Potential fail-open / fail-closed decisions

| Situation                                              | Established behavior                         | Class                                                  |
| ------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------ |
| Gate UNKNOWN / unreadable                              | Refuse D start                               | **INHERITED**                                          |
| Occupancy `unavailable`                                | Never `ELIGIBLE_LIVE`                        | **INHERITED** (IMPL-REV-C-01)                          |
| Audit loss after UPDATE                                | Forward-fix + error; no silent success claim | **INHERITED**                                          |
| Whether blocked-only rows require durable audit always | Slice AC-D-04 says updated **and blocked**   | **INHERITED**                                          |
| Exact abort threshold for partial Vault failures       | Per-row vs systemic                          | Partly specified; remaining nuance = **OPEN QUESTION** |

Where repo does not settle an implementation detail → mark **UNRESOLVED / REQUIRES DECISION** (see §21). Do not invent.

---

## 19. Test Strategy Discovery

**This task did not execute tests.** Counts below from prior closure evidence are **not** re-certified here.

### 1) Existing tests D must preserve (regression walls)

| Suite / area                                              | Evidence class            |
| --------------------------------------------------------- | ------------------------- |
| C: `fiv-conn-04-live-classifier.spec.ts`                  | **FACT** (tracked)        |
| A classification: tracked/untracked specs as applicable   | **FACT** / local WIP note |
| B-01…B-06 gate/CAS/enforcement/security/concurrency specs | **FACT**                  |
| B-04: `conn04-migration-boundary.service.spec.ts`         | **FACT**                  |
| Connections env immutability / Strategy B specs           | **FACT**                  |
| B security smoke / audit integrity / secret leakage       | **FACT**                  |

### 2) Existing tests reusable as fixtures/patterns

- C disposition matrix (eligibility negatives).
- B-04 refuse-without-lease / CAS proofs.
- Migration-gate privileged assert unit tests.
- Security Audit catalog registration patterns from `connection.migration-gate`.

### 3) New D-specific tests (appear necessary — **PROPOSED**)

| Theme                                                                 | Maps to            |
| --------------------------------------------------------------------- | ------------------ |
| Conditional UPDATE predicates (`NULL` only, EXCHANGE, vault id match) | AC-D-01/03         |
| `vaultSecretId` unchanged                                             | AC-D-02            |
| Durable audit for updated + blocked                                   | AC-D-04            |
| Batch continues after skip/block                                      | AC-D-05            |
| Zero Vault mutation assertions                                        | AC-D-06            |
| No public API exposure                                                | AC-D-07            |
| Same-txn CAS required for write                                       | COND-ARCH-B04      |
| P2002 / collision skip                                                | D-CONN-04-05       |
| Idempotent second pass updates=0                                      | Slice §16 (also E) |

### 4) Integration / regression potentially required (**PROPOSED**)

- Runner + B-04 + classifier composition under mocked Prisma/Vault.
- Partial batch completion + counters.
- Gate OFF / UNKNOWN refuse start.

### 5) Security tests potentially required (**PROPOSED**)

- Cross-workspace isolation.
- No secret leakage in audit payloads.
- No TESTNET→LIVE.
- No sibling credential substitution.

### 6) Concurrency / idempotency / fencing (**PROPOSED**)

- Stale fence CAS fail.
- Concurrent env already set → skip.
- Double runner refuse.
- Do **not** claim C-B06-02 closed by unit tests alone.

---

## 20. Existing Residuals and Their Impact

| Residual     | Source                           | Meaning                                                                                         | Status              | Affects D planning?                                                                                     | Planning treatment                     |
| ------------ | -------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **C-B06-02** | B-06 Decision Freeze / B closure | Live dual-process Postgres / OS-level interleaving optional residual                            | **OPEN / OPTIONAL** | Soft — D must not claim multi-process E2E closed                                                        | **PRESERVE**; optional hardening later |
| **D-B03-04** | B-03 Decision Freeze             | Vault/Connection desync after mid-flight deny; no B-03 compensation                             | **ACCEPTED**        | Constraint — D must not soft-pass or invent silent Vault cleanup as “solved”                            | **PRESERVE** as planning constraint    |
| **D-B03-06** | B-03 Decision Freeze             | Direct Prisma/DBA mutate = S20 residual outside app trust path                                  | **ACCEPTED**        | Constraint — D privileged runner still not a substitute for DBA controls                                | **PRESERVE**                           |
| **D-B03-08** | B-03 Decision Freeze             | observe→Vault→observe→mutate race; same-txn CAS remains **04-D only** for privileged env UPDATE | **ACCEPTED**        | Design constraint — D **must** implement same-txn CAS for privileged writes (already frozen for D path) | **PRESERVE**; reinforces COND-ARCH-B04 |

```text
NO SILENT CLOSURE OR REASSIGNMENT OF:
  C-B06-02, D-B03-04, D-B03-06, D-B03-08
```

---

## 21. Open Questions / Unresolved Decisions

| ID          | Question                                                                                                                                     | Notes                                                                       | Class                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **NB-01**   | Audit event type: `connection.environment-backfill` vs extend `connection.lifecycle`                                                         | Accepted as implementation-time under D-CONN-04-09 in parent Slice Approval | **OPEN QUESTION** (already ACCEPTED as non-blocking at parent) |
| **OQ-D-01** | A preflight service delivery: promote untracked `fiv-conn-04-a-preflight.service.ts` vs reimplement inventory loader inside D vs script-only | Service absent from `origin/main`                                           | **UNRESOLVED / REQUIRES DECISION**                             |
| **OQ-D-02** | Runner shape: Nest injectable service vs governed script vs both                                                                             | Slice allows service and/or script                                          | **OPEN QUESTION**                                              |
| **OQ-D-03** | Operator/actor model for privileged start (who may call `Conn04MigrationBoundaryService.start`)                                              | B-04 requires privileged actor; exact ops binding for D window              | **OPEN QUESTION**                                              |
| **OQ-D-04** | Exact Prisma `FOR UPDATE` / transaction helper API for per-row lock                                                                          | Slice prefers FOR UPDATE                                                    | **OPEN QUESTION**                                              |
| **OQ-D-05** | Systemic vs per-row abort thresholds for Vault errors beyond Slice §17                                                                       | Partially specified                                                         | **UNRESOLVED / REQUIRES DECISION**                             |
| **OQ-D-06** | Whether D emits durable audits for **all** blocked classes in the same run that updates eligibles, or only for rows entering write path      | AC-D-04 says updated and blocked — exact batch inventory vs write-path set  | **OPEN QUESTION**                                              |
| **OQ-D-07** | Heartbeat cadence / TTL interaction during long D batches                                                                                    | B lease TTL exists; D ops policy not frozen                                 | **OPEN QUESTION**                                              |
| **OQ-D-08** | Relationship of D completion report to E handoff artifact format                                                                             | E owns residual inventory; D counters vs E buckets alignment                | **OPEN QUESTION**                                              |

Do **not** treat proposals below as answers to these questions.

---

## 22. Proposed Planning Acceptance Criteria

**PROPOSED** — for Planning Review ratification only. **Not yet ratified.** Do not treat as Implementation Authorization.

| ID           | Proposed criterion                                                                            |
| ------------ | --------------------------------------------------------------------------------------------- |
| **PAC-D-01** | Package correctly identifies D as conditional env UPDATE + durable audit (not E verification) |
| **PAC-D-02** | D-CONN-04-01…10 implications for D recorded without reopening freezes                         |
| **PAC-D-03** | C→D boundary preserved: independent re-verify mandatory; C closure ≠ D auth                   |
| **PAC-D-04** | Hard deps on A/B/C/B-04/CAS/Vault-metadata/Strategy B enumerated                              |
| **PAC-D-05** | Current code reality: no D UPDATE path; B-04 + C present; NB-01 open                          |
| **PAC-D-06** | Residuals C-B06-02 / D-B03-04/06/08 preserved with impact notes                               |
| **PAC-D-07** | Non-scope explicitly excludes FIV/C7/Vault mutation/public env API/NOT NULL/E                 |
| **PAC-D-08** | Open questions listed without silent resolution                                               |
| **PAC-D-09** | Explicit statements: D IMPLEMENTATION NOT STARTED; AUTHORIZATION NOT GRANTED                  |
| **PAC-D-10** | Next gate identified as FIV-CONN-04-D PLANNING REVIEW only                                    |

**Proposed acceptance criteria count:** **10** (PAC-D-01…10).

Inherited Slice AC-D-01…07 remain binding for later implementation gates; they are **not** re-proposed here.

---

## 23. Risks / Blockers

| ID           | Item                                                  | Type                                 | Notes                                                                                 |
| ------------ | ----------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| **R-D-01**   | Accidental public env mutation API                    | **RISK**                             | Mitigate via AC-D-07 / no controller DTO                                              |
| **R-D-02**   | Check-then-save without same-txn CAS                  | **RISK**                             | Forbidden by COND-ARCH-B04                                                            |
| **R-D-03**   | Treating stale C dispositions as write authority      | **RISK**                             | Boundary violation                                                                    |
| **R-D-04**   | Ungated script bypassing B-04                         | **RISK**                             | COND-SEC-B05                                                                          |
| **R-D-05**   | Dual A preflight paths (untracked vs future D loader) | **RISK**                             | Resolve via OQ-D-01                                                                   |
| **R-D-06**   | Silent residual closure                               | **RISK**                             | Explicit preserve rule                                                                |
| **R-D-07**   | Inferring D authorization from C closure              | **RISK**                             | Explicitly forbidden                                                                  |
| **R-D-08**   | Audit event type delay (NB-01)                        | **RISK** (non-blocking for planning) | Must resolve before/at Implementation Planning                                        |
| **BLK-D-01** | Missing Implementation Authorization                  | **Expected gate**, not a defect      | Correct stop condition                                                                |
| **BLK-D-02** | A preflight service not on origin/main                | **Potential planning dependency**    | Not automatically a planning-package blocker; must be decided before D implementation |

No new residual blockers invented solely because ACCEPTED/OPEN residuals exist.

---

## 24. Explicit Non-Authorization Statements

```text
D IMPLEMENTATION NOT STARTED
D IMPLEMENTATION AUTHORIZATION NOT GRANTED

This Planning Package does NOT:
  - grant Slice Approval
  - grant Implementation Authorization
  - authorize branches, commits, pushes of D code
  - authorize Prisma/Vault/API/source/test changes for D
  - authorize FIV / C7 / live capital / venue I/O
  - close FIV-CONN-04 or FIV-PRE-01
  - reopen FIV-CONN-04-C
  - close or remediate C-B06-02 / D-B03-04 / D-B03-06 / D-B03-08
```

---

## 25. Governance Chain Position

```text
FIV-CONN-04-C = FORMALLY CLOSED
FIV-CONN-04-D PLANNING DISCOVERY / PACKAGE  ← THIS ARTIFACT
  → FIV-CONN-04-D PLANNING REVIEW          ← NEXT GATE (only)
  → (later, separately governed)
       Decision Freeze (if required)
       Slice Approval
       Implementation Planning
       Implementation Authorization
       Implementation
       … E …
```

---

## 26. Discovery Sources (non-exhaustive)

| Rank | Artifact                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | `v3-l02-fiv-conn-04-slice-planning-package.md` (§7.4, §10, §13, §16–18, §23 AC-D)                                                                |
| 2    | `v3-l02-fiv-conn-04-po-governance-decision-freeze.md` (D-CONN-04-01…10)                                                                          |
| 3    | `v3-l02-fiv-conn-04-po-governance-slice-approval.md` / `v3-l02-fiv-conn-04-po-slice-review.md`                                                   |
| 4    | `v3-l02-fiv-conn-04-c-closure.md` / `v3-l02-fiv-conn-04-c-decision-freeze.md`                                                                    |
| 5    | B-04 planning + closure chain (`Conn04MigrationBoundaryService` handoff)                                                                         |
| 6    | B-03 Decision Freeze (residuals D-B03-04/06/08; CAS = 04-D)                                                                                      |
| 7    | Code: `conn04-migration-boundary.service.ts`, `fiv-conn-04-live-classifier.ts`, `fiv-conn-04-a-classification.ts`, migration-gate / CAS adapters |
| 8    | Parent planning package (historical naming superseded for C/D identity)                                                                          |

---

## Final State

```text
FIV-CONN-04-D PLANNING PACKAGE = CREATED
D PURPOSE = Conditional environment UPDATE (NULL→live) + durable audit
D-CONN-04 REQUIREMENTS = 01…10 mapped for D (09 owned by D delivery)
C→D BOUNDARY = PRESERVED
D IMPLEMENTATION = NOT STARTED
D IMPLEMENTATION AUTHORIZATION = NOT GRANTED
NEXT GATE = FIV-CONN-04-D PLANNING REVIEW
```

**END OF FIV-CONN-04-D PLANNING PACKAGE**
