# Architecture Health — E17 US249 Recovery Completion & Session Exit

**Release:** RC-17  
**Epic:** E17 — Runtime Recovery  
**Story:** US249 — Recovery Completion & Session Exit  
**Date:** 2026-07-30  
**Reviewer:** Auto (implementation slice)  
**Verdict:** PASS

Related:

- [US249 Architecture Note](./e17-us249-recovery-completion.md)
- [US248 Deterministic SignalIntent Generation](./e17-us248-deterministic-signal-intent-generation.md)
- [E17 Spec](./e17-runtime-recovery-specification.md)

---

## Scope

Complete the recovery pipeline after a terminal Stage 3 outcome. Exit Session
from `RECOVERING`, release recovery lease ownership, emit completion evidence.
Do not create Orders or mutate Runtime lifecycle.

---

## 1. Architecture

| #   | Y/N/NA | Evidence                                                             |
| --- | ------ | -------------------------------------------------------------------- |
| A1  | Yes    | ADR-014 Session transitions `RECOVERING → RUNNING\|PAUSED` preserved |
| A2  | Yes    | Completion is a single recovery-layer responsibility                 |
| A3  | Yes    | Canonical Order Path untouched                                       |
| A4  | Yes    | No Accounting / Execution Engine coupling                            |
| A5  | Yes    | Runtime lifecycle unchanged (`runtimeRemainsOperational=true`)       |

---

## 2. Dependencies

| #   | Y/N/NA | Evidence                                                                          |
| --- | ------ | --------------------------------------------------------------------------------- |
| D1  | Yes    | Trading Session still depends on `StrategyRuntimePort` only among Runtime modules |
| D2  | Yes    | No Orders/Risk/Execution/Accounting imports added                                 |
| D3  | Yes    | Reads prior stage results; does not re-enter evaluate/Order path                  |
| D5  | No     | No `forwardRef` / cycle workaround                                                |

---

## 3. Determinism

| #   | Y/N/NA | Evidence                                                       |
| --- | ------ | -------------------------------------------------------------- |
| T1  | Yes    | Pure `decideRecoveryCompletion` over stage snapshots + Session |
| T2  | Yes    | Duplicate completion blocked in-process                        |
| T3  | Yes    | `orderCreated=false` always                                    |
| T4  | Yes    | Lease owner/fence must match acquisition result                |

---

## 4. Recovery / Safety

| #                     | Y/N/NA | Evidence                                                   |
| --------------------- | ------ | ---------------------------------------------------------- |
| C1                    | Yes    | Requires consistent US240–US246 stage outcomes             |
| C2                    | Yes    | Non-`RECOVERING` lifecycle → `RECOVERY_COMPLETION_BLOCKED` |
| C3                    | Yes    | Lease mismatch / missing lease blocked                     |
| C4                    | Yes    | Unfinished stage blocked with `unfinishedStage`            |
| External side effects | Yes    | Session CAS + Outbox only; no Runtime stop/pause/evaluate  |
| Pipeline              | Yes    | US240–US248 stages unchanged                               |

---

## 5. Canonical Flow / Coupling

| #        | Y/N/NA | Evidence                                                          |
| -------- | ------ | ----------------------------------------------------------------- |
| F1–F4    | Yes    | No canonical path or financial-domain changes                     |
| Coupling | Yes    | Completion releases recovery ownership; does not widen Order APIs |

---

## Summary

| Category          | Result |
| ----------------- | ------ |
| Architecture      | Pass   |
| Dependencies      | Pass   |
| Determinism       | Pass   |
| Recovery / Safety | Pass   |
| Canonical Flow    | Pass   |

### Residual

- Durable RecoveryState / Incident / operator status ACs remain residual under
  local Stage 3 US249 scoping.
- Force-`RECOVERING` discovery residual remains under US240 / TD-036.
