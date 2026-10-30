# FIV-CONN-04-D Decision Freeze

**Document:** FIV-CONN-04-D Conditional Environment UPDATE + Durable Audit — Decision Freeze  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-D — Conditional environment UPDATE + durable audit  
**Authority:** Product Owner / Chief Architect (immutable governance recording)  
**Nature:** **DECISION FREEZE ONLY.** Ratifies, defers, or marks UNRESOLVED the planning decisions required for later D gates. Does **not** grant Slice Approval. Does **not** grant Implementation Authorization. Does **not** implement D. Does **not** modify application source, tests, Prisma/schema, Vault, A/B/C, APIs, or residual statuses. Does **not** invent behavior where evidence is insufficient.

**Planning Package:** [`v3-l02-fiv-conn-04-d-planning-package.md`](./v3-l02-fiv-conn-04-d-planning-package.md)  
**Planning Review:** [`v3-l02-fiv-conn-04-d-planning-review.md`](./v3-l02-fiv-conn-04-d-planning-review.md) — **PASS WITH CONDITIONS**  
**Parent Decision Freeze:** [`v3-l02-fiv-conn-04-po-governance-decision-freeze.md`](./v3-l02-fiv-conn-04-po-governance-decision-freeze.md) — D-CONN-04-01…10 **FROZEN**  
**C Formal Closure:** [`v3-l02-fiv-conn-04-c-closure.md`](./v3-l02-fiv-conn-04-c-closure.md) — **FORMALLY CLOSED**  
**Repository baseline:** `e4c4e9a183c016ac23eb0d0685341438e860f46e`

```text
DECISION FREEZE STATUS = GRANTED WITH EXPLICIT DEFERRED / UNRESOLVED ITEMS

Interpretation:
  Parent D-CONN-04-01…10, C→D boundary, B gate/CAS, nullable/residual
  semantics, and durable-audit SUBSTANCE are reaffirmed (not reopened).

  Planning Review conditions COND-D-01…06 are disposed below as
  RATIFIED (substance), DEFERRED (with owner), or UNRESOLVED
  (prerequisite) — without inventing missing technical policy.

  This freeze does NOT grant Slice Approval.
  This freeze does NOT authorize implementation.
```

```text
FIV-CONN-04-C = FORMALLY CLOSED
FIV-CONN-04-D IMPLEMENTATION = NOT STARTED
FIV-CONN-04-D IMPLEMENTATION AUTHORIZATION = NOT GRANTED
Slice Approval = NOT GRANTED
FIV / C7 / LIVE CAPITAL / VENUE I/O = NOT AUTHORIZED

Residuals PRESERVED:
  C-B06-02 = OPEN / OPTIONAL
  D-B03-04 = ACCEPTED
  D-B03-06 = ACCEPTED
  D-B03-08 = ACCEPTED
```

Protected dirty/untracked leftovers outside this artifact were **not** modified.  
Planning Package and Planning Review were **not** modified.

---

## 1. Decision Freeze Status

| Field           | Value                                                           |
| --------------- | --------------------------------------------------------------- |
| Gate            | FIV-CONN-04-D Decision Freeze                                   |
| Status          | **GRANTED WITH EXPLICIT DEFERRED / UNRESOLVED ITEMS**           |
| Invented policy | **NONE**                                                        |
| Next gate       | **FIV-CONN-04-D SLICE APPROVAL** (subject to §18 preconditions) |

---

## 2. Baseline

| Field                    | Value                                                        |
| ------------------------ | ------------------------------------------------------------ |
| `HEAD`                   | `e4c4e9a183c016ac23eb0d0685341438e860f46e`                   |
| C closure                | Same commit — **FORMALLY CLOSED**                            |
| A sync (classifier)      | `32388f4…` — pure A on `origin/main`                         |
| C sync                   | `ee252be…` — C on `origin/main`                              |
| A preflight Nest service | **Not tracked** on `origin/main`; local untracked WIP exists |
| D runner / env UPDATE    | **ABSENT**                                                   |

---

## 3. Governance Sources

| #   | Source                                                                       | Use                                                         |
| --- | ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | Parent Decision Freeze (D-CONN-04-01…10)                                     | Reaffirm; do not reopen                                     |
| 2   | Slice Planning Package (§7.4, §10, §13–18, §23 AC-D)                         | D identity / UPDATE / audit / failure                       |
| 3   | Parent PO Governance Slice Approval (incl. NB-01, C-01…C-06, sub-slices A–E) | Parent obligations; NB-01 deferral precedent                |
| 4   | C Decision Freeze / C Closure                                                | C→D boundary; IPR-C-01/02                                   |
| 5   | B-01…B-04 / B Closure                                                        | Gate, CAS, privileged actor kinds, TTL/window               |
| 6   | A Closure + A source synchronization                                         | Closed A scope vs what is on `origin/main`                  |
| 7   | D Planning Package + Planning Review                                         | COND-D-01…06 / OQ inventory                                 |
| 8   | Code at HEAD                                                                 | B-04 façade, C/A classifiers, audit catalog, gate constants |

Master plan / execution roadmap: no CONN-04 sub-slice SoT (informational only).

---

## 4. D-CONN-04-01…10 Ratification Matrix

| ID               | Frozen value                    | This freeze                   | Notes                                                  |
| ---------------- | ------------------------------- | ----------------------------- | ------------------------------------------------------ |
| D-CONN-04-01 = A | Vault-proven LIVE only          | **REAFFIRMED / NOT REOPENED** | D UPDATE only via C/A eligibility + IPR-C-01 Connected |
| D-CONN-04-02 = A | Ambiguous → NULL fail-closed    | **REAFFIRMED**                |                                                        |
| D-CONN-04-03 = A | Skip/audit; continue            | **REAFFIRMED**                |                                                        |
| D-CONN-04-04 = A | Skip defective; never auto-LIVE | **REAFFIRMED**                |                                                        |
| D-CONN-04-05 = A | Strategy B prevention only      | **REAFFIRMED**                |                                                        |
| D-CONN-04-06 = C | Residual NULL OK fail-closed    | **REAFFIRMED**                |                                                        |
| D-CONN-04-07 = A | Keep nullable                   | **REAFFIRMED**                | D must not NOT NULL                                    |
| D-CONN-04-08 = B | Write-gate deny set             | **REAFFIRMED**                | Owned by B; D consumes                                 |
| D-CONN-04-09 = B | Durable Security Audit          | **REAFFIRMED (substance)**    | Event **type** = NB-01 — see §10                       |
| D-CONN-04-10 = B | PRE-01 residual policy          | **REAFFIRMED**                | D does not close PRE-01 / authorize FIV                |

```text
D-CONN-04-01…10 = UNCHANGED / NOT REOPENED
```

---

## 5. A/B/C Inherited Constraints (Reaffirmed)

| Constraint                                                             | Status                  |
| ---------------------------------------------------------------------- | ----------------------- |
| Fresh target preflight before D writes (C-05 / Slice §14)              | **FROZEN / REAFFIRMED** |
| B write gate ON + single-runner lease (D-CONN-04-08 / D-CRED-02-12)    | **FROZEN / REAFFIRMED** |
| Same-txn durable fencing CAS for privileged env UPDATE (COND-ARCH-B04) | **FROZEN / REAFFIRMED** |
| Refuse D start on UNKNOWN / missing lease (COND-SEC-B10 / ARCH-B04)    | **FROZEN / REAFFIRMED** |
| C read-only classifier; D independent re-verify (C Decision Freeze §6) | **FROZEN / REAFFIRMED** |
| IPR-C-01 `SecretState.Connected` for `ELIGIBLE_LIVE`                   | **FROZEN / REAFFIRMED** |
| Migration-time env exception bounded (C-02); not public API            | **FROZEN / REAFFIRMED** |
| Zero Vault mutation on D path (D-CRED-02-04; AC-D-06 substance)        | **FROZEN / REAFFIRMED** |
| No Strategy B cleanup/merge/delete (D-CONN-04-05)                      | **FROZEN / REAFFIRMED** |
| A→B→C→D→E sequence unchanged                                           | **FROZEN / REAFFIRMED** |

---

## 6. C→D Boundary (Reaffirmed)

```text
C→D BOUNDARY = PRESERVED / REAFFIRMED

C: read-only dispositions; Vault-proven eligibility; Connected binding; no mutation
D: re-invoke C at write time; conditional NULL→live UPDATE; B gate + CAS;
   durable audit; keep nullable; do not close PRE-01 / authorize FIV

Stale C dispositions alone are NEVER sufficient for a write.
C closure does NOT authorize D.
```

---

## 7. Decision Inventory

| ID            | Origin           | Relationship                                                |
| ------------- | ---------------- | ----------------------------------------------------------- |
| **COND-D-01** | Planning Review  | = package **OQ-D-01** (A preflight delivery)                |
| **COND-D-02** | Planning Review  | = parent **NB-01** (audit event type)                       |
| **COND-D-03** | Planning Review  | = package **OQ-D-03** (privileged actor binding)            |
| **COND-D-04** | Planning Review  | = package **OQ-D-04** (FOR UPDATE API)                      |
| **COND-D-05** | Planning Review  | = package **OQ-D-05** (Vault abort thresholds)              |
| **COND-D-06** | Planning Review  | = package **OQ-D-07** (heartbeat/TTL long batch)            |
| **OQ-D-02**   | Planning Package | Runner shape (service vs script vs both) — not a COND alias |
| **OQ-D-06**   | Planning Package | Audit scope for blocked rows in batch — not a COND alias    |
| **OQ-D-08**   | Planning Package | D→E handoff artifact format — not a COND alias              |

No additional material unresolved decision beyond this inventory was found that is independent of the above (residuals remain preserved, not new decision IDs).

---

## 8. COND-D-01…06 Disposition

### COND-D-01 — A preflight delivery

| Field                              | Content                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**                             | COND-D-01 (= OQ-D-01)                                                                                                                                                                                                                                                                                                                |
| **Source**                         | Planning Review; Slice §14 / C-05; A Closure; A sync `32388f4`                                                                                                                                                                                                                                                                       |
| **Question**                       | What delivery vehicle produces fresh A preflight evidence for the D window when the Nest preflight service is not on `origin/main`?                                                                                                                                                                                                  |
| **Existing frozen requirement(s)** | **C-05 / Slice §14:** mandatory **fresh read-only preflight evidence** on the target environment before UPDATE. Defective rows do not alone block eligible batch; **systemic Vault-unavailable / read failure blocks progression to D**.                                                                                             |
| **Repository evidence**            | Tracked on main: `fiv-conn-04-a-classification.ts` (incl. `buildFivConn04APreflightReport` / counters). A Closure listed `fiv-conn-04-a-preflight.service.ts` (+ specs + module wiring) as closed A implementation. A sync commit delivered **classifier only**. Local untracked preflight service exists — **not** git-tracked SoT. |
| **Options (not chosen here)**      | (1) A source-sync of already-closed A preflight service/specs/wiring; (2) governed composition using tracked pure A + Prisma/Vault reads; (3) governed script using same A semantics.                                                                                                                                                |
| **Security / correctness**         | Dual semantics / treating untracked WIP as SoT risks inconsistent eligibility.                                                                                                                                                                                                                                                       |
| **Dependency**                     | Hard obligation = **evidence**; Nest service file = **delivery status**, not a separately frozen D redesign.                                                                                                                                                                                                                         |
| **Disposition**                    | **SPLIT** — see statuses below                                                                                                                                                                                                                                                                                                       |
| **Final status**                   | **RATIFIED (obligation + non-SoT rule)** + **UNRESOLVED (delivery vehicle — prerequisite)**                                                                                                                                                                                                                                          |

**RATIFIED under COND-D-01:**

1. D **must** obtain fresh target preflight evidence satisfying Slice §14 before privileged writes.
2. Preflight remains **read-only**; D does **not** redesign A classifier semantics.
3. Untracked local `fiv-conn-04-a-preflight.service.ts` is **not** `origin/main` SoT and must **not** be assumed delivered.
4. Prefer reuse of closed A semantics (tracked pure A report builders + exact-id Vault metadata + Strategy B projection) over inventing a second eligibility bar.

**UNRESOLVED under COND-D-01 (prerequisite before Implementation Planning):**

```text
STATUS: UNRESOLVED
Why: Repository evidence does not establish which delivery vehicle is authoritative
     for the closed A preflight I/O surface on origin/main.
Required next action (identify only; not performed by this freeze):
  - Governed A source synchronization/delivery of closed A preflight artifacts, OR
  - Explicit PO/Arch selection of an alternate composition that uses tracked A pure
    helpers without forking eligibility semantics.
This is a PREREQUISITE for Implementation Planning — not silently closed by local WIP.
```

| Is COND-D-01 still a prerequisite? | **YES** (delivery UNRESOLVED) |
| ---------------------------------- | ----------------------------- |

---

### COND-D-02 — NB-01 audit event type

| Field                              | Content                                                                                                                                                                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                             | COND-D-02 (= NB-01)                                                                                                                                                                                                               |
| **Source**                         | Parent Slice Approval §12 NB-01; D-CONN-04-09; Slice §13                                                                                                                                                                          |
| **Question**                       | `connection.environment-backfill` vs extend `connection.lifecycle`?                                                                                                                                                               |
| **Existing frozen requirement(s)** | D-CONN-04-09 = durable Security Audit for **updated/blocked** rows + required fields/counters; no secrets; use existing Security Audit conventions. Parent NB-01: **ACCEPTED** — “resolve in implementation within D-CONN-04-09.” |
| **Repository evidence**            | `connection.lifecycle` and `connection.migration-gate` registered; `connection.environment-backfill` **absent**.                                                                                                                  |
| **Options**                        | New classified type (Slice “prefer”) vs extend lifecycle (allowed if coherent).                                                                                                                                                   |
| **Disposition**                    | Substance **RATIFIED**; event-type shape **DEFERRED** per parent NB-01                                                                                                                                                            |
| **Final status**                   | **DEFERRED** (event type) → **Implementation Planning** owner; substance **RATIFIED**                                                                                                                                             |

| Is COND-D-02 still a prerequisite for Slice Approval? | **NO** (parent already accepted deferral) |
| Is it a prerequisite for Implementation Planning entry / catalog registration? | **YES** — must be bound in Implementation Planning before code lands |

---

### COND-D-03 — Privileged actor binding

| Field                              | Content                                                                                                                                      |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                             | COND-D-03 (= OQ-D-03)                                                                                                                        |
| **Source**                         | B-01 `PrivilegedActorContext`; B-04 `Conn04MigrationBoundaryService.start`                                                                   |
| **Question**                       | Who may start/resume the D window; how is actor provisioned?                                                                                 |
| **Existing frozen requirement(s)** | Actor must satisfy `isPrivilegedActorContext` with `actorKind ∈ {SYSTEM_JOB, OPERATOR}`; CLIENT forbidden; no client-controlled grant/fence. |
| **Repository evidence**            | B-04 refuses non-privileged actors; kinds and helpers exist in `migration-gate.ts`.                                                          |
| **Disposition**                    | Kind/contract **RATIFIED**; concrete ops identity mapping **UNRESOLVED**                                                                     |
| **Final status**                   | **RATIFIED (contract)** + **UNRESOLVED (ops identity mapping)**                                                                              |

**RATIFIED:** D start/resume/heartbeat/release **must** use B-04 with `PrivilegedActorContext` (`SYSTEM_JOB` \| `OPERATOR`) only.

**UNRESOLVED:** Exact operator/job identity provisioning for the authorized D window (credentials, runbook binding). No evidence freezes a named human/role or job ID here.

| Prerequisite? | **YES** for Implementation Planning (ops binding); contract sufficient for Slice Approval design |

---

### COND-D-04 — FOR UPDATE / locking semantics

| Field                              | Content                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                             | COND-D-04 (= OQ-D-04)                                                                                                                                                               |
| **Source**                         | Slice §10 (“prefer FOR UPDATE”); COND-ARCH-B04                                                                                                                                      |
| **Question**                       | Exact Prisma/`FOR UPDATE` API for per-row lock?                                                                                                                                     |
| **Existing frozen requirement(s)** | Same-txn CAS mandatory; conditional UPDATE predicates; no check-then-save; Strategy B unique index final DB authority. Slice **prefers** `FOR UPDATE` — not a named ORM API freeze. |
| **Repository evidence**            | CAS helper present; no D UPDATE path yet; no second concurrency SoT.                                                                                                                |
| **Disposition**                    | Concurrency model **RATIFIED**; exact lock API **DEFERRED**                                                                                                                         |
| **Final status**                   | **DEFERRED** → Implementation Planning (under ratified constraints)                                                                                                                 |

**RATIFIED concurrency model (no second model):**

1. B lease / B-04 refuse-without-proof
2. Same-txn `assertWriteAuthority` / `assertDurableAuthorityCas`
3. Conditional `environment IS NULL` UPDATE
4. Strategy B unique index / P2002 skip

**DEFERRED:** Exact row-lock API (`FOR UPDATE` vs equivalent transaction isolation approach), provided the four authorities above hold.

| Prerequisite for Impl Planning? | **Bind or record chosen API** in Implementation Planning — not a Slice Approval blocker |

---

### COND-D-05 — Vault abort thresholds

| Field                              | Content                                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                             | COND-D-05 (= OQ-D-05)                                                                                                                                                                 |
| **Source**                         | Slice §14 proceed policy; Slice §17                                                                                                                                                   |
| **Question**                       | When do per-row Vault errors become systemic abort?                                                                                                                                   |
| **Existing frozen requirement(s)** | Systemic Vault outage / unavailable → **abort D** (fail closed). Per-row Vault metadata error → **skip/block that row; continue** unless outage policy says abort. Never invent LIVE. |
| **Repository evidence**            | No numeric threshold in governance or code.                                                                                                                                           |
| **Disposition**                    | Dichotomy **RATIFIED**; numeric threshold **UNRESOLVED**                                                                                                                              |
| **Final status**                   | **RATIFIED (fail-closed dichotomy)** + **UNRESOLVED (numeric threshold)**                                                                                                             |

**UNRESOLVED:** Exact count/rate/timeout defining “systemic” beyond clear total Vault-unavailable. Must not invent N=k.

| Prerequisite? | **YES** for Implementation Planning if automation needs a numeric policy; qualitative dichotomy is enough for Slice Approval |

---

### COND-D-06 — Heartbeat / TTL for long batches

| Field                              | Content                                                                                                                                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                             | COND-D-06 (= OQ-D-07)                                                                                                                                                                              |
| **Source**                         | OD-B-01 ≤4h window; B-01 heartbeat ceiling; `migration-gate.constants.ts` defaults                                                                                                                 |
| **Question**                       | Heartbeat cadence / TTL policy during long D batches?                                                                                                                                              |
| **Existing frozen requirement(s)** | Max authorized window ≤4h; heartbeat must not extend past `acquiredAt + authorizedWindow`; expired/OWNERSHIP_LOST/UNKNOWN → stop privileged writes; must re-acquire + fresh preflight after crash. |
| **Repository evidence**            | Default TTL 15m and recommended heartbeat ≤5m are labeled **technical/ops guidance**, “not a new OD-B policy.”                                                                                     |
| **Disposition**                    | Window/fail-closed rules **RATIFIED**; exact cadence **DEFERRED** (use B defaults as non-frozen guidance only)                                                                                     |
| **Final status**                   | **DEFERRED** (cadence) → Implementation Planning / ops runbook under ratified ceilings                                                                                                             |

| Prerequisite for Impl Planning? | **YES** to record chosen cadence ≤ guidance/ceilings; not inventing new max window |

---

## 9. OQ-D-02 / OQ-D-06 / OQ-D-08 Disposition

### OQ-D-02 — Runner shape

| Field                                | Content                                                                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Question**                         | Nest injectable service vs governed script vs both?                                                                                 |
| **Frozen**                           | Must use B-04; no public env PATCH (AC-D-07 / C-02); no ungated script (COND-SEC-B05). Slice Planning allows service and/or script. |
| **Final status**                     | **DEFERRED** → Implementation Planning                                                                                              |
| **Prerequisite for Slice Approval?** | **NO**                                                                                                                              |

### OQ-D-06 — Audit scope for blocked rows

| Field            | Content                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Question**     | Durable audit for all blocked classes in the run vs only write-path rows?                                                                                                          |
| **Frozen**       | D-CONN-04-09 / AC-D-04 / C-04: durable events for **updated and blocked** rows; counters required; `operation_summary` allowed.                                                    |
| **Final status** | **RATIFIED (updated + blocked must be durably audited)** + **DEFERRED (whether inventory-only non-write scans need per-row events vs counters+summary)** → Implementation Planning |
| **Note**         | Do not weaken “blocked rows get durable audit” for rows D classifies as blocked during the write window.                                                                           |

### OQ-D-08 — D→E handoff format

| Field                                  | Content                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Question**                           | Exact artifact format aligning D counters to E buckets?                                     |
| **Frozen**                             | D emits Slice §13 counters; E owns residual inventory / verification / gate release (C-06). |
| **Final status**                       | **DEFERRED** → E planning (with D counters taxonomy frozen to Slice §13)                    |
| **Prerequisite for D Slice Approval?** | **NO**                                                                                      |

---

## 10. Security Audit Freeze

### RATIFIED (substance — D-CONN-04-09 / C-04 / Slice §13)

| Item                                                                    | Status                          |
| ----------------------------------------------------------------------- | ------------------------------- |
| Durable Security Audit required for updated and blocked outcomes        | **RATIFIED**                    |
| Required safe fields / counters (Slice §13; Decision Freeze §12 parent) | **RATIFIED**                    |
| Forbidden secret material in audit                                      | **RATIFIED**                    |
| Use existing Security Audit infrastructure (no parallel secret logger)  | **RATIFIED**                    |
| Audit failure after successful UPDATE → forward-fix; no auto LIVE→NULL  | **RATIFIED** (Slice §17–18)     |
| Actor / system identity + correlation where available                   | **RATIFIED** as required fields |

### NOT frozen here (event shape)

| Item                                                                                            | Status                                                     |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Exact event type string (`connection.environment-backfill` vs `connection.lifecycle` extension) | **DEFERRED** (NB-01 / COND-D-02) → Implementation Planning |
| Catalog registration details                                                                    | **DEFERRED** with NB-01                                    |

```text
SECURITY AUDIT SUBSTANCE = FROZEN
SECURITY AUDIT EVENT TYPE (NB-01) = DEFERRED TO IMPLEMENTATION PLANNING
```

---

## 11. Concurrency / Fencing Freeze

### RATIFIED

| Item                                                   | Status        |
| ------------------------------------------------------ | ------------- |
| Single-runner B lease; second runner refused           | **RATIFIED**  |
| B-04 façade is the D integration boundary              | **RATIFIED**  |
| Same-txn CAS mandatory for privileged env UPDATE       | **RATIFIED**  |
| Observe-only / check-then-save insufficient            | **RATIFIED**  |
| Conditional UPDATE idempotency (`environment IS NULL`) | **RATIFIED**  |
| Strategy B unique index + P2002 → skip/continue        | **RATIFIED**  |
| No second concurrency / lease SoT                      | **RATIFIED**  |
| C-B06-02 remains OPEN/OPTIONAL                         | **PRESERVED** |

### DEFERRED / UNRESOLVED

| Item                                      | Status                             |
| ----------------------------------------- | ---------------------------------- |
| Exact `FOR UPDATE` ORM API                | **DEFERRED** (COND-D-04)           |
| Numeric multi-process E2E beyond C-B06-02 | **NOT REQUIRED** to close residual |

---

## 12. Vault / TTL / Long-Running Execution

### RATIFIED (fail-closed)

| Item                                                                 | Status       |
| -------------------------------------------------------------------- | ------------ |
| Metadata-only Vault reads; exact `vaultSecretId`; Connected for LIVE | **RATIFIED** |
| Zero Vault mutation                                                  | **RATIFIED** |
| Systemic Vault unavailable → abort D                                 | **RATIFIED** |
| Per-row Vault error → skip/block; continue (default)                 | **RATIFIED** |
| Max window ≤4h; heartbeat cannot exceed ceiling                      | **RATIFIED** |
| Lease expired / ownership lost / UNKNOWN mid-run → stop writes       | **RATIFIED** |
| Crash → re-acquire + fresh preflight; committed LIVE remain          | **RATIFIED** |
| Partial batch allowed (D-CONN-04-03/05)                              | **RATIFIED** |

### DEFERRED / UNRESOLVED (policy detail)

| Item                                                  | Status                                              |
| ----------------------------------------------------- | --------------------------------------------------- |
| Numeric systemic Vault threshold                      | **UNRESOLVED** (COND-D-05)                          |
| Exact heartbeat cadence / requested TTL for D batches | **DEFERRED** (COND-D-06); constants = guidance only |

---

## 13. Nullable / Residual Semantics

| Item                                                                         | Status                                              |
| ---------------------------------------------------------------------------- | --------------------------------------------------- |
| Keep nullable (D-CONN-04-07)                                                 | **REAFFIRMED**                                      |
| Residual EXCHANGE NULL allowed and fail-closed (D-CONN-04-06 / D-CONN-03-03) | **REAFFIRMED**                                      |
| NULL ≠ LIVE; no waiver                                                       | **REAFFIRMED**                                      |
| D-B03-04 / D-B03-06 / D-B03-08                                               | **PRESERVED ACCEPTED** — not remediated by D freeze |
| C-B06-02                                                                     | **PRESERVED OPEN/OPTIONAL**                         |

---

## 14. PAC-D-01…10 Status

```text
PAC-D-01…10 = PROPOSED ONLY
PAC-D-01…10 = NOT RATIFIED AS IMPLEMENTATION REQUIREMENTS BY THIS FREEZE
```

They remain planning-package quality criteria from Planning Discovery/Review. They do **not** become frozen implementation ACs here.

---

## 15. Slice AC-D-01…07 Status

| ID                         | Substance          | Status under this freeze                                                                         |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| AC-D-01…07                 | Slice Planning §23 | **SLICE-APPROVED-AC (parent FIV-CONN-04 Slice Approval chain)** — binding design substance for D |
| D sub-slice Slice Approval | Still required     | **NOT GRANTED by this freeze**                                                                   |

```text
AC-D-01…07 = PARENT SLICE-APPROVED SUBSTANCE (not reopened)
AC-D-01…07 = NOT converted into D Implementation Authorization
D SLICE APPROVAL = STILL REQUIRED AS A SEPARATE GATE
```

This freeze does **not** invent new AC numbers and does **not** elevate PAC-D into AC-D.

---

## 16. Explicit Unresolved Decisions

| ID                              | Topic                                     | Why unresolved                                                           | Blocks                                                  |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| **COND-D-01 delivery**          | A preflight I/O surface on `origin/main`  | Closed A listed service; sync delivered classifier only; local WIP ≠ SoT | **Implementation Planning**                             |
| **COND-D-03 ops mapping**       | Concrete privileged identity provisioning | Contract frozen; ops mapping not evidenced                               | **Implementation Planning**                             |
| **COND-D-05 numeric threshold** | Systemic Vault abort N/rate/timeout       | No governance number exists                                              | **Implementation Planning** (if automation requires it) |

Deferred (owned, not unresolved): **NB-01/COND-D-02**, **COND-D-04**, **COND-D-06**, **OQ-D-02**, **OQ-D-06** (narrow remainder), **OQ-D-08**.

---

## 17. Risks

| ID     | Risk                        | Mitigation under this freeze                    |
| ------ | --------------------------- | ----------------------------------------------- |
| R-D-01 | Public env API              | AC-D-07 / C-02 reaffirmed                       |
| R-D-02 | Check-then-save             | CAS mandatory reaffirmed                        |
| R-D-03 | Stale C write authority     | Re-invoke mandatory                             |
| R-D-04 | Ungated script              | B-04 mandatory                                  |
| R-D-05 | Dual A preflight paths      | COND-D-01 UNRESOLVED delivery + non-SoT rule    |
| R-D-06 | Silent residual closure     | Residuals preserved                             |
| R-D-07 | Infer D auth from C closure | Explicit non-authorization                      |
| R-D-08 | NB-01 delay                 | Deferred to Impl Planning with substance frozen |

---

## 18. Preconditions for Slice Approval

Slice Approval for FIV-CONN-04-D may proceed when reviewers confirm:

1. This Decision Freeze is accepted as the D design freeze record.
2. D-CONN-04-01…10 and C→D boundary remain unreopened.
3. COND-D-01 **obligation** (fresh preflight evidence) is acknowledged; **delivery UNRESOLVED** is explicitly carried as an Implementation Planning prerequisite (does **not** require inventing a Nest service in Slice Approval).
4. NB-01 remains deferred per parent acceptance.
5. No claim of Implementation Authorization, FIV/C7, or residual closure.
6. PAC-D remain proposed-only.

```text
SLICE APPROVAL PRECONDITIONS = DESIGN FREEZE ACCEPTANCE
+ EXPLICIT CARRY-FORWARD OF UNRESOLVED DELIVERY / OPS ITEMS
```

---

## 19. Preconditions for Implementation Planning

Implementation Planning **must not** begin as if the following were resolved:

| Prerequisite                                                               | Status                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------- |
| COND-D-01 delivery vehicle (A preflight I/O on main or explicit alternate) | **UNRESOLVED — REQUIRED**                         |
| COND-D-03 concrete privileged actor provisioning                           | **UNRESOLVED — REQUIRED**                         |
| COND-D-02 / NB-01 event type binding                                       | **DEFERRED — MUST BIND IN IMPL PLANNING**         |
| COND-D-04 lock API choice                                                  | **DEFERRED — MUST BIND IN IMPL PLANNING**         |
| COND-D-05 numeric systemic threshold (if needed by automation)             | **UNRESOLVED — BIND OR JUSTIFY QUALITATIVE-ONLY** |
| COND-D-06 heartbeat cadence under ≤4h ceiling                              | **DEFERRED — MUST RECORD IN IMPL PLANNING**       |
| OQ-D-02 runner shape                                                       | **DEFERRED — MUST BIND IN IMPL PLANNING**         |

```text
UNTIL COND-D-01 DELIVERY IS DISPOSED:
  Do not treat untracked A preflight WIP as origin/main SoT.
  Do not invent a second LIVE evidence bar inside D.
```

---

## 20–21. Explicit Non-Authorization

```text
D IMPLEMENTATION NOT STARTED
D IMPLEMENTATION AUTHORIZATION NOT GRANTED

This Decision Freeze does NOT:
  - grant Slice Approval
  - grant Implementation Authorization
  - authorize D code/tests/schema/Vault changes
  - deliver A preflight synchronization
  - close C-B06-02 or remediate D-B03-04/06/08
  - authorize FIV / C7 / live capital / venue I/O
  - close FIV-CONN-04 or FIV-PRE-01
```

---

## Final State

```text
DECISION FREEZE = GRANTED WITH EXPLICIT DEFERRED / UNRESOLVED ITEMS

REAFFIRMED: D-CONN-04-01…10, C→D, B gate/CAS, nullable/residuals,
            durable audit SUBSTANCE, fail-closed Vault/lease rules

RATIFIED (new D freeze items): COND-D-01 obligation+non-SoT;
  COND-D-03 actor contract; COND-D-05 qualitative abort dichotomy;
  concurrency model; audit substance; OQ-D-06 updated+blocked substance

DEFERRED: NB-01/COND-D-02, COND-D-04, COND-D-06, OQ-D-02, OQ-D-08,
          OQ-D-06 narrow remainder

UNRESOLVED (prerequisites): COND-D-01 delivery; COND-D-03 ops mapping;
  COND-D-05 numeric threshold

PAC-D-01…10 = PROPOSED ONLY
AC-D-01…07 = PARENT SLICE-APPROVED SUBSTANCE; D Slice Approval still required

NEXT GATE = FIV-CONN-04-D SLICE APPROVAL
```

**END OF FIV-CONN-04-D DECISION FREEZE**
