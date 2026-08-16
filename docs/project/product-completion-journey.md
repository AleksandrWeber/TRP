# Version 2 Canonical Product Journey

**Document:** Product Completion Journey  
**Status:** Canonical user journey for Version 2 paper-first product  
**Date:** 2026-08-16  
**Canonical status:** [Product Completion Status](./product-completion-status.md)  
**Governing charter:** [Version 2 Product Completion Roadmap](./v2-product-completion-program.md)  
**Tracker:** [Product Completion Backlog](./v2-product-completion-backlog.md)  
**Closure:** [Definition of Done](./product-completion-definition-of-done.md)  
**Planning freeze:** [Product Completion Readiness Report](./product-completion-readiness-report.md)  
**J-01:** [PC-18](./pc-18-implementation-report.md) **COMPLETE**  
**J-02:** [PC-14](./pc-14-implementation-report.md) **COMPLETE**  
**J-04:** [PC-02](./pc-02-implementation-report.md) **COMPLETE**  
**J-05:** [PC-01](./pc-01-implementation-report.md) **COMPLETE**  
**J-06:** [PC-04](./pc-04-implementation-report.md) **COMPLETE**  
**J-07:** [PC-03](./pc-03-implementation-report.md) **COMPLETE**  
**J-08:** [PC-11](./pc-11-implementation-report.md) **COMPLETE**  
**J-09:** [PC-15 slice 15-a](./pc-15-a-implementation-report.md) **COMPLETE**  
**J-10:** [PC-05](./pc-05-implementation-report.md) **COMPLETE**  
**J-11:** [PC-17](./pc-17-implementation-report.md) **COMPLETE**  
**J-12:** [PC-06](./pc-06-implementation-report.md) **COMPLETE**  
**J-13:** [PC-07](./pc-07-implementation-report.md) **COMPLETE**  
**J-14:** [PC-13](./pc-13-implementation-report.md) **COMPLETE**  
**Cluster:** [PC-12](./pc-12-implementation-report.md) **COMPLETE**  
**Qualification:** [PC-08](./pc-08-implementation-report.md) **COMPLETE**  
**Profile:** [PC-09](./pc-09-implementation-report.md) **COMPLETE**  
**Market State:** [PC-10](./pc-10-implementation-report.md) **COMPLETE**  
**Shell:** [PC-19](./pc-19-implementation-report.md) **COMPLETE**  
**Polish:** [PC-20](./pc-20-implementation-report.md) **COMPLETE**

There is **one** canonical Version 2 customer journey. Product Completion exists to make this path operable. It does not invent a second workflow.

Architecture owners below are frozen (Spec §5, Authority Matrix, Alias Dictionary). Responsible packages are the approved PC inventory. This document does not add packages, change priorities, or change execution order.

```text
Login
  → Workspace
  → Research
  → Certification
  → Strategy Library
  → Runtime Validation
  → Deployment
  → Trading Orchestrator
  → Trading Session
  → Reporting
  → AI Narrative
  → Notification
  → Telegram
  → Command Center
```

**Current loop status:** Steps J-01 … J-14 are **Complete**. Version 2 is **COMPLETE** ([certification](./version-2-final-certification.md)). J-13 is Telegram (channel) over **PC-07 Notification Channels Product**. J-11 AI Narrative is **Complete** (PC-17). Product Completion status: [`product-completion-status.md`](./product-completion-status.md). Scores: [audit v2](./product-readiness-audit-v2.md).

---

## Step states

| State           | Meaning                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| **Not Started** | No Product Completion work on this step; user cannot operate it as V2 product.                            |
| **In Progress** | A usable fragment exists (often a prototype or adjacent slice); the responsible PC package is not Closed. |
| **Complete**    | Definition of Done met for the responsible package; the user can perform this step.                       |
| **Blocked**     | The canonical loop cannot pass this step until listed dependencies exist.                                 |

---

## Canonical steps

### J-01 Login

| Field                   | Value                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **Purpose**             | Authenticate a durable customer account. Enter the product. |
| **Current owner**       | Auth (existing `/auth`, JWT guard). Not a new domain.       |
| **Responsible package** | PC-18 Identity                                              |
| **Current state**       | **Complete**                                                |
| **Dependencies**        | None                                                        |

Durable customer account. Credentials persist on the existing Prisma `User` table. `/login` has no prefilled admin password. JWT login/register unchanged. PC-18 closed: [implementation](./pc-18-implementation-report.md).

---

### J-02 Workspace

| Field                   | Value                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| **Purpose**             | Select the workspace context for all later work.                                                 |
| **Current owner**       | Workspace. `WorkspaceProvider` models the active workspace; REST exposes the existing aggregate. |
| **Responsible package** | PC-14 Workspace Management (chrome: PC-19 Operator Shell)                                        |
| **Current state**       | **Complete**                                                                                     |
| **Dependencies**        | J-01 (PC-18). Shell first (PC-19).                                                               |

List, named create, rename, archive, switch, and persisted selection in the PC-19 paper-first shell. REST over the existing Workspace owner. PC-14 closed: [implementation](./pc-14-implementation-report.md).

---

### J-03 Research

| Field                   | Value                                                                             |
| ----------------------- | --------------------------------------------------------------------------------- |
| **Purpose**             | Produce evidence: lab, RCC, campaigns, walk-forward. Knowledge for certification. |
| **Current owner**       | Research Lab / Campaign / Research Control (Spec §5.1).                           |
| **Responsible package** | None (already customer-usable). Polish: PC-20 **Complete**.                       |
| **Current state**       | **Complete** (research OS). Journey polish **Complete**.                          |
| **Dependencies**        | J-01, J-02                                                                        |

Must stay labeled **research** ([Product UI Policy](./product-ui-policy.md)). Not deploy. Not live trading.

---

### J-04 Certification

| Field                   | Value                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------- |
| **Purpose**             | Admit a research candidate into the Strategy Library as an immutable certified version. |
| **Current owner**       | Strategy Library — `StrategyLibraryCertificationPort` (RC-22).                          |
| **Responsible package** | PC-02 Certification                                                                     |
| **Current state**       | **Complete**                                                                            |
| **Dependencies**        | J-03 (evidence). PC-01 Library landing (**Complete**).                                  |

Wizard, history, reasons, metadata, and Library badge refresh over `StrategyLibraryCertificationPort`. Research strategies remain CRUD candidates. PC-02 closed: [implementation](./pc-02-implementation-report.md).

---

### J-05 Strategy Library

| Field                   | Value                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| **Purpose**             | Browse and inspect certified membership and envelopes — SoT for production-path strategies. |
| **Current owner**       | Strategy Library (Spec §5.2). Lookup / Eligibility / Lifecycle ports.                       |
| **Responsible package** | PC-01 Strategy Library                                                                      |
| **Current state**       | **Complete**                                                                                |
| **Dependencies**        | J-01, J-02. Certification (J-04) fills the catalog.                                         |

Official `/strategy-library` browser over Lookup / Eligibility. `/strategies` is research CRUD, not this step. Empty library is valid until certify. PC-01 closed: [implementation](./pc-01-implementation-report.md). Certification fills membership: [PC-02](./pc-02-implementation-report.md).

---

### J-06 Runtime Validation

| Field                   | Value                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| **Purpose**             | Fail-closed Gate: validate a deployment request before a session starts. |
| **Current owner**       | Runtime Enforcement — `RuntimeEnforcementPort` (RC-23).                  |
| **Responsible package** | PC-04 Runtime Validation                                                 |
| **Current state**       | **Complete**                                                             |
| **Dependencies**        | J-05 (Library lookup / eligibility).                                     |

Gate REST and UI over `RuntimeEnforcementPort.validateDeployment`. PASS / FAIL, reasons, Strategy Version, timestamp, and history. Fail-closed. No override. PC-04 closed: [implementation](./pc-04-implementation-report.md).

---

### J-07 Deployment

| Field                   | Value                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**             | Bind a certified library version (Mission ≡ Strategy Deployment) to a paper session after Gate PASS.                          |
| **Current owner**       | Strategy Deployment / Trading Session (Spec §5.6). Exchange Scope as isolation input (PC-12, not a journey rename).           |
| **Responsible package** | PC-03 Deployment                                                                                                              |
| **Current state**       | **Complete**                                                                                                                  |
| **Dependencies**        | J-04, J-05, J-06. Exchange Scope product (PC-12) is **Complete**; create may still use the existing Deployment default scope. |

Wizard, list, details, history, status, metadata, Library Version, and Runtime Validation stamp over existing Strategy Deployment REST. Gate must PASS. Approve freezes. Does not start a Trading Session. PC-03 closed: [implementation](./pc-03-implementation-report.md).

---

### J-08 Trading Orchestrator

| Field                   | Value                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**             | Coordinate certified strategy/tactic selection and emit `SessionHandoffIntent`. Not Execution. Not Session owner.                                       |
| **Current owner**       | Trading Orchestrator (Spec §5.5).                                                                                                                       |
| **Responsible package** | PC-11 Trading Orchestrator. Session consume of intent: PC-15 slice 15-a.                                                                                |
| **Current state**       | **Complete**                                                                                                                                            |
| **Dependencies**        | J-05, J-06, J-07. Market Profile publish wiring is complete (PC-15 15-b). Profile product UI is complete (PC-09). State product UI is complete (PC-10). |

Plans, lifecycle, request, progress, Session Handoff Intent, and history over existing Trading Orchestrator REST. `createsSession` remains **false**. Trading Session consumes the intent (PC-15 15-a). Completed Qualification publishes Profile (PC-15 15-b). PC-11 closed: [implementation](./pc-11-implementation-report.md).

---

### J-09 Trading Session

| Field                   | Value                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **Purpose**             | Run the paper Trading Session (UI: Bot) on the certified path.         |
| **Current owner**       | Trading Session (ADR-014). Bot Facade is alias only.                   |
| **Responsible package** | PC-03 (bind/start). PC-15 15-a (handoff consumer). Operate from PC-13. |
| **Current state**       | **Complete**                                                           |
| **Dependencies**        | J-07, J-08 (intent) + PC-15 15-a.                                      |

Manual paper works. Certified bind (J-07) is complete. Orchestrator intent (J-08) is complete. Operators can create and operate paper sessions from Command Center (PC-13). Certified Session create from Orchestrator intent is complete (PC-15 15-a). Trading Session remains Session owner. Orchestrator `createsSession` remains false.

---

### J-10 Reporting

| Field                   | Value                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| **Purpose**             | Request and read RC-24 report projections. Never ledger SoT.                                          |
| **Current owner**       | Reporting — `ReportingServicePort` / `ReportingQueryPort` (RC-24).                                    |
| **Responsible package** | PC-05 Reporting. Session → report run: PC-15. Report → AI: PC-15 15-c. Dashboard numbers: PC-15 15-f. |
| **Current state**       | **Complete** (RC-24 product UI / REST). Research reports remain a different slice.                    |
| **Dependencies**        | J-09 for session-backed reports. Knowledge Lake (PC-16) feed **Complete**.                            |

Do not treat `/reports` as this step. Report → AI wiring is complete (PC-15 15-c). Report → Notification wiring is complete (PC-15 15-d). Dashboard projection wiring is complete (PC-15 15-f). Product UI is **Complete** (PC-05). Paths are `/reporting` and `/v1/report-runs`. Knowledge Lake warehouse UI is **Complete** (PC-16) at `/knowledge-lake`.

---

### J-11 AI Narrative

| Field                   | Value                                                               |
| ----------------------- | ------------------------------------------------------------------- |
| **Purpose**             | Explain a ReportRun / Lake context. Narrative only. Never capital.  |
| **Current owner**       | AI Analytics — `AIAnalyticsPort` (RC-24).                           |
| **Responsible package** | PC-17 AI Analytics. Reporting → AI wiring: PC-15 15-c **Complete**. |
| **Current state**       | **Complete**                                                        |
| **Dependencies**        | J-10. PC-16 Lake context **Complete**.                              |

`/ai/execute` is the OpenRouter gateway, not this step. Completed ReportRun invokes AI on the certified in-process path (PC-15 15-c). Narratives are visible on the Reporting detail panel (PC-05) and as a standalone product (PC-17). Lake context is a customer product (PC-16). PC-17 closed: [implementation](./pc-17-implementation-report.md).

---

### J-12 Notification

| Field                   | Value                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------- |
| **Purpose**             | Enable delivery preferences, routing, quiet hours. Delivery Layer only. Authority none. |
| **Current owner**       | Notification Delivery — `NotificationServicePort` (RC-24).                              |
| **Responsible package** | PC-06 Notification. Reporting → `deliver()`: PC-15 15-d **Complete**.                   |
| **Current state**       | **Complete**                                                                            |
| **Dependencies**        | J-01. Value after J-10.                                                                 |

Command Center toasts are RC-20 operator UI, not this step. `/settings` is RCC prefs, not this step. Completed ReportRun invokes `deliver()` on the certified in-process path (PC-15 15-d). In-memory Telegram adapter path is wired (PC-15 15-e). Product UI is `/notifications` (PC-06). Notification Channels product UI is `/notifications/channels` (PC-07).

---

### J-13 Telegram

| Field                   | Value                                                                           |
| ----------------------- | ------------------------------------------------------------------------------- |
| **Purpose**             | Connect Telegram, test, receive routed messages. Never a trading control plane. |
| **Current owner**       | Notification Delivery Telegram channel (active catalog).                        |
| **Responsible package** | PC-07 Notification Channels. Notification → Channels: PC-15 15-e **Complete**.  |
| **Current state**       | **Complete**                                                                    |
| **Dependencies**        | J-12.                                                                           |

Telegram channel page at `/notifications/channels/telegram`. In-memory adapter path is wired (PC-15 15-e). Chat id remains adapter-supplied. Telegram is never a trading control plane. Reserved channels are visible as reserved.

---

### J-14 Command Center

| Field                   | Value                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **Purpose**             | Operate the paper fleet: what is happening now, stop safely, projections only.            |
| **Current owner**       | Command Center (command UI + projection). Session lifecycle SoT remains Trading Session.  |
| **Responsible package** | PC-13 Command Center. Dashboard data flow: PC-15 15-f **Complete**. Shell honesty: PC-19. |
| **Current state**       | **Complete**                                                                              |
| **Dependencies**        | J-09 for certified create/operate. J-10 / J-12 for projection tiles (PC-15).              |

Pause / resume / stop work. Create paper bot works through existing Session / Deployment ports, including certified consume of `SessionHandoffIntent` (PC-15 15-a). Emergency region **hidden** (no durable paper Kill Switch; UI Policy). Dashboard tiles are wired from existing owner reads (PC-15 15-f). Reporting product UI is complete (PC-05).

---

## Supporting packages (not extra journey steps)

These remain approved packages. They enable the spine; they do not create a second workflow.

| Package                        | Role on the journey                                                                                                                                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PC-08 Qualification            | Research artifact. Feeds Profile. Publish wiring: PC-15 15-b **Complete**. Product UI **Complete** ([implementation](./pc-08-implementation-report.md)).                                                                                  |
| PC-09 Market Profile           | Confidence input to J-08 (read). Publish wiring: PC-15 15-b **Complete**. Product UI **Complete** ([implementation](./pc-09-implementation-report.md)).                                                                                   |
| PC-10 Market State             | Selection context for J-08 (read). Product UI **Complete** ([implementation](./pc-10-implementation-report.md)).                                                                                                                          |
| PC-12 Exchange Scope           | Cluster isolation for J-07 / J-08 / J-14. **Complete** ([implementation](./pc-12-implementation-report.md)).                                                                                                                              |
| PC-16 Knowledge Lake           | Analytical feed for J-10 / J-11. Not financial SoT. **Complete** ([implementation](./pc-16-implementation-report.md)).                                                                                                                    |
| PC-15 Product Flow Integration | Wires J-08→J-09 **(15-a Complete)**, Qualification→Profile **(15-b Complete)**, J-10→J-11 **(15-c Complete)**, J-10→J-12 **(15-d Complete)**, J-12→J-13 **(15-e Complete)**, dashboard into J-14 **(15-f Complete)**. Package **Closed**. |
| PC-19 Operator Shell           | Frame for J-01…J-14. **Complete** (paper-first chrome).                                                                                                                                                                                   |
| PC-20 Product UX Polish        | Journey consistency and CTAs across steps. No new steps. **Complete** ([implementation](./pc-20-implementation-report.md)).                                                                                                               |

---

## Package → journey map

Every Product Completion package: which steps it **enables**, which **later** steps depend on it.

| Package | Enables                                                                                                                                                                                                  | Later steps that depend on it               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| PC-18   | J-01 Login                                                                                                                                                                                               | J-02 … J-14 (all require a durable account) |
| PC-19   | Shell for the whole journey                                                                                                                                                                              | J-02 (workspace chrome); all later UI       |
| PC-14   | J-02 Workspace                                                                                                                                                                                           | J-03 … J-14 (workspace context)             |
| PC-01   | J-05 Strategy Library                                                                                                                                                                                    | J-04 landing, J-06, J-07, J-08              |
| PC-02   | J-04 Certification                                                                                                                                                                                       | J-05 (filled catalog), J-07, J-08, J-09     |
| PC-04   | J-06 Runtime Validation                                                                                                                                                                                  | J-07, J-08, J-09                            |
| PC-12   | Cluster bind (supports J-07, J-08, J-14)                                                                                                                                                                 | J-07, J-08, J-14                            |
| PC-08   | Qualification (supports J-08 via profile)                                                                                                                                                                | J-08 (via PC-09 + PC-15)                    |
| PC-09   | Profile reads for J-08                                                                                                                                                                                   | J-08                                        |
| PC-10   | State reads for J-08 **Complete**                                                                                                                                                                        | J-08                                        |
| PC-03   | J-07 Deployment; certified start of J-09                                                                                                                                                                 | J-08 (useful handoff), J-09, J-14 create    |
| PC-11   | J-08 Trading Orchestrator                                                                                                                                                                                | J-09 (via PC-15 15-a)                       |
| PC-15   | Wiring: J-08→J-09 **(15-a Complete)**, Qual→Profile **(15-b Complete)**, J-10→J-11 **(15-c Complete)**, J-10→J-12 **(15-d Complete)**, J-12→J-13 **(15-e Complete)**, dashboard→J-14 **(15-f Complete)** | J-09 certified path, J-11, J-13, J-14 tiles |
| PC-13   | J-14 Command Center (operate / create)                                                                                                                                                                   | End of loop (no later canonical step)       |
| PC-16   | Lake feed for J-10 / J-11                                                                                                                                                                                | J-10, J-11                                  |
| PC-05   | J-10 Reporting                                                                                                                                                                                           | J-11, J-12, J-14 projections                |
| PC-17   | J-11 AI Narrative                                                                                                                                                                                        | Optional explain after J-10                 |
| PC-06   | J-12 Notification **Complete**                                                                                                                                                                           | J-13                                        |
| PC-07   | J-13 Telegram **Complete** (Notification Channels product)                                                                                                                                               | End of delivery path                        |
| PC-20   | Usability of J-01…J-14 **Complete**                                                                                                                                                                      | None (no new step)                          |

---

## Loop complete when

The user can perform J-01 through J-14 on the **certified paper** path, with PC-15 flows running in the product, PC-19 shell honest (no Live Trading implication), architecture unchanged, and [Definition of Done](./product-completion-definition-of-done.md) closed for every package that enables those steps.

---

**End of Canonical Product Journey.**
