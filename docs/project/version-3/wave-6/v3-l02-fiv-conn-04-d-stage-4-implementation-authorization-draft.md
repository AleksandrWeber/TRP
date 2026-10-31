# FIV-CONN-04-D — Full-D Stage 4 Implementation Authorization Package

```text
DRAFT — NOT RATIFIED — NO IMPLEMENTATION AUTHORITY
CANDIDATE DECISION / ACT ID ONLY — NOT A RATIFIED IMPLEMENTATION AUTHORIZATION
DOES NOT AUTHORIZE STAGE 4 CODING
DOES NOT AUTHORIZE STAGES 5–8
DOES NOT AUTHORIZE CONNECTION.ENVIRONMENT UPDATE
DOES NOT AUTHORIZE FULL-D BACKFILL EXECUTION OR COMPLETION
DOES NOT AUTHORIZE FIV-CONN-04-E
DOES NOT AUTHORIZE PRODUCTION / DEPLOYMENT / LIVE-CAPITAL OPERATIONS
NO AUTOMATIC PROGRESSION
DECISION REGISTER: NOT MODIFIED BY THIS DRAFT
ONLY THE PROJECT OWNER MAY RATIFY THIS AUTHORIZATION
SEPARATE PO RATIFICATION ACT REQUIRED BEFORE ANY STAGE 4 CODING
```

**Document:** Draft Full-D Stage 4 Implementation Authorization Package for Product Owner review  
**Date (drafting):** 2026-10-30  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Authority:** Product Owner (sole Project Owner) — draft only; awaiting separate ratification act  
**Status:** **DRAFT — NOT RATIFIED — NO IMPLEMENTATION AUTHORITY**  
**Candidate Decision / Act ID family:** **`D-CONN04-FULL-D-IA-S4`** — **PROPOSAL PENDING PO CONFIRMATION** (see **OQ-S4-07**)  
**Nature:** **GOVERNANCE / DOCUMENTATION ONLY.** Translates Full-D IA §8 Stage 4, IMPL-REV-D-06, Successor-01 Vault-metadata amendment, ratified Port IA / VMP-1 closure, and Stage 3 closure into a bounded Stage 4 Implementation Authorization **proposal**. Does **not** itself grant coding authority. Does **not** modify the Decision Register. Does **not** modify application source or tests. Does **not** stage, commit, or push.

---

## 1. Decision identification and candidate ID

| Field | Value |
| --- | --- |
| **Decision title** | Full-D Stage 4 — Per-attempt fresh Vault + occupancy + C (Implementation Authorization) |
| **Proposed Decision / Act ID family (candidate)** | **`D-CONN04-FULL-D-IA-S4`** — **PROPOSAL ONLY; PENDING PO CONFIRMATION** (**OQ-S4-07**) |
| **Governing parent Full-D IA** | `D-CONN04-FULL-D-IA` (**GRANTED WITH AMENDMENTS**) |
| **Governing Vault-metadata amendment** | `D-CONN04-PO-VAULT-B-IA-AMD-S01` (**APPROVED AND RATIFIED**) |
| **Governing Port IA / closure** | `D-CONN04-FULL-D-IA-VMP` (**RATIFIED**); `D-CONN04-FULL-D-IA-VMP-CLOSE` (**VMP-1 FORMALLY CLOSED**) |
| **Preceding stage closure** | `D-CONN04-FULL-D-IA-S23-B-S3-CLOSE` (**STAGE 3 FORMALLY CLOSED**) |
| **Project** | FIV-CONN-04-D |
| **Wave** | 6 — Live Trading |
| **Decision authority** | Product Owner (sole Project Owner) |
| **Decision class** | Implementation Authorization proposal (Stage 4 only) |
| **Status** | **DRAFT — NOT RATIFIED — NO IMPLEMENTATION AUTHORITY** |
| **Drafting date** | 2026-10-30 |
| **Ratification date** | _Pending separate Product Owner ratification act_ |
| **Implementation authorization** | **NOT GRANTED** by this draft |

### 1.1 Draft-only status (**OQ-S4-01** — reserved to PO)

| Requirement | Status in this document |
| --- | --- |
| This document is a draft only | **Binding for drafting** — recorded here |
| Separate PO ratification required before Stage 4 coding | **Binding inherited** from Full-D governance sequence; **not** satisfied by this draft |
| Cursor recommendation | Treat any coding before a separate ratification act as unauthorized |
| Product Owner decision | **RESERVED** — whether to ratify, amend, or reject this package |

Until the Product Owner issues a **separate ratification act**, treat any `D-CONN04-FULL-D-IA-S4*` identifier as a **candidate / proposal only**. This draft remains **NOT RATIFIED**.

---

## 2. Executive summary

1. **Source-backed Stage 4 objective (Full-D IA §8).** Implement the **per-attempt freshness loop** immediately before each write attempt: fresh Vault metadata (exact id) → typed occupancy evidence → re-invoke `classifyFivConn04LiveConnection` (C) → only then proceed through existing B-04 write-authority controls. Bound to **IMPL-REV-D-06**.
2. **Vault path supersession.** Per Successor-01 (`D-CONN04-PO-VAULT-B-IA-AMD-S01`), D Entry metadata freshness uses the ratified VMP-1 port/seam (`FivConn04DVaultMetadataPort.lookupExact` / Entry `lookupVaultMetadataForConnection`), **not** human `SecretVaultService.list` + exact-id filter.
3. **Explicit Stage 5 boundary (source-backed).** Stage 4 **must not** perform `Connection.environment` UPDATE, must not execute or complete the Full-D backfill as a Stage 4 outcome, and must not claim Stage 5 mutation/delivery authority. Stage 4 may establish and test the freshness and write-authority **proof path** only.
4. **Authority rules (source-backed).** A Preflight `ELIGIBLE_LIVE` is informational only and is **not** write authority. A previous batch-level or preflight pass cannot substitute for fresh per-attempt evidence. B-04 lease/fence/CAS controls must **not** be bypassed. Occupancy `unavailable` must fail closed and must never be treated as vacant.
5. **This draft does not authorize coding.** Separate PO ratification is required (**OQ-S4-01**). Seven open Product Owner questions (**OQ-S4-01…07**) remain reserved to the Product Owner.
6. **Observation statuses preserved.** F-OBS-01…04 **OPEN**; S3-OBS-01…03 **ACCEPTED / RECORDED**; VMP1-OBS-01…03 **ACCEPTED BY PO** (not remediated); VMP-1 **FORMALLY CLOSED**; Stage 3 **FORMALLY CLOSED**; Stage 4 **NOT AUTHORIZED**; Stage 5+ **NOT AUTHORIZED**.

---

## 3. Drafting baseline and verified hashes

### 3.1 Git baseline at drafting (preserved; not cleaned)

| Field | Value |
| --- | --- |
| **Branch** | `main` |
| **HEAD** | `a59c533977923a45413a176ad143325a948feeb8` |
| **Remote tracking** | up to date with `origin/main` |
| **Staged** | none |
| **Dirty / modified (selected)** | VMP-1-related Connections + Secret Vault files; `wave-6-po-decision-register.md`; other pre-existing dirty docs/specs |
| **Untracked (selected)** | VMP-1 port/module/service/specs; Entry seam spec; VMP/Stage governance docs; other pre-existing untracked docs |
| **VMP-1 implementation attribution** | Present in the **dirty working tree**; **not** assumed part of HEAD or independently integrated (**OQ-S4-02**) |

This draft **preserves** all existing dirty and untracked work. No restore/clean/commit was performed.

### 3.2 Mandatory known-hash verification (stop-condition gate)

| Artifact | Path | Expected SHA-256 | Verified |
| --- | --- | --- | --- |
| Port IA | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vault-metadata-port-implementation-authorization-draft.md` | `18e177ef154b8a35dc333faefa05c73729150c3822e78818fdc85bfe45db89e6` | **MATCH** |
| Port Ratification Act | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vault-metadata-port-po-ratification-draft.md` | `7e38e65996a87ec3b60d6f913a739a59e752641304d9a7df3c2357fa46693f14` | **MATCH** |
| VMP-1 Closure Act | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vmp-1-po-closure-decision.md` | `fec93bb581dc2771b9dd9690be124e56e4415702fe95a831cdabd8c391374670` | **MATCH** |
| PO Decision Register | `docs/project/version-3/wave-6/wave-6-po-decision-register.md` | `b488312f1bcb80b69039f08f84c3b39c22340879714107106bce6db468c62cca` | **MATCH** |

### 3.3 Additional governing sources inspected (current bytes)

| Artifact | Path | Current SHA-256 |
| --- | --- | --- |
| Full-D Implementation Authorization | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization.md` | `2c6890ba0e2ed3fe08b1ee84ee20df787eae814b8728465fff5a939356b9c1ee` |
| Successor-01 IA amendment text | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization-amendment-po-vault-b-final-candidate-successor-01.md` | `79386c9120e20c3a36648a869e6d196c7f6d96130b808006d723fac4e4ee8acb` |
| Successor-01 approval / re-ratification | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-successor-01-approval-and-ratification.md` | `cdba4ad50ab1691307ef94579669c4fa5c8a81ad0d30c9b44514e586c56fbc97` |
| Stage 3 PO formal closure | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-3-po-closure-decision.md` | `a28599dd6fe8a45cc3753c1ab6304ea6eb75c7a88363088b1572a644c51f9dc0` |
| Stage 3 Independent Review | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-3-independent-review.md` | `4f3ccaa093af768d63e829229c8aceaabea03a18733f7f340ce88e0c86b8542e` |
| Stage 2 Independent Review (F-OBS source) | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-2-independent-review.md` | `4300644c40f6af5c3fe1724eb33213ce3de248d34b371ad702fc98cb8bdcd470` |
| Full-D IA ratification | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-full-implementation-authorization-ratification.md` | `cfcd2d4879eff4470da0c55e1bfb84e28291709d55335e2687278381c9f24f00` |

Code evidence inspected for **scope accuracy only** (no implementation performed): C classifier (`fiv-conn-04-live-classifier.ts` / `FivConn04LiveSlotOccupancy`); A Preflight occupancy query (`findLiveStrategyBOccupant`); Entry VMP-1 seam (`lookupVaultMetadataForConnection`); B-04 boundary (`Conn04MigrationBoundaryService` / `assertWriteAuthority`); Stage 3 write-unit scaffold (`FivConn04DEnvironmentBackfillWrite`).

---

## 4. Inherited governance status (preserved)

| Item | Authoritative status (unchanged by this draft) |
| --- | --- |
| Full-D IA (`D-CONN04-FULL-D-IA`) | **GRANTED WITH AMENDMENTS** |
| Successor-01 (`D-CONN04-PO-VAULT-B-IA-AMD-S01`) | **APPROVED AND RATIFIED** — D Entry Vault freshness via dedicated metadata port |
| Port IA (`D-CONN04-FULL-D-IA-VMP`) | **APPROVED / RATIFIED** (hash-bound) |
| VMP-1 (`D-CONN04-FULL-D-IA-VMP-CLOSE`) | **FORMALLY CLOSED**; Delivery IR **`PASS WITH OBSERVATIONS`** preserved |
| Stage 3 (`D-CONN04-FULL-D-IA-S23-B-S3-CLOSE`) | **FORMALLY CLOSED** |
| Stage 4 | **NOT AUTHORIZED** |
| Stage 5 and later | **NOT AUTHORIZED** |
| `Connection.environment` UPDATE | **NOT AUTHORIZED** |
| Full-D backfill execution / completion | **NOT AUTHORIZED** |
| FIV-CONN-04-E / production / live capital | **NOT AUTHORIZED** |
| **F-OBS-01…F-OBS-04** | **OPEN** |
| **S3-OBS-01…S3-OBS-03** | **ACCEPTED / RECORDED** — do **not** reopen |
| **VMP1-OBS-01…VMP1-OBS-03** | **ACCEPTED BY PO** — residual; **not** technically remediated |

This draft does **not** remediate, reclassify, close, waive, or silently reinterpret any observation.

### 4.1 Observation implications (explain only; no scope expansion)

| Observation | Implication for Stage 4 drafting / future work |
| --- | --- |
| **F-OBS-01** | Connections helper refuses payload key `vaultSecretId` because shared sanitizer matches `/secret/i`. May affect a later durable-audit payload decision (**OQ-S4-05**). Does **not** authorize Stage 4 to amend shared audit helpers. |
| **VMP1-OBS-02** | Historical dirty-file attribution on `connections.module.ts`. Future Stage 4 work that touches that file requires careful attribution; does **not** reopen S3-OBS-01 / F-OBS-04. |
| **VMP1-OBS-03** | Nest DI is an educational composition boundary only — **not** production S2S / Vault AuthZ proof. Stage 4 must **not** present Nest DI as an authorization boundary; if approved, include DI-resolution evidence and negative boundary tests. |

---

## 5. Binding Stage 4 objective (Full-D IA §8 + IMPL-REV-D-06)

### 5.1 Source-backed Stage 4 definition

From Full-D IA §8 — **Stage 4 — Per-attempt fresh Vault + occupancy + C**:

| Field | Binding content |
| --- | --- |
| **Preconditions** | Classifier + Vault metadata APIs available; for D Entry freshness, **VMP-1 port/seam** (Successor-01 supersession of §7.0 `list` path) |
| **Work** | Implement freshness loop **before each write attempt** |
| **Excluded** | Treating preflight as write authority |
| **Exit** | Tests prove stale batch-pass / stale preflight insufficient |
| **Tests** | Freshness suite (**IMPL-REV-D-06**) |
| **Stop** | Skipping per-attempt proof |

### 5.2 Required per-attempt sequence (binding proposal)

Immediately before **each write attempt**, in this order, **outside** the write transaction:

1. **Obtain fresh Vault metadata** for the exact Vault record through the ratified VMP-1 port/seam:
   - Derive Connection-bound `{ workspaceId, vaultSecretId }`.
   - **Blank-ID precondition (pre-Port):** if either identifier is missing/blank/prevalidated invalid, fail closed, **do not invoke the Port**, and perform **zero** Port and repository metadata I/O (Successor-01 Decision 5; Port IA §8.2 blank/missing/invalid input row).
   - Otherwise invoke the Port/seam; consume success view or Port fail-closed reasons `NOT_FOUND` / `UNAVAILABLE` / `INVALID` without treating Port `INVALID` as the blank-ID precondition case.
2. **Resolve typed occupancy evidence** as `FivConn04LiveSlotOccupancy` (`verified_vacant` | `occupied` | `unavailable`) — only after a successful Vault metadata obtain for this attempt.
3. **Re-invoke** `classifyFivConn04LiveConnection` (C) using:
   - trusted Connection data (explicitly established for the attempt),
   - fresh Vault metadata view / mapped C input,
   - occupancy evidence from step 2.
4. **Only after** the checks succeed (C yields write-eligible disposition under Full-D rules), proceed through the **existing** B-04 write-authority controls (`assertWriteAuthority` / lease fence CAS path already scaffolded in Stage 3).

**Source-backed clarifications:**

| Rule | Basis | Binding |
| --- | --- | --- |
| A Preflight `ELIGIBLE_LIVE` is informational only | IMPL-REV-D-06; Full-D IA COND-IA-05 / §8 Stage 4 Excluded | **Not** write authority |
| Prior batch-level or preflight pass cannot substitute | IMPL-REV-D-06 | Fresh per-attempt evidence required |
| B-04 lease/fence/CAS must not be bypassed | COND-IA-02; Stage 3 scaffold; Full-D §10 / §11.1 | Stage 4 routes through existing controls |
| Order is Vault → occupancy → C → B-04 write-authority path | IMPL-REV-D-06; Successor-01 Decision 5; §8 | Mandatory sequence |
| Trusted Connection binding + complete C input set must be established explicitly | Successor-01 Decision 5; Port IA Entry seam scope | Do **not** assume the VMP-1 Entry seam loads or validates the Connection record |
| Occupancy `unavailable` fail-closed; never vacant | IMPL-REV-C-01; Full-D IA §11.1 | Systemic / batch-abort class at write classification |
| No new public HTTP/DTO surface | COND-IA-03; IMPL-REV-D-03 | Stage 4 remains internal Entry orchestration |
| Nest DI is not an authorization boundary | Successor-01 Decision 6; VMP1-OBS-03 | Educational composition only |

### 5.3 Explicit Stage 5 boundary (**OQ-S4-04**)

| Stage 4 may | Stage 4 must not |
| --- | --- |
| Establish and test the freshness + write-authority **proof path** | Perform `Connection.environment` UPDATE |
| Drive B-04 `assertWriteAuthority` / Stage 3 write-unit proof after successful freshness | Execute or complete the Full-D backfill as a Stage 4 outcome |
| Record fail-closed dispositions for ineligible / unavailable / vault miss classes under Stage 4 tests | Claim Stage 5 mutation or delivery authority |
| Use informational candidate discovery input (if PO accepts **OQ-S4-06**) | Treat candidate discovery as write authority |

**Source-backed boundary:** Full-D IA §8 places conditional NULL→`live` UPDATE in **Stage 5**, with Stage 4 limited to the freshness loop and proof that stale preflight is insufficient.

**Cursor technical recommendation (not a PO decision):** Preserve the source-backed split — Stage 4 freshness/authority proof only; Stage 5 owns env UPDATE. Any option that folds env UPDATE into Stage 4 is **inconsistent with the governing Full-D IA §8** unless the Product Owner issues a **formal amendment**.

**Product Owner decision:** **RESERVED** under **OQ-S4-04**.

---

## 6. Technical architecture (proposal — not coding authority)

### 6.1 Trusted Connection loading / binding

**Source-backed constraint:** Successor-01 Decision 5 requires Entry to obtain the relevant Connection from trusted B-04 / backfill processing context, derive `workspaceId` and `vaultSecretId` from that **same** Connection only, validate both before any port/repository call, and never accept HTTP/DTO/job-payload overrides.

**FACT (working-tree VMP-1):** `lookupVaultMetadataForConnection` accepts a Connection-derived binding object and does **not** itself load or re-validate a Connection row from persistence. Stage 4 must therefore **explicitly** establish trusted Connection loading/re-reading and the complete C input set before invoking Vault → occupancy → C.

**Cursor technical recommendation (not a PO decision):** Add Stage 4 trusted Connection load/re-read in the Entry orchestration path (module-local), bind the same Connection instance/fields into Vault lookup, occupancy resolution, and C, then re-read again inside any later write txn when Stage 5 is separately authorized. Do not treat the VMP-1 seam as Connection SoT.

### 6.2 Vault metadata (VMP-1 reuse)

| Item | Binding |
| --- | --- |
| Port | `FivConn04DVaultMetadataPort.lookupExact({ workspaceId, vaultSecretId })` |
| Entry seam | Existing internal `lookupVaultMetadataForConnection` (VMP-1) |
| Blank-ID precondition (pre-Port) | Missing/blank/prevalidated-invalid `workspaceId` or `vaultSecretId` rejected **before** Port invocation → fail closed; **zero** Port calls; **zero** repository metadata calls (Port IA §8.2; Successor-01 Decision 5). This zero-I/O guarantee is limited to that pre-invocation validation path. |
| Port outcomes | Success metadata view `{ id, workspaceId, purpose, state }` or Port reasons `NOT_FOUND` / `UNAVAILABLE` / `INVALID` |
| Forbidden for D freshness | Human `SecretVaultService.list`, slot `get`, repository direct inject for D freshness |

Disposition mapping for Stage 4 (align to Full-D IA §11.1 / Successor-01 Decision 7 / Port IA §8.2; Stage 4 tests the freshness path without performing env UPDATE):

| Vault / precondition outcome | Proposed Stage 4 handling (proof path) | I/O guarantee |
| --- | --- | --- |
| Blank-ID precondition rejected before Port invocation | Fail closed; stop this attempt; do **not** proceed to occupancy, C, or B-04 write-authority proof; **no** env UPDATE | **Zero** Port and repository metadata calls (ratified blank/missing/invalid input contract) |
| Success + C eligible after occupancy | Proceed to B-04 write-authority proof only | Port/repository I/O as required for successful lookup |
| Port `NOT_FOUND` / purpose-state non-eligible via C | Fail closed for that attempt (row-skip class); do **not** proceed as fresh-eligible; **no** env UPDATE | Port may have performed lookup I/O (do not restate as blank-ID zero-I/O) |
| Port `UNAVAILABLE` / systemic | Fail closed; batch-abort class; do **not** proceed to occupancy/C/B-04 as eligible; **no** env UPDATE | Port/repository I/O may have been attempted (infra/timeout class) |
| Port returns `INVALID` (ratified meaning: bad/incomplete projection) | Fail closed; stop this attempt; do **not** proceed to occupancy, C eligibility, or B-04 write-authority proof; **no** env UPDATE. Do **not** reinterpret as blank-ID precondition failure. | **Do not assert zero I/O.** Ratified Port IA / Successor-01 classify `INVALID` as a Port result reason for bad/incomplete projection and require fail-closed behavior, but **do not establish** that every `INVALID` subtype occurs only before I/O or with zero Port/repository calls. Timing/I/O for particular `INVALID` subtypes is **not established** by the available governance sources and must not be assumed. |

### 6.3 Typed occupancy resolver (**OQ-S4-03**)

**Source-backed facts:**

- No dedicated occupancy Nest port exists (Full-D IA §7.0 FACT).
- C public type `FivConn04LiveSlotOccupancy` + fail-closed `unavailable` semantics exist (`IMPL-REV-C-01`).
- A Preflight private method `findLiveStrategyBOccupant` implements the Prisma projection algorithm but returns `string | null` (not typed C occupancy); read/verify failure mapping to `unavailable` is a D-path responsibility at the C boundary.

**Alternatives for Product Owner:**

| Option | Description |
| --- | --- |
| **A — Module-local D-path helper** | Connections-local helper reusing the existing query/contract semantics; map to `FivConn04LiveSlotOccupancy`; fail closed on read/verify failure → `unavailable`. **No** new occupancy Nest product module. |
| **B — Shared internal helper** | Extract a shared internal helper usable by A and D. |
| **C — Expand A Preflight exports** | Export / widen A Preflight occupancy API for D consumption. |

**Cursor technical recommendation (not a PO decision):** **Option A** — module-local D-path helper. Avoids widening A Preflight product surface; preserves A informational role; matches Full-D IA §7.0 “query algorithm copied into Entry/write orchestration (no new Nest service).”

**Explicit non-action in this drafting task:** Do **not** modify A Preflight as part of preparing this draft.

**Product Owner decision:** **RESERVED** under **OQ-S4-03**.

### 6.4 C classifier reuse

| Item | Binding |
| --- | --- |
| Function | `classifyFivConn04LiveConnection(connection, vaultMeta, occupancy)` |
| Nature | Pure; no I/O |
| `ELIGIBLE_LIVE` meaning | Classification disposition only; **never** implies write/trade authorization (classifier contract) |
| Occupancy `unavailable` | Must yield fail-closed disposition (`BLOCKED_OCCUPANCY_UNAVAILABLE`); never vacant |

### 6.5 B-04 write-authority path (Stage 3 scaffold reuse)

After successful Vault → occupancy → C eligibility for the attempt, Stage 4 may invoke the **existing** Entry/write-unit proof path (`proveWriteAuthority` / `assertWriteAuthorityInTransaction` → `Conn04MigrationBoundaryService.assertWriteAuthority`).

Stage 4 **must not**:

- bypass lease/fence/CAS,
- invent a parallel write-authority façade,
- export B-04 / `MIGRATION_GATE_PORT` / durable authority,
- proceed to conditional env UPDATE (Stage 5).

### 6.6 Candidate Connection set source (**OQ-S4-06**)

| Option | Description |
| --- | --- |
| **A — Reuse A Preflight candidate set** | Use A Preflight as **informational discovery** input only; independently re-prove each candidate at write-attempt time via Vault → occupancy → C → B-04 proof. |
| **B — Dedicated D scanner** | Introduce a dedicated D candidate scanner. |

**Source-backed constraint:** Full-D IA COND-IA-05 / IMPL-REV-D-06 — preflight set is informational candidate discovery only; not per-attempt SoT.

**Cursor technical recommendation (not a PO decision):** **Option A** — reuse the informational candidate set; it provides **no** write authority and cannot replace per-attempt proof.

**Product Owner decision:** **RESERVED** under **OQ-S4-06**.

### 6.7 Durable audit payload key `vaultSecretId` (**OQ-S4-05**)

**Source-backed constraint (F-OBS-01 — OPEN):** Stage 2 helper refuses `vaultSecretId` under shared `/secret/i` sanitizer; §13 lists the field as allowed (not mandatory); exact payload wiring remains deferred detail under Full-D IA COND-IA-04.

| Option | Description |
| --- | --- |
| **A — Defer** | Defer the audit-key requirement to Stage 5 or a separate audit decision. |
| **B — Amend shared helper** | Amend the shared audit helper under **separate** PO authorization. |
| **C — Omit and retain residual** | Omit the key in Stage 4 scope and explicitly retain F-OBS-01 as OPEN residual. |

**Cursor technical recommendation (not a PO decision):** Do **not** expand Stage 4 scope to resolve F-OBS-01. Prefer deferral / retain residual; do **not** change audit helpers under Stage 4.

**Product Owner decision:** **RESERVED** under **OQ-S4-05**.

---

## 7. Failure semantics applicable to Stage 4 proof path

Stage 4 inherits Full-D IA §11.1 distinctions for freshness/classification outcomes **without** performing env UPDATE. Mapping for the Stage 4 proof path:

| Failure class | Source | Stage 4 proof-path behavior | Continue other attempts? | I/O guarantee |
| --- | --- | --- | --- | --- |
| C ineligibility after fresh reclassify | IMPL-REV-D-06; §11.1 | Attempt fail-closed / skip class; **no** UPDATE | **YES** | — (post-Vault path) |
| Occupancy `occupied` | Strategy B; §11.1 | Attempt fail-closed / skip class; **no** UPDATE | **YES** | — (post-Vault path) |
| Occupancy `unavailable` | COND-D-05; IMPL-REV-C-01; §11.1 | **Batch abort** class; **no** UPDATE; stop subsequent attempts | **NO** | — (post-Vault path) |
| Vault systemic Port `UNAVAILABLE` | COND-D-05; Successor-01; Port IA §8.2 | **Batch abort** class; **no** UPDATE; do not proceed as eligible | **NO** | Do not assert blank-ID zero-I/O; Port/repository I/O may have been attempted |
| Vault per-attempt Port `NOT_FOUND` / non-eligible via C | COND-D-05 per-row; Port IA §8.2 | Attempt skip class; **no** UPDATE | **YES** | Do not assert blank-ID zero-I/O; lookup I/O may have occurred |
| Blank identifier rejected before Port invocation | Successor-01 Decision 5; Port IA §8.2 blank/missing/invalid input row | Fail closed; stop this attempt; do **not** proceed to occupancy / C / B-04; **no** UPDATE; do not invent success | Treat as attempt fail-closed (do not invent success); continue-other-attempts disposition remains per Full-D matrix without inventing a new batch-abort rule here | **Zero** Port and repository metadata calls |
| Port returns `INVALID` (bad/incomplete projection) | Successor-01 §6.3; Port IA §8.2 `INVALID` row; Decision 7 fail-closed list | Fail closed; stop this attempt; do **not** proceed to occupancy / C eligibility / B-04 write-authority proof; **no** UPDATE; do **not** silently reinterpret as blank-ID precondition failure | Treat as attempt fail-closed (do not invent success); do not invent a new batch-abort rule beyond ratified Port fail-closed | **Do not assert zero I/O** unless a ratified contract establishes that guarantee for the specific `INVALID` subtype. Available governance sources define `INVALID` as a Port result reason for bad/incomplete projection and require fail-closed behavior, but **do not establish** whether particular `INVALID` subtypes occur only before I/O, after repository projection, or in both cases. Timing/I/O behavior is therefore **not assumed**. |
| B-04 `assertWriteAuthority` fence/ownership/unknown fail | B-04; §11.1 | **Stop** subsequent attempts; **no** UPDATE | **NO** | — (write-authority path) |

**Mandatory distinctions preserved:**

1. Occupancy collision ≠ occupancy unavailable.
2. Blank-ID precondition (pre-Port validation) ≠ Port outcome `INVALID` (bad/incomplete projection). Only the blank-ID precondition carries the ratified zero Port/repository metadata I/O guarantee.
3. Connection 0-row UPDATE semantics remain Stage 5 concerns and are **out of Stage 4 mutation scope**.

---

## 8. Non-binding work-package decomposition

The following is a **non-binding decomposition** for Product Owner planning. It is **not** implementation authorization. Whether WP-1…WP-3 form one implementation package or multiple packages is **RESERVED to the Product Owner**.

| ID | Title | Intent |
| --- | --- | --- |
| **S4-WP-0** | Governance | Draft (this document) + separate PO ratification of Stage 4 IA |
| **S4-WP-1** | Trusted Connection loading/re-reading and binding to the Entry / VMP-1 seam | Establish complete C input Connection binding explicitly |
| **S4-WP-2** | D-path typed occupancy resolver | Map Prisma projection → `FivConn04LiveSlotOccupancy`; unavailable fail-closed |
| **S4-WP-3** | Per-attempt orchestration | Vault → occupancy → C → existing B-04 write-authority proof; no env UPDATE |
| **S4-WP-4** | Delivery independent review + separate PO closure | Review completed Stage 4 delivery; separate closure act; does **not** authorize Stage 5 |

**Trade-off (informational only):**

| Packaging | Pros | Cons |
| --- | --- | --- |
| Single implementation package (WP-1…WP-3 together) | One IR gate; matches VMP-1 “one package” precedent | Larger blast radius; harder mid-course stop |
| Split packages | Smaller review units; earlier stop points | More governance overhead; risk of partial orchestration authority confusion |

**Cursor technical recommendation (not a PO decision):** Prefer one bounded Stage 4 implementation package covering WP-1…WP-3 after IA ratification, with mandatory written Independent Review before separate PO Stage 4 closure — analogous to VMP-1 — unless the Product Owner prefers explicit splits for attribution hygiene around dirty `connections.module.ts` (VMP1-OBS-02).

---

## 9. Proposed verification strategy (specify only — not executed)

If the Product Owner later ratifies Stage 4 IA, the following verification is **proposed** (this drafting task does **not** run tests):

| Area | Proposed proof |
| --- | --- |
| C classifier regression | Existing `fiv-conn-04-live-classifier` suite remains green |
| Typed occupancy states | `verified_vacant` / `occupied` / `unavailable`; unavailable **never** coerced to vacant |
| Vault metadata outcomes | Success / `NOT_FOUND` / `UNAVAILABLE` / `INVALID` disposition mapping on Stage 4 path; Port `INVALID` fails closed and does **not** proceed to occupancy/C/B-04 |
| Blank-ID precondition zero-I/O | For identifiers rejected **before** Port invocation: prove **zero** Port calls and **zero** repository metadata calls |
| Port `INVALID` fail-closed | Prove Stage 4 stops the attempt without occupancy/C/B-04 progression; do **not** require or claim a blank-ID-style zero-I/O assertion for Port `INVALID` unless a ratified subtype contract later establishes it |
| Per-attempt order | Vault → occupancy → C → B-04 write-authority path (ordering assertions / spies); blank-ID rejection short-circuits before Port |
| IMPL-REV-D-06 stale-preflight insufficiency | Prior A Preflight `ELIGIBLE_LIVE` alone cannot pass Stage 4 write-authority proof |
| Nest TestingModule resolution | Real resolution of `FIV_CONN_04_D_VAULT_METADATA_PORT` in the Stage 4 consumer graph |
| Negative public/controller boundary | No public/controller path can invoke the Stage 4 loop as an authorization shortcut |
| B-04 non-regression | Lease/fence/CAS / `assertWriteAuthority` behaviors unchanged |
| Concurrency / retry within Stage 4 | Fail-closed stops on authority/occupancy-unavailable/vault-systemic classes; no env UPDATE side effects |

### 9.1 What tests cannot prove

| Limitation | Statement |
| --- | --- |
| Production S2S authorization | Nest DI / TestingModule resolution does **not** prove production S2S or Vault AuthZ (VMP1-OBS-03; Successor-01 Decision 6) |
| Database-level TOCTOU for env mutation | Full Connection conditional-UPDATE / Strategy B uniqueness guarantees depend on later **Stage 5** mutation predicates; Stage 4 proof path cannot claim those guarantees |
| Crash-safe audit completeness | IA-REV-03 residual remains; Stage 4 does not solve it |
| Universal Nest exclusivity | Negative tests cannot prove all future Nest graphs |

---

## 10. Scope inclusions and exclusions

### 10.1 Proposed Stage 4 inclusions (only if separately ratified)

- Per-attempt freshness orchestration on the trusted Entry path: Vault (VMP-1) → occupancy → C → existing B-04 write-authority proof.
- Trusted Connection load/re-read + binding required to feed that sequence.
- Module-local typed occupancy resolution (subject to **OQ-S4-03**).
- Informational candidate discovery reuse or dedicated scanner (subject to **OQ-S4-06**).
- Tests listed in §9.
- Delivery Independent Review + separate PO Stage 4 closure acts (after delivery).

### 10.2 Explicit exclusions (even if Stage 4 IA is later ratified)

- `Connection.environment` UPDATE (Stage 5).
- Execution or completion of Full-D backfill as a Stage 4 outcome.
- Treating A Preflight `ELIGIBLE_LIVE` as write authority.
- Bypassing B-04 lease/fence/CAS.
- New public HTTP/DTO / controller / cron / Trading Runtime ingress.
- Claiming Nest DI as an authorization boundary.
- Remediation/closure/reclassification of F-OBS-01…04, S3-OBS-01…03, or VMP1-OBS-01…03 without separate PO scope.
- Amending shared Security Audit sanitizer / helpers to admit `vaultSecretId` unless separately authorized (**OQ-S4-05**).
- FIV-CONN-04-E; production activation; live capital; Vault ciphertext access; human ACL redesign.
- Automatic progression to Stage 5+.

---

## 11. Product Owner questions (**OQ-S4-01…07**)

Legend for each question:

- **Source-backed constraints** — inherited from ratified governance; not optional in this draft’s framing.
- **Cursor technical recommendation** — advisory only; **not** a PO decision.
- **Decision reserved to Product Owner** — required before ratification / coding.

### OQ-S4-01 — Stage 4 IA scope and authorization

| Class | Content |
| --- | --- |
| **Source-backed** | Stage 4 coding requires explicit PO Implementation Authorization; VMP-1 closure and Stage 3 closure do **not** authorize Stage 4 |
| **Cursor recommendation** | Keep this document draft-only; require a separate ratification act before any Stage 4 coding |
| **PO decision reserved** | Whether to ratify, amend, or reject this Stage 4 IA package |

**Recorded now:** This document is a **draft only**. A separate PO ratification is required before Stage 4 coding.

### OQ-S4-02 — VMP-1 Git baseline and attribution

| Alternative | Description |
| --- | --- |
| **A** | Require VMP-1 implementation to be committed and attributed before Stage 4 IA ratification |
| **B** | Permit IA ratification against the current dirty working tree |
| **C** | Permit IA ratification now but require a clean, reviewed, attributable VMP-1 baseline **before Stage 4 coding** |

| Class | Content |
| --- | --- |
| **Source-backed** | VMP-1 is FORMALLY CLOSED as governance; implementation remains uncommitted in the working tree and must not be assumed part of HEAD |
| **Cursor recommendation** | Prefer requiring a clean, reviewed, attributable VMP-1 baseline **before Stage 4 coding** (closest to **C**, or **A** if PO wants baseline before ratification itself) |
| **PO decision reserved** | Choose A / B / C (or a stated variant) |

**Clarification:** The recommendation to require baseline before coding is **not** yet a PO decision.

### OQ-S4-03 — Occupancy resolver packaging

| Alternative | Description |
| --- | --- |
| **A** | Module-local D-path helper reusing existing query/contract semantics |
| **B** | Extract a shared internal helper |
| **C** | Expand A Preflight exports |

| Class | Content |
| --- | --- |
| **Source-backed** | No occupancy Nest port; C typed occupancy + fail-closed exist; A query is private; Full-D IA permits copying query algorithm into Entry/write orchestration |
| **Cursor recommendation** | **A** — module-local D-path helper; do **not** create a new occupancy Nest product module; do **not** modify A Preflight in this drafting task |
| **PO decision reserved** | Choose A / B / C |

### OQ-S4-04 — Stage 4 / Stage 5 boundary

| Alternative | Architectural implication |
| --- | --- |
| **A — Preserve source-backed split** | Stage 4 = freshness + authority proof only; Stage 5 = env UPDATE. Consistent with Full-D IA §8 |
| **B — Fold env UPDATE into Stage 4** | Collapses Stage 5 into Stage 4. **Inconsistent with governing Full-D IA §8** unless a **formal PO amendment** is made |
| **C — Stage 4 proof path emits “ready-to-update” durable side effects beyond B-04 proof** | Requires explicit PO scope definition; risk of silent Stage 5 creep |

| Class | Content |
| --- | --- |
| **Source-backed** | Stage 4 freshness loop; Stage 5 conditional NULL→`live` UPDATE; Stage 4 must not include env UPDATE / backfill completion |
| **Cursor recommendation** | **A** — preserve source-backed boundary |
| **PO decision reserved** | Confirm A, or issue a formal amendment if selecting a conflicting option |

### OQ-S4-05 — Durable audit payload key `vaultSecretId`

| Alternative | Description |
| --- | --- |
| **A** | Defer the audit-key requirement to Stage 5 or a separate audit decision |
| **B** | Amend the shared audit helper under separate PO authorization |
| **C** | Omit the key and explicitly retain F-OBS-01 residual |

| Class | Content |
| --- | --- |
| **Source-backed** | F-OBS-01 remains OPEN; Stage 2 deferred payload wiring; helper currently refuses the key |
| **Cursor recommendation** | Do **not** expand Stage 4 scope to resolve this; prefer **A** or **C**; do **not** change audit helpers under Stage 4 |
| **PO decision reserved** | Choose A / B / C |

### OQ-S4-06 — Candidate Connection set source

| Alternative | Description |
| --- | --- |
| **A** | Reuse A Preflight candidate set as informational discovery input; independently re-prove each candidate at write time |
| **B** | Introduce a dedicated D scanner |

| Class | Content |
| --- | --- |
| **Source-backed** | Preflight is informational only; cannot replace per-attempt Vault+occupancy+C proof |
| **Cursor recommendation** | **A** — reuse informational candidate set; no write authority |
| **PO decision reserved** | Choose A / B |

### OQ-S4-07 — Stage 4 decision and act identifiers

| Proposal | Notes |
| --- | --- |
| Family | **`D-CONN04-FULL-D-IA-S4`** |
| Possible companions (examples only) | `…-S4` (IA ratification), `…-S4-CLOSE` (later closure) — **not** created by this draft |

| Class | Content |
| --- | --- |
| **Source-backed** | Decision IDs follow `D-CONN04-*` / Full-D IA lineage conventions used for VMP / Stage 3 |
| **Cursor recommendation** | Adopt `D-CONN04-FULL-D-IA-S4` naming family for Stage 4 IA / related acts |
| **PO decision reserved** | Confirm or rename; naming marked **proposal pending PO confirmation** |

---

## 12. Proposed governance sequence after this draft

```text
(1) Product Owner reviews this Stage 4 IA draft + dispositions OQ-S4-01…07
(2) Separate Product Owner ratification act for Stage 4 IA
    — NOT accomplished by this draft
(3) (Subject to OQ-S4-02) Ensure attributable VMP-1 baseline before coding if so decided
(4) Bounded Stage 4 implementation (only after ratification)
(5) Mandatory written Independent Review of completed Stage 4 delivery
(6) Separate Product Owner Stage 4 closure act
(7) Separate Stage 5 authorization later — NOT implied by Stage 4 closure
```

No automatic progression. Decision Register updates occur only under explicit Product Owner direction for ratification/closure acts.

---

## 13. Explicit non-authorizations

This draft does **not**:

- Authorize Stage 4 commencement or coding.
- Authorize Stages 5–8.
- Authorize `Connection.environment` UPDATE.
- Authorize Full-D backfill execution or completion.
- Authorize FIV-CONN-04-E.
- Authorize production / deployment / live-capital operations.
- Ratify itself.
- Update the PO Decision Register.
- Remediate or reinterpret F-OBS / S3-OBS / VMP1-OBS statuses.
- Modify application source or tests.
- Stage, commit, push, reset, stash, or clean the repository.
- Convert Cursor recommendations into Product Owner decisions.

---

## 14. Closing declaration

```text
DOCUMENT STATUS: DRAFT — NOT RATIFIED — NO IMPLEMENTATION AUTHORITY
CANDIDATE ID FAMILY: D-CONN04-FULL-D-IA-S4 (PROPOSAL — OQ-S4-07)
BOUND TO: Full-D IA §8 Stage 4 + IMPL-REV-D-06 + Successor-01 Vault path + VMP-1 port/seam
STAGE 5 BOUNDARY: NO Connection.environment UPDATE; NO backfill completion as Stage 4 outcome
OBSERVATIONS: F-OBS-01…04 OPEN; S3-OBS-01…03 ACCEPTED/RECORDED; VMP1-OBS-01…03 ACCEPTED BY PO
VMP-1: FORMALLY CLOSED
STAGE 3: FORMALLY CLOSED
STAGE 4: NOT AUTHORIZED
STAGE 5+: NOT AUTHORIZED
OQ-S4-01…07: RESERVED TO PRODUCT OWNER
DECISION REGISTER: NOT MODIFIED
NO CODE / TESTS / RATIFICATION / IMPLEMENTATION AUTHORIZATION PERFORMED BY THIS DRAFT
NO AUTOMATIC PROGRESSION
```

---

_End of Draft Full-D Stage 4 Implementation Authorization Package. DRAFT ONLY — NOT RATIFIED — NO IMPLEMENTATION AUTHORITY. Awaiting Product Owner review of OQ-S4-01…07 and a separate ratification act._
