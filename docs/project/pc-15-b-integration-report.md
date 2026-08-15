# PC-15 Slice 15-b — Integration Report

**Package:** PC-15  
**Slice:** 15-b Qualification → Profile  
**Date:** 2026-08-15  
**Verdict:** Certified product flow is wired. Producer and consumer remain the existing owners.

---

## Flow

```text
Market Qualification
  → Completed Qualification (owner lifecycle)
  → product-flow adapter
  → Market Profile publishProfileVersion()
  → version becomes latest (append-only)
  → consumers observe latest via existing query / consumer ports
```

Qualification history remains immutable. Prior Profile versions remain immutable.

---

## Producer

| Item                                          | Owner                                        |
| --------------------------------------------- | -------------------------------------------- |
| Request / confirm / complete / fail / cancel  | Market Qualification                         |
| Qualification run + state records             | Market Qualification (immutable after write) |
| Caller-supplied confidence / health snapshots | Market Qualification (optional on complete)  |

Qualification does not import Profile. Complete on the Qualification module still does not publish. The certified product path is the product-flow adapter.

---

## Consumer

| Item                          | Owner                                    |
| ----------------------------- | ---------------------------------------- |
| Publish profile version       | Market Profile (`publishProfileVersion`) |
| Latest / by-version / history | Market Profile query port                |
| Consumer projection           | Market Profile consumer read port        |
| Complete → publish wiring     | Product-flow adapter (not a BC)          |

The adapter does not own versions. It does not calculate dimensions. Failed and cancelled Qualification outcomes publish nothing. Requalification is a new run and therefore a new version.

---

## History

| Record                      | After publish         |
| --------------------------- | --------------------- |
| Completed Qualification run | Unchanged (frozen)    |
| Prior Profile versions      | Unchanged (frozen)    |
| Latest Profile              | New monotonic version |

---

## Fail-closed

| Case                                              | Result                                                     |
| ------------------------------------------------- | ---------------------------------------------------------- |
| Run not completed (failed / cancelled / rejected) | No publish                                                 |
| Same completed run retried                        | Same profile id / version (idempotent)                     |
| Missing caller-supplied dimensions                | Profile rejects; Qualification complete is not rolled back |
| Incomplete Qualification                          | Profile already rejects `qualification_run_not_completed`  |

---

**End of Integration Report.**
