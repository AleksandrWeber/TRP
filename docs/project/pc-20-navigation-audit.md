# PC-20 Product UX Polish — Navigation Audit

**Package:** PC-20  
**Date:** 2026-08-16  
**Verdict:** PASS — every completed product is reachable, parented, and unique

---

## Bands

The PC-19 frame is unchanged: **Research**, **Paper trading**, **Administration**.

| Band           | Groups                                          | Products                                                                                                                                                                                                    |
| -------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research       | Start, Evidence, Market context, Research tools | Overview, Dashboard, Research, Lab, Campaign, Research strategies, Qualification, Market Profile, Market State, Knowledge Lake, Optimization, Analytics, Engineering, Diagnostics, Workflows, Knowledge, AI |
| Paper trading  | Certified path, Operate                         | Strategy Library, Certification, Runtime Validation, Deployment, Trading Orchestrator, Command Center, Cluster, Paper Bots, Portfolio, Positions, Orders, Risk                                              |
| Administration | Evidence and delivery, Preferences              | Reporting, AI Analytics, Notifications, Notification Channels, Settings                                                                                                                                     |

---

## Parentage

| Product                                                                               | Parent                                 | Why                                     |
| ------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------- |
| Strategy Library, Certification, Runtime Validation, Deployment, Trading Orchestrator | Paper trading / Certified path         | Admission onto the certified paper path |
| Command Center, Cluster, Paper Bots, Portfolio, Positions, Orders, Risk               | Paper trading / Operate                | Paper operation                         |
| Qualification, Market Profile, Market State, Knowledge Lake                           | Research / Market context              | Research artifacts and warehouse        |
| Reporting, AI Analytics, Notifications, Notification Channels                         | Administration / Evidence and delivery | After-session evidence and delivery     |
| Knowledge, AI, Research strategies                                                    | Research / tools or evidence           | Legacy research surfaces, not relabeled |

No orphan screens. Campaign extra routes remain reachable from Campaign. Telegram URLs still redirect to Notification Channels.

---

## Duplicates and hidden products

| Check                                         | Result                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Duplicate menu items                          | **None** — one path per nav target                                                                     |
| Hidden completed products                     | **None**                                                                                               |
| Active-state collisions                       | **Fixed** — `/notifications/channels` is not Notifications; `/strategy-library/certify` is not Library |
| Live / Production / Exchanges / epic fixtures | **Still hidden**                                                                                       |

---

**End of Navigation Audit.**
