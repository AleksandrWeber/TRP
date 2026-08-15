# Reporting Product (`reporting-product`)

**PC-05** — HTTP + UI product adapter over existing Reporting queries.

Not a bounded context. Not a Source of Truth. Distinct from research `/v1/reports`.

| Concern                                | Owner                                               |
| -------------------------------------- | --------------------------------------------------- |
| ReportRun / aggregations / definitions | **Reporting** (`ReportingQueryPort`)                |
| Analytical Narrative                   | **AI Analytics** (via PC-15 `getAttachedNarrative`) |
| Delivery records                       | **Notification Delivery** (`listDeliveries`)        |
| HTTP / product views                   | This adapter                                        |
| Operator UI                            | `/reporting`                                        |

Forbidden: new report types, new storage, report generation in this adapter, `deliver()`, Dashboard redesign, AI/Notification redesign.

Domain Reporting port posture remains `rest: false`. This module is transport only.
