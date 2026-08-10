# RC-19 Closure Report

**Document:** RC-19 Closure Report  
**Status:** COMPLETE — awaiting review approval  
**Date:** 2026-08-10  
**Nature:** Acceptance record only. No production code, architecture, or ADR changes in this closeout.

**Authority inputs:**

| Input                                                                        | Role                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------ |
| [RC-19 Migration Plan](./rc-19-migration-plan.md)                            | Scope and acceptance criteria                    |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md)    | Canonical architectural constitution (unchanged) |
| [Epic 1 — Exchange Scope Identity](./rc-19-epic1-exchange-scope-identity.md) | Delivered                                        |
| [Epic 2 — Bot Facade](./rc-19-epic2-bot-facade.md)                           | Delivered                                        |
| [Epic 3 — Tactical Envelope Foundation](./rc-19-epic3-tactical-envelope.md)  | Delivered                                        |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)                  | RC-19…RC-28 sequence                             |

---

## Verdict

**RC19 CLOSED**

Integration skeleton complete. Architecture Spec v2.0 unchanged. Frozen paper path unchanged. Ready for RC-20 after review approval of this report.

---

## 1. RC19 Objectives

Objectives from the [RC-19 Migration Plan](./rc-19-migration-plan.md) (Task 4 deliverables + Task 8 acceptance).

| #   | Objective                                                                                                                | Planned | Implemented                                                                                     | Status            |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ------- | ----------------------------------------------------------------------------------------------- | ----------------- |
| 1   | Approve Migration Plan; treat Spec v2.0 as implementation constitution                                                   | Yes     | Migration Plan **Approved**; Spec v2.0 remains **Approved** and linked from docs index / status | **Done**          |
| 2   | Thin Exchange Scope identity + default Binance scope                                                                     | Yes     | Default `exchange-scope:binance`; identity module under `exchange-scope/`                       | **Done** (Epic 1) |
| 3   | Persist `exchangeScopeId` on PaperAccount (Trading Account)                                                              | Yes     | Create/load paths + Prisma backfill default                                                     | **Done** (Epic 1) |
| 4   | Persist `exchangeScopeId` on Trading Session (create + persistence)                                                      | Yes     | Non-empty scope id on new sessions; load path aware                                             | **Done** (Epic 1) |
| 5   | Bot UI alias / facade on Session surfaces (canonical APIs unchanged)                                                     | Yes     | `BotFacadeService` delegates to Trading Session; UI Bot labels; no `bots` aggregate             | **Done** (Epic 2) |
| 6   | Tactical Envelope schema stub (types + optional nullable attachment; **no** enforcement)                                 | Yes     | Stub domain + nullable JSONB on `trading_sessions`; Runtime ignores field                       | **Done** (Epic 3) |
| 7   | Tests for identity hooks + Bot facade alias discipline + envelope round-trip                                             | Yes     | Unit + M2 validation specs for scope identity, Bot facade, envelope stub                        | **Done**          |
| 8   | No new ADR unless a real ownership gap appears                                                                           | Yes     | No RC-19 ADR required                                                                           | **Done**          |
| 9   | Frozen path behaviour unchanged (Session / Orders / Risk / Execution / Ledger / Recovery)                                | Yes     | Additive identity/facade/stub only; lifecycle and recovery algorithms untouched                 | **Done**          |
| 10  | Negative scope: no Command Center, IDE, Library, Lake, Orchestrator, Qualification, multi-exchange, envelope enforcement | Yes     | Explicitly deferred (see §6)                                                                    | **Done**          |

Migration-order steps **R19.1–R19.7** are complete. Gate **G0** (US295 / ADL-008) remains an **RC-18 residual** — recorded open in the residual register; it is not an unfinished RC-19 skeleton item (see §8).

---

## 2. Architecture Compliance

| Check                                             | Result                                                                                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture Specification v2.0 remains unchanged | **Confirmed.** Spec stays **Approved**; RC-19 did not re-author architecture.                                                                        |
| No architectural principles violated              | **Confirmed.** Evolution via facades, scopes, and thin stubs; one execution path preserved; Freeze ADRs ADR-012…018 untouched.                       |
| No duplicate runtimes introduced                  | **Confirmed.** Bot is a facade over Trading Session; no second Session/Bot lifecycle.                                                                |
| No duplicate ownership created                    | **Confirmed.** Session remains ADR-014 SoT; PaperAccount remains Trading Account for paper; Envelope is inactive configuration, not a runtime owner. |

Epic Architecture Impact summaries (all `None` / `100%` except documented inactive Envelope stub):

- Epic 1 — no new concepts; identity persistence only
- Epic 2 — no new aggregate; product alias only
- Epic 3 — structural inactive contract; Runtime ignores field

---

## 3. Backward Compatibility

| Surface                   | Verification                                                                                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing APIs             | **Compatible.** REST resources remain canonical (`trading-session`, paper account paths). No `/bots` aggregate resource. Bot Facade is an application interface over Session services. |
| Paper Trading behaviour   | **Unchanged.** Scope id defaults to Binance; envelope defaults to `null`; create/lifecycle semantics preserved.                                                                        |
| Trading Session lifecycle | **Unchanged.** ADR-014 state machine, leases, pause/resume/stop untouched; Bot methods delegate 1:1.                                                                                   |
| Recovery flow             | **Unchanged.** RC-18 recovery pipeline (discovery → lease → reconcile → arm → evaluate) not modified by RC-19 skeleton work.                                                           |

Compatibility statement from all three epics: **100%** backward compatibility for the frozen paper path.

---

## 4. Foundation Components

### Exchange Scope Identity

|                              |                                                                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**                  | Persist Spec Exchange Scope identity on Session and Trading Account so later multi-scope isolation has a real id, not an invented second model.                      |
| **Current responsibilities** | Default Binance scope constant/id; require non-empty `exchangeScopeId` on Session and PaperAccount create/load; Prisma backfill for existing rows.                   |
| **Future responsibilities**  | Per-scope capacity, Exchange Risk Policy inputs, adapter binding, multi-scope isolation proof (RC-27); fail-closed cross-scope rejection when multi-scope goes live. |

### Bot Facade

|                              |                                                                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**                  | Product language **Bot** maps to canonical **Trading Session** without a second aggregate or runtime.                                                |
| **Current responsibilities** | `BotFacadeService` list/get/pause/resume/stop/delete → Session ports; `BotView` projection (id === sessionId); UI alias copy on Session surfaces.    |
| **Future responsibilities**  | Fleet UX / IDE Bot list bound to Sessions (RC-21); Command Center commands via Session/Risk ports (RC-20) — still no Bot table or Bot state machine. |

### Tactical Envelope Foundation

|                              |                                                                                                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**                  | Hold Spec Option B envelope **shape** as an inactive configuration stub so Library enforcement can attach later without schema invention under pressure.          |
| **Current responsibilities** | Structural types; optional nullable `tacticalEnvelope` on Session; JSONB persistence; serialize/parse tests. **Runtime ignores the field.**                       |
| **Future responsibilities**  | Certification-bound envelope persistence and **runtime reject** of out-of-envelope tactics (RC-22); Orchestrator may only select points inside envelopes (RC-26). |

> **Tactical Envelope exists but is not yet active.**

---

## 5. Architecture Impact Summary

| Component                          | Runtime Change       | Persistence Change                                                    | API Change                                                        | Behaviour Change                      | Compatibility |
| ---------------------------------- | -------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------- | ------------- |
| Exchange Scope Identity            | None                 | `exchangeScopeId` on Session + PaperAccount; default Binance backfill | Additive field on existing Session/Account payloads where exposed | Default assignment only               | 100%          |
| Bot Facade                         | None (delegate only) | None                                                                  | No new REST aggregate; facade service for product/UI              | UI Bot labels; same Session lifecycle | 100%          |
| Tactical Envelope stub             | None (ignored)       | Nullable JSONB `tactical_envelope`                                    | Optional null field on Session                                    | Default `null`; no validation/enforce | 100%          |
| Trading Session lifecycle          | None                 | Scope + optional envelope columns only                                | Canonical paths unchanged                                         | Unchanged                             | 100%          |
| Recovery pipeline                  | None                 | None (RC-19)                                                          | None                                                              | Unchanged                             | 100%          |
| Orders / Risk / Execution / Ledger | None                 | None                                                                  | None                                                              | Unchanged                             | 100%          |
| Architecture Spec v2.0             | N/A                  | N/A                                                                   | N/A                                                               | Document unchanged                    | N/A           |

---

## 6. Deferred Work

RC-19 intentionally did **not** implement the following. They belong to future RCs per the V2 Implementation Roadmap.

| Deferred item                                              | Target RC (roadmap)                      |
| ---------------------------------------------------------- | ---------------------------------------- |
| Command Center / ops dashboard                             | RC-20                                    |
| Kill Switch productization over durable Session/Risk ports | RC-20                                    |
| IDE shell + Bot fleet UX                                   | RC-21                                    |
| Strategy Library certification                             | RC-22                                    |
| Tactical Envelope **enforcement** / tactical adaptation    | RC-22 (+ RC-26 selection)                |
| Knowledge Lake (append-only projection warehouse)          | RC-23                                    |
| Ops Reporting & AI Analytics productization                | RC-24                                    |
| Market Qualification / Market Profile                      | RC-25                                    |
| Trading Orchestrator + Spec Market State classifier        | RC-26                                    |
| Multi-exchange / second Exchange Scope proof               | RC-27                                    |
| V2 stabilization / conformance release                     | RC-28                                    |
| Dual research-stack merge                                  | ≥ RC-23 (when Lake/Reporting touch)      |
| Live capital adapter                                       | Future ADR (outside V2 paper-first path) |

Also out of RC-19 (unchanged rule): rewriting Orders / Risk / Execution / Ledger / Recovery algorithms; inventing a Bot aggregate; rebranding Knowledge domain as Knowledge Lake.

**RC-18 residual (not RC-19 scope):** US295 / ADL-008 remains **Open** in [`rc-18-residual-register.md`](./rc-18-residual-register.md). Close or record explicit accepted deferral before claiming production restart-safety PASS. This does not reopen RC-19 skeleton acceptance.

---

## 7. Lessons Learned

### What worked well

- **Minimal skeleton first** — identity + facade + inactive stub unlocked Spec language without feature flood.
- **Architecture Impact block per epic** — forced explicit “None / 100%” checks and stopped silent ownership drift.
- **Alias Dictionary discipline** — Bot/Cluster stay product terms; code/API stay canonical.
- **Evolution, not rewrite** — additive Prisma fields and facade delegation preserved Freeze path confidence.

### What should remain mandatory for future RCs

1. Cite Spec v2.0 + companions before expanding module surface.
2. Append Architecture Impact on every epic closeout.
3. Prefer facades and thin fields over new aggregates or parallel runtimes.
4. Keep envelope / Library / Orchestrator / Lake **inactive or absent** until their owning RC — never ship documentation-only “enforcement.”
5. Register deferred work with a target RC; never absorb non-goals into “done.”
6. Do not treat UI product labels as permission to invent SoT tables or second execution paths.

---

## 8. Readiness Assessment

**Ready to begin RC-20** after approval of this Closure Report.

| Reason                            | Detail                                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| RC-19 exit criteria met           | Integration skeleton complete; Spec shared; zero parallel trading stack                              |
| Naming + scope identity in place  | Command Center can bind to Sessions that already carry `exchangeScopeId` and Bot alias discipline    |
| Frozen path intact                | Ops foundation can productize Kill Switch / status over existing Session/Risk ports without redesign |
| Deferred product surface explicit | Library, Lake, Orchestrator, multi-exchange remain future RCs                                        |

**Caveat (governance, not RC-19 reopen):** US295 / ADL-008 is still open. RC-20 may start as **ops foundation** work; production restart-safety **PASS** claims still require US295 close or explicit accepted deferral. Auth hardening (TD-005/006) remains recommended before strong multi-operator Command Center claims.

**Do not begin RC-20 implementation in this closeout task.** Wait for review and approval.

---

## 9. Final Recommendation

### RC19 CLOSED

**Justification:**

1. All RC-19 Migration Plan in-scope objectives are implemented (Epics 1–3).
2. Architecture Spec v2.0 is unchanged; no principle violations; no duplicate runtime or ownership.
3. Backward compatibility of APIs, Paper Trading, Session lifecycle, and Recovery is confirmed.
4. Deferred work is explicitly listed with target RCs.
5. Project status and V2 Implementation Roadmap mark RC-19 complete and RC-20 as next.

---

## Documentation updates in this closeout

| Document                                                         | Action                        |
| ---------------------------------------------------------------- | ----------------------------- |
| This report                                                      | Created — acceptance record   |
| [`project-status.md`](./project-status.md)                       | RC-19 CLOSED; ready for RC-20 |
| [`v2-implementation-roadmap.md`](./v2-implementation-roadmap.md) | RC-19 marked complete         |
| [`rc-19-migration-plan.md`](./rc-19-migration-plan.md)           | Deliverables checklist closed |
| [`docs/README.md`](../README.md)                                 | Epic 3 + Closure Report links |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
| Product owner      | ☐ Approve ☐ Request changes |      |

**After approval:** RC-19 is officially closed. RC-20 may begin under a separate task.
