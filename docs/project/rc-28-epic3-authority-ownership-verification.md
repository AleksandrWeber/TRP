# RC-28 Epic 3 — Authority & Ownership Verification

**Status:** Epic 3 **approved**  
**Date:** 2026-08-14  
**Nature:** Authority and ownership verification only. No new functionality, modules, APIs, ownership, runtime, or business logic.  
**Parent:** [RC-28 Implementation Plan](./rc-28-implementation-plan.md) · [Epic Breakdown](./rc-28-epic-breakdown.md)  
**Predecessor:** [Epic 2](./rc-28-epic2-cross-domain-workflow-verification.md) (**approved**)  
**Contracts:** [API Contract (conformance)](./rc-28-api-contract.md)  
**Authority catalog:** [rc-28-epic3-authority-verification-report.md](./rc-28-epic3-authority-verification-report.md)  
**Ownership catalog:** [rc-28-epic3-ownership-verification-report.md](./rc-28-epic3-ownership-verification-report.md)

---

## Implementation Report

### What shipped

- Authority graph `V2_AUTHORITY_GRAPH` for all twelve Version 2 surfaces
- SoT uniqueness map `V2_SOT_MAP` (Freeze money owners remain external)
- Alias bindings observed in code (Bot / Cluster / Wallet / Brain) without editing the Alias Dictionary
- Isolation reuse of RC-27 invariants 1–10 plus Tactics Contract Option B at Gate
- No product-module edits
- No Authority Matrix / Alias Dictionary / Isolation Invariants / Tactics Contract edits

### Modules touched

| Path                                   | Change                                      |
| -------------------------------------- | ------------------------------------------- |
| `apps/api/src/platform-conformance/**` | **Extended** — Epic 3 authority / ownership |
| Existing V2 / Freeze modules           | **Untouched**                               |
| `apps/api/src/app.module.ts`           | **Untouched**                               |
| Authority Matrix / Alias Dictionary    | **Untouched**                               |

### Ports / APIs affected

**None.** Approved ports remain the frozen RC-19…RC-27 tokens already listed in the API Contract.

### Explicit out of scope (confirmed absent)

- End-to-end scenario harness (Epic 4)
- Performance / resilience product (Epic 5)
- Version 2 certification closeout (Epic 6)
- New Nest providers, REST, persistence, transport, UI
- New ownership, ports, modules, runtime, or business rules

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Epic 3 records already-approved Authority Matrix / Alias
Dictionary / Isolation Invariants. No new owners.)

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

| Surface                           | Result                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| Spec v2.0 §5 module set           | **Compatible** — twelve surfaces remain the closed V2 set                                 |
| Authority Matrix                  | **Unmodified** — SoT / projection / policy input / narrative / command UI remain disjoint |
| Alias Dictionary                  | **Unmodified** — Bot=Session, Cluster=Scope, Wallet=Account, Brain=Orchestrator           |
| Cluster Isolation Invariants 1–10 | **Compatible** — RC-27 proof reused; no engine clones                                     |
| Tactics Contract Option B         | **Compatible** — envelope still Library SoT; Gate fails closed on miss                    |
| RC-19 Bot Facade                  | **Untouched** — Bot id === Session id; no `model Bot`                                     |
| RC-21…RC-27 closed modules        | **Untouched** — boundaries composed, not rewritten                                        |
| Frozen paper path (ADR-012…018)   | **Compatible** — money SoT stays Orders / Execution / Ledger / Session / Risk             |

### Architecture validation checklist

| Check                                  | Result   |
| -------------------------------------- | -------- |
| Spec v2.0 compatibility                | **PASS** |
| Authority Matrix compatibility         | **PASS** |
| Alias Dictionary compatibility         | **PASS** |
| No new domain / SoT / product port     | **PASS** |
| Exactly one owner per business concept | **PASS** |
| No reverse / hidden command paths      | **PASS** |
| Isolation invariants 1–10 evidenced    | **PASS** |
| Option B envelope enforced at Gate     | **PASS** |

---

## Tests Summary

| Suite            | File                                                   | Result       |
| ---------------- | ------------------------------------------------------ | ------------ |
| Ownership map    | `platform-conformance/v2-ownership-map.spec.ts`        | **PASS** (3) |
| Authority graph  | `platform-conformance/v2-authority-graph.spec.ts`      | **PASS** (4) |
| Dependency graph | `platform-conformance/v2-authority-dependency.spec.ts` | **PASS** (4) |
| SoT uniqueness   | `platform-conformance/v2-sot-uniqueness.spec.ts`       | **PASS** (3) |
| Module isolation | `platform-conformance/v2-module-isolation.spec.ts`     | **PASS** (5) |

**Gate:** `pnpm --filter api exec vitest run src/platform-conformance` → **65/65 PASS** (Epic 3 suites **19/19**; Epic 1–2 catalog retained)

Coverage intent:

- Every V2 module has owned / forbidden responsibilities, allowed / forbidden consumers, approved ports, consume direction
- Library ≠ Gate ≠ Session ≠ Orchestrator ≠ Risk ≠ Execution ≠ Ledger ≠ Lake ≠ Reporting ≠ AI ≠ Notification ≠ Command Center ≠ Scope
- Trading/finance SoT is unique and stays on Freeze owners
- No reverse Nest imports; no hidden Session/Orders command path from Lake / AI / Notification
- Alias bindings have no second aggregate; Prisma has no `Bot` model
- Isolation invariants 1–10 reuse RC-27 domain proof for ≥2 scopes
- Gate still requires an immutable Library tactical envelope (Option B)

---

## Documentation Update Summary

| Document                                                                        | Update                                        |
| ------------------------------------------------------------------------------- | --------------------------------------------- |
| This Epic Report                                                                | **New**                                       |
| [Authority Verification Report](./rc-28-epic3-authority-verification-report.md) | **New**                                       |
| [Ownership Verification Report](./rc-28-epic3-ownership-verification-report.md) | **New**                                       |
| [RC-28 Epic Breakdown](./rc-28-epic-breakdown.md)                               | Epic 3 status + DoD checked                   |
| [RC-28 Implementation Plan](./rc-28-implementation-plan.md)                     | Status → Epic 3 implemented (awaiting review) |
| `docs/README.md`                                                                | Index Epic 3                                  |
| `project-status.md` / `roadmap.md` / `v2-implementation-roadmap.md`             | Epic 3 pointer                                |
| `release-history.md`                                                            | Epic 3 pointer                                |
| `CHANGELOG.md`                                                                  | Unreleased Epic 3 entry                       |
| `apps/api/src/platform-conformance/README.md`                                   | Catalog covers Epic 1–3                       |

---

## Epic 3 Definition of Done

- [x] Ownership table evidenced: Library ≠ Gate ≠ Session ≠ Orchestrator ≠ Risk ≠ Execution ≠ Ledger ≠ Lake ≠ Reporting ≠ AI ≠ Notification ≠ Command Center ≠ Scope.
- [x] Alias checks: Bot = Session; Cluster = Exchange Scope; Wallet = Trading Account; Brain = Orchestrator — no second aggregates.
- [x] Authority class checks: SoT / projection / policy input / narrative / command UI remain disjoint.
- [x] Isolation invariants 1–10 evidenced for ≥2 concurrent scopes (reuse RC-27 proof; do not redesign Scope).
- [x] Tactics Contract Option B: envelope still enforced at Gate / Deployment — not documentation-only.
- [x] No Authority Matrix or Alias Dictionary edits under this epic.
- [x] Conformance tests compile and pass.

**STOP:** Epic 3 **approved**. Successor: [Epic 4](./rc-28-epic4-end-to-end-scenario-validation.md).
