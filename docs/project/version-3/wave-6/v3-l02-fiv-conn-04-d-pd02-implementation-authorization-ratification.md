# FIV-CONN-04-D — P-D-02 Implementation Authorization Ratification

**Document:** Product Owner Implementation Authorization grant for the P-D-02 SYSTEM_JOB identity-boundary slice  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Decision ID:** D-CONN04-PD02-IA  
**Authority:** Product Owner  
**Nature:** **GOVERNANCE IMPLEMENTATION AUTHORIZATION ONLY.** Records the explicit PO **APPROVE** decision. Does **not** implement P-D-02. Does **not** create identity constants, factories, providers, or module changes. Does **not** authorize full FIV-CONN-04-D. Does **not** mark P-D-02 SATISFIED.

**Governance chain:**

```text
PO SYSTEM_JOB policy ratification (D-CONN04-PD02-SJ)
  → Architecture decision package / discovery
  → P-D-02 implementation planning (+ §16 clarifications)
  → Final independent planning review (PASS WITH CONDITIONS)
  → Implementation Authorization Decision Package
  → Implementation Authorization Ratification   ← THIS ARTIFACT
  → Separate implementation task (NOT THIS ACT)
  → PIR → P-D-02 satisfaction disposition
```

**Basis artifacts:**

| Artifact                       | Path                                                                                                                               | Role                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| PO identity policy             | [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md) | Policy SoT                |
| Authorization decision package | [`v3-l02-fiv-conn-04-d-pd02-implementation-authorization.md`](./v3-l02-fiv-conn-04-d-pd02-implementation-authorization.md)         | Scope + §17 decision      |
| P-D-02 implementation planning | [`v3-l02-fiv-conn-04-d-pd02-implementation-planning.md`](./v3-l02-fiv-conn-04-d-pd02-implementation-planning.md)                   | Plan; **§16 controlling** |
| Final planning review          | [`v3-l02-fiv-conn-04-d-final-implementation-planning-review.md`](./v3-l02-fiv-conn-04-d-final-implementation-planning-review.md)   | PASS WITH CONDITIONS      |

```text
PRODUCT OWNER DECISION: APPROVE P-D-02 IMPLEMENTATION
DECISION DATE: 2026-10-30
AUTHORITY: Product Owner
SCOPE: P-D-02 identity-boundary implementation only

P-D-02 POLICY: APPROVED (unchanged; D-CONN04-PD02-SJ)
P-D-02 IMPLEMENTATION AUTHORIZATION: APPROVED WITH CONDITIONS
P-D-02 IMPLEMENTATION: AUTHORIZED, NOT STARTED
P-D-02 IMPLEMENTATION STATUS: NOT STARTED
P-D-02 SATISFACTION: BLOCKED (pending impl + PIR + disposition)
FIV-CONN-04-D FULL IMPLEMENTATION: NOT AUTHORIZED
FULL D BACKFILL: NOT AUTHORIZED
PRODUCTION ACTIVATION: NOT AUTHORIZED
```

---

## 1. Authoritative decision

**D-CONN04-PD02-IA = GRANTED (APPROVED WITH CONDITIONS).**

Product Owner authorizes engineering to implement the **P-D-02 identity-boundary slice only**, under the exact scope of the Implementation Authorization Decision Package (§§5–13) and the binding conditions below.

This act follows the established CONN-04 pattern of a dedicated Implementation Authorization grant artifact (cf. FIV-CONN-04-C Implementation Authorization) after planning review PASS WITH CONDITIONS.

---

## 2. Authorized scope (exclusive)

1. Canonical identity mirror: `actorKind = SYSTEM_JOB`; `actorId = system-job:fiv-conn-04-migration-backfill`.
2. Capability-specific **module-private** identity factory.
3. `Conn04SystemJobMigrationEntry` (or approved naming equivalent `FivConn04DSystemJobMigrationEntry`) as **Option A** trusted D orchestration boundary for SYSTEM_JOB ↔ B-04.
4. Internal construction of the canonical identity; no caller-supplied `actorId` / `actorKind` / raw `PrivilegedActorContext`.
5. NestJS `ConnectionsModule` must **not** export: `Conn04MigrationBoundaryService`, `MIGRATION_GATE_PORT`, `MIGRATION_GATE_DURABLE_AUTHORITY`; Entry and factory remain unexported.
6. Preserve in-module `ConnectionsService` observe behavior; OPERATOR compatibility; B-04 lease/audit behavior.
7. Required security, audit, lease, compatibility, and regression tests, including the three separate negative export assertions.

**Controlling plan rule:** §16 of [`v3-l02-fiv-conn-04-d-pd02-implementation-planning.md`](./v3-l02-fiv-conn-04-d-pd02-implementation-planning.md) controls over conflicting earlier wording in that document. Do **not** use full-D `v3-l02-fiv-conn-04-d-implementation-planning.md` §16 as the P-D-02 controller.

---

## 3. Binding conditions

| ID              | Binding content                                                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CONDITION-1** | §16 of the **P-D-02** implementation planning document controls over earlier conflicting sections in that same file                                                                     |
| **CONDITION-2** | Tests must **separately** assert absence from `ConnectionsModule` exports of (1) `Conn04MigrationBoundaryService`, (2) `MIGRATION_GATE_PORT`, (3) `MIGRATION_GATE_DURABLE_AUTHORITY`    |
| **CONDITION-3** | Mandatory operational enable-guard is **not** part of this authorization; if one becomes necessary, **stop** for a separate PO decision. R4 allowlist remains optional defense-in-depth |

---

## 4. Explicit exclusions (unchanged)

This approval does **NOT** authorize:

- Full FIV-CONN-04-D implementation
- Any `Connection.environment` UPDATE or backfill execution
- Vault classification / reclassification
- Strategy B changes
- P-D-03
- Public HTTP endpoints or UI
- Trading Runtime changes
- Cron or scheduler activation
- General service-account registry
- Generic run-as-any-actor API
- Prisma schema or migration changes
- Production activation of full D

---

## 5. What this act does not do

```text
NO SOURCE CODE CHANGED
NO TESTS CHANGED
NO IDENTITY CONSTANT OR FACTORY CREATED
NO MODULE EXPORTS CHANGED
NO IMPLEMENTATION STARTED
P-D-02 NOT MARKED SATISFIED OR CLOSED
FULL FIV-CONN-04-D NOT AUTHORIZED
```

---

## 6. Next gate

```text
NEXT = SEPARATE IMPLEMENTATION TASK (PO / engineering), THEN PIR, THEN P-D-02 SATISFACTION DISPOSITION
DO NOT BEGIN IMPLEMENTATION FROM THIS GOVERNANCE RECORDING ALONE
```

---

## 7. Post-satisfaction forward reference (2026-10-30) — append-only

This IA ratification remains the **historical grant** of P-D-02 implementation authorization (**GRANTED / APPROVED WITH CONDITIONS** as of 2026-10-30). Subsequent delivery, PIR (**PASS WITH MINOR FINDINGS**), and formal satisfaction are recorded in:

[`v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md`](./v3-l02-fiv-conn-04-d-pd02-formal-satisfaction-disposition.md) — **D-CONN04-PD02-SAT** — **P-D-02 = SATISFIED**.

Sections 1–6 above are **not** rewritten. Status lines that say “AUTHORIZED, NOT STARTED” / “SATISFACTION: BLOCKED” describe the state **at the time of this IA grant**, not the post-SAT current state.

```text
D-CONN04-PD02-IA = GRANTED WITH CONDITIONS (unchanged historical grant)
D-CONN04-PD02-SAT = SATISFIED (separate disposition)
FIV-CONN-04-D FULL IMPLEMENTATION = NOT AUTHORIZED
```

**END OF P-D-02 IMPLEMENTATION AUTHORIZATION RATIFICATION**
