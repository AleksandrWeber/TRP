# PC-20 Product UX Polish — Consistency Report

**Package:** PC-20  
**Date:** 2026-08-16  
**Canonical language:** Alias Dictionary (frozen) + Product UI Policy  
**Verdict:** PASS — operator-facing labels match canonical product names

---

## Terminology

| Before              | After                 | Canonical                     |
| ------------------- | --------------------- | ----------------------------- |
| Certify             | Certification         | Certification Product         |
| Orchestrator        | Trading Orchestrator  | Trading Orchestrator          |
| Profile             | Market Profile        | Market Profile                |
| Channels            | Notification Channels | Notification Channels Product |
| Research strategies | Research strategies   | Not Strategy Library          |
| Knowledge           | Knowledge             | Not Knowledge Lake            |
| AI                  | AI                    | Not AI Analytics              |

Bot remains the UI alias for Trading Session. Cluster remains Exchange Scope. Telegram remains the active Notification Channel, not a top-level menu item.

---

## Chrome

| Element           | Canonical form                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Header title      | Paper-first operator                                                                     |
| Breadcrumbs       | Overview / {band} / {product} [/ screen]                                                 |
| History action    | History, or a product-specific history label when already in use                         |
| Next action       | `Next: {canonical product}`                                                              |
| Primary CTA verbs | Certify a strategy, Create Deployment, Generate analysis, Run Campaign, Create paper bot |
| Status badges     | Shared `StatusBadge` on Overview; existing product badges unchanged                      |
| Empty             | Title + why + next action                                                                |
| Loading           | `Loading {product}…`                                                                     |
| Error             | Red alert banner                                                                         |
| Success           | Emerald status banner                                                                    |
| Confirm           | Shared `ConfirmationDialog`                                                              |

---

## Intentionally unchanged

- Research Control Center page internals (Analytics / Optimization / Engineering / Diagnostics)
- Command Center panel contracts (P1–P5, P7)
- Honesty disclaimers on completed products
- Legacy `/strategies`, `/knowledge`, `/ai`, and research `/reports`

---

**End of Consistency Report.**
