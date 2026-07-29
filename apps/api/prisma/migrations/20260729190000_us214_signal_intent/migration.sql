-- RC-16 M3 US214 Signal Intent bounded context (Strategy Runtime).
-- Append-only immutable command facts. Not Orders. Unique intent_hash dedupes.

CREATE TABLE "signal_intents" (
    "id" TEXT NOT NULL,
    "intent_version" INTEGER NOT NULL,
    "intent_hash" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "deployment_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "strategy_version" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "market_checkpoint" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "actor_id" TEXT NOT NULL,
    "correlation_id" TEXT,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "signal_intents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "signal_intents_intent_version_check" CHECK ("intent_version" = 1),
    CONSTRAINT "signal_intents_direction_check" CHECK ("direction" IN ('buy', 'sell')),
    CONSTRAINT "signal_intents_confidence_check" CHECK (
        "confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1)
    )
);

CREATE UNIQUE INDEX "signal_intents_workspace_id_intent_hash_key"
    ON "signal_intents"("workspace_id", "intent_hash");

CREATE INDEX "signal_intents_workspace_id_session_id_generated_at_idx"
    ON "signal_intents"("workspace_id", "session_id", "generated_at");

CREATE INDEX "signal_intents_workspace_id_deployment_id_idx"
    ON "signal_intents"("workspace_id", "deployment_id");
