# Architecture Health — E17 US242 Checkpoint Discovery & Validation

**Release:** RC-17  
**Epic:** E17 — Runtime Recovery  
**Story:** US242 — Recovery Checkpoint Discovery & Validation  
**Date:** 2026-07-30  
**Reviewer:** Auto (implementation slice)  
**Verdict:** PASS WITH RESIDUAL TD

Related:

- [US242 Architecture Note](./e17-us242-checkpoint-validation.md)
- [E17 Spec](./e17-runtime-recovery-specification.md)
- [ADR-014](../../adr/ADR-014-runtime-lifecycle.md)

---

## Scope

Checkpoint load + pure validation after `LEASE_ACQUIRED`. Not full durable
assembly (Orders/accounting/Risk) from epic US242 AC #1.

---

## 1. Architecture

| #   | Question                     | Y/N/NA | Evidence                                            |
| --- | ---------------------------- | ------ | --------------------------------------------------- |
| A1  | ADR-012…018 honored?         | Yes    | Read-only via Runtime port; no new BC               |
| A2  | ADR-017 ownership accurate?  | Yes    | Checkpoint owned by Runtime; Session validates      |
| A3  | Single paper execution path? | Yes    | Untouched                                           |
| A4  | New components clear?        | Yes    | `RecoveryCheckpointValidationService` outcomes only |
| A5  | Removable without half-fork? | Yes    | Additive                                            |

**Notes:** No Recovery Coordinator.

---

## 2. Dependencies

| #     | Question                 | Y/N/NA | Evidence                                        |
| ----- | ------------------------ | ------ | ----------------------------------------------- |
| D1    | Acyclic?                 | Yes    | Session → StrategyRuntimePort + lease/discovery |
| D2    | Runtime avoids Orders/…? | Yes    | Runtime unchanged                               |
| D3–D4 | UI / providers           | N/A    |                                                 |
| D5    | forwardRef?              | No     |                                                 |

**Notes:** Boundary specs still forbid Orders/Risk/Execution imports.

---

## 3. Replay

| #     | Y/N/NA | Evidence           |
| ----- | ------ | ------------------ |
| R1–R4 | N/A    | No resume / replay |

---

## 4. Determinism

| #   | Y/N/NA | Evidence                                       |
| --- | ------ | ---------------------------------------------- |
| T1  | Yes    | No wall-clock in validation decision           |
| T2  | N/A    | No business effects                            |
| T4  | Yes    | Latest = unique `(workspaceId, sessionId)` row |

**Notes:** Validation is pure (`validateRecoveryCheckpoint`).

---

## 5. Recovery

| #     | Y/N/NA | Evidence                                    |
| ----- | ------ | ------------------------------------------- |
| C1    | No     | Force `RECOVERING` still residual           |
| C2    | N/A    | Reconcile later                             |
| C3    | Yes    | Requires leased fence; does not arm Runtime |
| C4–C5 | N/A    |                                             |

**Notes:** No Runtime state changes (`arm`/`resume`/`evaluate`/`saveCheckpoint` unused).

---

## 6. Canonical Flow

| #     | Y/N/NA | Evidence                                             |
| ----- | ------ | ---------------------------------------------------- |
| F1–F4 | Yes    | Canonical Order Path untouched; boundary tests green |

---

## 7. Outbox / Inbox

| #     | Y/N/NA    | Evidence                          |
| ----- | --------- | --------------------------------- |
| O1–O5 | N/A / Yes | Read-only; no new delivery claims |

---

## 8. Coupling

| #     | Y/N/NA | Evidence                                              |
| ----- | ------ | ----------------------------------------------------- |
| K1–K4 | Yes    | Session orchestrates; Runtime owns checkpoint payload |

---

## 9. Technical Debt

| #     | Y/N/NA | Evidence                                                  |
| ----- | ------ | --------------------------------------------------------- |
| X1–X4 | Yes    | TD-036 residual: full assembly ports + force `RECOVERING` |

---

## Summary

| Category       | Result                             |
| -------------- | ---------------------------------- |
| Architecture   | Pass                               |
| Dependencies   | Pass                               |
| Replay         | N/A                                |
| Determinism    | Pass                               |
| Recovery       | Pass (slice); residual broader E17 |
| Canonical Flow | Pass                               |
| Outbox / Inbox | N/A                                |
| Coupling       | Pass                               |
| Technical Debt | Residual TD-036                    |

### Blockers

- None for this validation slice.

### Accepted residual TD

- Full US242 assembly (Orders/Fills/Position/Ledger/Portfolio/Risk/Kill Switch) deferred.
- Schema version not yet a DB column — gated via `runtimeVersion` + code constant.

### Follow-ups

- US243 reconcile (requires valid assembly / VALID_CHECKPOINT path).
- Expand assembly loaders under TD-036.
