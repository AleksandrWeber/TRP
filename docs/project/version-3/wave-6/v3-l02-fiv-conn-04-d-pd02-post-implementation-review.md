# FIV-CONN-04-D / P-D-02 — Post-Implementation Review (PIR)

**Document:** Independent evidence-based Post-Implementation Review of the P-D-02 SYSTEM_JOB identity-boundary implementation  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Nature:** **REVIEW ONLY.** Does **not** modify source, tests, schemas, migrations, authorization packages, or the Decision Register. Does **not** mark P-D-02 SATISFIED. Does **not** stage, commit, or push.

```text
PIR VERDICT: PASS WITH MINOR FINDINGS
P-D-02 IMPLEMENTATION: COMPLETE (independently verified)
P-D-02 SATISFACTION: BLOCKED UNTIL FORMAL DISPOSITION
FIV-CONN-04-D FULL IMPLEMENTATION: NOT AUTHORIZED
FULL D BACKFILL: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

---

## 1. Review purpose and authorization reference

Determine whether the delivered P-D-02 identity-boundary implementation satisfies:

- Product Owner Implementation Authorization **`D-CONN04-PD02-IA = GRANTED / APPROVED WITH CONDITIONS`**;
- binding CONDITIONS-1…3;
- controlling planning rule: **§16** of [`v3-l02-fiv-conn-04-d-pd02-implementation-planning.md`](./v3-l02-fiv-conn-04-d-pd02-implementation-planning.md) (not full-D planning §16);
- PO SYSTEM_JOB policy ratification ([`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md));
- exact authorized P-D-02 scope only.

Exact identity under review:

```ts
actorKind = 'SYSTEM_JOB';
actorId = 'system-job:fiv-conn-04-migration-backfill';
```

**Authoritative grant:** [`v3-l02-fiv-conn-04-d-pd02-implementation-authorization-ratification.md`](./v3-l02-fiv-conn-04-d-pd02-implementation-authorization-ratification.md)  
**Decision package:** [`v3-l02-fiv-conn-04-d-pd02-implementation-authorization.md`](./v3-l02-fiv-conn-04-d-pd02-implementation-authorization.md) §17 APPROVE (2026-10-30)

A positive PIR does **not** itself update the Decision Register or declare P-D-02 SATISFIED.

---

## 2. Reviewed artifact inventory

### 2.1 Governance (verified present)

| Artifact                   | Path                                                                     | Role                                    |
| -------------------------- | ------------------------------------------------------------------------ | --------------------------------------- |
| IA ratification            | `v3-l02-fiv-conn-04-d-pd02-implementation-authorization-ratification.md` | Grant SoT                               |
| IA decision package        | `v3-l02-fiv-conn-04-d-pd02-implementation-authorization.md`              | Scope + CONDITIONS                      |
| P-D-02 impl planning       | `v3-l02-fiv-conn-04-d-pd02-implementation-planning.md`                   | Plan; **§16 controlling**               |
| Final planning review      | `v3-l02-fiv-conn-04-d-final-implementation-planning-review.md`           | PASS WITH CONDITIONS                    |
| PO identity policy         | `v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`          | Exact actorId SoT                       |
| Identity provisioning spec | `v3-l02-fiv-conn-04-d-pd02-identity-provisioning-spec.md`                | Contract                                |
| P-D-02 disposition         | `v3-l02-fiv-conn-04-d-pd02-disposition.md`                               | Historical disposition                  |
| Decision Register          | `wave-6-po-decision-register.md`                                         | `D-CONN04-PD02-IA` / `D-CONN04-PD02-SJ` |

### 2.2 Implementation inventory (actual working tree)

| #   | Path                                                                                | Status at PIR                  |
| --- | ----------------------------------------------------------------------------------- | ------------------------------ |
| 1   | `apps/api/src/modules/connections/fiv-conn-04-d-system-job-identity.ts`             | **Untracked create** (present) |
| 2   | `apps/api/src/modules/connections/fiv-conn-04-d-system-job-identity.spec.ts`        | **Untracked create** (present) |
| 3   | `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts`      | **Untracked create** (present) |
| 4   | `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.spec.ts` | **Untracked create** (present) |
| 5   | `apps/api/src/modules/connections/connections.module.ts`                            | **Modified** (tracked)         |
| 6   | `apps/api/src/modules/connections/conn04-migration-boundary.service.spec.ts`        | **Modified** (tracked)         |

**Inventory match:** Matches the six-file implementation report. No additional P-D-02 production files found outside this set. Pre-existing unrelated dirty/untracked work remains present (documented in §3) and was **not** treated as P-D-02.

**Separability:** P-D-02 implementation changes are isolatable as the six paths above. Other dirty files (e.g. `live-admission-gate-ports.module.spec.ts`, wave-5/wave-6 docs, `fiv-conn-04-a-classification.spec.ts`) are pre-existing / out of scope and were not attributed to P-D-02.

---

## 3. Git preflight and provenance

| Check                        | Result                                           |
| ---------------------------- | ------------------------------------------------ |
| Branch                       | `main`                                           |
| HEAD                         | `953292675e197d4f25778aaaa59eacb2826560fe`       |
| Index                        | **empty** (no staged files)                      |
| Historical baseline HEAD     | Matches previously reported governance/impl HEAD |
| Commit/push during PIR       | **None**                                         |
| Source/test edits during PIR | **None** (review + this PIR artifact only)       |

`connections.module.ts` diff (summary): add `Conn04SystemJobMigrationEntry` provider; `exports` reduced to `[FivConn04APreflightService]` only (removed `MIGRATION_GATE_PORT`, `MIGRATION_GATE_DURABLE_AUTHORITY`, `Conn04MigrationBoundaryService`).

B-04 production service / Prisma adapter / `connections.service.ts` / Prisma schema: **no diff** under this review.

---

## 4. Identity / factory review

**File:** `fiv-conn-04-d-system-job-identity.ts`

| Requirement                                    | Evidence                                                                          | Result                  |
| ---------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------- |
| Exact `actorId`                                | `FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID = 'system-job:fiv-conn-04-migration-backfill'` | **PASS**                |
| Exact `actorKind`                              | `FIV_CONN_04_D_SYSTEM_JOB_ACTOR_KIND = 'SYSTEM_JOB'`                              | **PASS**                |
| Factory does not accept arbitrary actorId/kind | `BuildFivConn04DSystemJobActorInput` allows only optional `correlationId`         | **PASS**                |
| No env/DB/HTTP/job identity source             | No `process.env` / Prisma / request reads in identity module                      | **PASS**                |
| Validate before return                         | `assertCanonicalFivConn04DSystemJobActor(actor)` after freeze                     | **PASS**                |
| Fail closed                                    | Throws `FivConn04DSystemJobIdentityError` on mismatch/blank/wrong kind            | **PASS**                |
| No fallback actor                              | Constants only; assert rejects alternates                                         | **PASS**                |
| No generic run-as API                          | Single capability factory; no actorId parameter                                   | **PASS**                |
| Single production literal definition           | Spec scans connections production `.ts` — only identity file                      | **PASS** (suite re-run) |

**Tests inspected (assertions, not titles):** exact equality; kind; stability; correlationId-only; source walls for env/DB; assert failures for blank/mismatch/OPERATOR/CLIENT/trading-runtime; single-definition scan. All executed under `fiv-conn-04-d-system-job` (see §9).

**Note:** Constants/factory are TypeScript `export`s for same-package Entry/tests. They are **not** Nest providers and are **not** in `ConnectionsModule.exports`. Residual hard-import risk is Nest/process trust residual (OBSERVATION-PD02-PIR-04).

---

## 5. Trusted Entry and actor-injection review

**File:** `fiv-conn-04-d-system-job-migration-entry.ts` — class `Conn04SystemJobMigrationEntry` (Option A).

### 5.1 Construction boundary

| Check                                                                        | Result                       |
| ---------------------------------------------------------------------------- | ---------------------------- |
| Constructs via `buildFivConn04DSystemJobActor` internally                    | **PASS**                     |
| Factory not caller-controlled                                                | **PASS**                     |
| Public TS signatures omit `actorId` / `actorKind` / `PrivilegedActorContext` | **PASS**                     |
| No alternate constructor for injected privileged identity                    | **PASS** (only injects B-04) |
| Capability-specific (not general run-as)                                     | **PASS**                     |

### 5.2 Actor-like extra fields (“smuggled fields ignored”) — deep inspection

| Question                                                | Finding                                                                                                                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript signatures?                                  | `start(input?: { correlationId?; requestedTtlMs? })`; `resume({ grant })`; `heartbeat({ grant, proposedExpiresAt })`; `release({ grant })`                                                                                                                        |
| Can excess `actorId`/`actorKind` be passed at runtime?  | **Yes** under structural typing / `as never` / plain JS — TypeScript does not erase excess properties at runtime                                                                                                                                                  |
| Explicit reject vs ignore?                              | Entry **does not** scan for actor-like keys. Excess fields are **not read**. Factory builds canonical actor; B-04 receives that actor only                                                                                                                        |
| Does execution continue with canonical actor?           | **Yes** — proven by Entry spec smuggle test (`actorId: 'spoof'` → B-04 still gets ratified id)                                                                                                                                                                    |
| Attribution influenceable?                              | **No** — caller cannot change `actor.actorId` / `actorKind` on the B-04 call                                                                                                                                                                                      |
| Contradicts plan §5.B “reject … never silently ignore”? | **Partial tension.** §5.B is labeled **PROPOSED** and worded for a **future public method** / actor-like DTO. Controlling §16 requires signatures omit actor fields and factory construction — met. Silent ignore ≠ spoof; it also ≠ explicit unauthorized reject |
| External DTO / HTTP / job path?                         | **None found.** Entry unexported; controller has no references; no cron/job callers under `apps/api/src`                                                                                                                                                          |
| Trust layers                                            | (1) TS API omit; (2) runtime ignore of excess props with canonical rebuild; (3) Nest non-export of Entry/B-04/PORT/durable; (4) no HTTP/job surface                                                                                                               |

**PIR judgment:** Current security outcome preserves canonical attribution and meets PO “must not accept actor fields from HTTP/clients/jobs” because **no such ingress exists**. Deviation from §5.B’s preferred **reject** semantics for a future public DTO surface is recorded as **MINOR-PD02-PIR-01** (not a blocker while Entry remains dormant/unexported).

### 5.3 Lifecycle

| Operation | Canonical actor used | Fail-closed before B-04 on factory throw |
| --------- | -------------------- | ---------------------------------------- |
| start     | Yes                  | Yes (`GATE_UNAUTHORIZED`)                |
| resume    | Yes                  | Yes                                      |
| heartbeat | Yes                  | Yes                                      |
| release   | Yes                  | Yes                                      |

Contention from B-04 is propagated without inventing success (Entry spec).

### 5.4 Dormancy

| Verified                       | Evidence                                                |
| ------------------------------ | ------------------------------------------------------- |
| Not on `ConnectionsController` | Source scan + Entry spec controller wall                |
| No cron/scheduler references   | Repo search; Entry source walls                         |
| No job-payload identity path   | No callers outside tests + module provider registration |
| No full-D orchestrator         | Absent from inventory / search                          |
| Nest export of Entry           | Absent from `MODULE_METADATA.EXPORTS`                   |

**Unverified beyond static search:** runtime production process invocation graphs outside repository source (ops deploy scripts not in scope). Within `apps/api/src`, no production invoker was found.

---

## 6. NestJS module isolation review

**File:** `connections.module.ts`  
**Tests:** Entry spec CONDITION-2 block + B-04 spec CONDITION-2 describe — both use `Reflect.getMetadata(MODULE_METADATA.EXPORTS, ConnectionsModule)`.

### CONDITION-2 — separate results

| Prohibited export                  | Metadata absent? | Dedicated test?          | Result   |
| ---------------------------------- | ---------------- | ------------------------ | -------- |
| `Conn04MigrationBoundaryService`   | Yes              | Yes (Entry + B-04 specs) | **PASS** |
| `MIGRATION_GATE_PORT`              | Yes              | Yes (Entry + B-04 specs) | **PASS** |
| `MIGRATION_GATE_DURABLE_AUTHORITY` | Yes              | Yes (Entry + B-04 specs) | **PASS** |

Also verified:

| Check                                                              | Result                                                                                  |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Entry not exported                                                 | **PASS**                                                                                |
| Factory / actorId constant not Nest-exported                       | **PASS**                                                                                |
| `FivConn04APreflightService` still exported                        | **PASS**                                                                                |
| Providers retain Entry, B-04, PORT, durable                        | **PASS**                                                                                |
| `ConnectionsService` still injects in-module `MIGRATION_GATE_PORT` | **PASS** (provider retained; service file unchanged; `connections.service` suite green) |
| Durable CAS only via B-04 path in production wiring                | **PASS** (token not exported; B-04 unchanged; no new CAS consumers)                     |

**Distinction:** TypeScript visibility ≠ Nest export visibility. Cross-module Nest DI is correctly restricted. Same-module / hard-import residual remains as previously planned (optional R4 not required — CONDITION-3).

---

## 7. B-04 / lease / audit integrity review

| Check                                          | Evidence                                                                                                                                                                                        | Result                     |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| B-04 signatures unchanged                      | No diff on `conn04-migration-boundary.service.ts`                                                                                                                                               | **PASS**                   |
| Entry passes canonical actor                   | Entry unit + lifecycle tests                                                                                                                                                                    | **PASS**                   |
| Lease contention semantics                     | Entry propagates `GATE_CONTENTION`; B-04/B-06 suites green                                                                                                                                      | **PASS**                   |
| No direct Prisma lease writes in Entry         | Source walls; no adapter edits                                                                                                                                                                  | **PASS**                   |
| Durable CAS not bypassed                       | No new write path; B-04 `assertWriteAuthority` unchanged                                                                                                                                        | **PASS**                   |
| Entry-driven audit attribution                 | Integration: Entry → B-04 → `PrismaMigrationGateAdapter` → `ConnectionMigrationGateAudit` with mocked txn client; asserts `attribution.actorId === 'system-job:fiv-conn-04-migration-backfill'` | **PASS** with limits below |
| OPERATOR reclaim intact                        | `prisma-migration-gate.adapter.spec.ts` ST-B21/S18 still present; adapter unmodified; reclaim suite path covered under migration-gate / related filters                                         | **PASS**                   |
| SYSTEM_JOB does not weaken OPERATOR validation | No R4 / adapter allowlist change                                                                                                                                                                | **PASS**                   |

**Audit evidence strength/limits:**

- **Strong:** End-to-end Entry → Boundary → Adapter → SecurityAudit `record` mock exercises the real adapter acquire + audit emit path (not merely asserting Entry→mock B-04).
- **Limited:** Uses `vi.mock` of `prismaClientForTransaction` / in-memory lease row (same pattern as B-05). Not a live DB. Sanitization path relies on existing adapter/B-05 coverage; Entry suite does not re-assert sanitize reject cases.
- Historical audit rewrite/deletion: **not introduced** (no audit service/schema changes in inventory).

---

## 8. Scope compliance

Searched changed files and `apps/api/src` references for unauthorized surfaces.

| Exclusion                                                   | Result                                     |
| ----------------------------------------------------------- | ------------------------------------------ |
| Full D orchestrator / environment UPDATE                    | **Absent**                                 |
| Vault / Strategy B / P-D-03                                 | **Absent**                                 |
| Public HTTP / UI                                            | **Absent**                                 |
| Trading Runtime                                             | **Absent**                                 |
| Cron / scheduler                                            | **Absent**                                 |
| Service-account registry / generic run-as                   | **Absent**                                 |
| Prisma schema / migrations / audit actorKind column         | **Absent** (index/status clean for schema) |
| Production full-D activation / enable-guard product control | **Absent** (CONDITION-3 respected)         |

---

## 9. Test and typecheck evidence (independent re-run)

Executed during PIR on unchanged source state (HEAD `953292675e197d4f25778aaaa59eacb2826560fe`):

| Command                                                                                    | Result   | Counts                   |
| ------------------------------------------------------------------------------------------ | -------- | ------------------------ |
| `pnpm --filter @trp/api exec vitest run src/modules/connections/fiv-conn-04-d-system-job`  | **PASS** | 2 files / **22** tests   |
| `pnpm --filter @trp/api exec vitest run src/modules/connections/fiv-conn-04`               | **PASS** | 12 files / **131** tests |
| `pnpm --filter @trp/api exec vitest run src/modules/connections/conn04-migration-boundary` | **PASS** | 1 file / **21** tests    |
| `pnpm --filter @trp/api exec vitest run src/modules/connections/connection-migration-gate` | **PASS** | 2 files / **12** tests   |
| `pnpm --filter @trp/api exec vitest run src/modules/connections/migration-gate`            | **PASS** | 1 file / **30** tests    |
| `pnpm --filter @trp/api exec vitest run src/modules/connections/connections.service`       | **PASS** | 2 files / **50** tests   |
| `pnpm --filter @trp/api exec tsc --noEmit`                                                 | **PASS** | exit 0                   |

**Differences vs implementation report:** None in commands, pass/fail, or counts.

**Working tree during review:** Implementation six files unchanged by PIR; only this PIR document created.

**Unexecuted:** Broader monorepo / full `@trp/api` suite beyond the mandated filters — not required for this PIR scope; not claimed.

---

## 10. Findings register

### MINOR-PD02-PIR-01 — Silent ignore of smuggled actor-like excess properties

| Field                | Content                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Severity**         | **MINOR**                                                                                                                                                                      |
| **Location**         | `fiv-conn-04-d-system-job-migration-entry.ts` — `start` (and structural typing on all methods); Entry spec L143–161 documents ignore behavior                                  |
| **Evidence**         | Excess `actorId`/`actorKind` at runtime are unread; factory always builds ratified actor; execution continues successfully                                                     |
| **Requirement**      | Planning §5.B PROPOSED reject-on-actor-like-DTO for future public methods; §16 requires omit-from-signature (met); PO forbids acceptance from HTTP/clients/jobs (no such path) |
| **Risk**             | Low while Entry is unexported and non-HTTP. If Entry later gains a public/DTO surface, silent ignore could mask misuse detection (not attribution spoofing)                    |
| **Resolution**       | Before any public/DTO exposure: add explicit reject of unexpected actor-like keys **or** keep methods free of object DTO ingress. Optional hardening now.                      |
| **New PO decision?** | **No** for current dormant surface. Yes only if product requires reject-vs-ignore policy change as a satisfaction gate                                                         |

**Disposition guidance:** May be **tracked separately** from formal P-D-02 satisfaction **provided** Entry remains unexported and without HTTP/job DTO ingress. Must be remediated before authorizing a public Entry API.

### OBSERVATION-PD02-PIR-02 — Decision Register status lag

| Field                | Content                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Severity**         | **OBSERVATION**                                                                                                                                                                |
| **Location**         | `wave-6-po-decision-register.md` — `D-CONN04-PD02-IA` still describes implementation as AUTHORIZED/NOT STARTED; SJ entry still says identity definition IMPLEMENTATION PENDING |
| **Evidence**         | Code + tests exist; register not updated by IA recording or this PIR (by design)                                                                                               |
| **Resolution**       | Formal P-D-02 satisfaction disposition / register sync after PIR acceptance                                                                                                    |
| **New PO decision?** | Disposition act — not a code defect                                                                                                                                            |

### OBSERVATION-PD02-PIR-03 — Factory-failure → B-04 non-invocation lightly tested

| Field                | Content                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Severity**         | **OBSERVATION**                                                                                               |
| **Location**         | Entry `catch` paths; identity blank `correlationId` throw                                                     |
| **Evidence**         | Code fails closed; no dedicated Entry test asserting `boundary.start` not called when factory throws          |
| **Resolution**       | Optional test hardening in a follow-up; not blocking given factory nearly always succeeds for approved inputs |
| **New PO decision?** | No                                                                                                            |

### OBSERVATION-PD02-PIR-04 — TypeScript hard-import residual for factory / same-module B-04

| Field                | Content                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| **Severity**         | **OBSERVATION**                                                                                     |
| **Location**         | Exported `buildFivConn04DSystemJobActor`; in-module B-04 still constructible                        |
| **Evidence**         | Nest exports correctly restricted; planning accepted Nest trust boundary; R4 optional (CONDITION-3) |
| **Resolution**       | None required for P-D-02; optional R4 remains defense-in-depth if later PO-approved                 |
| **New PO decision?** | Only if R4 becomes mandatory                                                                        |

**No BLOCKER or MAJOR findings.**

---

## 11. PIR verdict and rationale

### Verdict: **PASS WITH MINOR FINDINGS**

**Rationale:**

1. Exact ratified identity is defined once and constructed only through the capability factory.
2. Option A Entry is the trusted SYSTEM_JOB ↔ B-04 boundary; lifecycle methods use the canonical actor consistently.
3. CONDITION-1 (§16) followed: durable authority internalized with B-04 + PORT; Option A selected.
4. CONDITION-2 satisfied with three **separate** Nest metadata negative assertions (duplicated in Entry + B-04 specs).
5. CONDITION-3 satisfied: no mandatory enable-guard invented.
6. Scope fences hold; independently re-run suites and `tsc` match the implementation report.
7. Remaining MINOR concerns smuggled-field **reject vs ignore** under a non-public API; attribution spoofing is not possible on the current surface.

Mandatory acceptance criteria for P-D-02 identity-boundary authorization are met with evidence. Minor finding need **not** block a separate formal satisfaction disposition if tracked with the dormancy constraint above.

---

## 12. Required remediation

**None required to proceed to formal P-D-02 satisfaction disposition**, subject to tracking MINOR-PD02-PIR-01.

Optional follow-ups (non-blocking):

- Explicit reject of actor-like excess keys on Entry methods before any public exposure.
- Entry test that factory failure prevents B-04 call.
- Decision Register status refresh as part of satisfaction disposition (not this PIR).

**Do not** expand to full D, R4-as-mandatory, or enable-guard without a separate PO decision.

---

## 13. Recommended governance next step

1. Product Owner / governance: review this PIR.
2. Execute a **separate formal P-D-02 satisfaction disposition** (update disposition artifact + Decision Register).
3. Do **not** treat this PIR as satisfaction.
4. Do **not** authorize full FIV-CONN-04-D from this review.

---

## 14. Explicit status declarations

```text
P-D-02 IMPLEMENTATION: COMPLETE (independently verified)
P-D-02 PIR: PASS WITH MINOR FINDINGS
P-D-02 SATISFACTION: BLOCKED UNTIL FORMAL DISPOSITION
FIV-CONN-04-D FULL IMPLEMENTATION: NOT AUTHORIZED
FULL D BACKFILL: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

**END OF P-D-02 POST-IMPLEMENTATION REVIEW**
