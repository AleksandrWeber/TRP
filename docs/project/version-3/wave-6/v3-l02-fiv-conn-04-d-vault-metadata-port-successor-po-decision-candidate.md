# FIV-CONN-04-D — Product Owner Decision Candidate

## Vault Metadata Port — Successor Selection After Stage 3 (Before Stage 4)

```text
DRAFT — PO DECISION CANDIDATE — NOT YET RATIFIED
CANDIDATE DECISION ID ONLY — NOT A RATIFIED DECISION
NOT IMPLEMENTATION AUTHORIZATION
DOES NOT AUTHORIZE PORT CODING
DOES NOT AUTHORIZE STAGE 4 COMMENCEMENT
DOES NOT AUTHORIZE STAGES 5–8
DOES NOT AUTHORIZE CONNECTION.ENVIRONMENT UPDATE
DOES NOT AUTHORIZE FULL-D BACKFILL EXECUTION
DOES NOT AUTHORIZE VAULT METADATA FRESHNESS IMPLEMENTATION
DOES NOT AUTHORIZE FIV-CONN-04-E
DOES NOT AUTHORIZE PRODUCTION / LIVE-CAPITAL OPERATIONS
NO AUTOMATIC PROGRESSION
DECISION REGISTER: NOT MODIFIED BY THIS CANDIDATE
ONLY THE PROJECT OWNER MAY RATIFY THIS DECISION
```

**Document:** Draft Product Owner Decision Candidate recording selection of the **Vault Metadata Port** as the next separate work package after FIV-CONN-04-D Stage 3 formal closure and **before** Stage 4.  
**Date (drafting):** 2026-10-30  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Authority:** Product Owner (sole Project Owner) — candidate prepared for PO review  
**Status:** **DRAFT — PO DECISION CANDIDATE — NOT YET RATIFIED**  
**Nature:** **GOVERNANCE / DOCUMENTATION ONLY — SUCCESSOR-SELECTION CANDIDATE.** Translates the Project Owner’s communicated successor direction into a precise, auditable decision candidate. Does **not** itself ratify the decision. Does **not** grant implementation authorization. Does **not** modify the Decision Register. Does **not** modify application source or tests. Does **not** stage, commit, or push.

---

## 1. Decision identification

| Field                           | Value                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Decision title**              | Vault Metadata Port — Successor Selection After Stage 3 (Before Stage 4)                                                                                      |
| **Candidate Decision / Act ID** | **`D-CONN04-FULL-D-IA-S23-B-VMP-SUCC`** — **CANDIDATE ID ONLY; NOT RATIFIED** (follows `D-CONN04-*` / Option B Stage 3 lineage naming; effective only if PO ratifies in a separate final act) |
| **Project**                     | FIV-CONN-04-D                                                                                                                                                 |
| **Wave**                        | 6 — Live Trading                                                                                                                                              |
| **Decision authority**          | Product Owner (sole Project Owner)                                                                                                                            |
| **Decision class**              | Successor-selection / governance direction only                                                                                                               |
| **Status**                      | **DRAFT — PO DECISION CANDIDATE — NOT YET RATIFIED**                                                                                                          |
| **Drafting date**               | 2026-10-30                                                                                                                                                    |
| **Ratification date**           | _Pending separate Product Owner ratification_                                                                                                                 |
| **Implementation authorization**| **NOT GRANTED** by this candidate                                                                                                                             |

### 1.1 Candidate ID naming note

The candidate ID `D-CONN04-FULL-D-IA-S23-B-VMP-SUCC` is proposed to preserve continuity with:

- parent Option B authorization `D-CONN04-FULL-D-IA-S23-B`;
- Stage 3 commencement `D-CONN04-FULL-D-IA-S23-B-S3`;
- Stage 3 formal closure `D-CONN04-FULL-D-IA-S23-B-S3-CLOSE`;

and to identify **Vault Metadata Port (VMP)** as the selected **successor** package. It is **not** an Implementation Authorization ID and must not be treated as one.

---

## 2. Explicit ratification boundary

| Statement                                                                                      | Binding for this candidate        |
| ---------------------------------------------------------------------------------------------- | --------------------------------- |
| The Project Owner has selected Vault Metadata Port as the next separate work package           | **Yes — recorded as PO direction** |
| This document is a draft decision candidate awaiting formal PO ratification                    | **Yes**                           |
| This document itself ratifies the decision                                                     | **No**                            |
| This document grants Vault Metadata Port implementation authorization                          | **No**                            |
| This document authorizes Stage 4 or any later stage                                            | **No**                            |
| Only the Product Owner may ratify this decision (separate final act + Decision Register sync)  | **Yes**                           |
| Decision Register may be updated by this draft                                                 | **No**                            |

```text
RATIFICATION STATUS: NOT YET RATIFIED
EFFECTIVE AUTHORIZATION: NONE
CODING AUTHORITY: NONE
REGISTER SYNC: NOT AUTHORIZED BY THIS DRAFT
```

---

## 3. Context

### 3.1 Current governance posture (preserved)

| Item                                                         | Current authoritative status (unchanged by this candidate)                                      |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Option B Stage 2–3 IA (`D-CONN04-FULL-D-IA-S23-B`)           | **APPROVED** — bounded Stage 2–3 scope                                                          |
| Stage 3 commencement (`D-CONN04-FULL-D-IA-S23-B-S3`)         | Historical commence authorization preserved                                                     |
| Stage 3 formal closure (`D-CONN04-FULL-D-IA-S23-B-S3-CLOSE`) | **APPROVED — STAGE 3 FORMALLY CLOSED**                                                          |
| Stage 3 IR verdict                                           | **PASS WITH OBSERVATIONS** — accepted under Stage 3 closure                                     |
| S3-OBS-01…S3-OBS-03                                          | **ACCEPTED / REMAIN RECORDED** (non-blocking)                                                   |
| F-OBS-01…F-OBS-04                                            | **OPEN** (unchanged)                                                                            |
| Successor-01 IA Amendment (`D-CONN04-PO-VAULT-B-IA-AMD-S01`) | **APPROVED AND RATIFIED** — architectural amendment only; **port coding NOT AUTHORIZED** by S01 |
| KO-COND-01 (`D-CONN04-KO-COND-01`)                           | **CLOSED / SATISFIED** (documentation-gate closure; itself did **not** grant IA)                |
| Stage 4 commencement                                         | **NOT AUTHORIZED**                                                                              |
| Stages 5–8 / env UPDATE / Full-D backfill execution / E / production / live capital            | **NOT AUTHORIZED**                                                                              |
| Wave 6 STOP / non-authorization restrictions                 | **Remain in force**                                                                             |

### 3.2 Project Owner direction (this candidate’s subject)

The Project Owner has selected:

**Vault Metadata Port as the next separate work package after FIV-CONN-04-D Stage 3 and before Stage 4.**

This is a **successor-selection** decision. It establishes successor **order** and governance direction only.

---

## 4. Source decisions and evidence (current repository)

All hashes below were recalculated against **current repository file bytes** at drafting. Per post-commit integrity reconciliation, historical recording-time seals embedded in prior acts may differ from current digests after Prettier / commit packaging; this candidate binds **current** digests and does **not** rewrite historical seals inside prior documents.

### 4.1 Mandatory source review

| #   | Artifact / role                                                                 | Path                                                                                                                                   | Current SHA-256                                                    |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | Stage 3 PO formal closure (`D-CONN04-FULL-D-IA-S23-B-S3-CLOSE`)                 | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-3-po-closure-decision.md`                                                   | `a28599dd6fe8a45cc3753c1ab6304ea6eb75c7a88363088b1572a644c51f9dc0` |
| 2   | Stage 3 Independent Review                                                      | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-3-independent-review.md`                                                     | `4f3ccaa093af768d63e829229c8aceaabea03a18733f7f340ce88e0c86b8542e` |
| 3   | Option B Implementation Authorization (`D-CONN04-FULL-D-IA-S23-B`)              | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization-option-b-po-decision.md`                              | `dbc7aea6d99328122c31818305011c11157a0e5cfab862d560cea757e4d550d4` |
| 4   | Full-D Implementation Authorization package                                     | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization.md`                                                   | `2c6890ba0e2ed3fe08b1ee84ee20df787eae814b8728465fff5a939356b9c1ee` |
| 5   | Successor-01 IA Amendment text (approved under S01)                             | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization-amendment-po-vault-b-final-candidate-successor-01.md` | `79386c9120e20c3a36648a869e6d196c7f6d96130b808006d723fac4e4ee8acb` |
| 6   | Wave 6 PO Decision Register (**read-only for this task**)                       | `docs/project/version-3/wave-6/wave-6-po-decision-register.md`                                                                         | `648b6bc8f7a071c4edeb2417616d50ceeeb566aef3e56101e525e7acbc08882b` |
| 7   | Post-commit integrity reconciliation                                            | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-post-commit-integrity-reconciliation.md`                                           | `6454398cc1949a197536ea4c7a879199a40fd8db26af8d1feca667bd46056f22` |

### 4.2 Additional Vault Metadata Port architecture / dependency evidence inspected

| Artifact                                                                 | Path                                                                                                                                   | Current SHA-256                                                    | Role                                                                                         |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Successor-01 approval / re-ratification (`D-CONN04-PO-VAULT-B-IA-AMD-S01`) | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-successor-01-approval-and-ratification.md`               | `cdba4ad50ab1691307ef94579669c4fa5c8a81ad0d30c9b44514e586c56fbc97` | Approves amendment; **explicitly does not** authorize port coding                            |
| Successor-01 independent delta review                                    | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-successor-01-independent-delta-review.md`                 | `1a82c942389307980736094cd34ab66dbfa838cd6bda5a7ed0bd33d18b2763ec` | Historical IR of amendment text                                                              |
| Stage 1 Alignment-to-Port                                                | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-1-vault-entry-alignment-to-port.md`                                          | `b1a420f08e21d8ccbcc96f5031fa52bfd6d8e9970a6bda9b2cecb453c2a342d6` | Design alignment under dedicated-port architecture                                           |
| Alignment-to-Port independent review                                     | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-1-vault-entry-alignment-to-port-independent-review.md`                       | `b03a39e01a4e5c1147c277b8862c3bd0b1e238312017583e1c2f9530cda04f3e` | IR of Alignment-to-Port                                                                      |
| KO-COND-01 formal closure (`D-CONN04-KO-COND-01`)                        | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-ko-cond-01-formal-closure-act.md`                                                  | `3a5c10bf1a0518dd2306410d2f4b3164daf69ae3db9dc9c28d0e8c0cc58fb2fe` | Closed documentation gate; **not** port IA                                                   |
| Stage 2 Independent Review (F-OBS carry-forward source)                  | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-2-independent-review.md`                                                     | `4300644c40f6af5c3fe1724eb33213ce3de248d34b371ad702fc98cb8bdcd470` | F-OBS-01…F-OBS-04 remain OPEN                                                                |

**Integrity note:** This candidate does **not** claim that current digests equal every historical seal printed inside earlier ratification acts. Binding decisions and IDs remain those of the prior acts; digests above identify current repository evidence used for this candidate.

---

## 5. Proposed decision (for PO ratification)

If the Product Owner **RATIFIES** this candidate in a separate final act, the ratified decision would establish:

### A. Decision

1. **Vault Metadata Port is selected as the next separate work package** for FIV-CONN-04-D after Stage 3.
2. That package **precedes Stage 4**.
3. **Stage 3 remains formally closed** under `D-CONN04-FULL-D-IA-S23-B-S3-CLOSE` (unchanged).
4. This decision establishes **successor order and governance direction only**.
5. A **separate** detailed Port Implementation Authorization package must still be prepared and approved before any port coding.

### B. Rationale (evidence-backed; no invented requirements)

#### B.1 Why a separate prerequisite package

Under ratified Successor-01 (`D-CONN04-PO-VAULT-B-IA-AMD-S01`) and the Full-D architecture:

1. **Dedicated infrastructure capability.** Successor-01 replaces the original Full-D IA Entry freshness dependency on human `SecretVaultService.list` + exact-id filter with a **dedicated internal Vault metadata-only port** (Nest Option A composition; Vault-owned module exporting the port only). That capability is an infrastructure delivery with its own inventory (port/types/token/service/module; repository compound metadata query; export walls; negative tests) — Successor-01 §§2–3, §6, §10–§12.
2. **Stage 4 is a later consumer.** Full-D IA Stage 4 is **per-attempt fresh Vault + occupancy + C** immediately before each write attempt (IMPL-REV-D-06). After Successor-01 S1–S4, D Entry metadata freshness for that path is intended to consume the dedicated port — **not** to invent the port inside Stage 4 coding.
3. **Already excluded from Option B Stage 2–3.** `D-CONN04-FULL-D-IA-S23-B` and Stage 3 closure explicitly leave Vault metadata port / freshness **NOT AUTHORIZED**. Stage 3 delivered authority/CAS scaffolding only.
4. **Architecture amendment ≠ coding grant.** `D-CONN04-PO-VAULT-B-IA-AMD-S01` approved Successor-01 as IA Amendment (S1–S4) and still recorded **PORT IMPLEMENTATION: NOT AUTHORIZED**. KO-COND-01 closure removed only the documentation-gate blocker and likewise did **not** grant coding authority.
5. **PO sequencing.** Selecting the port as a separate package **after Stage 3 and before Stage 4** keeps infrastructure capability delivery distinct from Stage 4 freshness-loop implementation and preserves fail-closed / dual-path stop rules (Successor-01 §1.3 precedence: do not follow both old `list` D Entry freshness and dedicated port paths).

#### B.2 Preserved distinction (mandatory)

| Concept                         | Meaning under existing sources                                                                                         | Timing under this candidate (if ratified)      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Vault Metadata Port**         | Infrastructure capability: metadata-only exact `(workspaceId, vaultSecretId)` lookup; Nest Option A; export walls      | Selected next separate package **before** Stage 4 |
| **Stage 4 freshness**           | Per-attempt consumer loop: fresh Vault metadata + occupancy + C before each write txn (Full-D Stage 4 / IMPL-REV-D-06) | Later; **not** authorized by this candidate    |

This candidate does **not** invent technical requirements beyond Successor-01 / Full-D IA / Alignment-to-Port evidence. Exact implementation detailing remains for a future Port Implementation Authorization package.

---

## 6. Selected successor

| Field                         | Value                                                                 |
| ----------------------------- | --------------------------------------------------------------------- |
| **Selected successor package**| **Vault Metadata Port**                                               |
| **Position in sequence**      | After Stage 3 formal closure; **before** Stage 4                      |
| **Governing amendment text**  | Successor-01 (approved under `D-CONN04-PO-VAULT-B-IA-AMD-S01`)        |
| **Package type**              | Separate work package (successor selection only under this candidate) |
| **Next required gate**        | Separate detailed **Port Implementation Authorization** (not this act)|

Proposed sequence (governance direction only):

```text
STAGE 3 FORMALLY CLOSED
  → [THIS CANDIDATE, IF RATIFIED] Vault Metadata Port selected as next package
  → Separate Port Implementation Authorization (future; not granted here)
  → Port delivery under that future authorization (not started here)
  → Separate Stage 4 authorization (future; not granted here)
  → Stages 5–8 / env UPDATE / backfill execution remain separately gated
```

---

## 7. Scope boundary

### 7.1 What ratification of this candidate would authorize

**Only:**

1. **Recognition** of Vault Metadata Port as the selected next separate work package after Stage 3 and before Stage 4.
2. **Preparation** of a separate detailed Port Implementation Authorization package for subsequent Product Owner review.
3. Preservation of Stage 3 formal closure and all prior decision IDs / STOP restrictions.

### 7.2 What this candidate does **NOT** authorize (even if later ratified as successor selection)

| Item                                                         | Status under this candidate                          |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| Vault Metadata Port coding / Nest / provider / repository implementation | **NOT AUTHORIZED**                          |
| Stage 4 coding or commencement                               | **NOT AUTHORIZED**                                   |
| Stages 5–8                                                   | **NOT AUTHORIZED**                                   |
| `Connection.environment` UPDATE                              | **NOT AUTHORIZED**                                   |
| Full-D backfill loop / execution                             | **NOT AUTHORIZED**                                   |
| Vault metadata **freshness** implementation (Stage 4 consumer loop) | **NOT AUTHORIZED**                            |
| FIV-CONN-04-E                                                | **NOT AUTHORIZED**                                   |
| Production activation / deployment / live-capital operations | **NOT AUTHORIZED**                                   |
| Automatic progression to any subsequent stage or package     | **FORBIDDEN**                                        |
| Decision Register mutation by this draft                     | **NOT AUTHORIZED**                                   |
| Closing / remediating F-OBS-01…F-OBS-04                      | **NOT AUTHORIZED**                                   |
| Silently closing S3-OBS-01…S3-OBS-03                         | **NOT AUTHORIZED**                                   |
| Reinterpreting or invalidating prior decision IDs listed in §9 | **FORBIDDEN**                                      |

```text
AUTHORIZED BY THIS CANDIDATE (IF RATIFIED): SUCCESSOR ORDER + IA-PACKAGE PREPARATION ONLY
NOT AUTHORIZED: PORT CODE · STAGE 4+ · ENV UPDATE · BACKFILL EXECUTION · FRESHNESS LOOP · E · PRODUCTION · LIVE CAPITAL
```

---

## 8. Preconditions for a future Port Implementation Authorization

A **separate** Port Implementation Authorization package must be prepared and approved before any port coding. This candidate does **not** itself satisfy those preconditions. The future package must contain, at minimum, evidence and decisions covering the items below. Items that cannot be fully bound from current sources are marked **OPEN** / **REQUIRES PO DECISION**.

### 8.1 Exact port scope and component inventory

| Requirement                                                                 | Source basis                                      | Status for future Port IA                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| Bind CREATE/MODIFY/NO CHANGE inventory for Vault-owned port/module/service/repository methods and tests | Successor-01 §10                                  | **REQUIRED** — use Successor-01 working inventory as basis     |
| Exact symbol/file spellings                                               | Successor-01 §4; S01 approval §5 (COND-IR-06)     | **DELEGATED TO ENGINEERING** under architectural intent; Port IA must record selected names and prove conformance — **not** invent a new PO naming freeze unless PO decides otherwise |
| Confirm exclusions (no ciphertext; no `SecretVaultService.list` for D Entry freshness; no port audit event) | Successor-01 §§6, 9, 13                           | **REQUIRED**                                                   |

### 8.2 Architecture and module boundaries

| Requirement                                                                 | Source basis                         | Status for future Port IA |
| --------------------------------------------------------------------------- | ------------------------------------ | ------------------------- |
| Nest Option A: dedicated Vault-owned module; export **port only**           | Successor-01 §3 Decision 1           | **REQUIRED**              |
| `SecretVaultModule` / human ACL / A Preflight `list` path unchanged for D port path | Successor-01 S4 / §3                 | **REQUIRED**              |
| Educational Nest DI limitation documented; not claimed as production S2S / Vault AuthZ proof | Successor-01 §8; TOKEN-SCOPE         | **REQUIRED**              |

### 8.3 Interfaces and contracts

| Requirement                                                                 | Source basis                | Status for future Port IA |
| --------------------------------------------------------------------------- | --------------------------- | ------------------------- |
| Metadata view exactly `{ id, workspaceId, purpose, state }`                 | Successor-01 §6.1           | **REQUIRED**              |
| Compound query `id + workspaceId` with narrow `select`                      | Successor-01 §6.2           | **REQUIRED**              |
| Result reasons `NOT_FOUND` / `UNAVAILABLE` / `INVALID`                      | Successor-01 §6.3           | **REQUIRED**              |

### 8.4 Read/write authority boundaries

| Requirement                                                                 | Source basis                         | Status for future Port IA |
| --------------------------------------------------------------------------- | ------------------------------------ | ------------------------- |
| Metadata-only read path; zero Vault secret mutation                         | Successor-01 §6 / Full-D AC-D-06     | **REQUIRED**              |
| Connection-derived `{ workspaceId, vaultSecretId }` binding + blank-ID zero-I/O guards | Successor-01 §7 Decision 5           | **REQUIRED** where Entry consumes port |
| No public HTTP/DTO/`PrivilegedActorContext` ingress                         | Successor-01 §13; COND-IA-03         | **REQUIRED**              |
| B-04 / durable authority / PORT export walls preserved                      | Option B / Successor-01 §3 stop rules| **REQUIRED**              |

### 8.5 Error handling and failure semantics

| Requirement                                                                 | Source basis                | Status for future Port IA |
| --------------------------------------------------------------------------- | --------------------------- | ------------------------- |
| Fail-closed for NOT_FOUND / UNAVAILABLE / INVALID / blank-ID                | Successor-01 §9             | **REQUIRED**              |
| No false successful `operation_summary` attributable to port success claims | Successor-01 §9             | **REQUIRED**              |
| IA-REV-03 crash-after-commit residual **not** “solved” by port package      | Successor-01 §9; Full-D §11.2 | **REQUIRED preservation** |

### 8.6 Tests and acceptance criteria

| Requirement                                                                 | Source basis           | Status for future Port IA |
| --------------------------------------------------------------------------- | ---------------------- | ------------------------- |
| Successor-01 §11 required future tests + §12 acceptance criteria            | Successor-01 §§11–12   | **REQUIRED** as baseline  |
| Export-wall + negative injection tests; A Preflight / human ACL regressions | Successor-01 §11       | **REQUIRED**              |
| Claim that tests have already passed                                        | —                      | **FORBIDDEN** in the Port IA grant itself without executed evidence |

### 8.7 Dependency on existing B-04 mechanisms

| Requirement                                                                 | Source basis                                      | Status for future Port IA |
| --------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------- |
| B-04 lease/write-authority semantics remain **NO CHANGE for Vault**         | Successor-01 §10 (`conn04-migration-boundary`)    | **REQUIRED**              |
| Port itself is not a B-04 substitute                                        | Successor-01 / Full-D separation of concerns      | **REQUIRED**              |
| Where Entry uses Connection from B-04/backfill context for binding          | Successor-01 §7                                   | Document in Port IA if Entry injection is in-scope |

### 8.8 Migration / backfill exclusions

| Exclusion                                                                   | Status under future Port IA (must remain explicit) |
| --------------------------------------------------------------------------- | -------------------------------------------------- |
| Full-D backfill execution / `runEnvironmentBackfill` operational loop       | **EXCLUDED** unless separately authorized          |
| `Connection.environment` UPDATE                                             | **EXCLUDED**                                       |
| Stage 4 freshness loop / occupancy+C orchestration beyond port capability   | **EXCLUDED** from Port package unless PO expands   |
| Stages 5–8; FIV-CONN-04-E; production / live capital                        | **EXCLUDED**                                       |

### 8.9 Required Independent Review gates

| Gate                                                                        | Status |
| --------------------------------------------------------------------------- | ------ |
| Independent review of Successor-01 amendment text                           | **COMPLETE** historically (`PASS` delta review) — does **not** authorize coding |
| Independent Review of Alignment-to-Port / KO-COND-01 documentation          | **COMPLETE** historically — does **not** authorize coding |
| Independent Review of **Port implementation delivery** after coding         | **REQUIRED** as a future gate analogous to Stage 2/3 IR practice — exact PASS wording / entry/exit sequencing for Port stages is **OPEN / REQUIRES PO DECISION** in the Port IA package |
| Whether a written IR PASS is a mandatory **entry** gate before Port coding sub-stages | **OPEN / REQUIRES PO DECISION** (Option B imposed IR between Stage 2 and 3; Port package must state its own sequence explicitly) |

### 8.10 Treatment of F-OBS-01…04 and S3-OBS-01…03

| Observation set     | Current status                         | Treatment for Port IA package (default unless PO decides otherwise) |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| **F-OBS-01…F-OBS-04** | **OPEN** (Stage 2 IR; preserved through Stage 3 closure) | **Remain OPEN**; Port IA must **not** silently close, waive, or remediate unless PO explicitly scopes remediation |
| **S3-OBS-01…S3-OBS-03** | **ACCEPTED / REMAIN RECORDED**       | **Remain recorded**; Port IA must **not** silently mark remediated/closed unless PO explicitly scopes remediation |

**OPEN / REQUIRES PO DECISION:** Whether any F-OBS / S3-OBS item is in-scope for remediation inside the Port package (default from prior acts: **no**).

### 8.11 OPEN — Entry injection vs Stage 4 consumer boundary

Successor-01 §10 lists `ConnectionsModule` import of the metadata module and Entry `@Inject` of the port as part of the dedicated-port inventory. Full-D Stage 4 remains the per-attempt freshness **loop** (Vault metadata + occupancy + C).

| Question                                                                 | Evidence | Disposition in this candidate |
| ------------------------------------------------------------------------ | -------- | ----------------------------- |
| Does the future Port Implementation Authorization include Entry injection + `ConnectionsModule` import, or only Vault-owned port/module/repository delivery with Entry wiring deferred to Stage 4? | Successor-01 §10 includes Entry inject; Full-D Stage 4 is freshness loop | **OPEN / REQUIRES PO DECISION** in the Port IA package — this successor-selection candidate does **not** resolve it |

### 8.12 OPEN — Port Implementation Authorization decision ID

| Question                                      | Disposition |
| --------------------------------------------- | ----------- |
| Exact Decision / Act ID for the future Port IA | **OPEN** — to be assigned when that separate package is prepared (must not reuse this candidate ID as if it were an IA grant) |

---

## 9. Governance continuity (non-reinterpretation)

This candidate **preserves** and does **not** reinterpret, weaken, or invalidate:

| Decision ID                              | Status preserved                                      |
| ---------------------------------------- | ----------------------------------------------------- |
| `D-CONN04-FULL-D-IA-S23-B`               | Option B Stage 2–3 IA — remains as recorded           |
| `D-CONN04-FULL-D-IA-S23-B-S3`            | Stage 3 commence — historical                         |
| `D-CONN04-FULL-D-IA-S23-B-S3-CLOSE`      | Stage 3 **FORMALLY CLOSED**                           |
| `D-CONN04-PO-VAULT-B-IA-AMD-S01`         | Successor-01 amendment **APPROVED AND RATIFIED**; coding still not granted by S01 alone |
| `D-CONN04-PO-VAULT-B-IA-AMD`             | Package ratification — historical                     |
| `D-CONN04-PO-VAULT-B`                    | Strategy ratification — preserved                     |
| `D-CONN04-KO-COND-01` / `D-CONN04-KO-COND-01-CLAR` | KO-COND-01 closed / clarification preserved |
| `D-CONN04-FULL-D-IA`                     | Full-D IA grant with amendments — preserved           |
| Wave 6 STOP / non-authorization language | Remains binding                                       |

`D-CONN04-FULL-D-IA-S23-B-VMP-SUCC` is a **candidate ID only** until a separate Product Owner ratification act assigns it as ratified (or replaces it).

---

## 10. Acceptance / ratification requirements

For this candidate to become effective as a Product Owner decision:

1. The **Product Owner** must explicitly **RATIFY** (or reject / amend) this candidate in a **separate final decision act**.
2. That final act must restate successor selection, scope, and non-authorizations without converting them into Port coding authority.
3. Upon ratification, synchronize `wave-6-po-decision-register.md` with an **additive** entry for the ratified decision ID and preserve historical bodies (see §11).
4. Until ratification: treat this file as **draft only**; no coding; no Stage 4; no Register mutation under this task.

**Only the Project Owner can ratify this decision.**

Independent Reviewer reports, Engineering drafts, and this candidate document **cannot** self-ratify.

---

## 11. Expected Decision Register update (after formal PO ratification only)

**This task does NOT modify the Decision Register.**

If and only if the Product Owner later ratifies this decision, the expected Register update would include:

1. Additive entry for the ratified decision ID (candidate proposes `D-CONN04-FULL-D-IA-S23-B-VMP-SUCC`).
2. Summary-table row stating Vault Metadata Port is the selected next separate work package after Stage 3 and before Stage 4.
3. Explicit record that Stage 3 remains **FORMALLY CLOSED**.
4. Explicit record that Port coding / Stage 4 / Stages 5–8 / env UPDATE / backfill execution / freshness loop / E / production / live capital remain **NOT AUTHORIZED**.
5. Explicit record that a separate Port Implementation Authorization remains required.
6. Preservation of F-OBS-01…F-OBS-04 **OPEN** and S3-OBS-01…S3-OBS-03 **REMAIN RECORDED**.
7. No rewrite of unrelated historical decision bodies.

---

## 12. Explicit non-authorization banner

```text
DRAFT — PO DECISION CANDIDATE — NOT YET RATIFIED
CANDIDATE ID: D-CONN04-FULL-D-IA-S23-B-VMP-SUCC (CANDIDATE ONLY)

IF RATIFIED LATER: SUCCESSOR ORDER ONLY
  → Vault Metadata Port selected next (after Stage 3, before Stage 4)
  → Separate Port Implementation Authorization still required

NOT AUTHORIZED BY THIS DOCUMENT:
  PORT CODING / IMPLEMENTATION
  STAGE 4 COMMENCEMENT OR CODING
  STAGES 5–8
  CONNECTION.ENVIRONMENT UPDATE
  FULL-D BACKFILL EXECUTION
  VAULT METADATA FRESHNESS IMPLEMENTATION
  FIV-CONN-04-E
  PRODUCTION / DEPLOYMENT / LIVE-CAPITAL OPERATIONS
  AUTOMATIC PROGRESSION
  DECISION REGISTER MUTATION BY THIS DRAFT

PRIOR DECISIONS PRESERVED:
  D-CONN04-FULL-D-IA-S23-B
  D-CONN04-FULL-D-IA-S23-B-S3
  D-CONN04-FULL-D-IA-S23-B-S3-CLOSE
  D-CONN04-PO-VAULT-B-IA-AMD-S01
  WAVE 6 STOP RESTRICTIONS

ONLY THE PROJECT OWNER MAY RATIFY.
WAIT FOR SEPARATE PORT IMPLEMENTATION AUTHORIZATION BEFORE ANY CODING.
```

---

## 13. Repository baseline at drafting

| Field                         | Value                                                          |
| ----------------------------- | -------------------------------------------------------------- |
| Branch                        | `main`                                                         |
| HEAD                          | `a59c533977923a45413a176ad143325a948feeb8`                     |
| Created by this task          | This draft candidate only                                      |
| Modified existing files       | **None authorized / none intended**                            |
| Decision Register             | **Unchanged**                                                  |
| Application source / tests    | **Unchanged**                                                  |
| Pre-existing dirty/untracked  | **Preserved**                                                  |

---

_End of DRAFT PO Decision Candidate — Vault Metadata Port successor selection (`D-CONN04-FULL-D-IA-S23-B-VMP-SUCC` candidate). Not ratified. No implementation authorization granted._
