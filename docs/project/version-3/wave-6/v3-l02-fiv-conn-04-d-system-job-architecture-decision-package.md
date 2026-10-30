# FIV-CONN-04-D — SYSTEM_JOB Architecture Decision Package

**Document:** Architecture decision package for canonical `SYSTEM_JOB` identity (OPT-PD02-02)  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Primary evidence:** [`v3-l02-fiv-conn-04-d-system-job-architecture-discovery.md`](./v3-l02-fiv-conn-04-d-system-job-architecture-discovery.md)  
**Repository `HEAD` at package preparation:** `953292675e197d4f25778aaaa59eacb2826560fe`  
**Nature:** Architecture decision package. Historical body prepared recommendations for PO review. **Product Owner policy approval recorded 2026-10-30** in [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md). Does **not** implement D. Does **not** create a backend constant. Does **not** mark P-D-02 SATISFIED. Does **not** authorize FIV-CONN-04-D implementation.

```text
OPT-PD02-02 — SYSTEM_JOB: RATIFIED (model; unchanged)
Canonical SYSTEM_JOB actorId: APPROVED POLICY — system-job:fiv-conn-04-migration-backfill
Provisioning + trusted-binding POLICY: APPROVED
Identity definition / trusted binding IN CODE: IMPLEMENTATION PENDING
P-D-02: REMAINS BLOCKED
FIV-CONN-04-D implementation: NOT AUTHORIZED
```

Labels used: **CONFIRMED** | **INFERRED** | **PROPOSED** | **NOT APPROVED** | **APPROVED POLICY** | **IMPLEMENTATION PENDING** | **UNKNOWN**.

> **Reader note:** Sections below retain historical “PROPOSED / NOT APPROVED” wording as the decision-preparation record. **Appendix R (2026-10-30)** is authoritative for approval status.

---

## 1. Executive summary

**PROPOSED architecture (for PO approval):** Adopt the discovery recommendation of **Option B + Option C** — a dedicated CONN-04 migration principal represented as `PrivilegedActorContext` with `actorKind = 'SYSTEM_JOB'`, defined by a **single stable canonical `actorId`**, with **identity definition** owned as a backend-controlled constant mirroring a governance SoT, and **execution-context construction** allowed **only** inside a trusted non-public D entry that refuses client-, job-, and HTTP-supplied actor fields.

**CONFIRMED binding facts preserved:** OPT-PD02-02 ratified; B-04 is caller-supplied and shape-validated only (no cryptographic SYSTEM_JOB authn); Security Audit requires `attribution.actorId` and does not persist `actorKind` on attribution; domain-local and Trading Runtime identities are non-candidates; P-D-02 remains BLOCKED; D remains NOT AUTHORIZED.

**Critical security finding (CONFIRMED):** `ConnectionsModule` **exports** `Conn04MigrationBoundaryService`. Non-public HTTP alone is **not** sufficient: any Nest module that imports Connections can inject B-04 and pass an arbitrary privileged context. The decision package therefore requires an explicit construction and call-path restriction beyond “unexposed endpoint.”

**This package does not satisfy P-D-02.** Approval of decisions, then separately authorized implementation evidence, remain required milestones (§14).

---

## 2. Verified repository evidence

Discovery claims were re-checked against current source. Unverified items are marked.

| Claim                                                                         | Verification                                                                                                | Label                                                                     |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `PrivilegedActorKind` / `PrivilegedActorContext`                              | `migration-gate.ts` L86–93                                                                                  | CONFIRMED                                                                 |
| Shape-only validation (non-empty `actorId`, kind ∈ {SYSTEM_JOB, OPERATOR})    | `isPrivilegedActorContext` ~L579–586                                                                        | CONFIRMED                                                                 |
| B-04 caller-supplied actor; refuses non-privileged shape                      | `conn04-migration-boundary.service.ts` L73–90                                                               | CONFIRMED                                                                 |
| B-04 documents no public HTTP / no env update                                 | Same file header L1–7                                                                                       | CONFIRMED                                                                 |
| B-04 exported from ConnectionsModule                                          | `connections.module.ts` L44–48                                                                              | CONFIRMED (strengthens impersonation risk vs “hidden service” assumption) |
| Lease stores `holderId`, `actorKind`                                          | `schema.prisma` `ConnectionMigrationGateLease`; adapter acquire path                                        | CONFIRMED                                                                 |
| Audit attribution has optional `actorId`, no `actorKind`                      | `security-audit-record.ts` L6–13                                                                            | CONFIRMED                                                                 |
| `connection.migration-gate` requires `actorId`                                | `security-audit-attribution.ts` L51–54                                                                      | CONFIRMED                                                                 |
| Migration-gate safe payload keys omit `actorKind`                             | `MIGRATION_GATE_AUDIT_SAFE_PAYLOAD_KEYS` in `migration-gate.ts`                                             | CONFIRMED                                                                 |
| HTTP Connections actor = JWT `userId`                                         | `connections.controller.ts`                                                                                 | CONFIRMED                                                                 |
| Domain-local / runtime strings exist and are distinct                         | `execution-engine.service.ts`, `startup-recovery-discovery.service.ts`, `trading-session-runtime.worker.ts` | CONFIRMED                                                                 |
| Jobs module has no privileged actor                                           | `job.ts`, `background-job.runner.ts`                                                                        | CONFIRMED                                                                 |
| OPT-PD02-02 + security binding rules                                          | `v3-l02-fiv-conn-04-d-pd02-ratification.md` §1, §4                                                          | CONFIRMED                                                                 |
| G1–G7 unresolved                                                              | `v3-l02-fiv-conn-04-d-g1-g7-governance-decision-request.md` §4                                              | CONFIRMED                                                                 |
| COND-D-03 contract ratified; ops mapping unresolved                           | Decision Freeze COND-D-03                                                                                   | CONFIRMED                                                                 |
| D runner: privileged Nest; not public HTTP; not automatically authorized cron | Impl Planning / disposition / review (PROPOSED/accepted as planning constraint)                             | CONFIRMED as planning constraint                                          |
| Production CONN-04 SYSTEM_JOB literal                                         | Specs only; no production constructor                                                                       | CONFIRMED                                                                 |
| Cryptographic SYSTEM_JOB caller authn                                         | Not present on B-04 / gate                                                                                  | CONFIRMED (absence)                                                       |
| Exact future Nest class name for D orchestrator                               | Not present in production                                                                                   | UNKNOWN (design placeholder only)                                         |

No discovery claim material to this package was found contradicted. The export of B-04 is an additional risk detail relative to “non-HTTP” alone.

---

## 3. Proposed architecture

**PROPOSED (NOT APPROVED):** Combine:

| Layer                   | Decision                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| Representation          | Existing `PrivilegedActorContext` with `actorKind: 'SYSTEM_JOB'`                                        |
| Identity value          | One stable canonical `actorId` for FIV-CONN-04 migration backfill                                       |
| Identity storage / SoT  | Governance record is authoritative; application mirrors via backend-controlled constant (fail-closed)   |
| Execution authorization | Only a trusted D entry may construct the privileged context and invoke B-04 for D                       |
| Audit                   | Same `actorId` on B-04 and Security Audit; `actorKind` handling per §9                                  |
| Ops                     | Explicit D invocation; not auto-cron; duplicate protection via existing migration-gate lease contention |

This is discovery **Option B (dedicated SYSTEM_JOB in PrivilegedActorContext) + Option C (trusted backend binding)**, refined with SoT Option A (static definition) and execution Option D (dedicated internal principal construction). Naming of storage options in §12 is independent of discovery’s Option letters.

---

## 4. Identity model

### 4.1 Recommendation

**PROPOSED:** Treat SYSTEM_JOB as a **typed privileged execution context** — specifically a `PrivilegedActorContext` instance with `actorKind = 'SYSTEM_JOB'` and a ratified `actorId` — **not** as an Identity `User`, JWT subject, Campaign/Replay job, or Trading Runtime worker.

| Aspect                                   | Specification                                                                                                                                                          | Label                                    |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `actorKind`                              | Must be `'SYSTEM_JOB'` for OPT-PD02-02 single-mode D                                                                                                                   | CONFIRMED (model) / PROPOSED (D binding) |
| Relationship to `PrivilegedActorContext` | SYSTEM_JOB **is** that type with fixed kind; no parallel type invented                                                                                                 | PROPOSED                                 |
| Distinct principal vs typed context      | **Typed privileged context carrying a distinct principal string** (`actorId`). The string is the principal identity; the type supplies kind + optional `correlationId` | PROPOSED                                 |
| Separation from humans                   | No Identity user / session required for SYSTEM_JOB                                                                                                                     | PROPOSED                                 |
| Separation from generic workers          | Jobs module is not the principal                                                                                                                                       | CONFIRMED / PROPOSED                     |
| Separation from Trading Runtime          | `trading-session-runtime-worker` remains unrelated                                                                                                                     | CONFIRMED / PROPOSED                     |

### 4.2 Consequences

**INFERRED:**

- B-04 / gate contracts need **no kind-enum change**.
- Trust moves to **who may construct** the context and **which `actorId` is allowed**, not to Passport.
- Audit continues to key investigations primarily by `actorId` string.
- OPERATOR reclaim path stays separate (`actorKind === 'OPERATOR'` already enforced on reclaim).

---

## 5. Canonical actorId strategy

### 5.1 Strategy (PROPOSED — NOT APPROVED)

| Property                       | Recommendation                                                                                                                                                                            | Label         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Stable vs generated            | **Stable** literal for the product lifetime of CONN-04 migration backfill; not per-run UUID                                                                                               | PROPOSED      |
| Scope                          | **Operation-family scoped** to FIV-CONN-04 migration environment backfill (module Connections / CONN-04), not application-wide catch-all “system”                                         | PROPOSED      |
| Naming convention              | Lowercase, colon-namespaced machine id: `system-job:<capability>` where capability names the migration backfill family; must not equal gate key, lease purpose, or trading/domain strings | PROPOSED (G4) |
| Uniqueness                     | Globally unique among privileged CONN-04 holders and audit actors for this purpose; collision with domain-local strings forbidden                                                         | PROPOSED      |
| Multiple SYSTEM_JOB identities | **Not permitted for D** under this package — single canonical identity for OPT-PD02-02. Additional SYSTEM_JOB strings for other future capabilities require separate PO decisions         | PROPOSED      |
| Identity change governance     | Change = new PO ratification + SoT update + coordinated deploy of mirrored constant; treat as rotation/revocation event (§10)                                                             | PROPOSED      |

### 5.2 Candidate literal (explicitly NOT APPROVED)

| Field                             | Value                                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Candidate                         | `system-job:fiv-conn-04-migration-backfill`                                                                                                                              |
| Status                            | **PROPOSED — NOT APPROVED**                                                                                                                                              |
| Rationale                         | Readable, CONN-04-scoped, distinct from `FIV-CONN-04`, `FIV_CONN_04_MIGRATION_BACKFILL`, `execution-engine`, `system:startup-recovery`, `trading-session-runtime-worker` |
| Forbidden as approval by this doc | Must not be hardcoded in production until PO approval + P-D-02 satisfaction path                                                                                         |

Alternate candidates (also **NOT APPROVED**): PO may choose any string meeting §5.1; discovery forbids treating purpose/gate/fixtures as actor.

---

## 6. Source of truth

### 6.1 Recommendation

**PROPOSED — exactly one authoritative SoT:** a **Product Owner–ratified governance record** that states the exact `actorId` character-for-character (G3/G7).

**PROPOSED — application mirror (non-authoritative copy):** a **backend-controlled constant** (or equivalently a compile-time identity definition module) in the Connections / future D area that is set to that exact string after approval.

| Candidate SoT                         | Prefer?               | Why                                                                                                                                                  |
| ------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Governance record + mirrored constant | **Yes**               | Matches “no parallel IdM”; deploy-reproducible; auditable change control; consistent with domain-local constant pattern without reusing those values | PROPOSED                                |
| Environment configuration as SoT      | **No** as primary SoT | Drift, empty-config, and override risk; may be a _deployment binding_ only if value is pinned to ratified string and fail-closed                     | INFERRED                                |
| Database registry                     | **No**                | No evidence of need; creates parallel identity infrastructure                                                                                        | CONFIRMED (absence) / PROPOSED (reject) |
| Identity `User` table                 | **No**                | Human auth model; conflicts with OPT-PD02-02 intent                                                                                                  | INFERRED                                |

**CONFIRMED:** Creating a new identity registry is **not** necessary on current evidence.

---

## 7. Provisioning model

Distinguish:

| Concept                        | Meaning                                                             | Label    |
| ------------------------------ | ------------------------------------------------------------------- | -------- |
| **Identity definition**        | Ratified string + mirrored constant exists in governance + codebase | PROPOSED |
| **Execution context creation** | Runtime construction of `PrivilegedActorContext` at trusted D entry | PROPOSED |

| Topic                               | Specification                                                                                                                                | Label    |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| When available                      | After PO approval of exact string **and** authorized merge of mirrored definition; not before                                                | PROPOSED |
| Backend component owning definition | Connections / future D module identity definition (application-owned constant). **Does not invent human org role**                           | PROPOSED |
| Mode                                | **Static / deployment-based** (definition ships with release). Not DB-backed. Not per-request minting                                        | PROPOSED |
| Startup                             | Optional assert-on-boot that constant is non-empty and matches expected pattern; must **fail closed** if invalid when D is enabled           | PROPOSED |
| Idempotency                         | Definition is immutable per release; constructing context is pure/idempotent relative to the constant                                        | PROPOSED |
| Failure                             | Missing/blank/mismatched id → refuse D start (no B-04 acquire)                                                                               | PROPOSED |
| Verification                        | Unit/conformance: constant equals governance fixture; D entry only emits that id; controller still has no B-04                               | PROPOSED |
| Reversible?                         | Definition reversible only via governed rotation (new string + deploy). Execution revoked by disabling D entry / refusing construction (§10) | PROPOSED |

---

## 8. Trusted execution boundary

### 8.1 Requirement (binding intent)

**CONFIRMED (ratification):** `actorId` cannot be client-controlled or inferred from arbitrary request input; must be bound at trusted invocation boundary; no public B-04; no public Connections env PATCH as grant authority.

**CONFIRMED (planning):** Privileged Nest orchestrator; not public HTTP; not automatically authorized cron.

### 8.2 Threat: export + caller-supplied actor

**CONFIRMED:** Any importer of `ConnectionsModule` can inject `Conn04MigrationBoundaryService` and call `start({ actor })` with arbitrary `actorId`/`actorKind` that pass shape checks.

**INFERRED:** “Method not on HTTP controller” is necessary but **insufficient**.

### 8.3 Enforcement mechanisms compared (current architecture)

| Mechanism                                                                                 | Impersonation resistance   | Fit to codebase                     | Complexity | Label                   |
| ----------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------- | ---------- | ----------------------- |
| M1. Keep B-04 off Controllers only                                                        | Weak alone (export exists) | Already true for HTTP               | Low        | CONFIRMED / INFERRED    |
| M2. Trusted D entry constructs context from constant; never accepts external actor fields | Strong for D path          | Matches Nest service pattern        | Low–med    | PROPOSED                |
| M3. D entry allowlists exact ratified `actorId` + forces `actorKind: 'SYSTEM_JOB'`        | Strong                     | Local check                         | Low        | PROPOSED                |
| M4. Stop exporting B-04 / export only a narrower D façade                                 | Reduces arbitrary callers  | Module API change later             | Med        | PROPOSED                |
| M5. B-04 internal allowlist of SYSTEM_JOB ids                                             | Defense in depth           | Touches shared B-04                 | Med        | PROPOSED (optional)     |
| M6. Cryptographic mTLS / service tokens for SYSTEM_JOB                                    | Strongest authn            | **No existing pattern** for this    | High       | INFERRED — not smallest |
| M7. Trust job payload actor fields                                                        | Unsafe                     | Jobs have no privileged actor today | N/A        | CONFIRMED reject        |

### 8.4 Smallest robust solution (PROPOSED — NOT APPROVED)

**Combine M2 + M3 + M4 (preferred) with M1 retained; M5 optional defense in depth; reject M6 for v1 unless PO requires; reject M7.**

Concrete rules:

1. **Public HTTP/API exclusion** — No Connections/D controller endpoint accepts `actorId`, `actorKind`, or raw `PrivilegedActorContext`. **CONFIRMED** today for B-04; must remain for D.
2. **Client-controlled `actorId` / `actorKind` rejection** — D entry method signatures must not take client-supplied privileged actor; construct internally. **PROPOSED.**
3. **Job payload trust** — Campaign/Replay (and any future queue payload) must not supply privileged actor for D. **PROPOSED.**
4. **Internal module invocation** — Only the designated D orchestrator may call B-04 `start`/`resume`/`heartbeat`/`release` for migration backfill. **PROPOSED.**
5. **DI / visibility** — Prefer **not exporting** raw `Conn04MigrationBoundaryService` to the whole app once D exists; export a D-owned façade or keep B-04 module-private to Connections + D. **PROPOSED.**
6. **Prevent arbitrary construction** — No shared helper that builds SYSTEM_JOB context from string parameters supplied by callers outside D. Construction function lives with D entry and reads the constant. **PROPOSED.**
7. **Prevent privilege escalation via generic methods** — Generic ConnectionsService / HTTP paths must not gain a “run as SYSTEM_JOB” parameter. **PROPOSED.**
8. **Trusted origin** — Origin = in-process D orchestrator that (a) is not HTTP-reachable, (b) constructs context from SoT mirror, (c) allowlists exact id, (d) is the sole production caller of B-04 for D. Verification = architecture tests + call-graph/conformance. **PROPOSED.**
9. **Trusted origin is not “private method” alone** — Explicit construction policy + export/call-path restriction required. **INFERRED.**

---

## 9. Audit attribution model

### 9.1 Binding audit facts

**CONFIRMED:** `attribution.actorId` required for `connection.migration-gate`. No `actorKind` on `SecurityAuditAttribution` or Prisma `SecurityAuditRecord`. Safe migration-gate payload keys omit `actorKind`. Lease row **does** store `actorKind`.

**CONFIRMED (ratification §5):** Same canonical `actorId` for B-04 and audit; `actorKind` recording (C1/C2) is a **separate** governance question and does not block OPT-PD02-02 model selection.

### 9.2 Recommendation

| Element                               | Recommendation                                                                                                                                                                                               | Label                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `actorId`                             | **Mandatory** on D-related gate/audit events; equal to canonical SYSTEM_JOB string                                                                                                                           | PROPOSED                            |
| `actorKind` for P-D-02 satisfaction   | **Not mandatory in audit schema** to satisfy provenance model                                                                                                                                                | PROPOSED (aligns with ratification) |
| `actorKind` for investigation quality | **Optional refinement:** include `actorKind` in **sanitized audit payload** (metadata) for D/gate events **or** derive kind from trusted server-side definition when `actorId` equals the canonical constant | PROPOSED                            |
| Schema column for `actorKind`         | **Not required** for initial P-D-02 path; defer unless PO mandates queryability by kind                                                                                                                      | PROPOSED                            |
| Compatibility                         | Existing records unchanged; new events keep `actorId`                                                                                                                                                        | CONFIRMED / PROPOSED                |
| Integrity                             | Integrity hash covers payload; adding payload key later is additive if allowlisted in sanitizer                                                                                                              | INFERRED                            |
| Migration impact                      | Schema migration **avoidable** if payload/metadata path chosen                                                                                                                                               | PROPOSED                            |

**PROPOSED PO choice (see matrix D-AUD-01):**

- **Mandatory decision for ops clarity (refinement):** whether `actorKind` appears in audit payload.
- **Optional:** Prisma attribution schema extension — higher cost, better queryability.

---

## 10. Lifecycle and revocation

> Does **not** invent a human owner or external org role. Application-level ownership only.

| Topic                                        | Specification                                                                                                                                          | Label    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Operational owner **within the application** | Connections / D identity-definition module + D orchestrator (code ownership of constant and construction)                                              | PROPOSED |
| Enable                                       | D entry reachable/enabled **and** valid canonical definition present                                                                                   | PROPOSED |
| Disable                                      | Feature/guard that refuses D start without deleting historical audit rows                                                                              | PROPOSED |
| Revoke execution                             | Disable D entry; optional rotate `actorId` (new ratification) so old string is no longer constructed; active lease expires via existing TTL/contention | PROPOSED |
| Deploy / recovery                            | Identity definition is deploy artifact; process restart does not mint a new id; missing constant → fail closed                                         | PROPOSED |
| Missing / invalid identity                   | Refuse privileged context construction; no B-04 acquire; no silent fallback to domain-local strings                                                    | PROPOSED |
| Fail-closed                                  | Empty, whitespace, or non-allowlisted id → unauthorized                                                                                                | PROPOSED |

**UNKNOWN:** Exact Nest feature-flag mechanism for “D disabled” — to be chosen at implementation authorization time within existing platform patterns.

---

## 11. Operational controls

Keep D planning constraints binding.

| Control                  | Recommendation                                                                                                                                                         | Label                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Automatic SYSTEM_JOB run | **No** by default                                                                                                                                                      | PROPOSED (planning: not auto-cron)          |
| D explicitly invoked     | **Yes** — privileged Nest orchestrator invocation                                                                                                                      | PROPOSED                                    |
| Cron / scheduler         | **Not allowed** unless separate future PO decision authorizes it                                                                                                       | PROPOSED                                    |
| Duplicate execution      | Rely on migration-gate **single active lease / contention** (`GATE_CONTENTION`); D must not bypass B-04                                                                | CONFIRMED (gate) / PROPOSED (D must use it) |
| Operation scope          | Limited to FIV-CONN-04 migration environment backfill purpose + privileged environment update path under gate; no credential/vault grant widening via SYSTEM_JOB alone | CONFIRMED / PROPOSED                        |
| Audit correlation        | Optional `correlationId` per frozen contract; reuse across run when present; same `actorId` on all D/gate audits                                                       | CONFIRMED / PROPOSED                        |

---

## 12. Alternatives comparison

Storage vs authorization are separated. Options may combine.

| Option                                                        | Meaning                         | Security                                 | Impersonation resistance               | Auditability                 | Ops complexity | Deploy/recovery        | Compatibility                   | Infra risk           | Verdict                                      |
| ------------------------------------------------------------- | ------------------------------- | ---------------------------------------- | -------------------------------------- | ---------------------------- | -------------- | ---------------------- | ------------------------------- | -------------------- | -------------------------------------------- |
| **A** Static backend-controlled definition                    | Constant mirrors governance SoT | High if paired with trusted construction | Med alone; high with D entry allowlist | High (stable id)             | Low            | Excellent              | Matches domain constant pattern | Low                  | **Recommend as SoT mirror**                  |
| **B** Environment-configured identity                         | Env/config supplies string      | Med (override/drift)                     | Med                                    | Depends on config discipline | Med            | Sensitive to misconfig | Possible as _binding_ only      | Low–med              | Acceptable **binding only**, not primary SoT |
| **C** DB-backed registry                                      | Table of job identities         | Med–high if gated                        | Med–high                               | High                         | High           | Needs seed/migration   | No existing registry            | **High unnecessary** | **Reject** for v1                            |
| **D** Dedicated internal execution principal at trusted entry | Construction + call-path policy | High                                     | **Highest among small options**        | High with stable id          | Med            | Code deploy            | Aligns with B-04 Nest façade    | Low                  | **Recommend as authorization layer**         |

**PROPOSED combination:** **A (definition) + D (trusted construction/authorization)**. Optional env pin only if equal to ratified constant and fail-closed. Reject standalone B or C as SoT.

**Trade-offs:** A+D does not provide cryptographic service authn (M6). Residual risk is malicious/compromised in-process code that bypasses D — accepted at Nest monolith trust level unless PO mandates stronger isolation.

---

## 13. Product Owner decision matrix

### 13.1 Mandatory decisions (approval required before P-D-02 can progress)

| ID       | Decision                                          | Recommended value                                                                            | Alternatives                                                       | Security impact                          | Approval required                           |
| -------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------- |
| D-ID-01  | Canonical `actorId` literal                       | Candidate `system-job:fiv-conn-04-migration-backfill` (**NOT APPROVED**)                     | Any string meeting §5.1; never gate/purpose/fixtures/domain locals | Critical — audit + lease holder identity | **Yes**                                     |
| D-ID-02  | Identity scope                                    | Single CONN-04 migration-backfill family identity                                            | App-wide mega-SYSTEM_JOB; per-run generated ids                    | High — attribution clarity               | **Yes**                                     |
| D-ID-03  | Naming convention (G4)                            | `system-job:<capability>` lowercase                                                          | Other stable convention PO chooses                                 | Med                                      | **Yes**                                     |
| D-SOT-01 | Authoritative SoT (G3/G7)                         | Governance ratification record of exact string                                               | Freeze amendment embedding string; reject DB registry as SoT       | Critical                                 | **Yes**                                     |
| D-PRV-01 | Provisioning mechanism (G2)                       | Static mirrored constant after ratification                                                  | Env-only SoT; DB registry                                          | High                                     | **Yes**                                     |
| D-TRU-01 | Trusted entry point (G6)                          | Non-public D Nest orchestrator constructs context                                            | Public HTTP; auto-cron; job-payload actor                          | Critical                                 | **Yes**                                     |
| D-TRU-02 | Privilege construction restrictions               | No external actor fields; allowlist exact id; force SYSTEM_JOB; restrict B-04 export/callers | Rely on non-HTTP alone                                             | Critical                                 | **Yes**                                     |
| D-LIF-01 | Lifecycle / revocation (G5 app-level)             | Disable D entry + optional rotate string; fail closed if missing                             | Soft-fail to alternate actor                                       | High                                     | **Yes**                                     |
| D-OPS-01 | Execution trigger policy                          | Explicit invocation only; cron not authorized                                                | Auto-cron; scheduler                                               | High                                     | **Yes**                                     |
| D-OPS-02 | Duplicate execution protection                    | Mandatory use of B-04 lease contention                                                       | Parallel bypass path                                               | High                                     | **Yes**                                     |
| D-GOV-01 | Authority / process / permanent record (G1/G2/G7) | _Values blank for PO_ — this package does not assign human roles                             | —                                                                  | Governance                               | **Yes** (external to engineering invention) |

### 13.2 Optional refinements (may follow after mandatory path)

| ID       | Decision                        | Recommended value                                                                                 | Alternatives                             | Security impact        | Approval required                                 |
| -------- | ------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------- | ------------------------------------------------- |
| D-AUD-01 | Persist `actorKind` in audit    | Payload metadata allowlist **or** derive from trusted definition when `actorId` matches canonical | Prisma attribution column; omit entirely | Med (investigation)    | **Yes if chosen**; not blocking OPT-PD02-02 model |
| D-TRU-03 | B-04-level SYSTEM_JOB allowlist | Optional defense in depth                                                                         | D-entry-only checks                      | Med incremental        | Optional                                          |
| D-TRU-04 | Cryptographic service authn     | Defer                                                                                             | mTLS / tokens                            | High if required later | Optional / future                                 |

---

## 14. P-D-02 / G1–G7 satisfaction mapping

**Do not mark requirements satisfied by design alone.**

### 14.1 Milestone distinction (binding)

| #   | Milestone                                  | Status after this package          |
| --- | ------------------------------------------ | ---------------------------------- |
| 1   | Architecture decision approved             | **NOT DONE** — awaiting PO         |
| 2   | Identity definition implemented            | **NOT DONE** — unauthorized        |
| 3   | Trusted binding implemented                | **NOT DONE** — unauthorized        |
| 4   | Audit attribution implemented and verified | **NOT DONE** — unauthorized        |
| 5   | P-D-02 formally satisfied                  | **NOT DONE** — remains **BLOCKED** |

### 14.2 Mapping table

| Requirement        | Existing evidence          | Proposed decision                                          | Remaining approval      | Required implementation evidence (later) | Verification method           |
| ------------------ | -------------------------- | ---------------------------------------------------------- | ----------------------- | ---------------------------------------- | ----------------------------- |
| OPT-PD02-02 model  | Ratification               | Keep SYSTEM_JOB single-mode                                | None (already ratified) | N/A                                      | Governance record             |
| G1 Authority       | Request open               | PO fills authority                                         | G1                      | Record in G7 artifact                    | Document review               |
| G2 Process         | Request open               | Static definition after ratification                       | G2                      | Process doc + PR evidence                | Document review               |
| G3 SoT             | Request open               | Governance record + mirrored constant                      | D-SOT-01                | Published SoT + code constant match      | Diff + fixture test           |
| G4 Naming          | Request open               | `system-job:<capability>`                                  | D-ID-03                 | Naming in SoT                            | Document review               |
| G5 Owner           | Request open               | App owner = Connections/D definition; human owner PO-named | G5 / D-LIF-01           | Named owner in SoT                       | Document review               |
| G6 Binding         | Request open               | D entry constructs; allowlist; export restriction          | D-TRU-01/02             | D orchestrator code + tests              | Conformance + call-path tests |
| G7 Record          | Request open               | Permanent governance artifact PO selects                   | D-GOV-01                | Artifact exists with exact string        | Document review               |
| Exact actorId (Q5) | Not provisioned            | Candidate §5.2 **NOT APPROVED**                            | D-ID-01                 | Constant == ratified string              | Character equality test       |
| Non-client-control | Ratification §4            | D-TRU-02                                                   | PO + impl               | No HTTP/job actor params                 | Spec + surface tests          |
| Audit same actorId | Ratification §5            | Emit canonical id                                          | PO + impl               | Audit fixtures                           | Audit integrity tests         |
| actorKind in audit | Separate C1/C2             | D-AUD-01 optional                                          | If elected              | Payload/schema evidence                  | Audit tests                   |
| P-D-02 BLOCKED     | Disposition / ratification | Remains blocked until approvals **and** impl evidence      | All mandatory           | Satisfaction disposition                 | Formal disposition            |

---

## 15. Implementation impact assessment

**No code written.** Expected future impact if approved and separately authorized:

| Area              | Expected impact                                                                                                                                                                                                   | Label    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Modules / files   | New D orchestrator under `apps/api/src/modules/connections/` (or governed composition); identity definition module/constant; `connections.module.ts` export tightening; possibly D audit helper (P-D-03 separate) | INFERRED |
| Prisma schema     | **Not required** for actorId SoT; lease already has `actorKind`. Audit `actorKind` column only if D-AUD-01 chooses schema path                                                                                    | INFERRED |
| Audit contracts   | Likely emit existing `connection.migration-gate` with canonical `actorId`; optional safe-payload key for `actorKind`                                                                                              | INFERRED |
| B-04 interface    | **No required signature change** for OPT-PD02-02; callers still pass `PrivilegedActorContext`. Optional allowlist inside adapter is additive                                                                      | INFERRED |
| Tests             | Construction allowlist; fail-closed missing id; controller non-exposure; export/call-path; audit actorId equality; contention/duplicate                                                                           | INFERRED |
| Regression        | Existing B-04 / B-05 / B-06 suites; Connections HTTP surface; ISO/conformance if present for Controllers                                                                                                          | INFERRED |
| Deploy / rollback | Roll forward constant with release; rollback = prior release without D or with D disabled; rotating id needs dual-write window plan if in-flight leases exist                                                     | INFERRED |

---

## 16. Risks and mitigations

| Risk                                            | Mitigation                                                       | Label                |
| ----------------------------------------------- | ---------------------------------------------------------------- | -------------------- |
| B-04 export allows arbitrary privileged callers | Restrict export; D-only façade; optional B-04 allowlist          | PROPOSED             |
| Approving candidate id without SoT process      | Keep **NOT APPROVED** until G1–G7 filled                         | CONFIRMED            |
| Env drift if used as SoT                        | Governance record primary; env pin optional and fail-closed      | PROPOSED             |
| Conflation with Trading Runtime / recovery      | Explicit forbid-list in tests                                    | PROPOSED             |
| Auto-cron creep                                 | D-OPS-01; no scheduler wiring without new PO decision            | PROPOSED             |
| Audit kind ambiguity                            | D-AUD-01 refinement; lease `actorKind` correlation interim       | CONFIRMED / PROPOSED |
| Premature implementation                        | D remains NOT AUTHORIZED until formal authorization after P-D-02 | CONFIRMED            |

---

## 17. Explicit unresolved questions

1. Exact approved `actorId` string (D-ID-01) — **NOT APPROVED**.
2. G1 human/role authority — unresolved; this package does not invent it.
3. G7 permanent artifact choice (standalone satisfaction disposition vs Freeze amendment).
4. Whether D-AUD-01 payload vs schema is required for investigation SLAs.
5. Whether B-04 export removal is mandatory in the first authorized implementation slice or phased.
6. Feature-flag mechanism for disabling D (**UNKNOWN** platform choice).
7. In-flight lease behavior during `actorId` rotation (operational runbook detail).

---

## 18. Recommended approval sequence

**PROPOSED sequence for Product Owner:**

1. Confirm binding context (OPT-PD02-02 unchanged; P-D-02 still BLOCKED).
2. Approve or amend **mandatory matrix** §13.1 (especially D-ID-01…D-OPS-02).
3. Resolve **G1–G7** into the permanent governance record (G7), including exact string and non-client-control statement.
4. Record architecture decision acceptance of **A+D** (static definition + trusted D construction).
5. Decide optional **D-AUD-01** / **D-TRU-03**.
6. Only then consider a separate **P-D-02 satisfaction disposition** when definition + binding + audit evidence exist.
7. Only after P-D-02 satisfaction + separate **D Implementation Authorization**, allow engineering to implement.

```text
STOP — AWAIT EXPLICIT PRODUCT OWNER REVIEW
NO IMPLEMENTATION AUTHORIZED BY THIS PACKAGE
P-D-02 REMAINS BLOCKED
```

---

## Appendix — Compliance (package preparation)

| Restriction                                          | Status                                             |
| ---------------------------------------------------- | -------------------------------------------------- |
| Documentation-only at preparation                    | Observed                                           |
| No code / tests / schema changes by this package     | Observed                                           |
| Historical: actorId not approved at preparation time | Observed (superseded for **policy** by Appendix R) |
| No stage / commit / push by package preparation      | Observed                                           |

---

## Appendix R — Product Owner approval (2026-10-30)

**Permanent SoT:** [`v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md`](./v3-l02-fiv-conn-04-d-system-job-product-owner-ratification.md)

### R.1 Mandatory matrix — approval status

| ID               | Recommended (historical)                           | Approval status                                              |
| ---------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| D-ID-01          | `system-job:fiv-conn-04-migration-backfill`        | **APPROVED POLICY** (exact literal)                          |
| D-ID-02          | Single CONN-04 migration-backfill identity         | **APPROVED POLICY**                                          |
| D-ID-03          | `system-job:<capability>`                          | **APPROVED POLICY**                                          |
| D-SOT-01         | Governance ratification as SoT                     | **APPROVED POLICY**                                          |
| D-PRV-01         | Static mirrored constant after ratification        | **APPROVED POLICY**; constant **IMPLEMENTATION PENDING**     |
| D-TRU-01         | Non-public D Nest orchestrator                     | **APPROVED POLICY**; orchestrator **IMPLEMENTATION PENDING** |
| D-TRU-02         | Construction restrictions / restricted B-04 access | **APPROVED POLICY**; enforcement **IMPLEMENTATION PENDING**  |
| D-LIF-01         | Disable D entry; fail closed; PO rotation          | **APPROVED POLICY**                                          |
| D-OPS-01         | Explicit invocation; no cron                       | **APPROVED POLICY**                                          |
| D-OPS-02         | B-04 lease contention mandatory                    | **APPROVED POLICY**                                          |
| D-GOV-01 / G1–G7 | PO authority + process + permanent record          | **APPROVED POLICY** (see PO ratification §12)                |

### R.2 Optional refinements

| ID                                       | Status                            |
| ---------------------------------------- | --------------------------------- |
| D-AUD-01 (`actorKind` in audit metadata) | **DEFERRED OPTIONAL REFINEMENT**  |
| D-TRU-03 / D-TRU-04                      | Optional / deferred as in package |

### R.3 Architecture combination

**APPROVED POLICY:** static definition (Option A) + trusted D construction (Option D) / discovery Option B + Option C.

### R.4 Milestones (unchanged separation)

| #   | Milestone                                  | Status                     |
| --- | ------------------------------------------ | -------------------------- |
| 1   | Architecture decision approved             | **DONE** (policy)          |
| 2   | Identity definition implemented            | **IMPLEMENTATION PENDING** |
| 3   | Trusted binding implemented                | **IMPLEMENTATION PENDING** |
| 4   | Audit attribution implemented and verified | **IMPLEMENTATION PENDING** |
| 5   | P-D-02 formally satisfied                  | **NOT DONE** — **BLOCKED** |

```text
NO IMPLEMENTATION AUTHORIZED BY APPENDIX R
P-D-02 REMAINS BLOCKED
D IMPLEMENTATION NOT AUTHORIZED
```
