# V3-L01-S02 Planning Proposal

**Document:** PROPOSED-V3-L01-S02 Individual Slice Planning Proposal
**Date:** 2026-09-17
**Package:** V3-L01 — Live capital ADR + workspace policy (LT-01)
**Wave:** 6 — Live Trading
**Nature:** Individual slice planning proposal only. **Not** S02 implementation approval. **Not** implementation. **Not** schema/migration. **Not** enablement API. **Not** FIV. **Not** live-capital activation. **Not** an ADR. **Not** a Master Plan / Roadmap revision.
**Authority:** Planning Engineer / Solution Architect under PO / Chief Architect governance lifecycle
**Preceded by:** V3-L01-S01 Final Close — **CLOSED** ([`v3-l01-s01-final-close.md`](./v3-l01-s01-final-close.md))
**Slice planning approval (package):** [`v3-l01-slice-approval.md`](./v3-l01-slice-approval.md)
**ADR:** [`docs/adr/ADR-020-live-capital.md`](../../../adr/ADR-020-live-capital.md)

```text
PROPOSED — NOT APPROVED FOR IMPLEMENTATION

This artifact is a planning proposal only.
S02 implementation requires explicit PO / Chief Architect Slice Approval
after Planning Review of this proposal.
```

Protected dirty/untracked leftovers outside this new artifact were **not** modified.

---

## 1. Scope

### 1.1 Slice identity

| Field | Value |
| ----- | ----- |
| **Proposed Slice ID** | **PROPOSED-V3-L01-S02** |
| **Name** | Workspace live-policy persistence & paper defaulting |
| **Package** | V3-L01 |
| **Position** | Second slice in approved order S01 → S02 → S03 → S04 |
| **Type** | Persistence-foundation (policy store + Paper defaulting) |

**Do not silently canonicalize or rename** this ID in this act. Canonical rename remains **OPEN** if repository convention later requires it.

### 1.2 Intended planning scope (after separate Approval)

S02 is intended to define and, after separate Approval, implement the **workspace-level live-policy persistence state** required by ADR-020 §2, with **Paper as the canonical default**, without enabling live trading.

S02 **MAY** eventually cover (implementation only after Slice Approval):

- persistence of workspace live-policy state;
- canonical workspace ownership of that state;
- Paper default semantics;
- migration/backfill if required;
- persistence-level validation / fail-closed invalid-state handling;
- tests proving safe default behavior.

### 1.3 Hard exclusions (binding)

S02 **MUST NOT** cover:

| Exclusion | Belongs to |
| --------- | ---------- |
| Admin enable/disable API | **S03** |
| Enablement authorization / permission-matrix mutation for enablement | **S03** |
| Enablement audit implementation | **S03** |
| Runtime Enforcement Gate live admission wiring | **S04** |
| Kill Switch live wiring | **S04** / later |
| Session live-mode productization | **S04** |
| Live adapter / order submit / cancel | **L02** |
| Real capital / credentials / Vault mutation | Ops / later |
| Live operator UI | **L04** |
| L02 / L03 / L04 / L05 | Separate packages |
| Live-capital activation / FIV / production release | Separate gates |

**S02 must not create a mechanism that allows live trading by itself.**

### 1.4 Planning objective

Answer the mechanism questions for D-ARCH-02 / ADR-020 workspace mechanics **as a proposal for PO / Chief Architect review**, grounded in repository evidence — without inventing silent decisions or shipping code.

---

## 2. Current governance state

Do **not** reinterpret these states:

| Item | Status |
| ---- | ------ |
| Wave 6 Planning | **APPROVED** |
| ADR-020 | **ACCEPTED** |
| D-GOV-05 | **GRANTED** (wave-level; package/slice gates remain) |
| V3-L01 Package Planning | **APPROVED** |
| V3-L01 Slice Planning | **APPROVED** (S01 → S02 → S03 → S04 decomposition) |
| V3-L01-S01 | **CLOSED** |
| **V3-L01-S02** | **NOT APPROVED FOR IMPLEMENTATION** |
| S03 / S04 | **NOT APPROVED** |
| L02–L05 | **NOT AUTHORIZED** |
| Live capital activation | **NOT AUTHORIZED** |
| Production release | **NOT AUTHORIZED** |
| FIV | **NOT AUTHORIZED** |
| Wave 5 | **NOT COMPLETE** / **NOT CLOSED** |

```text
This planning proposal ≠ S02 Slice Approval
S02 Slice Approval ≠ live ready
Persisted policy ≠ authorization ≠ execution
```

---

## 3. Repository reconnaissance

### 3.1 Method

Inspected authoritative Wave 6 / S01 / ADR-020 artifacts, then searched the repository for workspace models, settings, policy persistence, feature flags, Prisma schema, migrations, paper/live terminology, certification policy, admin configuration, audit, authorization, default-value patterns, and workspace settings APIs.

### 3.2 Authoritative findings (current truth)

| Surface | Evidence | Finding |
| ------- | -------- | ------- |
| Workspace aggregate | `apps/api/src/modules/workspace/workspace.ts` | Fields: `id`, `name`, `ownerUserId`, `status`, `createdAt` only |
| Prisma `WorkspaceRecord` | `apps/api/prisma/schema.prisma` | Columns: `id`, `name`, `owner_user_id`, `status`, `created_at`, `updated_at` — **no live-policy field** |
| Workspace create/bootstrap | `workspace-domain.service.ts` | New workspaces get `WorkspaceStatus.Active`; **no** trading-mode / live-policy field |
| Workspace isolation | `workspace-access.service.ts` | Owner membership gate; cross-workspace IDs denied |
| Session `ExecutionMode` | `trading-session-aggregate.ts` | `PAPER \| LIVE` enum exists; **session** substrate, not workspace policy |
| V2 anchors | `v2-certification-checklist.ts` / `v2-compatibility-matrix.ts` | `liveCapitalAuthorized: false`; `paperFreeze: true` |
| S01 inventory | `v3-l01-s01-live-capital-policy-inventory.ts` + md | Explicit absence of workspace live-policy; owner = workspace; S02 owns persistence |
| Feature flags / workspace settings model | Search | **No** dedicated workspace settings / feature-flag store for live policy found |
| Admin enablement API for live policy | Search | **Absent** (planned S03) |
| Audit of live-policy enablement | Search | **Absent** (planned S03) |

### 3.3 Closest durable precedents (workspace-scoped satellite tables)

| Precedent | Owner | Pattern |
| --------- | ----- | ------- |
| `WorkspaceKillSwitchState` | trading-session (W3-O04-b) | Separate table; PK = `workspace_id`; safe boolean `@default(false)`; `schema_version`; persistence-only slice |
| `WorkspaceMonitoringHealthState` | security platform | Separate table; PK = `workspace_id`; schema version |
| `Workspace*ExchangeConnectivityState` | exchange adapter | Separate table; PK = `workspace_id`; no synthetic “connected = authorized” |
| Notification anchors (W5-N##-b) | notification-delivery | Separate workspace-scoped tables; persistence-only before runtime wiring |

**Pattern summary:** Lean `WorkspaceRecord` for identity/lifecycle; durable workspace-scoped **policy/operational state** lives in **satellite tables**, often introduced by persistence-only slices that do not yet wire consumers.

### 3.4 Paper default precedents (non-workspace)

Several non-workspace models use `mode String @default("paper")` (e.g. `StrategyDeployment`). This reinforces Paper-as-safe-default culture but is **not** the workspace live-policy store and must not be overloaded as the S02 location.

---

## 4. Existing patterns discovered

| Pattern | Repository evidence | Implication for S02 |
| ------- | ------------------- | ------------------- |
| Lean tenant aggregate | `WorkspaceRecord` identity/lifecycle only | Do **not** overload `status` (`Active`/`Archived`) as live policy |
| Satellite persistence | KS / monitoring / connectivity / notification anchors | Prefer a **new workspace-owned satellite table** over inventing a second tenant aggregate |
| Safe defaults | KS `armed Boolean @default(false)` | Any new durable flag must default to the **non-live** / Paper-safe value |
| Persistence-only slices | W3-O04-b, W4-E##-b, W5-N##-b | S02 may ship store + defaults **without** Admin API / Gate / Session consumers |
| Fail-closed invalid enum/status | `PrismaWorkspaceRepository.toDomain` rejects unsupported `status` | Invalid live-policy values must fail closed (never interpret as live) |
| Deny-all live command | `PermissionClass.LiveCommand` denied for all roles | S02 must not open enablement authorization |
| Honesty anchors | S01 inventory + V2 flags | S02 must not flip `liveCapitalAuthorized` / weaken `paperFreeze` |
| No duplicate concept | No existing live-policy column/API | Persistence is greenfield on Workspace owner; do not reuse Session `ExecutionMode` as workspace policy |

---

## 5. Proposed canonical persistence location

### 5.1 Answers to planning questions A–B

**A. Canonical workspace-level object that should own the live-policy state**

- **Owner module:** `apps/api/src/modules/workspace/` (S01 inventory owner map — binding).
- **Tenant identity:** existing `Workspace` / `WorkspaceRecord` aggregate.
- **Durable store (recommended):** a **new satellite Prisma model** owned by the Workspace module, keyed by `workspaceId`, following W3-O04-b / W4 / W5 satellite-table precedent.

**B. Does an existing workspace/settings model already provide the correct location?**

- **No.** There is no workspace settings / live-policy / feature-flag model that already represents ADR-020 workspace live opt-in.
- `WorkspaceRecord.status` is lifecycle only (`Active` | `Archived`) — **must not** be overloaded.
- Session `ExecutionMode` is session-scoped admission substrate (S04) — **must not** become the workspace policy SoT.
- V2 conformance flags are platform certification anchors — **must not** become per-workspace policy.
- Connection / Vault / exchange connectivity state represents connectivity — **connectivity ≠ authorization**.

### 5.2 Recommended location (planning recommendation)

| Aspect | Recommendation | Classification |
| ------ | -------------- | -------------- |
| Owner | Workspace module | Resolved by S01 inventory + slice approval |
| Aggregate identity | Existing `Workspace` / `WorkspaceRecord` | Resolved by repository evidence |
| Persistence vehicle | **New satellite table** under Workspace ownership (proposed family name: `WorkspaceLivePolicyState` / `workspace_live_policy_states`) | **Requires concrete S02 design decision** (D-ARCH-02) |
| Column on `WorkspaceRecord` | **Not preferred** — breaks lean-identity + satellite-state convention | Alternative only if PO explicitly selects it |
| Separate tenant aggregate | **Forbidden** by S01 honesty (“do not invent a second tenant aggregate”) | Binding |

Exact Prisma model name, column names, and enum tokens remain **OPEN** until PO / Chief Architect Planning Review / Slice Approval accepts a concrete design (see §17 / §22). This proposal recommends the satellite-table approach as the evidence-aligned default.

---

## 6. Proposed state model

### 6.1 What exact state needs to be persisted for S02? (Question C)

S02 needs a **per-workspace durable policy value** representing ADR-020 §2 opt-in posture only:

| Conceptual value | Meaning | Does it authorize live capital? | Does it enable venue execution? |
| ---------------- | ------- | ------------------------------- | ------------------------------- |
| **PAPER** (canonical default) | Workspace is paper-bound | **No** | **No** |
| **LIVE_POLICY_OPTED_IN** (proposed label only) | Workspace has durable live-policy opt-in recorded | **No** (still needs S03+ gates, Gate, KS, credentials, L02, activation) | **No** |

Exact persisted token names / storage type (`String` enum vs `Boolean liveOptIn @default(false)`) are **OPEN — PO DECISION REQUIRED** (W1 / D-ARCH-02). Either representation must preserve:

```text
policy PAPER  = default / safe
policy LIVE_POLICY_OPTED_IN  ≠ authorization ≠ execution
```

### 6.2 Minimal durable fields (planning sketch — not schema approval)

Aligned with satellite precedent; **not** invented as final schema:

| Field (conceptual) | Purpose | S02 requirement |
| ------------------ | ------- | --------------- |
| `workspaceId` (PK) | Workspace ownership / isolation | Required |
| Policy value (Paper-defaulting) | Opt-in/off posture | Required |
| `schemaVersion` | Forward compatibility | Strongly recommended (KS/anchor precedent) |
| `updatedAt` | Durability metadata | Strongly recommended |
| Enablement actor / ADR binding / audit columns | Enablement audit | **OUT OF S02** → **S03** |
| Gate / Session / KS admission fields | Admission | **OUT OF S02** → **S04** |
| Credentials / venue identifiers | Secrets / live I/O | **OUT OF S02** |

### 6.3 Distinctions (Questions G–I)

| Distinction | S02 treatment |
| ----------- | ------------- |
| **Persisted policy vs live authorization** | Policy row is **not** authorization. Authorization remains Admin+ADR enablement (S03), Gate, KS, human start, credentials, and separate activation gates. |
| **Persisted policy vs execution** | Policy row **never** submits orders. Execution remains L02+ after admission. |
| **connectivity ≠ authorization** | Do not store or derive policy from exchange connectivity / notification connectivity. |
| **enablement ≠ execution** | S02 has **no** enablement API; even a future opted-in value is not execution. |
| **policy ≠ execution** | Binding honesty inherited from S01 / ADR-020. |

### 6.4 State explicitly OUTSIDE S02 (Question F)

- Admin enable/disable write path and authorization
- Enablement audit records
- Runtime Enforcement Gate attribute wiring
- Kill Switch live admission wiring
- Session live-mode changes / `ExecutionMode` productization
- Live adapter, orders, credentials, UI
- Flipping `liveCapitalAuthorized` or weakening `paperFreeze`
- Any claim that live trading is available

---

## 7. Paper default semantics

### 7.1 Canonical Paper default (Question D)

**Canonical default = Paper.**

Binding sources: ADR-020 §1 / §2; V3-L01 package/slice approvals; S01 honesty baseline; V2 `paperFreeze: true`.

Operational meaning for S02:

1. Every workspace without an explicit durable live opt-in is **paper-bound**.
2. New workspaces are born paper-bound.
3. Existing workspaces remain paper-bound after S02.
4. Missing / null / absent policy **must not** be interpreted as live opt-in.
5. Invalid / corrupted policy **must not** be interpreted as live opt-in (fail closed toward Paper / reject-as-invalid for any live interpretation).
6. Persisting Paper (or absence-as-Paper) **does not** claim live trading is off because it was never on — it preserves the safe default.

### 7.2 What S02 does **not** change

- Paper Freeze platform posture remains.
- `liveCapitalAuthorized` remains `false`.
- No operator-facing “live available” messaging.
- No Session / Gate / KS behavior change in S02.

---

## 8. Existing-workspace behavior

### 8.1 Answers to Question E

| Case | Required behavior |
| ---- | ----------------- |
| **Newly created workspace** | Created paper-bound. Create path must not set live opt-in. If a policy row is written at create time, value must be Paper/safe-default. If no row is written, absence must resolve to Paper. |
| **Existing workspace** | Remains paper-bound after migration. Migration/backfill must **never** set live opt-in. |
| **Workspace with no explicit live-policy value** | Resolve as **Paper**. Absence ≠ live. |
| **Corrupted / invalid policy state** | Fail closed: treat as **not live-opted** (Paper-equivalent for any live interpretation); reject invalid values in domain mapping (precedent: unsupported Workspace `status` throws). Do **not** coerce unknown → live. |

### 8.2 Absence vs explicit Paper row

Two safe strategies exist (selection is a migration design decision — see §10 / §22):

| Strategy | Meaning | Safety |
| -------- | ------- | ------ |
| **A. Absence-as-Paper** | No row ⇒ Paper | Safe; matches “missing cannot activate live” |
| **B. Explicit Paper backfill** | Migration inserts Paper for all existing workspaces | Safe; clearer for S03 readers; denser data |

Both are Paper-safe. Choosing A, B, or A+B hybrid is **OPEN — PO / Architecture decision** (W5), not silently fixed here beyond the binding rule that **live must never be the migration default**.

---

## 9. Invalid / missing-state behavior

| Condition | Required interpretation | Live opt-in? |
| --------- | ----------------------- | ------------ |
| Row missing | Paper | **No** |
| Null policy field (if nullable design selected) | Paper | **No** |
| Explicit Paper | Paper | **No** |
| Explicit live-policy opt-in value | Policy opted-in only | Still **≠** authorization / execution |
| Unknown / garbage / unsupported token | Fail closed (reject or Paper-equivalent for live interpretation) | **No** |
| Partial / schemaVersion unsupported | Fail closed per domain rules | **No** |

**Rule:** Any ambiguity about whether a workspace is live-opted must resolve to **not live-opted**. Soft-pass is forbidden.

---

## 10. Migration / backfill analysis

### 10.1 Is a schema change required?

**Yes (for the recommended design).** S01 verified absence of any live-policy field. Instantiating workspace live-policy persistence requires a new durable store (recommended: new satellite table + Prisma model + migration).

If PO instead selected “no schema yet / docs-only,” that would **not** meet approved S02 planning scope (persist per-workspace live opt-in/off). Docs-only is **rejected** for S02 implementation intent.

### 10.2 Migration requirements (planning)

| Topic | Requirement |
| ----- | ----------- |
| Exact migration | Add satellite table (or PO-approved alternative); **no** enablement API |
| Default value | Paper-safe only (`PAPER` / `false` / equivalent) — **never** live |
| Backfill | Either absence-as-Paper or explicit Paper rows; **never** live opt-in backfill |
| Nullable vs non-nullable | Prefer non-null Paper-safe default if a column exists; if nullable, null ≡ Paper |
| Existing workspaces | Remain paper-bound |
| New workspaces | Paper-bound at create |
| Deployment ordering | Schema migrate → app code that understands Paper default → **no** S03 enablement in same act |
| Rollback | Drop satellite table / unused column only if no live-opted rows exist (expected at S02); see §20 |

### 10.3 Forbidden migration behaviors

- `@default(true)` / default live / default opted-in
- Backfilling live from connectivity, Session history, or feature guesses
- Flipping V2 readiness flags in the same migration
- Creating Admin routes as part of migration

---

## 11. Security analysis

### 11.1 Verification matrix

| Check | S02 planning assessment |
| ----- | ---------------------- |
| Paper remains safe default | **Required** — binding |
| Missing policy cannot become implicit live authorization | **Required** — absence/null ⇒ Paper |
| Persistence cannot bypass Runtime Enforcement Gate | **Preserved** — S02 does not wire Gate |
| Persistence cannot bypass Kill Switch | **Preserved** — S02 does not wire KS |
| Workspace policy cannot itself authorize real capital | **Required honesty** — policy ≠ authorization |
| Invalid policy fails closed | **Required** |
| Tenant/workspace isolation preserved | **Required** — PK/workspace scoping; no cross-workspace reads/writes |
| No secret/credential storage introduced | **Required** — Vault untouched |
| No unnecessary sensitive financial data | **Required** — policy enum/flag only |
| Migration cannot accidentally enable live policy | **Required** — Paper-only defaults/backfill |
| Existing authorization boundaries intact | **Required** — no LiveCommand matrix change; no Admin enablement |

### 11.2 Security questions requiring explicit decision

| # | Question | Status |
| - | -------- | ------ |
| SQ-1 | Exact storage representation (boolean vs string enum) for opt-in | **OPEN — PO DECISION REQUIRED** (with Architecture) |
| SQ-2 | Absence-as-Paper vs explicit Paper backfill | **OPEN — PO DECISION REQUIRED** (Architecture/Security input) |
| SQ-3 | Whether domain layer throws vs coerces on invalid tokens | **Proposed:** throw/reject invalid (fail closed); confirm at Approval |
| SQ-4 | Whether any read API is exposed in S02 | **Proposed:** none / internal-only; public/Admin read-write deferred to S03 — **OPEN if PO wants a read probe** |

No credential path, no Gate soft-pass, no KS bypass is proposed.

---

## 12. Consumer / operator analysis

### 12.1 Honesty rules (binding)

After a future approved S02 implementation:

- Paper remains the default experience.
- A persisted policy row is **not** proof of live activation.
- A persisted policy row is **not** proof of authorization.
- A persisted policy row is **not** proof of execution capability.
- S02 must create **no** user-facing claim of live trading.
- S02 must not design or ship L04 UI.

### 12.2 What an operator would actually observe after S02

| Observable | Expected |
| ---------- | -------- |
| Trading UI | Unchanged (still paper / live routes hidden or redirected as today) |
| Live trading availability messaging | **None** introduced by S02 |
| Ability to enable live via Admin UI/API | **Still absent** (S03) |
| Ability to submit live orders | **Still absent** (L02+) |
| Workspace create/bootstrap | Still creates ordinary workspaces; paper-bound |
| Internal durability | DB may contain new satellite table / Paper defaults — **not** an operator product promise |

**Product honesty statement for S02 communications:**
“S02 adds durable workspace paper/live-**policy storage defaults**. It does **not** turn on live trading.”

---

## 13. Developer / architecture analysis

| Topic | Assessment |
| ----- | ---------- |
| Canonical ownership | Workspace module; no second aggregate |
| Data model | New satellite table recommended; lean `WorkspaceRecord` preserved |
| Schema compatibility | Additive migration; existing workspace APIs remain valid |
| Migration complexity | Low–moderate (one table + domain mapping + tests); similar to W3-O04-b |
| Backward compatibility | Absence/Paper resolution keeps pre-S02 behavior for all consumers |
| Repository conventions | Matches persistence-only satellite slices |
| Testing strategy | Domain default tests + migration/default tests + honesty regression (V2 flags) |
| Rollback | Additive table drop if unused; see §20 |
| Future S03 compatibility | Store must be readable/writable later by audited Admin enablement without redesigning ownership |
| Future S04 compatibility | Admission consumers will **read** policy; S02 must not invent Gate attributes |
| Premature S03/S04 | Explicitly excluded |

**Developer rule:** Implement persistence foundation only. Do not wire enablement, Gate, KS, Session, UI, or credentials.

---

## 14. S01 → S02 contract

S01 is **CLOSED**. This proposal does **not** modify S01 artifacts.

### 14.1 S01 surfaces S02 now instantiates

| S01 surface | S02 action |
| ----------- | ---------- |
| `own-workspace-live-policy` (Workspace owner) | Instantiate persistence on this owner |
| `state-workspace-live-policy-absent` | Replace **absence** with durable Paper-defaulting store (after Approval) |
| `persist-candidate` / `out-s02-workspace-persistence` | Become in-scope for S02 implementation (still gated) |
| Honesty vocabulary | Inherit unchanged |

### 14.2 S01 surfaces that remain future

| Surface | Remains |
| ------- | ------- |
| Auth LiveCommand enablement path | **S03** |
| Gate live admission | **S04** |
| Session live-mode productization | **S04** |
| KS live wiring | **S04** / later |
| Live adapter / credentials / L02–L05 | Out of L01 S02 |

### 14.3 Inherited honesty rules

- Capability inventory ≠ activation
- Connectivity ≠ authorization
- Enablement ≠ execution
- Paper remains default
- `liveCapitalAuthorized` must remain `false`
- `paperFreeze` must remain `true`
- No claim that live trading is available

### 14.4 Assumptions S02 must NOT make

- That undocumented live-policy fields already exist
- That Session `ExecutionMode.LIVE` means workspace live policy
- That connectivity / notification anchors imply live authorization
- That persisting opt-in authorizes capital
- That S03/S04/L02 are in scope
- That S01 Final Close authorized S02 implementation (it did not; S01 close ≠ S02 approval)

---

## 15. S02 → S03 contract

Minimal contract S02 should expose for later S03 (do **not** implement S03):

| Contract element | S02 provides | S03 may later |
| ---------------- | ------------ | ------------- |
| Persistent state | Per-workspace live-policy posture exists (Paper default) | Read current posture; write enable/disable under Admin+ADR |
| Location | Workspace-owned satellite store (recommended) | Same SoT — no second policy source |
| Default behavior | Missing/null/invalid ⇒ not live-opted (Paper) | Must preserve fail-closed reads |
| Valid values | Paper + live-policy-opted-in (exact tokens TBD at Approval) | Only these values; audited transitions |
| Invalid-value behavior | Fail closed / reject | Must not soft-pass |
| Read/write for S03 | Internal repository/domain port suitable for later Admin path | Add authorized mutating API + audit **in S03** |
| What S02 does **NOT** authorize | Enablement, audit schema, LiveCommand grants, UI | S03 owns those decisions under its own Approval |

```text
S02 store readiness ≠ S03 enablement authorized
S03 enablement ≠ S04 admission ≠ L02 execution
```

---

## 16. Explicit exclusions

Reconfirmed:

1. Admin enable/disable API
2. Enablement authorization / MFA / role-matrix expansion
3. Enablement audit implementation
4. Runtime Enforcement Gate wiring
5. Kill Switch live wiring
6. Session live-mode changes
7. Live adapter / order I/O
8. Credentials / Vault mutation
9. Live operator UI (L04)
10. L02–L05 packages
11. Live-capital activation / FIV / production release
12. Silent closure of ADR-020 OPEN items outside S02 persistence mechanics

---

## 17. ADR-020 OPEN items relevant to S02

| ADR-020 / register topic | Relevance to S02 | Classification |
| ------------------------ | ---------------- | -------------- |
| Exact workspace policy / mode mechanics (W1; D-ARCH-02) | **Core of S02** | **Requires a concrete S02 design decision** at Planning Review / Slice Approval — proposed: Workspace-owned satellite table + Paper default |
| Migration / defaulting for existing workspaces (W5) | **Core of S02** | **Requires a concrete S02 design decision** — binding constraint: remain Paper; strategy A/B still **OPEN — PO DECISION REQUIRED** |
| Enablement / disablement API shape (W2) | Related but out of S02 | **Remains intentionally OPEN** for **S03** |
| Audit field schema (W4) | Related but out of S02 | **Remains intentionally OPEN** for **S03** |
| Structural paper↔live separation (W3) | Partial | **Resolved in part by existing precedent** (satellite policy store ≠ UI-only) for persistence layer; full admission separation remains **S04** / later |
| MFA / UX (W6) | Not S02 | **Remains intentionally OPEN** (S03 / production activation) |
| Role matrix beyond Admin (W7) | Not S02 | **Remains intentionally OPEN** |
| REG live admission attributes (D-ARCH-03) | Not S02 | **Remains intentionally OPEN** for **S04** |
| Session live-mode detail (D-ARCH-04) | Not S02 | **Remains intentionally OPEN** for **S04** |
| Kill Switch live runbook | Not S02 | **Remains intentionally OPEN** |
| L03 / L04 / L05 / RK-03 / SEC-16 / FIV venue / recovery / secret-type / release checklist / numeric thresholds / leverage | Not S02 | **OUT OF SCOPE** / **OPEN elsewhere** |
| Slice ID canonicalization | Non-blocking | **OPEN** — keep PROPOSED ID until separate act |

**No OPEN item is silently closed by this proposal.**
Where S02 needs a decision to proceed to implementation, it is listed in §22 as **OPEN — PO DECISION REQUIRED**.

---

## 18. Acceptance criteria

For a **future** S02 implementation (not authorized by this proposal):

### 18.1 Functional

| ID | Criterion |
| -- | --------- |
| F-01 | Canonical workspace-owned durable live-policy persistence exists (approved location). |
| F-02 | Canonical Paper default is enforced for new workspaces. |
| F-03 | Existing workspaces remain paper-bound after migration/backfill. |
| F-04 | Missing / null policy resolves as Paper (not live). |
| F-05 | Invalid policy fails closed (not live). |
| F-06 | Migration/backfill never writes live opt-in as default. |
| F-07 | No Admin enable/disable API shipped in S02. |
| F-08 | No Gate / KS / Session live admission wiring shipped in S02. |

### 18.2 Security

| ID | Criterion |
| -- | --------- |
| S-01 | No implicit live authorization from missing policy. |
| S-02 | No Runtime Enforcement Gate bypass. |
| S-03 | No Kill Switch bypass. |
| S-04 | Workspace isolation preserved on policy store. |
| S-05 | Fail-closed invalid/missing state. |
| S-06 | No credential / Vault path introduced. |
| S-07 | `V2_READINESS.liveCapitalAuthorized` remains `false`. |
| S-08 | Compatibility `paperFreeze` remains `true`. |

### 18.3 Architecture

| ID | Criterion |
| -- | --------- |
| A-01 | Single canonical persistence location under Workspace ownership. |
| A-02 | No duplicate policy SoT (no Session/flag/V2 overload). |
| A-03 | Compatible with later S03 read/write without ownership redesign. |
| A-04 | Compatible with later S04 read for admission without implementing S04. |
| A-05 | No L02–L05 implementation. |

### 18.4 Consumer

| ID | Criterion |
| -- | --------- |
| C-01 | Honest Paper default preserved in product claims. |
| C-02 | No false live availability messaging from S02. |
| C-03 | Persisted policy not represented as execution capability. |

### 18.5 Testing

| ID | Criterion |
| -- | --------- |
| T-01 | Unit/domain tests for Paper default. |
| T-02 | Tests: absence/null cannot activate live interpretation. |
| T-03 | Invalid-state tests (fail closed). |
| T-04 | Migration/default tests if schema ships. |
| T-05 | Regression: V2 liveCapitalAuthorized / paperFreeze anchors. |
| T-06 | Regression: no enablement API / Gate / KS / Session live wiring introduced. |

---

## 19. Test strategy

| Layer | Intent |
| ----- | ------ |
| Domain / model tests | Paper default; valid value set; invalid rejected; absence ⇒ Paper |
| Repository / Prisma adapter tests | Round-trip; workspaceId isolation; default column behavior |
| Migration tests (if applicable) | Existing rows paper-bound; default not live; rollback path documented |
| Conformance / honesty tests | S01 honesty inheritance; V2 anchors unchanged; `authorizes* === false` style guards if inventory updated carefully **without rewriting S01 closed meaning** |
| Negative scope tests | Assert no new Admin enable routes; no Gate/KS/Session live wiring files introduced by S02 |

Preferred delivery shape (planning only): follow persistence-only precedents (W3-O04-b style domain + repository + specs). Exact filenames TBD at implementation Approval.

---

## 20. Rollback strategy

| Scenario | Strategy |
| -------- | -------- |
| S02 shipped additive empty/Paper-only store; no live-opted rows | Roll back by reverting app code; optionally drop unused satellite table in a follow-up migration |
| Partial deploy (schema up, app down) | DB defaults remain Paper-safe; no live activation path exists without S03+ |
| Need to abandon representation | Do not leave ambiguous dual SoTs; remove unused store rather than invent a second policy source |
| After accidental live-opted values (should be impossible in S02) | Treat as incident; fail closed; S03 enablement path must not exist yet — still **OPEN** operational runbook beyond S02 |

**Binding:** Rollback must not require “disable live trading” product actions for S02, because S02 must not have enabled live trading.

---

## 21. Risks

| Risk | Mitigation |
| ---- | ---------- |
| Overloading `WorkspaceRecord.status` or Session `ExecutionMode` as policy | Explicit exclusion; satellite-table recommendation |
| Migration default accidentally live | Paper-only defaults; migration review checklist; tests |
| Treating persisted opt-in as authorization | Honesty criteria C-* / S-*; S03/S04 gates remain |
| Shipping enablement API inside S02 | Hard exclusions + acceptance F-07 |
| Dual policy sources | Single Workspace-owned SoT rule |
| Scope creep into S03 audit / S04 admission | Explicit-out tables |
| Silent ADR OPEN closure | §17 classifications; §22 PO list |
| Operator misread of DB table as “live on” | Consumer honesty language; no UI |

---

## 22. OPEN questions requiring PO decision

| ID | Question | Why blocking / needed | Notes |
| -- | -------- | --------------------- | ----- |
| **PO-S02-01** | Approve satellite-table persistence under Workspace ownership as the canonical store (vs column on `WorkspaceRecord`)? | D-ARCH-02 / W1 | Recommendation: **satellite table** |
| **PO-S02-02** | Exact representation: boolean `liveOptIn` default `false` vs string enum `PAPER` / `LIVE_POLICY_OPTED_IN` (tokens TBD)? | D-ARCH-02 / W1 | Both Paper-safe if default non-live |
| **PO-S02-03** | Existing workspaces: absence-as-Paper only, explicit Paper backfill, or both? | W5 migration | Never live backfill |
| **PO-S02-04** | May S02 include any read-only internal/admin probe API, or persistence + domain ports only? | Scope boundary vs S03 | Recommendation: **ports only** (no enablement API) |
| **PO-S02-05** | Confirm invalid token handling: throw/reject (preferred) vs coerce-to-Paper with structured log? | Fail-closed semantics | Recommendation: **reject invalid**; treat as not live-opted for any live interpretation |
| **PO-S02-06** | Exact Prisma model / table / column names | Implementation naming | Do not invent as authoritative until Approval |
| **PO-S02-07** | Slice ID canonicalization (`PROPOSED-V3-L01-S02` → final ID)? | Non-blocking for planning | Keep PROPOSED until separate act |

```text
OPEN — PO DECISION REQUIRED
Do not invent a decision in implementation without Approval.
```

---

## 23. Slice Approval Gate

```text
This artifact is a planning proposal only.
S02 implementation requires explicit PO / Chief Architect
Planning Review + Slice Approval.
```

Lifecycle:

```text
S01 CLOSED (done)
        ↓
S02 Individual Planning Proposal (this artifact) — PROPOSED
        ↓
S02 Planning Review / PO Slice Approval  ← NEXT
        ↓
S02 implementation (persistence + Paper default only)
        ↓
S02 PO Review / Close
        ↓
S03 …
```

---

## 24. Explicit non-authorizations

This proposal does **NOT** authorize:

- S02 implementation
- Prisma schema edits / migrations
- Admin enablement API
- Gate / KS / Session live wiring
- credentials / real capital / FIV / production release
- silent resolution of §22 OPEN items
- modification of S01 closed artifacts or ADR-020

```text
PROPOSED ≠ APPROVED FOR IMPLEMENTATION
PERSISTENCE FOUNDATION ≠ LIVE AUTHORIZATION
POLICY ≠ EXECUTION
```

---

## Triple review (proposal quality)

| Perspective | Verdict | Notes |
| ----------- | ------- | ----- |
| **Developer** | **PASS** (for planning) | Evidence-based owner + satellite precedent; bounded; OPEN items listed |
| **Consumer / Operator** | **PASS** (for planning) | Paper default honest; no live-available claim |
| **Security** | **PASS** (for planning) | Fail-closed / no Gate-KS bypass / no credentials; PO decisions marked |

**Overall S02 Planning Proposal verdict: READY FOR REVIEW**

---

## STOP

**STOP.** PROPOSED-V3-L01-S02 Planning Proposal produced.
Status: **PROPOSED — NOT APPROVED FOR IMPLEMENTATION.**
Do **not** implement. Do **not** edit Prisma schema. Do **not** create migrations. Do **not** start S03. Do **not** modify S01.
Await PO / Chief Architect Planning Review.
