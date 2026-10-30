# FIV-CONN-04-D P-D-02 Disposition — Privileged Actor Provenance Discovery

**Document:** FIV-CONN-04-D — P-D-02 Actor Provenance Discovery / Disposition  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Related:** FIV-CONN-04-D (authorization prerequisite) after P-D-01 DELIVERED  
**Authority:** Investigation / disposition preparation under Wave 6 PO + Chief Architect governance  
**Nature:** **DISCOVERY / DISPOSITION ONLY.** Does **not** implement D. Does **not** modify production code. Does **not** modify audit schemas. Does **not** create a migration. Does **not** invent an `actorId`. Does **not** create a new `SYSTEM_JOB` identity. Does **not** dispose P-D-03 / NB-01. Does **not** grant D Implementation Authorization. Does **not** commit or push.

**Repository baseline:** `daa627ab0fd26f4f63d45d5a55b8d5ece83b22bd` (`HEAD` = `origin/main`)  
**P-D-01 delivery commit (verified):** `daa627ab0fd26f4f63d45d5a55b8d5ece83b22bd` — `fix(wave-6): deliver FIV-CONN-04-A preflight`

**Upstream D gate:** [`v3-l02-fiv-conn-04-d-implementation-planning-review.md`](./v3-l02-fiv-conn-04-d-implementation-planning-review.md) — **PASS WITH CONDITIONS**; **P-D-02 = BLOCKING FOR AUTHORIZATION**

```text
P-D-02 DISPOSITION = BLOCKED — CONCRETE PROVENANCE NOT ESTABLISHED

This artifact does NOT invent an actor identity.
This artifact does NOT authorize D implementation.
NO COMMIT/PUSH PERFORMED
```

> **Reader note (2026-10-30, updated):** Governance **policy** for the canonical SYSTEM_JOB identity was approved in [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md) (Appendix A). Subsequent implementation authorization, delivery, PIR, and **formal satisfaction** are recorded in [`v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md) (**D-CONN04-PD02-SAT** — **P-D-02 = SATISFIED**). See Appendix B. Historical body below (2026-09-18 discovery) is preserved and must not be read as the current satisfaction state.

---

## 1. P-D-02 Purpose

| Field                            | Value                                                                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Prerequisite                     | **P-D-02** — Concrete privileged `actorId` provenance mapping for D invocation (`OPERATOR` vs `SYSTEM_JOB`)                                   |
| Role                             | **BLOCKING FOR AUTHORIZATION** (D Implementation Authorization)                                                                               |
| Question                         | What exact, auditable actor identity will D use when emitting Security Audit events and when calling B-04 (`Conn04MigrationBoundaryService`)? |
| Constraint                       | Identity must be **established by repository / ops convention**, not invented merely to satisfy `PrivilegedActorContext`                      |
| Disposition after this discovery | **BLOCKED — CONCRETE PROVENANCE NOT ESTABLISHED**                                                                                             |
| D implementation                 | **NOT STARTED**                                                                                                                               |
| D Implementation Authorization   | **NOT GRANTED**                                                                                                                               |

---

## 2. Frozen Requirement

From Decision Freeze **COND-D-03**, Slice Approval, and Implementation Planning:

| Element                           | Status                         | Binding content                                                                                               |
| --------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Actor kind                        | **FROZEN**                     | `actorKind ∈ {SYSTEM_JOB, OPERATOR}` only; `CLIENT` forbidden                                                 |
| Representation                    | **FROZEN**                     | `PrivilegedActorContext = { actorId: string; actorKind: 'SYSTEM_JOB' \| 'OPERATOR'; correlationId?: string }` |
| B-04 binding                      | **FROZEN**                     | D start/resume/heartbeat/release **must** use B-04 with privileged context; no client-controlled grant/fence  |
| Anti-spoofing                     | **FROZEN**                     | No public HTTP for B-04; trusted invocation boundary must construct actor                                     |
| Execution model (planning)        | **PROPOSED / non-binding**     | Privileged Nest/service path — **not** a public HTTP API and **not** an automatically authorized cron job     |
| Concrete `actorId` value / source | **UNRESOLVED** (pre-discovery) | Must be concrete and auditable; **must not invent** identity values                                           |
| Confuse with HTTP request user?   | **Forbidden unless intended**  | Must not treat `request.user.userId` as D actor unless that is the ratified execution model                   |

**Implementation Planning PROPOSED (explicitly non-binding):**

> OPERATOR `actorId` = authenticated operator subject already trusted by the invocation boundary; SYSTEM_JOB `actorId` = stable job identity string provisioned by ops — **exact strings unbound**.

That proposal is **not** a provenance establishment. This discovery checks whether the repository already contains an authoritative mapping.

---

## 3. Repository Evidence

### 3.1 Baseline

| Item                           | Evidence                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `HEAD`                         | `daa627ab0fd26f4f63d45d5a55b8d5ece83b22bd`                                                  |
| `origin/main`                  | Same commit (P-D-01 delivered)                                                              |
| D orchestrator / D write path  | **Absent** — no production D service constructing actor or emitting D Security Audit events |
| D Implementation Authorization | **Not granted**                                                                             |

### 3.2 Privileged actor contract (exists)

| Location                                                                | What it establishes                                                                                                                                               |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/connections/migration-gate.ts`                    | `PrivilegedActorKind`, `PrivilegedActorContext`, `isPrivilegedActorContext`, `assertAcquireInput`                                                                 |
| `apps/api/src/modules/connections/migration-gate.port.ts`               | Port methods require `actor: PrivilegedActorContext`                                                                                                              |
| `apps/api/src/modules/connections/conn04-migration-boundary.service.ts` | B-04 façade: start/resume/heartbeat/release refuse unless `isPrivilegedActorContext`; **caller supplies** `actor`                                                 |
| `apps/api/src/modules/connections/prisma-migration-gate.adapter.ts`     | Persists `holderId = actor.actorId`, `actorKind = actor.actorKind`; audits with `actorId: actor.actorId`; `reclaimAsOperator` requires `actorKind === 'OPERATOR'` |

### 3.3 Security Audit conventions (exists)

| Location                                                              | What it establishes                                                                                                                                        |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/modules/security-audit/security-audit-record.ts`        | Attribution fields: optional `actorId`, `workspaceId`, `subjectId`, `resourceType`, `resourceId`, `correlationId` — **no `actorKind` field**               |
| `apps/api/src/modules/security-audit/security-audit-attribution.ts`   | `connection.migration-gate` requires `attribution.actorId`; `connection.lifecycle` / `connection.validation` require workspace + actorId + resource fields |
| `apps/api/src/modules/connections/connection-migration-gate-audit.ts` | Emits `connection.migration-gate` with `attribution.actorId` from caller input                                                                             |
| `apps/api/src/modules/connections/connection-lifecycle-audit.ts`      | Emits `connection.lifecycle` with `actorId: actorUserId` (HTTP-user pattern)                                                                               |
| `apps/api/src/modules/connections/connections.controller.ts`          | Ordinary Connections HTTP path sets `actorUserId: request.user.userId`                                                                                     |

### 3.4 Negative evidence (critical)

| Search / inspection                                                                                    | Result                                                                                        |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Production (non-`*.spec.ts`) construction of `{ actorKind: 'SYSTEM_JOB' \| 'OPERATOR', actorId: '…' }` | **None** — only type guards / field plumbing; **no concrete identity literals** outside tests |
| Callers of `Conn04MigrationBoundaryService` outside tests                                              | **None** (module registers it; only specs invoke it)                                          |
| Callers of `reclaimAsOperator` outside tests                                                           | **None**                                                                                      |
| Established FIV-CONN-04 / migration-backfill `SYSTEM_JOB` identity constant                            | **None**                                                                                      |
| Registry / runbook binding of a named job actor for D                                                  | **Not found in repository code or frozen D docs**                                             |
| Test fixture IDs (`op-1`, `job-1`, `client-a`, `smoke-a`, …)                                           | **Non-authoritative fixtures only**                                                           |

### 3.5 Related identifiers that are **not** actor provenance

| Identifier                                                                            | Location                             | Why it is not P-D-02 provenance                                |
| ------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| `FIV_CONN_04_MIGRATION_BACKFILL`                                                      | `migration-gate.ts` purpose constant | Lease **purpose**, not `actorId`                               |
| `gateKey` / resourceId `FIV-CONN-04`                                                  | Gate adapter / migration-gate audit  | Resource/gate identity, not actor                              |
| Dynamic `job.jobId` in `apps/api/src/modules/jobs`                                    | Background job queue                 | Ephemeral queue IDs; not privileged CONN-04 audit actors       |
| Domain strings like `orders-service`, `risk-engine`, `ledger` (tests / other domains) | Various modules                      | Unrelated domains; **not** CONN-04 privileged migration actors |

---

## 4. Existing Actor / Audit Conventions Discovered

1. **Two distinct actor models coexist:**
   - **HTTP / Connections facade:** `request.user.userId` → `actorUserId` → Security Audit `attribution.actorId` for lifecycle/validation.
   - **Privileged migration gate:** caller-supplied `PrivilegedActorContext` → lease `holderId` + `actorKind` + Security Audit `attribution.actorId` (kind stored on lease, **not** on Security Audit attribution schema).

2. **Security Audit stores string `actorId` only.** Kind discrimination for privileged paths is a Connections/migration-gate concern (`actorKind` on lease / in-memory context), not a Security Audit catalog field.

3. **B-04 does not provision identity.** It validates shape (`non-empty actorId` + allowed kind) and forwards. Provenance must live at the **trusted invocation boundary** that D does not yet have.

4. **Privileged reclaim is OPERATOR-kind gated**, still with caller-supplied `actorId` — no built-in operator subject directory.

5. **No service-to-service SYSTEM_JOB identity convention** is established for FIV-CONN-04. Purpose and gate key exist; job actor strings do not.

6. **Governance already recorded the gap:** Decision Freeze COND-D-03 = contract ratified + ops identity mapping unresolved; Impl Planning Review P-D-02 = concrete mapping insufficient / must not invent.

---

## 5. Candidate Provenance (if any)

| Candidate                                                       | Kind                                                        | Exact `actorId` value / source                  | Authoritative?                                                                   | Verdict                                                                                                                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP authenticated user (`request.user.userId`)                 | Would map to `OPERATOR` only if D were HTTP-operator-driven | **No single fixed value** — per-request subject | Established for **ordinary Connections HTTP**, not for D privileged orchestrator | **Rejected as D SoT** — conflicts with proposed non-HTTP D model unless PO later ratifies an operator-HTTP (or equivalent authenticated-operator) invocation boundary |
| Impl Planning PROPOSED “stable job identity provisioned by ops” | `SYSTEM_JOB`                                                | **Unbound** — no string in repo                 | **No**                                                                           | **Not established**                                                                                                                                                   |
| Test fixtures (`job-1`, `op-1`, …)                              | Either                                                      | Fixture literals                                | **No**                                                                           | **Forbidden to promote**                                                                                                                                              |
| Lease purpose `FIV_CONN_04_MIGRATION_BACKFILL`                  | N/A                                                         | Purpose enum                                    | N/A                                                                              | **Not an actorId**                                                                                                                                                    |
| Invented new constant (e.g. `fiv-conn-04-backfill-job`)         | `SYSTEM_JOB`                                                | Would be new                                    | Would **introduce** a new identity                                               | **Out of scope / not allowed by this discovery**; would still require ops/governance ratification                                                                     |

**Result:** **No authoritative candidate** with an exact established `actorId` value and trusted source for D.

---

## 6. Exact Source Locations Supporting the (Lack of) Candidate

| Path                                                                                                        | Relevance                                                         |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `apps/api/src/modules/connections/migration-gate.ts` (`PrivilegedActorContext`, `isPrivilegedActorContext`) | Kind/contract only                                                |
| `apps/api/src/modules/connections/conn04-migration-boundary.service.ts`                                     | Requires caller-supplied actor; no identity factory               |
| `apps/api/src/modules/connections/prisma-migration-gate.adapter.ts`                                         | Propagates caller `actor.actorId` / `actorKind`; no defaults      |
| `apps/api/src/modules/connections/connection-migration-gate-audit.ts`                                       | Audits caller `actorId`                                           |
| `apps/api/src/modules/security-audit/security-audit-attribution.ts`                                         | Requires `actorId` for `connection.migration-gate`; no kind       |
| `apps/api/src/modules/connections/connections.controller.ts`                                                | HTTP `request.user.userId` pattern for non-privileged Connections |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-decision-freeze.md` (COND-D-03)                         | Explicitly **UNRESOLVED** ops identity mapping                    |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-planning.md` (COND-D-03 / P-D-02)        | Concrete provenance **BLOCKING**; proposed strings unbound        |
| `docs/project/version-3/wave-6/v3-l02-fiv-conn-04-d-implementation-planning-review.md` (§ P-D-02)           | Concrete mapping **Insufficient — must not invent**               |

---

## 7. Established Identity vs New Identity

| Question                                                                 | Answer                                                                                                                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Is there an already-established production `actorId` for D?              | **NO**                                                                                                                                                  |
| Would selecting a value require introducing a new `SYSTEM_JOB` identity? | **YES**, if D is invoked as a system job without a pre-existing ops-bound string                                                                        |
| Would selecting OPERATOR require a new identity string?                  | **Not necessarily** — would require an **authenticated operator subject** from a trusted boundary; that boundary for D **does not exist in code** today |
| May this disposition invent / register a new identity?                   | **NO** (task constraint + Impl Planning Review)                                                                                                         |

---

## 8. Security Implications

1. **Inventing a placeholder `actorId`** would create false attribution: audits would appear attributable while no real subject/job authority exists.
2. **Reusing HTTP `request.user.userId` without an authenticated-operator D entry** would either (a) require a public/privileged HTTP surface (frozen-forbidden for B-04 / env PATCH), or (b) spoof operator identity from unauthenticated internal code.
3. **Type-guard-only privilege** (`SYSTEM_JOB` \| `OPERATOR`) is not authentication. Without a trusted constructor of `PrivilegedActorContext`, any internal caller could supply arbitrary IDs — D’s entry boundary must be the provenance SoT.
4. **Security Audit cannot recover `actorKind`** from attribution alone; investigation depends on honest `actorId` plus lease/payload correlation. Wrong provenance permanently pollutes the audit trail.

---

## 9. Operational / Auditability Implications

1. Operators cannot answer “who ran the backfill?” until provenance is bound to a real subject or an ops-provisioned job identity.
2. Lease `holderId` and audit `actorId` will only be as trustworthy as the D invocation boundary that supplies them.
3. Runbook / ops binding (credentials, who may trigger D, which job string is authorized) remains a **governance + ops** deliverable — not discoverable as an existing repo constant.
4. P-D-03 (NB-01 event type) remains independent; even after an event type is chosen, **attribution still needs a real `actorId`**.

---

## 10. Final Disposition

```text
P-D-02 = BLOCKED — CONCRETE PROVENANCE NOT ESTABLISHED
```

| Field                                         | Value                                                                                                                                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Disposition                                   | **BLOCKED — CONCRETE PROVENANCE NOT ESTABLISHED**                                                                                                                                            |
| Exact actor provenance                        | **Not established**                                                                                                                                                                          |
| Exact `actorId` value                         | **None authoritative**                                                                                                                                                                       |
| Exact authoritative source                    | **None**                                                                                                                                                                                     |
| What is established                           | Kind/contract (`SYSTEM_JOB` \| `OPERATOR`) + B-04 caller-supplied plumbing + Security Audit `actorId` string attribution                                                                     |
| What remains required                         | Trusted D invocation boundary + concrete mapping of that boundary’s subject/job identity → `PrivilegedActorContext.actorId` / `actorKind`, ratified without inventing unaudited placeholders |
| Clears D Implementation Authorization?        | **NO**                                                                                                                                                                                       |
| Affects P-D-03?                               | **NO** — left untouched                                                                                                                                                                      |
| Production / schema / planning docs modified? | **NO** (this disposition artifact only)                                                                                                                                                      |

### Explicit non-actions

```text
NO new SYSTEM_JOB identity created
NO actorId invented
NO audit schema / event type changes
NO D implementation
NO D planning document edits (beyond this disposition artifact)
NO P-D-03 / NB-01 work
NO commit / push
```

---

## 11. Governance Stop

```text
D IMPLEMENTATION NOT STARTED
D IMPLEMENTATION AUTHORIZATION NOT GRANTED
P-D-01 = CLOSED / DELIVERED (daa627ab…)
P-D-02 = BLOCKED — CONCRETE PROVENANCE NOT ESTABLISHED
P-D-03 = NOT DISPOSED BY THIS ARTIFACT

STOP AFTER P-D-02 DISPOSITION.
DO NOT PROCEED TO P-D-03 IN THIS TASK.
```

**END OF FIV-CONN-04-D P-D-02 DISPOSITION (historical body through 2026-09-18)**

---

## Appendix A — Dated supersession (2026-10-30) — Policy approved; P-D-02 still BLOCKED

**Authority:** Product Owner  
**Permanent record:** [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md)  
**Related:** [`v3-l02-fiv-conn-04-d-system-job-architecture-decision-package.md`](./v3-l02-fiv-conn-04-d-system-job-architecture-decision-package.md)  
**Nature:** Append-only. Does **not** rewrite the historical disposition body. Does **not** invent a code identity. Does **not** authorize D.

### A.1 Status summary

| Milestone                                                                                                                      | Status                                      |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Governance policy decisions (identity model, exact `actorId`, SoT, provisioning, trusted boundary, audit/lifecycle/ops, G1–G7) | **APPROVED**                                |
| Exact canonical `actorId` in governance SoT                                                                                    | `system-job:fiv-conn-04-migration-backfill` |
| Identity definition implemented in code                                                                                        | **NOT IMPLEMENTED**                         |
| Trusted binding implemented                                                                                                    | **NOT IMPLEMENTED**                         |
| Audit attribution implemented and verified                                                                                     | **NOT COMPLETED**                           |
| **P-D-02**                                                                                                                     | **BLOCKED**                                 |
| D Implementation Authorization                                                                                                 | **NOT GRANTED**                             |

```text
P-D-02 = BLOCKED
REASON: POLICY APPROVED; IDENTITY DEFINITION / TRUSTED BINDING / AUDIT VERIFICATION NOT IMPLEMENTED
D IMPLEMENTATION AUTHORIZATION = NOT GRANTED
```

### A.2 What changed vs historical §10

| Historical claim (2026-09-18)             | Current (2026-10-30)                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| Exact `actorId` value: None authoritative | Authoritative **governance** value approved; **code** constant still absent  |
| Exact authoritative source: None          | PO ratification record is SoT                                                |
| Concrete provenance not established       | Policy provenance established; runtime provenance **IMPLEMENTATION PENDING** |

Historical discovery findings (no production SYSTEM_JOB constructor; B-04 caller-supplied; etc.) remained accurate as repository **implementation** evidence until authorized P-D-02 delivery. That delivery and formal satisfaction are recorded in Appendix B / **D-CONN04-PD02-SAT**.

---

## Appendix B — Dated supersession (2026-10-30) — P-D-02 SATISFIED

**Decision ID:** D-CONN04-PD02-SAT  
**Authoritative record:** [`v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md)  
**PIR:** [`v3-l02-fiv-conn-04-d-pd02-post-implementation-review.md`](./v3-l02-fiv-conn-04-d-pd02-post-implementation-review.md) — **PASS WITH MINOR FINDINGS**  
**Nature:** Append-only. Does **not** rewrite the 2026-09-18 discovery body or Appendix A historical policy-only note. Does **not** authorize full FIV-CONN-04-D.

```text
P-D-02 = SATISFIED (D-CONN04-PD02-SAT)
PIR = PASS WITH MINOR FINDINGS
FIV-CONN-04-D FULL IMPLEMENTATION = NOT AUTHORIZED
```

Appendix A correctly recorded that after policy approval, P-D-02 remained BLOCKED pending code. That BLOCKED state is **superseded** by D-CONN04-PD02-SAT for P-D-02 satisfaction only.
