# P-D-02 Ratification

**Document:** FIV-CONN-04-D — P-D-02 Explicit Provenance Ratification  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Baseline:** `daa627ab0fd26f4f63d45d5a55b8d5ece83b22bd` (`HEAD` = `origin/main`)  
**Inputs (read-only; not modified):**

- [`v3-l02-fiv-conn-04-d-pd02-governance-decision-package.md`](./v3-l02-fiv-conn-04-d-pd02-governance-decision-package.md)
- [`v3-l02-fiv-conn-04-d-pd02-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-disposition.md)
- [`v3-l02-fiv-conn-04-d-pd02-resolution-analysis.md`](./v3-l02-fiv-conn-04-d-pd02-resolution-analysis.md)

**Nature:** Governance ratification of the **provenance model** (OPT-PD02-02). Does **not** invent a canonical `actorId`. Does **not** implement SYSTEM_JOB. Does **not** modify production code, schemas, B-04, PrivilegedActorContext, Security Audit, D planning, or prior P-D-02 artifacts. Does **not** dispose P-D-03. Does **not** grant D Implementation Authorization. Does **not** commit or push.

```text
PROVENANCE MODEL SELECTED: OPT-PD02-02
CANONICAL SYSTEM_JOB actorId: NOT PROVISIONED
P-D-02 STATUS: BLOCKED (pending exact identity provisioning)
```

> **Reader note (2026-10-30):** Exact canonical `actorId` is now **APPROVED POLICY** in [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md) (`system-job:fiv-conn-04-migration-backfill`). Code provisioning remains **IMPLEMENTATION PENDING**. **P-D-02 remains BLOCKED.** See Appendix A. Historical body below is preserved.

---

## 1. Ratified Provenance

| Decision                                                               | Record                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Q1 — Provenance option**                                             | **OPT-PD02-02** — SYSTEM_JOB via newly ratified canonical job identity                                                                                                                                                                                                       |
| **Rationale (governance record)**                                      | D planning model is a privileged internal migration orchestrator, not a public Connections HTTP operation. Provenance therefore binds D execution to a stable, explicit `SYSTEM_JOB` identity rather than deriving a human operator identity from ordinary Connections HTTP. |
| **Q2 — Trusted boundary not public Connections HTTP / public B-04**    | **YES**                                                                                                                                                                                                                                                                      |
| **Q3 — OPERATOR subject mapping**                                      | **NOT APPLICABLE** (single-mode SYSTEM_JOB provenance)                                                                                                                                                                                                                       |
| **Q4 — Authorize introduction of a new canonical SYSTEM_JOB identity** | **YES** — no existing authoritative CONN-04 actorId was found in repository/operations evidence inspected for this ratification                                                                                                                                              |
| **Q5 — Exact ratified identity string and owner**                      | **NOT ESTABLISHED** — see §3 (no placeholder recorded)                                                                                                                                                                                                                       |
| **Q6 — External registry**                                             | **NOT REQUIRED** for OPT-PD02-02 unless the identity is later explicitly provisioned through such a registry                                                                                                                                                                 |
| **Q7 — correlationId**                                                 | **Unchanged** — remains per existing frozen / optional contract; **not** silently made mandatory by this artifact                                                                                                                                                            |

**Model selection status:** OPT-PD02-02 is the **selected provenance model**.  
**Satisfaction status:** P-D-02 is **not** SATISFIED until Q5 (exact canonical string + owner) is provisioned by governance/ops without invention in code discovery.

---

## 2. Frozen Contract Alignment

Under OPT-PD02-02, the following frozen alignments are confirmed for the selected model:

| Requirement                   | Alignment                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `actorKind`                   | **`SYSTEM_JOB`** only for this single-mode selection                                                                   |
| `actorId`                     | Must be **authoritative**, stable, and **non-client-controlled** once provisioned                                      |
| D invocation boundary         | Trusted **non-public** boundary — **not** public Connections HTTP; **not** public B-04                                 |
| B-04                          | Remains the privileged gate; receives **caller-supplied** `PrivilegedActorContext` constructed at the trusted boundary |
| Security Audit                | Continues to receive `attribution.actorId` (string); no attribution-schema change by this artifact                     |
| Public HTTP grant / env PATCH | **Not introduced**                                                                                                     |

No change is made to `PrivilegedActorContext`, B-04, or Security Audit schemas by this ratification.

---

## 3. Canonical Actor Identity

### Inspection result

Read-only inspection reconfirmed (consistent with prior P-D-02 disposition / resolution analysis / decision package):

| Candidate                                                     | Status              | Why not authoritative as `actorId`              |
| ------------------------------------------------------------- | ------------------- | ----------------------------------------------- |
| `FIV-CONN-04` (`MIGRATION_GATE_KEY_FIV_CONN_04`)              | Exists              | Gate **key** / resource identity — not an actor |
| `FIV_CONN_04_MIGRATION_BACKFILL`                              | Exists              | Lease **purpose** — not an actor                |
| Test fixtures (`job-1`, `client-a`, …)                        | Exist in specs only | Non-authoritative                               |
| Ordinary Connections `request.user.userId`                    | Exists              | HTTP path; **not** D SYSTEM_JOB SoT             |
| Unrelated domain strings (`orders-service`, `risk-engine`, …) | Exist elsewhere     | False attribution if reused for CONN-04         |
| Production non-test `SYSTEM_JOB` actor literal for CONN-04    | **None found**      | —                                               |

**No authoritative existing CONN-04 SYSTEM_JOB `actorId` value was found.**

### Exact identity

```text
P-D-02 CANNOT YET BE MARKED SATISFIED BECAUSE THE CANONICAL
SYSTEM_JOB ACTOR ID HAS NOT BEEN PROVISIONED.
```

| Field               | Value                                 |
| ------------------- | ------------------------------------- |
| Exact `actorId`     | **Not recorded** (would be invention) |
| Source / provenance | **Not established**                   |
| Owner               | **Not established**                   |
| Why authoritative   | **N/A**                               |

**Explicitly not used as placeholders:** `fiv-conn-04`, `connection-environment-backfill`, `system-job`, `FIV_CONN_04_MIGRATION_BACKFILL`, `FIV-CONN-04`, or any other invented string.

### What governance / ops must provide to complete Q5

To mark P-D-02 SATISFIED under OPT-PD02-02, an explicit provisioning decision must supply **all** of:

1. The **exact** canonical SYSTEM_JOB identity string (character-for-character).
2. The **owning** ops/governance role responsible for that string (rotation, compromise response, change control).
3. Confirmation the string is **not** client-settable and will be bound only at the trusted non-public D invocation boundary.
4. Confirmation it is **distinct** from lease purpose / gate key unless a future Freeze explicitly dual-purposes those identifiers (current evidence forbids treating them as actor ids).

That provisioning may be recorded in a follow-on P-D-02 satisfaction disposition (or Decision Freeze amendment if PO elects to embed the name in COND-D-03). **This artifact does not invent the string.**

---

## 4. Security Requirements

Recorded as binding for the selected OPT-PD02-02 model:

1. `actorId` **cannot** be client-controlled.
2. `actorId` **cannot** be inferred from arbitrary request input.
3. Actor identity **must** be bound at the trusted invocation boundary once provisioned.
4. B-04 remains the privileged gate for start/resume/heartbeat/release / write-authority proof.
5. **No** public B-04 surface.
6. **No** public environment PATCH / public Connections HTTP path as D grant authority.

Until the canonical string is provisioned, no production constructor of a CONN-04 SYSTEM_JOB actor is authorized by this artifact.

---

## 5. Audit Requirements

1. When D later emits durable Security Audit events, `attribution.actorId` **must** use the **same** canonical SYSTEM_JOB identity that B-04 receives in `PrivilegedActorContext.actorId` (once provisioned).
2. `correlationId` behavior remains according to the **existing frozen contract** (`correlationId?` on privileged context; reuse across the run when present per Impl Planning substance). This ratification does **not** silently make `correlationId` mandatory.
3. **actorKind recording** (C1 vs C2) remains a **separate** governance question and does **not** affect this P-D-02 provenance **model** selection.
4. **P-D-03 / NB-01** event-type decision remains **untouched**.

---

## 6. Governance Consequences

### Because exact `actorId` is **not** established

| Item                           | Status                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Provenance **model**           | OPT-PD02-02 **selected**                                                                                    |
| **P-D-02**                     | **BLOCKED** — pending exact canonical SYSTEM_JOB identity provisioning (Q5)                                 |
| Actor provenance prerequisite  | **Not unblocked** for Implementation Authorization                                                          |
| D Implementation Planning      | May later reference the **selected model**, but **must not** invent or hard-code an unprovisioned `actorId` |
| D Implementation Authorization | **NOT granted** by this artifact                                                                            |
| P-D-03                         | Remains separate / untouched                                                                                |

**Exact missing action to satisfy P-D-02:**

```text
GOVERNANCE/OPS MUST EXPLICITLY PROVISION:
  - exact canonical SYSTEM_JOB actorId string for FIV-CONN-04-D
  - owning role / change-control owner
THEN record that value in a follow-on P-D-02 satisfaction disposition.
UNTIL THEN: P-D-02 remains BLOCKED.
```

### What this artifact does **not** claim

- Does **not** mark P-D-02 SATISFIED.
- Does **not** implement or register a SYSTEM_JOB identity in code.
- Does **not** amend Decision Freeze COND-D-03 with a named job id (optional future action after provisioning).

---

## 7. Scope Fence

```text
P-D-01 remains DELIVERED.
P-D-02 provenance MODEL = OPT-PD02-02 (selected).
P-D-02 satisfaction = BLOCKED (canonical actorId not provisioned).
P-D-03 remains untouched.
D implementation remains NOT STARTED.
D implementation authorization remains NOT GRANTED.
No production code changed.
No PrivilegedActorContext / B-04 / Security Audit / schema changes.
Prior P-D-02 disposition, resolution-analysis, and decision-package artifacts untouched.
NO COMMIT / NO PUSH.
```

**Decision answers summary**

| Q   | Answer                                               |
| --- | ---------------------------------------------------- |
| Q1  | OPT-PD02-02                                          |
| Q2  | YES                                                  |
| Q3  | NOT APPLICABLE                                       |
| Q4  | YES (new identity authorized in principle)           |
| Q5  | **NOT ESTABLISHED — no string recorded**             |
| Q6  | NOT REQUIRED (unless later provisioned via registry) |
| Q7  | Existing frozen/optional contract retained           |

**END OF P-D-02 RATIFICATION (historical body through 2026-09-18)**

---

## Appendix A — Dated supersession (2026-10-30) — Q5 policy ratification

**Authority:** Product Owner  
**Permanent record:** [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md)  
**Nature:** Append-only governance update. Does **not** rewrite the historical 2026-09-18 body above. Does **not** implement identity. Does **not** mark P-D-02 SATISFIED. Does **not** authorize D implementation.

| Item                           | Historical (2026-09-18) | Superseding status (2026-10-30)                                                                  |
| ------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------ |
| OPT-PD02-02 model              | Selected                | **Unchanged**                                                                                    |
| Q5 exact canonical `actorId`   | NOT ESTABLISHED         | **APPROVED POLICY:** `system-job:fiv-conn-04-migration-backfill`                                 |
| Q5 owner                       | NOT ESTABLISHED         | **APPROVED POLICY:** Product Owner (product); Connections / D components (application technical) |
| SoT                            | Not established         | **APPROVED POLICY:** PO ratification record (linked)                                             |
| G1–G7                          | Not addressed here      | **RESOLVED** in PO ratification                                                                  |
| Identity definition in code    | Absent                  | **IMPLEMENTATION PENDING**                                                                       |
| Trusted binding in code        | Absent                  | **IMPLEMENTATION PENDING**                                                                       |
| P-D-02 satisfaction            | BLOCKED                 | **Remains BLOCKED** (policy approved; implementation evidence incomplete)                        |
| D Implementation Authorization | NOT granted             | **NOT AUTHORIZED**                                                                               |

```text
Q5 GOVERNANCE POLICY: ESTABLISHED (2026-10-30)
CANONICAL actorId: system-job:fiv-conn-04-migration-backfill
P-D-02: BLOCKED
D IMPLEMENTATION: NOT AUTHORIZED
```
