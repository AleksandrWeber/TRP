# RC-26 Epic Breakdown — Trading Orchestrator & Market State

**Document:** RC-26 Epic Breakdown  
**Status:** CLOSED — Epics 1–6 approved; Validation PASS; tag `v1.0.0-rc26`  
**Date:** 2026-08-10  
**Nature:** Thin architectural epics. Each Epic must independently compile, test, and be reviewable.

**Parent:** [RC-26 Implementation Plan](./rc-26-implementation-plan.md)  
**API:** [API Contract](./rc-26-api-contract.md)  
**Domain:** [Domain Model Contract](./rc-26-domain-model-contract.md)  
**Integration:** [Integration Diagram](./rc-26-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.4, §5.5, §7  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md)  
**Predecessor:** [RC-25 CLOSED](./rc-25-closure-report.md)

---

## Release epic map

```text
Epic 1  Trading Orchestrator & Market State boundary + ownership
  ↓
Epic 2  Market State inputs (Live Market Data + Qualification + Profile reads)
  ↓
Epic 3  Market State domain + lifecycle ports
  ↓
Epic 4  Trading Orchestrator domain (plans / intent / lifecycle)
  ↓
Epic 5  Orchestrator workflow ports (Library / Gate / Session / Risk-read coordination)
  ↓
Epic 6  Consumer read ports + authority conformance + close readiness
  ↓
Validation & Release  (separate task after Epics)
```

Each Epic must independently compile and pass tests. Later epics must not start until upstream DoD is met (or explicitly gated). Story IDs allocated after plan approval ([story-id-allocation](./story-id-allocation.md)).

---

## Epic 1 — Trading Orchestrator & Market State boundary + ownership

### Objective

Establish Trading Orchestrator and Market State module boundaries and publish hard ownership vs Strategy Library, Runtime Enforcement, Market Qualification, Market Profile, Trading Session, Risk Engine, Orders, Execution, Reporting, and AI.

### Dependencies

- RC-25 CLOSED; Spec §5.4 / §5.5 / §7; Authority Matrix; Alias Dictionary; Tactics Contract; Cluster Isolation Invariants
- Implementation Plan §§3–5

### Definition of Done

- [x] Modules named and documented (canonical: **Trading Orchestrator**, **Market State** — not Execution Engine, not Qualification, not Gate, not Library).
- [x] Ownership table accepted: Market State owns current classification + lifecycle; Orchestrator owns workflow / selection sequencing / handoff intents; execution SoT owners unchanged.
- [x] Explicit: Market State describes; Orchestrator coordinates; neither executes / certifies / enforces / qualifies.
- [x] Explicit: Orchestrator never replaces participating-module ownership; Market State never becomes second Qualification.
- [x] Forbidden dependencies listed (no Orchestrator → Orders/Execution; no State → force trade; no selection outside Envelope).
- [x] Boundary tests / invariants compile and pass.
- [x] Architecture Impact: no new Spec concepts beyond already approved §5.4 / §5.5 modules.

**Epic 1 report:** [rc-26-epic1-trading-orchestrator-market-state-boundary.md](./rc-26-epic1-trading-orchestrator-market-state-boundary.md)  
**Boundary diagram:** [rc-26-epic1-boundary-diagram.md](./rc-26-epic1-boundary-diagram.md)

### Expected user value

Shared vocabulary: the platform can classify conditions and coordinate certified strategy application — it does not invent strategies or execute orders from Orchestrator.

---

## Epic 2 — Market State inputs (Live Market Data + Qualification + Profile reads)

### Objective

Wire Market State as a **consumer** of Live Market Data, Market Qualification consumer reads, and Market Profile consumer reads. State observes and maps — no classification publish product yet (domain/lifecycle in Epic 3). No Session commands. No Orchestrator selection.

### Dependencies

- Epic 1 accepted
- RC-26 API Contract consumer ports (`LiveMarketDataReadPort`, Qualification/Profile consumer ports)
- Existing Live Market Data (§5.17); RC-25 consumer read ports

### Definition of Done

- [x] Market State reads market observations via `LiveMarketDataReadPort`.
- [x] Market State reads Qualification confidence/health/lifecycle via `MarketQualificationConsumerReadPort`.
- [x] Market State reads Profile projections via `MarketProfileConsumerReadPort`.
- [x] Immutable observational / research read models (`authorityClass` preserved).
- [x] Dependency injection wires consumer tokens → approved read adapters.
- [x] Empty / missing results handled; tenancy (`workspaceId`) and venue (`exchangeScopeId`) isolation respected.
- [x] No Market State publish / Orchestrator selection / Session mutation in this epic.
- [x] Upstream modules never import Market State (dependency direction tests).
- [x] No Library / Enforcement / Reporting / AI changes.

**Epic 2 report:** [rc-26-epic2-market-state-input-integration.md](./rc-26-epic2-market-state-input-integration.md)

### Expected user value

Market State can observe current conditions and research confidence without inventing a second data stack or leaking provider payloads as domain truth.

---

## Epic 3 — Market State domain + lifecycle ports

### Objective

Implement Market State domain entities and application ports: normalized current state, lifecycle transitions, classify/refresh/query. Classification informs selection — still no strategy selection or Session handoff.

### Dependencies

- Epic 2 read consumption
- [Domain Model Contract](./rc-26-domain-model-contract.md) Market State sections
- API Contract `MarketStateServicePort` / `MarketStateQueryPort`

### Definition of Done

- [x] Domain entities match Domain Model contract (MarketState, MarketStateVersion, MarketStateLifecycle, MarketStateSnapshot, Metadata).
- [x] Lifecycle transitions documented and tested (Created/Active/Superseded/Archived edges only).
- [x] Version history append-only with overwrite protection (`publishNextMarketState`).
- [x] State is current-condition SoT for descriptive artifacts — never Qualification run ownership, never Profile versions.
- [x] No Orchestrator selection / Session / Orders / Risk Decision APIs introduced.
- [x] Unit tests prove State ≠ Qualification and State ≠ Profile.
- [x] No classification algorithms / automatic transitions (caller-supplied snapshot labels only).
- [x] Classify/query Nest ports remain inactive pending approved classification behaviour.
- [x] Compiles and passes tests independently of live exchange network.

**Epic 3 report:** [rc-26-epic3-domain-model.md](./rc-26-epic3-domain-model.md)

### Expected user value

Operators and Orchestrator share one canonical “what is the market now?” artifact that does not pretend to be venue research qualification.

---

## Epic 4 — Trading Orchestrator domain (plans / intent / lifecycle)

### Objective

Implement immutable Orchestrator domain entities: TradingOrchestrator, OrchestrationPlan, OrchestrationIntent, OrchestrationLifecycle, OrchestrationMetadata — without activating coordination ports or workflow behaviour (Epic 5).

### Dependencies

- Epic 3 accepted (Market State available as opaque input concept)
- [Domain Model Contract](./rc-26-domain-model-contract.md) Orchestrator sections
- Tactics Contract Option B (declared for later selection — not used in Epic 4)

### Definition of Done

- [x] Domain entities match Domain Model contract (TradingOrchestrator, Plan, Intent, Lifecycle, Metadata).
- [x] Orchestration lifecycle transitions documented and tested (Created/Planned/Ready/Cancelled/Archived).
- [x] Plan version history append-only with overwrite protection.
- [x] Intent describes coordination only — `selectsStrategy` / `createsSession` / `executesActions` always false.
- [x] Explicit authority labels: `orchestration_artifact` / coordination — never execution SoT.
- [x] No Orders / Risk-approve / Execution / Library-certify / Qualification-evaluate / workflow APIs.
- [x] Unit tests for immutability, lifecycle, versioning, overwrite protection, dependency direction, no workflow behaviour.
- [x] Compiles and passes tests independently of live order path.
- [x] SelectionDecision / TacticSelection / SessionHandoffIntent deferred to Epic 5 (not materialized here).

**Epic 4 report:** [`rc-26-epic4-trading-orchestrator-domain-model.md`](./rc-26-epic4-trading-orchestrator-domain-model.md)

### Expected user value

Orchestration plans have a single canonical immutable shape reviewers can trust as coordination intent — never money, fills, selection, or Session SoT.

---

## Epic 5 — Orchestrator workflow ports (Library / Gate / Session / Risk-read coordination)

### Objective

Implement Trading Orchestrator application ports that sequence: read Market State → select certified strategy → select envelope tactics → fail-closed Enforcement Gate → emit Session handoff intent. Consume Risk policy/constraint reads for filters only.

### Dependencies

- Epic 3 Market State ports + Epic 4 domain
- RC-22 Library ports; RC-23 `RuntimeEnforcementPort`; Session handoff surface; Risk policy read surface
- API Contract `TradingOrchestratorServicePort` / `TradingOrchestratorQueryPort`

### Definition of Done

- [x] `TradingOrchestratorServicePort` can start/confirm/cancel orchestration runs and propose selections.
- [x] Operator confirmation semantics available where selection would change live Session mission (no silent auto-apply as capital authority).
- [x] Strategy selection uses Library Lookup/Eligibility — never local certified lists.
- [x] Tactic selection validates against Tactical Envelope — fail closed on out-of-envelope.
- [x] Deployment/Session bind path calls Runtime Enforcement Gate — fail closed; no soft-pass.
- [x] Session handoff emits intents into Session-owned lifecycle — Orchestrator does not own Session state.
- [x] Risk Engine consumed only as policy/constraint **reads**; no Risk Decision production.
- [x] Qualification/Profile consumed as confidence inputs only; never force-trade helpers.
- [x] Unit/integration tests: happy path, missing State, ineligible strategy, Gate reject, out-of-envelope tactic.
- [x] Compiles/tests without requiring Orders / Execution / live adapter.

**Epic 5 report:** [`rc-26-epic5-trading-orchestrator-workflow-ports.md`](./rc-26-epic5-trading-orchestrator-workflow-ports.md)

### Expected user value

The platform can recommend/select how to apply an already certified strategy under current conditions — without inventing a new strategy or bypassing Risk/Execution.

---

## Epic 6 — Consumer read ports + authority conformance + close readiness

### Objective

Expose read-only façades of Market State and Orchestrator outcomes for Reporting, AI Analytics, and Command Center. Prove authority conformance and close readiness. No REST product. No UI.

### Dependencies

- Epics 3–5 accepted
- API Contract consumer ports
- RC-24 Reporting / AI remain consumers only

### Definition of Done

- [x] `MarketStateConsumerReadPort` projects current state / transition summaries (read only).
- [x] `TradingOrchestratorConsumerReadPort` projects orchestration runs / selection decisions / handoff intents (read only).
- [x] Projections carry `authorityClass` and never claim execution / risk / ledger SoT.
- [x] Reporting / AI / Command Center may depend on consumer ports; reverse command dependencies forbidden.
- [x] Authority conformance tests: no ownership overlap; no duplicate Gate; no State-as-Qualification; no Orchestrator-as-Execution.
- [x] Internal audit + readiness report for Validation & Release (separate task).
- [x] No REST / persistence product / UI shipped under this epic.
- [x] Module README + index updates for consumer audiences.

**Epic 6 report:** [`rc-26-epic6-consumer-read-authority.md`](./rc-26-epic6-consumer-read-authority.md)  
**Internal audit / readiness:** [`rc-26-epic6-internal-audit-report.md`](./rc-26-epic6-internal-audit-report.md) · [`rc-26-epic6-readiness-report.md`](./rc-26-epic6-readiness-report.md)

### Expected user value

Downstream ops and analytics can observe orchestration and market-state facts without gaining false SoT authority.

---

## Epic sequencing rules

1. No Epic starts before plan approval.
2. Epic _N+1_ does not start until Epic _N_ DoD is met (or explicitly gated by human review).
3. Each Epic must independently compile and pass its tests.
4. Story IDs allocated only after plan approval.
5. Validation & Release is a **separate** task after Epic 6 readiness.

---

## STOP gate

**CLOSED.** Epics 1–6 approved; Validation PASS; tag `v1.0.0-rc26`. Next: RC-27 Planning.
