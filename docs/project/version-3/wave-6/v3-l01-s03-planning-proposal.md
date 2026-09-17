# V3-L01-S03 Planning Proposal

**Document:** PROPOSED-V3-L01-S03 Individual Slice Planning Proposal  
**Date:** 2026-09-17  
**Package:** V3-L01 — Live capital ADR + workspace policy (LT-01)  
**Wave:** 6 — Live Trading  
**Nature:** Individual slice planning proposal only. **Not** S03 implementation approval. **Not** implementation. **Not** Admin enable/disable API. **Not** audit catalog mutation. **Not** FIV. **Not** live-capital activation. **Not** an ADR. **Not** a Master Plan / Roadmap revision.  
**Authority:** Planning Engineer / Solution Architect under PO / Chief Architect governance lifecycle  
**Preceded by:** V3-L01-S02 Final Close — **CLOSED** ([`v3-l01-s02-final-close.md`](./v3-l01-s02-final-close.md))  
**Slice planning approval (package):** [`v3-l01-slice-approval.md`](./v3-l01-slice-approval.md)  
**ADR:** [`docs/adr/ADR-020-live-capital.md`](../../../adr/ADR-020-live-capital.md)  
**Repository baseline:** `add259a57382da1721240d8016d9d6e4b5c85e6f` (`docs(wave-6): close v3-l01-s02`)

```text
PROPOSED-V3-L01-S03
PLANNING ONLY
NOT APPROVED FOR IMPLEMENTATION

This artifact is a planning proposal only.
S03 implementation requires explicit PO / Chief Architect Slice Approval
after Planning Review of this proposal.
S02 Final Close ≠ S03 authorization.
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Executive Summary

**PROPOSED-V3-L01-S03 — Admin Enable/Disable + Audit** is the third V3-L01 slice. It establishes the **administrative control plane** for the S02 workspace live-policy SoT: authorized Admin enable/disable of `PAPER` ↔ `LIVE_POLICY_OPTED_IN`, with mandatory security-audit evidence, workspace isolation, and honesty that **policy opt-in ≠ live trading**.

S02 already delivered durable persistence and Paper defaults (`WorkspaceLivePolicyState` / `workspace_live_policy_states`, domain ports, `persistPolicy`). S03 must **consume** that SoT — not invent a second policy store. S03 must **not** wire Gate, Kill Switch, Session admission (S04), credentials, Vault mutation, LiveCommand unbound, or L02–L05 execution.

This proposal maps repository evidence to a concrete design **for PO / Chief Architect review**, marks BLOCKING OPEN decisions that require Approval, and defines acceptance criteria for a future authorized implementation. **No code, migration, endpoint, or audit catalog change is authorized by this artifact.**

```text
LIVE_POLICY_OPTED_IN = workspace policy opt-in ONLY
≠ live authorization ≠ Gate admission ≠ execution
≠ credentials ≠ capital movement ≠ production readiness
```

---

## 2. Governance State

Do **not** reinterpret these states:

| Item | Status |
| ---- | ------ |
| Wave 6 Planning | **APPROVED** |
| ADR-020 | **ACCEPTED** |
| D-GOV-05 | **GRANTED** (wave-level; package/slice gates remain) |
| V3-L01 Package Planning | **APPROVED** |
| V3-L01 Slice Planning | **APPROVED** (S01 → S02 → S03 → S04 decomposition) |
| V3-L01-S01 | **CLOSED** |
| V3-L01-S02 | **CLOSED** (impl `d6bfba29e0ec3b73e1d964ba60c8bb3230a2bc23`) |
| **V3-L01-S03** | **NOT APPROVED FOR IMPLEMENTATION** |
| V3-L01-S04 | **NOT APPROVED** |
| L02–L05 | **NOT AUTHORIZED** |
| Live capital activation | **NOT AUTHORIZED** |
| FIV | **NOT PERFORMED** / **NOT AUTHORIZED** |
| Wave 6 | **NOT COMPLETE** |
| Wave 5 | **NOT COMPLETE** / **NOT CLOSED** |

Evidence: [`wave-6-po-decision-register.md`](./wave-6-po-decision-register.md) · ADR-020 · [`v3-l01-s02-final-close.md`](./v3-l01-s02-final-close.md).

```text
This planning proposal ≠ S03 Slice Approval
S03 Slice Approval ≠ live ready
Admin enabled policy ≠ live trading available
```

**D-ARCH-02 status (register):** S02 persistence **DECIDED** (PO-S02-01…06). Enablement API / audit schema remain **OPEN** for S03 — this proposal surfaces them as **PO-S03 OPEN DECISIONS**.

---

## 3. Scope

### 3.1 Slice identity

| Field | Value |
| ----- | ----- |
| **Proposed Slice ID** | **PROPOSED-V3-L01-S03** |
| **Name** | Admin Enable/Disable + Audit |
| **Package** | V3-L01 |
| **Position** | Third slice in approved order S01 → S02 → S03 → S04 |
| **Type** | Administrative control plane (authorized mutate + audit) |
| **Follows** | S02 — Workspace live-policy persistence & Paper defaulting (**CLOSED**) |
| **Precedes** | S04 — Gate · KS · Session admission wiring |

**Do not silently canonicalize or rename** this ID in this act. Canonical rename remains **OPEN / NON-BLOCKING** (same convention as PO-S02-07).

### 3.2 Intended planning scope (after separate Approval)

S03 is intended to define and, after separate Approval, implement:

1. Admin authorization to change workspace live policy (reuse existing Auth / RoleAdmin patterns — no new framework).  
2. Explicit **enable** operation → persist `LIVE_POLICY_OPTED_IN` via S02 SoT.  
3. Explicit **disable** operation → persist `PAPER` via S02 SoT.  
4. State transition validation.  
5. Audit of enable/disable (and decided failed-attempt semantics).  
6. Workspace / tenant isolation.  
7. Authentication / actor attribution.  
8. Request validation.  
9. Error semantics.  
10. API contract.  
11. Idempotency semantics.  
12. Security boundaries (no Gate/KS/Session/credential/execution side effects).  
13. Consumer / operator honesty.

### 3.3 Planning objective

Resolve D-ARCH-02 remaining enablement/audit surface **as a proposal for PO / Chief Architect review**, grounded in repository evidence — without inventing silent decisions or shipping code.

---

## 4. Explicit Non-Scope

S03 **MUST NOT** cover (binding exclusions):

| Exclusion | Belongs to |
| --------- | ---------- |
| New policy persistence SoT / duplicate store / S02 migration rewrite | **Forbidden** — consume S02 |
| Runtime Enforcement Gate live admission wiring | **S04** |
| Kill Switch live admission / incident runbook productization | **S04** / later |
| Session live-mode productization / human-start session path | **S04** |
| Unbinding `PermissionClass.LiveCommand` for all roles / live start commands | **Forbidden** / later live gates |
| Live adapter / order submit / cancel / capital movement | **L02** |
| Tamper-evident financial action log (L03 schema/integrity) | **L03** |
| Live operator UI / unhiding `/trading/live` | **L04** (Rule 1) |
| Replay protection | **L05** |
| Credential provisioning / Vault mutation for live keys | Ops / later |
| MFA invention if still OPEN (may defer with explicit record) | Production activation / later |
| New Admin role / parallel authorization framework / hard-coded user IDs | **Forbidden** |
| Flipping V2 `liveCapitalAuthorized` / weakening `paperFreeze` | **Forbidden** |
| Live-capital activation / FIV / production release | Separate gates |
| L02–L05 packages | Separate packages |

**S03 must not create a mechanism that allows live trading by itself.**

---

## 5. Repository Reconnaissance

### 5.1 Method

Inspected Wave 6 / ADR-020 / S01–S02 governance artifacts, then searched Auth/permission matrix, Security Audit product, Workspace live-policy S02 ports, Admin controllers, workspace access, Gate/KS/Session surfaces, and API documentation conventions.

### 5.2 Authoritative findings (current truth)

| Surface | Evidence | Finding |
| ------- | -------- | ------- |
| S02 SoT | `workspace/live-policy/*` · Prisma `WorkspaceLivePolicyState` | `PAPER` / `LIVE_POLICY_OPTED_IN`; `persistPolicy` write port; **no HTTP** |
| Admin authz | `permission-catalog.ts` · `permission-matrix.ts` · `roles.guard.ts` | Canonical = **PermissionClass + role matrix + RolesGuard** |
| RoleAdmin (C6) | Matrix `ADMIN_ALLOWS`; People / security-audit timeline | Admin privileged mutations use **RoleAdmin** |
| LiveCommand (C7) | Matrix never grants C7; live controller binds C7 | **Deny-all** — must remain unbound for S03 enablement |
| Workspace membership | `workspace-access.service.ts` | Member = **active workspace + owner**; no multi-member Admin table |
| Security Audit | `security-audit/*` (V3-S05) | Append-only classified events; refuse unclassified `eventType` |
| Role-change audit precedent | `people.controller.ts` · `assignRoleWithMandatoryAudit` | Transactional mutation + mandatory audit |
| Enablement API | S01 inventory `eph-enablement-api-absent` | **Absent** (correct; S03 owns) |
| Live-policy audit event type | `security-audit-classification.ts` | **Not found** — catalog extension required |
| Gate / KS / Session live wiring | Runtime enforcement / trading session | **Unchanged by S02**; S04 owns admission |
| V2 anchors | certification checklist / compatibility matrix | `liveCapitalAuthorized: false`; `paperFreeze: true` |
| OpenAPI/Swagger in apps/api | Search | **Not used**; markdown API contracts are the convention |

### 5.3 Protected leftovers

Known dirty/untracked Wave 5 leftovers exist in the working tree. They are **out of scope** for this planning act and were **not** modified, staged, renamed, or cleaned.

---

## 6. Existing Admin Authorization

### 6.1 Canonical mechanism (evidence)

```text
JwtAuthGuard → AuthCsrfGuard → RolesGuard → ThrottlerGuard (APP_GUARD)
@RequirePermission(PermissionClass.*)
decideAuthorization() — default deny; unknown role/permission → deny
```

| Layer | Path | Role for S03 |
| ----- | ---- | ------------ |
| Catalog | `apps/api/src/modules/auth/permission-catalog.ts` | `RoleAdmin = C6`; `LiveCommand = C7` |
| Matrix | `apps/api/src/modules/auth/permission-matrix.ts` | Admin: C1–C6 + C8; **not** C7/C9 |
| Guard | `apps/api/src/modules/auth/roles.guard.ts` | Enforce `@RequirePermission` |
| Roles | `apps/api/src/modules/identity/role.ts` | `Reader \| Researcher \| Trader \| Admin` (no inheritance) |
| Actor | `jwt.strategy.ts` `AuthUser` | `userId`, `email`, `displayName`, `role`, `sessionId?` |

### 6.2 Existing Admin (C6) surfaces (precedent)

| Route | Auth |
| ----- | ---- |
| People `GET/PATCH /v1/people…` | `@RequirePermission(RoleAdmin)` |
| Security audit timeline `GET /v1/security-audit/workspaces/:workspaceId/timeline` | RoleAdmin + workspace membership |
| Auth probe `GET /v1/auth/admin` | RoleAdmin **and** `@Roles(Role.Admin)` |

### 6.3 Distinctions (binding)

| Concept | Meaning | S03 implication |
| ------- | ------- | --------------- |
| **Authentication** | Signed-in operator (JWT / session) | Required for any enable/disable call |
| **Authorization** | Role matrix allows RoleAdmin (or PO-approved cell) **and** workspace membership | Required; trader self-serve denied |
| **Policy state** | S02 `PAPER` / `LIVE_POLICY_OPTED_IN` | What S03 mutates |
| **Live execution authorization** | LiveCommand / Gate / KS / credentials / activation | **Out of S03**; must remain denied |

### 6.4 Recommendation vs OPEN

**Evidence-aligned recommendation:** Guard enable/disable with **`PermissionClass.RoleAdmin`** + **`WorkspaceAccessService` membership**, mirroring security-audit timeline / Admin mutation precedent. **Do not** grant `LiveCommand` as the enablement permission.

**PO-S03-01 remains OPEN** until PO confirms RoleAdmin-only vs a narrow matrix extension (must not unbound LiveCommand for all roles).

---

## 7. Existing Audit Architecture

### 7.1 Canonical product: Security Audit (V3-S05)

| Piece | Path | Behavior |
| ----- | ---- | -------- |
| Write API | `security-audit.service.ts` | `record(SecurityAuditWrite)` — refuses unclassified `eventType`; strips secrets; integrity hash |
| Classification | `security-audit-classification.ts` | Closed catalog (e.g. `authz.role-change`, `authz.deny`, vault.*, …) |
| Persist helper | `security-audit-persist.ts` | `persistSecurityAuditEvent(audit, eventType, context, source, tx?)` |
| Record fields | `security-audit-record.ts` | actor / workspace / subject / resource / correlationId / outcome / timestamps / payload / integrityHash |
| Storage | Prisma `SecurityAuditRecord` | Append-only `create` |
| Timeline read | `security-audit-timeline.controller.ts` | Admin + workspace-scoped |

### 7.2 Closest mutation precedent

**People role assign** (`assignRoleWithMandatoryAudit`):

1. Validate authorization / domain rules.  
2. Same-state no-op returns early **without** audit write (role unchanged).  
3. On actual change: **one transaction** — persist role + append audit (`authz.role-change` with `fromRole` / `toRole`).  
4. Denials may emit `authz.deny` (best-effort / void path exists for some deny emitters).

### 7.3 Gaps for S03 (must not invent silently)

| Gap | Status |
| --- | ------ |
| Live-policy enable/disable `eventType` in classification catalog | **NOT FOUND** — must add classified type(s) |
| Payload keys for before/after policy | Role-change uses `fromRole`/`toRole`; no `fromPolicy`/`toPolicy` admitted today |
| ADR-020 binding field in audit payload | **OPEN** (planning W4) |
| Failed-attempt audit completeness | Mixed precedent — **PO decision** |

**Recommendation:** Reuse Security Audit product; **extend classification catalog**; do **not** create a parallel enablement audit subsystem; do **not** treat L03 financial action log as S03 storage.

---

## 8. S02 Persistence Contract

### 8.1 What S02 provides (SoT — CLOSED)

| Element | Implementation evidence |
| ------- | ----------------------- |
| Prisma model / table | `WorkspaceLivePolicyState` / `workspace_live_policy_states` |
| Domain enum | `WorkspaceLivePolicy.PAPER` \| `LIVE_POLICY_OPTED_IN` |
| Domain state | `DurableWorkspaceLivePolicyState { workspaceId, policy, schemaVersion, updatedAt }` |
| Repository port | `WorkspaceLivePolicyStateRepository` (`save` / `load` / `listAll`) |
| App service | `WorkspaceLivePolicyPersistenceService` |
| Write for S03 | **`persistPolicy({ workspaceId, policy, recordedAt? })`** |
| Read | `loadState` · `resolveEffectivePolicy` · `isOptedIn` |
| Paper seed | `ensurePaperDefault` (idempotent; does **not** overwrite opted-in) |
| Honesty helpers | `livePolicyAuthorizesLiveTrading/Admission/Execution` → **always `false`** |
| Invalid tokens | `parseWorkspaceLivePolicy` throws; never coerces to live |
| Isolation | Keyed solely by `workspaceId` |
| HTTP | **None** (PO-S02-04) |

### 8.2 Binding semantic boundary

```text
LIVE_POLICY_OPTED_IN
  = durable workspace policy opt-in ONLY
  ≠ authorization ≠ admission ≠ execution
  ≠ production readiness ≠ real-capital availability
```

S03 enable **MUST NOT**: bypass Gate · bypass Kill Switch · grant LiveCommand · create credentials · access Vault · submit/cancel orders · move capital · activate live execution.

### 8.3 S03 must NOT

- create another policy store;  
- duplicate policy state;  
- replace S02 semantics;  
- change S02 migration semantics;  
- flip honesty helpers to `true`;  
- persist values outside `{ PAPER, LIVE_POLICY_OPTED_IN }`.

---

## 9. Proposed S03 Architecture

### 9.1 Control-plane sketch (planning only)

```text
Authenticated Admin (JWT + CSRF for cookie mutations)
        ↓
@RequirePermission(RoleAdmin)   [? PO-S03-01]
        ↓
WorkspaceAccessService.isMember(workspaceId, actor.userId)
        ↓
Load prior policy via WorkspaceLivePolicyPersistenceService
        ↓
Validate transition / idempotency rule (PO-S03-03)
        ↓
Persist target policy via persistPolicy (S02 SoT)
  + append Security Audit event (catalog extension; PO-S03-04/05)
        ↓
Return honest policy response (opt-in ≠ live trading available)
```

### 9.2 Ownership

| Concern | Owner module |
| ------- | ------------ |
| HTTP Admin enable/disable | Workspace module (new controller under `workspace/` — proposed) |
| Policy SoT | Existing `workspace/live-policy/` (S02) |
| Authorization | Existing Auth (`RoleAdmin` / matrix) |
| Audit | Existing Security Audit (catalog + record) |
| Admission / execution | **Not touched** (S04 / L02+) |

### 9.3 What “Admin enabled” means

Admin successfully transitioned workspace policy to `LIVE_POLICY_OPTED_IN` under audit.  
It does **not** mean live trading is available, Gate-admitted, credentialed, or capital-ready.

---

## 10. Enable Flow

### 10.1 Proposed operation (subject to PO-S03-02)

| Aspect | Planning proposal |
| ------ | ----------------- |
| Intent | Explicit administrative **enable** |
| Target state | `LIVE_POLICY_OPTED_IN` |
| Persistence | `WorkspaceLivePolicyPersistenceService.persistPolicy({ policy: LIVE_POLICY_OPTED_IN })` |
| AuthN | Authenticated session / JWT (existing) |
| AuthZ | RoleAdmin (recommended) + workspace membership |
| Cross-workspace | Reject if actor is not member/owner of target workspace |
| Body | Prefer empty body or minimal `{ reason?: string }` — **OPEN** if reason required |
| Response | Effective policy + workspaceId + updatedAt; **no** “live trading active” language |
| Audit | On actual transition (and failed attempts per PO-S03-06) |

### 10.2 Forbidden enable side effects

Enable **MUST NOT**: call Gate · mutate KS · change Session `ExecutionMode` · grant LiveCommand · touch Vault · place/cancel orders · flip V2 flags · claim production readiness.

---

## 11. Disable Flow

### 11.1 Proposed operation (subject to PO-S03-02)

| Aspect | Planning proposal |
| ------ | ----------------- |
| Intent | Explicit administrative **disable** |
| Target state | **`PAPER`** (repository-equivalent safe state) |
| Persistence | `persistPolicy({ policy: PAPER })` |
| AuthZ | Same as enable (Admin + membership) unless PO splits (not recommended) |
| Side effects | **Policy row only** |

### 11.2 Disable MUST NOT

- alter unrelated V2 state;  
- disable unrelated workspace functionality;  
- change Paper Freeze;  
- change Gate;  
- modify Session;  
- revoke credentials (unless a **future authorized** slice explicitly requires it — **not S03**);  
- stop paper trading / archive workspace.

**PO-S03-09:** Confirm no additional disable side effects beyond returning policy to `PAPER`.

---

## 12. State Transition Model

Canonical states (S02 / PO-S02-02):

| From | To | Meaning |
| ---- | -- | ------- |
| `PAPER` | `LIVE_POLICY_OPTED_IN` | Enable (policy opt-in) |
| `LIVE_POLICY_OPTED_IN` | `PAPER` | Disable (safe default) |
| `PAPER` | `PAPER` | Repeated disable / already Paper |
| `LIVE_POLICY_OPTED_IN` | `LIVE_POLICY_OPTED_IN` | Repeated enable / already opted-in |

### 12.1 Evidence from repository precedents

| Precedent | Behavior | Relevance |
| --------- | -------- | --------- |
| `assignRoleWithMandatoryAudit` | Same role → return early; **no** audit append | Supports **idempotent success without audit** for no-ops |
| `ensurePaperDefault` | Existing row returned unchanged | Idempotent seed, not overwrite |
| `persistPolicy` today | Upserts any valid enum; **no** same-state short-circuit | S03 orchestration layer must define no-op policy |
| Paper account / connection disable | Some transitions reject already-disabled | Alternative: **reject** repeated disable |

### 12.2 Planning recommendation (not Approval)

| Transition | Recommended semantics | Audit |
| ---------- | --------------------- | ----- |
| PAPER → LIVE_POLICY_OPTED_IN | **Success** (200) | **Required** (actual change) |
| LIVE_POLICY_OPTED_IN → PAPER | **Success** (200) | **Required** (actual change) |
| PAPER → PAPER | **Idempotent success** (200) | **Skip** mutation audit (role-change precedent) **or** record no-op — **OPEN PO-S03-03** |
| LIVE_POLICY_OPTED_IN → LIVE_POLICY_OPTED_IN | **Idempotent success** (200) | Same as above — **OPEN PO-S03-03** |
| Invalid policy token | **Reject** (400) fail closed | Failed-attempt audit — **OPEN PO-S03-06** |
| Unknown / inaccessible workspace | **404** (membership pattern: no foreign leak) | Failed-attempt audit — **OPEN PO-S03-06** |
| Unauthorized actor | **403** | Prefer `authz.deny`-style record — **OPEN PO-S03-06** |

**Do not invent soft-pass.** Invalid never becomes live.

---

## 13. API Contract Proposal

### 13.1 Recommended shape (discussion baseline — PO-S03-02 OPEN)

Aligned with workspace ownership + `POST :id/archive` action-verb precedent + security-audit path-scoped workspace pattern:

```text
POST /v1/workspaces/:workspaceId/live-policy/enable
POST /v1/workspaces/:workspaceId/live-policy/disable
GET  /v1/workspaces/:workspaceId/live-policy    # optional read of effective policy
```

| Aspect | Proposal |
| ------ | -------- |
| Versioning | Nest `version: '1'` → `/v1/...` |
| Controller home | `apps/api/src/modules/workspace/` (new controller; **do not** overload archive semantics) |
| Authentication | Existing JWT (+ CSRF for cookie-auth mutations) |
| Authorization | `@RequirePermission(PermissionClass.RoleAdmin)` + membership check |
| Request body | Empty or optional `{ reason?: string }` — **OPEN** |
| Success response (sketch) | `{ workspaceId, policy, schemaVersion, updatedAt }` — honesty: policy only |
| Errors | 401 unauthenticated · 403 unauthorized · 404 unknown/inaccessible workspace · 400 invalid input · 409/500 per existing Nest mapping if needed |
| Idempotency | Per §12 / PO-S03-03 |
| Docs | Markdown API / route-ownership inventory (no Swagger generator in apps/api today) |

### 13.2 Alternatives (not selected here)

| Option | Notes |
| ------ | ----- |
| `PUT /v1/workspaces/:id/live-policy` with `{ policy }` | Desired-state upsert; one endpoint; still needs audit-on-change |
| Header `X-Workspace-Id` + `/v1/workspace-live-policy/enable` | Matches connections style; weaker path clarity for Admin audit |

**Exact path/method remains PO-S03-02 OPEN.** Recommendation above is evidence-aligned, not approved.

### 13.3 What the contract must never claim

Response/docs/UI copy **MUST NOT** say: live trading active · capital available · orders executable · production enabled · Gate passed · credentials ready.

---

## 14. Authorization Model

```text
Authentication  ≠  Authorization  ≠  Policy state  ≠  Live execution authorization
```

| Rule | Proposal |
| ---- | -------- |
| Who can enable? | Authenticated actor with **Admin role permission cell** (recommended: RoleAdmin) **and** workspace membership |
| Who can disable? | Same as enable (symmetric control plane) |
| Trader / Researcher / Reader self-serve? | **Denied** |
| AI autonomous enable? | **Denied** (no non-human Admin path; human Admin session required) |
| Cross-workspace? | **Denied** via `WorkspaceAccessService` |
| LiveCommand required for enable? | **No** (recommended) — LiveCommand remains deny-all for execution commands |
| New Admin role / hard-coded emails? | **Forbidden** |
| Membership model today | Owner-only membership — Admin who is **not** owner of workspace B cannot mutate B |

**Security implication:** Platform-wide Admin role alone is insufficient without workspace membership — same pattern as security-audit timeline.

---

## 15. Audit Model

### 15.1 Required fields for actual transitions

Every **actual** administrative policy transition must record:

| Field | Source / proposal |
| ----- | ----------------- |
| Event type | New classified type(s) — e.g. proposed `authz.workspace-live-policy-change` (**OPEN PO-S03-04**) |
| Actor identity | `AuthUser.userId` (and email only if existing audit norms allow; never secrets) |
| Workspace identity | Path `workspaceId` / attribution.workspaceId |
| Previous state | Prior `WorkspaceLivePolicy` |
| New state | Resulting `WorkspaceLivePolicy` |
| Timestamp | `occurredAt` / `recordedAt` (Security Audit record) |
| Correlation / request ID | If available on request context (existing attribution supports `correlationId`) |
| Outcome | success / denied / failed per decided model |
| ADR binding intent | Optional payload note referencing ADR-020 — **OPEN** whether mandatory |

### 15.2 Ordering (PO-S03-05)

| Option | Pros | Cons |
| ------ | ---- | ---- |
| **A. Before persistence** | Audit attempt even if persist fails | Risk of audit saying “changed” when DB did not |
| **B. After persistence** | Audit matches durable truth | Persist success + audit failure ⇒ silent change |
| **C. Transactionally with persistence** | Matches `assignRoleWithMandatoryAudit` | Requires tx support on policy save path |

**Recommendation (evidence-aligned):** **C — transactional** with persistence for **successful actual transitions**, following Identity role-change mandatory audit. If policy repository lacks tx plumbing today, S03 implementation must extend the write path to participate in `PrismaTransactionService.run` (design work under Approval — not invented as done).

**If audit persistence fails inside the transaction:** entire operation fails; policy remains unchanged (fail closed).

**If PO rejects transactional coupling:** must still define PO-S03-05 / failure semantics explicitly (prefer fail the API if audit cannot be recorded for actual changes).

### 15.3 Failed-operation auditing (PO-S03-06)

| Case | Required by existing architecture? | S03 design decision |
| ---- | ---------------------------------- | ------------------- |
| Successful transition | Yes — privilege-critical precedent | **Required** |
| Idempotent no-op | Role-change skips audit | **OPEN** — recommend skip |
| Unauthorized request | `authz.deny` precedent exists | **Recommend audit deny** |
| Invalid workspace / not member | Mixed (often 404, limited deny audit) | **OPEN** |
| Invalid policy value | N/A today | **OPEN** — recommend audit + 400 |
| Persistence failure after authz | Not strongly standardized | **OPEN** — recommend outcome=failed if partial |

Do **not** silently assume only successes matter. Mark failed-attempt policy as **PO approval required**.

---

## 16. Failure Semantics

| Failure | Proposed HTTP / behavior | Policy state | Audit |
| ------- | ------------------------ | ------------ | ----- |
| Unauthenticated | 401 | Unchanged | Per platform auth norms |
| Authenticated but not RoleAdmin (or decided cell) | 403 | Unchanged | Recommend `authz.deny` |
| Not workspace member / unknown id | 404 (no leak) | Unchanged | OPEN PO-S03-06 |
| Invalid body / policy | 400 | Unchanged | OPEN |
| Persist fails | 5xx | Unchanged | Prefer no success audit |
| Persist OK, audit fails (if non-tx) | **Must not soft-succeed** if PO requires mandatory audit | Prefer rollback or compensating fail | PO-S03-05 |
| Persist + audit in one tx; audit fails | Transaction aborts | Unchanged | No commit |
| Repeated enable/disable | Per PO-S03-03 | Unchanged on no-op | Per PO-S03-03 |

**Fail closed:** never interpret failure as `LIVE_POLICY_OPTED_IN`.

---

## 17. Workspace Isolation

### 17.1 Binding rules

1. Route/workspace id is the **only** policy key.  
2. Actor must pass `WorkspaceAccessService.isMember(workspaceId, userId)`.  
3. Admin of workspace A **cannot** change workspace B by substituting path ids.  
4. Non-member Admin role **cannot** mutate foreign workspaces (owner-membership model).  
5. Responses for foreign/unknown ids use **404** pattern (existing workspace controller / access service) — never leak foreign policy.

### 17.2 Required security tests (future implementation)

| Test | Assertion |
| ---- | --------- |
| Cross-workspace | Admin/owner of A cannot enable/disable B |
| Unauthorized role | Trader/Researcher/Reader cannot enable/disable |
| Membership | Valid Admin without ownership of B cannot mutate B |
| Path manipulation | Foreign `workspaceId` rejected |
| No self-escalation | Non-Admin cannot grant self RoleAdmin via this API (out of scope; People owns roles) |

---

## 18. Security Analysis

### 18.1 Security review questions (explicit answers)

| # | Question | Planning answer |
| - | -------- | --------------- |
| 1 | Who can enable live policy? | Authenticated Admin-authorized actor **and** workspace member (recommended: RoleAdmin + owner membership). **PO-S03-01** confirms cell. |
| 2 | Who can disable it? | Same as enable (symmetric). |
| 3 | Can one workspace affect another? | **No** — membership + workspaceId keying. |
| 4 | Can a client self-escalate? | **No** via this API — does not assign roles; does not grant LiveCommand. |
| 5 | Invalid state? | Reject / fail closed; never coerce to live. |
| 6 | Unknown workspace? | 404 / access denied pattern; no foreign leak. |
| 7 | Audit persistence fails? | Prefer transaction abort; API fails; policy unchanged. |
| 8 | Policy persist succeeds but audit fails? | **Unacceptable soft-success** if audit is mandatory — use transactional coupling (recommended) or explicit compensating failure (**PO-S03-05**). |
| 9 | Repeated enable? | Idempotent success recommended; audit-on-no-op **OPEN** (**PO-S03-03**). |
| 10 | Repeated disable? | Same. |
| 11 | Can API access bypass future Gate? | **No** — S03 must not call or weaken Gate. |
| 12 | Can API access activate credentials? | **No** — Vault out of scope. |
| 13 | Can API access cause capital movement? | **No** — no order I/O. |
| 14 | Can Admin policy change alter V2 Paper Freeze? | **No** — `paperFreeze` remains true. |
| 15 | Can Admin policy change alter Session execution mode? | **No** — Session untouched (S04). |

### 18.2 Controls S03 may consume vs must leave unchanged

| Control | S03 posture |
| ------- | ----------- |
| RoleAdmin / RolesGuard / JWT / CSRF | **Consume** |
| WorkspaceAccessService | **Consume** |
| S02 `persistPolicy` / domain enum | **Consume** |
| Security Audit record path | **Consume** (extend catalog) |
| LiveCommand matrix | **Leave deny-all** |
| Runtime Enforcement Gate | **Unchanged** (S04) |
| Kill Switch | **Unchanged** (S04) |
| Session / human-start session admission | **Unchanged** (S04) |
| Paper Freeze / `liveCapitalAuthorized` | **Unchanged** (remain true / false) |
| Honesty helpers `livePolicyAuthorizes*` | **Remain false** |
| Vault / credentials | **Out of scope** |

---

## 19. Consumer / Operator Honesty

| Claim after S03 enable | Allowed? |
| ---------------------- | -------- |
| Workspace live **policy** is opted-in | **Yes** (precise) |
| Admin enabled live policy under ADR-020 control plane | **Yes** (precise) |
| Live trading is available / on / executable | **No** |
| Capital available / production enabled | **No** |
| Orders can be submitted live | **No** |
| Gate / KS / Session admission complete | **No** (S04+) |

**Product honesty statement for S03 communications:**  
“S03 adds audited Admin enable/disable of workspace live-**policy**. It does **not** turn on live trading.”

S04 owns admission wiring honesty. L02 owns live order I/O. L04 owns operator UI.

---

## 20. S02 → S03 Contract

### 20.1 S02 provides

- Canonical Workspace-owned satellite SoT (`WorkspaceLivePolicyState`).  
- Semantic states `PAPER` / `LIVE_POLICY_OPTED_IN`.  
- Workspace-scoped persistence + Paper default / backfill.  
- Domain / repository ports including **`persistPolicy`**.  
- Fail-closed invalid parsing.  
- Honesty: policy ≠ authorization ≠ admission ≠ execution.

### 20.2 S03 consumes

- Same SoT for all reads/writes.  
- Same enum tokens.  
- Same isolation key (`workspaceId`).

### 20.3 S03 must NOT

- create another policy store;  
- duplicate / shadow state;  
- replace S02 semantics;  
- change S02 migration semantics;  
- reinterpret `LIVE_POLICY_OPTED_IN` as authorization.

```text
S02 store readiness ≠ S03 enablement authorized
S03 enablement ≠ S04 admission ≠ L02 execution
```

---

## 21. S03 → S04 Contract

### 21.1 What S04 may consume from S03/S02

| Contract element | S03 delivers | S04 may use |
| ---------------- | ------------ | ----------- |
| Current workspace policy | Durable `PAPER` / `LIVE_POLICY_OPTED_IN` via S02 ports | Admission precondition: policy opted-in **necessary but not sufficient** |
| Administrative provenance | Security Audit records of enable/disable | Investigation / evidence — **not** authorization SoT |
| Policy state lookup | Domain `resolveEffectivePolicy` / `isOptedIn` | Fail-closed if not opted-in |

### 21.2 Binding separation

```text
policy state  ≠  authorization  ≠  admission
```

S04 **MUST NOT** treat audit records as the authorization decision.  
S04 **MUST NOT** soft-pass when Gate attributes / KS / human start / credentials are incomplete.  
S03 **MUST NOT** pre-wire Gate/KS/Session.

### 21.3 Open contract questions (do not invent)

| Question | Status |
| -------- | ------ |
| Exact S04 admission attribute set including policy check shape | **OPEN** (D-ARCH-03) |
| Whether S04 requires enablement actor identity at admission time | **OPEN** |
| Whether disable during an open live session needs special handling | **OPEN** (S04 / later; out of S03) |

---

## 22. Acceptance Criteria

For a **future** S03 implementation (not authorized by this proposal). Adjusted to repository evidence; additions marked.

### 22.1 Functional / security (mapped from task AC-01…17)

| ID | Criterion |
| -- | --------- |
| **AC-01** | Authorized Admin can explicitly enable workspace live policy. |
| **AC-02** | Enable persists `LIVE_POLICY_OPTED_IN` through the S02 SoT (`persistPolicy`). |
| **AC-03** | Authorized Admin can explicitly disable workspace live policy. |
| **AC-04** | Disable persists `PAPER`. |
| **AC-05** | Unauthorized actor cannot enable or disable policy. |
| **AC-06** | Cross-workspace manipulation is rejected (no foreign leak). |
| **AC-07** | Policy transitions are validated; invalid tokens fail closed. |
| **AC-08** | Administrative policy changes produce required audit evidence. |
| **AC-09** | Audit identifies actor and workspace. |
| **AC-10** | Audit records previous and resulting policy state. |
| **AC-11** | Repeated operations have defined idempotency semantics (per PO-S03-03). |
| **AC-12** | No S04 Gate/KS/Session admission behavior is introduced. |
| **AC-13** | No credentials or execution capability are introduced; LiveCommand remains deny-all. |
| **AC-14** | Paper Freeze remains unchanged (`paperFreeze: true`). |
| **AC-15** | V2 `liveCapitalAuthorized` remains false. |
| **AC-16** | Consumer-facing semantics remain honest (enablement ≠ live trading available). |
| **AC-17** | No L02–L05 behavior is introduced. |

### 22.2 Proposed additions (mark for PO)

| ID | Criterion | Why |
| -- | --------- | --- |
| **AC-18** | Enable/disable does not mutate Session `ExecutionMode`. | Explicit Session boundary |
| **AC-19** | Honesty helpers `livePolicyAuthorizes*` remain always false. | S02 honesty preserved |
| **AC-20** | CSRF / auth guards apply to mutating Admin routes consistently with People. | Existing mutation security |
| **AC-21** | No parallel audit store; Security Audit catalog classification used. | Reuse V3-S05 |
| **AC-22** | AI / non-Admin paths cannot enable. | ADR-020 §3 |

---

## 23. Test Strategy

| Layer | Intent |
| ----- | ------ |
| AuthZ unit / HTTP | RoleAdmin allowed; Trader/Reader/Researcher denied; CSRF where applicable |
| Isolation HTTP | Owner A cannot mutate B; non-member Admin denied; 404 foreign |
| Domain orchestration | Enable/disable transitions; idempotency per PO decision; invalid reject |
| Persistence integration | `persistPolicy` writes correct enum via S02 repo |
| Audit | Actual change produces classified event with actor/workspace/from/to; mandatory-audit failure fails operation |
| Negative scope | No Gate/KS/Session/LiveCommand matrix grants; V2 anchors unchanged |
| Honesty / conformance | Inventory / platform-conformance assertions that enablement ≠ execution |
| Regression | People/role-change audit still green; S02 Paper defaults intact |

Preferred delivery shape (planning only): Workspace controller + application service coordinating S02 persistence + Security Audit, with HTTP specs modeled on `people.http.spec.ts` / workspace access tests.

---

## 24. FIV Boundary

```text
Do NOT perform FIV in this planning act.
Do NOT provision live credentials.
Do NOT call real exchanges.
Do NOT perform real-capital operations.
Do NOT claim production readiness.
```

**Future FIV (after separate authorization; not this proposal):** non-prod policy-lab enable/disable with audit verification; **no** live venue credentials; **no** live orders. Live venue FIV remains **NOT AUTHORIZED**.

S03 planning may list FIV requirements later; it **cannot** execute them.

---

## 25. Open PO Decisions

### PO-S03 OPEN DECISIONS

```text
OPEN — PO DECISION REQUIRED
Do not invent a decision in implementation without Approval.
```

| ID | Question | Evidence / recommendation | Status |
| -- | -------- | ------------------------- | ------ |
| **PO-S03-01** | Exact Admin authorization mechanism for enable/disable | Evidence: RoleAdmin (C6) for privileged Admin mutations; LiveCommand deny-all. **Recommend:** RoleAdmin + workspace membership; **do not** unbound LiveCommand. | **OPEN** |
| **PO-S03-02** | Exact API shape (paths, methods, body, optional GET) | Evidence: `POST .../archive` + path-scoped Admin timeline. **Recommend:** `POST .../live-policy/enable|disable` (+ optional GET). | **OPEN** (D-ARCH-02 / W2) |
| **PO-S03-03** | Enable/disable idempotency (success no-op vs reject) | Evidence: role-change same-state early return. **Recommend:** idempotent 200; skip mutation audit on no-op. | **OPEN** |
| **PO-S03-04** | Audit event model (eventType name, payload keys, ADR binding) | Evidence: closed Security Audit catalog; role-change `fromRole`/`toRole`. **Recommend:** new classified privilege event with from/to policy. | **OPEN** (W4) |
| **PO-S03-05** | Audit transaction ordering | Evidence: `assignRoleWithMandatoryAudit` transactional append. **Recommend:** transactional with policy persist; fail closed if audit cannot commit. | **OPEN** |
| **PO-S03-06** | Whether failed attempts require audit | Evidence: `authz.deny` exists; not universal for all 404s. **Recommend:** audit unauthorized denies; decide 404/validation cases explicitly. | **OPEN** |
| **PO-S03-07** | Exact actor identity requirements | Evidence: `AuthUser.userId` (+ role); attribution supports actorId. **Recommend:** durable `userId` mandatory; email optional per audit norms. | **OPEN** |
| **PO-S03-08** | Exact error semantics (status codes / body) | Evidence: Nest Forbidden/NotFound/BadRequest patterns. **Recommend:** 401/403/404/400 as §16; confirm conflict usage if any. | **OPEN** |
| **PO-S03-09** | Whether disabling policy has additional side effects | Evidence: S02 disable = PAPER only; credentials/Session/Gate out of scope. **Recommend:** **PAPER only** — no credential revoke, no Session/Gate/KS mutation. | **OPEN** |
| **PO-S03-10** | MFA required before enablement API in non-prod policy lab? | Slice planning: NON-BLOCKING OPEN; may defer with explicit record. MFA remains OPEN before production live activation. | **OPEN / NON-BLOCKING** |
| **PO-S03-11** | Slice ID canonicalization (`PROPOSED-V3-L01-S03` → final)? | Same as PO-S02-07 convention. | **OPEN / NON-BLOCKING** |

Where repository precedent is clear, recommendations are stated. Genuine product/architecture choices remain **OPEN**.

---

## 26. Risks

| Risk | Mitigation |
| ---- | ---------- |
| Treating enablement as live trading | Honesty AC-16; helpers remain false; docs language |
| Unbounding LiveCommand “for convenience” | Explicit exclusion; AC-13; PO-S03-01 |
| Dual policy stores | Consume S02 SoT only |
| Soft-success without audit | PO-S03-05 transactional mandatory audit |
| Cross-tenant enable via path param | Membership gate + isolation tests |
| Scope creep into S04/L02 | Hard exclusions; AC-12/17 |
| Operator UI claiming “live on” | No L04; AC-16 |
| Failed-attempt blind spot | PO-S03-06 explicit decision |
| Silent ADR OPEN closure | §25 list; no inventing MFA/Gate attrs |

---

## 27. Recommendation

**Overall S03 Planning Proposal verdict: READY FOR REVIEW**

| Perspective | Verdict | Notes |
| ----------- | ------- | ----- |
| **Developer** | **PASS** (for planning) | Clear S02 consume path; Auth + Security Audit reuse; OPEN items listed |
| **Consumer / Operator** | **PASS** (for planning) | Enablement ≠ live available; Paper remains default for non-opted |
| **Security** | **PASS** (for planning) | RoleAdmin + membership; no Gate/KS/credential/LiveCommand unbound; fail-closed |

**Recommended next gate:** PO / Chief Architect Planning Review of this proposal → resolve PO-S03-01…09 (blocking) → Individual Slice Approval for **PROPOSED-V3-L01-S03** only → then implementation.

```text
READY FOR REVIEW ≠ APPROVED FOR IMPLEMENTATION
```

---

## 28. Governance Gate

```text
This artifact is a planning proposal only.
S03 implementation requires explicit PO / Chief Architect
Planning Review + Slice Approval.
```

Lifecycle:

```text
S02 CLOSED (done)
        ↓
S03 Individual Planning Proposal (this artifact) — PROPOSED
        ↓
S03 Planning Review / PO Slice Approval  ← NEXT
        ↓
S03 implementation (Admin enable/disable + audit only)
        ↓
S03 PO Review / Close
        ↓
S04 …
```

### Explicit non-authorizations

This proposal does **NOT** authorize:

- S03 implementation  
- Admin enable/disable endpoints  
- Security Audit catalog mutation  
- Prisma / migration changes for S03 (none required for policy SoT; catalog may need data/code — only after Approval)  
- Gate / KS / Session live wiring  
- LiveCommand grants  
- credentials / real capital / FIV / production release  
- silent resolution of §25 OPEN items  
- modification of S01/S02 closed artifacts or ADR-020  
- S04 or L02–L05 work  

```text
PROPOSED ≠ APPROVED FOR IMPLEMENTATION
ADMIN ENABLED POLICY ≠ LIVE AUTHORIZATION
POLICY ≠ ADMISSION ≠ EXECUTION
```

---

## STOP

**STOP.** PROPOSED-V3-L01-S03 Planning Proposal produced.  
Status: **PROPOSED — NOT APPROVED FOR IMPLEMENTATION.**  
Do **not** implement. Do **not** create endpoints. Do **not** mutate audit catalog. Do **not** start S04. Do **not** perform FIV. Do **not** enable live capital.  
Await PO / Chief Architect Planning Review.
