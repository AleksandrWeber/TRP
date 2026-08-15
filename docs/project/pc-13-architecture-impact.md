# PC-13 Command Center Product — Architecture Impact

**Package:** PC-13  
**Date:** 2026-08-15  
**Verdict:** Architecture unchanged. Authority unchanged. Command Center remains command UI only. Trading Session remains Session owner. Orchestrator unchanged. Deployment unchanged. Runtime unchanged. No new SoT. No new authority.

---

## Frozen artifacts

| Artifact                        | Status after PC-13  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## System Boundaries

| Concern                            | Owner before                           | Owner after                                            |
| ---------------------------------- | -------------------------------------- | ------------------------------------------------------ |
| Trading Session lifecycle          | Trading Session                        | Unchanged                                              |
| Bot product names                  | Bot Facade (alias)                     | Unchanged alias                                        |
| Command Center                     | Command UI + projection                | Unchanged — still not Session SoT                      |
| Paper Account                      | Paper Account                          | Unchanged; create is now transported                   |
| Deployment bind                    | Strategy Deployment                    | Unchanged                                              |
| Orchestration                      | Trading Orchestrator                   | Unchanged — `createsSession` remains false             |
| Runtime evaluation                 | Strategy Runtime                       | Unchanged — Command Center reads lifecycle/diagnostics |
| Orders / Execution / Risk approval | Never Command Center                   | Still never                                            |
| Kill Switch                        | Risk / live safety (not paper product) | Still not wired; Emergency Controls stay hidden        |

HTTP is transport. UI is not SoT. The product adapter does not execute, certify, orchestrate, or own Runtime.

---

## Authority Consumption

| Authority            | How PC-13 uses it                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Trading Session      | **Owner** of create / start / pause / resume / stop. REST/UI expose existing commands.                         |
| Paper Account        | **Owner** of paper account create. Session binds to an existing account id.                                    |
| Strategy Deployment  | **Bind ref only.** Create requires an approved Deployment. Command Center does not approve.                    |
| Strategy Runtime     | **Consumer read** of `getLifecycle` / `getDiagnostics`. Session still arms/pauses/resumes/stops Runtime.       |
| Trading Orchestrator | **Reference read** of Session Handoff Intent by Deployment bind ref. Does not consume the intent (PC-15 15-a). |
| Risk                 | **Not used.** No approvals. No Kill Switch activate/clear.                                                     |
| Orders / Execution   | **Not used.**                                                                                                  |

`createsSession` remains **false** on every Orchestration reference shown in Command Center.

---

## Ports

| Port                                                   | Before                                 | After                                          |
| ------------------------------------------------------ | -------------------------------------- | ---------------------------------------------- |
| Trading Session create / start / pause / resume / stop | In-process; pause/resume/stop had HTTP | **Same owner** — create/start now have HTTP    |
| Paper Account create                                   | In-process                             | **Same owner** + HTTP                          |
| Strategy Runtime lifecycle/diagnostics                 | In-process                             | Consumer read on session GET                   |
| Orchestrator query                                     | HTTP (PC-11)                           | Unchanged; Command Center reads as a reference |
| Session start from Orchestrator intent                 | Not consumed                           | **Still PC-15 15-a**                           |

---

## What was not changed

- Trading Session aggregate, transitions, lease, or recovery
- Orchestrator workflow or `createsSession`
- Deployment / Runtime / Library owners
- Spec, Authority Matrix, Alias Dictionary, RC history
- Emergency Kill Switch (live-only; not invented as UI-only kill)

---

**End of Architecture Impact.**
