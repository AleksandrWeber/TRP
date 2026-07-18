-- RC-16 Foundations: durable Workspace ownership for bootstrap/discovery.
CREATE TABLE "workspace_records" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspace_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "workspace_records_owner_user_id_status_idx"
ON "workspace_records"("owner_user_id", "status");
