# Architecture Health — E17 US241 Recovery Lease Acquisition

**Release:** RC-17  
**Epic:** E17 — Runtime Recovery  
**Story:** US241 — Recovery Lease Acquisition  
**Date:** 2026-07-30  
**Reviewer:** Auto (implementation slice)  
**Verdict:** PASS

Related:

- [RC-17 Development Process — Stage 5](../rc-17-development-process.md)
- [E17 Runtime Recovery Specification](./e17-runtime-recovery-specification.md)
- [US241 Architecture Note](./e17-us241-startup-recovery-lease.md)
- [ADR-014 Runtime Lifecycle](../../adr/ADR-014-runtime-lifecycle.md)

---

## Scope of this review

Lease acquisition only for the US240 recovery candidate: exclusive ownership via
fenced lease + optimistic CAS. No checkpoint, validate, reconcile, or Runtime resume.

---

## 1. Architecture

| #   | Question                                                                       | Y/N/NA | Evidence                                                                       |
| --- | ------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------ |
| A1  | Does the epic still honor ADR-012…ADR-018 without silent supersession?         | Yes    | Reuses Session lease / fencing; no new lifecycle model                         |
| A2  | Are module ownership statements in ADR-017 still accurate for touched modules? | Yes    | Ownership stays in `trading-session/`                                          |
| A3  | Is there still exactly one paper execution path (no parallel tick/adapter)?    | Yes    | No execution path added                                                        |
| A4  | Do new components have a clear owner, inputs, outputs, and prohibitions?       | Yes    | `RecoveryLeaseAcquisitionService`: candidate in → ACQUIRED\|DENIED; no Runtime |
| A5  | Would removing this epic’s code leave the freeze coherent (no half-fork)?      | Yes    | Additive CAS path on existing aggregate                                        |

**Notes:** No Recovery Coordinator / new BC.

---

## 2. Dependencies

| #   | Question                                                                                          | Y/N/NA | Evidence                                                  |
| --- | ------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------- |
| D1  | Is dependency direction still acyclic for touched modules?                                        | Yes    | Session → Prisma + Logger + Discovery                     |
| D2  | Does Strategy Runtime still avoid Orders/Risk/Execution/Accounting imports beyond approved ports? | Yes    | Runtime not modified; lease service does not call Runtime |
| D3  | Does Dashboard/UI depend only on public APIs/read models?                                         | N/A    |                                                           |
| D4  | Are provider payloads/credentials confined to adapters?                                           | N/A    |                                                           |
| D5  | Were any `forwardRef` / cycle workarounds introduced? If yes, is TD filed?                        | No     | Discovery registered before lease service                 |

**Notes:** Boundary test forbids RecoveryCoordinator/Orchestrator.

---

## 3. Replay

| #     | Question    | Y/N/NA | Evidence                                 |
| ----- | ----------- | ------ | ---------------------------------------- |
| R1–R4 | Replay path | N/A    | Lease ownership only; no semantic stream |

**Notes:**

---

## 4. Determinism

| #   | Question                                                           | Y/N/NA | Evidence                                            |
| --- | ------------------------------------------------------------------ | ------ | --------------------------------------------------- |
| T1  | Do business calculations avoid wall-clock authority (ADR-018 #49)? | Yes    | Wall-clock used only for lease expiry (ADR-018 #53) |
| T2  | Same ordered semantic stream + config ⇒ same business effects?     | N/A    | No business effects                                 |
| T3  | Decimal/rounding unchanged?                                        | N/A    |                                                     |
| T4  | IDs/hashes stable across restart for identical semantic inputs?    | Yes    | Fence = lastFencingToken+1 durable                  |

**Notes:** Concurrent attempts resolve via version CAS — deterministic deny for losers.

---

## 5. Recovery

| #   | Question                                                                 | Y/N/NA | Evidence                                                                        |
| --- | ------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------- |
| C1  | Do non-terminal Sessions enter `RECOVERING` on startup where applicable? | No     | Residual (US240); lease does not change status                                  |
| C2  | Is reconciliation required before resume of execution?                   | N/A    | Resume later                                                                    |
| C3  | Can a stale lease holder still not commit work?                          | Yes    | New fence on acquire; foreign active lease denied; existing fence checks remain |
| C4  | Crash tests / duplicates                                                 | N/A    | US247                                                                           |
| C5  | Graceful shutdown recoverable                                            | N/A    | US246                                                                           |

**Notes:** Single writer preserved by CAS. Lease cannot trigger Runtime execution (no Runtime calls).

---

## 6. Canonical Flow

| #   | Question                                   | Y/N/NA | Evidence               |
| --- | ------------------------------------------ | ------ | ---------------------- |
| F1  | Canonical path unchanged?                  | Yes    | Untouched              |
| F2  | CanonicalOrderPath orchestration-only?     | Yes    | Not imported           |
| F3  | Shared engines for strategy/manual Orders? | Yes    | Untouched              |
| F4  | Bypass impossible by test?                 | Yes    | Session boundary specs |

**Notes:**

---

## 7. Outbox / Inbox

| #     | Question | Y/N/NA    | Evidence                                                           |
| ----- | -------- | --------- | ------------------------------------------------------------------ |
| O1–O5 |          | N/A / Yes | Lease persist without Outbox in this slice; no exactly-once claims |

**Notes:** Optional lease Outbox event deferred; logging records outcome.

---

## 8. Coupling

| #   | Question                                                  | Y/N/NA | Evidence               |
| --- | --------------------------------------------------------- | ------ | ---------------------- |
| K1  | Bounded contexts separate?                                | Yes    | Inside Trading Session |
| K2  | Orders/Risk/Exec/Accounting evolve without Runtime edits? | Yes    | Runtime unchanged      |
| K3  | Shared kernels limited?                                   | Yes    | Existing SessionLease  |
| K4  | Research Signal Engine isolated?                          | Yes    |                        |

**Notes:**

---

## 9. Technical Debt

| #   | Question                          | Y/N/NA | Evidence                             |
| --- | --------------------------------- | ------ | ------------------------------------ |
| X1  | New debt registered?              | Yes    | TD-036 notes US241 lease slice       |
| X2  | Prior debt re-scoped?             | Yes    | TD-036 still Planned (partial)       |
| X3  | Temporary shortcuts time-bounded? | Yes    | Status→RECOVERING still residual     |
| X4  | Epic exit honesty?                | Yes    | Full S2+ still required for E17 exit |

**Notes:**

---

## Summary

| Category       | Result                                          |
| -------------- | ----------------------------------------------- |
| Architecture   | Pass                                            |
| Dependencies   | Pass                                            |
| Replay         | N/A                                             |
| Determinism    | Pass                                            |
| Recovery       | Pass (C3); C1 residual unrelated to lease slice |
| Canonical Flow | Pass                                            |
| Outbox / Inbox | N/A                                             |
| Coupling       | Pass                                            |
| Technical Debt | Residual TD-036 (broader E17)                   |

### Blockers

- None for US241 lease slice.

### Accepted residual TD

- **TD-036** — remaining recovery algorithm after ownership (assembly, reconcile, resume, force `RECOVERING`).

### Follow-ups

- US242 durable recovery assembly (requires `LEASE_ACQUIRED`).
- Complete force-`RECOVERING` + RecoveryState (US240 residual / US249).
