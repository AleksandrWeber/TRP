# V3-L02 Architecture Review

**Document:** Formal Architecture Review — V3-L02 Live Order I/O
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 — Live order I/O on the canonical execution path
**Authority:** Senior Staff Engineer / Chief Architect (Architecture Review only)
**Nature:** Architecture Review. **Not** Security PASS. **Not** Planning Approval. **Not** Slice Approval. **Not** implementation authorization. **Not** live-capital activation. **Not** FIV.
**Original review baseline:** `621080b6c9ea9c1e52f7d60a372fc4316174a1a5`
**Human-start PO freeze:** [`v3-l02-human-start-decision-freeze.md`](./v3-l02-human-start-decision-freeze.md)
**Re-review scope:** AD-L02-04 (prior); AD-L02-07 / AD-L02-09 / AD-L02-11 (this act)
**Re-review baseline:** post human-start freeze `3f9b609…` + this UNKNOWN/idempotency/crash-window resolution

```text
ARCHITECTURE REVIEW / AD-L02-04 RE-REVIEW.
Architecture MUST NOT change frozen PO decisions.
If architecture cannot satisfy a PO decision → ARCHITECTURE BLOCKER → PO ESCALATION.
V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED.
S01–S06 remain NOT GRANTED.
Security Review was NOT performed.
AD-L02-04 status updated below; overall package verdict remains driven by remaining blockers.
```

Protected dirty/untracked leftovers outside this artifact were **not** modified.

---

## 1. Executive Architecture Verdict

### Final package verdict

```text
ARCHITECTURE APPROVED WITH CONDITIONS
```

This is **not** Security PASS, **not** Slice Approval, **not** implementation authorization, **not** live-capital activation, and **not** FIV.

### Individual AD verdicts (this act + prior)

| Decision | Status |
| -------- | ------ |
| AD-L02-01 | **APPROVED WITH CONDITIONS** (NON-SoT freeze) |
| AD-L02-04 | **APPROVED WITH CONDITIONS** |
| **AD-L02-07** | **APPROVED WITH CONDITIONS** (this act) |
| **AD-L02-09** | **APPROVED WITH CONDITIONS** (this act) |
| **AD-L02-11** | **APPROVED WITH CONDITIONS** (this act) |
| AD-L02-14 | **APPROVED WITH CONDITIONS** |

### Why CONDITIONS (not unconditional APPROVED)

1. Security Review **NOT PASS** / not performed.
2. Live `ExecutionAdapterPort` adapters not realized (AD-L02-14 conditions).
3. AD-L02-01: `live-trading-engine` / `EmergencyManager` remain mounted NON-SoT hazards until operationally enforced.
4. Designs in §§6–8 / cancel / reconcile / persistence are **not implemented** (no schema/migrations/code in this act).
5. Per-venue client-order-id / query semantics remain adapter-boundary dependencies to confirm at implementation (must not invent unsupported venue capabilities).

### Closed by this act

Prior package **BLOCKED** reason (missing coherent UNKNOWN + idempotency + crash-window architecture) is **resolved as Architecture design**. UNKNOWN model is **not** weakened; blind retry remains forbidden; claim ≠ submit ≠ accept ≠ fill.

---

## 2. Governance Baseline

| Artifact | Role |
| -------- | ---- |
| ADR-020 Accepted | Wave-level live-capital ADR; live capital still NOT activated |
| [`v3-l02-planning-proposal.md`](./v3-l02-planning-proposal.md) | Planning package; AC-01…27 |
| [`v3-l02-planning-decision-resolution.md`](./v3-l02-planning-decision-resolution.md) | AD/PO/SD register |
| [`v3-l02-po-decision-freeze.md`](./v3-l02-po-decision-freeze.md) | Prior PO freeze |
| [`v3-l02-po-financial-scope-decision.md`](./v3-l02-po-financial-scope-decision.md) | Block A PO DECIDED |
| [`v3-l02-po-block-b-decision-freeze.md`](./v3-l02-po-block-b-decision-freeze.md) | Block B PO DECIDED |
| [`v3-l02-human-start-decision-options.md`](./v3-l02-human-start-decision-options.md) | Human-start options (neutral) |
| [`v3-l02-human-start-decision-freeze.md`](./v3-l02-human-start-decision-freeze.md) | **PO-L02-05A…05D DECIDED** |
| S04 close / LiveAdmission L02 contract | Admission ≠ execute; `l02MustRevalidateBeforeVenueIo: true` |

### Frozen PO decisions Architecture MUST NOT alter

- Venues: BINANCE, BYBIT, OKX; MOCK test-only
- Capital: trading execution only (no banking/treasury/transfers/deposits/withdrawals)
- Lifecycle business distinctions + UNKNOWN first-class
- Cancel / idempotency invariants
- C7 final gate; no bypass; authorization cell composition
- Human-start grain WORKSPACE + ACTOR + SESSION + ACTION/COMMAND
- Human-start durability durable shared (PO-L02-05A); consume/claim immediately before irreversible venue I/O (PO-L02-05B); at-most-one claim (PO-L02-05C); mandatory S04 revalidation (PO-L02-05D)
- KS / policy disable / session end: block **new** only; no auto cancel-all; venue authoritative; reconcile UNKNOWN

### Current authorization state

| Item | Status |
| ---- | ------ |
| Block A / Block B | **PO DECIDED** |
| PO-L02-05A…05D | **PO DECIDED** |
| AD-L02-04 | **APPROVED WITH CONDITIONS** |
| AD-L02-07 / 09 / 11 | **APPROVED WITH CONDITIONS** (this act) |
| Package Architecture Review | **APPROVED WITH CONDITIONS** |
| Cancel / reconcile / live persistence designs | **APPROVED WITH CONDITIONS** (this act) |
| Security Review | **NOT PERFORMED** / **NOT PASS** |
| S01–S06 | **NOT GRANTED** |
| V3-L02 IMPLEMENTATION | **NOT AUTHORIZED** |
| Live capital / FIV / live venue I/O | **NOT ACTIVATED** / **NOT PERFORMED** |

---

## 3. Repository Architecture Evidence

### Canonical paper path (SoT today)

```text
OrderService / StrategyTradingPipeline
  → CanonicalOrderPathService (Risk → Ledger reservation → EXECUTABLE)
    → ExecutionEngineService
      → ExecutionAdapterPort (PaperExecutionAdapter ONLY)
        → Fill outbox → PositionAccountingConsumer → Position/Ledger
```

Evidence:

| Component | Path |
| --------- | ---- |
| Canonical path | `apps/api/src/modules/canonical-order-path/canonical-order-path.service.ts` |
| Execution engine | `apps/api/src/modules/execution-engine/execution-engine.service.ts` — paper-only; sole caller of adapter |
| Adapter port | `apps/api/src/modules/execution-adapter/execution-adapter.port.ts` — `mode: 'paper'`, `liveCapital: false` |
| Nest binding | `execution-adapter.module.ts` → `PaperExecutionAdapter` only |

Quote (engine): “The only component permitted to call the execution adapter.”

Quote (engine guard): rejects non-paper (`execution engine is paper-only`).

**No live `ExecutionAdapterPort` implementation exists.**

### Parallel live-trading-engine (mounted, non-canonical)

| Aspect | Evidence |
| ------ | -------- |
| Module | `apps/api/src/modules/live-trading-engine/` |
| AppModule | **Imported** in `app.module.ts` |
| Path | `LiveExecutionCoordinator` → order-engine + `ExchangeAdapterService` — **not** `ExecutionEngineService` |
| Orders SoT | Separate `order-engine` OrderService |
| KS | `EmergencyManager.activateKillSwitch` freezes + **cancels all open orders** + optional close positions |
| Mutations | `/v1/live/*` gated by **C7** (`LiveCommand`) — currently deny-all |

No cross-imports found between `live-trading-engine` and `execution-engine` / `canonical-order-path` / `orders`.

### S04 live admission

| Aspect | Evidence |
| ------ | -------- |
| Evaluator | `decide-live-admission.ts` — V2 → KS → policy → authz → Session → human-start → Gate |
| Human-start | `human-start-proof.ts` — binds **actorId + workspaceId + sessionId**; TTL 15m; consume-on-evaluate |
| Store | `InMemoryHumanStartProofStore` only |
| L02 contract | `live-admission-l02-contract.ts` — `l02MustRevalidateBeforeVenueIo: true` (documentation surface; L02 unauthorized) |
| C7 | Evaluated in admission; matrix never grants `LiveCommand` |

### Durable workspace Kill Switch (canonical admission)

`KillSwitchPersistenceService` — durable Prisma state; **does not execute halt/cancel**. Used by S04 admission fail-closed.

### Venues

| Venue | Exchange-adapter submit/cancel | Handshake |
| ----- | ------------------------------ | --------- |
| MOCK | In-process sim | N/A (test) |
| BINANCE | Throws (US210 stub) | Implemented connectivity handshake |
| BYBIT / OKX | Throws (US210 stub) | Planned / not implemented |

Handshake ≠ live trading authorization (PO frozen).

### Order status (canonical)

`OrderStatus`: proposed → … → submitted → acknowledged → filled | rejected | cancel_pending → cancelled.

**No `UNKNOWN` status.** Adapter `query` returns `outcome: 'unknown'` with `reconciliationRequired: true` (paper only).

---

## 4. AD-L02-01 — Canonical Path

### Finding

ADR-020 / planning direction is correct: L02 live I/O **must** use:

```text
Risk → Orders → Ledger → ExecutionEngineService → ExecutionAdapterPort → Venue → Fill → Position/Ledger
```

The parallel `live-trading-engine` **duplicates** execution responsibility, owns separate order/session state, emits fills via `RecoveryManager`, and **bypasses** the canonical engine. It is production-mounted but C7-gated.

### Formal record

```text
live-trading-engine is FROZEN as NON-SoT for V3-L02.
L02 MUST NOT route live order I/O through live-trading-engine / order-engine / ExchangeAdapterService.
L02 MUST NOT treat EmergencyManager as the L02 Kill Switch SoT.
```

### Status

**APPROVED WITH CONDITIONS**

### Conditions

1. All L02 live submit/cancel/query bind exclusively through `ExecutionEngineService` → live-capable `ExecutionAdapterPort`.
2. `live-trading-engine` remains NON-SoT; no L02 dependency on it for capital path.
3. `EmergencyManager` cancel-all / position-close sequence is **explicitly excluded** from L02 KS semantics (conflicts with PO-L02-08).
4. Architecture/Security must treat accidental wiring of `/v1/live` as a dual-SoT regression blocker.

### PO impact

None — reinforces ADR-020 / PO direction. Does not change venue/capital scope.

### Security impact

Dual path + cancel-all prototype is a high-risk confusion hazard → Security Review handoff (not PASS here).

---

## 5. AD-L02-04 — Human-Start (Re-Review after PO-L02-05A…05D)

### Prior status

**BLOCKED / REQUIRES PO DECISION** (original Architecture Review).

### PO decisions now frozen (must not be altered)

| ID | Decision |
| -- | -------- |
| **PO-L02-05A** | Durable shared persistence; in-memory Map is **not** final |
| **PO-L02-05B** | Validate → authz/admission → S04 revalidation → **atomic claim** → irreversible venue I/O |
| **PO-L02-05C** | At most one valid claim authorizes one logical live action; claim ≠ venue submission/accept/fill; UNKNOWN + reconcile-before-retry; no blind retry |
| **PO-L02-05D** | Mandatory S04 revalidation immediately before I/O; human-start does not replace S04/C7/policy/KS/session/creds/venue readiness |
| Grain (Block B) | WORKSPACE + ACTOR + SESSION + ACTION/COMMAND |

### Current repository (unchanged by this review)

| Property | Current |
| -------- | ------- |
| Binding | actor + workspace + session only — ACTION/COMMAND still missing in code |
| TTL | 15 minutes (`HUMAN_START_PROOF_TTL_MS`) |
| Consume timing | **On evaluate** via `verifyAndConsumeHumanStartProof` |
| Storage | `InMemoryHumanStartProofStore` (Nest binding) |
| Port | `HumanStartProofStore`: `save` / `findByTokenHash` / `consumeIfActive` |

In-memory Map remains **interim S04 substrate only** — **not** the final L02 architecture (PO-L02-05A).

### Architecture selection — durable persistence mechanism

**Selected mechanism:** Prisma-backed PostgreSQL table in the existing API database, following the same durability pattern as `WorkspaceLivePolicyState` and `WorkspaceKillSwitchState` (`apps/api/prisma/schema.prisma`).

**Rationale (repository-backed):**

- Shared across API instances (multi-instance).
- Survives process restart.
- Supports atomic conditional updates (`UPDATE … WHERE consumed_at IS NULL AND expires_at > now()`).
- Fits existing Nest persistence style (`KillSwitchPersistenceService`, workspace live-policy persistence).
- Implements the existing `HumanStartProofStore` port (or a narrow extension) without inventing a parallel proof subsystem.

**Not selected as L02 human-start SoT:** Redis-only ephemeral caches; process-local Maps; `live-trading-engine` state; session runtime leases alone (session lease ≠ human-start).

**Not implemented in this act** — schema/migration deferred to a future authorized slice.

### Required schema / state (design — not migrated)

Logical record fields:

| Field | Purpose |
| ----- | ------- |
| `id` (proof id) | Stable identity |
| `token_hash` | SHA-256 of presented token; unique lookup |
| `workspace_id` | Binding |
| `actor_id` | Binding |
| `session_id` | Binding |
| `action_command` | Binding (PO grain ACTION/COMMAND) — opaque stable string for the logical live action |
| `created_at` | Issue time |
| `expires_at` | TTL / freshness |
| `claimed_at` / `consumed_at` | Null until atomic claim; set once |
| `claimed_logical_action_id` (optional but recommended) | Correlation to the logical live action authorized by the claim |
| `schema_version` | Evolution |

Indexes: unique `token_hash`; index `(workspace_id, actor_id, session_id, action_command)` for ops/debug (uniqueness of **claim** is on proof id / token, not “one proof per action forever” unless product later freezes issue policy).

Token plaintext: never persisted (current pattern retained).

### Atomic claim / consume semantics

```text
CRITICAL SECTION (single instance of success across the cluster):
  1. Validate proof presentation (hash lookup, not expired, binding match including ACTION/COMMAND, not already claimed)
  2. Run full S04 revalidation (V2 / KS / policy / authz / session / Gate / human-start freshness+binding) — fail-closed
  3. Atomically claim:
       UPDATE human_start_proofs
       SET claimed_at = $now, claimed_logical_action_id = $action
       WHERE id = $id
         AND claimed_at IS NULL
         AND expires_at > $now
       — success rowcount MUST be 1
  4. Only after claim success: initiate irreversible venue I/O
```

Admission / early evaluation paths may **validate without claiming** (verify-only). They MUST NOT burn the single-use claim.

**Race-safety:** conditional update (or equivalent serializable transaction) is mandatory. Loser of concurrent claim → fail-closed (`replayed` / already claimed).

### Ordering with S04 (PO-L02-05B / 05D)

```text
human-start validation (verify-only as needed)
  → all required authorization/admission checks
  → mandatory S04 revalidation immediately before irreversible venue I/O
  → atomic human-start claim
  → irreversible venue I/O
```

Human-start does **not** replace S04, C7, policy, KS, session, credentials, or venue readiness.

### Uniqueness / idempotency constraints

| Layer | Guarantee |
| ----- | --------- |
| Human-start (PO-L02-05C) | **At most one** successful claim per proof; that claim authorizes **one** logical live action |
| Venue submission | **Not** promised exactly-once by human-start alone |
| After claim + ambiguous I/O | Outcome **UNKNOWN**; reconcile before retry; **no blind retry** |
| Order/venue idempotency | Remains **AD-L02-09 / AD-L02-11** — required so a later authorized retry does not mint a duplicate venue order |

### Multi-instance / restart / concurrency / worker retry

| Concern | Treatment |
| ------- | --------- |
| Multi-instance | Shared Postgres row + atomic claim |
| Process restart | Unclaimed proofs remain until TTL; claimed proofs remain claimed |
| Concurrent requests | One claim wins; others fail-closed |
| Worker retry before claim | May re-validate; claim still atomic |
| Worker retry after claim | Must **not** treat claim as license to blind re-submit; follow order identity + UNKNOWN/reconcile (AD-L02-09/11) |
| Same proof replay after claim | Fail-closed |

### Crash windows (authorization vs venue)

| Crash point | Proof state | Venue | Required behavior |
| ----------- | ----------- | ----- | ----------------- |
| Before claim | Unclaimed (if durable) | None | Re-issue or retry path may still claim if TTL/binding OK; S04 revalidate again |
| After claim, before venue I/O | **Claimed** | None | Claim does **not** prove submission; do **not** interpret as success; new live attempt needs new human-start (or explicit PO-approved recovery — none authorized here); fail-closed for that proof |
| During venue I/O | Claimed | Ambiguous | **UNKNOWN**; reconcile-before-retry; no blind retry |
| After venue I/O, before local persistence | Claimed | Possibly accepted | **UNKNOWN** until durable local+venue reconcile; claim ≠ accept/fill |

**Do not weaken UNKNOWN** to “recover” a burned claim.

### Claim vs UNKNOWN relationship

- Successful claim ⇒ authorization for **one** attempt to start irreversible I/O for the bound logical action.
- Successful claim ⇒ **not** SUBMITTED / ACCEPTED / FILLED.
- Lost/ambiguous venue response ⇒ **UNKNOWN** (AD-L02-07 encoding still required on order/execution path).
- Retry after UNKNOWN ⇒ reconciliation first; new human-start required if prior proof already claimed (typical); never blind retry.

### Satisfaction of AD-L02-04

| Requirement | Satisfied by architecture? |
| ----------- | -------------------------- |
| PO grain including ACTION/COMMAND | Yes — schema + verify must include `action_command` |
| Durable multi-instance / restart | Yes — Prisma/Postgres shared store |
| Single-use / replay-resistant | Yes — atomic claim |
| Freshness / TTL | Yes — retain TTL; re-check at claim |
| I/O-time S04 revalidation | Yes — ordered before claim |
| Consume-at-I/O timing | Yes — PO-L02-05B |
| At-most-one claim | Yes — PO-L02-05C |
| Claim ≠ venue outcome | Yes — explicit invariant |
| No blind retry / UNKNOWN preserved | Yes — deferred to AD-L02-07/09/11 for encoding/execution markers |

### Status

**APPROVED WITH CONDITIONS**

### Conditions (binding for any future implementation authorization)

1. Implement durable Prisma store + Nest binding replacing in-memory for L02-capable deployments; keep fail-closed if store unavailable.
2. Extend issue/verify with **ACTION/COMMAND** binding.
3. Split verify-only vs atomic claim; **do not** claim on early admission evaluate.
4. Place claim immediately after successful S04 revalidation and immediately before irreversible venue I/O on the **canonical** ExecutionEngine path only.
5. Never treat claim as venue submission/accept/fill.
6. Coordinate with AD-L02-09/11 so post-claim ambiguity uses UNKNOWN + reconcile, not blind retry.
7. Security Review (SD-L02-04 and related) remains mandatory before implementation PASS claims.
8. **No implementation is authorized by this Architecture re-review.**

### PO impact

None — realizes PO-L02-05A…05D as decided. Does not alter grain or UNKNOWN business rules.

### Security impact

High sensitivity (replay, cross-binding, races). Hand off to Security Review — **NOT PASS**.

## 6. AD-L02-07 — First-Class UNKNOWN

### Decision

**APPROVED WITH CONDITIONS**

Introduce a first-class durable business state **`unknown`** on the canonical live order/execution aggregate, distinct from rejected / cancelled / filled / acknowledged(accepted) / success.

PO business lifecycle (frozen) maps to technical encoding as follows (Architecture encoding; PO names remain authoritative for governance):

| PO business distinction | Technical representation (canonical Orders path) | Notes |
| ----------------------- | ------------------------------------------------ | ----- |
| REQUESTED | `proposed` / `risk_pending` (pre-live-admission completion) | Existing paper statuses reused where equivalent |
| ADMITTED | Live-eligible executable + durable admission context; **not** venue-submitted | ALLOW ≠ submitted |
| SUBMITTED | `submitted` **and/or** durable `submission_phase = transmitted \| transmit_pending` | Local intent that venue I/O was entered — **not** accept |
| ACCEPTED | `acknowledged` (venue-accepted / resting or ack) | Requires established venue acceptance |
| REJECTED | `rejected` | Requires established venue/local reject — **not** timeout |
| **UNKNOWN** | **`unknown`** (NEW first-class `OrderStatus`) | Persisted; `reconciliation_required = true` |
| FILLED | `filled` | Venue-authoritative fill facts |
| CANCELLED | `cancelled` | Venue-authoritative cancel (or proven never-open after reconcile) |
| (internal) | `cancel_pending` | Cancel requested / in flight — may transition to `unknown` on ambiguity |

**Existing capability:** paper `OrderStatus` has no `unknown`; adapter `query` already returns `outcome: 'unknown'`.
**Does not yet exist:** durable `unknown` on `PaperOrder` / live order aggregate; legal transitions including UNKNOWN.

### Legal transitions involving UNKNOWN

```text
submitted | cancel_pending  →  unknown          (ambiguous venue outcome)
unknown                     →  acknowledged     (reconcile: accepted)
unknown                     →  rejected         (reconcile: known reject / never accepted)
unknown                     →  filled           (reconcile: fill established)
unknown                     →  cancelled        (reconcile: cancel established)
unknown                     →  unknown          (reconcile inconclusive / timed out)
```

Forbidden coercions:

- timeout / network / lost response / parse failure → **must not** become `rejected` or `cancelled` or `filled` or success
- absence of local row alone → **must not** prove venue absence without reconcile
- human-start claim / local ALLOW → **must not** become ACCEPTED/FILLED

### Ambiguity classification matrix

| Event | Local result | Rationale |
| ----- | ------------ | --------- |
| Timeout after transmit possible | **UNKNOWN** | Venue may have accepted |
| Connection reset after transmit possible | **UNKNOWN** | Same |
| HTTP/network failure after transmit possible | **UNKNOWN** | Same |
| Failure **before** durable pre-send marker / before transmit | No venue effect if marker proves not transmitted; else **UNKNOWN** if transmission possibility cannot be ruled out | Prefer UNKNOWN when unsure |
| Venue response lost after transmission | **UNKNOWN** | Classic lost-response |
| Process crash after claim, before transmit marker | Claimed; not submitted; **not** venue success | New human-start for new attempt; order may remain pre-submit |
| Process crash after pre-send marker / during / after transmit before durable response | **UNKNOWN** | Distributed boundary |
| Response parsing failure after bytes received | **UNKNOWN** (or known if parse-safe reject code established) | Do not invent success |
| Uncertain submit result | **UNKNOWN** | |
| Uncertain cancel result | **UNKNOWN** (cancel path) | Not cancel success |
| Venue explicit reject with verified payload | **REJECTED** | Known |
| Venue explicit accept/ack | **ACCEPTED** | Known |
| Venue explicit fill | **FILLED** (or partial per fill model) | Known |

### Invariants

- UNKNOWN is first-class persisted business state.
- `claim ≠ submit ≠ accept ≠ fill`.
- UNKNOWN ≠ SUCCESS / ACCEPTED / REJECTED / FILLED / CANCELLED.
- No blind retry from UNKNOWN.
- Venue is authoritative for already-submitted orders once established via reconcile.

### Failure behavior

Fail-closed for **new** live exposure while UNKNOWN exists for the same logical action. Operator visibility of UNKNOWN required (L04 UI out of scope — operational persistence must still encode it).

### Remaining conditions / dependencies

- Schema/status enum change not implemented.
- Adapter must return honest ambiguity signals (AD-L02-14).
- Security: SD-L02-06 UNKNOWN manipulation / trust.
- Must not weaken UNKNOWN to “fix” claim burn.

### Rationale

PO-L02-14 and Block A cancel/idempotency invariants require a durable, non-coercible uncertain state. Paper adapter already prototypes `outcome: 'unknown'`; Orders domain must elevate it.

---

## 7. AD-L02-09 — Live Idempotency

### Decision

**APPROVED WITH CONDITIONS**

One **logical live action** has a durable identity owned by the **canonical Orders aggregate** (same BC as `PaperOrder` / future live-capable order row — **not** `live-trading-engine` / `trading_orders` parallel stack).

### Exact logical identity

| Element | Definition |
| ------- | ---------- |
| **Primary logical order id** | Server-derived stable `orderId` = deterministic function of `(workspaceId, clientOrderId)` — **existing pattern** in `order-intent.ts` (`ord_${sha256(workspaceId:clientOrderId)}`) |
| **clientOrderId** | Client-provided (or strategy-derived) string; **unique per workspace**; durable on order row (`@@unique([workspaceId, clientOrderId])` exists on `paper_orders`) |
| **idempotencyKey** | Client-provided (or derived for strategy) key for the **HTTP/API logical operation**; **unique per workspace** (`@@unique([workspaceId, idempotencyKey])` exists) |
| **Venue client order id** | Adapter maps platform `clientOrderId` (or a deterministic transform thereof) to venue `clientOrderId` / `clOrdId` / equivalent **where supported**; **same value retained across retries of the same logical action** |
| **Generation** | Established at **logical live-action creation** (propose/create), **before** human-start claim and **before** venue I/O |
| **Owner** | Orders BC / durable order row |
| **Scope** | Workspace-scoped uniqueness |
| **Restart / workers / instances** | Identity is DB-durable; all workers/instances must reuse the same row |

**Existing capability:** `PaperOrder` uniques on `clientOrderId`, `idempotencyKey`, `intentHash`.
**Does not yet exist:** live mode on that aggregate; pre-send / UNKNOWN / venue-id / reconcile metadata fields; live adapter mapping of client order id.

### Mandatory UNKNOWN retry rule

```text
UNKNOWN → reconcile (venue authoritative query) → determine state
  → only then decide whether another mutating action is permitted
```

| Situation | Retry? |
| --------- | ------ |
| Blind resubmit while UNKNOWN | **Forbidden** |
| Reconcile → ACCEPTED/FILLED/CANCELLED | Continue that state; **no new submit** |
| Reconcile → REJECTED / proven never-created | New logical action requires **new** identity (new clientOrderId / idempotencyKey) + new human-start |
| Reconcile inconclusive | Remain UNKNOWN; delay; retry **reconcile** only (not submit) |
| Continuing same logical action after reconcile says “not on venue” and policy allows recreate | Only if Architecture/Security later approve explicit recreate; **default L02: treat as new logical action with new ids** — do not silently reuse a consumed submit attempt without reconcile proof |

### Venue client-order-id participation

| Venue | Participation (design) | Residual ambiguity |
| ----- | ---------------------- | ------------------ |
| BINANCE / BYBIT / OKX | Adapters **MUST** send stable client order id equivalent on submit when API supports it; use it in reconcile queries | Exact endpoint/field mapping = adapter implementation dependency — **do not invent** here; confirm at adapter design |
| Venue without equivalent | Rely on durable local identity + conservative UNKNOWN + reconcile-by-venue-order-id when known; residual duplicate risk must be contained by **no blind retry** + fail-closed new exposure | Marked **Architecture/Security dependency** at adapter boundary |
| MOCK | Test-only; must still honor identity + UNKNOWN rules in tests | |

### Invariants

- Duplicate HTTP / concurrent / worker / queue / restart must converge on **one** durable row.
- Human-start claim is **not** an idempotency substitute (PO/AD-L02-04).
- Same logical retry retains same `orderId` / `clientOrderId` / venue client order id.
- Lost response ⇒ UNKNOWN ⇒ reconcile-before-mutate.

### Failure behavior

Unique constraint violations on create ⇒ return existing logical action (idempotent replay), never a second venue identity.

### Remaining conditions

- Live fields/migrations not implemented.
- Per-venue id mapping confirmed in adapter work (AD-L02-14).
- Security: SD-L02-05 duplicate financial actions / idempotency abuse.

### Rationale

Extends existing paper uniqueness rather than inventing a parallel identity system; satisfies PO-L02-13 without claiming exactly-once venue submission.

---

## 8. AD-L02-11 — Crash-Window Persistence

### Decision

**APPROVED WITH CONDITIONS**

Acknowledge the **distributed-system boundary**: a local DB transaction **cannot** atomically include the external venue call. Architecture therefore requires durable **pre-send** and **post-outcome** markers and UNKNOWN for the gap.

### Submit flow (logical)

1. Receive logical live-order request.
2. Establish durable logical order/action identity (`clientOrderId` / `idempotencyKey` / `orderId`) — persist order row (REQUESTED…).
3. Validate authorization/admission (non-claiming human-start verify as needed).
4. Validate human-start binding/freshness.
5. Mandatory S04 revalidation immediately before irreversible I/O.
6. Atomically claim human-start (AD-L02-04).
7. Persist **pre-I/O** state: e.g. `submission_phase = ready_to_transmit` / `transmit_pending` with timestamps + venue client order id **before** socket write (AD-L02-11).
8. Perform venue I/O (ExecutionEngine → ExecutionAdapterPort only).
9. Interpret venue result.
10. Persist known ACCEPTED/REJECTED/FILLED **or** **UNKNOWN**.
11. Reconcile UNKNOWN where required (no blind retry).

Persistence **before** venue I/O: identity + admission context + human-start claim correlation + **pre-send marker**.
Persistence **after** venue I/O: outcome or UNKNOWN + venue order id when known + reconcile metadata.

### Crash timeline (T0–T8)

| Point | Meaning | Crash survival / behavior |
| ----- | ------- | ------------------------- |
| T0 | Logical live action created | Row exists; no claim; no venue |
| T1 | Human-start validated (verify-only) | Unclaimed proof still usable |
| T2 | S04 revalidation passes | Ephemeral unless stamped; must revalidate again before I/O on resume |
| T3 | Human-start atomically claimed | Claim durable; **≠ submit** |
| T4 | Venue request about to be sent (pre-send marker persisted) | Marker durable; if crash here before transmit → treat as **not transmitted** only if marker protocol proves no write; if unsure → UNKNOWN |
| T5 | Venue request transmitted | Must assume venue **may** have received → on crash **UNKNOWN** |
| T6 | Venue may have accepted/rejected/executed | Authoritative at venue; local may be UNKNOWN |
| T7 | Response reaches application | Still volatile until T8 |
| T8 | Local persistence records outcome | Known state or UNKNOWN persisted |

| Crash boundary | Proof | Venue | State | Safe mutate retry? | Reconcile? |
| -------------- | ----- | ----- | ----- | ------------------ | ---------- |
| Before claim (＜T3) | Unclaimed | None | Pre-submit | Yes after gates + new/same proof rules | No |
| Immediately after claim (T3) | Claimed | None | Pre-submit | **No** reuse of same proof; new human-start for new attempt; order not venue-submitted | No |
| After pre-send marker, before/during transmit (T4–T5) | Claimed | Maybe | **UNKNOWN** if transmit possible | **No** blind submit | **Yes** |
| After transmit, before response (T5–T7) | Claimed | Maybe | **UNKNOWN** | **No** blind submit | **Yes** |
| After accept at venue, before local persist (T6–T8) | Claimed | Yes possible | **UNKNOWN** until persist/reconcile | **No** blind submit | **Yes** |
| After response, before persist (T7–T8) | Claimed | Known at app momentarily | Treat **UNKNOWN** if persist lost | **No** blind submit | **Yes** |
| After local persist (T8) | Claimed | Per persisted outcome | Durable known/UNKNOWN | Per state machine | If UNKNOWN |

### Cancel crash window (aligned)

Same pattern with cancel idempotency key + `cancel_pending` → UNKNOWN on ambiguity → reconcile → CANCELLED / FILLED / remain UNKNOWN. **No** blind re-cancel. **No** EmergencyManager cancel-all.

### Invariants

- Pre-send durable marker required before irreversible transmit.
- External I/O outside local transaction.
- Claim ≠ submit ≠ accept ≠ fill.
- UNKNOWN preserved across crashes in the transmit ambiguity window.

### Remaining conditions

- Marker fields / migrations not implemented.
- Worker orchestration for reconcile not implemented.
- Depends on AD-L02-07/09 encodings.

### Rationale

Makes the unavoidable distributed gap explicit and fail-safe via UNKNOWN + reconcile rather than false terminal states.

---

## 8A. Reconciliation Contract (Minimum L02)

### Decision

**APPROVED WITH CONDITIONS** (design contract)

| Question | Contract |
| -------- | -------- |
| Component | Canonical `ExecutionEngineService.reconcile` → adapter `query` / venue status by **workspace + clientOrderId (+ venue order id if known)** |
| Local UNKNOWN mapping | Lookup by durable `orderId` / `clientOrderId` / `venue_order_id` when present |
| Venue reports order | Map established venue status → ACCEPTED / FILLED / CANCELLED / REJECTED per adapter mapping; clear UNKNOWN |
| Venue reports no order | **Not** automatic REJECTED if transmit may have occurred and venue indexing lag possible — keep UNKNOWN or apply venue-documented “definitely absent” only when adapter can justify; otherwise remain UNKNOWN |
| Venue ambiguous / timeout | Remain UNKNOWN; schedule delayed reconcile; **no** mutate |
| Repeated reconcile failure | Remain UNKNOWN; fail-closed new exposure; operator/ops escalation (L04 out of scope) |
| Resolutions allowed | UNKNOWN → ACCEPTED \| REJECTED \| FILLED \| CANCELLED \| UNKNOWN |
| SoT | Venue for already-submitted; never `live-trading-engine` sync |

**Dependency:** exact venue query APIs = AD-L02-14 adapter work; do not invent unsupported capabilities.

---

## 8B. Cancel Architecture (Resolved with 07/09/11)

### Decision

**APPROVED WITH CONDITIONS**

| Venue outcome | Domain |
| ------------- | ------ |
| Cancel accepted | CANCELLED |
| Already cancelled | CANCELLED when established |
| Already filled | FILLED; cancel not successful |
| Not found / timeout / network / lost | **UNKNOWN** (not cancel success) |
| UNKNOWN | Remain until reconcile; **no blind repeated cancel** |

Cancel uses its own durable idempotency key scoped to the cancel logical action on the same order identity. EmergencyManager **excluded** from L02. No automatic cancel-all (PO-L02-08/09/10).

---

## 8C. Persistence Model (Design Proposal)

### Design proposal (not migrated)

Extend canonical order aggregate (pattern: `PaperOrder` / `paper_orders`) for live-capable rows **or** additive columns on the same Orders persistence:

| Concern | Fields / constraints |
| ------- | -------------------- |
| Identity | `id`, `workspace_id`, `client_order_id`, `idempotency_key` — keep `@@unique([workspaceId, clientOrderId])`, `@@unique([workspaceId, idempotencyKey])` |
| Status | include **`unknown`**; `cancel_pending` |
| Venue | `venue_client_order_id`, `venue_order_id` nullable |
| Crash window | `submission_phase` (`none` \| `ready_to_transmit` \| `transmitted` \| `completed`), `transmit_attempted_at`, `last_venue_attempt_at` |
| UNKNOWN / reconcile | `reconciliation_required`, `unknown_entered_at`, `last_reconcile_at`, `reconcile_attempts` |
| Human-start | `human_start_proof_id` / claim correlation nullable |
| Timestamps | `created_at`, `recorded_at`, `updated_at` |
| Cancel | cancel idempotency key unique per workspace where applicable (existing cancel patterns) |

Human-start proofs: separate durable table per AD-L02-04 (Prisma).

### Existing vs missing

| Capability | Status |
| ---------- | ------ |
| Paper order uniques / lifecycle entries | **Exists** |
| Adapter query `unknown` outcome (paper) | **Exists** |
| Engine reconcile hook | **Exists** (paper) |
| `OrderStatus.unknown` | **Missing** |
| Live mode + pre-send markers + reconcile metadata | **Missing** |
| Durable human-start store | **Missing** (in-memory only) |
| Live ExecutionAdapterPort | **Missing** |

Out of L02 persistence: L03 audit log, L04 UI, L05 replay subsystem.

---

## 8D. Multi-Instance / Concurrency Proof

| Case | Durable record | Atomic prevention | Venue I/O? | Resulting state | Reconcile? |
| ---- | -------------- | ----------------- | ---------- | --------------- | ---------- |
| **A** Two API instances same logical request | Same `idempotencyKey`/`clientOrderId` row | Unique insert / fetch-existing | At most one critical section wins pre-send+claim | Single logical order | If winner UNKNOWN |
| **B** Two workers same job | Same order row + optimistic version / phase CAS | CAS on `submission_phase` / version | One transmit | One attempt or UNKNOWN | If ambiguous |
| **C** Client timeout + retry | Existing row by idempotency key | Return existing; no new identity | No second submit while UNKNOWN/in-flight | Same logical action | If UNKNOWN |
| **D** Crash after submit before persist | Pre-send/`transmitted` marker | Marker implies ambiguity | Already may have occurred | **UNKNOWN** on recovery | **Required** |
| **E** Two operators same human-start proof | One proof row | Atomic claim | At most one claim→I/O path | Loser fail-closed | If winner UNKNOWN |
| **F** Replay claimed proof | Claimed proof | `claimed_at IS NOT NULL` | No | Deny | N/A |

---

## 9. AD-L02-14 — Venue / Adapter Boundary

### Target boundary

Live venue I/O must occur only inside `ExecutionAdapterPort` implementations invoked by `ExecutionEngineService`.

Credentials: Vault retrieval inside adapter boundary only (planning AC-08) — Security Review owns verification.

### Current state

- `ExecutionAdapterPort` is paper-locked.
- BINANCE/BYBIT/OKX live submit/cancel exist as **throwing stubs** under `exchange-adapter` (parallel stack).
- Binance **handshake** exists in connectivity BC — proves API restrictions endpoint reachability, **not** live trading authorization (PO frozen).

### Status

**APPROVED WITH CONDITIONS**

Conditions:

1. New live adapter implementations on `ExecutionAdapterPort` for BINANCE/BYBIT/OKX; MOCK test-only.
2. Do not promote `exchange-adapter` / `live-trading-engine` to L02 SoT.
3. Handshake success ≠ authorization / C7 / admission.
4. Adapter must expose honest UNKNOWN / reconciliation hooks.
5. No production venue I/O in this review; no credential provisioning authorized here.

---

## 10. Cancel Architecture

### PO invariants (frozen)

No false cancellation success; timeout/lost-response/not-found do not automatically prove cancel; already-filled ⇒ not cancellable; ambiguous ⇒ UNKNOWN; no blind repeated cancel; reconcile as needed.

### Current canonical cancel

| Stage | Behavior |
| ----- | -------- |
| Pre-adapter (`adapterOrderId == null`) | `OrderService.cancel` → local CANCELLED |
| Post-adapter | `ExecutionEngineService.cancel` → adapter.cancel → confirmCancellation — **no production HTTP wiring found** beyond tests |
| Parallel EmergencyManager | Local cancel-all — **conflicts with PO-L02-08** if used as L02 KS |

### Mapping required (design)

| Venue outcome | Domain |
| ------------- | ------ |
| Cancel accepted | CANCELLED (when venue-authoritative) |
| Already cancelled | CANCELLED when established |
| Already filled | FILLED; cancel fails honestly |
| Not found | **UNKNOWN** unless reconcile proves cancel/fill/absent-never-submitted |
| Timeout / network / lost response | **UNKNOWN** |
| UNKNOWN | Remain UNKNOWN; no blind re-cancel |

### Status

**APPROVED WITH CONDITIONS** — mapping aligned with AD-L02-07/09/11 (§8B). EmergencyManager remains excluded. Implementation not authorized.

---

## 11. Reconciliation Boundary

### Architectural determination (design)

| Question | Answer |
| -------- | ------ |
| What reconciles? | Canonical Execution Engine `reconcile` / adapter `query`, driven by operational recovery — **not** parallel live-trading-engine sync as SoT |
| Needs | workspaceId, orderId, clientOrderId, venue order id (if any), submission markers, timestamps |
| When | Any UNKNOWN; lost response; cancel ambiguity; restart with in-flight markers; after KS/policy/session change while open venue orders exist |
| Authoritative source | **Venue state** for already-submitted orders (PO) |
| vs execution state | Local state yields to venue when conflict; local must not invent CANCELLED/FILLED |
| vs ledger/positions | Apply fills only from verified venue/fill facts; no second ledger (AC-26) |
| vs UNKNOWN | Reconciliation is the path out of UNKNOWN |
| vs idempotency | Reconcile before retry; retain same identity |

### Status

**APPROVED WITH CONDITIONS** — minimum contract in §8A. Implementation / live adapter query not authorized yet; Security must review trust boundary.

---

## 12. KS / Policy / Session Transition Architecture

### PO rule (frozen)

KS ACTIVE / policy PAPER / session ended ⇒ block **new** admission & submission. Do **not** auto-cancel existing venue orders. Venue authoritative; fills authoritative; UNKNOWN stays UNKNOWN; operational cancel only via explicit authorized path.

### Current capability

| Control | Blocks new via S04? | Auto-cancels venue? | Notes |
| ------- | ------------------- | ------------------- | ----- |
| Durable workspace KS | Yes (admission) | **No** (storage only; correct direction) | Does not yet wire “block submission” on engine live path (no live path) |
| LIVE_POLICY_OPTED_IN | Yes (admission) | **No** | Correct direction |
| Session eligibility | Yes (admission) | **No** | Do not redesign TradingSession |
| EmergencyManager | Freezes parallel session | **Yes — cancel-all** | **Non-SoT; must not be L02 KS** |

### Race conditions (mandatory handling in future design)

- KS/policy/session change during admission
- Change between admission and venue I/O → **immediate revalidation** must DENY new I/O
- Change while response UNKNOWN → do not rewrite venue state; reconcile; block new

### Status

**APPROVED WITH CONDITIONS** for business alignment of durable KS/policy/session gates; **BLOCKED** for L02 readiness until live I/O path + revalidation exist and EmergencyManager remains excluded.

---

## 13. Authorization Gate Ordering

### PO cell (composition required; order subject to Arch/Sec)

Authenticated actor → workspace membership → L02 permission → human-start → eligible session → LIVE_POLICY_OPTED_IN → KS not ACTIVE → **C7 PASS** → venue/credential readiness → **immediate S04 revalidation before irreversible I/O**.

### Repository S04 precedence (existing)

```text
V2 hard stops → Kill Switch → policy → authorization (C7) → Session → human-start → Gate
```

### Architecture finding

Proposed minimum safe ordering for L02 evaluation (compatible with S04, extended for venue readiness + I/O revalidation):

```text
V2 hard stops
→ Kill Switch
→ policy (LIVE_POLICY_OPTED_IN)
→ authorization / role (incl. C7 as final authz gate within cell)
→ session eligibility
→ human-start (freshness model per AD-L02-04 resolution)
→ Gate / deployment
→ venue adapter availability + credential validity
→ immediate full revalidation immediately before irreversible venue I/O
```

C7 remains fail-closed final execution safety gate among authorization controls; **no bypass path**.

S04 places C7 (authz) before session/human-start. PO cell lists human-start and session before C7 in the numbered list, while also stating exact order is subject to Architecture/Security Review.

**Architecture finding:** Retaining S04 precedence (authz before session/human-start) is acceptable **provided** every element remains mandatory and C7 cannot be bypassed. Reordering to match PO list order is optional and has security implications → escalate only if Security requires strict list order.

### Status

**APPROVED WITH CONDITIONS** — S04-aligned order retained; full cell mandatory; I/O revalidation mandatory; Security must confirm.

---

## 14. Operational Persistence

### Minimum L02 operational persistence (design)

| Data | Required |
| ---- | -------- |
| Order identity | Yes |
| Idempotency key / logical identity | Yes |
| Venue client-order-id | Yes where supported |
| Submission state (incl. about-to-submit / submitted-unconfirmed) | Yes |
| UNKNOWN / reconciliation-required | Yes |
| Venue order ID | When known |
| Timestamps | Yes |
| Retry/reconcile metadata | As needed |

### Explicitly out of L02 persistence scope

- L03 financial audit log
- L04 operator UI
- L05 general replay subsystem

### Status

**APPROVED WITH CONDITIONS** — minimum model in §8C (design proposal only). **No migrations in this act.** Existing `paper_orders` uniques are the foundation; live UNKNOWN/marker columns **do not yet exist**.

---

## 15. Venue Matrix

| Venue | Adapter contract today | Live on ExecutionAdapterPort? | Credentials | Endpoint I/O | Order/cancel | Idempotency | UNKNOWN | Reconcile | Auth meaning |
| ----- | ---------------------- | ----------------------------- | ----------- | ------------ | ------------ | ----------- | ------- | --------- | ------------ |
| MOCK | Parallel sim | No | N/A | Test sim | Sim | Sim | Partial | Sim | Test-only |
| BINANCE | Stub throws + handshake elsewhere | No | Not for L02 | No prod I/O here | Stub | Not live-canonical | Not live-canonical | Not live-canonical | Handshake ≠ live authz |
| BYBIT | Stub throws | No | Not for L02 | No | Stub | Same | Same | Same | Same |
| OKX | Stub throws | No | Not for L02 | No | Stub | Same | Same | Same | Same |

---

## 16. AC-01…27 Review

Statuses: **PASS** / **PASS WITH REQUIRED CLARIFICATION** / **BLOCKED**

| AC | Title (short) | Status | Notes |
| -- | ------------- | ------ | ----- |
| AC-01 | Canonical engine/adapter only; no parallel SoT | **PASS WITH REQUIRED CLARIFICATION** | Direction approved; engine NON-SoT freeze required; parallel module still mounted |
| AC-02 | Revalidate before irreversible I/O | **PASS WITH REQUIRED CLARIFICATION** | Ordering approved (PO-05B/05D + AD-L02-04); live I/O path not implemented |
| AC-03 | Human-start per approved model | **PASS WITH REQUIRED CLARIFICATION** | Model APPROVED WITH CONDITIONS; not implemented; Security pending |
| AC-04 | Authorization evaluated; cross-workspace reject | **PASS WITH REQUIRED CLARIFICATION** | S04 evaluates; live I/O path absent |
| AC-05 | Workspace isolation orders/credentials | **PASS WITH REQUIRED CLARIFICATION** | Pattern exists; live adapters absent — Security verifies |
| AC-06 | KS ACTIVE blocks new live submit | **PASS WITH REQUIRED CLARIFICATION** | Admission blocks; live submit path absent; EmergencyManager hazard |
| AC-07 | Paper Freeze / liveCapitalAuthorized hard stops | **PASS** | S04 V2 stops present; production unauthorized |
| AC-08 | Credentials only in adapter from Vault | **BLOCKED** | Live adapter boundary not realized; Security owns PASS later |
| AC-09 | Real submit for approved venues only | **BLOCKED** | No live ExecutionAdapterPort |
| AC-10 | Real cancel honest semantics | **PASS WITH REQUIRED CLARIFICATION** | Mapping approved (§8B); not implemented; adapters pending |
| AC-11 | Idempotency across retry/timeout/restart | **PASS WITH REQUIRED CLARIFICATION** | AD-L02-09 APPROVED WITH CONDITIONS; not implemented |
| AC-12 | Ambiguous → unknown/reconcile | **PASS WITH REQUIRED CLARIFICATION** | AD-L02-07 APPROVED WITH CONDITIONS; not implemented |
| AC-13 | Crash-window persistence | **PASS WITH REQUIRED CLARIFICATION** | AD-L02-11 APPROVED WITH CONDITIONS; not implemented |
| AC-14 | Minimum reconciliation path | **PASS WITH REQUIRED CLARIFICATION** | Contract §8A; live adapter query pending |
| AC-15 | Fail-closed new exposure under uncertainty | **PASS WITH REQUIRED CLARIFICATION** | Admission fail-closed; I/O path missing |
| AC-16 | No false success for UNKNOWN | **PASS WITH REQUIRED CLARIFICATION** | Encoding decided; must be implemented later without coercion |
| AC-17 | No false reject inviting duplicate | **PASS WITH REQUIRED CLARIFICATION** | Ambiguity→UNKNOWN decided; implementation pending |
| AC-18 | No credential leakage | **BLOCKED** | Security Review (not performed) |
| AC-19 | No cross-workspace execution/credentials | **BLOCKED** | Security Review |
| AC-20 | No Paper/Live API confusion | **PASS WITH REQUIRED CLARIFICATION** | Port currently paper-locked (good); live API design pending |
| AC-21 | No C7 bypass; deny-all unless PO act | **PASS** | Matrix deny-all; must remain until explicit PO act |
| AC-22 | No L03 audit log in L02 | **PASS** | Out of scope preserved |
| AC-23 | No L04 live UI | **PASS** | Out of scope preserved |
| AC-24 | No L05 replay subsystem | **PASS** | Out of scope preserved |
| AC-25 | Paper default; no auto live-capital | **PASS** | Anchors / admission deny without authorization |
| AC-26 | Fills → existing Position/Ledger | **PASS WITH REQUIRED CLARIFICATION** | Paper path proven; live must reuse same ownership |
| AC-27 | RK-03 limits only if PO-approved | **PASS** | No invented thresholds in this review |

### AC summary

| Status | Count |
| ------ | ----- |
| PASS | 6 |
| PASS WITH REQUIRED CLARIFICATION | 17 |
| BLOCKED | 4 |

---

## 17. Architecture Decision Register

| Decision ID | Finding | Evidence | Status | Required Action | PO impact | Security impact |
| ----------- | ------- | -------- | ------ | --------------- | --------- | --------------- |
| **AD-L02-01** | Canonical path required; parallel engine NON-SoT | AppModule mounts both; coordinator bypasses engine; EmergencyManager cancel-all | **APPROVED WITH CONDITIONS** | Freeze NON-SoT; never wire L02 through parallel stack | None | Dual-path hazard |
| **AD-L02-04** | Durable shared store; claim after S04 revalidation immediately before I/O; at-most-one claim | PO-L02-05A…05D freeze; Prisma pattern like KS/policy | **APPROVED WITH CONDITIONS** | Implement later under slice auth; Security review; wire verify≠claim on canonical path | PO freeze closed | SD-L02-04 still required |
| **AD-L02-07** | First-class `unknown` status + ambiguity matrix | PO-L02-14; `order-status.ts` gap | **APPROVED WITH CONDITIONS** | Implement encoding later; no coercion | None | SD-L02-06 |
| **AD-L02-09** | Workspace-unique clientOrderId/idempotencyKey; venue client id; UNKNOWN→reconcile | `PaperOrder` uniques; `order-intent.ts` | **APPROVED WITH CONDITIONS** | Live fields + adapter mapping later | None | SD-L02-05 |
| **AD-L02-11** | Pre-send marker; T0–T8; non-atomic venue boundary | Distributed I/O gap | **APPROVED WITH CONDITIONS** | Persist markers later; workers/reconcile | None | Lost-response |
| **AD-L02-14** | Live adapters must sit on ExecutionAdapterPort | Paper-only port; exchange stubs parallel | **APPROVED WITH CONDITIONS** | Implement live port adapters later; handshake ≠ authz | None | SSRF/egress/creds (SD-L02-01/02) |
| Cancel mapping | Honest mapping with UNKNOWN | §8B; EmergencyManager excluded | **APPROVED WITH CONDITIONS** | Implement later; exclude auto cancel-all | Aligns PO-12/08 | — |
| Reconciliation | Boundary defined; not realized live | Engine.reconcile paper | **APPROVED WITH CONDITIONS** | Minimum live reconcile path in authorized slices | Aligns PO | — |
| KS/policy/session | Durable gates align; EmergencyManager conflicts | KillSwitchPersistence vs EmergencyManager | **APPROVED WITH CONDITIONS** | Use durable KS only for L02 | Aligns PO-08/09/10 | SD-L02-07 |
| Authz gate order | S04 order acceptable if full cell mandatory | `decide-live-admission.ts` | **APPROVED WITH CONDITIONS** | Keep fail-closed; Security confirm | Order subject to review per PO | SD-L02-07 |
| Operational persistence | §8C design on PaperOrder pattern | `paper_orders` uniques exist; live columns missing | **APPROVED WITH CONDITIONS** | Migrate only under later auth | None | — |

---

## 18. Security Handoff

This Architecture Review is **NOT** Security Review.

**Do NOT mark SD-L02-01…07 PASS.**

Hand off (non-exhaustive):

| ID | Topic | Architecture note |
| -- | ----- | ----------------- |
| SD-L02-01 | SSRF / egress / venue allowlist | Live adapters not built; allowlist mandatory before I/O |
| SD-L02-02 | Credential isolation | Vault-in-adapter condition; handshake ≠ authz |
| SD-L02-03 | Workspace/tenant isolation | Must hold on live path + human-start + creds |
| SD-L02-04 | Human-start replay/staleness | Blocked on AD-L02-04; multi-instance critical |
| SD-L02-05 | Duplicate financial actions | Design ready for review (AD-L02-09/11 AWC) |
| SD-L02-06 | UNKNOWN/lost-response | Design ready for review (AD-L02-07 AWC) |
| SD-L02-07 | KS/authz fail-closed | Durable KS OK direction; EmergencyManager cancel-all hazard; C7 deny-all must hold |

Security may identify additional PO blockers; must not silently alter PO business decisions.

---

## 19. Developer Perspective

- Clear extension point: lift paper locks on `ExecutionEngineService` / `ExecutionAdapterPort` and add live adapters — **but not authorized yet**.
- Highest engineering risk: treating `live-trading-engine` or `EmergencyManager` as shortcuts.
- Human-start consume-on-evaluate will break any naive “admit then submit” implementation.
- OrderStatus needs an explicit uncertain state before honest venue I/O can be persisted.
- Cancel path post-adapter is under-wired even for paper production HTTP.

---

## 20. Consumer / Operator Perspective

- Operators must understand: KS / policy / session end **stop new live activity** but **do not** prove venue orders are cancelled.
- Open venue orders require visibility + authorized operational cancel path (not built as L02 cancel-all).
- UNKNOWN must be visible as unresolved — not “success” or silent failure.
- Binance handshake success must never be presented as “live trading enabled.”
- C7 remains deny-all; no operator expectation of live execution until explicit future acts.

---

## 21. Security / Financial-Safety Perspective

- Dual execution stacks + cancel-all prototype are unacceptable confusion risks for live capital.
- In-memory single-use proofs cannot protect multi-instance financial I/O.
- Blind retry after lost response is the primary duplicate-order hazard; persistence + reconcile are mandatory.
- Fail-closed admission is necessary but **not sufficient** without I/O-time revalidation and UNKNOWN honesty.
- No Security PASS is claimed.

---

## 22. Architecture Blockers

| ID | Blocker | Affected PO | Authority |
| -- | ------- | ----------- | --------- |
| AB-01 | Human-start durability/consumption (prior) | PO-L02-05A…05D | **CLOSED** — AD-L02-04 APPROVED WITH CONDITIONS; implementation + Security still pending |
| AB-02 | First-class UNKNOWN design | PO-L02-14 | **CLOSED as Arch design** — AD-L02-07 AWC; implementation pending |
| AB-03 | Live idempotency + crash-window design | PO-L02-13 | **CLOSED as Arch design** — AD-L02-09/11 AWC; implementation pending |
| AB-04 | Parallel live-trading-engine mounted with EmergencyManager cancel-all | PO-L02-08 (if mis-wired) | Remains **CONDITION** (AD-L02-01) |
| AB-05 | No live ExecutionAdapterPort for BINANCE/BYBIT/OKX | PO-L02-01 venue scope | Remains **CONDITION** (AD-L02-14) |
| AB-06 | Cancel/reconcile path | PO-L02-12; PO-08/09/10 | **CLOSED as Arch design** (§8A/8B); implementation pending |

---

## 23. Required Follow-Up

1. ~~PO escalation on human-start~~ — **CLOSED**.
2. ~~AD-L02-07 / 09 / 11 architecture design~~ — **CLOSED as APPROVED WITH CONDITIONS** (this act).
3. **Security Review** of SD-L02-01…07 (separate act) — **NOT PASS**; must cover UNKNOWN, idempotency abuse, reconciliation trust, claim races, SSRF/egress, credentials, isolation.
4. Live adapter realization under AD-L02-14 conditions — not authorized here.
5. Keep `live-trading-engine` / `EmergencyManager` NON-SoT for L02.
6. Do **not** implement schema/migrations/adapters/human-start store until explicitly authorized.
7. Planning Approval / Slice Approval — **not granted here**.

---

## 24. Explicit Implementation Boundary

```text
This Architecture Review does NOT authorize:
  - V3-L02 runtime implementation
  - schema changes / migrations
  - adapter implementation
  - venue connectivity / production venue I/O
  - credential provisioning
  - C7 activation / role grants
  - authz / human-start / Kill Switch / Session implementation changes
  - reconciliation implementation
  - order execution implementation
  - L03 / L04 / L05
  - live order submit / cancel
  - live capital movement
  - FIV
  - Slice Approval
  - L02 closure
  - Security PASS

PACKAGE ARCHITECTURE VERDICT = APPROVED WITH CONDITIONS
AD-L02-04 / 07 / 09 / 11 = APPROVED WITH CONDITIONS
V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED
S01–S06 remain NOT GRANTED
Live capital remains NOT ACTIVATED
Security Review = NOT PASS
No migrations / no live venue I/O / no FIV in this act
```

---

## STOP

**STOP.** Architecture Review recorded.

Do not implement V3-L02 from this artifact.
Do not activate C7.
Do not perform live venue I/O.
Resolve PO escalation (human-start) and complete Security Review before any implementation authorization.
