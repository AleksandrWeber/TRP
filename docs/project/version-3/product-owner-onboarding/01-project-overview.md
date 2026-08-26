# 01 — Project Overview

**Audience:** Permanent AI Product Owner / Chief Architect
**Nature:** Internal onboarding reference only
**Authority:** Subordinate to [`../version-3-master-plan.md`](../version-3-master-plan.md)
**Do not:** treat this file as a Master Plan revision or planning source of truth

---

## What product is being built

TRP is an engineering-first **Research Operating System**. Knowledge is the primary product. Trading is one controlled application of that knowledge.

**Version 3** is the **production** Research Operating System: the certified Version 2 paper-first product, extended so a professional can protect financial assets, connect real services without `.env`, and — when earned — apply certified knowledge to live capital.

Version 3 is **not**:

- Version 2.1 (polish-only)
- a rewrite of Version 2
- a second trading engine
- an autonomous AI trader
- a consumer brokerage or get-rich-quick product

```text
Sign in securely
  → isolated workspace
  → connect exchange / notifications / AI in the product
  → research → certify → Gate → deploy → orchestrate
  → paper session (default) or live session (opt-in, audited, kill-switch armed)
  → reports, knowledge, real alerts
  → Command Center
```

**Sources:** [`../version-3-master-plan.md`](../version-3-master-plan.md) §1 · [`../v3-vision.md`](../v3-vision.md) · [`../../trp-product-vision.md`](../../trp-product-vision.md)

---

## Target customers

| Customer                | Need                                                                    |
| ----------------------- | ----------------------------------------------------------------------- |
| Quantitative researcher | Certified lab + durable knowledge + own AI keys                         |
| Trading operator        | Honest connections, paper (and later live) sessions, kill switch, audit |
| Workspace administrator | Vaulted connections, roles, least privilege                             |
| Small research team     | Shared workspace, no shared `.env`                                      |

**Not for:** beginners, social trading, get-rich-quick audiences.

Version 3 **extends** the solo-researcher audience to professional operators and small teams. It does not become multi-tenant consumer SaaS as the product identity.

**Sources:** Master Plan §1 · Vision §2

---

## Business goals

1. Make financial-asset protection a **product** (Security Platform).
2. Let customers connect venues, channels, and AI **without servers or `.env`**.
3. Turn stubbed venues and reserved channels into **real, honest** integrations.
4. Allow **earned** live trading on the existing Canonical Order Path — never a second engine.
5. Raise production readiness off **40%** with durability, monitoring, and restart-safety.
6. Enable small-team SaaS (roles, admin, billing, APIs) **after** isolation works.

**Source:** Master Plan §1

---

## Product philosophy

| Stance                            | Meaning                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| Research before execution         | Knowledge compounds; trading applies certified knowledge                                      |
| Paper first                       | New trading capability is proven on paper before live                                         |
| Live must be earned               | Live opens only after Waves 1–4, live-capital ADR, certified strategy, Gate PASS, human start |
| Architecture is a constraint      | Do not redesign Version 2; reuse existing owners                                              |
| AI analyses and explains          | AI never decides, approves, sizes, or starts trades                                           |
| Telegram is never a control plane | Notifications inform; they do not control capital                                             |

**Sources:** Master Plan Product Principles · Vision §5 · Product Roadmap §1

---

## Honest Product principles

Binding Version 3 Product Principles (Master Plan):

| Principle                        | Meaning                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Customer First**               | Any customer feature must be usable by an ordinary operator without SSH, Docker, or editing `.env`. Host infrastructure (database URL, JWT signing) may remain server-operated. |
| **Security Before Convenience**  | Convenience never outranks protection of financial assets. Fail closed.                                                                                                         |
| **One Source of Truth**          | Do not create duplicate domains or parallel mechanisms for money, lifecycle, risk, or certification.                                                                            |
| **Paper First**                  | New trading capability is proven on paper before it is offered live.                                                                                                            |
| **Live Must Be Earned**          | Live Trading opens only after the required checks: Waves 1–4, live-capital ADR, certified strategy, Gate PASS, human start.                                                     |
| **Honest Product**               | If the system cannot do something, it says so. Never show **Connected** for a simulation.                                                                                       |
| **AI Never Controls Capital**    | AI analyses and explains. It does not decide, approve, size, or start trades.                                                                                                   |
| **Everything Is Auditable**      | Every action that can affect a financial result must be attributable and traceable.                                                                                             |
| **No Hidden Configuration**      | Integrations the customer needs are eventually configured in the product UI.                                                                                                    |
| **Architecture Is a Constraint** | A new feature must not break or duplicate existing architecture without an official decision (Master Plan revision and, where required, ADR).                                   |

Honest Product verification in reviews means: no fake Connected, no simulated venue success presented as live, no developer-only path accepted as the customer path, and explicit “customer does NOT receive” boundaries.

**Sources:** Master Plan Product Principles · [`../version-3-product-checklist.md`](../version-3-product-checklist.md)

---

## Current maturity

| Field                         | Documented baseline                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| Version 2                     | **CERTIFIED** (`v2.0.1`); architecture Spec v2.0 frozen                                                 |
| Paper-first product readiness | **99%** (Audit v2)                                                                                      |
| Production readiness          | **40%** (Audit v2) — Version 3 exists to raise this                                                     |
| Architecture readiness        | **100%** (Spec v2.0 frozen)                                                                             |
| Version 3 planning            | **FROZEN** (Master Plan 2026-08-16)                                                                     |
| Wave 1 Security Foundation    | **CERTIFIED COMPLETE** (Product Owner authority)                                                        |
| Wave 2 Connection Management  | **In progress** — W2-S01…S03 CLOSED; W2-S04 active (see [`08-current-state.md`](./08-current-state.md)) |
| Live capital                  | **Unauthorized** until future Wave 6 ADR                                                                |

The Master Plan’s historical “Version 3 implementation: Not started” row is a freeze-time snapshot. Operational status for Closed packages and the current wave is recorded in Wave completion / progress documents — not by rewriting the Master Plan.

**Sources:** Master Plan § Current status · [`../version-3-wave-1-completion-report.md`](../version-3-wave-1-completion-report.md) · [`../wave-2/wave-2-progress.md`](../wave-2/wave-2-progress.md)

---

## Long-term roadmap

Release intent (product milestones, not git tags):

| Milestone              | Meaning                                                                         | Waves   |
| ---------------------- | ------------------------------------------------------------------------------- | ------- |
| **V3 Core**            | Safe secrets, unified connections, durable ops, real venues, real notifications | 1–5     |
| **V3 Live**            | Optional live capital on the canonical path                                     | 6 (ADR) |
| **V3 Platform**        | AI keys, knowledge durability, portfolio/risk/analytics products                | 7–8     |
| **V3 SaaS**            | Teams, admin, billing, developer access                                         | 9       |
| **Version 3 Complete** | Core + Live + Platform + SaaS + closeout                                        | 1–10    |

Execution waves (names only — detail in [`09-future-roadmap.md`](./09-future-roadmap.md)):

1. Security Foundation
2. Connection Management
3. Durability, operations, continuity
4. Exchange Connectivity
5. Notification Platform
6. Live Trading
7. AI & Knowledge
8. Portfolio, Risk, Analytics
9. Workspace SaaS
10. Closeout

**Live gate:** Waves **1 + 2 + 3 + 4** complete **and** live-capital ADR before Wave 6.

**Sources:** [`../v3-product-roadmap.md`](../v3-product-roadmap.md) · Master Plan §4 · [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md)

---

## Governing documents (read order)

1. [`../version-3-master-plan.md`](../version-3-master-plan.md) — Product Owner canon
2. [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md) — process
3. [`../v3-vision.md`](../v3-vision.md) · [`../v3-product-roadmap.md`](../v3-product-roadmap.md) · [`../v3-security-vision.md`](../v3-security-vision.md)
4. [`../../trp-architecture-specification-v2.md`](../../trp-architecture-specification-v2.md) — frozen constitution
5. This onboarding folder for review workflow consistency

Conflicts: **Master Plan wins.**

---

**STOP.** This overview does not authorize implementation, scope changes, or Master Plan edits.
