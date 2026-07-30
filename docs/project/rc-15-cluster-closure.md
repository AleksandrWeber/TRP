# RC-15 / M2 Cluster Closure Report (US183.1)

Date: 2026-07-19

Status: COMPLETE

Overall verdict: **PASS — READY FOR RC-16**

> **Forward reference (2026-07-30):** RC-16 M3 canonical path (US211–US223)
> completed after this closeout. Residual M3–M7 product intent from the original
> RC-16 plan was transferred to **RC-17**. Living status:
> [`release-history.md`](./release-history.md). The “M3–M7 remain” language
> below is historical as of this closeout date.

---

## Completed scope

This User Story is stabilization and validation only. No new functionality,
APIs, database schema, runtime behavior, or architecture changes were
introduced.

Closed cluster:

| Item                                                           | Status                         |
| -------------------------------------------------------------- | ------------------------------ |
| RC-15 Research & Simulation Platform (US115–US125)             | COMPLETE (released as RC-15.1) |
| RC-15.1 Validation Release (VS001–VS004)                       | COMPLETE                       |
| RC-16 M1 Live Market Data Foundation (US126–US152)             | COMPLETE                       |
| RC-16 M2 Durable Paper Order and Accounting Core (US153–US183) | COMPLETE                       |
| US183.1 Cluster Closure                                        | COMPLETE                       |

Next milestone: **M3 — Strategy Trading Sessions**.

Repository status: **READY FOR RC-16** (M3 development may begin; RC-16 final
release still requires M3–M7).

_(Living 2026-07-30: RC-16 baseline accepted; next is RC-17 E17 —
[`release-history.md`](./release-history.md).)_

---

## Validation summary

Executed against the last committed tree (2026-07-19). Uncommitted WIP for
US018 Historical Research Engine was excluded as out of scope (new
functionality).

| Gate                                                       | Result |
| ---------------------------------------------------------- | ------ |
| `pnpm run lint`                                            | PASS   |
| `pnpm run format:check`                                    | PASS   |
| `pnpm run typecheck` (`tsc --noEmit`)                      | PASS   |
| `pnpm run build` (`@trp/api`, `@trp/web`, `@trp/research`) | PASS   |
| Unit / integration / regression tests                      | PASS   |

Fresh test counts (non-cached re-run):

| Package         | Files   | Tests    |
| --------------- | ------- | -------- |
| `@trp/api`      | 206     | 1203     |
| `@trp/web`      | 11      | 28       |
| `@trp/research` | 4       | 24       |
| **Total**       | **221** | **1255** |

Notes:

- One intermittent failure was observed once in
  `us149-postgres-event.integration.spec.ts` under full parallel load against
  a shared PostgreSQL instance; isolated re-run and subsequent full suite
  re-runs passed. Tracked as a known limitation below (test isolation), not
  a product defect.
- Obsolete untracked duplicate
  `docs/adr/ADR-018-architectural-invariants копія.md` was removed.
- No obsolete production TODO/FIXME markers required removal; intentional
  debt remains in [`technical-debt.md`](./technical-debt.md).

---

## Documentation status

Synchronized references only (architecture content unchanged):

| Document                                                 | Sync action                                                                       |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`project-status.md`](./project-status.md)               | RC-15 COMPLETE; M2 COMPLETE; Repository Status READY FOR RC-16; Next Milestone M3 |
| [`roadmap.md`](./roadmap.md)                             | US183.1 recorded; current phase aligned                                           |
| [`version-history.md`](../research/version-history.md)   | Cluster closure note (no version bump)                                            |
| [`architecture-snapshot.md`](./architecture-snapshot.md) | Framing + residual pre-M3 risks wording                                           |
| [`CANONICAL.md`](../CANONICAL.md)                        | Next steps: M1/M2 done; M3 next                                                   |
| [`docs/adr/README.md`](../adr/README.md)                 | Already consistent (ADR-007…018 Accepted)                                         |
| [`api.md`](./api.md)                                     | Documented missing `/v1/orders` endpoints                                         |

---

## ADR compliance summary

Reviewed against accepted ADR-007…ADR-018. Accepted decisions were not
changed.

| ADR                                     | Verdict   | Notes                                                                                                                   |
| --------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| ADR-007 Campaign Layer                  | PARTIAL   | Campaign orchestration intact; durable Campaign Session persistence exists without a superseding ADR (documented drift) |
| ADR-008 Deterministic Research Analysis | COMPLIANT | Pure `CampaignReport` analysis; no AI                                                                                   |
| ADR-009 Multi-dataset Campaign          | COMPLIANT | Orchestration over `ResearchCampaignService`                                                                            |
| ADR-010 Walk-Forward Architecture       | COMPLIANT | Train/Test Slice orchestration; Engine unchanged                                                                        |
| ADR-011 Dataset Slice Architecture      | COMPLIANT | `SliceResolver`-only construction; Result Identity inclusion still deferred                                             |
| ADR-012 Execution Architecture          | PARTIAL   | Canonical M2 path compliant; Stage-1 `production/` and legacy paper executor remain parallel paths (TD-034)             |
| ADR-013 Event Processing Model          | COMPLIANT | PostgreSQL Outbox/Inbox/checkpoints; idempotent effects                                                                 |
| ADR-014 Runtime Lifecycle               | PARTIAL   | Session FSM + fenced leases present; full recovery algorithm is M5                                                      |
| ADR-015 Accounting Model                | COMPLIANT | Fill → Position → Ledger → Portfolio; decimal Ledger source of truth                                                    |
| ADR-016 Risk & Safety Model             | PARTIAL   | Mandatory baseline Risk Decisions present; Kill Switch / continuous guards are M4                                       |
| ADR-017 Module Boundaries               | PARTIAL   | M2 ownership largely honored; parallel Stage-1 path remains                                                             |
| ADR-018 Architectural Invariants        | PARTIAL   | M2 path enforces core invariants; Strategy Runtime / Kill Switch / no-parallel-path incomplete by milestone design      |

**No critical architectural blockers remain for starting M3**, provided
pre-M3 gates TD-034 / TD-039 / TD-040 / TD-042 are respected before enabling
automated strategy execution.

---

## Remaining technical debt

Intentional debt retained (not removed):

| ID                                | Item                                          | Why retained                 |
| --------------------------------- | --------------------------------------------- | ---------------------------- |
| TD-011…TD-013                     | Accepted Legacy dual paths                    | Do not expand; migrate later |
| TD-001 / TD-003 / TD-008 / TD-009 | Accepted infrastructure debt                  | Non-blocking for M3 start    |
| TD-034                            | Stage-1 Production Path Consolidation         | M3 entry gate                |
| TD-039 / TD-040 / TD-042          | Decimal marks / Fill order / consumer fan-out | Pre-M3 prerequisites         |
| TD-036                            | Runtime Recovery and Reconciliation           | M3–M5                        |
| TD-028 / TD-005 / TD-006          | Execution / auth hardening (partial)          | Continues across RC-16       |

Full register: [`technical-debt.md`](./technical-debt.md).

---

## Known limitations

> Historical as of 2026-07-19. Items 1–4 were later addressed by M3 canonical
> path completion and/or **transfer to RC-17** (2026-07-30). TD-034 was
> resolved as an M3 gate. See [`release-history.md`](./release-history.md).

1. RC-16 final release is **not** ready — M3–M7 remain
   ([`rc-16-release-summary.md`](./rc-16-release-summary.md)).
   _(Living: residual scope → RC-17; RC-16 baseline accepted.)_
2. Stage-1 `production/` remains a live parallel paper path beside the M2
   canonical Order → Risk → Execution → accounting chain (TD-034).
   _(Living: TD-034 resolved.)_
3. Kill Switch and continuous Risk controls are not implemented (M4 /
   ADR-016). _(Living: RC-17 E19.)_
4. Full restart recovery algorithm is not complete (M5 / ADR-014).
   _(Living: RC-17 E17 / TD-036.)_
5. Occasional flake possible in M1 PostgreSQL integration under parallel
   shared-DB load (`us149`); suite is green on re-run.
6. Uncommitted US018 Historical Research Engine work existed during closure
   and was excluded from validation as new functionality (out of scope).

---

## Readiness verdict

**PASS — READY FOR RC-16**

- Project builds successfully.
- Lint, format, typecheck, and tests pass.
- Documentation synchronized for cluster status.
- ADR compliance verified; no critical blockers for M3 start.
- RC-15 officially closed; M2 officially closed.
- M3 Strategy Trading Sessions development may begin.
