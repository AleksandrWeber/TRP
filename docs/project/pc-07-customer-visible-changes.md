# PC-07 Notification Channels Product — Customer-visible Changes

**Package:** PC-07  
**Date:** 2026-08-15

## Can now

- Open **Channels** in the Administration band
- See Telegram, Email, Slack, Discord, Microsoft Teams, and Push as catalog channels
- Enable Telegram and configure connect / verify / test / disconnect
- See reserved-channel required fields without live transport
- Configure routing for existing notification types (enabled, Telegram channel, critical)
- Set global quiet hours, timezone, and daily preference-clock time
- Inspect per-channel delivery history and diagnostics
- Follow Notification settings into Channels

## Still cannot

- Activate Email, Slack, Discord, Teams, or Push
- Save SMTP, webhooks, or device tokens
- Send a test on a reserved channel
- Type a Telegram chat id
- Call Telegram Bot API
- Use hourly/weekly digest scheduling
- Set per-channel quiet hours or weekend suppression
- Invent notification types (Deployment Approved, Session Started, AI Narrative Ready, and similar names are not catalog types)
- Use any channel as a trading control plane
- Trade

## Copy the operator sees

Channel-agnostic product over Notification Delivery. Telegram is the active transport. Email, Slack, Discord, Microsoft Teams, and Push stay reserved. Telegram cannot trade, pause, or kill.

---

**End of Customer-visible Changes.**
