# PC-15 Slice 15-e — End-to-End Flow

**Package:** PC-15 slice 15-e  
**Date:** 2026-08-15

---

## Certified Telegram path (in-memory)

```text
Existing connectTelegram + completeTelegramConnect
  (platform/adapter chat id — never a user form, never Bot API)
  → deliver() (Notification owner, via product-flow)
  → existing routing
  → InMemoryTelegramAdapter.send()
  → DeliveryResult recorded (delivered)
  → ChannelDeliveryView telegramAdapterReached: true
```

## Unconnected path

```text
deliver() without bind
  → skip channel-not-connected
  → adapter not reached
  → reserved catalog unchanged
```

## Reserved channels

```text
Routing includes email / slack / …
  → skip channel-reserved
  → catalog status remains reserved-inactive
  → no Email / Slack / Discord / Teams / Push send
```

## Composed with 15-d

```text
In-memory Telegram bind
  → requestAndDeliver (Reporting → Notification)
  → Telegram adapter receives the report envelope
  → ReportRun JSON unchanged
```

No new screen. No new REST. PC-06 / PC-07 remain the later product surfaces.

---

**End of End-to-End Flow.**
