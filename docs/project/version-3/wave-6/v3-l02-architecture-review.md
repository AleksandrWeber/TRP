# V3-L02 Architecture Review

**Document:** Formal Architecture Review — V3-L02 Live Order I/O
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 — Live order I/O on the canonical execution path
**Authority:** Senior Staff Engineer / Chief Architect (Architecture Review only)
**Nature:** Architecture Review. **Not** Security PASS. **Not** Planning Approval. **Not** Slice Approval. **Not** implementation authorization. **Not** live-capital activation. **Not** FIV.
**Original review baseline:** `621080b6c9ea9c1e52f7d60a372fc4316174a1a5`
**Human-start PO freeze:** [`v3-l02-human-start-decision-freeze.md`](./v3-l02-human-start-decision-freeze.md)
**Re-review scope:** AD-L02-04 after PO-L02-05A…05D
**Re-review baseline:** post human-start decision freeze (same commit family as freeze + this update)

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
ARCHITECTURE BLOCKED
```

Overall V3-L02 Architecture remains **BLOCKED** because AD-L02-07 / AD-L02-09 / AD-L02-11 (and related live cancel/persistence) are still unresolved. This is **not** a Security PASS and **not** implementation authorization.

### AD-L02-04 re-review verdict (this act)

```text
AD-L02-04 = APPROVED WITH CONDITIONS
```

PO-L02-05A…05D freeze the durability and consumption model. Architecture can now specify a coherent technical realization for human-start that satisfies the frozen PO contract **without** changing PO decisions and **without** weakening UNKNOWN / no-blind-retry rules.

### Why package remains BLOCKED

1. ~~AD-L02-04 (human-start)~~ → **APPROVED WITH CONDITIONS** (see §5).
2. **AD-L02-07 / AD-L02-09 / AD-L02-11:** Canonical order domain has **no first-class UNKNOWN**; live crash-window / durable duplicate-prevention for venue I/O is **not** architecturally established on the canonical path.
3. **AD-L02-01 hazard:** Parallel `live-trading-engine` remains **mounted** and implements a **cancel-all** Kill Switch (`EmergencyManager`) that contradicts PO-L02-08 if mistaken for L02 SoT (conditions from prior review still apply).

Human-start PO escalation is **closed**. Remaining blockers prevent overall Architecture PASS.

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
| AD-L02-04 | **APPROVED WITH CONDITIONS** (this re-review) |
| Package Architecture Review | **BLOCKED** (remaining ADs) |
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

## 6. AD-L02-07 — UNKNOWN

### Requirement

UNKNOWN is first-class. UNKNOWN ≠ SUCCESS / ACCEPTED / REJECTED / FILLED / CANCELLED. Must not silently coerce.

### Repository evidence

| Surface | Representation |
| ------- | -------------- |
| `OrderStatus` | **No UNKNOWN** |
| Transitions | SUBMITTED → ACKNOWLEDGED / REJECTED / CANCEL_PENDING only |
| Adapter query | `outcome: 'unknown'` + `reconciliationRequired: true` (paper) |
| Engine reconcile | Can surface `reconciliationRequired`; does not encode durable UNKNOWN order status |

### Minimum architectural change required (design only — not implemented)

1. Introduce an explicit durable uncertain-outcome representation on the canonical order/execution path (status and/or execution-result marker) that is distinct from REJECTED/CANCELLED/FILLED/ACKNOWLEDGED.
2. Map adapter/transport ambiguity → that representation (never to success).
3. Persist reconciliation-required flag with order identity / venue identifiers.
4. Operator-visible state must not display false terminal success/cancel.

Exact schema encoding remains Architecture responsibility **after** blocker clearance; PO business distinctions remain frozen.

### Status

**APPROVED WITH CONDITIONS** (encoding approach approved in principle; **not** implementable as PASS until design is applied in a later authorized slice)

Conditions:

- Encoding must preserve all PO lifecycle distinctions.
- Must integrate with AD-L02-09/11 and cancel mapping.
- No false success / false reject that invites duplicate submit.

**Practical review status for L02 readiness:** **BLOCKED** pending concrete encoding selection committed in a follow-up Architecture note after AD-L02-04 PO escalation — current domain **cannot** represent UNKNOWN as first-class order state.

Register status for AD-L02-07: **BLOCKED** (domain gap).

---

## 7. AD-L02-09 — Idempotency

### Existing paper infrastructure

- `clientOrderId` + `idempotencyKey` on intent; order id derived from workspace + clientOrderId.
- Propose replay via repository lookups.
- Engine: non-EXECUTABLE → `already_executed`; fill uniqueness / optimistic concurrency.
- Intent mode hardcoded `paper`.

### Live gap

No proven durable “submitted-unconfirmed / UNKNOWN” + venue client-order-id contract on canonical live path. Exchange stubs throw; MOCK is parallel stack.

### Crash-window timeline (duplicate-order risk)

| Step | Event | Known? | Duplicate risk if naive retry |
| ---- | ----- | ------ | ----------------------------- |
| T0 | Request created | Local | Low if idempotent create |
| T1 | Admission | Local | N/A |
| T2 | Persistence (intent / about-to-submit) | **Required** | If missing → high |
| T3 | Venue request sent | In flight | High without durable marker |
| T4 | Venue accepts | Venue yes / local maybe no | **Critical** |
| T5 | Response lost | **UNKNOWN** | Blind retry → duplicate |
| T6 | Process state | Partial | Restart must recover T2–T5 markers |
| T7 | Retry | Only after reconcile | Blind retry forbidden (PO) |
| T8 | Reconciliation | Venue authoritative | Required before retry |

### Architectural requirements

1. Stable logical order identity + local idempotency key retained across retries.
2. Venue client-order-id (or equivalent) where supported; same identity on logical retry.
3. Durable persistence of submission/UNKNOWN state that survives restart.
4. Concurrent requests must serialize on identity (no double venue create).
5. Worker retry must not mint new venue identity.
6. After UNKNOWN: reconcile before retry (PO frozen).

### Status

**BLOCKED** — mechanism not established for live canonical path; paper primitives are insufficient alone.

---

## 8. AD-L02-11 — Crash Window

| Crash | Known outcome? | UNKNOWN? | Safe retry? | Reconcile? | Duplicate risk | Durable info required |
| ----- | -------------- | -------- | ----------- | ---------- | -------------- | ---------------------- |
| A. Before venue request | No venue effect | No | Yes (after gates) | No | Low if no send | Intent + admission context |
| B. During venue request | Ambiguous | **Yes** | **No** blind | **Yes** | **High** | Pre-send marker + client-order-id |
| C. After accept, before response | Venue may have order | **Yes** | **No** blind | **Yes** | **High** | Same |
| D. After response, before persist | Local loss | Treat UNKNOWN until recovered | No blind | Yes | High | Response must be durable ASAP |
| E. After persist, before ack | Known if persist includes outcome | Maybe | Depends | If needed | Lower | Persist-before-ack |
| F. During retry | Depends on prior marker | Often | Only post-reconcile | Yes | High if blind | Idempotent identity |
| G. During reconciliation | Evolving | Until resolved | No conflicting mutate | In progress | Mis-merge risk | Venue IDs + local IDs |

Architecture selection (conditional on later approval): prefer **persist “about-to-submit / submitted-unconfirmed” before or atomically around send**, never “send with no durable marker”.

### Status

**BLOCKED** — depends on AD-L02-07/09 durability; not currently guaranteed.

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

**BLOCKED** — honest live cancel semantics require UNKNOWN encoding + reconciliation boundary; EmergencyManager cancel-all must stay outside L02 SoT.

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

**APPROVED WITH CONDITIONS** (boundary defined); **implementation not authorized**. Minimum path required for AC-14 remains unrealized on live canonical path → readiness **BLOCKED**.

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

**BLOCKED** — required persistence model not present for live canonical UNKNOWN/crash-window; no schema changes in this act.

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
| AC-10 | Real cancel honest semantics | **BLOCKED** | UNKNOWN/cancel mapping incomplete |
| AC-11 | Idempotency across retry/timeout/restart | **BLOCKED** | AD-L02-09 |
| AC-12 | Ambiguous → unknown/reconcile | **BLOCKED** | AD-L02-07 |
| AC-13 | Crash-window persistence | **BLOCKED** | AD-L02-11 |
| AC-14 | Minimum reconciliation path | **BLOCKED** | Boundary defined; live path missing |
| AC-15 | Fail-closed new exposure under uncertainty | **PASS WITH REQUIRED CLARIFICATION** | Admission fail-closed; I/O path missing |
| AC-16 | No false success for UNKNOWN | **BLOCKED** | Needs UNKNOWN encoding |
| AC-17 | No false reject inviting duplicate | **BLOCKED** | Needs UNKNOWN encoding |
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
| PASS WITH REQUIRED CLARIFICATION | 9 |
| BLOCKED | 12 |

---

## 17. Architecture Decision Register

| Decision ID | Finding | Evidence | Status | Required Action | PO impact | Security impact |
| ----------- | ------- | -------- | ------ | --------------- | --------- | --------------- |
| **AD-L02-01** | Canonical path required; parallel engine NON-SoT | AppModule mounts both; coordinator bypasses engine; EmergencyManager cancel-all | **APPROVED WITH CONDITIONS** | Freeze NON-SoT; never wire L02 through parallel stack | None | Dual-path hazard |
| **AD-L02-04** | Durable shared store; claim after S04 revalidation immediately before I/O; at-most-one claim | PO-L02-05A…05D freeze; Prisma pattern like KS/policy | **APPROVED WITH CONDITIONS** | Implement later under slice auth; Security review; wire verify≠claim on canonical path | PO freeze closed | SD-L02-04 still required |
| **AD-L02-07** | No OrderStatus UNKNOWN | `order-status.ts` | **BLOCKED** | Design+encode UNKNOWN without changing PO semantics | None if encoding faithful | False success/reject (SD-L02-06) |
| **AD-L02-09** | Live idempotency not established on canonical path | Paper keys only; stubs throw | **BLOCKED** | Durable identity + venue client-order-id contract | None | Duplicate financial actions (SD-L02-05) |
| **AD-L02-11** | Crash-window not guaranteed | No live submitted-unconfirmed persistence | **BLOCKED** | Persist-before/around send; reconcile rules | None | Lost-response safety |
| **AD-L02-14** | Live adapters must sit on ExecutionAdapterPort | Paper-only port; exchange stubs parallel | **APPROVED WITH CONDITIONS** | Implement live port adapters later; handshake ≠ authz | None | SSRF/egress/creds (SD-L02-01/02) |
| Cancel mapping | Honest mapping needs UNKNOWN | Engine cancel unwired; EmergencyManager cancel-all | **BLOCKED** | Map outcomes; exclude auto cancel-all | Aligns PO-12/08 | — |
| Reconciliation | Boundary defined; not realized live | Engine.reconcile paper | **APPROVED WITH CONDITIONS** | Minimum live reconcile path in authorized slices | Aligns PO | — |
| KS/policy/session | Durable gates align; EmergencyManager conflicts | KillSwitchPersistence vs EmergencyManager | **APPROVED WITH CONDITIONS** | Use durable KS only for L02 | Aligns PO-08/09/10 | SD-L02-07 |
| Authz gate order | S04 order acceptable if full cell mandatory | `decide-live-admission.ts` | **APPROVED WITH CONDITIONS** | Keep fail-closed; Security confirm | Order subject to review per PO | SD-L02-07 |
| Operational persistence | Minimum set identified; absent for live UNKNOWN | Orders paper aggregate | **BLOCKED** | Specify persistence without L03/L04/L05 scope creep | None | — |

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
| SD-L02-05 | Duplicate financial actions | Blocked on AD-L02-09/11 |
| SD-L02-06 | UNKNOWN/lost-response | Blocked on AD-L02-07 |
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
| AB-02 | No first-class UNKNOWN on canonical orders | PO-L02-14; cancel/idempotency invariants | Architecture encoding (then implement under later auth) |
| AB-03 | No live canonical idempotency/crash-window persistence | PO-L02-13 | Architecture |
| AB-04 | Parallel live-trading-engine mounted with EmergencyManager cancel-all | PO-L02-08 (if mis-wired) | Architecture freeze NON-SoT (done here as condition) |
| AB-05 | No live ExecutionAdapterPort for BINANCE/BYBIT/OKX | PO-L02-01 venue scope | Architecture (later slices) |
| AB-06 | Honest cancel/reconcile path unrealized on canonical live I/O | PO-L02-12; PO-08/09/10 | Architecture |

---

## 23. Required Follow-Up

1. ~~PO escalation on human-start~~ — **CLOSED** (PO-L02-05A…05D recorded; AD-L02-04 APPROVED WITH CONDITIONS).
2. Architecture addendum / future authorized design notes: UNKNOWN encoding + cancel mapping + crash-window persistence (**AD-L02-07 / 09 / 11**) — still blocking package PASS.
3. **Security Review** of SD-L02-01…07 (separate act) — not started; SD-L02-04 must cover durable claim races.
4. Only after remaining Arch + Security gates: Planning Approval / Slice Approval consideration — **not granted here**.
5. Keep `live-trading-engine` / `EmergencyManager` NON-SoT for L02.
6. Do **not** implement durable human-start store until explicitly authorized.

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

PACKAGE ARCHITECTURE VERDICT = BLOCKED
AD-L02-04 = APPROVED WITH CONDITIONS
V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED
S01–S06 remain NOT GRANTED
Live capital remains NOT ACTIVATED
Security Review = NOT PASS
```

---

## STOP

**STOP.** Architecture Review recorded.

Do not implement V3-L02 from this artifact.
Do not activate C7.
Do not perform live venue I/O.
Resolve PO escalation (human-start) and complete Security Review before any implementation authorization.
