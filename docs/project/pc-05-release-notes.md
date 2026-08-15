# PC-05 Reporting Product — Release Notes

**Package:** PC-05 Reporting Product  
**Date:** 2026-08-15

Reporting is now a customer product. Operators can browse existing ReportRuns, open details, read AI narratives and delivery status, search and filter, and export the existing aggregation projection as JSON.

This is not a new report engine. Research `/reports` is unchanged. Reports remain projections, never ledger Source of Truth. AI remains narrative only. Notification remains delivery only.

---

## Added

- Reporting Home at `/reporting`
- Report history at `/reporting/history`
- Report detail at `/reporting/:reportRunId`
- `GET /v1/report-runs` and `GET /v1/report-definitions` over existing Reporting queries

## Not in this release

- Notification settings (PC-06)
- Telegram connection (PC-07)
- Standalone AI Analytics product (PC-17)
- PDF export
- Live Trading

---

**STOP.** Wait for review before **PC-06 Notification Product**.

---

**End of Release Notes.**
