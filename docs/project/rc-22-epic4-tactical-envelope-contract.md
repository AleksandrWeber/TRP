# RC-22 Epic 4 — Tactical Envelope Contract

**Document:** Strategy Library Tactical Envelope Contract  
**Status:** Domain implemented (Epic 4) — runtime enforcement deferred to Epic 5+  
**Date:** 2026-08-10  
**Parents:** [Tactics Contract](./v2-tactics-contract.md) · [Domain Model Contract](./rc-22-domain-model-contract.md) §8 · [Epic 4 Report](./rc-22-epic4-tactical-envelope-binding.md)

---

## Purpose

Lock the Library-owned Tactical Envelope shape and binding rules for certified strategies.

This contract is **configuration**. It is not trading logic and not a runtime engine.

---

## Authority

| Concern                               | Owner                                              |
| ------------------------------------- | -------------------------------------------------- |
| Envelope body for a certified version | **Strategy Library** (`LibraryTacticalEnvelope`)   |
| RC-19 Session envelope stub           | Trading Session attachment — **non-authoritative** |
| Tactic selection inside envelope      | Future Orchestrator / Session config (not Epic 4)  |
| Risk approval                         | Risk Engine (unchanged)                            |

---

## Canonical fields

| Field                       | Required          | Meaning                                   |
| --------------------------- | ----------------- | ----------------------------------------- |
| `envelopeVersion`           | Yes               | Envelope revision id                      |
| `allowedMarkets[]`          | Yes               | Approved market domains                   |
| `allowedExchangeScopeIds[]` | Yes               | Approved Exchange Scopes                  |
| `allowedSymbols[]`          | Yes               | Approved instruments                      |
| `allowedTimeframes[]`       | Yes               | Approved timeframes                       |
| `riskPerTrade`              | Yes               | Range `{min,max,step?}` or discrete `set` |
| `maxPositions`              | Yes               | `{min,max}`                               |
| `parameterLimits`           | No (default `{}`) | Named configuration bounds                |
| `executionConstraints`      | No                | Caps / allowed order types (config only)  |
| `optionalFilters[]`         | No                | Certified filter variant names            |
| `provenanceRefs[]`          | No                | Experiment / campaign ids                 |

---

## Binding rules

1. One **active** `StrategyCertification` references exactly **one** immutable envelope.
2. Envelope must be compatible with the referenced `StrategyVersion` allowlists (subset checks).
3. Envelope never mutates `StrategyVersion`.
4. Changing an envelope requires a **new certification** (no in-place replace).
5. Eligibility / out-of-envelope reject at bind time is **Epic 5** (not this contract’s runtime).

---

## Forbidden interpretations

| Interpretation                            | Verdict       |
| ----------------------------------------- | ------------- |
| Envelope is a strategy algorithm          | **Forbidden** |
| Envelope enables live parameter invention | **Forbidden** |
| Session stub overrides Library envelope   | **Forbidden** |
| Envelope bypasses Risk Engine             | **Forbidden** |
| AI may enlarge envelope online            | **Forbidden** |

---

## Code anchors

| Concern               | Symbol                                                                |
| --------------------- | --------------------------------------------------------------------- |
| Create envelope       | `createLibraryTacticalEnvelope`                                       |
| Bind to certification | `bindTacticalEnvelopeToCertification` / `createStrategyCertification` |
| One per certification | `assertOneEnvelopePerCertification`                                   |
| In-place replace      | `replaceLibraryTacticalEnvelopeInPlace` → throws                      |
| Runtime adaptation    | `tacticalEnvelopeRuntimeAdaptationImplemented() === false`            |

---

## Relationship to RC-19 stub

```text
RC-19 tactical-envelope module  →  Session optional stub (inactive)
RC-22 LibraryTacticalEnvelope   →  Library SoT for certified versions
```

Do not merge these into one SoT. Session may later snapshot/ref Library envelope; it must not invent points.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
