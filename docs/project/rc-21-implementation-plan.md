# RC-21 Implementation Plan — Knowledge Lake

**Document:** RC-21 Implementation Plan  
**Status:** ARCHITECTURE APPROVED — Epic implementation in progress  
**Date:** 2026-08-10  
**Nature:** Planning + approved contracts. Implementation proceeds by thin Epics only.

**Authority inputs:**

| Input                                                                       | Role                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [Architecture Specification v2.0](./trp-architecture-specification-v2.md)   | Constitution (§5.13 Knowledge Lake; §4 principles; §6 data flow)          |
| [Authority Matrix](./v2-authority-matrix.md)                                | Lake = Projection / warehouse; never finance or order SoT                 |
| [Alias Dictionary](./v2-alias-dictionary.md)                                | Knowledge Lake ≡ event warehouse / projection store — not a second ledger |
| [Architecture Glossary](./v2-architecture-glossary.md)                      | Lake definition                                                           |
| [C4 Container Diagram](./v2-c4-container-diagram.md)                        | Lake beside money path                                                    |
| [Engineering Workflow Standard v1.0](./engineering-workflow-standard-v1.md) | Canonical RC process (planning → API contract → thin Epics)               |
| [RC-20 Closure Report](./rc-20-closure-report.md)                           | Predecessor CLOSED; Command Center foundation certified                   |
| [V2 Implementation Roadmap](./v2-implementation-roadmap.md)                 | Baseline themes (see §0 sequencing note)                                  |

**Companion deliverables:**

- [Epic Breakdown](./rc-21-epic-breakdown.md)
- [API Contract](./rc-21-api-contract.md)
- [Integration Diagram](./rc-21-integration-diagram.md)

---

## 0. Sequencing note (governance)

Approved baseline ([V2 Implementation Roadmap](./v2-implementation-roadmap.md), [Engineering Audit](./engineering-audit-report-v2-freeze.md), [RC-20 Roadmap Reconciliation](./rc-20-roadmap-reconciliation.md) Recommendation A) assigned:

| RC        | Baseline theme                         |
| --------- | -------------------------------------- |
| **RC-20** | Command Center foundation (**CLOSED**) |
| **RC-21** | IDE shell + Bot fleet UX               |
| **RC-22** | Strategy Library + Tactical Envelope   |
| **RC-23** | Knowledge Lake (projection)            |

**This planning package proposes advancing Knowledge Lake to RC-21** after RC-20 close.

| Effect                   | Disposition                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| Knowledge Lake theme     | Delivered as **RC-21** (this package)                                                           |
| IDE shell + Bot fleet UX | Deferred to a later RC (retain Spec module; renumber after approval — likely former RC-21 slot) |
| Strategy Library         | Remains **RC-22** planning package (unchanged theme)                                            |
| Reporting & AI           | Remains after Lake (baseline RC-24); depends on Lake foundation                                 |
| Architecture Spec v2.0   | **Unchanged** — Spec owns modules, not RC integers                                              |
| Authority Matrix / Alias | **Unchanged**                                                                                   |

**Hard rule:** Implementation of Knowledge Lake under the RC-21 label may begin only after this plan (including the sequencing proposal) is approved. Until then, the living roadmap still lists IDE as RC-21.

This is a **roadmap sequencing decision**, not an architecture redesign.

---

## 1. Release overview

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| RC name        | RC-21                                                 |
| Theme          | Knowledge Lake — analytical projection warehouse      |
| Predecessor    | RC-20 CLOSED (Command Center foundation)              |
| Nature         | Append-only analytical repository for immutable facts |
| Implementation | **Not started** — planning only                       |

### Mission

Introduce the **Knowledge Lake** as the platform’s analytical memory: an append-only projection warehouse that collects immutable analytical events from research and trading activity for reporting, AI Analyst / AI Research context, future ML, and historical analytics.

RC-21 answers: _Can the platform accumulate immutable analytical facts from SoT-derived events without inventing a second ledger, order book, session brain, or risk engine?_

### What Knowledge Lake is

- Analytical repository
- Append-only projection / warehouse
- Immutable analytical event store (facts projected from owners)
- Feed for Reporting, AI Analyst, AI Research, future ML, historical analytics

### What Knowledge Lake is not

| Not                                                                  | Owner / later RC                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Ledger / cash / balances                                             | Accounting SoT (ADR-015)                                         |
| Orders lifecycle                                                     | Orders                                                           |
| Trading Session lifecycle                                            | Trading Session (ADR-014)                                        |
| Risk decisions                                                       | Risk Engine                                                      |
| Execution submits/cancels                                            | Execution Engine (ADR-012)                                       |
| Source of Truth for money                                            | Forbidden (Authority Matrix)                                     |
| Command plane / Kill Switch                                          | Command Center → Session/Risk ports                              |
| Research Knowledge graph / Insight / Recommendation product redesign | Existing research foundations remain; **do not rebrand as Lake** |
| Reporting product / AI panels                                        | Spec §5.14–5.15 / later RC (baseline RC-24)                      |
| IDE shell / Bot fleet UX                                             | Deferred (former RC-21 theme)                                    |
| Strategy Library                                                     | RC-22                                                            |
| Event-sourcing redesign of SoT                                       | Forbidden                                                        |
| Kafka / Redis / queue product                                        | Forbidden in this RC (no transport invent)                       |

---

## 2. Objectives

1. Establish Knowledge Lake as a **projection warehouse** per Spec §5.13 — append-only, non-authoritative.
2. Define **ingestion** and **query** ports (interfaces only in this planning stage; implement in Epics after approval).
3. Classify analytical events into a small, stable taxonomy (Market, Trading, Risk, Paper, Research, Reporting, System).
4. Wire **one-way** projection from existing SoT / research producers — no feedback loops into money or lifecycle owners.
5. Preserve separation from existing Knowledge / Insight / Recommendation domains (research foundations ≠ Lake warehouse).
6. Prove Authority Matrix conformance: Lake never owns or overrides business state.
7. Leave Reporting UI, AI panels, ML training, and IDE shell out of RC-21 DoD.

---

## 3. Scope

### 3.1 In scope (RC-21)

| Area                         | Detail                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| **Lake module foundation**   | Bounded projection owner for analytical facts; not a SoT module                                 |
| **Ingestion ports**          | Accept immutable analytical events from approved producers (see API Contract)                   |
| **Query ports**              | Read/filter analytical history for non-authoritative consumers                                  |
| **Event classification**     | Stable category labels + producer → category mapping                                            |
| **Ownership rules**          | SoT → Projection → Lake documented and testable                                                 |
| **Append-only semantics**    | No update/delete of admitted facts; corrections via new compensating analytical facts if needed |
| **Producer adapters (thin)** | Map existing domain/outbox facts to Lake ingestion — without changing SoT ownership             |
| **Conformance evidence**     | Negative tests: Lake cannot mutate Orders / Session / Risk / Ledger / Execution                 |

### 3.2 Out of scope (explicit non-goals)

- Database schema design / Prisma models / retention DDL (deferred to implementation Epics **after** plan+contract approval; not part of this planning task)
- Message buses, Kafka, Redis, custom queue products
- Event-sourcing redesign of Orders / Ledger / Session
- Changes to Source of Truth owners or Freeze ADRs
- Architecture Spec rewrite
- Reporting jobs, scheduled narratives, Telegram reports
- AI Analyst / AI Assistant product surfaces
- ML feature stores / training pipelines
- Command Center analytics widgets as Lake explorers
- IDE shell / Bot fleet UX
- Strategy Library certification warehouse
- Rebranding `knowledge` / Insight / Recommendation as Knowledge Lake
- Live-capital enablement
- Dual-write “Lake as recovery journal”

---

## 4. Architecture references

| Reference                                  | Binding for RC-21                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Spec §5.13 Knowledge Lake                  | Purpose, responsibilities, inputs, outputs, interactions                                                                  |
| Spec §4 Source of Truth / Read-Write table | Projections may not mutate trading/finance state                                                                          |
| Spec §6 Data Flow                          | Research → … → Knowledge Lake → Reporting → User                                                                          |
| Authority Matrix                           | Lake contents = Projection / warehouse; Lake loses to Ledger/Fills/Orders                                                 |
| Alias Dictionary                           | Lake ≠ financial SoT; “Lake as ledger” forbidden                                                                          |
| C4 diagram                                 | Lake beside money path; feeds Reporting + AI                                                                              |
| ADR-012…018                                | Ownership Freeze unchanged                                                                                                |
| ADR-015                                    | Ledger remains append-only financial SoT; Lake may observe, never authorize                                               |
| ADR-019                                    | Research application events are infrastructure notifications — Lake consumes facts, does not redefine execution contracts |
| Engineering Workflow Standard v1.0         | Plan → API Contract → thin Epics → review → validation → release                                                          |

---

## 5. Data ownership

Normative chain for RC-21:

```text
Source of Truth (owner modules)
        ↓  emit / record immutable business facts
Projection (derived read models / event envelopes)
        ↓  project analytical copies
Knowledge Lake (append-only analytical warehouse)
        ↓  read only
Reporting / AI Analyst / AI Research / future ML
```

### Rules

1. **Knowledge Lake never owns business state.** Orders, Risk decisions, Session lifecycle, Fills, Positions, Ledger balances, and Execution submits remain owned by their SoT modules.
2. **Knowledge Lake only stores immutable analytical facts** projected from owners (or from research artifact references). It does not invent balances, fills, or lifecycle.
3. **Conflict rule (Authority Matrix):** If Lake and Ledger/Orders/Fills disagree on money or order state — **SoT wins**; Lake is wrong or stale and must be rebuilt/corrected with new appends, never by editing SoT from Lake.
4. **Existing research Knowledge / Insight / Recommendation** remain research-domain foundations. They may **emit or reference** facts into the Lake; they are not renamed to Lake and are not the financial warehouse.
5. **Portfolio / Dashboard / Command Center** remain separate projections. They may later query Lake for analytics; they do not become Lake storage.

See also [Integration Diagram — Data Ownership](./rc-21-integration-diagram.md#2-data-ownership).

---

## 6. Event classification

Keep the taxonomy small. Categories label analytical facts for query and retention policy later — they do **not** create new bounded contexts.

| Category      | Meaning (analytical)                                                    | Typical producers                                    |
| ------------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| **Market**    | Market-data / connectivity / qualification-oriented analytical facts    | Live Market Data, Qualification (when present)       |
| **Trading**   | Session/runtime/order/fill analytical facts (non-authoritative copies)  | Trading Session, Strategy Runtime, Orders, Execution |
| **Risk**      | Risk decision / kill / policy-application analytical facts              | Risk Engine, safety ports                            |
| **Paper**     | Paper-mode path markers and paper-account analytical facts              | Paper Trading / paper adapter path                   |
| **Research**  | Lab campaign / experiment / validation / evidence analytical facts      | Research Lab, research pipelines                     |
| **Reporting** | Report-run / aggregation-job analytical markers (when Reporting exists) | Reporting (later RC; stub category reserved)         |
| **System**    | Ops / recovery / health / projection-pipeline analytical facts          | Recovery, outbox projection health, system ops       |

### Classification rules

- Every Lake fact has exactly one primary category.
- Categories are labels on projections — **not** new SoT modules.
- Paper vs live must remain distinguishable on Trading / Paper facts (paper Freeze today).
- Do not invent micro-taxonomies (no “Risk.Kill.SubType.v3”) in RC-21 planning.

Full producer map: [Integration Diagram](./rc-21-integration-diagram.md).

---

## 6A. Knowledge Lifecycle Policy (future intention)

Architectural intention only. **No storage technology. No retention implementation in RC-21.**

Analytical facts in Knowledge Lake are expected to age through lifecycle stages over time:

| Stage              | Intention                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| **Hot Data**       | Recently admitted facts needed for near-term Reporting, AI context, and operator analytics        |
| **Warm Data**      | Older but still query-relevant history; may trade access latency for cost                         |
| **Cold Archive**   | Long-retention immutable history retained for research / audit / ML — not day-to-day ops queries  |
| **Optional Purge** | Future policy may allow controlled removal of eligible cold facts under explicit governance rules |

### Lifecycle rules (intention)

1. Lifecycle stages describe **access and retention posture**, not authority. Moving a fact Hot → Warm → Cold never promotes it to SoT.
2. Append-only admission remains the write model; lifecycle transitions must not rewrite business meaning.
3. **Optional Purge** is not a silent delete API for SoT correction. Purge — if ever enabled — is a governed retention action, separate from Orders/Ledger/Session ownership.
4. RC-21 does **not** implement tiering, archival jobs, or purge. Categories and ports must not assume a specific store.

---

## 6B. Fact Quality (future intention)

Documentation only. **No quality scoring implementation in RC-21.**

Future analytical facts may carry a quality classification describing how the Lake obtained them:

| Quality       | Meaning                                                             |
| ------------- | ------------------------------------------------------------------- |
| **Verified**  | Projected from trusted SoT / research owners with intact provenance |
| **Derived**   | Computed or summarized from other Lake facts / projections          |
| **Imported**  | Admitted from an external or historical import path                 |
| **Recovered** | Re-projected or restored after pipeline / durability interruption   |

### Quality rules (intention)

1. Quality labels describe **analytical confidence posture**, not financial authority.
2. `Verified` does not make Lake balances authoritative — Ledger/Orders/Fills still win on conflict.
3. `Derived` / `Imported` / `Recovered` must remain distinguishable from primary SoT projections when consumers care.
4. RC-21 Epics must not block on quality fields; they may be added later as optional metadata under a contract revision.

---

## 6C. Knowledge Lake Metrics (future intention)

Informational operational metrics only. **No telemetry implementation in RC-21.**

| Metric                | Intention                                               |
| --------------------- | ------------------------------------------------------- |
| **Facts Stored**      | Total admitted analytical facts in the warehouse        |
| **Facts per Day**     | Admission volume over time                              |
| **Ingestion Latency** | Delay from producer fact time to Lake admit             |
| **Duplicate Ratio**   | Share of admits resolved as idempotent duplicates       |
| **Producer Health**   | Per-producer admission success / silence / rejection    |
| **Storage Growth**    | Warehouse size / growth trend (when persistence exists) |

### Metrics rules (intention)

1. Metrics observe the **projection warehouse**, not Ledger PnL or Session lifecycle truth.
2. Metrics must not become a control plane (no auto-trading or auto-kill from Lake metrics).
3. RC-21 ships no dashboards, exporters, or metric collectors for these series.

---

## 7. Implementation order

After plan + API contract approval:

```text
Epic 1  Lake boundary + ownership contracts (module skeleton, invariants)
  ↓
Epic 2  Ingestion port + append-only admission
  ↓
Epic 3  First producer projections (Session / Orders / Risk / Paper — thin)
  ↓
Epic 4  Research Lab producer projections (thin)
  ↓
Epic 5  Query port + consumer-safe reads
  ↓
Epic 6  Authority conformance & RC-21 acceptance
```

Details: [Epic Breakdown](./rc-21-epic-breakdown.md).

**Dependency note:** Stable trading/accounting events already exist on the frozen paper path (RC-16…RC-20). Library certification events are **nice-to-have later**; RC-21 does not wait on RC-22. Prefer projecting what owners already emit.

---

## 8. Dependencies

| Dependency                           | Status / note                                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Architecture Spec v2.0 Approved      | Required                                                                                                             |
| Authority Matrix / Alias Dictionary  | Required                                                                                                             |
| Engineering Workflow Standard v1.0   | Required process                                                                                                     |
| RC-20 CLOSED                         | Required predecessor                                                                                                 |
| Frozen paper path events             | Available (Session, Orders, Risk, Execution, accounting lineage)                                                     |
| Research Lab event/result surfaces   | Available as foundations; dual-stack Accepted Legacy remains — do not expand                                         |
| Transactional outbox / domain events | Existing infrastructure may be **consumed as sources**; RC-21 does not redesign outbox or invent Kafka               |
| Strategy Library (RC-22)             | **Not blocking** for Lake foundation                                                                                 |
| Reporting / AI (later)               | **Consumers** of Lake; not RC-21 deliverables                                                                        |
| Durability / storage decision        | Locked at API Contract + first implementation Epic — not in this planning task beyond “append-only projection store” |

---

## 9. Risks

| Risk                                          | Severity | Mitigation                                                                                     |
| --------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| Lake treated as financial SoT / second ledger | Critical | Authority Matrix tests; Alias “Lake as ledger” forbidden; acceptance forbids balance authority |
| Feedback loops into Orders/Risk/Session       | Critical | One-way integration diagram; no command ports on Lake; negative conformance Epic               |
| Rebrand Knowledge → Lake (dual stack growth)  | High     | Explicit non-goal; Lake is warehouse beside research knowledge domains                         |
| Event-sourcing redesign of SoT                | High     | Forbidden; Lake projects copies; owners unchanged                                              |
| Overdesigned taxonomy / transport             | Medium   | Seven categories max; no Kafka/Redis/queue products in RC-21                                   |
| Roadmap confusion (IDE vs Lake as RC-21)      | Medium   | §0 sequencing approval required; update living roadmap only after approval                     |
| Reporting/AI scope creep                      | Medium   | Explicit deferral; Lake query ports only                                                       |
| Stale projections misread as live ops truth   | Medium   | Label facts as analytical; Command Center remains on Session/Risk ports for ops                |

---

## 10. Acceptance criteria (Definition of Done for RC-21)

RC-21 may close only when:

### Scope & architecture

1. Knowledge Lake exists as an append-only analytical projection warehouse per Spec §5.13.
2. Architecture Spec v2.0, Authority Matrix, and Alias Dictionary remain unchanged in meaning (no Spec rewrite required for this RC).
3. No new financial, order, session, risk, or execution SoT introduced.
4. Existing Knowledge / Insight / Recommendation domains are not rebranded as Knowledge Lake.
5. Roadmap sequencing (Lake as RC-21; IDE deferred) is recorded and living status/roadmap docs updated **at close** (or earlier if owners approve mid-flight).

### Ownership & flow

6. Documented and tested chain: **SoT → Projection → Knowledge Lake**; Lake never owns business state.
7. Integration is **append-only** and **one-way** from producers listed in the Integration Diagram — no Lake → SoT command path.
8. Event classification covers Market, Trading, Risk, Paper, Research, Reporting, System without overdesign.

### Ports

9. Ingestion port admits immutable analytical facts only (no update/delete API for admitted facts).
10. Query port serves non-authoritative consumers; responses are labeled/understood as projections.
11. API Contract compatibility rules followed (canonical names; no `/bots` Lake resources; Bot ≡ Session where referenced).

### Conformance

12. Negative evidence: Lake cannot submit orders, mutate ledger/positions, change session lifecycle, or approve risk.
13. Conflict rule verified in docs/tests: Ledger/Orders/Fills win over Lake on money/order disputes.
14. All Epics meet DoD ([Epic Breakdown](./rc-21-epic-breakdown.md)).
15. Explicit non-goals deferred with targets (Reporting/AI, IDE, Library, ML, Kafka/queues).

### Explicit non-acceptance

- Lake used as recovery journal or kill/lifecycle authority
- “Analytics DB” that recomputes authoritative balances
- Shipping Reporting UI or AI panels under the RC-21 label
- Quiet resequence without §0 approval
- Schema/queue/Kafka delivery claimed as architecture redesign

---

## 11. Pre-approval validation checklist

Verify before approving this plan:

| Check                                     | Result for this package                                      |
| ----------------------------------------- | ------------------------------------------------------------ |
| Compatible with Spec v2.0 §5.13 / §4 / §6 | **Yes** — Lake as projection warehouse; no SoT claim         |
| Authority Matrix                          | **Yes** — Lake = Projection; loses to Ledger/Orders/Fills    |
| Alias Dictionary                          | **Yes** — Lake ≠ ledger; canonical APIs                      |
| Engineering Workflow Standard             | **Yes** — Planning + API Contract before implementation      |
| RC-20 release                             | **Yes** — RC-20 CLOSED; predecessor satisfied                |
| Sequencing vs baseline roadmap            | **Requires explicit approval** (§0) — Lake advanced to RC-21 |

---

## 12. Deliverables checklist

| Deliverable               | Document                                                         |
| ------------------------- | ---------------------------------------------------------------- |
| RC-21 Implementation Plan | This file                                                        |
| Epic Breakdown            | [`rc-21-epic-breakdown.md`](./rc-21-epic-breakdown.md)           |
| API Contract              | [`rc-21-api-contract.md`](./rc-21-api-contract.md)               |
| Integration Diagram       | [`rc-21-integration-diagram.md`](./rc-21-integration-diagram.md) |
| Acceptance Criteria       | §10                                                              |

**STOP:** Planning complete. No implementation in this task. Wait for approval.

---

## Approval

| Role               | Decision                                                     | Date |
| ------------------ | ------------------------------------------------------------ | ---- |
| Architecture owner | ☐ Approve (incl. §0 Lake→RC-21 sequencing) ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes                                  |      |
| Product owner      | ☐ Approve ☐ Request changes                                  |      |

**After approval:** Begin Epic 1 under a separate implementation task. Do not start Reporting/AI, IDE shell, or Strategy Library under the RC-21 label.
