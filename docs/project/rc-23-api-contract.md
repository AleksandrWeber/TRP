# RC-23 API Contract — Runtime Enforcement

**Document:** RC-23 API Contract  
**Status:** APPROVED — Epic 1 inactive ports declared (awaiting review)  
**Date:** 2026-08-10  
**Nature:** Application **ports only**. **No REST. No database schema. No transport product. No queue. No event bus. No implementation.**

**Parent:** [RC-23 Implementation Plan](./rc-23-implementation-plan.md)  
**Enforcement:** [Runtime Enforcement Contract](./rc-23-runtime-enforcement-contract.md)  
**Epics:** [Epic Breakdown](./rc-23-epic-breakdown.md)  
**Integration:** [Integration Diagram](./rc-23-runtime-integration-diagram.md)  
**Library ports (consume):** [RC-22 API Contract](./rc-22-api-contract.md) Lookup · Eligibility  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.2, §5.6  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md)  
**Process:** [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) — API Contract stage

---

## 1. Purpose

Lock the **application ports** Runtime Enforcement exposes and the Library **read** ports it consumes so Epics implement one contract.

This document deliberately does **not** define:

- HTTP routes / OpenAPI
- Prisma / SQL / table layouts
- Kafka, Redis, queues, or bus topics
- UI commands or Command Center widgets
- Trading Orchestrator or Market State APIs
- Strategy Selection APIs
- Paper Trading redesign

Transports and persistence are Epic implementation choices after approval — provided they preserve ownership and fail-closed rules.

---

## 2. Ownership of the contract

| Concern                          | Owner                                             |
| -------------------------------- | ------------------------------------------------- |
| Runtime Enforcement ports        | Runtime Enforcement module (RC-23)                |
| Library membership / eligibility | Strategy Library (RC-22 SoT) — **read only** here |
| Deployment bind / Session start  | Existing owners — **consume** enforcement         |
| Naming (product vs canonical)    | Alias Dictionary                                  |

**Canonical names:** `RuntimeEnforcement`, `tradingSessionId`, `libraryEntryId` / Library ids — never a Bot aggregate as enforcement SoT.

---

## 3. Port overview (locked)

```text
Existing deployment request
        │
        ▼
RuntimeEnforcementPort.validateDeployment(...)
        │
        ├──▶ StrategyLibraryLookupPort          (read)
        ├──▶ StrategyLibraryEligibilityPort     (read)
        └──▶ (related Library reads: cert / envelope via Lookup or dedicated read helpers)
        │
        ▼
EnforcementDecision { PASS | FAIL + reasons[] }
        │
        ├── PASS → Strategy Deployment bind / Trading Session start (existing owners)
        └── FAIL → Deployment rejected
```

Locked capabilities:

| Capability                         | Port / consumption                         |
| ---------------------------------- | ------------------------------------------ |
| Validate deployment request        | `RuntimeEnforcementPort`                   |
| Resolve Strategy / Version / facts | `StrategyLibraryLookupPort` (consume)      |
| Resolve eligibility                | `StrategyLibraryEligibilityPort` (consume) |
| Bind after PASS                    | Existing Strategy Deployment (consumer)    |
| Start Session after PASS           | Existing Trading Session (consumer)        |

No Orchestrator, Selection, Certification-write, or Lake-authority ports are in RC-23 scope.

---

## 4. Runtime Enforcement port

### 4.1 Interface (logical)

```text
RuntimeEnforcementPort
  validateDeployment(cmd: ValidateDeploymentRequest) → EnforcementDecision
```

### 4.2 ValidateDeploymentRequest

| Field              | Required | Meaning                                                         |
| ------------------ | -------- | --------------------------------------------------------------- |
| `workspaceId`      | Yes      | Tenancy                                                         |
| `strategyFamilyId` | Yes*     | Library Strategy family (*or resolvable via `libraryEntryId`)   |
| `strategyVersion`  | Yes*     | Version identity (*or resolvable via `libraryEntryId`)          |
| `libraryEntryId`   | No*      | Preferred certified entry id when already known                 |
| `exchangeScopeId`  | No       | If present, must be allowed by Library version / envelope       |
| `tacticPoint`      | No       | If present, must be ⊆ Library Tactical Envelope (Option B)      |
| `purpose`          | Yes      | `deployment_bind` \| `session_start` (enforcement context only) |
| `tradingSessionId` | No       | Correlation only — **never** used as Library authority          |
| `requestedAt`      | No       | Caller timestamp; gate may stamp `checkedAt`                    |

\* Identity rule: request must identify a unique Library StrategyVersion (via `libraryEntryId` **or** `strategyFamilyId` + `strategyVersion`). Ambiguous identity ⇒ FAIL.

### 4.3 EnforcementDecision

| Field                 | Meaning                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `outcome`             | `pass` \| `fail`                                                    |
| `reasons[]`           | Machine-readable codes (see Enforcement Contract catalog)           |
| `libraryEntryId`      | Resolved entry id when known                                        |
| `certificationStatus` | Library status snapshot when known (`certified` / `deprecated` / …) |
| `eligibilityOutcome`  | `eligible` \| `ineligible` \| `unknown` when known                  |
| `checkedAt`           | Gate timestamp                                                      |

### 4.4 Enforcement rules (port-level)

1. `pass` only if **all** Runtime Enforcement Contract requirements succeed.
2. `fail` is mandatory when any requirement fails — **no soft-fail**.
3. Port **must not** write certification, eligibility, or envelope SoT.
4. Port **must not** select among strategies or invent tactic points.
5. Port **must not** authorize from Knowledge Lake.
6. Eligibility ≠ Risk approval — Risk Engine remains mandatory on the executable path after Session start.
7. Consumers: Strategy Deployment bind and Trading Session start. Future Orchestrator may reuse the same port; building Orchestrator is out of scope.

---

## 5. Library consumer ports (read)

RC-23 does not redefine Library SoT ports. It **consumes** RC-22 ports (activating application read wiring as needed):

### 5.1 StrategyLibraryLookupPort (consume)

```text
StrategyLibraryLookupPort
  getByLibraryEntryId(libraryEntryId) → StrategyVersionRecord | null
  getByFamilyVersion(strategyFamilyId, version) → StrategyVersionRecord | null
```

Used to verify Strategy exists, StrategyVersion exists, and to obtain certification status + envelope binding facts needed by the gate.

### 5.2 StrategyLibraryEligibilityPort (consume)

```text
StrategyLibraryEligibilityPort
  checkEligibility(query: EligibilityQuery) → EligibilityDecision
```

Used to verify StrategyEligibility exists and outcome is `eligible` for the deployment purpose.

### 5.3 Read rules

1. Reads are authoritative only when backed by Strategy Library SoT.
2. Missing record ⇒ enforcement FAIL (not “assume eligible”).
3. Deprecated / archived certification ⇒ FAIL for new binds / starts.
4. Envelope absence ⇒ FAIL.
5. Forbidden: implementing these reads by querying Knowledge Lake as authority.

---

## 6. Consumer obligations (Deployment / Session)

### 6.1 Strategy Deployment

| Obligation             | Rule                                                                             |
| ---------------------- | -------------------------------------------------------------------------------- |
| Before successful bind | Call `RuntimeEnforcementPort.validateDeployment` with `purpose: deployment_bind` |
| On `fail`              | Reject bind; surface `reasons[]`; do not create a startable certified binding    |
| On `pass`              | Continue existing bind behaviour                                                 |

### 6.2 Trading Session

| Obligation   | Rule                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| Before start | Ensure enforcement PASS for the deployment (`purpose: session_start` and/or verified prior bind PASS per Epic policy) |
| On `fail`    | Refuse start; surface `reasons[]`                                                                                     |
| On `pass`    | Start via existing Session lifecycle                                                                                  |

Session refs use `tradingSessionId`. Bot is UI alias only (Alias Dictionary).

---

## 7. Explicit non-ports (RC-23)

| Non-port                        | Why forbidden / deferred         |
| ------------------------------- | -------------------------------- |
| `selectStrategy`                | Orchestrator / Selection (later) |
| `classifyMarketState`           | Market State (later)             |
| `certifyStrategy`               | Library write — not Runtime      |
| `updateEnvelopeInPlace`         | Breaks Option B                  |
| `authorizeFromLake`             | Lake is Projection               |
| `approveRiskBecauseCertified`   | Eligibility ≠ Risk               |
| `mutateLiveParameters`          | Forbidden live mutation          |
| REST `/bots/.../enforce` as SoT | Alias Dictionary — ports first   |

---

## 8. Compatibility

| Rule                     | Detail                                                                   |
| ------------------------ | ------------------------------------------------------------------------ |
| Additive optional fields | Allowed later with contract amendment note                               |
| Required field removal   | Requires contract revision                                               |
| Alias Dictionary         | `tradingSessionId`; Mission ≡ Deployment; Bot ≡ Session                  |
| RC-22 ports              | Lookup/Eligibility semantics preserved; RC-23 activates read consumption |
| Knowledge Lake           | Never an enforcement input authority                                     |
| REST / DB / transport    | Out of this document                                                     |

---

## 9. Compatibility with Authority Matrix

| Concern                        | Contract implication                                             |
| ------------------------------ | ---------------------------------------------------------------- |
| Certified algorithm SoT        | Remains Strategy Library; Enforcement only verifies              |
| Tactical config in use         | Envelope SoT on Library; Enforcement checks existence / ⊆ bounds |
| Session lifecycle              | Unchanged Session SoT; start gated by Enforcement                |
| Knowledge Lake                 | Projection only — forbidden as gate authority                    |
| Orchestrator                   | Future consumer of same gate — not built in RC-23                |
| Risk / Orders / Fills / Ledger | Untouched                                                        |

---

## 10. Acceptance for this contract

Reviewers agree:

1. One primary enforcement port plus Library read consumption is sufficient for Epics 2–5.
2. No REST/schema/transport inventiveness required to approve.
3. Fail-closed PASS/FAIL + deterministic reasons are mandatory.
4. Runtime never owns certification; Library remains SoT.
5. Ownership and Alias Dictionary rules are enforceable in review.

**STOP:** Contract only. Implementation waits for plan + API + Enforcement Contract approval.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
