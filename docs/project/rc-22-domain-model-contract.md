# RC-22 Domain Model Contract — Strategy Library

**Document:** Strategy Library Domain Model Contract  
**Status:** APPROVED — Epics 1–6 domain complete (§§4–12); application ports deferred  
**Date:** 2026-08-10  
**Nature:** Canonical domain model. Application Nest ports / persistence / runtime wiring remain later.

**Parent:** [RC-22 Implementation Plan](./rc-22-implementation-plan.md)  
**API:** [RC-22 API Contract](./rc-22-api-contract.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.2, §8  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md) · [Tactics Contract](./v2-tactics-contract.md)  
**Implementation:** [Epic 2](./rc-22-epic2-strategy-domain-model.md) · [Epic 3](./rc-22-epic3-strategy-certification.md) · [Epic 4](./rc-22-epic4-tactical-envelope-binding.md) · [Epic 5](./rc-22-epic5-eligibility-gate.md) · [Epic 6](./rc-22-epic6-lifecycle-deprecation-archive.md)

### Implementation status (by section)

| Section                                  | Status                                                 |
| ---------------------------------------- | ------------------------------------------------------ |
| §4 Strategy                              | **Implemented** (Epic 2)                               |
| §5 Strategy Version                      | **Implemented** (Epic 2)                               |
| §6 Certification                         | **Implemented** (Epic 3)                               |
| §7 Evidence                              | **Implemented** (Epic 3)                               |
| §8 Tactical Envelope                     | **Implemented** (Epic 4)                               |
| §9 Eligibility                           | **Implemented** (Epic 5) — domain gate                 |
| §10–12 Lifecycle / Deprecation / Archive | **Implemented** (Epic 6) — immutable lifecycle records |

---

## 1. Purpose

Lock the **canonical domain model** for Strategy Library before Epics implement ports or storage.

This contract answers:

- What entities exist?
- What is immutable vs status-mutable?
- Who owns each fact family?
- How do certification, eligibility, deprecation, and archive relate?

---

## 2. Ownership boundaries

| Entity / fact                         | Owner (SoT)                          | Authority class                        |
| ------------------------------------- | ------------------------------------ | -------------------------------------- |
| Experimental strategy definition      | Strategy registry (Lab-facing)       | SoT for editable research config       |
| **Strategy** (Library family)         | **Strategy Library**                 | SoT for certified family identity      |
| **Strategy Version** (certified blob) | **Strategy Library**                 | SoT for production-eligible algorithm  |
| **Certification** record              | **Strategy Library**                 | SoT for admission decision             |
| **Evidence** refs (pointers)          | **Strategy Library** (refs only)     | SoT for “what justified certification” |
| Evidence **bodies**                   | Research Lab / Campaign / Experiment | SoT for research artifacts             |
| **Tactical Envelope** body            | **Strategy Library**                 | SoT for allowed tactics (Option B)     |
| Envelope stub on Session (RC-19)      | Trading Session (attachment only)    | Non-authoritative after Library bind   |
| **Eligibility** decision              | **Strategy Library** (computed/gate) | Policy/gate over Library status        |
| Deployment binding                    | Strategy Deployment                  | SoT for “what Session runs”            |
| Session lifecycle                     | Trading Session                      | SoT (Bot ≡ Session alias)              |
| Certification event analytical copy   | Knowledge Lake                       | **Projection only**                    |
| Market State classification           | Market State Engine (future)         | Informs Orchestrator — not Library     |
| Strategy selection                    | Trading Orchestrator (future)        | Consumer of Library — not Library SoT  |

**Hard rules:**

1. Knowledge Lake never owns Library membership or eligibility.
2. Trading Session never writes certification.
3. Research Lab never mints certified rows without the Certification admission step.
4. Trading Orchestrator never invents envelope points or strategy versions.
5. Registry `draft` / `active` / `archived` ≠ Library certification lifecycle.

---

## 3. Aggregate overview

```text
Strategy (family)
  └── StrategyVersion (immutable certified content + envelope)
        ├── Certification (admission provenance)
        ├── Evidence[] (refs to Lab artifacts)
        ├── TacticalEnvelope (bound at certification)
        └── StatusLifecycle (certified → deprecated → archived)
```

Logical root for production references: **StrategyVersion** via `libraryEntryId`.

---

## 4. Strategy

Logical family that groups related certified versions and experimental lineage.

| Field              | Required | Meaning                                       |
| ------------------ | -------- | --------------------------------------------- |
| `strategyFamilyId` | Yes      | Stable family identity                        |
| `name`             | Yes      | Human label (non-authoritative for execution) |
| `description`      | No       | Human narrative                               |
| `registryRef`      | No       | Optional pointer to experimental registry id  |
| `createdAt`        | Yes      | Family creation time                          |

**Notes:**

- Strategy family is not itself “certified”; **versions** are certified.
- Multiple certified versions may exist under one family (v1 certified, v2 certified, v1 deprecated).

---

## 5. Strategy Version

Immutable certified algorithm membership — the production-facing Library unit.

> **Epic 2 note:** Domain entity implements identity + content allowlist fields only.  
> Fields `status`, `statisticalMetrics`, `tacticalEnvelope`, `envelopeVersion`, `certification`, `evidence[]`, and deprecation/archive metadata are **not** present until later Epics.  
> Content is immutable from creation (frozen); certification admission is Epic 3.

| Field                           | Required | Meaning                                             |
| ------------------------------- | -------- | --------------------------------------------------- |
| `libraryEntryId`                | Yes      | Primary key for Deployment / eligibility references |
| `strategyFamilyId`              | Yes      | Parent family                                       |
| `version`                       | Yes      | Monotonic / semver-like certified version string    |
| `contentHash`                   | Yes      | Fingerprint of algorithm + certified parameter set  |
| `market`                        | Yes      | Primary market domain                               |
| `supportedExchangeScopeIds[]`   | Yes      | Exchange Scopes allowlist (RC-19 identity)          |
| `supportedTimeframes[]`         | Yes      | Certified timeframe allowlist                       |
| `supportedSymbols[]` / universe | Yes*     | Instrument allowlist (*or universe ref)             |
| `status`                        | Yes      | See §10 Status lifecycle                            |
| `statisticalMetrics`            | Yes      | Certification-time summary snapshot                 |
| `tacticalEnvelope`              | Yes      | Bound envelope (see §8)                             |
| `envelopeVersion`               | Yes      | Envelope revision tied to this certification        |
| `certification`                 | Yes      | Admission record (see §6)                           |
| `evidence[]`                    | Yes      | Evidence refs (see §7)                              |
| `deprecatedAt` / `By` / reason  | No       | Set on deprecation                                  |
| `archivedAt` / `By` / reason    | No       | Set on archive                                      |

**Invariants:**

1. `strategyFamilyId + version` unique in Library.
2. After certification: `contentHash`, envelope body, evidence refs, metrics snapshot are **immutable**.
3. Status may only move along the allowed lifecycle (§10).
4. New evidence or envelope expansion ⇒ **new** Strategy Version via full pipeline — never in-place mutate.

---

## 6. Certification

Admission decision that creates a Strategy Version Library membership.

> **Epic 3 note:** Implemented as external `StrategyCertification` referencing `StrategyVersion`  
> (`libraryEntryId` + `contentHash` snapshot). Does **not** mutate the version.  
> Application CertificationPort deferred. Status starts as `active`; transitions deferred to Epic 6.

| Field             | Required | Meaning                                                              |
| ----------------- | -------- | -------------------------------------------------------------------- |
| `certificationId` | Yes      | Stable id for the admission event                                    |
| `libraryEntryId`  | Yes      | Version admitted                                                     |
| `certifiedAt`     | Yes      | Admission timestamp                                                  |
| `certifiedBy`     | Yes      | Human operator identity (role-bearing)                               |
| `decision`        | Yes      | `admitted` (only successful path creates membership)                 |
| `status`          | Yes      | `active` \| `deprecated` \| `archived` (Epic 3 issues `active` only) |
| `notes`           | No       | Human rationale                                                      |

**Rules:**

- AI never auto-certifies capital eligibility.
- Certification requires required evidence refs + frozen content hash (envelope binding = Epic 4).
- Rejecting a candidate does **not** create a Library certification.
- At most one **active** certification per `libraryEntryId`.

---

## 7. Evidence

Pointers from a certification to Lab / validation artifacts. Bodies remain in owning stores.

> **Epic 3 evidence types:** `backtesting`, `walk-forward`, `monte-carlo`, `paper-trading`, `statistical-validation`.  
> Required to admit: `backtesting` + `walk-forward`.

| Field        | Required | Meaning                                          |
| ------------ | -------- | ------------------------------------------------ |
| `evidenceId` | Yes      | Stable ref id within the certification           |
| `type`       | Yes      | See types below                                  |
| `sourceRef`  | Yes      | Foreign identity in Lab / campaign / paper store |
| `summary`    | No       | Optional non-authoritative snapshot snippet      |

| `type`                   | Required for certify? | Points to                       |
| ------------------------ | --------------------- | ------------------------------- |
| `backtesting`            | **Yes**               | Backtest / campaign session     |
| `walk-forward`           | **Yes**               | Walk-forward aggregate          |
| `monte-carlo`            | No                    | Monte Carlo run                 |
| `paper-trading`          | No                    | Paper path run / session ref    |
| `statistical-validation` | No                    | Statistical validation artifact |

Library does **not** clone result warehouses. Knowledge Lake may later hold analytical copies; those copies are not Evidence SoT.

---

## 8. Tactical Envelope binding

Machine-readable allowed tactics set bound **at certification** to one Strategy Version (Tactics Contract Option B).

> **Epic 4 note:** Implemented as `LibraryTacticalEnvelope` required on `StrategyCertification`.  
> Immutable; one envelope per certification; in-place replace forbidden.  
> Distinct from RC-19 Session stub. Runtime/eligibility enforcement = Epic 5.

| Field (logical)             | Required | Meaning                                    |
| --------------------------- | -------- | ------------------------------------------ |
| `envelopeVersion`           | Yes      | Envelope revision id                       |
| `allowedMarkets[]`          | Yes      | Approved market domains                    |
| `allowedExchangeScopeIds[]` | Yes      | Approved Exchange Scopes                   |
| `allowedSymbols[]`          | Yes      | Validated instrument allowlist             |
| `allowedTimeframes[]`       | Yes      | Validated timeframe allowlist              |
| `riskPerTrade`              | Yes      | Range or discrete set                      |
| `maxPositions`              | Yes      | Bounds                                     |
| `parameterLimits`           | No       | Named configuration bounds                 |
| `executionConstraints`      | No       | Caps / allowed order types (config only)   |
| `optionalFilters[]`         | No       | Only certified filter variants             |
| `provenanceRefs[]`          | No       | Experiment/campaign ids informing envelope |

**Binding rules:**

1. Library is **SoT** for envelope body of a certified version.
2. Deployment / Session may store a **ref or immutable snapshot** for runtime context.
3. RC-19 Session-nullable stub must not invent envelopes once Library binding exists.
4. Trading Orchestrator (future) may select **only inside** this envelope.
5. Expansion requires re-research + new certification (new Strategy Version / new certification).

---

## 9. Eligibility

Derived gate over Library certification + envelope (+ optional static tactic point).  
Authoritative inputs: active `StrategyCertification` and bound `LibraryTacticalEnvelope`.

> **Epic 5 note:** Implemented as immutable `StrategyEligibility` via `evaluateStrategyEligibility`.  
> Domain decision only — no Session/Orchestrator/Market State evaluation.  
> Application EligibilityPort / bind-path wiring deferred.

| Outcome      | When                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `eligible`   | Active admitted certification + required evidence + envelope (+ tactic ⊆ envelope if given)          |
| `ineligible` | Missing/uncertified / incomplete evidence / missing envelope / deprecated / archived / envelope miss |

**Consumers (future):** Strategy Deployment bind, Trading Session arm/bind, Trading Orchestrator selector.

**Non-consumers as authority:** Knowledge Lake, UI cache, AI narrative.

Eligibility ≠ Risk approval. Risk Engine remains mandatory on the executable path.

---

## 10. Status lifecycle

```text
                    certification admit
Experimental ──────────────────────────▶ certified (active)
  (registry / Lab)                         │
                                           ├── deprecate ──▶ deprecated
                                           │                    │
                                           │                    └── archive ──▶ archived
                                           └── archive ──▶ archived
```

> **Epic 6 note:** Implemented via immutable `StrategyLifecycleRecord` + new certification status snapshots.  
> No in-place mutation; no hard delete; archived/deprecated historically queryable.

| Status                 | Meaning                                                      | New production binds / eligibility?  |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------ |
| `certified` / `active` | Admitted Library member                                      | **Yes** (if eligibility gate passes) |
| `deprecated`           | Withdrawn from _new_ eligibility; historical record retained | **No**                               |
| `archived`             | Terminal retention; audit retained                           | **No**                               |

**Forbidden transitions:**

- `archived` → `certified` (requires **new** version + new certification if rebirth needed)
- `deprecated` → `certified` (same — no resurrect in place)
- Any transition that mutates `contentHash` or envelope body

Deprecation and archive change **eligibility status only** (via certification status snapshot).

---

## 11. Deprecation

| Field               | Required | Meaning                    |
| ------------------- | -------- | -------------------------- |
| `deprecatedAt`      | Yes      | Timestamp                  |
| `deprecatedBy`      | Yes      | Operator                   |
| `deprecationReason` | Yes      | Why withdrawn from new use |

Effects: status `deprecated`; existing running sessions follow Session lifecycle / stop policy — **no silent rewrite of historical bindings**.

---

## 12. Archive

| Field           | Required | Meaning                         |
| --------------- | -------- | ------------------------------- |
| `archivedAt`    | Yes      | Timestamp                       |
| `archivedBy`    | Yes      | Operator                        |
| `archiveReason` | Yes      | Why moved to terminal retention |

Effects:

- Status `archived`
- Excluded from default lookup/catalog
- Remains readable by explicit id for audit / archaeology
- Content and certification provenance unchanged
- **Not** a hard delete

Archive is stronger than deprecation for catalog hygiene; both forbid new binds.

---

## 13. Statistical metrics (summary snapshot)

Certification-time snapshot only — not a second metrics engine.

| Group        | Examples (illustrative)                             |
| ------------ | --------------------------------------------------- |
| Performance  | net return, max drawdown, profit factor, expectancy |
| Robustness   | walk-forward stability scores                       |
| Cost realism | fee/slippage assumptions id or values               |
| Sample       | period range, bar count, symbol set size            |

Authoritative detailed series remain in Lab; Library holds the certified summary for audit and display.

---

## 14. Identity map (Alias Dictionary)

| Product language     | Canonical model                        |
| -------------------- | -------------------------------------- |
| Strategy (certified) | Strategy Version (`libraryEntryId`)    |
| Mission              | Strategy Deployment binding Library id |
| Bot                  | Trading Session (same id)              |
| Tactical Envelope    | Envelope on Strategy Version (Library) |

Forbidden: `bots` table as Library; parallel “certified” flag sole-owned by registry.

---

## 15. Acceptance for this contract

Reviewers accept when:

1. Entities in §§4–12 are sufficient for Epics 2–6.
2. Ownership boundaries match Authority Matrix and Spec §5.2.
3. Lifecycle forbids resurrection and content mutation.
4. Evidence are refs, not a second Lab warehouse.
5. Eligibility is Library-gated; Lake/Orchestrator/Session do not own it.

**STOP:** Domain model only. Persistence and code wait for approval.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
