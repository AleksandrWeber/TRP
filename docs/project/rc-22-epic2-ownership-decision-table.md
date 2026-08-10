# RC-22 Epic 2 — Domain Ownership Decision Table

**Document:** Strategy Library Domain Ownership (Epic 2)  
**Status:** Epic 2 implemented — awaiting review  
**Date:** 2026-08-10  
**Parent:** [Epic 2 Report](./rc-22-epic2-strategy-domain-model.md) · [Domain Model Contract](./rc-22-domain-model-contract.md)

---

## Purpose

Record ownership decisions for the Strategy / StrategyVersion domain model introduced in Epic 2, and keep them distinct from Research and other runtimes.

---

## Ownership decisions

| Fact / type                           | Owner (SoT)                    | Authority                               | Epic 2 status     | Must not be owned by                  |
| ------------------------------------- | ------------------------------ | --------------------------------------- | ----------------- | ------------------------------------- |
| Library **Strategy** (family)         | Strategy Library               | SoT (family identity)                   | **Implemented**   | Research Lab, registry, Lake, Session |
| Library **StrategyVersion**           | Strategy Library               | SoT (immutable implementation identity) | **Implemented**   | Research Lab, registry, Lake, Session |
| `contentHash` / allowlists on version | Strategy Library               | SoT fields on version                   | **Implemented**   | Runtime hot-edit, UI cache            |
| Experimental registry Strategy        | `strategies` module            | SoT for editable Lab config             | Unchanged         | Strategy Library                      |
| Certification record                  | Strategy Library               | SoT (future)                            | **Not in Epic 2** | Lake, AI, Session                     |
| Evidence refs                         | Strategy Library               | SoT refs (future)                       | **Not in Epic 2** | Lake (may project later)              |
| Evidence bodies                       | Research Lab                   | SoT                                     | Unchanged         | Strategy Library                      |
| Tactical Envelope body                | Strategy Library               | SoT (future Epic 4)                     | **Not in Epic 2** | Session stub inventing envelopes      |
| Eligibility                           | Strategy Library gate (future) | Gate over Library                       | **Not in Epic 2** | Lake, UI                              |
| Session lifecycle                     | Trading Session                | SoT                                     | Unchanged         | Strategy Library                      |
| Knowledge Lake facts                  | Knowledge Lake                 | Projection                              | Unchanged         | Must not authorize Library membership |

---

## Distinct models (no duplication)

```text
strategies.Strategy          →  experimental / editable Lab config
strategy-library.Strategy    →  Library family identity (not certification)
strategy-library.StrategyVersion → immutable Library implementation unit
```

| Rule                                          | Decision                                                   |
| --------------------------------------------- | ---------------------------------------------------------- |
| Same TypeScript name in different modules?    | Allowed; import from module path / alias                   |
| Share Prisma table with registry?             | **No** (no persistence in Epic 2; must not overload later) |
| Registry `active` ⇒ Library member?           | **No** (`registryActiveMeansCertified() === false`)        |
| Research experiment entity = StrategyVersion? | **No**                                                     |

---

## Future certification note

Domain Model Contract allows multiple certified versions under one family over time (e.g. v1 certified then deprecated, v2 certified).

Epic 2 only models versions; it does **not** implement certification admission or status. Certification workflow remains Epic 3+.

---

## Conflict resolution (unchanged from Epic 1)

| Dispute                           | Winner                      |
| --------------------------------- | --------------------------- |
| Library family / version identity | Strategy Library            |
| Experimental config               | Strategy registry           |
| Analytical copies                 | Knowledge Lake (Projection) |
| Session lifecycle                 | Trading Session             |

---

## Approval

| Role               | Decision                    | Date |
| ------------------ | --------------------------- | ---- |
| Architecture owner | ☐ Approve ☐ Request changes |      |
| Tech lead          | ☐ Approve ☐ Request changes |      |
