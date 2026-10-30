# Independent Reviewer Report — FIV-CONN-04-D Stage 2

**Review class:** Independent Review (written)  
**Governing decision:** `D-CONN04-FULL-D-IA-S23-B` (Option B)  
**Review date:** 2026-10-30  
**Nature:** Review only. No code, tests, governance docs, register, staging, commit, push, or Stage 3 work performed.

---

## Overall verdict

# **PASS WITH OBSERVATIONS**

No material Stage 2 authorization violation remains unresolved. Observations below are non-blocking for Stage 2 exit under `D-CONN04-FULL-D-IA-S23-B`.

**Stage 3 entry-gate statement:** This written **PASS WITH OBSERVATIONS** satisfies the mandatory Independent Reviewer gate for **Stage 3 consideration** under Option B OQ-3 / Register `D-CONN04-FULL-D-IA-S23-B`. It does **not** itself start Stage 3; Stage 3 remains subject to separate PO process and must not begin automatically from this report.

---

## 1. Review scope and sources

Independently inspected (actual repository contents; prior impl / evidence-check reports used only as navigation aids):

| Source                                                                       | Role                                     |
| ---------------------------------------------------------------------------- | ---------------------------------------- |
| `v3-l02-fiv-conn-04-d-implementation-authorization-option-b-po-decision.md`  | Stage 2 inventory / exclusions / IR gate |
| `wave-6-po-decision-register.md` § `D-CONN04-FULL-D-IA-S23-B`                | Register sync / gate text                |
| `v3-l02-fiv-conn-04-d-implementation-authorization-request-stage-2-3.md`     | Request inventory                        |
| `v3-l02-fiv-conn-04-d-stage-2-3-authorization-scope-matrix.md`               | S2-01…S2-07 / T-S2-*                     |
| `v3-l02-fiv-conn-04-d-implementation-authorization.md` COND-IA-04, §7.2, §15 | Bindings / deferred detail               |
| `v3-l02-fiv-conn-04-slice-planning-package.md` §13                           | Audit floor                              |
| Stage 2 code + tests listed in §3                                            | Implementation under review              |
| `security-audit.service.ts` (unchanged)                                      | Shared persistence / sensitizer          |
| Live vitest execution (this review)                                          | Test evidence                            |

**Integrity spot-check (hashes match Register / Option B baselines):**

- Option B act: `313d96191effe57738fbd5012aeb28897160b4b0aa37277c875863ca2bd9575c`
- Request package: `cd2e96d841245bbcaaa43716f75c125e7c657f9c94e82e916d2c5cee641a0787`
- Scope matrix: `0372062dcdd5d6d5e6ddbd1c529957e370c78126f500d6793a1566efcb1fab02`
- Full-D IA: `fee16e975ac9d117c336799e4708ba137635ef387cdd5dc28d8aeb0ca519b039`

---

## 2. Repository branch and HEAD

| Field              | Value                                      |
| ------------------ | ------------------------------------------ |
| Branch             | `main`                                     |
| HEAD               | `953292675e197d4f25778aaaa59eacb2826560fe` |
| Staged             | **None**                                   |
| Reviewer mutations | **None**                                   |

---

## 3. Exact reviewed file inventory

**Stage 2 under review**

- `apps/api/src/modules/security-audit/security-audit-classification.ts`
- `apps/api/src/modules/security-audit/security-audit-attribution.ts`
- `apps/api/src/modules/security-audit/security-audit-attribution.spec.ts`
- `apps/api/src/modules/security-audit/security-audit.service.spec.ts`
- `apps/api/src/modules/security-audit/security-audit.service.ts` (REUSE / no diff)
- `apps/api/src/modules/connections/connection-environment-backfill-audit.ts` (untracked CREATE)
- `apps/api/src/modules/connections/connection-environment-backfill-audit.spec.ts` (untracked CREATE)
- `apps/api/src/modules/connections/connections.module.ts` (mixed dirty: P-D-02 + Stage 2)

**Baseline / regression context**

- `apps/api/src/modules/connections/connection-migration-gate-audit.ts` (pattern mirror)
- `apps/api/src/modules/connections/conn04-migration-boundary.service.spec.ts` (export-wall regressions; P-D-02)
- HEAD blob of `connections.module.ts` for P-D-02 separation

---

## 4. S2-01…S2-07 review matrix

| ID        | Controlling requirement                                                                                                        | Independent finding                                                                                                                                                                              | Result                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| **S2-01** | Exact type `connection.environment-backfill`; `eventClass: connection` (§13; COND-IA-04; Option B §3.1)                        | Catalog entry at classification L130–139; character-for-character; only one new `connection.*` type                                                                                              | **PASS**                         |
| **S2-02** | Attribution within §13 / COND-IA-04; SYSTEM_JOB `actorId`; Full-D IA §7.2 workspace/actor/resource; OQ-2 Engineering-delegated | Rule at attribution L60–65 requires `workspaceId`, `actorId`, `resourceType`, `resourceId` — matches lifecycle pattern; helper takes `actorId` string (no `PrivilegedActorContext` construction) | **PASS**                         |
| **S2-03** | Connections-local helper; sanitize; refuse secrets; txn-capable `SecurityAuditService.record`; mirror migration-gate           | Helper L80–141: allowlist + forbidden refuse; throw before record on bad payload; forwards `transaction`                                                                                         | **PASS** (see vaultSecretId OBS) |
| **S2-04** | REUSE `security-audit.service.ts`; no outbox / second audit bus                                                                | `git diff` empty for service; `record(..., transaction?)` L29–77 reused                                                                                                                          | **PASS**                         |
| **S2-05** | Admit + refuse + attribution coverage (T-S2-01…04)                                                                             | Service admit L99–130; unclassified refuse L83–88 retained; attribution spec L53–73                                                                                                              | **PASS**                         |
| **S2-06** | Helper sanitize / attribution / txn / type (T-S2-05/06)                                                                        | Helper spec covers retain/strip, sensitive refuse, emit+attribution, txn forward, vaultSecretId refuse                                                                                           | **PASS**                         |
| **S2-07** | Nest provider iff injected; preserve export walls                                                                              | Provider L37; `exports: [FivConn04APreflightService]` L50 — helper **not** exported; no B-04/PORT/durable/Entry export added by Stage 2                                                          | **PASS**                         |

**Explicit confirmation:** No material Stage 2 authorization violation remains unresolved after this review.

---

## 5. Test and verification evidence (executed this review)

```text
npx vitest run
  security-audit.service.spec.ts
  security-audit-attribution.spec.ts
  connection-environment-backfill-audit.spec.ts
  security-audit-retention.spec.ts
  conn04-migration-boundary.service.spec.ts
→ PASS — 5 files, 40 tests
```

| Matrix ID                               | Evidence                                                            | Result   |
| --------------------------------------- | ------------------------------------------------------------------- | -------- |
| T-S2-01 exact type admit                | Service admit + catalog L130                                        | **PASS** |
| T-S2-02 unknown refuse                  | Service refuse `technical.retry`                                    | **PASS** |
| T-S2-03 admit path                      | Same admit test                                                     | **PASS** |
| T-S2-04 attribution                     | Attribution rule + spec; SYSTEM_JOB actorId usable                  | **PASS** |
| T-S2-05 sanitize refuse                 | Helper spec sensitive + vaultSecretId refuse                        | **PASS** |
| T-S2-06 txn overload                    | Helper spec L112–145                                                | **PASS** |
| T-S2-07 no second type                  | Catalog grep: only one new type                                     | **PASS** |
| T-S2-08 no emission-before-registration | No `runEnvironmentBackfill` / operational loop in Stage 2 inventory | **PASS** |

---

## 6. Detailed `vaultSecretId` assessment

| Question                     | Independent conclusion                                                                                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §13 status                   | **Allowed**, not mandatory — heading “Safe payload fields **(allowed)**” (§13 L631–638). Forbidden list targets raw secret bodies, not opaque IDs (§13 L641–645).                                                    |
| Stage 2 mandatory to record? | **No.** Stage 2 inventory is catalog/attribution/helper/tests (Option B §3.1). Exact payload wiring is **DEFERRED DETAIL** (Full-D IA COND-IA-04 L164; §15 L651). Operational emission excluded from Stage 2 (§3.2). |
| Shared sanitizer             | **Intentional substring refuse:** `SENSITIVE_KEY = /…\|secret\|…/i` (`security-audit.service.ts` L15, L96–97). `vaultSecretId` matches (`true` under Node check).                                                    |
| Helper behavior              | Refuses `vaultSecretId` at Connections sanitizer (helper L73–89; spec L163–176) rather than amending shared service (correct under S2-04 REUSE-only).                                                                |
| Mandatory Stage 2 breach?    | **No.** Conservative restriction preserving established trust boundary; does not invent alternate field names or weaken shared sensitizer.                                                                           |

**Finding F-OBS-01 (OBSERVATION):** Documented payload-key limitation relative to §13 allowlist.  
**Impact:** Stage 2 emission **capability** remains valid without that key; future stages that mandate exact key `vaultSecretId` in durable payload would need separate PO / shared-service decision.  
**Required action now:** None for Stage 2 exit. Record for later-stage planning.

---

## 7. P-D-02 / Stage 2 diff separation (`connections.module.ts`)

Compared working tree to `HEAD` blob:

| Delta vs HEAD                                                           | Attribution              |
| ----------------------------------------------------------------------- | ------------------------ |
| Import + provider `Conn04SystemJobMigrationEntry`                       | **Pre-existing P-D-02**  |
| Export wall narrowed to `[FivConn04APreflightService]` + P-D-02 comment | **Pre-existing P-D-02**  |
| Import + provider `ConnectionEnvironmentBackfillAudit`                  | **Stage 2 (S2-07) only** |

**Stage 2 did not change module exports.** Helper remains unexported. Export internalization of B-04/PORT/durable is P-D-02 baseline, not Stage 2 scope expansion.

---

## 8. Prohibited-scope verification

**Search scope:** Stage 2 inventory files in §3.

| Prohibited item                                                          | Result                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------- |
| `Connection.environment` UPDATE / `updateMany` / live env write          | **NONE**                                          |
| Operational Full-D backfill / `runEnvironmentBackfill`                   | **NONE**                                          |
| Vault metadata port / `lookupExact`                                      | **NONE**                                          |
| Stage 3 write-unit / `assertWriteAuthority` / Entry lease Stage 3 wiring | **NONE** in Stage 2 inventory                     |
| Stages 4–8 / FIV-CONN-04-E                                               | **NONE**                                          |
| Public HTTP/DTO / new SYSTEM_JOB constructor                             | **NONE**                                          |
| Unauthorized shared audit infra change                                   | **NONE** (`security-audit.service.ts` unchanged)  |
| Additional audit event types                                             | **NONE** beyond `connection.environment-backfill` |

---

## 9. Findings (severity / evidence / impact / action)

| ID           | Severity              | Evidence                                                                                                                 | Impact                                                                                       | Action                                                     |
| ------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **F-OBS-01** | OBSERVATION           | Helper refuses `vaultSecretId`; shared `/secret/i` boundary; §13 lists field as allowed; Stage 2 wiring deferred         | No Stage 2 mandatory breach; later emission under exact key blocked until PO/shared decision | Document only; no Stage 2 remediation                      |
| **F-OBS-02** | OBSERVATION           | Helper allowlist includes §13 run counters (`scanned`, `updated`, …) beyond the strict “Safe payload fields” bullet list | Supports `operation_summary` within §13 counters; not a second event type                    | Accept as Engineering within floor; no remediation         |
| **F-OBS-03** | OBSERVATION           | No dedicated `security-audit-classification.spec.ts`; T-S2-01 covered via service admit                                  | Adequate under existing project pattern                                                      | None                                                       |
| **F-OBS-04** | OBSERVATION (hygiene) | `connections.module.ts` working-tree diff mixes P-D-02 + Stage 2                                                         | Reviewer risk of mis-attribution only                                                        | Separate when reviewing / committing; Stage 2 itself clean |

**BLOCKER / MAJOR / MINOR material findings:** **0**

---

## 10. Overall verdict and rationale

**PASS WITH OBSERVATIONS** because:

1. Authorized Stage 2 inventory S2-01…S2-07 is present and consistent with Option B / COND-IA-04 / matrix.
2. Classification admits exactly the ratified type; attribution and helper are coordinated; service REUSE preserved.
3. Focused tests executed in this review: **40/40 PASS**.
4. Prohibited Stage 3+ / env UPDATE / Vault port / second type / shared-service mutation: **absent**.
5. `vaultSecretId` is a **documented limitation**, not a Stage 2 mandatory contract failure under deferred payload wiring + “allowed” (not required) §13 wording.
6. Export walls preserved for Stage 2 provider registration; P-D-02 deltas correctly separated.

---

## 11. Stage 3 gate statement (explicit)

| Statement                                                                                  | Binding                                                                                                                                                            |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Independent Reviewer written verdict                                                       | **PASS WITH OBSERVATIONS**                                                                                                                                         |
| Satisfies Option B mandatory Stage 2 → Stage 3 **entry-gate review** for PO consideration? | **YES**                                                                                                                                                            |
| Stage 3 automatically authorized to start by this report?                                  | **NO**                                                                                                                                                             |
| Stage 3 implementation begun by this review?                                               | **NO**                                                                                                                                                             |
| Remaining Stage 3 precondition for Engineering start                                       | Separate PO process / instruction after this written PASS; Stage 3 remains write-unit authority/CAS scaffolding only; still **no** `Connection.environment` UPDATE |

---

_End of Independent Reviewer Report — FIV-CONN-04-D Stage 2 / `D-CONN04-FULL-D-IA-S23-B`._
