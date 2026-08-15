# PC-07 Notification Channels Product — Product Gap

**Package:** PC-07  
**Date:** 2026-08-15  
**Verdict:** Declared PC-07 Notification Channels gap closed. Live reserved transports and production Bot network remain out of this package.

---

## Closed by this package

| Gap                       | Before                                | After                                        |
| ------------------------- | ------------------------------------- | -------------------------------------------- |
| Choose preferred channels | Telegram standalone; others invisible | **Channel cards for the catalog**            |
| Configure Telegram        | `/telegram` product                   | **Telegram channel page** (same operations)  |
| See reserved channels     | Catalog API only                      | **Reserved disclosure pages**                |
| Routing matrix            | Per-type list on settings             | **Types × channels matrix**                  |
| Delivery frequency        | Preference clock on settings          | **Honest frequency panel** (no fake digests) |
| Quiet hours               | Settings page                         | **Also on Channels (global only)**           |
| Send test                 | Telegram settings                     | **Telegram channel only**                    |
| Per-channel history       | Telegram-filtered history             | **All catalog channels**                     |
| Diagnostics               | Telegram diagnostics                  | **Per-channel diagnostics**                  |

---

## Intentionally still open (not PC-07)

| Gap                                                                                    | Owner                                                              |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Production Telegram Bot API / network adapter                                          | Future adapter behind the existing channel port. Not this package. |
| Live Email / Slack / Discord / Teams / Push                                            | Reserved. Not activated.                                           |
| Hourly / weekly digest engine                                                          | Forbidden. No scheduler redesign.                                  |
| Per-channel quiet hours / weekend suppression                                          | Not in domain. Not invented.                                       |
| Extra notification types (Deployment Approved, Session Started, AI Narrative Ready, …) | Not in catalog. Not invented.                                      |
| Latency metrics                                                                        | Not available.                                                     |
| AI Analytics product UI                                                                | PC-17                                                              |
| Exchange Scope product UI                                                              | PC-12 (next after review)                                          |

The in-memory adapter remains the only Telegram transport. That is sufficient for the declared PC-07 customer capability: choose channels, configure the offered channel, route existing types, and inspect history.

---

**End of Product Gap.**
