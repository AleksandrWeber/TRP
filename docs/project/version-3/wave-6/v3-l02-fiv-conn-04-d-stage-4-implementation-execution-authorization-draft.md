# FIV-CONN-04-D — Stage 4 Implementation Execution Authorization Draft

**Document:** Proposed Stage 4 **implementation execution** authorization package under the already ratified Stage 4 architecture/scope IA  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Governing Stage 4 IA identity:** **`D-CONN04-FULL-D-IA-S4`**  
**Document class:** **DRAFT — NOT RATIFIED — NOT IMPLEMENTATION AUTHORIZATION**  
**Proposed future Execution Authorization Act ID:** **`D-CONN04-FULL-D-IA-S4-EXEC`** (proposed; Act **not** created by this draft)  
**Authority:** Product Owner (sole Project Owner) — this draft awaits separate PO ratification via a distinct Execution Authorization Act; clarifications UPD-S4-EXEC-01…04 are incorporated for document preparation only  
**Nature:** **GOVERNANCE / DOCUMENTATION ONLY.** Translates the ratified Stage 4 IA, ratified OQ-S4-01…07 dispositions, accepted VMP-1 baseline, and readiness evidence into a bounded **executable** implementation authorization **proposal**. Does **not** authorize coding. Does **not** create branches. Does **not** modify the Decision Register. Does **not** modify application source or tests. Does **not** stage, commit, push, merge, or integrate into `main`. Does **not** create or sign `D-CONN04-FULL-D-IA-S4-EXEC`.

```text
DOCUMENT STATUS: DRAFT — NOT RATIFIED
GOVERNING ARCHITECTURE / SCOPE IA: D-CONN04-FULL-D-IA-S4 (RATIFIED — DOCUMENT AND SCOPE ONLY)
PROPOSED EXECUTION ACT ID: D-CONN04-FULL-D-IA-S4-EXEC (NOT CREATED / NOT RATIFIED)
ARCHITECTURE / SCOPE RATIFICATION: ALREADY COMPLETED (D-CONN04-FULL-D-IA-S4)
VMP-1 BASELINE ACCEPTANCE: ALREADY COMPLETED (D-CONN04-FULL-D-IA-S4-VMP1-BASELINE-ACCEPT)
OQ-S4-02: SATISFIED
PACKAGE SHAPE: PS-A ADOPTED FOR THIS DRAFT (UPD-S4-EXEC-01) — ONE INTEGRATED PACKAGE
IMPLEMENTATION BRANCH (IF LATER AUTHORIZED): impl/fiv-conn-04-d-stage-4 FROM e6b839e0… (UPD-S4-EXEC-02) — NOT CREATED
STAGE 4 EXECUTION AUTHORIZATION: NOT RATIFIED
STAGE 4 IMPLEMENTATION / CODING: NOT AUTHORIZED BY THIS DRAFT
STAGE 5–8 / ENV UPDATE / BACKFILL / E / PRODUCTION / LIVE CAPITAL: NOT AUTHORIZED
PUSH / MERGE / MAIN INTEGRATION: NOT AUTHORIZED
NO AUTOMATIC PROGRESSION
```

---

## 0. Status distinctions (mandatory)

| Layer | Decision / artifact | Status under this draft |
| --- | --- | --- |
| Stage 4 architecture and scope ratification | `D-CONN04-FULL-D-IA-S4` | **ALREADY COMPLETED** — document/scope only |
| VMP-1 Git baseline acceptance (OQ-S4-02) | `D-CONN04-FULL-D-IA-S4-VMP1-BASELINE-ACCEPT` | **ALREADY COMPLETED** — baseline prerequisite **SATISFIED** |
| This document | Stage 4 **execution** authorization **draft** (clarifications UPD-S4-EXEC-01…04 incorporated) | **DRAFT ONLY** — **NOT RATIFIED** — **NOT** coding authority |
| Future Execution Authorization Act | Proposed ID **`D-CONN04-FULL-D-IA-S4-EXEC`** (UPD-S4-EXEC-03) | **NOT CREATED** — **NOT RATIFIED** |
| Package shape (UPD-S4-EXEC-01) | **PS-A** — one integrated package S4-WP-1…3 | **ADOPTED for this draft’s scope**; does **not** authorize coding |
| Implementation branch (UPD-S4-EXEC-02) | `impl/fiv-conn-04-d-stage-4` from accepted baseline SHA | **MANDATORY if coding is later authorized** — **NOT CREATED** by this draft |
| Stage 4 implementation / coding | Requires separate ratified `D-CONN04-FULL-D-IA-S4-EXEC` (or equivalent) that **explicitly** grants coding | **NOT AUTHORIZED** |
| Stage 4 delivery Independent Review | Future, after implementation | **NOT STARTED** |
| Stage 4 formal closure | Future separate PO act (distinct from EXEC) | **NOT AUTHORIZED / NOT PERFORMED** |
| Stage 5 and later | Separate later authorizations | **NOT AUTHORIZED** |

**Interpretation rule:** Incorporating UPD-S4-EXEC-01…04 into this draft prepares the document for future ratification. It does **not** ratify the draft and does **not** authorize coding. Coding may begin only after the Product Owner issues a **separate** ratified Execution Authorization Act (proposed ID `D-CONN04-FULL-D-IA-S4-EXEC`) that **explicitly** grants Stage 4 implementation, and only after the approved Git lineage is verified.

**Decision identifier note:** Architecture/scope ratification remains **`D-CONN04-FULL-D-IA-S4`**. The future Execution Authorization Act is proposed as a **distinct** decision ID **`D-CONN04-FULL-D-IA-S4-EXEC`** (UPD-S4-EXEC-03). That Act is **not** created, signed, or ratified by this draft. Baseline acceptance remains **`D-CONN04-FULL-D-IA-S4-VMP1-BASELINE-ACCEPT`**. Stage 4 delivery review / closure remains a **later** separate PO decision.

---

## 1. Decision identification (proposed)

| Field | Value |
| --- | --- |
| **Project** | FIV-CONN-04-D |
| **Wave** | 6 — Live Trading |
| **Governing architecture / scope IA** | **`D-CONN04-FULL-D-IA-S4`** (ratified — document/scope only) |
| **Proposed Execution Authorization Act ID** | **`D-CONN04-FULL-D-IA-S4-EXEC`** (UPD-S4-EXEC-03 — proposed; Act not created) |
| **Document title** | Stage 4 Implementation Execution Authorization Draft |
| **Decision authority** | Product Owner (sole Project Owner) |
| **Document status** | **DRAFT — NOT RATIFIED** (UPD-S4-EXEC-04) |
| **Package shape (draft scope)** | **PS-A** — integrated S4-WP-1…3 (UPD-S4-EXEC-01) |
| **Implementation status** | **NOT AUTHORIZED** |
| **Decision date (drafting / clarification)** | 2026-10-30 |
| **Effective as coding authority** | **Never**, unless and until a separate explicit PO Execution Authorization Act (`D-CONN04-FULL-D-IA-S4-EXEC` or equivalent) is ratified **and** that Act explicitly grants coding |

---

## 2. Governing sources inspected (verified paths and hashes)

All paths and hashes below were verified against the repository at draft creation. Do not treat older session reports as authoritative if bytes change later.

| # | Role | Path | Verified SHA-256 |
| --- | --- | --- | --- |
| A | Parent Full-D Implementation Authorization (esp. §8 Stage 4) | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization.md` | `2c6890ba0e2ed3fe08b1ee84ee20df787eae814b8728465fff5a939356b9c1ee` |
| B | Ratified Stage 4 IA package (architecture/scope) | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-4-implementation-authorization-draft.md` | `a28d5dd3ca6711261ad166d0c87a5c47f84b7241a8cc176afacfd73deaa08004` |
| C | Stage 4 PO Ratification Act (OQ-S4-01…07) | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-4-po-ratification-act.md` | `c1ded3318efd5ef0d775b3dadbc2f435350877c8228383e9b1f69aa5b1ab414e` |
| D | VMP-1 baseline PO Acceptance Act | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vmp-1-baseline-po-acceptance.md` | `2b4336235a9892a59d4308ef2dabf7abc1c41f6c0ae9707a594f4206fee79992` |
| E | Wave 6 PO Decision Register | `docs/project/version-3/wave-6/wave-6-po-decision-register.md` | `6faf5c0f227dbe387956b99e2f13c428fdaa8f1a0cd802cd2f79d6b6f2781dde` |
| F | Port IA (VMP-1) | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vault-metadata-port-implementation-authorization-draft.md` | `18e177ef154b8a35dc333faefa05c73729150c3822e78818fdc85bfe45db89e6` |
| G | Port IA Ratification | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vault-metadata-port-po-ratification-draft.md` | `7e38e65996a87ec3b60d6f913a739a59e752641304d9a7df3c2357fa46693f14` |
| H | VMP-1 Formal Closure | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vmp-1-po-closure-decision.md` | `fec93bb581dc2771b9dd9690be124e56e4415702fe95a831cdabd8c391374670` |
| I | Stage 3 Formal Closure | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-3-po-closure-decision.md` | `a28599dd6fe8a45cc3753c1ab6304ea6eb75c7a88363088b1572a644c51f9dc0` |

**Code / test contracts inspected (read-only):**  
`Conn04SystemJobMigrationEntry`, `lookupVaultMetadataForConnection`, `FivConn04DVaultMetadataPort` / service / module, `classifyFivConn04LiveConnection`, `FivConn04LiveSlotOccupancy`, `FivConn04APreflightService.findLiveStrategyBOccupant`, `FivConn04DEnvironmentBackfillWrite.assertWriteAuthorityInTransaction`, `Conn04MigrationBoundaryService.assertWriteAuthority`, and related Stage 3 / VMP-1 / C / A specs.

### 2.1 Explicit source supersession (do not silently reconcile)

| Topic | Parent Full-D IA (§7.0 / historical Stage 4 text) | Ratified Stage 4 / Successor-01 / VMP-1 |
| --- | --- | --- |
| D Entry freshness Vault path | Describes `SecretVaultService.list` + exact-id match | **Superseded** for D Entry freshness: use ratified VMP-1 port/seam (`lookupExact` / `lookupVaultMetadataForConnection`) — **not** human `SecretVaultService.list` |
| Occupancy Nest product module | No dedicated occupancy Nest port (FACT retained) | Retained; **OQ-S4-03 Option A** = module-local D-path helper |
| Stage 4 vs Stage 5 | Stage 4 freshness; Stage 5 owns env UPDATE | Retained and **ratified** (**OQ-S4-04 Option A**) |

This draft binds to the **ratified Stage 4 IA + OQ dispositions + VMP-1 supersession**. Parent Full-D IA §8 Stage 4 objective remains authoritative for the freshness-loop *purpose*; Vault *mechanism* for D Entry follows Successor-01 / VMP-1 / Stage 4 ratification.

---

## 3. Ratified OQ dispositions (preserved exactly)

From Stage 4 PO Ratification Act (`c1ded331…414e`):

| OQ | Product Owner decision | Status in this draft |
| --- | --- | --- |
| **OQ-S4-01** | Stage 4 requires its own separate IA ratification before Stage 4 coding | Preserved — architecture/scope ratification done; **execution** grant still separate |
| **OQ-S4-02** | Option C — clean/reviewed/attributable VMP-1 Git baseline mandatory before coding | **SATISFIED** by accepted commit `e6b839e0e7d75322d9626162712fa81f61147d18` |
| **OQ-S4-03** | Option A — module-local D-path occupancy helper | **Binding** for Stage 4 execution |
| **OQ-S4-04** | Option A — preserve Stage 4 / Stage 5 boundary; no env UPDATE in Stage 4 | **Binding** |
| **OQ-S4-05** | Option A — defer `vaultSecretId` audit-key question to Stage 5 or separate PO decision | **Binding**; F-OBS-01 remains **OPEN** |
| **OQ-S4-06** | Option A — A Preflight candidate set informational only; not write authority | **Binding** |
| **OQ-S4-07** | Adopt IA identifier `D-CONN04-FULL-D-IA-S4` | Preserved |

---

## 4. Accepted VMP-1 baseline and required Git lineage

| Field | Value |
| --- | --- |
| **Accepted commit** | `e6b839e0e7d75322d9626162712fa81f61147d18` |
| **Parent** | `a59c533977923a45413a176ad143325a948feeb8` |
| **Branch (evidence locus)** | `baseline/vmp-1-runtime` |
| **Acceptance decision** | `D-CONN04-FULL-D-IA-S4-VMP1-BASELINE-ACCEPT` |
| **OQ-S4-02** | **SATISFIED** |

### 4.1 Binding lineage rules (UPD-S4-EXEC-02)

1. The accepted commit SHA **`e6b839e0e7d75322d9626162712fa81f61147d18`** is the **immutable baseline evidence** of the attributable VMP-1 runtime set. A branch **name** or branch **tip** is **not** immutable evidence.
2. The evidence locus branch `baseline/vmp-1-runtime` and its accepted commit must **remain unchanged** by Stage 4 work. Stage 4 must **not** commit onto `baseline/vmp-1-runtime`.
3. If Stage 4 implementation is separately authorized later, coding must occur on a **distinct** implementation branch named exactly:
   **`impl/fiv-conn-04-d-stage-4`**
   created **from** the accepted baseline commit `e6b839e0e7d75322d9626162712fa81f61147d18`.
4. The implementation branch must preserve **traceable ancestry** to that accepted SHA (it is a direct child or demonstrable descendant lineage starting at that SHA).
5. Before coding begins (if authorized), the exact implementation branch name and starting SHA must be **verified**: branch = `impl/fiv-conn-04-d-stage-4`; start = `e6b839e0e7d75322d9626162712fa81f61147d18`.
6. The original dirty `main` worktree must **not** be used as the sole or implicit VMP-1 implementation baseline.
7. **No implementation branch is created by this documentation-only draft.** Existence of a branch name requirement does **not** authorize coding.
8. **No merge into `main`** is authorized by this draft.

### 4.2 Implementation branch (mandatory if coding is later authorized — not created now)

| Item | Binding | Status under this draft |
| --- | --- | --- |
| Branch name | `impl/fiv-conn-04-d-stage-4` | **MANDATORY** for any later-authorized Stage 4 coding (UPD-S4-EXEC-02) |
| Create from | `e6b839e0e7d75322d9626162712fa81f61147d18` | Binding |
| Distinct from | `baseline/vmp-1-runtime` | Required |
| Immutable evidence | Accepted **commit SHA** only | Branch tip is not immutable evidence |
| Created by this draft? | **No** | Branch creation **NOT** performed and **NOT** authorized here |
| Branch existence alone authorizes coding? | **No** | Coding requires ratified `D-CONN04-FULL-D-IA-S4-EXEC` (or equivalent) that explicitly grants it |

---

## 5. Binding Stage 4 objective and per-attempt sequence

### 5.1 Objective

Implement and prove the **per-attempt freshness / write-authority proof path** required by Full-D IA §8 Stage 4 and **IMPL-REV-D-06**, as specialized by the ratified Stage 4 IA:

> Immediately before each write attempt: trusted Connection binding → fresh Vault metadata (VMP-1) → typed occupancy → re-invoke C → only then existing B-04 write-authority controls.

**Excluded:** treating A Preflight `ELIGIBLE_LIVE` or any stale batch/preflight pass as write authority.

**Stop condition:** skipping per-attempt proof.

### 5.2 Mandatory per-attempt order (outside the write transaction)

1. **Establish trusted Connection binding** for the attempt (load/re-read as required; same Connection for all fields used by Vault, occupancy, and C).
2. **Obtain fresh Vault metadata** via ratified VMP-1 port/seam (`lookupExact` / Entry `lookupVaultMetadataForConnection`), including blank-ID pre-Port zero-I/O validation.
3. **Resolve typed occupancy** as `FivConn04LiveSlotOccupancy` via the module-local D-path helper (**OQ-S4-03 Option A**) — only after successful Vault metadata obtain for this attempt.
4. **Re-invoke** `classifyFivConn04LiveConnection` with complete current inputs (trusted Connection + fresh Vault meta + occupancy).
5. **Only if** preceding checks permit write-eligible disposition under Full-D rules, proceed through **existing** B-04 write-authority controls (`proveWriteAuthority` / `assertWriteAuthorityInTransaction` → `Conn04MigrationBoundaryService.assertWriteAuthority`).

A Preflight `ELIGIBLE_LIVE` is **informational only** and is **never** write authority (**OQ-S4-06**).

---

## 6. Work packages (minimum planning decomposition)

**Package shape (UPD-S4-EXEC-01):** **PS-A adopted for this draft** — one **integrated** Stage 4 implementation package covering **S4-WP-1 + S4-WP-2 + S4-WP-3** together. The integrated package must prove the complete Stage 4 sequence **end-to-end**. Internal work-package checkpoints and stop gates remain **mandatory**, but **no** intermediate work package may be treated as independently granting Stage 4 completion or write authority.

Content below remains binding for *what* Stage 4 must achieve once separately authorized. Adoption of PS-A in this draft does **not** authorize coding.

### 6.1 S4-WP-1 — Trusted Connection and fresh Vault metadata

| Requirement | Binding content |
| --- | --- |
| Trusted Connection load/re-read | Stage 4 must **explicitly** establish trusted Connection loading/re-reading. The VMP-1 Entry seam **does not** load or re-validate Connection persistence. |
| Same-Connection binding | Derive `workspaceId` and `vaultSecretId` from the **same** trusted Connection only. |
| Untrusted overrides | Never accept HTTP/DTO/job-payload overrides or field mixing across Connections. |
| Blank-ID pre-Port validation | Missing/blank/prevalidated-invalid identifiers → fail closed **before** Port/repository calls; **zero** Port calls; **zero** repository metadata calls. |
| VMP-1 usage | `FivConn04DVaultMetadataPort.lookupExact` / Entry `lookupVaultMetadataForConnection`. |
| Freshness | Per-attempt fresh metadata lookup; no stale preflight/batch substitution. |
| Projection | Exact four-field view `{ id, workspaceId, purpose, state }` only. |
| Fail-closed | Consume `NOT_FOUND` / `UNAVAILABLE` / `INVALID` without proceeding as fresh-eligible; distinguish Port `INVALID` from blank-ID zero-I/O. |
| Forbidden | Ciphertext/plaintext/decryption exposure; `SecretVaultService.list` for D Entry freshness; direct repository inject for D freshness outside the ratified port path. |

### 6.2 S4-WP-2 — Typed occupancy (OQ-S4-03 Option A)

| Requirement | Binding content |
| --- | --- |
| Form | **Module-local D-path occupancy helper** only. |
| Governing contract | Existing C occupancy type `FivConn04LiveSlotOccupancy` and A Preflight query algorithm semantics (`findLiveStrategyBOccupant` projection), without exporting A Preflight as authority. |
| States | `verified_vacant` / `occupied` (+ `occupantId`) / `unavailable`. |
| Fail-closed | Read or verification failure → `unavailable`; **never** interpret `unavailable` as vacant. |
| Authority | A Preflight candidate set / `ELIGIBLE_LIVE` is **not** write authority. |
| Forbidden | New shared occupancy Nest product module; unapproved public export or cross-module authority expansion. |

### 6.3 S4-WP-3 — C reclassification and existing B-04 authority

| Requirement | Binding content |
| --- | --- |
| C re-invoke | Call `classifyFivConn04LiveConnection(connection, vaultMeta, occupancy)` after fresh Vault + occupancy. |
| Inputs | Complete, current, trusted Connection + fresh Vault meta + occupancy from this attempt. |
| Non-eligible | Stop before eligible B-04 write-authority proof; no env UPDATE. |
| B-04 | Existing lease/fence/CAS controls remain authoritative; Stage 3 scaffold reuse only. |
| Forbidden | Bypass, replacement, or redesign of B-04; Nest DI treated as authorization (VMP1-OBS-03). |

### 6.4 Explicitly out of Stage 4 (all packages)

- `Connection.environment` UPDATE  
- Full-D backfill execution / completion / `runEnvironmentBackfill` implementation  
- Stage 5–8 behavior  
- FIV-CONN-04-E  
- Production deployment / live capital / production execution  
- Remediation of F-OBS-01…04, S3-OBS-01…03, or VMP1-OBS-01…03 as Stage 4 scope  

---

## 7. Package shape — UPD-S4-EXEC-01 **ADOPTED (PS-A)** for this draft

### 7.1 Decision recorded

| Field | Value |
| --- | --- |
| **Decision ID (clarification)** | **UPD-S4-EXEC-01** |
| **Adopted option** | **PS-A — one integrated Stage 4 implementation package** |
| **Coverage** | **S4-WP-1 + S4-WP-2 + S4-WP-3** together |
| **End-to-end requirement** | The package must prove the complete Stage 4 sequence (Trusted Connection → Vault → occupancy → C → B-04) end-to-end |
| **Internal checkpoints** | Mandatory stop gates between WP checkpoints remain; useful for review and fail-closed stops |
| **Intermediate authority** | **Forbidden:** treating any intermediate WP as independently completing Stage 4 or granting write authority |
| **Effect on coding** | **None** — adoption for this draft does **not** ratify execution or authorize implementation |

### 7.2 Alternatives considered (historical; not selected)

| Option | Description | Status |
| --- | --- | --- |
| **PS-A** | Single integrated package | **ADOPTED** (UPD-S4-EXEC-01) |
| **PS-B** | Separate packages for S4-WP-1, S4-WP-2, S4-WP-3 | **Not selected** |

### 7.3 Binding consequences under PS-A

1. One Stage 4 delivery Independent Review gate for the integrated package (after later-authorized implementation).  
2. One Stage 4 formal closure decision (future; distinct from `D-CONN04-FULL-D-IA-S4-EXEC`).  
3. Incomplete Vault-only or occupancy-only delivery is **not** Stage 4 complete.  
4. Existing Stage 4 / Stage 5 boundaries and acceptance criteria (§8, §11) remain intact.

---

## 8. Stage 4 / Stage 5 boundary (explicit prohibitions)

Stage 4 **must not**:

1. Perform `Connection.environment` UPDATE (or any equivalent mutation that sets environment).  
2. Execute or complete Full-D backfill.  
3. Implement or invoke `runEnvironmentBackfill` as Stage 4 delivery.  
4. Introduce an alternate route that indirectly performs Stage 5 behavior.  
5. Claim Stage 5–8, E, production, deployment, or live-capital authority.  
6. Bypass existing B-04 lease/fence/CAS controls.  
7. Treat Nest DI resolution as production authorization.  
8. Treat A Preflight candidate sets or `ELIGIBLE_LIVE` as write authority.

Stage 4 **may** establish and test the freshness + write-authority **proof path** only, including fail-closed dispositions for ineligible / unavailable / vault-miss classes **without** performing env UPDATE.

---

## 9. Open observations and accepted residuals (preserved)

### 9.1 F-OBS-01…04 — remain OPEN

| ID | Meaning (as recorded) | Stage 4 treatment |
| --- | --- | --- |
| **F-OBS-01** | Helper refuses payload key `vaultSecretId` (`/secret/i`) | **OPEN**; **not** Stage 4 remediation scope; **OQ-S4-05** defers audit-key question |
| **F-OBS-02** | Helper allowlist includes §13 run counters | **OPEN**; non-blocking residual |
| **F-OBS-03** | No dedicated security-audit-classification.spec | **OPEN**; non-blocking residual |
| **F-OBS-04** | `connections.module.ts` dirty attribution hygiene | **OPEN**; if Stage 4 must touch the file, preserve attribution hygiene |

Do **not** expand Stage 4 into shared audit-helper changes.

### 9.2 S3-OBS-01…03 — ACCEPTED / REMAIN RECORDED

Do not reopen or silently mark remediated.

### 9.3 VMP1-OBS-01…03 — ACCEPTED BY PO (not remediated)

| ID | Meaning | Stage 4 treatment |
| --- | --- | --- |
| **VMP1-OBS-01** | Port IA draft-banner artifact residual | Preserve; do not claim remediated |
| **VMP1-OBS-02** | `connections.module.ts` historical attribution context | Preserve; attribution hygiene for Stage 4 touches |
| **VMP1-OBS-03** | Nest DI educational composition only — **not** AuthZ | **Mandatory control:** Stage 4 evidence must not present Nest DI as authorization; include DI-resolution evidence and negative boundary tests |

Also preserve the known dedicated metadata module private repository re-provision residual (Nest educational DI class). Baseline acceptance and final audit did **not** remediate these observations.

### 9.4 Classification for Stage 4 readiness

| Class | Items |
| --- | --- |
| **Accepted residual risks** | F-OBS-01…04 OPEN; S3-OBS / VMP1-OBS accepted; Nest DI residual |
| **Non-blocking recommendations** | Prefer not touching shared audit helpers; careful attribution if module file changes |
| **Mandatory implementation controls** | Freshness order; blank-ID zero-I/O; occupancy unavailable fail-closed; B-04 no bypass; Stage 5 negatives; DI ≠ AuthZ |
| **Actual blockers to coding now** | Lack of a ratified separate Execution Authorization Act (`D-CONN04-FULL-D-IA-S4-EXEC` or equivalent) that **explicitly** grants Stage 4 coding; this draft remains **NOT RATIFIED** |

OPEN observations are **not** automatic implementation blockers unless the Product Owner elevates them.

---

## 10. Failure semantics (Stage 4 proof path)

Inherited from Full-D IA §11.1 and ratified Stage 4 IA; **no env UPDATE**:

| Failure class | Stage 4 proof-path behavior | Continue other attempts? |
| --- | --- | --- |
| Blank-ID rejected before Port | Fail closed; stop attempt; **zero** Port/repository metadata I/O; no B-04 eligible proof | Per Full-D attempt matrix (do not invent new batch-abort) |
| Port `NOT_FOUND` | Fresh Vault metadata lookup returns `NOT_FOUND`; attempt fails closed / skipped; **do not** run occupancy for this attempt; **do not** run C reclassification for this attempt; no eligible B-04 write-authority proof; **no** env UPDATE. Port `NOT_FOUND` is **not** a C classification result. | **YES** |
| Port `UNAVAILABLE` (systemic) | Batch-abort class; no UPDATE | **NO** |
| Port `INVALID` | Fail closed; stop attempt; **do not** claim blank-ID zero-I/O; no occupancy/C/B-04 eligible progression | Attempt fail-closed (do not invent success) |
| Occupancy `occupied` | Attempt skip/fail-closed; no UPDATE | **YES** |
| Occupancy `unavailable` | Batch-abort class; never vacant; no UPDATE | **NO** |
| C non-eligible after reclassification | Fresh Vault metadata lookup **succeeded**; typed occupancy resolution succeeded sufficiently to supply the current occupancy input to C; C was re-invoked with complete current trusted inputs and returned a non-eligible disposition; attempt fails closed / skipped; stop **before** eligible B-04 write-authority proof; **no** env UPDATE. This class occurs **after** Vault and occupancy — **not** before them. | **YES** |
| B-04 write-authority fail | Stop subsequent attempts; no UPDATE | **NO** |

**Mandatory distinctions:** occupancy collision ≠ unavailable; blank-ID precondition ≠ Port `INVALID`; Port `NOT_FOUND` ≠ C non-eligible after reclassification.

---

## 11. Required test and evidence plan (requirements only — no test implementation)

### 11.1 Freshness and ordering

- Prove per-attempt Vault metadata lookup via VMP-1 path.  
- Prove occupancy resolution occurs **after** successful fresh Vault metadata for the attempt.  
- Prove C reclassification occurs **after** Vault + occupancy.  
- Prove stale preflight / batch `ELIGIBLE_LIVE` cannot substitute for write authority.

### 11.2 Zero-I/O and fail-closed

- Blank/missing identifiers rejected before Port/repository calls with **zero** Port and repository metadata I/O.  
- Port `INVALID` fail-closed **without** asserting blank-ID-style zero-I/O.  
- `NOT_FOUND` / `UNAVAILABLE` / `INVALID` stop safely per §10.  
- Occupancy read/verify failure → `unavailable`, never vacant.

### 11.3 C and B-04

- Non-eligible C outcomes stop before eligible B-04 proof.  
- Eligible outcomes still pass through existing B-04 controls.  
- No lease/fence/CAS bypass.  
- Nest DI not treated as authorization (negative + evidence).

### 11.4 Stage 5 negative boundaries

- No `Connection.environment` UPDATE.  
- No Full-D backfill execution.  
- No `runEnvironmentBackfill` implementation.  
- No Stage 5+ behavior.  
- No Preflight-as-write-authority behavior.

### 11.5 Acceptance criteria (qualitative)

| Criterion | Required evidence |
| --- | --- |
| Sequence integrity | Tests and/or source inspection proving Vault → occupancy → C → B-04 order |
| VMP-1 reuse | No `SecretVaultService.list` on D Entry freshness path |
| Occupancy Option A | Module-local helper; typed `FivConn04LiveSlotOccupancy`; no new Nest occupancy product module |
| B-04 integrity | Existing assertWriteAuthority path invoked; no parallel façade |
| Boundary integrity | Negative tests / source walls for env UPDATE / backfill / public export walls |
| Lineage integrity | Implementation branch ancestry verified to accepted baseline SHA |
| Observation integrity | F-OBS / S3-OBS / VMP1-OBS statuses unchanged unless separate PO act |

No numeric performance thresholds are invented.

---

## 12. Likely implementation surface (inspection-based; no code changes)

| Path / symbol | Change likelihood | Why | Governing contract |
| --- | --- | --- | --- |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts` (`Conn04SystemJobMigrationEntry`) | **Confirmed likely required** | Orchestrate trusted Connection binding + per-attempt Vault → occupancy → C → existing B-04 proof | Stage 4 IA; Full-D §8; IMPL-REV-D-06 |
| New module-local occupancy helper under `connections/` | **Confirmed likely required** | OQ-S4-03 Option A; typed occupancy mapping | Stage 4 IA §6.3; C occupancy type; A query semantics |
| `apps/api/src/modules/connections/connections.module.ts` | **Possible only** | Only if helper/providers require Nest wiring; preserve export walls; attribution hygiene | COND-IA-03; F-OBS-04 / VMP1-OBS-02 |
| `fiv-conn-04-live-classifier.ts` | **REUSE expected** (change not required by IA) | C + occupancy types already public | IMPL-REV-C-01 |
| `fiv-conn-04-a-preflight.service.ts` | **REUSE informational** (do not widen as authority) | Candidate discovery only (OQ-S4-06) | COND-IA-05 |
| VMP-1 port/service/module | **REUSE** (change not required for Stage 4 freshness mechanism) | Already accepted baseline | Port IA / VMP-1 closure |
| Stage 3 write-unit / boundary | **REUSE** | B-04 proof path | Stage 3 closure; COND-IA-02 |
| New/extended Stage 4 specs (Entry / freshness / occupancy / walls) | **Confirmed likely required** | Evidence plan §11 | IMPL-REV-D-06; Stage 4 IA |

Do **not** treat “possible” rows as mandatory file edits. Do **not** modify A Preflight product surface solely to satisfy Stage 4 occupancy (Option A forbids that path).

---

## 13. Independent Review and closure (future gates)

If Stage 4 implementation is later authorized and delivered, the following remain **mandatory and separate**:

1. Implementation evidence and test results against §11.  
2. Independent Review (IR) separate from implementation.  
3. IR review of scope conformance and all required negative assertions.  
4. Resolution **or** explicit PO acceptance of any new findings.  
5. A **separate** Stage 4 formal closure decision by the Product Owner.

**Stage 5 must not be considered** until Stage 4 is formally closed. This draft grants **no** Stage 5 authority.

---

## 14. Authorization gate (current state)

```text
STAGE 4 ARCHITECTURE / SCOPE (D-CONN04-FULL-D-IA-S4): RATIFIED — DOCUMENT AND SCOPE ONLY
VMP-1 BASELINE (D-CONN04-FULL-D-IA-S4-VMP1-BASELINE-ACCEPT): ACCEPTED
OQ-S4-02: SATISFIED (immutable commit e6b839e0e7d75322d9626162712fa81f61147d18)
PACKAGE SHAPE: PS-A ADOPTED FOR THIS DRAFT (UPD-S4-EXEC-01) — INTEGRATED S4-WP-1…3
IMPLEMENTATION BRANCH IF LATER AUTHORIZED: impl/fiv-conn-04-d-stage-4 FROM e6b839e0… (UPD-S4-EXEC-02) — NOT CREATED
PROPOSED EXECUTION ACT ID: D-CONN04-FULL-D-IA-S4-EXEC (UPD-S4-EXEC-03) — NOT CREATED / NOT RATIFIED
THIS EXECUTION AUTHORIZATION DRAFT: NOT RATIFIED (UPD-S4-EXEC-04)
STAGE 4 IMPLEMENTATION / CODING: NOT AUTHORIZED
STAGE 5–8: NOT AUTHORIZED
CONNECTION.ENVIRONMENT UPDATE: NOT AUTHORIZED
FULL-D BACKFILL: NOT AUTHORIZED
FIV-CONN-04-E / PRODUCTION / DEPLOYMENT / LIVE CAPITAL: NOT AUTHORIZED
PUSH / MERGE / REBASE / MAIN INTEGRATION: NOT AUTHORIZED
NO AUTOMATIC PROGRESSION
```

### 14.1 Preconditions before any coding may begin

Implementation may begin **only after all** of the following:

1. This draft has been reviewed; any further corrections required by the Product Owner are applied.  
2. The Product Owner issues a **separate** Execution Authorization Act with its own decision ID — proposed **`D-CONN04-FULL-D-IA-S4-EXEC`** (UPD-S4-EXEC-03) — that is **distinct** from `D-CONN04-FULL-D-IA-S4`, from `D-CONN04-FULL-D-IA-S4-VMP1-BASELINE-ACCEPT`, and from any Stage 4 delivery review / closure decision.  
3. That Act **explicitly** states that Stage 4 implementation is authorized, and records exact scope, baseline SHA `e6b839e0e7d75322d9626162712fa81f61147d18`, branch `impl/fiv-conn-04-d-stage-4`, package shape **PS-A**, and prohibited actions.  
4. The implementation branch `impl/fiv-conn-04-d-stage-4` is created **from** the accepted baseline SHA and verified before coding (branch creation is **not** authorized by this draft alone).  
5. No coding occurs on `baseline/vmp-1-runtime` or dirty `main` as the Stage 4 implementation locus.

Preparation or clarification of this draft is **not** implementation permission. Ratification of architecture/scope IA and baseline acceptance are **not** implementation permission. Existence of the required branch name is **not** implementation permission.

### 14.2 UPD-S4-EXEC-01…04 disposition (incorporated into this draft)

| ID | Decision | Status in this draft |
| --- | --- | --- |
| **UPD-S4-EXEC-01** | Package shape **PS-A** (integrated S4-WP-1…3) | **ADOPTED for draft scope** — does **not** authorize coding |
| **UPD-S4-EXEC-02** | Distinct branch `impl/fiv-conn-04-d-stage-4` from accepted SHA; SHA is immutable evidence | **ADOPTED as mandatory lineage rule** — branch **NOT CREATED** |
| **UPD-S4-EXEC-03** | Separate Execution Authorization Act ID **`D-CONN04-FULL-D-IA-S4-EXEC`** | **PROPOSED** — Act **NOT CREATED** / **NOT RATIFIED** |
| **UPD-S4-EXEC-04** | This document remains a **DRAFT**; clarifications do **not** ratify it | **IN FORCE** — Execution Authorization **NOT RATIFIED**; Stage 4 coding **NOT AUTHORIZED** |

OQ-S4-01…07 remain **already decided** and must not be reopened by this draft except by formal amendment.

### 14.3 Remaining gate before coding

| Gate | Status |
| --- | --- |
| Separate PO Execution Authorization Act (`D-CONN04-FULL-D-IA-S4-EXEC` or equivalent) that **explicitly** grants coding | **PENDING** — **NOT** performed by this task |
| Decision Register synchronization for that Act | **NOT AUTHORIZED** here |
| Branch creation | **NOT AUTHORIZED** here |

---

## 15. Explicit non-authorizations

This draft does **not** authorize:

- Source or test modifications  
- Branch or worktree creation (including `impl/fiv-conn-04-d-stage-4`)  
- Staging, commit, amend, push, merge, rebase  
- Integration into `main`  
- Stage 4 coding  
- Creation or signature of Execution Authorization Act `D-CONN04-FULL-D-IA-S4-EXEC`  
- Stage 5–8  
- `Connection.environment` UPDATE  
- Full-D backfill  
- FIV-CONN-04-E / production / deployment / live capital  
- Decision Register synchronization (requires later separate PO instruction)  
- Remediation of F-OBS / S3-OBS / VMP1-OBS  

---

## 16. Future Execution Authorization Act — template notes (NOT filled / NOT signed)

The future separate Act **`D-CONN04-FULL-D-IA-S4-EXEC`** (UPD-S4-EXEC-03) must, when the Product Owner chooses to issue it, explicitly record at minimum:

```text
PROPOSED DECISION / ACT ID: D-CONN04-FULL-D-IA-S4-EXEC
GOVERNING ARCHITECTURE / SCOPE IA: D-CONN04-FULL-D-IA-S4
PACKAGE SHAPE: PS-A (integrated S4-WP-1…3) — UPD-S4-EXEC-01
BASELINE SHA (IMMUTABLE): e6b839e0e7d75322d9626162712fa81f61147d18
IMPLEMENTATION BRANCH: impl/fiv-conn-04-d-stage-4 (created from baseline SHA; distinct from baseline/vmp-1-runtime)
STAGE 4 IMPLEMENTATION / CODING: [ ] AUTHORIZED  [ ] NOT AUTHORIZED
EXPLICIT SCOPE / PROHIBITED ACTIONS: (must restate Stage 4/5 boundary; no env UPDATE; no Full-D backfill; no Stage 5+)
DISTINCT FROM: D-CONN04-FULL-D-IA-S4; D-CONN04-FULL-D-IA-S4-VMP1-BASELINE-ACCEPT; Stage 4 delivery IR / closure
```

```text
CURRENT DOCUMENT (THIS DRAFT) STATUS:
  PRODUCT OWNER DECISION ON THIS DRAFT: NOT RATIFIED (UPD-S4-EXEC-04)
  EXECUTION AUTHORIZATION ACT D-CONN04-FULL-D-IA-S4-EXEC: NOT CREATED
  STAGE 4 IMPLEMENTATION / CODING: NOT AUTHORIZED
  BRANCH impl/fiv-conn-04-d-stage-4: NOT CREATED
```

Until the Product Owner creates and ratifies a separate Execution Authorization Act that **explicitly** grants coding authority, Stage 4 implementation remains **NOT AUTHORIZED**. Clarifications UPD-S4-EXEC-01…04 prepare this draft; they do **not** ratify it.

---

_End of Stage 4 Implementation Execution Authorization Draft. Architecture/scope under `D-CONN04-FULL-D-IA-S4` remains ratified. Proposed execution Act `D-CONN04-FULL-D-IA-S4-EXEC` is NOT created. This draft is NOT RATIFIED (UPD-S4-EXEC-04). Package shape PS-A recorded (UPD-S4-EXEC-01). Implementation branch rule recorded but branch NOT created (UPD-S4-EXEC-02). OQ-S4-02 SATISFIED by immutable commit `e6b839e0e7d75322d9626162712fa81f61147d18`. Stage 4 coding NOT AUTHORIZED._
