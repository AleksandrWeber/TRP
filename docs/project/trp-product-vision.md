# TRP — Product Vision

**Document:** Product Vision  
**Authority level:** **Level-0** (project product authority)  
**Status:** Approved  
**Date recorded:** 2026-08-10  
**Scope:** Product purpose, mission, principles, users, success criteria  
**Does not redefine:** Architecture Freeze (ADR-012…ADR-019), stack, stages, or MVP engineering constraints

Related:

- [UX Vision](./trp-ux-vision.md) — Level-0 experience authority
- [CANONICAL](../CANONICAL.md) — Level-1 engineering source of truth (stack / stages / MVP)
- [Architecture Principles](../00-architecture-principles.md) — immutable engineering principles
- [Product Bible](../01-product-bible.md) — expanded product intent (subordinate to this Vision)
- [ADR Index](../adr/README.md)

---

## Authority

This document is **Level-0 project product authority**.

| Rule                     | Binding                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| Future ADRs              | Must not contradict this Vision; cite it when product intent is material                      |
| Epic / Release Plans     | Must align scope and success language with this Vision                                        |
| Story Specifications     | Must reference this Vision where product value / non-goals are material                       |
| Conflicts with UX Vision | Resolve product “what/why” here; experience “how it feels/works” in UX Vision                 |
| Conflicts with CANONICAL | Stack, stages, MVP constraints, and reproducibility rules remain CANONICAL                    |
| Conflicts with ADRs      | Architecture ownership and Freeze remain ADR authority; Vision does not redesign architecture |

This Vision consolidates already approved product intent. It does **not** invent new product direction, reopen Architecture Freeze, or authorize real-capital trading.

---

## Vision statement

TRP is an engineering-first **Research Operating System** for discovering, validating, explaining, and (when earned) deploying quantitative trading strategies.

Core question:

> Does this strategy have a statistically significant edge under realistic assumptions?

Cryptocurrency (Binance) is the first market — not the product ceiling.

TRP is **not** a trading bot, an AI trader, an HFT system, a signal-selling service, or a consumer “get rich quick” product.

Knowledge is the primary product. Trading is one controlled application of that knowledge.

---

## Mission

Replace intuition-driven trading with evidence-driven decisions.

```text
Hypothesis → Historical validation → Statistical validation
  → Report / knowledge → (optional) Production → Feedback
```

Nothing reaches production without validation and human approval.

---

## Product principles

1. **Research before execution**
2. **Evidence over opinion**
3. **Mathematics before AI** — deterministic logic first; AI explains and assists
4. **AI never controls capital** — OpenRouter Gateway only in V1 scope
5. **Risk overrides profit**
6. **Human authority** for deployment and capital
7. **Knowledge compounds** — experiments are immutable and searchable
8. **One responsibility per subsystem**
9. **Reproducibility is mandatory** — untrusted results that cannot be reproduced
10. **Pipeline integrity over profitability** for MVP / release acceptance where so defined

Immutable engineering detail: [`00-architecture-principles.md`](../00-architecture-principles.md).  
Stack / stages / MVP constraints: [`CANONICAL.md`](../CANONICAL.md).

---

## What TRP is not

- Signal-selling or copy-trading service
- Autonomous AI trading bot
- HFT / market-prediction oracle
- Self-modifying production software
- Multi-tenant SaaS / RBAC teams (V1)
- Real-capital / leveraged trading without a future ADR

Deferred concepts remain in [`docs/future/`](../future/) and do not become implied scope.

---

## Target users (V1)

**Primary:** solo quantitative researcher / engineer building one serious research → validation → (optional) paper production pipeline.

**Not optimized for:** beginners, social trading, or speculative consumer audiences.

Operator / production-readiness surfaces (recovery status, Kill Switch productization, incident UX) serve the same professional user and remain governed by release epics (e.g. E19) without changing this Vision.

---

## Core product loop

```text
Market data (OHLCV)
  → Strategy
  → Backtest (+ fees / slippage)
  → Validation
  → Report + immutable experiment record
  → [Stage 1] Signal → Exchange adapter → Execution history
```

Always-on paper trading and production recovery extend Stage 1 under frozen ADRs; they do not replace the research-first loop.

---

## Success criteria

| Lens                     | Success means                                                           |
| ------------------------ | ----------------------------------------------------------------------- |
| **Research**             | Reproducible experiments, standardized validation, searchable knowledge |
| **Engineering**          | Modular monolith, tests, stable APIs, Freeze-respecting architecture    |
| **Trading (controlled)** | Robustness and capital preservation over peak returns; paper-first      |
| **MVP / acceptance**     | Pipeline integrity — **not** profitability (see CANONICAL)              |

---

## Relationship to architecture and releases

- Architecture Freeze (ADR-012…ADR-019) implements this Vision’s safety and evidence rules; Vision does not override ADRs.
- Release Plans express phased delivery of this Vision (research OS → paper production readiness → operational readiness).
- Product Vision does **not** authorize redesign of Recovery, Runtime, Orders, Risk, Execution, Accounting, or Canonical Order Path.

---

## Source lineage (approved)

Consolidated from approved project documents (no new product invention):

| Source                                                              | Contribution                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`01-product-bible.md`](../01-product-bible.md)                     | Vision, mission, principles, users, loop, non-goals                 |
| [`00-architecture-principles.md`](../00-architecture-principles.md) | Research OS framing; knowledge-as-product                           |
| [`CANONICAL.md`](../CANONICAL.md)                                   | MVP acceptance posture; stage framing (engineering remains Level-1) |

---

## Maintenance

1. Update this file when product purpose / users / non-goals change — not for feature lists.
2. Do not duplicate ADR text here.
3. Prefer linking this Vision from ADRs, Epics, Release Plans, and Story Specs over restating it.
4. UX experience rules live in [`trp-ux-vision.md`](./trp-ux-vision.md).
