# FIV-CONN-04-B-04 Slice Approval

**Document:** FIV-CONN-04-B-04 Backfill Integration Boundary — Slice Approval
**Date:** 2026-09-18
**Wave:** 6 — Live Trading
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01
**Slice:** FIV-CONN-04-B-04 — 04-D integration boundary
**Authority:** Product Owner / Chief Architect
**Nature:** **SLICE APPROVAL ONLY.** Authorizes the B-04 slice to proceed to **Implementation Planning** and subsequent B-04 implementation **only under** the Decision Freeze and Implementation Planning. Does **not** implement B-04 in this act. Does **not** authorize 04-D, backfill, Vault redesign, FIV, C7, venue I/O, or capital.

**Decision Freeze:** [`v3-l02-fiv-conn-04-b-04-decision-freeze.md`](./v3-l02-fiv-conn-04-b-04-decision-freeze.md) — **APPROVED** (same governance act)
**Planning Package:** [`v3-l02-fiv-conn-04-b-04-planning-package.md`](./v3-l02-fiv-conn-04-b-04-planning-package.md)
**Planning Review:** [`v3-l02-fiv-conn-04-b-04-planning-review.md`](./v3-l02-fiv-conn-04-b-04-planning-review.md) @ `913f095…` — PASS WITH CONDITIONS (conditions resolved by Decision Freeze)

**Repository baseline (approval start):** `913f095b4312c1bc778df050d60f26bad638a66e` (`HEAD == origin/main`)

---

## 1. Slice Approval Verdict

```text
SLICE APPROVAL = GRANTED
```

```text
FIV-CONN-04-B-04 = SLICE APPROVED
B-04 may proceed to IMPLEMENTATION PLANNING
B-04 coding / tests / schema = NOT STARTED BY THIS ARTIFACT
```

```text
This approval authorizes ONLY FIV-CONN-04-B-04.
```

Protected dirty/untracked leftovers were **not** modified.

---

## 2. Approval Preconditions Checklist

| Check | Result |
| ----- | ------ |
| Planning Package complete | **PASS** |
| Planning Review PASS WITH CONDITIONS | **PASS** |
| Decision Freeze APPROVED | **PASS** |
| C-B04-01…06 frozen / PASS | **PASS** |
| Required decisions 1…13 frozen | **PASS** |
| B04-AC01…AC18 ACCEPTED | **PASS** |
| SB-B04-01…12 compatible | **PASS** |
| ARCH-B04 / COND-ARCH-B04 / COND-SEC-B05 binding | **PASS** |
| Architecture blockers | **NONE** |
| Security blockers | **NONE** |
| Scope = integration boundary only | **PASS** |
| No public Connections HTTP | **PASS** |
| No Prisma/schema in scope | **PASS** |
| B-01/B-02/B-03 consumed not redesigned | **PASS** |
| Residuals D-B03-04/06/08 preserved | **PASS** |
| 04-D / backfill / Vault / FIV / C7 excluded | **PASS** |

```text
PRECONDITION FAIL COUNT = 0
```

---

## 3. What Is Authorized

B-04 may proceed to:

1. **Implementation Planning** (file-level plan under frozen C-B04-01…06)
2. Subsequent **B-04 implementation** only after Implementation Planning is produced and followed as a separate act

Authorized delivery scope (summary):

- Privileged integration-boundary façade composing closed `MigrationGatePort`
- Start / refuse-start (primary = durable acquire; validate = resume only)
- Heartbeat / release wrappers (B04-S1; ownership + fence bound)
- Same-txn write-authority proof via `assertDurableAuthorityCas` / equivalent export (B04-S2)
- Tests for refuse-start / refuse-write / contention / stale fence / no Vault-env (B04-S3)
- Reuse existing `connection.migration-gate` audit outcomes (no new reason codes)

---

## 4. What Remains NOT AUTHORIZED

```text
STILL NOT AUTHORIZED BY THIS SLICE APPROVAL:
  - Coding / tests in this act
  - FIV-CONN-04-D privileged environment UPDATE / backfill
  - LIVE backfill / residual inventory (04-C / 04-E)
  - Vault mutation / redesign / compensation
  - FIV execution / FIV-PRE-01 closure
  - C7 enablement
  - allowRealVenueIo / live venue I/O
  - Live capital activation
  - Public Connections HTTP for migration-gate lifecycle
  - Public Connection.environment mutation API
  - Prisma schema / migrations
  - B-01 / B-02 / B-03 redesign
  - Closing FIV-CONN-04-B or FIV-CONN-04 by this approval alone
  - S20 / D-B03 residual remediation
```

```text
FIV-CONN-04-B = NOT CLOSED
FIV-CONN-04 = NOT CLOSED
FIV-PRE-01 = NOT CLOSED
FIV = NOT PERFORMED
C7 = DENY-ALL
allowRealVenueIo = FALSE
LIVE CAPITAL = NOT ACTIVATED
04-D = NOT AUTHORIZED
```

---

## 5. Binding Freezes Incorporated

Implementation Planning and later implementation MUST obey:

- Parent OD-B-01…08 / D-CONN-04-08 / D-CRED-02-12
- ARCH-B04 / COND-ARCH-B04 / COND-SEC-B05 / COND-SEC-B10
- Closed B-01 helpers and B-02 durable lease + CAS helper
- Closed B-03 deny-set matrix (unchanged)
- **C-B04-01…06** and required frozen decisions 1…13 from the Decision Freeze
- **B04-AC01…18** and **SB-B04-01…12**

No waiver or exception mechanism is granted.

### Binding reminders (non-exhaustive)

```text
observe() NEVER = durable write authority
assertDurableAuthorityCas (or equivalent) MANDATORY for write proof
No second SoT
No public HTTP
UNKNOWN => REFUSE
Write authority ONLY when ACTIVE + matching holder + matching fence + same-txn CAS
Heartbeat/release ownership-bound; cannot bypass write-proof
Zero Connection.environment UPDATE in B-04
```

---

## 6. Approved Internal Slices

| ID | Objective | Notes |
| -- | --------- | ----- |
| **B04-S1** | Start/refuse-start + heartbeat/release wrappers | C-B04-04 / C-B04-05 |
| **B04-S2** | Same-txn write-authority proof | C-B04-01 / C-B04-02 / C-B04-06 |
| **B04-S3** | Tests + security/regression walls | SB-B04 + AC walls |

Optional merge into one implementation commit remains an Implementation Planning detail.

---

## 7. Implementation Boundary (reminder)

Candidate areas (exact plan in next gate):

| Area | Expected role |
| ---- | ------------- |
| New privileged façade module under connections | Start / HB / release / write-proof composition |
| CAS export wiring | C-B04-01 — explicit DI-safe export; no second SoT |
| Specs colocated with façade | B04-AC / SB-B04 coverage |
| `connections.module.ts` | DI registration only if required |

**Forbidden in B-04 implementation:** Prisma schema/migrations; B-01/B-02/B-03 redesign; 04-D UPDATE/backfill; Vault module changes; public ConnectionsController gate endpoints; environment mutation in production or test doubles.

---

## 8. Residuals

| Residual | Status under this approval |
| -------- | -------------------------- |
| D-B03-04 | **PRESERVED** (not B-04) |
| D-B03-06 | **PRESERVED** (not B-04) |
| D-B03-08 | **PRESERVED** (not B-04) |

---

## 9. Next Governance Gate

```text
NEXT GATE:
FIV-CONN-04-B-04 IMPLEMENTATION PLANNING
```

```text
Do NOT implement B-04 until Implementation Planning is produced and followed.
This Slice Approval does not itself create or modify production code.
Do NOT start 04-D.
Do NOT start FIV.
Do NOT activate C7.
Do NOT enable live capital / venue I/O.
```

---

## 10. Explicit Non-Start

```text
B-04 IMPLEMENTATION = NOT YET STARTED
NO PRODUCTION CODE CHANGED BY THIS ARTIFACT
CODING AUTHORIZATION IN THIS ACT = NO
PATH TO IMPLEMENTATION PLANNING = YES (Slice Approval GRANTED)
```

---

## Final Approval State

```text
SLICE APPROVAL = GRANTED
DECISION FREEZE = APPROVED
Implementation coding = NOT STARTED
04-D = NOT AUTHORIZED
FIV = NOT PERFORMED
C7 = DENY-ALL
LIVE CAPITAL = NOT ACTIVATED
```

**END OF FIV-CONN-04-B-04 SLICE APPROVAL**
