# V3-L02 PO Decision Support Package

**Document:** V3-L02 Product Owner Decision Support Package
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 — Live order I/O on canonical path (LT-02)
**Nature:** PO decision preparation only. **Not** a PO Decision. **Not** Planning Approval. **Not** Architecture Review PASS. **Not** Security Review PASS. **Not** Slice Approval. **Not** implementation.
**Authority:** Senior Staff Engineer / Chief Architect supporting Product Owner
**Preceding artifacts:**
- [`v3-l02-planning-proposal.md`](./v3-l02-planning-proposal.md)
- [`v3-l02-planning-decision-resolution.md`](./v3-l02-planning-decision-resolution.md)
- [`v3-l02-po-decision-freeze.md`](./v3-l02-po-decision-freeze.md) (`9c164bb…`)
**ADR:** [`docs/adr/ADR-020-live-capital.md`](../../../adr/ADR-020-live-capital.md)
**Repository baseline:** `9c164bbccc376c9ea01fba6b9323da0f04ee3449`

```text
This package prepares evidence and options for the Product Owner.
It does NOT make PO decisions.
It does NOT select options.
It does NOT grant V3-L02 implementation authorization.
V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED.
```

**Label legend used throughout:**

| Label | Meaning |
| ----- | ------- |
| **EXISTING AUTHORITY** | Binding governance already decided |
| **REPOSITORY FACT** | Observable in code/schema/docs |
| **ENGINEERING NOTE** | Technical observation — not a decision |
| **ARCHITECTURE CONCERN** | Requires Architecture Review |
| **SECURITY CONCERN** | Requires Security Review |
| **UNRESOLVED PO DECISION** | PO must choose; not answered here |

Protected leftovers outside this artifact were **not** modified.

---

## 0. Current State Snapshot

| Item | Status |
| ---- | ------ |
| V3-L02 implementation | **NOT AUTHORIZED** |
| Slice Approval S01–S06 | **NOT GRANTED** |
| Architecture decisions | **Not approved** |
| Security decisions | **Not PASS** |
| Live capital | **NOT ACTIVATED** |
| Live orders submitted/cancelled | **None by this program of work** |
| S01–S04 (L01) | **CLOSED** |
| ADR-020 | **Accepted** |
| D-GOV-05 | **GRANTED** (wave-level; slice gates remain) |
| C7 | **DENY-ALL / UNBOUND** |
| `paperFreeze` / `liveCapitalAuthorized` | **true** / **false** |

---

# BLOCK A — FINANCIAL SCOPE

## A1. PO-L02-01 — Venue

### Venue matrix (repository fact)

| Venue | Adapter exists | Implementation state | Paper/live capability | Production endpoint presence | Credentials requirement | Credential state | Network reachability evidence | Authz / governance | Inclusion in L02 already authorized? |
| ----- | -------------- | -------------------- | --------------------- | ---------------------------- | ------------------------ | ---------------- | ----------------------------- | ------------------ | ------------------------------------ |
| **MOCK** | Yes (`MockExchangeAdapter`) | Full in-process submit/cancel/query sim | Simulation only | N/A (in-process) | None | N/A | N/A | Not live capital | **No** — not PO-selected |
| **BINANCE** | Yes (`BinanceExchangeAdapter` stub) | Submit/cancel **throw** US210; handshake adapter hits `https://api.binance.com` API-restrictions | Not live-order capable | Handshake uses live API host | Vault type `binance` + Connections | Types exist; L02 must not provision | Handshake path only; order path stubbed | Live order I/O **NOT AUTHORIZED** | **No** |
| **BYBIT** | Yes (stub) | Submit/cancel throw; handshake `not_implemented` | Not live-order capable | No production order I/O | Vault type `bybit` | Types exist; not provisioned by L02 | No proven order reachability | Same | **No** |
| **OKX** | Yes (stub) | Submit/cancel throw; handshake `not_implemented` | Not live-order capable | No production order I/O | Vault type `okx` (+ passphrase fields) | Types exist; not provisioned by L02 | No proven order reachability | Same | **No** |
| **PaperExecutionAdapter** | Yes — sole Nest `EXECUTION_ADAPTER` | Canonical paper fills | **Paper only** (`liveCapital: false`) | N/A | Rejects trading credentials in factory | N/A | Local | Paper Freeze / RC-16 | Paper path authorized; **not** live |

**EXISTING AUTHORITY:** Adapter existence ≠ live trading authorization (ADR-020; Decision Freeze; Paper Freeze). Live capital **NOT AUTHORIZED**. D-ARCH-08 / D-OPS-01 remain OPEN for venue matrix / FIV venue.

**Unresolved questions:** Which venues (if any) enter L02 live execution scope? Testnet vs mainnet? MOCK-only harness first?

### Neutral options (not ranked)

**OPTION A**
- Description: MOCK/harness only for L02 shape (no real venue capital)
- Advantages: Proves contracts without real capital risk
- Consequences: Does not satisfy “real venue submit/cancel” until later PO act
- Security: Minimal egress
- Financial-safety: No real capital movement
- Operational: No FIV venue yet
- Dependencies: Still need UNKNOWN/idempotency contracts

**OPTION B**
- Description: Single venue on **testnet** only
- Advantages: Real protocol surface with limited capital risk
- Consequences: Requires testnet credentials, egress allowlist, Ops environment
- Security: SSRF/egress + secret purpose separation
- Financial-safety: Still real venue semantics; test funds
- Operational: FIV path possible later
- Dependencies: PO-L02-11; SD-L02-01/02; credential provisioning (separate)

**OPTION C**
- Description: Single venue **mainnet-gated** (separate activation gate)
- Advantages: Production protocol parity
- Consequences: Highest capital risk; activation gates mandatory
- Security: Full Sec review; no accidental enable
- Financial-safety: Real capital exposure if activated
- Operational: Ops runbooks; FIV/release gates
- Dependencies: Activation ≠ L02 code ship; PO-L02-16 boundaries

```text
PO DECISION REQUIRED:
Which venues, if any, are included in L02 live execution scope?
(Do not answer in this artifact.)
```

---

## A2. PO-L02-02 — Capital scope

### Separation (repository + ADR)

| ORDER EXECUTION (LT-02 path evidenced) | CAPITAL MOVEMENT (not on canonical Orders/Execution path) |
| -------------------------------------- | --------------------------------------------------------- |
| submit | deposit |
| cancel | withdrawal |
| fills | transfer |
| positions (from fills) | treasury movement |
| ledger updates via existing ownership | funding movement |

**EXISTING AUTHORITY:** ADR-020 / Planning Package L02 describe live **order** I/O on canonical path (Risk→Orders→Execution→adapter→Venue→Fill→Position→Ledger). ADR-020 does **not** authorize deposits/withdrawals/transfers as L02 scope. Live capital activation remains separately gated.

**REPOSITORY FACT:** No deposit/withdrawal/transfer execution flow in canonical Orders / ExecutionEngine. Connectivity may expose withdraw **capability flags** — not an order-execution product.

**ENGINEERING NOTE:** Expanding to banking/treasury would require explicit PO expansion beyond LT-02 as documented.

```text
PO DECISION REQUIRED:
Confirm exact financial scope of L02
(order-induced execution only vs expand to banking/treasury).
```

**OPTION A** — Order-induced only (submit/cancel/fill/position/ledger)
**OPTION B** — Include deposits/withdrawals/transfers/treasury (explicit expansion)
**OPTION C** — Order-induced only now; permanently exclude banking from L02

(Consequences: A/C keep LT-02 boundary; B creates new product surface and Sec/Ops scope.)

---

## A3. PO-L02-03 — Order lifecycle

### Existing repository lifecycle (**REPOSITORY FACT**)

Canonical `OrderStatus` (`orders/domain/order-status.ts`):

`proposed → risk_pending → approved → reserved → executable → submitted → acknowledged → filled`
(+ `rejected`, `cancel_pending` → `cancelled`; `cancel_pending` may also → `filled`)

| Business distinction | Repo representation | Notes |
| -------------------- | ------------------- | ----- |
| REQUESTED | `proposed` (+ intent) | Manual/strategy propose |
| ADMITTED | **Not** an OrderStatus — S04 `LiveAdmissionDecision` | Separate from order SM |
| SUBMITTED | `submitted` | Engine submit started |
| ACCEPTED | Closest: `acknowledged` | Naming differs — do not silently rename |
| REJECTED | `rejected` | Known failure |
| UNKNOWN | **Missing** as OrderStatus | Paper adapter query can return `outcome: 'unknown'` |
| FILLED | `filled` | |
| CANCELLED | `cancelled` | via `cancel_pending` |

**Ambiguity:** Domain order state vs venue outcome are not the same; lost-response has no first-class UNKNOWN on Order aggregate.

**ARCHITECTURE CONCERN:** Encoding of UNKNOWN / reconciliation_required (AD-L02-07). Do not design final SM here.

```text
PO INPUT: Confirm the business-level distinctions above are required.
ARCHITECTURE REVIEW: Determine encoding/state-machine representation.
```

---

## A4. PO-L02-12 — Cancel semantics

| Scenario | Venue/API behavior known? | Existing repo handling | Financial risk | Unresolved contract question |
| -------- | ------------------------- | ---------------------- | -------------- | ---------------------------- |
| 1. cancel accepted | Venue-specific; stubs throw | Paper adapter cancel ack | Low if verified | How to persist verified cancel live |
| 2. already cancelled | Usually idempotent at venues | Paper may confirm cancel | Low | Idempotent success vs error |
| 3. already filled | Race common | `cancel_pending` → `filled` allowed | High if ignore fill | Filled wins — confirm product rule |
| 4. not found | Ambiguous (never existed vs wrong id) | Limited | Duplicate/orphan risk | Map to UNKNOWN vs reject |
| 5. timeout | Unknown accept possible | No live timeout policy | **High** | Treat as UNKNOWN? |
| 6. network failure | Same | Same | **High** | Same |
| 7. venue unavailable | Fail closed likely | Fail patterns paper | Medium | Deny new vs UNKNOWN in-flight |
| 8. response lost | Accept possible | Not modeled live | **Critical** | Reconcile before retry |
| 9. UNKNOWN | First-class needed | Not on OrderStatus | **Critical** | Operator + retry policy |

**EXISTING AUTHORITY DEFAULT:** Ambiguous cancel **MUST NOT** be treated as successful cancellation; HTTP ack ≠ final financial state (Decision Freeze).

---

# BLOCK A5 — UNKNOWN / IDEMPOTENCY

## A5. PO-L02-13 — Idempotency / lost response

### Failure scenario

```text
Client → platform → venue accepts order → response lost
  → platform does not know result → retry arrives
```

### Analysis by concern

| Concern | Repository fact | Authority | Classification |
| ------- | --------------- | --------- | -------------- |
| Local idempotency key | `PaperOrder` `@@unique([workspaceId, idempotencyKey])` (+ clientOrderId, intentHash) | ADR-018 #9 | Fact + partial control |
| Venue client-order-id | Field exists; live venue use OPEN | Needed for query | **ARCHITECTURE CONCERN** |
| Durable persistence | Paper aggregate + version; no live UNKNOWN marker | Crash window OPEN | **ARCHITECTURE CONCERN** (AD-L02-11) |
| Crash window | Venue accept before local persist possible | D-ARCH-18 OPEN | Arch + Sec |
| Reconciliation | Paper query unknown; live query stubs return null | ADR-012 reconcile intent | Arch |
| Retry | Paper `already_executed` if not EXECUTABLE | — | Insufficient alone for lost-response |
| Duplicate prevention | Local uniques prevent second **local** row; not venue-proof | Rule C | **PO + Arch + Sec** |
| Concurrent / worker / restart | Optimistic version; outbox at-least-once | ADR-013 | Arch |

**MANDATORY INVARIANT (EXISTING AUTHORITY):** UNKNOWN MUST NOT BECOME SUCCESS BY ASSUMPTION.
**MANDATORY INVARIANT (EXISTING AUTHORITY):** NO BLIND RETRY AFTER UNKNOWN.

| Part | Owner |
| ---- | ----- |
| Confirm product policy (reconcile-first) | **PO** |
| Mechanism (clientOrderId, markers, query) | **Architecture** |
| Abuse/replay of retries | **Security** |

**Do not design final mechanism in this package.**

---

## A6. PO-L02-14 — UNKNOWN semantics (business meaning)

**Business meaning (EXISTING AUTHORITY framing):** Venue outcome cannot currently be established as verified success or verified rejection.

### Decision questions for PO (not answered here)

1. Does UNKNOWN mean venue outcome cannot currently be established?
2. Does UNKNOWN permit automatic retry?
3. Is reconciliation mandatory before any further financial action on that intent?
4. What operator-visible state is required (backend contract now; UI later L04)?
5. What prevents duplicate financial action while UNKNOWN?

**EXISTING AUTHORITY DEFAULT (where already binding):** Automatic retry while UNKNOWN is **forbidden** (no blind retry). False success forbidden.

---

# BLOCK B — AUTHORIZATION / SAFETY

## B1. PO-L02-04 — C7 / authorization

### Canonical auth (**REPOSITORY FACT**)

- `PermissionClass` + `ROLE_PERMISSIONS` role matrix + `RolesGuard`
- Workspace membership via `WorkspaceAccessService` (S03 pattern)
- `PaperCommand` granted to Trader/Admin; used for paper trading
- `RoleAdmin` (C6): Admin — policy enablement (S03), **not** live execution
- `LiveCommand` (C7): **never** listed in any role’s permissions → deny-all
- `/v1/live/*` mutations require C7 → unreachable for all roles
- S04 evaluates LiveCommand without activating it (PO-S04-02)

### Concepts must stay separate

| Concept | Meaning |
| ------- | ------- |
| LIVE_POLICY_OPTED_IN | Workspace policy SoT only |
| AUTHORIZATION | PermissionClass decision |
| HUMAN_START | S04 proof ≠ JWT |
| SESSION ELIGIBILITY | S04 minimum session facts |
| C7 | LiveCommand — currently deny-all |
| VENUE AVAILABILITY | Reachability ≠ authorization |

### Authorization decision matrix

| Condition | Required for live I/O? | Current repository state | Open decision | Security review? |
| --------- | ---------------------- | ------------------------ | ------------- | ---------------- |
| Authenticated actor | Yes | JWT/session auth exists | — | Existing |
| Workspace membership | Yes | Enforced on admin paths; must hold on live I/O | Confirm binding on live API | Yes |
| LIVE_POLICY_OPTED_IN | Necessary, not sufficient | S02/S03 SoT | — | — |
| Human-start valid | Yes (ADR-020 / S04) | In-memory proof | Grain/durability | Yes |
| Session eligible | Yes | S04 mappers | — | — |
| LiveCommand/C7 allowed | **If** C7 is the cell | Always denied | Activate C7 vs alternate cell | **Yes** |
| Gate PASS | Yes | Composition Gate port | — | — |
| KS inactive | Yes | Durable KS | Open-order policy separate | Yes |
| V2 anchors allow | Yes today for ALLOW | `liveCapitalAuthorized=false`, paperFreeze | Activation separate | Yes |
| Venue available | Operational | Stubs / MOCK | Venue matrix | Yes |

**EXISTING AUTHORITY DEFAULT:** No C7 bypass. No silent C7 activation. Policy opt-in ≠ execution.

```text
UNRESOLVED PO DECISION:
Which authorization cell authorizes L02 live place/cancel
(keep C7 deny-all + alternate PermissionClass vs activate C7 for named roles vs new PermissionClass)?
```

**OPTION A** — Keep C7 deny-all; introduce/use alternate explicit permission for live I/O
**OPTION B** — Activate C7 for specific roles via explicit PO act
**OPTION C** — New PermissionClass dedicated to live place/cancel

---

## B2. PO-L02-05 — Human-start

### Current contract (**REPOSITORY FACT** + S04)

Actor / workspace / session binding; TTL 15m; single-use; consume-on-evaluate; in-memory store; hash-only token storage; JWT alone insufficient.

### Scenario analysis

| Scenario | What happens today | Correctness | Security | Arch review? | Sec review? |
| -------- | ------------------ | ----------- | -------- | ------------ | ----------- |
| 1. One instance | Issue → evaluate consumes → ALLOW path possible only with harness overrides of V2 | OK for single process | Binding holds | Optional | Optional |
| 2. Multiple instances | Proof not shared across processes | Fail-closed DENY or split-brain operability | No shared forge if hash local | **Required** | **Required** |
| 3. Process restart | Store wiped | Fail-closed | Safe | **Required** for prod | Yes |
| 4. Worker retry | Second evaluate → REPLAYED | Fail-closed | Safe against replay | Yes (freshness model) | Yes |
| 5. Concurrent evaluation | One consume wins | Fail-closed | Safe | Yes | Yes |
| 6. Race | Same | Fail-closed | Safe | Yes | Yes |
| 7. Stale proof | Expired → DENY | Fail-closed | Safe | — | Yes |
| 8. Replay attempt | REPLAYED → DENY | Fail-closed | Safe | — | Yes |

**CRITICAL:** Do not silently replace in-memory storage. Do not treat redesign as approved.

```text
PO DECISION QUESTION:
What grain is required for live I/O human-start
(per I/O vs session-scoped vs hybrid)?

ARCHITECTURE / SECURITY QUESTIONS:
Is durable multi-instance storage required before any production-like live I/O?
What freshness model preserves single-use under revalidation-before-I/O?
```

**OPTION A** — Per I/O issue+consume (same instance assumptions)
**OPTION B** — Session-scoped durable proof (requires Arch/Sec design — not approved here)
**OPTION C** — Hybrid (session arm + per-I/O revalidation signals)

---

## B3. PO-L02-06 — Session eligibility

**EXISTING AUTHORITY (PO-S04-05):** Minimum eligibility — workspace association, lifecycle, execution mode, actor-context. No Session redesign.

**Separated from:** policy opt-in, human-start, authorization, C7.

**Unresolved business questions only:** Whether ending a session requires cancel/reconcile of venue orders (see B6 / PO-L02-10). Eligibility for **new** activity when session invalid = DENY (existing).

---

## B4. PO-L02-08 — Kill Switch + open orders

### Scenario
Live order exists at venue → Kill Switch becomes ACTIVE.

| Concern | Existing authority / fact | Neutral observation |
| ------- | ------------------------- | ------------------- |
| New admission | S04 DENY when KS ACTIVE | **EXISTING AUTHORITY DEFAULT:** block |
| New submission | Must revalidate; KS ACTIVE blocks | Same |
| Existing venue order | Durable KS does **not** cancel venue | Fate **OPEN** |
| Cancellation | EmergencyManager (non-canonical, C7) local cancel only | Not authoritative live SoT |
| Reconciliation | Not productized for live | OPEN |
| Operator notification | Not specified for live KS | OPEN |
| Position/ledger | Reflect fills when known; UNKNOWN separate | — |

**OPTION A** — Block new only; leave existing venue orders untouched (ops runbook)
**OPTION B** — Attempt venue cancel of outstanding live orders
**OPTION C** — Block new + venue cancel
**OPTION D** — Block new now; defer cancel policy to later explicit runbook act

```text
PO DECISION REQUIRED:
What should happen to existing venue orders when KS becomes ACTIVE?
```

Do not assume cancel-all. Do not assume no-cancel as final product policy — both are options.

---

## B5. PO-L02-09 — Policy disable + open orders

**REPOSITORY FACT / AUTHORITY:** PO-S03-09 disable → PAPER only; no exchange ops in S03.

**OPTION A** — Block new live I/O only
**OPTION B** — Forbid disable until flat
**OPTION C** — Auto-cancel venue orders
**OPTION D** — Runbook / operator action

```text
PO DECISION REQUIRED:
Semantics when LIVE_POLICY_OPTED_IN → PAPER with open venue orders.
(Do not imply disable cancels venue orders without choosing C.)
```

---

## B6. PO-L02-10 — Session end + open orders

**OPTION A** — Block new only
**OPTION B** — Require cancellation
**OPTION C** — Require reconciliation
**OPTION D** — Require operator action / runbook
**OPTION E** — Combination of the above

```text
UNRESOLVED PO DECISION: session-end open-order policy.
ARCHITECTURE CONCERN: interaction with dual session models / eligibility mappers.
```

---

# BLOCK C — INFRASTRUCTURE / SECURITY

## C1. PO-L02-07 — Credentials / Vault

**REPOSITORY FACT chain:**

```text
Connection (metadata + vaultSecretId)
  → SecretVaultService (AES-GCM; AAD workspaceId:type:purpose)
  → workspace-scoped secret
  → (intended) venue adapter retrieve-at-I/O
```

| Topic | Fact |
| ----- | ---- |
| Workspace isolation | Unique slot + AAD + membership/C8 |
| Raw credential exposure | Not in Connection view/frontend; retrieve server-memory |
| Env vars | `VAULT_WRAPPING_KEY` host wrapping key — not a Vault record |
| Dev/test/prod credentials | Not provisioned by L02; Ops separate |
| Second secret store | Forbidden by ownership freeze |
| ExchangeFactory | Credential-less stubs — insufficient for live signing |

**PO is NOT asked to redesign Vault.**

**PO-relevant only:** Whether testnet/mainnet secret purposes must be separated before any real venue (product/risk choice) — otherwise Arch/Sec/Ops.

---

## C2. PO-L02-11 — Venue reachability

| Layer | Distinct? |
| ----- | --------- |
| Adapter exists | Yes |
| Adapter implemented for orders | MOCK yes; BINANCE/BYBIT/OKX **no** (throw) |
| Credentials exist | Vault types exist; instances not assumed |
| Network reachable | Handshake Binance only (restrictions); order path no |
| Venue operational | Unknown / not proven for orders |
| Production trading authorized | **No** |

### Egress decision matrix (evidence only — nothing enabled)

| Venue | Endpoint evidence | Allowed for live orders today? | Allowlist status | SSRF protection | Prod reachability evidence | Sec review status |
| ----- | ----------------- | ------------------------------ | ---------------- | --------------- | -------------------------- | ----------------- |
| MOCK | In-process | N/A | N/A | N/A | Sim | N/A |
| BINANCE | Handshake `api.binance.com` | **No** order I/O | No L02 allowlist product | Not L02-complete | Handshake only | **REQUIRES REVIEW** (SD-01) |
| BYBIT | None for orders | No | None | — | None | **REQUIRES REVIEW** |
| OKX | None for orders | No | None | — | None | **REQUIRES REVIEW** |

Do not enable endpoints. Do not perform live venue I/O.

---

## C3. Security decision support (SD-L02-01…07)

| ID | Topic | Evidence to review | Status |
| -- | ----- | ------------------ | ------ |
| SD-01 | SSRF / egress | Fixed endpoints needed; no free-form URL | **REQUIRES SECURITY REVIEW** — not PASS |
| SD-02 | Credential isolation | Vault AAD + C8; adapter retrieve | **REQUIRES SECURITY REVIEW** |
| SD-03 | Workspace isolation | Vault + order workspace keys; C7 posture | **REQUIRES SECURITY REVIEW** |
| SD-04 | Replay / stale human-start | Single-use/TTL; multi-instance gap | **REQUIRES SECURITY REVIEW** |
| SD-05 | Duplicate financial action | Local uniques ≠ venue-proof | **REQUIRES SECURITY REVIEW** |
| SD-06 | UNKNOWN / lost response | Rules B/C; no live UNKNOWN SM | **REQUIRES SECURITY REVIEW** |
| SD-07 | KS / authz fail-closed | S04 DENY; open-order gap | **REQUIRES SECURITY REVIEW** |

---

## C4. PO-L02-15 — Operational persistence

**Minimum information candidates for operational correctness (not approved schema):**

mode; venue order id; client order id; idempotency key; submission attempt/correlation; UNKNOWN/reconcile markers; timestamps; workspace/session/actor.

**Existing relevant models (**REPOSITORY FACT**):** `PaperOrder` (clientOrderId, idempotencyKey, adapterOrderId, status, version); `PaperFill`; ledger reservations; outbox envelopes; S02 live policy; KS state.

**Separated from:** L03 tamper-evident log; L04 UI; L05 replay subsystem.

**ARCHITECTURE CONCERN:** Exact schema/markers (AD-L02-11). No schema changes in this task.

---

## C5. PO-L02-16 — L02 boundaries

**EXISTING AUTHORITY exclusions (reconfirmed):**

L03 redesign · L04 redesign · L05 subsystem · new C7 architecture (activation only via separate PO act) · Paper Freeze modification · second credential store · second execution engine · `live-trading-engine` as SoT · automatic cancel-all without explicit decision · deposits/withdrawals/transfers/treasury · unrelated capital ops · live capital outside ADR-020 + activation gates.

**Boundary conflicts found:**

1. Planning Package L02 scenario #9 “cancel pending” language vs durable KS non-cancel vs Rule H no auto cancel-all — **conflict for PO-L02-08**, not resolved here.
2. Parallel `live-trading-engine` still mounted vs ADR-020 single path — **AD-L02-01** confirmation needed.
3. Binance handshake uses live API host while order adapters stub — risk of confusing “connected” with “live trading authorized” (honesty).

---

# DECISION REGISTER

| ID | Decision | Current authority | Repository evidence | PO choice required? | Architecture review? | Security review? | Implementation blocker? |
| -- | -------- | ----------------- | ------------------- | ------------------- | -------------------- | ---------------- | ----------------------- |
| PO-L02-01 | Venue scope | D-ARCH-08/D-OPS OPEN; live not authorized | MOCK sim; venue stubs; paper adapter | **Yes** | Yes (binding) | Yes if real venue | **Yes** |
| PO-L02-02 | Capital scope | ADR-020 order path | No banking path | **Yes** (confirm) | If expand | If expand | Yes if unclear |
| PO-L02-03 | Lifecycle distinctions | Rules A/E | OrderStatus; no UNKNOWN | Confirm distinctions | **Yes** encoding | — | Partial |
| PO-L02-04 | Authz / C7 | PO-S04-01/02; C7 deny | Matrix deny-all | **Yes** (cell) | If new cell | **Yes** | **Yes** |
| PO-L02-05 | Human-start grain | PO-S04-06 | In-memory consume | **Yes** | **Yes** | **Yes** | **Yes** for multi-instance |
| PO-L02-06 | Session eligibility | PO-S04-05 | S04 facts | Residual only | Residual | — | No for minimum |
| PO-L02-07 | Credentials boundary | ADR-020 Vault | Connection→Vault | Env split only | Adapter bind | **Yes** | For real venue |
| PO-L02-08 | KS + open orders | Rule H; runbook OPEN | KS no venue cancel | **Yes** | If cancel | **Yes** | For S06 |
| PO-L02-09 | Policy disable + open | PO-S03-09 | Disable=PAPER only | **Yes** | — | Yes | For S06 |
| PO-L02-10 | Session end + open | Eligibility DENY new | Dual sessions | **Yes** | Residual | — | For S06 |
| PO-L02-11 | Reachability honesty | Honesty rules | Stub vs handshake | Confirm claims | — | SD-01 | Honesty |
| PO-L02-12 | Cancel semantics | No false cancel | Paper cancel path | Confirm invariants | **Yes** | SD-06 | Partial |
| PO-L02-13 | Idempotency / lost response | Rules B/C | Paper uniques | Confirm policy | **Yes** | **Yes** | **Yes** |
| PO-L02-14 | UNKNOWN meaning | Rules A/B/C | No Order UNKNOWN | Confirm Qs | **Yes** | **Yes** | **Yes** |
| PO-L02-15 | Ops persistence | L03 boundary | PaperOrder fields | Boundary confirm | **Yes** schema | — | Before crash-safe live |
| PO-L02-16 | Exclusions | Roadmap/ADR | Parallel engine exists | Confirm freeze | AD-01 | — | Dual-SoT risk |

OPEN items are **not** converted to approved decisions by this table.

---

# THREE-PERSPECTIVE REVIEW (consequences — not recommendations)

### Developer
Without PO venue/authz/human-start/UNKNOWN decisions, implementers cannot safely start S04–S06. S01 contracts can be drafted only after Planning Approval and AD-07 direction. Dual `live-trading-engine` remains a foot-gun until AD-01 freeze is confirmed.

### Consumer / operator
Operators lack defined behavior for KS/policy/session when orders sit at venue (PO-08/09/10). UNKNOWN honesty is required before any live UI (L04 still unauthorized). Claiming “Live” from handshake/connect would be misleading.

### Security / financial-safety
Highest residual risks: lost-response duplicates; C7 activation without review; SSRF if free-form URLs; accidental mainnet; invented cancel-all. Fail-closed admission exists; live I/O path does not.

---

## Explicit Non-Authorizations

```text
No PO decisions are made by this artifact.
No Architecture PASS.
No Security PASS.
No Slice Approval.
V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED.
Live capital remains NOT ACTIVATED.
```

---

## STOP

**STOP.** Decision support package ready for Product Owner Decision Session.

Do not implement V3-L02. Do not select options on behalf of the PO. Do not perform FIV or live venue I/O.
