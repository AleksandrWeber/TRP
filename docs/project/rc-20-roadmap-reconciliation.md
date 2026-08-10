# RC-20 Roadmap Reconciliation Report

**Document:** Roadmap Reconciliation Report  
**Status:** COMPLETE — Recommendation **A** accepted for planning purposes (keep numbering)  
**Date:** 2026-08-10  
**Nature:** Documentation consistency only. No implementation. No architecture changes.

> **Follow-up (2026-08-10):** Command Center planning now uses the RC-20 label; Strategy Library planning retargeted to RC-22 files. See §4.1 sync items 1–5 applied for planning corpus. Living roadmap theme text was already aligned (no change required).

**Authority inputs:**

| Input                                                                           | Role                                                 |
| ------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md)       | Approved constitution (modules, not RC numbers)      |
| [Engineering Audit Report — V2 Freeze](./engineering-audit-report-v2-freeze.md) | Source RC-19…28 sequence                             |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)                     | Approved planning baseline (“order/goals unchanged”) |
| [RC-19 Closure Report](./rc-19-closure-report.md)                               | Deferred-work RC targets                             |
| [RC-20 Implementation Plan](./rc-20-implementation-plan.md)                     | Provisional Library-as-RC-20 planning (outlier)      |

---

## Verdict (preview)

**Recommendation: A — Keep current numbering.**

Canonical next RC remains **RC-20 = Command Center foundation**.  
Strategy Library remains **RC-22**.  
Retarget the provisional Strategy Library planning package from the RC-20 label to **RC-22** in a later sync task.

Architecture Specification v2.0 is unchanged either way (it does not define RC numbers).

---

## 1. Roadmap validation — where RC numbering is defined

### 1.1 Comparison table (theme by RC)

| RC     | Engineering Audit (§7)                   | V2 Implementation Roadmap            | Project Status / Living Roadmap | RC-19 Migration / Closure                   | Provisional “RC-20” Library planning package  |
| ------ | ---------------------------------------- | ------------------------------------ | ------------------------------- | ------------------------------------------- | --------------------------------------------- |
| **19** | Spec + integration skeleton              | **COMPLETE** (same)                  | CLOSED                          | CLOSED                                      | Assumes CLOSED                                |
| **20** | **Command Center foundation**            | **Command Center foundation** (Next) | **Command Center foundation**   | **Command Center / Kill Switch**            | **Strategy Library** (proposed)               |
| **21** | IDE shell + Bot fleet UX                 | Same                                 | Same (implied)                  | IDE shell                                   | Deferred as “RC-21 theme”                     |
| **22** | **Strategy Library + Tactical Envelope** | Same                                 | Not restated as next            | **Strategy Library + envelope enforcement** | Content of this package (mislabeled as RC-20) |
| **23** | Knowledge Lake                           | Same                                 | —                               | Lake                                        | Deferred “RC-23 theme”                        |
| **24** | Reporting & AI                           | Same                                 | —                               | Reporting                                   | Out of scope                                  |
| **25** | Qualification / Profile                  | Same                                 | —                               | Qualification                               | Out of scope                                  |
| **26** | Orchestrator + Market State              | Same                                 | —                               | Orchestrator                                | Out of scope                                  |
| **27** | Multi-exchange scope                     | Same                                 | —                               | Multi-exchange                              | Out of scope                                  |
| **28** | V2 stabilization                         | Same                                 | —                               | Stabilization                               | Out of scope                                  |

**Inconsistency locus:** only the provisional Strategy Library planning package (`rc-20-implementation-plan.md`, `rc-20-epic-breakdown.md`, `rc-20-strategy-library-integration.md`) plus the `docs/README.md` index lines that advertise those files as **RC-20 — Strategy Library**. All approved baseline roadmaps agree on Command Center = RC-20 and Library = RC-22.

### 1.2 Document inventory (RC number definitions / references)

| Document                                | Defines sequence?           | RC-20 theme stated     | RC-22 theme stated          | Consistency vs Audit          |
| --------------------------------------- | --------------------------- | ---------------------- | --------------------------- | ----------------------------- |
| `engineering-audit-report-v2-freeze.md` | **Yes** (source)            | Command Center         | Strategy Library + Envelope | Canonical source              |
| `v2-implementation-roadmap.md`          | **Yes** (approved baseline) | Command Center         | Strategy Library + Envelope | Aligned                       |
| `project-status.md`                     | Points next work            | Command Center         | —                           | Aligned                       |
| `roadmap.md`                            | Points next work            | Command Center         | —                           | Aligned                       |
| `rc-19-migration-plan.md`               | Maps deferred RCs           | Command Center         | Library + enforcement       | Aligned                       |
| `rc-19-closure-report.md`               | Deferred table              | Command Center         | Library + envelope          | Aligned                       |
| `rc-19-epic2-bot-facade.md`             | Future RC refs              | Command Center         | —                           | Aligned                       |
| `rc-19-epic3-tactical-envelope.md`      | Future RC refs              | —                      | Enforcement                 | Aligned                       |
| `v2-architecture-glossary.md`           | Envelope deferral           | —                      | Enforcement                 | Aligned                       |
| `v2-alias-dictionary.md`                | Envelope deferral           | —                      | Enforcement RC-22+          | Aligned                       |
| `trp-architecture-specification-v2.md`  | **No RC numbers**           | N/A                    | N/A                         | N/A — modules only            |
| `v2-tactics-contract.md`                | **No RC numbers**           | N/A                    | N/A                         | N/A                           |
| `v2-authority-matrix.md`                | **No RC numbers**           | N/A                    | N/A                         | N/A                           |
| `v2-final-readiness-assessment.md`      | No RC-20/22 theme map       | —                      | —                           | Neutral                       |
| `rc-20-implementation-plan.md`          | Proposes resequence         | **Strategy Library**   | (was approved theme)        | **Divergent** (flagged in §0) |
| `rc-20-epic-breakdown.md`               | Follows plan                | Strategy Library       | —                           | **Divergent**                 |
| `rc-20-strategy-library-integration.md` | Follows plan                | Strategy Library       | —                           | **Divergent**                 |
| `docs/README.md`                        | Index only                  | Links Library as RC-20 | —                           | **Divergent** (index)         |

### 1.3 What Spec does _not_ decide

Architecture Specification v2.0 defines **Strategy Library**, **Command Center**, envelopes, and lifecycles as **modules/capabilities**. It does **not** assign them to RC-20 or RC-22. Therefore reconciling RC numbers does **not** require Spec edits and does **not** redesign architecture.

---

## 2. Canonical sequence recommendation

### 2.1 Recommended canonical sequence (unchanged from approved baseline)

| RC          | Theme                                         | Notes                                                                  |
| ----------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| 18 closeout | US295 / recovery claim                        | Residual; not reopened by this report                                  |
| **19**      | Spec v2.0 + integration skeleton              | **COMPLETE**                                                           |
| **20**      | Ops readiness — **Command Center foundation** | Kill Switch / status over Session/Risk ports; non-authoritative ops UI |
| **21**      | IDE shell + Bot fleet UX                      | Bot = Session alias                                                    |
| **22**      | **Strategy Library + Tactical Envelope**      | Certification SoT + envelope enforcement                               |
| **23**      | Knowledge Lake (projection)                   | Non-SoT warehouse                                                      |
| **24**      | Reporting & AI Analytics                      |                                                                        |
| **25**      | Market Qualification + Market Profile         |                                                                        |
| **26**      | Trading Orchestrator (thin) + Market State    | Depends on Library                                                     |
| **27**      | Multi Exchange Scope expansion                |                                                                        |
| **28**      | V2 stabilization / RC                         |                                                                        |

### 2.2 Preservation of Architecture Spec

| Spec concern                               | Preserved under this sequence?              |
| ------------------------------------------ | ------------------------------------------- |
| Strategy Library as certified SoT (§5.2)   | Yes — delivered at RC-22                    |
| Paper uses only certified strategies (§8)  | Yes — enforced when Library ships           |
| Command Center as command UI + projections | Yes — delivered at RC-20                    |
| Tactics Contract Option B                  | Yes — enforced with Library at RC-22        |
| One Risk / Execution / Session path        | Yes — neither RC redesigns Freeze           |
| No new global modules                      | Yes — resequence rejected; themes unchanged |

---

## 3. Impact assessment

### Option A — Keep current numbering (recommended)

| RC                                 | Number change?                 | Scope change?                    | Dependency graph change?                    |
| ---------------------------------- | ------------------------------ | -------------------------------- | ------------------------------------------- |
| RC-20 Command Center               | **No**                         | **No**                           | **No**                                      |
| RC-21 IDE                          | **No**                         | **No**                           | **No** (soft “status APIs helpful” remains) |
| RC-22 Strategy Library + Envelope  | **No**                         | **No**                           | **No**                                      |
| RC-23…28                           | **No**                         | **No**                           | **No**                                      |
| Provisional Library planning files | **Label only** (RC-20 → RC-22) | **No** (keep Library scope text) | N/A — planning retarget                     |

Net effect: **documentation label fix** on the outlier planning package + README index. Approved roadmap corpus stays authoritative.

### Option B — Renumber future RCs (not recommended)

Illustrative swap (Library earlier, Command Center later) — one possible mapping:

| New #    | Theme                       | Was   |
| -------- | --------------------------- | ----- |
| RC-20    | Strategy Library + Envelope | RC-22 |
| RC-21    | IDE shell + Bot fleet UX    | RC-21 |
| RC-22    | Command Center foundation   | RC-20 |
| RC-23…28 | Unchanged themes            | Same  |

| RC (new)             | Number change?  | Scope change?             | Dependency graph change?                                                                                                                     |
| -------------------- | --------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| RC-20 Library        | **Yes** (22→20) | **No** (same Spec module) | **Yes** — Library precedes Command Center; Lake “prefer after Library” moves earlier; Orchestrator still after Library but number refs shift |
| RC-21 IDE            | Number same     | **No**                    | **Soft yes** — loses natural predecessor “RC-20 status APIs”; must restate deps on Session/Risk directly or on later Command Center          |
| RC-22 Command Center | **Yes** (20→22) | **No**                    | **Yes** — ops foundation after IDE; Auth hardening “before/with Command Center” moves; Reporting “Command Center metrics helpful” still soft |
| RC-23…28             | Number same     | **No**                    | **Ref updates** wherever “RC-22 Library” or “RC-20 Command Center” appear                                                                    |

Option B preserves Spec modules but **rewrites the approved sequencing contract** (“order/goals unchanged”) across Audit, V2 Roadmap, RC-19 closeout tables, glossary deferrals, and living status docs.

---

## 4. Documentation update plan (do not update yet)

Synchronization executes **only after** this report is approved. This section is a checklist, not an edit pass.

### 4.1 If Recommendation A is approved (expected)

| #   | Document                                                    | Required update                                                                                                                                                                                |
| --- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `rc-20-implementation-plan.md`                              | Retarget: rename/refile as **RC-22** Strategy Library plan; remove resequence proposal; set status to planning under RC-22; point “next implementable RC” elsewhere to Command Center as RC-20 |
| 2   | `rc-20-epic-breakdown.md`                                   | Retarget to RC-22 (rename/refile + internal RC labels)                                                                                                                                         |
| 3   | `rc-20-strategy-library-integration.md`                     | Retarget to RC-22 (rename/refile + internal RC labels)                                                                                                                                         |
| 4   | `docs/README.md`                                            | Replace RC-20 Strategy Library index lines with RC-22 Library planning links; ensure RC-20 Command Center is not implied as Library                                                            |
| 5   | Optional: stub `rc-20-implementation-plan.md` redirect note | If files are renamed, leave a short pointer so old links do not strand readers                                                                                                                 |
| 6   | `v2-implementation-roadmap.md`                              | **No theme change**; optionally note “Library planning artifacts live under RC-22” after retarget                                                                                              |
| 7   | `project-status.md` / `roadmap.md`                          | **No theme change**; remain “next = Command Center”                                                                                                                                            |
| 8   | RC-19 closure / migration / glossary / alias                | **No change** (already aligned)                                                                                                                                                                |
| 9   | Architecture Spec / Tactics / Authority                     | **No change**                                                                                                                                                                                  |

**Explicitly do not** start Strategy Library implementation under an RC-20 label after A.

### 4.2 If Recommendation B were approved (alternate checklist)

| #   | Document                                                         | Required update                                                                                                           |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | `engineering-audit-report-v2-freeze.md`                          | Rewrite §7 RC-20…22 themes + critical-path diagram; record intentional order change                                       |
| 2   | `v2-implementation-roadmap.md`                                   | Rewrite RC-20…22 sections, summary table, dependency blurbs; lift “order unchanged” claim or amend with ADR/decision note |
| 3   | `project-status.md`                                              | Next work = Strategy Library                                                                                              |
| 4   | `roadmap.md`                                                     | Next work = Strategy Library                                                                                              |
| 5   | `rc-19-migration-plan.md`                                        | All RC-20/22 deferred targets, R20/R22 steps, conflict table, module map                                                  |
| 6   | `rc-19-closure-report.md`                                        | Deferred table + readiness language (ops vs library)                                                                      |
| 7   | `rc-19-epic2-bot-facade.md` / `rc-19-epic3-tactical-envelope.md` | Future RC references                                                                                                      |
| 8   | `v2-architecture-glossary.md`                                    | Envelope enforcement target RC                                                                                            |
| 9   | `v2-alias-dictionary.md`                                         | Envelope enforcement RC-22+ → new number                                                                                  |
| 10  | Library planning trio + `docs/README.md`                         | Confirm RC-20 = Library; drop “pending resequence” language                                                               |
| 11  | Decision log / short governance note                             | Record why Audit order was changed (still no Spec rewrite)                                                                |

### 4.3 Out of scope for sync

- Code, Prisma, modules
- Architecture Spec body
- Freeze ADRs
- Implementing either Command Center or Strategy Library

---

## 5. Final recommendation

### **A) Keep current numbering**

**Justification:**

1. **Approved baseline already agrees.** Engineering Audit §7 and V2 Implementation Roadmap (explicitly “order/goals unchanged”) define RC-20 = Command Center and RC-22 = Strategy Library. Living status/roadmap and RC-19 closeout match that baseline.
2. **The conflict is local.** Only the provisional Strategy Library planning package (and README index) assumed Library-as-RC-20, and that package already marked resequence as requiring owner approval.
3. **Architecture Spec is preserved without edits.** Spec owns modules and lifecycles, not RC integers. Keeping numbers avoids fake “architecture change” noise.
4. **Lowest risk dependency graph.** IDE’s soft dependency on ops status APIs, Lake-after-Library preference, and Orchestrator-after-Library edges stay as written. Option B forces widespread ref churn and soft-dep rewrites.
5. **Planning work is not wasted.** Library scope, epics, integration map, and acceptance criteria remain valid as **RC-22** planning once labels are retargeted.
6. **Process discipline.** Changing Audit order without a recorded sequencing decision would recreate the inconsistency this report exists to stop.

### Rejected alternative (summary)

**B) Renumber** would only be justified if Product/Architecture owners explicitly prioritize Validated Knowledge enforcement _before_ ops Command Center and accept updating the entire RC-19…28 reference surface. That is a valid product sequencing choice but **not** required to preserve Spec, and it is higher documentation risk.

---

## Deliverables checklist

| Deliverable                             | Location                            |
| --------------------------------------- | ----------------------------------- |
| Roadmap Reconciliation Report           | This file                           |
| Canonical RC sequence recommendation    | §2 (keep Audit/V2 Roadmap sequence) |
| Documentation synchronization checklist | §4 (no updates executed)            |

---

## Approval

| Role               | Decision                                          | Date |
| ------------------ | ------------------------------------------------- | ---- |
| Architecture owner | ☐ A Keep numbering ☐ B Renumber ☐ Request changes |      |
| Tech lead          | ☐ A ☐ B ☐ Request changes                         |      |
| Product owner      | ☐ A ☐ B ☐ Request changes                         |      |

**After approval of A:** run §4.1 sync in a separate documentation task; then Command Center planning/implementation may proceed as RC-20; Library planning continues as RC-22.

**After approval of B:** run §4.2 sync before any implementation; do not mix old and new numbers mid-flight.

**STOP:** Reconciliation report complete. No documentation updates, no code, no architecture changes in this task.
