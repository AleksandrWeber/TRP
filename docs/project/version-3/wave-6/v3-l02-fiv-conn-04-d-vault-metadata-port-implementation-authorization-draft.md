# FIV-CONN-04-D — Vault Metadata Port Implementation Authorization Package

```text
DRAFT — IMPLEMENTATION AUTHORIZATION PROPOSAL — NOT RATIFIED — NO CODING AUTHORIZED
CANDIDATE DECISION / ACT ID ONLY — NOT A RATIFIED IMPLEMENTATION AUTHORIZATION
DOES NOT AUTHORIZE VAULT METADATA PORT CODING
DOES NOT AUTHORIZE STAGE 4 COMMENCEMENT OR CODING
DOES NOT AUTHORIZE STAGES 5–8
DOES NOT AUTHORIZE CONNECTION.ENVIRONMENT UPDATE
DOES NOT AUTHORIZE FULL-D BACKFILL EXECUTION
DOES NOT AUTHORIZE VAULT METADATA FRESHNESS LOOP / PER-ATTEMPT CONSUMER ORCHESTRATION
DOES NOT AUTHORIZE FIV-CONN-04-E
DOES NOT AUTHORIZE PRODUCTION / DEPLOYMENT / LIVE-CAPITAL OPERATIONS
NO AUTOMATIC PROGRESSION
DECISION REGISTER: NOT MODIFIED BY THIS DRAFT
ONLY THE PROJECT OWNER MAY RATIFY THIS AUTHORIZATION
```

**Document:** Draft Vault Metadata Port Implementation Authorization Package for Project Owner review  
**Date (drafting):** 2026-10-30  
**Date (PO disposition revision):** 2026-10-30  
**Wave:** 6 — Live Trading / FIV-CONN-04-D  
**Authority:** Product Owner (sole Project Owner) — draft revised after PO disposition of OQ-VMP-01…08; still awaiting separate ratification act  
**Status:** **DRAFT — NOT RATIFIED — NO CODING AUTHORIZED** (PO dispositions incorporated; final PO review + separate ratification act still required)  
**Candidate Decision / Act ID:** **`D-CONN04-FULL-D-IA-VMP`** — **CANDIDATE ONLY**  
**Nature:** **GOVERNANCE / DOCUMENTATION ONLY.** Translates ratified successor selection (`D-CONN04-FULL-D-IA-S23-B-VMP-SUCC`) and Successor-01 architectural requirements into a complete, evidence-backed implementation-authorization proposal. Incorporates Product Owner dispositions for OQ-VMP-01…08. Does **not** itself grant coding authority. Does **not** modify the Decision Register. Does **not** modify application source or tests. Does **not** stage, commit, or push.

---

## 1. Decision identification and candidate ID

| Field | Value |
| --- | --- |
| **Decision title** | Vault Metadata Port — Implementation Authorization |
| **Proposed Decision / Act ID (candidate)** | **`D-CONN04-FULL-D-IA-VMP`** — **CANDIDATE ID ONLY; NOT RATIFIED** (OQ-VMP-02 **ACCEPT**) |
| **Preserved ratified successor ID** | **`D-CONN04-FULL-D-IA-S23-B-VMP-SUCC`** (successor selection only; **not** reused as IA) |
| **Project** | FIV-CONN-04-D |
| **Wave** | 6 — Live Trading |
| **Decision authority** | Product Owner (sole Project Owner) |
| **Decision class** | Implementation Authorization proposal (Port work package only) |
| **Status** | **DRAFT — NOT RATIFIED — NO CODING AUTHORIZED** |
| **Drafting date** | 2026-10-30 |
| **PO disposition revision date** | 2026-10-30 |
| **Ratification date** | _Pending separate Product Owner ratification act_ |
| **Implementation authorization** | **NOT GRANTED** by this draft |

### 1.1 Candidate ID (OQ-VMP-02 — ACCEPT)

| Requirement | Disposition |
| --- | --- |
| Follow `D-CONN04-*` conventions | **Yes** — Full-D IA lineage prefix `D-CONN04-FULL-D-IA-*` |
| Preserve successor-selection ID | **Yes** — `D-CONN04-FULL-D-IA-S23-B-VMP-SUCC` remains the ratified successor-selection act; **not** reused |
| Do not treat successor ID as IA | **Binding** — successor selection authorizes order + Port-IA preparation only |
| PO disposition | **ACCEPT** candidate ID `D-CONN04-FULL-D-IA-VMP` |

**Candidate Decision / Act ID:** `D-CONN04-FULL-D-IA-VMP`  
Meaning: Full-D lineage → Vault Metadata Port (VMP) → Implementation Authorization.

Until the Product Owner issues a **separate ratification act**, treat this ID as a **candidate only**. This draft remains **NOT RATIFIED**.

---

## 2. Executive summary

1. **Ratified direction.** Under `D-CONN04-FULL-D-IA-S23-B-VMP-SUCC`, Vault Metadata Port is the next separate work package after Stage 3 formal closure and **before** Full-D Stage 4.
2. **This draft** records a bounded Implementation Authorization **proposal** for that Port package only (`D-CONN04-FULL-D-IA-VMP` candidate), derived from Successor-01 (`D-CONN04-PO-VAULT-B-IA-AMD-S01`) and verified repository evidence. **OQ-VMP-01:** conditional approval after revision — **still draft**; separate ratification act required.
3. **Port scope (PO-decided).** Includes full Successor-01 §10 inventory: Vault-owned port/module/repository delivery; `ConnectionsModule` import (**OQ-VMP-03 INCLUDE**); Entry `@Inject`; and a **narrowly scoped callable internal Entry lookup seam** with Connection-derived binding and blank-ID guards (**OQ-VMP-04 INCLUDE**). Excludes Full-D Stage 4 per-attempt freshness loop (Vault+occupancy+C), env UPDATE, and backfill execution.
4. **Lifecycle (PO-decided).** Optional pre-implementation IR (**OQ-VMP-05 OPTIONAL**) → separate PO Port IA ratification → **one** bounded Port work package **VMP-1** (**OQ-VMP-06**) → mandatory written Independent Review of completed delivery (**OQ-VMP-08 YES**) → separate PO Port closure → **separate** Full-D Stage 4 authorization later. Port closure does **not** authorize Stage 4.
5. **Observations (OQ-VMP-07 NONE).** F-OBS-01…04 remain **OPEN**; S3-OBS-01…03 remain **ACCEPTED / RECORDED**. No remediation, waiver, closure, or silent reclassification in Port scope.
6. **No coding is authorized** until a separate Product Owner ratification act for this Port IA.

---

## 3. Ratified successor authority (binding inherited)

| Item | Authoritative status (unchanged by this draft) |
| --- | --- |
| `D-CONN04-FULL-D-IA-S23-B-VMP-SUCC` | **RATIFIED — SUCCESSOR SELECTION** |
| Selected package | **Vault Metadata Port** after Stage 3, before Stage 4 |
| Stage 3 (`D-CONN04-FULL-D-IA-S23-B-S3-CLOSE`) | **FORMALLY CLOSED** |
| Successor-01 (`D-CONN04-PO-VAULT-B-IA-AMD-S01`) | **APPROVED AND RATIFIED** architectural amendment; **port coding NOT authorized by S01 alone** |
| Separate Port IA | **REQUIRED** before any port coding |
| Stage 4 / Stages 5–8 / env UPDATE / backfill execution / freshness loop / E / production / live capital | **NOT AUTHORIZED** |
| F-OBS-01…F-OBS-04 | **OPEN** |
| S3-OBS-01…S3-OBS-03 | **ACCEPTED / REMAIN RECORDED** |

This draft is the Port Implementation Authorization package contemplated by the successor-selection act. It does **not** replace that act. It does **not** itself ratify Port IA.

---

## 4. Source documents and evidence

All hashes recalculated against **current repository file bytes**. Branch `main`; HEAD `a59c533977923a45413a176ad143325a948feeb8`.

### 4.1 Mandatory governance sources

| # | Artifact | Path | Current SHA-256 |
| --- | --- | --- | --- |
| 1 | Successor-selection ratification | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vault-metadata-port-successor-po-ratification.md` | `31c4d17236878cf96392f2ed6d2229fb1fddc25c0dc0641d0f35e3042b433a98` |
| 2 | Successor-selection candidate | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-vault-metadata-port-successor-po-decision-candidate.md` | `dd8af55d361373d55778e70e113c32adb899fbb4bd65611e9e006a5ea6b8fb24` |
| 3 | Wave 6 Decision Register | `docs/project/version-3/wave-6/wave-6-po-decision-register.md` | `6abad25bd8b27dafcb991193bd9eb6c01b5d25274845e2003e91183a791048b0` |
| 4 | Successor-01 amendment text | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization-amendment-po-vault-b-final-candidate-successor-01.md` | `79386c9120e20c3a36648a869e6d196c7f6d96130b808006d723fac4e4ee8acb` |
| 5 | Successor-01 approval / re-ratification | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-successor-01-approval-and-ratification.md` | `cdba4ad50ab1691307ef94579669c4fa5c8a81ad0d30c9b44514e586c56fbc97` |
| 6 | Successor-01 independent delta review | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-po-vault-b-ia-amendment-successor-01-independent-delta-review.md` | `1a82c942389307980736094cd34ab66dbfa838cd6bda5a7ed0bd33d18b2763ec` |
| 7 | Stage 1 Alignment-to-Port | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-1-vault-entry-alignment-to-port.md` | `b1a420f08e21d8ccbcc96f5031fa52bfd6d8e9970a6bda9b2cecb453c2a342d6` |
| 8 | Alignment-to-Port Independent Review | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-1-vault-entry-alignment-to-port-independent-review.md` | `b03a39e01a4e5c1147c277b8862c3bd0b1e238312017583e1c2f9530cda04f3e` |
| 9 | Full-D Implementation Authorization | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization.md` | `2c6890ba0e2ed3fe08b1ee84ee20df787eae814b8728465fff5a939356b9c1ee` |
| 10 | Option B Stage 2–3 IA | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-authorization-option-b-po-decision.md` | `dbc7aea6d99328122c31818305011c11157a0e5cfab862d560cea757e4d550d4` |
| 11 | Stage 3 PO formal closure | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-3-po-closure-decision.md` | `a28599dd6fe8a45cc3753c1ab6304ea6eb75c7a88363088b1572a644c51f9dc0` |
| 12 | Stage 3 Independent Review | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-3-independent-review.md` | `4f3ccaa093af768d63e829229c8aceaabea03a18733f7f340ce88e0c86b8542e` |
| 13 | Stage 2 Independent Review (F-OBS source) | `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-stage-2-independent-review.md` | `4300644c40f6af5c3fe1724eb33213ce3de248d34b371ad702fc98cb8bdcd470` |

### 4.2 Verified code / module evidence (current HEAD)

| Evidence | Verified fact |
| --- | --- |
| `apps/api/src/modules/secret-vault/` | No `fiv-conn-04-d-vault-metadata.*` files exist yet (CREATE targets) |
| `secret-vault.repository.ts` | `SecretVaultRepository` currently has `compareAndSet`, `findBySlot`, `listByWorkspaceId`, `deleteIfRevision` — **no** `findMetadataByIdAndWorkspaceId` |
| `prisma-secret-vault.repository.ts` / `in-memory-secret-vault.repository.ts` | Exist; implement current interface; full-record mapping includes ciphertext columns today |
| `secret-vault.module.ts` | Exports **`SecretVaultService` only**; does not export repository token |
| `secret-record.ts` | `SecretVaultMetadata` includes `type`, `operatorLabel`, timestamps — **broader** than Successor-01 four-field view |
| `connections.module.ts` | Imports `SecretVaultModule`; providers include `Conn04SystemJobMigrationEntry`; exports **`FivConn04APreflightService` only**; pre-existing dirty working-tree noted under F-OBS-04 / S3-OBS-01 |
| `fiv-conn-04-d-system-job-migration-entry.ts` | Injects `Conn04MigrationBoundaryService`, `FivConn04DEnvironmentBackfillWrite`, `PrismaTransactionService` only — **no** Vault metadata port; Stage 3 write-authority scaffold only; **no** `runEnvironmentBackfill` |
| `conn04-migration-boundary.service.ts` | B-04 lease/start/heartbeat/release/`assertWriteAuthority` façade — Vault-unrelated |
| `fiv-conn-04-d-environment-backfill-write.ts` | Stage 3 write-unit authority/CAS scaffolding — no env UPDATE |
| `PrismaModule` | Exports `PrismaService` (usable by dedicated Vault-owned metadata module under Option A) |
| Lifecycle doubles | `RollbackVaultRepository` / `StaleOnceRepository` in `secret-vault.lifecycle.spec.ts` implement `SecretVaultRepository` |

---

## 5. Governance questions (Q1–Q4) — PO dispositions incorporated

Legend:

| Tag | Meaning |
| --- | --- |
| **BINDING INHERITED** | Required by ratified / approved governing documents |
| **PO-DECIDED** | Product Owner disposition recorded in this revision; still requires separate Port IA ratification before coding |
| **ENGINEERING DETAILING** | Exact spellings/filenames delegated under Successor-01; must be recorded before coding |

### 5.1 Q1 — Entry injection, ConnectionsModule, and internal lookup seam

#### Evidence

| Source | What it says |
| --- | --- |
| Successor-01 §3.1 / §10 | Dedicated Vault module exports port only; **`ConnectionsModule` MODIFY** — import metadata module, no re-export; **Entry MODIFY** — `@Inject` port; binding + guards |
| Successor-01 §2 | CREATE port/module; MODIFY vault repository; **MODIFY Entry inject**; do not use human `list` for D Entry freshness |
| Alignment-to-Port §3.2 | Entry consumes dedicated port; ConnectionsModule imports dedicated module; Entry injects port only for D freshness |
| Full-D IA Stage 4 / IMPL-REV-D-06 | Per-attempt consumer loop: fresh Vault metadata + occupancy + C **immediately before each write attempt** |
| Option B IA | Explicitly excluded Vault metadata port from Stage 2–3 |
| Successor selection | Port package **before** Stage 4; Stage 4 freshness loop **not** authorized by successor selection |
| Current Entry code | No port inject; no freshness loop; Stage 3 scaffold only |

#### PO-decided Port vs Full-D Stage 4 boundary

| Belongs to **Vault Metadata Port work package VMP-1** | Belongs exclusively to **Full-D Stage 4** (separate future IA) |
| --- | --- |
| Vault-owned port types/token/service/module | Per-attempt freshness **loop** orchestration |
| Repository compound metadata query + narrow `select` | Typed occupancy projection / Strategy B occupancy evidence |
| Nest Option A wiring; export walls | Per-attempt C classifier re-invoke orchestration |
| `ConnectionsModule` import of metadata module (no re-export) (**OQ-VMP-03 INCLUDE**) | `runEnvironmentBackfill` / operational backfill loop |
| Entry `@Inject(FIV_CONN_04_D_VAULT_METADATA_PORT)` (**OQ-VMP-03 INCLUDE**) | `Connection.environment` UPDATE |
| **Narrowly scoped callable internal Entry lookup seam** with Connection-derived binding + blank-ID zero-I/O guards (**OQ-VMP-04 INCLUDE**) | Stages 5–8 write/audit/summary/failure orchestration |
| Port contract/unit/export-wall/negative-injection/seam tests | Freshness-suite proving stale batch-pass insufficient (IMPL-REV-D-06) |

**Work package boundary:** One Port work package **VMP-1** covering the full Successor-01 §10 inventory **plus** the PO-required callable internal Entry seam (**OQ-VMP-06 ONE**).

**Do not silently remove** Successor-01 §10 Connections/Entry rows.  
**Do not move** Stage 4 occupancy/C/loop/env UPDATE into Port scope.

#### Internal Entry lookup seam (OQ-VMP-04 — INCLUDE) — binding for this draft

The Port package **MUST** include a narrowly scoped **callable internal** Entry lookup seam intended for future Full-D Stage 4 use.

| Rule | Binding |
| --- | --- |
| Location | Internal to `Conn04SystemJobMigrationEntry` implementation (private/module-local helper or equivalent Engineering detailing) |
| Inputs | Connection-derived `{ workspaceId, vaultSecretId }` from the **same** Connection only |
| Preconditions | Blank-ID validation (trim; non-empty) **before** any port or repository I/O |
| Behavior | Invoke dedicated metadata port (`lookupExact` working basis); propagate fail-closed `NOT_FOUND` / `UNAVAILABLE` / `INVALID` |
| **MUST NOT** | Implement or activate Stage 4 per-attempt freshness loop |
| **MUST NOT** | Orchestrate occupancy or C classifier re-invocation |
| **MUST NOT** | Call / implement `runEnvironmentBackfill` or perform `Connection.environment` UPDATE |
| **MUST NOT** | Become a new public HTTP API, DTO contract, Nest export, or externally callable interface |
| **MUST NOT** | Introduce a new authority mechanism or change B-04 |

Stage 4 later integrates this seam into the per-attempt Vault+occupancy+C consumer loop under a **separate** PO authorization.

### 5.2 Q2 — Port Implementation Authorization Decision ID

**PO-DECIDED (OQ-VMP-02 ACCEPT):** candidate ID `D-CONN04-FULL-D-IA-VMP` (see §1.1). **Not ratified** by this draft.

### 5.3 Q3 — Treatment of F-OBS and S3-OBS

**BINDING INHERITED** default + **PO-DECIDED (OQ-VMP-07 NONE):** no remediation, waiver, closure, or silent reclassification in Port scope.

| ID | Current status | Substance (source) | Port prerequisite? | Disposition |
| --- | --- | --- | --- | --- |
| **F-OBS-01** | **OPEN** | Audit helper refuses payload key `vaultSecretId` due to shared `/secret/i` boundary; §13 lists field as allowed (Stage 2 IR) | **No** | **Preserve OPEN** — out of Port scope |
| **F-OBS-02** | **OPEN** | Helper allowlist includes run counters beyond a strict “safe fields” bullet | **No** | **Preserve OPEN** |
| **F-OBS-03** | **OPEN** | No dedicated `security-audit-classification.spec.ts`; covered via service admit | **No** | **Preserve OPEN** |
| **F-OBS-04** | **OPEN** | `connections.module.ts` dirty working-tree mixes stages (hygiene) | **Not a technical blocker**; Port will further modify this file | **Preserve OPEN**; mandatory dirty-baseline control in §7.5 (does **not** remediate/close F-OBS-04) |
| **S3-OBS-01** | **ACCEPTED / RECORDED** | Dirty module diff conflates stages | Hygiene only | **Remain ACCEPTED / RECORDED**; §7.5 control does **not** remediate/close |
| **S3-OBS-02** | **ACCEPTED / RECORDED** | Stage 3 CAS evidence is unit-mocked; durable CAS is B-04 REUSE | **No** | **Remain ACCEPTED / RECORDED** |
| **S3-OBS-03** | **ACCEPTED / RECORDED** | Source-wall regex supplementary | **No** | **Remain ACCEPTED / RECORDED** |

If implementation planning discovers that any observation is a **hard prerequisite**, Engineering must **STOP** and raise it to the Product Owner rather than silently expanding Port scope.

### 5.4 Q4 — Independent Review and authorization lifecycle

#### Inherited practice (evidence)

| Source | Practice |
| --- | --- |
| Option B (`D-CONN04-FULL-D-IA-S23-B`) | Written Independent Reviewer **PASS** was a mandatory Stage 3 entry gate after Stage 2 |
| Successor-01 §12 item 12 | Historically required independent review of the **amendment candidate** + separate IA approval before coding (amendment governance; already satisfied for architecture) |
| Stage 2/3 IR practice | IR of **completed delivery** before PO stage closure |

#### PO-decided Port lifecycle (consistent across this document)

```text
[DONE] D-CONN04-FULL-D-IA-S23-B-VMP-SUCC  — successor selection ratified
   → [THIS DRAFT] Port IA package (OQ dispositions incorporated; NOT RATIFIED)
   → (1) Optional pre-implementation Independent Review of this Port IA package
         [OQ-VMP-05 OPTIONAL — NOT a mandatory coding entry gate]
   → (2) Separate PO ratification act for Port IA candidate D-CONN04-FULL-D-IA-VMP
         [mandatory before any coding; OQ-VMP-01 still requires this separate act]
   → (3) ONE bounded Port work package VMP-1 [OQ-VMP-06]
   → (4) Mandatory written Independent Review of completed Port delivery [OQ-VMP-08 YES]
   → (5) Separate written PO Port closure act
         [for PASS WITH OBSERVATIONS: PO must explicitly accept residual observations]
   → (6) Separate Full-D Stage 4 Implementation Authorization (NOT automatic)
```

| Gate | Status under this draft |
| --- | --- |
| (1) Pre-implementation IR of Port IA package | **OPTIONAL** — may be performed; **not** a mandatory coding entry gate (**OQ-VMP-05**) |
| (2) PO Port IA ratification | **Mandatory** before coding; **not** accomplished by this draft (**OQ-VMP-01**) |
| (3) Port delivery | **One** work package **VMP-1** — no Port sub-stage split (**OQ-VMP-06**); no mid-package IR entry gate |
| (4) IR of completed Port delivery | **Mandatory** before PO Port closure (**OQ-VMP-08**) |
| (5) PO Port closure | **Mandatory** separate written act; does **not** authorize Stage 4 |
| (6) Stage 4 separate PO authorization | **BINDING INHERITED** — Port closure ≠ Stage 4 grant |

#### Mandatory Independent Review verdict rules (delivery IR)

| Rule | Binding under this draft |
| --- | --- |
| Permitted final IR verdicts | **`PASS`** or **`PASS WITH OBSERVATIONS`** |
| BLOCKER findings | Must be **zero** for PO closure eligibility |
| MAJOR findings | Must be **zero** for PO closure eligibility |
| Observations | Every observation must record severity, impact, evidence, and disposition |
| `PASS WITH OBSERVATIONS` | Product Owner must **explicitly accept** residual observations in the Port closure act before closing |
| Port closure form | Separate written PO act required |
| Stage 4 effect | Port closure does **not** authorize Full-D Stage 4 |

---

## 6. Technical architecture

### 6.1 Nest Option A (BINDING INHERITED — Successor-01 §3)

```text
PrismaModule
  exports: [PrismaService, ...]                         — NO CHANGE

FivConn04DVaultMetadataModule                           — CREATE (Vault-owned)
  imports: [PrismaModule]
  providers:
    - SECRET_VAULT_REPOSITORY → PrismaSecretVaultRepository (module-private)
    - FIV_CONN_04_D_VAULT_METADATA_PORT → FivConn04DVaultMetadataService
  exports: [FIV_CONN_04_D_VAULT_METADATA_PORT ONLY]
  does NOT export: SECRET_VAULT_REPOSITORY, PrismaSecretVaultRepository,
                   SecretVaultService, VaultAccessControl, B-04, durable authority

SecretVaultModule                                       — NO CHANGE for D Entry path
  exports: [SecretVaultService] only
  does NOT export port or SECRET_VAULT_REPOSITORY

ConnectionsModule                                       — MODIFY
  imports: [..., FivConn04DVaultMetadataModule]
  Entry injects FIV_CONN_04_D_VAULT_METADATA_PORT
  Entry exposes narrowly scoped callable INTERNAL lookup seam (not exported)
  exports: [FivConn04APreflightService]                 — UNCHANGED public surface
  does NOT re-export port / Entry / B-04 / repository / seam
```

### 6.2 Educational Nest DI limitation (BINDING INHERITED)

- Nest composition/DI is an **educational** caller-access boundary only.
- Same-module providers that can inject the port once imported = **ACCEPTED LIMITATION**.
- Must **not** be represented as production S2S authentication, Entry-identity proof, token provenance, or Vault AuthZ proof (`D-CONN04-TOKEN-SCOPE`).
- Human `VaultAccessControl` is **not** invoked by this port.

### 6.3 Port contract (BINDING INHERITED — Successor-01 §6)

**Metadata view (exact):**

```text
{ id, workspaceId, purpose, state }
```

**Excluded from view:** plaintext, ciphertext, decryption, retrieve/mutate/admin, `type`, timestamps, `operatorLabel`, repository entities, full `SecretVaultMetadata` DTO.

**Compound query:**

```text
WHERE VaultSecret.id = :vaultSecretId
  AND VaultSecret.workspaceId = :workspaceId
select: { id, workspaceId, purpose, state }   -- query-level minimization mandatory
```

**Port result reasons:**

| Condition | Reason |
| --- | --- |
| No row for `(id, workspaceId)` incl. foreign workspace | `NOT_FOUND` |
| Repo / timeout / infra failure | `UNAVAILABLE` |
| Bad / incomplete projection | `INVALID` |

**Lookup API (working basis; Engineering-selected spelling):**  
`FivConn04DVaultMetadataPort.lookupExact({ workspaceId, vaultSecretId })`

### 6.4 Connection-derived binding and fail-closed (BINDING INHERITED — Successor-01 §7 / §9)

1. Obtain Connection from trusted B-04 / backfill processing context (when call path exists).
2. Derive `workspaceId` and `vaultSecretId` from that **same** Connection only.
3. Validate both (trim; non-empty) **before** any port/repository call.
4. On missing/blank/invalid: fail closed; **zero** port invocations; **zero** repository metadata calls; AMBIGUOUS-aligned; no env UPDATE as fresh; no false successful `operation_summary`.
5. Never accept overrides from HTTP, DTOs, job payloads, caller-supplied actor context, or untrusted metadata.
6. Never mix Connection A workspace with Connection B vault id.
7. Preserve existing eligibility / write-gate / B-04 checks.
8. No new port Security Audit event; IA-REV-03 crash-after-commit residual remains **unsolved**.

### 6.5 Working symbol / file basis (Engineering detailing; NOT PO-frozen)

Per `D-CONN04-PO-VAULT-B-IA-AMD-S01` §5, exact spellings are **DELEGATED TO ENGINEERING**. Successor-01 §4 working basis (must remain within architectural intent):

| Role | Working basis name |
| --- | --- |
| Port type | `FivConn04DVaultMetadataPort` |
| Metadata view type | `FivConn04DVaultMetadataView` |
| DI token | `FIV_CONN_04_D_VAULT_METADATA_PORT` |
| Lookup method | `lookupExact` |
| Service impl | `FivConn04DVaultMetadataService` |
| Nest module | `FivConn04DVaultMetadataModule` |
| Repository method | `findMetadataByIdAndWorkspaceId` |
| Entry class (existing, verified) | `Conn04SystemJobMigrationEntry` |
| Internal Entry lookup seam | Engineering-selected private/module-local name within Entry; **not** a public Nest export |

If Engineering selects equivalent names, Port delivery evidence must record the selected spellings and prove conformance. Do **not** invent a new PO naming freeze.

### 6.6 Internal Entry lookup seam contract (PO-DECIDED — OQ-VMP-04)

```text
Entry (internal only)
  → validate Connection-derived workspaceId + vaultSecretId (blank-ID guards)
  → if invalid: fail closed; ZERO port I/O; ZERO repository metadata I/O
  → else: port.lookupExact({ workspaceId, vaultSecretId })
  → return / propagate metadata view or NOT_FOUND | UNAVAILABLE | INVALID

NOT part of seam:
  occupancy orchestration | C re-invoke | per-attempt loop | env UPDATE | backfill loop
  public HTTP | DTO | Nest module export | new authority / B-04 changes
```

---

## 7. Exact inventory

**Status of all rows under this draft:** proposed authorized inventory **if and only if** PO separately ratifies `D-CONN04-FULL-D-IA-VMP` — **not implemented**; **not authorized** by this draft alone.

Classification key: **CREATE** / **MODIFY** / **NO CHANGE** / **EXCLUDED**.

### 7.1 Vault-owned capability

| Path | Class | Notes / verified basis |
| --- | --- | --- |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.port.ts` | **CREATE** | Port types + token (Successor-01 §10) — file absent today |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.service.ts` | **CREATE** | Port impl — absent today |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.module.ts` | **CREATE** | Option A; export port only — absent today |
| `apps/api/src/modules/secret-vault/secret-vault.repository.ts` | **MODIFY** | Add `findMetadataByIdAndWorkspaceId` to `SecretVaultRepository` (verified interface currently lacks it) |
| `apps/api/src/modules/secret-vault/prisma-secret-vault.repository.ts` | **MODIFY** | Narrow `select` compound query; dedicated mapper — **not** full-row/`toRecord` ciphertext path |
| `apps/api/src/modules/secret-vault/in-memory-secret-vault.repository.ts` | **MODIFY** | Parity with Prisma metadata method |
| `apps/api/src/modules/secret-vault/secret-vault.lifecycle.spec.ts` | **MODIFY** | `RollbackVaultRepository` + `StaleOnceRepository` forward new interface method (classes verified present) |
| `apps/api/src/modules/secret-vault/secret-vault.module.ts` | **NO CHANGE** | Do not export port/repository (verified exports `SecretVaultService` only) |
| `apps/api/src/modules/secret-vault/vault-access-control.ts` | **NO CHANGE** | Not invoked by port |
| `apps/api/src/modules/secret-vault/secret-vault.service.ts` | **NO CHANGE for D Entry** | Human / A Preflight `list` path unchanged |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.service.spec.ts` | **CREATE** | Metadata / isolation / select tests (working-basis path; see §10.1) |
| `apps/api/src/modules/secret-vault/fiv-conn-04-d-vault-metadata.module.spec.ts` | **CREATE** | Export-wall tests (working-basis path; see §10.1) |

### 7.2 Connections consumer wiring (OQ-VMP-03 INCLUDE; OQ-VMP-04 INCLUDE seam)

| Path | Class | Notes / verified basis |
| --- | --- | --- |
| `apps/api/src/modules/connections/connections.module.ts` | **MODIFY** | Import `FivConn04DVaultMetadataModule`; **no** re-export of port/Entry/B-04/repository/seam; subject to §7.5 dirty-baseline control |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts` | **MODIFY** | `@Inject` port; Connection-derived binding + blank-ID guards; **callable internal lookup seam** for future Stage 4 (not public/exported; not Stage 4 orchestration) |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-identity.ts` | **NO CHANGE** | Verified identity helper remains sole constructor path |
| `apps/api/src/modules/connections/conn04-migration-boundary.service.ts` | **NO CHANGE for Vault** | B-04 façade preserved |
| `apps/api/src/modules/connections/fiv-conn-04-d-environment-backfill-write.ts` | **NO CHANGE** | Stage 3 write-unit scaffold; no env UPDATE under Port |
| Entry / Connections export-wall + binding + seam specs | **MODIFY and/or CREATE** | Exact filename(s) are Engineering detailing within Vault/Connections module boundaries; must be recorded in §10.1 test-file inventory before coding |

### 7.3 Explicit exclusions (must remain EXCLUDED under Port IA)

| Item | Class |
| --- | --- |
| Full-D `runEnvironmentBackfill` operational loop | **EXCLUDED** |
| Per-attempt Full-D Stage 4 freshness loop (Vault + occupancy + C orchestration) | **EXCLUDED** |
| Occupancy projection / Strategy B occupancy Nest services | **EXCLUDED** (REUSE later under Stage 4) |
| `Connection.environment` UPDATE | **EXCLUDED** |
| Stages 5–8 inventory | **EXCLUDED** |
| FIV-CONN-04-E | **EXCLUDED** |
| Production deployment / activation / live capital | **EXCLUDED** |
| Public HTTP / DTO / `PrivilegedActorContext` ingress | **EXCLUDED** |
| Public Nest export of Entry lookup seam | **EXCLUDED** |
| Second SYSTEM_JOB constructor / alternate Entry | **EXCLUDED** |
| Port-level Security Audit event / outbox / pending-audit | **EXCLUDED** |
| Claiming Nest DI as production Vault AuthZ / S2S proof | **EXCLUDED** |
| Remediation / waiver / closure / silent reclassification of F-OBS-01…04 or S3-OBS-01…03 | **EXCLUDED** (**OQ-VMP-07 NONE**) |
| Any production source file **not** listed in §7.1 / §7.2 | **EXCLUDED** unless separate PO decision authorizes addition |

### 7.4 Engineering detailing items (not PO open questions)

| Item | Status |
| --- | --- |
| Exact Connections binding / export-wall / seam spec filename(s) | **ENGINEERING DETAILING** — record in §10.1 inventory before coding |
| Exact internal seam method/symbol spelling | **ENGINEERING DETAILING** — within §6.5 / §6.6 intent |
| Exact final symbol spellings if Engineering diverges from working basis | **ENGINEERING DETAILING** — must be recorded at delivery; must prove Successor-01 intent |

### 7.5 Mandatory dirty-baseline control — `connections.module.ts`

Because F-OBS-04 and S3-OBS-01 already record file-attribution / mixed-diff concerns for `apps/api/src/modules/connections/connections.module.ts`, any future authorized Port implementation **MUST** apply this control. Adding this control does **not** remediate, waive, or close F-OBS-04 or S3-OBS-01.

Before modifying the file under a ratified Port IA, Engineering must:

1. Capture and record the **pre-implementation** working-tree status and the **exact current diff** of `connections.module.ts`.
2. Identify **pre-existing** modifications separately from intended Port work.
3. **Preserve** all unrelated modifications and untracked files.
4. **Avoid** overwriting, reverting, or absorbing unrelated changes into the Port diff.
5. Produce a final **Port-only** diff for this file (authorized Port modifications only).
6. Provide evidence that the final Port diff contains **only** authorized Port modifications (import of dedicated metadata module; no re-export of port/Entry/B-04/repository/seam; no unrelated churn).
7. **Avoid** broad staging commands such as `git add .` or `git add -A`.

---

## 8. Contracts and failure semantics

### 8.1 Success path

| Step | Requirement |
| --- | --- |
| Inputs | Connection-derived `{ workspaceId, vaultSecretId }` after blank/trim guards |
| Entry seam | Internal callable helper validates then invokes port |
| Port call | `lookupExact` |
| Repository | Compound `(id, workspaceId)` + narrow select |
| Success result | Only `{ id, workspaceId, purpose, state }` |
| Ciphertext | **Never** returned |

### 8.2 Failure matrix

| Condition | Required behavior |
| --- | --- |
| Blank / missing / invalid `workspaceId` or `vaultSecretId` | Fail closed; **zero** port calls; **zero** repository metadata calls |
| `NOT_FOUND` (incl. foreign workspace) | Fail closed; no “fresh” env UPDATE claim |
| `UNAVAILABLE` (repo/timeout/infra) | Fail closed; no false success summary |
| `INVALID` (bad/incomplete projection) | Fail closed; no false success summary |
| Dependency / mapper failure | Map to `UNAVAILABLE` or `INVALID` as appropriate; fail closed |
| False successful `operation_summary` attributable to port success claims | **Forbidden** |
| IA-REV-03 crash-after-commit residual | **Preserved unresolved** — Port does **not** “solve” it |

### 8.3 Propagation note for Full-D Stage 4 (informational; not authorized here)

Full-D Stage 4’s future per-attempt loop must consume the Entry seam’s fail-closed outcomes. Port IA must not invent Stage 4 orchestration; it must leave a clear, testable internal seam and failure contract for that later consumer.

---

## 9. B-04 boundaries

| Mechanism | Verified symbol / location | Port classification |
| --- | --- | --- |
| Lease start / resume / heartbeat / release | `Conn04MigrationBoundaryService` + `MIGRATION_GATE_PORT` | **NO CHANGE** |
| Write authority / fence CAS | `assertWriteAuthority` / `FivConn04DEnvironmentBackfillWrite.assertWriteAuthorityInTransaction` | **NO CHANGE** |
| Durable authority token | `MIGRATION_GATE_DURABLE_AUTHORITY` | **NO CHANGE** |
| SYSTEM_JOB identity construction | `buildFivConn04DSystemJobActor` inside Entry only | **NO CHANGE** |
| Module export walls for B-04 / PORT / durable / Entry | `connections.module.ts` exports preflight only | **NO CHANGE** (must remain) |

**Binding rule:** Vault Metadata Port is **not** a B-04 substitute and must not export or re-route lease/write-authority mechanisms through the dedicated metadata module (Successor-01 §3.3 stop conditions; Option B export-wall practice). The internal Entry lookup seam must not become a new authority mechanism.

---

## 10. Test and acceptance matrix

**Claim status:** These are **required future tests** under a **separately ratified** Port IA. This draft does **not** claim any have been written or passed. **No test-pass claims are authorized** in this document before execution evidence exists.

### 10.1 Exact test-file inventory control

| Rule | Binding under this draft |
| --- | --- |
| Coverage IDs | Retain T-VMP-01…T-VMP-16 requirements below |
| Exact file / symbol names | Engineering may select within approved architectural intent and Vault / Connections module boundaries |
| Before coding (after Port IA ratification) | Engineering **must** record a bounded test-file inventory identifying each test file as **CREATE**, **MODIFY**, or **NO CHANGE** |
| New test files | Must remain within `apps/api/src/modules/secret-vault/` and `apps/api/src/modules/connections/` |
| Production source files | Any production source file **not** in §7.1 / §7.2 requires a **separate PO decision** before modification |
| Pass claims | Forbidden in authorization documents until executed evidence exists |

### 10.2 Required coverage (IDs retained)

| ID | Proposed test focus | Proves | Primary location (working basis) |
| --- | --- | --- | --- |
| T-VMP-01 | Metadata-only success result | Only four fields returned | `fiv-conn-04-d-vault-metadata.service.spec.ts` |
| T-VMP-02 | Narrow Prisma `select` / no cipher columns | Query-level minimization | service + prisma repository tests |
| T-VMP-03 | Compound exact lookup success | `(id, workspaceId)` hit | service / repository specs |
| T-VMP-04 | Wrong workspace / wrong id / unknown → `NOT_FOUND` | Isolation + not-found | service specs |
| T-VMP-05 | In-memory parity with Prisma semantics | Repository parity | in-memory + service specs |
| T-VMP-06 | Blank/missing IDs → zero port + zero repo metadata calls | Fail-closed guards on Entry seam | Entry binding / seam specs |
| T-VMP-07 | No caller override / no cross-Connection mixing | Binding integrity | Entry binding / seam specs |
| T-VMP-08 | `UNAVAILABLE` / `INVALID` fail-closed; no false summary | Failure semantics | service + Entry seam specs |
| T-VMP-09 | Dedicated module export wall (port only) | Option A export discipline | `fiv-conn-04-d-vault-metadata.module.spec.ts` |
| T-VMP-10 | `SecretVaultModule` / `ConnectionsModule` do not export port / seam | Stop conditions | module specs + Connections export checks |
| T-VMP-11 | Negative injection: public/controller surfaces do not obtain port | Educational boundary tests | Connections / Nest negative specs |
| T-VMP-12 | Entry does **not** inject `SecretVaultService` / repository for D freshness | Dual-path prohibition | Entry specs |
| T-VMP-13 | Lifecycle doubles compile with new repository method | Interface completeness | `secret-vault.lifecycle.spec.ts` |
| T-VMP-14 | Human ACL / A Preflight `list` regressions remain green | A path preserved | existing `fiv-conn-04-a-preflight.service.spec.ts` / vault ACL specs (REUSE) |
| T-VMP-15 | Module wiring: Entry resolves port token after Connections import; internal seam callable | Option A DI + seam | Entry / module wiring / seam specs |
| T-VMP-16 | B-04 non-regression (start/HB/release/write-authority scaffold) | Port is not B-04 substitute | existing Entry / boundary / write-unit specs (REUSE) |

### 10.3 Acceptance criteria (Successor-01 §12, adapted to Port-only scope)

1. Port success returns only `{ id, workspaceId, purpose, state }`.
2. Exact `(id, workspaceId)` query with narrow `select`.
3. Wrong workspace / unknown id → `NOT_FOUND`.
4. `UNAVAILABLE` / `INVALID` / blank-ID fail closed; no false summary.
5. Export walls hold; repository private to dedicated module; seam not publicly exported.
6. Entry injects port for D freshness and exposes the internal callable seam; does not use `SecretVaultService.list` for that path.
7. No port audit event; AC #7 governance contract preserved.
8. Same-module Nest limitation documented; mandatory negative tests present.
9. Connection-derived binding + zero-I/O blank guards proven on the seam.
10. Lifecycle doubles updated.
11. Option A wiring as specified.
12. Independent Review of **Port delivery** (mandatory) + separate PO Port closure before any Full-D Stage 4 grant.
13. §7.5 dirty-baseline evidence recorded for `connections.module.ts`.
14. §10.1 test-file inventory recorded before coding and adhered to during delivery.

---

## 11. Proposed implementation sequence and review gates

### 11.1 One bounded Port work package (OQ-VMP-06)

Artificial Port sub-stage splitting is **not** authorized under this draft. Successor-01 §10 is one coherent inventory. **VMP-1** is a **Work Package ID**, not a Full-D Stage number and does **not** change or extend Full-D Stage 0–9 numbering.

| Field | Content |
| --- | --- |
| **Work Package ID** | **VMP-1 — Vault Metadata Port delivery** |
| **Objective** | Deliver Successor-01 §10 Port capability + Connections/Entry consumer wiring + callable internal Entry lookup seam + binding/guards within export walls |
| **Exact inventory** | §7.1 + §7.2 (including OQ-VMP-03 / OQ-VMP-04) |
| **Dependencies** | Separate ratified Port IA; Successor-01 architecture; Stage 3 closed; PrismaModule / existing Vault repositories; §7.5 baseline captured; §10.1 test-file inventory recorded |
| **Required tests** | T-VMP-01…T-VMP-16 |
| **Entry criteria** | Separate PO ratification act for Port IA candidate `D-CONN04-FULL-D-IA-VMP` (this draft alone is insufficient); optional pre-implementation IR may already have occurred (**OQ-VMP-05**) but is **not** required to start coding after ratification |
| **Exit criteria** | Inventory complete; required tests pass with execution evidence; no unauthorized files; export walls hold; no ciphertext exposure; A Preflight preserved; B-04 non-regression; §7.5 Port-only diff evidence; delivery IR complete per §5.4 |
| **Required Independent Review** | **Yes — mandatory written IR of completed delivery** before PO Port closure (**OQ-VMP-08**) |
| **PO gate** | Separate written Port closure act; for `PASS WITH OBSERVATIONS`, PO must explicitly accept residual observations; Port closure **does not** authorize Full-D Stage 4 |

### 11.2 Split sub-stages — not used

Per **OQ-VMP-06 ONE**, Port delivery is **not** split into VMP-1a / VMP-1b. No mid-package IR entry gate applies.

### 11.3 Post-Port gate before Full-D Stage 4

Port closure **must not** automatically authorize Full-D Stage 4. Stage 4 requires its own explicit PO Implementation Authorization covering IMPL-REV-D-06 consumer loop (fresh Vault via dedicated port/seam + occupancy + C before each write), still excluding env UPDATE until Stage 5 authorization.

---

## 12. Product Owner dispositions (OQ-VMP-01…08) — resolved for this draft

| # | Decision | PO disposition | Effect in this draft |
| --- | --- | --- | --- |
| **OQ-VMP-01** | Ratify / amend / reject this Port IA package | **Conditional approval after revision** | Draft revised; **NOT RATIFIED**; separate ratification act still required; **no coding authorized** |
| **OQ-VMP-02** | Candidate Decision ID `D-CONN04-FULL-D-IA-VMP` | **ACCEPT** | Candidate ID fixed; still candidate-only until ratification act |
| **OQ-VMP-03** | Include ConnectionsModule + Entry inject | **INCLUDE** | §7.2 / §5.1 / §6.1 binding |
| **OQ-VMP-04** | Entry callable internal seam vs inject-only | **INCLUDE callable internal seam** | §5.1 / §6.6 / §7.2 binding; no Stage 4 orchestration |
| **OQ-VMP-05** | Pre-implementation IR of this package | **OPTIONAL** | Not a mandatory coding entry gate |
| **OQ-VMP-06** | One Port work package vs split | **ONE** | Work Package **VMP-1** only; no sub-stage split |
| **OQ-VMP-07** | F-OBS / S3-OBS remediation in Port scope | **NONE** | Statuses preserved; no remediate/waive/close/reclassify |
| **OQ-VMP-08** | Written IR mandatory before PO Port closure | **YES** | §5.4 / §11 / §14 binding; verdict rules include `PASS` / `PASS WITH OBSERVATIONS` |

No OQ-VMP-01…08 item remains unresolved as an open PO choice inside this draft. Remaining gates are **process gates** (separate ratification act; optional pre-IR; delivery IR; Port closure; later Stage 4 IA), not undecided dispositions.

---

## 13. Scope exclusions and non-authorizations

```text
THIS DRAFT DOES NOT AUTHORIZE:
  VAULT METADATA PORT CODING / IMPLEMENTATION
  FULL-D STAGE 4 COMMENCEMENT OR CODING
  STAGES 5–8
  CONNECTION.ENVIRONMENT UPDATE
  FULL-D BACKFILL / runEnvironmentBackfill OPERATIONAL LOOP
  VAULT METADATA FRESHNESS LOOP / PER-ATTEMPT CONSUMER ORCHESTRATION
  OCCUPANCY + C ORCHESTRATION AS STAGE 4 WORK
  FIV-CONN-04-E
  PRODUCTION DEPLOYMENT / ACTIVATION
  LIVE-CAPITAL OPERATIONS
  AUTOMATIC PROGRESSION
  DECISION REGISTER MUTATION BY THIS DRAFT
  REMEDIATION OR CLOSURE OF F-OBS-01…F-OBS-04
  SILENT CLOSURE / RECLASSIFICATION OF S3-OBS-01…S3-OBS-03
  TREATING EDUCATIONAL NEST DI AS PRODUCTION S2S / VAULT AUTHZ PROOF
  SOLVING IA-REV-03 VIA PORT PACKAGE
  PUBLIC EXPORT OF ENTRY LOOKUP SEAM

AUTHORIZED ONLY AFTER SEPARATE PO RATIFICATION ACT OF THIS (OR FURTHER-REVISED) PORT IA:
  → Bounded Port inventory in §7 (as PO finally ratifies)
  → Required tests in §10
  → Work package VMP-1 sequence in §11
```

---

## 14. Port completion and closure criteria

Port work package **VMP-1** may be proposed for PO closure only when **all** of the following are true:

1. All PO-authorized inventory items implemented (and only those).
2. All required tests for the authorized scope pass (executed under authorized implementation work; evidence recorded).
3. No unauthorized file changes; any production file outside §7.1 / §7.2 was not modified without separate PO decision.
4. No module/export-wall violations (`SecretVaultModule` / `ConnectionsModule` / dedicated module); Entry seam not publicly exported.
5. No secret/ciphertext exposure via port/view/select path.
6. Fail-closed semantics verified (NOT_FOUND / UNAVAILABLE / INVALID / blank-ID) on port and Entry seam.
7. Existing human ACL / A Preflight `list` path preserved.
8. B-04 non-regression verified (lease / write-authority scaffold unchanged in role).
9. §7.5 dirty-baseline and Port-only `connections.module.ts` diff evidence recorded.
10. §10.1 test-file inventory recorded before coding and followed.
11. Mandatory written Independent Review of completed delivery recorded with verdict **`PASS`** or **`PASS WITH OBSERVATIONS`**.
12. BLOCKER = **0** and MAJOR = **0**.
13. Every IR observation explicitly records severity, impact, evidence, and disposition.
14. If verdict is **`PASS WITH OBSERVATIONS`**, the Product Owner **explicitly accepts** residual observations in the Port closure act.
15. F-OBS-01…04 remain **OPEN** and S3-OBS-01…03 remain **ACCEPTED / RECORDED** unless a **separate** PO decision changes them; IA-REV-03 remains unresolved.
16. Separate written Product Owner Port closure decision issued.

**Port closure does NOT authorize Full-D Stage 4.** Stage 4 requires its own separate PO authorization.

---

## 15. Proposed final PO authorization wording

_For use only in a **separate** Product Owner ratification act after final PO review of this draft. Not effective in this draft. Does not grant coding by appearing here._

```text
Decision / Act ID: D-CONN04-FULL-D-IA-VMP
Status: APPROVED — VAULT METADATA PORT IMPLEMENTATION AUTHORIZATION GRANTED
WITH BOUNDED SCOPE AND CONDITIONS

The Product Owner AUTHORIZES implementation of Vault Metadata Port work package
VMP-1 for FIV-CONN-04-D within the inventory and constraints of the ratified
Port IA package (hash-bound), including Nest Option A dedicated Vault metadata
module (export port only), repository compound metadata query, ConnectionsModule
import, Entry port injection, and a narrowly scoped callable internal Entry
lookup seam with Connection-derived binding and blank-ID guards for future
Stage 4 use. The seam is not a public HTTP/DTO/Nest-export surface and does not
implement Stage 4 orchestration.

Work Package VMP-1 is one bounded Port delivery package and does not alter
Full-D Stage 0–9 numbering.

Stage 3 remains FORMALLY CLOSED.
F-OBS-01…F-OBS-04 remain OPEN.
S3-OBS-01…S3-OBS-03 remain ACCEPTED / RECORDED.

Pre-implementation Independent Review of the IA package is OPTIONAL and is not
a mandatory coding entry gate.
Written Independent Review of completed Port delivery is MANDATORY before
separate PO Port closure. Permitted IR verdicts: PASS or PASS WITH OBSERVATIONS.
BLOCKER and MAJOR must be zero. Observations must be explicitly recorded.
For PASS WITH OBSERVATIONS, PO must explicitly accept residual observations
before Port closure.

This authorization does NOT authorize:
  Full-D Stage 4 commencement or coding;
  Stages 5–8;
  Connection.environment UPDATE;
  Full-D backfill execution / runEnvironmentBackfill operational loop;
  per-attempt Stage 4 freshness consumer loop (occupancy + C orchestration);
  FIV-CONN-04-E;
  production deployment/activation;
  live-capital operations;
  automatic progression.

Port closure does not authorize Stage 4.
```

---

## 16. Repository baseline at this revision

| Field | Value |
| --- | --- |
| Branch | `main` |
| HEAD | `a59c533977923a45413a176ad143325a948feeb8` |
| Revised by this task | This draft document only |
| Modified existing files (this task) | This draft only |
| Decision Register | **Unchanged by this task** |
| Application source / tests | **Unchanged** |
| Prior ratification / successor acts | **Unchanged** |
| Pre-existing dirty/untracked | **Preserved** |

---

_End of DRAFT Vault Metadata Port Implementation Authorization Package (`D-CONN04-FULL-D-IA-VMP` candidate). Revised for OQ-VMP-01…08. Not ratified. No coding authorized. Ready for final PO review and a separate ratification act._
