-- V3-S05-d: Incident contains immutable Security Audit event evidence.
CREATE TABLE "security_audit_incidents" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL,
    "opened_by_actor_id" TEXT,
    CONSTRAINT "security_audit_incidents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "security_audit_incident_events" (
    "incident_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "linked_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "security_audit_incident_events_pkey" PRIMARY KEY ("incident_id", "event_id"),
    CONSTRAINT "security_audit_incident_events_incident_id_fkey"
        FOREIGN KEY ("incident_id") REFERENCES "security_audit_incidents"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT "security_audit_incident_events_event_id_fkey"
        FOREIGN KEY ("event_id") REFERENCES "security_audit_records"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE "security_audit_incident_lifecycle" (
    "incident_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "actor_id" TEXT,
    CONSTRAINT "security_audit_incident_lifecycle_pkey" PRIMARY KEY ("incident_id", "occurred_at"),
    CONSTRAINT "security_audit_incident_lifecycle_status_check" CHECK ("status" IN ('open', 'closed')),
    CONSTRAINT "security_audit_incident_lifecycle_incident_id_fkey"
        FOREIGN KEY ("incident_id") REFERENCES "security_audit_incidents"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX "security_audit_incidents_workspace_id_opened_at_idx"
    ON "security_audit_incidents"("workspace_id", "opened_at");
CREATE INDEX "security_audit_incident_events_event_id_idx"
    ON "security_audit_incident_events"("event_id");

CREATE FUNCTION prevent_security_audit_incident_history_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'security audit incident history is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER security_audit_incident_events_append_only
BEFORE UPDATE OR DELETE ON "security_audit_incident_events"
FOR EACH ROW EXECUTE FUNCTION prevent_security_audit_incident_history_mutation();

CREATE TRIGGER security_audit_incident_lifecycle_append_only
BEFORE UPDATE OR DELETE ON "security_audit_incident_lifecycle"
FOR EACH ROW EXECUTE FUNCTION prevent_security_audit_incident_history_mutation();
