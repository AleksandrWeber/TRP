# PC-19 Operator Shell Product — Compatibility Report

**Package:** PC-19  
**Date:** 2026-08-15  
**Verdict:** REST unchanged. JWT unchanged. Product chrome changed. Retired URLs redirect.

---

## REST

No backend contract change. No new version. No renamed fields. No removed API routes.

Frontend still calls the same paper, research, and Command Center endpoints it already used.

---

## Authentication model

Unchanged from PC-18. Login, register, logout, and JWT behaviour are out of this package.

---

## Frontend routing compatibility

Product routes that operators already use remain:

| Path                                                                                                                                                                    | Compatibility                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `/`, `/dashboard`, `/research`, `/lab`, `/optimization`, `/analytics`, `/engineering`, `/diagnostics`, `/workflows`, `/strategies`, `/campaigns/*`, `/knowledge`, `/ai` | Unchanged                                        |
| `/command-center`                                                                                                                                                       | Unchanged (Emergency Controls no longer mounted) |
| `/trading/paper`, `/trading/portfolio`, `/trading/positions`, `/trading/orders`, `/trading/risk`                                                                        | Unchanged                                        |
| `/settings`                                                                                                                                                             | Unchanged (RCC preferences)                      |
| `/login`                                                                                                                                                                | Unchanged                                        |

Intentionally gone from the **product path** (not API):

| Former product URL                              | Behaviour now                   |
| ----------------------------------------------- | ------------------------------- |
| `/trading/live`                                 | Redirect to `/trading/paper`    |
| `/trading/exchanges`                            | Redirect to `/command-center`   |
| `/production`                                   | Redirect to `/`                 |
| `/command-center/review-epic3` … `review-epic6` | Redirect to `/` (auth required) |

Page modules for Live Bots, Production, Exchanges, and epic review fixtures are not deleted. Isolation tests may still import them. They are not registered as product UI.

---

## Command Center compatibility

Pause / resume / stop on sessions remain. P6 Emergency Controls remains an RC-20 component for unit tests. The product Command Center page does not render it until PC-13 wires durable ports.

---

## Downstream

PC-14 Workspace Management may add a switcher **inside this shell**. PC-20 may tidy nav as later routes land. Neither is started here.

---

**End of Compatibility Report.**
