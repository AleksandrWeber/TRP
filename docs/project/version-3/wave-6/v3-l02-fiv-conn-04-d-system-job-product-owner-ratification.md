# FIV-CONN-04-D — SYSTEM_JOB Product Owner Ratification

**Decision title:** Canonical SYSTEM_JOB identity policy for FIV-CONN-04-D (OPT-PD02-02 Q5 / G1–G7)  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Decision authority:** Product Owner  
**Nature:** Permanent repository-controlled governance record of **APPROVED POLICY**. Does **not** implement identity. Does **not** create a backend constant. Does **not** implement trusted binding. Does **not** modify application source, schemas, tests, B-04, or Security Audit. Does **not** mark P-D-02 SATISFIED. Does **not** authorize FIV-CONN-04-D implementation. Does **not** stage, commit, or push.

```text
APPROVED POLICY: YES
EXACT CANONICAL actorId: system-job:fiv-conn-04-migration-backfill
actorKind: SYSTEM_JOB
IDENTITY DEFINITION IN CODE: IMPLEMENTATION PENDING
TRUSTED BINDING IN CODE: IMPLEMENTATION PENDING
AUDIT VERIFICATION: IMPLEMENTATION PENDING
P-D-02: BLOCKED
D IMPLEMENTATION: NOT AUTHORIZED
```

---

## 1. Decision title and date

| Field                    | Value                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| Title                    | Canonical SYSTEM_JOB identity policy for FIV-CONN-04-D                                                  |
| Date                     | 2026-10-30                                                                                              |
| Model baseline           | OPT-PD02-02 — SYSTEM_JOB (**unchanged**)                                                                |
| Prior model ratification | [`v3-l02-fiv-conn-04-d-pd02-ratification.md`](./v3-l02-fiv-conn-04-d-pd02-ratification.md) (2026-09-18) |

---

## 2. Decision authority

| Layer                                                    | Authority                                                        |
| -------------------------------------------------------- | ---------------------------------------------------------------- |
| Product-level decision authority                         | **Product Owner**                                                |
| Application-level technical ownership (when implemented) | Connections / D identity-definition and orchestration components |

Product Owner remains the human decision authority. No separate human operations owner or organizational role is invented by this record. ChatGPT / automated assistants are **not** legal entities, employees, accountable organizations, or repository owners for this decision.

---

## 3. Context and evidence references

| Artifact                                                                                                                                 | Role                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| [`v3-l02-fiv-conn-04-d-pd02-ratification.md`](./v3-l02-fiv-conn-04-d-pd02-ratification.md)                                               | OPT-PD02-02 model ratified; Q5 historically incomplete                                                                                         |
| [`v3-l02-fiv-conn-04-d-pd02-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-disposition.md)                                                 | P-D-02 disposition (updated with policy-approved / still-blocked status)                                                                       |
| [`v3-l02-fiv-conn-04-d-pd02-identity-provisioning-spec.md`](./v3-l02-fiv-conn-04-d-pd02-identity-provisioning-spec.md)                   | Provisioning contract                                                                                                                          |
| [`v3-l02-fiv-conn-04-d-g1-g7-governance-decision-request.md`](./v3-l02-fiv-conn-04-d-g1-g7-governance-decision-request.md)               | G1–G7 request (now resolved by this record)                                                                                                    |
| [`v3-l02-fiv-conn-04-d-system-job-architecture-discovery.md`](./v3-l02-fiv-conn-04-d-system-job-architecture-discovery.md)               | Architecture discovery evidence                                                                                                                |
| [`v3-l02-fiv-conn-04-d-system-job-architecture-decision-package.md`](./v3-l02-fiv-conn-04-d-system-job-architecture-decision-package.md) | Decision package (recommendations now approved)                                                                                                |
| Decision Freeze COND-D-03                                                                                                                | Kind/contract frozen; historical “ops mapping UNRESOLVED” is **policy-resolved here** without amending Freeze text (provisioning-spec Path P1) |
| `PrivilegedActorContext` / B-04 / Security Audit                                                                                         | Existing shape and plumbing — unchanged by this record                                                                                         |

---

## 4. Approved identity model

**APPROVED POLICY**

- `actorKind = SYSTEM_JOB`.
- SYSTEM_JOB is represented through the existing `PrivilegedActorContext`.
- It is a typed privileged execution context with a distinct canonical principal identifier (`actorId`).
- It is **not** an Identity User, JWT subject, generic background job, service account, or Trading Runtime worker.
- No separate Identity Management subsystem or database registry is introduced for this design.

---

## 5. Exact canonical actorId

**APPROVED POLICY**

```text
system-job:fiv-conn-04-migration-backfill
```

| Property       | Binding                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Stability      | Stable identity (not generated per execution)                                                                              |
| Scope          | Exclusively FIV-CONN-04 migration environment backfill                                                                     |
| Cardinality    | One canonical identity for this capability                                                                                 |
| Reuse          | Must not be reused for unrelated capabilities                                                                              |
| Change control | Any future identity change requires a **new** explicit Product Owner decision and coordinated governance/deployment update |

**Must not be used as `actorId`:** gate key `FIV-CONN-04`; lease purpose `FIV_CONN_04_MIGRATION_BACKFILL`; test fixtures; `execution-engine`; `system:startup-recovery`; `trading-session-runtime-worker`; ordinary HTTP `request.user.userId`.

**IMPLEMENTATION PENDING:** backend-controlled constant mirroring this exact string.

---

## 6. Source-of-truth policy

**APPROVED POLICY**

| Role                  | Artifact                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------- |
| **Authoritative SoT** | This Product Owner–ratified governance record (exact canonical `actorId`)                   |
| Application mirror    | Backend-controlled constant introduced **only** after separate implementation authorization |
| Not authoritative     | Environment variables; database records; parallel identity registries                       |

---

## 7. Provisioning policy

**APPROVED POLICY**

- Identity **definition** is static and deployment-based.
- Backend-controlled constant is introduced only during separately authorized implementation (**IMPLEMENTATION PENDING**).
- Runtime execution context is constructed at the trusted D entry point (**IMPLEMENTATION PENDING**).
- Missing, blank, mismatched, or invalid identity must **fail closed**.
- No automatic identity generation or silent fallback is allowed.

Distinction preserved: **identity definition** (ratified string / future constant) ≠ **execution context creation** (runtime `PrivilegedActorContext` construction).

---

## 8. Trusted execution boundary

**APPROVED POLICY** — static identity definition + dedicated trusted D execution entry.

Mandatory rules:

1. Only the designated internal D orchestrator may construct the SYSTEM_JOB privileged context for FIV-CONN-04-D.
2. It must set `actorKind = SYSTEM_JOB` internally.
3. It must use only the approved canonical `actorId`.
4. It must not accept `actorId`, `actorKind`, or raw `PrivilegedActorContext` from HTTP requests, clients, query parameters, headers, job payloads, or other externally controlled input.
5. Public HTTP/API routes must not expose privileged D execution.
6. The raw B-04 boundary must not remain broadly available to arbitrary application modules.
7. Prefer a narrow D-owned façade and restricted module exports/call paths.
8. Generic Connections services must not expose a run-as-SYSTEM_JOB parameter.
9. B-04 lease/gate controls remain mandatory.
10. Implementation must include tests demonstrating that unauthorized callers cannot construct or inject the privileged context through supported application entry points.

A non-public HTTP endpoint alone is **not** an adequate trust boundary.

**IMPLEMENTATION PENDING:** D orchestrator, construction allowlist, export/call-path restriction, and tests.

---

## 9. Audit policy

**APPROVED POLICY**

- Canonical `actorId` must be used consistently in B-04 and Security Audit attribution.
- `attribution.actorId` remains mandatory for relevant migration-gate events.
- Prisma schema change to persist `actorKind` is **NOT** required for initial P-D-02 satisfaction path.

**DEFERRED OPTIONAL REFINEMENT**

- Persisting `actorKind` in sanitized audit metadata is optional and deferred.
- Existing audit records must remain compatible.

**IMPLEMENTATION PENDING:** emission/verification that audit `attribution.actorId` equals the canonical string when D/gate events are produced under authorized implementation.

---

## 10. Lifecycle and revocation

**APPROVED POLICY**

- Application-level technical ownership: Connections / D identity-definition and orchestration components.
- Product-level authority and approval: Product Owner.
- Execution can be disabled by preventing the D entry from constructing the privileged context or invoking B-04.
- Missing or invalid identity must fail closed.
- Identity rotation requires a new Product Owner decision, governance update, coordinated deployment, and consideration of active leases.
- Historical audit records must not be rewritten or deleted during revocation or rotation.

---

## 11. Operational restrictions

**APPROVED POLICY**

- D execution is **explicitly invoked**.
- **No** automatic cron or scheduler execution is authorized.
- **No** generic job payload may supply SYSTEM_JOB identity.
- B-04 migration-gate lease contention remains mandatory for duplicate execution protection.
- SYSTEM_JOB identity alone does **not** grant authority to bypass migration gate, Vault eligibility, Strategy B protections, or conditional update requirements.

---

## 12. G1–G7 resolutions

| ID                        | Resolution                                                                                                                                                  | Status                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **G1 — Authority**        | Product Owner is the decision authority for product and architecture identity policy.                                                                       | **RESOLVED**          |
| **G2 — Process**          | Product Owner approval → repository governance ratification → separately authorized implementation → verification → formal P-D-02 satisfaction disposition. | **RESOLVED**          |
| **G3 — Source of Truth**  | The ratified governance record containing the exact canonical `actorId` (this document).                                                                    | **RESOLVED**          |
| **G4 — Naming**           | `system-job:<capability>`; lowercase, stable, capability-scoped identifier.                                                                                 | **RESOLVED**          |
| **G5 — Owner**            | Product-level decision owner: Product Owner. Application-level technical ownership: Connections / D identity-definition and orchestration components.       | **RESOLVED**          |
| **G6 — Trusted Binding**  | Only the trusted internal D orchestrator constructs the SYSTEM_JOB context; no externally supplied actor fields; restricted B-04 access.                    | **RESOLVED** (policy) |
| **G7 — Permanent Record** | This ratification record, linked from the P-D-02 disposition and D architecture decision package.                                                           | **RESOLVED**          |

No external governance authority remains a prerequisite for these resolved decisions.

---

## 13. Explicit non-goals

This record does **not**:

- implement or hardcode the backend constant;
- implement the D orchestrator or trusted binding;
- modify B-04 or Security Audit code;
- introduce a database identity registry or Identity User for SYSTEM_JOB;
- authorize automatic cron/scheduler D execution;
- dispose P-D-03 / NB-01;
- amend Decision Freeze text (kinds/anti-spoofing unchanged; ops mapping recorded here per Path P1);
- mark P-D-02 SATISFIED;
- grant D Implementation Authorization;
- authorize live trading or real-capital movement;
- invent a separate human operations org role.

---

## 14. Implementation prerequisites

Before engineering may introduce the constant, D orchestrator, or binding tests:

1. Separate **implementation planning** task (as required by project process).
2. Separate **D Implementation Authorization** (and any remaining prerequisites such as P-D-03 disposition as independently required).
3. Implementation must match this policy character-for-character for `actorId` and `actorKind`.

Until those occur: **IMPLEMENTATION PENDING** / **NOT AUTHORIZED**.

---

## 15. P-D-02 status

```text
P-D-02 STATUS: BLOCKED
```

| Milestone                                            | Status                          |
| ---------------------------------------------------- | ------------------------------- |
| Architecture / identity **policy** approved          | **YES** (this record)           |
| G1–G7 policy resolutions recorded                    | **YES**                         |
| Exact canonical `actorId` ratified in governance SoT | **YES**                         |
| Identity definition implemented in code              | **NO** — IMPLEMENTATION PENDING |
| Trusted binding implemented                          | **NO** — IMPLEMENTATION PENDING |
| Audit attribution implemented and verified           | **NO** — IMPLEMENTATION PENDING |
| P-D-02 formally SATISFIED                            | **NO** — remains **BLOCKED**    |

Policy approval alone does **not** satisfy P-D-02.

---

## 16. D implementation authorization status

```text
FIV-CONN-04-D IMPLEMENTATION: NOT AUTHORIZED
```

---

## 17. Superseded proposal references and decision history

| Date           | Artifact                      | Effect                                                                                                                                                             |
| -------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-09-18     | P-D-02 model ratification     | OPT-PD02-02 selected; Q5 not established                                                                                                                           |
| 2026-09-18     | Identity provisioning spec    | Contract fields blank; paths unordered                                                                                                                             |
| 2026-10-30     | Architecture discovery        | Recommended Option B + Option C; no approval                                                                                                                       |
| 2026-10-30     | Architecture decision package | Proposed candidate `system-job:fiv-conn-04-migration-backfill` as **NOT APPROVED**                                                                                 |
| 2026-10-30     | G1–G7 request                 | Requested decisions; did not make them                                                                                                                             |
| **2026-10-30** | **This PO ratification**      | **Approves** identity policy, exact `actorId`, SoT, provisioning, trusted boundary, audit/lifecycle/ops rules, and G1–G7; **does not** implement or satisfy P-D-02 |

Historical artifacts retain their original text. Dated superseding sections on linked documents point here. Candidate status “NOT APPROVED” in the decision package is superseded by this approval for **policy** only.

**END OF SYSTEM_JOB PRODUCT OWNER RATIFICATION**
