# RC-23 Epic 5 — Trading Session Runtime Start Protection

**Status:** Approved  
**Date:** 2026-08-10  
**Nature:** Defensive Session start protection via Deployment authorization stamp — no second Gate run  
**Parent:** [RC-23 Implementation Plan](./rc-23-implementation-plan.md) · [Epic Breakdown](./rc-23-epic-breakdown.md)  
**Contracts:** [API Contract](./rc-23-api-contract.md) §6.2 · [Enforcement Contract](./rc-23-runtime-enforcement-contract.md)  
**Predecessor:** [Epic 4 Deployment Binding](./rc-23-epic4-deployment-runtime-binding.md) (**approved**)

---

## Implementation Report

### What shipped

- Deployment persists prior Runtime Enforcement PASS as `enforcementAuthorization` (outside `configurationHash`)
- Prisma column `enforcement_authorization` + migration
- Epic 4 create/approve stamp PASS decision on Deployment after Gate VALID
- `TradingSessionService.start` (strategy origin) checks Deployment authorization **before** `CREATED → STARTING`
- Session does **not** call `validateDeployment`
- Session does **not** call Strategy Library
- Missing / invalid authorization → `DeploymentAuthorizationRefusedError` with deterministic reasons; no persist / no Runtime arm
- Manual-origin sessions unchanged
- Lifecycle model unchanged apart from the start guard

### Modules touched

| Path                                                               | Change                              |
| ------------------------------------------------------------------ | ----------------------------------- |
| `strategy-deployment/domain/strategy-deployment.ts`                | Authorization type + stamp helpers  |
| `strategy-deployment/strategy-deployment.service.ts`               | Persist Gate PASS on create/approve |
| `strategy-deployment/persistence/prisma-*.ts`                      | Map/persist authorization           |
| `apps/api/prisma/schema.prisma` + migration                        | `enforcement_authorization` JSON    |
| `trading-session/trading-session.service.ts`                       | Start authorization assert          |
| `trading-session/domain/deployment-authorization-refused.error.ts` | **New** refusal error               |

### Ports / APIs affected

| Surface                                     | Status                                 |
| ------------------------------------------- | -------------------------------------- |
| `RuntimeEnforcementPort.validateDeployment` | Still only at Deployment bind (Epic 4) |
| Trading Session start                       | Authorization check only               |
| Strategy Library                            | **Not called from Session**            |

### Explicit out of scope (confirmed absent)

- Second Gate validation at start
- Direct Library reads from Session
- Orchestrator / Selection
- Session lifecycle model redesign
- Retries / bypasses
- Paper / Risk / Orders / Execution ownership changes

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(prior-bind PASS already contracted; this epic materializes the stamp + Session check)

Canonical ownership changed:
None
- Strategy Library = SoT (cert/eligibility/envelope)
- Runtime Enforcement = sole validation authority (Gate)
- Strategy Deployment = owns deployment flow + authorization stamp
- Trading Session = lifecycle only; consumes authorization

New runtime:
None

Backward compatibility:
100% for validated APPROVED deployments with stamp;
legacy APPROVED without stamp fail-closed at start

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                                       | Result                                               |
| --------------------------------------------- | ---------------------------------------------------- |
| Spec v2.0 §5.2 / §5.6 / §8                    | **Compatible**                                       |
| Authority Matrix                              | **Compatible** — ownership unchanged                 |
| Alias Dictionary                              | **Compatible** — Bot ≡ Session; Mission ≡ Deployment |
| Runtime Enforcement sole validation authority | **PASS**                                             |
| No duplicate Gate at start                    | **PASS**                                             |
| Session lifecycle (aside from start guard)    | **Unchanged**                                        |

### Architecture validation checklist

| Check                                                   | Result   |
| ------------------------------------------------------- | -------- |
| Spec v2.0 compatibility                                 | **PASS** |
| Authority Matrix compatibility                          | **PASS** |
| Alias Dictionary compatibility                          | **PASS** |
| Runtime Enforcement remains single validation authority | **PASS** |
| Session does not call Library                           | **PASS** |

---

## Tests Summary

| Suite                           | File                                   | Result        |
| ------------------------------- | -------------------------------------- | ------------- |
| Session start protection        | `trading-session.service.spec.ts`      | **PASS** (10) |
| Deployment stamp domain         | `strategy-deployment/domain/*.spec.ts` | **PASS**      |
| Deployment service stamp        | `strategy-deployment.service.spec.ts`  | **PASS**      |
| Runtime Enforcement (unchanged) | `runtime-enforcement/**`               | **PASS**      |

**Gate:**  
`pnpm --filter api exec vitest run src/modules/strategy-deployment src/modules/trading-session/trading-session.service.spec.ts src/modules/runtime-enforcement`  
→ **59/59 PASS**

Coverage intent:

- Validated deployment (PASS stamp) allows start
- Missing authorization blocks start
- Invalid authorization blocks start
- No Gate re-call from Session
- No partial Session persist on refusal
- Manual origin unchanged

---

## Documentation Update Summary

| Document                                                    | Update                          |
| ----------------------------------------------------------- | ------------------------------- |
| This Epic Report                                            | **New**                         |
| [RC-23 Epic Breakdown](./rc-23-epic-breakdown.md)           | Epic 5 DoD checked              |
| [RC-23 Implementation Plan](./rc-23-implementation-plan.md) | Status → Epic 5 awaiting review |
| `docs/README.md`                                            | Index Epic 5                    |

---

## Epic 5 Definition of Done

- [x] Session start path requires prior Runtime Enforcement PASS for the deployment under start.
- [x] FAIL / missing ⇒ start refused; deterministic reasons surfaced.
- [x] PASS stamp ⇒ Session starts via existing lifecycle.
- [x] Tests: PASS starts; missing/invalid refuse; no duplicate Gate.
- [x] Session never writes Library certification; no reverse dependency.
- [x] Paper adapter / Risk / Orders / Execution ownership unchanged.

**STOP:** Epic 5 complete for review. Do not start Epic 6 until approved.
