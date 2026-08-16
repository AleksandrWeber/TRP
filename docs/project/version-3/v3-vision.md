# Version 3 Vision

**Document:** Version 3 Vision  
**Date:** 2026-08-16  
**Status:** Annex — planning **FROZEN** in [`version-3-master-plan.md`](./version-3-master-plan.md)  
**Authority after Master Plan acceptance:** Product intent for Version 3 (subordinate to Level-0 Product Vision unless that Vision is explicitly updated)  
**Does not:** implement, amend Spec v2.0, reopen RC-19…RC-28, or authorize live capital

Related: [Master Plan](./version-3-master-plan.md) · [Product Roadmap](./v3-product-roadmap.md) · [Security Vision](./v3-security-vision.md) · [Connection Management Vision](./v3-connection-management-vision.md)

---

## 1. What Version 3 is

Version 3 is the **production Research Operating System**.

Version 2 certified a paper-first customer product on a frozen architecture: a professional can research, certify, gate, deploy, orchestrate, run a paper Trading Session, read reports, and operate from Command Center.

Version 3 extends that certified platform so the same professional can:

1. **Protect financial assets** with a Security Platform (authentication, authorization, vault, audit, OWASP).
2. **Connect real external services** through a unified Connection Management product — without editing `.env` or restarting a server.
3. **Execute on real venues** through existing Exchange Adapters and the Canonical Order Path — paper by default, live only when earned.
4. **Operate as production software**: durable stores, real notification transports, monitoring, kill switch, restart-safety.

Version 3 is still TRP.

It is still a Research Operating System. Knowledge remains the primary product. Trading remains one controlled application of that knowledge. Nothing reaches live capital without validation and human approval.

Version 3 is **not**:

- a rewrite of Version 2
- a second trading engine
- an autonomous AI trader
- a consumer “get rich quick” product
- a signal-selling or copy-trading service
- Version 2.1 (polish-only)

```text
Version 1    Research OS (production-ready laboratory)
Version 2    Paper-first customer product on frozen architecture   CERTIFIED
Version 3    Production platform: security, connections, live when earned
```

---

## 2. Who it is for

### Primary users

| User                        | What they need from Version 3                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Quantitative researcher** | The Version 2 laboratory, plus durable knowledge and customer-owned AI keys.                                             |
| **Trading operator**        | Command Center for paper and, when authorized, live sessions — with kill switch, audit, and honest connection health.    |
| **Workspace administrator** | Ability to connect exchanges, notification channels, and AI providers per workspace; manage members and least privilege. |
| **Small research team**     | Shared workspace with roles, isolation, and no shared `.env` secrets.                                                    |

### Who it is still not for

Beginners, social traders, and speculative consumer audiences. The UX Vision still requires a professional engineering tool, not a retail brokerage skin.

Version 1/V2 Product Vision named a **solo** researcher. Version 3 **extends** that audience to a professional operator and a small team. It does not replace the researcher, and it does not become multi-tenant consumer SaaS as the product identity.

---

## 3. What business problems it solves

These problems are already documented. Version 3 does not invent them.

| Problem                                              | Evidence                                                                                                 | Version 3 answer                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| A paying customer cannot self-serve real connections | [Connection Management Audit](../version-2-connection-management-audit.md): secrets in `.env` or missing | Unified Connection Management + Credential Vault                 |
| Production readiness is 40%                          | [Audit v2](../product-readiness-audit-v2.md)                                                             | Security, durability, real transports, live path                 |
| Live capital is unauthorized even after paper proof  | Paper Freeze ADR-012…018; residual `live-capital` (TD-052)                                               | Live Trading wave **after** security + connections + ADR         |
| Venue I/O is stubbed                                 | TD-051; simulated `CONNECTED` without keys                                                               | Real BINANCE / BYBIT / OKX (and Kraken) through existing factory |
| Telegram and other channels are not production       | TD-049, TD-050                                                                                           | Notification Platform on existing catalog                        |
| Financial assets will be managed                     | Product purpose + live residual                                                                          | Security Platform as a primary objective                         |
| Restart can drop analytical artifacts                | TD-048                                                                                                   | Durable persistence of existing aggregates                       |
| Production restart-safety is incomplete              | TD-036 / US295 / ADL-008                                                                                 | Close the residual before claiming live restart-safety           |

---

## 4. What distinguishes Version 3 from Version 2

| Version 2 (certified)                                           | Version 3 (planned)                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------ |
| Paper-first customer product                                    | Production platform with paper default and optional live     |
| Durable login, workspace, certified paper loop                  | Same loop, plus real venues and real delivery                |
| Roles exist in code (`Reader`, `Researcher`, `Trader`, `Admin`) | RBAC as a product; least privilege on financial actions      |
| No secret vault; OpenRouter in `.env`                           | Credential Vault; workspace-scoped customer secrets          |
| Simulated exchange connect; no API keys                         | Real credentials, test, health, rotation, disconnect         |
| In-memory Telegram; reserved channels inactive                  | Production Telegram + Email / Slack / Discord / Teams / Push |
| Live Bots hidden                                                | Live Bots offered only after ADR + Gate + human approval     |
| Production readiness 40%                                        | Production readiness is a Version 3 success criterion        |
| Architecture 100% frozen                                        | Architecture reused; ADRs only where justified               |

### Major capabilities that do not exist as products in Version 2

1. **Security Platform** — mandatory strategic product.
2. **Connection Management** — unified operator product.
3. **Credential Vault** — customer secrets encrypted at rest.
4. **Live Trading** — earned, fail-closed, human-authorized.
5. **Real exchange connectivity** — fill stubbed adapters; do not clone engines.
6. **Notification Platform activation** — reserved channels become real.
7. **Customer-owned AI connections** — OpenRouter plus optional direct providers.
8. **Production operations** — kill switch, monitoring, durable queues, recovery residual.

---

## 5. Non-negotiable continuations from Version 2

These remain true. Version 3 does not reopen them.

| Rule                                             | Source                    |
| ------------------------------------------------ | ------------------------- |
| Research before execution                        | Product Vision            |
| Knowledge is the primary product                 | Product Vision / Spec §1  |
| Mathematics before AI; AI never controls capital | Spec §2                   |
| Human authority for deployment and capital       | Product Vision            |
| One Canonical Order Path                         | Spec §3                   |
| Orchestrator does not create Sessions            | Authority Matrix          |
| UI is not Source of Truth                        | Authority Matrix          |
| Telegram is delivery only, never a control plane | PC-07 / certification     |
| Runtime never invents strategy logic             | Tactics Contract Option B |
| Evolution instead of rewrite                     | Spec §2                   |

---

## 6. Justified architecture change vs reuse

Version 3 prefers **product facades and adapter completion** over new domains.

| Change                             | Verdict                                 | Justification                                                                                                  |
| ---------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Credential Vault module            | **New, justified**                      | No owner stores customer secrets. Financial credentials cannot remain in `.env`. Vault is not a financial SoT. |
| Connection Management product      | **New facade, justified**               | Same pattern as Command Center / Cluster: one operator surface over existing owners.                           |
| Security Platform product          | **Major extension of Identity/Auth**    | Roles, JWT, helmet, rate limit, ValidationPipe already exist. Productize and harden. Not a new trading domain. |
| Live capital                       | **Requires ADR**                        | Already declared by Paper Freeze. Does not create a parallel execution stack.                                  |
| Real venue I/O                     | **Major extension of Exchange Adapter** | Stubs exist (`BINANCE`, `BYBIT`, `OKX`). Fill I/O. RC-27 already isolated venues.                              |
| Billing / teams                    | **New, isolated**                       | No trading SoT. Wave 9 is in Version 3 Complete. Not required to start Waves 1–6.                              |
| ABAC engine                        | **Not justified**                       | RBAC + workspace membership + Runtime Enforcement Gate + live-enabled flag cover financial attributes.         |
| New Bot aggregate / new order path | **Forbidden**                           | Would redesign Version 2.                                                                                      |
| AI as Gate or capital authority    | **Forbidden**                           | Vision invariant.                                                                                              |

---

## 7. Success picture (customer)

A Version 3 customer can:

```text
Sign in (MFA-capable, durable session)
  → workspace (isolated; optional team roles)
  → connect exchange / Telegram / AI from UI (vault, test, health)
  → research → certify → Gate → deploy → orchestrate
  → paper session (default) or live session (opt-in, audited, kill-switch armed)
  → reports, Knowledge Lake, AI narrative
  → real notification delivery
  → Command Center operations
```

without SSH, `.env` edits, or a shared platform API key.

They still cannot: let AI spend money, trade an uncertified strategy, or treat Telegram as a remote control.

---

## 8. Relationship to original Product Vision

The Level-0 Vision remains the mission. Version 3 **promotes** items the Vision deferred past V1 (multi-user, real-capital via future ADR, markets beyond a single Binance paper path) without abandoning:

> Does this strategy have a statistically significant edge under realistic assumptions?

If Level-0 Vision text must name teams, vault, or live as in-scope, that is a **Vision amendment after this plan is approved** — not a silent contradiction. Until then, this Version 3 Vision is the planning intent.

---

**STOP.** This document does not authorize implementation.
