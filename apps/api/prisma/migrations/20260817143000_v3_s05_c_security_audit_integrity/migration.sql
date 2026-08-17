-- V3-S05-c: Security Audit integrity metadata and append-only enforcement.
-- The non-null additions intentionally fail if pre-integrity records exist:
-- silently manufacturing integrity metadata for old history is not permitted.
ALTER TABLE "security_audit_records"
    ADD COLUMN "integrity_version" INTEGER NOT NULL,
    ADD COLUMN "integrity_hash" TEXT NOT NULL,
    ADD CONSTRAINT "security_audit_records_integrity_version_check"
        CHECK ("integrity_version" = 1),
    ADD CONSTRAINT "security_audit_records_integrity_hash_check"
        CHECK ("integrity_hash" ~ '^[0-9a-f]{64}$');

CREATE FUNCTION prevent_security_audit_record_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'security_audit_records are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER security_audit_records_append_only
BEFORE UPDATE OR DELETE ON "security_audit_records"
FOR EACH ROW
EXECUTE FUNCTION prevent_security_audit_record_mutation();
