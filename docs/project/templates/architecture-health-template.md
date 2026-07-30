# Architecture Health — Template

**Release:** RC-17  
**Epic:** E?? — _name_  
**Date:** YYYY-MM-DD  
**Reviewer:**  
**Verdict:** PASS | PASS WITH RESIDUAL TD | FAIL

Related: [RC-17 Development Process — Stage 5](../rc-17-development-process.md)

---

## Instructions

Answer every question with **Yes / No / N/A** plus brief evidence (test name,
doc link, commit, or note). Any **No** without an accepted TD owner is a
blocker. Do not redesign architecture in this review; escalate to ADR if an
invariant must change.

---

## 1. Architecture

| #   | Question                                                                       | Y/N/NA | Evidence |
| --- | ------------------------------------------------------------------------------ | ------ | -------- |
| A1  | Does the epic still honor ADR-012…ADR-018 without silent supersession?         |        |          |
| A2  | Are module ownership statements in ADR-017 still accurate for touched modules? |        |          |
| A3  | Is there still exactly one paper execution path (no parallel tick/adapter)?    |        |          |
| A4  | Do new components have a clear owner, inputs, outputs, and prohibitions?       |        |          |
| A5  | Would removing this epic’s code leave the freeze coherent (no half-fork)?      |        |          |

**Notes:**

---

## 2. Dependencies

| #   | Question                                                                                          | Y/N/NA | Evidence |
| --- | ------------------------------------------------------------------------------------------------- | ------ | -------- |
| D1  | Is dependency direction still acyclic for touched modules?                                        |        |          |
| D2  | Does Strategy Runtime still avoid Orders/Risk/Execution/Accounting imports beyond approved ports? |        |          |
| D3  | Does Dashboard/UI depend only on public APIs/read models?                                         |        |          |
| D4  | Are provider payloads/credentials confined to adapters?                                           |        |          |
| D5  | Were any `forwardRef` / cycle workarounds introduced? If yes, is TD filed?                        |        |          |

**Notes:**

---

## 3. Replay

| #   | Question                                                                                | Y/N/NA | Evidence |
| --- | --------------------------------------------------------------------------------------- | ------ | -------- |
| R1  | Can recorded semantic streams be replayed for the epic’s path?                          |        |          |
| R2  | Does replay rebuild projections without re-applying live financial effects incorrectly? |        |          |
| R3  | Are replay fixtures versioned and cited from tests?                                     |        |          |
| R4  | Is operational metadata excluded from semantic replay identity?                         |        |          |

**Notes:**

---

## 4. Determinism

| #   | Question                                                                                   | Y/N/NA | Evidence |
| --- | ------------------------------------------------------------------------------------------ | ------ | -------- |
| T1  | Do business calculations avoid wall-clock authority (ADR-018 #49)?                         |        |          |
| T2  | Same ordered semantic stream + config ⇒ same Orders/Fills/Positions/Ledger/Portfolio/Risk? |        |          |
| T3  | Are decimal/rounding policies explicit and unchanged unless ADR allows?                    |        |          |
| T4  | Are IDs/hashes stable across restart for identical semantic inputs?                        |        |          |

**Notes:**

---

## 5. Recovery

| #   | Question                                                                 | Y/N/NA | Evidence |
| --- | ------------------------------------------------------------------------ | ------ | -------- |
| C1  | Do non-terminal Sessions enter `RECOVERING` on startup where applicable? |        |          |
| C2  | Is reconciliation required before resume of execution?                   |        |          |
| C3  | Can a stale lease holder still not commit work?                          |        |          |
| C4  | Do crash tests show no duplicate Signal Intents/Orders/Fills?            |        |          |
| C5  | Does graceful shutdown leave durable recoverable state?                  |        |          |

**Notes:**

---

## 6. Canonical Flow

| #   | Question                                                                                                                  | Y/N/NA | Evidence |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ------ | -------- |
| F1  | Is the path still MD → Session/Runtime → SignalIntent → Orders → Risk → Execution → Fill → Position → Ledger → Portfolio? |        |          |
| F2  | Does CanonicalOrderPath remain orchestration-only (no new semantics)?                                                     |        |          |
| F3  | Are strategy-origin and manual-origin Orders still sharing the same engines?                                              |        |          |
| F4  | Is any bypass (Runtime→Adapter, UI→Ledger write, etc.) impossible by test?                                                |        |          |

**Notes:**

---

## 7. Outbox / Inbox

| #   | Question                                                                 | Y/N/NA | Evidence |
| --- | ------------------------------------------------------------------------ | ------ | -------- |
| O1  | Are durable state changes published via transactional Outbox?            |        |          |
| O2  | Does every durable consumer use Inbox idempotency?                       |        |          |
| O3  | Does consumer progress survive restart (checkpoints / per-consumer ack)? |        |          |
| O4  | Are failed deliveries never silently acknowledged?                       |        |          |
| O5  | Is at-least-once assumed (no false exactly-once claims)?                 |        |          |

**Notes:**

---

## 8. Coupling

| #   | Question                                                                                           | Y/N/NA | Evidence |
| --- | -------------------------------------------------------------------------------------------------- | ------ | -------- |
| K1  | Are bounded contexts still separate (no merged God-module)?                                        |        |          |
| K2  | Can Orders, Risk, Execution, Accounting evolve without Runtime source edits for unrelated changes? |        |          |
| K3  | Are shared kernels limited to stable contracts (IDs, decimals, ports)?                             |        |          |
| K4  | Is research Signal Engine / Evaluation Scheduler still isolated from Runtime?                      |        |          |

**Notes:**

---

## 9. Technical Debt

| #   | Question                                                                | Y/N/NA | Evidence |
| --- | ----------------------------------------------------------------------- | ------ | -------- |
| X1  | Is all new debt registered in `technical-debt.md` with owner/milestone? |        |          |
| X2  | Was any prior blocker debt resolved or explicitly re-scoped?            |        |          |
| X3  | Are “temporary” shortcuts time-bounded or rejected?                     |        |          |
| X4  | Does residual debt still allow epic exit criteria to be honest?         |        |          |

**Notes:**

---

## Summary

| Category       | Result (Pass / Fail / Residual TD) |
| -------------- | ---------------------------------- |
| Architecture   |                                    |
| Dependencies   |                                    |
| Replay         |                                    |
| Determinism    |                                    |
| Recovery       |                                    |
| Canonical Flow |                                    |
| Outbox / Inbox |                                    |
| Coupling       |                                    |
| Technical Debt |                                    |

### Blockers

-

### Accepted residual TD

-

### Follow-ups for next epic

-
