# Runtime Enforcement (`runtime-enforcement`)

**RC:** RC-23  
**Epic:** 5 — Trading Session start protection (authorization consume)
**Authority class:** Gate (PASS/FAIL over Strategy Library reads)

## Purpose

Single validation boundary between Strategy Library (SoT) and Trading Session / Strategy Deployment.

**RC-23 validates. RC-23 does not decide.**

## Epic 3–4 surface

| Surface                                        | Active                                      |
| ---------------------------------------------- | ------------------------------------------- |
| Boundary descriptor + ownership invariants     | **Yes**                                     |
| Library Lookup / Eligibility consumption       | **Yes** (read-only)                         |
| `RuntimeEnforcementPort.validateDeployment`    | **Yes**                                     |
| Strategy Deployment create/approve consumption | **Yes** (Epic 4)                            |
| Trading Session start refusal                  | **Yes** (Epic 5 — authorization check only) |
| Persistence / REST / queues                    | No                                          |

## Validation result

Immutable `EnforcementDecision`:

- `validation`: `VALID` | `INVALID` (VALID ≡ `pass`, INVALID ≡ `fail`)
- `reasons[]`: deterministic contract catalog codes
- Expected failures return INVALID — do not throw

## Ownership

| Concern                                   | Owner               |
| ----------------------------------------- | ------------------- |
| Certification / eligibility / envelope    | Strategy Library    |
| PASS / FAIL (VALID / INVALID)             | Runtime Enforcement |
| Session lifecycle (Bot ≡ Session)         | Trading Session     |
| Deployment binding (Mission ≡ Deployment) | Strategy Deployment |

## Non-goals (Epic 3)

- No Deployment bind rejection wiring (Epic 4)
- No Trading Session start refusal (Epic 5)
- No Orchestrator / Market State / Selection
- No Library ownership changes

See: `docs/project/rc-23-epic3-runtime-validation-gate.md`
