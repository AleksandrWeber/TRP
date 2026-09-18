# FIV-CONN-04-B-06 Implementation Kickoff

**Document:** FIV-CONN-04-B-06 Crash / Concurrency Verification — Implementation Kickoff / IPR Condition Acceptance  
**Date:** 2026-09-18  
**Wave:** 6 — Live Trading  
**Package:** V3-L02 / FIV-CRED-02 / FIV-PRE-01  
**Slice:** FIV-CONN-04-B-06 — Crash / concurrency verification  
**Authority:** Product Owner / Chief Architect (governance freeze)  
**Nature:** **GOVERNANCE FREEZE / KICKOFF ACCEPTANCE ONLY.** Does **not** implement B-06. Does **not** create B-06 specs. Does **not** modify production, B-02…B-05, OD-B-06, D-B03 residuals, Prisma, migrations, Vault, 04-D, FIV, C7, venue I/O, or capital. Does **not** touch protected leftovers.

**Repository baseline:** `d6b860299f3a5ade944c5ea55a7c007fe091843d` (`HEAD == origin/main`)

---

## 1. Source Planning-Review Verdict

```text
IMPLEMENTATION PLANNING REVIEW = PASS WITH CONDITIONS
Source: Formal FIV-CONN-04-B-06 Implementation Planning Review
Conditions raised: IPR-B06-01…05
```

**Related artifacts:**

| Artifact                | Path                                                                                                         | Status              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------- |
| Decision Freeze         | [`v3-l02-fiv-conn-04-b-06-decision-freeze.md`](./v3-l02-fiv-conn-04-b-06-decision-freeze.md)                 | **APPROVED**        |
| Slice Approval          | [`v3-l02-fiv-conn-04-b-06-slice-approval.md`](./v3-l02-fiv-conn-04-b-06-slice-approval.md)                   | **GRANTED**         |
| Implementation Planning | [`v3-l02-fiv-conn-04-b-06-implementation-planning.md`](./v3-l02-fiv-conn-04-b-06-implementation-planning.md) | **PASS** (planning) |
| Planning Package        | [`v3-l02-fiv-conn-04-b-06-planning-package.md`](./v3-l02-fiv-conn-04-b-06-planning-package.md)               | Binding input       |

```text
IMPLEMENTATION PLANNING REVIEW = RESOLVED
(by acceptance of IPR-B06-01…05 in this kickoff)
```

---

## 2. IPR-B06-01 Acceptance

```text
IPR-B06-01 = ACCEPTED / FROZEN
```

```text
FROZEN RULE:
  Dual-client updateMany / findUnique mocks MUST enforce B-02-class
  CAS predicates:
    - state
    - fenceGeneration
    - holderId
    - expiry

  No unconditional overwrite is allowed.
  The test double MUST fail when CAS predicates do not match.

  Purpose: prevent tautological concurrency proof.
  Evidence-quality requirement ONLY.
  Does NOT authorize production changes.
```

---

## 3. IPR-B06-02 Acceptance

```text
IPR-B06-02 = ACCEPTED / FROZEN
```

```text
FROZEN RULE:
  RACE-06 deny evidence MUST originate from shared SoT.

  ALLOWED:
    - adapter.observe()
    - or an equivalent double that reads the SAME mutable lease row

  FORBIDDEN:
    - hardcoded ACTIVE state disconnected from the shared lease row

  The deny result MUST be causally connected to the authoritative row.
```

---

## 4. IPR-B06-03 Acceptance

```text
IPR-B06-03 = ACCEPTED / FROZEN
```

```text
FROZEN RULE (AC-B07):
  Evidence MUST contain BOTH:

  A. Structural:
     adapter does not maintain durable instance-local lease authority fields

  B. Behavioral (explicitly tied to RACE-08):
     after discarding the in-memory grant, authority is still determined
     from the shared SoT

  FORBIDDEN:
    - inventing a new production "memory gate" API
    - modifying production architecture

  REQUIRED DEMO:
    discard local grant
      → observe shared SoT
      → shared state remains authoritative
```

---

## 5. IPR-B06-04 Acceptance

```text
IPR-B06-04 = ACCEPTED / FROZEN
```

```text
FROZEN RULE (AC-B20):
  THREE DISTINCT named negative cases are MANDATORY:

  1. wrong-fence release is rejected
  2. wrong-fence assertWriteAuthority returns false / rejects authority
  3. wrong-fence D execution spy is NOT entered

  FORBIDDEN:
    collapsing into one generic "fencing covered" assertion

  Each MUST have an explicit expected negative result.
```

---

## 6. IPR-B06-05 Acceptance

```text
IPR-B06-05 = ACCEPTED / FROZEN
```

```text
FROZEN RULE:
  Implementation report MUST explicitly state:

  B-06 evidence uses SEQUENTIAL DUAL LOGICAL CLIENTS under C-B06-01.

  It is NOT:
    - live multi-process interleaving
    - proof from two OS-level Node processes
    - proof that C-B06-02 residual has been closed

  C-B06-02 remains:
    OPEN / OPTIONAL operational residual

  Do not claim otherwise.
```

---

## 7. Reconfirmed C-B06-01…05

| ID           | Status        | Essence                                                                         |
| ------------ | ------------- | ------------------------------------------------------------------------------- |
| **C-B06-01** | **CONFIRMED** | Dual logical clients/adapters; no testcontainers; no live dual-process Postgres |
| **C-B06-02** | **CONFIRMED** | Live dual-process residual = OPEN / OPTIONAL                                    |
| **C-B06-03** | **CONFIRMED** | Verification / consume-only                                                     |
| **C-B06-04** | **CONFIRMED** | Local B06-AC* / SB-B06-* = tracing only                                         |
| **C-B06-05** | **CONFIRMED** | RACE-09 = immediate contention/acquire failure; no wait/queue/timeout invention |

```text
DECISION FREEZE = CONFIRMED
```

---

## 8. Reconfirmed IMPL-COND-B06-01…10

| ID                   | Condition                                       | Status                  |
| -------------------- | ----------------------------------------------- | ----------------------- |
| **IMPL-COND-B06-01** | No production changes                           | **MANDATORY**           |
| **IMPL-COND-B06-02** | RACE-05…RACE-10 coverage                        | **MANDATORY**           |
| **IMPL-COND-B06-03** | AC-B06…AC-B10 + AC-B20 traceability             | **MANDATORY**           |
| **IMPL-COND-B06-04** | No OD-B-06 reopen                               | **MANDATORY**           |
| **IMPL-COND-B06-05** | D-B03-04/06/08 preserved                        | **MANDATORY**           |
| **IMPL-COND-B06-06** | Dual-client unit/integration; no testcontainers | **MANDATORY**           |
| **IMPL-COND-B06-07** | Dedicated `fiv-conn-04-b-06-*.spec.ts` only     | **MANDATORY**           |
| **IMPL-COND-B06-08** | FAKE_*/doubles only; no live capital chaos      | **MANDATORY**           |
| **IMPL-COND-B06-09** | Related closed suites remain green              | **MANDATORY** (quality) |
| **IMPL-COND-B06-10** | Authorized file delta only                      | **MANDATORY**           |

```text
SLICE APPROVAL = CONFIRMED
```

---

## 9. Production-Change Wall

```text
PRODUCTION CHANGES = NONE
```

```text
FORBIDDEN unless separately amended after STOP + escalate:
  lease redesign
  fencing redesign
  TTL / reclaim redesign
  boundary redesign
  audit redesign
  schema / migration
  dependency upgrade
  SecurityAuditService.record / OD-B-06 catalog changes
```

---

## 10. Scope-Creep Wall

```text
B-06 MUST NOT:
  - introduce testcontainers
  - claim live dual-process / close C-B06-02 residual
  - invent wait/queue/timeout for RACE-09
  - reopen OD-B-06
  - rewrite B-05
  - remediate D-B03-04 / D-B03-06 / D-B03-08
  - implement 04-D / FIV / C7 / capital chaos
  - clean Wave-5 / 04-A leftovers
  - perform unrelated refactors
  - touch dirty/untracked leftovers outside authorized B-06 delta
```

---

## 11. Escalation Rule

```text
If implementation discovers that a frozen RACE / AC cannot be proven
without production modification:

  STOP
  → escalate as BLOCKER / ESCALATION REQUIRED
  → do NOT silently modify production
  → do NOT modify closed B-02/B-03/B-04/B-05 suites to “make green”
```

---

## 12. Implementation Kickoff Authorization

```text
IMPLEMENTATION KICKOFF = APPROVED
```

```text
IMPLEMENTATION AUTHORIZATION = GRANTED
UNDER FROZEN CONDITIONS ONLY
```

Authorized **only** under the conjunction of:

1. Decision Freeze **C-B06-01…05** (confirmed)
2. Slice Approval (**CONFIRMED**)
3. **IMPL-COND-B06-01…10** (mandatory)
4. **IPR-B06-01…05** (accepted / frozen by this artifact)
5. Implementation Planning file plan (four dedicated specs + report)

```text
NO ADDITIONAL SCOPE IS AUTHORIZED BY THIS KICKOFF.
```

Authorized CREATE targets (implementation act — **not this act**):

```text
apps/api/src/modules/connections/fiv-conn-04-b-06-concurrency.spec.ts
apps/api/src/modules/connections/fiv-conn-04-b-06-crash-ttl.spec.ts
apps/api/src/modules/connections/fiv-conn-04-b-06-boundary-concurrency.spec.ts
apps/api/src/modules/connections/fiv-conn-04-b-06-security-smoke.spec.ts
docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-06-implementation-report.md
```

```text
THIS KICKOFF ACT DOES NOT CREATE SPECS OR IMPLEMENT CODE.
```

---

## 13. Baseline

| Field       | Value                                      |
| ----------- | ------------------------------------------ |
| HEAD        | `d6b860299f3a5ade944c5ea55a7c007fe091843d` |
| origin/main | `d6b860299f3a5ade944c5ea55a7c007fe091843d` |
| Branch      | `main`                                     |
| B-05 CLOSED | `d6b8602`                                  |

Protected dirty/untracked leftovers remain **outside** B-06 and were **not** modified by this act.

---

## 14. Git Safety

```text
This governance act creates ONLY:
  docs/project/version-3/wave-6/v3-l02-fiv-conn-04-b-06-implementation-kickoff.md

Confirmed intent:
  - no production files modified
  - no B-05 files modified
  - no B-06 specs created
  - no leftovers touched
  - no commit
  - no push
```

---

## Final State

```text
IPR-B06-01 = ACCEPTED
IPR-B06-02 = ACCEPTED
IPR-B06-03 = ACCEPTED
IPR-B06-04 = ACCEPTED
IPR-B06-05 = ACCEPTED
DECISION FREEZE = CONFIRMED
SLICE APPROVAL = CONFIRMED
IMPLEMENTATION PLANNING REVIEW = RESOLVED
IMPLEMENTATION KICKOFF = APPROVED
PRODUCTION CHANGES = NONE
IMPLEMENTATION AUTHORIZATION = GRANTED
UNDER FROZEN CONDITIONS ONLY
```

```text
NEXT ACT = B-06 IMPLEMENTATION (TEST-ONLY)
under C-B06-01…05 + IMPL-COND-B06-01…10 + IPR-B06-01…05
```

**END OF FIV-CONN-04-B-06 IMPLEMENTATION KICKOFF**
