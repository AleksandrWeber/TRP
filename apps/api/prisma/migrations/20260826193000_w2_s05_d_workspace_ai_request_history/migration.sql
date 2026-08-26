-- W2-S05-d Workspace AI Request History Foundation (read-only metadata).
-- History is an audit-style operational record. It does not store prompts,
-- responses, conversation, or AI memory. It never influences future requests.

CREATE TABLE "workspace_ai_request_history" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "model" TEXT,
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_ai_request_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_ai_request_history_workspace_id_request_id_key"
  ON "workspace_ai_request_history"("workspace_id", "request_id");

CREATE INDEX "workspace_ai_request_history_workspace_id_executed_at_idx"
  ON "workspace_ai_request_history"("workspace_id", "executed_at");

CREATE INDEX "workspace_ai_request_history_workspace_id_session_id_executed_at_idx"
  ON "workspace_ai_request_history"("workspace_id", "session_id", "executed_at");

CREATE INDEX "workspace_ai_request_history_workspace_id_status_executed_at_idx"
  ON "workspace_ai_request_history"("workspace_id", "status", "executed_at");
