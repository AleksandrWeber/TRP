# US294 Evidence Package — Chaos / Restart Evidence

**Story:** US294 — Chaos / Restart Evidence  
**Release:** RC-18  
**Date:** 2026-08-01  
**Status:** **COMPLETE** (mandatory matrix M-01…M-12 executed)  
**Authority:** [US294 Story Specification](./stories/us294-chaos-restart-evidence.md)  
**Suite:** `apps/api/src/modules/trading-session/recovery/us294-chaos-restart.evidence.spec.ts`

Related:

- [Residual Register](./rc-18-residual-register.md)
- [RIV-001](./rc-18-riv-001-recovery-integration-validation.md)
- [SIG-001](./rc-18-sig-001-safety-integration-validation.md)
- [US295](./stories/) — consumes this package (ADL-008 governance; not implemented here)

---

## Claim-language limits (§6.8)

| Claim                              | After US294?            |
| ---------------------------------- | ----------------------- |
| TR-N4 / R5 chaos evidence attached | **Yes**                 |
| Production restart-safety PASS     | **No** — requires US295 |
| ADL-008 ACCEPTED                   | **No** — US295          |

---

## Process-boundary method (NFR-2 / §10.2)

Scenarios simulate **SIGKILL-class process death** by retaining durable
in-memory Maps (Session, RecoveryState, Incident, Outbox) while clearing
volatile stage caches. This is an **equivalent durable-store restart
boundary** under Architecture Freeze (no production redesign). M-08, M-12,
and mid-pipeline crashes M-02…M-07 use this boundary. M-10 uses controlled
Outbox loss/redelivery with Inbox idempotency (Story §10.2 allowed).

---

## Aggregate verdict

| Matrix                       | Result                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| M-01…M-12                    | **12 / 12 PASS**                                                                                 |
| Suite command                | `pnpm exec vitest run src/modules/trading-session/recovery/us294-chaos-restart.evidence.spec.ts` |
| Residuals blocking US294 DoD | **None**                                                                                         |

---

## Scenario records

### M-01 Crash after Discovery

```text
Scenario:                      M-01 Crash after Discovery
Expected behaviour:            On restart: rediscover eligible Session; no evaluation from discovery alone; proceed into recovery open
Actual behaviour:              After SIGKILL sim, rediscovery selects same Session; recoveringOpen remains null; no evaluation admitted
Architecture invariants verified:
  - ADR-014 restart step 1 / E17 S1 / O2
  - US240 discovery does not mutate lifecycle alone
Evidence collected:
  - apps/api/src/modules/trading-session/recovery/us294-chaos-restart.evidence.spec.ts (M-01)
PASS / FAIL:                   PASS
Residuals (if any):            none
```

### M-02 Crash after Recovery Open

```text
Scenario:                      M-02 Crash after Recovery Open
Expected behaviour:            Session remains/reconfirms RECOVERING; preRecoveryStatus/resumeIntent durable; no SignalIntent; intent not rewritten
Actual behaviour:              Durable RECOVERING + resumeIntent=RUNNING survived; confirm idempotent; re-open preserved RUNNING intent despite contradictory input
Architecture invariants verified:
  - US290 force/confirm; US292 P0-1/P0-2; ADR-018 #23–24
Evidence collected:
  - us294-chaos-restart.evidence.spec.ts (M-02)
PASS / FAIL:                   PASS
Residuals (if any):            none
```

### M-03 Crash after Lease

```text
Scenario:                      M-03 Crash after Lease
Expected behaviour:            Re-entry re-acquires lease (new generation); stale fence cannot commit; algorithm continues without skipping validate/reconcile
Actual behaviour:              After crash, expired lease re-acquired by new owner with fencingToken > stale; assertLeaseCurrent(stale) throws; execution eligibility denied for stale token
Architecture invariants verified:
  - US241; E17 §7.8–§7.9; ADR-018 #20–21; RIV fencing residual
Evidence collected:
  - us294-chaos-restart.evidence.spec.ts (M-03)
PASS / FAIL:                   PASS
Residuals (if any):            none (RIV fencing restore evidenced via re-lease + stale reject)
```

### M-04 Crash after Checkpoint

```text
Scenario:                      M-04 Crash after Checkpoint
Expected behaviour:            Durable checkpoint/progress retained diagnostically; re-entry does not skip validate/reconcile
Actual behaviour:              lastAttemptedPhase=VALIDATING retained; re-entry phase=RECOVERING; illegal skip to READY rejected
Architecture invariants verified:
  - US242; US292 §4.4; E17 §4.4 idempotency
Evidence collected:
  - us294-chaos-restart.evidence.spec.ts (M-04)
PASS / FAIL:                   PASS
Residuals (if any):            none
```

### M-05 Crash during Reconciliation

```text
Scenario:                      M-05 Crash during Reconciliation
Expected behaviour:            Re-entry restarts reconcile path; no silent RECONCILED from partial/mismatch; Incident + FAILED on ambiguity
Actual behaviour:              Re-entry at RECOVERING; reconcileRecoveryState → RECONCILIATION_FAILED on mismatch; Incident created; phase FAILED + incidentId correlated
Architecture invariants verified:
  - US243; US291; US293; O8; ADR-018 #23
Evidence collected:
  - us294-chaos-restart.evidence.spec.ts (M-05)
PASS / FAIL:                   PASS
Residuals (if any):            none
```

### M-06 Crash before Resume

```text
Scenario:                      M-06 Crash before Resume
Expected behaviour:            No premature evaluation/SignalIntent; in-memory caches non-authoritative after crash
Actual behaviour:              Volatile reconcile/admit caches cleared; durable phase remains RECONCILING; Session RECOVERING not execution-eligible
Architecture invariants verified:
  - ADR-018 #22–24; E17 R9; US244 gates
Evidence collected:
  - us294-chaos-restart.evidence.spec.ts (M-06)
PASS / FAIL:                   PASS
Residuals (if any):            none
```

### M-07 Crash after READY

```text
Scenario:                      M-07 Crash after READY
Expected behaviour:            Re-entry safe; no skip of exit gates; no new execution while RECOVERING
Actual behaviour:              Durable READY survived crash; Session still RECOVERING (not eligible); re-entry resets to RECOVERING and rejects skip-to-READY
Architecture invariants verified:
  - US244; US249; US292; ADR-018 #23–24
Evidence collected:
  - us294-chaos-restart.evidence.spec.ts (M-07)
PASS / FAIL:                   PASS
Residuals (if any):            none
```

### M-08 Double Restart

```text
Scenario:                      M-08 Double Restart
Expected behaviour:            Second restart idempotent; Session identity retained; fencing restores each successful re-lease; no duplicate rows
Actual behaviour:              Two SIGKILL sims → recoveryAttempt 2 then 3; single Session id; fencing tokens strictly increasing across re-leases
Architecture invariants verified:
  - O1; O3; E17 §4.4 / §7.8; ADR-018 #9, #20–21
Evidence collected:
  - us294-chaos-restart.evidence.spec.ts (M-08)
PASS / FAIL:                   PASS
Residuals (if any):            none
```

### M-09 Duplicate Recovery Attempt

```text
Scenario:                      M-09 Duplicate Recovery Attempt
Expected behaviour:            Idempotent confirm; no second lifecycle authority; resumeIntent not silently rewritten
Actual behaviour:              Second open action=confirmed, transitioned=false; RecoveryState recoveryId unchanged; intent preserved despite contradictory reopen input
Architecture invariants verified:
  - US290 FR-5/FR-10; US292 NFR-4; E17 §4.4
Evidence collected:
  - us294-chaos-restart.evidence.spec.ts (M-09)
PASS / FAIL:                   PASS
Residuals (if any):            none
```

### M-10 Lost Outbox Delivery

```text
Scenario:                      M-10 Lost Outbox Delivery
Expected behaviour:            At-least-once safe: redelivery does not duplicate business effects; no silent ack of failed durable delivery
Actual behaviour:              PENDING Outbox survived SIGKILL sim; first dispatch applied once; publication status loss + redispatch → duplicate Inbox no-op; projection count remained 1; duplicate eventId insert rejected
Architecture invariants verified:
  - ADR-013; ADR-018 #11–13, #18; E17 R20
Evidence collected:
  - us294-chaos-restart.evidence.spec.ts (M-10)
  - Reuses OutboxDispatcher + IdempotentConsumerProcessor patterns
PASS / FAIL:                   PASS
Residuals (if any):            none (full E18 Inbox audit of every consumer remains E18)
```

### M-11 Database unavailable during Recovery

```text
Scenario:                      M-11 Database unavailable during Recovery
Expected behaviour:            No false-green resume; fail closed / safe refusal; last committed durable state authority when DB returns
Actual behaviour:              Mid-recovery save threw database_unavailable; prior RecoveryState phase RECOVERING unchanged; Session not execution-eligible
Architecture invariants verified:
  - ADR-018 #22–23; E17 O8; §7.1
Evidence collected:
  - us294-chaos-restart.evidence.spec.ts (M-11)
PASS / FAIL:                   PASS
Residuals (if any):            none
```

### M-12 Process SIGKILL

```text
Scenario:                      M-12 Process SIGKILL
Expected behaviour:            Last committed durable state is authority; cold start runs ADR-014 recovery; zero duplicate Session/RecoveryState identities
Actual behaviour:              Uncommitted volatile work discarded; durable RECOVERING + VALIDATING lastAttemptedPhase retained; cold rediscovery confirms; single Session/RecoveryState identity
Architecture invariants verified:
  - E17 §7.1; O1; O2; ADR-014 Restart recovery
Evidence collected:
  - us294-chaos-restart.evidence.spec.ts (M-12)
PASS / FAIL:                   PASS
Residuals (if any):            none
```

---

## US295 handoff

This Evidence Package is the chronological **input** for **US295** (ADL-008
ACCEPTED or explicit accepted deferral). US294 does **not** modify ADL.md or
claim ADL-008 ACCEPTED.

---

## Explicit non-delivery

- No US295 / ADL-008 governance write
- No E19 Kill Switch policy / Incident dashboard / recovery status API
- No Recovery / Runtime / RecoveryState / Incident / Session lifecycle redesign
- No ADR changes
