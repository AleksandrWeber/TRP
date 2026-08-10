# RC-19 — Migration Plan (RC-18 → Architecture Specification v2.0)

**Document:** RC-19 Migration Plan  
**Status:** Complete (closed) — see [RC-19 Closure Report](./rc-19-closure-report.md)  
**Date:** 2026-08-10  
**Nature:** Evolutionary migration guide. **Not** a rewrite. **Not** an architecture redesign.  
**Implementation:** Epics 1–3 complete. Integration skeleton accepted under Closure Report.

---

## Authority and inputs

| Input                                                                     | Role                                                 |
| ------------------------------------------------------------------------- | ---------------------------------------------------- |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md) | **Canonical** architectural constitution (Approved)  |
| [Alias Dictionary](./v2-alias-dictionary.md)                              | Product ↔ canonical naming                           |
| [Authority Matrix](./v2-authority-matrix.md)                              | SoT / projection / narrative / command UI            |
| [Tactics Contract](./v2-tactics-contract.md)                              | Envelope Option B                                    |
| [Cluster Isolation Invariants](./v2-cluster-isolation-invariants.md)      | Exchange Scope isolation rules                       |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)               | RC-19…RC-28 sequence (order unchanged)               |
| [RC-18 Current System Snapshot](./rc-18-current-system-snapshot.md)       | Pre-V2 baseline                                      |
| [Engineering Audit](./engineering-audit-report-v2-freeze.md)              | Readiness and risk baseline                          |
| ADR-012…ADR-018                                                           | Frozen paper execution path — **must not be forked** |

### Migration philosophy (binding)

1. **Evolution, not rewrite** — extend RC-18 via facades, scopes, and thin hooks.
2. **One execution path** — Market Event → Strategy Runtime → Signal Intent → Orders → Risk → Execution → Adapter → Fill → Position → Ledger → Portfolio.
3. **No new modules beyond Spec** — RC-19 does not invent modules Spec does not already name.
4. **Canonical names in code/API** — Bot/Cluster/Wallet are UI aliases only.
5. **Spec v2.0 is already Approved** — RC-19 remaining work is the **integration skeleton**, not re-authoring architecture.

### Epic closeout requirement (process)

After **every** RC-19+ Epic delivery, the implementer must append an **Architecture Impact** block to the epic note (and include it in the chat deliverable):

```text
Architecture Impact

New architectural concepts introduced:
None | <list>

Canonical ownership changed:
None | <list>

New runtime:
None | <description>

Backward compatibility:
100% | <caveats>

Architecture debt introduced:
None | <list>
```

Default expectation for thin RC-19 skeleton epics: all `None` / `100%` unless a real Spec gap forced otherwise (then stop and report before expanding).

Epic notes:

- [Epic 1 — Exchange Scope Identity](./rc-19-epic1-exchange-scope-identity.md)
- [Epic 2 — Bot Facade](./rc-19-epic2-bot-facade.md)
- [Epic 3 — Tactical Envelope Foundation](./rc-19-epic3-tactical-envelope.md)
- [RC-19 Closure Report](./rc-19-closure-report.md)

### Gate before RC-19 code starts

| Gate                             | Status       | Rule                                                                                                               |
| -------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------ |
| Architecture Spec v2.0           | **Approved** | Done                                                                                                               |
| US295 / ADL-008 (RC-18 closeout) | **Open**     | Close or record explicit accepted deferral before claiming RC-18 done; do not treat V2 feature flood as substitute |
| This Migration Plan              | **Draft**    | Implementation starts only after plan approval                                                                     |

---

## Task 1 — Architecture Mapping

Status categories:

| Category                  | Meaning                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| **Already implemented**   | Behavior matches Spec responsibility for current paper/research phase |
| **Partially implemented** | Core exists; Spec product shape incomplete                            |
| **Requires refactoring**  | Exists but boundaries/naming/ownership conflict with Spec             |
| **Missing**               | No Spec-aligned implementation                                        |

### V2 core modules (Spec §5)

| #    | V2 module                                             | Status                                   | Why                                                                                                                                                                                                                                     |
| ---- | ----------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1  | **Research Lab**                                      | **Already implemented** (research phase) | Campaigns, Pipeline, Backtesting, Walk-Forward, Experiments, datasets/import exist and do not place production orders. Gaps are durability/product polish, not architectural absence.                                                   |
| 5.2  | **Strategy Library**                                  | **Missing** (foundations only)           | `strategies` + Knowledge/Experiment stores exist, but there is **no certified library**, no certification gate for production path, and no tactical envelopes. Strategy statuses (`draft`/`active`/`archived`) ≠ library certification. |
| 5.3  | **Market Qualification / Market Profile**             | **Missing**                              | No qualification pipeline and no versioned Market Profile artifacts in code.                                                                                                                                                            |
| 5.4  | **Market State**                                      | **Missing** (name collision only)        | `LatestMarketState` is a **market-data projection** (candles/marks/checkpoint), not Spec Market State (regime/condition classification for selection). No classifier product.                                                           |
| 5.5  | **Trading Orchestrator**                              | **Missing**                              | No selector/orchestration service. Closest fragments are campaign orchestration and manual deployment binding — neither is Spec Orchestrator.                                                                                           |
| 5.6  | **Trading Session + Strategy Runtime**                | **Already implemented**                  | ADR-014 Session lifecycle + recovery (US290–US294), Strategy Runtime, Signal Intent, Deployment binding exist on the frozen path. UI “Bot” facade not applied.                                                                          |
| 5.7  | **Risk Engine + Exchange Risk Policy**                | **Partially implemented**                | Platform Risk Decisions + baseline paper policy exist and are mandatory on the order path. Kill Switch productization incomplete; **no Exchange Risk Policy** as per-scope inputs; policy is global baseline, not scope-bound.          |
| 5.8  | **Orders**                                            | **Already implemented**                  | Durable paper order lifecycle on canonical path; SoT for order state.                                                                                                                                                                   |
| 5.9  | **Execution Engine + Adapter**                        | **Already implemented** (paper Freeze)   | Sole adapter entry for paper path; Stage-1 parallel path retired (TD-034 / ADL-007). Live capital adapter deferred to future ADR.                                                                                                       |
| 5.10 | **Exchange Scope (Cluster)**                          | **Missing**                              | No `exchangeScopeId` on Session/Account; no scope aggregate, capacity, or per-scope policy. `exchange: "binance"` string fields ≠ Exchange Scope.                                                                                       |
| 5.11 | **Trading Account (Wallet)**                          | **Partially implemented**                | `PaperAccount` is the working Trading Account for paper Freeze, scoped by workspace only — not by Exchange Scope. UI “Wallet” alias absent.                                                                                             |
| 5.12 | **Accounting (Fill / Position / Ledger / Portfolio)** | **Already implemented**                  | Fill → Position → Ledger (SoT) → Portfolio projection per ADR-015. Missing only future scope identity on records.                                                                                                                       |
| 5.13 | **Knowledge Lake**                                    | **Missing**                              | Research `knowledge` / Insight / Recommendation domains exist; they are **not** an append-only event warehouse from SoT trading/research events. Dual stacks remain Accepted Legacy.                                                    |
| 5.14 | **Reporting**                                         | **Partially implemented**                | Research reports / read APIs exist. Ops-grade scheduled reporting, paper/live labeling discipline as product, and Telegram notification projections are absent.                                                                         |
| 5.15 | **AI Analyst / AI Assistant**                         | **Partially implemented**                | AI Gateway present and narrative-oriented. Not full Analyst product; not wired to Lake/projections as Spec describes.                                                                                                                   |
| 5.16 | **Command Center / Dashboard**                        | **Missing** (fragments only)             | Trading/research pages exist; not an ops Command Center routing commands solely through Session/Risk ports.                                                                                                                             |
| 5.17 | **Live Market Data**                                  | **Already implemented** (Binance M1)     | Normalized live market events + projections for paper path. Multi-exchange providers not started.                                                                                                                                       |

### Summary counts

| Status                | Count                                                        |
| --------------------- | ------------------------------------------------------------ |
| Already implemented   | 6                                                            |
| Partially implemented | 4                                                            |
| Requires refactoring  | 0 _(as whole modules — conflicts are localized; see Task 6)_ |
| Missing               | 7                                                            |

> Note: Several **existing Nest modules** require localized refactoring (Task 2/6) even when the Spec module they serve is “Already implemented.” That is intentional — the Spec module can be correct while code organization has debt.

---

## Task 2 — Code Mapping

For every major existing service/module: does it fit Spec v2.0?

| Existing module / area                                                                                   | Fit?                           | Required change (if not YES)                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trading-session`                                                                                        | **PARTIALLY**                  | Add thin `exchangeScopeId` (RC-19). Leave lifecycle/recovery untouched. Later: Bot is UI alias only — **no** second aggregate.                                                               |
| `strategy-runtime` / Signal Intent                                                                       | **YES**                        | Leave unchanged in RC-19. Later (RC-22): reject out-of-envelope tactics.                                                                                                                     |
| `strategy-deployment` (M3 domain)                                                                        | **PARTIALLY**                  | Leave core immutable Deployment. Later: bind only certified Library members; attach envelope reference. RC-19: optional envelope schema stub fields only — **no enforcement**.               |
| Prisma legacy `StrategyDeployment` / Stage-1 tables                                                      | **NO**                         | **Leave unchanged / read-only.** Do not revive Stage-1 execution. Eventually migrate consumers off dual stacks when Lake/Reporting touch them — not RC-19.                                   |
| `orders`                                                                                                 | **YES**                        | Leave unchanged. Later: carry scope identity through order context.                                                                                                                          |
| `risk` / Risk Decisions                                                                                  | **PARTIALLY**                  | Leave decision engine. Later: consume Exchange Risk Policy inputs; productize Kill Switch via durable Session/Risk ports (RC-20). RC-19: no second engine.                                   |
| `execution-engine` + paper adapter                                                                       | **YES**                        | Leave unchanged. Adapter binding later via Exchange Scope.                                                                                                                                   |
| `ledger` / `positions` / `portfolio`                                                                     | **YES**                        | Leave unchanged. Later: scoped identity on records when multi-scope arrives.                                                                                                                 |
| `paper-account`                                                                                          | **PARTIALLY**                  | Add thin `exchangeScopeId` (RC-19). Rename to generic “Trading Account” is **not** required in code yet — Spec allows paper now; UI may say Wallet later.                                    |
| `live-market-data`                                                                                       | **YES**                        | Leave unchanged. Do **not** repurpose `LatestMarketState` as Spec Market State.                                                                                                              |
| `strategies`                                                                                             | **PARTIALLY**                  | Remains configuration/registry store. Later (RC-22): certification + Library membership — **do not** pretend `active` status is certification.                                               |
| Research Lab set (`research-campaign`, `pipeline`, `backtesting`, `walk-forward`, experiments, datasets) | **YES**                        | Leave unchanged for RC-19. Do not call Execution Engine for capital.                                                                                                                         |
| `knowledge` / `insight` / `recommendation` / `research-report`                                           | **PARTIALLY**                  | Keep as research foundations. **Do not** expand as Knowledge Lake. Lake is a later projection warehouse (RC-23). Avoid growing dual-stack Accepted Legacy.                                   |
| `ai` gateway                                                                                             | **PARTIALLY**                  | Leave gateway. Do not grant capital authority. Full Analyst product is later (RC-24).                                                                                                        |
| `live-trading-engine` (ops/Kill Switch UI path)                                                          | **PARTIALLY**                  | Exists as operational surface over sessions; **must not** become a parallel trading brain. RC-20 will fold Kill Switch/status into Command Center over canonical ports. RC-19: no expansion. |
| `paper-trading-engine` / retired Stage-1 coordinators                                                    | **NO** (intentionally retired) | **Leave untouched** — retention for query/history only where already constrained by TD-034.                                                                                                  |
| `canonical-order-path`                                                                                   | **YES**                        | Boundary tests protect frozen path — keep.                                                                                                                                                   |
| `workspace` / `auth`                                                                                     | **PARTIALLY**                  | Workspace ≠ Exchange Scope. Auth hardening (TD-005/006) is separate debt — not RC-19 architecture skeleton unless blocking thin hooks.                                                       |
| `event-processing` (Outbox/Inbox)                                                                        | **YES**                        | Spine for future Lake projections. Do not treat as Lake itself.                                                                                                                              |
| Frontend pages (`PaperTradingPage`, `LiveTradingPage`, research pages, `research-control`)               | **PARTIALLY**                  | RC-19: Bot UI **alias** on Session surfaces only (labels/copy). No IDE shell (RC-21), no Command Center (RC-20).                                                                             |
| `ExchangesPage`                                                                                          | **PARTIALLY**                  | Not Exchange Scope. Do not treat as Cluster product. Later replace/extend with scope views.                                                                                                  |
| `jobs`                                                                                                   | **YES** (foundation)           | Leave for RC-19.                                                                                                                                                                             |

### Change-type legend applied above

| Change type                | Used in RC-19?                                                              |
| -------------------------- | --------------------------------------------------------------------------- |
| Leave unchanged            | Frozen path modules (Orders, Execution, Ledger, Runtime core, Research Lab) |
| Rename only                | UI copy Session→Bot (alias); code/API stay canonical                        |
| Move responsibility        | **Not in RC-19**                                                            |
| Split module               | **Not in RC-19**                                                            |
| Merge duplicate logic      | **Not in RC-19** (defer dual-stack cleanup)                                 |
| Replace implementation     | **Forbidden** for frozen path                                               |
| Thin additive field / stub | Exchange Scope id; envelope schema stub                                     |

---

## Task 3 — Migration Impact

Estimates for **required** changes to reach Spec alignment over RC-19…RC-28. RC-19 column highlights first-cut impact.

| Change                                                                     | Code            | Testing    | Risk                                         | Dependencies                                                                 | First RC               |
| -------------------------------------------------------------------------- | --------------- | ---------- | -------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
| Spec/docs as implementation constitution (already Approved)                | Low             | Low        | Low                                          | Freeze package                                                               | RC-19 (done)           |
| Migration Plan approval + story allocation                                 | Low             | Low        | Low                                          | This doc                                                                     | RC-19                  |
| Thin `exchangeScopeId` on Session + PaperAccount (+ default Binance scope) | **Medium**      | **Medium** | **Medium**                                   | Prisma migration; Session/Account create paths; fail-closed if missing later | **RC-19**              |
| Bot UI alias on Session surfaces                                           | **Low**         | Low        | **Low** (High if new Bot aggregate invented) | Alias Dictionary                                                             | **RC-19**              |
| Tactical Envelope **schema stub** (no enforcement)                         | **Low**         | Low        | Low                                          | Tactics Contract shapes                                                      | **RC-19**              |
| ADR only if ownership gap appears                                          | Low             | Low        | Medium if ADR invents modules                | Spec + Freeze ADRs                                                           | RC-19 (only if needed) |
| Kill Switch / status APIs + Command Center v1                              | High            | High       | **High** (UI-as-SoT)                         | Session/Risk ports; RC-19 naming                                             | RC-20                  |
| IDE shell + Bot fleet UX                                                   | High            | Medium     | **High** (duplicate runtime)                 | RC-19 aliases                                                                | RC-21                  |
| Strategy Library + envelope **enforcement**                                | High            | High       | **High** if docs-only                        | Lab outputs; Deployment; Runtime                                             | RC-22                  |
| Knowledge Lake projection warehouse                                        | High            | High       | **Critical** if treated as ledger            | Outbox/SoT events; durability decision                                       | RC-23                  |
| Reporting & AI Analytics (ops)                                             | Medium          | Medium     | High (shadow accounting)                     | Lake                                                                         | RC-24                  |
| Market Qualification + Profiles                                            | Medium          | Medium     | Medium (forcing trades)                      | Lab + data                                                                   | RC-25                  |
| Trading Orchestrator + Market State MVP                                    | **Critical**/XL | High       | **Critical** (god-module / bypass Risk)      | Library + Profiles + Risk/Session                                            | RC-26                  |
| Second Exchange Scope (Bybit proof)                                        | High            | High       | **Critical** if engines cloned               | Scope model + Qualification                                                  | RC-27                  |
| V2 stabilization / conformance                                             | Medium          | High       | Medium                                       | RC-20…27 critical path                                                       | RC-28                  |
| Dual research stack cleanup                                                | Medium–High     | High       | Medium                                       | Prefer with Lake/Reporting touchpoints                                       | ≥ RC-23                |
| Auth hardening TD-005/006                                                  | Medium          | Medium     | Medium                                       | Before multi-operator Command Center claims                                  | Before/with RC-20      |
| In-memory Knowledge/Campaign durability                                    | High            | High       | Medium                                       | Before Lake as product memory                                                | Before/with RC-23      |

### Impact scale

| Scale    | Meaning                                                                   |
| -------- | ------------------------------------------------------------------------- |
| Low      | Localized docs/UI alias/stub                                              |
| Medium   | Cross-module fields or focused feature slice                              |
| High     | Multi-module delivery; SoT/boundary discipline required                   |
| Critical | Can break Freeze invariants or create parallel architecture if done wrong |

---

## Task 4 — RC-19 Scope (minimal)

RC-19 contains **only** what is required to **begin** architectural migration.

Aligned with roadmap: _Architecture Spec v2.0 + integration skeleton_ — Spec is already Approved; remaining work is the skeleton.

### In scope

| Category            | Items                                                                                                                                                                                                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Documentation**   | This Migration Plan (approve); Spec v2.0 already canonical; link Spec/Alias/Authority from implementer entrypoints (`docs/README`, project-status) as needed for discoverability; story specs for RC-19 hooks only                                                                                                                              |
| **New code**        | (1) Default Exchange Scope identity model — thin id + single default Binance scope record/constant; (2) persist `exchangeScopeId` on Trading Session create/load and PaperAccount create/load; (3) Tactical Envelope **schema stub** type(s) / optional nullable attachment point on Deployment or strategy version — **no runtime reject yet** |
| **Refactoring**     | None beyond the minimal wiring required to store/read the new ids without changing lifecycle semantics                                                                                                                                                                                                                                          |
| **Renaming**        | UI-only Bot alias on Session-facing copy (Paper Trading / session lists/detail). **No** Nest module rename. **No** REST resource rename to “bots”                                                                                                                                                                                               |
| **Tests**           | Unit/integration: Session and Account carry scope id; default scope assigned; missing-scope fail-closed policy documented for later enforcement if applicable; alias dictionary conformance smoke (UI strings vs canonical API); envelope stub round-trip serialization                                                                         |
| **Expected result** | Implementers share one Spec; Session/Account are scope-aware at the identity layer; Bot is visibly an alias; envelope shape exists as stub; **zero** parallel trading stack; frozen path behavior unchanged                                                                                                                                     |

### Explicitly out of scope for RC-19

- Command Center / IDE shell
- Strategy Library certification product
- Envelope **enforcement** at Runtime
- Knowledge Lake warehouse
- Trading Orchestrator / Market State classifier
- Market Qualification / Profiles
- Multi-exchange adapters
- Kill Switch productization epic (RC-20)
- Dual-stack research merges
- Live capital
- Rewriting Orders / Risk / Execution / Ledger / Recovery algorithms

### RC-19 deliverables checklist

- [x] Migration Plan approved
- [x] Spec v2.0 cited as implementation constitution in project status / index
- [x] Thin Exchange Scope id on Session + Account (default Binance) — **Epic 1**
- [x] Bot Facade / UI alias on Session surfaces (canonical APIs unchanged) — **Epic 2** ([detail](./rc-19-epic2-bot-facade.md))
- [x] Envelope schema stub (no enforcement) — **Epic 3** ([detail](./rc-19-epic3-tactical-envelope.md)); **exists but is not yet active**
- [x] Tests for identity hooks + Bot facade alias discipline
- [x] No ADR unless a real ownership gap is discovered during skeleton work — **none required**
- [x] Frozen path regression suite still green (re-verify per epic)
- [x] [RC-19 Closure Report](./rc-19-closure-report.md) — acceptance record

---

## Task 5 — Migration Order

Every step depends only on prior completed steps.

```text
G0  RC-18 gate: US295 close OR explicit accepted deferral
      ↓
G1  Approve this RC-19 Migration Plan
      ↓
R19.1  Publish Spec v2.0 as canonical implementer entry (docs index / status)
      ↓
R19.2  Introduce Exchange Scope identity (default single Binance scope)
      ↓
R19.3  Attach exchangeScopeId to PaperAccount (Trading Account)
      ↓
R19.4  Attach exchangeScopeId to Trading Session (create + persistence)
      ↓
R19.5  Bot UI alias on Session surfaces (labels only)
      ↓
R19.6  Tactical Envelope schema stub (types + optional nullable field; no guard) — **DONE Epic 3**
      ↓
R19.7  RC-19 acceptance tests + regression of frozen path
      ↓
──── RC-19 complete ────
      ↓
R20   Command Center foundation (Kill Switch / status over existing ports)
      ↓
R21   IDE shell + Bot fleet UX (bound to Sessions)
      ↓
R22   Strategy Library + envelope enforcement
      ↓
R23   Knowledge Lake (projection from SoT events)
      ↓
R24   Reporting & AI Analytics
      ↓
R25   Market Qualification + Market Profile
      ↓
R26   Trading Orchestrator (thin) + Market State inputs
      ↓
R27   Second Exchange Scope (isolation proof)
      ↓
R28   V2 stabilization / conformance
```

### Why this order is correct

| Step                                      | Why it must come here                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| G0 before V2 code                         | Avoids ambiguous “almost production recovery” while starting facades                       |
| G1 before coding                          | Prevents ad-hoc feature flood; Spec already exists — plan locks **minimal** skeleton       |
| R19.1 before hooks                        | Shared vocabulary; Alias/Authority/Tactics cited once                                      |
| Scope identity before Bot UX              | UI “Cluster/Bot capacity” language must bind to real scope id, not invent a second model   |
| Account before Session                    | Session references account; scope must be consistent account→session (invariant prep)      |
| Bot alias after Session scope             | Alias must point at Session APIs that already carry scope — avoids “Bot engine” temptation |
| Envelope stub last in RC-19               | Pure additive schema; must not block scope identity; enforcement waits for Library (RC-22) |
| Command Center after RC-19                | Needs naming + scope identity; must not invent finance SoT                                 |
| IDE after naming                          | Bot fleet UX requires Alias discipline already established                                 |
| Library before Orchestrator               | Orchestrator may only select certified strategies inside envelopes                         |
| Lake before ops Reporting                 | Reports must read projections, not invent ledgers                                          |
| Qualification before multi-exchange proof | Second venue needs profiles + scope model, not cloned engines                              |
| Orchestrator late                         | Highest god-module risk; requires Library + Profiles + Risk/Session maturity               |
| Stabilization last                        | Conformance proves aliases/authority/tactics/isolation                                     |

---

## Task 6 — Compatibility Report

Places where RC-18 **conflicts** with Spec v2.0 (or would conflict if expanded carelessly).

| #   | Conflict                                 | Current implementation                                           | Target (Spec)                                                       | Migration approach                                                                     | Risk                                       |
| --- | ---------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------ |
| C1  | No Exchange Scope                        | Workspace + `exchange` string + single practical Binance path    | Exchange Scope isolates accounts, capacity, policy, adapter binding | RC-19 thin id + default scope; RC-27 proves multi-scope                                | **High** if implemented as cloned engines  |
| C2  | Bot vs Session                           | UI said “Paper Trading” / “Live sessions”; no Bot facade         | Bot = UI/product facade for Trading Session                         | **Epic 2 done:** `BotFacadeService` delegates to Session; id===sessionId; no aggregate | **Critical** if new Bot lifecycle appears  |
| C3  | Strategy “active” ≠ certified Library    | `StrategyRecord` statuses + Deployment approval                  | Only Library-certified versions on production path                  | RC-22 Library + gate; keep Deployment immutability                                     | High                                       |
| C4  | No Tactical Envelope                     | Deployment `parameters` unconstrained by certified envelope      | Runtime/Orchestrator only pick envelope points                      | Stub RC-19; enforce RC-22                                                              | High if stub mistaken for enforcement      |
| C5  | Risk policy not scope-bound              | `M2_BASELINE_RISK_POLICY` global paper policy                    | Platform Risk Engine + per-scope Exchange Risk Policy inputs        | Extend inputs later; never fork Risk Engine                                            | High                                       |
| C6  | Knowledge ≠ Lake                         | In-memory Knowledge/Insight stacks + Prisma research outcomes    | Append-only warehouse from SoT/research events                      | New Lake projection (RC-23); do not promote Knowledge domain to Lake                   | **Critical** if Lake becomes financial SoT |
| C7  | LatestMarketState name collision         | Live market projection named “market state”                      | Market State = condition classifier                                 | Keep projection; introduce classifier later under distinct name/module                 | Medium (confusion)                         |
| C8  | Dual StrategyDeployment models           | M3 domain Deployment + Prisma Stage-1 `StrategyDeployment` table | One production Deployment model; Stage-1 retired                    | Leave Stage-1 read-only; do not expand; migrate consumers when touched                 | Medium                                     |
| C9  | Ops UI / live-trading-engine Kill Switch | Kill Switch on live-trading surfaces; productization incomplete  | Durable Risk/Session safety; Command Center commands via ports      | RC-20 productize over canonical ports; no UI-only flag                                 | High                                       |
| C10 | Pages ≠ Command Center                   | Scattered trading/research pages                                 | Command Center = command UI + projections only                      | RC-20 facade; pages may feed into it                                                   | Medium                                     |
| C11 | Wallet/Account scope                     | `PaperAccount` workspace-scoped only                             | Trading Account owned by Exchange Scope                             | RC-19 add scope id; later enforce cross-scope rejection                                | Medium                                     |
| C12 | Research dual stacks (Accepted Legacy)   | Legacy analysis vs Insight/Recommendation                        | Single analytical feed via Lake/projections                         | Do not expand; migrate on Lake/Reporting touch                                         | Medium                                     |
| C13 | Product language in potential APIs       | Risk of REST `/bots` etc.                                        | Code/API canonical (`trading-session`, …)                           | Alias Dictionary enforcement in review                                                 | Medium                                     |

---

## Task 7 — Safe Refactoring

### Safe to refactor immediately (RC-19 window)

| Area                                                                      | Why safe                                                         |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Documentation index / project-status citations of Spec v2.0               | No runtime behavior                                              |
| UI copy alias (Session → Bot label)                                       | Presentation only; APIs unchanged                                |
| Additive nullable/default `exchangeScopeId` with default Binance backfill | Identity plumbing; no algorithm change if defaulted consistently |
| Envelope TypeScript schema stub + tests for serialize/parse               | Dead until RC-22 enforcement                                     |
| Conformance/smoke tests for Alias Dictionary (forbid `/bots` resources)   | Prevents drift                                                   |

### Must remain untouched until later RCs

| Area                                            | Until                                                        | Why                                                                |
| ----------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| Trading Session lifecycle + recovery algorithms | ≥ RC-20 for command surfaces only; core forever frozen shape | ADR-014 / RC-18 recovery baselined; high regression cost           |
| Orders → Risk → Execution → Fill path           | Never rewrite; only additive context                         | ADR-012…018 Freeze                                                 |
| Ledger / Position rebuild semantics             | Never rewrite                                                | ADR-015 SoT                                                        |
| Strategy Runtime evaluation core                | RC-22 for envelope guard only                                | Working Signal Intent path                                         |
| Kill Switch productization / Command Center     | RC-20                                                        | Needs ops story; UI-as-SoT risk                                    |
| IDE shell                                       | RC-21                                                        | Large UX; depends on Bot alias discipline                          |
| Strategy Library certification                  | RC-22                                                        | Requires research→certification product rules                      |
| Envelope enforcement                            | RC-22                                                        | Without Library, enforcement is fiction or blocks research wrongly |
| Knowledge Lake                                  | RC-23                                                        | Needs event projection design + durability decision                |
| Dual-stack deletion/merge                       | ≥ RC-23                                                      | Premature merge without Lake target increases breakage             |
| Trading Orchestrator                            | RC-26                                                        | God-module risk without Library/Profiles                           |
| Market State classifier                         | RC-26 (with Orchestrator)                                    | Not the live-market projection                                     |
| Second exchange / adapter expansion             | RC-27                                                        | Requires isolation tests + Qualification                           |
| Live capital adapter                            | Future ADR                                                   | Paper Freeze                                                       |
| Auth hardening (TD-005/006)                     | Before strong multi-operator CC claims                       | Important debt but not Spec skeleton                               |
| In-memory campaign/knowledge durability         | Before Lake product claims                                   | Separate from RC-19 hooks                                          |

### Rule of thumb

> If a change can create a **second** execution path, **second** risk authority, **second** ledger, or a **Bot aggregate**, it is unsafe for RC-19 — defer.

---

## Task 8 — Acceptance Criteria (RC-19 complete when…)

RC-19 is **complete only when all** of the following are satisfied:

### A. Governance

1. Architecture Specification v2.0 remains **Approved** and is linked as the canonical architectural constitution for implementers.
2. This Migration Plan is **Approved** (status updated from Draft).
3. RC-18 gate recorded: US295/ADL-008 **Closed** or **explicit accepted deferral** entered in the residual register (no silent skip).
4. No new ADR was required — **or** any ADR created only closes a real ownership gap without contradicting Spec/Freeze.

### B. Integration skeleton (code)

5. Every new Trading Session persists a non-empty `exchangeScopeId`.
6. Every new PaperAccount (Trading Account) persists a non-empty `exchangeScopeId`.
7. A **default** Exchange Scope representing Binance exists and is used for current single-venue paper path (backfill or create-path default).
8. No Nest module, Prisma model, or REST resource named `Bot` / `Cluster` as a **new aggregate**; Cluster/Bot appear only as UI aliases where introduced.
9. Tactical Envelope **schema stub** exists in code (types and optional attachment), with tests for structural round-trip — **and** Runtime does **not** yet reject on envelope (enforcement deferred to RC-22).
10. Frozen canonical path behavior is unchanged: existing Session/Orders/Risk/Execution/Ledger regression tests pass.

### C. Naming discipline

11. UI Session surfaces updated in-scope show **Bot** as the product label while API/types remain `trading-session` (canonical).
12. Code review / conformance note cites Alias Dictionary: product terms must not create bounded contexts.

### D. Non-goals verified (negative acceptance)

13. No Command Center, IDE shell, Library certification product, Lake warehouse, Orchestrator, Market Qualification, or second exchange adapter shipped as RC-19 scope.
14. No parallel trading stack introduced; Stage-1 retired path remains retired.
15. Knowledge domain was not rebranded as Knowledge Lake.

### E. Exit

16. RC-19 release notes / project-status state: **integration skeleton complete; ready for RC-20 ops foundation**.
17. Open residual items from RC-19 (if any) are registered with target RC — none silently absorbed into “done.”

---

## Appendix A — RC-19 story seed list (planning only)

Suggested story breakdown after plan approval (IDs to allocate per story-id process):

| Seed               | Intent                                                          |
| ------------------ | --------------------------------------------------------------- |
| RC19-DOC           | Approve Migration Plan; sync index/status to Spec constitution  |
| RC19-SCOPE-ID      | Exchange Scope identity + default Binance scope                 |
| RC19-ACCOUNT-SCOPE | PaperAccount.exchangeScopeId                                    |
| RC19-SESSION-SCOPE | TradingSession.exchangeScopeId                                  |
| RC19-BOT-ALIAS     | UI Bot alias on Session surfaces                                |
| RC19-ENVELOPE-STUB | Tactical Envelope schema stub + tests                           |
| RC19-ACCEPT        | Acceptance pack: frozen-path regression + negative scope checks |

---

## Appendix B — Traceability

| Spec building block             | First migration RC                                      | Notes                           |
| ------------------------------- | ------------------------------------------------------- | ------------------------------- |
| Research Lab                    | — (exists)                                              | Maintain; no RC-19 change       |
| Strategy Library                | RC-22                                                   | Stub envelope only in RC-19     |
| Market Qualification / Profile  | RC-25                                                   |                                 |
| Market State                    | RC-26                                                   | Distinct from LatestMarketState |
| Trading Orchestrator            | RC-26                                                   |                                 |
| Trading Session / Runtime       | RC-19 (scope id + Bot alias)                            | Core already exists             |
| Risk + Exchange Risk Policy     | RC-19 (no); RC-20 Kill Switch; policy inputs with Scope |                                 |
| Orders / Execution / Accounting | — (exists)                                              | Scope fields later as needed    |
| Exchange Scope                  | RC-19 thin → RC-27 multi                                |                                 |
| Trading Account                 | RC-19 scope id                                          |                                 |
| Knowledge Lake                  | RC-23                                                   |                                 |
| Reporting / AI                  | RC-24                                                   |                                 |
| Command Center / Dashboard      | RC-20                                                   |                                 |
| Live Market Data                | — (exists)                                              |                                 |

---

## Approval

| Role                             | Decision                    | Date |
| -------------------------------- | --------------------------- | ---- |
| Architecture owner               | ☐ Approve ☐ Request changes |      |
| Tech lead                        | ☐ Approve ☐ Request changes |      |
| Product owner (scope minimality) | ☐ Approve ☐ Request changes |      |

**Implementation starts only after this plan is approved.**
