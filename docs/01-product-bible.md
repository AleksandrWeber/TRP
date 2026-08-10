# Trading Research Platform — Product Bible

**Version:** 1.2  
**Status:** Approved (slim)  
**Level-0 Product Vision:** [`project/trp-product-vision.md`](./project/trp-product-vision.md)  
**Level-0 UX Vision:** [`project/trp-ux-vision.md`](./project/trp-ux-vision.md)  
**Level-1 engineering source of truth:** [`CANONICAL.md`](./CANONICAL.md)

This bible expands product intent. Where it conflicts with the Level-0 Product
Vision, the Product Vision wins. Stack / stages / MVP remain CANONICAL.

---

## Vision

> Normative Level-0 statement: [`project/trp-product-vision.md`](./project/trp-product-vision.md).

TRP is an engineering-first research environment for discovering, validating, and (when earned) deploying quantitative trading strategies.

Core question:

> Does this strategy have a statistically significant edge under realistic assumptions?

Cryptocurrency (Binance) is the first market — not the product ceiling.

---

## Mission

Replace intuition-driven trading with evidence-driven decisions.

```
Hypothesis → Historical validation → Statistical validation
  → Report / knowledge → (optional) Production → Feedback
```

Nothing reaches production without validation and human approval.

---

## Product principles

1. **Research before execution**
2. **Evidence over opinion**
3. **Mathematics before AI** — deterministic logic first; AI explains and assists
4. **AI never controls capital** — OpenRouter Gateway only in V1
5. **Risk overrides profit**
6. **Human authority** for deployment and capital
7. **Knowledge compounds** — experiments are immutable and searchable
8. **One responsibility per subsystem**

Immutable detail: [`00-architecture-principles.md`](./00-architecture-principles.md)

---

## What TRP is not

- Signal-selling or copy-trading service
- Autonomous AI trading bot
- HFT / market-prediction oracle
- Self-modifying production software
- Multi-tenant SaaS (V1)

---

## Target users (V1)

Primary: solo quantitative researcher / engineer building one serious pipeline.

Not optimized for beginners, social trading, or “get rich quick” audiences.

---

## Core loop (V1)

```
Market data (OHLCV)
  → Strategy
  → Backtest (+ fees / slippage)
  → Validation
  → Report + experiment record
  → [Stage 1] Signal → Exchange adapter → Execution history
```

---

## Stages

| Stage            | Deliverable                                          |
| ---------------- | ---------------------------------------------------- |
| **0 Research**   | Reproducible research pipeline + report              |
| **1 Production** | Approved strategy can signal and execute via adapter |
| **Future**       | See [`future/`](./future/)                           |

---

## Success criteria

**Research:** reproducible experiments, standardized validation, searchable results.  
**Engineering:** modular monolith, tests, stable APIs.  
**Trading (later):** robustness and capital preservation over peak returns.  
**MVP:** pipeline integrity — not profitability. See [`CANONICAL.md`](./CANONICAL.md).

---

## Deferred product ideas

Market State Engine, Strategy Selector, multi-exchange, portfolio, AI Scientist, SHIELD, plugin marketplace, RAG — all in [`future/`](./future/).
