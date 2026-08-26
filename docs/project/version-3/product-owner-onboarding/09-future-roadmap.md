# 09 — Future Roadmap

**Audience:** Permanent AI Product Owner / Chief Architect
**Nature:** Approved roadmap only — no invented functionality
**Authority:** [`../version-3-master-plan.md`](../version-3-master-plan.md) · [`../v3-product-roadmap.md`](../v3-product-roadmap.md) · [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md)

---

## Rule

This document restates **approved** Version 3 roadmap content. It does not add products, packages, or journeys. If a capability is not in the Master Plan / Execution Roadmap / Product Roadmap, it is not Version 3 work until a planning revision.

---

## Waves remaining

Wave 1 is **CERTIFIED COMPLETE**. Wave 2 is **COMPLETE**. Wave 3 Planning is **APPROVED**; W3-O01-a inventory foundation is **IMPLEMENTED** (awaiting PO review before W3-O01-b). Waves 4–10 remain not started.

| Wave            | Name                               | Business value (Master Plan)                | Packages                                                                                  |
| --------------- | ---------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **2**           | Connection Management              | Customers connect from the UI               | Roadmap IDs **V3-C01…C04**; operational packages **W2-S01…S05 CLOSED**; Wave **COMPLETE** |
| **3** (current) | Durability, operations, continuity | Restart, kill switch, visibility            | V3-O01…O05; **W3-O01-a IMPLEMENTED**; b…d not opened; platform not restart-safe yet       |
| **4**           | Exchange Connectivity              | Real venue handshake; paper still default   | V3-E01…E05                                                                                |
| **5**           | Notification Platform              | Real alerts                                 | V3-N01…N04                                                                                |
| **6**           | Live Trading                       | Earned live capital on the canonical path   | V3-L01…L05 + **live-capital ADR**                                                         |
| **7**           | AI & Knowledge                     | Customer keys, durable knowledge, exporters | V3-A01…A04                                                                                |
| **8**           | Portfolio, Risk, Analytics         | Productize existing engines                 | V3-P01…P04                                                                                |
| **9**           | Workspace SaaS                     | Teams, admin, billing, APIs                 | V3-W01…W04 (W05 stretch)                                                                  |
| **10**          | Closeout                           | Compliance, E2E, performance, runbooks      | V3-X01…X04                                                                                |

**Live gate:** Waves **1 + 2 + 3 + 4** complete **and** live-capital ADR before Wave 6.

---

## Major products expected (by wave)

### Wave 2 — Connection Management (COMPLETE)

Master Plan customer-observable outcomes for Wave 2 were delivered under W2-S01…S05. See [`../wave-2-completion-report.md`](../wave-2-completion-report.md).

### Wave 3 — Durability and continuity (Planning APPROVED)

Products / outcomes include durable analytical stores, durable notification queue, Kill Switch arming, health/incident visibility without SSH, honest degradation when dependencies fail, and US295 / restart-safety stance (accept or explicit limitation — silent PASS forbidden).

Packages: V3-O01…O05 (Infrastructure, Monitoring, Business Continuity, Disaster Recovery residual, related ops).

Operational note: **W3-O01 Durable Analytical Stores** Planning is **APPROVED**. **W3-O01-a** (inventory foundation) is **IMPLEMENTED** under [`../wave-3/`](../wave-3/). W3-O01 extends existing owners only (no new persistence owner). Do **not** open W3-O01-b until Product Owner review. Platform is **not** restart-safe from O01-a alone.

### Wave 4 — Exchange Connectivity

Real connect / test / disconnect for **Binance**, then **Bybit** and **OKX**; Kraken offered as real adapter or honestly not offered. Connected means the venue answered. Paper remains default. No live-capital claim.

Packages: V3-E01…E05.

### Wave 5 — Notification Platform

Real Telegram test message; Email and shipped Slack/Discord/Teams/Push same way or honestly reserved. Telegram cannot start/stop/approve trades.

Packages: V3-N01…N04.

### Wave 6 — Live Trading

Live off until authorized enablement; Gate + certified strategy; human start; financial action audit; Kill Switch stops live orders; UI live means venue reach. Requires live-capital ADR.

Packages: V3-L01…L05. Financial Integrity logging completes here (SEC-10).

### Wave 7 — AI & Knowledge

Workspace uses customer AI key; optional providers; research/paper survive AI outage with honest offline; durable knowledge; export report.

Packages: V3-A01…A04.

### Wave 8 — Portfolio, Risk, Analytics

Portfolio from platform books (not a second ledger); risk denial visibility; risk-adjusted stats; tactics only inside certified envelopes.

Packages: V3-P01…P04. Risk Engine maintained; live policies also touch Wave 6.

### Wave 9 — Workspace SaaS

Invite teammate without key leakage; admin disable user; billing isolated from Gate/order path; customer API keys with rotation.

Packages: V3-W01…W04; **V3-W05 IDE shell** is stretch, not Core Complete blocker.

### Wave 10 — Closeout

Compliance/export pack; critical-path E2E; documented performance limits.

Packages: V3-X01…X04.

---

## Release milestones (approved)

| Milestone              | Waves | Meaning                                                                         |
| ---------------------- | ----- | ------------------------------------------------------------------------------- |
| **V3 Core**            | 1–5   | Safe secrets, unified connections, durable ops, real venues, real notifications |
| **V3 Live**            | 6     | Optional live capital on canonical path                                         |
| **V3 Platform**        | 7–8   | AI keys, knowledge durability, portfolio/risk/analytics products                |
| **V3 SaaS**            | 9     | Teams, admin, billing, developer access                                         |
| **Version 3 Complete** | 1–10  | Core + Live + Platform + SaaS + closeout                                        |

Billing may lag for self-hosted operators. Waves 9–10 are not descoped by this onboarding file.

---

## Explicitly out of Version 3 (do not invent)

From Product Roadmap:

- Plugin marketplace
- AI Scientist / multi-agent decision path
- SHIELD as separate product
- HFT / new execution venue types
- ABAC engine (unless justified later)
- Auto strategy rotation of uncertified logic

---

## Maintained Version 2 products (not rebuild targets)

Strategy Library, Certification, Runtime Gate, Deployment, Orchestrator, Qualification, Market Profile, Market State, Command Center (paper), Knowledge Lake, Reporting, AI Analytics, paper Execution Adapter.

---

## Cross-references

| Need                          | Document                                                         |
| ----------------------------- | ---------------------------------------------------------------- |
| Customer journeys J3-01…J3-12 | [`../v3-product-roadmap.md`](../v3-product-roadmap.md)           |
| Capability IDs                | [`../v3-capability-inventory.md`](../v3-capability-inventory.md) |
| Package technical exit        | [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md)       |
| Current position              | [`08-current-state.md`](./08-current-state.md)                   |

---

**STOP.** Do not open future waves from this document. Do not invent packages mid-stream.
