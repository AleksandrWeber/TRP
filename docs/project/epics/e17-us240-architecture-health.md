# Architecture Health — E17 US240 Startup Recovery Discovery

**Release:** RC-17  
**Epic:** E17 — Runtime Recovery  
**Story:** US240 — Startup Recovery Discovery  
**Date:** 2026-07-30  
**Reviewer:** Auto (implementation slice)  
**Verdict:** PASS WITH RESIDUAL TD

Related:

- [RC-17 Development Process — Stage 5](../rc-17-development-process.md)
- [E17 Runtime Recovery Specification](./e17-runtime-recovery-specification.md)
- [ADR-014 Runtime Lifecycle](../../adr/ADR-014-runtime-lifecycle.md)

---

## Scope of this review

This Architecture Health covers the **US240 Stage 3 discovery slice only**:

- Session lookup
- Eligibility evaluation
- Deterministic single-candidate selection
- Structured startup logging
- Unit tests

**Not in this slice:** force/`confirm` `RECOVERING`, RecoveryState persistence,
lease acquisition, checkpoint load, reconcile, Runtime resume.

---

## 1. Architecture

| #   | Question                                                                       | Y/N/NA | Evidence                                                                                                       |
| --- | ------------------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| A1  | Does the epic still honor ADR-012…ADR-018 without silent supersession?         | Yes    | Discovery only; no Order/Risk/Execution/Accounting changes                                                     |
| A2  | Are module ownership statements in ADR-017 still accurate for touched modules? | Yes    | Discovery lives in `trading-session/`; Session owns lifecycle lookup                                           |
| A3  | Is there still exactly one paper execution path (no parallel tick/adapter)?    | Yes    | No execution path added; Canonical Order Path untouched                                                        |
| A4  | Do new components have a clear owner, inputs, outputs, and prohibitions?       | Yes    | `StartupRecoveryDiscoveryService` — inputs: persisted Sessions; output: 0\|1 candidate; forbids mutate/execute |
| A5  | Would removing this epic’s code leave the freeze coherent (no half-fork)?      | Yes    | Additive discovery; no alternate recovery stack                                                                |

**Notes:** No Recovery Coordinator / Recovery BC introduced (E17 §5.1).

---

## 2. Dependencies

| #   | Question                                                                                          | Y/N/NA | Evidence                       |
| --- | ------------------------------------------------------------------------------------------------- | ------ | ------------------------------ |
| D1  | Is dependency direction still acyclic for touched modules?                                        | Yes    | Session → Prisma + Logger only |
| D2  | Does Strategy Runtime still avoid Orders/Risk/Execution/Accounting imports beyond approved ports? | Yes    | Runtime not modified           |
| D3  | Does Dashboard/UI depend only on public APIs/read models?                                         | N/A    | No UI changes                  |
| D4  | Are provider payloads/credentials confined to adapters?                                           | N/A    | No market adapters touched     |
| D5  | Were any `forwardRef` / cycle workarounds introduced? If yes, is TD filed?                        | No     | None                           |

**Notes:** Boundary test forbids RecoveryCoordinator/Orchestrator symbols in module composition.

---

## 3. Replay

| #   | Question                                                                                | Y/N/NA | Evidence                       |
| --- | --------------------------------------------------------------------------------------- | ------ | ------------------------------ |
| R1  | Can recorded semantic streams be replayed for the epic’s path?                          | N/A    | Discovery does not admit ticks |
| R2  | Does replay rebuild projections without re-applying live financial effects incorrectly? | N/A    | No accounting                  |
| R3  | Are replay fixtures versioned and cited from tests?                                     | N/A    |                                |
| R4  | Is operational metadata excluded from semantic replay identity?                         | N/A    |                                |

**Notes:** Discovery logging uses operational Session IDs/status only.

---

## 4. Determinism

| #   | Question                                                                | Y/N/NA | Evidence                                                  |
| --- | ----------------------------------------------------------------------- | ------ | --------------------------------------------------------- |
| T1  | Do business calculations avoid wall-clock authority (ADR-018 #49)?      | Yes    | Selection uses durable `createdAt` + `id` + `workspaceId` |
| T2  | Same ordered semantic stream + config ⇒ same Orders/Fills/…?            | N/A    | No business effects                                       |
| T3  | Are decimal/rounding policies explicit and unchanged unless ADR allows? | N/A    |                                                           |
| T4  | Are IDs/hashes stable across restart for identical semantic inputs?     | Yes    | Candidate identity = durable Session id                   |

**Notes:** Multi-eligible selection is order-independent (unit tested).

---

## 5. Recovery

| #   | Question                                                                 | Y/N/NA | Evidence                                                                                         |
| --- | ------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------ |
| C1  | Do non-terminal Sessions enter `RECOVERING` on startup where applicable? | No     | **Residual:** discovery selects candidate only; force `RECOVERING` deferred (E17 US240 AC #2/#6) |
| C2  | Is reconciliation required before resume of execution?                   | N/A    | Resume not in US240                                                                              |
| C3  | Can a stale lease holder still not commit work?                          | N/A    | Lease = US241                                                                                    |
| C4  | Do crash tests show no duplicate Signal Intents/Orders/Fills?            | N/A    | No execution                                                                                     |
| C5  | Does graceful shutdown leave durable recoverable state?                  | N/A    | US246                                                                                            |

**Notes:** Eligible set matches E17: `STARTING`/`RUNNING`/`PAUSED`/`RECOVERING`/`STOPPING`. Terminals ignored. Exactly one candidate or none.

---

## 6. Canonical Flow

| #   | Question                                                                                                                  | Y/N/NA | Evidence                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------- |
| F1  | Is the path still MD → Session/Runtime → SignalIntent → Orders → Risk → Execution → Fill → Position → Ledger → Portfolio? | Yes    | Untouched                                   |
| F2  | Does CanonicalOrderPath remain orchestration-only (no new semantics)?                                                     | Yes    | Not imported/modified                       |
| F3  | Are strategy-origin and manual-origin Orders still sharing the same engines?                                              | Yes    | Untouched                                   |
| F4  | Is any bypass (Runtime→Adapter, UI→Ledger write, etc.) impossible by test?                                                | Yes    | Existing Session boundary specs still green |

**Notes:**

---

## 7. Outbox / Inbox

| #   | Question                                                                 | Y/N/NA | Evidence                                        |
| --- | ------------------------------------------------------------------------ | ------ | ----------------------------------------------- |
| O1  | Are durable state changes published via transactional Outbox?            | N/A    | Discovery does not mutate Session / emit Outbox |
| O2  | Does every durable consumer use Inbox idempotency?                       | N/A    |                                                 |
| O3  | Does consumer progress survive restart (checkpoints / per-consumer ack)? | N/A    |                                                 |
| O4  | Are failed deliveries never silently acknowledged?                       | N/A    |                                                 |
| O5  | Is at-least-once assumed (no false exactly-once claims)?                 | Yes    | No new delivery claims                          |

**Notes:** Outbox recovering transition remains for the force-`RECOVERING` follow-up.

---

## 8. Coupling

| #   | Question                                                                                           | Y/N/NA | Evidence                 |
| --- | -------------------------------------------------------------------------------------------------- | ------ | ------------------------ |
| K1  | Are bounded contexts still separate (no merged God-module)?                                        | Yes    | Discovery inside Session |
| K2  | Can Orders, Risk, Execution, Accounting evolve without Runtime source edits for unrelated changes? | Yes    | Runtime unchanged        |
| K3  | Are shared kernels limited to stable contracts (IDs, decimals, ports)?                             | Yes    | Candidate DTO only       |
| K4  | Is research Signal Engine / Evaluation Scheduler still isolated from Runtime?                      | Yes    | Untouched                |

**Notes:**

---

## 9. Technical Debt

| #   | Question                                                                | Y/N/NA | Evidence                                                                     |
| --- | ----------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| X1  | Is all new debt registered in `technical-debt.md` with owner/milestone? | Yes    | TD-036 partial progress + residual force-`RECOVERING` noted                  |
| X2  | Was any prior blocker debt resolved or explicitly re-scoped?            | Yes    | TD-036 remains Planned; US240 discovery slice landed                         |
| X3  | Are “temporary” shortcuts time-bounded or rejected?                     | Yes    | Single-candidate selection documented; multi-session recover-all remains E17 |
| X4  | Does residual debt still allow epic exit criteria to be honest?         | Yes    | Epic exit still requires full S1 force-`RECOVERING` before E17 close         |

**Notes:**

---

## Summary

| Category       | Result (Pass / Fail / Residual TD)           |
| -------------- | -------------------------------------------- |
| Architecture   | Pass                                         |
| Dependencies   | Pass                                         |
| Replay         | N/A                                          |
| Determinism    | Pass                                         |
| Recovery       | Residual TD (C1 force `RECOVERING` deferred) |
| Canonical Flow | Pass                                         |
| Outbox / Inbox | N/A                                          |
| Coupling       | Pass                                         |
| Technical Debt | Residual TD (TD-036)                         |

### Blockers

- None for this discovery slice.

### Accepted residual TD

- **TD-036** — remaining E17 algorithm (force `RECOVERING`, lease, reconcile, resume). US240 discovery is step S1 lookup/selection only.
- Full E17 US240 AC #2/#6 (transition + RecoveryState open) deferred to the next E17 implementation story after discovery.

### Follow-ups for next epic

- US241 — fenced lease (uses discovery candidate).
- Complete S1: confirm `RECOVERING` + RecoveryState phase open (E17 US240 remaining ACs / US249 persistence).
