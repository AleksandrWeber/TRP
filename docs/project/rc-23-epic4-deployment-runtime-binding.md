# RC-23 Epic 4 — Deployment Runtime Binding

**Status:** Epic 4 approved — Epic 5 implemented (awaiting review)
**Date:** 2026-08-10  
**Nature:** Additive Gate consumption on Strategy Deployment bind — no Session lifecycle rewrite  
**Parent:** [RC-23 Implementation Plan](./rc-23-implementation-plan.md) · [Epic Breakdown](./rc-23-epic-breakdown.md)  
**Contracts:** [API Contract](./rc-23-api-contract.md) §6.1 · [Enforcement Contract](./rc-23-runtime-enforcement-contract.md)  
**Predecessor:** [Epic 3 Validation Gate](./rc-23-epic3-runtime-validation-gate.md) (**approved**)

---

## Implementation Report

### What shipped

- `StrategyDeploymentModule` imports `RuntimeEnforcementModule`
- `StrategyDeploymentService.create` and `.approve` call `RuntimeEnforcementPort.validateDeployment` with `purpose: 'deployment_bind'` **before** persistence / Outbox
- Identity mapping: Deployment `strategyId` + `strategyVersion` → Gate `strategyFamilyId` + `strategyVersion`
- Optional tactic bounds: `instrument` / `timeframe` forwarded as `tacticPoint`
- On INVALID: throw `RuntimeEnforcementRejectedError` carrying deterministic `reasons[]`
- No partial state: create/save/Outbox not called on FAIL
- Already-APPROVED approve remains idempotent no-op (no re-Gate required for Epic 4)
- Controller maps rejection → HTTP **422** with `{ validation, reasons, … }`
- Runtime Enforcement remains the sole validation boundary (no duplicated Library rules)
- Trading Session module untouched (Epic 5)

### Modules touched

| Path                                                        | Change                            |
| ----------------------------------------------------------- | --------------------------------- |
| `strategy-deployment/strategy-deployment.service.ts`        | Gate hook on create + approve     |
| `strategy-deployment/strategy-deployment.module.ts`         | Import `RuntimeEnforcementModule` |
| `strategy-deployment/strategy-deployment.controller.ts`     | Map enforcement rejection → 422   |
| `runtime-enforcement/runtime-enforcement-rejected.error.ts` | **New** typed rejection           |
| `runtime-enforcement/index.ts`                              | Export rejection error            |

### Ports / APIs affected

| Surface                                     | Status                           |
| ------------------------------------------- | -------------------------------- |
| `RuntimeEnforcementPort.validateDeployment` | Consumed by Deployment           |
| Deployment create / approve HTTP            | Rejects INVALID with `reasons[]` |
| Trading Session create / start              | **Untouched**                    |
| Strategy Library ownership                  | **Untouched**                    |

### Explicit out of scope (confirmed absent)

- Session start refusal wiring (Epic 5)
- Orchestrator / Selection / Market State
- Paper Trading architecture changes
- Duplicated validation logic in Deployment
- Library ownership / write changes
- Retries / fallback validation

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Deployment already owned binding SoT; Gate already owned validation;
this epic only wires the consumer call)

Canonical ownership changed:
None
- Strategy Library = cert/eligibility/envelope SoT
- Runtime Enforcement = sole validation Gate
- Strategy Deployment = deployment flow / binding SoT
- Trading Session = lifecycle SoT (unchanged)

New runtime:
None (existing Gate; existing Deployment commands)

Backward compatibility:
100% for VALID Library-permitted binds; INVALID now fail-closed at bind

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                        | Result                                                |
| ------------------------------ | ----------------------------------------------------- |
| Spec v2.0 §5.2 / §5.6 / §8     | **Compatible** — certified-only path enforced at bind |
| Authority Matrix               | **Compatible** — ownership unchanged                  |
| Alias Dictionary               | **Compatible** — Mission ≡ Deployment; Bot ≡ Session  |
| Runtime Enforcement sole Gate  | **PASS**                                              |
| Existing VALID deployment flow | **Preserved** (US211 behaviour when Gate PASSes)      |
| Trading Session lifecycle      | **Unaffected** this epic                              |
| Strategy Library SoT           | **Preserved**                                         |
| No Orchestrator / Selection    | **PASS**                                              |

### Architecture validation checklist

| Check                                            | Result                         |
| ------------------------------------------------ | ------------------------------ |
| Spec v2.0 compatibility                          | **PASS**                       |
| Authority Matrix compatibility                   | **PASS**                       |
| Alias Dictionary compatibility                   | **PASS**                       |
| Runtime Enforcement remains only validation gate | **PASS**                       |
| Session never starts from FAILED bind            | **PASS** (no APPROVED created) |

---

## Tests Summary

| Suite                            | File                                              | Result        |
| -------------------------------- | ------------------------------------------------- | ------------- |
| Deployment + Gate service        | `strategy-deployment.service.spec.ts`             | **PASS** (7)  |
| Controller 422 mapping           | `strategy-deployment.controller.spec.ts`          | **PASS** (4)  |
| Session startability implication | `strategy-deployment.enforcement-session.spec.ts` | **PASS** (1)  |
| Domain                           | `domain/strategy-deployment.spec.ts`              | **PASS** (4)  |
| Runtime Enforcement (unchanged)  | `runtime-enforcement/**`                          | **PASS** (32) |

**Gate:**  
`pnpm --filter api exec vitest run src/modules/strategy-deployment src/modules/runtime-enforcement`  
→ **48/48 PASS** (after controller test addition)

Coverage intent:

- VALID → create/approve continues (existing flow)
- INVALID → rejected; no create/save/Outbox
- Deterministic `reasons[]` preserved
- No partial deployment state
- Session cannot start from DRAFT after failed approve
- Backward compatible when Gate PASSes

---

## Documentation Update Summary

| Document                                                    | Update                          |
| ----------------------------------------------------------- | ------------------------------- |
| This Epic Report                                            | **New**                         |
| [RC-23 Epic Breakdown](./rc-23-epic-breakdown.md)           | Epic 4 DoD checked              |
| [RC-23 Implementation Plan](./rc-23-implementation-plan.md) | Status → Epic 4 awaiting review |
| `docs/README.md`                                            | Index Epic 4                    |
| Module comments                                             | Deployment consumes Gate        |

---

## Epic 4 Definition of Done

- [x] Deployment bind/create path invokes Runtime Enforcement before binding succeeds.
- [x] FAIL ⇒ bind rejected; no Session-startable deployment created (fail-closed).
- [x] PASS ⇒ existing bind behaviour continues (no selection logic).
- [x] Tests: eligible certified member binds; enforcement failure rejects bind.
- [x] Deployment still does not own certification or eligibility SoT.
- [x] No Orchestrator / Market State / Selection.

**STOP:** Epic 4 complete for review. Do not start Epic 5 until approved.
