# RC-20 Implementation Plan — Command Center

**Document:** RC-20 Implementation Plan  
**Status:** PLANNING — awaiting review approval (no implementation)  
**Date:** 2026-08-10  
**Nature:** Planning only. No code. No architecture redesign. No roadmap resequence.

**Authority inputs:**

| Input                                                                     | Role                                                                  |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md) | Constitution (§5.16 Command Center; §9 operational model)             |
| [Authority Matrix](./v2-authority-matrix.md)                              | Command Center = Command UI + projection; never finance/lifecycle SoT |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)               | RC-20 = Ops readiness (Command Center foundation)                     |
| [RC-20 Roadmap Reconciliation](./rc-20-roadmap-reconciliation.md)         | Recommendation A — numbering kept                                     |
| [RC-19 Closure Report](./rc-19-closure-report.md)                         | Skeleton complete; Kill Switch / Command Center deferred to RC-20     |
| [UX Vision](./trp-ux-vision.md)                                           | Desktop-first ops monitoring; Dashboard non-authoritative             |

**Companion deliverables:**

- [Epic Breakdown](./rc-20-epic-breakdown.md)
- [Command Center Layout](./rc-20-command-center-layout.md)
- [Command Center UI Contract](./rc-20-command-center-ui-contract.md) — canonical frontend guide

**Related (not this RC):** [RC-22 Strategy Library plan](./rc-22-implementation-plan.md)

---

## 1. Release overview

| Field          | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| RC name        | RC-20                                                       |
| Theme          | Ops readiness — Command Center foundation                   |
| Predecessor    | RC-19 CLOSED                                                |
| Nature         | First operational user interface for monitoring and control |
| Implementation | **Not started** — planning only                             |

### Mission

Introduce **Command Center** as the operations workspace for **visibility and control** on the frozen paper path: status projections, Session/Bot lifecycle commands, and durable Kill Switch — routed only through canonical Session / Risk ports.

RC-20 answers: _Can an operator see system and session health in one place and safely pause, stop, or kill activity without treating the UI as a second trading brain or financial ledger?_

### What Command Center is

- Operational monitoring surface
- Operational control entry (commands → ports)
- System / session / scope status projections
- Emergency controls (Kill Switch)

### What Command Center is not

| Not                                           | Owner / later RC         |
| --------------------------------------------- | ------------------------ |
| Analytics dashboard / deep metrics studio     | Out of RC-20             |
| Reporting (scheduled narratives, PnL stories) | Spec §5.14 / RC-24       |
| AI Analyst / AI panels                        | Spec §5.15 / RC-24       |
| Strategy Library / certification              | Spec §5.2 / **RC-22**    |
| Knowledge Lake                                | RC-23                    |
| Research IDE shell                            | RC-21                    |
| Trading Orchestrator / tactic adaptation UI   | RC-26 (+ RC-22 envelope) |
| New backend domain module or second API SoT   | Forbidden                |

---

## 2. Task 1 — Functional scope

Per Spec §5.16 and §9:

> Command Center is the operations workspace for monitoring and issuing pause/stop/kill/… commands through canonical ports. Dashboard answers “what is happening now?” as attention-oriented projection. Neither is financial SoT.

### 2.1 Responsibilities (RC-20)

| Area                       | In RC-20 Command Center? | Detail                                                                                                    |
| -------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------- |
| **Operational monitoring** | **Yes**                  | Project Session/Bot health, paper activity, scope summary, kill/recovery attention flags                  |
| **Operational control**    | **Yes**                  | Pause / resume / stop via Session ports (Bot Facade alias allowed)                                        |
| **System status**          | **Yes**                  | Global health strip: API liveness, Kill Switch state, recovery/incident attention, paper mode label       |
| **Emergency controls**     | **Yes**                  | Activate / clear Kill Switch through durable Risk/Session safety ports — not UI-only flags                |
| **Read-only information**  | **Yes**                  | Non-authoritative projections; refresh from APIs; no local SoT cache edits                                |
| **Future functionality**   | **No (document only)**   | Tactic-select, multi-operator RBAC productization, IDE embedding, reporting widgets, AI, Library browsers |

### 2.2 Separation detail

#### Operational monitoring

- List and inspect active Trading Sessions (UI: Bots)
- Show Exchange Scope (UI: Cluster) summary for current default Binance scope
- Show which sessions are in Paper Trading mode
- Surface recovery / incident / kill attention indicators (pointers to durable state — not invented UI state)

#### Operational control

- Pause Session
- Resume Session
- Stop Session
- Commands succeed only by calling Session (and Bot Facade → Session) ports

#### System status

- Workspace-level ops summary: counts (active / paused / recovering / stopped), kill armed?, paper vs future-live label
- Does not recompute ledger balances or order truth

#### Emergency controls

- Kill Switch activate (session-scoped and/or documented workspace policy as already owned by Risk/safety — productize existing semantics)
- Kill Switch clear (explicit, permissioned)
- Survives restart via durable ports (ADR-016 lineage); UI never is the sole flag

#### Read-only information

- Status panels, lists, badges, last-updated timestamps
- Links/drill to existing Session detail where needed — without turning Command Center into Reporting

#### Future functionality (explicitly deferred)

| Capability                                     | Target                                                     |
| ---------------------------------------------- | ---------------------------------------------------------- |
| Tactic-select inside envelopes                 | After RC-22 Library/Envelope; Orchestrator selection RC-26 |
| Full Research IDE chrome                       | RC-21                                                      |
| Strategy Library browser / certify             | RC-22                                                      |
| Knowledge Lake / reports / AI                  | RC-23 / RC-24                                              |
| Multi-exchange Cluster switcher productization | RC-27 (identity exists since RC-19)                        |
| Live-capital ops                               | Future ADR                                                 |

---

## 3. Task 2 — Integration mapping

No new modules. Command Center is a **facade + projection UI** over existing owners.

| Integrates with      | Direction                                                          | RC-20 rule                                                                    |
| -------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **Trading Session**  | CC → Session command ports; Session → status projections           | Lifecycle SoT remains Session (ADR-014). CC never stores parallel lifecycle.  |
| **Exchange Scope**   | Read `exchangeScopeId` / default Binance summary                   | Identity from RC-19; no policy editor productization required for RC-20 close |
| **Paper Trading**    | Show paper sessions/accounts as ops projections                    | Same frozen path; paper adapter mode labeled; no second paper engine          |
| **Execution Engine** | Read-only attention (e.g. blocked because kill / no submit claims) | CC must not call adapters or submit/cancel orders                             |
| **Risk Engine**      | Kill Switch / safety via durable Risk/Session ports                | CC must not invent risk decisions or bypass Risk                              |
| **Bot Facade**       | UI labels + facade methods delegate 1:1 to Session                 | Bot remains alias; no `bots` aggregate                                        |

### Forbidden integrations (this RC)

- Strategy Library writes/reads as SoT
- Knowledge Lake queries as product surface
- Reporting jobs
- AI gateway panels
- Direct Execution Engine / adapter commands
- Ledger / Position edits

```text
Operator
  ↓ intents
Command Center (UI + thin BFF/facade if needed)
  ↓ commands / reads only via ports
Trading Session ←→ Bot Facade
Risk / Kill Switch safety ports
  ↓ (unchanged frozen path)
Orders → Risk → Execution → Paper Adapter
```

---

## 4. Task 3 — User interface

Layout specification: [Command Center Layout](./rc-20-command-center-layout.md).

Minimum regions for RC-20:

1. Global system status
2. Exchange overview (Cluster / scope)
3. Bot overview
4. Active sessions
5. Running Paper Trading
6. Emergency controls / Kill Switch

**Excluded from layout:** analytics charts, report builders, AI side panels, Library certification UI, research campaign runners.

---

## 5. Task 4 — User actions

Every RC-20 operator action:

| Action                            | Purpose                                               | Permissions                                                          | Expected result                                                          | Out of scope                                  |
| --------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------- |
| **View global system status**     | See ops health at a glance                            | Authenticated operator (existing auth)                               | Projection: mode, kill state, session counts, attention flags, timestamp | Ledger/PnL analytics                          |
| **Refresh status**                | Re-read projections from APIs                         | Authenticated operator                                               | UI updates from SoT-backed reads                                         | Editing cached “truth” offline                |
| **View Exchange overview**        | See default scope identity/capacity summary           | Authenticated operator                                               | Read-only Cluster/scope card                                             | Multi-exchange admin; policy mutation product |
| **View Bot overview**             | Fleet attention list (Session alias)                  | Authenticated operator                                               | List of Bots/Sessions with state badges                                  | Creating strategies; IDE project tree         |
| **View active sessions**          | Focus on non-terminal sessions                        | Authenticated operator                                               | Filtered projection                                                      | Historical reporting archive                  |
| **View running Paper Trading**    | Confirm paper path activity                           | Authenticated operator                                               | Paper-labeled sessions/accounts summary                                  | Live trading enablement                       |
| **Open session/bot detail (ops)** | Inspect lifecycle + kill/recovery flags               | Authenticated operator                                               | Detail from Session API / facade                                         | Full research evidence drill-down product     |
| **Pause session/bot**             | Halt evaluation safely                                | Operator with session control                                        | Session → paused via port; UI reflects SoT                               | UI-only pause flag                            |
| **Resume session/bot**            | Continue when safe                                    | Operator with session control                                        | Session → running via port if policy allows                              | Bypass kill/recovery fail-closed rules        |
| **Stop session/bot**              | End worker lifecycle                                  | Operator with session control                                        | Session stopped via port                                                 | Delete ledger history                         |
| **Activate Kill Switch**          | Emergency halt of trading activity per durable policy | Elevated operator (document existing auth limits; TD-005/006 caveat) | Durable kill armed; new execution blocked per ADR-016 semantics          | Telegram/AI-activated kill                    |
| **Clear Kill Switch**             | Explicitly disarm after review                        | Elevated operator                                                    | Durable clear via port; audit/event retained                             | Silent auto-clear from UI timer               |
| **View Kill Switch state**        | Know if emergency is armed                            | Authenticated operator                                               | Projection from durable state                                            | Treating badge as SoT without API             |

**Not RC-20 actions:** certify strategy, change strategy version, select tactics, place orders, recompute balances, run reports, ask AI, manage Library, edit Exchange Risk Policy as a product feature, start Orchestrator missions.

---

## 6. Task 6 — Architectural risks

| Risk                                      | Mitigation                                                                                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Becomes Reporting**                     | No scheduled reports, no narrative PnL stories, no Lake-backed analytics epics in RC-20 DoD                                         |
| **Becomes AI Analyst**                    | No AI panels, no AI-triggered commands; Spec §10 kill/config silence preserved                                                      |
| **Becomes Command API / second SoT**      | No new command authority; thin UI/BFF only calls Session/Risk ports; rejection tests for direct adapter/order calls                 |
| **Duplicates Dashboard as finance truth** | Authority Matrix: projections only; finance disputes → Ledger/Orders/Fills win                                                      |
| **UI-only Kill Switch**                   | Productize through durable ports; restart must preserve kill; tests required                                                        |
| **Bot aggregate creep**                   | Bot Facade only; RC-19 alias discipline                                                                                             |
| **Tactic-select without Library**         | Explicitly deferred to post–RC-22                                                                                                   |
| **Auth under-hardening**                  | Multi-operator strong claims gated on TD-005/006; single-operator paper ops may ship with documented caveat (same as RC-19 closure) |

---

## 7. Task 7 — Acceptance criteria (RC-20 close)

RC-20 may close only when:

### Scope & architecture

1. Command Center exists as ops workspace per Spec §5.16 — monitoring + control projections/commands.
2. No Reporting, AI, Strategy Library, Lake, Orchestrator, or IDE-shell delivery claimed as RC-20.
3. No new global backend module that owns finance, orders, or lifecycle.
4. Architecture Spec v2.0 unchanged; roadmap themes unchanged (RC-20 = Command Center).

### Visibility

5. Global system status shows paper mode, kill state, and session attention counts from APIs.
6. Exchange overview shows default Exchange Scope identity (Binance).
7. Bot overview + active sessions + running Paper Trading projections are available in the layout.

### Control

8. Pause / resume / stop succeed only via Session ports (Bot Facade allowed as alias).
9. Kill Switch activate/clear succeeds only via durable Risk/Session safety ports.
10. Kill Switch state survives process restart (durable) — UI flag alone is insufficient.
11. Fail-closed rules (recovery / kill) are not bypassed by Command Center.

### Authority

12. Command Center displays are labeled/understood as non-authoritative projections.
13. Conformance tests (or equivalent evidence): CC cannot submit orders, mutate ledger, or invent session state.
14. All epics meet DoD ([Epic Breakdown](./rc-20-epic-breakdown.md)).
15. Deferred work listed with target RCs (tactic-select, IDE, Library, Lake, Reporting, AI, multi-exchange).

### Explicit non-acceptance

- Pretty ops page with UI-only kill/pause
- “Dashboard” that recomputes balances
- Embedding research analytics or AI to pad the release
- Renaming Live Trading page to Command Center without port wiring

---

## 8. Deliverables checklist

| Deliverable               | Document                                                             |
| ------------------------- | -------------------------------------------------------------------- |
| RC-20 Implementation Plan | This file                                                            |
| Epic Breakdown            | [`rc-20-epic-breakdown.md`](./rc-20-epic-breakdown.md)               |
| Command Center Layout     | [`rc-20-command-center-layout.md`](./rc-20-command-center-layout.md) |
| Acceptance Criteria       | §7                                                                   |

**STOP:** Planning complete. No implementation in this task.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |

**After approval:** Begin Epic 1 under a separate implementation task. Do not start RC-22 Library work under the RC-20 label.
