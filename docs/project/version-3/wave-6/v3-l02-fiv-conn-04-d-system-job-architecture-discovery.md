# FIV-CONN-04-D — SYSTEM_JOB Architecture Discovery & Design Assessment

**Document:** Architecture discovery for canonical `SYSTEM_JOB` identity under ratified **OPT-PD02-02**  
**Date:** 2026-10-30  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01 / FIV-CONN-04-D  
**Repository `HEAD` at investigation:** `953292675e197d4f25778aaaa59eacb2826560fe`  
**Nature:** **READ-ONLY architecture investigation** plus creation of this single report. Does **not** implement D. Does **not** invent a canonical `actorId`. Does **not** create or register an identity. Does **not** modify application source, schemas, tests, prior P-D-02 / G1–G7 artifacts, Decision Freeze, or other governance documents. Does **not** stage, commit, or push. Does **not** claim P-D-02 is resolved.

```text
OPT-PD02-02 — SYSTEM_JOB: RATIFIED (model)
Canonical SYSTEM_JOB actorId: NOT APPROVED / NOT PROVISIONED
Provisioning + trusted-binding rules: NOT APPROVED
P-D-02: REMAINS BLOCKED
D Implementation: NOT AUTHORIZED
```

Every statement below is labeled **CONFIRMED**, **INFERRED**, **PROPOSED**, or **UNKNOWN**.

---

## 1. Executive summary

**CONFIRMED:** The repository already defines a privileged actor _shape_ for migration-gate / CONN-04 (`PrivilegedActorContext` with `actorKind ∈ {SYSTEM_JOB, OPERATOR}`) and Security Audit plumbing that requires `attribution.actorId` for `connection.migration-gate`. No production caller constructs a CONN-04 `SYSTEM_JOB` identity; no canonical `actorId` string is provisioned; B-04 is not exposed on public Connections HTTP.

**CONFIRMED:** Domain-local actor strings such as `execution-engine`, `system:startup-recovery`, and `trading-session-runtime-worker` exist as hardcoded constants for other domains. They are **not** `PrivilegedActorContext` CONN-04 provenance and must not be reused as the migration `SYSTEM_JOB` identity.

**INFERRED:** There is no repository-wide service-account / system-identity registry suitable for FIV-CONN-04-D. Reusing Identity `User` / JWT subjects, Campaign/Replay jobs, or trading runtime workers as the migration principal would conflate distinct trust domains.

**PROPOSED:** Implement OPT-PD02-02 as a **dedicated privileged migration principal** that remains inside the existing `PrivilegedActorContext` model (`actorKind: 'SYSTEM_JOB'`), with the exact `actorId` string, SoT, owner, and trusted-boundary binding approved by the product owner — without creating a parallel identity-management subsystem or promoting trading/domain-local strings.

**CONFIRMED:** This discovery alone does **not** satisfy P-D-02. P-D-02 remains **BLOCKED** until the open product decisions in §13 are approved and implementation evidence exists under separate authorization.

---

## 2. Repository evidence and exact file references

### 2.1 Modules and artifacts investigated

| Area                                | Paths investigated                                                                                                                                                                                                                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Privileged migration actor contract | `apps/api/src/modules/connections/migration-gate.ts`, `migration-gate.port.ts`, `conn04-migration-boundary.service.ts`, `prisma-migration-gate.adapter.ts`, `connection-migration-gate-audit.ts`, `connection-migration-gate-enforcement.ts`, `connections.controller.ts`, `connections.service.ts`, `connections.module.ts` |
| Durable lease schema                | `apps/api/prisma/schema.prisma` (`ConnectionMigrationGateLease`, `User`, `AuthSession`, `SecurityAuditRecord`)                                                                                                                                                                                                               |
| Human auth / identity               | `apps/api/src/modules/auth/jwt.strategy.ts`, `authentication.service.ts`, `auth.module.ts`; `apps/api/src/modules/identity/role.ts`, `development-identity.bootstrap.ts`                                                                                                                                                     |
| Security Audit                      | `apps/api/src/modules/security-audit/security-audit-record.ts`, `security-audit-attribution.ts`, `security-audit.service.ts`, `prisma-security-audit.repository.ts`                                                                                                                                                          |
| Domain-local system actors          | `apps/api/src/modules/execution-engine/execution-engine.service.ts`; `apps/api/src/modules/trading-session/recovery/startup-recovery-discovery.service.ts`; `apps/api/src/modules/strategy-trading-pipeline/trading-session-runtime.worker.ts`                                                                               |
| Background jobs                     | `apps/api/src/modules/jobs/job.ts`, `background-job.runner.ts`, `job.service.ts`                                                                                                                                                                                                                                             |
| Prior P-D-02 governance (read-only) | `v3-l02-fiv-conn-04-d-pd02-ratification.md`, `…-disposition.md`, `…-identity-provisioning-spec.md`, `…-identity-authority-discovery.md`, `…-g1-g7-governance-decision-request.md`, `…-decision-freeze.md`, `…-implementation-planning.md`, autonomous-model discovery/review                                                 |

### 2.2 Strongest evidence (selected)

| Finding                                                  | Evidence                                                                                                             | Label     |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------- |
| Privileged kinds exist                                   | `migration-gate.ts` L86–93: `PrivilegedActorKind = 'SYSTEM_JOB' \| 'OPERATOR'`; `PrivilegedActorContext`             | CONFIRMED |
| Shape validation only (any non-empty `actorId`)          | `isPrivilegedActorContext` L579–586; `assertAcquireInput` L592–625                                                   | CONFIRMED |
| B-04 refuses non-privileged kinds; caller supplies actor | `conn04-migration-boundary.service.ts` L73–90, L96–148                                                               | CONFIRMED |
| B-04 not public HTTP                                     | Module comment L1–7; controller regression in `conn04-migration-boundary.service.spec.ts` (~L316)                    | CONFIRMED |
| Lease stores `holderId` + `actorKind`                    | `schema.prisma` L892–910; adapter acquire writes `holderId: actor.actorId`, `actorKind: actor.actorKind` (~L207–215) | CONFIRMED |
| Audit requires `actorId`, not `actorKind`                | `security-audit-attribution.ts` L51–54; `security-audit-record.ts` L6–13                                             | CONFIRMED |
| Audit safe payload omits `actorKind`                     | `MIGRATION_GATE_AUDIT_SAFE_PAYLOAD_KEYS` L157–173                                                                    | CONFIRMED |
| Ordinary HTTP actor = JWT user                           | `connections.controller.ts` uses `request.user.userId` as `actorUserId`                                              | CONFIRMED |
| Deny-set blocked mutations audit human user id           | `connection-migration-gate-enforcement.ts` L92–94 (`actorId: input.actorUserId`)                                     | CONFIRMED |
| Domain-local `execution-engine`                          | `execution-engine.service.ts` L480, L698                                                                             | CONFIRMED |
| Domain-local `system:startup-recovery`                   | `startup-recovery-discovery.service.ts` L25, L287                                                                    | CONFIRMED |
| Trading runtime worker actor                             | `trading-session-runtime.worker.ts` L23, L95 (`RUNTIME_ACTOR = 'trading-session-runtime-worker'`)                    | CONFIRMED |
| Jobs module has no actor identity                        | `job.ts` entity; `background-job.runner.ts` — no `actorId` / privileged context                                      | CONFIRMED |
| OPT-PD02-02 ratified; Q5 incomplete                      | `v3-l02-fiv-conn-04-d-pd02-ratification.md` §1–3                                                                     | CONFIRMED |
| COND-D-03 ops mapping unresolved                         | `v3-l02-fiv-conn-04-d-decision-freeze.md` L223–237                                                                   | CONFIRMED |
| G1–G7 unresolved                                         | `v3-l02-fiv-conn-04-d-g1-g7-governance-decision-request.md` §4                                                       | CONFIRMED |
| No production SYSTEM_JOB literal for CONN-04             | Prior disposition §3.4; reconfirmed: concrete `SYSTEM_JOB` literals appear in `*.spec.ts` only                       | CONFIRMED |

---

## 3. Existing identity architecture

### 3.1 Identity types currently present

| #   | Type                               | Definition locus                                                  | Creation                                                 | Auth / trust                                                      | Propagation                                                                                | Persistence                                     | Label     |
| --- | ---------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------- | --------- |
| 1   | Human operator / user              | Prisma `User`; `AuthUser` (`jwt.strategy.ts` L18–24); `Role` enum | Identity user create; JWT session validation             | Passport JWT + session (`JwtStrategy.validate`)                   | Controllers pass `request.user.userId` / role into services                                | Persistent DB user + auth sessions              | CONFIRMED |
| 2   | Privileged migration actor (shape) | `PrivilegedActorContext` in `migration-gate.ts`                   | **Not provisioned in production**; tests invent fixtures | Trust assumed at in-process caller; **no allowlist** of `actorId` | Caller-supplied into B-04 / gate adapter; `holderId` on lease; audit `attribution.actorId` | Lease row fields; audit records                 | CONFIRMED |
| 3   | Domain event actor strings         | Hardcoded defaults in domain services                             | Compile-time constants / command override                | None as authn; attribution for domain events                      | Domain commands / outbox envelopes                                                         | Event/outbox payloads (domain-specific)         | CONFIRMED |
| 4   | Trading session runtime worker     | `RUNTIME_ACTOR` constant                                          | Hardcoded module constant                                | In-process outbox consumer registration                           | Passed into pipeline assemble as `actorId`                                                 | Session/pipeline attribution strings            | CONFIRMED |
| 5   | Startup recovery actor             | `STARTUP_RECOVERY_ACTOR_ID`                                       | Hardcoded constant                                       | Application bootstrap service                                     | Recovery discovery events                                                                  | Recovery/outbox actor field                     | CONFIRMED |
| 6   | Campaign / Replay Job              | `Job` type (`job.ts`)                                             | Job queue enqueue                                        | Job runner dequeues; **no actor principal**                       | Job metadata / status API                                                                  | In-memory / queue substrate (job id, not actor) | CONFIRMED |

### 3.2 Answers to investigation questions

1. **Which identity types exist?** — See §3.1. **CONFIRMED.**
2. **Where defined?** — Auth/Identity modules; Connections migration-gate types; domain constants. **CONFIRMED.**
3. **How created?** — Users via Identity; privileged shape never minting production IDs; domain actors hardcoded. **CONFIRMED.**
4. **How authenticated / trusted?** — Humans via JWT+session; privileged migration actor via _caller trust_ only today; domain strings unauthenticated. **CONFIRMED.**
5. **How propagated?** — HTTP: `AuthUser` → `actorUserId`. Gate: `PrivilegedActorContext` → lease `holderId` / audit. Domain: command `actorId`. **CONFIRMED.**
6. **Audit attribution?** — `SecurityAuditAttribution.actorId` (string); migration-gate events require it; no `actorKind` on attribution. **CONFIRMED.**
7. **Persistent / dynamic / hardcoded?** — Users persistent; privileged CONN-04 id **unprovisioned**; domain system strings hardcoded; no dynamic SYSTEM_JOB registry. **CONFIRMED.**

### 3.3 Explicit non-candidates for CONN-04 SYSTEM_JOB

| Candidate                          | Why unsuitable                                          | Label     |
| ---------------------------------- | ------------------------------------------------------- | --------- |
| `FIV-CONN-04` / gate key           | Resource / gate identity, not actor                     | CONFIRMED |
| `FIV_CONN_04_MIGRATION_BACKFILL`   | Lease purpose, not actor                                | CONFIRMED |
| Test fixtures (`job-1`, `op-1`, …) | Spec-only                                               | CONFIRMED |
| `request.user.userId`              | Public HTTP human subject; OPT-PD02-02 chose SYSTEM_JOB | CONFIRMED |
| `execution-engine`                 | Domain event default for execution engine               | CONFIRMED |
| `system:startup-recovery`          | Trading-session recovery bootstrap                      | CONFIRMED |
| `trading-session-runtime-worker`   | Autonomous trading pipeline driver                      | CONFIRMED |

---

## 4. Trusted execution boundary assessment

### 4.1 How the backend distinguishes principals

| Principal class                        | Distinguishing mechanism                                                                              | Label                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Authenticated human                    | JWT/`AuthUser` after session resolve; RBAC `Role` + permission guards                                 | CONFIRMED                                                                      |
| Ordinary Connections HTTP actor        | Always `request.user.userId` (not client-supplied actor id field on privileged context)               | CONFIRMED                                                                      |
| Internal privileged migration boundary | In-process Nest injectable `Conn04MigrationBoundaryService`; documented non-HTTP                      | CONFIRMED                                                                      |
| Background Campaign/Replay job         | Job queue runner; no privileged actor model                                                           | CONFIRMED                                                                      |
| Trading autonomous worker              | Outbox-registered worker with hardcoded `RUNTIME_ACTOR`                                               | CONFIRMED                                                                      |
| Privileged system operation (CONN-04)  | Intended: trusted constructor of `PrivilegedActorContext` at non-public D entry — **not implemented** | CONFIRMED (intent in planning/ratification); CONFIRMED (implementation absent) |

### 4.2 Client influence / injection surfaces

| Input surface                           | Can client set CONN-04 privileged `actorId` today?                | Evidence                                   | Label                                     |
| --------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------- |
| Connections HTTP body / headers / query | **No path to B-04**; ordinary path uses JWT `userId`              | Controller + B-04 non-exposure specs       | CONFIRMED                                 |
| Public B-04 HTTP                        | **Does not exist**                                                | Boundary service + module comments + specs | CONFIRMED                                 |
| WebSocket messages                      | **No CONN-04 privileged actor path found**                        | Grep of websocket modules                  | CONFIRMED (absence in investigated paths) |
| Job payloads (Campaign/Replay)          | **No PrivilegedActorContext**                                     | Jobs module                                | CONFIRMED                                 |
| In-process B-04 / gate `actor` argument | **Yes — caller-supplied; any non-empty string with allowed kind** | `isPrivilegedActorContext`; no allowlist   | CONFIRMED                                 |

### 4.3 Impersonation resistance

**CONFIRMED:** Anti-spoofing for ordinary Connections HTTP relies on JWT session identity, not on trusting request-body actor fields for privileged migration.

**CONFIRMED:** B-04 / gate validate _shape_ (`SYSTEM_JOB` \| `OPERATOR`, non-empty `actorId`) but **do not** authenticate the `actorId` against a registry, Identity user, or cryptographic credential.

**INFERRED:** Today’s primary control against privileged impersonation is **architectural non-exposure** of B-04 (no public HTTP) plus process discipline. That is necessary but incomplete once a D orchestrator exists: any in-process caller that can invoke B-04 could supply an arbitrary `actorId` unless the trusted D entry binds a ratified constant and refuses client overrides.

**CONFIRMED:** `reclaimAsOperator` additionally requires `actorKind === 'OPERATOR'` (`prisma-migration-gate.adapter.ts` ~L310) — kind discrimination exists, not identity allowlisting.

**PROPOSED:** Treat “trusted backend constructs `PrivilegedActorContext` from ratified SoT; never from HTTP/job/client input” as the binding control for OPT-PD02-02 (aligns with ratification security requirements).

---

## 5. Provisioning and lifecycle assessment

### 5.1 Existing mechanisms

| Mechanism                            | Exists?                                    | Suitable to provision CONN-04 SYSTEM_JOB without parallel IdM?                              | Label                                         |
| ------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Identity user create / role assign   | Yes                                        | **Poor fit** — human account model; conflates OPT-PD02-02 with OPERATOR/user                | INFERRED                                      |
| Development identity bootstrap       | Present but product-path gated off (PC-18) | **No** — explicitly not product path                                                        | CONFIRMED                                     |
| DB seed for system users             | No CONN-04 SYSTEM_JOB seed found           | N/A                                                                                         | CONFIRMED (absence)                           |
| Env/config key for privileged job id | Not found as SoT                           | Possible _binding_ after PO ratification (provisioning-spec Path P4)                        | CONFIRMED (absent); PROPOSED (future binding) |
| Hardcoded domain actor constants     | Yes (other domains)                        | Pattern exists; **value must not be invented here**; must be PO-approved and CONN-04-scoped | CONFIRMED / PROPOSED                          |
| Service-account registry             | **Not found**                              | Creating one would be a parallel identity system                                            | CONFIRMED                                     |
| Jobs module identity                 | **None**                                   | Not a privileged principal store                                                            | CONFIRMED                                     |
| Governance ratification record       | Process artifacts exist; Q5/G1–G7 open     | **Best SoT candidate for exact string + owner** without new IdM                             | INFERRED                                      |

### 5.2 Rotation / revocation / recovery

**CONFIRMED:** No rotation/revocation procedure for CONN-04 SYSTEM_JOB identities exists in code or inspected ops runbooks.

**UNKNOWN:** Whether future rotation would require Decision Freeze amendment vs config redeploy — requires product-owner lifecycle decision (§13).

**INFERRED:** Lease `holderId` + fence generation already support _operational_ takeover/contention; they do not replace identity lifecycle governance.

### 5.3 Mechanism recommendation (provisioning only)

**PROPOSED:** Prefer governance-approved exact string + owner recorded as SoT, then bind at the trusted D entry via a single application-owned constant or fail-closed config reader of that ratified value — **without** inventing a service-account registry or minting an Identity `User`. This matches prior provisioning-spec Paths P1/P2/P4 conceptually; this report does not select a governance path letter as binding.

---

## 6. Audit integration assessment

| Question                                                       | Finding                                                                                                                    | Label                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| How do audit events identify actor?                            | `attribution.actorId` string                                                                                               | CONFIRMED            |
| Is actor identity mandatory?                                   | Per-event rules; **yes** for `connection.migration-gate`                                                                   | CONFIRMED            |
| Are system actors supported?                                   | Any string `actorId` accepted; no type discriminator on attribution                                                        | CONFIRMED            |
| Separate actor type + actor ID?                                | **Lease** stores `actorKind`; **Security Audit attribution does not**                                                      | CONFIRMED            |
| Can existing audit represent SYSTEM_JOB without schema change? | **Yes for string attribution** (`actorId` only). Kind must be inferred from lease, ops knowledge, or future payload/schema | CONFIRMED / INFERRED |
| Trusted for privileged ops?                                    | Trustworthy **iff** `actorId` bound at trusted boundary; schema alone does not prove kind                                  | INFERRED             |
| Gaps for FIV-CONN-04-D                                         | (1) No canonical id to emit; (2) no `actorKind` on attribution / safe payload; (3) no allowlist verification               | CONFIRMED            |

**INFERRED:** Representing SYSTEM_JOB in audit **without** schema change is possible by emitting the ratified `actorId` string into existing `attribution.actorId`. Distinguishing SYSTEM_JOB vs OPERATOR _in the audit record itself_ is a **gap** unless product elects to add kind to payload/attribution later (not required to _store_ a string under OPT-PD02-02, but relevant for investigation clarity).

**PROPOSED:** Keep Security Audit schema unchanged for P-D-02 satisfaction; require D to emit the same ratified `actorId` used in `PrivilegedActorContext`; treat optional `actorKind` enrichment as a separate product decision (historically C1/C2-class), not a blocker invented here.

---

## 7. Separation of identity concepts

| Concept                                | Current model                                                       | Share with CONN-04 SYSTEM_JOB?                               | Label                   |
| -------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------- |
| 1. Human user identity                 | Identity `User` + JWT `AuthUser`                                    | **No** as SYSTEM_JOB SoT (OPERATOR path was not selected)    | CONFIRMED (OPT-PD02-02) |
| 2. Internal service identity           | Module boundaries / Nest providers; not a global principal registry | Share _process_ trust, not actor string namespace            | INFERRED                |
| 3. Background worker identity          | Campaign/Replay jobs; notification recovery services                | **Separate** — different purpose; jobs lack privileged actor | CONFIRMED               |
| 4. Trading runtime / autonomous worker | `trading-session-runtime-worker` + Spec Option B autonomy           | **Must remain distinct** from migration SYSTEM_JOB           | CONFIRMED               |
| 5. Privileged migration SYSTEM_JOB     | `PrivilegedActorKind` + unprovisioned `actorId`                     | **Dedicated principal** inside existing privileged shape     | CONFIRMED / PROPOSED    |

**PROPOSED:** Do **not** merge concepts merely because names contain `system`, `worker`, or `service`. Use one _representation_ (`PrivilegedActorContext`) for CONN-04 privileged ops, but a **CONN-04-specific ratified identity value** distinct from trading/recovery/engine strings.

---

## 8. Architecture options comparison

Evaluation criteria: architectural consistency; impersonation resistance; audit compatibility; provisioning complexity; lifecycle/revocation; operational maintainability; impact on existing modules; risk of parallel identity system.

### Option A — Reuse an existing canonical system identity mechanism

| Criterion         | Assessment                                                                                       | Label     |
| ----------------- | ------------------------------------------------------------------------------------------------ | --------- |
| Consistency       | **Fails** — no repository-wide canonical system-identity mechanism for PrivilegedActorContext    | CONFIRMED |
| Security          | Reusing `execution-engine` / recovery / runtime worker creates false attribution and trust bleed | INFERRED  |
| Audit             | Would emit misleading actor strings                                                              | INFERRED  |
| Provisioning      | Appears “free” but is incorrect provenance                                                       | INFERRED  |
| Parallel IdM risk | Low mechanically, high semantic risk                                                             | INFERRED  |
| Verdict           | **Reject** for OPT-PD02-02 satisfaction                                                          | PROPOSED  |

### Option B — Dedicated SYSTEM_JOB identity within existing identity model (`PrivilegedActorContext`)

| Criterion         | Assessment                                                                                                              | Label            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Consistency       | Aligns with frozen COND-D-03 kinds and OPT-PD02-02                                                                      | CONFIRMED        |
| Security          | Good **if** trusted binding + non-client control enforced at D entry; shape-only validation today is insufficient alone | INFERRED         |
| Audit             | Compatible with `attribution.actorId` without schema change                                                             | CONFIRMED        |
| Provisioning      | Requires PO-approved exact string + owner/SoT; no new IdM required                                                      | INFERRED         |
| Lifecycle         | Needs explicit rotation/revocation owner (open)                                                                         | CONFIRMED (open) |
| Module impact     | Localized to future D orchestrator + binding site; B-04/audit unchanged in principle                                    | INFERRED         |
| Parallel IdM risk | **Low** if no new registry                                                                                              | INFERRED         |
| Verdict           | **Primary viable option**                                                                                               | PROPOSED         |

### Option C — Dedicated privileged execution principal with explicit trusted backend context

| Criterion         | Assessment                                                                                           | Label     |
| ----------------- | ---------------------------------------------------------------------------------------------------- | --------- |
| Consistency       | Emphasizes binding/control plane more than string storage; still uses PrivilegedActorContext at B-04 | INFERRED  |
| Security          | Strongest framing of anti-impersonation (constructor + fail-closed SoT)                              | PROPOSED  |
| Audit             | Same as B                                                                                            | CONFIRMED |
| Provisioning      | Same Q5/G-fields as B; adds explicit binding mechanism requirement                                   | INFERRED  |
| Parallel IdM risk | Low if principal is not a second user directory                                                      | INFERRED  |
| Verdict           | **Complement to B**, not a competing identity store                                                  | PROPOSED  |

### Option D (evidence-justified) — Mint Identity `User` / service account row as SYSTEM_JOB

| Criterion    | Assessment                                                                                                | Label    |
| ------------ | --------------------------------------------------------------------------------------------------------- | -------- |
| Consistency  | Conflicts with OPT-PD02-02 single-mode SYSTEM_JOB (not OPERATOR subject mapping) and human User semantics | INFERRED |
| Security     | Would pull migration privilege into login/RBAC surface unless heavily constrained                         | INFERRED |
| Provisioning | Creates near-parallel IdM concerns (password/session for non-human?)                                      | INFERRED |
| Verdict      | **Reject** unless PO explicitly reopens model (out of scope; OPT-PD02-02 stands)                          | PROPOSED |

---

## 9. Recommended architecture and rationale

**PROPOSED recommendation:** **Option B + Option C binding discipline**.

1. Retain **`PrivilegedActorContext` / `actorKind: 'SYSTEM_JOB'`** as the only CONN-04 privileged representation for D (OPT-PD02-02; COND-D-03).
2. Provision a **dedicated CONN-04 migration job identity** (exact string TBD by PO) — **not** trading runtime, startup recovery, execution-engine, gate key, or lease purpose.
3. Bind that identity **only** at a trusted non-public D invocation boundary that constructs the context server-side; refuse client/job/HTTP override.
4. Pass the same `actorId` into B-04 and Security Audit.
5. Do **not** introduce a service-account registry or Identity User for this principal unless a later explicit product decision requires it.

**Rationale (INFERRED from evidence):** The repository already invested in privileged shape, lease holder semantics, B-04 façade, and audit attribution. The missing piece is governance-grade provenance + trusted binding, not a new identity platform. Option A fails evidence. Option D conflicts with ratified model intent.

---

## 10. Proposed canonical identity model

> Values that would invent an approved literal ID are intentionally omitted.

| Element                                           | Proposal                                                                                                                                                                                                                                                                                                          | Label                                    |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **Identity type**                                 | Privileged migration principal represented as `PrivilegedActorContext` with `actorKind: 'SYSTEM_JOB'`                                                                                                                                                                                                             | PROPOSED (aligned with CONFIRMED types)  |
| **Actor ID strategy**                             | Single stable, CONN-04-scoped opaque string, character-for-character identical everywhere (B-04 `actorId`, lease `holderId`, audit `attribution.actorId`). Naming convention and exact value require PO approval (G4 + Q5). Must be distinct from gate key, lease purpose, trading worker ids, and test fixtures. | PROPOSED                                 |
| **Provisioning authority within the application** | Application **consumes** a ratified value; it does **not** invent authority. Runtime authority to _use_ the string sits at the trusted D entry module (future, unauthorized today). Product-owner / recorded governance authority provisions the string (G1 open).                                                | PROPOSED / CONFIRMED (G1 open)           |
| **Source of truth**                               | Governance record naming exact string + owner (satisfaction disposition / Freeze amendment / equivalent). Optional fail-closed config key only after value is ratified.                                                                                                                                           | PROPOSED                                 |
| **Trusted binding mechanism**                     | Non-public D orchestrator constructs `{ actorId: <ratified>, actorKind: 'SYSTEM_JOB', correlationId? }` from SoT; never from request body/headers/query/WebSocket/job payload. B-04 remains caller-supplied but only callable from that boundary for D.                                                           | PROPOSED                                 |
| **Lifecycle and revocation**                      | Named owner (G5); change/rotation requires same governance class as provisioning; compromise response retires string and rebinds. No automated rotation found.                                                                                                                                                    | PROPOSED / CONFIRMED (absent automation) |
| **Audit attribution**                             | Emit ratified `actorId` on `connection.migration-gate` (and future D lifecycle events as designed); do not rely on schema `actorKind` unless separately approved                                                                                                                                                  | PROPOSED                                 |

---

## 11. Security risks and mitigations

| Risk                                                  | Severity                         | Mitigation                                                                                                      | Label                |
| ----------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------- |
| Arbitrary in-process `actorId` spoofing once D exists | High                             | Trusted constructor + code ownership / module boundary; optional allowlist of the single ratified id at D entry | INFERRED / PROPOSED  |
| Accidental public HTTP exposure of B-04/D             | High                             | Preserve non-exposure; conformance tests already assert controller isolation — extend for D                     | CONFIRMED / PROPOSED |
| Reuse of trading/domain actor strings                 | High (attribution integrity)     | Explicit forbid-list in design reviews; PO distinctness requirement                                             | CONFIRMED / PROPOSED |
| Audit missing `actorKind`                             | Medium (investigation ambiguity) | Correlate lease `actorKind`; or later optional enrichment — not required to store string                        | CONFIRMED / PROPOSED |
| Config/env override without ratification              | High                             | Fail closed on empty/unbound; value must match governance SoT                                                   | PROPOSED             |
| Conflating OPERATOR reclaim with SYSTEM_JOB           | Medium                           | Keep reclaim OPERATOR-only (already coded); D path SYSTEM_JOB-only under OPT-PD02-02                            | CONFIRMED / PROPOSED |

**CONFIRMED:** No adequate _identity authentication_ mechanism for SYSTEM_JOB `actorId` exists today beyond non-exposure + shape checks. That gap must be closed by trusted binding design before D is authorized — not by inventing an id in discovery.

---

## 12. Compatibility and migration considerations

| Topic                              | Assessment                                                      | Label     |
| ---------------------------------- | --------------------------------------------------------------- | --------- |
| B-01 / B-04 / B-05 contracts       | Compatible; caller continues to supply `PrivilegedActorContext` | CONFIRMED |
| Ordinary Connections HTTP          | Unchanged; continues JWT `actorUserId`                          | CONFIRMED |
| Security Audit schema              | No mandatory change to represent SYSTEM_JOB string              | CONFIRMED |
| Lease schema                       | Already has `holderId` / `actorKind`                            | CONFIRMED |
| Trading runtime / recovery         | No merge; no shared constant                                    | PROPOSED  |
| Existing test fixtures             | Remain non-authoritative; must not leak into production SoT     | CONFIRMED |
| Migration of historical audit rows | N/A until D emits events                                        | CONFIRMED |
| Parallel IdM                       | Avoided by recommendation                                       | PROPOSED  |

---

## 13. Open product decisions requiring explicit approval

These require product-owner (internal project) approval. This report does **not** answer them.

| ID       | Decision                                                                                            | Status                                 | Label                          |
| -------- | --------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------ |
| PD-SJ-01 | Exact canonical `SYSTEM_JOB` `actorId` string (character-for-character)                             | OPEN                                   | CONFIRMED open                 |
| PD-SJ-02 | Naming convention for SYSTEM_JOB identities (G4)                                                    | OPEN                                   | CONFIRMED open                 |
| PD-SJ-03 | Authoritative SoT artifact for the string (G3/G7)                                                   | OPEN                                   | CONFIRMED open                 |
| PD-SJ-04 | Provisioning authority role (G1) and process (G2)                                                   | OPEN                                   | CONFIRMED open                 |
| PD-SJ-05 | Lifecycle owner + rotation/revocation rules (G5)                                                    | OPEN                                   | CONFIRMED open                 |
| PD-SJ-06 | Trusted-boundary binding mechanism detail (G6): constant vs ratified config key vs other            | OPEN                                   | CONFIRMED open                 |
| PD-SJ-07 | Whether audit must persist `actorKind` (payload/attribution) or lease correlation suffices          | OPEN                                   | PROPOSED as optional follow-on |
| PD-SJ-08 | Whether D entry may ever accept OPERATOR under a future dual-mode (currently N/A under OPT-PD02-02) | CLOSED by ratification unless reopened | CONFIRMED                      |

**CONFIRMED:** G1–G7 in `v3-l02-fiv-conn-04-d-g1-g7-governance-decision-request.md` remain the authoritative open checklist; this discovery does not modify that artifact.

---

## 14. P-D-02 impact assessment

| Fact                                                                                  | Status                                                                                                                                 | Label     |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| OPT-PD02-02 — SYSTEM_JOB                                                              | **RATIFIED** (unchanged by this report)                                                                                                | CONFIRMED |
| Exact canonical actor ID                                                              | **Not approved**                                                                                                                       | CONFIRMED |
| Provisioning + trusted-binding rules                                                  | **Not approved**                                                                                                                       | CONFIRMED |
| P-D-02                                                                                | **BLOCKED**                                                                                                                            | CONFIRMED |
| D Implementation                                                                      | **NOT AUTHORIZED**                                                                                                                     | CONFIRMED |
| Does this discovery resolve P-D-02?                                                   | **No**                                                                                                                                 | CONFIRMED |
| Can the proposed model resolve P-D-02 _after_ PO approvals + implementation evidence? | **Yes, in principle** — model aligns with ratification; satisfaction still needs Q5/G deliverables + later authorized binding evidence | INFERRED  |

```text
P-D-02 STATUS: UNCHANGED (REMAINS BLOCKED)
OPT-PD02-02: UNCHANGED
D IMPLEMENTATION: NOT AUTHORIZED
NO IDENTITY CREATED
NO ACTOR ID INVENTED
NO GOVERNANCE ARTIFACT MODIFIED (except creation of this discovery report)
```

---

## Appendix A — Investigation constraints compliance

| Restriction                                                | Compliance |
| ---------------------------------------------------------- | ---------- |
| No application source modification                         | Observed   |
| No schema/migration/test changes                           | Observed   |
| No modification of prior P-D-02 / G1–G7 / Freeze artifacts | Observed   |
| No SYSTEM_JOB identity creation                            | Observed   |
| No invented approved literal actor ID                      | Observed   |
| No new identity registry                                   | Observed   |
| No install / destructive commands / stage / commit / push  | Observed   |
| No D implementation                                        | Observed   |

---

## Appendix B — Summary recommendation for product owner

**PROPOSED next governance acts (not performed here):**

1. Approve PD-SJ-01…06 (exact id, naming, SoT, authority, owner, binding).
2. Record them in the chosen permanent governance artifact (G7).
3. Only then authorize engineering to implement the trusted D binder under separate Implementation Authorization.
4. Keep trading autonomous worker identity and migration SYSTEM_JOB permanently distinct.
