-- TD-042 / ADR-013: durable independent acknowledgement for Outbox fan-out.
CREATE TABLE "outbox_consumer_deliveries" (
    "event_id" TEXT NOT NULL,
    "consumer_id" TEXT NOT NULL,
    "delivered_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "outbox_consumer_deliveries_pkey" PRIMARY KEY ("event_id", "consumer_id"),
    CONSTRAINT "outbox_consumer_deliveries_event_id_fkey"
      FOREIGN KEY ("event_id") REFERENCES "outbox_events"("event_id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "outbox_consumer_deliveries_consumer_id_delivered_at_idx"
ON "outbox_consumer_deliveries"("consumer_id", "delivered_at");
