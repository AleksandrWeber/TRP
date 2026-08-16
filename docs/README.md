# Trading Research Platform (TRP) — Architecture Index

> A Research Operating System for quantitative strategy development.

**Level-0 (product / UX authority):**

- [`project/trp-product-vision.md`](./project/trp-product-vision.md) — Product Vision
- [`project/trp-ux-vision.md`](./project/trp-ux-vision.md) — UX Vision

**Level-1 (engineering source of truth):** [`CANONICAL.md`](./CANONICAL.md)

## Where Version 2 is

Canonical wording: [Product Completion Status](./project/product-completion-status.md).

```text
Version 2 Architecture Complete     RC-19 … RC-28 CLOSED (v2.0.0)
        ↓
Version 2 Product Completion        COMPLETE
        ↓
Version 2 Complete                  CERTIFIED (v2.0.1)
        ↓
Version 3                           NEXT PLANNED WORK
```

| Stage                        | Status                                                                                                                            | Governing document                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version 2 Architecture       | **Complete.** History preserved. Do not reopen RCs.                                                                               | [`project/v2-implementation-roadmap.md`](./project/v2-implementation-roadmap.md) · Spec [`project/trp-architecture-specification-v2.md`](./project/trp-architecture-specification-v2.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Version 2 Product Completion | **COMPLETE.** Implementation packages Closed. Final Validation PASS.                                                              | [Canonical Status](./project/product-completion-status.md) · charter [`project/v2-product-completion-program.md`](./project/v2-product-completion-program.md) · tracker [`project/v2-product-completion-backlog.md`](./project/v2-product-completion-backlog.md) · journey [`project/product-completion-journey.md`](./project/product-completion-journey.md) · DoD [`project/product-completion-definition-of-done.md`](./project/product-completion-definition-of-done.md) · UI policy [`project/product-ui-policy.md`](./project/product-ui-policy.md) · freeze [`project/product-completion-readiness-report.md`](./project/product-completion-readiness-report.md) · Wave C [`project/wave-c-closure-report.md`](./project/wave-c-closure-report.md) · Audit v2 [`project/product-readiness-audit-v2.md`](./project/product-readiness-audit-v2.md) · Final Validation [`project/version-2-final-validation-report.md`](./project/version-2-final-validation-report.md) |
| Version 2 Complete           | **COMPLETE.** CERTIFIED. Tag `v2.0.1`. Scores live in [audit v2](./project/product-readiness-audit-v2.md). Do not copy them here. | [Canonical Status](./project/product-completion-status.md) · [Final Certification](./project/version-2-final-certification.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Version 3                    | **NEXT PLANNED WORK.**                                                                                                            | [Canonical Status](./project/product-completion-status.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

Closed package reports are historical snapshots. Current truth: [Canonical Status](./project/product-completion-status.md), Journey, Backlog, [Audit v2](./project/product-readiness-audit-v2.md), [Project Status](./project/project-status.md). Technical debt: [`project/technical-debt.md`](./project/technical-debt.md).

Product Completion is not an architecture program. It does not change Spec v2.0, the Authority Matrix, or the Alias Dictionary.

## Release Status

| Field                   | Value                                                       |
| ----------------------- | ----------------------------------------------------------- |
| Current Stable Release  | `v1.0.0` (research OS) · `v2.0.1` (paper-first product)     |
| Version 2 (paper-first) | **COMPLETE** — architecture `v2.0.0` · product `v2.0.1`     |
| Release Status          | Production Ready (V1) · Version 2 paper-first **CERTIFIED** |
| Last Certification      | PASS (`v2.0.1`)                                             |
| Production branch       | `main`                                                      |
| V1 Completion Report    | [`releases/V1-COMPLETION.md`](./releases/V1-COMPLETION.md)  |
| Changelog               | [`../CHANGELOG.md`](../CHANGELOG.md)                        |

---

## Documentation Status

- **Version 1:** Officially complete (`v1.0.0`)
- Research/Simulation Architecture: Frozen (RC-15.1)
- Paper Trading Architecture: Frozen (RC-16, ADR-012…ADR-018)
- MVP Scope: Frozen
- Future Features: [`docs/future/`](./future/)
- Archive: [`docs/archive/`](./archive/)
- V2 Freeze Preconditions (**Approved**): [`project/v2-freeze-preconditions.md`](./project/v2-freeze-preconditions.md)
  - Glossary · Decision Log · C4: [`project/v2-architecture-glossary.md`](./project/v2-architecture-glossary.md), [`project/v2-architecture-decision-log.md`](./project/v2-architecture-decision-log.md), [`project/v2-c4-container-diagram.md`](./project/v2-c4-container-diagram.md)
  - Engineering Audit: [`project/engineering-audit-report-v2-freeze.md`](./project/engineering-audit-report-v2-freeze.md)
  - RC-18 Snapshot: [`project/rc-18-current-system-snapshot.md`](./project/rc-18-current-system-snapshot.md)
  - V2 Roadmap (RC-19…28, **historical architecture**, CLOSED): [`project/v2-implementation-roadmap.md`](./project/v2-implementation-roadmap.md)
  - Version 2 Product Completion (**COMPLETE**; CERTIFIED `v2.0.1`): [`project/product-completion-status.md`](./project/product-completion-status.md) · [`project/version-2-final-certification.md`](./project/version-2-final-certification.md) · charter [`project/v2-product-completion-program.md`](./project/v2-product-completion-program.md)
  - Product Completion Readiness Report (planning freeze snapshot): [`project/product-completion-readiness-report.md`](./project/product-completion-readiness-report.md)
  - Technical Debt Register: [`project/technical-debt.md`](./project/technical-debt.md)
  - Final Readiness: [`project/v2-final-readiness-assessment.md`](./project/v2-final-readiness-assessment.md)
  - Architecture Spec v2.0 (**Approved**): [`project/trp-architecture-specification-v2.md`](./project/trp-architecture-specification-v2.md)
  - RC-19 Migration Plan: [`project/rc-19-migration-plan.md`](./project/rc-19-migration-plan.md)
  - RC-19 Epic 1 Exchange Scope Identity: [`project/rc-19-epic1-exchange-scope-identity.md`](./project/rc-19-epic1-exchange-scope-identity.md)
  - RC-19 Epic 2 Bot Facade: [`project/rc-19-epic2-bot-facade.md`](./project/rc-19-epic2-bot-facade.md)
  - RC-19 Epic 3 Tactical Envelope Foundation: [`project/rc-19-epic3-tactical-envelope.md`](./project/rc-19-epic3-tactical-envelope.md)
  - RC-19 Closure Report (**CLOSED**): [`project/rc-19-closure-report.md`](./project/rc-19-closure-report.md)
  - RC-20 Roadmap Reconciliation: [`project/rc-20-roadmap-reconciliation.md`](./project/rc-20-roadmap-reconciliation.md)
  - RC-20 Implementation Plan (**PLANNING** — Command Center): [`project/rc-20-implementation-plan.md`](./project/rc-20-implementation-plan.md)
  - RC-20 Epic Breakdown: [`project/rc-20-epic-breakdown.md`](./project/rc-20-epic-breakdown.md)
  - RC-20 Command Center Layout: [`project/rc-20-command-center-layout.md`](./project/rc-20-command-center-layout.md)
  - RC-20 Command Center UI Contract: [`project/rc-20-command-center-ui-contract.md`](./project/rc-20-command-center-ui-contract.md)
  - RC-20 Closure Report (**CLOSED**): [`project/rc-20-closure-report.md`](./project/rc-20-closure-report.md)
  - Engineering Workflow Standard v1.0 (**Approved** — RC-21+ process): [`project/engineering-workflow-standard-v1.md`](./project/engineering-workflow-standard-v1.md)
  - RC-21 Implementation Plan (**ARCHITECTURE APPROVED** — Knowledge Lake): [`project/rc-21-implementation-plan.md`](./project/rc-21-implementation-plan.md)
  - RC-21 Epic Breakdown: [`project/rc-21-epic-breakdown.md`](./project/rc-21-epic-breakdown.md)
  - RC-21 API Contract: [`project/rc-21-api-contract.md`](./project/rc-21-api-contract.md)
  - RC-21 Integration Diagram: [`project/rc-21-integration-diagram.md`](./project/rc-21-integration-diagram.md)
  - RC-21 Epic 1 Knowledge Lake Boundary (**review**): [`project/rc-21-epic1-knowledge-lake-boundary.md`](./project/rc-21-epic1-knowledge-lake-boundary.md)
  - RC-21 Epic 2 Ingestion Port (**review**): [`project/rc-21-epic2-ingestion-port.md`](./project/rc-21-epic2-ingestion-port.md)
  - RC-21 Epic 3 Trading Path Projections (**review**): [`project/rc-21-epic3-trading-path-projections.md`](./project/rc-21-epic3-trading-path-projections.md)
  - RC-21 Epic 4 Research Lab Projections (**review**): [`project/rc-21-epic4-research-lab-projections.md`](./project/rc-21-epic4-research-lab-projections.md)
  - RC-21 Epic 5 Query Port (**review**): [`project/rc-21-epic5-query-port.md`](./project/rc-21-epic5-query-port.md)
  - RC-21 Epic 6 Authority Conformance (**CLOSED**): [`project/rc-21-epic6-authority-conformance.md`](./project/rc-21-epic6-authority-conformance.md)
  - RC-21 Knowledge Lake Audit: [`project/rc-21-knowledge-lake-audit.md`](./project/rc-21-knowledge-lake-audit.md)
  - RC-21 Validation Report (**PASS**): [`project/rc-21-validation-report.md`](./project/rc-21-validation-report.md)
  - RC-21 Knowledge Lake Certification (**Ready=YES**): [`project/rc-21-knowledge-lake-certification.md`](./project/rc-21-knowledge-lake-certification.md)
  - RC-21 Closure Report (**CLOSED**): [`project/rc-21-closure-report.md`](./project/rc-21-closure-report.md)
  - RC-22 Implementation Plan (**CLOSED** — Strategy Library domain): [`project/rc-22-implementation-plan.md`](./project/rc-22-implementation-plan.md)
  - RC-22 Epic Breakdown: [`project/rc-22-epic-breakdown.md`](./project/rc-22-epic-breakdown.md)
  - RC-22 Domain Model Contract: [`project/rc-22-domain-model-contract.md`](./project/rc-22-domain-model-contract.md)
  - RC-22 API Contract (ports): [`project/rc-22-api-contract.md`](./project/rc-22-api-contract.md)
  - RC-22 Strategy Library Integration: [`project/rc-22-strategy-library-integration.md`](./project/rc-22-strategy-library-integration.md)
  - RC-22 Validation Summary (planning): [`project/rc-22-validation-summary.md`](./project/rc-22-validation-summary.md)
  - RC-22 Architecture Consistency Report: [`project/rc-22-architecture-consistency-report.md`](./project/rc-22-architecture-consistency-report.md)
  - RC-22 Epic 1 Strategy Library Boundary (**approved**): [`project/rc-22-epic1-strategy-library-boundary.md`](./project/rc-22-epic1-strategy-library-boundary.md)
  - RC-22 Epic 1 Boundary Diagram: [`project/rc-22-epic1-boundary-diagram.md`](./project/rc-22-epic1-boundary-diagram.md)
  - RC-22 Epic 2 Strategy Domain Model (**approved**): [`project/rc-22-epic2-strategy-domain-model.md`](./project/rc-22-epic2-strategy-domain-model.md)
  - RC-22 Epic 2 Ownership Decision Table: [`project/rc-22-epic2-ownership-decision-table.md`](./project/rc-22-epic2-ownership-decision-table.md)
  - RC-22 Epic 3 Strategy Certification (**approved**): [`project/rc-22-epic3-strategy-certification.md`](./project/rc-22-epic3-strategy-certification.md)
  - RC-22 Epic 3 Domain Model Evolution: [`project/rc-22-epic3-domain-model-evolution.md`](./project/rc-22-epic3-domain-model-evolution.md)
  - RC-22 Epic 3 Ownership Decision Table: [`project/rc-22-epic3-ownership-decision-table.md`](./project/rc-22-epic3-ownership-decision-table.md)
  - RC-22 Epic 3 Certification Policy: [`project/rc-22-epic3-certification-policy.md`](./project/rc-22-epic3-certification-policy.md)
  - RC-22 Epic 4 Tactical Envelope Binding (**approved**): [`project/rc-22-epic4-tactical-envelope-binding.md`](./project/rc-22-epic4-tactical-envelope-binding.md)
  - RC-22 Epic 4 Domain Model Evolution: [`project/rc-22-epic4-domain-model-evolution.md`](./project/rc-22-epic4-domain-model-evolution.md)
  - RC-22 Epic 4 Tactical Envelope Contract: [`project/rc-22-epic4-tactical-envelope-contract.md`](./project/rc-22-epic4-tactical-envelope-contract.md)
  - RC-22 Epic 4 Ownership Decision Table: [`project/rc-22-epic4-ownership-decision-table.md`](./project/rc-22-epic4-ownership-decision-table.md)
  - RC-22 Epic 4 Certification Coverage Report: [`project/rc-22-epic4-certification-coverage-report.md`](./project/rc-22-epic4-certification-coverage-report.md)
  - RC-22 Epic 5 Eligibility Gate (**approved**): [`project/rc-22-epic5-eligibility-gate.md`](./project/rc-22-epic5-eligibility-gate.md)
  - RC-22 Epic 5 Domain Model Evolution: [`project/rc-22-epic5-domain-model-evolution.md`](./project/rc-22-epic5-domain-model-evolution.md)
  - RC-22 Epic 5 Eligibility Policy: [`project/rc-22-epic5-eligibility-policy.md`](./project/rc-22-epic5-eligibility-policy.md)
  - RC-22 Epic 5 Ownership Decision Table: [`project/rc-22-epic5-ownership-decision-table.md`](./project/rc-22-epic5-ownership-decision-table.md)
  - RC-22 Epic 5 Eligibility Coverage Report: [`project/rc-22-epic5-eligibility-coverage-report.md`](./project/rc-22-epic5-eligibility-coverage-report.md)
  - RC-22 Epic 5 Strategy Traceability Report: [`project/rc-22-epic5-strategy-traceability-report.md`](./project/rc-22-epic5-strategy-traceability-report.md)
  - RC-22 Epic 6 Lifecycle / Deprecation / Archive (**approved**): [`project/rc-22-epic6-lifecycle-deprecation-archive.md`](./project/rc-22-epic6-lifecycle-deprecation-archive.md)
  - RC-22 Epic 6 Domain Model Evolution: [`project/rc-22-epic6-domain-model-evolution.md`](./project/rc-22-epic6-domain-model-evolution.md)
  - RC-22 Epic 6 Lifecycle Policy: [`project/rc-22-epic6-lifecycle-policy.md`](./project/rc-22-epic6-lifecycle-policy.md)
  - RC-22 Epic 6 Ownership Decision Table: [`project/rc-22-epic6-ownership-decision-table.md`](./project/rc-22-epic6-ownership-decision-table.md)
  - RC-22 Epic 6 Internal Audit Report (**PASS**): [`project/rc-22-epic6-internal-audit-report.md`](./project/rc-22-epic6-internal-audit-report.md)
  - RC-22 Epic 6 Strategy Readiness Report: [`project/rc-22-epic6-strategy-readiness-report.md`](./project/rc-22-epic6-strategy-readiness-report.md)
  - RC-22 Epic 6 Strategy Traceability Report: [`project/rc-22-epic6-strategy-traceability-report.md`](./project/rc-22-epic6-strategy-traceability-report.md)
  - RC-22 Lifecycle State Diagram: [`project/rc-22-lifecycle-state-diagram.md`](./project/rc-22-lifecycle-state-diagram.md)
  - RC-22 Validation Report (**PASS**): [`project/rc-22-validation-report.md`](./project/rc-22-validation-report.md)
  - RC-22 Strategy Library Certification (**Ready=YES**): [`project/rc-22-strategy-library-certification.md`](./project/rc-22-strategy-library-certification.md)
  - RC-22 Closure Report (**CLOSED**): [`project/rc-22-closure-report.md`](./project/rc-22-closure-report.md)
  - RC-23 Implementation Plan (**CLOSED**): [`project/rc-23-implementation-plan.md`](./project/rc-23-implementation-plan.md)
  - RC-23 Epic Breakdown: [`project/rc-23-epic-breakdown.md`](./project/rc-23-epic-breakdown.md)
  - RC-23 API Contract (ports): [`project/rc-23-api-contract.md`](./project/rc-23-api-contract.md)
  - RC-23 Runtime Integration Diagram: [`project/rc-23-runtime-integration-diagram.md`](./project/rc-23-runtime-integration-diagram.md)
  - RC-23 Runtime Enforcement Contract: [`project/rc-23-runtime-enforcement-contract.md`](./project/rc-23-runtime-enforcement-contract.md)
  - RC-23 Validation Summary (planning): [`project/rc-23-validation-summary.md`](./project/rc-23-validation-summary.md)
  - RC-23 Architecture Consistency Report: [`project/rc-23-architecture-consistency-report.md`](./project/rc-23-architecture-consistency-report.md)
  - RC-23 Epic 1 Runtime Enforcement Boundary (**approved**): [`project/rc-23-epic1-runtime-enforcement-boundary.md`](./project/rc-23-epic1-runtime-enforcement-boundary.md)
  - RC-23 Epic 1 Boundary Diagram: [`project/rc-23-epic1-boundary-diagram.md`](./project/rc-23-epic1-boundary-diagram.md)
  - RC-23 Epic 2 Strategy Library Read Integration (**approved**): [`project/rc-23-epic2-strategy-library-read-integration.md`](./project/rc-23-epic2-strategy-library-read-integration.md)
  - RC-23 Epic 3 Runtime Validation Gate (**approved**): [`project/rc-23-epic3-runtime-validation-gate.md`](./project/rc-23-epic3-runtime-validation-gate.md)
  - RC-23 Epic 4 Deployment Runtime Binding (**approved**): [`project/rc-23-epic4-deployment-runtime-binding.md`](./project/rc-23-epic4-deployment-runtime-binding.md)
  - RC-23 Epic 5 Trading Session Start Protection (**approved**): [`project/rc-23-epic5-trading-session-start-protection.md`](./project/rc-23-epic5-trading-session-start-protection.md)
  - RC-23 Epic 6 Authority Conformance (**approved**): [`project/rc-23-epic6-authority-conformance.md`](./project/rc-23-epic6-authority-conformance.md)
  - RC-23 Epic 6 Internal Audit Report (**PASS**): [`project/rc-23-epic6-internal-audit-report.md`](./project/rc-23-epic6-internal-audit-report.md)
  - RC-23 Epic 6 Readiness Report: [`project/rc-23-epic6-readiness-report.md`](./project/rc-23-epic6-readiness-report.md)
  - RC-23 Validation Report (**PASS**): [`project/rc-23-validation-report.md`](./project/rc-23-validation-report.md)
  - RC-23 Runtime Enforcement Certification (**CERTIFIED**): [`project/rc-23-runtime-enforcement-certification.md`](./project/rc-23-runtime-enforcement-certification.md)
  - RC-23 Closure Report (**CLOSED**, tag `v1.0.0-rc23`): [`project/rc-23-closure-report.md`](./project/rc-23-closure-report.md)
  - RC-24 Implementation Plan: [`project/rc-24-implementation-plan.md`](./project/rc-24-implementation-plan.md)
  - RC-24 Epic Breakdown: [`project/rc-24-epic-breakdown.md`](./project/rc-24-epic-breakdown.md)
  - RC-24 API Contract (ports): [`project/rc-24-api-contract.md`](./project/rc-24-api-contract.md)
  - RC-24 Reporting Domain Model: [`project/rc-24-reporting-domain-model.md`](./project/rc-24-reporting-domain-model.md)
  - RC-24 Reporting Integration Diagram: [`project/rc-24-reporting-integration-diagram.md`](./project/rc-24-reporting-integration-diagram.md)
  - RC-24 Validation Summary (planning): [`project/rc-24-validation-summary.md`](./project/rc-24-validation-summary.md)
  - RC-24 Architecture Consistency Report: [`project/rc-24-architecture-consistency-report.md`](./project/rc-24-architecture-consistency-report.md)
  - RC-24 Epic 1 Reporting Boundary (**approved**): [`project/rc-24-epic1-reporting-boundary.md`](./project/rc-24-epic1-reporting-boundary.md)
  - RC-24 Epic 1 Boundary Diagram: [`project/rc-24-epic1-boundary-diagram.md`](./project/rc-24-epic1-boundary-diagram.md)
  - RC-24 Epic 2 Knowledge Lake Read Integration (**approved**): [`project/rc-24-epic2-knowledge-lake-read-integration.md`](./project/rc-24-epic2-knowledge-lake-read-integration.md)
  - RC-24 Epic 3 Reporting Domain Model (**approved**): [`project/rc-24-epic3-reporting-domain-model.md`](./project/rc-24-epic3-reporting-domain-model.md)
  - RC-24 Epic 4 Report Generation (**approved**): [`project/rc-24-epic4-report-generation.md`](./project/rc-24-epic4-report-generation.md)
  - RC-24 Epic 5 AI Analytical Narratives (**approved**): [`project/rc-24-epic5-ai-analytical-narratives.md`](./project/rc-24-epic5-ai-analytical-narratives.md)
  - RC-24 Epic 6 Notification Delivery (**approved**): [`project/rc-24-epic6-notification-delivery.md`](./project/rc-24-epic6-notification-delivery.md)
  - RC-24 Notification Delivery Docs Sync: [`project/rc-24-notification-delivery-docs-sync.md`](./project/rc-24-notification-delivery-docs-sync.md)
  - RC-24 Validation Report (**PASS**): [`project/rc-24-validation-report.md`](./project/rc-24-validation-report.md)
  - RC-24 Certification Report: [`project/rc-24-reporting-ai-notification-certification.md`](./project/rc-24-reporting-ai-notification-certification.md)
  - RC-24 Closure Report (**CLOSED** · `v1.0.0-rc24`): [`project/rc-24-closure-report.md`](./project/rc-24-closure-report.md)
  - RC-25 Implementation Plan (**Epic 3** — Market Qualification + Market Profile): [`project/rc-25-implementation-plan.md`](./project/rc-25-implementation-plan.md)
  - RC-25 Epic Breakdown: [`project/rc-25-epic-breakdown.md`](./project/rc-25-epic-breakdown.md)
  - RC-25 API Contract (ports): [`project/rc-25-api-contract.md`](./project/rc-25-api-contract.md)
  - RC-25 Domain Model Contract: [`project/rc-25-domain-model-contract.md`](./project/rc-25-domain-model-contract.md)
  - RC-25 Integration Diagram: [`project/rc-25-integration-diagram.md`](./project/rc-25-integration-diagram.md)
  - RC-25 Validation Summary (planning): [`project/rc-25-validation-summary.md`](./project/rc-25-validation-summary.md)
  - RC-25 Architecture Consistency Report: [`project/rc-25-architecture-consistency-report.md`](./project/rc-25-architecture-consistency-report.md)
  - RC-25 Epic 1 Market Qualification & Profile Boundary (**review**): [`project/rc-25-epic1-market-qualification-profile-boundary.md`](./project/rc-25-epic1-market-qualification-profile-boundary.md)
  - RC-25 Epic 1 Boundary Diagram: [`project/rc-25-epic1-boundary-diagram.md`](./project/rc-25-epic1-boundary-diagram.md)
  - RC-25 Epic 2 Live Market Data & Research Read Integration (**approved**): [`project/rc-25-epic2-live-market-data-research-read-integration.md`](./project/rc-25-epic2-live-market-data-research-read-integration.md)
  - RC-25 Epic 3 Domain Model (**approved**): [`project/rc-25-epic3-domain-model.md`](./project/rc-25-epic3-domain-model.md)
  - RC-25 Epic 4 Qualification Lifecycle Ports (**approved**): [`project/rc-25-epic4-qualification-lifecycle-ports.md`](./project/rc-25-epic4-qualification-lifecycle-ports.md)
  - RC-25 Epic 5 Market Profile Versioning (**approved**): [`project/rc-25-epic5-market-profile-versioning.md`](./project/rc-25-epic5-market-profile-versioning.md)
  - RC-25 Epic 6 Consumer Read & Authority (**approved**): [`project/rc-25-epic6-consumer-read-authority.md`](./project/rc-25-epic6-consumer-read-authority.md)
  - RC-25 Epic 6 Internal Audit (**PASS**): [`project/rc-25-epic6-internal-audit-report.md`](./project/rc-25-epic6-internal-audit-report.md)
  - RC-25 Epic 6 Readiness Report: [`project/rc-25-epic6-readiness-report.md`](./project/rc-25-epic6-readiness-report.md)
  - RC-25 Validation Report (**PASS**): [`project/rc-25-validation-report.md`](./project/rc-25-validation-report.md)
  - RC-25 Certification (**Ready=YES**): [`project/rc-25-market-qualification-profile-certification.md`](./project/rc-25-market-qualification-profile-certification.md)
  - RC-25 Closure Report (**CLOSED**): [`project/rc-25-closure-report.md`](./project/rc-25-closure-report.md)
  - RC-26 Implementation Plan (**CLOSED** — Trading Orchestrator + Market State): [`project/rc-26-implementation-plan.md`](./project/rc-26-implementation-plan.md)
  - RC-26 Epic Breakdown: [`project/rc-26-epic-breakdown.md`](./project/rc-26-epic-breakdown.md)
  - RC-26 API Contract (ports): [`project/rc-26-api-contract.md`](./project/rc-26-api-contract.md)
  - RC-26 Domain Model Contract: [`project/rc-26-domain-model-contract.md`](./project/rc-26-domain-model-contract.md)
  - RC-26 Integration Diagram: [`project/rc-26-integration-diagram.md`](./project/rc-26-integration-diagram.md)
  - RC-26 Validation Summary (planning): [`project/rc-26-validation-summary.md`](./project/rc-26-validation-summary.md)
  - RC-26 Architecture Consistency Report: [`project/rc-26-architecture-consistency-report.md`](./project/rc-26-architecture-consistency-report.md)
  - RC-26 Epic 1 Trading Orchestrator & Market State Boundary (**approved**): [`project/rc-26-epic1-trading-orchestrator-market-state-boundary.md`](./project/rc-26-epic1-trading-orchestrator-market-state-boundary.md)
  - RC-26 Epic 1 Boundary Diagram: [`project/rc-26-epic1-boundary-diagram.md`](./project/rc-26-epic1-boundary-diagram.md)
  - RC-26 Epic 2 Market State Input Integration (**approved**): [`project/rc-26-epic2-market-state-input-integration.md`](./project/rc-26-epic2-market-state-input-integration.md)
  - RC-26 Epic 3 Market State Domain Model (**approved**): [`project/rc-26-epic3-domain-model.md`](./project/rc-26-epic3-domain-model.md)
  - RC-26 Epic 4 Trading Orchestrator Domain Model (**approved**): [`project/rc-26-epic4-trading-orchestrator-domain-model.md`](./project/rc-26-epic4-trading-orchestrator-domain-model.md)
  - RC-26 Epic 5 Trading Orchestrator Workflow Ports (**approved**): [`project/rc-26-epic5-trading-orchestrator-workflow-ports.md`](./project/rc-26-epic5-trading-orchestrator-workflow-ports.md)
  - RC-26 Epic 6 Consumer Read & Authority (**approved**): [`project/rc-26-epic6-consumer-read-authority.md`](./project/rc-26-epic6-consumer-read-authority.md)
  - RC-26 Epic 6 Internal Audit (**PASS**): [`project/rc-26-epic6-internal-audit-report.md`](./project/rc-26-epic6-internal-audit-report.md)
  - RC-26 Epic 6 Readiness Report: [`project/rc-26-epic6-readiness-report.md`](./project/rc-26-epic6-readiness-report.md)
  - RC-26 Validation Report (**PASS**): [`project/rc-26-validation-report.md`](./project/rc-26-validation-report.md)
  - RC-26 Certification (**Ready=YES**): [`project/rc-26-trading-orchestrator-market-state-certification.md`](./project/rc-26-trading-orchestrator-market-state-certification.md)
  - RC-26 Closure Report (**CLOSED**): [`project/rc-26-closure-report.md`](./project/rc-26-closure-report.md)
  - RC-27 Implementation Plan (**CLOSED** — Multi-Exchange Scope): [`project/rc-27-implementation-plan.md`](./project/rc-27-implementation-plan.md)
  - RC-27 Closure Report: [`project/rc-27-closure-report.md`](./project/rc-27-closure-report.md)
  - RC-27 Validation Report (**PASS**): [`project/rc-27-validation-report.md`](./project/rc-27-validation-report.md)
  - RC-27 Module Certification (**Ready=YES**): [`project/rc-27-exchange-scope-certification.md`](./project/rc-27-exchange-scope-certification.md)
  - RC-27 Epic Breakdown: [`project/rc-27-epic-breakdown.md`](./project/rc-27-epic-breakdown.md)
  - RC-27 API Contract (ports): [`project/rc-27-api-contract.md`](./project/rc-27-api-contract.md)
  - RC-27 Domain Model Contract: [`project/rc-27-domain-model-contract.md`](./project/rc-27-domain-model-contract.md)
  - RC-27 Integration Diagram: [`project/rc-27-integration-diagram.md`](./project/rc-27-integration-diagram.md)
  - RC-27 Validation Summary (planning): [`project/rc-27-validation-summary.md`](./project/rc-27-validation-summary.md)
  - RC-27 Architecture Consistency Report: [`project/rc-27-architecture-consistency-report.md`](./project/rc-27-architecture-consistency-report.md)
  - RC-27 Epic 1 Exchange Scope Boundary (**approved**): [`project/rc-27-epic1-exchange-scope-boundary.md`](./project/rc-27-epic1-exchange-scope-boundary.md)
  - RC-27 Epic 1 Boundary Diagram: [`project/rc-27-epic1-boundary-diagram.md`](./project/rc-27-epic1-boundary-diagram.md)
  - RC-27 Epic 2 Domain Model (**approved**): [`project/rc-27-epic2-domain-model.md`](./project/rc-27-epic2-domain-model.md)
  - RC-27 Epic 3 Application Ports (**approved**): [`project/rc-27-epic3-application-ports.md`](./project/rc-27-epic3-application-ports.md)
  - RC-27 Epic 4 Trading Path Scope Integration (**approved**): [`project/rc-27-epic4-trading-path-scope-integration.md`](./project/rc-27-epic4-trading-path-scope-integration.md)
  - RC-27 Epic 5 Consumer Read Ports (**approved**): [`project/rc-27-epic5-consumer-read-ports.md`](./project/rc-27-epic5-consumer-read-ports.md)
  - RC-27 Epic 6 Authority Conformance (**approved**): [`project/rc-27-epic6-authority-conformance.md`](./project/rc-27-epic6-authority-conformance.md)
  - RC-27 Epic 6 Internal Audit (**PASS**): [`project/rc-27-epic6-internal-audit-report.md`](./project/rc-27-epic6-internal-audit-report.md)
  - RC-27 Epic 6 Readiness Report: [`project/rc-27-epic6-readiness-report.md`](./project/rc-27-epic6-readiness-report.md)
  - RC-28 Implementation Plan (**CLOSED** `v2.0.0` — Version 2 Stabilization & Conformance): [`project/rc-28-implementation-plan.md`](./project/rc-28-implementation-plan.md)
  - RC-28 Epic Breakdown: [`project/rc-28-epic-breakdown.md`](./project/rc-28-epic-breakdown.md)
  - RC-28 API Contract (frozen port inventory): [`project/rc-28-api-contract.md`](./project/rc-28-api-contract.md)
  - RC-28 Integration Diagram: [`project/rc-28-integration-diagram.md`](./project/rc-28-integration-diagram.md)
  - RC-28 Validation Summary (planning): [`project/rc-28-validation-summary.md`](./project/rc-28-validation-summary.md)
  - RC-28 Architecture Consistency Report: [`project/rc-28-architecture-consistency-report.md`](./project/rc-28-architecture-consistency-report.md)
  - RC-28 Epic 1 Platform Integration Boundaries (**approved**): [`project/rc-28-epic1-platform-integration-boundaries.md`](./project/rc-28-epic1-platform-integration-boundaries.md)
  - RC-28 Epic 1 Integration Boundary Report: [`project/rc-28-epic1-integration-boundary-report.md`](./project/rc-28-epic1-integration-boundary-report.md)
  - RC-28 Epic 1 Boundary Diagram: [`project/rc-28-epic1-boundary-diagram.md`](./project/rc-28-epic1-boundary-diagram.md)
  - RC-28 Epic 2 Cross-Domain Workflow Verification (**approved**): [`project/rc-28-epic2-cross-domain-workflow-verification.md`](./project/rc-28-epic2-cross-domain-workflow-verification.md)
  - RC-28 Epic 2 Workflow Verification Report: [`project/rc-28-epic2-workflow-verification-report.md`](./project/rc-28-epic2-workflow-verification-report.md)
  - RC-28 Epic 3 Authority & Ownership Verification (**approved**): [`project/rc-28-epic3-authority-ownership-verification.md`](./project/rc-28-epic3-authority-ownership-verification.md)
  - RC-28 Epic 3 Authority Verification Report: [`project/rc-28-epic3-authority-verification-report.md`](./project/rc-28-epic3-authority-verification-report.md)
  - RC-28 Epic 3 Ownership Verification Report: [`project/rc-28-epic3-ownership-verification-report.md`](./project/rc-28-epic3-ownership-verification-report.md)
  - RC-28 Epic 4 End-to-End Scenario Validation (**approved**): [`project/rc-28-epic4-end-to-end-scenario-validation.md`](./project/rc-28-epic4-end-to-end-scenario-validation.md)
  - RC-28 Epic 4 Scenario Validation Report: [`project/rc-28-epic4-scenario-validation-report.md`](./project/rc-28-epic4-scenario-validation-report.md)
  - RC-28 Epic 5 Performance, Resilience & Compatibility (**approved**): [`project/rc-28-epic5-performance-resilience-compatibility.md`](./project/rc-28-epic5-performance-resilience-compatibility.md)
  - RC-28 Epic 5 Compatibility Verification Report: [`project/rc-28-epic5-compatibility-verification-report.md`](./project/rc-28-epic5-compatibility-verification-report.md)
  - RC-28 Epic 5 Performance & Resilience Report: [`project/rc-28-epic5-performance-resilience-report.md`](./project/rc-28-epic5-performance-resilience-report.md)
  - RC-28 Epic 6 Version 2 Certification (**approved**): [`project/rc-28-epic6-version-2-certification.md`](./project/rc-28-epic6-version-2-certification.md)
  - RC-28 Epic 6 Internal Audit (**PASS**): [`project/rc-28-epic6-internal-audit-report.md`](./project/rc-28-epic6-internal-audit-report.md)
  - RC-28 Epic 6 Readiness (**READY** — consumed): [`project/rc-28-epic6-readiness-report.md`](./project/rc-28-epic6-readiness-report.md)
  - RC-28 Validation Report (**PASS**): [`project/rc-28-validation-report.md`](./project/rc-28-validation-report.md)
  - Version 2 Certification (**READY = YES**): [`project/rc-28-version-2-certification.md`](./project/rc-28-version-2-certification.md)
  - RC-28 Closure Report (**CLOSED** `v2.0.0`): [`project/rc-28-closure-report.md`](./project/rc-28-closure-report.md)
  - Version 2 Product Completion Roadmap (**planning CLOSED** — not an RC): [`project/v2-product-completion-program.md`](./project/v2-product-completion-program.md)
  - Version 2 Product Completion Backlog (execution tracker): [`project/v2-product-completion-backlog.md`](./project/v2-product-completion-backlog.md)
  - Canonical Product Journey: [`project/product-completion-journey.md`](./project/product-completion-journey.md)
  - Product Completion Definition of Done: [`project/product-completion-definition-of-done.md`](./project/product-completion-definition-of-done.md)
  - Product UI Policy: [`project/product-ui-policy.md`](./project/product-ui-policy.md)
  - Product Completion Readiness Report (planning freeze): [`project/product-completion-readiness-report.md`](./project/product-completion-readiness-report.md)
  - PC-18 Identity Product (**CLOSED**): [`project/pc-18-implementation-report.md`](./project/pc-18-implementation-report.md)
  - PC-19 Operator Shell Product (**CLOSED**): [`project/pc-19-implementation-report.md`](./project/pc-19-implementation-report.md)
  - PC-14 Workspace Management (**CLOSED**): [`project/pc-14-implementation-report.md`](./project/pc-14-implementation-report.md)
  - PC-01 Strategy Library Product (**CLOSED**): [`project/pc-01-implementation-report.md`](./project/pc-01-implementation-report.md)
  - PC-02 Certification Product (**CLOSED** — review): [`project/pc-02-implementation-report.md`](./project/pc-02-implementation-report.md)
  - PC-13 Command Center Product (**CLOSED** — review): [`project/pc-13-implementation-report.md`](./project/pc-13-implementation-report.md)
  - Architectural changes require a new ADR. Version 3 is not started. No additional Product Completion planning documents.

---

## What TRP is

TRP is not a trading bot, not an AI trader, and not an HFT system.

It is a platform to **research → validate → explain → (optionally) deploy** strategies with evidence.

```
Research creates knowledge.
Knowledge creates confidence.
Confidence enables production.
```

---

## Stages

| Stage              | Focus                                             |
| ------------------ | ------------------------------------------------- |
| **0 — Research**   | OHLCV → Strategy → Backtest → Validation → Report |
| **1 — Production** | Signal → Exchange Adapter → Execution record      |
| **Future**         | See [`future/`](./future/)                        |

---

## MVP

- 1 user · 1 exchange (Binance) · 1 symbol · 1 strategy · 1 timeframe · OpenRouter gateway

Profitability is not required for acceptance. Pipeline integrity is.

---

## Stack (canonical)

pnpm · Turborepo · React/Vite/TS · NestJS/TS · Prisma · PostgreSQL · JWT · OpenRouter · Docker Compose · Vitest/Playwright

BullMQ + Redis only when a real queue is needed.

Full table: [`CANONICAL.md`](./CANONICAL.md)

---

## Principles (short)

- Research before production
- Validation before trust
- Knowledge is the product
- Risk overrides profit
- Human remains responsible
- AI never controls capital
- Everything important is explainable, reproducible, and versioned

Full list: [`00-architecture-principles.md`](./00-architecture-principles.md)

---

## Docs map

| Path                                                                                                 | Role                                          |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [`project/trp-product-vision.md`](./project/trp-product-vision.md)                                   | **Level-0** Product Vision                    |
| [`project/trp-ux-vision.md`](./project/trp-ux-vision.md)                                             | **Level-0** UX Vision                         |
| [`CANONICAL.md`](./CANONICAL.md)                                                                     | **Level-1** engineering source of truth       |
| [`00-architecture-principles.md`](./00-architecture-principles.md)                                   | Immutable principles                          |
| [`01-product-bible.md`](./01-product-bible.md)                                                       | Product intent (slim; cites Level-0)          |
| [`02-architecture.md`](./02-architecture.md)                                                         | Architecture for Stage 0–1                    |
| [`03-development-roadmap.md`](./03-development-roadmap.md)                                           | Stages + Sprint 0                             |
| [`04-cursor-master-prompt.md`](./04-cursor-master-prompt.md)                                         | AI engineering rules                          |
| [`05-uiux-guidelines.md`](./05-uiux-guidelines.md)                                                   | UI/UX patterns (cites Level-0 UX Vision)      |
| [`Architecture/`](./Architecture/)                                                                   | Active subsystem specs                        |
| [`adr/`](./adr/)                                                                                     | Accepted architecture decisions               |
| [`project/rc-16-paper-trading-plan.md`](./project/rc-16-paper-trading-plan.md)                       | RC-16 scope and milestones                    |
| [`project/project-status.md`](./project/project-status.md)                                           | Living project status                         |
| [`project/roadmap.md`](./project/roadmap.md)                                                         | Direction / future roadmap                    |
| [`project/documentation-cleanup-report.md`](./project/documentation-cleanup-report.md)               | Version 2 documentation cleanup (2026-08-16)  |
| [`project/consistency-validation-report.md`](./project/consistency-validation-report.md)             | Cleanup validation (2026-08-16)               |
| [`project/product-completion-status.md`](./project/product-completion-status.md)                     | Canonical Product Completion status           |
| [`project/product-completion-readiness-report.md`](./project/product-completion-readiness-report.md) | Product Completion planning freeze (snapshot) |
| [`project/technical-debt.md`](./project/technical-debt.md)                                           | Canonical technical debt register             |
| [`project/pc-18-implementation-report.md`](./project/pc-18-implementation-report.md)                 | PC-18 Identity Product (Closed)               |
| [`project/pc-19-implementation-report.md`](./project/pc-19-implementation-report.md)                 | PC-19 Operator Shell Product (Closed)         |
| [`project/pc-14-implementation-report.md`](./project/pc-14-implementation-report.md)                 | PC-14 Workspace Management (Closed)           |
| [`project/pc-01-implementation-report.md`](./project/pc-01-implementation-report.md)                 | PC-01 Strategy Library Product (Closed)       |
| [`project/pc-02-implementation-report.md`](./project/pc-02-implementation-report.md)                 | PC-02 Certification Product (Closed)          |
| [`releases/`](./releases/)                                                                           | Certification & release history               |
| [`releases/V1-COMPLETION.md`](./releases/V1-COMPLETION.md)                                           | Version 1 completion report                   |
| [`Implementation/`](./Implementation/)                                                               | Sprint guides                                 |
| [`future/`](./future/)                                                                               | Deferred designs                              |
| [`archive/`](./archive/)                                                                             | Pre-cleanup drafts                            |

---

## Release History

| Version      | Date       | Status          | Notes                          |
| ------------ | ---------- | --------------- | ------------------------------ |
| `v1.0.0`     | 2026-07-20 | Official Stable | Production baseline on `main`  |
| `v1.0.0-rc1` | 2026-07-20 | Historical RC   | Engineering certification PASS |

Evidence: [`releases/RC-1-CERTIFICATION.md`](./releases/RC-1-CERTIFICATION.md),
[`releases/RC-1-RELEASE-NOTES.md`](./releases/RC-1-RELEASE-NOTES.md).

---

## Next

1. Version 2 is **COMPLETE**. Every new capability belongs to Version 3. Status: [canonical status](./project/product-completion-status.md) · [certification](./project/version-2-final-certification.md).
2. Maintain Version 1 on `main` (bugfixes / docs only unless a new ADR is accepted).
3. Keep ADR-012…ADR-018 freeze until a new ADR supersedes it. Do not reopen RC-19…RC-28.

---

## Status

Phase: [Canonical Product Completion Status](./project/product-completion-status.md) — Version 2 Architecture Complete · Version 2 Product Completion COMPLETE · Paper-first Product Operational · Version 2 COMPLETE  
Version: 1.0.0 (stable research OS) · 2.0.0 (architecture) · 2.0.1 (paper-first product CERTIFIED)
