# RC-25 — Market Qualification & Market Profile Integration Diagram

**Document:** Market Qualification & Market Profile Integration (RC-25)  
**Status:** APPROVED — Epic 2 LMD → Qualification → Profile read path active (awaiting review)  
**Date:** 2026-08-10  
**Nature:** Architecture mapping. Epic 2 activates observational read wiring.

**Parent:** [RC-25 Implementation Plan](./rc-25-implementation-plan.md)  
**API:** [API Contract](./rc-25-api-contract.md)  
**Domain:** [Domain Model Contract](./rc-25-domain-model-contract.md)  
**Epics:** [Epic Breakdown](./rc-25-epic-breakdown.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.3, §5.17  
**C4 context:** [V2 C4 Container Diagram](./v2-c4-container-diagram.md)  
**Isolation:** [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)

---

## 1. Integration principle

Market Qualification **evaluates**. Market Profile **describes**. Neither executes. Neither authorizes trading.

```text
Live Market Data (+ approved Research outputs)
        ↓  (read)
Market Qualification
        ↓  (publish version)
Market Profile
        ↓  (read only)
Future Trading Orchestrator / Reporting / AI Analytics
```

**There must be no reverse dependency into SoT command ports.**

- Qualification must not write Session lifecycle / Kill Switch.
- Profile must not expand Tactical Envelopes or certify strategies.
- Neither module must approve risk, submit orders, or mutate ledger.
- Neither module must replace Runtime Enforcement or Strategy Library.
- Profiles adjust confidence; they do not move balances.

**Qualification evaluates. Profiles describe. Neither trades.**

---

## 2. Authority classes on this diagram

| Element                  | Class                          | Role in RC-25                                |
| ------------------------ | ------------------------------ | -------------------------------------------- |
| Live Market Data         | **SoT** (ingress observations) | Consumed read-only                           |
| Research outputs         | **SoT** (research bodies)      | Consumed read-only where approved            |
| Market Qualification     | **Research artifact SoT**      | Runs, state, confidence, health              |
| Market Profile           | **Research SoT** (versions)    | Versioned venue artifacts                    |
| Trading Orchestrator     | **Future consumer**            | **Not built** — may later read confidence    |
| Reporting / AI Analytics | **Projection / Narrative**     | **Not redesigned** — may later read profiles |
| Market State             | **Future**                     | **Not built** — distinct from Profile        |
| Runtime Enforcement      | **Gate**                       | **Untouched**                                |
| Strategy Library         | **SoT**                        | **Untouched**                                |
| Trading Session          | **SoT** (lifecycle)            | **No direct interaction**                    |
| Ledger / Fills / Orders  | **SoT**                        | Untouched                                    |
| Knowledge Lake           | **Projection**                 | Optional markers only                        |

---

## 3. Required topology (normative)

### 3.1 Primary chain

```text
┌──────────────────────────┐
│    LIVE MARKET DATA      │  Ingress observations
│  (+ Research outputs*)   │  *approved reads only
└────────────┬─────────────┘
             │ LiveMarketDataReadPort / ResearchOutputReadPort
             ▼
┌──────────────────────────┐
│  MARKET QUALIFICATION    │  Evaluate
│  Runs / State            │
│  Confidence / Health     │
└────────────┬─────────────┘
             │ publish (on success)
             ▼
┌──────────────────────────┐
│     MARKET PROFILE       │  Describe (versioned)
│  Volatility / Liquidity  │
│  Trend / Structure         │
└────────────┬─────────────┘
             │ query (read only)
             ▼
┌──────────────────────────┐
│ FUTURE CONSUMERS         │
│ Orchestrator (RC-26)     │
│ Reporting / AI (RC-24)   │
└──────────────────────────┘
```

### 3.2 Venue keying

```text
Exchange Scope (venue)
   └── QualificationTarget (marketSymbol)
         ├── QualificationState / Confidence / Health
         └── MarketProfile versions (immutable)
```

Profiles are keyed by venue/market. Cross-scope mixing is forbidden without explicit read models (none in RC-25).

### 3.3 Explicit non-edges (forbidden)

```text
FORBIDDEN:
  Qualification ──command──▶ Trading Session / Bot Facade
  Qualification ──authorize──▶ Deployment / Session start
  Qualification ──replace──▶ Runtime Enforcement Gate
  Qualification ──certify──▶ Strategy Library
  Profile ──force──▶ exchange / strategy choice
  Profile ──expand──▶ Tactical Envelope
  Profile ──classify──▶ Market State (live selection engine)
  Qualification/Profile ──approve──▶ Risk
  Qualification/Profile ──submit──▶ Orders / Execution
  Qualification/Profile ──mutate──▶ Ledger
  Qualification/Profile ──redesign──▶ Reporting / AI / Lake
  Orchestrator ──built in──▶ RC-25   (Orchestrator is future)
```

---

## 4. Interaction notes

### 4.1 Live Market Data → Qualification

- One-way read.
- Connectivity health and observations inform evaluation.
- Provider payloads stay in adapters; domain fields are platform-owned mappings.

### 4.2 Research outputs → Qualification

- Optional approved reads.
- Empty research is valid for MVP qualification paths.
- No write-back into Lab ownership.

### 4.3 Qualification → Profile

- Successful evaluation may publish a new immutable profile version.
- Failed/cancelled runs publish nothing.
- Requalification creates a new version; old versions remain.

### 4.4 Profile → future Orchestrator / Reporting / AI

- Read-only confidence and profile descriptors.
- Consumers may use confidence as **input**; they must not treat Profile as Risk/Execution SoT.
- RC-25 does not implement Orchestrator selection logic.

### 4.5 Session / Enforcement / Library

- No edges into Session command ports.
- Runtime Enforcement remains Gate SoT for deployment validation.
- Strategy Library remains certification/eligibility SoT.

---

## 5. Spec alignment

| Spec section                           | Diagram coverage                                |
| -------------------------------------- | ----------------------------------------------- |
| §5.3 Market Qualification / Profile    | Primary chain + ownership                       |
| §5.17 Live Market Data                 | Upstream consume edge                           |
| §5.5 Trading Orchestrator              | Future consumer only — not built                |
| §5.4 Market State                      | Explicit non-edge / deferred                    |
| Authority Matrix Profile row           | Research SoT for versions; never force trades   |
| Alias Dictionary Qualification/Profile | User-triggered; confidence input; no auto-spend |
| Cluster Isolation #10                  | Per-venue profile versions; no balance movement |

---

## 6. Residual / deferred on this diagram

| Item                           | Disposition                          |
| ------------------------------ | ------------------------------------ |
| Trading Orchestrator product   | RC-26                                |
| Market State classifier        | Later (with Orchestrator)            |
| Multi-Exchange second adapter  | RC-27 (uses Qualification/Profile)   |
| Qualification / Profile UI     | After ports; UI Contract if approved |
| REST / transport product       | After ports                          |
| Production requalify schedules | Deferred product policy              |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
