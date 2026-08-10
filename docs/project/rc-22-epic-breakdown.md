# RC-22 Epic Breakdown — Strategy Library

**Document:** RC-22 Epic Breakdown  
**Status:** PLANNING — awaiting approval  
**Date:** 2026-08-10  
**Nature:** Planning only. No implementation.

**Parent:** [RC-22 Implementation Plan](./rc-22-implementation-plan.md)  
**Integration:** [Strategy Library Integration Diagram](./rc-22-strategy-library-integration.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.2, §8

---

## Release epic map

```text
Epic 1  Classification & ownership boundaries
  ↓
Epic 2  Library canonical model & persistence
  ↓
Epic 3  Certification lifecycle & evidence binding
  ↓
Epic 4  Tactical Envelope binding (Library-owned)
  ↓
Epic 5  Production eligibility gate (Deployment / Session / Paper)
  ↓
Epic 6  Deprecation, immutability controls & RC-22 acceptance
```

Epics are intentionally small. Later epics must not start implementation until upstream DoD is met (or explicitly gated).

---

## Epic 1 — Classification & ownership boundaries

### Objective

Define and publish the hard boundary between research artifacts, experimental strategies, certified Library members, and deprecated members — including ownership vs the existing Strategy registry (`draft` / `active` / `archived`).

### Dependencies

- RC-19 CLOSED (Spec shared; naming discipline)
- Architecture Spec §5.1–5.2, Authority Matrix, Alias Dictionary
- Existing Strategy registry and Strategy Deployment modules (read-only analysis; no redesign)

### Definition of Done

- [ ] Written classification matrix accepted (research / experimental / certified / deprecated).
- [ ] Ownership table accepted: registry ≠ Library SoT; Deployment binds Library ids.
- [ ] Explicit statement that registry `active` ≠ certified.
- [ ] Non-goals listed (no Command Center, Orchestrator, Lake, multi-exchange).
- [ ] Architecture Impact block: no new Spec concepts beyond Strategy Library already in Spec.

### Expected user value

Researchers and operators share one vocabulary for trust: what is still an experiment vs what has earned production eligibility — without mistaking Lab success for Library membership.

---

## Epic 2 — Library canonical model & persistence

### Objective

Introduce the minimal canonical Strategy Library model (`CertifiedStrategyVersion`) and its persistence boundary as SoT for certified versions.

### Dependencies

- Epic 1 accepted
- RC-19 Exchange Scope identity (for `supportedExchangeScopeIds`)
- Implementation Plan §4 data model

### Definition of Done

- [ ] Domain model covers: identity, version, market, supported exchanges/scopes, supported timeframes, certification status, statistical metrics snapshot, validation evidence refs, envelope placeholder fields.
- [ ] Persistence owned by Library module/boundary (not overloaded onto unrelated aggregates).
- [ ] Uniqueness invariants: family+version; immutable `contentHash` after insert.
- [ ] Unit tests for model invariants (no mutation APIs for certified content).
- [ ] No change to Orders / Risk / Execution / Ledger / Recovery algorithms.

### Expected user value

The platform can store a durable, auditable record of “this exact strategy version is certified,” independent of editable Lab configs.

---

## Epic 3 — Certification lifecycle & evidence binding

### Objective

Implement the admission path from Lab validation evidence → certification decision → Library membership, without Lab modules writing eligibility by side effect.

### Dependencies

- Epic 2 model/persistence
- Research Lab outputs: Backtesting + Walk Forward result identities (Monte Carlo ref optional/nullable)
- Human certification authority rule (AI cannot auto-admit)

### Definition of Done

- [ ] Certification command/API (application-level) creates Library entries only with required evidence refs + frozen version identity.
- [ ] Backtest and walk-forward refs are attachable; Monte Carlo ref allowed when available, not blocking if engine absent.
- [ ] Lab modules remain evidence producers; they do not silently flip Library status.
- [ ] Failed / incomplete validation cannot certify.
- [ ] Tests: admit with valid refs; reject missing refs / unfrozen identity.
- [ ] Lifecycle docs match Spec §8 (certification before Paper eligibility).

### Expected user value

A strategy earns Library membership through an explicit, evidence-linked gate — profitability alone never certifies.

---

## Epic 4 — Tactical Envelope binding (Library-owned)

### Objective

Bind a machine-readable Tactical Envelope to each certified version (Tactics Contract Option B), making the RC-19 Session stub subordinate to Library SoT rather than a free-form Session invention.

### Dependencies

- Epic 2–3
- RC-19 Epic 3 envelope structural stub
- [Tactics Contract](./v2-tactics-contract.md)

### Definition of Done

- [ ] Certified version requires structurally valid envelope at certification.
- [ ] Envelope fields cover allowlisted symbols/timeframes and certified tactical ranges/sets (per contract).
- [ ] Library is SoT for envelope body; Session/Deployment may reference or snapshot, not invent.
- [ ] Envelope expansion requires new certified version (no in-place enlarge).
- [ ] Tests: reject certify without envelope; reject mutate envelope in place.

### Expected user value

Operators know the allowed tactic space for a certified strategy before any Bot/Session uses it — tactics stay inside pre-validated limits.

---

## Epic 5 — Production eligibility gate

### Objective

Enforce “only Library members may enter the production path” at Strategy Deployment and Trading Session Paper binding/arming — including reject paths for experimental and deprecated versions.

### Dependencies

- Epics 2–4
- Existing Strategy Deployment + Trading Session + Paper path (Freeze ADR-012…018)
- Bot Facade remains alias only (RC-19)

### Definition of Done

- [ ] Deployment create/bind requires `libraryEntryId` (or certified version id) with status `certified`.
- [ ] Experimental registry strategies cannot bind to production Deployment/Session.
- [ ] Deprecated Library members rejected for **new** bindings.
- [ ] Paper Trading path covered (Spec: Paper uses only certified strategies).
- [ ] Out-of-envelope tactic parameters rejected at bind/arm (no documentation-only enforcement).
- [ ] Integration/M2-style tests: certified happy path; reject experimental; reject deprecated; reject envelope violation.
- [ ] Risk Engine / Execution Engine still mandatory on path — eligibility ≠ risk approval.

### Expected user value

Users cannot accidentally paper-trade an unproven or withdrawn strategy version; the platform fails closed on eligibility.

---

## Epic 6 — Deprecation, immutability & RC-22 acceptance

### Objective

Complete lifecycle controls (deprecate without history rewrite) and close RC-22 against Implementation Plan acceptance criteria.

### Dependencies

- Epics 1–5 Done
- [RC-22 Implementation Plan §6](./rc-22-implementation-plan.md)

### Definition of Done

- [ ] Deprecation transition `certified → deprecated` with reason + actor + timestamp.
- [ ] Deprecated records readable for audit; content hash unchanged.
- [ ] No delete-as-deprecation of certified evidence.
- [ ] Immutability tests for certified content and envelopes.
- [ ] Residual / deferred register updated (Command Center, IDE, Lake, Orchestrator, etc.).
- [ ] RC-22 Closure Report drafted with Architecture Impact summary.
- [ ] All Implementation Plan §6 acceptance criteria checked.

### Expected user value

Trust compounds: certified history stays honest, withdrawals are explicit, and the release can be closed without leaving a fake “Library” that does not gate runtime.

---

## Cross-epic constraints

| Constraint                                     | Applies to                 |
| ---------------------------------------------- | -------------------------- |
| No architecture redesign                       | All                        |
| No new global modules beyond Strategy Library  | All                        |
| No Bot aggregate / second runtime              | Especially Epic 5          |
| No Command Center / Kill Switch productization | All (deferred)             |
| No Orchestrator selection logic                | All (RC-26)                |
| Monte Carlo engine not in scope                | Epic 3 (nullable ref only) |
| Frozen path algorithms unchanged               | Epic 5–6                   |

---

## Suggested story band (allocation later)

Story IDs are **not** assigned in this planning package. After plan approval, allocate from the active release band in [`story-id-allocation.md`](./story-id-allocation.md) under a separate story-drafting task.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
