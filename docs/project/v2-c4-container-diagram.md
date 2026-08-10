# TRP V2 — C4 Container Diagram (Context for Spec)

**Document:** V2 C4 Container Diagram (high level)  
**Status:** **Approved** (2026-08-10)
**Date:** 2026-08-10  
**Level:** C4 **Container** — one diagram, no class/component detail  
**Rule:** Conceptual marriage of RC-18 path and V2 product surfaces. Not a deployment topology.

Related: [Freeze Preconditions](./v2-freeze-preconditions.md), [Architecture Glossary](./v2-architecture-glossary.md).

---

## Purpose

Give Spec v2.0 authors a single shared picture of containers and main flows before writing prose.

---

## Container diagram

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         TRP (Modular Monolith)                           │
│                                                                          │
│  ┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐   │
│  │  Research Lab   │────▶│ Strategy Library │────▶│    Trading       │   │
│  │  (Campaigns,    │     │ (certified       │     │  Orchestrator    │   │
│  │   Backtest, WF) │     │  strategies +    │     │  (select/tactic  │   │
│  └────────┬────────┘     │  envelopes)      │     │   coordination)  │   │
│           │              └──────────────────┘     └─────────┬────────┘   │
│           │                                                   │          │
│           │              ┌──────────────────┐                 │          │
│           │              │ Market State +   │─────────────────┘          │
│           │              │ Market Profiles  │  (confidence inputs)       │
│           │              └──────────────────┘                            │
│           │                                                   │          │
│           │                                                   ▼          │
│           │              ┌──────────────────┐     ┌──────────────────┐   │
│           │              │  Risk Engine     │◀────│ Trading Session  │   │
│           │              │  (+ Exchange     │     │ (UI: Bot)        │   │
│           │              │   Risk Policy)   │     │ Strategy Runtime │   │
│           │              └────────┬─────────┘     └─────────┬────────┘   │
│           │                       │                         │            │
│           │                       ▼                         │            │
│           │              ┌──────────────────┐               │            │
│           │              │ Orders →         │◀──────────────┘            │
│           │              │ Execution Engine │                            │
│           │              └────────┬─────────┘                            │
│           │                       │                                      │
│           │                       ▼                                      │
│           │              ┌──────────────────┐     ┌──────────────────┐   │
│           │              │ Exchange Scope   │────▶│ Exchange Adapter │   │
│           │              │ (UI: Cluster)    │     │ (paper now)      │   │
│           │              │ Accounts/Wallet  │     └──────────────────┘   │
│           │              └────────┬─────────┘                            │
│           │                       │                                      │
│           │                       ▼                                      │
│           │              ┌──────────────────┐                            │
│           │              │ Fill → Position  │                            │
│           │              │ → Ledger (SoT)   │                            │
│           │              │ → Portfolio      │                            │
│           │              └────────┬─────────┘                            │
│           │                       │                                      │
│           ▼                       ▼                                      │
│  ┌──────────────────────────────────────────┐     ┌──────────────────┐   │
│  │         Knowledge Lake (projection)      │────▶│ Reporting + AI   │   │
│  │  research + trading events (append-only) │     │ (narrative)      │   │
│  └──────────────────────────────────────────┘     └──────────────────┘   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Command Center / Dashboard (UI projections + command entry only)   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Primary flow (happy path)

```text
Research Lab
  → Strategy Library
  → Trading Orchestrator
  → Trading Session / Strategy Runtime
  → Risk Engine
  → Orders → Execution Engine
  → Exchange Scope → Adapter
  → Ledger (SoT)
  → Knowledge Lake → Reporting / AI
```

Operator path: **Command Center** issues pause/stop/kill/tactic-select commands into Session / Risk ports — it does not sit on the SoT path.

---

## What this diagram deliberately omits

- Class/module file layout
- Outbox/Inbox / recovery internals (RC-17/18)
- Multi-workspace tenancy details
- Telegram as a separate container (notification channel only)
- Live-capital specifics (future ADR)

---

## Reading rules

1. Arrows are logical dependency / data direction, not network hops.
2. Exchange Scope isolates venue resources; engines above it stay shared.
3. Knowledge Lake and Reporting sit **beside** the money path as projections/narrative.
4. If Spec v2.0 prose conflicts with this diagram, update both together.

---

## Approval

- [ ] Container set accepted
- [ ] Primary flow accepted
- [ ] Ready as input to Architecture Specification v2.0
