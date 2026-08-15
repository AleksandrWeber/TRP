# Product UI Policy

**Document:** Product UI Policy  
**Status:** Mandatory for all Product Completion UI  
**Date:** 2026-08-15  
**Governing charter:** [Version 2 Product Completion Roadmap](./v2-product-completion-program.md)  
**Evidence source:** Version 2 Product Readiness Audit (2026-08-14)  
**Comparison:** [Product Readiness Audit v2](./product-readiness-audit-v2.md) (2026-08-15)  
**Planning freeze:** [Product Completion Readiness Report](./product-completion-readiness-report.md) (**READY TO START PC-18**)

Purpose: **prevent fake or misleading UI.** Version 2 is paper-first. The interface may only present capabilities a user can actually operate.

Architecture Specification v2.0, Authority Matrix, and Alias Dictionary are frozen. This policy does not add screens, packages, or domains. It constrains how existing and future Product Completion surfaces are shown.

---

## Mandatory rules

1. **Never expose unavailable functionality.** If the port, REST, or wiring is not there, the control is not there.
2. **Never expose disabled production buttons.** A visible control that cannot run is a false product. Hide it. Do not leave it in a danger zone set to `unavailable`.
3. **Never expose “Coming Soon”.** That is a promise this program does not make.
4. **Never expose placeholder pages.** Epic review fixtures, screenshot-only routes, and empty shells are not product.
5. **Hide unfinished functionality.** Product Completion may ship a slice; unfinished slices stay out of nav and out of primary actions.
6. **Navigation must represent actual capabilities.** A nav item means the user can complete that job today.
7. **Research-only tools must be clearly identified.** Lab, campaigns, walk-forward, RCC, and legacy knowledge search are research. They must not look like certified deploy or live trading.
8. **Version 2 UI must never imply Live Trading.** Live capital is unauthorized. Venue adapters for BINANCE / BYBIT / OKX are stubbed. Paper is the product.

Alias Dictionary still applies: UI may say Bot, Cluster, Wallet, Mission. Canonical owners do not change. Bot is a Trading Session. Cluster is Exchange Scope. Telegram is delivery, never a control plane.

---

## Audit examples (do not repeat)

These were found in the Product Readiness Audit. They are the reference set for this policy.

| Anti-pattern                                                              | Where it appeared               | Policy response                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live Bots in primary trading nav beside Paper Bots                        | `/trading/live` in trading nav  | Removed from the product path by PC-19.                                                                                                                                                                                                                                                                                                                                                                     |
| Venue picker for BINANCE / BYBIT / OKX while I/O is stubbed               | Live Bots / Exchanges           | Live Bots and Exchanges pages unwired from the product by PC-19.                                                                                                                                                                                                                                                                                                                                            |
| Emergency Controls visible, all actions `unavailable`                     | Command Center                  | Hidden on the product page. Durable Kill Switch REST is live-only. PC-13 did not invent a UI-only kill.                                                                                                                                                                                                                                                                                                     |
| Production page with retired deploy controls (TD-034)                     | `/production`                   | Removed from the product path by PC-19.                                                                                                                                                                                                                                                                                                                                                                     |
| Default credentials prefilled (`admin@trp.local` / `trp-admin-change-me`) | `/login`                        | Removed from the product path by PC-18.                                                                                                                                                                                                                                                                                                                                                                     |
| Unauthenticated epic review / screenshot fixture routes                   | Epic 3–6 review pages           | Redirected out of the product path by PC-19.                                                                                                                                                                                                                                                                                                                                                                |
| Settings that are only RCC preferences                                    | `/settings`                     | RCC `/settings` stays research prefs. Notification settings are `/notifications` (PC-06). Notification Channels are `/notifications/channels` (PC-07). Telegram connect is the Telegram channel page. Cluster is `/clusters` (PC-12). Qualification is `/qualification` (PC-08). Profile is `/market-profile` (PC-09). Market State is `/market-state` (PC-10). Adapter `/trading/exchanges` stays unwired. |
| Three competing shells (RCC / Trading / Legacy laboratory)                | `AppLayout`                     | Replaced by Research / Paper trading / Administration in PC-19. Same layout, not a redesign.                                                                                                                                                                                                                                                                                                                |
| Strategies CRUD presented as Strategy Library                             | `/strategies` vs Library ports  | Do not relabel US005 CRUD as certification or Library.                                                                                                                                                                                                                                                                                                                                                      |
| Knowledge search presented as Knowledge Lake                              | `/knowledge` vs Lake query port | Do not relabel Implementation 014 search as the warehouse.                                                                                                                                                                                                                                                                                                                                                  |
| `/ai/execute` presented as AI Analytics                                   | `/ai`                           | Do not relabel the OpenRouter gateway as RC-24 narratives.                                                                                                                                                                                                                                                                                                                                                  |
| `/reports` presented as RC-24 Reporting                                   | research reports                | Do not relabel research reports as session ReportRuns.                                                                                                                                                                                                                                                                                                                                                      |
| Portfolio **Reset (dev)** in a customer-looking trading view              | `/trading/portfolio`            | Removed from the product path by PC-19.                                                                                                                                                                                                                                                                                                                                                                     |
| Manual paper create (name + balance) looking like certified deploy        | `/trading/paper`                | Labeled sandbox by PC-19. Certified create is Command Center (PC-13) via Session / Deployment ports, consuming `SessionHandoffIntent` when present (PC-15 15-a).                                                                                                                                                                                                                                            |

---

## Positive rules

| May show                                                                                                            | When                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paper Bots / paper sessions                                                                                         | The user can create or operate them through existing session ports.                                                                                                                                                 |
| Command Center fleet pause / resume / stop / create                                                                 | Those commands hit Trading Session. Create uses approved Deployment + Paper Account. Certified create from an Orchestrator handoff is Session consume (PC-15 15-a); Orchestrator still does not create the Session. |
| Research Lab, RCC, campaigns, walk-forward                                                                          | Already usable; label as research.                                                                                                                                                                                  |
| Strategy Library, certify, Gate, deploy, Orchestrator, Qualification, Profile, RC-24 reports, Notification Channels | Only after the responsible PC package has exposed that slice.                                                                                                                                                       |
| Exchange Scope (Cluster)                                                                                            | Only capabilities the user can actually get or set.                                                                                                                                                                 |
| “Paper” badge                                                                                                       | Always on paper path. Never “Live” unless a future ADR authorizes live capital (out of this program).                                                                                                               |

---

## Review question

Before any Product Completion UI change ships, answer:

> If a paying customer clicked this, would it do the job the label claims — on the certified paper-first path — without implying live capital or a capability we have not exposed?

If no, do not ship the control.

---

**End of Product UI Policy.**
