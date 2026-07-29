-- TD-040 / ADR-015: authoritative per-Position Fill application order.
-- Survives restart/replay and does not depend on Outbox delivery timing.
CREATE TABLE "position_fill_applications" (
    "position_id" TEXT NOT NULL,
    "fill_id" TEXT NOT NULL,
    "application_sequence" INTEGER NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "position_fill_applications_pkey"
      PRIMARY KEY ("position_id", "application_sequence"),
    CONSTRAINT "position_fill_applications_position_id_fkey"
      FOREIGN KEY ("position_id") REFERENCES "paper_positions"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "position_fill_applications_fill_id_fkey"
      FOREIGN KEY ("fill_id") REFERENCES "paper_fills"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "position_fill_applications_fill_id_key"
ON "position_fill_applications"("fill_id");

CREATE INDEX "position_fill_applications_position_id_fill_id_idx"
ON "position_fill_applications"("position_id", "fill_id");

-- Existing history receives one deterministic, persisted order. Runtime
-- accounting assigns all future ordinals under the corresponding Position lock.
INSERT INTO "position_fill_applications" (
  "position_id",
  "fill_id",
  "application_sequence",
  "applied_at"
)
SELECT
  p."id",
  f."id",
  ROW_NUMBER() OVER (
    PARTITION BY p."id"
    ORDER BY f."occurred_at", f."recorded_at", f."id"
  )::INTEGER,
  f."recorded_at"
FROM "paper_fills" f
JOIN "paper_positions" p
  ON p."workspace_id" = f."workspace_id"
 AND p."paper_account_id" = f."paper_account_id"
 AND p."instrument" = f."instrument";
