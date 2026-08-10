# RC-20 UI Contract — Command Center

**Document:** RC-20 Command Center UI Contract  
**Status:** APPROVED planning companion — **canonical frontend guide** (no implementation yet)  
**Date:** 2026-08-10  
**Nature:** Design and interaction specification only. No React. No CSS. No code.

**Authority parents:**

| Document                                                                        | Role                                          |
| ------------------------------------------------------------------------------- | --------------------------------------------- |
| [RC-20 Implementation Plan](./rc-20-implementation-plan.md)                     | **Approved** scope and actions                |
| [RC-20 Command Center Layout](./rc-20-command-center-layout.md)                 | Region IA                                     |
| [RC-20 Epic Breakdown](./rc-20-epic-breakdown.md)                               | Delivery slices                               |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.16 | Command Center constitution                   |
| [Authority Matrix](./v2-authority-matrix.md)                                    | Command UI + projection only                  |
| [UX Vision](./trp-ux-vision.md)                                                 | Experience rules; non-authoritative Dashboard |

**This contract becomes the implementation guide for all RC-20 frontend work.**  
If a UI proposal is not in this contract, it is out of RC-20 until the contract is revised.

---

## Contract summary

| Dimension     | Rule                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| **Job**       | Answer “what is happening now?” and “can I stop it safely?”                                                |
| **Shown**     | Ops status, Exchange Scope summary, Bot/Session fleet, Paper activity, Kill Switch state                   |
| **Where**     | Command Center workspace regions defined below                                                             |
| **Can do**    | View/refresh; filter/search fleet; pause/resume/stop; emergency stop / clear kill                          |
| **Cannot do** | Report, analyze deeply, AI, certify strategies, place orders, edit ledger, invent lifecycle, tactic-select |

All displayed values are **projections**. Session lifecycle and Kill Switch truth live in Session / Risk ports — never in UI local state alone.

---

# Part A — Workspace layout (Task 1)

## A.1 Page frame

Command Center is one **Production / Operations workspace** route. It uses the existing app chrome where possible; it does **not** invent the RC-21 IDE shell.

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                                     │
│  Product · Workspace: Command Center · User · Manual Refresh                │
├──────────────┬─────────────────────────────────────────────────────────────┤
│ LEFT NAV     │ MAIN WORKSPACE                                              │
│  (app nav)   │  ┌─────────────────────────────────────────────────────┐   │
│  · Research  │  │ STATUS AREA                                         │   │
│  · …         │  │  Global System Status                               │   │
│  · Command   │  ├──────────────────────┬──────────────────────────────┤   │
│    Center ●  │  │ OPERATIONS AREA      │                              │   │
│              │  │  Exchange Overview   │  Emergency Controls          │   │
│              │  ├──────────────────────┴──────────────────────────────┤   │
│              │  │  Bot Overview  │  Active Sessions                   │   │
│              │  ├─────────────────────────────────────────────────────┤   │
│              │  │  Running Paper Trading                              │   │
│              │  └─────────────────────────────────────────────────────┘   │
│              │  [Inspector / Detail — on selection, progressive]           │
├──────────────┴─────────────────────────────────────────────────────────────┤
│ FOOTER / STATUS BAR (optional thin)                                         │
│  Projection disclaimer · Last refreshed · Connection attention              │
└────────────────────────────────────────────────────────────────────────────┘
```

## A.2 Top Bar

| Element                        | Purpose                                 |
| ------------------------------ | --------------------------------------- |
| Product / app identity         | Orient user in TRP                      |
| Workspace title                | **Command Center** (current context)    |
| Manual Refresh control         | Re-fetch all Command Center projections |
| User / session auth affordance | Existing auth pattern only              |

**Not in Top Bar:** AI entry, report shortcuts, Library certify, live-capital toggle, tactic controls.

## A.3 Left Navigation

| Rule                | Detail                                                                |
| ------------------- | --------------------------------------------------------------------- |
| Role                | Existing primary app navigation                                       |
| Command Center item | Highlighted when this workspace is active                             |
| Other items         | Research / Paper / etc. remain reachable; they are **different jobs** |
| Forbidden           | Second nested “ops analytics” tree inside CC                          |

RC-20 does not redesign global IA; it adds/activates the Command Center destination.

## A.4 Main Workspace

Contains **Status Area** + **Operations Area** only (plus progressive detail inspector).

No multi-column analytics, no chart wall, no AI side panel.

## A.5 Status Area

Top of main workspace. Hosts:

- **Panel P1 — Global System Status**

Always visible on entry (critical information).

## A.6 Operations Area

Remainder of main workspace. Hosts:

| Panel                          | ID             |
| ------------------------------ | -------------- |
| Exchange Overview              | P2             |
| Emergency Controls             | P6             |
| Bot Overview                   | P3             |
| Active Sessions                | P4             |
| Running Paper Trading          | P5             |
| Session / Bot Detail Inspector | P7 (on demand) |

## A.7 Footer (optional)

Thin status bar **if** existing app patterns already use one. Content only:

- Non-authoritative projection disclaimer (short)
- Last successful refresh timestamp
- Soft connection/error attention (if refresh failed)

No ticker of trades, no PnL strip, no AI suggestions.

---

# Part B — Panel specification (Task 2)

## B.0 Shared panel rules

Every panel must define and implement:

| State       | Behavior                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------- |
| **Loading** | Skeleton or inline spinner in-panel; do not blank the whole workspace if other panels are fresh |
| **Empty**   | Explain what / why / next (e.g. “No active sessions”) — never a dead white void                 |
| **Error**   | Explain failure; offer Manual Refresh; do not show fabricated healthy data                      |
| **Refresh** | Data comes only from API projections; stale data labeled by timestamp                           |

Shared selection model: selecting a Bot/Session in P3/P4/P5 highlights the same identity everywhere and opens **P7** when detail is needed.

---

## P1 — Global System Status

| Field                     | Contract                                                                                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**               | Instant answer: is the paper fleet OK, and is emergency armed?                                                                                                          |
| **Displayed information** | Paper mode badge; Kill Switch armed/clear; session counts (active / paused / recovering / stopped as available); recovery/incident attention flag(s); last refreshed at |
| **Allowed actions**       | Manual Refresh (workspace-level); click attention flag → focus related session list / detail if identifiable                                                            |
| **Refresh behavior**      | Included in workspace refresh; may also poll (see Part E)                                                                                                               |
| **Empty state**           | Counts at zero with explicit “No sessions” — still show mode + kill                                                                                                     |
| **Loading state**         | Skeleton badges/counts; retain previous values greyed **or** show skeletons (pick one pattern and keep consistent)                                                      |
| **Error state**           | Error banner in Status Area; kill/mode unknown labeled “Unavailable” — never invent “clear/healthy”                                                                     |

**Must not show:** PnL, equity, win rate, AI summary, report CTA.

---

## P2 — Exchange Overview

| Field                     | Contract                                                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**               | Identify the Exchange Scope (Cluster) context for the fleet                                                                   |
| **Displayed information** | Default Binance scope id/label; paper adapter/mode binding; session capacity usage **only if** already exposed by APIs        |
| **Allowed actions**       | **Filter by Exchange** (RC-20: single default scope — control may be disabled/single-option); open read-only scope label copy |
| **Refresh behavior**      | With workspace refresh                                                                                                        |
| **Empty state**           | N/A if default scope always exists; else “Scope unavailable” + refresh                                                        |
| **Loading state**         | Card skeleton                                                                                                                 |
| **Error state**           | “Exchange overview unavailable” + refresh                                                                                     |

**Must not show:** credential vault, policy editor, multi-venue admin, risk-limit forms.

---

## P3 — Bot Overview

| Field                     | Contract                                                                  |
| ------------------------- | ------------------------------------------------------------------------- |
| **Purpose**               | Fleet attention list (Bot = Trading Session alias)                        |
| **Displayed information** | Bot/Session id; lifecycle state badge; exchange scope; paper label        |
| **Allowed actions**       | Select row; **Search**; **Filter by Status**; navigate selection to P4/P7 |
| **Refresh behavior**      | With workspace refresh / poll                                             |
| **Empty state**           | “No bots/sessions in this workspace”                                      |
| **Loading state**         | List skeleton rows                                                        |
| **Error state**           | Inline error + refresh; list not silently empty                           |

**Must not show:** strategy source editor, mission designer, certify button.

---

## P4 — Active Sessions

| Field                     | Contract                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| **Purpose**               | Focus on non-terminal sessions for operational control                                    |
| **Displayed information** | Session id (Bot alias OK); state; scope; paper flag; kill/recovery attention marks        |
| **Allowed actions**       | Select; **Search**; **Filter by Status**; **Pause**; **Resume**; **Stop** (when eligible) |
| **Refresh behavior**      | With workspace refresh / poll; after each successful control action, re-read SoT          |
| **Empty state**           | “No active sessions”                                                                      |
| **Loading state**         | Table/list skeleton                                                                       |
| **Error state**           | Inline error; disable actions until refresh succeeds                                      |

**Must not show:** order tickets, force-fill, historical report archive.

---

## P5 — Running Paper Trading

| Field                     | Contract                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| **Purpose**               | Confirm which activity is on the paper path                                                   |
| **Displayed information** | Paper-labeled sessions/accounts summary; short safety copy (“canonical path · paper adapter”) |
| **Allowed actions**       | Select item → sync selection / P7; Search within paper set                                    |
| **Refresh behavior**      | With workspace refresh / poll                                                                 |
| **Empty state**           | “No running paper trading sessions”                                                           |
| **Loading state**         | Skeleton summary                                                                              |
| **Error state**           | Unavailable + refresh                                                                         |

**Must not show:** equity curves, fee analytics, live-capital CTA.

---

## P6 — Emergency Controls

| Field                     | Contract                                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Purpose**               | Deliberate emergency stop / clear via durable Kill Switch ports                                                |
| **Displayed information** | Kill state (armed/clear) from durable projection; short effect copy (“Blocks new execution per safety policy”) |
| **Allowed actions**       | **Emergency Stop** (activate Kill Switch); **Clear Kill Switch** (elevated); view state                        |
| **Refresh behavior**      | Immediate re-read after activate/clear; included in workspace refresh                                          |
| **Empty state**           | N/A — always show known state or Unavailable                                                                   |
| **Loading state**         | Disable buttons while command in flight; show progress on control                                              |
| **Error state**           | Show port error; leave prior durable state displayed after refresh                                             |

**Must not:** UI-only boolean; auto-clear timers; AI/Telegram activate; one-click without confirmation.

---

## P7 — Session / Bot Detail Inspector (progressive)

| Field                     | Contract                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Purpose**               | On-demand ops detail for the selected Session/Bot                                                                 |
| **Displayed information** | Identity; lifecycle state; scope id; paper label; kill/recovery flags; last known command rejection reason if any |
| **Allowed actions**       | Pause / Resume / Stop when eligible; close inspector                                                              |
| **Refresh behavior**      | Refresh on open, on selection change, after commands, with workspace refresh                                      |
| **Empty state**           | “Select a bot/session” when none selected                                                                         |
| **Loading state**         | Detail skeleton                                                                                                   |
| **Error state**           | “Detail unavailable” + refresh                                                                                    |

**Must not show:** full research evidence trees, Lake history, AI explanation panels, tactic editors.

---

# Part C — Interaction specification / operations (Task 3)

## C.1 Closed operation set (RC-20)

Only these operations exist in Command Center RC-20:

| Operation                      | Where              | Purpose                      | Result                                       | Notes                                                   |
| ------------------------------ | ------------------ | ---------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| **Pause Session**              | P4, P7             | Halt evaluation safely       | Session paused via port; UI matches SoT      | Disabled if not eligible                                |
| **Resume Session**             | P4, P7             | Continue when safe           | Session running via port if policy allows    | Must not bypass kill/recovery fail-closed               |
| **Stop Session**               | P4, P7             | End worker lifecycle         | Session stopped via port                     | Not “delete ledger”                                     |
| **Emergency Stop**             | P6                 | Activate durable Kill Switch | Kill armed; new execution blocked per policy | Confirm + reason as required by ports                   |
| **Clear Kill Switch**          | P6                 | Explicitly disarm            | Durable clear via port                       | Elevated; confirm                                       |
| **Filter by Exchange**         | P2 / fleet filters | Narrow fleet by scope        | List projection filtered                     | RC-20: default Binance only — may be fixed single value |
| **Filter by Status**           | P3, P4             | Narrow by lifecycle state    | List projection filtered                     | Client filter over projected list OK                    |
| **Search**                     | P3, P4, P5         | Find by id/label             | List projection filtered                     | No global semantic search product                       |
| **Manual Refresh**             | Top Bar / panels   | Re-read projections          | All panels update from APIs                  | Always available                                        |
| **Select Bot/Session**         | P3–P5              | Focus identity               | Highlight + open P7                          | Selection is UI state only                              |
| **View status / kill / paper** | P1–P6              | Monitoring                   | Read-only projection                         | No edits                                                |

## C.2 Explicitly forbidden operations

Anything not listed in C.1, including but not limited to:

- Place / cancel orders
- Force fills; edit positions or ledger
- Certify / deprecate strategies; open Strategy Library
- Tactic-select / envelope edit
- Run campaigns / walk-forward / reports
- AI ask / auto-remediate
- Create Exchange Scope; edit Exchange Risk Policy
- Enable live capital
- Telegram control

---

# Part D — Information hierarchy (Task 4)

## D.1 Priority tiers

### Critical (always visible without scroll if viewport allows)

1. Kill Switch armed/clear (P1 + P6)
2. Paper mode label (P1)
3. Recovery / incident attention (P1)
4. Emergency Stop control affordance (P6)

### Important (primary workspace, first screen)

5. Session counts by state (P1)
6. Active Sessions list (P4)
7. Bot Overview (P3)
8. Exchange Scope identity (P2)
9. Last refreshed timestamp

### Secondary (visible but lower visual weight)

10. Paper Trading summary copy (P5)
11. Capacity usage (only if API exposes it)
12. Per-row scope labels
13. Footer disclaimer

### Hidden by default (information on demand)

14. Session/Bot Detail Inspector (P7)
15. Full error payload / port messages (expand from error summary)
16. Kill activate reason history (if exposed — detail only)
17. Stopped/terminal sessions (not in Active list; searchable only if product already returns them — do not build archive UI)

## D.2 Anti-clutter rules

- No chart gallery.
- No “stats of the day.”
- No duplicate kill badges fighting for attention without a single primary emergency region.
- Detail stays in P7 — lists stay scannable.
- Progressive disclosure is mandatory (UX Vision).

---

# Part E — Live updates (Task 5)

Conceptual only — no transport implementation prescribed here.

## E.1 Manual refresh

- Always available from Top Bar.
- Re-fetches Command Center projections.
- Updates “last refreshed” only on success.
- Partial failure: mark failed panels in error; do not claim global success.

## E.2 Auto refresh

- Command Center **may** auto-refresh projections on a calm interval while the workspace is visible.
- Auto refresh **pauses** while a confirmation dialog is open or a dangerous command is in flight.
- Auto refresh never applies commands — **read only**.

## E.3 Polling vs event updates

| Approach         | RC-20 contract stance                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Polling**      | Acceptable default for status projections                                                                           |
| **Event / push** | Allowed later if existing platform events exist; must still render as projections, not UI SoT                       |
| **Mixed**        | Events may trigger a fetch; UI must not trust event payload as ledger/lifecycle authority without port confirmation |

## E.4 User notifications

| Allowed                                                                  | Forbidden                                                   |
| ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| In-app toast/inline result for pause/resume/stop/kill success or failure | Telegram as control plane                                   |
| Persistent attention in P1 when kill armed or recovery flagged           | AI-generated remediation notifications that execute actions |
| Confirm dialogs before dangerous ops                                     | Silent background state changes without refresh visibility  |

Notifications explain outcome; they do not become a second command bus.

---

# Part F — UX rules (Task 6)

## F.1 Selection behavior

- Single selection model across P3/P4/P5/P7 (one Bot/Session identity).
- Selection highlight is consistent; clearing selection returns P7 to empty state.
- Filters/search do not clear kill state displays.
- Selecting does not itself call pause/stop/kill.

## F.2 Confirmation dialogs

| Operation         | Confirmation                                                            |
| ----------------- | ----------------------------------------------------------------------- |
| Pause             | Not required (reversible) unless product already requires it            |
| Resume            | Not required; show error if rejected by fail-closed policy              |
| Stop              | **Required** — irreversible lifecycle end                               |
| Emergency Stop    | **Required** — reason field if port requires; explicit consequence copy |
| Clear Kill Switch | **Required** — elevated; explicit consequence copy                      |

Dialogs must state: what will happen, what will not happen (e.g. “does not delete ledger history”).

## F.3 Dangerous operations

Ranked danger:

1. Emergency Stop
2. Clear Kill Switch
3. Stop Session
4. Pause / Resume

Dangerous controls use distinct visual treatment (Emergency region vs row actions) and never hide behind icons-only without labels.

## F.4 Error handling

- Prefer **what / why / next action** (UX Vision).
- Command failures keep prior SoT projection after refresh; optimistic UI must reconcile to port result.
- Never display “Healthy / Clear” when status API failed.
- Fail-closed: if kill/recovery state unknown, disable Resume and show Unavailable.

## F.5 Accessibility

- Text labels on all critical controls (not color-only kill state).
- Confirm dialogs keyboard-operable; focus trapped while open.
- Status badges expose accessible names (“Kill switch armed”).
- Desktop-first; mobile is secondary monitoring only (UX Vision) — RC-20 does not require a separate mobile ops app.

## F.6 Keyboard shortcuts (future)

RC-20 **documents** intent; shipping shortcuts is optional/future polish:

| Shortcut (reserved) | Action                            |
| ------------------- | --------------------------------- |
| `R`                 | Manual Refresh                    |
| `/`                 | Focus Search                      |
| `P`                 | Pause selected (with eligibility) |
| `Shift+Esc`         | Focus Emergency Controls          |

Do not ship conflicting global shortcuts that break research pages. Full keyboard-first IDE belongs to RC-21+.

---

# Part G — Acceptance criteria (Task 7)

Command Center **UI** is complete for RC-20 when all are true:

### Layout & panels

1. Top Bar, Left Nav highlight, Status Area, Operations Area match Part A.
2. Panels P1–P7 exist with purpose/info/actions/states per Part B.
3. No Reporting, AI, Library, Lake, analytics-chart, or tactic-select UI shipped in this workspace.

### Operations

4. Only C.1 operations are available; C.2 operations are absent.
5. Pause / Resume / Stop call Session ports (Bot Facade alias OK) and reconcile UI to SoT.
6. Emergency Stop / Clear Kill Switch call durable safety ports; UI-only kill is absent.
7. Filter by Exchange, Filter by Status, and Search behave per C.1.

### Hierarchy & updates

8. Critical information (kill, paper mode, attention) is visible without hunting.
9. Detail is on demand via P7.
10. Manual Refresh works; auto refresh if present is read-only and pauses during dangerous dialogs.
11. Notifications do not execute trades or mutate SoT directly.

### Trust & UX

12. Empty / loading / error states meet Part B for every panel.
13. Confirmations exist for Stop, Emergency Stop, Clear Kill Switch.
14. Projection disclaimer (footer or equivalent) is present.
15. Accessibility baselines in F.5 met for critical controls.
16. Conformance: UI cannot place orders, edit ledger, or persist a parallel lifecycle store.

### Planning alignment

17. Remains within [RC-20 Implementation Plan](./rc-20-implementation-plan.md) acceptance — UI contract does not expand product scope.

---

## Deliverables map

| Deliverable               | Location                  |
| ------------------------- | ------------------------- |
| RC-20 UI Contract         | This document (canonical) |
| Panel specification       | Part B                    |
| Interaction specification | Parts C, E, F             |
| Acceptance criteria       | Part G                    |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Product owner / UX | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Architecture owner | ☐ Approve ☐ Request changes |      |

**After approval:** Frontend implementation stories must cite this contract. Deviations require a contract amendment before code.

**STOP:** UI Contract complete. No React. No CSS. No implementation.
