# Architecture Health — E17 US245 Deterministic Event Admission

**Release:** RC-17  
**Epic:** E17 — Runtime Recovery  
**Story:** US245 — Deterministic Event Admission  
**Date:** 2026-07-30  
**Reviewer:** Auto (implementation slice)  
**Verdict:** PASS

Related:

- [US245 Architecture Note](./e17-us245-deterministic-event-admission.md)
- [US244 Runtime Resume](./e17-us244-runtime-resume.md)
- [E17 Spec](./e17-runtime-recovery-specification.md)

---

## Scope

Enable external semantic event admission only after recovery `READY`.
Do not enable evaluation, SignalIntent, Orders, or checkpoint writes.

---

## 1. Architecture

| #   | Y/N/NA | Evidence                                                           |
| --- | ------ | ------------------------------------------------------------------ |
| A1  | Yes    | ADR-014 preserved; no second lifecycle model introduced            |
| A2  | Yes    | Admission added as a new recovery-layer responsibility only        |
| A3  | Yes    | Canonical Order Path untouched                                     |
| A4  | Yes    | Kill Switch remains externalized behind a read-only policy port    |
| A5  | Yes    | Runtime becomes externally reachable only after explicit admission |

---

## 2. Dependencies

| #   | Y/N/NA | Evidence                                                           |
| --- | ------ | ------------------------------------------------------------------ |
| D1  | Yes    | Trading Session still depends on `StrategyRuntimePort` only        |
| D2  | Yes    | No Orders/Risk/Execution/Accounting imports added                  |
| D3  | Yes    | Kill Switch integration is a narrow interface, not module coupling |
| D5  | No     | No `forwardRef` / cycle workaround                                 |

---

## 3. Determinism

| #   | Y/N/NA | Evidence                                                             |
| --- | ------ | -------------------------------------------------------------------- |
| T1  | Yes    | Admission derived from READY + current lease/lifecycle/diagnostics   |
| T2  | Yes    | Duplicate admission blocked per session in-process                   |
| T3  | Yes    | Evaluation remains blocked in `EVENT_ADMISSION_ENABLED`              |
| T4  | Yes    | Admission verifies current checkpoint identity before opening intake |

---

## 4. Recovery / Safety

| #                     | Y/N/NA | Evidence                                                                 |
| --------------------- | ------ | ------------------------------------------------------------------------ |
| C1                    | Yes    | Admission requires prior pipeline success (`READY`)                      |
| C2                    | Yes    | Expired lease blocks admission                                           |
| C3                    | Yes    | Active Kill Switch blocks admission                                      |
| C4                    | Yes    | Invalid worker state blocks admission                                    |
| External side effects | Yes    | No `evaluate`, `emitSignalIntent`, `saveCheckpoint`, or Order path calls |

---

## 5. Canonical Flow / Coupling

| #        | Y/N/NA | Evidence                                                                      |
| -------- | ------ | ----------------------------------------------------------------------------- |
| F1–F4    | Yes    | No canonical path or financial-domain changes                                 |
| Coupling | Yes    | Runtime admission split from evaluation instead of widening `ARMED` semantics |

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
- Session exit from recovery and later evaluation enablement remain later E17
  work.
