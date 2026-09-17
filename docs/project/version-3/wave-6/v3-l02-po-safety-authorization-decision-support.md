# V3-L02 Block B — Safety / Authorization PO Decision Support

**Document:** V3-L02 Block B Product Owner Decision Support Package
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 — Live order I/O on canonical path (LT-02)
**Nature:** PO decision support only. **Not** PO Decision Record. **Not** Architecture Review PASS. **Not** Security Review PASS. **Not** Slice Approval. **Not** implementation authorization.
**Authority:** Senior Staff Engineer / Chief Architect supporting Product Owner
**Block A (already PO DECIDED):** [`v3-l02-po-financial-scope-decision.md`](./v3-l02-po-financial-scope-decision.md) (`40dab28…`)
**Related:** [`v3-l02-po-decision-freeze.md`](./v3-l02-po-decision-freeze.md) · [`v3-l02-po-decision-support.md`](./v3-l02-po-decision-support.md)
**ADR:** [`docs/adr/ADR-020-live-capital.md`](../../../adr/ADR-020-live-capital.md)
**Repository baseline:** `40dab2821c9dfa984a15370c52507b0cc798b671`

```text
This package prepares evidence and options for Block B.
It does NOT make unresolved PO decisions.
It does NOT select Kill Switch / policy / session open-order behavior.
It does NOT activate C7 or redesign human-start.
V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED.
S01–S06 remain NOT GRANTED.
```

**Label legend:** EXISTING AUTHORITY · REPOSITORY FACT · UNRESOLVED PO DECISION · ARCHITECTURE DECISION · SECURITY DECISION · IMPLEMENTATION DETAIL

Protected leftovers outside this artifact were **not** modified.

---

## 1. Governance Context

| Item | Status |
| ---- | ------ |
| Block A (PO-L02-01, 02, 03, 12, 13, 14) | **PO DECIDED** |
| Block B (04, 05, 06, 08, 09, 10) | **SUPPORT PREPARED — decisions outstanding** |
| Architecture / Security L02 reviews | **NOT PASS** |
| Slice Approval S01–S06 | **NOT GRANTED** |
| V3-L02 IMPLEMENTATION | **NOT AUTHORIZED** |
| Live capital | **NOT ACTIVATED** |
| C7 | **DENY-ALL / UNBOUND** |

### Block A constraints that bind Block B (EXISTING AUTHORITY — PO)

Venue = BINANCE / BYBIT / OKX (MOCK test-only). Capital = trading execution only. Lifecycle / cancel / idempotency / UNKNOWN business invariants frozen. Canonical path direction required; `live-trading-engine` must not become SoT (AD-L02-01 still Arch review).

---

## 2. PO-L02-04 — C7 / Authorization

### 2.1 Repository facts

| Surface | Fact |
| ------- | ---- |
| Canonical authz | `PermissionClass` + `ROLE_PERMISSIONS` + `RolesGuard` + `decideAuthorization` |
| Workspace membership | Required on S03 live-policy Admin paths via `WorkspaceAccessService`; must apply to any future live I/O surface |
| RoleAdmin (C6) | Admin only — policy enable/disable; **≠** live execution (PO-S04-01) |
| PaperCommand | Trader + Admin — paper trading APIs |
| LiveCommand (C7) | **Never** granted to Reader/Researcher/Trader/Admin |
| Live REST | `/v1/live/*` mutations require `LiveCommand` → unreachable |
| S04 evaluation | Calls LiveCommand check; production always denied; does **not** activate C7 (PO-S04-02) |

### 2.2 Concepts that must stay separate

| Gate | Meaning |
| ---- | ------- |
| LIVE_POLICY_OPTED_IN | Workspace policy SoT only |
| AUTHORIZATION | PermissionClass decision for the action |
| HUMAN_START | S04 proof ≠ JWT |
| SESSION_ELIGIBILITY | S04 minimum session facts |
| C7 | LiveCommand cell — currently deny-all |
| VENUE_AVAILABILITY | Reachability ≠ authorization |

**EXISTING AUTHORITY invariants:**

- LIVE_POLICY_OPTED_IN MUST NOT be treated as execution authorization.
- JWT authentication MUST NOT be treated as human-start.
- L02 MUST NOT bypass C7.
- Do not activate C7 in this support act. Do not redesign auth framework.

### 2.3 Condition matrix

| CONDITION | CURRENT STATE | REQUIRED FOR L02 | EXISTING AUTHORITY | PO DECISION? | ARCH REVIEW? | SEC REVIEW? |
| --------- | ------------- | ---------------- | ------------------ | ------------ | ------------ | ----------- |
| Authenticated actor | JWT/session exists | Yes | Existing auth | No | No | Existing |
| Active workspace membership | Enforced on admin paths | Yes on live I/O | S03 pattern | Confirm binding | Wire detail | Yes |
| LIVE_POLICY_OPTED_IN | S02/S03 SoT | Necessary, not sufficient | S02/S03/S04 | No (frozen meaning) | No | No |
| AUTHORIZATION pass | C7 always deny | Some live place/cancel cell | PO-S04-01/02 | **Yes — which cell** | If new cell | **Yes** |
| HUMAN_START valid | In-memory S04 | Yes | PO-S04-06 | Grain (B2) | Durability | **Yes** |
| SESSION eligible | S04 minimum | Yes | PO-S04-05 | Residual (B3) | No redesign | — |
| C7 allowed | Deny-all | Only if C7 is chosen cell | Must not bypass | **Yes** | No redesign | **Yes** |
| Gate PASS | Composition port | Yes | S04 / ADR-020 | No | Residual attrs | — |
| KS inactive | Durable armed state | For new admission/submit | PO-S04-04 | Open-order fate = B4 | If cancel | **Yes** |
| V2 anchors | paperFreeze; liveCapitalAuthorized=false | Until activation act | V2 / ADR-020 | Activation separate | — | Yes |
| Venue available | Stubs / future adapters | Operational | Block A venues | Honesty | Adapter | SD-01 |

### 2.4 What remains undecided at PO/business level

**UNRESOLVED PO DECISION — authorization cell for live place/cancel:**

Which permission authorizes L02 live financial APIs, given C7 is deny-all and must not be bypassed?

**Neutral options (repository-backed; not ranked):**

**OPTION A** — Keep C7 deny-all; introduce/use an alternate explicit `PermissionClass` (or equivalent existing cell) dedicated to live place/cancel, granted only by separate PO act to named roles.

**OPTION B** — Explicit PO act activates `LiveCommand` / C7 for specific roles (still not a bypass; still require all other gates).

**OPTION C** — New PermissionClass named for live trading execution (distinct from LiveCommand), with role grants defined by PO act.

This support package does **not** answer that question.

**Status:** Evidence prepared · **PO DECISION OUTSTANDING** · Architecture (wiring) · Security review required before any grant.

---

## 3. PO-L02-05 — Human-start

### 3.1 Current contract (REPOSITORY FACT + EXISTING AUTHORITY)

S04: actor + workspace + session binding; TTL 15 minutes; single-use; consume-on-evaluate; **in-memory** store; token hash only; JWT alone insufficient; enablement ≠ start; Gate ≠ start.

**Do not silently change these.** Redesign is not approved by this package.

### 3.2 Scenario analysis

| # | Scenario | Current behavior | Safety | Financial | Replay | Proof reuse? | Proof lost? | Dup authz possible? | Arch? | Sec? |
| - | -------- | ---------------- | ------ | --------- | ------ | ------------ | ----------- | ------------------- | ----- | ---- |
| 1 | Single instance | Issue → evaluate consumes | Fail-closed if missing | N/A until I/O | Replay DENY | No after consume | No (until restart) | No via same token | Optional | Optional |
| 2 | Multiple instances | Store not shared | Operability DENY / split | May block legitimate I/O | Local replay still DENY | Cross-instance reuse of plaintext token if presented to empty store = **invalid/missing**, not valid forge of consumed proof | Yes on other nodes | New issue required per node | **Yes** | **Yes** |
| 3 | Process restart | Store wiped | Fail-closed | Blocks until re-issue | N/A | No | **Yes** | No | **Yes** | **Yes** |
| 4 | Worker retry | Second evaluate → REPLAYED | Fail-closed | Blocks retry without new proof | Protected | No | No | No | **Yes** (freshness vs I/O) | **Yes** |
| 5 | Concurrent evaluation | One consume wins | Fail-closed | One path | Protected | No | No | Race-safe deny | Yes | Yes |
| 6 | Two simultaneous consumers | Same as 5 | Fail-closed | Same | Protected | No | No | No | Yes | Yes |
| 7 | Stale proof | Expired → DENY | Fail-closed | Blocks | N/A | No | TTL expiry | No | — | Yes |
| 8 | Replay attempt | REPLAYED → DENY | Fail-closed | Blocks | Protected | No | No | No | — | **Yes** |
| 9 | Network/request retry | Same token → REPLAYED after first consume | Fail-closed | Client must re-issue | Protected | No | No | No | Yes | Yes |
| 10 | Crash between evaluate and venue I/O | Proof already consumed; I/O may be UNKNOWN | Admission spent; I/O ambiguous | **High** if retry without reconcile | Cannot reuse same proof | Consumed | Lost for retry path | Dup venue risk if blind retry | **Yes** (AD-11/04) | **Yes** (SD-05/06) |

### 3.3 Human-start grain options (not ranked)

| Grain | Meaning | Consequences | Security | Operational | S04 compatibility | Arch change? |
| ----- | ------- | ------------ | -------- | ----------- | ----------------- | ------------ |
| Workspace | One start for whole workspace | Broad blast radius | Weaker actor/session binding than S04 | Low friction | Weaker than current S04 | Likely yes |
| Actor | Bound to actor only | Cross-session risk | Weaker than S04 | Medium | Incomplete vs S04 | Likely yes |
| Session | Bound to session (current S04) | Matches S04 store fields | Current model | Medium | **Compatible** | Durability may still change |
| Order | Per order | High friction; many proofs | Narrow | High friction | Extension beyond S04 fields | Yes |
| Action/command | Per place/cancel | Narrowest | Strong replay resistance | Highest friction | Extension | Yes |
| Venue | Per venue | Cross-order on venue | Mixed | Medium | Extension | Yes |
| Request | Per HTTP/request id | Closest to L05 territory | Strong | High | Distinct from S04 | Yes; care L05 boundary |

```text
PO DECISION REQUIRED:
Exact business/security boundary (grain) of human-start authorization.

ARCHITECTURE REVIEW REQUIRED:
Durability, concurrency, restart, and consumption mechanism
(including revalidation-before-I/O with consume-on-evaluate).

SECURITY REVIEW REQUIRED:
Replay, stale proof, cross-workspace, cross-actor, and duplicate execution risk.
```

**Status:** Evidence prepared · **PO DECISION OUTSTANDING** (grain) · Arch/Sec required for durability.

---

## 4. PO-L02-06 — Session eligibility

### 4.1 Existing authority / facts

**EXISTING AUTHORITY (PO-S04-05):** Minimum eligibility — workspace association, lifecycle, execution mode, actor-context. No Session redesign.

**REPOSITORY FACT:** Dual models exist (durable paper `TradingSession` vs aggregate with `ExecutionMode`). S04 consumes caller-supplied `LiveAdmissionSessionFacts` / mappers.

### 4.2 Separate gates (dependency chain)

```text
SESSION ELIGIBLE
  ∧ LIVE_POLICY_OPTED_IN          (necessary, not sufficient)
  ∧ AUTHORIZATION PASS            (cell = PO-L02-04)
  ∧ HUMAN_START VALID             (grain/durability = PO-L02-05)
  ∧ C7 PASS                       (only if C7 is the chosen cell; else alternate cell)
  ∧ GATE PASS
  ∧ KILL SWITCH INACTIVE          (for new admission/submit)
  ∧ V2 ANCHORS ALLOW              (until separate activation)
  ∧ VENUE AVAILABLE               (operational; ≠ authorization)
  → may proceed toward live I/O after revalidation
```

Passing one gate does **not** imply another.

### 4.3 Classification

| Topic | Type |
| ----- | ---- |
| Minimum eligibility fields | EXISTING AUTHORITY |
| Dual session model mapping | REPOSITORY FACT / residual ARCH |
| Session-end open-order fate | **UNRESOLVED PO** (PO-L02-10) |
| New session states | OUT OF SCOPE — do not invent |

**Status:** Minimum eligibility **frozen by S04** · open-order-on-end **PO outstanding** · no redesign.

---

## 5. PO-L02-08 — Kill Switch + existing open orders

### 5.1 Scenario

Live order already submitted; venue order still open; then Kill Switch becomes ACTIVE.

### 5.2 Repository / authority facts

| Fact | Evidence |
| ---- | -------- |
| KS ACTIVE ⇒ DENY live admission | S04 / PO-S04-04 |
| Durable KS does **not** execute halt/cancel | `KillSwitchPersistenceService` comments |
| Non-canonical EmergencyManager may local-cancel | C7-gated; not L02 SoT |
| Block A: no false cancel; UNKNOWN cancel stays UNKNOWN | PO-L02-12 |
| Planning Package #9 mentions cancel-pending intent | Conflicts with “no auto cancel-all without PO” — **PO must resolve** |

### 5.3 Neutral options

**OPTION A**
- Description: Block new live admission/submission; existing venue orders remain subject to venue state and reconciliation.
- Financial: Exposure may continue until fill/cancel at venue.
- Operational: Ops must monitor/reconcile.
- Races: In-flight submit may become UNKNOWN then KS ACTIVE.
- Venue failure: Cannot force venue stop without cancel path.
- Reconciliation: Required for UNKNOWN / open inventory.
- Operator: Must see open/UNKNOWN honestly.
- Security: Prevents new exposure; does not reduce existing.
- Ledger/positions: Update only on verified fills.
- Policy/session: Independent gates.

**OPTION B**
- Description: Block new admission/submission **and** initiate cancellation of existing venue orders.
- Financial: Attempts to reduce exposure; cancel may be UNKNOWN/partial/fail (PO-L02-12).
- Operational: Cancel storm; rate limits; partial fills race.
- Races: Fill vs cancel; KS mid-submit.
- Venue failure: Cancel UNKNOWN leaves ambiguity.
- Reconciliation: Mandatory for cancel outcomes.
- Operator: Needs cancel/UNKNOWN visibility.
- Security: Broader credential use for cancel; abuse if KS flapping.
- Ledger/positions: Filled portions remain authoritative.
- Policy/session: Still separate.

**OPTION C**
- Description: Block new now; defer explicit cancel policy to a later PO/Ops runbook act (no automatic cancel in L02 code until decided).
- Supported by: Rule H / Decision Freeze “no auto cancel-all without explicit authorization”; durable KS non-cancel fact.
- Not a third invent-liquidation path — it is **deferral**.

### 5.4 State × KS activation

| Order condition when KS ACTIVEs | New admit/submit | Existing order fate under A | Under B |
| ------------------------------- | ---------------- | --------------------------- | ------- |
| REQUESTED / not yet submitted | DENY | N/A local | N/A |
| ADMITTED only | DENY further I/O | No venue yet | No venue yet |
| Being submitted / UNKNOWN | DENY new; reconcile in-flight | Venue may have order | Attempt cancel when known |
| ACCEPTED open | DENY new | Remains | Cancel attempt |
| Partially filled | DENY new | Remains / more fills possible | Cancel remainder; filled authoritative |
| Fully FILLED | DENY new | Terminal | Terminal |
| Cancel UNKNOWN | DENY new | Reconcile | Reconcile / avoid blind re-cancel |

```text
PO DECISION REQUIRED:
What should happen to existing venue orders when Kill Switch becomes ACTIVE?
(Options A / B / C above — not selected here.)
```

**Status:** **PO DECISION OUTSTANDING** · Arch/Sec review after choice.

---

## 6. PO-L02-09 — Policy disable + open orders

### 6.1 Scenario

`LIVE_POLICY_OPTED_IN` → `PAPER` while venue orders remain open.

### 6.2 Facts

**EXISTING AUTHORITY (PO-S03-09):** Disable → PAPER only; no exchange ops, no capital movement in S03.

**Distinction:** Policy controls **future admission**. It does **NOT** automatically prove what the venue has done with an existing order.

### 6.3 Neutral options

**OPTION A** — Block new live admission/submission only; existing venue orders continue under venue/reconcile rules.
**OPTION B** — Forbid disable until flat (no open/UNKNOWN live orders).
**OPTION C** — Auto-cancel existing venue orders on disable (subject to PO-L02-12).
**OPTION D** — Require operator/runbook action; system blocks new only.

Analyze dimensions for each (brief):

| Dimension | A | B | C | D |
| --------- | - | - | - | - |
| New admission/submit | Block | Block (and block disable) | Block | Block |
| Existing venue orders | Untouched by policy | Untouched until flat | Cancel attempted | Ops-driven |
| Fills after disable | May still arrive | Same until flat | Race with cancel | Same |
| Ledger/positions | Verified fills only | Same | Same | Same |
| Operator visibility | Must show policy PAPER ≠ flat | Clear gate | Cancel/UNKNOWN UI later | Runbook |

```text
PO DECISION REQUIRED:
Semantics when live policy is disabled with open venue orders.
```

**Status:** **PO DECISION OUTSTANDING**

---

## 7. PO-L02-10 — Session end + open orders

### 7.1 Scenario

Live session ends while venue orders remain open.

### 7.2 Facts

Invalid/incompatible session ⇒ S04 DENY for new admission. No authoritative live session-end cancel runbook. Do not redesign TradingSession.

### 7.3 Neutral options

**OPTION A** — Block new admission/submission only.
**OPTION B** — Require cancellation of open venue orders.
**OPTION C** — Require reconciliation inventory before session considered closed.
**OPTION D** — Require explicit operator action/runbook.
**OPTION E** — Combination (e.g., A + C, or A + D).

Fills after session end remain possible at venue until cancelled/filled — ledger must follow verified fills (Block A).

```text
PO DECISION REQUIRED:
Semantics when session ends with open venue orders.
```

**Status:** **PO DECISION OUTSTANDING** · residual Arch mapping of session models.

---

## 8. Cross-Cutting Admission Model

```text
LIVE_POLICY_OPTED_IN
  ≠ AUTHORIZATION
  ≠ HUMAN_START
  ≠ SESSION_ELIGIBILITY
  ≠ C7 PASS
  ≠ VENUE_AVAILABILITY
  ≠ KS INACTIVE implication for existing orders

ALLOW ≠ SUBMITTED ≠ ACCEPTED ≠ FILLED
UNKNOWN ≠ SUCCESS
Connectivity / handshake ≠ live trading authorization
```

All gates must be revalidated immediately before irreversible venue I/O (S04 / Block A).

Interaction sketch:

| If this fails… | Effect on new I/O | Effect on existing venue order |
| -------------- | ----------------- | ------------------------------ |
| C7 / authz | DENY | Per PO-L02-08/09/10 — not assumed |
| Human-start | DENY | Same |
| Session | DENY | Same |
| Policy PAPER | DENY new | Per PO-L02-09 |
| KS ACTIVE | DENY new | Per PO-L02-08 |
| Venue unavailable | DENY / fail-closed | Existing may remain |
| UNKNOWN prior op | No blind retry | Reconcile (PO-L02-13/14) |

---

## 9. Fail-Closed Matrix

L02 must remain **DENY / BLOCK / UNKNOWN** (not invent fail-open) when:

| Case | Response class |
| ---- | -------------- |
| Missing authorization | DENY |
| Inactive workspace membership | DENY |
| Missing / invalid / stale / replayed human-start | DENY |
| Wrong actor / workspace / session | DENY |
| C7 deny (if C7 is required cell) or alternate cell deny | DENY |
| Kill Switch ACTIVE | DENY new; open-order per PO-08 |
| Policy disabled / PAPER | DENY new; open-order per PO-09 |
| Session ineligible | DENY new; open-order per PO-10 |
| Venue unavailable | DENY / fail-closed |
| Credential unavailable/invalid | DENY |
| Ambiguous venue outcome | **UNKNOWN** (not success/reject) |
| Unknown order state | **UNKNOWN** + reconcile |

---

## 10. Architecture Handoff (NOT APPROVED)

| ID / topic | Input from Block B |
| ---------- | ------------------ |
| AD-L02-01 | Confirm canonical path; exclude parallel engine SoT |
| AD-L02-04 | Human-start durability, grain, concurrency, restart, consume vs revalidate-before-I/O |
| AD-L02-07 | UNKNOWN encoding (Block A frozen semantics) |
| AD-L02-09 | Idempotency mechanism |
| AD-L02-11 | Crash-window (esp. scenario 10) |
| Additional | Cancel mapping; KS/policy/session transition handling after PO choice; operational persistence |

Architecture decisions remain **NOT APPROVED**.

---

## 11. Security Handoff (NOT PASS)

| ID | Block B relevance |
| -- | ----------------- |
| SD-L02-01 | Egress when real venue I/O exists (Block A venues) |
| SD-L02-02 | Credential isolation for cancel/submit under KS options |
| SD-L02-03 | Workspace/tenant isolation; authz cell grants |
| SD-L02-04 | Human-start replay/staleness/multi-instance |
| SD-L02-05 | Duplicates under retry after consume / UNKNOWN |
| SD-L02-06 | UNKNOWN / lost response |
| SD-L02-07 | KS / authz fail-closed; open-order policy abuse |

Security decisions remain **NOT PASS**.

---

## 12. Three-Perspective Review

### Developer
Cannot implement live place/cancel API until PO-L02-04 cell is chosen. Cannot safely implement multi-instance human-start without Arch/Sec on AD-L02-04. Cannot implement S06 hooks until PO-08/09/10 chosen. Risk: wiring `live-trading-engine` EmergencyManager as if it were KS SoT.

### Consumer / operator
Without PO-08/09/10, operators do not know whether open venue orders are left, cancelled, or runbook-managed when KS/policy/session change. UNKNOWN must remain visible (Block A); L04 still unauthorized.

### Security / financial-safety
Highest residuals: blind retry after consume+crash; KS without cancel leaving capital at venue; KS with cancel causing UNKNOWN cancel storms; C7 activation without narrow roles; policy disable mistaken for flat book.

No option ranking; no PO winner recommended.

---

## 13. Consolidated PO Decision Register (Block B)

| ID | Decision | Current authority | Repo evidence | PO choice required? | Arch review? | Sec review? | Impl blocker? |
| -- | -------- | ----------------- | ------------- | ------------------- | ------------ | ----------- | ------------- |
| PO-L02-04 | Authz cell / C7 | Must not bypass; deny-all today | Matrix; LiveCommand unbound | **Yes** | Wiring | **Yes** | **Yes** |
| PO-L02-05 | Human-start grain + accept durability path | PO-S04-06 contract | In-memory consume | **Yes** (grain) | **Yes** | **Yes** | **Yes** multi-instance |
| PO-L02-06 | Session eligibility | PO-S04-05 minimum | Dual session models | Residual only | Mapping | — | No for minimum |
| PO-L02-08 | KS + open orders | Block new frozen; cancel OPEN | KS no venue cancel | **Yes** | After choice | **Yes** | **Yes** for S06 |
| PO-L02-09 | Policy disable + open | S03 PAPER only | No exchange on disable | **Yes** | — | Yes | **Yes** for S06 |
| PO-L02-10 | Session end + open | DENY new if ineligible | No cancel runbook | **Yes** | Residual | — | **Yes** for S06 |

---

## 14. Remaining Blockers

1. PO-L02-04 authorization cell
2. PO-L02-05 human-start grain (+ Arch/Sec durability)
3. PO-L02-08 / 09 / 10 open-order policies
4. Architecture Review (AD-01/04/07/09/11 + mappings)
5. Security Review (SD-01…07)
6. Block C items still outstanding (credentials env product choices, etc.)
7. Planning Approval + Slice Approval still **NOT GRANTED**

---

## 15. Explicit Implementation Boundary

```text
This support package does NOT authorize:
  runtime / schema / adapter / venue I/O / credentials /
  C7 activation / authz redesign / human-start redesign /
  Kill Switch behavior changes / Session redesign /
  reconciliation implementation / L03 / L04 / L05 /
  live order submit/cancel / FIV / Slice Approval / L02 closure /
  live-capital activation

V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED.
S01–S06 remain NOT GRANTED.
Live capital remains NOT ACTIVATED.
```

---

## STOP

**STOP.** Block B decision support is ready for Product Owner Decision Session.

Do not implement. Do not select open-order or authz options on behalf of the PO. Do not activate C7. Do not change human-start or Kill Switch.
