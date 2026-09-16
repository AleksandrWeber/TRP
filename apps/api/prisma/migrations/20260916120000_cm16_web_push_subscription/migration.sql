-- CM-16 — Durable Web Push subscription registry on Notification Delivery owner.
-- Endpoints and encryption keys are sensitive. Not an anchor. Not FCM/APNs.

CREATE TABLE "workspace_web_push_subscriptions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider_kind" TEXT NOT NULL DEFAULT 'web-push',
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "user_agent" TEXT,
    "last_error_code" TEXT,
    "last_success_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_web_push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_web_push_subscriptions_workspace_id_user_id_endpoint_key" ON "workspace_web_push_subscriptions"("workspace_id", "user_id", "endpoint");

CREATE INDEX "workspace_web_push_subscriptions_workspace_id_user_id_status_idx" ON "workspace_web_push_subscriptions"("workspace_id", "user_id", "status");
