# PC-15 Slice 15-f — Projection Consumers

**Package:** PC-15 slice 15-f  
**Date:** 2026-08-15

Dashboard and Command Center consume existing owner reads. They do not become owners.

---

## Dashboard (`OperatorDashboardView`)

| Tile                 | Source owner          | Read                                                                                                             |
| -------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| ReportRuns           | Reporting             | `listRuns({ workspaceId })`                                                                                      |
| AI narratives        | AI Analytics via 15-c | `getAttachedNarrative` (does not mutate ReportRun)                                                               |
| Delivery status      | Notification Delivery | `listDeliveries({ workspaceId })`                                                                                |
| Paper Sessions       | Trading Session       | `findByWorkspaceId`                                                                                              |
| Runtime status       | Strategy Runtime      | `getLifecycle` per session                                                                                       |
| Qualification latest | Market Qualification  | `listQualificationRuns` (latest by `createdAt`)                                                                  |
| Profile latest       | Market Profile        | `getLatestProfile` when `qual-tgt:{workspaceId}:{exchangeScopeId}:{marketSymbol}` is parseable; otherwise `null` |

Flags: `authorityClass: 'projection'`, `reportMutated: false`, `commandUiOnly: true`, `newSoT: false`.

This view is in-process composition. It is **not** a new HTTP resource and **not** a new SoT.

---

## Command Center (`GET /v1/trading-sessions/:id`)

| Field                      | Source                                             |
| -------------------------- | -------------------------------------------------- |
| Session lifecycle / health | Existing Bot / Session projection                  |
| Runtime state              | Existing Strategy Runtime consumer read            |
| `sessionHandoff`           | 15-a consume projection                            |
| `latestReport`             | Operator projection filtered by `tradingSessionId` |
| `delivery`                 | Latest recorded delivery for that report run       |

List endpoint is unchanged. Command Center remains command UI.

---

## Home (data only)

| Stat           | Existing API               |
| -------------- | -------------------------- |
| Paper sessions | `GET /v1/trading-sessions` |
| Runtime        | `GET /health`              |

Home does **not** load ReportRuns, narratives, or deliveries (no Reporting REST; Product UI Policy).

---

## Non-consumers

| Surface          | Why                                                            |
| ---------------- | -------------------------------------------------------------- |
| RCC `/dashboard` | Research control center. Not the product ReportRuns dashboard. |
| `/reports`       | Not RC-24 Reporting. Not mounted as product UI.                |

---

**End of Projection Consumers.**
