# FIV-CONN-04-D — G1–G7 Governance Decision Request Package

**Document:** FIV-CONN-04-D — Request for SYSTEM_JOB Identity Governance Decisions (G1–G7)  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Related prerequisite:** P-D-02 (privileged `actorId` provenance) under ratified model **OPT-PD02-02**  
**Authority:** Governance Decision **Request** only  
**Nature:** Historical **request** for G1–G7 decisions. The historical body below requested decisions and did not make them. **G1–G7 are RESOLVED (2026-10-30)** by Product Owner ratification — see Appendix R. This document does **not** reopen OPT-PD02-02. Does **not** dispose P-D-03. Does **not** grant D Implementation Authorization. Does **not** implement D.

```text
HISTORICAL NATURE: REQUEST ONLY (body below).
G1–G7 STATUS (2026-10-30): RESOLVED — see Appendix R / PO ratification.
NO EXTERNAL GOVERNANCE AUTHORITY REMAINS A PREREQUISITE FOR G1–G7.
P-D-02 REMAINS BLOCKED (implementation evidence incomplete).
D IMPLEMENTATION: NOT AUTHORIZED.
```

---

## 1. Purpose

This document requests the governance decisions required to satisfy **P-D-02**.

It does **not** make those decisions.

It is intended to be handed to the future governance authority once such authority exists (or is established by a prior governance act). Until G1–G7 are answered and the required deliverables recorded, engineering must not create, hardcode, or invent a canonical SYSTEM_JOB identity for FIV-CONN-04-D.

---

## 2. Current State

| Item             | Status      |
| ---------------- | ----------- |
| P-D-01           | DELIVERED   |
| P-D-02           | BLOCKED     |
| OPT-PD02-02      | RATIFIED    |
| D Implementation | NOT STARTED |
| D Authorization  | NOT GRANTED |

**Preserved (not reopened by this request):**

| Item                           | Status                                                                 |
| ------------------------------ | ---------------------------------------------------------------------- |
| Provenance model               | **OPT-PD02-02** — SYSTEM_JOB via newly ratified canonical job identity |
| P-D-03                         | **UNTOUCHED**                                                          |
| Canonical SYSTEM_JOB `actorId` | **NOT PROVISIONED**                                                    |
| Live trading / real capital    | **NOT AUTHORIZED** by this document                                    |

---

## 3. Why This Is Blocked

From established repository evidence (disposition, identity-authority discovery, provisioning spec, autonomous-model discovery, evidence review, and governance escalation):

The repository does **not** establish:

- provisioning authority for canonical SYSTEM_JOB identities
- provisioning process
- canonical SYSTEM_JOB `actorId`
- owner
- authoritative SoT

Therefore engineering cannot legally create or hardcode an identity.

Additional established constraints that remain binding:

- OPT-PD02-02 is already ratified; exact identity string + owner (Q5) remain incomplete.
- Hybrid trading autonomy language (“autonomous trading worker”) is **not** a CONN-04 migration SYSTEM_JOB identity.
- Domain-local strings (for example `execution-engine`, `system:startup-recovery`), lease purpose, gate key, correlation IDs, bot/session IDs, user IDs, and test fixtures are **not** authoritative CONN-04 SYSTEM_JOB provenance.
- B-04 / `PrivilegedActorContext` establish kind and plumbing only; they do not mint identity.

**Blocker class:** GOVERNANCE / PROCESS GAP (external to ordinary engineering implementation).

---

## 4. Decisions Requested

The following seven decisions are **requested**. Values are intentionally blank. Status of each is **UNRESOLVED**.

### G1 — Authority

**Request:** Identify the role/team/person authorized to provision and/or ratify canonical SYSTEM_JOB identities.

**Status:** UNRESOLVED.

Do not suggest candidates in this artifact.

---

### G2 — Provisioning Process

**Request:** Specify the controlled process used to create and approve canonical SYSTEM_JOB identities.

**Status:** UNRESOLVED.

---

### G3 — Authoritative Source of Truth

**Request:** Specify where the canonical identity is officially recorded.

**Status:** UNRESOLVED.

---

### G4 — Naming Convention

**Request:** Specify the naming convention for SYSTEM_JOB identities.

**Status:** UNRESOLVED.

---

### G5 — Ownership

**Request:** Specify the accountable lifecycle owner.

**Status:** UNRESOLVED.

---

### G6 — Trusted Boundary Binding

**Request:** Specify how the trusted D execution boundary obtains the canonical `actorId` without allowing client control.

**Status:** UNRESOLVED.

---

### G7 — Governance Record

**Request:** Specify which governance artifact becomes the permanent authoritative record.

**Status:** UNRESOLVED.

---

## 5. Required Deliverables From Governance

Governance must eventually provide **all** of the following. This checklist does **not** supply values.

- [ ] Authority (resolved G1)
- [ ] Process (resolved G2)
- [ ] Exact canonical `actorId` (character-for-character)
- [ ] Owner (resolved G5)
- [ ] Provenance
- [ ] SoT (resolved G3)
- [ ] Naming convention (resolved G4)
- [ ] Trusted-boundary binding (resolved G6)
- [ ] Permanent governance record (resolved G7)

Until every item above is explicitly recorded by competent governance authority, P-D-02 remains **BLOCKED**.

---

## 6. Existing Evidence

Prior completed artifacts (read-only references; contents not duplicated here):

| Artifact                                           | Path                                                                                                                               |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| P-D-02 disposition                                 | [`v3-l02-fiv-conn-04-d-pd02-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-disposition.md)                                           |
| P-D-02 resolution analysis                         | [`v3-l02-fiv-conn-04-d-pd02-resolution-analysis.md`](./v3-l02-fiv-conn-04-d-pd02-resolution-analysis.md)                           |
| P-D-02 governance decision package                 | [`v3-l02-fiv-conn-04-d-pd02-governance-decision-package.md`](./v3-l02-fiv-conn-04-d-pd02-governance-decision-package.md)           |
| P-D-02 ratification (OPT-PD02-02)                  | [`v3-l02-fiv-conn-04-d-pd02-ratification.md`](./v3-l02-fiv-conn-04-d-pd02-ratification.md)                                         |
| Identity provisioning spec                         | [`v3-l02-fiv-conn-04-d-pd02-identity-provisioning-spec.md`](./v3-l02-fiv-conn-04-d-pd02-identity-provisioning-spec.md)             |
| Identity authority discovery                       | [`v3-l02-fiv-conn-04-d-pd02-identity-authority-discovery.md`](./v3-l02-fiv-conn-04-d-pd02-identity-authority-discovery.md)         |
| Governance escalation                              | [`v3-l02-fiv-conn-04-d-pd02-governance-escalation.md`](./v3-l02-fiv-conn-04-d-pd02-governance-escalation.md)                       |
| Autonomous model discovery                         | [`v3-l02-fiv-conn-04-d-pd02-autonomous-model-discovery.md`](./v3-l02-fiv-conn-04-d-pd02-autonomous-model-discovery.md)             |
| Autonomous model evidence review                   | [`v3-l02-fiv-conn-04-d-pd02-autonomous-model-evidence-review.md`](./v3-l02-fiv-conn-04-d-pd02-autonomous-model-evidence-review.md) |
| D Implementation Planning Review (P-D-02 blocking) | [`v3-l02-fiv-conn-04-d-implementation-planning-review.md`](./v3-l02-fiv-conn-04-d-implementation-planning-review.md)               |

---

## 7. Non-Goals

This document does **not**:

- provision an identity
- authorize implementation
- authorize migration
- authorize D
- reopen governance decisions (including OPT-PD02-02)
- modify architecture
- dispose P-D-03
- invent answers to G1–G7
- assign a resolution owner by inference

---

## 8. Resolution Condition

P-D-02 may become **SATISFIED** only after **all** of the following exist in an explicit governance record:

1. Governance answers **G1–G7**.
2. Exact canonical SYSTEM_JOB **`actorId`** (character-for-character).
3. Accountable **owner**.
4. Explicit **provenance**.
5. **Trusted-boundary binding** that obtains the canonical `actorId` without client control.
6. **Authoritative record** naming the permanent SoT / governance artifact.

Only after P-D-02 is SATISFIED (and remaining authorization prerequisites such as P-D-03 are separately disposed) may the project proceed toward **D Implementation Authorization**. This request package alone does **not** grant that authorization.

---

## 9. Final Status

```text
P-D-02 = BLOCKED
BLOCKER CLASS (historical at request time):
GOVERNANCE / PROCESS GAP
SYSTEM_JOB (historical at request time):
NOT PROVISIONED
D IMPLEMENTATION:
NOT STARTED
NEXT GOVERNANCE GATE (historical):
G1–G7 DECISIONS
```

**END OF G1–G7 GOVERNANCE DECISION REQUEST PACKAGE (historical body)**

---

## Appendix R — G1–G7 resolution (2026-10-30)

**Authority:** Product Owner  
**Permanent record:** [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md)  
**Nature:** Append-only. Does **not** rewrite the historical request body. Does **not** invent answers outside the PO ratification. Does **not** mark P-D-02 SATISFIED. Does **not** authorize D.

| ID  | Status                | Resolution (summary)                                                                                                                         |
| --- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | **RESOLVED**          | Product Owner is decision authority for product/architecture identity policy                                                                 |
| G2  | **RESOLVED**          | PO approval → governance ratification → separately authorized implementation → verification → formal P-D-02 satisfaction disposition         |
| G3  | **RESOLVED**          | Ratified governance record with exact canonical `actorId` (PO ratification)                                                                  |
| G4  | **RESOLVED**          | `system-job:<capability>`; lowercase, stable, capability-scoped                                                                              |
| G5  | **RESOLVED**          | Product Owner (product); Connections / D identity-definition and orchestration (application technical)                                       |
| G6  | **RESOLVED** (policy) | Trusted internal D orchestrator constructs SYSTEM_JOB context; no external actor fields; restricted B-04 access — **IMPLEMENTATION PENDING** |
| G7  | **RESOLVED**          | PO ratification record linked from P-D-02 disposition and architecture decision package                                                      |

| Related deliverable                                  | Value / status                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| Exact canonical `actorId`                            | `system-job:fiv-conn-04-migration-backfill` (**APPROVED POLICY**) |
| Identity definition in code                          | **IMPLEMENTATION PENDING**                                        |
| P-D-02                                               | **BLOCKED**                                                       |
| External governance authority prerequisite for G1–G7 | **NONE remaining**                                                |
| D Implementation Authorization                       | **NOT AUTHORIZED**                                                |

```text
G1–G7 = RESOLVED (POLICY)
NEXT GATE: SEPARATELY AUTHORIZED IMPLEMENTATION + VERIFICATION + P-D-02 SATISFACTION DISPOSITION
P-D-02 = BLOCKED
D IMPLEMENTATION = NOT AUTHORIZED
```
