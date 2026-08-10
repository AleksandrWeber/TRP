# RC-25 Epic Breakdown — Market Qualification & Market Profile

**Document:** RC-25 Epic Breakdown  
**Status:** Epic 3 implemented — awaiting review  
**Date:** 2026-08-10  
**Nature:** Thin architectural epics. Each Epic must independently compile, test, and be reviewable.

**Parent:** [RC-25 Implementation Plan](./rc-25-implementation-plan.md)  
**API:** [API Contract](./rc-25-api-contract.md)  
**Domain:** [Domain Model Contract](./rc-25-domain-model-contract.md)  
**Integration:** [Integration Diagram](./rc-25-integration-diagram.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.3, §5.17  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md)  
**Predecessor:** [RC-24 CLOSED](./rc-24-closure-report.md)

---

## Release epic map

```text
Epic 1  Market Qualification & Market Profile boundary + ownership
  ↓
Epic 2  Live Market Data (+ approved Research) read consumption
  ↓
Epic 3  Domain Model (Qualification + Profile entities)
  ↓
Epic 4  Market Qualification lifecycle + evaluation ports
  ↓
Epic 5  Market Profile versioning + profile dimensions
  ↓
Epic 6  Consumer read ports + authority conformance + close readiness
  ↓
Validation & Release  (separate task after Epics)
```

Each Epic must independently compile and pass tests. Later epics must not start until upstream DoD is met (or explicitly gated). Story IDs allocated after plan approval ([story-id-allocation](./story-id-allocation.md)).

---

## Epic 1 — Market Qualification & Market Profile boundary + ownership

### Objective

Establish Market Qualification and Market Profile module boundaries and publish hard ownership vs Live Market Data, Research, Strategy Library, Runtime Enforcement, Trading Session, Reporting, AI, future Orchestrator, and Market State.

### Dependencies

- RC-24 CLOSED; Spec §5.3 / §5.17; Authority Matrix; Alias Dictionary; Cluster Isolation Invariants
- Implementation Plan §§3–5

### Definition of Done

- [x] Modules named and documented (canonical: **Market Qualification**, **Market Profile** — not Orchestrator, not Market State, not Enforcement, not Library).
- [x] Ownership table accepted: Qualification owns state/confidence/health/lifecycle; Profile owns versioned dimensions; execution SoT owners unchanged.
- [x] Explicit: Qualification evaluates; Profile describes; neither executes / selects / authorizes trading.
- [x] Explicit: no direct Session interaction; no Runtime Gate substitution; no Strategy Selection.
- [x] Forbidden dependencies listed (no Profile → force trade; no Qualification → Orders/Risk; no Profile → expand Envelope).
- [x] Boundary tests / invariants compile and pass.
- [x] Architecture Impact: no new Spec concepts beyond already approved §5.3 modules.

**Epic 1 report:** [rc-25-epic1-market-qualification-profile-boundary.md](./rc-25-epic1-market-qualification-profile-boundary.md)  
**Boundary diagram:** [rc-25-epic1-boundary-diagram.md](./rc-25-epic1-boundary-diagram.md)

### Expected user value

Shared vocabulary: the platform can research a venue’s readiness — it does not trade because of that research.

---

## Epic 2 — Live Market Data (+ approved Research) read consumption

### Objective

Wire Market Qualification as a **consumer** of Live Market Data (and approved Research outputs). Qualification reads observations only. No profile publish. No Session commands. No ownership transfer.

### Dependencies

- Epic 1 accepted
- RC-25 API Contract consumer ports (`LiveMarketDataReadPort`, `ResearchOutputReadPort`)
- Existing Live Market Data layer (§5.17)

### Definition of Done

- [x] Qualification reads market observations via `LiveMarketDataReadPort`.
- [x] Approved Research outputs readable via `ResearchOutputReadPort` (optional path; empty-safe).
- [x] Immutable observational read models (`authorityClass` preserved — provider payloads do not become domain truth).
- [x] Dependency injection wires consumer tokens → approved read adapters.
- [x] Empty / missing results handled; tenancy (`workspaceId`) and venue (`exchangeScopeId`) isolation respected.
- [x] No qualification run completion / profile publish / Session mutation in this epic.
- [x] Live Market Data never imports Qualification (dependency direction tests).
- [x] No Orchestrator / Market State / Enforcement / Library / Reporting changes.

**Epic 2 report:** [rc-25-epic2-live-market-data-research-read-integration.md](./rc-25-epic2-live-market-data-research-read-integration.md)

### Expected user value

Qualification can observe venues without inventing a second market-data stack or leaking provider payloads as domain truth.

---

## Epic 3 — Domain Model (Qualification + Profile entities)

### Objective

Implement the locked Domain Model entities as research artifacts: QualificationTarget, QualificationRun, QualificationState, MarketConfidence, MarketHealth, MarketProfile, and profile dimensions (volatility, liquidity, trend, structural characteristics) — without persistence product inventiveness beyond compile/test domain invariants.

### Dependencies

- Epic 2 accepted
- [Domain Model Contract](./rc-25-domain-model-contract.md)

### Definition of Done

- [x] Domain entities match Domain Model contract (fields, immutability, authority class).
- [x] QualificationState lifecycle transitions documented and tested (allowed edges only).
- [x] MarketProfile versions are immutable after publish; corrections = new version.
- [x] Profile dimensions include volatility, liquidity, trend, structural characteristics.
- [x] Venue/market keying required (`exchangeScopeId` + market identity).
- [x] No Orders / Risk / Session / Library / Enforcement mutation APIs introduced.
- [x] Unit tests for forbidden force-trade / envelope-expansion helpers absent.
- [x] Compiles and passes tests independently of live exchange network.

**Epic 3 report:** [rc-25-epic3-domain-model.md](./rc-25-epic3-domain-model.md)

### Expected user value

Qualification and Profile artifacts have a single canonical shape reviewers can trust as research SoT for profile versions — never execution SoT.

---

## Epic 4 — Market Qualification lifecycle + evaluation ports

### Objective

Implement Market Qualification application ports: user-triggered start/confirm, query state/confidence/health, complete or fail runs. Evaluation produces qualification artifacts — still no strategy selection or runtime authorization.

### Dependencies

- Epic 2 read consumption + Epic 3 Domain Model
- API Contract `MarketQualificationServicePort` / `MarketQualificationQueryPort`

### Definition of Done

- [x] `MarketQualificationServicePort` can request/confirm qualification runs (user-triggered).
- [x] Heavy runs require explicit user/operator confirmation semantics (no silent auto-spend).
- [x] `MarketQualificationQueryPort` can get QualificationState, MarketConfidence, MarketHealth, and run history.
- [x] Lifecycle updates QualificationState without touching Session / Enforcement / Library.
- [x] Confidence and health are research artifacts — never Risk Decisions or Ledger mutations.
- [x] Unit/integration tests for happy path + empty market data + rejected unconfirmed heavy run.
- [x] Compiles/tests without requiring Orchestrator or live order path.

**Epic 4 report:** [rc-25-epic4-qualification-lifecycle-ports.md](./rc-25-epic4-qualification-lifecycle-ports.md)

### Expected user value

Operators can requalify a venue and see clear state, confidence, and health — and decide when to trust it.

---

## Epic 5 — Market Profile versioning + profile dimensions

### Objective

Implement Market Profile publish/query ports: materialize immutable versioned profiles with volatility, liquidity, trend, and structural characteristics from completed qualification runs.

### Dependencies

- Epic 4 Qualification ports
- API Contract `MarketProfileServicePort` / `MarketProfileQueryPort`
- Domain Model Profile sections

### Definition of Done

- [x] Successful qualification may publish a new MarketProfile version (immutable).
- [x] Profile carries volatility / liquidity / trend / structural dimension payloads.
- [x] `MarketProfileQueryPort` supports get-latest and get-by-version for a venue/market target.
- [x] Refreshing profile does not mutate prior versions; does not expand Tactical Envelope.
- [x] Profile never exposes “force trade / select strategy / authorize session” operations.
- [x] Tests: version immutability; venue keying; dimension presence; forbidden selection methods absent.
- [x] No Multi-Exchange adapter work; single-venue profile model only.

**Epic 5 report:** [rc-25-epic5-market-profile-versioning.md](./rc-25-epic5-market-profile-versioning.md)

### Expected user value

The platform stores a clear, versioned research profile of venue behavior — confidence input for later selection, never a trade command.

---

## Epic 6 — Consumer read ports + authority conformance + close readiness

### Objective

Publish stable **read** surfaces for future Trading Orchestrator, Reporting, and AI Analytics; run authority conformance checks; prepare Validation & Release closeout. No Orchestrator/Reporting/AI redesign.

### Dependencies

- Epics 4–5 ports complete
- Authority Matrix / Alias Dictionary / Spec §5.3
- Implementation Plan Definition of Done

### Definition of Done

- [x] Consumer-facing read DTOs/ports documented and implemented for Orchestrator / Reporting / AI (read-only confidence + profile + qualification summary).
- [x] Optional Knowledge Lake projection markers (category reserved) do not become financial SoT.
- [x] Authority conformance tests: Profile never forces trades; Qualification never Gate; no Session writes.
- [x] Residual/deferred register lists Orchestrator consumption, Market State, Multi-Exchange, UI.
- [x] No REST inventiveness required for close; ports remain transport-agnostic.
- [x] Ready for Validation & Release task (separate).

**Epic 6 reports:**

- [rc-25-epic6-consumer-read-authority.md](./rc-25-epic6-consumer-read-authority.md)
- [rc-25-epic6-internal-audit-report.md](./rc-25-epic6-internal-audit-report.md)
- [rc-25-epic6-readiness-report.md](./rc-25-epic6-readiness-report.md)

### Expected user value

Downstream systems can later read qualification confidence without Qualification owning their decisions.

---

## Cross-epic constraints

| Constraint                                             | Applies to |
| ------------------------------------------------------ | ---------- |
| No architecture redesign / Spec rewrite                | All        |
| No Trading Orchestrator / Market State / Selection     | All        |
| No Runtime Enforcement redesign                        | All        |
| No Strategy Library redesign                           | All        |
| No Reporting / AI redesign                             | All        |
| No Knowledge Lake redesign / Lake-as-SoT               | All        |
| No direct Session interaction                          | All        |
| No Multi Exchange second adapter                       | All        |
| No forcing trades / expanding envelopes via Profile    | All        |
| No REST / transport / queue inventiveness in contracts | All        |
| Each epic independently compiles + passes tests        | All        |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
