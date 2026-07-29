-- RC-16 M3 US215 Strategy Runtime checkpoint.
-- Versioned resume progress owned by strategy-runtime. Not Session lease/business state.

CREATE TABLE "strategy_checkpoints" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "deployment_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "last_processed_candle" JSONB NOT NULL,
    "last_processed_event_id" TEXT NOT NULL,
    "runtime_version" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategy_checkpoints_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "strategy_checkpoints_version_check" CHECK ("version" >= 1)
);

CREATE UNIQUE INDEX "strategy_checkpoints_workspace_id_session_id_key"
    ON "strategy_checkpoints"("workspace_id", "session_id");

CREATE INDEX "strategy_checkpoints_workspace_id_deployment_id_idx"
    ON "strategy_checkpoints"("workspace_id", "deployment_id");
