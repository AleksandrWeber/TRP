# RC-22 Implementation Plan — Strategy Library

**Document:** RC-22 Implementation Plan  
**Status:** PLANNING — awaiting review approval (no implementation)  
**Date:** 2026-08-10  
**Nature:** Planning only. No code, no module changes, no architecture redesign.

**Authority inputs:**

| Input                                                                     | Role                                                                  |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md) | Canonical constitution (§5.2 Strategy Library, §8 Research Lifecycle) |
| [Tactics Contract](./v2-tactics-contract.md)                              | Strategy vs tactics; certification artifact shape                     |
| [Authority Matrix](./v2-authority-matrix.md)                              | SoT for certified strategy versions                                   |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)               | Approved RC sequence (see §0 sequencing note)                         |
| [RC-19 Closure Report](./rc-19-closure-report.md)                         | Migration complete; envelope stub inactive                            |
| [Product Vision](./trp-product-vision.md)                                 | Validated Knowledge before production use                             |

**Companion deliverables:**

- [Epic Breakdown](./rc-22-epic-breakdown.md)
- [Strategy Library Integration Diagram](./rc-22-strategy-library-integration.md)

---

## 0. Sequencing note (governance)

Per [RC-20 Roadmap Reconciliation](./rc-20-roadmap-reconciliation.md) (**Recommendation A**):

| RC        | Canonical theme                           |
| --------- | ----------------------------------------- |
| **RC-20** | Ops readiness (Command Center foundation) |
| **RC-22** | Strategy Library + Tactical Envelope      |

This package is the **RC-22** Strategy Library implementation plan. It does **not** reorder the approved V2 Implementation Roadmap. Command Center remains RC-20.

---

## 1. Release overview

| Field          | Value                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| RC name        | RC-22                                                                                                                                       |
| Theme          | Strategy Library (certified strategy repository)                                                                                            |
| Predecessor    | RC-20 / RC-21 as scheduled on V2 roadmap (Library does not require Command Center to start Lab work; runtime gate needs Session/Deployment) |
| Nature         | Certified Strategy Library + envelope enforcement (approved RC-22 theme)                                                                    |
| Implementation | **Not started** — planning only                                                                                                             |

### Mission

Introduce the **Strategy Library** as the canonical repository of **certified** trading strategy versions — the single source of truth for strategies eligible for the production path (Paper today; Live under a future ADR).

RC-22 answers: _Can the platform prove which strategy versions earned trust, bind their tactical envelopes, and refuse uncertified execution on the frozen Session / Deployment path?_

### Non-goals (explicit)

- No Command Center / Kill Switch productization (RC-20 — separate release)
- No IDE shell / Bot fleet UX (RC-21 theme)
- No Knowledge Lake warehouse (RC-23)
- No Trading Orchestrator / Market State classifier (RC-26)
- No Market Qualification / Profile product (RC-25)
- No multi-exchange proof (RC-27)
- No live-capital adapter
- No redesign of Orders / Risk / Execution / Ledger / Recovery
- No second strategy runtime or Bot aggregate
- No Monte Carlo engine build (consume when available; Lab remains owner of research methods)

---

## 2. Task 1 — Functional scope

### 2.1 Responsibilities of Strategy Library

Per Spec §5.2, Strategy Library is the **authoritative store of strategies that earned certification**.

| Responsibility                                          | In Library? | Notes                                                                         |
| ------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| Hold **certified** immutable strategy versions          | **Yes**     | SoT for production-eligible algorithm identity + version                      |
| Expose **Tactical Envelope** for each certified version | **Yes**     | Envelope is bound at certification; RC-19 stub becomes Library-owned artifact |
| Gate production use to library members only             | **Yes**     | Eligibility API / rule consumed by Deployment / Session binding               |
| Store research campaigns, experiments, raw backtests    | **No**      | Research Lab / Campaign / Experiment / Knowledge remain owners                |
| Execute strategies or submit orders                     | **No**      | Runtime / Risk / Execution unchanged                                          |
| Invent or mutate strategy logic at runtime              | **No**      | Forbidden by Spec and Tactics Contract                                        |
| Expand envelopes without re-certification               | **No**      | Expansion returns to Research → Validation → Certification                    |

### 2.2 Classification distinctions

Existing `strategies` registry statuses (`draft` / `active` / `archived`) are **not** Library certification. RC-22 introduces an explicit product/architecture classification:

| Class                     | Meaning                                                                                                                   | Where it lives                                      | Production path?                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Research artifact**     | Hypotheses, campaign outputs, experiment versions, reports, metrics snapshots, knowledge entries                          | Research Lab, Campaign/Experiment stores, Knowledge | **Never** directly                                                                                           |
| **Experimental strategy** | Strategy definition under test (draft or Lab-bound); may be run in historical simulation only                             | Strategy registry + Lab runners                     | **No**                                                                                                       |
| **Certified strategy**    | Immutable strategy **version** that passed the validation gate and was admitted to the Library with envelope + provenance | **Strategy Library** (SoT)                          | **Yes** (Paper; Live later)                                                                                  |
| **Deprecated strategy**   | Previously certified version withdrawn from _new_ eligibility; historical record retained                                 | Strategy Library (status = deprecated)              | **No new** bindings; existing sessions follow Session lifecycle / stop policy (no silent rewrite of history) |

#### Research artifacts

- Campaign sessions, walk-forward aggregates, backtest reports, insight/recommendation records, experiment provenance.
- Evidence **referenced by** certification; never mistaken for Library membership.
- Failures remain searchable knowledge; they do not become certified versions.

#### Experimental strategies

- Editable definitions used by Lab (backtest / walk-forward / Monte Carlo when available).
- May share lineage with a future certified version (same family id) but **different authority**.
- `active` in the registry ≠ certified.

#### Certified strategies

- Immutable versioned members of the Library.
- Carry: identity, version, market/universe constraints, supported exchanges (scopes), supported timeframes, certification status, statistical summary, validation evidence references, tactical envelope.
- Only these may bind to Strategy Deployment → Trading Session on the production path.

#### Deprecated strategies

- Certification revoked for **new** deployments.
- Record remains for audit, reporting, and session archaeology.
- Deprecation does not mutate the certified blob; it changes **eligibility status**.

### 2.3 Ownership boundary (anti-duplication)

| Concern                                         | Owner after RC-22                                                                  |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| Editable strategy config for research           | Existing Strategy registry (Lab-facing)                                            |
| Certified immutable version + eligibility       | **Strategy Library**                                                               |
| Immutable Deployment bound to Session           | Strategy Deployment (unchanged ownership)                                          |
| Session lifecycle                               | Trading Session (ADR-014)                                                          |
| Envelope values allowed for a certified version | Strategy Library (SoT); Session may carry a **copy/ref** for runtime, never invent |

RC-22 must not create a second parallel “strategies” table that also claims certification. Library records are the certification SoT; registry remains research/config SoT.

---

## 3. Task 3 — Certification flow (lifecycle)

### 3.1 Normative lifecycle (Architecture Spec §8)

Spec v2.0 is constitution. Normative production eligibility flow:

```text
Idea
  ↓
Research
  ↓
Validation
  ↓
Certification
  ↓
Strategy Library
  ↓
Paper Trading (certified only)
  ↓
Future Runtime Eligibility
  (Live Validation / Execution — future ADR; not RC-22)
```

| Stage                          | Meaning in RC-22                                                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Idea**                       | Human hypothesis (AI may suggest; humans decide).                                                                                |
| **Research**                   | Lab experiments: strategy variants under versioned data.                                                                         |
| **Validation**                 | Evidence gate — backtesting, fees/slippage realism, walk-forward, Monte Carlo **when available**, risk evaluation.               |
| **Certification**              | Explicit human/system admission decision: this **version** + envelope + evidence refs become Library members.                    |
| **Strategy Library**           | Immutable certified record published; eligibility = certified (until deprecated).                                                |
| **Paper Trading**              | Deployment/Session on frozen path may bind **only** Library-certified versions (Spec: Paper must use only certified strategies). |
| **Future Runtime Eligibility** | Same Library gate applies to future Orchestrator selection and live path; Orchestrator itself is out of RC-22.                   |

### 3.2 Alignment note (Task prompt vs Spec)

The planning task listed Paper Trading **before** Certification. Spec §8 and Spec Paper Trading rules place **Library certification before Paper Trading** on the production path.

RC-22 adopts Spec order:

- Pre-certification “paper-like” work, if any, is **Lab simulation** — not Trading Session Paper Trading.
- **Paper Trading** (Session + paper adapter) is a consumer of the Library, not a substitute for certification.

Tactics Contract’s research pipeline (`Backtesting → Walk Forward → (Monte Carlo) → … → Certification → Library`) remains the **validation method chain**; Paper on the Session path stays post-Library per Spec.

### 3.3 Certification admission rules (planning)

A version may be certified only when:

1. Strategy version identity is frozen (content hash / version id immutable thereafter).
2. Required validation evidence references exist (at minimum: backtest + walk-forward refs when those engines are the active Lab gates; Monte Carlo ref optional until engine exists).
3. Tactical Envelope is supplied and structurally valid (Option B fields).
4. Market / exchange-scope allowlists and timeframe allowlists are explicit.
5. Certifying authority (human operator role in V2) records admission — AI never auto-certifies capital eligibility.
6. Library write creates the certified record; registry experimental copy is not mutated into “certified” by status rename alone.

Deprecation is a Library status transition, not a delete, and not a Runtime hot-edit.

---

## 4. Task 4 — Data model (architecture only)

Minimal canonical model — logical, not Prisma/DDL.

### 4.1 `CertifiedStrategyVersion` (Library aggregate root)

| Field                                                 | Purpose                                                                 |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `libraryEntryId`                                      | Stable Library identity for this certified membership                   |
| `strategyFamilyId`                                    | Logical family linking experimental lineage (registry id or family key) |
| `version`                                             | Monotonic / semver-like certified version string                        |
| `contentHash`                                         | Immutable fingerprint of algorithm + certified parameter set            |
| `name` / `description`                                | Human labels (non-authoritative for execution)                          |
| `market`                                              | Primary market domain (e.g. crypto spot)                                |
| `supportedExchangeScopeIds[]`                         | Exchange Scopes this version may bind (RC-19 identity)                  |
| `supportedTimeframes[]`                               | Certified timeframe allowlist                                           |
| `supportedSymbols[]` / universe ref                   | Certified instrument allowlist (envelope overlap allowed)               |
| `certificationStatus`                                 | `certified` \| `deprecated`                                             |
| `certifiedAt` / `certifiedBy`                         | Admission provenance                                                    |
| `deprecatedAt` / `deprecatedBy` / `deprecationReason` | Optional; set on deprecation                                            |
| `statisticalMetrics`                                  | Summary snapshot at certification (see §4.3)                            |
| `validationEvidenceRefs[]`                            | Pointers to Lab results (see §4.4)                                      |
| `tacticalEnvelope`                                    | Machine-readable envelope (Tactics Contract)                            |
| `envelopeVersion`                                     | Envelope revision tied to this certification                            |

**Invariants:**

- No in-place mutation of `contentHash`, envelope body, or evidence refs after certification.
- Status may move `certified → deprecated` only.
- New evidence or envelope expansion ⇒ **new** certified version via full pipeline.

### 4.2 Identity

```text
strategyFamilyId + version  →  unique Library member
libraryEntryId              →  primary key for references (Deployment binds this)
contentHash                 →  integrity / replay proof
```

Deployment / Session bind `libraryEntryId` (or equivalent certified version id), not mutable registry rows.

### 4.3 Statistical metrics (summary snapshot)

Minimal certification-time snapshot (not a second metrics engine):

| Metric group | Examples (illustrative)                             |
| ------------ | --------------------------------------------------- |
| Performance  | net return, max drawdown, profit factor, expectancy |
| Robustness   | walk-forward stability/consistency scores           |
| Cost realism | fee/slippage assumptions id or values used          |
| Sample       | period range, bar count, symbol set size            |

Authoritative detailed series remain in Lab/report stores; Library holds the **certified summary** used for eligibility display and audit.

### 4.4 Validation evidence references

| Ref type               | Points to                                      |
| ---------------------- | ---------------------------------------------- |
| `backtestRef`          | Backtest / campaign session id(s)              |
| `walkForwardRef`       | Walk-forward aggregate / session id(s)         |
| `monteCarloRef`        | Optional until Monte Carlo exists              |
| `riskEvaluationRef`    | Optional structured risk review artifact id    |
| `experimentVersionRef` | Experiment version that produced the candidate |

References are foreign identities, not duplicated result blobs.

### 4.5 Relationship to RC-19 Tactical Envelope stub

- RC-19: optional nullable envelope on Session; **Runtime ignores**.
- RC-22: envelope **SoT on Library certified version**; Session/Deployment may store binding ref/copy for execution context.
- Runtime reject of out-of-envelope tactics is in RC-22 eligibility/enforcement epic scope (otherwise Library is documentation-only — forbidden by RC-19 lessons).

---

## 5. Task 6 — Architectural risks

| Risk                               | How RC-22 avoids it                                                                                                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Duplicate strategy storage**     | Split authority: registry = experimental/config; Library = certified SoT. Deployment binds Library ids only. No second “certified” flag sole-owned by registry.                                                                      |
| **Uncertified strategy execution** | Eligibility gate on Deployment create / Session arm: reject missing, experimental, or deprecated Library membership. Paper path included. Tests prove reject paths.                                                                  |
| **Runtime mutation**               | Certified records immutable; envelope expansion requires new version + re-certification. Runtime/Orchestrator (future) may only select inside envelope. No hot-edit APIs on Library content.                                         |
| **Ownership conflicts**            | Authority Matrix: Library owns certified version + envelope SoT; Deployment owns binding; Session owns lifecycle; Lab owns evidence; Risk/Execution unchanged. Explicit non-goals block Orchestrator/Lake/Command Center absorption. |
| **Documentation-only envelope**    | Envelope persistence on Library + runtime reject in same RC acceptance (RC-19 lesson #4).                                                                                                                                            |
| **Silent roadmap drift**           | §0 sequencing approval required; Command Center not “forgotten” — deferred with explicit target.                                                                                                                                     |
| **AI auto-certification**          | Certification requires human admission; AI remains narrative/suggest-only.                                                                                                                                                           |

---

## 6. Task 7 — Acceptance criteria (RC-22 close)

RC-22 may be **officially closed** only when all are true:

### Architecture

1. Spec §5.2 Strategy Library responsibilities are realized as a distinct Library module/boundary (SoT), without redesigning Spec modules.
2. Research artifacts, experimental strategies, certified strategies, and deprecated strategies are explicitly distinguished in docs + domain model.
3. No duplicate certification SoT; registry is not the production eligibility authority.
4. Architecture Spec v2.0 text unchanged (implementation conforms; does not rewrite constitution).

### Certification & model

5. Canonical `CertifiedStrategyVersion` model exists with identity, version, market, supported exchanges/scopes, timeframes, certification status, statistical summary, validation evidence refs, tactical envelope.
6. Certification flow Idea → Research → Validation → Certification → Library → Paper eligibility is documented and enforced at binding points.
7. Certified records are immutable; deprecation changes eligibility only.

### Integration & enforcement

8. Research Lab / Backtesting / Walk Forward (and Monte Carlo when present) feed evidence **refs** into certification — they do not write Library membership directly without the certification step.
9. Strategy Deployment / Trading Session Paper path **rejects** uncertified and deprecated versions.
10. Tactical Envelope for a certified version is Library-owned; out-of-envelope tactic application is rejected on the production path (RC-19 stub no longer “docs-only”).
11. Frozen path ownership preserved: Orders / Risk / Execution / Ledger / Recovery algorithms not redesigned.

### Delivery hygiene

12. All RC-22 epics meet their Definitions of Done ([Epic Breakdown](./rc-22-epic-breakdown.md)).
13. Integration map and tests cover happy path (certified → deploy → paper session) and reject paths (experimental / deprecated / unknown).
14. Deferred work (Command Center, IDE, Lake, Orchestrator, Qualification, multi-exchange, live capital) remains explicitly out of scope with target RCs.
15. Closure report recorded; project status updated only after review approval.

### Explicit non-acceptance

- Shipping Library UI without eligibility enforcement.
- Renaming `draft/active/archived` to imply certification without Library SoT.
- Auto-certifying from a single backtest profit metric.
- Building Orchestrator selection or Knowledge Lake “as part of Library.”

---

## 7. Deliverables checklist

| Deliverable                          | Document                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| RC-22 Implementation Plan            | This file                                                                          |
| Epic Breakdown                       | [`rc-22-epic-breakdown.md`](./rc-22-epic-breakdown.md)                             |
| Strategy Library Integration Diagram | [`rc-22-strategy-library-integration.md`](./rc-22-strategy-library-integration.md) |
| Acceptance Criteria                  | §6 of this file (+ epic DoDs)                                                      |

**STOP:** Planning complete. No implementation in this task.

---

## Approval

| Role               | Decision                                                 | Date |
| ------------------ | -------------------------------------------------------- | ---- |
| Architecture owner | ☐ Approve plan ☐ Approve RC resequence ☐ Request changes |      |
| Tech lead          | ☐ Approve plan ☐ Request changes                         |      |
| Product owner      | ☐ Approve plan ☐ Approve RC resequence ☐ Request changes |      |

**After approval:** Begin Epic 1 implementation under a separate task when RC-22 is the active release (after RC-20/RC-21 as scheduled).
