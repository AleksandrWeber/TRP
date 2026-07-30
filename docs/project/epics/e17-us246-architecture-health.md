# Architecture Health — E17 US246 Deterministic Runtime Arming

**Release:** RC-17  
**Epic:** E17 — Runtime Recovery  
**Story:** US246 — Deterministic Runtime Arming  
**Date:** 2026-07-30  
**Reviewer:** Auto (implementation slice)  
**Verdict:** PASS

Related:

- [US246 Architecture Note](./e17-us246-deterministic-runtime-arming.md)
- [US245 Deterministic Event Admission](./e17-us245-deterministic-event-admission.md)
- [E17 Spec](./e17-runtime-recovery-specification.md)

---

## Scope

Authorize Runtime executability by transitioning
`EVENT_ADMISSION_ENABLED → ARMED` after operational re-validation.
Do not evaluate strategies, emit SignalIntent, create Orders, or write
checkpoints.

---

## 1. Architecture

| #   | Y/N/NA | Evidence                                                         |
| --- | ------ | ---------------------------------------------------------------- |
| A1  | Yes    | ADR-014 preserved; arming uses existing Runtime lifecycle states |
| A2  | Yes    | Arming is a single recovery-layer responsibility only            |
| A3  | Yes    | Canonical Order Path untouched                                   |
| A4  | Yes    | Kill Switch remains externalized behind the US245 policy port    |
| A5  | Yes    | Runtime becomes executable without executing in this slice       |

---

## 2. Dependencies

| #   | Y/N/NA | Evidence                                                    |
| --- | ------ | ----------------------------------------------------------- |
| D1  | Yes    | Trading Session still depends on `StrategyRuntimePort` only |
| D2  | Yes    | No Orders/Risk/Execution/Accounting imports added           |
| D3  | Yes    | Reuses narrow Kill Switch policy interface                  |
| D5  | No     | No `forwardRef` / cycle workaround                          |

---

## 3. Determinism

| #   | Y/N/NA | Evidence                                                            |
| --- | ------ | ------------------------------------------------------------------- |
| T1  | Yes    | Arming derived from admission + current lease/lifecycle/diagnostics |
| T2  | Yes    | Duplicate arming blocked per session in-process                     |
| T3  | Yes    | No evaluate / SignalIntent / Order side effects during arming       |
| T4  | Yes    | Runtime identity re-checked against admitted checkpoint identity    |

---

## 4. Recovery / Safety

| #                     | Y/N/NA | Evidence                                                                 |
| --------------------- | ------ | ------------------------------------------------------------------------ |
| C1                    | Yes    | Arming requires prior admission success (`EVENT_ADMISSION_ENABLED`)      |
| C2                    | Yes    | Expired lease blocks arming                                              |
| C3                    | Yes    | Active Kill Switch blocks arming                                         |
| C4                    | Yes    | Invalid worker lifecycle blocks arming                                   |
| External side effects | Yes    | No `evaluate`, `emitSignalIntent`, `saveCheckpoint`, or Order path calls |
| Pipeline              | Yes    | US240–US245 recovery stages unchanged                                    |

---

## 5. Canonical Flow / Coupling

| #        | Y/N/NA | Evidence                                                                     |
| -------- | ------ | ---------------------------------------------------------------------------- |
| F1–F4    | Yes    | No canonical path or financial-domain changes                                |
| Coupling | Yes    | Arming remains a dedicated gate after admission, not a widened admission API |

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

- Durable Kill Switch ownership/integration remains later E19 work.
- Session exit from recovery and evaluation consumers remain later E17 work.
