-- RC-18 US293 minimal durable Recovery Incident (fail-closed safety artifact).
-- RecoveryState may reference Incident via incident_id; Incident does not own RecoveryState.

CREATE TABLE "session_recovery_incidents" (
    "incident_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "recovery_id" TEXT,
    "recovery_attempt" INTEGER,
    "reason_class" TEXT NOT NULL,
    "failure_reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "blocking" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL,
    "schema_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "session_recovery_incidents_pkey" PRIMARY KEY ("incident_id")
);

CREATE INDEX "session_recovery_incidents_workspace_id_session_id_idx"
    ON "session_recovery_incidents"("workspace_id", "session_id");

CREATE INDEX "session_recovery_incidents_session_id_status_idx"
    ON "session_recovery_incidents"("session_id", "status");
