-- W2-S05-c Workspace AI Session Foundation (metadata only).
-- Sessions group request identities. They do not store prompts, responses,
-- conversation, or AI memory.

CREATE TABLE "workspace_ai_sessions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_ai_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspace_ai_session_requests" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_ai_session_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "workspace_ai_sessions_workspace_id_status_created_at_idx"
  ON "workspace_ai_sessions"("workspace_id", "status", "created_at");

CREATE UNIQUE INDEX "workspace_ai_session_requests_workspace_id_request_id_key"
  ON "workspace_ai_session_requests"("workspace_id", "request_id");

CREATE INDEX "workspace_ai_session_requests_session_id_requested_at_idx"
  ON "workspace_ai_session_requests"("session_id", "requested_at");

CREATE INDEX "workspace_ai_session_requests_workspace_id_session_id_idx"
  ON "workspace_ai_session_requests"("workspace_id", "session_id");

ALTER TABLE "workspace_ai_session_requests"
  ADD CONSTRAINT "workspace_ai_session_requests_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "workspace_ai_sessions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
