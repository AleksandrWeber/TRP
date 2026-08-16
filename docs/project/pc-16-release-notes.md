# PC-16 Knowledge Lake Product — Release Notes

**Package:** PC-16 Knowledge Lake Product  
**Date:** 2026-08-16

Knowledge Lake is now a customer product. Operators can browse existing analytical facts, search and filter, open details, inspect provenance and relationships, follow connected reports and references, and export the existing projection as JSON.

This is not a new warehouse. Research `/knowledge` is unchanged. Lake facts remain projections, never ledger Source of Truth. Knowledge Lake remains the only owner of stored knowledge.

---

## Added

- Knowledge Lake Home at `/knowledge-lake`
- Ingestion history at `/knowledge-lake/history`
- Entry detail at `/knowledge-lake/:entryId`
- `GET /v1/knowledge-lake` search, list, relationships, history, provenance, and entry reads over existing Lake queries

## Not in this release

- Knowledge editing, deleting, or manual ingestion
- Standalone AI Analytics product (PC-17)
- Semantic search redesign
- New export formats
- Live Trading

---

**STOP.** Wait for review before **PC-17 AI Analytics Product**.

---

**End of Release Notes.**
