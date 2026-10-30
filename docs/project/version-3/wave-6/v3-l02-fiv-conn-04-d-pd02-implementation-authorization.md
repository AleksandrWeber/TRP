# FIV-CONN-04-D — P-D-02 Implementation Authorization Decision Package

**Document:** Formal Implementation Authorization Decision Package for the narrowly scoped P-D-02 SYSTEM_JOB identity-boundary implementation  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Decision authority:** Product Owner  
**Nature:** Governance decision package for Product Owner Implementation Authorization of the P-D-02 identity-boundary slice. Does **not** itself implement code. Formal grant recorded in §17 and in [`v3-l02-fiv-conn-04-d-pd02-implementation-authorization-ratification.md`](./v3-l02-fiv-conn-04-d-pd02-implementation-authorization-ratification.md).

```text
PLANNING VERDICT: PASS WITH CONDITIONS
AUTHORIZATION RECOMMENDATION: RECOMMEND APPROVE (historical; non-binding)
ACTUAL AUTHORIZATION DECISION: APPROVE P-D-02 IMPLEMENTATION (2026-10-30)
P-D-02 IMPLEMENTATION AUTHORIZATION: APPROVED WITH CONDITIONS
P-D-02 IMPLEMENTATION: AUTHORIZED, NOT STARTED
FIV-CONN-04-D FULL IMPLEMENTATION: NOT AUTHORIZED
P-D-02 STATUS: BLOCKED (until implementation + PIR + satisfaction disposition)
```

---

## 1. Document purpose and status

This package recorded the request for Product Owner Implementation Authorization of the **P-D-02 identity-boundary slice**. The Product Owner decision is recorded in §17.

| Item                                | Status                                              |
| ----------------------------------- | --------------------------------------------------- |
| Purpose                             | PO Implementation Authorization decision record     |
| Planning readiness                  | Final independent review = **PASS WITH CONDITIONS** |
| P-D-02 Implementation Authorization | **APPROVED WITH CONDITIONS** (2026-10-30)           |
| Implementation execution            | **AUTHORIZED, NOT STARTED**                         |
| Full FIV-CONN-04-D                  | **NOT AUTHORIZED**                                  |

---

## 2. Executive decision summary

| Question                       | Answer in this package                                                                                                                                                                                                                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What may be authorized?        | Only P-D-02: ratified SYSTEM_JOB identity mirror, module-private factory, trusted Entry as SYSTEM_JOB↔B-04 boundary, Nest export restrictions, tests/verification                                                                                                                                                          |
| Exact identity                 | `actorKind = SYSTEM_JOB`; `actorId = system-job:fiv-conn-04-migration-backfill`                                                                                                                                                                                                                                            |
| Controlling plan clarification | **§16 of [`v3-l02-fiv-conn-04-d-pd02-implementation-planning.md`](./v3-l02-fiv-conn-04-d-pd02-implementation-planning.md)** (Option A + durable-authority internalization). _Note: this is the P-D-02 planning package; it is distinct from full-D `v3-l02-fiv-conn-04-d-implementation-planning.md` §16 (runner design)._ |
| Conditions                     | CONDITION-1 (§16 controls); CONDITION-2 (three negative export tests); CONDITION-3 (enable-guard optional)                                                                                                                                                                                                                 |
| Cursor recommendation          | Historical: Recommend APPROVE (non-binding)                                                                                                                                                                                                                                                                                |
| PO decision                    | **APPROVE P-D-02 IMPLEMENTATION** — 2026-10-30 — see §17                                                                                                                                                                                                                                                                   |

---

## 3. Governance authority and source-of-truth hierarchy

| Priority | Artifact                                                                                                                                                        | Role                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1        | [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md)                              | Authoritative **policy** SoT for identity, binding, audit, ops |
| 2        | [`v3-l02-fiv-conn-04-d-pd02-ratification.md`](./v3-l02-fiv-conn-04-d-pd02-ratification.md)                                                                      | OPT-PD02-02 model; Appendix A Q5 policy link                   |
| 3        | [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md) (`D-CONN04-PD02-SJ`)                                                                       | Register of approved policy                                    |
| 4        | [`v3-l02-fiv-conn-04-d-final-implementation-planning-review.md`](./v3-l02-fiv-conn-04-d-final-implementation-planning-review.md)                                | Final planning verdict PASS WITH CONDITIONS                    |
| 5        | [`v3-l02-fiv-conn-04-d-pd02-implementation-planning.md`](./v3-l02-fiv-conn-04-d-pd02-implementation-planning.md) **§16 controlling** over earlier plan sections | Implementation planning + clarifications                       |
| 6        | Disposition / provisioning spec appendices                                                                                                                      | P-D-02 remains BLOCKED until evidence                          |

Env vars and database records are **not** identity authorities. Backend constant, if authorized, is a **mirror** of the ratified string only.

---

## 4. Planning review result and conditions

| Field                                                  | Value                                           |
| ------------------------------------------------------ | ----------------------------------------------- |
| Final planning review                                  | **PASS WITH CONDITIONS**                        |
| Blockers requiring new PO ratification or plan rewrite | **None** identified                             |
| Bound conditions                                       | CONDITION-1, CONDITION-2, CONDITION-3 (see §13) |

---

## 5. Exact P-D-02 implementation scope

If the Product Owner **APPROVES**, engineering may implement **only**:

1. Exact ratified identity mirror: `actorKind = SYSTEM_JOB`; `actorId = system-job:fiv-conn-04-migration-backfill`.
2. Capability-specific, **module-private** identity factory (no generic run-as API; optional `correlationId` only).
3. `Conn04SystemJobMigrationEntry` **or** documented equivalent `FivConn04DSystemJobMigrationEntry` as the **trusted D orchestration boundary** for SYSTEM_JOB ↔ B-04 (**Option A**).
4. Entry constructs canonical identity **internally**.
5. Callers cannot supply `actorId`, `actorKind`, or raw `PrivilegedActorContext`.
6. NestJS `ConnectionsModule` export restrictions (see §9).
7. Preserve in-module `ConnectionsService` observe / deny-set use of `MIGRATION_GATE_PORT` as a **provider** (not export).
8. Preserve existing OPERATOR compatibility (including reclaim test paths).
9. Preserve existing B-04 lease and migration-gate audit behavior (canonical `actorId` on Entry-driven path).
10. Tests and verification per approved plan, including **mandatory** three negative export assertions (§10).

**Use one consistent Entry class name** in code and tests. Naming choice does not change trust-boundary responsibility.

---

## 6. Explicit exclusions

Authorization, if granted, **expressly excludes**:

- Full FIV-CONN-04-D backfill execution
- Any `Connection.environment` UPDATE
- Vault classification / reclassification
- Strategy B implementation or changes
- P-D-03 implementation
- Public HTTP endpoints; UI changes
- Trading Runtime changes
- Cron, scheduler, or automatic execution
- General service-account registry
- Generic run-as-any-actor API
- Prisma schema changes / new audit `actorKind` column
- Changes to frozen D requirements
- Production deployment or activation of full D

The Entry must remain **dormant/uninvoked** outside separately controlled implementation and verification. P-D-02 must **not** implicitly start the full D workflow.

---

## 7. Controlling §16 rule

**Mandatory:**

> **Section 16 of [`v3-l02-fiv-conn-04-d-pd02-implementation-planning.md`](./v3-l02-fiv-conn-04-d-pd02-implementation-planning.md) is the controlling implementation-planning clarification for the durable-authority disposition and Option A trusted D orchestration boundary.**

Where earlier sections of that same document (§1, §5.B, §6.1, or other pre-§16 wording) conflict with §16, **§16 controls**.

Do **not** silently rewrite historical planning sections. Do **not** treat full-D `v3-l02-fiv-conn-04-d-implementation-planning.md` §16 (“Runner / Orchestrator Design”) as the P-D-02 durable-authority / Option A controller.

---

## 8. Trusted identity construction and Entry boundary

| Rule             | Binding                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Trusted boundary | Entry = designated internal D orchestration boundary for SYSTEM_JOB ↔ B-04 (Option A)          |
| Construction     | Only Entry via module-private factory                                                          |
| Identity         | Exact ratified `actorId` + `SYSTEM_JOB`                                                        |
| Injection        | Reject / no parameters for external actor fields                                               |
| B-04             | Entry invokes non-exported `Conn04MigrationBoundaryService` only                               |
| Durable CAS      | Only via B-04 `assertWriteAuthority` — durable token not Nest-exported                         |
| Future full D    | Must extend or absorb this boundary; must not add a second SYSTEM_JOB constructor              |
| Nest vs TS       | Nest module exports are the cross-module control; TypeScript `private` alone is not sufficient |

---

## 9. NestJS export restrictions

After implementation, `ConnectionsModule` **must not** export:

| Token / provider                                      | Restriction                                      |
| ----------------------------------------------------- | ------------------------------------------------ |
| `Conn04MigrationBoundaryService`                      | **Not exported**                                 |
| `MIGRATION_GATE_PORT`                                 | **Not exported**                                 |
| `MIGRATION_GATE_DURABLE_AUTHORITY`                    | **Not exported**                                 |
| Entry (`Conn04SystemJobMigrationEntry` or equivalent) | **Not exported**                                 |
| Identity factory / run-as helper                      | **Not exported** as a Nest export or general API |

In-module providers may remain so `ConnectionsService` and Entry can inject what they need. `FivConn04APreflightService` export is **not** required to change by this P-D-02 authorization (preflight ≠ SYSTEM_JOB construction).

---

## 10. Required tests and acceptance criteria

Minimum acceptance (future evidence — **none claimed passed here**):

| Area                    | Required                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Identity                | Exact string equality; `actorKind === 'SYSTEM_JOB'`; stable; invalid/blank fail-closed; no domain-local fallback                                                                                             |
| Entry boundary          | No actor params; no raw context injection; controller has no Entry/B-04 acquire path                                                                                                                         |
| **Exports (mandatory)** | Tests assert **all three** absent from `ConnectionsModule` exports: `Conn04MigrationBoundaryService`, `MIGRATION_GATE_PORT`, `MIGRATION_GATE_DURABLE_AUTHORITY` — **not** a generic “B-04 not exported” only |
| B-04                    | Entry-driven acquire uses canonical actor; contention still denies duplicates; empty/invalid actor unauthorized                                                                                              |
| Audit                   | Entry-driven gate events: `attribution.actorId` equals canonical string                                                                                                                                      |
| OPERATOR                | Existing reclaim / OPERATOR specs remain compatible                                                                                                                                                          |
| Scope                   | No environment UPDATE; no public privileged HTTP; no cron                                                                                                                                                    |

---

## 11. Verification commands and evidence expectations

Commands (from approved plan; **not executed** by this package):

```bash
pnpm --filter @trp/api exec vitest run src/modules/connections/fiv-conn-04-d-system-job
pnpm --filter @trp/api exec vitest run src/modules/connections/fiv-conn-04
pnpm --filter @trp/api exec vitest run src/modules/connections/conn04-migration-boundary
pnpm --filter @trp/api exec vitest run src/modules/connections/connection-migration-gate
pnpm --filter @trp/api exec vitest run src/modules/connections/migration-gate
pnpm --filter @trp/api exec vitest run src/modules/connections/connections.service
pnpm --filter @trp/api exec tsc --noEmit
```

Evidence package after implementation must include command output / CI logs, changed-file inventory, and export-source assertions.

---

## 12. Operational restrictions and fail-closed behavior

- Missing, blank, mismatched, or invalid identity → **fail closed** before any B-04 acquire.
- No silent fallback to human, Trading Runtime, or domain-local actors.
- Explicit invocation only within authorized verification; no cron/scheduler.
- Dormancy via restricted Nest visibility and **absence of production invocation path** is acceptable.
- Lease contention remains mandatory for duplicate protection.
- Historical audit records must not be rewritten or deleted on disable/rollback/rotation.
- Identity rotation requires a **new** PO decision (not covered by approving this package).

---

## 13. Conditions and optional items

### CONDITION-1 — Controlling planning section

§16 of `v3-l02-fiv-conn-04-d-pd02-implementation-planning.md` controls over conflicting earlier wording in that document.

### CONDITION-2 — Three negative export assertions

Tests must explicitly verify B-04, `MIGRATION_GATE_PORT`, and `MIGRATION_GATE_DURABLE_AUTHORITY` are **not** exported from `ConnectionsModule`.

### CONDITION-3 — Enable-guard remains optional

A new mandatory operational enable-guard / feature toggle is **NOT** required by current PO ratification. Dormancy through restricted provider visibility and no invocation path is acceptable. If implementation discovers a mandatory ops toggle is necessary, **stop** and obtain a **separate** PO decision before expanding scope.

### Optional defense-in-depth

R4 B-04 SYSTEM_JOB allowlist remains **optional** unless a subsequent PO decision makes it mandatory.

### Naming

`Conn04SystemJobMigrationEntry` ≡ `FivConn04DSystemJobMigrationEntry` for planning; pick one consistently. Naming does not authorize trust-boundary change.

---

## 14. Implementation deliverables

If APPROVED, expected deliverables (implementation task — **not started**):

| Deliverable             | Notes                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| Identity module         | Constant + private factory                                                   |
| Entry class             | Option A trusted boundary                                                    |
| `connections.module.ts` | Register Entry; remove three privileged exports; do not export Entry/factory |
| Specs                   | Identity, Entry security, three export negatives, audit/lease regressions    |
| PIR package             | Per §15                                                                      |
| No schema/migrations    | Confirmed exclusion                                                          |

---

## 15. PIR and post-implementation closure requirements

Before P-D-02 may be marked **SATISFIED**, all of the following must exist (none claimed complete now):

1. Exact changed-file inventory vs authorized scope.
2. Diff review — no exclusions violated.
3. Identity constant + factory verification (exact string).
4. Trusted Entry boundary verification.
5. NestJS export verification.
6. **Three mandatory negative export tests** (B-04, PORT, durable).
7. Actor-injection negative tests.
8. B-04 lease + audit attribution regression evidence.
9. OPERATOR compatibility evidence.
10. Relevant Connections / FIV-CONN-04 regressions + TypeScript check.
11. No schema/migration; no public API/UI/Trading Runtime/full D backfill changes.
12. Working-tree / index evidence.
13. PIR verdict + residual findings.
14. Formal **P-D-02 satisfaction disposition** after evidence review.

Until then: **P-D-02 remains BLOCKED**.

---

## 16. Risks and residual limitations

| Risk                                               | Mitigation                     |
| -------------------------------------------------- | ------------------------------ |
| Implementer follows superseded plan sections       | CONDITION-1                    |
| Incomplete export tests                            | CONDITION-2                    |
| Scope creep into full D                            | §6 exclusions; PIR scope check |
| Same-module Nest residual trust                    | Optional R4; code review       |
| Enable-guard invented as mandatory product control | CONDITION-3                    |

---

## 17. Product Owner decision block

```text
PRODUCT OWNER DECISION: APPROVE P-D-02 IMPLEMENTATION

[x] APPROVE P-D-02 IMPLEMENTATION
    — Authorizes only the P-D-02 identity-boundary scope in §§5–13 of this package,
      bound to CONDITIONS-1…3. Does NOT authorize full FIV-CONN-04-D.

[ ] REJECT
[ ] RETURN FOR REVISION

Decision date: 2026-10-30
Decision maker (Product Owner): Product Owner
Scope: P-D-02 identity-boundary implementation only
Conditions: CONDITION-1, CONDITION-2, CONDITION-3 — BINDING
Rationale / notes:
  Product Owner explicit approval of the P-D-02 Implementation Authorization
  Decision Package scope. Formal grant record:
  v3-l02-fiv-conn-04-d-pd02-implementation-authorization-ratification.md
```

**Binding conditions (mandatory):**

1. **CONDITION-1** — §16 of [`v3-l02-fiv-conn-04-d-pd02-implementation-planning.md`](./v3-l02-fiv-conn-04-d-pd02-implementation-planning.md) controls over conflicting earlier wording in that document (not full-D planning §16).
2. **CONDITION-2** — Tests must separately assert absence from `ConnectionsModule` exports of: `Conn04MigrationBoundaryService`, `MIGRATION_GATE_PORT`, `MIGRATION_GATE_DURABLE_AUTHORITY`.
3. **CONDITION-3** — Enable-guard remains optional; if a mandatory ops toggle becomes necessary, stop for a separate PO decision. R4 allowlist remains optional defense-in-depth.

```text
P-D-02 IMPLEMENTATION AUTHORIZATION = APPROVED WITH CONDITIONS
P-D-02 IMPLEMENTATION = AUTHORIZED, NOT STARTED
FIV-CONN-04-D FULL IMPLEMENTATION = NOT AUTHORIZED
```

---

## 18. Explicit statement — full FIV-CONN-04-D remains unauthorized

```text
FULL FIV-CONN-04-D IMPLEMENTATION REMAINS NOT AUTHORIZED.
P-D-02 IMPLEMENTATION AUTHORIZATION IS APPROVED WITH CONDITIONS (2026-10-30).
P-D-02 IMPLEMENTATION IS AUTHORIZED BUT NOT STARTED BY THIS GOVERNANCE RECORDING.
APPROVAL OF P-D-02 DOES NOT AUTHORIZE CONNECTION.ENVIRONMENT UPDATES,
VAULT/STRATEGY-B/P-D-03 WORK, PUBLIC HTTP, CRON, OR LIVE/FULL D EXECUTION.
P-D-02 REMAINS BLOCKED FOR SATISFACTION UNTIL IMPLEMENTATION + PIR + DISPOSITION.
```

**Next step:** A **separate** Product Owner / engineering task may execute the authorized P-D-02 implementation. This governance recording does **not** start implementation and does **not** auto-create an implementation task.

**END OF P-D-02 IMPLEMENTATION AUTHORIZATION DECISION PACKAGE**
