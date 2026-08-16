# PC-17 AI Analytics Product — Architecture Impact

**Package:** PC-17  
**Date:** 2026-08-16  
**Verdict:** Architecture unchanged. Authority unchanged. AI Analytics remains narrative owner. Reporting remains report owner. Knowledge Lake remains warehouse owner. Notification remains delivery owner. Trading owners unchanged. No new SoT. No new authority.

---

## Frozen artifacts

| Artifact                        | Status after PC-17  |
| ------------------------------- | ------------------- |
| Architecture Specification v2.0 | Unmodified          |
| Authority Matrix                | Unmodified          |
| Alias Dictionary                | Unmodified          |
| RC-19 … RC-28                   | Unmodified (CLOSED) |

---

## Ownership

| Concern                             | Owner before     | Owner after                       |
| ----------------------------------- | ---------------- | --------------------------------- |
| Analytical Narrative                | AI Analytics     | AI Analytics                      |
| ReportDefinition / ReportRun        | Reporting        | Reporting (consumed, not owned)   |
| Analytical facts / warehouse        | Knowledge Lake   | Knowledge Lake (cited, not owned) |
| Strategy membership                 | Strategy Library | Strategy Library (lookup only)    |
| Notification delivery               | Notification     | Unchanged                         |
| Research `/v1/ai/execute`           | AI Gateway       | Unchanged                         |
| Orders / Risk / Execution / Session | Existing owners  | Unchanged                         |

HTTP is transport. UI is not SoT. The product adapter does not persist narratives, generate reports, admit facts, send notifications, or become ledger SoT.

---

## Ports

| Port                               | Before                  | After                               |
| ---------------------------------- | ----------------------- | ----------------------------------- |
| `AIAnalyticsPort`                  | Active in-process       | **Active** — same generation + HTTP |
| `ReportingQueryPort`               | Active (PC-05 REST)     | **Consumed** for ReportRuns         |
| `ReportingServicePort.compareRuns` | Active in-process       | **Consumed** for comparison slices  |
| `KnowledgeLakeQueryPort`           | Active (PC-16 REST)     | **Consumed** for cited facts        |
| `StrategyLibraryLookupPort`        | Active (PC-01 REST)     | **Consumed** for cited library ids  |
| Persistence                        | `false` on AI Analytics | Unchanged (not a new SoT)           |
| Domain `rest`                      | `false` on AI Analytics | Unchanged — sibling adapter only    |

---

## What was not changed

- Deterministic narrator (`deterministic-report-narrator-v1`)
- AI Analytics still reads Reporting only for generation
- Knowledge Lake still does not import AI
- Reporting still does not own narratives
- Spec, Authority Matrix, Alias Dictionary, RC history
- AI Analytics still does not import Knowledge Lake, Strategy Library, or the product adapter

---

**End of Architecture Impact.**
