-- RC-18 US292 durable RecoveryState (E17 §4.5 / P0-1).
-- RecoveryPhase progress authority; Session lifecycle remains trading_sessions.status.

CREATE TABLE "session_recovery_states" (
    "session_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "recovery_id" TEXT NOT NULL,
    "recovery_attempt" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "pre_recovery_status" TEXT NOT NULL,
    "resume_intent" TEXT NOT NULL,
    "fencing_token" INTEGER,
    "last_semantic_event_id" TEXT,
    "last_attempted_phase" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "incident_id" TEXT,
    "schema_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "session_recovery_states_pkey" PRIMARY KEY ("session_id")
);

CREATE INDEX "session_recovery_states_workspace_id_phase_idx"
    ON "session_recovery_states"("workspace_id", "phase");

CREATE INDEX "session_recovery_states_workspace_id_recovery_id_idx"
    ON "session_recovery_states"("workspace_id", "recovery_id");
