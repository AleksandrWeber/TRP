# RC-18 Residual Register

**Release:** RC-18 — Production Recovery & Operational Readiness  
**Date:** 2026-08-01  
**Status:** Living (authoritative mid-release ownership)  
**Supplements:** [`technical-debt.md`](./technical-debt.md) TD-036 residual ownership

Every open residual has an explicit owner. Closed residuals retain rows for
audit. This register does not invent new debt classes.

Related:

- [Mid-Release Health Review](./rc-18-mid-release-health-review.md)
- [Tech Lead Decision Log](./rc-18-tech-lead-decision-log.md)
- [RC-18 TD036 Epic Planning](./rc-18-td036-epic-planning.md)
- [RIV-001](./rc-18-riv-001-recovery-integration-validation.md)
- [SIG-001](./rc-18-sig-001-safety-integration-validation.md)

---

## Mandatory TD-036 residuals (production recovery claim)

| ID  | Residual                                                               | Class           | Owner                                               | Status                     | Evidence                                                                          |
| --- | ---------------------------------------------------------------------- | --------------- | --------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| R1  | Force/confirm Session `RECOVERING` on discovery                        | RC-18 mandatory | E17 / Runtime Recovery                              | **Closed** (US290)         | Story Spec + discovery wiring; RIV-001                                            |
| R2  | Real `RECOVERY_RECONCILIATION_PORTS` adapters (retire production stub) | RC-18 mandatory | E17 / Runtime Recovery                              | **Closed** (US291)         | Composition-root adapters; RIV-001                                                |
| R3  | Durable RecoveryState persistence + phase machine                      | RC-18 mandatory | E17 / Runtime Recovery                              | **Closed** (US292)         | `SessionRecoveryState` + phase progress; RIV-001                                  |
| R4  | Durable Incident on ambiguity / corruption                             | RC-18 mandatory | E17 / Runtime Recovery (+ E19 Incident model later) | **Closed** (US293 minimal) | Fail-closed Incident; SIG-001                                                     |
| R5  | Chaos/restart + fail-safe evidence suites                              | RC-18 mandatory | RC-18 Release lead + Runtime Recovery               | **Closed** (US294)         | [Evidence Package](./rc-18-us294-chaos-restart-evidence.md); suite M-01…M-12 PASS |
| R6  | ADL-008 ACCEPTED or explicit accepted deferral                         | RC-18 mandatory | Architecture owner                                  | **Open** (US295)           | ADL-008 remains DEFERRED; consumes US294 Evidence Package                         |

---

## E19 operational residuals

| Residual                                                             | Class           | Owner                 | Status   | Target       |
| -------------------------------------------------------------------- | --------------- | --------------------- | -------- | ------------ |
| Durable Kill Switch policy for admission/arming                      | E19 operational | E19 Operations owner  | **Open** | E19 / RC-18+ |
| Operator recovery status / phase API                                 | E19 operational | E19 Operations owner  | **Open** | E19 / RC-18+ |
| Richer Safety Incident productization (resolve/ack/dashboard/alerts) | E19 operational | E19 Operations owner  | **Open** | E19 / RC-18+ |
| Auth hardening leftovers (TD-005 / TD-006)                           | E19 operational | Platform / Auth owner | **Open** | E19 / RC-18+ |
| Reconcile `readRisk` real view (currently null)                      | E19 operational | E19 / Risk owner      | **Open** | E19 / RC-18+ |

US293 Incident model is **provisional** pending E19 supersession without
weakening fail-closed semantics (ADL-013 intent).

---

## Future backlog (explicit, not RC-18 mandatory)

| Residual                                                                     | Owner                         | Notes                                                   |
| ---------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------- |
| Order proposal from recovery SignalIntent                                    | Orders / Canonical path owner | Future epic                                             |
| In-process stage cache durability (`lastResult` / Sets) beyond RecoveryState | Runtime Recovery              | After RecoveryState; RIV noted non-authoritative caches |
| Local vs original story-title dual scoping notes                             | Documentation / Release lead  | Docs only                                               |
| E18 Event Processing epic delivery                                           | E18 owner                     | RC-18+                                                  |
| E20 Market Data / E21 Multi-Strategy epics                                   | E20 / E21 owners              | RC-18+                                                  |

---

## Integration residuals from RIV-001 / SIG-001

| Item                                                                              | Source               | Owner                            | Status                                       |
| --------------------------------------------------------------------------------- | -------------------- | -------------------------------- | -------------------------------------------- |
| Mid-phase restart fencing restore / cold-start chaos suites                       | RIV-001              | US294                            | **Closed** (Evidence Package M-03/M-08/M-12) |
| Dedicated process-crash fail-closed chaos harness                                 | SIG-001              | US294                            | **Closed** (Evidence Package M-05/M-11/M-12) |
| Unused Incident `reasonClass` first-class call-sites (`stopping_ambiguity`, etc.) | SIG-001              | Runtime Recovery (opportunistic) | Open (non-blocker)                           |
| ADL-013 formal registration + ADL-008 promotion                                   | SIG-001 / governance | US295                            | Open                                         |

---

## Undocumented residual scan (2026-08-01)

| Finding                                                | Disposition                                             |
| ------------------------------------------------------ | ------------------------------------------------------- |
| Chat-only RIV-001 / SIG-001 reports                    | **Documented** this mid-release                         |
| Accidental duplicate docs (`* 2.md`, `* копія.md`)     | Hygiene noise — **not** product residual; do not commit |
| No additional hidden mandatory recovery residual found | —                                                       |

---

## Sequencing reminder

```text
US290 → US291 → US292 → US293 → US294   ← Done (evidence package attached)
US295                                   ← Remaining for production claim (ADL-008)
E18 → E19 → E20 → E21                   ← Product epics after residuals (or accepted partial)
```

Do **not** claim production restart-safety PASS until R6 (US295) closes. R5 evidence is attached.
