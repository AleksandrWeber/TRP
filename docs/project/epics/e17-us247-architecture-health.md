# Architecture Health — E17 US247 First Deterministic Strategy Evaluation

**Release:** RC-17  
**Epic:** E17 — Runtime Recovery  
**Story:** US247 — First Deterministic Strategy Evaluation  
**Date:** 2026-07-30  
**Reviewer:** Auto (implementation slice)  
**Verdict:** PASS

Related:

- [US247 Architecture Note](./e17-us247-first-deterministic-strategy-evaluation.md)
- [US246 Deterministic Runtime Arming](./e17-us246-deterministic-runtime-arming.md)
- [E17 Spec](./e17-runtime-recovery-specification.md)

---

## Scope

Execute deterministic strategy evaluation after Runtime is `ARMED`.
Produce an evaluation decision only. Do not emit SignalIntent, create Orders,
or write checkpoints.

---

## 1. Architecture

| #   | Y/N/NA | Evidence                                                                  |
| --- | ------ | ------------------------------------------------------------------------- |
| A1  | Yes    | ADR-014 preserved; evaluation gated on existing `ARMED` lifecycle         |
| A2  | Yes    | Evaluation is a single recovery-layer responsibility only                 |
| A3  | Yes    | Canonical Order Path untouched                                            |
| A4  | Yes    | No Accounting / Execution Engine coupling                                 |
| A5  | Yes    | Runtime lifecycle unchanged; evaluation does not transition worker states |

---

## 2. Dependencies

| #   | Y/N/NA | Evidence                                                                  |
| --- | ------ | ------------------------------------------------------------------------- |
| D1  | Yes    | Trading Session still depends on `StrategyRuntimePort` only               |
| D2  | Yes    | No Orders/Risk/Execution/Accounting imports added                         |
| D3  | Yes    | Uses pure `decideRuntimeEvaluation`; never `runtime.evaluate` commit path |
| D5  | No     | No `forwardRef` / cycle workaround                                        |

---

## 3. Determinism

| #   | Y/N/NA | Evidence                                                               |
| --- | ------ | ---------------------------------------------------------------------- |
| T1  | Yes    | Decision derived from approved Deployment parameters + admitted candle |
| T2  | Yes    | Duplicate events blocked (checkpoint admission + in-process set)       |
| T3  | Yes    | `signalIntentEmitted=false`, `orderCreated=false` always               |
| T4  | Yes    | Restored context must match armed checkpoint identity                  |

---

## 4. Recovery / Safety

| #                     | Y/N/NA | Evidence                                                                 |
| --------------------- | ------ | ------------------------------------------------------------------------ |
| C1                    | Yes    | Evaluation requires prior arming success (`ARMED`)                       |
| C2                    | Yes    | Non-ARMED lifecycle blocks evaluation                                    |
| C3                    | Yes    | Context/checkpoint mismatch blocks evaluation                            |
| C4                    | Yes    | Duplicate event handling verified in unit + orchestration tests          |
| External side effects | Yes    | No `evaluate`, `emitSignalIntent`, `saveCheckpoint`, or Order path calls |
| Pipeline              | Yes    | US240–US246 recovery stages unchanged                                    |

---

## 5. Canonical Flow / Coupling

| #        | Y/N/NA | Evidence                                                                            |
| -------- | ------ | ----------------------------------------------------------------------------------- |
| F1–F4    | Yes    | No canonical path or financial-domain changes                                       |
| Coupling | Yes    | Evaluation remains a dedicated post-arming gate; does not widen Runtime commit APIs |

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

- SignalIntent emission from evaluated decisions is covered by US248.
- Original fail-safe suite ACs (crash/replay fixtures) remain residual under
  local Stage 3 US247 scoping.
- Session exit from recovery remains later E17 work.
