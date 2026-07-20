-- US004 Strategy Domain: workspace-owned strategy definitions (CRUD only).
CREATE TABLE "strategy_records" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "strategy_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "strategy_records_workspace_id_status_idx"
ON "strategy_records"("workspace_id", "status");

CREATE INDEX "strategy_records_workspace_id_created_at_idx"
ON "strategy_records"("workspace_id", "created_at");
