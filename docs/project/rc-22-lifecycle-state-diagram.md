# RC-22 — Strategy Lifecycle State Diagram

**Document:** Strategy Library Lifecycle State Diagram  
**Status:** Authoritative companion to [Lifecycle Policy](./rc-22-epic6-lifecycle-policy.md)  
**Date:** 2026-08-10  
**RC:** RC-22  
**Code:** `apps/api/src/modules/strategy-library/domain/strategy-lifecycle.ts`

---

## States

Certification `status` after Library admission:

| State        | New eligibility? | Terminal? |
| ------------ | ---------------- | --------- |
| `active`     | Yes (if gate OK) | No        |
| `deprecated` | **No**           | No        |
| `archived`   | **No**           | **Yes**   |

---

## Diagram

```text
                    ┌─────────────────────┐
                    │  StrategyVersion    │
                    │  (immutable content)│
                    └──────────┬──────────┘
                               │ certify
                               ▼
                    ┌─────────────────────┐
           ┌───────►│      active         │◄── certification admitted
           │        │  (Certified phase)  │
           │        └──────────┬──────────┘
           │                   │
           │     deprecate     │     archive
           │                   ▼
           │        ┌─────────────────────┐
           │        │     deprecated      │
           │        └──────────┬──────────┘
           │                   │ archive
           │                   ▼
           │        ┌─────────────────────┐
           │        │      archived       │──► no further transitions
           │        └─────────────────────┘
           │
           │  Resurrection is forbidden.
           │  New version + new certification required.
           └──────────────────────────────────────────
```

---

## Transition table

| From       | To         | Allowed | Effect                                                              |
| ---------- | ---------- | ------- | ------------------------------------------------------------------- |
| active     | deprecated | Yes     | New `StrategyLifecycleRecord` + new frozen cert snapshot (`status`) |
| active     | archived   | Yes     | Same                                                                |
| deprecated | archived   | Yes     | Same                                                                |
| archived   | *          | **No**  | Terminal                                                            |
| *          | same       | **No**  | Noop forbidden                                                      |

Each allowed transition:

1. Does **not** mutate the input certification object
2. Does **not** change `contentHash`, evidence, or envelope
3. Blocks **new** eligibility for deprecated/archived
4. Keeps history queryable (`listLifecycleHistoryForCertification`)
5. Never hard-deletes (`strategyLifecycleHardDeleteImplemented() === false`)

---

## Related

- Policy: [`rc-22-epic6-lifecycle-policy.md`](./rc-22-epic6-lifecycle-policy.md)
- Traceability: [`rc-22-epic6-strategy-traceability-report.md`](./rc-22-epic6-strategy-traceability-report.md)
- Certification: [`rc-22-strategy-library-certification.md`](./rc-22-strategy-library-certification.md)
