# RC-19 Epic 1 — Exchange Scope Identity

**Status:** Implemented / Approved  
**Date:** 2026-08-10  
**Nature:** Additive identity layer only

---

## Summary

- Default Binance Exchange Scope identity (`exchange-scope:binance`)
- `exchangeScopeId` on Trading Session and Paper Account
- Minimum Prisma migration with backfill via SQL default
- No policies, routing, multi-exchange, or runtime behavior changes

Detail lives in the [RC-19 Migration Plan](./rc-19-migration-plan.md) (Epic 1 scope) and codebase under `apps/api/src/modules/exchange-scope/`.

---

## Architecture Impact

```text
Architecture Impact

New architectural concepts introduced:
None
(Exchange Scope already existed in Spec v2.0; this epic only persisted identity)

Canonical ownership changed:
None

New runtime:
None

Backward compatibility:
100%

Architecture debt introduced:
None
```
