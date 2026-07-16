# Trading Research Platform — Architecture (Stage 0–1)

**Version:** 1.1  
**Status:** Approved (slim)  
**Source of truth:** [`CANONICAL.md`](./CANONICAL.md)

Subsystem detail: [`Architecture/`](./Architecture/)

---

## Goals

Maintainable modular monolith that can grow without rewriting the core.

- Modularity and testability
- Explainability and reproducibility
- Fail-safe behavior around capital
- No premature microservices

---

## Principles (engineering)

1. Clean Architecture / domain independent of NestJS, Prisma, exchanges
2. Domain-driven language: Workspace → Project → Experiment → Strategy → Validation → Deployment
3. **Modular monolith first**
4. Explicit dependencies (DI)
5. Immutable research results
6. Human authority over production

Full philosophy: [`00-architecture-principles.md`](./00-architecture-principles.md)

---

## Context

```
User → TRP → Exchanges | OpenRouter | (optional tools)
```

TRP must keep working if AI is disabled.

---

## Layers

```
Presentation (React)
  → Application (NestJS use-cases / workflows)
  → Domain
  → Research & Validation engines
  → Infrastructure (Prisma, Redis when needed, exchange adapters, OpenRouter)
```

---

## Modules for V1

| Module              | Stage | Responsibility                              |
| ------------------- | ----- | ------------------------------------------- |
| Market Data         | 0     | OHLCV ingest / store / version              |
| Strategy framework  | 0     | Deterministic signal logic                  |
| Research Laboratory | 0     | Run experiments / backtests                 |
| Validation Engine   | 0     | Fees, slippage, robustness checks, verdict  |
| Knowledge (minimal) | 0     | Immutable experiment + report storage       |
| AI Gateway          | 0/1   | OpenRouter summaries — no trading authority |
| Production          | 1     | Signals → exchange adapter → execution log  |
| Risk (minimal)      | 1     | Hard limits before send                     |
| Dashboard           | 1     | Observe research + production               |

**Not in V1 active architecture:** Market State Engine, Strategy Selector, plugin marketplace, AI Scientist, SHIELD, RAG. See [`future/`](./future/).

---

## Research → Production flow

```
OHLCV → Strategy → Backtest → Validation → Report
                         ↓ (human approve)
              Signal → Risk check → Exchange Adapter → Record
```

Production for V1 is intentionally thin: **signal + adapter + history**.

---

## Data

- **Raw** market data — never silently rewritten
- **Research** — experiments, metrics, reports (immutable)
- **Production** — orders, fills, positions, incidents

Dataset identity for reproducibility: hash + metadata (see `CANONICAL.md`).

---

## Events (light)

Prefer domain events where they reduce coupling (`ExperimentCompleted`, `ValidationFinished`, `OrderSubmitted`).  
V1 may use in-process events; Redis Streams / BullMQ only when a real async boundary appears.

---

## Exchange adapters

Core never imports Binance SDK types into domain.  
One adapter (Binance) for MVP. Same interface later for others ([`future/`](./future/)).

---

## AI Gateway

- Provider: OpenRouter
- Role: explain, summarize, draft reports
- Never: place orders, change production params, approve deployment, hold exchange secrets

Former multi-agent design archived: [`future/007-AI-Research-Organization.md`](./future/007-AI-Research-Organization.md)

---

## Security (V1)

- JWT auth (single user is fine)
- Secrets in environment — never in git
- Audit important actions (deploy, key change)
- Least privilege to exchange keys

SHIELD is out of scope — [`future/`](./future/).

---

## Infrastructure

See [`CANONICAL.md`](./CANONICAL.md) and [`Architecture/020-Technology-Stack.md`](./Architecture/020-Technology-Stack.md).

- Docker Compose for local + simple deploy
- No Kubernetes / GraphQL / Kafka in V1

---

## Scaling stance

Vertical slice correctness first. Workers/queues only when measurements justify them. Microservices only if forced.

---

## Summary

Build a trustworthy research pipeline first; thin production second; defer speculative subsystems.  
When documents disagree, [`CANONICAL.md`](./CANONICAL.md) wins.
