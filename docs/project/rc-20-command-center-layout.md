# RC-20 — Command Center Layout

**Document:** Command Center Layout (RC-20)  
**Status:** PLANNING — awaiting approval  
**Date:** 2026-08-10  
**Nature:** UI/IA planning only. No implementation. No visual redesign system invent.

**Parent:** [RC-20 Implementation Plan](./rc-20-implementation-plan.md)  
**Epics:** [RC-20 Epic Breakdown](./rc-20-epic-breakdown.md)  
**UI Contract:** [RC-20 Command Center UI Contract](./rc-20-command-center-ui-contract.md) — canonical frontend guide  
**Constitution:** Spec §5.16 Command Center / Dashboard; UX Vision (ops monitoring; non-authoritative projections)

---

## 1. Purpose of this layout

Define the **initial** Command Center information architecture for RC-20:

- Operational visibility
- Operational control
- Emergency controls

Not a research IDE (RC-21). Not Reporting. Not AI. Not Strategy Library.

---

## 2. Layout principles

1. **One job:** answer “what is happening now?” and “can I stop it safely?”
2. **Projection, not SoT:** every number/badge is refreshable from APIs.
3. **Progressive disclosure:** summary regions first; detail on select — no analytics walls.
4. **Desktop-first** ops workspace (UX Vision).
5. **Calm emergency affordance:** Kill Switch is visible and deliberate — not decorative.
6. **Bot = Session** in labels; no second entity mental model.

---

## 3. Page regions (RC-20)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  COMMAND CENTER                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  [1] GLOBAL SYSTEM STATUS                                                │
│      mode · kill · session counts · recovery attention · refreshed at    │
├─────────────────────────────┬────────────────────────────────────────────┤
│  [2] EXCHANGE OVERVIEW      │  [6] EMERGENCY CONTROLS                    │
│      Cluster / scope card   │      Kill Switch status + activate/clear   │
├─────────────────────────────┴────────────────────────────────────────────┤
│  [3] BOT OVERVIEW              [4] ACTIVE SESSIONS                       │
│      fleet list / badges         non-terminal focus                      │
├──────────────────────────────────────────────────────────────────────────┤
│  [5] RUNNING PAPER TRADING                                               │
│      paper-labeled activity summary                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

Wireframe is structural, not a brand mandate. Existing app chrome may host this as a dedicated route/workspace.

---

## 4. Region specifications

### [1] Global system status

| Element        | Content                                               | Not included                                          |
| -------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Mode badge     | Paper (Freeze)                                        | Live enable toggle                                    |
| Kill badge     | Armed / clear                                         | Soft “warning” without API                            |
| Session counts | Active / paused / recovering / stopped (as available) | PnL totals                                            |
| Attention      | Recovery or incident flags                            | Full incident management product (minimal pointer OK) |
| Refresh        | Timestamp + refresh action                            | Local editable fields                                 |

### [2] Exchange overview

| Element         | Content                                   | Not included                    |
| --------------- | ----------------------------------------- | ------------------------------- |
| Scope identity  | Default Binance Exchange Scope id/label   | Multi-venue switcher product    |
| Binding context | Adapter/mode paper                        | Credential vault UI             |
| Usage snapshot  | Session capacity usage if already exposed | Policy editor; risk-limit forms |

### [3] Bot overview

| Element   | Content                                   | Not included                    |
| --------- | ----------------------------------------- | ------------------------------- |
| List      | Bot/Session id, state, scope, paper label | Strategy code editor            |
| Selection | Highlights linked session in [4]/[5]      | Mission designer / Orchestrator |

### [4] Active sessions

| Element           | Content                        | Not included             |
| ----------------- | ------------------------------ | ------------------------ |
| Focus list        | Non-terminal sessions          | Historical report tables |
| Row actions entry | Pause / resume / stop (Epic 5) | Place order; force fill  |

### [5] Running Paper Trading

| Element     | Content                                   | Not included                 |
| ----------- | ----------------------------------------- | ---------------------------- |
| Summary     | Which sessions/accounts are on paper path | Equity curves; fee analytics |
| Safety copy | Same canonical path, paper adapter        | Live capital CTA             |

### [6] Emergency controls

| Element     | Content                                  | Not included                     |
| ----------- | ---------------------------------------- | -------------------------------- |
| Kill state  | From durable port                        | Frontend-only boolean            |
| Activate    | Confirm + reason (as required by ports)  | Hidden one-click without confirm |
| Clear       | Explicit elevated action                 | Auto-clear timers                |
| Effect copy | “Blocks new execution per safety policy” | “Deletes all data”               |

---

## 5. Explicit exclusions

Do **not** place in RC-20 Command Center layout:

- Analytics charts / deep metric studios
- Reporting schedules or narrative cards
- AI assistant / analyst panels
- Strategy Library browser or certify buttons
- Research campaign runners
- Knowledge Lake explorers
- Tactic-select controls (deferred until envelopes are enforceable)
- Telegram control widgets

---

## 6. Navigation relationship

| Surface                             | Relationship to Command Center                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| Existing Paper / Live trading pages | May deep-link into CC or remain until absorbed; must not remain a second kill SoT |
| Research pages                      | Stay outside CC (different workspace job)                                         |
| RC-21 IDE shell                     | May later host CC as an ops view; not required to ship RC-20                      |
| RC-24 Reporting                     | Separate surface later                                                            |

---

## 7. Acceptance for layout (planning)

Layout is accepted when:

- [ ] All six regions are specified and mapped to epics
- [ ] Exclusions list is unchanged in implementation stories
- [ ] Kill Switch and lifecycle controls are visually distinct from monitoring
- [ ] No region requires Lake, Library, AI, or Reporting to render

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner / UX | ☐ Approve ☐ Request changes |      |
