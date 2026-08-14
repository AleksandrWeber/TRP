# RC-28 Epic 1 — Platform Integration Boundaries

**Status:** **approved**  
**Date:** 2026-08-14  
**Nature:** Integration audit only. No new functionality, modules, APIs, ownership, runtime, or Source of Truth.  
**Parent:** [RC-28 Implementation Plan](./rc-28-implementation-plan.md) · [Epic Breakdown](./rc-28-epic-breakdown.md)  
**Contracts:** [API Contract (conformance)](./rc-28-api-contract.md) · [Integration Diagram](./rc-28-integration-diagram.md)  
**Boundary catalog:** [rc-28-epic1-integration-boundary-report.md](./rc-28-epic1-integration-boundary-report.md)  
**Boundary diagram:** [rc-28-epic1-boundary-diagram.md](./rc-28-epic1-boundary-diagram.md)

---

## Implementation Report

### What shipped

- Verification catalog at `apps/api/src/platform-conformance/` (**not** a Nest module; **not** registered in `AppModule`)
- Frozen platform descriptor `V2_PLATFORM_BOUNDARY` composing existing RC-21…RC-27 boundary constants
- Integration graph: allowed consume edges + named forbidden reverse edges + cycle check
- Ownership graph: sole-owner map for the twelve V2 surfaces; Freeze owners remain external
- Production import scan of V2 Nest modules against the allowed graph
- Command Center UI compile-integrity check (pause/resume/stop via Session APIs only)
- Module README stating this catalog is an audit, not a domain

### Modules touched

| Path                                   | Change                                      |
| -------------------------------------- | ------------------------------------------- |
| `apps/api/src/platform-conformance/**` | **New** — verification catalog + tests only |
| Existing V2 Nest modules (RC-20…RC-27) | **Untouched**                               |
| `apps/api/src/app.module.ts`           | **Untouched** — no new import               |

### Ports / APIs affected

**None.** No new ports. Existing RC-19…RC-27 ports remain owned by their closed modules.

### Explicit out of scope (confirmed absent)

- Cross-domain workflow verification (Epic 2)
- Authority Matrix / Alias edits (Epic 3)
- End-to-end scenario harness (Epic 4)
- Performance / resilience product (Epic 5)
- Version 2 certification closeout (Epic 6)
- New Nest providers, REST, persistence, transport, UI
- Behavioural changes in any closed module

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(RC-28 Epic 1 records already-approved Spec v2.0 module boundaries
as a verification catalog. No thirteenth business module.)

Canonical ownership changed:
None

New runtime:
None

New application ports:
None

Backward compatibility:
100%

Architecture debt introduced:
None
```

---

## Compatibility Report

| Surface                              | Result                                                              |
| ------------------------------------ | ------------------------------------------------------------------- |
| Spec v2.0 §§5–7 / §11                | **Compatible** — complete module set verified; no new Spec concepts |
| Authority Matrix                     | **Unmodified** — sole owners preserved                              |
| Alias Dictionary                     | **Unmodified** — Bot / Cluster / Wallet / Brain mappings unchanged  |
| Cluster Isolation Invariants         | **Compatible** — Scope isolation-only; engines singleton            |
| RC-20 Command Center                 | **Untouched** — UI ops surface confirmed                            |
| RC-21 Knowledge Lake                 | **Untouched** — projection class preserved                          |
| RC-22 Strategy Library               | **Untouched** — certification SoT preserved                         |
| RC-23 Runtime Enforcement            | **Untouched** — fail-closed Gate preserved                          |
| RC-24 Reporting / AI / Notification  | **Untouched** — projection / narrative / delivery preserved         |
| RC-25 Qualification / Profile        | **Untouched** — research owners preserved                           |
| RC-26 Market State / Orchestrator    | **Untouched** — current-condition / coordination preserved          |
| RC-27 Exchange Scope                 | **Untouched** — isolation-only preserved                            |
| Frozen paper path (ADR-012…018)      | **Compatible** — no path changes                                    |
| Duplicate Runtime / Risk / Execution | **None**                                                            |

### Architecture validation checklist

| Check                                            | Result   |
| ------------------------------------------------ | -------- |
| Spec v2.0 compatibility                          | **PASS** |
| Authority Matrix compatibility                   | **PASS** |
| Alias Dictionary compatibility                   | **PASS** |
| No new domain / SoT / product port               | **PASS** |
| No ownership conflicts                           | **PASS** |
| No circular V2 Nest dependencies                 | **PASS** |
| No forbidden reverse edges in production imports | **PASS** |
| Exchange Scope remains isolation-only            | **PASS** |
| RC-19…RC-27 closed modules intact                | **PASS** |

---

## Tests Summary

| Suite             | File                                                | Result       |
| ----------------- | --------------------------------------------------- | ------------ |
| Platform boundary | `platform-conformance/v2-platform-boundary.spec.ts` | **PASS** (3) |
| Integration graph | `platform-conformance/v2-integration-graph.spec.ts` | **PASS** (4) |
| Ownership graph   | `platform-conformance/v2-ownership-graph.spec.ts`   | **PASS** (5) |
| Dependency graph  | `platform-conformance/v2-dependency-graph.spec.ts`  | **PASS** (5) |
| Compile integrity | `platform-conformance/v2-compile-integrity.spec.ts` | **PASS** (4) |

**Gate:** `pnpm --filter api exec vitest run src/platform-conformance` → **21/21 PASS**

Coverage intent:

- Twelve V2 surfaces catalogued; audit is not a Nest module or SoT
- Allowed consume graph is acyclic; named reverse/steal edges are disjoint
- Production Nest imports among V2 modules ⊆ allowed consume set
- Unique owned concerns across closed Nest boundary descriptors
- AppModule still wires every V2 Nest module and does not import the catalog
- Command Center remains the web ops surface; session commands only

---

## Documentation Update Summary

| Document                                                                    | Update                                        |
| --------------------------------------------------------------------------- | --------------------------------------------- |
| This Epic Report                                                            | **New**                                       |
| [Integration Boundary Report](./rc-28-epic1-integration-boundary-report.md) | **New**                                       |
| [Boundary Diagram](./rc-28-epic1-boundary-diagram.md)                       | **New**                                       |
| [RC-28 Epic Breakdown](./rc-28-epic-breakdown.md)                           | Epic 1 status + DoD checked                   |
| [RC-28 Implementation Plan](./rc-28-implementation-plan.md)                 | Status → Epic 1 implemented (awaiting review) |
| `docs/README.md`                                                            | Index Epic 1                                  |
| `project-status.md` / `roadmap.md` / `v2-implementation-roadmap.md`         | Epic 1 pointer                                |
| `release-history.md`                                                        | Epic 1 pointer                                |
| `CHANGELOG.md`                                                              | Unreleased Epic 1 entry                       |
| Catalog README                                                              | `apps/api/src/platform-conformance/README.md` |

---

## Epic 1 Definition of Done

- [x] Boundary catalog accepted: every RC-20…RC-27 module listed with owner, authority class, inbound consume, outbound consume.
- [x] Explicit: no new domain, SoT, or product port is introduced by this epic.
- [x] Forbidden reverse dependencies listed (Lake → Reporting; Library → Gate; AI → Lake; Notification → Library; Scope → engines; Orchestrator → Reporting; State → Orchestrator).
- [x] Exchange Scope confirmed isolation-only; engines remain singleton.
- [x] Boundary tests / invariants compile and pass.
- [x] Architecture Impact: none beyond already approved Spec modules.

**STOP:** Epic 1 **approved**. Successor: [Epic 2](./rc-28-epic2-cross-domain-workflow-verification.md).
