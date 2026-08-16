# PC-20 Product UX Polish — Customer Journey Audit

**Package:** PC-20  
**Date:** 2026-08-16  
**Journey:** [Canonical Product Journey](./product-completion-journey.md)  
**Verdict:** PASS — every transition is labeled; no dead ends on the paper-first path

---

## Walkthrough

| Step                  | Path                        | Transition                    | Dead end? | Misleading control?                        |
| --------------------- | --------------------------- | ----------------------------- | --------- | ------------------------------------------ |
| Login                 | `/login`                    | Sign in → Overview            | No        | No prefilled admin; no live claim          |
| Workspace             | Header switcher             | Visible on every product page | No        | Archive / create remain workspace commands |
| Research              | `/research`, Lab, Campaign  | Next: Certification           | No        | Research is labeled research               |
| Certification         | `/strategy-library/certify` | Next: Strategy Library        | No        | Irreversible admit is confirmed            |
| Strategy Library      | `/strategy-library`         | Next: Runtime Validation      | No        | Not the research editor                    |
| Runtime Validation    | `/runtime-validation`       | Next: Deployment              | No        | FAIL cannot be overridden                  |
| Deployment            | `/deployments`              | Next: Trading Orchestrator    | No        | Does not start a session                   |
| Trading Orchestrator  | `/orchestrator`             | Next: Command Center          | No        | `createsSession` remains false             |
| Trading Session       | `/command-center`           | Create / operate paper Bot    | No        | Paper bot, not live                        |
| Reporting             | `/reporting`                | Next: Notifications           | No        | Projections, not ledger                    |
| Notification          | `/notifications`            | Next: Notification Channels   | No        | Delivery only                              |
| Notification Channels | `/notifications/channels`   | Next: AI Analytics            | No        | Reserved channels not activated            |
| AI Analytics          | `/ai-analytics`             | Next: Knowledge Lake          | No        | Explanation, not an order                  |
| Knowledge Lake        | `/knowledge-lake`           | Next: Reporting (warehouse)   | No        | Read-only projections                      |
| Command Center        | `/command-center`           | Next: Reporting               | No        | Emergency remains hidden                   |

Overview lists this path as a numbered journey. Each completed product home has a Next action from the catalog.

---

## Entry points

| Entry                              | Role                                |
| ---------------------------------- | ----------------------------------- |
| Overview journey rail              | Discover the loop                   |
| Band navigation                    | Reach any completed product         |
| In-page History / Next             | Continue without hunting the header |
| Campaign, Lab, Research strategies | Produce evidence, then certify      |

Sandbox Paper Bots remain labeled sandbox. Certified create remains Command Center.

---

**End of Customer Journey Audit.**
