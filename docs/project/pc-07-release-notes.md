# PC-07 Notification Channels Product — Release Notes

**Package:** PC-07 Notification Channels Product  
**Date:** 2026-08-15

Notification Channels is now a customer product. Operators can choose preferred channels, configure Telegram, see reserved channels honestly, set routing and global quiet hours, send a Telegram test, and inspect per-channel history and diagnostics.

This is not a new delivery engine, not a Bot API, and not live Email/Slack/Discord/Teams/Push. Notification Delivery remains the delivery owner. Channel adapters remain transports only. Telegram is the only active channel. Telegram cannot trade, pause, or kill.

---

## Added

- Notification Channels at `/notifications/channels`
- Channel configuration at `/notifications/channels/:channelId`
- Channel history at `/notifications/channels/:channelId/history`
- `GET /v1/notification-channels/workspace`, `GET /v1/notification-channels/:channelId`, `GET /v1/notification-channels/:channelId/diagnostics`, `GET /v1/notification-channels/:channelId/deliveries`
- Legacy `/telegram` redirects into the Telegram channel page

## Unchanged in this release

- Telegram operations at `/v1/telegram/*`
- Notification preference REST (PC-06)
- In-memory Telegram adapter

## Not in this release

- Production Telegram Bot API / network adapter
- Live Email / Slack / Discord / Teams / Push
- SMTP / webhook persistence
- Hourly / weekly digest scheduler
- Extra notification types
- Standalone AI Analytics product (PC-17)
- Live Trading

---

**STOP.** Wait for review before **PC-12 Exchange Scope Product**.

---

**End of Release Notes.**
