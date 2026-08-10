# RC-23 Runtime Enforcement Contract

**Document:** Runtime Enforcement Contract  
**Status:** APPROVED — Epic 1 boundary implemented (awaiting review)  
**Date:** 2026-08-10  
**Nature:** Normative gate contract. **No implementation. No REST. No database. No transport.**

**Parent:** [RC-23 Implementation Plan](./rc-23-implementation-plan.md)  
**API:** [RC-23 API Contract](./rc-23-api-contract.md)  
**Library domain:** [RC-22 Domain Model Contract](./rc-22-domain-model-contract.md)  
**Library eligibility:** [RC-22 Eligibility Policy](./rc-22-epic5-eligibility-policy.md)  
**Constitution:** [Architecture Specification v2.0](./trp-architecture-specification-v2.md) §5.2, §5.6, §8  
**Authority:** [Authority Matrix](./v2-authority-matrix.md) · [Alias Dictionary](./v2-alias-dictionary.md) · [Tactics Contract](./v2-tactics-contract.md)

---

## 1. Purpose

Define the **Runtime Enforcement** gate that verifies a deployment request against Strategy Library Source of Truth before a Trading Session may start.

**RC-23 validates. RC-23 does not decide.**

This contract locks:

- inputs
- outputs
- validation sequence
- rejection reasons
- ownership

---

## 2. Ownership (normative)

| Fact / decision                         | Owner                   | Class                          |
| --------------------------------------- | ----------------------- | ------------------------------ |
| Strategy / StrategyVersion existence    | **Strategy Library**    | SoT                            |
| Certification Active / lifecycle status | **Strategy Library**    | SoT                            |
| StrategyEligibility                     | **Strategy Library**    | SoT / domain gate              |
| Library Tactical Envelope               | **Strategy Library**    | SoT (Option B)                 |
| Enforcement PASS / FAIL                 | **Runtime Enforcement** | Gate over Library reads        |
| Deployment binding                      | Strategy Deployment     | SoT for “what Session runs”    |
| Session lifecycle                       | Trading Session         | SoT (Bot ≡ Session)            |
| Risk approval                           | Risk Engine             | Unchanged — after start path   |
| Knowledge Lake copies                   | Knowledge Lake          | Projection — **not authority** |

### Hard ownership rules

1. **Runtime never owns certification.**
2. **Strategy Library remains the Source of Truth** for membership, certification, eligibility, and envelopes.
3. Runtime Enforcement may only **read** Library facts and emit PASS/FAIL.
4. Trading Session / Deployment must not write Library certification or invent eligibility.
5. Knowledge Lake must not authorize enforcement outcomes.
6. Enforcement is not Strategy Selection and not Trading Orchestrator.

---

## 3. Inputs

### 3.1 Deployment request (from existing flow)

Runtime continues to receive strategies exactly as before. Enforcement does not change _who_ sends the request — only whether it is permitted.

Logical input (aligned with API Contract):

| Input               | Required | Notes                                    |
| ------------------- | -------- | ---------------------------------------- |
| Workspace / tenancy | Yes      | `workspaceId`                            |
| Strategy identity   | Yes      | `libraryEntryId` **or** family + version |
| Purpose             | Yes      | `deployment_bind` or `session_start`     |
| Exchange scope      | Optional | If present, must be Library-allowed      |
| Tactic point        | Optional | If present, must be ⊆ envelope           |
| Session correlation | Optional | `tradingSessionId` — correlation only    |

### 3.2 Library facts (read)

Enforcement resolves against Library SoT:

| Fact                      | Required for PASS                                 |
| ------------------------- | ------------------------------------------------- |
| Strategy (family)         | Exists                                            |
| StrategyVersion           | Exists                                            |
| Certification             | Status **Active** (`certified` / admitted active) |
| StrategyEligibility       | Exists and `eligible`                             |
| Library Tactical Envelope | Exists (bound to certified version)               |

---

## 4. Outputs

| Outcome  | Meaning                                 | Downstream                              |
| -------- | --------------------------------------- | --------------------------------------- |
| **PASS** | All verification requirements succeeded | Deployment may bind / Session may start |
| **FAIL** | One or more requirements failed         | Deployment **rejected**                 |

Every decision includes:

- `outcome`: `pass` \| `fail`
- `reasons[]`: deterministic machine-readable codes
- `checkedAt`
- resolved Library identity/status snapshots when known

**Soft-fail / warn-and-continue is forbidden.**

---

## 5. Validation sequence

Normative order (fail-closed). Implementations may collect multiple reasons, but must not skip earlier existence checks when identity cannot be resolved.

```text
1. Resolve Strategy identity
      → Strategy exists?
2. Resolve StrategyVersion
      → StrategyVersion exists?
3. Resolve Certification
      → Certification is Active?
4. Resolve StrategyEligibility
      → StrategyEligibility exists and outcome = eligible?
5. Resolve Library Tactical Envelope
      → Envelope exists for the certified version?
6. Optional static bounds (when request supplies them)
      → exchangeScopeId allowed?
      → tacticPoint ⊆ envelope?
7. Emit PASS or FAIL with reasons[]
```

### Sequence rules

1. Unknown / unresolvable identity ⇒ FAIL (`strategy_not_found` and/or `strategy_version_not_found`).
2. Certification missing, not admitted, deprecated, archived, or otherwise not Active ⇒ FAIL.
3. Missing eligibility record or `ineligible` ⇒ FAIL.
4. Missing envelope ⇒ FAIL.
5. Optional scope/tactic checks, when provided, must pass or FAIL with envelope/scope codes.
6. PASS requires **all** mandatory steps 1–5 successful (and step 6 when inputs present).
7. Enforcement does not create eligibility, certify, or bind — it only verifies.

---

## 6. Rejection reasons (deterministic catalog)

Reasons are machine-readable. Callers must not depend on free-text alone.

| Code                         | When                                                              |
| ---------------------------- | ----------------------------------------------------------------- |
| `strategy_not_found`         | Strategy family cannot be resolved in Library                     |
| `strategy_version_not_found` | StrategyVersion cannot be resolved                                |
| `identity_ambiguous`         | Request does not uniquely identify a Library version              |
| `certification_missing`      | No certification record for the version                           |
| `certification_not_admitted` | Certification exists but not admitted                             |
| `certification_not_active`   | Certification present but not Active                              |
| `certification_deprecated`   | Certification / status deprecated — no new binds/starts           |
| `certification_archived`     | Certification / status archived — no new binds/starts             |
| `eligibility_missing`        | No StrategyEligibility record                                     |
| `eligibility_ineligible`     | Eligibility record exists with outcome `ineligible`               |
| `envelope_missing`           | Library Tactical Envelope not bound / not found                   |
| `envelope_not_immutable`     | Envelope integrity/immutability invariant violated                |
| `scope_not_allowed`          | Requested `exchangeScopeId` outside Library allowlist / envelope  |
| `envelope_violation`         | Requested `tacticPoint` outside Library Tactical Envelope         |
| `workspace_mismatch`         | Identity resolved outside request workspace (tenancy fail-closed) |

Library domain eligibility codes from RC-22 (e.g. `evidence_incomplete`) may appear when EligibilityPort returns them; Runtime Enforcement maps/propagates them under FAIL without redefining Library SoT.

**Determinism rule:** Same Library state + same request ⇒ same `outcome` and same reason set (ordering may be stable/sorted by implementation, but membership of reasons for a given failure mode must be stable per Epic policy tests).

---

## 7. Session behaviour mapping

```text
Deployment
    ↓
Runtime Enforcement
    ↓
  PASS ──▶ Trading Session starts
    │
  FAIL ──▶ Deployment rejected
           (reasons[] required)
```

| Stage              | Behaviour                               |
| ------------------ | --------------------------------------- |
| Deployment request | Existing flow unchanged in shape        |
| Enforcement        | Verify only                             |
| PASS               | Session may start                       |
| FAIL               | Reject deployment; do not start Session |

---

## 8. What Runtime Enforcement is not

| Not this                         | Why                                        |
| -------------------------------- | ------------------------------------------ |
| Strategy Selection               | Does not choose among strategies           |
| Trading Orchestrator             | No coordination / Market State consumption |
| Market State / Qualification     | Out of RC-23                               |
| Certification authority          | Library owns admit/deprecate/archive       |
| Risk Engine                      | Eligibility ≠ risk approval                |
| Paper Trading redesign           | Only a gate before existing path           |
| Adaptive tactics beyond Option B | No live envelope expansion                 |
| Live parameter mutation          | Forbidden                                  |

---

## 9. Interaction with Strategy Library

```text
Strategy Library (SoT)
        │  read-only
        ▼
Runtime Enforcement (Gate)
        │  PASS / FAIL
        ▼
Trading Session / Deployment consumers
```

- Library may evolve certification lifecycle independently.
- Enforcement always re-reads (or reads via Library ports) — it must not treat a local cache as SoT.
- Conflict on membership: **Library wins**. Runtime must FAIL closed if Library says not permitted.

---

## 10. Acceptance for this contract

Reviewers agree:

1. Five mandatory verification requirements are complete and sufficient for RC-23.
2. Ownership is unambiguous: Library SoT; Runtime Gate; Session lifecycle.
3. Rejection catalog is deterministic and fail-closed.
4. Validates ≠ decides is enforceable in epic review.

**STOP:** Contract only. Wait for approval before Epic 1.

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |
