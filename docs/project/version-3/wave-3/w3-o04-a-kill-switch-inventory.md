# W3-O04-a Kill Switch Inventory & Honest Control Baseline

**Slice:** W3-O04-a — Kill Switch Inventory & Honest Control Baseline  
**Package:** W3-O04 Durable Kill Switch Product (V3-O04 · LT-03 · TD-047)  
**Wave:** 3 — Durability, Operations & Continuity  
**Date:** 2026-08-27  
**Nature:** Discovery and classification only. Not persistence. Not restart recovery. Not operational continuity.  
**Machine inventory:** `apps/api/src/platform-conformance/w3-o04-a-kill-switch-inventory.ts`

```text
This inventory does NOT implement persistence.
This inventory does NOT implement restart recovery.
This inventory does NOT implement operational continuity.
This inventory does NOT declare Kill Switch Complete.
This inventory does NOT declare W3-O04 CLOSED.
This inventory does NOT declare Wave 3 COMPLETE.
Customer-visible Kill Switch product remains FALSE until later slices + Product Owner Close.
```

---

## Purpose

Enumerate every Kill Switch artifact, owner, operational state, command surface, dependency, and honesty boundary. Classify each artifact as **SURVIVE** or **EPHEMERAL** with explicit justification. Freeze the canonical planning baseline for W3-O04-b…e.

| Class         | Meaning                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| **SURVIVE**   | Persists across API restart today, or is the durable substrate target on existing Session / CC ownership.     |
| **EPHEMERAL** | Transient, stub, UI-only, process-local, or missing — must not be treated as durable paper Kill Switch truth. |

---

## Binding finding

**Kill Switch product is NOT Complete. Paper durable halt is NOT implemented.**

- Live `trading_frozen` **SURVIVE** on `live_trading_sessions` ≠ paper Kill Switch Complete.
- Admission hooks (`kill_switch_active`) exist but `InactiveRecoveryEventAdmissionPolicy` stub always returns inactive.
- Command Center emergency controls are **unavailable** — honest non-delivery, not fake arm/clear.
- Pause / resume / stop ≠ Kill Switch Complete.
- W3-O01 / W3-O02 / W3-O03 CLOSED predecessors alone do not Close Kill Switch.

---

## Inventory

### A. Commands

| Artifact ID                     | Surface                          | Owner               | Durability | Exists | Paper |
| ------------------------------- | -------------------------------- | ------------------- | ---------- | ------ | ----- |
| `cmd-activate-kill-switch-live` | POST /v1/live/kill-switch        | live-trading-engine | SURVIVE    | Yes    | No    |
| `cmd-clear-kill-switch-live`    | POST /v1/live/kill-switch/clear  | live-trading-engine | SURVIVE    | Yes    | No    |
| `cmd-emergency-stop-paper`      | Command Center emergency-stop    | command-center      | EPHEMERAL  | Yes    | Yes   |
| `cmd-clear-kill-switch-paper`   | Command Center clear-kill-switch | command-center      | EPHEMERAL  | Yes    | Yes   |

### B. State

| Artifact ID                                | Surface                                           | Owner               | Durability | Exists | Paper |
| ------------------------------------------ | ------------------------------------------------- | ------------------- | ---------- | ------ | ----- |
| `state-live-trading-frozen`                | LiveSession.tradingFrozen                         | live-trading-engine | SURVIVE    | Yes    | No    |
| `state-paper-kill-switch-armed`            | Paper session armed state (Session / CC owner)    | trading-session     | EPHEMERAL  | **No** | Yes   |
| `state-kill-switch-result-dto`             | KillSwitchResult response DTO                     | live-trading-engine | EPHEMERAL  | Yes    | No    |
| `state-inactive-recovery-policy`           | InactiveRecoveryEventAdmissionPolicy stub         | trading-session     | EPHEMERAL  | Yes    | Yes   |
| `state-recovery-risk-snapshot-kill-switch` | RecoveryRiskSnapshot.killSwitchActive (read-only) | risk-engine         | EPHEMERAL  | Yes    | Yes   |

### C. Projections

| Artifact ID                              | Surface                                      | Owner               | Durability |
| ---------------------------------------- | -------------------------------------------- | ------------------- | ---------- |
| `proj-live-session-view-trading-frozen`  | LiveSessionView.tradingFrozen                | live-trading-engine | SURVIVE    |
| `proj-live-health-kill-switch-alert`     | LiveHealthReport kill_switch_active alert    | live-trading-engine | EPHEMERAL  |
| `proj-live-sync-log-kill-switch`         | SynchronizationLog KILL_SWITCH               | live-trading-engine | SURVIVE    |
| `proj-live-events-kill-switch`           | KillSwitch* / TradingFrozen events           | live-trading-engine | SURVIVE    |
| `proj-command-center-no-kill-switch`     | CommandCenterSessionView excludes killSwitch | bot-facade          | EPHEMERAL  |
| `proj-operator-dashboard-no-kill-switch` | OperatorDashboardView excludes killSwitch    | bot-facade          | EPHEMERAL  |

### D. Runtime

| Artifact ID                                 | Surface                                         | Owner               | Durability |
| ------------------------------------------- | ----------------------------------------------- | ------------------- | ---------- |
| `runtime-emergency-manager`                 | EmergencyManager US210 orchestration            | live-trading-engine | SURVIVE    |
| `runtime-live-execution-coordinator-freeze` | LiveExecutionCoordinator tradingFrozen gate     | live-trading-engine | SURVIVE    |
| `runtime-recovery-event-admission`          | decideRecoveryEventAdmission kill_switch_active | trading-session     | EPHEMERAL  |
| `runtime-recovery-runtime-arming`           | decideRecoveryRuntimeArming kill_switch_active  | trading-session     | EPHEMERAL  |
| `runtime-recovery-admission-service`        | RecoveryEventAdmissionService + policy port     | trading-session     | EPHEMERAL  |
| `runtime-recovery-arming-service`           | RecoveryRuntimeArmingService + policy port      | trading-session     | EPHEMERAL  |

### E. Operational

| Artifact ID                         | Surface                          | Owner                | Durability |
| ----------------------------------- | -------------------------------- | -------------------- | ---------- |
| `op-td047-debt-register`            | TD-047 Durable paper Kill Switch | release-governance   | EPHEMERAL  |
| `op-lt03-capability-inventory`      | LT-03 capability inventory entry | release-governance   | EPHEMERAL  |
| `op-adr-018-kill-switch-invariants` | ADR-018 invariants 44–47         | release-governance   | SURVIVE    |
| `op-us210-architecture-doc`         | Architecture 048 US210 sequence  | wave-3-documentation | SURVIVE    |

### F. Operator-visible

| Artifact ID                        | Surface                                   | Owner                 | Durability |
| ---------------------------------- | ----------------------------------------- | --------------------- | ---------- |
| `ui-live-trading-page`             | LiveTradingPage (not routed in paper app) | command-center        | EPHEMERAL  |
| `ui-emergency-controls-panel`      | EmergencyControlsPanel                    | command-center        | EPHEMERAL  |
| `ui-web-api-kill-switch-client`    | Web activateKillSwitch / clearKillSwitch  | command-center        | EPHEMERAL  |
| `notif-kill-switch-activated-type` | Notification types (ingest-ready)         | notification-delivery | EPHEMERAL  |

### G. Persistence candidates

| Artifact ID                          | Surface                                 | Owner               | Durability | Exists |
| ------------------------------------ | --------------------------------------- | ------------------- | ---------- | ------ |
| `persist-paper-session-kill-switch`  | Paper armed state on Session / CC owner | trading-session     | SURVIVE    | **No** |
| `persist-live-trading-frozen-column` | live_trading_sessions.trading_frozen    | live-trading-engine | SURVIVE    | Yes    |

### H. Ephemeral artifacts

| Artifact ID                        | Surface                                    | Owner           | Durability |
| ---------------------------------- | ------------------------------------------ | --------------- | ---------- |
| `eph-recovery-admitted-armed-sets` | In-memory admittedSessions / armedSessions | trading-session | EPHEMERAL  |
| `eph-emergency-ui-dialog-state`    | Emergency dialog / typed-phrase UI state   | command-center  | EPHEMERAL  |

### I. Dependencies

| Artifact ID                                       | Direction  | Surface                                  |
| ------------------------------------------------- | ---------- | ---------------------------------------- |
| `dep-consumes-authentication`                     | consumes   | Authentication — fail closed             |
| `dep-consumes-authorization`                      | consumes   | Authorization — LiveCommand C7           |
| `dep-consumes-workspace-isolation`                | consumes   | Workspace Isolation                      |
| `dep-consumes-order-engine`                       | consumes   | Order Engine cancel on activate          |
| `dep-consumes-position-engine`                    | consumes   | Position Engine close on activate        |
| `dep-produces-trading-frozen-state`               | produces   | tradingFrozen armed state                |
| `dep-produces-kill-switch-events`                 | produces   | KillSwitch* events                       |
| `dep-produces-admission-block-reason`             | produces   | kill_switch_active block reason          |
| `dep-depends-on-session-command-center-ownership` | depends-on | Session / CC / Trading Session substrate |
| `dep-blocked-by-td047-paper-hidden`               | blocked-by | TD-047 paper product hidden              |
| `dep-blocked-by-inactive-policy`                  | blocked-by | InactiveRecoveryEventAdmissionPolicy     |
| `dep-blocked-by-emergency-controls-unavailable`   | blocked-by | Emergency controls unavailable           |

### J. Ownership verification

| Artifact ID                       | Owner               | Role                                     | Change   |
| --------------------------------- | ------------------- | ---------------------------------------- | -------- |
| `own-trading-session-substrate`   | trading-session     | Paper halt / admission / session stop    | **None** |
| `own-command-center-facade`       | command-center      | Product facade arm/clear visibility      | **None** |
| `own-live-trading-engine-runtime` | live-trading-engine | US210 live runtime (Wave 6 reuses later) | **None** |
| `own-bot-facade-views`            | bot-facade          | Projections — no killSwitch field today  | **None** |

### K. Honesty boundaries (binding)

| Artifact ID                                       | Boundary                                     |
| ------------------------------------------------- | -------------------------------------------- |
| `honesty-kill-switch-not-live-trading`            | Kill Switch ≠ Live Trading enabled           |
| `honesty-kill-switch-not-monitoring`              | Kill Switch ≠ Monitoring Complete (O05)      |
| `honesty-kill-switch-not-risk-engine`             | Kill Switch ≠ Risk Engine redesign           |
| `honesty-kill-switch-not-bc-ha-dr`                | Kill Switch ≠ BC / HA / DR                   |
| `honesty-pause-stop-not-kill-switch`              | Pause / resume / stop ≠ Kill Switch Complete |
| `honesty-kill-switch-not-wave3-complete`          | Kill Switch ≠ Wave 3 COMPLETE                |
| `honesty-kill-switch-not-session-termination`     | Kill Switch ≠ Session Termination product    |
| `honesty-kill-switch-not-infrastructure-shutdown` | Kill Switch ≠ Infrastructure Shutdown        |

### L. Explicit OUT

| Artifact ID                          | Surface                          | Why OUT                           |
| ------------------------------------ | -------------------------------- | --------------------------------- |
| `out-w3-o05-monitoring`              | W3-O05 Monitoring product        | Separate package                  |
| `out-live-trading-wave6`             | Live Trading / Wave 6            | Reuses control later              |
| `out-bc-ha-dr-products`              | BC / HA / DR products            | Not Kill Switch                   |
| `out-second-kill-switch-engine`      | Second engine / controller / SoT | Architecture forbidden            |
| `adjacent-w3-o01-analytical-stores`  | W3-O01 CLOSED predecessor        | Store SURVIVE ≠ Kill Switch Close |
| `adjacent-w3-o02-notification-queue` | W3-O02 CLOSED predecessor        | Queue SURVIVE ≠ Kill Switch Close |
| `adjacent-w3-o03-recovery-stance`    | W3-O03 CLOSED predecessor        | Claim stance ≠ Kill Switch Close  |

---

## Classification summary

| Class                                 | Meaning                                                    | Count (this freeze)                                  |
| ------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| **SURVIVE**                           | Durable today or target on existing owner                  | See machine inventory `durabilityClass: 'SURVIVE'`   |
| **EPHEMERAL**                         | Transient, stub, UI-only, missing, or process-local        | See machine inventory `durabilityClass: 'EPHEMERAL'` |
| Kill Switch Complete authorized today | **None** — every row `authorizesKillSwitchComplete: false` | 0                                                    |

---

## Domain distinction (binding)

```text
Live trading_frozen SURVIVE (live_trading_sessions)
  └── survives API restart for LIVE sessions only
  └── ≠ paper Kill Switch Complete

Paper Kill Switch armed state
  └── MISSING today (TD-047)
  └── W3-O04-b persistence target on existing Session / CC owner

Runtime admission kill_switch_active hooks
  └── domain gates exist
  └── InactiveRecoveryEventAdmissionPolicy stub → never blocks on paper today

Command Center emergency controls
  └── UI model exists; all actions unavailable (honest)

W3-O01 / W3-O02 / W3-O03 CLOSED
  └── analytical / queue / recovery claim honesty
  └── ≠ Kill Switch product Close

O05 Monitoring / Wave 6 Live / BC / HA / DR
  └── explicitly OUT
```

---

## Gap identification

| Gap                                      | Status after W3-O04-a                |
| ---------------------------------------- | ------------------------------------ |
| Complete Kill Switch artifact inventory  | **Closed** (this document + machine) |
| Ownership / honesty freeze               | **Closed**                           |
| SURVIVE vs EPHEMERAL classification      | **Closed**                           |
| Paper durable persistence                | **Open** → W3-O04-b                  |
| Paper product visibility                 | **Open** → W3-O04-c                  |
| Restart survival & admission block proof | **Open** → W3-O04-d                  |
| Package Close evidence                   | **Open** → W3-O04-e                  |

---

## Mandatory Questions

1. **What customer-visible functionality was delivered?**  
   None. Foundation inventory only.

2. **Which Kill Switch artifacts require SURVIVE classification?**  
   Documented in Sections G and machine inventory — live `trading_frozen`, live events/sync logs, live runtime gates, security dependencies, paper persistence **target** on existing owner. See `rowsSurvive()` in machine catalog.

3. **Which Kill Switch artifacts are EPHEMERAL?**  
   Documented in Sections B, F, H and machine inventory — stubs, UI-only controls, missing paper state, in-memory recovery sets, honesty boundaries. See `rowsEphemeral()` in machine catalog.

4. **Were ownership boundaries verified?**  
   Yes. Session / Command Center / Trading Session / Live Trading Engine owners confirmed; no movement.

5. **Were any new persistence owners introduced?**  
   No.

6. **Were any ownership boundaries changed?**  
   No.

7. **Were any architectural deviations introduced?**  
   No.

8. **Can the platform survive restart after this slice?**  
   No. This slice inventories only; paper Kill Switch does not survive restart.

---

**STOP.** Wait for Product Owner review before W3-O04-b.
