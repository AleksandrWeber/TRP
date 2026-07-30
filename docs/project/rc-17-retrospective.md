# RC-17 Retrospective — Runtime Recovery Baseline

**Release:** RC-17  
**Theme:** Production Readiness & Operational Runtime — Runtime Recovery baseline  
**Date:** 2026-07-30  
**Status:** BASELINED  
**Verdict:** Architecture baseline accepted; production readiness subject to RC-18

Related:

- [Release History](./release-history.md)
- [RC-17 Roadmap](./rc-17-roadmap.md)
- [RC-17 Release Planning](./rc-17-release-planning.md)
- [E17 Spec](./epics/e17-runtime-recovery-specification.md)
- [Stage 4 Technical Review](./e17-stage-4-technical-review.md)
- [Technical Debt](./technical-debt.md)
- [Architecture Decision Log](../Architecture/ADR/ADL.md)

---

## 1. Objectives

### Release objective (accepted scope for this baseline)

Deliver a coherent **Runtime Recovery reference implementation** under ADR-014
so Trading Session can orchestrate restart-safe recovery without redesigning
Orders, Risk, Execution, Accounting, or the Canonical Order Path.

### Outcome

**ACHIEVED (architecture / Stage 3 reference)** — E17 US240–US249 (+ US244A)
landed as a deterministic Session-owned pipeline with Stage 4
PASS WITH RECOMMENDATIONS.

**PARTIAL (full production ADR-014 claim)** — force-`RECOVERING`, real reconcile
adapters, durable RecoveryState/Incident, and chaos evidence remain RC-18
mandatory residuals under TD-036.

---

## 2. Stories implemented

| ID     | Title (Stage 3 local scope)                               | Status                                 |
| ------ | --------------------------------------------------------- | -------------------------------------- |
| US240  | Startup recovery discovery                                | Done (force-`RECOVERING` residual)     |
| US241  | Recovery lease acquisition (CAS)                          | Done                                   |
| US242  | Checkpoint validation                                     | Done                                   |
| US243  | Read-only state reconciliation                            | Done (stub ports residual)             |
| US244  | Deterministic Runtime READY hydration                     | Done                                   |
| US244A | Pipeline orchestration contract / bootstrap safety        | Done (corrective)                      |
| US245  | Deterministic event admission (`EVENT_ADMISSION_ENABLED`) | Done                                   |
| US246  | Deterministic Runtime arming (`ARMED`)                    | Done                                   |
| US247  | First deterministic strategy evaluation (decision only)   | Done                                   |
| US248  | Deterministic SignalIntent generation                     | Done                                   |
| US249  | Recovery completion & Session exit                        | Done (RecoveryState/Incident residual) |

**Count:** 10 allocated IDs + 1 corrective story (US244A) = **11 implemented slices**.

Original epic story titles for US247–US249 (fail-safe suite / chaos evidence /
RecoveryState persistence) remain tracked as residuals — local Stage 3 scoping
documented in epic implementation notes.

---

## 3. Architectural evolution

```text
RC-16 (baseline)
  Deployment → Session → Runtime → SignalIntent → CanonicalOrderPath
  → Risk → Execution → Fill → Accounting
  + lifecycle hooks / checkpoints (not full restart algorithm)

RC-17 (this baseline)
  + Session-owned recovery pipeline:
    discover → lease → checkpoint → reconcile → READY
    → EVENT_ADMISSION_ENABLED → ARMED
    → evaluate-only → SignalIntent → Session exit / lease release
```

### Confirmed shape

- Trading Session remains the recovery orchestrator (no RecoveryCoordinator BC).
- Strategy Runtime remains isolated behind `StrategyRuntimePort`.
- Pure `decide*` gates per stage; explicit blocked outcomes.
- SignalIntent is the only downstream recovery artifact.
- Canonical Order Path ownership unchanged.

### Runtime lifecycle (recovery path)

```text
IDLE
  → EVENT_ADMISSION_ENABLED   (US245)
  → ARMED                     (US246)
```

Recovery `READY` (US244) is Session/orchestration readiness — not worker arming.

---

## 4. Major decisions

| Decision                                       | Result                         | Artifact                                   |
| ---------------------------------------------- | ------------------------------ | ------------------------------------------ |
| Session-owned staged recovery (no new BC)      | Confirmed                      | E17 Spec §5 / ADL-008 expected direction   |
| Pure domain gates + application services       | Confirmed                      | US240–US249 pattern                        |
| US244A bootstrap independence                  | Confirmed                      | Spec §4.4.1 + pipeline orchestration tests |
| Local Stage 3 story scoping vs original titles | Accepted with residual notes   | Epic implementation notes                  |
| ADL-008 full algorithm ownership               | Remains DEFERRED               | ADL.md — pending RC-18 residuals           |
| E18–E21 product epics                          | Forwarded beyond this baseline | Roadmap / release history                  |

---

## 5. Technical challenges

1. **Bootstrap ordering** — Nest `OnApplicationBootstrap` alone was insufficient;
   US244A required public stage contracts and resolve-or-invoke chaining.
2. **Evaluate vs emit separation** — US247 must not call `runtime.evaluate`
   (Intent+Checkpoint commit); pure `decideRuntimeEvaluation` only.
3. **Terminal completion after duplicate Intent protection** — US249 must treat
   already-converted SignalIntent as terminal evidence.
4. **Force-`RECOVERING` gap** — discovery selects candidates without status force;
   completion requires `RECOVERING` (documented residual).
5. **Stub reconcile risk** — empty foreign views can false-green `RECONCILED`.

---

## 6. Lessons learned

### What went well

- One-responsibility-per-story kept ADR-014 / Canonical Order Path intact.
- Architecture Health slices per story made Stage 4 review evidence-rich.
- Boundary tests (`RecoveryCoordinator` / Orders module bans) caught ownership drift early.
- Corrective story US244A fixed a real orchestration hazard before later stages piled on.

### What went poorly / friction

- Dual story-title semantics (roadmap vs Stage 3 local scope) require careful reading.
- In-process `lastResult` / Sets are convenient but not crash-durable.
- Production “safe restart” messaging must wait for RC-18 residuals.

### Surprises

- Completion after a duplicate SignalIntent generate call overwrote terminal
  evidence until the gate recognized already-converted outcomes.

---

## 7. Improvements over RC-16

| Area                       | RC-16                            | RC-17 baseline                                |
| -------------------------- | -------------------------------- | --------------------------------------------- |
| Restart recovery           | Hooks / drain / checkpoints only | Full Stage 3 recovery pipeline reference      |
| Session orchestration      | Lifecycle + Runtime notify       | Staged recovery services with pure gates      |
| Runtime after restart      | In-memory worker lost            | Deterministic READY → admission → ARMED path  |
| First post-recovery Intent | Via live evaluate commit path    | Evaluate-only then explicit SignalIntent emit |
| Pipeline bootstrap safety  | Not specified                    | US244A contract + tests                       |
| Process                    | Planning ad hoc across M3        | Stages 0–4 executed for E17 with templates    |

---

## 8. Recommendations for RC-18

### Mandatory (production recovery claim)

1. Force/confirm Session `RECOVERING` on discovery (US240 residual).
2. Wire real `RECOVERY_RECONCILIATION_PORTS` adapters (no stub in production).
3. Persist RecoveryState + durable Incident on ambiguity; promote or explicitly
   defer ADL-008 with accepted rationale.
4. Prove crash/restart / fail-safe suites (original US247/US248 evidence ACs).

### Operational / E19

5. Durable Kill Switch policy integration for admission/arming.
6. Operator-readable recovery status/phase API.
7. Auth hardening / authorization migration leftovers (TD-005 / TD-006).

### Process / backlog

8. Keep E18 Event Processing, E20 Market Data, E21 Multi-Strategy as explicit
   RC-18+ epic work (not silently assumed closed by this baseline).
9. Prefer one story-title authority per ID; avoid dual local/original titles
   without an implementation note in the same change set.
10. After RC-18 mandatory items: baseline production recovery and update ADL-008.

---

## 9. Engineering metrics (summary)

| Metric                       | Value                                                            |
| ---------------------------- | ---------------------------------------------------------------- |
| Stories / slices completed   | 11 (US240–US249 + US244A)                                        |
| Architecture Reviews         | E17 Stage 2 PROCEED; per-story Architecture Health notes         |
| Technical Reviews            | E17 Stage 4 PASS WITH RECOMMENDATIONS                            |
| Corrective stories           | US244A                                                           |
| Trading Session module tests | 296 passed (2026-07-30)                                          |
| Recovery-related spec files  | 22                                                               |
| Boundary checks              | `trading-session.boundaries.spec.ts` (Orders + coordinator bans) |
| ADRs primarily exercised     | ADR-014, ADR-017, ADR-018 #19–25                                 |
| ADL entries                  | ADL-008 remains DEFERRED                                         |

---

## 10. Release readiness statement

**RC-17 is:**

- architecturally complete for the Runtime Recovery Stage 3 reference pipeline
- **BASELINED** as the Runtime Recovery reference implementation
- the accepted engineering baseline for RC-18 recovery/ops follow-through

**Production readiness** (operators may treat API restart as fully safe for
continuous paper sessions) **remains subject to RC-18 mandatory TD-036 items**.

---

## Sign-off

| Role                   | Name       | Date       |
| ---------------------- | ---------- | ---------- |
| Release closure (docs) | Auto       | 2026-07-30 |
| Epic owner             | _(assign)_ |            |
| Architecture owner     | _(assign)_ |            |
