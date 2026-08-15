# PC-06 Notification Product — Release Notes

**Package:** PC-06 Notification Product  
**Date:** 2026-08-15

Notification Delivery is now a customer product. Operators can configure existing preferences (master enable, per-type routing, quiet hours, timezone, daily delivery time), inspect channel status and routing, and read recorded delivery history and skip reasons.

This is not a new delivery engine. Telegram remains transport only. Reporting remains the report owner. Reserved channels stay reserved. There is no scheduler and no retry queue.

---

## Added

- Notification Settings at `/notifications`
- Delivery history at `/notifications/history`
- Delivery detail at `/notifications/:deliveryId`
- `GET /v1/notification-settings`, `GET/PUT /v1/notification-preferences`, `GET /v1/notification-channels`, `GET /v1/notification-routing`, `GET /v1/notification-deliveries`

## Not in this release

- Telegram connection wizard (PC-07)
- Email / Slack / Discord / Teams / Push
- Cron / retry queues
- Standalone AI Analytics product (PC-17)
- Live Trading

---

**STOP.** Wait for review before **PC-07 Telegram Product**.

---

**End of Release Notes.**
