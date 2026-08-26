# 02 — Architecture Overview

**Audience:** Permanent AI Product Owner / Chief Architect
**Nature:** Internal onboarding reference only
**Authority:** Spec v2.0 + Master Plan reuse table; this file does not amend either
**Do not:** invent new bounded contexts or ownership from this document

---

## High-level architecture

TRP is a **NestJS modular monolith**. Product surfaces are facades, scopes, projections, or orchestration — not second engines.

**One Canonical Order Path** (paper today; live only when earned later):

```text
Market Event → Strategy Runtime → Signal Intent → Orders → Risk Engine
  → Execution Engine → Adapter → Fill → Position → Ledger → Portfolio
```

Building blocks (Version 2 constitution, reused by Version 3): Research Lab, Strategy Library, Orchestrator, Trading Session + Runtime, Risk, Orders → Execution → Adapter, Exchange Scope, Accounting (Ledger), Knowledge Lake, Reporting + AI Analytics, Command Center.

**Sources:** [`../../trp-architecture-specification-v2.md`](../../trp-architecture-specification-v2.md) · [`../../../adr/ADR-017-module-boundaries.md`](../../../adr/ADR-017-module-boundaries.md)

---

## Major bounded contexts and ownership

### Frozen Version 2 module direction (ADR-017)

```text
Live Market Data → Strategy Runtime → Orders → Risk
                                      ↓ approved
                              Execution Engine → Paper Adapter
                                      ↓
                                    Fills
                                      ↓
                         Positions → Ledger → Portfolio

Trading Session coordinates runtime lifecycle.
Audit observes durable facts.
Dashboard consumes APIs / read models only.
```

Selected **MUST NOT** rules (incomplete list — read ADR-017 for full tables):

| Module           | Must not                                               |
| ---------------- | ------------------------------------------------------ |
| Live Market Data | Create orders/fills; mutate Positions/Ledger/Portfolio |
| Strategy Runtime | Submit orders directly outside path                    |
| Risk             | Mutate Portfolio/Ledger                                |
| Paper Adapter    | Mutate domain state                                    |
| Dashboard        | Recalculate authoritative accounting                   |

### Version 3 owners (Master Plan §11)

| Area                              | Owner                                   | Must not own                    |
| --------------------------------- | --------------------------------------- | ------------------------------- |
| Security Platform / Vault / Audit | Identity/Auth + Vault module            | Orders, Ledger                  |
| Connection Management UI          | Connection Management facade            | Venue protocol, send()          |
| Exchange I/O                      | Exchange Adapter factory                | Cluster identity, Risk          |
| Exchange isolation                | Exchange Scope / Cluster                | API keys                        |
| Notifications                     | Notification Delivery                   | Trading commands                |
| AI HTTP                           | AI Gateway                              | Gate, capital                   |
| AI narratives                     | AI Analytics                            | Money                           |
| Knowledge warehouse               | Knowledge Lake                          | Financial SoT                   |
| Money                             | Ledger / Position                       | UI, reports                     |
| Risk decisions                    | Risk Engine                             | —                               |
| Session lifecycle                 | Trading Session                         | Orchestrator-created sessions   |
| Kill Switch                       | Session/Command Center product (V3-O04) | Telegram                        |
| Live policy enablement            | Admin + ADR                             | Trader self-serve without audit |
| Billing                           | Isolated billing                        | Order path                      |

### Justified new contexts (Version 3 only)

An implementation package may add persistence or ports **inside an existing owner**. It may **not** create a new bounded context unless the Master Plan already named it:

1. **Credential Vault**
2. **Connection Management facade** (not a Source of Truth for money or protocols)
3. **Billing** (isolated)

**Sources:** Master Plan §10–11 · [`../version-3-implementation-policy.md`](../version-3-implementation-policy.md) rule 9

---

## Product ownership boundaries

**Consume ≠ own.** Every package must name what it consumes, what it produces, and what it explicitly does not own. Ownership drift is an Architecture Review reject.

Rules that recur in Wave 1–2 packages:

- Vault owns secrets — never Connections or adapters.
- Authentication owns identity/sessions — never roles productization (RBAC) as a separate store of people identity.
- Authorization / People owns role assignment — not Vault or Connections.
- Workspace owns membership; Isolation proves the boundary — Isolation is not a new business product.
- Security Audit owns the audit store — consumers emit events; they do not own the store.
- Connection Management owns connection metadata/lifecycle/validation orchestration — not venue protocol I/O.
- Exchange Connectivity owns authenticated session proof outcomes — protocol I/O remains Exchange Adapter.
- Market Data owns adapters/normalization/projections — not orders or trading.
- Paper Trading owns paper orders/fills/positions/simulators — not live orders or fabricated prices.

Detail: [`03-product-map.md`](./03-product-map.md)

---

## Layering

| Layer                         | Role                                                       |
| ----------------------------- | ---------------------------------------------------------- |
| **Edge / HTTP**               | Transport only — authn/authz guards, validation, hardening |
| **Product facades / UI**      | Operator journeys; **not** Source of Truth                 |
| **Domain owners**             | Bounded contexts with exclusive fact families              |
| **Projections / read models** | Non-mutating views of owner facts                          |
| **Adapters**                  | Provider protocol I/O; do not become SoT                   |
| **Ledger / Risk / Gate**      | Financial and capital-protection SoTs / gates              |

Architecture Review always checks: **HTTP remains transport. UI remains not Source of Truth.**

**Sources:** [`../v3-execution-roadmap.md`](../v3-execution-roadmap.md) · [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md)

---

## Dependencies

Frozen dependency direction is ADR-017. Version 3 packages **extend** owners; they do not reverse arrows or invent parallel order paths.

Wave dependency pattern already demonstrated:

```text
Wave 1 Security Foundation
        ↓
W2-S01 Connection Management (consumes Vault, Authn, Authz, Isolation, Platform, Audit)
        ↓
W2-S02 Exchange Connectivity (consumes Connections + Wave 1)
        ↓
W2-S03 Market Data (consumes Exchange Connectivity + Connections + Wave 1)
        ↓
W2-S04 Paper Trading (consumes Market Data + prior Wave 2 + Wave 1)
```

Later waves consume earlier foundations. They must not reopen or redesign Closed packages by stealth.

**Sources:** ADR-017 · Wave 2 product-scope Consumes tables

---

## Transport independence

- HTTP is the product transport for operator APIs. It is not the domain model.
- Market Data: transport remains **adapter-local**; the public Market Data contract is **transport-independent** (W2-S03 Close stance).
- Provider payloads must not leak provider-specific shapes outside connector boundaries (ADR-017 Live Market Data MUST NOT).

**Sources:** W2-S03 close report · ADR-017 · Architecture checklist

---

## Provider independence

- **Markets as plugins:** core is not rewritten per venue (Spec modular architecture).
- Connection Management catalogs **Connection Types → Providers**; protocol owners remain Exchange Adapter / Notification Delivery / AI Gateway.
- Market Data normalizes Binance / Bybit / OKX into one product model; unavailable providers fail honestly.
- Capability metadata (Supported / Unsupported / Unavailable / Unknown) describes observation — not enablement of trading.

**Sources:** Spec v2.0 · [`../v3-connection-management-vision.md`](../v3-connection-management-vision.md) · W2-S01 / W2-S02 / W2-S03 product scope

---

## Architectural invariants (selected)

From [`../../../adr/ADR-018-architectural-invariants.md`](../../../adr/ADR-018-architectural-invariants.md):

- Orders sole Order aggregate owner; Execution Engine sole adapter entry.
- Paper Adapter must not mutate domain state; paper path must not submit real-capital orders.
- Ledger is sole financial Source of Truth; Position/Portfolio are rebuildable projections.
- Dashboard must not recalculate authoritative accounting.
- Workspace isolation: trading aggregates belong to one workspace; A must not appear in B.
- New execution paths, changed module ownership, or reversed dependencies **require a new ADR**.

---

## How the system is intended to evolve

| Stance              | Meaning                                          | Examples                                                                                                                                                  |
| ------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reuse unchanged** | Keep certified Version 2 product                 | Strategy Library, Certification, Qualification, Market Profile, paper Execution Adapter, Orchestrator `createsSession = false`, AI-never-controls-capital |
| **Minor extension** | Screens, flags, or admission on the same owner   | Gate (live), Deployment (live), Command Center (kill switch), Cluster (bind real adapter)                                                                 |
| **Major extension** | Real I/O, durability, or productization of stubs | Exchange Adapter I/O, Notification transports, AI Gateway keys, Identity/Auth, Recovery (US295)                                                           |
| **New (justified)** | No existing owner — already named in Master Plan | Credential Vault; Connection Management facade; Billing (isolated)                                                                                        |
| **Replace**         | **None** for trading SoT                         | Canonical Order Path, Ledger, Runtime evaluator, Library                                                                                                  |

Version 3 **extends** the platform. It must **not** redesign Version 2. Conflicts with frozen Spec / Matrix / Alias require Master Plan revision and, where required, ADR — never package-local invention.

**Sources:** Master Plan §10 · Product Roadmap §3 · Implementation Policy

---

## Security architecture stance (brief)

Security is a first-class product. Defense in depth:

```text
Edge → Authentication → Authorization → Domain gates (Runtime / Risk / Kill Switch)
  → Vault → Ledger → Audit
```

Fail closed. Least privilege. Secure by default (live off; paper default; disconnected until validated). Live capital still requires a future ADR.

Detail: [`../v3-security-vision.md`](../v3-security-vision.md) · [`../security-default-policy.md`](../security-default-policy.md)

---

## Cross-references

| Topic                  | Document                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Product ownership map  | [`03-product-map.md`](./03-product-map.md)                                                             |
| Process gates          | [`05-development-process.md`](./05-development-process.md)                                             |
| Architecture checklist | [`../version-3-architecture-checklist.md`](../version-3-architecture-checklist.md)                     |
| Module boundaries      | [`../../../adr/ADR-017-module-boundaries.md`](../../../adr/ADR-017-module-boundaries.md)               |
| Invariants             | [`../../../adr/ADR-018-architectural-invariants.md`](../../../adr/ADR-018-architectural-invariants.md) |

---

**STOP.** Architecture changes require Master Plan revision and, where required, ADR — not onboarding edits.
