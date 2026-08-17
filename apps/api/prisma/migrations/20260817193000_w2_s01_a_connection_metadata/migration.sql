CREATE TABLE "connection_records" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "connection_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connection_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "connection_records_workspace_id_created_at_idx"
ON "connection_records"("workspace_id", "created_at");

CREATE INDEX "connection_records_workspace_id_provider_idx"
ON "connection_records"("workspace_id", "provider");
