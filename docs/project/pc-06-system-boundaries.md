# PC-06 Notification Product — System Boundaries

**Package:** PC-06  
**Date:** 2026-08-15  
**Verdict:** Boundaries held.

---

## Notification Delivery

Notification Delivery remains the delivery owner. The product adapter lists channels, reads and upserts preferences, evaluates existing routing, and lists recorded deliveries through `NotificationServicePort`. It does not call `deliver()`, `connectTelegram`, or `sendTestNotification`. It does not add skip reasons, channels, or storage.

The Notification Delivery bounded context still does not import Reporting, product-flow, or the product adapter. Domain `rest: false` is unchanged. HTTP lives in sibling `notification-product`.

## Reporting

Reporting remains the report owner. This package does not generate ReportRuns. Reporting may still read `listDeliveries` (PC-05). An additive UI link from Reporting to Notification settings does not move ownership.

## Telegram

Telegram remains transport only. Connection status is read-only. Chat id and connection tokens are never product fields. No Bot API. Connect / test / disconnect remain PC-07.

## Deferred channels

Email, Slack, Discord, Teams, and Push stay `reserved-inactive`. They are listed as not offered. Enabling them in stored preferences still skips with `channel-reserved`.

## Distinct surfaces

RCC `/settings` remains research prefs. Command Center `NotificationCenter` remains RC-20 in-app toasts. RC-24 product paths are `/v1/notification-*` and `/notifications`.

---

**End of System Boundaries.**
