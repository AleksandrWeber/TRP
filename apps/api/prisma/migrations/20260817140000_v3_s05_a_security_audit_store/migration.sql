-- V3-S05-a: Security Audit owns immutable security history only.
CREATE TABLE "security_audit_records" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_class" TEXT NOT NULL,
    "criticality" TEXT NOT NULL,
    "schema_version" INTEGER NOT NULL,
    "workspace_id" TEXT,
    "actor_id" TEXT,
    "subject_id" TEXT,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "outcome" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "correlation_id" TEXT,
    "source" TEXT NOT NULL,
    "event_fingerprint" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "security_audit_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "security_audit_records_workspace_id_occurred_at_idx"
    ON "security_audit_records"("workspace_id", "occurred_at");
CREATE INDEX "security_audit_records_event_type_occurred_at_idx"
    ON "security_audit_records"("event_type", "occurred_at");
CREATE INDEX "security_audit_records_event_class_occurred_at_idx"
    ON "security_audit_records"("event_class", "occurred_at");
CREATE INDEX "security_audit_records_actor_id_occurred_at_idx"
    ON "security_audit_records"("actor_id", "occurred_at");
