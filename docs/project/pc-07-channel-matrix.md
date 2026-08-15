# PC-07 Notification Channels Product — Channel Matrix

**Package:** PC-07  
**Date:** 2026-08-15  
**Owner:** Notification Delivery remains the only delivery owner. Adapters remain transports only.

| Channel         | Catalog status      | Offered | Operator configuration                                                                | Send Test              | Live transport    |
| --------------- | ------------------- | ------- | ------------------------------------------------------------------------------------- | ---------------------- | ----------------- |
| Telegram        | `active`            | **Yes** | Connect, Verify, Disconnect (existing Telegram operations). Chat id adapter-supplied. | **Yes** when connected | In-memory adapter |
| Email           | `reserved-inactive` | No      | Disclosure only: Provider / SMTP, Sender, Recipient(s). Not collected.                | Hidden                 | None              |
| Slack           | `reserved-inactive` | No      | Disclosure only: Workspace, Webhook, Channel. Not collected.                          | Hidden                 | None              |
| Discord         | `reserved-inactive` | No      | Disclosure only: Webhook, Channel. Not collected.                                     | Hidden                 | None              |
| Microsoft Teams | `reserved-inactive` | No      | Disclosure only: Webhook, Team, Channel. Not collected.                               | Hidden                 | None              |
| Push            | `reserved-inactive` | No      | Disclosure only: Device, Browser. Not collected.                                      | Hidden                 | None              |

Future channels plug into the same catalog. This package does not add a channel, activate a reserved transport, or persist SMTP/webhook secrets.

Enabling Telegram in preferences is the operator’s preferred-channel choice. Reserved channels can appear in stored routing arrays; Notification Delivery still skips them with `channel-reserved`.

---

**End of Channel Matrix.**
