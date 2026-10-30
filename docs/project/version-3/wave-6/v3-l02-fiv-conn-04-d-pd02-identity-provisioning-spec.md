# P-D-02 Canonical SYSTEM_JOB Identity Provisioning Specification

**Document:** FIV-CONN-04-D — P-D-02 Identity Provisioning Specification  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Baseline:** `daa627ab0fd26f4f63d45d5a55b8d5ece83b22bd` (`HEAD` = `origin/main`)  
**Inputs (read-only; not modified):**

- [`v3-l02-fiv-conn-04-d-pd02-ratification.md`](./v3-l02-fiv-conn-04-d-pd02-ratification.md)
- [`v3-l02-fiv-conn-04-d-pd02-governance-decision-package.md`](./v3-l02-fiv-conn-04-d-pd02-governance-decision-package.md)
- [`v3-l02-fiv-conn-04-d-pd02-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-disposition.md)
- [`v3-l02-fiv-conn-04-d-pd02-resolution-analysis.md`](./v3-l02-fiv-conn-04-d-pd02-resolution-analysis.md)
- Decision Freeze COND-D-03; Slice Approval; Impl Planning / Review

**Nature:** Specifies the **governance/operations contract** required to provision the missing canonical SYSTEM_JOB identity. Does **not** invent an `actorId`. Does **not** implement identity or D. Does **not** modify production code, schemas, B-04, PrivilegedActorContext, Security Audit, D planning, or prior P-D-02 artifacts. Does **not** dispose P-D-03. Does **not** commit or push.

```text
P-D-02 remains BLOCKED until the exact canonical SYSTEM_JOB actorId
and its authoritative owner/provenance are explicitly provisioned and recorded.
```

> **Reader note (2026-10-30):** Exact canonical `actorId` and owner/provenance **policy** are now recorded in [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md). **P-D-02 remains BLOCKED** pending implementation evidence (constant, trusted binding, audit verification) and a formal satisfaction disposition. See Appendix A. Historical body below is preserved.

---

## 1. Current Blocker

| Field                | Value                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Prerequisite         | **P-D-02**                                                                                                                          |
| Provenance **model** | **OPT-PD02-02** selected ([ratification](./v3-l02-fiv-conn-04-d-pd02-ratification.md))                                              |
| Satisfaction         | **BLOCKED**                                                                                                                         |
| Exact reason         | Q5 incomplete: no **exact** canonical SYSTEM_JOB `actorId` string and **owner** have been provisioned with authoritative provenance |

The repository establishes actor **shape** (`PrivilegedActorContext` with `SYSTEM_JOB` | `OPERATOR`) and B-04 / Security Audit **plumbing** for a caller-supplied `actorId`. It does **not** establish a CONN-04-authoritative job identity value. Model selection without Q5 does **not** satisfy P-D-02.

**Must not be reused as `actorId`:** lease purpose `FIV_CONN_04_MIGRATION_BACKFILL`; gate key `FIV-CONN-04`; test fixtures (`job-1`, `op-1`, …).

---

## 2. Ratified Model

| Element                              | Binding                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| Provenance option                    | **OPT-PD02-02**                                                                          |
| `actorKind`                          | **`SYSTEM_JOB`** (single-mode; OPERATOR mapping N/A)                                     |
| Invocation boundary                  | Trusted **non-public** D boundary — **not** public Connections HTTP; **not** public B-04 |
| B-04                                 | Receives caller-supplied `PrivilegedActorContext`                                        |
| Security Audit                       | Receives `attribution.actorId` (same string as privileged context once provisioned)      |
| New identity authorized in principle | **YES** (Q4) — value still unprovisioned                                                 |
| External registry                    | **Not required** unless identity is later provisioned through one (Q6)                   |
| `correlationId`                      | Existing optional / reuse-when-present contract unchanged (Q7)                           |

---

## 3. Required Identity Contract

Governance/operations must supply the following **minimum** fields. Values are **intentionally blank** in this specification — they must be filled only by an authoritative provisioning decision, never by invention here.

| Field                                                            | Requirement                                                                                                                                                                                                                                                      | Value in this artifact                                                          |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Exact canonical `actorId` string**                             | Character-for-character identity used as `PrivilegedActorContext.actorId` and Security Audit `attribution.actorId`                                                                                                                                               | _to be provisioned_                                                             |
| **Owner / accountable operations role**                          | Named role or function accountable for the string (change control, compromise response)                                                                                                                                                                          | _to be provisioned_                                                             |
| **Authoritative source**                                         | Explicit statement of where the identity is defined as SoT (e.g. recorded governance ratification, named ops registry entry, Freeze amendment)                                                                                                                   | _to be provisioned_                                                             |
| **Lifecycle / rotation ownership**                               | Who may rotate/retire the string; whether rotation requires Freeze / re-ratification                                                                                                                                                                             | _to be provisioned_ (or explicit “no rotation expected” with owner still named) |
| **Proof not client-controlled**                                  | Statement that no public HTTP / client request field may supply or override this `actorId`                                                                                                                                                                       | _to be provisioned_                                                             |
| **Binding mechanism available to trusted D invocation boundary** | How the non-public D entry will obtain the string at runtime **after** authorization (e.g. governance-bound constant, config key reading a ratified value, registry lookup of a ratified key) — mechanism description only; **not** implemented by this artifact | _to be provisioned_                                                             |

**Out of contract scope for this provisioning step:** inventing the string; implementing constructors; changing `PrivilegedActorContext` / B-04 / Security Audit schemas; deciding C1/C2; deciding P-D-03.

---

## 4. Repository Evidence

### 4.1 Privileged migration-gate / CONN-04

| Convention                                       | Present? | Notes                            |
| ------------------------------------------------ | -------- | -------------------------------- |
| `PrivilegedActorKind` / `PrivilegedActorContext` | **Yes**  | Shape only (`migration-gate.ts`) |
| Canonical CONN-04 SYSTEM_JOB `actorId` constant  | **No**   |                                  |
| Owner convention for privileged job actors       | **No**   |                                  |
| Registry/config for privileged job actors        | **No**   |                                  |
| Production B-04 caller that binds a job id       | **No**   | Specs only                       |

### 4.2 Security Audit

| Convention                                      | Present? | Notes                                                                         |
| ----------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| `attribution.actorId` string                    | **Yes**  | Required for `connection.migration-gate`; pattern for other connection events |
| `actorKind` on attribution                      | **No**   | Separate C1/C2 question                                                       |
| CONN-04 SYSTEM_JOB naming rule in audit catalog | **No**   |                                                                               |

### 4.3 SYSTEM_JOB / system-actor patterns elsewhere (not CONN-04 authoritative)

| Example                                                 | Location                                | Relevance                                                                                  |
| ------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| `STARTUP_RECOVERY_ACTOR_ID = 'system:startup-recovery'` | `startup-recovery-discovery.service.ts` | Domain-local string for recovery actor — **not** `PrivilegedActorContext`, **not** CONN-04 |
| `actorId: 'execution-engine'`                           | `execution-engine.service.ts`           | Domain event actor string — **not** CONN-04 SYSTEM_JOB provenance                          |
| Test fixtures (`job-1`, …)                              | Connection specs                        | Non-authoritative                                                                          |

These show that **some domains use fixed internal actor strings**, but they do **not** establish a repository-wide **PrivilegedActorContext SYSTEM_JOB naming convention**, ownership convention, registry, service-account convention, or CONN-04 ops runbook identity.

### 4.4 Ops / runbook conventions

| Convention                                  | Present? | Notes                                                       |
| ------------------------------------------- | -------- | ----------------------------------------------------------- |
| Checked-in CONN-04 D actor identity runbook | **No**   | No `*runbook*` files found for this identity                |
| Decision Freeze named job id                | **No**   | COND-D-03 explicitly **UNRESOLVED** on ops identity mapping |
| Impl Planning exact string                  | **No**   | “exact strings unbound”; must not invent                    |

### 4.5 Summary

```text
Canonical SYSTEM_JOB naming convention for PrivilegedActorContext: NOT FOUND
Authoritative CONN-04 SYSTEM_JOB actorId: NOT FOUND
Owner / registry / service-account / runbook convention for CONN-04 D: NOT FOUND
```

Absence of an in-repo mechanism does **not** by itself require implementing a new platform registry. Provisioning may be purely governance/ops recording, with runtime binding designed later under Implementation Authorization.

---

## 5. Provisioning Paths

**Unordered.** No preference, ranking, or selection. Paths are governance- or repository-supported ways to **establish** the §3 contract fields under already-ratified OPT-PD02-02.

### Path P1 — Standalone governance provisioning / satisfaction disposition

Record exact `actorId`, owner, authoritative source, non-client-control proof, and intended binding mechanism in a follow-on **P-D-02 satisfaction disposition** (or equivalent PO/Security ratification artifact). No Freeze text change required if COND-D-03 kinds/anti-spoofing remain intact.

### Path P2 — Decision Freeze COND-D-03 amendment

Embed the exact named SYSTEM_JOB identity (and owner reference) into Decision Freeze COND-D-03 as the binding ops identity mapping. Still requires the same §3 fields; Freeze becomes the authoritative recorded source.

### Path P3 — Ops runbook / external registry entry + governance record

Ops publishes the identity in a controlled runbook or registry; governance then records the **exact** string (or registry key that resolves to the exact string), owner, and source in a P-D-02 satisfaction artifact. Compatible with ratification Q6 (“not required unless provisioned through such a registry”). Does **not** switch provenance model away from OPT-PD02-02.

### Path P4 — Governance-bound configuration key (value ratified first)

Governance ratifies the exact string and names a configuration/env key that the future trusted D boundary may read. The **value** must be ratified before code treats the key as SoT; empty/unbound config must fail closed. Implementation of the reader is **out of scope** until D is authorized.

**Common constraints for all paths:**

- Do not treat purpose/gate key/fixtures as the actor.
- Do not invent the string in discovery, planning edits, or casual coding.
- Do not introduce public HTTP / public B-04 as the binding path.
- Runtime code may consume the identity only **after** P-D-02 is SATISFIED and D Implementation Authorization is separately granted.

---

## 6. Satisfaction Criteria

P-D-02 may change from **BLOCKED** to **SATISFIED** only when **all** of the following evidence exists in an explicit governance record:

| #   | Criterion                                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Exact canonical `actorId` string is **explicitly ratified** (character-for-character)                                             |
| 2   | `actorId` has **authoritative provenance** (named source: disposition / Freeze amendment / ops registry+record)                   |
| 3   | **Owner** / accountable operations role is **explicitly recorded**                                                                |
| 4   | Intended **binding mechanism** for the trusted non-public D invocation boundary is stated (design-level; implementation may wait) |
| 5   | Record states **no client-controlled path** may supply or override the identity                                                   |
| 6   | Record states Security Audit `attribution.actorId` **shall use the same** identity as `PrivilegedActorContext.actorId`            |
| 7   | Record confirms **no silent change** to frozen kinds, anti-spoofing, B-04 privilege model, or public-env-PATCH ban                |
| 8   | Record does **not** dispose P-D-03 or grant D Implementation Authorization by implication                                         |

Until those criteria are met, P-D-02 remains **BLOCKED**.

---

## 7. Governance Action Required

Governance and/or operations must **explicitly provision and record**:

1. The **exact** canonical SYSTEM_JOB `actorId` string for FIV-CONN-04-D.
2. The **authoritative owner** (accountable role) and **provenance/source**.
3. Non-client-control and trusted-boundary binding statements per §3 / §6.

Delivery vehicle may be any path in §5. This specification does **not** choose among them.

```text
P-D-02 remains BLOCKED until the exact canonical SYSTEM_JOB actorId
and its authoritative owner/provenance are explicitly provisioned and recorded.
```

### Scope fence

```text
P-D-01 = DELIVERED
P-D-02 model = OPT-PD02-02 (selected)
P-D-02 satisfaction = BLOCKED
P-D-03 = untouched
D implementation = NOT STARTED
D Implementation Authorization = NOT GRANTED
No actorId invented
No SYSTEM_JOB constant created
No production / schema / audit / planning code modified
Prior P-D-02 artifacts untouched
NO COMMIT / NO PUSH
```

**END OF P-D-02 IDENTITY PROVISIONING SPECIFICATION (historical body through 2026-09-18)**

---

## Appendix A — Dated supersession (2026-10-30) — Approved identity policy; implementation pending

**Authority:** Product Owner  
**Permanent record / SoT:** [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md)  
**Nature:** Replaces unresolved §3 contract blanks with **APPROVED POLICY**. Does **not** create the backend constant. Does **not** mark P-D-02 SATISFIED. Does **not** authorize D implementation.

### A.1 Approved identity contract (fills historical §3 blanks)

| Field                          | APPROVED POLICY value                                                                                                                              |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact canonical `actorId`      | `system-job:fiv-conn-04-migration-backfill`                                                                                                        |
| Owner                          | Product Owner (product-level); Connections / D identity-definition and orchestration components (application-level technical)                      |
| Authoritative source (SoT)     | Product Owner ratification record linked above                                                                                                     |
| Lifecycle / rotation ownership | Product Owner decision required for rotation; coordinated governance + deployment; consider active leases; do not rewrite/delete historical audits |
| Proof not client-controlled    | No HTTP/client/query/header/job-payload/`PrivilegedActorContext` injection; only trusted D orchestrator constructs context                         |
| Binding mechanism (design)     | Static mirrored backend constant + trusted D entry construction; restricted B-04 exports/call paths; fail closed if missing/invalid                |

### A.2 Selected provisioning path

**APPROVED:** Governance ratification (historical Path P1) as SoT, with application mirror via backend-controlled constant after separate implementation authorization (aligned with historical Path P4 _after_ value ratification). Env/DB registry are **not** authoritative.

### A.3 Refined satisfaction milestones

Historical §6 criteria for recording exact string / owner / binding **policy** are **met in governance** by the PO ratification.

**P-D-02 remains BLOCKED** until all of the following also exist (per PO ratification milestone model):

| #   | Remaining for P-D-02 satisfaction                                                                     |
| --- | ----------------------------------------------------------------------------------------------------- |
| R1  | Identity definition implemented (backend constant matching exact string) under separate authorization |
| R2  | Trusted binding implemented (D orchestrator construction + restricted call paths + tests)             |
| R3  | Audit attribution implemented and verified (`attribution.actorId` equals canonical string)            |
| R4  | Formal P-D-02 satisfaction disposition recorded after verification                                    |

```text
IDENTITY POLICY: APPROVED
IDENTITY DEFINITION IN CODE: IMPLEMENTATION PENDING
P-D-02: BLOCKED
D IMPLEMENTATION: NOT AUTHORIZED
NO BACKEND CONSTANT CREATED BY THIS SPEC UPDATE
```
