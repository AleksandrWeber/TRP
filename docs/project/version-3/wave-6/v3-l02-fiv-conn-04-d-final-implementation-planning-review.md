# FIV-CONN-04-D / P-D-02 — Final Independent Implementation Planning Review

**Document:** Final independent review of the updated P-D-02 Implementation Planning package (including §16 clarifications)  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Subject plan:** [`v3-l02-fiv-conn-04-d-pd02-implementation-planning.md`](./v3-l02-fiv-conn-04-d-pd02-implementation-planning.md)  
**Repository `HEAD` at review:** `953292675e197d4f25778aaaa59eacb2826560fe` (`main`)  
**Nature:** **REVIEW ONLY.** Does **not** implement P-D-02 or FIV-CONN-04-D. Does **not** modify the planning package, source, tests, schema, or other governance artifacts. Does **not** authorize implementation. A positive verdict is **not** permission to implement.

```text
VERDICT: PASS WITH CONDITIONS
P-D-02 IMPLEMENTATION: NOT AUTHORIZED
FIV-CONN-04-D IMPLEMENTATION: NOT AUTHORIZED
SEPARATE IMPLEMENTATION AUTHORIZATION DECISION: STILL REQUIRED
```

---

## 1. Review purpose and scope

Determine whether the P-D-02 implementation plan is sufficiently complete, internally consistent (with §16 controlling), secure, and aligned with approved governance to proceed to a **separate** Implementation Authorization decision for the **P-D-02 identity/binding slice only**.

**In scope:** Governance alignment; SYSTEM_JOB trust boundary; durable authority / PORT / B-04; plan completeness; residual conditions; scope fences.

**Out of scope:** Code changes; test execution; rewriting historical decisions; full D backfill authorization.

This review is independent of the earlier D Implementation Planning Review ([`v3-l02-fiv-conn-04-d-implementation-planning-review.md`](./v3-l02-fiv-conn-04-d-implementation-planning-review.md)), which assessed full-D planning and still records P-D-02 as blocking for **D** Authorization.

---

## 2. Reviewed artifact inventory

### 2.1 Governance and authority (found)

| Artifact                    | Path                                                            | Status |
| --------------------------- | --------------------------------------------------------------- | ------ |
| PO SYSTEM_JOB ratification  | `v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md` | Found  |
| P-D-02 model ratification   | `v3-l02-fiv-conn-04-d-pd02-ratification.md`                     | Found  |
| P-D-02 disposition          | `v3-l02-fiv-conn-04-d-pd02-disposition.md`                      | Found  |
| Identity provisioning spec  | `v3-l02-fiv-conn-04-d-pd02-identity-provisioning-spec.md`       | Found  |
| Wave-6 PO Decision Register | `wave-6-po-decision-register.md` (`D-CONN04-PD02-SJ`)           | Found  |

### 2.2 Architecture and planning (found)

| Artifact                                     | Path                                                               | Status              |
| -------------------------------------------- | ------------------------------------------------------------------ | ------------------- |
| Architecture decision package                | `v3-l02-fiv-conn-04-d-system-job-architecture-decision-package.md` | Found               |
| Architecture discovery                       | `v3-l02-fiv-conn-04-d-system-job-architecture-discovery.md`        | Found               |
| **P-D-02 implementation planning (subject)** | `v3-l02-fiv-conn-04-d-pd02-implementation-planning.md`             | Found (§16 present) |
| Full D implementation planning               | `v3-l02-fiv-conn-04-d-implementation-planning.md`                  | Found               |
| Full D implementation planning review        | `v3-l02-fiv-conn-04-d-implementation-planning-review.md`           | Found               |
| Decision Freeze                              | `v3-l02-fiv-conn-04-d-decision-freeze.md`                          | Found               |
| Slice Approval                               | `v3-l02-fiv-conn-04-d-slice-approval.md`                           | Found               |

### 2.3 Source contracts inspected (read-only; not modified)

| Path                                                                        | Role                                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `apps/api/src/modules/connections/connections.module.ts`                    | Exports L44–48                                                |
| `apps/api/src/modules/connections/conn04-migration-boundary.service.ts`     | B-04 façade                                                   |
| `apps/api/src/modules/connections/migration-gate.port.ts`                   | PORT contract                                                 |
| `apps/api/src/modules/connections/migration-gate-durable-authority.port.ts` | Durable CAS contract                                          |
| `apps/api/src/modules/connections/prisma-migration-gate.adapter.ts`         | CAS implementation ~L751–775; `reclaimAsOperator`             |
| `apps/api/src/modules/connections/connection-migration-gate-audit.ts`       | Audit `actorId`                                               |
| `apps/api/src/modules/security-audit/security-audit-attribution.ts`         | `connection.migration-gate` requires `actorId`                |
| B-04 / B-05 specs (representative)                                          | Controller isolation; durable mocks; module export assertions |

**Not found as a pre-existing artifact:** `v3-l02-fiv-conn-04-d-final-implementation-planning-review.md` (this document creates it).

---

## 3. Governance alignment findings

| Ratified requirement                                             | Plan alignment                                             | Evidence                                    | Result                |
| ---------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------- | --------------------- |
| `actorKind = SYSTEM_JOB`                                         | Plan binds SYSTEM_JOB only for Entry                       | PO ratification §4–5; plan §2, §16.2.1      | **Aligned**           |
| Exact `actorId = system-job:fiv-conn-04-migration-backfill`      | Character-for-character in plan §2 / §5.A / §16            | PO §5; Decision Register `D-CONN04-PD02-SJ` | **Aligned**           |
| Ratification = policy SoT; constant = mirror after authorization | Plan §2 SoT; §5.A env/DB forbidden                         | PO §6                                       | **Aligned**           |
| Only trusted D boundary constructs identity                      | §16 Option A designates Entry                              | PO §8.1–4                                   | **Aligned** (via §16) |
| No HTTP / client / job / arbitrary Nest / Trading Runtime supply | Plan §5.B, §7, §8.1, §13                                   | PO §8, §11                                  | **Aligned**           |
| Explicit invocation; no cron                                     | Plan §2 Ops; §13 exclusions                                | PO §11                                      | **Aligned**           |
| B-04 lease contention mandatory                                  | Plan §5.C, §7, acceptance #6                               | PO §8.9, §11                                | **Aligned**           |
| Audit uses canonical `actorId`; no Prisma `actorKind`            | Plan §5.D                                                  | PO §9                                       | **Aligned**           |
| G1–G7 resolved                                                   | Register + PO ratification §12; plan cites policy approved | Decision Register row; G1–G7 Appendix R     | **Aligned**           |
| P-D-02 remains BLOCKED until impl evidence                       | Plan header; disposition Appendix A                        | PO §15                                      | **Aligned**           |
| Full D NOT AUTHORIZED                                            | Plan §13–14; §16                                           | Consistent                                  | **Aligned**           |

**Contradiction check:** Decision Freeze COND-D-03 historical text still shows ops mapping **UNRESOLVED**. PO ratification Path P1 intentionally records mapping without Freeze rewrite. **Not treated as a plan contradiction** — same pattern accepted in prior governance updates. Interpretive note only (**OBSERVATION**).

**No BLOCKER-level governance contradiction found** between the plan (with §16) and PO ratification / OPT-PD02-02 / Decision Register.

---

## 4. SYSTEM_JOB identity and trusted-boundary findings

### 4.1 Option A consistency

§16.2.3 selects **Option A**: `Conn04SystemJobMigrationEntry` **is** the trusted D orchestration boundary for SYSTEM_JOB ↔ B-04.

| Required check                                       | Plan (§16 controlling) | Result                                            |
| ---------------------------------------------------- | ---------------------- | ------------------------------------------------- |
| 1. Entry sole construction boundary                  | §16.2.3                | **Pass**                                          |
| 2. Factory module-private / capability-specific      | §16.2.3; §5.A          | **Pass** (see CONDITION-1 on TS `export` wording) |
| 3. No actor params on Entry                          | §16.2.4; §5.B          | **Pass**                                          |
| 4. Entry not Nest-exported (P-D-02)                  | §16.2.3 / §16.3        | **Pass**                                          |
| 5. Raw B-04 not exported                             | §16.3                  | **Pass**                                          |
| 6. PORT not exported (actor-bearing lifecycle)       | §16.3                  | **Pass**                                          |
| 7. Durable authority internalized; CAS via B-04 only | §16.1.5 / §16.2.3      | **Pass**                                          |
| 8–9. Future D extends/absorbs; no second constructor | §16.2.2–3              | **Pass**                                          |
| 10. No generic run-as API                            | §16.2.3                | **Pass**                                          |

### 4.2 Visibility layers (review insistence)

| Layer                                  | Plan stance                                                              | Review                       |
| -------------------------------------- | ------------------------------------------------------------------------ | ---------------------------- |
| TypeScript `private` / file visibility | Explicitly **not** the cross-module security boundary (§16.1.3, §16.2.4) | **Correct**                  |
| Nest `ConnectionsModule.exports`       | Remove B-04, PORT, durable authority; do not export Entry/factory        | **Correct primary control**  |
| Runtime trust                          | In-process Nest residual; optional R4                                    | **Honest** — not overclaimed |

### 4.3 Historical vs §16 tension (non-blocking)

Earlier plan text still readable:

- §1: “future full D orchestrator **consumer**” of the Entry.
- §5.B DI: “export **only** the Entry (optional)”.
- §6.1 module row: remove B-04 “(and likely PORT)” — omits durable authority.

§16 header states it **supersedes conflicting export/orchestration ambiguity only**. That supersession is adequate **if** Implementation Authorization / kickoff explicitly binds §16 as controlling.

**CONDITION-1** (below): Authorization must require implementers to follow §16 over superseded earlier phrasing.

---

## 5. Durable authority / PORT / B-04 findings

### 5.1 Contract verification against source (independent of §16 narrative)

| Surface                                   | Reviewed evidence                                                                                                      | Matches §16?                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Durable                                   | Port: only `assertDurableAuthorityCas`; adapter ~L751–775 CAS touches `heartbeatAt` only                               | **Yes**                                                                                |
| PORT                                      | `acquire`/`release`/`heartbeat`/`observe`/`validate`; actor on lifecycle                                               | **Yes**                                                                                |
| B-04                                      | Lifecycle via PORT + `assertWriteAuthority` → durable                                                                  | **Yes**                                                                                |
| External Nest consumers of durable / B-04 | Production inject: B-04 only for durable; ConnectionsService uses PORT in-module; no other modules inject B-04/durable | **Yes**                                                                                |
| `reclaimAsOperator`                       | On adapter; used in adapter specs only — not Nest-exported separately                                                  | Un-exporting PORT does **not** break same-module/tests that construct adapter directly |

### 5.2 Export disposition

§16 **SHOULD BE INTERNALIZED** for durable authority, with B-04 + PORT, is **supported by current evidence**. No discrepancy found that would reverse §16.

Internal consumers after un-export: `Conn04MigrationBoundaryService` and `ConnectionsService` remain **same-module providers** — Nest export removal does not remove in-module injection. **Legitimate internal observe/deny-set path preserved.**

### 5.3 Intended call chain (P-D-02)

```text
Entry (trusted boundary)
  → private factory (canonical SYSTEM_JOB)
  → Conn04MigrationBoundaryService (not exported)
       → MIGRATION_GATE_PORT (not exported) for acquire/release/HB
       → MIGRATION_GATE_DURABLE_AUTHORITY (not exported) only via assertWriteAuthority
```

---

## 6. Implementation completeness assessment

| Area                               | Sufficient for separate P-D-02 Authorization? | Notes                                         |
| ---------------------------------- | --------------------------------------------- | --------------------------------------------- |
| Files to create/modify             | **Yes**                                       | §6.1 + §16.3 delta for durable export         |
| Provider / module wiring           | **Yes** with CONDITION-1/2                    | §16 must govern export list                   |
| Identity construction / validation | **Yes**                                       | §5.A fail-closed                              |
| Fail-closed before acquire         | **Yes**                                       | §5.E                                          |
| B-04 / lease lifecycle             | **Yes**                                       | Entry delegates; contention via existing gate |
| Audit attribution                  | **Yes**                                       | Factory → B-04 → existing audit               |
| No fallback actors                 | **Yes**                                       | Forbid-list tests planned                     |
| OPERATOR compatibility             | **Yes**                                       | Explicit non-change; reclaim specs remain     |
| Tests + commands                   | **Yes**                                       | §8; CONDITION-2 extend export assertions      |
| Negative injection tests           | **Yes**                                       | §8.1                                          |
| Scope exclusions                   | **Yes**                                       | §13 — no env UPDATE, P-D-03, cron, etc.       |
| Acceptance matrix                  | **Yes**                                       | §11                                           |
| Rollback                           | **Yes**                                       | §10                                           |

**Omissions (not invented as new ACs; called out):**

- §8.1 export negative tests still say “exclude raw B-04” and do not literally list PORT + durable authority — covered by **CONDITION-2**.
- Exact TypeScript vs Nest meaning of “export” for identity constants in §5.A — **CONDITION-1** / naming hygiene.
- No claim in this review that tests were executed.

---

## 7. Remaining conditions assessment

### 7.1 Enable-guard

| Classification      | **Optional defense-in-depth / implementation detail — NOT mandatory before Authorization**                                                                                                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence            | PO §10 requires ability to disable by preventing construction/B-04 invocation and fail-closed on invalid identity. It does **not** mandate a boolean feature-flag constant. Unexported Entry with no HTTP/public caller already yields a dormant privileged path.                                  |
| PO decision needed? | **No**, if Authorization does **not** freeze a new ops-facing toggle product requirement. Adding `FIV_CONN_04_D_SYSTEM_JOB_ENTRY_ENABLED` as optional in-scope detail is allowed; treating it as a new mandatory product control would require PO approval — plan correctly labels it CONDITIONAL. |
| Verification        | If implemented: unit test refuse-when-disabled. If omitted: document dormancy via no Nest export + no controller wiring.                                                                                                                                                                           |

### 7.2 Optional R4 allowlist

| Classification | **Optional defense-in-depth**                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Evidence       | Same-module residual risk acknowledged; OPERATOR must remain; touches shared B-04                       |
| PO decision?   | **No** unless Authorization elects to mandate it                                                        |
| Verification   | If elected: adapter/unit tests that non-canonical SYSTEM_JOB cannot acquire; OPERATOR reclaim unchanged |

### 7.3 Entry class naming (`Conn04…` vs `FivConn04D…`)

| Classification | **Naming-only**                                                          |
| -------------- | ------------------------------------------------------------------------ |
| Evidence       | §16.2.3 / §16.5 explicitly allow equivalence; Option A semantics binding |
| PO decision?   | **No**                                                                   |
| Verification   | Single production class; docs/tests use one chosen name consistently     |

---

## 8. Scope and authorization boundary

| Excluded item                                                  | Plan fence              | Review        |
| -------------------------------------------------------------- | ----------------------- | ------------- |
| Full D backfill / `Connection.environment` UPDATE              | §13, §5.B, threat model | **Preserved** |
| Vault / Strategy B / P-D-03                                    | §13                     | **Preserved** |
| Public HTTP / UI / cron                                        | §13, §2                 | **Preserved** |
| Trading Runtime / identity registry / Prisma audit `actorKind` | §13                     | **Preserved** |

**Clear distinction:** P-D-02 = identity definition + trusted Entry + Nest export restriction + audit proof on gate path. Full FIV-CONN-04-D execution remains separately unauthorized (also still gated by other items such as P-D-03 per full-D planning review).

This review does **not** authorize either slice.

---

## 9. Findings classified

### BLOCKER

_None._

### CONDITION

| ID              | Requirement                                                                                                                                                                                                                     | Why non-blocking                                                                               | How verified                                                                                                                                  | Separate PO decision?                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **CONDITION-1** | Implementation Authorization / kickoff must state that **§16 is controlling** over superseded §1 / §5.B / §6.1 phrasing (Entry export “optional”; durable authority omitted from §6.1 table; “D orchestrator consumer” wording) | Package already contains explicit supersession; risk is mis-implementation, not missing policy | Authorization text cites §16; PR checklist includes un-export of B-04 **and** PORT **and** durable authority; Entry/factory not Nest-exported | **No**                                                     |
| **CONDITION-2** | Security/module tests must assert Nest `exports` exclude `Conn04MigrationBoundaryService`, `MIGRATION_GATE_PORT`, and `MIGRATION_GATE_DURABLE_AUTHORITY` (extend §8.1 beyond “raw B-04” alone)                                  | Test plan exists; assertion list incomplete relative to §16                                    | Source assertion tests in Entry/B-04 module specs                                                                                             | **No**                                                     |
| **CONDITION-3** | Enable-guard remains **optional**; Authorization must not silently freeze a new mandatory feature-flag product requirement without PO                                                                                           | Aligns with PO disable capability without inventing ops toggle                                 | Authorization scope text                                                                                                                      | **Only if** making enable-guard mandatory product behavior |

### OBSERVATION

| ID        | Note                                                                                                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OBS-1** | Decision Freeze COND-D-03 historical “ops mapping UNRESOLVED” remains in Freeze text; policy SoT is PO ratification (Path P1).                                                                           |
| **OBS-2** | Full-D Implementation Planning Review still lists P-D-02 as blocking for **full D** Authorization — consistent; this P-D-02 plan review does not clear full D.                                           |
| **OBS-3** | §5.A TypeScript `export const` for the identity constant is compatible with Nest non-export if only same-package Entry imports it; must not become a Nest-exported run-as API (**CONDITION-1** hygiene). |
| **OBS-4** | Tests were **not** executed in this review.                                                                                                                                                              |

---

## 10. Final verdict and rationale

```text
PASS WITH CONDITIONS
```

**Rationale:**

1. Governance alignment with PO ratification, exact actor identity, SoT, trusted-boundary rules, audit policy, G1–G7 register entry, and non-authorization of full D is **adequate**.
2. §16 Option A + durable-authority internalization is **evidence-backed** against current Nest contracts and consumers.
3. Implementation detail (files, sequence, acceptance matrix, exclusions, rollback) is **sufficient** for a separate **P-D-02 slice** Implementation Authorization decision.
4. Residual issues are **conditions on kickoff discipline and test assertions**, plus correctly optional enable-guard/R4/naming — **not** missing ratified decisions or unsafe architecture.
5. Historical plan sections contain superseded phrasing; §16 supersession is present but must be **explicitly bound** at Authorization (**CONDITION-1**).

**Not PASS (unconditional):** residual supersession/test-list ambiguity could cause an implementer to re-export Entry or omit durable-authority un-export if §16 is ignored.

**Not BLOCKED:** no material governance/security/architecture conflict requiring plan rewrite or new PO ratification before Authorization can be considered.

---

## 11. Recommended next governance step

1. Product Owner / governance actor reviews this final planning review.
2. If accepted: issue a **separate Implementation Authorization** strictly for the **P-D-02 identity/binding slice**, incorporating **CONDITION-1…3**.
3. Do **not** authorize full FIV-CONN-04-D, environment UPDATE, P-D-03, cron, or Nest re-export of privileged tokens.
4. After implementation evidence: prepare a **separate** P-D-02 satisfaction disposition (plan §9 step 8) — satisfaction is **not** granted by this review.

```text
POSITIVE REVIEW ≠ IMPLEMENTATION AUTHORIZATION
P-D-02 IMPLEMENTATION: NOT AUTHORIZED
FIV-CONN-04-D IMPLEMENTATION: NOT AUTHORIZED
SEPARATE IMPLEMENTATION AUTHORIZATION DECISION: STILL REQUIRED
```

**END OF FINAL INDEPENDENT IMPLEMENTATION PLANNING REVIEW**
