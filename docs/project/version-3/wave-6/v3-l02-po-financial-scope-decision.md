# V3-L02 PO Financial Scope Decision Record

**Document:** V3-L02 Product Owner Financial Scope Decision Record (Block A)
**Date:** 2026-09-17
**Wave:** 6 — Live Trading
**Package:** V3-L02 — Live order I/O on canonical path (LT-02)
**Nature:** Official Product Owner decision record for Block A financial-scope items only. **Not** Architecture Review PASS. **Not** Security Review PASS. **Not** Planning Approval. **Not** Slice Approval. **Not** implementation authorization. **Not** live-capital activation. **Not** FIV.
**Authority:** Product Owner
**Prepared by:** Senior Staff Engineer / Chief Architect under PO governance (recording only)
**Preceding artifacts:**
- [`v3-l02-planning-proposal.md`](./v3-l02-planning-proposal.md)
- [`v3-l02-planning-decision-resolution.md`](./v3-l02-planning-decision-resolution.md)
- [`v3-l02-po-decision-freeze.md`](./v3-l02-po-decision-freeze.md)
- [`v3-l02-po-decision-support.md`](./v3-l02-po-decision-support.md) (`e386c7c…`)
**ADR:** [`docs/adr/ADR-020-live-capital.md`](../../../adr/ADR-020-live-capital.md)
**Repository baseline (this act):** `e386c7cb5b435461d9f3363f30fde5f3feb2b0bc`

```text
These are PRODUCT OWNER decisions for Block A.
They are NOT Architecture approvals.
They are NOT Security approvals.
They do NOT authorize V3-L02 implementation.
V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED.
```

Protected dirty/untracked leftovers outside this artifact were **not** modified.

---

## 1. Governance Context

| Item | Status |
| ---- | ------ |
| Wave 6 Planning | **APPROVED** |
| ADR-020 | **Accepted** |
| D-GOV-05 | **GRANTED** (wave-level; package/slice gates remain) |
| V3-L01-S01…S04 | **CLOSED** |
| V3-L01 package | **NOT CLOSED** |
| V3-L02 Planning Proposal / Freeze / Decision Support | **COMPLETE** |
| **Block A financial-scope PO decisions** | **RECORDED by this artifact** |
| Block B / Block C PO decisions | **OUTSTANDING** |
| Architecture Review (L02) | **NOT PASS** / not completed |
| Security Review (L02) | **NOT PASS** / not completed |
| V3-L02 Planning Approval | **NOT GRANTED** |
| Slice Approval S01–S06 | **NOT GRANTED** |
| V3-L02 IMPLEMENTATION | **NOT AUTHORIZED** |
| Live capital / FIV | **NOT ACTIVATED** / **NOT PERFORMED** |

This record freezes the Product Owner’s Block A decisions **exactly** as decided. It does not reinterpret, broaden, or invent additional financial authority.

---

## 2. PO-L02-01 — Venue Scope

**Status:** **PO DECIDED**

### Decision

For V3-L02, live execution scope is:

- **BINANCE**
- **BYBIT**
- **OKX**

**MOCK** remains available only for testing/simulation.

**No other venue** is included in V3-L02.

### Binding clarifications (PO)

1. Existing adapter presence does **NOT** itself constitute production authorization.
2. A venue being reachable/connected does **NOT** mean that live trading is authorized.
3. A successful handshake does **NOT** mean order submission is authorized.
4. Production live order I/O remains subject to all L02 admission, authorization, security, and architecture gates.
5. No venue outside BINANCE / BYBIT / OKX may be added to L02 without a **separate** PO decision.

### Explicitly not granted by this decision

- Live-capital activation
- Production venue I/O during this governance act
- Credential provisioning
- Bypass of admission / authz / security / architecture gates
- FIV PASS

---

## 3. PO-L02-02 — Capital Scope

**Status:** **PO DECIDED**

### Decision

V3-L02 scope is **LIMITED** to the trading execution lifecycle:

- live order submission
- live order cancellation
- venue execution result
- fills
- positions
- corresponding trading ledger effects required by the canonical execution path

### Explicitly OUT OF SCOPE

- deposits
- withdrawals
- banking operations
- treasury transfers
- account-to-account transfers
- unrelated funding movement
- payment operations

### Binding clarifications (PO)

1. Do **NOT** interpret “real capital” as authorization for arbitrary financial movement.
2. L02 is **trading execution only**.
3. Any expansion into deposits, withdrawals, transfers, treasury, or other capital movement requires a **separate explicit PO decision** and governance approval.

---

## 4. PO-L02-03 — Order Lifecycle

**Status:** **PO DECIDED** (business distinctions frozen)

### Frozen business-level distinctions

```text
REQUESTED
ADMITTED
SUBMITTED
ACCEPTED
REJECTED
UNKNOWN
FILLED
CANCELLED
```

### Mandatory semantic distinctions

- REQUESTED ≠ ADMITTED
- ADMITTED ≠ SUBMITTED
- SUBMITTED ≠ ACCEPTED
- ACCEPTED ≠ FILLED
- REJECTED ≠ UNKNOWN
- CANCELLED ≠ FILLED
- UNKNOWN MUST remain distinguishable from SUCCESS/ACCEPTED

### Boundary

The Product Owner freezes these **BUSINESS** distinctions.

The exact technical encoding / state-machine representation remains an **Architecture Review** matter.

This act does **not** redesign the domain state machine.

---

## 5. PO-L02-12 — Cancel Semantics

**Status:** **PO DECIDED** (business invariants frozen)

### Frozen business invariants

1. A successful cancel acknowledgement may be represented as cancellation success only when the venue outcome is established.
2. “Already cancelled” must not be treated as a new cancellation failure if the venue state establishes that the intended order is cancelled.
3. “Already filled” means the order is no longer cancellable and the resulting filled state must remain authoritative.
4. “Not found” MUST NOT automatically be interpreted as successful cancellation.
5. Timeout/network failure does NOT establish cancellation success.
6. Lost cancel response does NOT establish cancellation success.
7. UNKNOWN cancellation outcome remains UNKNOWN until the venue state can be established.
8. No false cancellation success.
9. No blind repeated cancellation when the previous outcome is ambiguous.
10. Reconciliation may be required before deciding the final order state.

### Boundary

Exact technical mapping into repository states / events / errors is subject to **Architecture Review**.

This act does **NOT** implement this behavior.

---

## 6. PO-L02-13 — Idempotency / Lost Response

**Status:** **PO DECIDED** (product / financial-safety invariants frozen)

### Frozen financial-safety invariants

1. Duplicate live financial actions MUST be prevented.
2. A locally generated idempotency identity MUST remain stable for retries of the same logical order operation.
3. Where supported, the venue’s client-order-id / equivalent idempotency mechanism MUST be considered as part of duplicate prevention.
4. Durable persistence MUST participate in the duplicate-prevention strategy.
5. If the platform cannot establish whether the venue accepted an order because the response was lost, the outcome is UNKNOWN.
6. UNKNOWN MUST NOT be converted into SUCCESS by assumption.
7. UNKNOWN MUST NOT trigger a blind retry.
8. Reconciliation MUST be considered/required before retrying an ambiguous financial action.
9. Process restart MUST NOT erase the information required to prevent duplicate execution.
10. Concurrent requests for the same logical operation MUST NOT result in duplicate venue orders.
11. Worker retries MUST respect the same idempotency contract.
12. Crash-window behavior MUST be explicitly handled.

### Boundary

The Product Owner freezes these **PRODUCT / FINANCIAL SAFETY** invariants.

The exact mechanism is **NOT** selected by the PO in this act.

- **Architecture** must determine the concrete design.
- **Security** must review the resulting mechanism.

---

## 7. PO-L02-14 — UNKNOWN Semantics

**Status:** **PO DECIDED**

### Decision

**UNKNOWN** is a **FIRST-CLASS** financial execution outcome.

**UNKNOWN means:** The platform cannot currently establish the authoritative venue outcome of the requested financial operation.

### UNKNOWN is NOT

- SUCCESS
- ACCEPTED
- REJECTED
- FILLED
- CANCELLED

### Mandatory rules

- UNKNOWN must be persisted/represented sufficiently for operational correctness.
- UNKNOWN must not be silently converted to success.
- UNKNOWN must not be silently converted to rejection.
- UNKNOWN must not trigger blind retry.
- Reconciliation is required/expected before resolving an ambiguous venue outcome where applicable.
- Operator-visible state must preserve the ambiguity.
- Duplicate prevention must remain active while outcome is unresolved.

### Boundary

Exact technical representation is an **Architecture / Security Review** matter.

---

## 8. Frozen Financial-Safety Invariants

In addition to the decision-specific invariants above, the following remain **mandatory**:

```text
Paper ≠ Live
LIVE_POLICY_OPTED_IN ≠ execution authorization
JWT ≠ human-start
ALLOW ≠ submitted
submitted ≠ accepted
accepted ≠ filled
SUCCESS ≠ UNKNOWN
UNKNOWN ≠ REJECTED
No blind retry after UNKNOWN
No false success
No false cancellation success
No accidental mainnet execution
No production venue I/O during this task
```

### Canonical path (binding direction for these decisions)

```text
Risk
  → Orders
  → Ledger reservation
  → ExecutionEngineService
  → ExecutionAdapterPort
  → Venue
  → Fill
  → Position / Ledger
```

- Do **NOT** create a second live execution source of truth.
- The existing parallel `live-trading-engine` MUST **NOT** become the L02 source of truth.
- **AD-L02-01** remains an Architecture Review item (not approved by this PO record).

---

## 9. Architecture Handoff (NOT YET APPROVED)

The following remain **NOT YET APPROVED** and require Architecture Review after this PO record:

| ID / topic | Matter |
| ---------- | ------ |
| **AD-L02-01** | Canonical execution path / parallel engine exclusion |
| **AD-L02-07** | UNKNOWN technical encoding |
| **AD-L02-09** | Idempotency mechanism |
| **AD-L02-11** | Crash-window behavior |
| Cancel state/error mapping | Technical mapping of PO-L02-12 |
| Operational persistence schema | Representation supporting UNKNOWN / idempotency / restart |

This PO decision record does **not** constitute Architecture Review PASS.

---

## 10. Security Handoff (NOT PASS)

Security review remains required for:

| ID | Topic |
| -- | ----- |
| **SD-L02-01** | SSRF / egress / venue allowlist |
| **SD-L02-02** | Credential isolation |
| **SD-L02-03** | Workspace / tenant isolation |
| **SD-L02-04** | Replay / stale authorization |
| **SD-L02-05** | Duplicate financial actions |
| **SD-L02-06** | UNKNOWN / lost-response safety |
| **SD-L02-07** | Kill Switch / authz fail-closed behavior |

This artifact does **NOT** mark Security PASS.

---

## 11. Remaining Block B / C Decisions

Block A financial-scope items recorded above are **PO DECIDED**.

The following remain **OUTSTANDING** (not decided by this artifact), including but not limited to:

| Block | Topics (illustrative from prior freeze/support) |
| ----- | ----------------------------------------------- |
| **B** | PO-L02-04 C7/authorization · PO-L02-05 human-start · PO-L02-06 session eligibility · PO-L02-08 KS + open orders · PO-L02-09 policy disable + open orders · PO-L02-10 session end + open orders |
| **C** | PO-L02-07 credentials/Vault env product choices · PO-L02-11 reachability honesty operational claims · PO-L02-15 persistence product confirmations beyond Block A invariants · related Sec/Arch items |

Until Block B/C decisions and Architecture/Security reviews are complete, L02 implementation remains unauthorized.

---

## 12. Slice Status

```text
Slice Approval S01–S06 = NOT GRANTED
```

S01–S06 remain **NOT GRANTED** because Block B/C decisions and Architecture/Security reviews remain outstanding.

This artifact does **not** grant Slice Approval.

---

## 13. Explicit Implementation Boundary

```text
This Product Owner decision record does NOT authorize:
  - V3-L02 runtime implementation
  - schema changes / migrations
  - venue adapter implementation
  - production venue connectivity
  - live order submit / cancel
  - credential provisioning
  - C7 activation or bypass
  - authz redesign
  - human-start redesign
  - Kill Switch behavior changes
  - Paper Freeze modification
  - reconciliation implementation
  - L03 / L04 / L05 implementation
  - FIV
  - L02 closure
  - live-capital activation

V3-L02 IMPLEMENTATION REMAINS NOT AUTHORIZED.
Live capital remains NOT ACTIVATED.
```

---

## Decision Summary Table

| ID | Topic | Status |
| -- | ----- | ------ |
| **PO-L02-01** | Venue (BINANCE, BYBIT, OKX; MOCK test-only) | **PO DECIDED** |
| **PO-L02-02** | Capital scope (trading execution only) | **PO DECIDED** |
| **PO-L02-03** | Order lifecycle business distinctions | **PO DECIDED** |
| **PO-L02-12** | Cancel semantics invariants | **PO DECIDED** |
| **PO-L02-13** | Idempotency / lost-response invariants | **PO DECIDED** |
| **PO-L02-14** | UNKNOWN first-class semantics | **PO DECIDED** |

---

## STOP

**STOP.** Block A Product Owner financial-scope decisions are recorded.

Do not implement V3-L02 from this artifact.
Do not perform live venue I/O.
Do not activate live capital.
Proceed next to remaining Block B/C PO decisions and Architecture / Security Reviews — not implementation.
