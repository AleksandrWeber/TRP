# Architecture Health — E17 US248 Deterministic SignalIntent Generation

**Release:** RC-17  
**Epic:** E17 — Runtime Recovery  
**Story:** US248 — Deterministic SignalIntent Generation  
**Date:** 2026-07-30  
**Reviewer:** Auto (implementation slice)  
**Verdict:** PASS

Related:

- [US248 Architecture Note](./e17-us248-deterministic-signal-intent-generation.md)
- [US247 First Deterministic Strategy Evaluation](./e17-us247-first-deterministic-strategy-evaluation.md)
- [E17 Spec](./e17-runtime-recovery-specification.md)

---

## Scope

Generate exactly one SignalIntent from a validated US247 Evaluation Decision.
Do not create Orders, contact Execution Engine, mutate Accounting, or write
checkpoints. Runtime lifecycle remains unchanged.

---

## 1. Architecture

| #   | Y/N/NA | Evidence                                                           |
| --- | ------ | ------------------------------------------------------------------ |
| A1  | Yes    | ADR-014 preserved; generation gated on ARMED + evaluated decision  |
| A2  | Yes    | SignalIntent generation is a single recovery-layer responsibility  |
| A3  | Yes    | Canonical Order Path untouched; no Order proposal calls            |
| A4  | Yes    | No Accounting / Execution Engine coupling                          |
| A5  | Yes    | Runtime lifecycle unchanged; no arm/pause/resume/stop side effects |

---

## 2. Dependencies

| #   | Y/N/NA | Evidence                                                                   |
| --- | ------ | -------------------------------------------------------------------------- |
| D1  | Yes    | Trading Session still depends on `StrategyRuntimePort` only                |
| D2  | Yes    | No Orders/Risk/Execution/Accounting imports added                          |
| D3  | Yes    | Persists via `emitSignalIntent` only; never `runtime.evaluate` commit path |
| D5  | No     | No `forwardRef` / cycle workaround                                         |

---

## 3. Determinism

| #   | Y/N/NA | Evidence                                                              |
| --- | ------ | --------------------------------------------------------------------- |
| T1  | Yes    | Mapping is pure function of evaluation + armed identity + candle      |
| T2  | Yes    | Duplicate decision / event / already-generated blocked                |
| T3  | Yes    | `orderCreated=false` always; durable identity via existing intentHash |
| T4  | Yes    | Session + Runtime identity must match restored evaluation context     |

---

## 4. Recovery / Safety

| #                     | Y/N/NA | Evidence                                                       |
| --------------------- | ------ | -------------------------------------------------------------- |
| C1                    | Yes    | Requires prior US247 `EVALUATED` + US246 `ARMED`               |
| C2                    | Yes    | Non-ARMED / invalid lifecycle → `SIGNAL_GENERATION_BLOCKED`    |
| C3                    | Yes    | Session / Runtime identity mismatch blocks generation          |
| C4                    | Yes    | Duplicate protection verified in unit + orchestration tests    |
| External side effects | Yes    | Only `emitSignalIntent`; no Orders / evaluate / saveCheckpoint |
| Pipeline              | Yes    | US240–US247 recovery stages unchanged                          |

---

## 5. Canonical Flow / Coupling

| #        | Y/N/NA | Evidence                                                                              |
| -------- | ------ | ------------------------------------------------------------------------------------- |
| F1–F4    | Yes    | SignalIntent published on Runtime path; Canonical Order Path remains downstream owner |
| Coupling | Yes    | Generation does not widen Order/Risk/Execution APIs                                   |

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

- Order creation from recovery SignalIntents remains later work.
- Original chaos/restart evidence ACs remain residual under local Stage 3
  US248 scoping.
- Session exit from recovery remains later E17 work.
