# PC-19 Operator Shell Product — UI Audit

**Package:** PC-19  
**Date:** 2026-08-15  
**Policy:** [Product UI Policy](./product-ui-policy.md)  
**Verdict:** PASS — product chrome matches Version 2 paper-first capabilities

This is not a visual redesign audit. Layouts, styling, and components were not redesigned. The question is: **does the operator see only what the product can do?**

---

## Review question

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

| Band                       | Answer                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------ |
| Research                   | **Yes** — existing research tools, labeled research                                  |
| Paper trading              | **Yes** — paper sessions, portfolio, orders, positions, risk, Command Center operate |
| Administration             | **Yes** — RCC Settings only                                                          |
| Live Trading               | **Hidden**                                                                           |
| Coming Soon / placeholders | **Absent from nav and product routes**                                               |

---

## Policy rules

| Rule                                      | Result   | Evidence                                                                         |
| ----------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| Never expose unavailable functionality    | **PASS** | Live Bots, Exchanges, Production, epic fixtures out of nav and product mounts    |
| Never expose disabled production buttons  | **PASS** | Emergency Controls unmounted; Portfolio Reset (dev) removed                      |
| Never expose “Coming Soon”                | **PASS** | Shell and product nav contain none                                               |
| Never expose placeholder pages            | **PASS** | Epic 3–6 review routes redirect home                                             |
| Hide unfinished functionality             | **PASS** | Certification, Library, Lake, RC-24 Analytics, Notification, Telegram not in nav |
| Navigation represents actual capabilities | **PASS** | Each nav target is an operable existing page                                     |
| Research-only tools clearly identified    | **PASS** | Dedicated Research band; Strategies/Knowledge/AI not relabeled                   |
| Never imply Live Trading                  | **PASS** | Live Bots hidden; `/trading/live` redirects to paper; header is paper-first      |

---

## Audit examples (closed by this package)

| Anti-pattern                                      | Before                        | After                                                   |
| ------------------------------------------------- | ----------------------------- | ------------------------------------------------------- |
| Live Bots beside Paper Bots                       | Trading nav                   | Hidden; `/trading/live` → paper                         |
| Venue picker BINANCE / BYBIT / OKX as operable    | Live Bots / Exchanges pages   | Those pages not product; Exchanges URL → Command Center |
| Emergency Controls all `unavailable`              | Command Center product page   | Hidden until PC-13                                      |
| Retired Production console                        | `/production` in legacy nav   | Hidden; URL → Overview                                  |
| Epic review / screenshot fixtures                 | Unauthenticated review routes | Redirect home; not in nav                               |
| Settings implying Notification / Telegram         | Risk called out in policy     | Settings copy remains RCC preferences only              |
| Three competing shells                            | RCC / Trading / Legacy        | Research / Paper trading / Administration               |
| `/strategies` as Library                          | Not relabeled                 | Still Strategies                                        |
| `/knowledge` as Lake                              | Not relabeled                 | Still Knowledge                                         |
| `/ai` as AI Analytics                             | Not relabeled                 | Still AI                                                |
| Portfolio Reset (dev)                             | Visible on Portfolio          | Removed                                                 |
| Manual paper create looking like certified deploy | Ambiguous subtitle            | Labeled sandbox                                         |

---

## Remaining honesty (out of PC-19 declared scope)

These are not fake chrome. They remain later packages:

| Surface                                                           | Why it stays                                         | Owner             |
| ----------------------------------------------------------------- | ---------------------------------------------------- | ----------------- |
| Command Center Exchange Overview                                  | Existing Cluster/scope projection, not Live Bots nav | PC-12 / PC-13     |
| Cannot create a Bot from Command Center                           | Honest absence; create remains Paper Bots sandbox    | PC-13 after PC-03 |
| Workspace name in header, no switcher                             | Existing bootstrap name only                         | PC-14             |
| RCC Analytics / research reports                                  | Research tools, not RC-24 ReportRuns                 | PC-05 / PC-20     |
| Campaign extra routes (`/campaigns/results`, multi, walk-forward) | Reachable from Campaign, not extra fake nav          | Existing research |

---

## What was not redesigned

- Header / main `max-w-6xl` frame
- Link and button class names
- Research Control Center page layouts
- Command Center panel components (P6 kept for tests, not product mount)
- Color, typography, card chrome

---

**End of UI Audit.**
