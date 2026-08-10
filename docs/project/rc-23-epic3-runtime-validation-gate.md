# RC-23 Epic 3 — Runtime Validation Gate

**Status:** Epic 3 approved — Epic 4 implemented (awaiting review)
**Date:** 2026-08-10  
**Nature:** Additive Gate validation only — no Session / Deployment product hooks  
**Parent:** [RC-23 Implementation Plan](./rc-23-implementation-plan.md) · [Epic Breakdown](./rc-23-epic-breakdown.md)  
**Contracts:** [Runtime Enforcement Contract](./rc-23-runtime-enforcement-contract.md) §§4–6 · [API Contract](./rc-23-api-contract.md) §4  
**Predecessor:** [Epic 2 Library Reads](./rc-23-epic2-strategy-library-read-integration.md) (**approved**)

---

## Implementation Report

### What shipped

- Pure `validateDeployment(cmd, reads)` sequence (Enforcement Contract §5)
- Nest `RuntimeEnforcementGateService` implementing `RuntimeEnforcementPort`
- `RUNTIME_ENFORCEMENT_PORT` Nest provider (callable; not hooked to Deployment/Session)
- Immutable `EnforcementDecision`:
  - `outcome`: `pass` | `fail` (API Contract)
  - `validation`: `VALID` | `INVALID` (VALID ≡ pass, INVALID ≡ fail)
  - deterministic `reasons[]` from the contract catalog
- Mandatory checks:
  1. Strategy exists
  2. StrategyVersion exists
  3. Certification Active
  4. StrategyEligibility exists and eligible
  5. Library Tactical Envelope exists
- Expected failures return INVALID — **no business exceptions**
- Boundary posture: `activePorts.validateDeployment = true`
- Library remains sole owner of Certification / Eligibility / Envelope (read-only)

### Modules touched

| Path                                                                                   | Change                                              |
| -------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `apps/api/src/modules/runtime-enforcement/domain/validate-deployment.ts`               | **New** pure Gate                                   |
| `apps/api/src/modules/runtime-enforcement/runtime-enforcement-gate.service.ts`         | **New** Nest adapter                                |
| `apps/api/src/modules/runtime-enforcement/runtime-enforcement.module.ts`               | Provide `RUNTIME_ENFORCEMENT_PORT`                  |
| `apps/api/src/modules/runtime-enforcement/ports/runtime-enforcement.port.ts`           | Activate validateDeployment; add `validation` field |
| `apps/api/src/modules/runtime-enforcement/domain/runtime-enforcement-boundary.ts`      | Port posture                                        |
| `apps/api/src/modules/runtime-enforcement/runtime-enforcement-library-read.service.ts` | `familyExistsInWorkspace` helper                    |

### Ports / APIs affected

| Port                                        | Status                |
| ------------------------------------------- | --------------------- |
| `RuntimeEnforcementPort.validateDeployment` | **Active** (isolated) |
| Library Lookup / Eligibility                | Active (consume only) |
| Strategy Deployment bind                    | **Untouched**         |
| Trading Session start                       | **Untouched**         |
| REST / persistence                          | **None**              |

### Explicit out of scope (confirmed absent)

- Deployment rejection at product bind path
- Trading Session start/stop
- Orchestrator / Selection / Market State
- Library ownership / write changes
- Soft-fail / warn-and-continue
- REST / persistence / queues

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Runtime Enforcement Gate already on Spec §5.2 / Integration Diagram;
this epic activates the validation sequence only)

Canonical ownership changed:
None (Library remains SoT for cert/eligibility/envelope;
Enforcement owns PASS/FAIL / VALID/INVALID only)

New runtime:
None (gate is callable; not wired into Session/Deployment flows)

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                    | Result                                                |
| -------------------------- | ----------------------------------------------------- |
| Spec v2.0 §5.2 / §5.6 / §8 | **Compatible** — validates library members only       |
| Authority Matrix           | **Compatible** — Library SoT unchanged; Gate verifies |
| Alias Dictionary           | **Compatible** — `tradingSessionId` correlation only  |
| Strategy Library ownership | **Preserved** — reads only; no store/mutate           |
| Trading Session lifecycle  | **Unaffected**                                        |
| Strategy Deployment flow   | **Unaffected**                                        |
| Knowledge Lake             | **Untouched** — never gate authority                  |
| Dependency direction       | **Preserved** — Enforcement → Library                 |

### Architecture validation checklist

| Check                                     | Result   |
| ----------------------------------------- | -------- |
| Spec v2.0 compatibility                   | **PASS** |
| Authority Matrix compatibility            | **PASS** |
| Alias Dictionary compatibility            | **PASS** |
| Runtime does not affect Session lifecycle | **PASS** |
| Validates ≠ decides                       | **PASS** |
| No Library ownership transfer             | **PASS** |

---

## Tests Summary

| Suite                 | File                                          | Result        |
| --------------------- | --------------------------------------------- | ------------- |
| Gate sequence (unit)  | `domain/validate-deployment.spec.ts`          | **PASS** (10) |
| Gate Nest integration | `runtime-enforcement-gate.spec.ts`            | **PASS** (3)  |
| Boundary posture      | `domain/runtime-enforcement-boundary.spec.ts` | **PASS** (10) |
| Ports posture         | `ports/runtime-enforcement.port.spec.ts`      | **PASS** (1)  |
| Module wiring         | `runtime-enforcement.module.spec.ts`          | **PASS** (1)  |
| Library reads         | `runtime-enforcement-library-read.spec.ts`    | **PASS** (4)  |
| Dependency direction  | `runtime-enforcement.boundaries.spec.ts`      | **PASS** (3)  |

**Gate:** `pnpm --filter api exec vitest run src/modules/runtime-enforcement` → **32/32 PASS**

Coverage intent:

- valid deployment → VALID / pass
- missing strategy → `strategy_not_found`
- missing version → `strategy_version_not_found`
- inactive certification → `certification_deprecated`
- missing eligibility → `eligibility_missing`
- missing tactical envelope → `envelope_missing`
- certification missing → `certification_missing`
- deterministic reason membership
- no throw on expected failures
- dependency direction preserved
- no Session/Deployment hooks

---

## Documentation Update Summary

| Document                                                    | Update                          |
| ----------------------------------------------------------- | ------------------------------- |
| This Epic Report                                            | **New**                         |
| [RC-23 Epic Breakdown](./rc-23-epic-breakdown.md)           | Epic 3 DoD checked              |
| [RC-23 Implementation Plan](./rc-23-implementation-plan.md) | Status → Epic 3 awaiting review |
| `docs/README.md`                                            | Index Epic 3                    |
| Module README                                               | Gate surface updated            |

---

## Epic 3 Definition of Done

- [x] `RuntimeEnforcementPort.validateDeployment(...)` implements the locked sequence.
- [x] Checks all five requirements: Strategy, StrategyVersion, Active Certification, StrategyEligibility, Library Tactical Envelope.
- [x] PASS / VALID only when all requirements succeed.
- [x] FAIL / INVALID returns deterministic machine-readable reason codes (contract catalog).
- [x] Tests: happy path; each single-point failure; deterministic reasons.
- [x] Gate does not certify, deprecate, select, mutate envelopes, or call Risk/Orders.
- [x] Compiles and passes tests independently of Session start wiring.

**STOP:** Epic 3 complete for review. Do not start Epic 4 until approved.
