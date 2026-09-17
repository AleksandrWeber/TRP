# V3-L02 PO Block B Decision Freeze

**Document:** V3-L02 Product Owner Block B Decision Freeze Record
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 — Live order I/O on canonical path (LT-02)
**Nature:** Official Product Owner decision record for Block B safety/authorization items. **Not** Architecture Review PASS. **Not** Security Review PASS. **Not** Planning Approval. **Not** Slice Approval. **Not** implementation authorization. **Not** live-capital activation. **Not** FIV.
**Authority:** Product Owner
**Prepared by:** Senior Staff Engineer / Chief Architect under PO governance (recording only)
**Block A:** [`v3-l02-po-financial-scope-decision.md`](./v3-l02-po-financial-scope-decision.md)
**Block B support:** [`v3-l02-po-safety-authorization-decision-support.md`](./v3-l02-po-safety-authorization-decision-support.md) (`51e8faa…`)
**ADR:** [`docs/adr/ADR-020-live-capital.md`](../../../adr/ADR-020-live-capital.md)
**Repository baseline (this act):** `51e8faa8e0523c7e732c46e5e21e6897418b19e0`

```text
These are PRODUCT OWNER decisions for Block B.
They are recorded exactly as decided.
They are NOT Architecture approvals.
They are NOT Security approvals.
They do NOT authorize V3-L02 implementation.
V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED.
S01–S06 remain NOT GRANTED.
```

Protected dirty/untracked leftovers outside this artifact were **not** modified.

---

## 1. Governance Context

| Item | Status |
| ---- | ------ |
| Block A (PO-L02-01, 02, 03, 12, 13, 14) | **PO DECIDED** |
| **Block B (PO-L02-04, 05, 06, 08, 09, 10)** | **PO DECIDED / RECORDED by this artifact** |
| Architecture Review (L02) | **NOT PASS** / not completed |
| Security Review (L02) | **NOT PASS** / not completed |
| Slice Approval S01–S06 | **NOT GRANTED** |
| V3-L02 IMPLEMENTATION | **NOT AUTHORIZED** |
| Live capital / FIV | **NOT ACTIVATED** / **NOT PERFORMED** |
| Live venue I/O | **NOT AUTHORIZED** by this act |

Block A constraints remain binding (venues BINANCE/BYBIT/OKX; MOCK test-only; trading execution only; lifecycle/cancel/idempotency/UNKNOWN business invariants frozen).

---

## 2. PO-L02-04 — C7 / Authorization Cell

**Status:** **PO DECIDED**

### Decision

**C7 remains the FINAL execution safety gate.**

There is **NO** alternate authorization path that can bypass C7.

### L02 authorization cell (required composition)

1. authenticated actor
2. active workspace membership
3. required L02 execution permission / role authorization
4. valid human-start proof
5. eligible live trading session
6. `LIVE_POLICY_OPTED_IN`
7. Kill Switch not ACTIVE
8. **C7 PASS**
9. venue/adapter availability and required credential validity
10. immediate S04 admission revalidation immediately before irreversible venue I/O

### Binding semantic rules (PO)

| Statement | Rule |
| --------- | ---- |
| `LIVE_POLICY_OPTED_IN` | does **NOT** equal execution authorization |
| JWT authentication | does **NOT** equal human-start |
| Authorization PASS | does **NOT** equal venue submission |
| Venue connectivity | does **NOT** equal live trading authorization |
| C7 | MUST remain fail-closed |
| Alternate “C7 bypass” cell | **NOT permitted** |
| New authorization framework | **NOT requested** |

### Boundary

Exact technical composition/order of these gates remains subject to **Architecture and Security Review**.

This act does **not** activate C7, redesign C7, or implement authz changes.

---

## 3. PO-L02-05 — Human-Start Grain

**Status:** **PO DECIDED** (business/security grain)

### Decision

Human-start is bound at the:

**WORKSPACE + ACTOR + SESSION + ACTION/COMMAND**

grain.

### Explicit negations (PO)

It is **NOT**:

- a generic workspace-level authorization token
- transferable between actors
- transferable between workspaces
- transferable between sessions
- a permanent execution authorization

### MUST be

- explicit
- human initiated
- actor-bound
- workspace-bound
- session-bound
- action/command-bound
- fresh
- single-use
- replay-resistant

### Existing S04 requirements

Freshness/TTL and single-use remain **in force**.

### Implementation boundary (PO)

The PO is **NOT** authorizing an implementation change to the current in-memory mechanism.

**Durability mechanism** remains an **Architecture / Security** decision.

### Architecture MUST review

- multi-instance behavior
- restart behavior
- worker retry
- concurrency
- race conditions
- atomic consumption
- crash between evaluation and venue I/O

### Security MUST review

- replay
- stale proof
- cross-workspace use
- cross-actor use
- cross-session use
- duplicate execution

---

## 4. PO-L02-06 — Session Eligibility Interaction

**Status:** **RECORDED** — existing S04 minimum frozen; **no new PO invention**

### Existing authority (S04)

Minimum session eligibility remains as frozen by S04 (PO-S04-05): workspace association, lifecycle, execution mode, actor-context. **Do not redesign TradingSession.**

### Separate gate

Session eligibility is a **separate gate**.

Session eligibility does **not** replace:

- authorization
- human-start
- policy opt-in
- C7
- Kill Switch
- venue availability

### Interaction with PO-L02-10

**PO-L02-10** governs what happens when an eligible session ends while venue orders already exist (see §7).

---

## 5. PO-L02-08 — Kill Switch + Existing Open Orders

**Status:** **PO DECIDED**

### Decision

When Kill Switch becomes ACTIVE:

1. **NEW** live admission MUST be blocked.
2. **NEW** live submission MUST be blocked.
3. Existing venue orders are **NOT** automatically cancelled by the Kill Switch itself.
4. Existing venue orders MUST remain subject to authoritative venue-state reconciliation.
5. Cancellation of existing venue orders **MAY** be initiated only through an **explicitly authorized operational path**.
6. L02 MUST **NOT** introduce an automatic “cancel all” behavior.
7. Existing fills must still be processed correctly.
8. Ledger/position state must remain consistent with authoritative venue outcomes.
9. UNKNOWN venue outcomes remain UNKNOWN until reconciliation establishes the authoritative state.
10. Operator visibility/action remains required where existing venue orders remain open.

### Boundary

- This decision does **NOT** authorize a new cancellation subsystem.
- This decision does **NOT** modify the existing durable Kill Switch implementation.
- Exact reconciliation and operational handling is subject to **Architecture / Security Review**.

---

## 6. PO-L02-09 — Policy Disable + Existing Open Orders

**Status:** **PO DECIDED**

### Decision

When `LIVE_POLICY_OPTED_IN` is disabled and the workspace returns to PAPER:

1. **NEW** live admission MUST be blocked.
2. **NEW** live submission MUST be blocked.
3. Existing venue orders are **NOT** automatically cancelled solely because the policy was disabled.
4. Existing venue orders remain subject to authoritative venue-state reconciliation.
5. Existing fills remain authoritative and MUST continue to be reflected correctly.
6. UNKNOWN outcomes remain UNKNOWN until reconciled.
7. Cancellation of existing venue orders requires an **explicitly authorized operational path**.
8. Policy disable MUST **NOT** be interpreted as proof that the venue has cancelled or closed existing orders.

### Binding clarification (PO)

`LIVE_POLICY_OPTED_IN` controls **future** live execution eligibility.

It does **NOT** retroactively change the authoritative state of an already-submitted venue order.

**No automatic cancel-all behavior** is introduced.

---

## 7. PO-L02-10 — Session End + Existing Open Orders

**Status:** **PO DECIDED**

### Decision

When a live trading session ends while venue orders remain open:

1. **NEW** live admission MUST be blocked.
2. **NEW** live submission MUST be blocked.
3. Existing venue orders are **NOT** automatically cancelled solely because the session ended.
4. Existing venue orders remain subject to authoritative venue-state reconciliation.
5. Existing fills remain authoritative.
6. UNKNOWN remains UNKNOWN until reconciliation establishes the venue state.
7. Cancellation of existing venue orders requires an **explicitly authorized operational path**.
8. The ended session MUST **NOT** be used as justification for silently assuming that venue orders are cancelled.

### Binding clarification (PO)

Session end prevents **NEW** live activity through the session eligibility gate.

It does **NOT** automatically rewrite existing venue state.

**No automatic cancel-all behavior** is introduced.

**Do not redesign TradingSession.**

---

## 8. Cross-Cutting Transition Matrix (Governance Level)

Not implementation logic. Governance expectations only.

| State / Event | New admission | New submission | Existing venue orders | Reconciliation | Fill handling | Operator action |
| ------------- | ------------- | -------------- | --------------------- | -------------- | ------------- | --------------- |
| **KS ACTIVE** | BLOCK | BLOCK | Not auto-cancelled; venue-authoritative | Required for ambiguity / inventory | Process verified fills | Visibility/action where open remain |
| **Policy disabled / PAPER** | BLOCK | BLOCK | Not auto-cancelled solely by disable | Required for ambiguity | Verified fills remain authoritative | Visibility/action; cancel only via authorized path |
| **Session ended / ineligible** | BLOCK | BLOCK | Not auto-cancelled solely by end | Required for ambiguity | Verified fills remain authoritative | Visibility/action; cancel only via authorized path |
| **C7 DENY** | BLOCK | BLOCK | Unaffected by C7 alone (no auto-cancel) | As needed for existing UNKNOWN | Verified fills | — |
| **Human-start missing** | BLOCK | BLOCK | No auto-cancel | — | — | Re-issue start if appropriate |
| **Human-start stale** | BLOCK | BLOCK | No auto-cancel | — | — | Re-issue |
| **Human-start replay** | BLOCK | BLOCK | No auto-cancel | — | — | Fail-closed |
| **Venue unavailable** | BLOCK / fail-closed | BLOCK / fail-closed | Existing may remain at venue | Required when outcomes ambiguous | When known | Ops visibility |
| **Submission UNKNOWN** | No blind retry | No blind retry | Treat as unresolved | **Required** before retry | When established | Preserve ambiguity |
| **Cancellation UNKNOWN** | — | No blind re-cancel | Unresolved cancel | **Required** | Filled portions authoritative | Preserve ambiguity |

---

## 9. Frozen Financial-Safety Invariants (Cross-Cutting PO Rules)

The following are now **FROZEN PO BUSINESS / GOVERNANCE RULES**:

1. Kill Switch ACTIVE blocks new live activity.
2. Policy disabled / PAPER blocks new live activity.
3. Session ended / ineligible blocks new live activity.
4. None of the above automatically proves that an already-submitted venue order is cancelled.
5. Venue state remains authoritative for already-submitted orders.
6. Reconciliation is required to resolve ambiguous venue outcomes.
7. UNKNOWN remains first-class.
8. No blind retry after UNKNOWN.
9. No false success.
10. No false cancellation success.
11. No automatic cancel-all behavior is introduced by L02.
12. Any operational cancellation of existing venue orders requires an explicitly authorized path.
13. C7 remains the final execution safety gate.
14. No alternate authorization path may bypass C7.
15. Human-start is WORKSPACE + ACTOR + SESSION + ACTION/COMMAND bound.
16. Human-start is not transferable.
17. `LIVE_POLICY_OPTED_IN` is not execution authorization.
18. JWT is not human-start.
19. Venue connectivity is not live trading authorization.

Together with Block A: Paper ≠ Live; ALLOW ≠ submitted ≠ accepted ≠ filled; SUCCESS ≠ UNKNOWN ≠ REJECTED.

---

## 10. Architecture Handoff (NOT YET APPROVED)

PO-frozen business decisions above are **NOT** architecturally approved by this artifact.

| ID / topic | Matter |
| ---------- | ------ |
| **AD-L02-01** | Canonical execution path / parallel engine exclusion |
| **AD-L02-04** | Human-start implementation / durability / concurrency (grain is PO-frozen; mechanism not) |
| **AD-L02-07** | UNKNOWN encoding |
| **AD-L02-09** | Idempotency mechanism |
| **AD-L02-11** | Crash-window behavior |
| Additional | Cancel mapping; reconciliation behavior; KS/policy/session transitions; operational persistence; exact authorization gate composition/order; venue adapter boundary |

**Architecture MUST NOT change the PO business decisions.**
Architecture may determine the safest technical realization.

---

## 11. Security Handoff (NOT PASS)

Security review remains mandatory for:

| ID | Topic |
| -- | ----- |
| **SD-L02-01** | SSRF / egress / venue allowlist |
| **SD-L02-02** | Credential isolation |
| **SD-L02-03** | Workspace / tenant isolation |
| **SD-L02-04** | Human-start replay / staleness |
| **SD-L02-05** | Duplicate financial actions |
| **SD-L02-06** | UNKNOWN / lost-response safety |
| **SD-L02-07** | Kill Switch / authz fail-closed behavior |

**Security MUST NOT silently alter the PO business decision.**
Security may identify a blocker requiring a **new** PO decision.

This artifact does **NOT** mark Security PASS.

---

## 12. Remaining Open Decisions

Block A and Block B PO decisions listed in this record and the financial-scope record are **PO DECIDED**.

Still outstanding before implementation authorization:

| Area | Status |
| ---- | ------ |
| Architecture Review (AD-L02-* and additional mappings) | **NOT APPROVED** |
| Security Review (SD-L02-01…07) | **NOT PASS** |
| Block C residual product items (e.g. credential environment separation details, reachability operational claims) where not absorbed above | May remain OPEN — do not invent |
| Explicit authorized operational cancel path productization | Referenced by PO-08/09/10; not implemented; may need further PO/Ops/Arch detail |
| Planning Approval / Slice Approval | **NOT GRANTED** |
| Live-capital activation / FIV | **NOT AUTHORIZED** / **NOT PERFORMED** |
| C7 role grants (who may PASS C7) | Cell requires C7 PASS; **granting** C7 to roles remains a separate explicit act (not performed here; C7 currently deny-all) |

Note: PO-L02-04 requires C7 PASS as the final gate and forbids bypass. This freeze does **not** itself grant C7 to any role.

---

## 13. Slice Status

```text
Slice Approval S01–S06 = NOT GRANTED
```

This artifact freezes PO decisions so Architecture and Security can review technical realization.

It does **not** grant Slice Approval.

---

## 14. Implementation Boundary

```text
This Product Owner Block B decision freeze does NOT authorize:
  - V3-L02 runtime implementation
  - schema changes / migrations
  - venue adapter changes
  - production venue connectivity
  - credential provisioning
  - C7 activation / role grants
  - authz implementation changes
  - human-start implementation changes
  - Kill Switch implementation changes
  - Session implementation / redesign
  - reconciliation implementation
  - order execution implementation
  - L03 / L04 / L05 work
  - live order submit / cancel
  - live capital movement
  - FIV
  - Slice Approval
  - L02 closure
  - live-capital activation

V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED.
S01–S06 remain NOT GRANTED.
Live capital remains NOT ACTIVATED.
```

---

## Decision Summary Table

| ID | Topic | Status |
| -- | ----- | ------ |
| **PO-L02-04** | C7 final gate; no bypass; authorization cell composition | **PO DECIDED** |
| **PO-L02-05** | Human-start grain WORKSPACE+ACTOR+SESSION+ACTION/COMMAND | **PO DECIDED** |
| **PO-L02-06** | S04 minimum session eligibility; separate gate | **RECORDED (S04 frozen)** |
| **PO-L02-08** | KS blocks new; no auto cancel-all; reconcile existing | **PO DECIDED** |
| **PO-L02-09** | Policy disable blocks new; no auto cancel-all | **PO DECIDED** |
| **PO-L02-10** | Session end blocks new; no auto cancel-all | **PO DECIDED** |

---

## STOP

**STOP.** Block B Product Owner decisions are recorded exactly as decided.

Do not implement V3-L02 from this artifact.
Do not activate C7.
Do not modify human-start, Kill Switch, or Session implementations.
Do not perform live venue I/O.
Proceed to Architecture Review and Security Review — not implementation.
