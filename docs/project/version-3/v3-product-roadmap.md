# Version 3 Product Roadmap

**Document:** Version 3 Product Roadmap  
**Date:** 2026-08-16  
**Status:** Annex — planning **FROZEN** in [`version-3-master-plan.md`](./version-3-master-plan.md)  
**Companion:** [Execution Roadmap](./v3-execution-roadmap.md) · [Capability Inventory](./v3-capability-inventory.md)

This is the product view of Version 3. It organizes work into groups, states reuse of Version 2, and records which groups are in, later, or out.

---

## 1. Product statement

Version 3 ships TRP as a **production Research Operating System**:

- Version 2 paper-first loop remains the default path and is not rebuilt.
- Security and Connection Management become first-class products.
- Real venues and real notification/AI connections become customer-operable.
- Live trading is an **opt-in, fail-closed** application of certified knowledge — never the product identity.

---

## 2. Capability groups

Every group below was evaluated. “In Version 3” means it has inventory rows and a wave. “Stretch” means it may ship after Core Complete. “Out” means it must not be invented during Version 3.

| Group                               | Verdict                        | Role in Version 3                                                                                                                   |
| ----------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Security Platform**               | **In — mandatory**             | Primary strategic product. Wave 1 foundation; financial logging completes in Wave 6.                                                |
| **Connection Management**           | **In — mandatory**             | Unified operator product. Wave 2. Unblocks venues, notifications, AI keys.                                                          |
| **Infrastructure**                  | **In — mandatory**             | Durability, queues, US295, scheduler. Wave 3. Required before live claims.                                                          |
| **Monitoring**                      | **In**                         | Health, observability, security monitoring. Wave 3.                                                                                 |
| **Exchange Connectivity**           | **In**                         | Real BINANCE / BYBIT / OKX I/O; Kraken as first new factory venue. Wave 4.                                                          |
| **Live Trading**                    | **In — gated**                 | Wave 6 only after Waves 1–4 + live-capital ADR.                                                                                     |
| **Notification Platform**           | **In**                         | Activate reserved channels + production Telegram. Wave 5.                                                                           |
| **AI Platform**                     | **In**                         | Customer keys + optional providers through existing gateway. Wave 7. AI still never controls capital.                               |
| **Knowledge Platform**              | **In (extension)**             | Keep Lake. Durable research stores. Vector search optional. Wave 7.                                                                 |
| **Analytics**                       | **In (extension)**             | Advanced metrics, exporters. Wave 7–8. Reporting product reused.                                                                    |
| **Portfolio Management**            | **In (productize)**            | Existing Ledger → Portfolio projection becomes a customer product. Wave 8.                                                          |
| **Risk Management**                 | **In (productize)**            | Existing Risk Engine + Exchange policy as operator product; live policies in Wave 6.                                                |
| **Strategy Evolution**              | **In (bounded)**               | Certified tactical envelope selection only (Tactics Contract Option B). No runtime invention. Wave 8.                               |
| **Audit Trail**                     | **In**                         | Owned by Security Platform (SEC-09, SEC-10). Not a separate engine.                                                                 |
| **Workspace / SaaS**                | **In (later wave)**            | Teams and harder isolation. Wave 9. Workspace CRUD reused.                                                                          |
| **Administration**                  | **In (later wave)**            | User and platform admin console. Wave 9.                                                                                            |
| **Billing**                         | **In (later wave)**            | Isolated from trading SoT. Wave 9. Not required to start Waves 1–6.                                                                 |
| **Developer Platform**              | **In (later wave)**            | Customer API keys, webhooks, stable API policy. Wave 9.                                                                             |
| **Compliance**                      | **In (closeout)**              | Retention, export, compliance report. Wave 10.                                                                                      |
| **Performance**                     | **In (closeout)**              | Scale, pagination, Playwright E2E. Wave 10.                                                                                         |
| **IDE shell**                       | **Stretch**                    | UX Vision wants IDE feel. PC-19 already shipped paper chrome. Not a Core Complete blocker.                                          |
| **Market State classification**     | **Stretch**                    | V2 Market State is current-condition SoT without classify. Classification extends the same owner if needed.                         |
| **Plugin marketplace**              | **Out**                        | `docs/future/014`. Markets-as-plugins remains a principle; marketplace is not Version 3.                                            |
| **AI Scientist / multi-agent**      | **Out**                        | Contradicts Mathematics Before AI as the decision path.                                                                             |
| **SHIELD as separate product**      | **Out**                        | Security is in-platform (Security Platform), not a bolted-on AI gateway product.                                                    |
| **HFT / new execution venue types** | **Out**                        | Not TRP.                                                                                                                            |
| **ABAC engine**                     | **Out unless justified later** | Attribute checks for live actions use existing gates. See Security Vision.                                                          |
| **Auto strategy rotation**          | **Out of Core**                | Future Strategy Selector. Version 3 may _select among certified envelopes_ with a human. It must not auto-rotate uncertified logic. |

---

## 3. Version 2 reuse (product-level)

Do not redesign without justification. Detail per subsystem is in the [Capability Inventory](./v3-capability-inventory.md) Part 6.

| Stance              | Meaning                                                 | Examples                                                                                                                                                        |
| ------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reuse unchanged** | Keep as certified Version 2 product                     | Strategy Library, Certification, Qualification, Market Profile, AI Analytics (local narratives), paper Execution Adapter, Orchestrator `createsSession = false` |
| **Minor extension** | New screens, flags, or live admission on the same owner | Gate (live), Deployment (live mission), Command Center (kill switch / live), Cluster (bind real adapter), Reporting (exporters)                                 |
| **Major extension** | Real I/O, durability, or productization of stubs        | Exchange Adapter, Notification transports, AI Gateway, Identity/Auth, Recovery (US295), analytical persistence                                                  |
| **Replace**         | None for trading SoT                                    | **No replacement** of Canonical Order Path, Ledger, Runtime evaluator, or Library                                                                               |
| **New (justified)** | No existing owner                                       | Credential Vault; Billing (isolated); Connection Management _facade_ (not a SoT)                                                                                |

---

## 4. Customer journeys Version 3 adds

Version 2 canonical journey J-01…J-14 remains. Version 3 adds journeys; it does not delete J-01…J-14.

| ID    | Journey                                                                             | Wave when complete |
| ----- | ----------------------------------------------------------------------------------- | ------------------ |
| J3-01 | Secure sign-in (session, MFA-capable, no shared prefill)                            | W1                 |
| J3-02 | Admin assigns least-privilege role in a workspace                                   | W1                 |
| J3-03 | Connect Binance (or Bybit/OKX) from UI: vault → test → connected                    | W2 + W4            |
| J3-04 | Rotate an exchange or AI secret without SSH                                         | W2                 |
| J3-05 | See all connections and health in one place                                         | W2                 |
| J3-06 | Receive a real Telegram (or Email/Slack) notification                               | W5                 |
| J3-07 | Connect customer OpenRouter (or other AI) key                                       | W2 / W7            |
| J3-08 | Arm durable Kill Switch; confirm sessions cannot evaluate                           | W3                 |
| J3-09 | Run paper session on **real** public market data with vault unused for public paths | W4                 |
| J3-10 | Opt-in live session after ADR, Gate, human approval, audited order                  | W6                 |
| J3-11 | Inspect financial action audit for an order                                         | W6                 |
| J3-12 | Invite a teammate; they cannot see another workspace’s keys                         | W9                 |

Honesty rule (from Product UI Policy): if a journey step is not implemented, the UI must not present it as available.

---

## 5. Release intent (product, not git tags)

| Milestone              | Product meaning                                                                 | Waves   |
| ---------------------- | ------------------------------------------------------------------------------- | ------- |
| **V3 Core**            | Safe secrets, unified connections, durable ops, real venues, real notifications | 1–5     |
| **V3 Live**            | Optional live capital on the canonical path                                     | 6 (ADR) |
| **V3 Platform**        | AI keys, knowledge durability, portfolio/risk/analytics products                | 7–8     |
| **V3 SaaS**            | Teams, admin, billing, developer access                                         | 9       |
| **Version 3 Complete** | Core + Live + Platform + SaaS + closeout                                        | 1–10    |

Billing may lag if the first customers are self-hosted operators. **V3 Core + V3 Live** is the earliest production-capital milestone. **Version 3 Complete** is defined in the Execution Roadmap success criteria and includes Wave 9–10 unless explicitly descoped at approval.

This plan does **not** descope Waves 9–10. Approval may split them into a named follow-on only by amending this roadmap.

---

## 6. What this roadmap refuses

- Version 3 as “enable Live Bots in the nav.”
- Version 3 as a microservices rewrite.
- Version 3 as an AI trading brain.
- Version 3 as Telegram remote control.
- Silent `.env` as the customer credential path.

---

**STOP.** Product direction only. Implementation waits for approval.
