# RC-22 API Contract — Strategy Library

**Document:** RC-22 API Contract  
**Status:** PLANNING — awaiting approval  
**Date:** 2026-08-10  
**Nature:** Application **ports only**. **No REST. No database schema. No transport product. No implementation.**

**Parent:** [RC-22 Implementation Plan](./rc-22-implementation-plan.md)  
**Domain:** [Domain Model Contract](./rc-22-domain-model-contract.md)  
**Epics:** [Epic Breakdown](./rc-22-epic-breakdown.md)  
**Integration:** [Integration Diagram](./rc-22-strategy-library-integration.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.2  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md)  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) — API Contract stage

---

## 1. Purpose

Lock the **ports** Strategy Library exposes so Epics implement one contract.

This document deliberately does **not** define:

- HTTP routes / OpenAPI
- Prisma / SQL / table layouts
- Kafka, Redis, queues, or bus topics
- UI commands or Command Center widgets
- Trading Orchestrator or Market State Engine APIs
- Paper Trading redesign

Transports and persistence are Epic implementation choices after approval — provided they preserve ownership and immutability rules.

---

## 2. Ownership of the contract

| Concern                       | Owner                                     |
| ----------------------------- | ----------------------------------------- |
| Strategy Library ports        | Strategy Library module (RC-22)           |
| Evidence bodies               | Research Lab (unchanged)                  |
| Deployment / Session bind     | Existing owners — **consume** eligibility |
| Lake analytical copies        | Knowledge Lake ingestion (projection)     |
| Naming (product vs canonical) | Alias Dictionary                          |

**Canonical names:** `StrategyLibrary`, `libraryEntryId`, `tradingSessionId` — never a Bot aggregate as Library SoT.

---

## 3. Port overview (locked)

```text
Research / Operator admission
        │
        ▼
StrategyLibraryRegistrationPort     (family / candidate prep)
StrategyLibraryCertificationPort    (admit immutable version)
        │
        ▼
Strategy Library SoT
        │
        ├──▶ StrategyLibraryLookupPort
        ├──▶ StrategyLibraryEligibilityPort
        └──▶ StrategyLibraryLifecyclePort   (deprecate / archive)
```

Locked capabilities:

| Capability          | Port                               |
| ------------------- | ---------------------------------- |
| Registration        | `StrategyLibraryRegistrationPort`  |
| Certification       | `StrategyLibraryCertificationPort` |
| Lookup              | `StrategyLibraryLookupPort`        |
| Eligibility         | `StrategyLibraryEligibilityPort`   |
| Archive/Deprecation | `StrategyLibraryLifecyclePort`     |

No other Library command ports are in RC-22 scope (no hot-edit content, no restore-to-certified, no execute).

---

## 4. Registration port

### 4.1 Interface (logical)

```text
StrategyLibraryRegistrationPort
  registerFamily(cmd: RegisterStrategyFamily) → RegisterFamilyResult
  prepareCandidate(cmd: PrepareCertificationCandidate) → CandidateHandle
```

### 4.2 RegisterStrategyFamily

| Field              | Required | Meaning                           |
| ------------------ | -------- | --------------------------------- |
| `strategyFamilyId` | No*      | If omitted, Library assigns       |
| `name`             | Yes      | Human label                       |
| `description`      | No       | Narrative                         |
| `registryRef`      | No       | Optional experimental registry id |
| `workspaceId`      | Yes      | Tenancy                           |

### 4.3 PrepareCertificationCandidate

Stages a **non-certified** candidate handle for admission (does not grant eligibility).

| Field                 | Required | Meaning                                  |
| --------------------- | -------- | ---------------------------------------- |
| `strategyFamilyId`    | Yes      | Family                                   |
| `version`             | Yes      | Proposed version string                  |
| `contentHash`         | Yes      | Frozen fingerprint                       |
| `market` / allowlists | Yes      | Scopes, timeframes, symbols/universe     |
| `evidence[]`          | Yes      | Proposed refs (validated at certify)     |
| `tacticalEnvelope`    | Yes      | Proposed envelope (validated at certify) |
| `statisticalMetrics`  | Yes      | Proposed summary snapshot                |
| `workspaceId`         | Yes      | Tenancy                                  |

### 4.4 Registration rules

1. Registration / prepare **never** sets status `certified`.
2. Duplicate `strategyFamilyId + version` candidate rejected.
3. No mutation of an already certified `contentHash` via this port.

---

## 5. Certification port

### 5.1 Interface (logical)

```text
StrategyLibraryCertificationPort
  certify(cmd: CertifyStrategyVersion) → CertifyResult
```

### 5.2 CertifyStrategyVersion

| Field             | Required | Meaning                                      |
| ----------------- | -------- | -------------------------------------------- |
| `candidateHandle` | Yes*     | From prepare (*or inline payload equivalent) |
| `certifiedBy`     | Yes      | Human operator id                            |
| `notes`           | No       | Rationale                                    |
| `workspaceId`     | Yes      | Tenancy                                      |

### 5.3 CertifyResult

| Outcome     | Meaning                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| `certified` | `libraryEntryId` created; status `certified`                             |
| `rejected`  | Missing evidence, invalid envelope, unfrozen identity, duplicate version |
| `conflict`  | Version already certified for family+version                             |

### 5.4 Certification rules

1. Required evidence refs present (backtest + walk-forward when those gates are active; Monte Carlo optional).
2. Envelope structurally valid (Tactics Contract Option B fields).
3. Content hash frozen; thereafter immutable.
4. Human `certifiedBy` mandatory — AI must not call this as autonomous capital authority.
5. Side effect allowed: optional projection admit to Knowledge Lake (`producer: strategy-library`) — **never** the reverse (Lake does not certify).
6. No Session/Deployment auto-bind on certify.

---

## 6. Lookup port

### 6.1 Interface (logical)

```text
StrategyLibraryLookupPort
  getByLibraryEntryId(libraryEntryId) → StrategyVersionRecord | null
  getByFamilyVersion(strategyFamilyId, version) → StrategyVersionRecord | null
  list(query: LibraryListQuery) → StrategyVersionPage
```

### 6.2 LibraryListQuery

| Field              | Required | Meaning                                      |
| ------------------ | -------- | -------------------------------------------- |
| `workspaceId`      | Yes      | Tenancy                                      |
| `strategyFamilyId` | No       | Filter                                       |
| `statuses`         | No       | Default: `certified` only (exclude archived) |
| `exchangeScopeId`  | No       | Filter allowlist membership                  |
| `includeArchived`  | No       | Default false                                |
| `limit` / `cursor` | No       | Pagination                                   |

### 6.3 StrategyVersionRecord (read model)

Mirrors Domain Model Strategy Version fields including envelope, evidence refs, certification provenance, status.

`authorityClass: 'source_of_truth'` for Library-owned fields.

### 6.4 Lookup rules

1. Read-only.
2. Default list hides `archived` unless `includeArchived`.
3. Consumers: Deployment tooling, future Orchestrator, ops diagnostics, eligibility helpers.
4. Must not be confused with Knowledge Lake query results (Lake = projection).

---

## 7. Eligibility port

### 7.1 Interface (logical)

```text
StrategyLibraryEligibilityPort
  checkEligibility(query: EligibilityQuery) → EligibilityDecision
```

### 7.2 EligibilityQuery

| Field             | Required | Meaning                                           |
| ----------------- | -------- | ------------------------------------------------- |
| `libraryEntryId`  | Yes      | Certified version under test                      |
| `workspaceId`     | Yes      | Tenancy                                           |
| `exchangeScopeId` | No       | If present, must be in version allowlist          |
| `tacticPoint`     | No       | Symbol/timeframe/risk/etc. to test ⊆ envelope     |
| `purpose`         | No       | `deployment_bind` \| `session_arm` \| `selection` |

### 7.3 EligibilityDecision

| Field       | Meaning                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `outcome`   | `eligible` \| `ineligible`                                                                                    |
| `reasons[]` | Machine-readable codes (e.g. `status_deprecated`, `envelope_violation`, `unknown_entry`, `scope_not_allowed`) |
| `status`    | Current Library status if known                                                                               |
| `checkedAt` | Gate timestamp                                                                                                |

### 7.4 Eligibility rules

1. Only `status = certified` can be `eligible`.
2. `deprecated` and `archived` ⇒ `ineligible` for **new** binds.
3. Unknown `libraryEntryId` ⇒ `ineligible`.
4. If `tacticPoint` provided, must be inside Library envelope.
5. Eligibility does **not** approve risk, submit orders, or start sessions.
6. **Forbidden:** implementing eligibility by querying Knowledge Lake as authority.
7. Future Trading Orchestrator **must** use this port (or Lookup + same rules) — not invent local certified lists.

---

## 8. Lifecycle port (deprecation / archive)

### 8.1 Interface (logical)

```text
StrategyLibraryLifecyclePort
  deprecate(cmd: DeprecateStrategyVersion) → LifecycleResult
  archive(cmd: ArchiveStrategyVersion) → LifecycleResult
```

### 8.2 DeprecateStrategyVersion

| Field               | Required | Meaning  |
| ------------------- | -------- | -------- |
| `libraryEntryId`    | Yes      | Target   |
| `deprecatedBy`      | Yes      | Operator |
| `deprecationReason` | Yes      | Why      |
| `workspaceId`       | Yes      | Tenancy  |

Allowed from: `certified` → `deprecated`.

### 8.3 ArchiveStrategyVersion

| Field            | Required | Meaning  |
| ---------------- | -------- | -------- |
| `libraryEntryId` | Yes      | Target   |
| `archivedBy`     | Yes      | Operator |
| `archiveReason`  | Yes      | Why      |
| `workspaceId`    | Yes      | Tenancy  |

Allowed from: `certified` or `deprecated` → `archived`.

### 8.4 LifecycleResult

| Outcome    | Meaning                                      |
| ---------- | -------------------------------------------- |
| `applied`  | Status transition recorded                   |
| `rejected` | Illegal transition / unknown id              |
| `noop`     | Already in target status (idempotent policy) |

### 8.5 Lifecycle rules

1. Never mutate `contentHash`, envelope, or evidence refs.
2. No `restoreToCertified` method in RC-22.
3. No hard delete.
4. Optional Lake projection of lifecycle facts.
5. Does not forcibly stop running sessions — Session/Risk stop policy remains separate (document interaction; do not redesign Paper).

---

## 9. Explicit non-ports (RC-22)

| Non-port                        | Why forbidden / deferred             |
| ------------------------------- | ------------------------------------ |
| `executeStrategy`               | Runtime ownership                    |
| `selectByMarketState`           | Orchestrator (future)                |
| `updateEnvelopeInPlace`         | Breaks Option B                      |
| `certifyFromLake`               | Lake is projection                   |
| `certifyFromProfitMetric`       | Skips evidence gate                  |
| REST `/bots/.../certify` as SoT | Alias Dictionary — use Library ports |

---

## 10. Compatibility

| Rule                     | Detail                                                                  |
| ------------------------ | ----------------------------------------------------------------------- |
| Additive optional fields | Allowed later with contract amendment note                              |
| Required field removal   | Requires contract revision                                              |
| Alias Dictionary         | Session refs use `tradingSessionId`; Bot is UI alias only               |
| REST                     | Out of this document; if added later, resources are Library-canonical   |
| Knowledge Lake           | Library may admit projections; never read Lake to authorize eligibility |

---

## 11. Compatibility with Authority Matrix

| Concern                 | Contract implication                                         |
| ----------------------- | ------------------------------------------------------------ |
| Certified algorithm SoT | Certification + Lookup + Lifecycle own Library facts         |
| Tactical config in use  | Envelope SoT on Library; Deployment may snapshot             |
| Session lifecycle       | Eligibility consumed at bind — Session remains lifecycle SoT |
| Knowledge Lake          | Projection admits only                                       |
| Orchestrator            | Future consumer of Lookup/Eligibility — not money SoT        |

---

## 12. Acceptance for this contract

Reviewers agree:

1. Five locked capabilities are sufficient for Epics 2–6.
2. No REST/schema inventiveness required to approve.
3. Immutability + human certification + eligibility fail-closed are mandatory.
4. Ownership and Alias Dictionary rules are enforceable in review.

**STOP:** Contract only. Implementation waits for plan + domain + API approval.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
