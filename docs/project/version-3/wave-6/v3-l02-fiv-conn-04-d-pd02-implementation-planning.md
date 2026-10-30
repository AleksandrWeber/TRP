# FIV-CONN-04-D — P-D-02 Implementation Planning Package

**Document:** Implementation plan for satisfying P-D-02 (canonical SYSTEM_JOB identity definition, trusted binding, B-04 access restriction, audit attribution, fail-closed verification)  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Authoritative policy:** [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md)  
**Repository `HEAD` at planning:** `953292675e197d4f25778aaaa59eacb2826560fe` (`main`)  
**Nature:** **IMPLEMENTATION PLANNING ONLY.** Does **not** implement code, create the constant, modify B-04/audit/exports, authorize implementation, or change P-D-02 status. Does **not** stage, commit, or push.

```text
APPROVED POLICY: BINDING (unchanged)
IDENTITY / BINDING / AUDIT IN CODE: NOT IMPLEMENTED
P-D-02: BLOCKED
FIV-CONN-04-D FULL IMPLEMENTATION: NOT AUTHORIZED
THIS PACKAGE: DOES NOT AUTHORIZE IMPLEMENTATION
```

Labels: **CONFIRMED** | **APPROVED POLICY** | **PROPOSED** | **CONDITIONAL** | **UNKNOWN** | **OUT OF SCOPE**.

> **Clarification (2026-10-30):** §16 resolves `MIGRATION_GATE_DURABLE_AUTHORITY` export disposition (**SHOULD BE INTERNALIZED**) and selects **Option A** (Migration Entry = trusted D orchestration boundary for SYSTEM_JOB/B-04). Prior sections retained; §16 supersedes export/orchestration ambiguity only.

---

## 1. Executive summary

**PROPOSED:** Satisfy P-D-02 with the smallest Connections-owned delivery that (1) defines the ratified constant `system-job:fiv-conn-04-migration-backfill` with `actorKind = SYSTEM_JOB`, (2) constructs `PrivilegedActorContext` only inside a **narrow trusted SYSTEM_JOB migration-gate entry** (P-D-02 façade; future full D orchestrator consumer), (3) **stops exporting** raw `Conn04MigrationBoundaryService` from `ConnectionsModule`, (4) relies on existing B-04 lease/audit plumbing so gate audits receive the canonical `actorId`, and (5) proves the boundary with dedicated security tests plus B-04/B-05/B-06 / Connections HTTP regressions.

**CONFIRMED:** No production canonical constant exists today; B-04 is caller-supplied and shape-validated; `ConnectionsModule` exports B-04; no Nest module outside Connections currently injects B-04; Security Audit already requires `attribution.actorId` for `connection.migration-gate`; Prisma `actorKind` column is **not** required.

**OUT OF SCOPE:** Full FIV-CONN-04-D environment backfill/UPDATE, Vault/Strategy B changes, P-D-03, cron, Trading Runtime, identity registry, Prisma `actorKind` migration.

**Planning verdict:** `IMPLEMENTATION PLAN READY FOR REVIEW` (§15).

---

## 2. Binding approved decisions

| Topic           | Binding content                                                                                                                                    | Label                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Kind            | `actorKind = SYSTEM_JOB`                                                                                                                           | APPROVED POLICY             |
| Exact `actorId` | `system-job:fiv-conn-04-migration-backfill`                                                                                                        | APPROVED POLICY             |
| Scope           | One stable identity; FIV-CONN-04 migration environment backfill only                                                                               | APPROVED POLICY             |
| Non-reuse       | Not User/JWT/job/service-account/Trading Runtime; no registry                                                                                      | APPROVED POLICY             |
| SoT             | PO ratification record; app constant mirrors; env/DB not authoritative                                                                             | APPROVED POLICY             |
| Construction    | Only trusted internal D/SYSTEM_JOB entry; force kind + exact id; no external actor fields                                                          | APPROVED POLICY             |
| HTTP            | No public privileged D/SYSTEM_JOB execution path                                                                                                   | APPROVED POLICY             |
| B-04            | Lease/gate mandatory; access restricted; OPERATOR path compatible                                                                                  | APPROVED POLICY             |
| Audit           | Same canonical `actorId` on B-04 path and migration-gate attribution; no Prisma `actorKind` for initial satisfaction; metadata refinement deferred | APPROVED POLICY             |
| Ops             | Explicit invocation; no cron; no job-payload identity; lease contention for duplicates                                                             | APPROVED POLICY             |
| Status          | Policy approved; code pending; P-D-02 BLOCKED; D NOT AUTHORIZED                                                                                    | APPROVED POLICY / CONFIRMED |

Do not reinterpret these decisions.

---

## 3. Current-state evidence

### 3.1 Governance / planning (read-only)

| Artifact                                 | Relevant status                                                                                             | Label     |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------- |
| PO ratification                          | Exact id + trusted-binding **policy** approved; code pending                                                | CONFIRMED |
| P-D-02 disposition Appendix A            | Policy approved; P-D-02 BLOCKED                                                                             | CONFIRMED |
| Identity provisioning spec Appendix A    | Contract filled; satisfaction needs impl evidence                                                           | CONFIRMED |
| Architecture decision package Appendix R | A+D / B+C approved; milestones 2–5 pending                                                                  | CONFIRMED |
| D Implementation Planning Review         | P-D-02 **BLOCKING FOR AUTHORIZATION**; IMPL-REV-D-03 Nest orchestrator accepted                             | CONFIRMED |
| Decision Freeze COND-D-03                | Kind contract frozen; historical ops mapping text unresolved — policy resolved in PO ratification (Path P1) | CONFIRMED |

### 3.2 Code evidence (verified at planning HEAD)

| Finding                                                              | Path / symbol                                                                                       | Label               |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------- |
| Privileged shape                                                     | `migration-gate.ts` L86–93 `PrivilegedActorKind`, `PrivilegedActorContext`                          | CONFIRMED           |
| Shape-only validation                                                | `isPrivilegedActorContext` (~L579+)                                                                 | CONFIRMED           |
| B-04 caller-supplied actor                                           | `conn04-migration-boundary.service.ts` `start` L73–90                                               | CONFIRMED           |
| B-04 no HTTP / no env write                                          | File header L1–7; controller isolation test L315–316 in `conn04-migration-boundary.service.spec.ts` | CONFIRMED           |
| Module exports B-04 + port + preflight                               | `connections.module.ts` L44–48                                                                      | CONFIRMED           |
| External Nest consumers of B-04                                      | **None found** outside Connections (AppModule imports ConnectionsModule only)                       | CONFIRMED           |
| `ConnectionsService` uses `MIGRATION_GATE_PORT` for observe/deny-set | `connections.service.ts` L55, L107                                                                  | CONFIRMED           |
| Gate audit uses caller `actorId`                                     | `connection-migration-gate-audit.ts` L14–45                                                         | CONFIRMED           |
| Audit attribution requires `actorId` for `connection.migration-gate` | `security-audit-attribution.ts`                                                                     | CONFIRMED           |
| Lease stores `holderId` / `actorKind`                                | `schema.prisma` `ConnectionMigrationGateLease`                                                      | CONFIRMED           |
| Canonical constant in apps                                           | **Absent** (`rg` no `system-job:fiv-conn-04-migration-backfill` under `apps/`)                      | CONFIRMED           |
| Feature-flag pattern in Connections for D disable                    | **Not found**                                                                                       | CONFIRMED (absence) |

**Conflict check:** Current source **aligns** with ratified policy intent (shape exists; constant/binding missing). **No conflict requiring stop.**

---

## 4. Gap analysis

| Required outcome                   | Current state                                 | Gap                             | Label                |
| ---------------------------------- | --------------------------------------------- | ------------------------------- | -------------------- |
| Backend constant = ratified string | Absent                                        | Introduce identity definition   | CONFIRMED            |
| Trusted construction only          | Anyone with B-04 inject can pass any actor    | Façade + un-export B-04         | CONFIRMED            |
| Fail closed on invalid id          | N/A                                           | Validation before B-04          | PROPOSED             |
| Restricted B-04 access             | Exported broadly                              | Remove/narrow export            | CONFIRMED            |
| Audit canonical `actorId`          | Plumbing OK if caller supplies correct id     | Ensure façade supplies constant | CONFIRMED / PROPOSED |
| Disable without audit rewrite      | No D disable switch                           | Smallest disable constant/guard | CONDITIONAL          |
| Proof tests                        | B-04/B-05/B-06 cover gate, not SYSTEM_JOB SoT | New P-D-02 suites               | PROPOSED             |
| Full D backfill                    | Absent                                        | **OUT OF SCOPE** for P-D-02     | OUT OF SCOPE         |

---

## 5. Workstreams A–F

### 5.A — Canonical identity definition

**PROPOSED location:** `apps/api/src/modules/connections/fiv-conn-04-d-system-job-identity.ts` (Connections-owned; capability-scoped; avoids polluting `migration-gate.ts` general contract).

| Element           | Recommendation                                                                                                                                                                                        | Label           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Constant          | `export const FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID = 'system-job:fiv-conn-04-migration-backfill' as const`                                                                                               | PROPOSED        |
| Kind              | `export const FIV_CONN_04_D_SYSTEM_JOB_ACTOR_KIND = 'SYSTEM_JOB' as const`                                                                                                                            | PROPOSED        |
| Factory           | Pure function `buildFivConn04DSystemJobActor(correlationId?: string): PrivilegedActorContext` that **only** returns `{ actorId: constant, actorKind: 'SYSTEM_JOB', correlationId? }` after validation | PROPOSED        |
| Export scope      | Constant + factory **module-internal preferred**; export only if façade/tests in same package need it — **do not** export a general “build any SYSTEM_JOB” API                                        | PROPOSED        |
| Validation        | At **construction time** (every build): non-empty, exact equality to ratified literal, kind forced; optional module-init assert in façade `onModuleInit`                                              | PROPOSED        |
| SoT test          | Spec asserts character-for-character equality to governance string (fixture constant duplicated only in test expectation, or read from same module)                                                   | PROPOSED        |
| Single definition | Architecture/source test: `rg`/source scan that the literal appears in **one** production `.ts` file under connections (plus tests)                                                                   | PROPOSED        |
| Env/DB            | Forbidden as SoT                                                                                                                                                                                      | APPROVED POLICY |

**Do not create the constant in this planning task.**

### 5.B — Trusted SYSTEM_JOB construction

**PROPOSED naming:** Treat the P-D-02 deliverable as  
`Conn04SystemJobMigrationEntry` (or `FivConn04DSystemJobMigrationEntry`) — the **designated trusted internal entry** for SYSTEM_JOB ↔ B-04. Full FIV-CONN-04-D backfill orchestrator remains **OUT OF SCOPE** and, when later authorized, **must** call this entry (or absorb it) rather than constructing actors ad hoc.

| Concern                        | Recommendation                                                                                                                                                                                                                                                      | Label                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Ownership                      | Connections module                                                                                                                                                                                                                                                  | APPROVED POLICY / PROPOSED          |
| Construction                   | Entry methods **do not** accept `actorId` / `actorKind` / `PrivilegedActorContext`; build via §5.A factory only                                                                                                                                                     | PROPOSED                            |
| Rejection                      | If a future public method accidentally receives actor-like DTO fields, **reject** with unauthorized/fail result — never silently ignore and proceed with SYSTEM_JOB                                                                                                 | PROPOSED                            |
| B-04 call                      | Inject **non-exported** `Conn04MigrationBoundaryService`; call `start`/`resume`/`heartbeat`/`release` with factory-built actor                                                                                                                                      | PROPOSED                            |
| DI                             | Provider in `ConnectionsModule`; export **only** the Entry (optional) or keep both private until full D — **PROPOSED default:** export Entry only if a same-app consumer needs it; otherwise keep unexported and test via Nest testing module / direct construction | PROPOSED                            |
| Prevent arbitrary construction | Factory not a public “run as SYSTEM_JOB with string param”; no ConnectionsService parameter for SYSTEM_JOB                                                                                                                                                          | PROPOSED                            |
| HTTP                           | No controller wiring                                                                                                                                                                                                                                                | APPROVED POLICY / CONFIRMED pattern |

#### Assessment of B-04 export (CONFIRMED risk)

`ConnectionsModule` exports `Conn04MigrationBoundaryService` (`connections.module.ts` L47). Any future importer could inject and spoof `actorId`.

| Design option                      | Summary                                                                 | Trade-off                                                          | Verdict                  |
| ---------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------ |
| **R1 Remove B-04 from `exports`**  | Keep as provider; Entry + same-module code + unit tests still construct | Smallest; breaks only hypothetical external injectors (none today) | **Recommended core**     |
| **R2 Narrow D-owned façade/Entry** | Public privileged API has no actor params                               | Required by ratification construction rules                        | **Recommended core**     |
| **R3 Restructure nested module**   | Separate `Conn04PrivilegedModule`                                       | Higher churn; not required now                                     | Deferred                 |
| **R4 B-04 internal allowlist**     | Adapter rejects non-canonical SYSTEM_JOB ids                            | Defense in depth; touches shared B-04; OPERATOR must remain        | **CONDITIONAL** optional |

**Recommended design:** **R1 + R2** (remove raw B-04 export; introduce SYSTEM_JOB Entry). **R4** only if implementation-time review finds residual same-module spoofing unacceptable (**CONDITIONAL**).

Private method / non-HTTP alone is **insufficient** — export removal + Entry construction rules are mandatory.

### 5.C — B-04 integration and access restriction

| Requirement                  | Plan                                                                                                                | Label       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------- |
| Use existing B-04 contract   | Entry delegates to `Conn04MigrationBoundaryService` only                                                            | PROPOSED    |
| No gate bypass               | No direct Prisma lease writes from Entry                                                                            | PROPOSED    |
| Consistent SYSTEM_JOB actor  | Factory → B-04 every start/resume/heartbeat/release                                                                 | PROPOSED    |
| Restrict arbitrary modules   | Un-export B-04; do not export `MIGRATION_GATE_PORT` unless an external consumer is proven necessary                 | PROPOSED    |
| `MIGRATION_GATE_PORT` export | Currently used by in-module `ConnectionsService` only → **PROPOSED** remove from exports (observe remains internal) | PROPOSED    |
| OPERATOR compatibility       | Do not change `reclaimAsOperator` / OPERATOR fixtures; Entry is SYSTEM_JOB-only path                                | PROPOSED    |
| B-04 allowlist               | **Not required** if R1+R2 hold; optional R4                                                                         | CONDITIONAL |

**Do not modify B-04 in this planning task.** Implementation (when authorized) should prefer zero signature changes to B-04.

### 5.D — Security Audit attribution

| Requirement                        | Plan                                                                                | Label                          |
| ---------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------ |
| Canonical `actorId` on gate audits | Existing adapter already audits with `actor.actorId` from acquire/heartbeat/release | CONFIRMED                      |
| Consistency                        | Entry uses factory → B-04 → adapter audit chain                                     | PROPOSED                       |
| No client attribution              | No HTTP/DTO actor fields                                                            | APPROVED POLICY                |
| Integrity / sanitization           | Unchanged `ConnectionMigrationGateAudit` + `sanitizeMigrationGateAuditPayload`      | CONFIRMED                      |
| Prisma `actorKind`                 | **Not** introduced                                                                  | APPROVED POLICY / OUT OF SCOPE |
| Optional metadata `actorKind`      | **Deferred** — do not implement unless separately required                          | APPROVED POLICY / OUT OF SCOPE |
| P-D-03                             | Untouched                                                                           | OUT OF SCOPE                   |

**Tests:** extend/new specs asserting audited `attribution.actorId === FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID` for Entry-driven acquire success/deny paths (reuse B-05 patterns).

### 5.E — Fail-closed and lifecycle controls

| Control           | Plan                                                                                                                                                                                                                                                            | Label           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Invalid identity  | Factory throws or returns typed fail **before** any B-04 call; Entry never calls B-04 on fail                                                                                                                                                                   | PROPOSED        |
| No fallback       | Explicit forbid-list in tests (`execution-engine`, recovery, runtime worker, userId)                                                                                                                                                                            | PROPOSED        |
| Disable execution | **PROPOSED smallest:** module constant `FIV_CONN_04_D_SYSTEM_JOB_ENTRY_ENABLED` (boolean) checked at Entry entrypoints; `false` → refuse without B-04. **Not** env SoT for actorId. Marked for PO/impl-review because no Connections feature-flag pattern found | CONDITIONAL     |
| Revocation        | Disable Entry / stop deploy of callers; do not delete audits                                                                                                                                                                                                    | APPROVED POLICY |
| Rotation          | New PO decision + constant change + coordinated deploy; document active-lease consideration                                                                                                                                                                     | APPROVED POLICY |

### 5.F — Security and regression tests

See §8.

---

## 6. Exact file change inventory

### 6.1 Confirmed necessary (when implementation authorized)

| File path                                                                                     | Change type               | Workstream | Purpose                          | Required behavior                                                                                            | Security impact                 | Tests                    | Dependencies                 |
| --------------------------------------------------------------------------------------------- | ------------------------- | ---------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------- | ------------------------ | ---------------------------- |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-identity.ts`                       | **Create**                | A          | Canonical definition + factory   | Exact literal; kind SYSTEM_JOB; validate; no env/DB                                                          | Prevents invented/alternate ids | New identity spec        | None                         |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.ts`                | **Create**                | B,C,E      | Trusted Entry façade             | No actor params; factory→B-04; fail closed; optional enable guard                                            | Prevents spoofed construction   | New entry security spec  | Identity file; B-04 provider |
| `apps/api/src/modules/connections/connections.module.ts`                                      | **Modify**                | B,C        | Register Entry; restrict exports | Provide Entry; **remove** `Conn04MigrationBoundaryService` (and likely `MIGRATION_GATE_PORT`) from `exports` | Blocks cross-module B-04 inject | Module source assertions | Entry class                  |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-identity.spec.ts`                  | **Create**                | F          | Identity tests                   | Exact equality; kind; fail closed; no fallback                                                               | Provenance proof                | Self                     | Identity                     |
| `apps/api/src/modules/connections/fiv-conn-04-d-system-job-migration-entry.spec.ts`           | **Create**                | F          | Boundary + B-04 + audit          | No external actor; HTTP absence; audit actorId; contention via mocks                                         | Impersonation + audit           | Self                     | Entry + mocks                |
| `apps/api/src/modules/connections/conn04-migration-boundary.service.spec.ts`                  | **Modify**                | C,F        | Export assertions                | Update expectations if module no longer exports B-04; keep controller isolation                              | Regression                      | Existing + tweak         | Module change                |
| `apps/api/src/modules/connections/fiv-conn-04-b-05-audit-integrity.spec.ts` and/or entry spec | **Modify** / cover in new | D,F        | Canonical actor on audit         | Assert ratified id when Entry drives acquire                                                                 | Attribution integrity           | Existing patterns        | Entry                        |

### 6.2 Conditional (implementation-time evidence)

| File path                                              | Change type   | Workstream | Condition                                                                                  |
| ------------------------------------------------------ | ------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `prisma-migration-gate.adapter.ts`                     | Modify        | C          | Only if R4 allowlist approved — SYSTEM_JOB must equal canonical id; OPERATOR unchanged     |
| `migration-gate.ts`                                    | Modify        | C          | Only if shared pure helper for allowlist — prefer keep B-04 untouched                      |
| `connections.service.ts`                               | Modify        | C          | Only if PORT export removal forces provider token visibility issues (unlikely same-module) |
| Enable-guard constant colocated in identity/entry file | Create/Modify | E          | If disable-without-undeploy required at P-D-02; else document “no HTTP caller ⇒ dormant”   |

### 6.3 Explicitly excluded

| Path / area                                         | Reason                        |
| --------------------------------------------------- | ----------------------------- |
| Full D orchestrator backfill service                | OUT OF SCOPE (P-D-02 only)    |
| `ConnectionsController` privileged routes           | Forbidden                     |
| Prisma schema / migrations for `actorKind` on audit | Deferred / not required       |
| Security Audit core schema                          | No change required for P-D-02 |
| Jobs module / Trading Runtime / execution-engine    | Must not supply identity      |
| P-D-03 artifacts                                    | Separate                      |
| Master Plan / Roadmap                               | OUT OF SCOPE                  |

---

## 7. Security threat model and mitigations

| Threat                                   | Mitigation                                                | Label                |
| ---------------------------------------- | --------------------------------------------------------- | -------------------- |
| Caller-supplied `actorId` spoof via B-04 | Un-export B-04; Entry constructs from constant            | PROPOSED             |
| HTTP injection of actor                  | No controller wiring; existing controller isolation tests | CONFIRMED / PROPOSED |
| Job payload identity                     | No jobs integration; tests assert absence                 | PROPOSED             |
| Fallback to domain-local actors          | Factory forbids alternate strings                         | PROPOSED             |
| Duplicate concurrent migration           | Existing B-04 contention                                  | CONFIRMED            |
| Audit forgery via client                 | Attribution from server-side actor only                   | CONFIRMED / PROPOSED |
| Env override of SoT                      | Constant only; no env reader for actorId                  | APPROVED POLICY      |
| Same-module malicious caller of B-04     | Nest trust boundary; optional R4; code review             | CONDITIONAL          |
| Premature full D writes                  | P-D-02 Entry must not UPDATE `Connection.environment`     | OUT OF SCOPE fence   |

---

## 8. Test strategy and exact commands

### 8.1 New / extended coverage (plan)

| Suite focus      | Assertions                                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity         | Exact `actorId`; `actorKind === 'SYSTEM_JOB'`; stable across calls; invalid/blank fail; no fallback strings                                                          |
| Trusted boundary | Entry has no actor params; cannot inject PrivilegedActorContext; controller source excludes Entry/B-04 acquire; module exports exclude raw B-04                      |
| B-04             | Entry start reaches acquire with canonical actor; contention denied for second SYSTEM_JOB; OPERATOR reclaim tests still pass; empty actor still unauthorized at B-04 |
| Audit            | `attribution.actorId` equals constant on Entry-driven gate events; sanitization unchanged                                                                            |
| Regression       | Existing A/B-04/B-05/B-06 / Connections HTTP / typecheck                                                                                                             |

### 8.2 Discoverable commands (**CONFIRMED** in `apps/api/package.json`)

Run from repo (planning does **not** execute these):

```bash
# Connections / CONN-04 focused (Vitest file filter)
pnpm --filter @trp/api exec vitest run src/modules/connections/fiv-conn-04
pnpm --filter @trp/api exec vitest run src/modules/connections/conn04-migration-boundary
pnpm --filter @trp/api exec vitest run src/modules/connections/connection-migration-gate
pnpm --filter @trp/api exec vitest run src/modules/connections/migration-gate
pnpm --filter @trp/api exec vitest run src/modules/connections/connections.service
pnpm --filter @trp/api exec vitest run src/modules/connections/fiv-conn-04-d-system-job

# Broader api tests (heavier)
pnpm --filter @trp/api test

# Typecheck (root script)
pnpm --filter @trp/api exec tsc --noEmit
```

**Existing suites to include in regression (**CONFIRMED** filenames):**

- A: `fiv-conn-04-a-preflight.service.spec.ts`, `fiv-conn-04-a-classification.spec.ts`
- B-04: `conn04-migration-boundary.service.spec.ts`
- B-05: `fiv-conn-04-b-05-audit-integrity.spec.ts`, `fiv-conn-04-b-05-security-smoke.spec.ts`, `fiv-conn-04-b-05-secret-leakage.spec.ts`, `connection-migration-gate-audit.spec.ts`
- B-06: `fiv-conn-04-b-06-concurrency.spec.ts`, `fiv-conn-04-b-06-crash-ttl.spec.ts`, `fiv-conn-04-b-06-security-smoke.spec.ts`, `fiv-conn-04-b-06-boundary-concurrency.spec.ts`
- HTTP / service: `connections.service.spec.ts`, `connections.service.fiv-conn-04-b-03.spec.ts`, auth `surface-coverage` as applicable
- Security Audit module specs under `modules/security-audit/`

Do **not** run tests requiring live external credentials or destructive persistent state as part of **this planning** task.

---

## 9. Dependency-ordered implementation sequence

| Step | Work                                               | Entry criteria                                | Exit criteria                                      | Combo         |
| ---- | -------------------------------------------------- | --------------------------------------------- | -------------------------------------------------- | ------------- |
| 1    | Identity definition + unit tests                   | Implementation Authorization for P-D-02 slice | Constant exact; factory tests green                | A alone first |
| 2    | SYSTEM_JOB Entry + B-04 delegation (no env UPDATE) | Step 1 done                                   | Entry constructs only canonical actor; B-04 called | B+C together  |
| 3    | Module export restriction + module source tests    | Step 2 compiles                               | Raw B-04 not exported; controller still clean      | With step 2   |
| 4    | Audit assertions on Entry path                     | Step 2                                        | `attribution.actorId` matches constant             | D with 2–3    |
| 5    | Fail-closed + optional enable guard                | Step 1–2                                      | Invalid id never acquires; disable refuses         | E with 2      |
| 6    | Full P-D-02 security suite                         | Steps 1–5                                     | §8.1 green                                         | F             |
| 7    | Regression A/B-04/B-05/B-06/HTTP/tsc               | Step 6                                        | Commands green                                     | F             |
| 8    | P-D-02 satisfaction evidence package               | Steps 6–7 + governance                        | Formal satisfaction disposition (separate task)    | Governance    |

**Independent review:** Step 3 export removal should be called out in PR for Nest consumers (none today). R4 allowlist, if pursued, needs separate security note.

---

## 10. Rollback strategy

| Scenario                              | Action                                                                                           | Audit impact                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------ |
| Bad constant / failed tests pre-merge | Do not merge                                                                                     | None                                 |
| Post-merge defect                     | Revert PR / disable Entry enable-guard; keep B-04 unexported or re-export only after risk accept | **No** audit rewrite/delete          |
| Need emergency OPERATOR reclaim       | Existing OPERATOR reclaim path unchanged                                                         | Unchanged                            |
| Identity rotation                     | New PO decision; new constant deploy; drain/wait leases                                          | Historical rows retain old `actorId` |

Unsafe path to avoid on rollback: re-exporting raw B-04 **and** leaving a public/generic SYSTEM_JOB builder.

---

## 11. P-D-02 acceptance and evidence matrix

| #   | Ratified requirement          | Policy ref  | Planned implementation     | Required test                                  | Evidence            | Verification role             | Exit |
| --- | ----------------------------- | ----------- | -------------------------- | ---------------------------------------------- | ------------------- | ----------------------------- | ---- |
| 1   | Exact actorId defined once    | PO §5       | Identity module constant   | Exact equality + single-definition source test | Code + test log     | Engineering + PO review       | Pass |
| 2   | Backend uses ratified value   | PO §6       | Factory uses constant only | Stable across invocations                      | Test log            | Engineering                   | Pass |
| 3   | Only trusted entry constructs | PO §8       | Entry + no actor params    | Boundary suite                                 | Test + module graph | Engineering / security review | Pass |
| 4   | No external actor fields      | PO §8.4     | Reject/no params           | HTTP/job/injection tests                       | Test log            | Engineering                   | Pass |
| 5   | B-04 access restricted        | PO §8.6–7   | Un-export B-04             | Module export assertion                        | Source + test       | Engineering                   | Pass |
| 6   | Lease/gate mandatory          | PO §8.9     | Delegate to B-04 only      | Contention + unauthorized                      | B-04/entry tests    | Engineering                   | Pass |
| 7   | Audit canonical actorId       | PO §9       | Adapter path via Entry     | Audit integrity assert                         | Test log            | Engineering                   | Pass |
| 8   | Fail closed before lease      | PO §7 / §10 | Validate then call         | Invalid id → no acquire mock                   | Test log            | Engineering                   | Pass |
| 9   | OPERATOR / B-04 compatible    | PO / Freeze | No reclaim regression      | Existing OPERATOR specs                        | Regression log      | Engineering                   | Pass |
| 10  | Regressions pass              | Planning §8 | Run commands               | A/B04/B05/B06/HTTP/tsc                         | CI/local logs       | Engineering                   | Pass |

**P-D-02 cannot be marked SATISFIED by design review alone** — requires implementation evidence + formal satisfaction disposition (separate).

---

## 12. Risks and unresolved questions

| Item                                              | Notes                                                                      | Label                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------- |
| Enable-guard vs “dormant Entry”                   | No existing Connections feature-flag; boolean constant proposed for review | CONDITIONAL / UNKNOWN preferred platform convention |
| Whether Entry should be exported                  | Prefer unexported until full D authorized consumer exists                  | PROPOSED                                            |
| R4 allowlist necessity                            | Residual same-module risk only                                             | CONDITIONAL                                         |
| Updating B-04 export assertions in existing specs | Expected churn                                                             | CONFIRMED                                           |
| Full D still NOT AUTHORIZED                       | P-D-02 Entry must not grow env UPDATE in same PR without separate auth     | APPROVED POLICY fence                               |
| P-D-03 still open                                 | May block **D** Authorization even after P-D-02 satisfied                  | CONFIRMED dependency (not expanded here)            |
| Decision Freeze historical UNRESOLVED ops text    | Policy resolved in PO ratification; Freeze not amended (Path P1)           | CONFIRMED                                           |

---

## 13. Implementation scope exclusions

**OUT OF SCOPE** for this P-D-02 implementation (when later authorized):

- Full FIV-CONN-04-D `Connection.environment` UPDATE/backfill
- Vault eligibility / Strategy B collision changes
- Per-row D audit event design beyond gate attribution for P-D-02
- P-D-03 resolution
- E residual verification
- Public API/UI
- Cron/scheduler
- Trading Runtime / execution-engine / recovery actor changes
- Identity registry / Prisma audit `actorKind` column
- Automatic enabling of live capital

**Dependencies noted without expansion:** Full D Authorization still requires P-D-02 satisfaction **and** other blockers (e.g. P-D-03) per D planning review.

---

## 14. Implementation authorization prerequisites

Before any code change:

1. **PO / planning review** of this package (PASS / conditions).
2. Explicit **implementation authorization** for the **P-D-02 identity/binding slice** (distinct from full FIV-CONN-04-D Authorization).
3. Implementers must not expand into OUT OF SCOPE items.
4. After evidence, a **separate** P-D-02 satisfaction disposition may be prepared — not by this planning doc.

```text
THIS PLAN DOES NOT AUTHORIZE IMPLEMENTATION
P-D-02 REMAINS BLOCKED
FULL FIV-CONN-04-D REMAINS NOT AUTHORIZED
```

---

## 15. Final planning verdict

```text
IMPLEMENTATION PLAN READY FOR REVIEW
```

No blocking conflict between current repository evidence and the approved SYSTEM_JOB Product Owner ratification or frozen privileged-actor contract was found. Remaining items are **CONDITIONAL** refinements (enable-guard, optional R4), not planning blockers.

**Await:** Product Owner / implementation-planning review and a separate authorization decision before any code, constant, export, or test changes.

---

## 16. Planning clarifications (2026-10-30) — Durable authority export & D orchestration boundary

**Date:** 2026-10-30  
**Nature:** Append-only clarification of two planning gaps. Does **not** change APPROVED POLICY. Does **not** authorize implementation. Does **not** modify application source. Prior sections remain historical planning text; **this section supersedes conflicting export/orchestration ambiguity only**.

```text
CLARIFICATION STATUS: COMPLETE
P-D-02 IMPLEMENTATION: NOT AUTHORIZED
FIV-CONN-04-D IMPLEMENTATION: NOT AUTHORIZED
```

### 16.1 Investigation A — `MIGRATION_GATE_DURABLE_AUTHORITY`

#### 16.1.1 Capability distinction (CONFIRMED)

| Surface                                     | Definition                                                                   | Operations                                                                                               | Actor / attribution                                                                                             |
| ------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **`MIGRATION_GATE_PORT`**                   | `migration-gate.port.ts` — `MigrationGatePort`                               | `acquire`, `release`, `heartbeat`, `observe`, `validate`                                                 | `acquire` / `release` / `heartbeat` require caller-supplied `PrivilegedActorContext`; audits use that `actorId` |
| **`MIGRATION_GATE_DURABLE_AUTHORITY`**      | `migration-gate-durable-authority.port.ts` — `MigrationGateDurableAuthority` | **Only** `assertDurableAuthorityCas(transaction, grant): Promise<boolean>`                               | **No** `PrivilegedActorContext` parameter; grant carries prior `holderId` / fence                               |
| **`Conn04MigrationBoundaryService` (B-04)** | `conn04-migration-boundary.service.ts`                                       | `start` / `resume` / `heartbeat` / `release` (via PORT) + `assertWriteAuthority` (via durable authority) | Caller-supplied actor on lifecycle methods                                                                      |

#### 16.1.2 Exact durable-authority behavior (CONFIRMED)

Port (`migration-gate-durable-authority.port.ts` L19–24):

- Exposes **one** method: `assertDurableAuthorityCas`.

Implementation (`prisma-migration-gate.adapter.ts` ~L751–775):

- Performs same-txn `connectionMigrationGateLease.updateMany` CAS predicated on `gateKey`, `purpose`, `ACTIVE`, matching `holderId` + `fenceGeneration`, unexpired `expiresAt`.
- On match, updates **`heartbeatAt` only** (comment: “Touch updatedAt only — no authority change; proves row matched CAS”).
- Returns `true` iff `updated.count === 1`.
- Does **not** acquire, release, reclaim, or change `holderId` / `fenceGeneration` / `actorKind` / purpose.
- Does **not** UPDATE `Connection.environment`.

#### 16.1.3 Can a consumer undermine the trusted D / SYSTEM_JOB boundary?

| Question                                                                 | Answer                                                                                     | Evidence                                                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Acquire / release lease via durable authority alone?                     | **No**                                                                                     | Interface has no acquire/release                                                              |
| Change migration holder / fence / actorKind via durable authority alone? | **No**                                                                                     | CAS only touches `heartbeatAt`                                                                |
| Supply / construct SYSTEM_JOB `PrivilegedActorContext`?                  | **No**                                                                                     | No actor parameters                                                                           |
| Bypass B-04 lifecycle (`start`/`acquire`) to mint a grant?               | **No**                                                                                     | Needs a pre-existing matching `MigrationGateGrant`                                            |
| Bypass B-04 `assertWriteAuthority` for the CAS step?                     | **Yes, if exported and injected** — call `assertDurableAuthorityCas` directly with a grant | Same adapter method B-04 wraps (`conn04-migration-boundary.service.ts` L155–170)              |
| Influence Security Audit `actorId` attribution?                          | **Not via this method**                                                                    | Acquire-path audits come from PORT/`actor.actorId`; CAS path does not emit actor construction |

**Security implication:** Durable authority is **not** a SYSTEM_JOB identity constructor and **cannot alone** open a privileged migration window. It **is** a privileged **write-proof / fencing CAS** mutation surface. Leaving it Nest-exported allows arbitrary importers of `ConnectionsModule` to perform write-authority proofs without going through B-04’s façade — weakening the ratified preference for restricted privileged call paths (PO ratification §8.6–7), even though it does not by itself create `system-job:fiv-conn-04-migration-backfill`.

Compile-time TypeScript `private` on B-04 fields does **not** constrain Nest DI. Nest **module `exports`** is the cross-module visibility control. Runtime trust still assumes in-process Nest consumers behave; export removal reduces the supported attack / misuse surface.

#### 16.1.4 Consumers and Nest export analysis (CONFIRMED)

| Consumer                                | Kind           | Injection                                                                                                |
| --------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| `Conn04MigrationBoundaryService`        | Production     | `@Inject(MIGRATION_GATE_DURABLE_AUTHORITY)` (`conn04-migration-boundary.service.ts` L66–67)              |
| B-04 / B-05 / B-06 specs                | Tests          | Local mocks of `assertDurableAuthorityCas` — **not** Nest module imports                                 |
| Other Nest modules under `apps/api/src` | **None found** | Repo search: only `connections.module.ts` provides/exports the token; only B-04 injects it in production |

`ConnectionsModule` (`connections.module.ts` L44–48) currently exports:

1. `MIGRATION_GATE_PORT`
2. `MIGRATION_GATE_DURABLE_AUTHORITY`
3. `Conn04MigrationBoundaryService`
4. `FivConn04APreflightService`

`AppModule` imports `ConnectionsModule`; **no** other `*.module.ts` was found importing Connections solely to inject durable authority. **External Nest export of durable authority is not required by any current consumer.**

#### 16.1.5 Disposition — Investigation A

```text
SHOULD BE INTERNALIZED
```

| Field                                           | Content                                                                                                                                                                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Disposition                                     | **SHOULD BE INTERNALIZED**                                                                                                                                                                                            |
| Why not “SAFE TO REMAIN EXPORTED”               | Zero external consumers; exported CAS enables privileged write-proof without B-04 façade; conflicts with restricted privileged-path policy even though SYSTEM_JOB minting is unaffected                               |
| Why not merely CONDITIONAL on PORT/B-04 removal | Even with PORT/B-04 internalized, an exported CAS token remains an unnecessary privileged surface for future D write paths                                                                                            |
| Narrowest safe alternative                      | Keep provider binding `useExisting: PrismaMigrationGateAdapter`; **remove `MIGRATION_GATE_DURABLE_AUTHORITY` from `exports`** alongside planned removal of `Conn04MigrationBoundaryService` and `MIGRATION_GATE_PORT` |
| Affected consumers                              | **None** outside Connections (only B-04 same-module injection)                                                                                                                                                        |
| Does this change APPROVED POLICY?               | **No** — clarifies plan export set only                                                                                                                                                                               |

**Supersedes** earlier §5.C / §6.1 wording that named B-04 + PORT export removal but omitted durable authority: export restriction set is now explicitly **{ B-04, PORT, DURABLE_AUTHORITY }**. `FivConn04APreflightService` export is unchanged by this clarification (preflight ≠ SYSTEM_JOB construction).

---

### 16.2 Investigation B — Trusted D orchestrator vs Migration Entry

#### 16.2.1 Binding policy (APPROVED POLICY — unchanged)

From PO ratification §8: **only** the designated internal D orchestrator may construct the canonical SYSTEM_JOB `PrivilegedActorContext`; no HTTP/client/job/arbitrary Nest consumer may supply `actorId` / `actorKind` / raw context; raw B-04 must not remain broadly available; prefer a narrow D-owned façade.

Exact identity remains:

- `actorKind = SYSTEM_JOB`
- `actorId = system-job:fiv-conn-04-migration-backfill`

#### 16.2.2 Responsibility split

| Component                                           | Responsibilities (planned)                                                                                                                                                                                            | Label                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Future full FIV-CONN-04-D backfill orchestrator** | When separately authorized: preflight/Vault/eligibility, per-row conditional `environment` UPDATE, Strategy B handling, heartbeat/release lifecycle across batch, D-specific audits (P-D-03 separate)                 | OUT OF SCOPE for P-D-02 code; future                       |
| **`Conn04SystemJobMigrationEntry` (P-D-02)**        | Canonical identity construction; SYSTEM_JOB-only B-04 `start`/`resume`/`heartbeat`/`release` (and, when D writes exist, mediation of write-proof via B-04 — not raw durable export); fail-closed; no actor parameters | PROPOSED / now **selected as trusted boundary for P-D-02** |
| **Identity factory (module-private)**               | Build exact ratified context; not a public run-as API                                                                                                                                                                 | PROPOSED                                                   |
| **B-04**                                            | Existing gate façade; remains **internal** provider                                                                                                                                                                   | CONFIRMED                                                  |

**Overlap:** Full D backfill **includes** the need to construct SYSTEM_JOB and call B-04. That must **not** create a second independent constructor. P-D-02 Entry is the construction + B-04 control point; later full D must **extend or absorb** this same boundary rather than invent a parallel one.

#### 16.2.3 Selected architecture

```text
OPTION A — Entry is the trusted D orchestration boundary (for the SYSTEM_JOB / B-04 capability)
```

**Selected: Option A.**

| Rule                                        | Binding for implementation planning                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trusted D orchestration boundary for P-D-02 | **`Conn04SystemJobMigrationEntry`** (name may use `FivConn04DSystemJobMigrationEntry` equivalently) **is** the designated trusted internal D orchestration boundary for constructing SYSTEM_JOB and controlling B-04 interactions                                                                                                                  |
| Who constructs `PrivilegedActorContext`     | **Only** the Entry (via module-private factory). No other production component constructs or accepts external privileged context for this capability                                                                                                                                                                                               |
| Who invokes B-04                            | **Only** the Entry for SYSTEM_JOB migration-gate operations. Raw `Conn04MigrationBoundaryService` is not Nest-exported                                                                                                                                                                                                                             |
| Who may call durable CAS                    | **Only** via B-04 `assertWriteAuthority` (Entry → B-04 → durable). Durable token not exported                                                                                                                                                                                                                                                      |
| Nest visibility                             | Entry: provider; **do not export** Entry until a same-app authorized consumer exists under separate D Authorization. Prefer tests via direct construction / Nest testing module. Identity factory: **not** exported as a general API                                                                                                               |
| Generic SYSTEM_JOB / run-as API             | **Forbidden** — factory takes optional `correlationId` only; no `actorId`/`actorKind` parameters                                                                                                                                                                                                                                                   |
| Future full D backfill                      | Under separate authorization, either expand this Entry into the full orchestrator **or** replace it in-module with a successor that remains the **sole** constructor — **Option B is rejected for P-D-02** because introducing a second “D orchestrator” shell that wraps an exported Entry would recreate an independent privileged entry surface |

**Why not Option B for P-D-02:** Option B requires a distinct outer orchestrator that alone may invoke Entry. That is appropriate only if Entry were a reusable internal helper **and** the outer orchestrator already exists as the sole export. For P-D-02, full D does not exist; adding both names without backfill scope would either export two surfaces or leave an orphan wrapper. Option A matches PO “designated internal D orchestrator” by **designating the Entry as that boundary** for this capability.

#### 16.2.4 How the design prevents actor injection (PROPOSED)

1. Entry method signatures omit `actorId`, `actorKind`, and `PrivilegedActorContext`.
2. Factory hard-codes ratified literal + `SYSTEM_JOB`.
3. Controllers must not reference Entry/B-04 acquire (existing B-04 controller isolation pattern extended).
4. Nest exports remove B-04, PORT, and durable authority — arbitrary modules cannot `@Inject` them after importing `ConnectionsModule`.
5. Same-module misuse remains a Nest monolith residual risk (optional R4 allowlist still **CONDITIONAL**).
6. TypeScript `private` is **not** relied on as a cross-module security boundary.

---

### 16.3 Resulting narrowly scoped plan deltas

| Prior plan element                          | Clarified disposition                                                                                                                                    |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un-export B-04 + PORT                       | **Retained**                                                                                                                                             |
| Durable authority export                    | **MUST also be removed from `exports`** (was underspecified)                                                                                             |
| Entry vs D orchestrator ambiguity           | **Resolved = Option A**                                                                                                                                  |
| Export Entry by default                     | **No** — keep unexported for P-D-02; reassess only under future D Authorization                                                                          |
| Identity factory export                     | **No** general export                                                                                                                                    |
| File inventory §6.1 `connections.module.ts` | Required behavior now: remove **`Conn04MigrationBoundaryService`**, **`MIGRATION_GATE_PORT`**, and **`MIGRATION_GATE_DURABLE_AUTHORITY`** from `exports` |
| R4 allowlist                                | Still **CONDITIONAL**                                                                                                                                    |
| Enable-guard                                | Still **CONDITIONAL**                                                                                                                                    |

### 16.4 Traceability recommendations (do not modify unless separately tasked)

Optional cross-links for later governance hygiene (recommendations only; **not** edited by this clarification task):

- PO ratification — already authoritative; no change required.
- Architecture decision package Appendix R — may later cite Option A + durable-authority internalization.
- Decision Register `D-CONN04-PD02-SJ` — policy unchanged.

### 16.5 Remaining planning items (non-blocking)

| Item                                              | Status                                            |
| ------------------------------------------------- | ------------------------------------------------- |
| Enable-guard boolean vs dormant Entry             | CONDITIONAL                                       |
| Optional R4 B-04 SYSTEM_JOB allowlist             | CONDITIONAL                                       |
| Exact class filename (`Conn04…` vs `FivConn04D…`) | Naming equivalence OK; Option A semantics binding |
| P-D-03 / full D Authorization                     | Separate; still NOT AUTHORIZED                    |

### 16.6 Clarification verdict

```text
PLANNING CLARIFICATIONS COMPLETE
```

No ratification conflict. No source changes performed by this clarification.

**END OF P-D-02 IMPLEMENTATION PLANNING PACKAGE**
